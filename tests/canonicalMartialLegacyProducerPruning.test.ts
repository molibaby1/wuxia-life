import { assert } from './GameTestFramework';
import { EventLoader } from '../src/core/EventLoader';
import eventsIndexJson from '../src/data/events.json';
import type { EffectDefinition, EventDefinition } from '../src/types/eventTypes';

const LEGACY_MARTIAL_FIELDS = new Set(['externalSkill', 'internalSkill', 'qinggong']);

type Branch = {
  key: string;
  eventId: string;
  effects: EffectDefinition[];
};

function legacyEffects(effects: EffectDefinition[] | undefined): EffectDefinition[] {
  return (effects ?? []).filter(effect => LEGACY_MARTIAL_FIELDS.has(effect.target ?? effect.stat ?? ''));
}

function hasStatEffect(effects: EffectDefinition[] | undefined, stat: string, value: number): boolean {
  return (effects ?? []).some(effect => (effect.target ?? effect.stat) === stat && effect.value === value);
}

function collectBranches(events: EventDefinition[]): Branch[] {
  const branches: Branch[] = [];

  for (const event of events) {
    const add = (key: string, effects: EffectDefinition[] | undefined): void => {
      const oldEffects = legacyEffects(effects);
      if (oldEffects.length > 0) branches.push({ key, eventId: event.id, effects: oldEffects });
    };

    add(`${event.id}::auto`, event.autoEffects);
    add(`${event.id}::content-auto`, event.content?.autoEffects);

    for (const choice of event.choices ?? []) {
      const choiceKey = choice.id ?? choice.text;
      add(`${event.id}::choice::${choiceKey}`, choice.effects);
      for (const outcome of choice.outcomes ?? []) {
        const outcomeKey = outcome.id ?? outcome.text;
        add(`${event.id}::choice::${choiceKey}::outcome::${outcomeKey}`, outcome.effects);
      }
    }
  }

  return branches;
}

function testFinalInventory(events: EventDefinition[], branches: Branch[]): void {
  assert(eventsIndexJson.imports.length === 28, `formal EventLoader file count must be 28, got ${eventsIndexJson.imports.length}`);
  assert(events.length === 412, `formal EventLoader event count must be 412, got ${events.length}`);
  assert(branches.length === 0, `formal EventLoader must have 0 legacy producer branches, got ${branches.length}`);
  assert(branches.reduce((count, branch) => count + branch.effects.length, 0) === 0, 'formal EventLoader must have 0 legacy effects');
  assert(new Set(branches.map(branch => branch.eventId)).size === 0, 'formal EventLoader must have 0 legacy producer events');
}

function findChoice(events: EventDefinition[], eventId: string, key: string): NonNullable<EventDefinition['choices']>[number] {
  const event = events.find(candidate => candidate.id === eventId);
  const choice = event?.choices?.find(candidate => candidate.id === key || candidate.text === key);
  assert(Boolean(choice), `${eventId} choice ${key} must exist`);
  return choice!;
}

function findAutoEffects(events: EventDefinition[], eventId: string): EffectDefinition[] {
  const event = events.find(candidate => candidate.id === eventId);
  assert(Boolean(event), `${eventId} must exist`);
  return event?.autoEffects ?? [];
}

function assertMartialPower(events: EventDefinition[], eventId: string, text: string, value: number): void {
  const choice = findChoice(events, eventId, text);
  assert(
    choice.effects?.filter(effect => (effect.target ?? effect.stat) === 'martialPower' && effect.value === value).length === 1,
    `${eventId} / ${text} must have exactly martialPower ${value}`,
  );
}

function assertAutoMartialPower(events: EventDefinition[], eventId: string, value: number): void {
  const effects = findAutoEffects(events, eventId);
  assert(
    effects.filter(effect => (effect.target ?? effect.stat) === 'martialPower' && effect.value === value).length === 1,
    `${eventId} auto must have exactly martialPower ${value}`,
  );
}

function assertNoMartialPower(events: EventDefinition[], eventId: string, text: string): void {
  const choice = findChoice(events, eventId, text);
  assert(
    !(choice.effects ?? []).some(effect => (effect.target ?? effect.stat) === 'martialPower'),
    `${eventId} / ${text} must not add martialPower`,
  );
}

