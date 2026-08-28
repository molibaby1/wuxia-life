#!/usr/bin/env bash
# Safe single-process git helper for Ralph / agent loops.
# Avoids parallel git status/diff/log storms in Cursor.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

usage() {
  cat >&2 <<'EOF'
Usage:
  scripts/agent-git-commit.sh ensure-branch <branchName>
  scripts/agent-git-commit.sh inspect
  scripts/agent-git-commit.sh plan
  scripts/agent-git-commit.sh commit <message> <path> [path...]
  scripts/agent-git-commit.sh commit-all <message>
EOF
  exit 2
}

cmd="${1:-}"
[[ -n "$cmd" ]] || usage
shift || true

case "$cmd" in
  ensure-branch)
    branch="${1:-}"
    [[ -n "$branch" ]] || usage
    current="$(git branch --show-current 2>/dev/null || true)"
    if [[ "$current" == "$branch" ]]; then
      echo "already on $branch"
      git status --short
      exit 0
    fi
    if git show-ref --verify --quiet "refs/heads/$branch"; then
      git switch "$branch"
    else
      git switch -c "$branch"
    fi
    git status --short
    ;;
  inspect)
    echo "### branch"
    git branch --show-current
    echo "### status"
    git status --short
    echo "### log"
    git log -8 --oneline
    ;;
  plan)
    echo "### branch"
    git branch --show-current
    echo "### status"
    git status --short
    echo "### diff --stat"
    git diff --stat
    echo "### staged --stat"
    git diff --cached --stat
    echo "### untracked"
    git ls-files --others --exclude-standard
    ;;
  commit)
    message="${1:-}"
    shift || true
    [[ -n "$message" ]] || usage
    [[ "$#" -ge 1 ]] || usage
    git add -- "$@"
    if git diff --cached --quiet; then
      echo "nothing to commit for paths: $*"
      exit 0
    fi
    git commit -m "$message"
    git status --short
    ;;
  commit-all)
    message="${1:-}"
    [[ -n "$message" ]] || usage
    git add -A
    if git diff --cached --quiet; then
      echo "nothing to commit"
      exit 0
    fi
    git commit -m "$message"
    git status --short
    ;;
  *)
    usage
    ;;
esac
