import { eventLoader } from '../core/EventLoader';
import { WUXIA_COMPOSITE_DESTINY_OUTCOMES } from '../narrative/profile/wuxiaOriginSurfaces';
import { evaluateAllCompositeDestinies, evaluateCompositeDestinyOutcome } from '../p16/compositeDestiny';
import { createDefaultPlayerLifeStates } from '../data/life/lifeStates';
import type { PlayerState } from '../types/eventTypes';
import { P25_MAINSTREAM_ACHIEVEMENT_TRACEABILITY } from './achievementTraceability';
import { resolveP31HabitLedKeyChoiceBridges } from './p31HabitLedKeyChoiceBridges';

export type ContradictionSeverity = 'critical' | 'high' | 'medium';

export interface ContradictionFinding {
  pathId: string;
  severity: ContradictionSeverity;
  defectType: 'causal_break' | 'ghost_flag' | 'window_contradiction' | 'missing_feedback' | 'config_gap';
  pointer: string;
  detail: string;
}

export interface LifePathFixture {
  id: string;
  label: string;
  originId: string;
  player: Partial<PlayerState>;
  flags: Record<string, unknown>;
  summarySignals?: string[];
}

export const P25_REPRESENTATIVE_LIFE_PATHS: LifePathFixture[] = [
  {
    id: 'orthodox_guardian_path',
    label: '正道护道线',
    originId: 'martial_family',
    player: { age: 35, martialPower: 85, reputation: 55, connections: 40, money: 30 },
    flags: {
      route_orthodox: true,
      orthodox_trial_completed: true,
      p16_guardian_oath: true,
      mentor_bond: true,
    },
    summarySignals: ['尊师重道', '护道'],
  },
  {
    id: 'jianghu_renown_path',
    label: '江湖名宿线',
    originId: 'scholar_house',
    player: { age: 38, martialPower: 50, reputation: 70, connections: 60, money: 35 },
    flags: { mentor_bond: true, ally_network: true, scholar_path_started: true },
    summarySignals: ['名望', '人脉'],
  },
  {
    id: 'medical_sage_path',
    label: '一代名医线',
    originId: 'poor_family',
    player: { age: 40, martialPower: 35, reputation: 60, connections: 25, money: 45 },
    flags: {
      medical_plague_hero: true,
      medical_divine_doctor_fame: true,
      medical_pure: true,
    },
    summarySignals: ['医德', '医术'],
  },
  {
    id: 'sect_leader_path',
    label: '门派掌门线',
    originId: 'merchant_house',
    player: { age: 42, martialPower: 60, reputation: 50, connections: 65, money: 50 },
    flags: { p16_alliance_brokered: true, sect_exposure: true, joined_sect: true },
    summarySignals: ['盟会', '掌门'],
  },
  {
    id: 'lone_sword_path',
    label: '独行剑侠线',
    originId: 'frontier_military',
    player: { age: 36, martialPower: 92, reputation: 40, connections: 15, money: 20 },
    flags: { p16_rare_master_encounter: true, route_wanderer: true },
    summarySignals: ['独行', '剑侠'],
  },
];

/** P30: habit-led life paths — seed lifeStates + bridge flags, not direct achievement flags. */
export const P30_HABIT_LED_LIFE_PATHS: LifePathFixture[] = [
  {
    id: 'habit_led_renown_social_path',
    label: '行为-led 江湖名望线',
    originId: 'scholar_house',
    player: {
      age: 36,
      martialPower: 50,
      reputation: 70,
      connections: 60,
      money: 35,
      lifeStates: createDefaultPlayerLifeStates({
        trainingHabit: 0,
        studyHabit: 0,
        businessHabit: 0,
        socialMomentum: 3,
        familyBond: 0,
      }),
    },
    flags: {
      p28_social_network_renown: true,
      p28_social_reputation_reinforced: true,
      p29_social_patron_obligation_assumed: true,
    },
    summarySignals: ['社交动量', '名望 upkeep'],
  },
  {
    id: 'habit_led_medical_study_path',
    label: '行为-led 医术精进线',
    originId: 'poor_family',
    player: {
      age: 38,
      martialPower: 30,
      reputation: 60,
      connections: 25,
      money: 45,
      lifeStates: createDefaultPlayerLifeStates({
        trainingHabit: 0,
        studyHabit: 3,
        businessHabit: 0,
        socialMomentum: 0,
        familyBond: 0,
      }),
    },
    flags: {
      p27_study_healer_path: true,
      p29_study_healer_case_duty: true,
      p29_social_healer_network: true,
    },
    summarySignals: ['研学习惯', '医者路径'],
  },
];

