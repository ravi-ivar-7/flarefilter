const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * FlareFilter Automatic Production Deployment Script
 * Handles D1/KV creation, config updates, and deployment in one go.
 */

function run(command, options = {}) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: options.silent ? 'pipe' : 'inherit' });
    } catch (error) {
        if (options.ignoreError) return null;
        console.error(`❌ Command failed: ${command}`);
        process.exit(1);
    }
}

async function deploy() {
    console.log("🚀 Starting FlareFilter Production Deployment...");

    // 1. Check Wrangler Login
    console.log("\n🔍 Checking Cloudflare authentication...");
    const whoami = run('npx wrangler whoami', { silent: true, ignoreError: true });
    if (!whoami || whoami.includes("Not logged in")) {
        console.log("⚠️ You are not logged into Cloudflare. Opening login page...");
        run('npx wrangler login');
    } else {
        console.log("✅ Authenticated with Cloudflare.");
    }

    // 2. Setup D1 Database
    console.log("\n🗄️ Configuring D1 Database...");
    let dbId = "";
    try {
        const d1List = run('npx wrangler d1 list --format json', { silent: true });
        const d1s = JSON.parse(d1List);
        const existingDb = d1s.find(d => d.name === 'flarefilter-db');

        if (existingDb) {
            dbId = existingDb.uuid;
            console.log(`✅ Found existing D1: flarefilter-db (${dbId})`);
        } else {
            console.log("🔨 Creating new D1 database: flarefilter-db...");
            const createOut = run('npx wrangler d1 create flarefilter-db --format json', { silent: true });
            const created = JSON.parse(createOut);
            dbId = created.uuid || created[0]?.uuid;
            console.log(`✅ Created D1: ${dbId}`);
        }
    } catch (e) {
        console.error("❌ Failed to find or create D1 database.");
        process.exit(1);
    }

    // 3. Setup KV Namespace
    console.log("\n📦 Configuring KV Namespace...");
    let kvId = "";
    try {
        const kvList = run('npx wrangler kv namespace list --format json', { silent: true });
        const kvs = JSON.parse(kvList);
        const existingKv = kvs.find(k => k.title === 'flarefilter-worker-BLOCKLIST' || k.title === 'BLOCKLIST');

        if (existingKv) {
            kvId = existingKv.id;
            console.log(`✅ Found existing KV: ${existingKv.title} (${kvId})`);
        } else {
            console.log("🔨 Creating new KV namespace: BLOCKLIST...");
            const createOut = run('npx wrangler kv namespace create BLOCKLIST --format json', { silent: true });
            // Some versions of wrangler return an array, some a single object
            const created = JSON.parse(createOut);
            kvId = created.id || created[0]?.id;
            console.log(`✅ Created KV: ${kvId}`);
        }
    } catch (e) {
        console.error("❌ Failed to find or create KV namespace.");
        process.exit(1);
    }

    // 4. Update Configuration Files
    console.log("\n📝 Updating configuration files with production IDs...");

    // Update apps/dashboard/wrangler.jsonc
    const dashboardConfPath = path.join(__dirname, '../apps/dashboard/wrangler.jsonc');
    let dashboardConf = fs.readFileSync(dashboardConfPath, 'utf8');
    dashboardConf = dashboardConf.replace(/"database_id":\s*"[^"]*"/, `"database_id": "${dbId}"`);
    fs.writeFileSync(dashboardConfPath, dashboardConf);
    console.log("✅ Updated apps/dashboard/wrangler.jsonc");

    // Update apps/worker/wrangler.toml
    const workerConfPath = path.join(__dirname, '../apps/worker/wrangler.toml');
    let workerConf = fs.readFileSync(workerConfPath, 'utf8');
    workerConf = workerConf.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${dbId}"`);
    workerConf = workerConf.replace(/id\s*=\s*"[^"]*"(\s*#?\s*KV id)/, `id = "${kvId}"$1`);
    // Also handle simple id match for BLOCKLIST
    if (!workerConf.includes(`id = "${kvId}"`)) {
        workerConf = workerConf.replace(/\[\[kv_namespaces\]\][^]*?id\s*=\s*"[^"]*"/, (match) => {
            return match.replace(/id\s*=\s*"[^"]*"/, `id = "${kvId}"`);
        });
    }
    fs.writeFileSync(workerConfPath, workerConf);
    console.log("✅ Updated apps/worker/wrangler.toml");

    // 5. Final Deploy
    console.log("\n🚀 Launching to Cloudflare...");

    console.log("⚡ Applying database migrations to production...");
    run('npx wrangler d1 migrations apply flarefilter-db --remote --config apps/dashboard/wrangler.jsonc');

    console.log("🛰️ Deploying Worker...");
    run('pnpm --filter @flarefilter/worker deploy');

    console.log("🖥️ Deploying Dashboard...");
    run('pnpm --filter @flarefilter/dashboard deploy');

    console.log("\n🎉 DEPLOYMENT COMPLETE!");
    console.log("-----------------------------------------");
    console.log(`D1 Database ID: ${dbId}`);
    console.log(`KV Namespace ID: ${kvId}`);
    console.log("-----------------------------------------");
}

deploy();
