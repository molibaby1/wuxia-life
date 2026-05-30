#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { eventLoader } from '../src/core/EventLoader';
import type { EventChoice, EventDefinition } from '../src/types/eventTypes';
import { isBannedVagueFeedback } from '../src/data/golden-line-feedback-patterns';
import goldenLineSpine from '../src/data/golden-line-spine.json';

interface FeedbackIssue {
  eventId: string;
  choiceId: string;
  reason: string;
}

function loadSpineManualChoiceIds(): Set<string> {
  return new Set(goldenLineSpine.manualChoiceEventIds);
}

function choiceHasExplicitFeedback(choice: EventChoice): boolean {
  if (choice.outcomes?.some((outcome) => typeof outcome.text === 'string' && outcome.text.trim().length > 0)) {
    return true;
  }
  if (typeof choice.description === 'string' && choice.description.trim().length > 0) {
    return true;
  }
  if (typeof choice.text === 'string' && choice.text.trim().length > 0 && !isBannedVagueFeedback(choice.text)) {
    return true;
  }
  return false;
}

function scanGoldenLineFeedback(): FeedbackIssue[] {
  const targetIds = loadSpineManualChoiceIds();
  const issues: FeedbackIssue[] = [];

  for (const event of eventLoader.getAllEvents()) {
    if (!targetIds.has(event.id) || event.eventType !== 'choice' || !event.choices?.length) {
      continue;
    }

    for (const choice of event.choices) {
      const choiceId = choice.id ?? choice.text ?? 'unknown_choice';
      if (!choiceHasExplicitFeedback(choice)) {
        issues.push({
          eventId: event.id,
          choiceId,
          reason: 'missing_player_facing_narrative',
        });
        continue;
      }

      const preview =
        choice.outcomes?.find((o) => o.text)?.text ??
        choice.description ??
        choice.text ??
        '';
      if (isBannedVagueFeedback(preview)) {
        issues.push({
          eventId: event.id,
          choiceId,
          reason: 'banned_vague_pattern',
        });
      }
    }
  }

  return issues;
}

function buildMarkdownReport(issues: FeedbackIssue[]): string {
  const lines = [
    '# Product Experience Governance — Golden Line Feedback Scan',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `扫描范围：${goldenLineSpine.manualChoiceEventIds.length} manual choice spine events`,
    '',
    `结果：**${issues.length === 0 ? 'PASS' : 'FAIL'}**（${issues.length} issue(s)）`,
    '',
  ];

  if (issues.length === 0) {
    lines.push('所有 active golden-line manual choice 均具备明确玩家可见反馈。');
  } else {
    lines.push('| Event ID | Choice ID | Reason |', '| --- | --- | --- |');
    for (const issue of issues) {
      lines.push(`| ${issue.eventId} | ${issue.choiceId} | ${issue.reason} |`);
    }
  }

  lines.push('', 'Regenerate: `npm run report:golden-line-feedback`');
  return lines.join('\n');
}

function main(): void {
  const issues = scanGoldenLineFeedback();
  const reportDir = resolve('docs/test-reports');
  mkdirSync(reportDir, { recursive: true });
  const reportPath = join(reportDir, 'product-experience-governance-golden-line-feedback-scan.md');
  writeFileSync(reportPath, `${buildMarkdownReport(issues)}\n`, 'utf8');

  console.log(`Wrote ${reportPath}`);
  console.log(`Golden-line feedback scan: ${issues.length === 0 ? 'PASS' : 'FAIL'} (${issues.length} issues)`);

  if (issues.length > 0) {
    for (const issue of issues) {
      console.error(`  ${issue.eventId} / ${issue.choiceId}: ${issue.reason}`);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanGoldenLineFeedback, choiceHasExplicitFeedback };
