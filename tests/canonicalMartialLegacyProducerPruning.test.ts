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

const EXPECTED_REMAINING_BRANCHES = [
  'origin_background::choice::origin_frontier',
  'childhood_preference::choice::focus_on_study',
  'childhood_preference::choice::balance_both',
  'preteen_training::auto',
  'sect_choice::choice::stay_home',
  'sect_trial_entry::choice::trial_agile',
  'independent_path::choice::serve_government',
  'beggars_encounter::choice::beggars_join::outcome::success',
  'border_trial_entry::choice::border_trial_hunt',
  'border_trial_entry::choice::border_trial_scout',
  'demonic_trial_shadow::choice::demonic_trial_shadow_success',
  'demonic_renounce_path::auto',
  'orthodox_trial_entry::choice::orthodox_trial_force',
  'orthodox_trial_completion::auto',
  'martial_arts_enlightenment::choice::balanced_start',
  'sect_trial::choice::meditate',
  'training_focus::choice::focus_internal',
  'training_focus::choice::focus_external',
  'comprehension_breakthrough::auto',
  'constitution_breakthrough::auto',
  'career_martial_innovation::choice::innovate_steady',
  'career_martial_arts_conference::choice::作为观众，观摩学习 (外功 +5, 内功 +5)',
  'career_martial_exchange::choice::点到即止，彼此试探 (人脉 +8, 内功 +3)',
  'jianghu_hero_meeting::choice::decline_meeting',
  'jianghu_hermit_master::choice::learn_from_master',
  'jianghu_hermit_master::choice::spar_with_master',
  'demonic_midlife_expansion::choice::demonic_expand_secret_art',
  'demonic_midlife_expansion_survivor::choice::demonic_expand_secret_art',
  'jianghu_year_training::choice::training_internal',
  'jianghu_year_training::choice::training_qinggong',
  'outlaw_path_beginning::choice::加入幽影门',
  'outlaw_training::choice::专注实战技巧',
  'outlaw_training::choice::专注内功心法',
  'outlaw_mentor::choice::拜他为师',
  'discover_wudang_internal_struggle::choice::假装不知，继续修炼',
] as const;

function testInventoryBaseline(events: EventDefinition[], branches: Branch[]): void {
  assert(eventsIndexJson.imports.length === 29, `formal EventLoader file count must be 29, got ${eventsIndexJson.imports.length}`);
  assert(events.length === 425, `formal EventLoader event count must be 425, got ${events.length}`);
  assert(branches.length === 89, `pre-change producer branch count must be 89, got ${branches.length}`);
  assert(
    branches.reduce((count, branch) => count + branch.effects.length, 0) === 111,
    'pre-change legacy effect count must be 111',
  );
  assert(new Set(branches.map(branch => branch.eventId)).size === 57, 'pre-change producer event count must be 57');
}

function testRemainingWhitelist(branches: Branch[]): void {
  const actual = branches.map(branch => branch.key).sort();
  const expected = [...EXPECTED_REMAINING_BRANCHES].sort();
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `remaining producer branches must match the 35-branch whitelist; actual=${actual.join('|')}; expected=${expected.join('|')}`,
  );
  assert(branches.length === 35, `post-change producer branch count must be 35, got ${branches.length}`);
  assert(
    branches.reduce((count, branch) => count + branch.effects.length, 0) === 46,
    'post-change legacy effect count must be 46',
  );
  assert(new Set(branches.map(branch => branch.eventId)).size === 29, 'post-change producer event count must be 29');
}

function testRelationshipDuplicateWrites(events: EventDefinition[]): void {
  const loader = EventLoader.getInstance();
  const disciple = loader.getEventById('relationship_master_disciple');
  const discipleChoice = disciple?.choices?.find(choice => choice.text === '拜入名门（需悟性≥40）');
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

function testFiveDeferredBranchesRemain(branches: Branch[]): void {
  const byKey = new Map(branches.map(branch => [branch.key, branch]));
  for (const [key, expected] of [
    ['outlaw_path_beginning::choice::加入幽影门', [['externalSkill', 3]]],
    ['outlaw_training::choice::专注实战技巧', [['externalSkill', 5]]],
    ['outlaw_training::choice::专注内功心法', [['internalSkill', 5]]],
    ['outlaw_mentor::choice::拜他为师', [['internalSkill', 8]]],
    ['discover_wudang_internal_struggle::choice::假装不知，继续修炼', [['internalSkill', 8]]],
  ] as const) {
    const branch = byKey.get(key);
    assert(Boolean(branch), `${key} must remain in the M3B whitelist`);
    for (const [target, value] of expected) {
      assert(
        hasStatEffect(branch?.effects, target, value),
        `${key} must retain ${target} ${value}`,
      );
    }
  }
}

const events = EventLoader.getInstance().getAllEvents();
const branches = collectBranches(events);

if (branches.length === 89) {
  testInventoryBaseline(events, branches);
  assert(false, 'RED: baseline inventory confirmed; producer pruning is not implemented yet');
} else {
  testRemainingWhitelist(branches);
  testRelationshipDuplicateWrites(events);
  testFiveDeferredBranchesRemain(branches);
  console.log('canonicalMartialLegacyProducerPruning.test.ts: ok');
}
