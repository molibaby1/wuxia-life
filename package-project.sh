#!/usr/bin/env bash
set -euo pipefail

OUTPUT="project.zip"

snapshot_dir=""
archive_check_dir=""
explicit_capsules=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --include-capsule)
      if [[ $# -lt 2 ]]; then
        echo "打包失败：--include-capsule 需要 session id" >&2
        exit 1
      fi
      explicit_capsules+=("$2")
      shift 2
      ;;
    *)
      echo "打包失败：未知参数 $1" >&2
      exit 1
      ;;
  esac
done

cleanup() {
  if [[ -n "$snapshot_dir" ]]; then
    rm -rf -- "$snapshot_dir"
  fi
  if [[ -n "$archive_check_dir" ]]; then
    rm -rf -- "$archive_check_dir"
  fi
}
trap cleanup EXIT

branch="$(git branch --show-current)"
head="$(git rev-parse HEAD)"
git_status_short="$(git status --short)"
if [[ -z "$branch" ]]; then
  echo "无法打包：当前 HEAD 不在分支上" >&2
  exit 1
fi

if [[ -z "$git_status_short" ]]; then
  snapshot_status="clean"
else
  snapshot_status="dirty"
fi

snapshot_dir="$(mktemp -d "${TMPDIR:-/tmp}/wuxia-life-repository-status.XXXXXX")"
snapshot_file="$snapshot_dir/repository-status.txt"
evidence_selection_file="$snapshot_dir/evidence-paths.txt"
{
  printf '%s\n' \
    'format=wuxia-life-repository-snapshot-v1' \
    "branch=$branch" \
    "head=$head" \
    "status=$snapshot_status" \
    "packaged_at_utc=$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  if [[ "$snapshot_status" == "dirty" ]]; then
    printf '%s\n' 'git_status_short_begin'
    printf '%s\n' "$git_status_short"
    printf '%s\n' 'git_status_short_end'
  fi
} > "$snapshot_file"

# 删除旧压缩包，避免旧文件残留在新的 ZIP 中
rm -f "$OUTPUT"

evidence_prepare_args=(
  npm exec -- tsx scripts/evolution/evidence/prepareEvidencePackage.ts
  --repository-root "$PWD"
  --selection-file "$evidence_selection_file"
)
if ((${#explicit_capsules[@]} > 0)); then
  for capsule_id in "${explicit_capsules[@]}"; do
    evidence_prepare_args+=(--include-capsule "$capsule_id")
  done
fi
"${evidence_prepare_args[@]}"

# 使用 find 列出文件，排除指定目录，再通过 zip -@ 打包。
# workspace 只保留紧凑的 .agent-workspace-manifest.json provenance 文件。
# 目标：给 ChatGPT 分析项目用的精简源码包（不含 agent 工作区 / 密钥）
find . \( \
    -path '*/node_modules' -o \
    -path '*/.git' -o \
    -path '*/.worktrees' -o \
    -path '*/dist' -o \
    -path '*/.omx' -o \
    -path '*/.trae' -o \
    -path '*/.superpowers' -o \
    -path '*/agent_docs' -o \
    -path '*/.wuxia_saves' -o \
    -path '*/.vscode' -o \
    -path '*/.idea' -o \
    -path '*/public/reports' -o \
    -path '*/.tmp' -o \
    -path './artifacts/evolution/run-evidence' -o \
    -path '*/inputs' -o \
    -path '*/agent-workspaces' \
  \) -prune -o \
  -type f \
  -not -name '.DS_Store' \
  -not -name 'project.zip' \
  -not -name 'repository-status.txt' \
  -not \( -path '*/workspaces/*' -a -not -name '.agent-workspace-manifest.json' \) \
  -not \( \( -name '.env' -o -name '.env.*' \) -a -not -name '*.example' \) \
  -print \
  | zip -@ "$OUTPUT"

# Durable Evidence Capsules are selected and validated as whole artifacts by
# prepareEvidencePackage.ts. Add only those paths after the generic source pass
# so generic exclusions cannot prune a selected Capsule's internal paths.
zip -q "$OUTPUT" -@ < "$evidence_selection_file"

# Add exactly one fresh snapshot at the archive root, after excluding all
# repository-provided repository-status.txt files from the find phase.
zip -q -j "$OUTPUT" "$snapshot_file"

if [[ ! -f "$OUTPUT" ]]; then
  echo "打包失败：未生成 $OUTPUT" >&2
  exit 1
fi

status_entry_count="$(unzip -Z1 "$OUTPUT" | awk '$0 == "repository-status.txt" { count += 1 } END { print count + 0 }')"
if [[ "$status_entry_count" != "1" ]]; then
  echo "打包失败：ZIP 内 repository-status.txt 数量为 ${status_entry_count}，不是 1" >&2
  exit 1
fi

for forbidden_segment in workspaces inputs agent-workspaces; do
  if unzip -Z1 "$OUTPUT" | awk -v segment="$forbidden_segment" '
    $0 ~ ("(^|/)" segment "(/|$)") &&
    index($0, "artifacts/evolution/run-evidence/") != 1 &&
    $0 !~ /\/\.agent-workspace-manifest\.json$/ { found = 1 }
    END { exit (found ? 0 : 1) }
  '; then
    echo "打包失败：ZIP 内包含不应打包的目录 ${forbidden_segment}" >&2
    exit 1
  fi
done

archive_check_dir="$(mktemp -d "${TMPDIR:-/tmp}/wuxia-life-project-zip-check.XXXXXX")"
embedded_snapshot="$archive_check_dir/repository-status.txt"
unzip -q "$OUTPUT" -d "$archive_check_dir"
npm exec -- tsx scripts/evolution/evidence/verifyPackagedEvidence.ts --repository-root "$archive_check_dir"

read_snapshot_value() {
  local key="$1"
  awk -F= -v key="$key" '
    $1 == key {
      print substr($0, length(key) + 2)
      found = 1
      exit
    }
    END { if (!found) exit 1 }
  ' "$embedded_snapshot"
}

embedded_format="$(read_snapshot_value format)"
embedded_branch="$(read_snapshot_value branch)"
embedded_head="$(read_snapshot_value head)"
embedded_status="$(read_snapshot_value status)"
packaged_at_utc="$(read_snapshot_value packaged_at_utc)"

if [[ "$embedded_format" != "wuxia-life-repository-snapshot-v1" ||
  "$embedded_branch" != "$branch" ||
  "$embedded_head" != "$head" ||
  ! "$embedded_status" =~ ^(clean|dirty)$ ||
  ! "$packaged_at_utc" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$ ]]; then
  echo "打包失败：embedded repository snapshot identity 校验失败" >&2
  exit 1
fi

if [[ "$embedded_status" == "clean" ]]; then
  if [[ -n "$git_status_short" ]] || grep -Fqx 'git_status_short_begin' "$embedded_snapshot" || grep -Fqx 'git_status_short_end' "$embedded_snapshot"; then
    echo "打包失败：embedded clean status 与当前 git status 不一致" >&2
    exit 1
  fi
else
  begin_count="$(awk '$0 == "git_status_short_begin" { count += 1 } END { print count + 0 }' "$embedded_snapshot")"
  end_count="$(awk '$0 == "git_status_short_end" { count += 1 } END { print count + 0 }' "$embedded_snapshot")"
  embedded_git_status="$(awk '
    $0 == "git_status_short_begin" { capture = 1; next }
    $0 == "git_status_short_end" { capture = 0; next }
    capture { print }
  ' "$embedded_snapshot")"
  if [[ "$begin_count" != "1" || "$end_count" != "1" || "$embedded_git_status" != "$git_status_short" ]]; then
    echo "打包失败：embedded dirty status 与当前 git status 不一致" >&2
    exit 1
  fi
fi

archive_size="$(du -h "$OUTPUT" | awk '{print $1}')"
echo "branch=$branch"
echo "head=$head"
echo "status=$embedded_status"
echo "archive_size=$archive_size"
echo "已生成: $(pwd)/$OUTPUT"
