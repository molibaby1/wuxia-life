import fs from 'node:fs';
import path from 'node:path';
import { assert, assertDeepEqual } from './GameTestFramework';
import { EndingSystem } from '../src/core/EndingSystem';
import { EventLoader } from '../src/core/EventLoader';

const LEGACY_MARTIAL_FIELDS = ['externalSkill', 'internalSkill', 'qinggong'] as const;

function assertNoLegacyConditionFields(value: unknown, context: string): void {
  if (typeof value === 'string') {
    for (const field of LEGACY_MARTIAL_FIELDS) {
      assert(!value.includes(field), `${context} must not read ${field}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoLegacyConditionFields(item, `${context}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, nested]) => {
      assertNoLegacyConditionFields(nested, `${context}.${key}`);
    });
  }
}

function assertEventConditionsUseCanonicalMartialState(): void {
  for (const event of EventLoader.getInstance().getAllEvents()) {
    assertNoLegacyConditionFields(event.conditions, `${event.id}.conditions`);
    for (const choice of event.choices ?? []) {
      assertNoLegacyConditionFields(choice.condition, `${event.id}.${choice.id}.condition`);
      assertNoLegacyConditionFields(choice.conditions, `${event.id}.${choice.id}.conditions`);
      for (const outcome of choice.outcomes ?? []) {
        assertNoLegacyConditionFields(outcome.condition, `${event.id}.${choice.id}.${outcome.id}.condition`);
        assertNoLegacyConditionFields(outcome.conditions, `${event.id}.${choice.id}.${outcome.id}.conditions`);
      }
    }
  }
}

function testSectChoiceAndSetbackConditions(): void {
  const loader = EventLoader.getInstance();
  const sectChoice = loader.getEventById('sect_choice');
  assert(Boolean(sectChoice), 'sect_choice must be in the formal event pool');

  const choices = new Map((sectChoice?.choices ?? []).map(choice => [choice.id, choice]));
  for (const choiceId of ['join_shaolin', 'join_wudang'] as const) {
    const choice = choices.get(choiceId);
    assert(Boolean(choice), `sect_choice must contain ${choiceId}`);
    assertNoLegacyConditionFields(choice?.condition, `sect_choice.${choiceId}.condition`);
    for (const outcome of choice?.outcomes ?? []) {
      assertNoLegacyConditionFields(outcome.condition, `sect_choice.${choiceId}.${outcome.id}.condition`);
    }
    assert(
      ['great_success', 'success', 'partial'].every(id => choice?.outcomes?.some(outcome => outcome.id === id)),
      `${choiceId} must retain all outcome branches`,
    );
  }

  const setback = loader.getEventById('setback_cultivation_deviation');
  assert(Boolean(setback), 'setback_cultivation_deviation must be in the formal event pool');
  const setbackConditions = JSON.stringify(setback?.conditions ?? []);
  assert(setbackConditions.includes('trainingHabit'), 'cultivation deviation must require trainingHabit');
  assert(setbackConditions.includes('martialPower'), 'cultivation deviation must require martialPower');
  assert(setbackConditions.includes('constitution'), 'cultivation deviation must require constitution');
  assert(!setbackConditions.includes('internalSkill'), 'cultivation deviation must not require internalSkill');
}

function testCanonicalEndings(): void {
  const martialGod = EndingSystem.getEndingById('martial_god');
  assert(Boolean(martialGod), 'martial_god must remain an active Ending');
  assertDeepEqual(
    martialGod?.requirements,
    { martialPower: 95, age: 68 },
    'martial_god must only require canonical martial power and age',
  );
  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(!JSON.stringify(martialGod?.requirements).includes(field), `martial_god must not require ${field}`);
  }
  assert(!EndingSystem.getEndingById('heavenly_immortal'), 'heavenly_immortal must not be an active Ending');

  assert(!fs.existsSync(path.resolve('src/core/IdentitySystem.ts')), 'generic IdentitySystem must be deleted');
  const endingSource = fs.readFileSync(path.resolve('src/core/EndingSystem.ts'), 'utf8');
  assert(!endingSource.includes('heavenly_immortal'), 'Ending production references must not name heavenly_immortal');
  for (const field of LEGACY_MARTIAL_FIELDS) {
    assert(!endingSource.includes(`${field}?:`), `Ending requirements must not expose ${field}`);
    assert(!endingSource.includes(`${field}: player.${field}`), `Ending evaluator must not copy ${field}`);
  }
}

function testSpecializationSchedulingIsRemoved(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  for (const helper of ['getSpecializationMultiplier', 'getFocusScores', 'getEventFocus']) {
    assert(!source.includes(helper), `${helper} must be removed from production scheduling`);
  }
}

assertEventConditionsUseCanonicalMartialState();
testSectChoiceAndSetbackConditions();
testCanonicalEndings();
testSpecializationSchedulingIsRemoved();
console.log('canonicalMartialLegacyConsumerRemoval.test.ts: ok');
