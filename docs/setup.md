# FlareFilter Setup & Deployment Guide

Welcome to FlareFilter! Follow this guide to get your IP reputation and automated blocking system running locally and in production.

---

## 💻 1. Local Development
Initialize your local environment to build and test features safely.

### 🚀 The "Fast way" (Automated)
```bash
# Initialize everything
pnpm run setup

# Clean reset (Wipe everything and start fresh)
pnpm run nuke
```

### 🛠️ The "Manual way" (Step-by-Step)
```bash
# 1. Install dependencies
pnpm install

# 2. Setup Local Database
pnpm --filter @flarefilter/db generate
npx wrangler d1 migrations apply flarefilter-db --local --config apps/dashboard/wrangler.jsonc

# 3. Create Local Secrets
cat <<EOF > apps/dashboard/.dev.vars
BETTER_AUTH_BASE_URL="http://localhost:5173"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
EOF

# 4. Start Development Server
pnpm dev
```

### 🎯 Next Steps (Local)
1. Open `http://localhost:5173/auth` to **Sign Up** for your local user.
2. Create an **Organization** & Connect a Cloudflare account.
3. **Test the Worker**: While `pnpm dev` is running, press **'t'** in the terminal to force a cron event, or visit `http://localhost:8787/__scheduled`.

---

## 🌐 2. Production Deployment
Launch your system to the Cloudflare edge.

### 🚀 The "Fast way" (Automated)
```bash
pnpm run deploy
```

### 🛠️ The "Manual way" (Step-by-Step)
```bash
# 1. Infrastructure Creation
npx wrangler login
npx wrangler d1 create flarefilter-db
npx wrangler kv namespace create BLOCKLIST

# 2. Configuration (Manual Link)
# Copy IDs from step 1 into:
# - apps/dashboard/wrangler.jsonc (database_id)
# - apps/worker/wrangler.toml (database_id & KV id)

# 3. Deploy
npx wrangler d1 migrations apply flarefilter-db --remote --config apps/dashboard/wrangler.jsonc
pnpm --filter @flarefilter/worker deploy
pnpm --filter @flarefilter/dashboard deploy
```

### 🛰️ Next Steps (Production)
1. Visit your **Pages URL** (provided at the end of the deployment script).
2. Sign up and configure your production organization and zones.
3. Your worker will now run automatically on Cloudflare every minute!

---

## 🔄 3. Database Modeler Workflow
Run these commands whenever you modify `packages/db/src/schema/`.

```bash
# Generate new SQL migration files
pnpm --filter @flarefilter/db generate

# Apply to Local DB
npx wrangler d1 migrations apply flarefilter-db --local --config apps/dashboard/wrangler.jsonc

# Apply to Production DB
npx wrangler d1 migrations apply flarefilter-db --remote --config apps/dashboard/wrangler.jsonc
```
