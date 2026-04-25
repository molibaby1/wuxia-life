#!/usr/bin/env bash
# 使用 Cursor CLI 的 agent 非交互模式（--print --trust --force）按 Ralph 技能循环执行 PRD 中尚未完成的故事。
# 依赖：已安装 `cursor` 与 `jq`，且已配置 `CURSOR_API_KEY`（或 cursor agent 所需认证）。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PRD_JSON="${1:-$ROOT/docs/PRD/project-quality-gate-hardening-plan-v4.prd.json}"
RALPH_SKILL="${RALPH_SKILL:-$HOME/.cursor/skills/ralph-run/SKILL.md}"

if ! command -v cursor >/dev/null 2>&1; then
  echo "error: cursor CLI not found in PATH" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq not found (required to pick next story)" >&2
  exit 1
fi
if [[ ! -f "$PRD_JSON" ]]; then
  echo "error: PRD JSON not found: $PRD_JSON" >&2
  exit 1
fi

while true; do
  remaining="$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_JSON")"
  if [[ "$remaining" == "0" ]]; then
    echo "<promise>COMPLETE</promise>"
    exit 0
  fi

  story_json="$(jq -c '[.userStories[] | select(.passes == false)] | sort_by(.priority) | .[0]' "$PRD_JSON")"
  story_id="$(jq -r '.id' <<<"$story_json")"
  story_title="$(jq -r '.title' <<<"$story_json")"

  prompt="$(cat <<EOF
Follow the Ralph autonomous loop described in: file://$RALPH_SKILL
Workspace root: $ROOT
PRD file (update passes and append progress here only): $PRD_JSON

Pick exactly ONE user story and implement it completely:
$story_json

Rules:
- One story per iteration; commit message: feat: [$story_id] - $story_title
- Run project checks (at least: npm run typecheck; include npm test when the story touches runtime/tests).
- Set this story's passes to true in the PRD JSON above; append progress.txt per the skill.
- Do not bundle multiple stories in one commit.
EOF
)"

  echo "=== Ralph → cursor agent: $story_id ($story_title) ==="
  cursor agent --print --trust --force --workspace "$ROOT" "$prompt"
done
