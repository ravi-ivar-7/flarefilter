#!/bin/bash

# FlareFilter Nuke & Reset Script
# Use this when you want to clear EVERYTHING and start fresh.

echo "🚨 WARNING: This will delete your local database, auth secrets, and all node_modules!"
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo "🧹 Cleaning up..."

# 1. Remove local state and databases
echo "🗑️ Removing .wrangler folders (databases & state)..."
rm -rf .wrangler
rm -rf apps/dashboard/.wrangler
rm -rf apps/worker/.wrangler

# 2. Remove local dev secrets
echo "🗑️ Removing local .dev.vars..."
rm -f apps/dashboard/.dev.vars

# 3. Remove all dependencies
echo "🗑️ Removing node_modules..."
rm -rf node_modules
rm -rf apps/dashboard/node_modules
rm -rf apps/worker/node_modules
rm -rf packages/db/node_modules
rm -rf packages/types/node_modules

# 4. Remove build artifacts
echo "🗑️ Removing build artifacts and logs..."
rm -rf apps/dashboard/build
rm -rf apps/dashboard/.react-router
rm -rf apps/worker/dist

echo "✨ System nuked. Now run 'pnpm run setup' to start from a perfectly clean slate."
