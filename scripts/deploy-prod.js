// ============================================
// FlareStack — Production Deployment Script
// ============================================
//
// Usage: pnpm run deploy
//
// Handles on first-run infrastructure creation,
// config file updates, and full deployment in
// one command.
// ============================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ── Terminal Styles ──────────────────────────
const C = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
};

const ICON = {
    success: '✔',
    error: '✖',
    warn: '⚠',
    info: 'ℹ',
    step: '›',
    arrow: '→',
};

function header(title) {
    const border = '─'.repeat(44);
    console.log(`\n${C.bold}${C.blue}┌${border}┐${C.reset}`);
    console.log(`${C.bold}${C.blue}│  ${title.padEnd(44)}│${C.reset}`);
    console.log(`${C.bold}${C.blue}└${border}┘${C.reset}\n`);
}

function step(msg) { console.log(`${C.cyan}${ICON.step} ${msg}...${C.reset}`); }
function success(msg) { console.log(`${C.green}${ICON.success} ${msg}${C.reset}`); }
function warn(msg) { console.log(`${C.yellow}${ICON.warn} ${msg}${C.reset}`); }
function error(msg) { console.log(`${C.red}${ICON.error} ${msg}${C.reset}`); }
function info(msg) { console.log(`${C.dim}${ICON.info} ${msg}${C.reset}`); }
function kv(key, val) { console.log(`   ${ICON.arrow} ${C.bold}${key}:${C.reset} ${val}`); }
function divider() { console.log(`${C.dim}${'─'.repeat(44)}${C.reset}`); }

// ── Shell Helper ─────────────────────────────
function run(command, options = {}) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit' });
    } catch (err) {
        if (options.ignoreError) return null;
        error(`Command failed: ${command}`);
        process.exit(1);
    }
}

