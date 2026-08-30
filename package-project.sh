#!/usr/bin/env bash
set -euo pipefail

OUTPUT="project.zip"

# 删除旧压缩包，避免旧文件残留在新的 ZIP 中
rm -f "$OUTPUT"

# 使用 find 列出文件，排除指定目录，再通过 zip -@ 打包
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
    -path '*/.tmp' \
  \) -prune -o \
  -type f \
  -not -name '.DS_Store' \
  -not -name 'project.zip' \
  -not \( \( -name '.env' -o -name '.env.*' \) -a -not -name '*.example' \) \
  -print \
  | zip -@ "$OUTPUT"

echo "已生成: $(pwd)/$OUTPUT ($(du -h "$OUTPUT" | awk '{print $1}'))"
