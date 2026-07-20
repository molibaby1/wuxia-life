import goldenLinePayoffMap from '../data/golden-line-payoff-map.json';
import goldenLineSpine from '../data/golden-line-spine.json';
import {
  ACHIEVEMENT_ID_LABELS,
  DEBT_FLAG_LABELS,
  KEY_CHOICE_OUTCOME_CONSEQUENCES,
  MIDLIFE_OUTCOME_LABELS,
  RELATIONSHIP_ROLE_LABELS,
  RISK_SIGNAL_LABELS,
  ROUTE_TRANSITION_LABELS,
  affinityToBand,
  affinityToStatusLabel,
  formatKeyChoiceLabel,
} from '../data/lifeMemoryLabels';
import type { RouteIdentity } from './RouteCompatibilityRules';
import { getRouteCompatibilityRule } from './RouteCompatibilityRules';
import type { RouteLifecycleState } from './RouteStateManager';
import type { EventRecord, GameState, Relationship } from '../types/eventTypes';
import {
  LIFE_MEMORY_SCHEMA_VERSION,
  type LifeMemoryAchievementEntry,
  type LifeMemoryDebtEntry,
  type LifeMemoryHabitTrajectoryEntry,
  type LifeMemoryKeyChoiceEntry,
  type LifeMemoryRelationshipEntry,
  type LifeMemoryRiskEntry,
  type LifeMemoryRouteStatus,
  type LifeMemoryRoadCommitment,
  type LifeMemorySummary,
} from '../types/lifeMemory';
import { formatLifeRoadLabel, type LifeRoadId } from '../types/lifeRoad';
import {
  ROUTE_DISPLAY_NAMES,
  formatRouteLabel,
  getPlayerRouteSummary,
  lifecyclePhaseLabel,
} from '../utils/playerFacingLabels';
import { deriveDominantShapingLines } from '../utils/habitShapingSummary';
import {
  deriveSampleLineAge40Identity,
  deriveSampleLineCurrentGoal,
} from '../p50/sampleLineExpression';
import {
  deriveOrdinaryOriginCurrentGoal,
  deriveOrdinaryOriginLifeMemory,
  deriveOrdinaryOriginSummary,
} from '../p56/ordinaryOriginExpression';

const PRIORITY_ROUTE_IDS = ['sect', 'wanderer', 'demonic'] as const;

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
  'merchant_crisis',
] as const;

const SECT_FACTION_LABELS: Record<string, string> = {
  orthodox: '传统门派',
  unconventional: '非传统门派',
  neutral: '中立门派',
};

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

type ActiveRoute = {
  routeId: string;
  lifecycle: RouteLifecycleState;
  lockedIn: boolean;
};

function isActiveLifecycle(lifecycle: RouteLifecycleState): boolean {
  return lifecycle !== 'inactive';
}

function isCoPrimaryLifecycle(lifecycle: RouteLifecycleState): boolean {
  return lifecycle === 'active' || lifecycle === 'locked_in' || lifecycle === 'temporary';
}

function readActiveRoutes(state: GameState): ActiveRoute[] {
  const commitments = Object.values(state.roadCommitments ?? {}).filter(Boolean);
  if (commitments.length > 0) {
    return commitments.map((commitment) => ({
      routeId: commitment!.roadId,
      lifecycle: commitment!.lifecycle,
      lockedIn: commitment!.lifecycle === 'locked_in' || commitment!.lifecycle === 'completed',
    }));
  }

  const routeStates = state.routeStates || {};
  const active: ActiveRoute[] = [];

  for (const [routeId, record] of Object.entries(routeStates)) {
    if (record && isActiveLifecycle(record.lifecycle)) {
      active.push({
        routeId,
        lifecycle: record.lifecycle,
        lockedIn: record.lockedIn,
      });
    }
  }

  if (active.length > 0) {
    return active;
  }

  const flags = state.flags || {};
  if (flags.route_orthodox) {
    active.push({ routeId: 'sect', lifecycle: 'active', lockedIn: false });
  } else if (flags.route_demonic) {
    active.push({ routeId: 'demonic', lifecycle: 'active', lockedIn: false });
  } else if (flags.route_wanderer || flags.route_border) {
    active.push({ routeId: 'wanderer', lifecycle: 'active', lockedIn: false });
  } else if (
    flags.route_merchant
    || flags.route_wealth_committed
    || flags.p22_wealth_route_forked
    || flags.p9_merchant_midlife_path
    || flags.p9_wealth_caravan_gate_done
    || (
      flags.p8_route_wealth
      && (flags.p9_early_business_focus || flags.p16_deferred_business_upbringing || flags.p9_echo_business_hook)
    )
  ) {
    active.push({ routeId: 'merchant', lifecycle: 'active', lockedIn: false });
  }

  return active;
}

