import { evaluateMixedDestinies } from '../p16/compositeDestiny';
import { getWorldProfile } from '../narrative/worldProfile';
import type { PlayerState } from '../types/eventTypes';
import { P25_MIXED_LIFE_PATHS } from './mixedSimulationBaselines';
import type { LifePathFixture } from './validationSlices';

export interface MixedIdentityFinding {
  pathId: string;
  outcomeId: string;
  unlocked: boolean;
  compositeIdentitySignals: string[];
  singleAxisOnly: boolean;
  passed: boolean;
  pointer: string;
  detail: string;
}

export interface P25MixedIdentitySliceResult {
  slice: 'p25_mixed_composite_identity';
  pathCount: number;
  findings: MixedIdentityFinding[];
  passed: boolean;
}

const IDENTITY_SLICE_PATHS = P25_MIXED_LIFE_PATHS.filter(p =>
  ['mixed_merchant_magnate_path', 'mixed_healer_swordsman_path', 'mixed_merchant_patron_path'].includes(
    p.id,
  ),
);

const PATH_TO_MIXED: Record<string, string> = {
  mixed_merchant_magnate_path: 'merchant_magnate',
  mixed_healer_swordsman_path: 'healer_swordsman',
  mixed_merchant_patron_path: 'merchant_martial_patron',
};

function evaluateMixedIdentity(path: LifePathFixture, worldId = 'wuxia'): MixedIdentityFinding {
  const outcomeId = PATH_TO_MIXED[path.id] ?? 'merchant_magnate';
  const player = {
    name: 'identity-sim',
    age: path.player.age ?? 40,
    traitProfile: { origin: path.originId },
    ...path.player,
  } as PlayerState;
  const flags = { ...path.flags };
  const outcome = getWorldProfile(worldId).mixedDestinyOutcomes?.find(o => o.id === outcomeId);
  const report = evaluateMixedDestinies(player, flags, worldId).find(r => r.outcomeId === outcomeId);
  const satisfiedGroups = (outcome?.crossTrackGroups ?? []).filter(group =>
    group.requirementIndices.every(idx => report?.dimensions[idx]?.status === 'satisfied'),
  );
  const compositeIdentitySignals = [
    ...(path.summarySignals ?? []),
    ...satisfiedGroups.map(g => `${g.trackLabel}:ok`),
  ];
  const singleAxisOnly = (report?.unlocked ?? false) && satisfiedGroups.length < 2;
  const unlocked = report?.unlocked ?? false;
  const passed = unlocked && satisfiedGroups.length >= 2;

  return {
    pathId: path.id,
    outcomeId,
    unlocked,
    compositeIdentitySignals,
    singleAxisOnly,
    passed,
    pointer: `path:${path.id} → outcome:${outcomeId} tracks:${satisfiedGroups.map(g => g.trackId).join('+')}`,
    detail: passed
      ? 'Composite identity from ≥2 cross-track groups at summary'
      : unlocked
        ? 'Unlocked but fewer than 2 cross-track groups satisfied'
        : `Not unlocked; cross-tracks=${JSON.stringify(report?.unmetCrossTracks ?? {})}`,
  };
}

export function runP25MixedIdentitySlice(worldId = 'wuxia'): P25MixedIdentitySliceResult {
  const findings = IDENTITY_SLICE_PATHS.map(path => evaluateMixedIdentity(path, worldId));
  return {
    slice: 'p25_mixed_composite_identity',
    pathCount: IDENTITY_SLICE_PATHS.length,
    findings,
    passed: findings.length >= 3 && findings.every(f => f.passed),
  };
}

export function formatMixedIdentityMarkdown(result: P25MixedIdentitySliceResult): string {
  const lines = [
    '# P25 Mixed Composite Identity Validation Slice (US-016)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: ${result.pathCount}`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Findings',
    '',
  ];
  for (const f of result.findings) {
    lines.push(
      `- \`${f.pathId}\` / \`${f.outcomeId}\`: ${f.passed ? 'PASS' : 'FAIL'} — ${f.detail} → \`${f.pointer}\``,
    );
  }
  return lines.join('\n');
}
