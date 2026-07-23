/**
 * Stage-9 US-001 read-only baseline audit (8–12 agency, spine, repetition).
 * Usage: npm exec tsx scripts/runStage9BaselineAudit.ts
 */
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';
import { eventLoader } from '../src/core/EventLoader';
import {
  ADULT_CHILDHOOD_BLOCKED_ACTIONS,
  CHILDHOOD_MAX_AGE,
  DAILY_PLANNING_MIN_AGE,
  EARLY_CHILDHOOD_MAX_AGE,
  resolveChildhoodActionPalette,
  shouldOfferDailyPlanning,
} from '../src/p16/childhoodAgency';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { progressUntilChoiceOrTerminal } from '../src/headless/progressionLoop';
import type { PrimaryOriginFamilyFlag } from '../src/p16/primaryOriginFlag';
import {
  inferEventExclusivePrimaryFlag,
  NEUTRAL_SPINE_EVENT_IDS,
} from '../src/p16/spineOriginIsolation';
import type { EventDefinition, PlayerState } from '../src/types/eventTypes';
import { getActionById } from '../src/data/activeActionCatalog';

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

const STAGE7_812_IDS = new Set([
  'childhood_summary',
  'late_childhood_prep',
  'martial_focus_payoff',
  'p22_wave_early_frontier_growth',
  'p9_childhood_balanced_posture',
  'p9_childhood_dark_spark',
  'p9_childhood_first_journey',
  'p9_childhood_first_trade',
  'p9_childhood_social_circle',
  'p9_childhood_steady_gate',
  'p9_childhood_study_recital',
  'p9_childhood_sword_trial',
  'preteen_training',
  'setback_injury',
  'p22_childhood_street_shaping',
]);

const SUPPRESSED_CATEGORIES = new Set(['business', 'travel', 'socializing']);
const ALLOWLIST_CATEGORIES = new Set(['training', 'study']);

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
    seed: 90001,
  },
  {
    name: 'martial',
    flag: 'origin_wuxia_family',
    traitOrigin: 'martial_house',
    personaId: 'p8-martial-lin',
    seed: 90002,
  },
  {
    name: 'merchant',
    flag: 'origin_merchant_family',
    traitOrigin: 'merchant_house',
    personaId: 'p8-wealth-shen',
    seed: 90003,
  },
  {
    name: 'frontier',
    flag: 'origin_frontier',
    traitOrigin: 'frontier_military',
    personaId: 'p8-explorer-lu',
    seed: 90004,
  },
];

const NEUTRAL_SPINE_REPEAT_IDS = [
  'childhood_summary',
  'late_childhood_prep',
  'martial_focus_payoff',
  'preteen_training',
  'p9_childhood_balanced_posture',
  'p9_childhood_dark_spark',
  'p9_childhood_first_journey',
  'p9_childhood_first_trade',
  'p9_childhood_social_circle',
  'p9_childhood_steady_gate',
  'p9_childhood_study_recital',
  'p9_childhood_sword_trial',
];

function classify812(event: ReturnType<typeof eventLoader.getAllEvents>[number]): string {
  if (NEUTRAL_SPINE_EVENT_IDS.has(event.id)) return 'neutral-whitelist';
  const exclusive = inferEventExclusivePrimaryFlag(event);
  if (exclusive) return exclusive.replace('origin_', '').replace('_family', '');
  const text = JSON.stringify({ conditions: event.conditions, thresholds: event.thresholds });
  if (text.includes('origin_poor_family')) return 'trait-poor';
  if (text.includes('origin_streetborn')) return 'trait-street';
  return 'neutral';
}

function inventory812() {
  return eventLoader.getAllEvents().filter(e => {
    const min = e.ageRange?.min ?? 0;
    const max = e.ageRange?.max ?? 99;
    return min <= 12 && max >= 8;
  });
}