function routesCanCoexist(primaryId: string, secondaryId: string): boolean {
  const rule = getRouteCompatibilityRule(
    primaryId as RouteIdentity,
    secondaryId as RouteIdentity,
  );
  return rule.resolution === 'allow_coexist';
}

function pickPrimaryAndSecondary(state: GameState): {
  primary?: ActiveRoute;
  secondary?: ActiveRoute;
} {
  const activeRoutes = readActiveRoutes(state);
  if (activeRoutes.length === 0) {
    return {};
  }

  let primary = activeRoutes.find((route) =>
    (PRIORITY_ROUTE_IDS as readonly string[]).includes(route.routeId)
    && isCoPrimaryLifecycle(route.lifecycle),
  );

  if (!primary) {
    primary = activeRoutes.find((route) => isCoPrimaryLifecycle(route.lifecycle));
  }

  if (!primary) {
    primary = activeRoutes[0];
  }

  const secondary = activeRoutes.find(
    (route) =>
      route.routeId !== primary!.routeId
      && isCoPrimaryLifecycle(route.lifecycle)
      && routesCanCoexist(primary!.routeId, route.routeId),
  );

  return { primary, secondary };
}

function buildRouteStatus(state: GameState): LifeMemoryRouteStatus {
  const routeStates = state.routeStates || {};
  const flags = state.flags || {};
  const { primary, secondary } = pickPrimaryAndSecondary(state);

  const diagnosticRouteStates: LifeMemoryRouteStatus['diagnostic']['routeStates'] = {};
  for (const [routeId, record] of Object.entries(routeStates)) {
    if (!record) continue;
    diagnosticRouteStates[routeId] = {
      lifecycle: record.lifecycle,
      lockedIn: record.lockedIn,
    };
  }

  const activeRouteFlags = Object.keys(flags).filter((key) => key.startsWith('route_') && flags[key]);

  let legacySource: string | undefined;
  let primarySummary = getPlayerRouteSummary(state);

  if (primary) {
    primarySummary = {
      name: ROUTE_DISPLAY_NAMES[primary.routeId] || formatRouteLabel(primary.routeId),
      phase: lifecyclePhaseLabel(primary.lifecycle, primary.lockedIn),
    };
  } else if (state.lifePath?.faction && !flags.sect_faction && Object.keys(routeStates).length === 0) {
    legacySource = 'lifePath.faction';
    primarySummary = {
      name: formatRouteLabel(state.lifePath.faction),
      phase: '未入门',
    };
  }

  const routeStatus: LifeMemoryRouteStatus = {
    primary: {
      routeId: primary?.routeId ?? 'unknown',
      name: primarySummary.name,
      phase: primarySummary.phase,
    },
    diagnostic: {
      routeStates: diagnosticRouteStates,
      activeRouteFlags,
      ...(legacySource ? { legacySource } : {}),
    },
  };

  if (secondary) {
    routeStatus.secondary = {
      routeId: secondary.routeId,
      name: ROUTE_DISPLAY_NAMES[secondary.routeId] || formatRouteLabel(secondary.routeId),
      phase: lifecyclePhaseLabel(secondary.lifecycle, secondary.lockedIn),
    };
  }

  const faction = flags.sect_faction;
  if (typeof faction === 'string' && SECT_FACTION_LABELS[faction]) {
    routeStatus.factionLabel = SECT_FACTION_LABELS[faction];
  }

  const currentGoalLabel = deriveSampleLineCurrentGoal(state)
    ?? deriveOrdinaryOriginCurrentGoal(state);
  if (currentGoalLabel) {
    routeStatus.currentGoalLabel = currentGoalLabel;
  }

  const history = state.routeHistory || [];
  const lastTransition = [...history].reverse().find((entry) => entry.to !== 'inactive');
  if (lastTransition) {
    const transitionLabel =
      ROUTE_TRANSITION_LABELS[lastTransition.to]
      || `${ROUTE_DISPLAY_NAMES[lastTransition.routeId] || '路线'}变化`;
    routeStatus.lastTransition = {
      label: transitionLabel,
      age: lastTransition.age,
    };
  }

  return routeStatus;
}

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
  if (eventId === 'merchant_crisis' && flags.merchant_crisis_loyalty) {
    return KEY_CHOICE_OUTCOME_CONSEQUENCES.merchant_crisis_loyalty;
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
  if (flags.has_master && !seen.has('master')) {
    pushEntry('master', '恩师', 'master', 50);
  }
  if (flags.has_sworn_siblings && !seen.has('sworn')) {
    pushEntry('sworn', '义兄弟', 'sworn', 45);
  }
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

  if (flags.has_life_debt === true) {
    pushDebt('debt-life', DEBT_FLAG_LABELS.has_life_debt, 'low', ['has_life_debt'], ['flags.has_life_debt']);
  }

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
    (flags.route_wanderer || state.routeStates?.wanderer?.lifecycle === 'active')
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

  const health = player.health ?? 100;
  const constitution = player.constitution ?? 50;
  if (health < 40 || constitution < 50) {
    pushRisk(
      'risk-health',
      RISK_SIGNAL_LABELS.lowHealth,
      'medium',
      'L0',
      [],
      [`health:${health}`, `constitution:${constitution}`],
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

  if (flags.merchant_crisis_pending === true || flags.merchant_crisis_loyalty === true) {
    pushRisk(
      'risk-merchant-crisis',
      RISK_SIGNAL_LABELS.merchantCrisis,
      'medium',
      'L1',
      ['merchant_crisis_pending', 'merchant_crisis_loyalty'],
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

  const anxiety = player.lifeStates?.anxiety ?? 0;
  const fatigue = player.lifeStates?.fatigue ?? 0;
  if (anxiety >= 70) {
    pushRisk(
      'risk-anxiety',
      RISK_SIGNAL_LABELS.highAnxiety,
      'low',
      'L0',
      [],
      [`anxiety:${anxiety}`],
    );
  }
  if (fatigue >= 70) {
    pushRisk(
      'risk-fatigue',
      RISK_SIGNAL_LABELS.highFatigue,
      'low',
      'L0',
      [],
      [`fatigue:${fatigue}`],
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
    ...(state.identity?.achievements ?? []),
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

  for (const [routeId, record] of Object.entries(state.routeStates ?? {})) {
    if (record?.lifecycle === 'completed') {
      pushAchievement(
        `achievement-route-${routeId}`,
        `${ROUTE_DISPLAY_NAMES[routeId] || routeId}之路已竟`,
        'route',
        routeId,
        [`routeStates.${routeId}.completed`],
      );
    }
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
  return deriveDominantShapingLines(state.player.lifeStates, 3).map((line, index) => ({
    id: `habit-trajectory-${index}`,
    label: line.label,
    tierLabel: line.tierLabel,
    visibility: 'player' as const,
    sortKey: line.sortKey,
  }));
}

/**
 * Derive a serializable life memory summary from current game state.
 * Does not mutate state or persist redundant memory fields.
 */
export function deriveLifeMemorySummary(state: GameState): LifeMemorySummary {
  const routeStatus = buildRouteStatus(state);
  const keyChoices = buildKeyChoices(state);
  const relationships = buildRelationships(state);
  const unresolvedDebts = buildUnresolvedDebts(state);
  const risks = buildRisks(state);
  const achievements = debtAchievementOverlap(
    unresolvedDebts ?? [],
    buildAchievements(state),
  );
  const habitTrajectory = buildHabitTrajectory(state);

  const summary: LifeMemorySummary = {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: state.player.age,
    routeStatus,
  };

  const roadCommitments: LifeMemoryRoadCommitment[] = Object.values(state.roadCommitments ?? {})
    .filter((commitment): commitment is NonNullable<typeof commitment> => Boolean(commitment))
    .map((commitment) => ({
      roadId: commitment.roadId,
      name: formatLifeRoadLabel(commitment.roadId as LifeRoadId),
      phase: commitment.lifecycle,
      proofCount: commitment.proofCount,
      sourceChoiceId: commitment.sourceChoiceId,
      sourceEventId: commitment.sourceEventId,
    }));
  if (roadCommitments.length > 0) summary.roadCommitments = roadCommitments;
  if (state.identity) {
    summary.identity = {
      primary: state.identity.primary,
      all: [...state.identity.identities],
    };
  }

  const optionalKeyChoices = omitEmpty(keyChoices);
  const optionalRelationships = omitEmpty(relationships);
  const optionalDebts = omitEmpty(unresolvedDebts);
  const optionalRisks = omitEmpty(risks);
  const optionalAchievements = omitEmpty(achievements);
  const optionalHabitTrajectory = omitEmpty(habitTrajectory);

  if (optionalKeyChoices) summary.keyChoices = optionalKeyChoices;
  if (optionalRelationships) summary.relationships = optionalRelationships;
  if (optionalDebts) summary.unresolvedDebts = optionalDebts;
  if (optionalRisks) summary.risks = optionalRisks;
  if (optionalAchievements) summary.achievements = optionalAchievements;
  if (optionalHabitTrajectory) summary.habitTrajectory = optionalHabitTrajectory;

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