// ── Deploy ───────────────────────────────────
async function deploy() {
    header('FlareStack  Production Deployment');

    // ── 1. Auth Check ────────────────────────
    step('Checking Cloudflare authentication');
    const whoami = run('npx wrangler whoami', { silent: true, ignoreError: true });
    if (!whoami || whoami.includes('Not logged in') || whoami.includes('not authenticated')) {
        warn('Not logged into Cloudflare — opening login page');
        run('npx wrangler login', { silent: false });
    } else {
        success('Authenticated with Cloudflare');
    }

    console.log('');

    // ── 2. D1 Database ───────────────────────
    step('Configuring D1 Database');
    let dbId = '';
    try {
        const d1List = run('npx wrangler d1 list --json', { silent: true });
        const d1s = JSON.parse(d1List);
        const existing = d1s.find(d => d.name === 'flarestack-db');

        if (existing) {
            dbId = existing.uuid;
            success(`Found existing D1: flarestack-db`);
            kv('ID', dbId);
        } else {
            info('Creating new D1 database: flarestack-db');
            const created = run('npx wrangler d1 create flarestack-db', { silent: true });

            // Extract database_id from config snippet in stdout
            const match = created.match(/"database_id":\s*"([^"]+)"/);
            if (match) {
                dbId = match[1];
                success(`D1 database created`);
                kv('ID', dbId);
            } else {
                throw new Error("Could not parse D1 create output");
            }
        }
    } catch (e) {
        error('Failed to find or create D1 database');
        process.exit(1);
    }

    console.log('');

    // ── 3. KV Namespace ──────────────────────
    step('Configuring KV Namespace');
    let kvId = '';
    try {
        const kvList = run('npx wrangler kv namespace list', { silent: true });
        const kvs = JSON.parse(kvList);
        const existing = kvs.find(k =>
            k.title === 'flarestack-worker-BLOCKLIST' || k.title === 'BLOCKLIST'
        );

        if (existing) {
            kvId = existing.id;
            success(`Found existing KV: ${existing.title}`);
            kv('ID', kvId);
        } else {
            info('Creating new KV namespace: BLOCKLIST');
            const created = run('npx wrangler kv namespace create BLOCKLIST', { silent: true });

            // Extract id from config snippet in stdout
            const match = created.match(/"id":\s*"([^"]+)"/);
            if (match) {
                kvId = match[1];
                success('KV namespace created');
                kv('ID', kvId);
            } else {
                throw new Error("Could not parse KV create output");
            }
        }
    } catch (e) {
        error('Failed to find or create KV namespace');
        process.exit(1);
    }

    console.log('');

    // ── 4. Update Config Files ───────────────
    step('Updating wrangler config files with production IDs');

    const dashboardConfPath = path.join(__dirname, '../apps/dashboard/wrangler.jsonc');
    let dashboardConf = fs.readFileSync(dashboardConfPath, 'utf8');
    dashboardConf = dashboardConf.replace(/"database_id":\s*"[^"]*"/, `"database_id": "${dbId}"`);
    fs.writeFileSync(dashboardConfPath, dashboardConf);
    success('apps/dashboard/wrangler.jsonc updated');

    const workerConfPath = path.join(__dirname, '../apps/worker/wrangler.jsonc');
    let workerConf = fs.readFileSync(workerConfPath, 'utf8');
    workerConf = workerConf.replace(/"database_id":\s*"[^"]*"/, `"database_id": "${dbId}"`);
    workerConf = workerConf.replace(/"id":\s*"[^"]*"/, `"id": "${kvId}"`);
    fs.writeFileSync(workerConfPath, workerConf);
    success('apps/worker/wrangler.jsonc updated');

    console.log('');

    // ── 5. Deploy ────────────────────────────
    step('Applying DB migrations to production');
    run('npx wrangler d1 migrations apply flarestack-db --remote --config apps/dashboard/wrangler.jsonc');
    success('Migrations applied');

    console.log('');

    step('Deploying Worker');
    run('pnpm --filter @flarestack/worker run deploy');
    success('Worker deployed');

    console.log('');

    step('Deploying Dashboard');
    const deployOutput = run('pnpm --filter dashboard run deploy', { silent: true });
    console.log(deployOutput); // show the output to the user
    success('Dashboard deployed');

    // ── 6. Sync Cloudflare Secrets ───────────
    step('Syncing Cloudflare production secrets from .prod.vars');

    const prodVarsPath = path.join(__dirname, '../apps/dashboard/.prod.vars');
    let prodVars = '';
    try {
        prodVars = fs.readFileSync(prodVarsPath, 'utf8');
    } catch {
        warn('.prod.vars not found — skipping secret sync. Create apps/dashboard/.prod.vars to automate this.');
    }

    const parseVar = (content, key) => {
        const match = content.match(new RegExp(`${key}="([^"]+)"`));
        return match ? match[1] : '';
    };

    const pushSecret = (key, value) => {
        if (!value) return false;
        run(
            `printf '%s' "${value}" | npx wrangler secret put ${key} --config apps/dashboard/wrangler.jsonc`,
            { silent: true, ignoreError: true }
        );
        return true;
    };

    if (prodVars) {
        const authSecret = parseVar(prodVars, 'BETTER_AUTH_SECRET');
        const baseUrl = parseVar(prodVars, 'BETTER_AUTH_BASE_URL');
        const gmailUser = parseVar(prodVars, 'GMAIL_USER');
        const gmailPass = parseVar(prodVars, 'GMAIL_APP_PASSWORD');

        if (!authSecret) warn('BETTER_AUTH_SECRET is empty in .prod.vars — auth will fail in production!');
        if (!baseUrl) warn('BETTER_AUTH_BASE_URL is empty in .prod.vars — auth will fail in production!');

        pushSecret('BETTER_AUTH_SECRET', authSecret) && info('BETTER_AUTH_SECRET pushed');
        pushSecret('BETTER_AUTH_BASE_URL', baseUrl) && info('BETTER_AUTH_BASE_URL pushed');

        if (gmailUser && gmailPass) {
            pushSecret('GMAIL_USER', gmailUser) && info('GMAIL_USER pushed');
            pushSecret('GMAIL_APP_PASSWORD', gmailPass) && info('GMAIL_APP_PASSWORD pushed');
            success('All secrets synced (email verification enabled)');
        } else {
            success('Core secrets synced (Gmail not configured — accounts will auto-activate)');
        }
    }

    // ── Done ─────────────────────────────────
    console.log('');
    divider();
    console.log(`${C.bold}${C.green}✨ Deployment complete!${C.reset}`);
    console.log('');
    kv('D1 Database ID ', dbId);
    kv('KV Namespace ID', kvId);
    if (prodUrl !== '<YOUR_PRODUCTION_URL>') {
        kv('Production URL ', prodUrl);
    }
    divider();
    console.log('');
}

deploy();
