import goldenLinePayoffMap from '../data/golden-line-payoff-map.json';
import goldenLineSpine from '../data/golden-line-spine.json';
import {
  ACHIEVEMENT_ID_LABELS,
  DEBT_FLAG_LABELS,
  KEY_CHOICE_OUTCOME_CONSEQUENCES,
  MIDLIFE_OUTCOME_LABELS,
  RELATIONSHIP_ROLE_LABELS,
  RISK_SIGNAL_LABELS,
  affinityToBand,
  affinityToStatusLabel,
  formatKeyChoiceLabel,
} from '../data/lifeMemoryLabels';
import type { EventRecord, GameState, HealthStatus, Relationship } from '../types/eventTypes';
import {
  LIFE_MEMORY_SCHEMA_VERSION,
  type LifeMemoryAchievementEntry,
  type LifeMemoryDebtEntry,
  type LifeMemoryHabitTrajectoryEntry,
  type LifeMemoryKeyChoiceEntry,
  type LifeMemoryRelationshipEntry,
  type LifeMemoryRiskEntry,
  type LifeMemoryMilestoneEntry,
  type LifeMemoryMilestoneProspectEntry,
  type LifeMemorySummary,
} from '../types/lifeMemory';
import {
  deriveMilestoneProjection,
  type MilestoneEvaluation,
  type MilestoneProjection,
} from './deriveMilestoneProjection';
import { derivePracticeTrajectoryLines } from '../utils/practiceTrajectorySummary';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCurrentGoal,
} from '../p50/sampleLineExpression';
import {
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
} from '../p56/ordinaryOriginExpression';

const MIDLIFE_KEY_CHOICE_EVENT_IDS = [
  'sect_midlife_faction_pressure',
  'sect_midlife_gray_mission',
  'hero_old_case_returns',
  'hero_reputation_backlash',
  'hero_ally_pays_price',
  'hero_gray_judgment',
  'demonic_midlife_expansion',
  'demonic_midlife_betrayal',
  'demonic_midlife_fork',
  'demonic_midlife_consequence',
  'merchant_first_shop',
  'merchant_shop_failure',
] as const;

const PAYOFF_MAP_BY_EVENT = new Map(
  goldenLinePayoffMap.entries.map((entry) => [entry.keyChoiceEventId, entry]),
);

const SPINE_KEY_CHOICE_IDS = new Set<string>(goldenLineSpine.keyChoiceEventIds);

const ALL_KEY_CHOICE_EVENT_IDS = new Set<string>([
  ...goldenLineSpine.keyChoiceEventIds,
  ...goldenLinePayoffMap.entries.map((entry) => entry.keyChoiceEventId),
  ...MIDLIFE_KEY_CHOICE_EVENT_IDS,
]);

const RESOLVED_OUTCOME_FLAGS = new Set([
  'sect_midlife_ledger_done',
  'sect_midlife_outcome',
  'hero_freedom_settlement_done',
  'demonic_midlife_consequence_done',
  'hero_midlife_reclusive',
  'hero_midlife_legend_seed',
  'hero_midlife_burdened',
  'hero_midlife_family_tether',
  'hero_midlife_ongoing',
  'demonic_midlife_legacy_rule',
  'demonic_midlife_legacy_withdraw',
  'demonic_midlife_legacy_exile',
]);

const ACHIEVEMENT_FLAG_PATTERNS: Array<{
  flag: string;
  label: string;
  category: LifeMemoryAchievementEntry['category'];
}> = [
  { flag: 'married', label: '喜结良缘', category: 'family' },
  { flag: 'lover_mingyue', label: '与明月结缘', category: 'family' },
  { flag: 'sect_trial_completed', label: '通过门派试炼', category: 'martial' },
  { flag: 'orthodox_trial_completed', label: '完成正道试炼', category: 'martial' },
];

function findEventRecord(state: GameState, eventId: string): EventRecord | undefined {
  return state.eventHistory?.find((record) => record.eventId === eventId);
}

