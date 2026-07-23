/**
 * Stage-10 US-001 read-only baseline audit (13–20 youth agency, route-entry timing).
 * Usage: npm exec tsx scripts/runStage10BaselineAudit.ts
 *        npm exec tsx scripts/runStage10BaselineAudit.ts --sample
 */
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { eventLoader } from '../src/core/EventLoader';
import {
  applyYouthTransitionSeeds,
  CHILDHOOD_MAX_AGE,
  resolveChildhoodActionPalette,
  shouldOfferDailyPlanning,
  YOUTH_MIN_AGE,
} from '../src/p16/childhoodAgency';
import { getMinimumActions, P7_MINIMUM_ACTION_IDS } from '../src/data/activeActionCatalog';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { progressUntilChoiceOrTerminal } from '../src/headless/progressionLoop';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';
import { getOriginSurfaceById } from '../src/p16/originSurfaces';
import { WUXIA_ROUTE_DEFINITIONS } from '../src/narrative/config/routeDefinitions';
import type { EventDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import { dailyEvents } from '../src/data/life/dailyEvents';

const BASIC_ACTION_IDS = new Set<string>(P7_MINIMUM_ACTION_IDS);

const PRIMARY_ORIGINS: Array<{
  name: string;
  flag: PrimaryOriginFamilyFlag;
  traitOrigin: string;
  personaId: string;
  seed: number;
}> = [
  {
    name: 'scholar',
    flag: 'origin_scholar_family',
    traitOrigin: 'scholar_house',
    personaId: 'p8-scholar-su',
    seed: 70001,
  },
  {
    name: 'martial',
    flag: 'origin_wuxia_family',
    traitOrigin: 'martial_house',
    personaId: 'p8-martial-lin',
    seed: 70002,
  },
  {
    name: 'merchant',
    flag: 'origin_merchant_family',
    traitOrigin: 'merchant_house',
    personaId: 'p8-wealth-shen',
    seed: 70003,
  },
  {
    name: 'frontier',
    flag: 'origin_frontier',
    traitOrigin: 'frontier_military',
    personaId: 'p8-explorer-lu',
    seed: 70004,
  },
];

const YOUTH_AUDIT_AGES = [13, 14, 16, 18, 20] as const;
const YOUTH_BAND_MIN = 13;
const YOUTH_BAND_MAX = 20;

function pickChoiceId(
  event: EventDefinition,
  dtoChoices: Array<{ id: string; text: string; available: boolean }>,
  originChoice: PrimaryOriginFamilyFlag,
): string | null {
  const available = dtoChoices.filter(c => c.available);
  const pool = available.length > 0 ? available : dtoChoices;
  if (pool.length === 0) return null;
  if (event.id === 'origin_background') {
    return pool.find(c => c.id === originChoice)?.id ?? pool[0]?.id ?? null;
  }
  if (event.id === 'childhood_preference') {
    if (originChoice === 'origin_scholar_family') {
      return pool.find(c => c.id.includes('scholar') || c.text.includes('读书'))?.id ?? pool[0]?.id ?? null;
    }
    if (originChoice === 'origin_wuxia_family') {
      return pool.find(c => c.id.includes('martial') || c.text.includes('武'))?.id ?? pool[0]?.id ?? null;
    }
    if (originChoice === 'origin_merchant_family') {
      return pool.find(c => c.id.includes('merchant') || c.text.includes('商'))?.id ?? pool[0]?.id ?? null;
    }
    return pool[0]?.id ?? null;
  }
  return pool[0]?.id ?? null;
}

async function runStoryEventStep(
  session: ReturnType<typeof HeadlessEngineSessionImpl.create>,
  originChoice: PrimaryOriginFamilyFlag,
): Promise<void> {
  let pending = session.describePendingEvent();
  if (!pending) {
    pending = await session.getNextEvent();
    if (!pending) return;
  }
  if (!pending.requiresChoice) {
    await session.progressAutomatic({ maxSteps: 8 });
    await progressUntilChoiceOrTerminal(session);
    return;
  }
  const choiceId = pickChoiceId(pending.raw, pending.event.choices ?? [], originChoice);
  if (!choiceId) {
    await progressUntilChoiceOrTerminal(session);
    return;
  }
  const snap = session.serialize();
  await session.executeChoice({
    requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
    snapshotRef: { snapshot: snap },
    action: { eventId: pending.raw.id, choiceId },
  });
  await progressUntilChoiceOrTerminal(session);
}

async function runActivePlanningStep(
  session: ReturnType<typeof HeadlessEngineSessionImpl.create>,
): Promise<void> {
  const options = session.getPlanningOptions();
  if (options.length === 0) {
    await session.getNextEvent();
    return;
  }
  await session.executeActiveAction(options[0]!.actionId);
  if (session.getSessionPhase() === 'action_summary') {
    await session.acknowledgeProgression('action_summary');
  }
  if (session.getSessionPhase() === 'disturbance_narrative') {
    await session.acknowledgeProgression('disturbance');
  }
}

function auditYouthPalette() {
  const rows: string[] = [];
  const minimumActions = getMinimumActions();
  for (const origin of PRIMARY_ORIGINS) {
    for (const age of YOUTH_AUDIT_AGES) {
      const palette = resolveChildhoodActionPalette({
        age,
        player: { traits: [] } as PlayerState,
        flags: { [origin.flag]: true, origin_id: origin.traitOrigin, p8_persona_id: origin.personaId },
      });
      const ids = palette.map(a => a.id);
      const categories = palette.map(a => a.category);
      const allFiveBasic =
        BASIC_ACTION_IDS.size > 0 &&
        [...BASIC_ACTION_IDS].every(id => ids.includes(id));
      rows.push(
        JSON.stringify({
          origin: origin.name,
          age,
          count: palette.length,
          ids,
          categories,
          allFiveBasicSamePalette: allFiveBasic,
          usesGetMinimumActions: ids.join(',') === minimumActions.map(a => a.id).join(','),
        }),
      );
    }
  }
  return rows;
}

function inventoryRouteEntrySignals() {
  const rows: string[] = [];
  const entryFlagKeys = new Set([
    'p9_early_business_focus',
    'p9_early_travel_focus',
    'p9_early_social_focus',
    'p9_echo_training_hook',
    'p9_echo_study_hook',
  ]);
  for (const route of WUXIA_ROUTE_DEFINITIONS) {
    for (const signal of route.entrySignals) {
      if (signal.flagKey && entryFlagKeys.has(signal.flagKey)) {
        rows.push(
          JSON.stringify({
            routeId: route.id,
            routeLabel: route.label,
            kind: signal.kind,
            ageBand: signal.ageBand,
            flagKey: signal.flagKey,
            description: signal.description,
          }),
        );
      }
    }
  }
  return rows;
}

function auditYouthTransitionSeeds() {
  const rows: string[] = [];
  for (const origin of PRIMARY_ORIGINS) {
    const surface = getOriginSurfaceById(origin.traitOrigin);
    const state: GameState = {
      flags: { [origin.flag]: true, origin_id: origin.traitOrigin },
      player: {
        age: 12,
        traits: [],
      } as PlayerState,
    } as GameState;
    applyYouthTransitionSeeds(state, 12, 13);
    rows.push(
      JSON.stringify({
        origin: origin.name,
        traitOrigin: origin.traitOrigin,
        surfaceConditions: surface?.immediateConditions ?? null,
        flagsAfterTransition: { ...state.flags },
      }),
    );
  }
  return rows;
}

function auditAge12PlusConfigEvents() {
  const rows: string[] = [];
  const targets = ['daily_take_odd_job'];
  for (const id of targets) {
    const event = dailyEvents.find(e => e.id === id);
    if (!event) {
      rows.push(JSON.stringify({ id, found: false, source: 'dailyEvents.ts' }));
      continue;
    }
    const min = event.ageRange?.min ?? 0;
    const max = event.ageRange?.max ?? 99;
    const overlapsYouth = min <= YOUTH_BAND_MAX && max >= YOUTH_BAND_MIN;
    rows.push(
      JSON.stringify({
        id,
        source: 'dailyEvents.ts',
        ageRange: event.ageRange,
        group: event.group,
        overlapsYouthBand13to20: overlapsYouth,
        youthBoundaryNote:
          min <= 12 && max >= 13
            ? 'Spans 12→13 boundary — acceptable daily livelihood; not p9_early_* route entry'
            : null,
      }),
    );
  }
  return rows;
}

type StepKind = 'formal' | 'daily' | 'planning' | 'passive' | 'other';

function classifyStep(phase: string, eventId?: string): StepKind {
  if (phase === 'active_planning') return 'planning';
  if (phase === 'passive_progression' || phase === 'period_summary') return 'passive';
  if (phase === 'story_event' && eventId) {
    const event = eventLoader.getEventById(eventId);
    if (event?.category === 'daily') return 'daily';
    return 'formal';
  }
  return 'other';
}

async function sample35StepRuns() {
  const results: string[] = [];
  for (const origin of PRIMARY_ORIGINS) {
    const session = HeadlessEngineSessionImpl.create({
      playerName: 'Stage10Audit',
      gender: 'female',
      catalogVersion: '1.0.0',
      randomSeed: origin.seed,
    });
    await progressUntilChoiceOrTerminal(session);

    let totalSteps = 0;
    let steps1320 = 0;
    const kindCounts1320: Record<StepKind, number> = {
      formal: 0,
      daily: 0,
      planning: 0,
      passive: 0,
      other: 0,
    };
    const planningActionIds1320: string[] = [];
    const planningActionHistogram: Record<string, number> = {};

    for (let step = 1; step <= 35; step += 1) {
      const age = session.getRuntimeState().player?.age ?? 0;
      const phase = session.getSessionPhase();
      const pending = session.describePendingEvent();
      const eventId = pending?.eventId;
      const kind = classifyStep(phase, eventId);

      totalSteps += 1;
      if (age >= YOUTH_BAND_MIN && age <= YOUTH_BAND_MAX) {
        steps1320 += 1;
        kindCounts1320[kind] += 1;
        if (phase === 'active_planning') {
          for (const opt of session.getPlanningOptions()) {
            planningActionIds1320.push(opt.actionId);
            planningActionHistogram[opt.actionId] =
              (planningActionHistogram[opt.actionId] ?? 0) + 1;
          }
        }
      }

      if (phase === 'terminal') break;
      switch (phase) {
        case 'story_event':
          await runStoryEventStep(session, origin.flag);
          break;
        case 'active_planning':
          await runActivePlanningStep(session);
          break;
        case 'action_summary':
          await session.acknowledgeProgression('action_summary');
          break;
        case 'disturbance_narrative':
          await session.acknowledgeProgression('disturbance');
          break;
        case 'passive_progression':
          await session.acknowledgeProgression('passive_continue');
          if (session.getSessionPhase() === 'period_summary') {
            await session.acknowledgeProgression('period_summary');
            await progressUntilChoiceOrTerminal(session);
          }
          break;
        case 'period_summary':
          await session.acknowledgeProgression('period_summary');
          await progressUntilChoiceOrTerminal(session);
          break;
        default:
          await progressUntilChoiceOrTerminal(session);
      }
    }

    const finalAge = session.getRuntimeState().player?.age ?? 0;
    const basicIdsSeen = [...new Set(planningActionIds1320)].filter(id =>
      BASIC_ACTION_IDS.has(id),
    );

    results.push(
      JSON.stringify({
        origin: origin.name,
        seed: origin.seed,
        finalAge,
        totalSteps,
        steps1320,
        share1320: steps1320 / totalSteps,
        kindCounts1320,
        planningTicks1320: planningActionIds1320.length,
        uniquePlanningActionIds1320: [...new Set(planningActionIds1320)],
        basicActionIdsIn1320: basicIdsSeen,
        planningActionHistogram1320: planningActionHistogram,
      }),
    );
  }
  return results;
}

function main() {
  console.log('=== Stage-10 constants ===');
  console.log(
    JSON.stringify({
      YOUTH_MIN_AGE,
      YOUTH_MAX_AGE_target: 20,
      CHILDHOOD_MAX_AGE,
      ageGt12Branch: 'resolveChildhoodActionPalette → getMinimumActions()',
      P7_MINIMUM_ACTION_IDS,
      getMinimumActionsCount: getMinimumActions().length,
    }),
  );

  console.log('\n=== resolveChildhoodActionPalette matrix (ages 13,14,16,18,20) ===');
  for (const row of auditYouthPalette()) {
    console.log(row);
  }

  console.log('\n=== getMinimumActions() ids ===');
  console.log(JSON.stringify(getMinimumActions().map(a => ({ id: a.id, category: a.category }))));

  console.log('\n=== Headless planning call chain ===');
  console.log(
    JSON.stringify({
      chain: [
        'HeadlessEngineSessionImpl.getPlanningOptions()',
        'GameEngineIntegration.getAvailableActiveActions()',
        'resolveChildhoodActionPalette({ age, player, flags })',
        'age > CHILDHOOD_MAX_AGE (12) → getMinimumActions() [no youth tier today]',
      ],
    }),
  );

  console.log('\n=== routeDefinitions entry signals (ageBand 0-10 inventory) ===');
  for (const row of inventoryRouteEntrySignals()) {
    console.log(row);
  }

  console.log('\n=== applyYouthTransitionSeeds(12→13) four origins ===');
  for (const row of auditYouthTransitionSeeds()) {
    console.log(row);
  }

  console.log('\n=== age 12+ config events (youth boundary audit) ===');
  for (const row of auditAge12PlusConfigEvents()) {
    console.log(row);
  }

  console.log('\n=== shouldOfferDailyPlanning (13–20) ===');
  for (let age = 13; age <= 20; age += 1) {
    console.log(`  age ${age}: ${shouldOfferDailyPlanning(age)}`);
  }

  console.log('\n=== 35-step headless samples (async — run with --sample) ===');
}

async function runWithSamples() {
  main();
  console.log('\n=== 35-step samples (seeds 70001–70004) ===');
  for (const row of await sample35StepRuns()) {
    console.log(row);
  }
}

if (process.argv.includes('--sample')) {
  runWithSamples().catch(err => {
    console.error(err);
    process.exit(1);
  });
} else {
  main();
}
