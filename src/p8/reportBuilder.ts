import type { P8PlayabilityReport } from './types';

export function renderP8MarkdownReport(report: P8PlayabilityReport, jsonPath: string): string {
  const lines: string[] = [
    '# P8 Playability Gate Report',
    '',
    `Generated: ${report.generatedAt}`,
    ...(report.runtimePath ? [`Runtime: ${report.runtimePath}`] : []),
    `Decision: **${report.decision.toUpperCase()}**`,
    `End age: ${report.endAge}`,
    `Machine-readable: ${jsonPath}`,
    '',
    '## Summary',
    '',
  ];

  if (report.blockingFailures.length > 0) {
    lines.push('### Blockers');
    for (const b of report.blockingFailures) {
      lines.push(`- **${b.key}**: ${b.detail}`);
    }
    lines.push('');
  }

  if (report.warnings.length > 0) {
    lines.push('### Warnings');
    for (const w of report.warnings.slice(0, 12)) {
      lines.push(`- ${w.key}: ${w.detail}`);
    }
    lines.push('');
  }

  lines.push('## Persona Highlights', '');

  for (const run of report.personaRuns) {
    lines.push(`### ${run.personaName} (${run.personaId})`);
    lines.push('');
    lines.push('**Planning / Agency**');
    lines.push(
      `- Active actions: ${run.agency.activeActionCount}; categories: ${JSON.stringify(run.agency.activeActionByCategory)}`,
    );
    if (run.activeActionSelectionReasons.length > 0) {
      const sample = run.activeActionSelectionReasons[0];
      lines.push(`- Sample selection: age ${sample.age} → ${sample.actionId} (${sample.reason})`);
    }
    lines.push('');
    lines.push('**Causality (legacy diagnostic)**');
    lines.push('- This diagnostic is not part of the formal gate verdict.');
    lines.push(`- Direct echoes: ${run.causality.directEchoCount}`);
    for (const ex of run.causality.strongestExamples.slice(0, 2)) {
      lines.push(`  - ${ex.age}岁: ${ex.description.slice(0, 60)}`);
    }
    lines.push('');
    lines.push('**Achievement**');
    for (const g of run.achievement.goals) {
      lines.push(`- [${g.status}] ${g.label} (${g.ageBand}): ${g.evidence.join('; ') || '—'}`);
    }
    lines.push('');
    lines.push('**Frustration**');
    lines.push(`- Opaque setbacks: ${run.frustration.opaqueCount} / ${run.frustration.setbacks.length}`);
    lines.push('');
    lines.push('**Narrative**');
    lines.push(`- Early: ${run.narrativeMemory.earlyLife.slice(0, 100)}`);
    lines.push(`- Turning: ${run.narrativeMemory.turningPoint.slice(0, 100) || '(missing)'}`);
    lines.push(`- Age-40 identity: ${run.narrativeMemory.age40Identity.slice(0, 100)}`);
    lines.push('');
  }

  if (report.replay.nearDuplicateWarnings.length > 0) {
    lines.push('## Replay Similarity (legacy diagnostic)');
    lines.push('This diagnostic is not part of the formal gate verdict.');
    for (const w of report.replay.nearDuplicateWarnings) {
      lines.push(`- ${w}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