/** P31: same habit-led seeds as P30; achievement flags derived via bridge resolver only. */
export const P31_HABIT_LED_FULL_UNLOCK_PATHS: LifePathFixture[] = P30_HABIT_LED_LIFE_PATHS;

export function resolveHabitLedFixtureFlags(path: LifePathFixture): Record<string, unknown> {
  return resolveP31HabitLedKeyChoiceBridges(path.player, path.flags);
}

export function evaluateHabitLedPathWithP31Bridges(
  path: LifePathFixture,
  outcomeId: 'jianghu_renown_sage' | 'medical_sage_healer',
): { unlocked: boolean; resolvedFlags: Record<string, unknown> } {
  const outcome = WUXIA_COMPOSITE_DESTINY_OUTCOMES.find(o => o.id === outcomeId)!;
  const player = {
    name: 'p31-fixture',
    age: path.player.age ?? 35,
    traitProfile: { origin: path.originId },
    ...path.player,
  } as PlayerState;
  const resolvedFlags = resolveHabitLedFixtureFlags(path);
  const report = evaluateCompositeDestinyOutcome(outcome, player, resolvedFlags);
  return { unlocked: report.unlocked, resolvedFlags };
}

const GHOST_FLAG_CONSUMERS: Array<{ flag: string; eventId: string; source: string }> = [
  { flag: 'mentor_bond', eventId: 'p22_relationship_mentor_obligation', source: 'p22-content-expansions.json' },
  { flag: 'ally_network', eventId: 'p22_relationship_mentor_obligation', source: 'p22-content-expansions.json' },
  { flag: 'medical_divine_doctor_fame', eventId: 'medical_imperial_doctor', source: 'medical.json' },
];

function eventSetsFlag(eventId: string, flag: string): boolean {
  const event = eventLoader.getEventById(eventId);
  if (!event) return false;
  const scan = (effects: Array<{ type?: string; flag?: string; target?: string }> | undefined) =>
    (effects ?? []).some(
      e => e.type === 'flag_set' && (e.flag === flag || e.target === flag),
    );
  if (scan(event.autoEffects as never)) return true;
  for (const choice of event.choices ?? []) {
    if (scan(choice.effects as never)) return true;
    for (const outcome of choice.outcomes ?? []) {
      if (scan(outcome.effects as never)) return true;
    }
  }
  return false;
}

function findGhostFlagIssues(): ContradictionFinding[] {
  const findings: ContradictionFinding[] = [];
  for (const { flag, eventId, source } of GHOST_FLAG_CONSUMERS) {
    if (!eventLoader.getEventById(eventId)) {
      findings.push({
        pathId: 'global',
        severity: 'critical',
        defectType: 'ghost_flag',
        pointer: `${source} → ${eventId}`,
        detail: `Consumer event missing from runtime loader`,
      });
      continue;
    }
    const setters = eventLoader
      .getAllEvents()
      .filter(e => eventSetsFlag(e.id, flag))
      .map(e => e.id);
    if (setters.length === 0) {
      findings.push({
        pathId: 'global',
        severity: 'critical',
        defectType: 'ghost_flag',
        pointer: `flag:${flag} consumed by ${eventId}`,
        detail: `No runtime event sets flag ${flag}`,
      });
    }
  }
  return findings;
}

