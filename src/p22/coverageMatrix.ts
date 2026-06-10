import type { LibraryCoverageMatrixRow, LibraryCoverageValidationMatrix } from '../narrative/profile/types';
import { evaluatePoolCoverage } from './coverageEvaluation';
import { getP22ExpansionEvents } from './p22ContentCatalog';
import { detectWeakSpots } from './weakSpotDetection';
import { getBaselinePools } from './poolInventory';

const P22_WEAK_ARCHETYPE_TARGETS: Record<string, string[]> = {
  p22_pool_origin: ['frontier_military', 'streetborn'],
  p22_pool_childhood_shaping: ['streetborn', 'poor_family'],
  p22_pool_early_route: ['wealth_merchant', 'explorer_wanderer'],
  p22_pool_midlife_consequence: ['wealth_merchant', 'social_connector'],
  p22_pool_legacy_endgame: ['hermit_withdrawal', 'wealth_merchant'],
};

function buildMatrixRow(poolId: string): LibraryCoverageMatrixRow | undefined {
  const pool = getBaselinePools().find(p => p.id === poolId);
  if (!pool) return undefined;
  const snapshot = evaluatePoolCoverage(pool);
  const expectation = pool.minimumEventCount;
  const archetypeSupportScore = Math.min(1, snapshot.archetypeTagCount / 5);
  const duplicationRiskScore = snapshot.repetitiveRisk ? 0.75 : Math.max(0.1, 1 - snapshot.eventCount / 20);

  return {
    poolId: pool.id,
    lifePhase: pool.lifePhase,
    healthClass: snapshot.healthClass,
    eventCount: snapshot.eventCount,
    meetsMinimum: snapshot.eventCount >= expectation,
    archetypeSupportScore,
    duplicationRiskScore,
    weakArchetypeTargets: P22_WEAK_ARCHETYPE_TARGETS[poolId] ?? [],
  };
}

export function buildLibraryCoverageMatrix(): LibraryCoverageValidationMatrix {
  const pools = getBaselinePools();
  const rows = pools.map(p => buildMatrixRow(p.id)).filter((r): r is LibraryCoverageMatrixRow => r !== undefined);
  const weakSpots = detectWeakSpots();
  const p22EventCount = getP22ExpansionEvents().length;

  const strongCount = rows.filter(r => r.healthClass === 'strong').length;
  const weakOrSparseCount = rows.filter(r => r.healthClass === 'weak' || r.healthClass === 'sparse').length;
  const repetitiveCount = rows.filter(r => r.healthClass === 'repetitive').length;

  let decision: LibraryCoverageValidationMatrix['decision'] = 'pass';
  if (weakOrSparseCount > 2 || p22EventCount < 8) decision = 'warning';
  if (weakOrSparseCount > 3 || p22EventCount < 5) decision = 'fail';

  return {
    generatedAt: new Date().toISOString(),
    rows,
    weakSpots,
    summary: {
      poolCount: pools.length,
      strongCount,
      weakOrSparseCount,
      repetitiveCount,
      expansionEventCount: p22EventCount,
    },
    decision,
  };
}

export function formatCoverageMatrixMarkdown(matrix: LibraryCoverageValidationMatrix): string {
  const lines = [
    '# P22 Library Coverage Validation Matrix',
    '',
    `- Decision: **${matrix.decision}**`,
    `- Pools: ${matrix.summary.poolCount}`,
    `- Strong: ${matrix.summary.strongCount}`,
    `- Weak/sparse: ${matrix.summary.weakOrSparseCount}`,
    `- P22 expansion events: ${matrix.summary.expansionEventCount}`,
    '',
    '## Pool Rows',
    '| Pool | Phase | Health | Events | Min met | Archetype | Dup risk |',
    '|------|-------|--------|--------|---------|-----------|----------|',
    ...matrix.rows.map(
      r =>
        `| ${r.poolId} | ${r.lifePhase} | ${r.healthClass} | ${r.eventCount} | ${r.meetsMinimum ? 'yes' : 'no'} | ${r.archetypeSupportScore.toFixed(2)} | ${r.duplicationRiskScore.toFixed(2)} |`,
    ),
    '',
    '## Weak Spots',
    ...matrix.weakSpots.slice(0, 12).map(w => `- [${w.severity}] ${w.poolId}: ${w.detail}`),
  ];
  return lines.join('\n');
}
