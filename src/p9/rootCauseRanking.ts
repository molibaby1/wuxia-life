import type { P9RootCauseRankingReport, RankedRootCause, RemediationLayer, WarningBucket } from './types';
import type { P9WarningTriageReport } from './types';
import type { P9PacingAnnotationReport } from './types';
import type { P9ReplayComparisonReport } from './types';
import type { P9CausalityRootCauseReport } from './types';

export function buildRootCauseRankingReport(
  triage: P9WarningTriageReport,
  pacing: P9PacingAnnotationReport,
  replay: P9ReplayComparisonReport,
  causality: P9CausalityRootCauseReport,
): P9RootCauseRankingReport {
  const rootCauses: RankedRootCause[] = [];

  const replayPairs = replay.pairs.filter(p => p.similarDimensions.length >= 2);
  if (replayPairs.length > 0) {
    const personas = [...new Set(replayPairs.flatMap(p => [p.personaA, p.personaB]))];
    rootCauses.push({
      rank: rootCauses.length + 1,
      title: 'Midlife route and identity collapse across persona pairs',
      bucket: 'replayability',
      affectedPersonas: personas,
      ageBands: ['20-30', '30-40'],
      likelyFixLayer: 'content',
      summary: `${replayPairs.length} near-duplicate pairs share action distribution and/or summary identity despite different early strategies. First-wave fix: diverge midlife route events for wealth/travel and cautious/deviant pairs.`,
    });
  }

  const noContentSpans = pacing.spans.filter(s => s.classification === 'no-content' || s.classification === 'weak-feedback');
  if (noContentSpans.length > 0) {
    rootCauses.push({
      rank: rootCauses.length + 1,
      title: 'Childhood-to-teen low-impact windows with weak player feedback',
      bucket: 'pacing',
      affectedPersonas: noContentSpans.map(s => s.personaId),
      ageBands: noContentSpans.map(s => `${s.startAge}-${s.endAge}`),
      likelyFixLayer: 'content',
      summary: `${noContentSpans.length} personas have 6–7 year spans with auto-only events and no route/identity signals. Add mid-window milestones (route signal, achievement, relationship shift).`,
    });
  }

  const missingEcho = causality.personas.filter(p => p.classification === 'missing-content-echo');
  const implicitEcho = causality.personas.filter(p => p.classification === 'implicit-only-echo');
  const strictDetector = causality.personas.filter(p => p.classification === 'detector-too-strict');

  if (missingEcho.length >= 3) {
    rootCauses.push({
      rank: rootCauses.length + 1,
      title: 'Early active actions lack authored later-life callbacks',
      bucket: 'causality',
      affectedPersonas: missingEcho.map(p => p.personaId),
      ageBands: ['0-10', '25-40'],
      likelyFixLayer: 'content',
      summary: `${missingEcho.length} personas show no implicit or explicit echo from early actions. Add explicit echo hooks on training/business/travel early actions.`,
    });
  }

  if (implicitEcho.length >= 2) {
    rootCauses.push({
      rank: rootCauses.length + 1,
      title: 'Visible progression exists but gate token matcher misses it',
      bucket: 'causality',
      affectedPersonas: implicitEcho.map(p => p.personaId),
      ageBands: ['15-40'],
      likelyFixLayer: 'runtime',
      summary: `${implicitEcho.length} personas have route/identity/stat progression without hard token matches. Extend causality detector to route state and summary references.`,
    });
  }

  if (triage.byBucket.replayability.length > 0) {
    const replayPersonas = replay.pairs.flatMap(p => [p.personaA, p.personaB]);
    rootCauses.push({
      rank: rootCauses.length + 1,
      title: 'Replay similarity scoring driven by shared midlife event pool',
      bucket: 'replayability' as WarningBucket,
      affectedPersonas: [...new Set(replayPersonas)],
      ageBands: ['18-25'],
      likelyFixLayer: 'config',
      summary: 'Multiple personas converge on the same turning-point events (e.g. martial tournament). Route definitions should declare persona-specific divergence points.',
    });
  }

  if (strictDetector.length > 0 && rootCauses.length < 5) {
    rootCauses.push({
      rank: rootCauses.length + 1,
      title: 'Detector undercounts explicit narrative callbacks',
      bucket: 'causality',
      affectedPersonas: strictDetector.map(p => p.personaId),
      ageBands: ['20-40'],
      likelyFixLayer: 'runtime' as RemediationLayer,
      summary: 'Some personas may have narrative callbacks in event text that lack action-id tokens. Expand detection beyond hard substring matches.',
    });
  }

  return {
    schemaVersion: 'p9-root-cause-v1',
    generatedAt: new Date().toISOString(),
    rootCauses: rootCauses.slice(0, 5).map((rc, i) => ({ ...rc, rank: i + 1 })),
  };
}

export function renderRootCauseRankingMarkdown(report: P9RootCauseRankingReport): string {
  const lines = [
    '# P9 Top Root Causes (Ranked)',
    '',
    `Generated: ${report.generatedAt}`,
    '',
  ];
  for (const rc of report.rootCauses) {
    lines.push(`## ${rc.rank}. ${rc.title}`);
    lines.push('');
    lines.push(`- Bucket: **${rc.bucket}**`);
    lines.push(`- Affected personas: ${rc.affectedPersonas.join(', ') || 'cross-cutting'}`);
    lines.push(`- Age bands: ${rc.ageBands.join('; ')}`);
    lines.push(`- Likely fix layer: **${rc.likelyFixLayer}**`);
    lines.push(`- Summary: ${rc.summary}`);
    lines.push('');
  }
  return lines.join('\n');
}