function auditPalette() {
  const ages = [8, 9, 10, 11, 12];
  const rows: string[] = [];
  for (const origin of PRIMARY_ORIGINS) {
    for (const age of ages) {
      const palette = resolveChildhoodActionPalette({
        age,
        player: { traits: [] } as PlayerState,
        flags: { [origin.flag]: true, origin_id: origin.traitOrigin, p8_persona_id: origin.personaId },
      });
      const ids = palette.map(a => a.id);
      const categories = palette.map(a => a.category);
      const suppressedCats = categories.filter(c => SUPPRESSED_CATEGORIES.has(c));
      const allowlisted = categories.some(c => ALLOWLIST_CATEGORIES.has(c));
      const adultBlocked = ids.filter(id => ADULT_CHILDHOOD_BLOCKED_ACTIONS.has(id));
      rows.push(
        JSON.stringify({
          origin: origin.name,
          age,
          count: palette.length,
          ids,
          categories,
          suppressedCategoryPresent: suppressedCats.length > 0,
          suppressedCategories: suppressedCats,
          allowlisted,
          adultBlocked,
        }),
      );
    }
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
      playerName: 'Stage9Audit',
      gender: 'female',
      catalogVersion: '1.0.0',
      randomSeed: origin.seed,
    });
    await progressUntilChoiceOrTerminal(session);

    let totalSteps = 0;
    let steps812 = 0;
    const kindCounts812: Record<StepKind, number> = {
      formal: 0,
      daily: 0,
      planning: 0,
      passive: 0,
      other: 0,
    };
    const spineIds812: string[] = [];
    const planningActionIds812: string[] = [];

    for (let step = 1; step <= 35; step += 1) {
      const age = session.getRuntimeState().player?.age ?? 0;
      const phase = session.getSessionPhase();
      const pending = session.describePendingEvent();
      const eventId = pending?.eventId;
      const kind = classifyStep(phase, eventId);

      totalSteps += 1;
      if (age >= 8 && age <= 12) {
        steps812 += 1;
        kindCounts812[kind] += 1;
        if (phase === 'story_event' && eventId) spineIds812.push(eventId);
        if (phase === 'active_planning') {
          for (const opt of session.getPlanningOptions()) {
            planningActionIds812.push(opt.actionId);
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
    const neutralRepeat: Record<string, number> = {};
    for (const id of spineIds812) {
      if (NEUTRAL_SPINE_REPEAT_IDS.includes(id)) {
        neutralRepeat[id] = (neutralRepeat[id] ?? 0) + 1;
      }
    }

    results.push(
      JSON.stringify({
        origin: origin.name,
        finalAge,
        totalSteps,
        steps812,
        share812: steps812 / totalSteps,
        kindCounts812,
        spineIds812: [...new Set(spineIds812)],
        neutralSpineRepeat: neutralRepeat,
        planningActionIds812: [...new Set(planningActionIds812)],
        suppressedPlanningCategories: [...new Set(planningActionIds812)]
          .map(id => getActionById(id)?.category)
          .filter((c): c is string => Boolean(c && SUPPRESSED_CATEGORIES.has(c))),
      }),
    );
  }
  return results;
}

function main() {
  console.log('=== Stage-9 constants ===');
  console.log(
    JSON.stringify({
      INFANT_MAX_AGE: 2,
      DAILY_PLANNING_MIN_AGE,
      EARLY_CHILDHOOD_MAX_AGE,
      CHILDHOOD_MAX_AGE,
      paletteMaxCategories_5_7: 2,
      paletteMaxCategories_8_12: 4,
      suppressedCategoriesP16: [...SUPPRESSED_CATEGORIES],
      adultBlockedIds: [...ADULT_CHILDHOOD_BLOCKED_ACTIONS],
    }),
  );

  console.log('\n=== 8–12 spine inventory (vs Stage-7) ===');
  const band812 = inventory812();
  const newSinceStage7 = band812.filter(e => !STAGE7_812_IDS.has(e.id));
  const removedSinceStage7 = [...STAGE7_812_IDS].filter(
    id => !band812.some(e => e.id === id),
  );
  console.log('Total:', band812.length);
  console.log('New since Stage-7:', newSinceStage7.map(e => e.id).join(', ') || '(none)');
  console.log('Removed since Stage-7:', removedSinceStage7.join(', ') || '(none)');
  for (const event of band812.sort((a, b) => a.id.localeCompare(b.id))) {
    console.log(`  ${event.id} [${event.ageRange?.min}-${event.ageRange?.max}] class=${classify812(event)}`);
  }

  console.log('\n=== resolveChildhoodActionPalette matrix (8–12) ===');
  for (const row of auditPalette()) {
    console.log(row);
  }

  console.log('\n=== shouldOfferDailyPlanning (8–12) ===');
  for (let age = 8; age <= 12; age += 1) {
    console.log(`  age ${age}: ${shouldOfferDailyPlanning(age)}`);
  }

  console.log('\n=== 35-step headless samples (async — run with --sample) ===');
}

async function runWithSamples() {
  main();
  console.log('\n=== 35-step samples ===');
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
