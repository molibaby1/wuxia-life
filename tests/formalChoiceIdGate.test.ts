import assert from 'node:assert/strict';
import { eventLoader, collectChoiceIdValidationErrors } from '../src/core/EventLoader';
import type { EventDefinition } from '../src/types/eventTypes';

function fixtureEvent(id: string, choiceIds: unknown[]): EventDefinition {
  return {
    id,
    name: id,
    description: id,
    version: '1.0.0',
    category: 'family',
    priority: 1,
    weight: 1,
    ageRange: { min: 1, max: 1 },
    type: 'family',
    eventType: 'choice',
    tags: [],
    storyLine: 'fixture',
    triggers: [],
    triggerConditions: null,
    conditions: null,
    content: { title: id, text: id },
    choices: choiceIds.map(choiceId => ({
      id: choiceId,
      text: 'fixture choice',
      effects: [{ type: 'status_add', status: 'anxious' }],
    })) as EventDefinition['choices'],
  };
}

export function runFormalChoiceIdGateTests(): void {
  const fixtureErrors = collectChoiceIdValidationErrors([
    fixtureEvent('missing_choice_id', [undefined]),
    fixtureEvent('blank_choice_id', ['   ']),
    fixtureEvent('duplicate_choice_id', ['shared_choice', 'shared_choice']),
  ]);

  assert.equal(fixtureErrors.filter(error => error.includes('缺少有效 ID')).length, 2);
  assert.equal(fixtureErrors.filter(error => error.includes('choice.id') && error.includes('重复')).length, 1);

  const repositoryErrors = collectChoiceIdValidationErrors(eventLoader.getAllEvents());
  assert.deepEqual(repositoryErrors, []);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runFormalChoiceIdGateTests();
  console.log('formalChoiceIdGate.test.ts: ok');
}
