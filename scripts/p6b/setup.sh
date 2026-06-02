#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [[ ! -f .env.p6b ]]; then
  echo "Missing .env.p6b — run: cp .env.p6b.example .env.p6b"
  exit 1
fi
set -a
# shellcheck disable=SC1091
source .env.p6b
set +a
npm run p6b:migrate
npm run p6b:seed-catalog
echo "P6B database ready."
