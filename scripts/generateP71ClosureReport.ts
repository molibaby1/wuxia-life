import fs from 'node:fs';
import path from 'node:path';
import { executeActiveActionOnState } from '../src/core/activePlanning/ActivePlanningService';
import { buildP71ClosureReport } from '../src/core/activePlanning/p7ReportFields';
import { markDisturbanceNarrativeShown } from '../src/core/activePlanning/disturbanceNarrativeBuilder';
import { GameTestFramework } from '../tests/GameTestFramework';
import type { GameState } from '../src/types/eventTypes';

const framework = new GameTestFramework();

function createState(): GameState {
  return (framework as unknown as { createTestState(): GameState }).createTestState();
}

function main(): void {
  const state = createState();
  const plain = executeActiveActionOnState(state, 'action_training_basic', {
    random: () => 0.5,
    includeDisturbance: false,
  });
  const disturbed = executeActiveActionOnState(state, 'action_socializing_basic', {
    random: () => 0,
    includeDisturbance: true,
  });
  if (disturbed?.disturbanceNarrative) {
    markDisturbanceNarrativeShown(state, disturbed.disturbanceNarrative.disturbanceId);
  }

  const report = buildP71ClosureReport(state);
  const outputDir = path.join(process.cwd(), 'docs', 'test-reports');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, 'p7-1-closure-report.md');

  const lines = [
    '# P7.1 Active Action Experience Closure Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Active action summary',
    '',
    `- Sample action: ${plain?.activeActionSummary.actionName ?? 'n/a'}`,
    `- Duration label: ${plain?.activeActionSummary.durationLabel ?? 'n/a'}`,
    `- Source label: ${plain?.activeActionSummary.sourceLabel ?? 'n/a'}`,
    '',
    '## Disturbance narrative',
    '',
    `- Resolved disturbances: ${report.disturbanceVisibility.resolvedDisturbanceCount}`,
    `- Player-visible narratives: ${report.disturbanceVisibility.playerVisibleDisturbanceCount}`,
    `- Visibility mismatch: ${report.disturbanceVisibility.disturbanceVisibilityMismatch}`,
    disturbed?.disturbanceNarrative
      ? `- Sample title: ${disturbed.disturbanceNarrative.title}`
      : '- Sample title: n/a',
    '',
    '## API mode boundary',
    '',
    '- Server-backed active planning is **not** implemented in P7.1.',
    '- Local Web shows structured summary + disturbance cards; API mode shows boundary notice only.',
    '',
    '## Deferred content',
    '',
    '- 39 deferred event files remain **out of scope** (not batch-wired in P7.1).',
    '',
    '## Validation commands',
    '',
    '```bash',
    'npm run typecheck',
    'npm run build',
    'npm test',
    'npm run gate:p5',
    'npm run gate:experience',
    'npm run gate:golden-line',
    '```',
    '',
    'Record gate results in delivery notes after each full regression run.',
    '',
    '## Residual risks',
    '',
    ...report.residualRisks.map(r => `- ${r}`),
    '',
    '## Recommendations',
    '',
    ...report.recommendations.map(r => `- ${r}`),
    '',
  ];

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');
  console.log(`Wrote ${outputPath}`);
}

main();
