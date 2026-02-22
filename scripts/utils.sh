#!/bin/bash

# ============================================
# FlareFilter Script Utilities (Colors & Icons)
# Sourced by setup-local.sh, nuke.sh, etc.
# ============================================

# ANSI Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Icons
ICON_SUCCESS="✔"
ICON_ERROR="✖"
ICON_WARN="⚠"
ICON_INFO="ℹ"
ICON_STEP="›"
ICON_ARROW="→"
ICON_ROCKET="🚀"
ICON_NUKE="💥"
ICON_DB="🗄"
ICON_LOCK="🔐"
ICON_PACKAGE="📦"
ICON_CLEAN="🧹"
ICON_DONE="✨"
ICON_LINK="🔗"

# ── Helpers ─────────────────────────────────

log_header() {
  local title="$1"
  local width=44
  local border=$(printf '─%.0s' $(seq 1 $width))
  echo -e "\n${BOLD}${BLUE}┌${border}┐${NC}"
  printf "${BOLD}${BLUE}│  %-${width}s│${NC}\n" "$title"
  echo -e "${BOLD}${BLUE}└${border}┘${NC}\n"
}

log_step() {
  echo -e "${CYAN}${ICON_STEP} $1...${NC}"
}

log_success() {
  echo -e "${GREEN}${ICON_SUCCESS} $1${NC}"
}

log_error() {
  echo -e "${RED}${ICON_ERROR} $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}${ICON_WARN} $1${NC}"
}

log_info() {
  echo -e "${DIM}${ICON_INFO} $1${NC}"
}

log_kv() {
  local key="$1"
  local value="$2"
  echo -e "   ${ICON_ARROW} ${BOLD}${key}:${NC} ${value}"
}

log_link() {
  echo -e "   ${ICON_LINK} ${CYAN}$1${NC}"
}

log_divider() {
  echo -e "${DIM}────────────────────────────────────────────${NC}"
}