function hasDurableWrite(state: GameState, writes: string[]): boolean {
  const flags = state.flags || {};
  const playerFlags = state.player?.flags || {};
  return writes.some(
    (write) => flags[write] === true || playerFlags[write] === true,
  );
}

function resolvePayoffStatus(
  state: GameState,
  eventId: string,
  mapEntry?: (typeof goldenLinePayoffMap.entries)[number],
): LifeMemoryKeyChoiceEntry['payoffStatus'] | undefined {
  if (!mapEntry || mapEntry.payoffs.length === 0) {
    return undefined;
  }

  const flags = state.flags || {};
  const resolvedByOutcome = mapEntry.durableWrites.some((write) =>
    [...RESOLVED_OUTCOME_FLAGS].some((resolvedFlag) => flags[resolvedFlag] !== undefined)
    && flags[`${write}_done`] === true,
  );
  if (resolvedByOutcome || RESOLVED_OUTCOME_FLAGS.has(String(flags.sect_midlife_outcome))) {
    return 'resolved';
  }

  const payoffTriggered = mapEntry.payoffs.some((payoff) =>
    state.eventHistory?.some((record) => record.eventId === payoff.eventId),
  );
  if (payoffTriggered) {
    return 'echoed';
  }

  const echoedByFlag = mapEntry.durableWrites.some((write) => flags[write] === true);
  if (echoedByFlag && eventId.startsWith('sect_midlife')) {
    return flags.sect_midlife_ledger_done ? 'resolved' : 'pending';
  }

  return echoedByFlag ? 'pending' : 'pending';
}

function resolveKeyChoiceConsequence(
  state: GameState,
  mapEntry?: (typeof goldenLinePayoffMap.entries)[number],
  eventId?: string,
): string | undefined {
  const flags = state.flags || {};
  for (const write of mapEntry?.durableWrites ?? []) {
    if (KEY_CHOICE_OUTCOME_CONSEQUENCES[write]) {
      return KEY_CHOICE_OUTCOME_CONSEQUENCES[write];
    }
  }
  if (eventId === 'sect_midlife_gray_mission') {
    if (flags.sect_midlife_gray_executed) return KEY_CHOICE_OUTCOME_CONSEQUENCES.sect_midlife_gray_executed;
    if (flags.sect_midlife_gray_refused) return KEY_CHOICE_OUTCOME_CONSEQUENCES.sect_midlife_gray_refused;
    if (flags.sect_midlife_gray_leaked) return KEY_CHOICE_OUTCOME_CONSEQUENCES.sect_midlife_gray_leaked;
  }
  if (eventId === 'merchant_shop_failure' && flags.merchant_shop_failed) {
    return KEY_CHOICE_OUTCOME_CONSEQUENCES.merchant_shop_failed;
  }
  if (flags.hero_old_case_truth) return KEY_CHOICE_OUTCOME_CONSEQUENCES.hero_old_case_truth;
  if (flags.hero_old_case_silence) return KEY_CHOICE_OUTCOME_CONSEQUENCES.hero_old_case_silence;
  if (flags.sect_midlife_gray_executed) return KEY_CHOICE_OUTCOME_CONSEQUENCES.sect_midlife_gray_executed;
  if (flags.sect_midlife_gray_refused) return KEY_CHOICE_OUTCOME_CONSEQUENCES.sect_midlife_gray_refused;
  if (flags.sect_midlife_gray_leaked) return KEY_CHOICE_OUTCOME_CONSEQUENCES.sect_midlife_gray_leaked;
  if (flags.demonic_midlife_isolation_done) return KEY_CHOICE_OUTCOME_CONSEQUENCES.demonic_midlife_isolation_done;
  if (flags.demonic_midlife_betrayal_done) return KEY_CHOICE_OUTCOME_CONSEQUENCES.demonic_midlife_betrayal_done;
  return undefined;
}

