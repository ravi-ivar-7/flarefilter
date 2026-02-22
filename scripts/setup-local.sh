#!/bin/bash

# FlareFilter Local Setup Script
# This script automates the entire local development environment initialization.

set -e # Exit on error

echo "🚀 Starting FlareFilter Local Setup..."

# 1. Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# 2. Setup Database
echo "🗄️ Generating database schema & applying local migrations..."
pnpm --filter @flarefilter/db generate
npx wrangler d1 migrations apply flarefilter-db --local --config apps/dashboard/wrangler.jsonc --persist-to .wrangler/state

# 3. Create Secrets
echo "🔐 Creating local secrets for authentication..."
if [ ! -f apps/dashboard/.dev.vars ]; then
  cat <<EOF > apps/dashboard/.dev.vars
BETTER_AUTH_BASE_URL="http://localhost:5173"
BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
EOF
  echo "✅ apps/dashboard/.dev.vars created."
else
  echo "ℹ️ apps/dashboard/.dev.vars already exists. Skipping."
fi

echo "✨ Local setup complete! You can now run 'pnpm dev' to start the system."
echo "🔗 Dashboard: http://localhost:5173"
echo "🔗 Worker Cron Test: http://localhost:8787/__scheduled"
