#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
if [[ -f .env.p6b ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.p6b
  set +a
fi
exec "$@"
