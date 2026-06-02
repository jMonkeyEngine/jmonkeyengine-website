#!/usr/bin/env bash

set -euo pipefail
set -x

if [ -f ".local-env" ]; then
    set -a
    # shellcheck disable=SC1091
    . ./.local-env
    set +a
fi

if [ "${HUGO_BIN:-}" = "" ]; then
    if [ -x "./hugo" ]; then
        HUGO_BIN="./hugo"
    else
        HUGO_BIN="$(command -v hugo)"
    fi
fi

# Regenerate dynamic homepage community data before the Hugo build.
if [ "${SKIP_COMMUNITY_DATA:-}" != "1" ]; then
    python3 scripts/fetch-home-community-data.py
fi

# Fetch the current month's WIP screenshot thread from the forum.
if [ "${SKIP_MONTHLY_WIP:-}" != "1" ]; then
    python3 scripts/fetch-monthly-wip-data.py
fi

if [ "${SKIP_SHOWCASE_MASHUP:-}" != "1" ]; then
    SHOWCASE_MASHUP_MAX_IMAGES="${SHOWCASE_MASHUP_MAX_IMAGES:-30}"
    python3 scripts/generate-showcase-mashup-gif.py --max-width 1600 --max-images "$SHOWCASE_MASHUP_MAX_IMAGES"
fi

if [ "${DONT_COMPILE_LESS:-}" = "" ]; then
    lessc static/css/style.less static/css/style.css
fi

if [ "${1:-}" = "server" ]; then
    "$HUGO_BIN" "$@" --bind 0.0.0.0
else
    "$HUGO_BIN" "$@"
fi
