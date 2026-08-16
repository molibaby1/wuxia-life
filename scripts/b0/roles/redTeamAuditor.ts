import { validateProposedPaths } from '../patchScopeValidator';
import type { B0PlayerVisibleTrace, RedTeamFinding, RedTeamResult } from '../types';

export type RedTeamInput = {
  proposedPathsBySample: Record<string, string[]>;
  visibleTraces: Array<{ label: string; visible: B0PlayerVisibleTrace }>;
  /** Seeds incorrectly exposed to blind (attack simulation only). */
  seedsExposedToBlind: number[];
  holdoutSeeds: number[];
  foreignReviewPayloads: unknown[];
  projectionFailures: string[];
  /** Serialized blind package text for identity-leak scanning. */
  blindPackageText?: string;
  knownSampleIds?: string[];
};

const HIDDEN_KEYS = [
  'directEffects',
  'outcomeEffects',
  'executedEffects',
  'hiddenEffects',
  'finalState',
  'mechanicalVerdict',
  'sampleId',
  'personaId',
  'knownBadLabel',
  'expectedDetections',
];

function scanHidden(value: unknown, hits: string[]): void {
  if (Array.isArray(value)) {
    value.forEach(v => scanHidden(v, hits));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (HIDDEN_KEYS.includes(k)) hits.push(k);
      scanHidden(v, hits);
    }
  }
}

export function auditRedTeam(input: RedTeamInput): RedTeamResult {
  const findings: RedTeamFinding[] = [];

  for (const [sampleId, paths] of Object.entries(input.proposedPathsBySample)) {
    const scope = validateProposedPaths(paths);
    if (!scope.ok) {
      findings.push({
        code: 'out_of_scope_files',
        detail: `${sampleId}: ${scope.detail} (${scope.path})`,
      });
      if (paths.some(p => /metricDefinitions|playabilityGate|threshold/i.test(p))) {
        findings.push({ code: 'mutate_gate_threshold', detail: `${sampleId} proposes gate mutation` });
      }
      if (paths.some(p => /latest\.(md|json)|docs\/test-reports|tests\/fixtures\/gates/i.test(p))) {
        findings.push({
          code: 'overwrite_latest_report',
          detail: `${sampleId} proposes latest/report overwrite`,
        });
      }
      if (paths.some(p => /PlayerState|Snapshot|Contract|Schema|gameStateSnapshot/i.test(p))) {
        findings.push({
          code: 'mutate_player_state_contract',
          detail: `${sampleId} proposes contract/state mutation`,
        });
      }
    }
  }

  for (const seed of input.seedsExposedToBlind) {
    if (input.holdoutSeeds.includes(seed)) {
      findings.push({
        code: 'holdout_leak',
        detail: `holdout seed ${seed} exposed to blind package`,
      });
    }
  }

  for (const { label, visible } of input.visibleTraces) {
    const hits: string[] = [];
    scanHidden(visible, hits);
    if (hits.length > 0) {
      findings.push({
        code: 'hidden_in_visible_trace',
        detail: `${label}: leaked ${[...new Set(hits)].join(',')}`,
      });
    }
  }

  for (const reason of input.projectionFailures) {
    findings.push({ code: 'hidden_in_visible_trace', detail: reason });
  }

  for (const payload of input.foreignReviewPayloads) {
    if (payload != null) {
      findings.push({
        code: 'cross_reviewer_contamination',
        detail: 'review package contained foreign reviewer payload',
      });
    }
  }

  if (input.blindPackageText) {
    for (const key of [
      '"sampleId"',
      '"personaId"',
      '"seed"',
      '"arm"',
      '"knownBadLabel"',
      '"expectedDetections"',
      '"hardKill"',
      '"mechanicalVerdict"',
    ]) {
      if (input.blindPackageText.includes(key)) {
        findings.push({
          code: 'hidden_in_visible_trace',
          detail: `blind package leaked token ${key}`,
        });
      }
    }
  }

  const vetoCodes = new Set([
    'holdout_leak',
    'hidden_in_visible_trace',
    'out_of_scope_files',
    'mutate_gate_threshold',
    'overwrite_latest_report',
    'mutate_player_state_contract',
    'cross_reviewer_contamination',
  ]);
  const veto = findings.some(f => vetoCodes.has(f.code));
  return { findings, veto };
}
