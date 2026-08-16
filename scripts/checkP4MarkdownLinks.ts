#!/usr/bin/env tsx

/**
 * Legacy P4 markdown link checker.
 * P4 PRD / test-report markdown were removed from docs/; this script now verifies a
 * small set of still-tracked contract docs for relative link integrity.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const repoRoot = process.cwd();
const markdownFiles = [
  'docs/contracts/game-state-snapshot-contract.md',
  'docs/contracts/choice-execution-request-contract.md',
  'docs/contracts/choice-execution-response-contract.md',
];

const markdownLinkPattern = /\[[^\]]*]\(([^)]+)\)/g;
const broken: Array<{ source: string; target: string }> = [];

for (const relativeFile of markdownFiles) {
  const absFile = resolve(repoRoot, relativeFile);
  if (!existsSync(absFile)) {
    broken.push({ source: relativeFile, target: '(missing source file)' });
    continue;
  }
  const content = readFileSync(absFile, 'utf8');
  const sourceDir = dirname(absFile);

  let match: RegExpExecArray | null;
  while ((match = markdownLinkPattern.exec(content)) !== null) {
    const rawTarget = match[1].trim();
    if (!rawTarget || rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
      continue;
    }
    if (rawTarget.startsWith('#')) {
      continue;
    }
    if (!rawTarget.startsWith('./') && !rawTarget.startsWith('../')) {
      continue;
    }

    const cleanTarget = rawTarget.split('#')[0].split('?')[0];
    const absTarget = resolve(sourceDir, cleanTarget);
    if (!existsSync(absTarget)) {
      broken.push({ source: relativeFile, target: rawTarget });
    }
  }
}

if (broken.length > 0) {
  console.error('Broken markdown links:');
  for (const item of broken) {
    console.error(`- ${item.source} -> ${item.target}`);
  }
  process.exit(1);
}

console.log(`Checked ${markdownFiles.length} markdown files; no broken relative links.`);
