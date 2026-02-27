#!/bin/bash
# ============================================
# FlareFilter — Local Setup Script
# ============================================
#
# Usage: pnpm run setup
#
# Automates the full local dev bootstrap:
#   1. Install dependencies
#   2. Generate & apply DB migrations
#   3. Create local auth secrets
# ============================================

set -e
set -o pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/utils.sh"

log_header "FlareFilter  Local Setup"

# ── 1. Install Dependencies ─────────────────
log_step "${ICON_PACKAGE} Installing dependencies"
pnpm install
log_success "Dependencies installed"

echo ""

# ── 2. Database ─────────────────────────────
log_step "${ICON_DB} Generating DB schema & applying local migrations"
pnpm --filter @flarefilter/db generate
npx wrangler d1 migrations apply flarefilter-db \
  --local \
  --config apps/dashboard/wrangler.jsonc \
  --persist-to .wrangler/state
log_success "Database ready"

echo ""

# ── 3. Local Secrets ────────────────────────
log_step "${ICON_LOCK} Creating local auth secrets"
if [ ! -f apps/dashboard/.dev.vars ]; then
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
  log_success "apps/dashboard/.dev.vars created"
else
  log_warn "apps/dashboard/.dev.vars already exists — skipping"
fi

echo ""
log_divider
echo -e "${BOLD}${GREEN}${ICON_DONE} Local setup complete!${NC}"
echo ""
log_kv "Start dev" "pnpm dev"
log_link "Dashboard      → http://localhost:5173"
log_link "Worker (cron)  → http://localhost:8787/__scheduled"
log_info "Cron does not tick automatically locally — press 't' or visit /__scheduled to trigger it."
log_divider
echo ""
