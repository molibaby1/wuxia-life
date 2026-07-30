#!/usr/bin/env tsx

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildAllP3EvalSegmentReports,
  type P3EvalSegmentReport,
  type SimulationSegmentMetrics,
} from './goldenLineSegmentMetrics';
import {
  P3_EVAL_END_AGE,
  P3_EVAL_SAMPLES,
  runAllP3EvalSimulations,
} from './goldenLineSimulation';

function formatSegmentRow(metrics: SimulationSegmentMetrics): string {
  const payoff = metrics.payoffStatus;
  return [
    `events=${metrics.eventCount}`,
    `choices=${metrics.choiceCount}`,
    `payoff=${(payoff.simulatedPayoffRate * 100).toFixed(0)}%`,
    `alive=${metrics.deathStatus.isAliveAtSegmentEnd}`,
  ].join(', ');
}

function formatMarkdownReport(reports: P3EvalSegmentReport[]): string {
  const lines = [
    '# P3 Midlife — Deterministic Simulation Segments (US-017)',
    '',
    `生成时间：${new Date().toISOString()}`,
    '',
    `终点年龄：**${P3_EVAL_END_AGE}**；评估队列：${P3_EVAL_SAMPLES.map(s => s.id).join(', ')}`,
    '',
    '## 分段指标说明',
    '',
    '| 分段 | 年龄 | 必填字段 |',
    '| --- | --- | --- |',
    '| Youth | 0–30 | event/choice 计数、route flags、simulated payoff |',
    '| Midlife | 31–50 | 同上 + relationship state、death status、payoff status |',
    '',
    '## 样本汇总',
    '',
    '| Sample | Route | Final age | Alive | Youth | Midlife |',
    '| --- | --- | ---: | --- | --- | --- |',
  ];

  for (const report of reports) {
    lines.push(
      `| ${report.sampleId} | ${report.routeTrack ?? 'neutral'} | ${report.finalAge} | ${report.isAlive ? 'yes' : 'no'} | ${formatSegmentRow(report.youth)} | ${formatSegmentRow(report.midlife)} |`,
    );
  }

  lines.push('', '## Midlife (31–50) 明细', '');

  for (const report of reports) {
    const m = report.midlife;
    lines.push(`### ${report.sampleId}`, '');
    lines.push('| 字段 | 值 |', '| --- | --- |');
    lines.push(`| eventCount | ${m.eventCount} |`);
    lines.push(`| choiceCount | ${m.choiceCount} |`);
    lines.push(`| routeFlags | ${m.routeFlags.join(', ') || '—'} |`);
    lines.push(
      `| relationshipState | spouse=${m.relationshipState.spouse ?? '—'}, children=${m.relationshipState.children}, arc=${m.relationshipState.romanceFamilyArcOutcome ?? '—'} |`,
    );
    lines.push(
      `| deathStatus | alive=${m.deathStatus.isAliveAtSegmentEnd}, diedInSegment=${m.deathStatus.diedInSegment}, reason=${m.deathStatus.deathReason ?? '—'} |`,
    );
    lines.push(
      `| payoffStatus | rate=${(m.payoffStatus.simulatedPayoffRate * 100).toFixed(1)}%, hits=${m.payoffStatus.simulatedHits}/${m.payoffStatus.keyChoicesMade}, pass=${m.payoffStatus.pass} |`,
    );
    lines.push('');
  }

  lines.push('Regenerate: `npm run simulate:p3-eval`');
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  if (process.argv.includes('--quiet')) {
    process.env.WUXIA_ENGINE_QUIET = '1';
  }

  const runs = await runAllP3EvalSimulations();
  const segmentReports = buildAllP3EvalSegmentReports(runs);

  const outputDir = path.join(process.cwd(), 'public/reports');
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, `p3-eval-simulation-${Date.now()}.json`);
  const payload = {
    generatedAt: new Date().toISOString(),
    endAge: P3_EVAL_END_AGE,
    sampleCount: segmentReports.length,
    samples: segmentReports,
  };
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf-8');

  const mdPath = path.join(process.cwd(), 'docs/test-reports/p3-midlife-simulation-segments.md');
  fs.writeFileSync(mdPath, formatMarkdownReport(segmentReports), 'utf-8');

  console.log('\n=== P3-EVAL Simulation (0–50, segmented) ===\n');
  for (const report of segmentReports) {
    const m = report.midlife;
    console.log(
      `${report.sampleId}: age=${report.finalAge} youth(events=${report.youth.eventCount}) midlife(events=${m.eventCount}, choices=${m.choiceCount}, payoff=${(m.payoffStatus.simulatedPayoffRate * 100).toFixed(0)}%)`,
    );
  }
  console.log(`\nJSON: ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Report: ${path.relative(process.cwd(), mdPath)}`);
}

main().catch(error => {
  console.error('[p3-eval-simulation] failed:', error);
  process.exit(1);
});
