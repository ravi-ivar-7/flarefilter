# FlareStack Setup & Deployment Guide

Welcome to FlareStack! Follow this guide to get your IP reputation and automated blocking system running locally and in production.

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
pnpm --filter @flarestack/db generate
npx wrangler d1 migrations apply flarestack-db --local --config apps/dashboard/wrangler.jsonc --persist-to .wrangler/state

# 3. Create Local Secrets
cat <<EOF > apps/dashboard/.dev.vars
BETTER_AUTH_BASE_URL="http://localhost:5173"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"

# Optional: fill in to enable email verification via Gmail.
# Leave blank → accounts auto-activate (no email needed).
# Get an App Password: https://myaccount.google.com/apppasswords
GMAIL_USER=""
GMAIL_APP_PASSWORD=""
EOF

# 4. Start Development Server
pnpm dev
```

### 🎯 Next Steps (Local)
1. Open `http://localhost:5173/auth` to **Sign Up** for your local user.
2. **Email verification** is optional locally. Fill `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.dev.vars` to enable it — otherwise accounts activate instantly.
3. Connect a Cloudflare account and add your zones.
4. **Test the Worker**: While `pnpm dev` is running, press **'t'** in the terminal to force a cron event, or visit `http://localhost:8787/__scheduled`.

> ⚠️ **Local cron does not tick automatically.** Unlike production (where Cloudflare fires the cron every minute on its own), the local Miniflare runtime does **not** run the scheduler clock — it just sits idle. You must manually trigger each cron execution using **'t'** or the `/__scheduled` URL.

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
npx wrangler d1 create flarestack-db
npx wrangler kv namespace create BLOCKLIST

# 2. Configuration (Manual Link)
# Copy IDs from step 1 into:
# - apps/dashboard/wrangler.jsonc (database_id)
# - apps/worker/wrangler.jsonc (database_id & KV id)

# 3. Deploy
npx wrangler d1 migrations apply flarestack-db --remote --config apps/dashboard/wrangler.jsonc
pnpm --filter @flarestack/worker deploy
pnpm --filter @flarestack/dashboard deploy

# 4. Fill in production secrets
# Copy the template and fill in your values:
cp apps/dashboard/.prod.vars.example apps/dashboard/.prod.vars
# Then edit apps/dashboard/.prod.vars with your real values.
# `pnpm run deploy` will read from this file and push to Cloudflare automatically.
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
pnpm --filter @flarestack/db generate

# Apply to Local DB
npx wrangler d1 migrations apply flarestack-db --local --config apps/dashboard/wrangler.jsonc --persist-to .wrangler/state

# Apply to Production DB
npx wrangler d1 migrations apply flarestack-db --remote --config apps/dashboard/wrangler.jsonc
```