function testMartialPowerMigrations(events: EventDefinition[]): void {
  for (const [eventId, text, value] of [
    ['origin_background', 'origin_frontier', 4],
    ['childhood_preference', 'focus_on_study', 2],
    ['childhood_preference', 'balance_both', 1],
    ['sect_choice', 'stay_home', 5],
    ['orthodox_trial_entry', 'orthodox_trial_force', 3],
    ['martial_arts_enlightenment', 'balanced_start', 2],
    ['sect_trial', 'meditate', 8],
    ['training_focus', 'focus_internal', 4],
    ['training_focus', 'focus_external', 4],
    ['career_martial_innovation', 'innovate_steady', 5],
    ['career_martial_arts_conference', '作为观众，观摩学习 (功力 +5)', 5],
    ['jianghu_hero_meeting', 'decline_meeting', 5],
    ['jianghu_hermit_master', 'learn_from_master', 15],
    ['jianghu_hermit_master', 'spar_with_master', 5],
    ['demonic_midlife_expansion', 'demonic_expand_secret_art', 8],
    ['demonic_midlife_expansion_survivor', 'demonic_expand_secret_art', 8],
    ['jianghu_year_training', 'training_internal', 3],
    ['jianghu_year_training', 'training_qinggong', 3],
    ['discover_wudang_internal_struggle', '假装不知，继续修炼', 5],
  ] as const) {
    assertMartialPower(events, eventId, text, value);
  }
  for (const [eventId, value] of [
    ['preteen_training', 2],
    ['demonic_renounce_path', 3],
    ['comprehension_breakthrough', 8],
    ['constitution_breakthrough', 8],
  ] as const) {
    assertAutoMartialPower(events, eventId, value);
  }
}

function testNoCompensationBranches(events: EventDefinition[]): void {
  for (const [eventId, text] of [
    ['sect_trial_entry', 'trial_agile'],
    ['border_trial_entry', 'border_trial_hunt'],
    ['border_trial_entry', 'border_trial_scout'],
    ['demonic_trial_shadow', 'demonic_trial_shadow_success'],
    ['independent_path', 'serve_government'],
    ['career_martial_exchange', '点到即止，彼此试探 (人脉 +8)'],
  ] as const) {
    assertNoMartialPower(events, eventId, text);
  }
  assert(
    !findAutoEffects(events, 'orthodox_trial_completion').some(effect => (effect.target ?? effect.stat) === 'martialPower'),
    'orthodox_trial_completion auto must not add martialPower',
  );
}

function testRelationshipDuplicateWrites(events: EventDefinition[]): void {
  const loader = EventLoader.getInstance();
  const disciple = loader.getEventById('relationship_master_disciple');
  const discipleChoice = disciple?.choices?.find(choice => choice.text === '拜入名门（需学识≥40）');
  const discipleLegacy = legacyEffects(discipleChoice?.effects);
  assert(discipleLegacy.length === 0, 'relationship_master_disciple must not write legacy martial fields');
  assert(
    discipleChoice?.effects?.filter(effect => (effect.target ?? effect.stat) === 'martialPower' && effect.value === 20).length === 1,
    'relationship_master_disciple must retain exactly martialPower +20',
  );

  const legacy = loader.getEventById('relationship_master_legacy');
  const legacyEffectsAfter = legacyEffects(legacy?.autoEffects);
  assert(legacyEffectsAfter.length === 0, 'relationship_master_legacy must not write legacy martial fields');
  assert(
    legacy?.autoEffects?.filter(effect => (effect.target ?? effect.stat) === 'martialPower' && effect.value === 25).length === 1,
    'relationship_master_legacy must retain exactly martialPower +25',
  );
  assert(events.includes(disciple as EventDefinition) && events.includes(legacy as EventDefinition), 'relationship events must be formally loaded');
}

const events = EventLoader.getInstance().getAllEvents();
const branches = collectBranches(events);

testFinalInventory(events, branches);
testMartialPowerMigrations(events);
testNoCompensationBranches(events);
testRelationshipDuplicateWrites(events);
console.log('canonicalMartialLegacyProducerPruning.test.ts: ok');
