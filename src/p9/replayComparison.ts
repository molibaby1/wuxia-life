import type { P8PlayabilityReport } from '../p8/types';
import { getP8PersonaById } from '../p8/personas';
import type { P9ReplayComparisonReport, ReplayPairComparison } from './types';

function distributionsEqual(
  a: Record<string, number>,
  b: Record<string, number>,
): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if ((a[k] ?? 0) !== (b[k] ?? 0)) return false;
  }
  return keys.size > 0;
}

function achievementSignature(goals: { status: string; label: string }[]): string[] {
  return goals.map(g => `${g.status}:${g.label}`);
}

function achievementsTooSimilar(a: string[], b: string[]): boolean {
  if (a.length === 0 && b.length === 0) return true;
  const setA = new Set(a);
  const setB = new Set(b);
  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap += 1;
  }
  return overlap / Math.max(setA.size, setB.size, 1) >= 0.75;
}

function identityTooSimilar(a: string, b: string): boolean {
  const normalize = (s: string) => s.replace(/出身：[^，]+/g, '').trim();
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return na === nb;
  const tokensA = new Set(na.split(/[，、\s]+/));
  const tokensB = new Set(nb.split(/[，、\s]+/));
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap += 1;
  }
  return overlap / Math.max(tokensA.size, tokensB.size, 1) >= 0.6;
}

function parsePairWarning(warning: string): { a: string; b: string; score: number } | null {
  const match = warning.match(/^(p8-[a-z-]+) ~ (p8-[a-z-]+) \(([0-9.]+)\)$/);
  if (!match) return null;
  return { a: match[1], b: match[2], score: parseFloat(match[3]) };
}

export function buildReplayComparisonReport(p8Report: P8PlayabilityReport): P9ReplayComparisonReport {
  const pairs: ReplayPairComparison[] = [];

  for (const warning of p8Report.replay.nearDuplicateWarnings) {
    const parsed = parsePairWarning(warning);
    if (!parsed) continue;

    const runA = p8Report.personaRuns.find(r => r.personaId === parsed.a);
    const runB = p8Report.personaRuns.find(r => r.personaId === parsed.b);
    if (!runA || !runB) continue;

    const personaA = getP8PersonaById(parsed.a);
    const personaB = getP8PersonaById(parsed.b);
    const routeA = personaA?.routePreference ?? 'unknown';
    const routeB = personaB?.routePreference ?? 'unknown';
    const routeTooSimilar = routeA === routeB;

    const distA = runA.agency.activeActionByCategory;
    const distB = runB.agency.activeActionByCategory;
    const actionTooSimilar = distributionsEqual(distA, distB);

    const summaryA = runA.narrativeMemory.age40Identity;
    const summaryB = runB.narrativeMemory.age40Identity;
    const summaryTooSimilar = identityTooSimilar(summaryA, summaryB);

    const achA = achievementSignature(runA.achievement.goals);
    const achB = achievementSignature(runB.achievement.goals);
    const achTooSimilar = achievementsTooSimilar(achA, achB);

    const similarDimensions: string[] = [];
    if (routeTooSimilar) similarDimensions.push('route_tags');
    if (actionTooSimilar) similarDimensions.push('active_action_distribution');
    if (summaryTooSimilar) similarDimensions.push('summary_identity');
    if (achTooSimilar) similarDimensions.push('achievement_outcomes');

    pairs.push({
      personaA: parsed.a,
      personaB: parsed.b,
      similarityScore: parsed.score,
      routeTags: { a: routeA, b: routeB, tooSimilar: routeTooSimilar },
      actionDistribution: { a: distA, b: distB, tooSimilar: actionTooSimilar },
      summaryIdentity: { a: summaryA, b: summaryB, tooSimilar: summaryTooSimilar },
      achievementOutcomes: { a: achA, b: achB, tooSimilar: achTooSimilar },
      similarDimensions,
    });
  }

  return {
    schemaVersion: 'p9-replay-v1',
    generatedAt: new Date().toISOString(),
    pairs,
  };
}

export function renderReplayComparisonMarkdown(report: P9ReplayComparisonReport): string {
  const lines = [
    '# P9 Replayability Pair Comparison',
    '',
    `Generated: ${report.generatedAt}`,
    `Near-duplicate pairs: ${report.pairs.length}`,
    '',
  ];
  for (const pair of report.pairs) {
    lines.push(`## ${pair.personaA} ~ ${pair.personaB} (score ${pair.similarityScore.toFixed(2)})`);
    lines.push('');
    lines.push(`- Route tags: ${pair.routeTags.a} vs ${pair.routeTags.b}${pair.routeTags.tooSimilar ? ' **too similar**' : ''}`);
    lines.push(`- Action distribution: ${JSON.stringify(pair.actionDistribution.a)} vs ${JSON.stringify(pair.actionDistribution.b)}${pair.actionDistribution.tooSimilar ? ' **too similar**' : ''}`);
    lines.push(`- Summary identity: "${pair.summaryIdentity.a.slice(0, 60)}" vs "${pair.summaryIdentity.b.slice(0, 60)}"${pair.summaryIdentity.tooSimilar ? ' **too similar**' : ''}`);
    lines.push(`- Achievement overlap dimensions too similar: ${pair.achievementOutcomes.tooSimilar}`);
    lines.push(`- **Similar dimensions:** ${pair.similarDimensions.join(', ') || 'none flagged'}`);
    lines.push('');
  }
  return lines.join('\n');
}
