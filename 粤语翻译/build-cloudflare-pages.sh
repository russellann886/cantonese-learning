#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
DIST_DIR="${SCRIPT_DIR}/dist"

mkdir -p "${DIST_DIR}"

cp "${SCRIPT_DIR}/index.html" "${DIST_DIR}/index.html"
cp "${SCRIPT_DIR}/_routes.json" "${DIST_DIR}/_routes.json"
touch "${DIST_DIR}/.nojekyll"
