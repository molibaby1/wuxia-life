#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const repoRoot = process.cwd();
const p4MarkdownFiles = [
  'docs/p4-architecture-readiness.md',
  'docs/p4-non-runtime-behavior-guardrails.md',
  'docs/test-reports/p4-closure-report.md',
  'docs/test-reports/p4-engine-boundary-baseline.md',
  'docs/test-reports/p4-event-catalog-validation-report.md',
  'docs/PRD/p4-engine-contract-and-service-boundary.md',
];

const markdownLinkPattern = /\[[^\]]*]\(([^)]+)\)/g;
const broken: Array<{ source: string; target: string }> = [];

for (const relativeFile of p4MarkdownFiles) {
  const absFile = resolve(repoRoot, relativeFile);
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
  console.error('Broken relative links found in P4 markdown files:');
  for (const entry of broken) {
    console.error(`- ${entry.source} -> ${entry.target}`);
  }
  process.exit(1);
}

console.log('P4 markdown link check passed: 0 broken relative links.');