function findPathContradictions(path: LifePathFixture): ContradictionFinding[] {
  const findings: ContradictionFinding[] = [];
  const player = {
    name: 'sim',
    age: path.player.age ?? 30,
    traitProfile: { origin: path.originId },
    ...path.player,
  } as PlayerState;

  if (path.flags.medical_poison_path && path.flags.medical_pure) {
    findings.push({
      pathId: path.id,
      severity: 'high',
      defectType: 'window_contradiction',
      pointer: 'flags:medical_poison_path+medical_pure',
      detail: 'Mutually exclusive medical ethic flags coexist',
    });
  }

  if (path.flags.p16_alliance_brokered && path.flags.p16_rare_master_encounter) {
    const lone = evaluateAllCompositeDestinies(player, path.flags).find(r => r.outcomeId === 'lone_sword_legend');
    if (lone?.unlocked) {
      findings.push({
        pathId: path.id,
        severity: 'high',
        defectType: 'window_contradiction',
        pointer: 'lone_sword_legend + p16_alliance_brokered',
        detail: 'Alliance broker path should block lone sword legend',
      });
    }
  }

  if (path.summarySignals?.includes('尊师重道') && path.flags.hero_ally_abandoned) {
    findings.push({
      pathId: path.id,
      severity: 'high',
      defectType: 'causal_break',
      pointer: 'summary:尊师重道 vs flag:hero_ally_abandoned',
      detail: 'Summary signal contradicts ally abandonment',
    });
  }

  return findings;
}

function findTraceabilityGaps(): ContradictionFinding[] {
  return WUXIA_COMPOSITE_DESTINY_OUTCOMES.filter(
    outcome => !P25_MAINSTREAM_ACHIEVEMENT_TRACEABILITY[outcome.id],
  ).map(outcome => ({
    pathId: 'global',
    severity: 'medium' as const,
    defectType: 'config_gap' as const,
    pointer: `outcome:${outcome.id}`,
    detail: 'Mainstream outcome missing traceability link',
  }));
}

/** P36: path-level contradiction audit (shared with extended consistency slice). */
export function findLifePathContradictions(path: LifePathFixture): ContradictionFinding[] {
  return findPathContradictions(path);
}

export interface P25ConsistencySliceResult {
  slice: 'p25_consequence_consistency';
  pathCount: number;
  findings: ContradictionFinding[];
  criticalCount: number;
  passed: boolean;
}

export function runP25ConsequenceConsistencySlice(): P25ConsistencySliceResult {
  const findings = [
    ...findGhostFlagIssues(),
    ...findTraceabilityGaps(),
    ...P25_REPRESENTATIVE_LIFE_PATHS.flatMap(findPathContradictions),
  ];
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  return {
    slice: 'p25_consequence_consistency',
    pathCount: P25_REPRESENTATIVE_LIFE_PATHS.length,
    findings,
    criticalCount,
    passed: criticalCount === 0,
  };
}

export function formatConsistencySliceMarkdown(result: P25ConsistencySliceResult): string {
  const lines = [
    '# P25 Consequence Consistency Validation Slice (US-005)',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `Paths covered: ${result.pathCount}`,
    `Decision: **${result.passed ? 'PASS' : 'FAIL'}** (${result.findings.length} finding(s), ${result.criticalCount} critical)`,
    '',
    '## Representative paths',
    '',
    ...P25_REPRESENTATIVE_LIFE_PATHS.map(p => `- \`${p.id}\` — ${p.label} (${p.originId})`),
    '',
    '## Findings',
    '',
  ];
  if (result.findings.length === 0) {
    lines.push('No contradictions detected.');
  } else {
    for (const f of result.findings) {
      lines.push(
        `- **[${f.severity}]** \`${f.pathId}\` / ${f.defectType}: ${f.detail} → \`${f.pointer}\``,
      );
    }
  }
  return lines.join('\n');
}
