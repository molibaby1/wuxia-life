/**
 * P120 founding-patriarch playable spine consequence consistency audit —
 * P113–P119 flag sequences (bridge → on-ramp → pressure → payoff → late-life → endgame).
 */
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import { runP39ExtendedContentPoolConsistencySlice } from './p39ContentPoolConsistencySlice';
import {
  findLifePathContradictions,
  type ContradictionFinding,
  type LifePathFixture,
} from './validationSlices';

/** Shared bridge + prerequisite flags through P113 entry. */
const PATRIARCH_BRIDGE_FLAGS: Record<string, unknown> = {
  orthodox_childhood_seed_done: true,
  p16_scholar_mentor: true,
  p22_faction_continuation_active: true,
  p16_alliance_brokered: true,
  founding_patriarch_bridge_crossed: true,
  founding_patriarch_on_ramp_done: true,
};

/** Midlife + payoff checkpoint flags common to both branches. */
const PATRIARCH_MIDLIFE_PAYOFF_FLAGS: Record<string, unknown> = {
  founding_patriarch_midlife_pressure_done: true,
  founding_patriarch_payoff_done: true,
  founding_patriarch_identity_done: true,
  founding_patriarch_payoff_resolved: true,
  founding_patriarch_payoff_legacy_holder: true,
};

/** P113–P119 terminal spine fixtures — rule_keeper and alliance_bearer endgame branches. */
export function buildP113P119FoundingPatriarchSpineFixtures(): LifePathFixture[] {
  const basePlayer = {
    age: 62,
    martialPower: 52,
    reputation: 48,
    connections: 50,
    money: 90,
    lifeStates: createDefaultPlayerLifeStates({ trainingHabit: 2 }),
  };

  return [
    {
      id: 'p120_founding_patriarch_spine_rule_keeper_endgame',
      label: 'P113–P119 scholar → rule_first → rule_keeper → endgame rule_echo',
      originId: 'scholar_house',
      player: basePlayer,
      flags: {
        ...PATRIARCH_BRIDGE_FLAGS,
        ...PATRIARCH_MIDLIFE_PAYOFF_FLAGS,
        founding_patriarch_on_ramp_scholar: true,
        founding_patriarch_pressure_rule_first: true,
        founding_patriarch_late_life_done: true,
        founding_patriarch_late_life_identity_done: true,
        founding_patriarch_late_rule_keeper: true,
        founding_patriarch_endgame_echo_done: true,
        founding_patriarch_endgame_identity_done: true,
        founding_patriarch_endgame_rule_echo: true,
      },
      summarySignals: ['开派祖师', '门规碑', '治学师承'],
    },
    {
      id: 'p120_founding_patriarch_spine_alliance_bearer_endgame',
      label: 'P113–P119 alliance → alliance_first → alliance_bearer → endgame alliance_echo',
      originId: 'scholar_house',
      player: basePlayer,
      flags: {
        ...PATRIARCH_BRIDGE_FLAGS,
        ...PATRIARCH_MIDLIFE_PAYOFF_FLAGS,
        founding_patriarch_on_ramp_alliance: true,
        founding_patriarch_pressure_alliance_first: true,
        founding_patriarch_late_life_done: true,
        founding_patriarch_late_life_identity_done: true,
        founding_patriarch_late_alliance_bearer: true,
        founding_patriarch_endgame_echo_done: true,
        founding_patriarch_endgame_identity_done: true,
        founding_patriarch_endgame_alliance_echo: true,
      },
      summarySignals: ['开派祖师', '盟约碑', '诸派续责'],
    },
  ];
}

export interface P120FoundingPatriarchSpineConsistencyResult {
  slice: 'p120_founding_patriarch_spine_consistency';
  spinePathCount: number;
  p39CarryForwardPathCount: number;
  pathCount: number;
  spinePaths: LifePathFixture[];
  findings: ContradictionFinding[];
  perPathFindings: Array<{ pathId: string; findings: ContradictionFinding[] }>;
  criticalCount: number;
  highSeverityContradictionCount: number;
  mediumLowFindingCount: number;
  passed: boolean;
  section8Item3SpineExtension: 'Met' | 'Partial';
}

function countHighSeverity(findings: ContradictionFinding[]): number {
  return findings.filter(f => f.severity === 'high' || f.severity === 'critical').length;
}

/** Extends P39 harness with P113–P119 founding-patriarch playable spine flag sequences. */
export function runP120FoundingPatriarchSpineConsistencySlice(): P120FoundingPatriarchSpineConsistencyResult {
  const p39Baseline = runP39ExtendedContentPoolConsistencySlice();
  const spinePaths = buildP113P119FoundingPatriarchSpineFixtures();

  const perPathFindings = spinePaths.map(path => ({
    pathId: path.id,
    findings: findLifePathContradictions(path),
  }));
  const spineFindings = perPathFindings.flatMap(p => p.findings);
  const findings = [...p39Baseline.findings, ...spineFindings];

  const highSeverityContradictionCount = countHighSeverity(findings);

  return {
    slice: 'p120_founding_patriarch_spine_consistency',
    spinePathCount: spinePaths.length,
    p39CarryForwardPathCount: p39Baseline.pathCount,
    pathCount: p39Baseline.pathCount + spinePaths.length,
    spinePaths,
    findings,
    perPathFindings,
    criticalCount: findings.filter(f => f.severity === 'critical').length,
    highSeverityContradictionCount,
    mediumLowFindingCount: findings.filter(f => f.severity === 'medium').length,
    passed: highSeverityContradictionCount === 0,
    section8Item3SpineExtension: highSeverityContradictionCount === 0 ? 'Met' : 'Partial',
  };
}

export function formatP120FoundingPatriarchSpineConsistencyMarkdown(
  result: P120FoundingPatriarchSpineConsistencyResult,
): string {
  const lines = [
    '# P120 Founding-Patriarch Spine Consequence Consistency Audit',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: **${result.pathCount}**`,
    `  - P39 carry-forward: ${result.p39CarryForwardPathCount}`,
    `  - P113–P119 spine traces: ${result.spinePathCount}`,
    '',
    `highSeverityContradictionCount: **${result.highSeverityContradictionCount}**`,
    `mediumLowFindingCount: **${result.mediumLowFindingCount}**`,
    `North Star §8 item 3 (spine extension): **${result.section8Item3SpineExtension}**`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}**`,
    '',
    '## Audit command',
    '',
    '```bash',
    'npm exec tsx scripts/runP120FoundingPatriarchSpineConsistencySlice.ts',
    '```',
    '',
    '## P113–P119 spine paths',
    '',
  ];

  for (const path of result.spinePaths) {
    lines.push(`- \`${path.id}\` — ${path.label}`);
  }
  lines.push('', '## Per-trace findings', '');

  for (const trace of result.perPathFindings) {
    lines.push(`### \`${trace.pathId}\``);
    if (trace.findings.length === 0) {
      lines.push('- No contradictions detected.');
    } else {
      for (const f of trace.findings) {
        lines.push(`- **[${f.severity}]** ${f.defectType}: ${f.detail} → \`${f.pointer}\``);
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}