function buildKeyChoices(state: GameState): LifeMemoryKeyChoiceEntry[] {
  const entries: LifeMemoryKeyChoiceEntry[] = [];

  for (const eventId of ALL_KEY_CHOICE_EVENT_IDS) {
    const record = findEventRecord(state, eventId);
    if (!record?.selectedChoice) {
      continue;
    }

    const mapEntry = PAYOFF_MAP_BY_EVENT.get(eventId);
    const durableWrites = mapEntry?.durableWrites ?? [];
    const isSpineKey = SPINE_KEY_CHOICE_IDS.has(eventId);
    const isMidlifeKey = (MIDLIFE_KEY_CHOICE_EVENT_IDS as readonly string[]).includes(eventId);

    if (!isSpineKey && !isMidlifeKey && !mapEntry) {
      continue;
    }

    if (durableWrites.length > 0 && !hasDurableWrite(state, durableWrites) && !isMidlifeKey) {
      continue;
    }

    const age = record.age ?? state.player.age;
    entries.push({
      id: `key-choice-${eventId}`,
      visibility: 'player',
      occurredAtAge: age,
      sortKey: -(age * 1000 + (isMidlifeKey ? 1 : 0)),
      label: formatKeyChoiceLabel(eventId, record.selectedChoice),
      consequence: resolveKeyChoiceConsequence(state, mapEntry, eventId),
      payoffStatus: resolvePayoffStatus(state, eventId, mapEntry),
      diagnostic: {
        eventId,
        choiceId: record.selectedChoice,
        durableWrites,
      },
    });
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.slice(0, 8);
}

function shouldIncludeRelationship(relationship: Relationship): boolean {
  const salientRoles = new Set(['lover', 'master', 'family', 'enemy']);
  if (salientRoles.has(relationship.role)) {
    return true;
  }
  return Math.abs(relationship.affinity) >= 20;
}

function buildRelationships(state: GameState): LifeMemoryRelationshipEntry[] {
  const entries: LifeMemoryRelationshipEntry[] = [];
  const seen = new Set<string>();

  const pushEntry = (
    relationId: string,
    name: string,
    role: string,
    affinity: number,
    age?: number,
  ) => {
    if (seen.has(relationId)) return;
    seen.add(relationId);
    entries.push({
      id: `relationship-${relationId}`,
      visibility: 'player',
      occurredAtAge: age,
      sortKey: -Math.abs(affinity) * 10,
      name,
      roleLabel: RELATIONSHIP_ROLE_LABELS[role] || role,
      statusLabel: affinityToStatusLabel(affinity),
      affinityBand: affinityToBand(affinity),
      diagnostic: { relationId, affinity },
    });
  };

  for (const relationship of state.player.relationships ?? []) {
    if (!shouldIncludeRelationship(relationship)) continue;
    pushEntry(relationship.id, relationship.name, relationship.role, relationship.affinity);
  }

  for (const [relationId, affinity] of Object.entries(state.relations ?? {})) {
    if (seen.has(relationId)) continue;
    if (Math.abs(affinity) < 20) continue;
    pushEntry(relationId, relationId, 'friend', affinity);
  }

  if (state.player.spouse) {
    pushEntry('spouse', state.player.spouse, 'spouse', 60);
  }

  if ((state.player.children ?? 0) > 0) {
    pushEntry('children', `${state.player.children}位子嗣`, 'children', 40);
  }

  const lifePathRelations = state.lifePath?.relationships;
  if (lifePathRelations) {
    const roleBuckets: Array<[string[], string]> = [
      [lifePathRelations.mentors, 'master'],
      [lifePathRelations.allies, 'friend'],
      [lifePathRelations.enemies, 'enemy'],
      [lifePathRelations.disciples, 'family'],
    ];
    for (const [ids, role] of roleBuckets) {
      for (const relationId of ids) {
        if (seen.has(relationId)) continue;
        const affinity = state.relations?.[relationId] ?? (role === 'enemy' ? -40 : 30);
        pushEntry(relationId, relationId, role, affinity);
      }
    }
  }

  const flags = state.flags || {};
  if (flags.lover_mingyue && !seen.has('mingyue')) {
    pushEntry('mingyue', '明月', 'lover', 70);
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.slice(0, 6);
}

function buildUnresolvedDebts(state: GameState): LifeMemoryDebtEntry[] {
  const flags = state.flags || {};
  const age = state.player.age;
  const entries: LifeMemoryDebtEntry[] = [];

  const pushDebt = (
    id: string,
    label: string,
    urgency: LifeMemoryDebtEntry['urgency'],
    sourceFlags: string[],
    sourceFields: string[],
    sortBoost = 0,
  ) => {
    entries.push({
      id,
      visibility: 'player',
      sortKey: -(urgency === 'high' ? 300 : urgency === 'medium' ? 200 : 100) - sortBoost,
      label,
      urgency,
      diagnostic: { sourceFlags, sourceFields },
    });
  };

  if (flags.hero_gray_debtor === true && !flags.hero_gray_judgment_done) {
    pushDebt(
      'debt-gray',
      DEBT_FLAG_LABELS.hero_gray_debtor,
      'medium',
      ['hero_gray_debtor'],
      ['flags.hero_gray_debtor'],
    );
  }

  if (flags.demonic_usurp_failed === true && !flags.demonic_midlife_consequence_done) {
    pushDebt(
      'debt-demonic-usurp',
      DEBT_FLAG_LABELS.demonic_usurp_failed,
      age >= 35 ? 'high' : 'medium',
      ['demonic_usurp_failed'],
      ['flags.demonic_usurp_failed'],
    );
  }

  if (flags.merchant_shop_failed === true) {
    pushDebt(
      'debt-merchant-shop',
      DEBT_FLAG_LABELS.merchant_shop_failed,
      'medium',
      ['merchant_shop_failed'],
      ['flags.merchant_shop_failed'],
    );
  }

  if (flags.merchant_midlife_debt === true) {
    pushDebt(
      'debt-merchant-midlife',
      DEBT_FLAG_LABELS.merchant_midlife_debt,
      'high',
      ['merchant_midlife_debt'],
      ['flags.merchant_midlife_debt'],
    );
  }

  const commitments = state.lifePath?.commitments;
  for (const name of commitments?.mustProtect ?? []) {
    pushDebt(
      `debt-protect-${name}`,
      `誓守之人：${name}`,
      'medium',
      [],
      ['lifePath.commitments.mustProtect'],
      1,
    );
  }

  for (const enemy of commitments?.swornEnemies ?? []) {
    pushDebt(
      `debt-enemy-${enemy}`,
      '未了的宿怨',
      'medium',
      [],
      ['lifePath.commitments.swornEnemies'],
      2,
    );
  }

  if (
    flags.route_orthodox
    && age >= 40
    && (flags.sect_midlife_faction_pressure_done || flags.sect_midlife_gray_executed)
    && !flags.sect_midlife_ledger_done
  ) {
    pushDebt(
      'debt-sect-midlife',
      '师门中年账尚未清',
      'medium',
      ['route_orthodox', 'sect_midlife_faction_pressure_done'],
      ['flags.sect_midlife_ledger_done'],
    );
  }

  if (
    flags.route_wanderer
    && age >= 43
    && countHeroMidlifeBeats(flags) >= 3
    && !flags.hero_freedom_settlement_done
  ) {
    pushDebt(
      'debt-wanderer-settlement',
      '江湖路仍未定收束',
      'medium',
      ['route_wanderer'],
      ['flags.hero_freedom_settlement_done'],
    );
  }

  if (
    flags.demonic_midlife_fork_done === true
    && !flags.demonic_midlife_consequence_done
    && age >= 44
  ) {
    pushDebt(
      'debt-demonic-consequence',
      '魔道中年后果未落锤',
      'medium',
      ['demonic_midlife_fork_done'],
      ['flags.demonic_midlife_consequence_done'],
    );
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.slice(0, 5);
}

function countHeroMidlifeBeats(flags: Record<string, unknown>): number {
  return Object.keys(flags).filter((key) => key.startsWith('hero_midlife_beat_')).length;
}

function buildRisks(state: GameState): LifeMemoryRiskEntry[] {
  const flags = state.flags || {};
  const player = state.player;
  const age = player.age;
  const entries: LifeMemoryRiskEntry[] = [];

  const pushRisk = (
    id: string,
    label: string,
    severity: LifeMemoryRiskEntry['severity'],
    warningLevel: LifeMemoryRiskEntry['warningLevel'],
    sourceFlags: string[],
    statSignals: string[],
  ) => {
    entries.push({
      id,
      visibility: 'player',
      sortKey: severity === 'high' ? -300 : severity === 'medium' ? -200 : -100,
      label,
      severity,
      warningLevel,
      diagnostic: { sourceFlags, statSignals },
    });
  };

  const constitution = player.constitution ?? 50;
  const severeHealthStatuses: HealthStatus[] = ['seriously_ill', 'seriously_injured', 'critical'];
  if (severeHealthStatuses.includes(player.healthStatus)) {
    pushRisk(
      'risk-health',
      RISK_SIGNAL_LABELS.lowHealth,
      'medium',
      'L0',
      [],
      [`healthStatus:${player.healthStatus}`],
    );
  }

  if (age >= 18 && age <= 40 && constitution < 80) {
    pushRisk(
      'risk-constitution',
      RISK_SIGNAL_LABELS.lowConstitutionYoung,
      'low',
      'L0',
      [],
      [`constitution:${constitution}`],
    );
  }

  if (flags.demonic_usurp_failed === true) {
    pushRisk(
      'risk-demonic-usurp',
      RISK_SIGNAL_LABELS.demonicUsurpFailed,
      'high',
      'L1',
      ['demonic_usurp_failed'],
      [],
    );
  }

  if (flags.demonic_midlife_isolation_done === true) {
    pushRisk(
      'risk-demonic-isolation',
      RISK_SIGNAL_LABELS.demonicIsolation,
      'medium',
      'L1',
      ['demonic_midlife_isolation_done'],
      [],
    );
  }

  if (flags.demonic_midlife_purge === true || flags.demonic_ending_purge === true) {
    pushRisk(
      'risk-demonic-purge',
      RISK_SIGNAL_LABELS.demonicPurge,
      'high',
      'L1',
      ['demonic_midlife_purge', 'demonic_ending_purge'],
      [],
    );
  }

  if (flags.sect_midlife_judgment_pending === true) {
    pushRisk(
      'risk-sect-judgment',
      RISK_SIGNAL_LABELS.sectJudgmentPending,
      'medium',
      'L1',
      ['sect_midlife_judgment_pending'],
      [],
    );
  }

  const reputation = player.reputation ?? 0;
  if (reputation < -20) {
    pushRisk(
      'risk-reputation',
      RISK_SIGNAL_LABELS.badReputation,
      'medium',
      'L0',
      [],
      [`reputation:${reputation}`],
    );
  }

  if ((player.chivalry ?? 0) < -30 && flags.route_demonic === true) {
    pushRisk(
      'risk-demonic-chivalry',
      RISK_SIGNAL_LABELS.demonicChivalry,
      'medium',
      'L0',
      ['route_demonic'],
      [`chivalry:${player.chivalry}`],
    );
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.slice(0, 4);
}

function inferAchievementCategory(
  achievementId: string,
): LifeMemoryAchievementEntry['category'] | undefined {
  if (achievementId.includes('sect') || achievementId.includes('midlife') || achievementId.includes('route')) {
    return 'route';
  }
  if (achievementId.includes('trial') || achievementId.includes('martial')) {
    return 'martial';
  }
  if (achievementId.includes('married') || achievementId.includes('family') || achievementId.includes('lover')) {
    return 'family';
  }
  if (achievementId.includes('reputation') || achievementId.includes('connection')) {
    return 'social';
  }
  if (achievementId.includes('chivalry') || achievementId.includes('karma') || achievementId.includes('gray')) {
    return 'moral';
  }
  return undefined;
}

function buildAchievements(state: GameState): LifeMemoryAchievementEntry[] {
  const flags = state.flags || {};
  const entries: LifeMemoryAchievementEntry[] = [];
  const seen = new Set<string>();

  const pushAchievement = (
    id: string,
    label: string,
    category: LifeMemoryAchievementEntry['category'],
    achievementId?: string,
    sourceFlags: string[] = [],
  ) => {
    if (seen.has(id)) return;
    seen.add(id);
    entries.push({
      id,
      visibility: 'player',
      sortKey: -100,
      label,
      category,
      diagnostic: { achievementId, sourceFlags },
    });
  };

  const achievementIds = [
    ...(state.achievements ?? []),
    ...(state.lifePath?.achievements ?? []),
  ];

  for (const achievementId of achievementIds) {
    pushAchievement(
      `achievement-${achievementId}`,
      ACHIEVEMENT_ID_LABELS[achievementId] || '人生里程碑',
      inferAchievementCategory(achievementId),
      achievementId,
    );
  }

  const sectOutcome = flags.sect_midlife_outcome;
  if (typeof sectOutcome === 'string' && MIDLIFE_OUTCOME_LABELS[sectOutcome]) {
    pushAchievement(
      `achievement-sect-midlife-${sectOutcome}`,
      MIDLIFE_OUTCOME_LABELS[sectOutcome],
      'route',
      sectOutcome,
      ['sect_midlife_outcome'],
    );
  }

  for (const [flag, label] of Object.entries(MIDLIFE_OUTCOME_LABELS)) {
    if (flags[flag] === true) {
      pushAchievement(`achievement-flag-${flag}`, label, 'route', flag, [flag]);
    }
  }

  for (const pattern of ACHIEVEMENT_FLAG_PATTERNS) {
    if (flags[pattern.flag] === true) {
      pushAchievement(
        `achievement-${pattern.flag}`,
        pattern.label,
        pattern.category,
        pattern.flag,
        [pattern.flag],
      );
    }
  }

  const age40Identity = deriveSampleLineAge40Identity(state);
  if (age40Identity) {
    pushAchievement('achievement-age40-identity', age40Identity, 'route', 'age40_identity');
  }

  if ((state.player.children ?? 0) > 0) {
    pushAchievement('achievement-children', '膝下有子', 'family', 'children');
  }

  entries.sort((a, b) => a.sortKey - b.sortKey);
  return entries.slice(0, 6);
}

function debtAchievementOverlap(debts: LifeMemoryDebtEntry[], achievements: LifeMemoryAchievementEntry[]): LifeMemoryAchievementEntry[] {
  const debtFlagSet = new Set(debts.flatMap((debt) => debt.diagnostic.sourceFlags));
  return achievements.filter((achievement) => {
    const overlap = achievement.diagnostic.sourceFlags.some((flag) => debtFlagSet.has(flag));
    return !overlap;
  });
}

function omitEmpty<T>(array: T[] | undefined): T[] | undefined {
  if (!array || array.length === 0) {
    return undefined;
  }
  return array;
}

function buildHabitTrajectory(state: GameState): LifeMemoryHabitTrajectoryEntry[] {
  return derivePracticeTrajectoryLines(state.player.lifeStates, 3).map((line, index) => ({
    id: `habit-trajectory-${index}`,
    label: line.label,
    tierLabel: line.tierLabel,
    visibility: 'player' as const,
    sortKey: line.sortKey,
  }));
}

function milestoneDiagnostic(evaluation: MilestoneEvaluation) {
  return {
    milestoneId: evaluation.definition.id,
    conditionTypes: evaluation.definition.conditions.map((condition) => condition.type),
  };
}

function buildAchievedMilestones(projection: MilestoneProjection): LifeMemoryMilestoneEntry[] {
  return projection.achieved.map((evaluation) => ({
    id: `milestone-${evaluation.definition.id}`,
    visibility: 'player',
    sortKey: evaluation.definition.priority,
    ...(evaluation.occurredAtAge === undefined ? {} : { occurredAtAge: evaluation.occurredAtAge }),
    label: evaluation.definition.label,
    description: evaluation.definition.description,
    category: evaluation.definition.category,
    evidenceLabels: evaluation.evidenceLabels,
    diagnostic: milestoneDiagnostic(evaluation),
  }));
}

function buildMilestoneProspects(projection: MilestoneProjection): LifeMemoryMilestoneProspectEntry[] {
  return projection.prospects.slice(0, 3).map((evaluation) => ({
    id: `milestone-prospect-${evaluation.definition.id}`,
    visibility: 'player',
    sortKey: evaluation.definition.priority,
    label: evaluation.definition.label,
    description: evaluation.definition.description,
    category: evaluation.definition.category,
    progressRatio: evaluation.progressRatio,
    progressLabels: evaluation.progressLabels,
    diagnostic: milestoneDiagnostic(evaluation),
  }));
}

/**
 * Derive a serializable life memory summary from current game state.
 * Does not mutate state or persist redundant memory fields.
 */
export function deriveLifeMemorySummary(state: GameState): LifeMemorySummary {
  const keyChoices = buildKeyChoices(state);
  const relationships = buildRelationships(state);
  const unresolvedDebts = buildUnresolvedDebts(state);
  const risks = buildRisks(state);
  const achievements = debtAchievementOverlap(
    unresolvedDebts ?? [],
    buildAchievements(state),
  );
  const habitTrajectory = buildHabitTrajectory(state);
  const milestoneProjection = deriveMilestoneProjection(state);
  const achievedMilestones = buildAchievedMilestones(milestoneProjection);
  const milestoneProspects = buildMilestoneProspects(milestoneProjection);

  const summary: LifeMemorySummary = {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: state.player.age,
  };
  const currentGoalLabel = deriveSampleLineCurrentGoal(state)
    ?? deriveOrdinaryOriginCurrentGoal(state);
  if (currentGoalLabel) summary.currentGoalLabel = currentGoalLabel;
  const optionalKeyChoices = omitEmpty(keyChoices);
  const optionalRelationships = omitEmpty(relationships);
  const optionalDebts = omitEmpty(unresolvedDebts);
  const optionalRisks = omitEmpty(risks);
  const optionalAchievements = omitEmpty(achievements);
  const optionalHabitTrajectory = omitEmpty(habitTrajectory);
  const optionalAchievedMilestones = omitEmpty(achievedMilestones);
  const optionalMilestoneProspects = omitEmpty(milestoneProspects);

  if (optionalKeyChoices) summary.keyChoices = optionalKeyChoices;
  if (optionalRelationships) summary.relationships = optionalRelationships;
  if (optionalDebts) summary.unresolvedDebts = optionalDebts;
  if (optionalRisks) summary.risks = optionalRisks;
  if (optionalAchievements) summary.achievements = optionalAchievements;
  if (optionalHabitTrajectory) summary.habitTrajectory = optionalHabitTrajectory;
  if (optionalAchievedMilestones) summary.achievedMilestones = optionalAchievedMilestones;
  if (optionalMilestoneProspects) summary.milestoneProspects = optionalMilestoneProspects;

  const flags = state.flags ?? {};
  const ordinaryLifeMemory = deriveOrdinaryOriginLifeMemory(flags);
  const ordinarySummary = deriveOrdinaryOriginSummary(flags);
  if (ordinaryLifeMemory) summary.ordinaryOriginLifeMemory = ordinaryLifeMemory;
  if (ordinarySummary) summary.ordinaryOriginSummary = ordinarySummary;

  return summary;
}

/** JSON round-trip helper for reports and save-boundary checks. */
export function serializeLifeMemorySummary(summary: LifeMemorySummary): LifeMemorySummary {
  return JSON.parse(JSON.stringify(summary)) as LifeMemorySummary;
}
