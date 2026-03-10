# FlareStack Setup & Deployment Guide

Welcome to FlareStack! Follow this guide to get your IP reputation and automated blocking system running locally and in production.

---

## 📦 1. Initial Setup
Before running locally or deploying to production, you must initialize the repository.

```bash
# Step 1: Initialize the project (Run this FIRST)
pnpm run setup

# ------------- TROUBLESHOOTING ------------- #
# If your local environment breaks or you need to start over:
# pnpm run nuke
```

### ⚠️ A Note on Environment Variables
Running `pnpm run setup` creates an **`apps/dashboard/.dev.vars`** file for you with random secrets. 

**Wait!** Before you continue:
1. Open `apps/dashboard/.dev.vars`.
2. (Optional) Paste your `RESEND_API_KEY` to enable email verification.
3. If left blank, accounts will auto-activate (useful for quick local testing).

---

## 💻 2. Local Development
After completing the initial setup, you can boot the local environment to test features safely.

### 🚀 Quick Start
> 💡 **Tip:** Make sure you've filled in your `apps/dashboard/.dev.vars` if you want to test email! (See Section 1).

```bash
# Start all development servers
pnpm dev
```

### 🛠️ The "Manual Setup" (If you didn't use pnpm run setup)
```bash
# 1. Install dependencies
pnpm install

# 2. Setup Local Database
pnpm --filter @flarestack/db generate
npx wrangler d1 migrations apply flarestack-db --local --config apps/dashboard/wrangler.jsonc --persist-to .wrangler/state

# 3. Environment Variables (Local Secrets)
cat <<EOF > apps/dashboard/.dev.vars
BETTER_AUTH_BASE_URL="http://localhost:5173"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"

# Optional: fill in to enable email verification via Resend (https://resend.com).
# Leave blank → accounts auto-activate (no email needed).
RESEND_API_KEY=""
# Optional: custom from address (must be from a Resend-verified domain).
# Leave blank to use Resend's test sender (onboarding@resend.dev)
RESEND_FROM=""
EOF

# 4. Start Development Server
pnpm dev
```

### 🎯 Next Steps (Local)
1. Open `http://localhost:5173/auth` to **Sign Up** for your local user.
2. **Email verification** is optional locally. Fill `RESEND_API_KEY` to enable it — otherwise accounts activate instantly.
3. Connect a Cloudflare account and add your zones.
4. **Test the Worker**: While `pnpm dev` is running, press **'t'** in the terminal to force a cron event, or visit `http://localhost:8787/__scheduled`.

> ⚠️ **Local cron does not tick automatically.** Unlike production (where Cloudflare fires the cron every minute on its own), the local Miniflare runtime does **not** run the scheduler clock — it just sits idle. You must manually trigger each cron execution using **'t'** or the `/__scheduled` URL.

---

## 🌐 3. Production Deployment
Launch your system to the Cloudflare edge.

> ⚠️ **IMPORTANT:** You must have run `pnpm run setup` locally at least once before deploying, as this installs dependencies and generates the database client.

1. Copy the template: `cp apps/dashboard/.prod.vars.example apps/dashboard/.prod.vars`
2. Open **`apps/dashboard/.prod.vars`** and fill in your values.

> 💡 **Tip (The Chicken & Egg Problem):** If you don't know your production URL yet, leave `BETTER_AUTH_BASE_URL` as the default. Run the deployment (Step 2) once. The command will print your **Pages URL** at the end. Copy that URL back into `.prod.vars` and run the deploy again to sync it!

### 🚀 Step 2: Deploy everything
Once your variables are set, run:
```bash
pnpm run deploy
```

### 🛠️ The "Manual way" (Step-by-Step)
```bash
# 1. Infrastructure Creation
npx wrangler login
npx wrangler d1 create flarestack-db

# 2. Configuration (Manual Link)
# Copy the database_id from step 1 into:
# - apps/dashboard/wrangler.jsonc
# - apps/worker/wrangler.jsonc

# 3. Deploy
npx wrangler d1 migrations apply flarestack-db --remote --config apps/dashboard/wrangler.jsonc
pnpm --filter @flarestack/worker deploy
pnpm --filter @flarestack/dashboard deploy

# 4. Production Environment Variables
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
