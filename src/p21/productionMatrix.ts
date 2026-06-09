import { EventLoader } from '../core/EventLoader';
import type { ProductionMatrixRow, ProductionValidationMatrix } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateContentConstraints } from './constraintEvaluation';
import { getScholarTuningEvidence } from './tuningValidation';

const P21_EVENT_IDS = [
  'p21_scholar_route_reinforcement',
  'p21_study_echo_callback',
  'p21_archetype_legacy_closure',
];

function buildMatrixRow(eventId: string): ProductionMatrixRow | undefined {
  const event = EventLoader.getInstance().getEventById(eventId);
  if (!event) return undefined;

  const semantics = event.metadata?.authoringSemantics;
  const constraintReport = evaluateContentConstraints(getWorldProfile(), e => e.id === eventId);
  const styleFindings = constraintReport.findings.filter(f => f.dimension !== 'duplicate_risk');
  const dupFindings = constraintReport.findings.filter(f => f.dimension === 'duplicate_risk');

  const avg = (scores: number[]) => (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);

  const routeFitScore = avg(styleFindings.filter(f => f.dimension === 'route_fit').map(f => f.score));
  const stageFitScore = avg(styleFindings.filter(f => f.dimension === 'stage_fit').map(f => f.score));
  const toneScore = avg(styleFindings.filter(f => f.dimension === 'tone_consistency').map(f => f.score));
  const archetypeFitScore = semantics?.contentRole === 'archetype_sensitive' ? 0.85 : 0.6;
  const duplicateRiskScore = avg(dupFindings.map(f => f.score));
  const coherent = constraintReport.decision !== 'fail' && routeFitScore >= 0.5;

  return {
    eventId,
    contentRole: semantics?.contentRole ?? 'general',
    routeFitScore,
    stageFitScore,
    archetypeFitScore,
    toneScore,
    duplicateRiskScore,
    llmAssisted: false,
    configOnly: true,
    coherent,
  };
}

export function buildProductionValidationMatrix(): ProductionValidationMatrix {
  const rows = P21_EVENT_IDS.map(buildMatrixRow).filter((r): r is ProductionMatrixRow => r !== undefined);
  const coherentCount = rows.filter(r => r.coherent).length;
  const configOnlyCount = rows.filter(r => r.configOnly).length;
  const avgRouteFit = rows.length
    ? rows.reduce((sum, r) => sum + r.routeFitScore, 0) / rows.length
    : 0;
  const avgDuplicateRisk = rows.length
    ? rows.reduce((sum, r) => sum + r.duplicateRiskScore, 0) / rows.length
    : 0;

  let decision: ProductionValidationMatrix['decision'] = 'pass';
  if (coherentCount < rows.length) decision = 'warning';
  if (coherentCount < Math.ceil(rows.length * 0.6)) decision = 'fail';

  return {
    generatedAt: new Date().toISOString(),
    rows,
    summary: {
      totalSamples: rows.length,
      coherentCount,
      configOnlyCount,
      avgRouteFit,
      avgDuplicateRisk,
    },
    decision,
  };
}

export function formatProductionMatrixMarkdown(matrix: ProductionValidationMatrix): string {
  const lines = [
    '# P21 Production Validation Matrix',
    '',
    `- Samples: ${matrix.summary.totalSamples}`,
    `- Coherent: ${matrix.summary.coherentCount}`,
    `- Config-only: ${matrix.summary.configOnlyCount}`,
    `- Avg route fit: ${matrix.summary.avgRouteFit.toFixed(2)}`,
    `- Decision: **${matrix.decision}**`,
    '',
    '| Event | Role | Route | Stage | Tone | Dup-risk | Coherent |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of matrix.rows) {
    lines.push(
      `| ${row.eventId} | ${row.contentRole} | ${row.routeFitScore.toFixed(2)} | ${row.stageFitScore.toFixed(2)} | ${row.toneScore.toFixed(2)} | ${row.duplicateRiskScore.toFixed(2)} | ${row.coherent ? 'yes' : 'no'} |`,
    );
  }
  const tuning = getScholarTuningEvidence();
  lines.push('', '## Tuning Evidence', `- Scholar baseWeight: ${tuning.baseWeight}`);
  lines.push(`- Scholar stage_20_30 payoffSpacing: ${tuning.payoffSpacingStage2030}`);
  lines.push(`- Route pathAffinity tuned target: ${tuning.pathAffinityTuned}`);
  return lines.join('\n');
}
