// ============================================
// FlareFilter — Production Deployment Script
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
    header('FlareFilter  Production Deployment');

    // ── 1. Auth Check ────────────────────────
    step('Checking Cloudflare authentication');
    const whoami = run('npx wrangler whoami', { silent: true, ignoreError: true });
    if (!whoami || whoami.includes('Not logged in')) {
        warn('Not logged into Cloudflare — opening login page');
        run('npx wrangler login');
    } else {
        success('Authenticated with Cloudflare');
    }

    console.log('');

    // ── 2. D1 Database ───────────────────────
    step('Configuring D1 Database');
    let dbId = '';
    try {
        const d1List = run('npx wrangler d1 list --format json', { silent: true });
        const d1s = JSON.parse(d1List);
        const existing = d1s.find(d => d.name === 'flarefilter-db');

        if (existing) {
            dbId = existing.uuid;
            success(`Found existing D1: flarefilter-db`);
            kv('ID', dbId);
        } else {
            info('Creating new D1 database: flarefilter-db');
            const created = JSON.parse(
                run('npx wrangler d1 create flarefilter-db --format json', { silent: true })
            );
            dbId = created.uuid || created[0]?.uuid;
            success(`D1 database created`);
            kv('ID', dbId);
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
        const kvList = run('npx wrangler kv namespace list --format json', { silent: true });
        const kvs = JSON.parse(kvList);
        const existing = kvs.find(k =>
            k.title === 'flarefilter-worker-BLOCKLIST' || k.title === 'BLOCKLIST'
        );

        if (existing) {
            kvId = existing.id;
            success(`Found existing KV: ${existing.title}`);
            kv('ID', kvId);
        } else {
            info('Creating new KV namespace: BLOCKLIST');
            const created = JSON.parse(
                run('npx wrangler kv namespace create BLOCKLIST --format json', { silent: true })
            );
            kvId = created.id || created[0]?.id;
            success('KV namespace created');
            kv('ID', kvId);
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

    const workerConfPath = path.join(__dirname, '../apps/worker/wrangler.toml');
    let workerConf = fs.readFileSync(workerConfPath, 'utf8');
    workerConf = workerConf.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${dbId}"`);
    workerConf = workerConf.replace(/id\s*=\s*"[^"]*"(\s*#?\s*KV id)/, `id = "${kvId}"$1`);
    if (!workerConf.includes(`id = "${kvId}"`)) {
        workerConf = workerConf.replace(/\[\[kv_namespaces\]\][^]*?id\s*=\s*"[^"]*"/, (match) =>
            match.replace(/id\s*=\s*"[^"]*"/, `id = "${kvId}"`)
        );
    }
    fs.writeFileSync(workerConfPath, workerConf);
    success('apps/worker/wrangler.toml updated');

    console.log('');

    // ── 5. Deploy ────────────────────────────
    step('Applying DB migrations to production');
    run('npx wrangler d1 migrations apply flarefilter-db --remote --config apps/dashboard/wrangler.jsonc');
    success('Migrations applied');

    console.log('');

    step('Deploying Worker');
    run('pnpm --filter @flarefilter/worker deploy');
    success('Worker deployed');

    console.log('');

    step('Deploying Dashboard');
    run('pnpm --filter @flarefilter/dashboard deploy');
    success('Dashboard deployed');

    // ── Done ─────────────────────────────────
    console.log('');
    divider();
    console.log(`${C.bold}${C.green}✨ Deployment complete!${C.reset}`);
    console.log('');
    kv('D1 Database ID ', dbId);
    kv('KV Namespace ID', kvId);
    divider();
    console.log('');
}

deploy();
