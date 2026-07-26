/**
 * P4 US-023: Contract validation helper tests.
 */

import { assert } from '../GameTestFramework';
import { CHOICE_EXECUTION_RESPONSE_VERSION } from '../../src/contracts/choiceExecution';
import {
  eventCatalogBundleFixture,
  eventCatalogSummaryFixture,
} from '../../src/contracts/fixtures/eventCatalogFixtures';
import { gameStateSnapshotAge50 } from '../../src/contracts/fixtures/gameStateSnapshotAge50';
import {
  choiceExecutionFailureResponseValidation,
  choiceExecutionRequestValid,
  choiceExecutionSuccessResponseValid,
} from '../../src/contracts/fixtures/choiceExecutionFixtures';
import { replayLogAge50 } from '../../src/contracts/fixtures/replayLogAge50';
import {
  validateChoiceExecutionRequest,
  validateChoiceExecutionResponse,
  validateEventCatalogBundle,
  validateEventCatalogSummary,
  validateGameStateSnapshot,
  validatePlayerLifeStates,
  validateReplayLog,
} from '../../src/contracts/validation/contractValidation';

console.log('=== P4 US-023: Contract Validation Helper Tests ===\n');

{
  const result = validateGameStateSnapshot(gameStateSnapshotAge50);
  assert(result.ok, `valid snapshot: ${!result.ok ? result.errors.join(', ') : ''}`);

  const bad = { ...gameStateSnapshotAge50, state: { ...gameStateSnapshotAge50.state, statistics: {} } };
  const badResult = validateGameStateSnapshot(bad);
  assert(!badResult.ok && badResult.errors.some((e) => e.includes('statistics')), 'forbidden field detected');

  const missingPlayerField = {
    ...gameStateSnapshotAge50,
    state: {
      ...gameStateSnapshotAge50.state,
      player: {
        ...gameStateSnapshotAge50.state.player,
        name: '',
      },
    },
  };
  const playerResult = validateGameStateSnapshot(missingPlayerField);
  assert(
    !playerResult.ok && playerResult.errors.some((e) => e.includes('state.player.name')),
    'snapshot player required field detected',
  );
  console.log('✓ snapshot validation helper');
}

{
  const validLifeStates = gameStateSnapshotAge50.state.player.lifeStates!;
  assert(validatePlayerLifeStates(validLifeStates).ok, 'valid five-key lifeStates passes');

  const invalidCases: Array<[string, (lifeStates: any) => void]> = [
    ['discipline', lifeStates => { lifeStates.discipline = 1; }],
    ['indulgence', lifeStates => { lifeStates.indulgence = 1; }],
    ['missing trainingHabit', lifeStates => { delete lifeStates.trainingHabit; }],
    ['unknown extraState', lifeStates => { lifeStates.extraState = 1; }],
    ['trainingHabit -1', lifeStates => { lifeStates.trainingHabit = -1; }],
    ['trainingHabit 6', lifeStates => { lifeStates.trainingHabit = 6; }],
    ['trainingHabit NaN', lifeStates => { lifeStates.trainingHabit = Number.NaN; }],
    ['trainingHabit Infinity', lifeStates => { lifeStates.trainingHabit = Number.POSITIVE_INFINITY; }],
    ['trainingHabit string', lifeStates => { lifeStates.trainingHabit = '2'; }],
  ];
  for (const [name, mutate] of invalidCases) {
    const lifeStates = JSON.parse(JSON.stringify(validLifeStates));
    mutate(lifeStates);
    const result = validatePlayerLifeStates(lifeStates);
    assert(!result.ok, `${name} must be rejected`);
    const snapshot = JSON.parse(JSON.stringify(gameStateSnapshotAge50));
    snapshot.state.player.lifeStates = lifeStates;
    assert(!validateGameStateSnapshot(snapshot).ok, `${name} snapshot must be rejected`);
  }
  assert(!validatePlayerLifeStates([]).ok, 'array lifeStates must be rejected');
  console.log('✓ player lifeStates validation helper');
}

{
  assert(validateChoiceExecutionRequest(choiceExecutionRequestValid).ok, 'valid request passes');
  const bad = { ...choiceExecutionRequestValid, action: { eventId: 'x' } };
  const badResult = validateChoiceExecutionRequest(bad);
  assert(!badResult.ok, 'invalid request fails');
  console.log('✓ choice request validation helper');
}

{
  assert(validateChoiceExecutionResponse(choiceExecutionSuccessResponseValid).ok, 'valid success passes');
  assert(validateChoiceExecutionResponse(choiceExecutionFailureResponseValidation).ok, 'valid failure passes');

  const missingSuccessFields = {
    responseVersion: CHOICE_EXECUTION_RESPONSE_VERSION,
    status: 'success',
    nextSnapshot: choiceExecutionSuccessResponseValid.nextSnapshot,
    feedback: choiceExecutionSuccessResponseValid.feedback,
  };
  const missingSuccessResult = validateChoiceExecutionResponse(missingSuccessFields);
  assert(!missingSuccessResult.ok, 'missing success payload sections should fail');
  assert(
    missingSuccessResult.errors.some((e) => e.includes('append required')),
    'missing append detected',
  );
  assert(
    missingSuccessResult.errors.some((e) => e.includes('deltas required')),
    'missing deltas detected',
  );
  assert(
    missingSuccessResult.errors.some((e) => e.includes('hints required')),
    'missing hints detected',
  );
  assert(
    missingSuccessResult.errors.some((e) => e.includes('diagnostics required')),
    'missing diagnostics detected',
  );

  const badNestedSnapshot = {
    ...choiceExecutionSuccessResponseValid,
    nextSnapshot: {
      ...choiceExecutionSuccessResponseValid.nextSnapshot,
      state: {
        ...choiceExecutionSuccessResponseValid.nextSnapshot.state,
        player: {
          ...choiceExecutionSuccessResponseValid.nextSnapshot.state.player,
          alive: null,
        },
      },
    },
  };
  const badNestedSnapshotResult = validateChoiceExecutionResponse(badNestedSnapshot);
  assert(
    !badNestedSnapshotResult.ok &&
      badNestedSnapshotResult.errors.some((e) => e.includes('nextSnapshot.state.player.alive')),
    'nested nextSnapshot validation detected',
  );
  console.log('✓ choice response validation helper');
}

{
  assert(validateReplayLog(replayLogAge50).ok, 'valid replay log passes');
  const bad = JSON.parse(JSON.stringify(replayLogAge50));
  delete bad.metadata.initialSeed;
  assert(!validateReplayLog(bad).ok, 'missing replay metadata fails');

  const badSequence = JSON.parse(JSON.stringify(replayLogAge50));
  badSequence.entries[1].sequence = badSequence.entries[0].sequence;
  const badSequenceResult = validateReplayLog(badSequence);
  assert(
    !badSequenceResult.ok && badSequenceResult.errors.some((e) => e.includes('sequence')),
    'sequence ordering check works',
  );

  const badHashChain = JSON.parse(JSON.stringify(replayLogAge50));
  badHashChain.entries[2].snapshotHashBefore = 'sha256:broken_chain';
  const badHashChainResult = validateReplayLog(badHashChain);
  assert(
    !badHashChainResult.ok &&
      badHashChainResult.errors.some((e) => e.includes('snapshotHashBefore must match previous')),
    'hash chain continuity check works',
  );

  const badRandomOrder = JSON.parse(JSON.stringify(replayLogAge50));
  badRandomOrder.entries[4].randomDrawIndex = 2;
  const badRandomOrderResult = validateReplayLog(badRandomOrder);
  assert(
    !badRandomOrderResult.ok &&
      badRandomOrderResult.errors.some((e) => e.includes('randomDrawIndex must be strictly increasing')),
    'randomDrawIndex monotonicity check works',
  );

  const withPostTerminal = JSON.parse(JSON.stringify(replayLogAge50));
  withPostTerminal.entries.push({
    ...withPostTerminal.entries[0],
    sequence: 99,
    actionType: 'choice',
    eventId: 'after_terminal',
    choiceId: 'invalid_append',
    snapshotHashBefore: withPostTerminal.entries[withPostTerminal.entries.length - 1].snapshotHashAfter,
    snapshotHashAfter: 'sha256:after_terminal',
  });
  const withPostTerminalResult = validateReplayLog(withPostTerminal);
  assert(
    !withPostTerminalResult.ok &&
      withPostTerminalResult.errors.some((e) => e.includes('must not exist after terminal')),
    'terminal tail append check works',
  );
  console.log('✓ replay validation helper');
}

{
  assert(validateEventCatalogBundle(eventCatalogBundleFixture).ok, 'valid catalog bundle passes');
  assert(validateEventCatalogSummary(eventCatalogSummaryFixture).ok, 'valid catalog summary passes');

  const badBundle = {
    ...eventCatalogBundleFixture,
    metadata: {
      ...eventCatalogBundleFixture.metadata,
      catalogVersion: '',
    },
    events: [{ ...eventCatalogBundleFixture.events[0], eventId: '' }],
  };
  const badBundleResult = validateEventCatalogBundle(badBundle);
  assert(
    !badBundleResult.ok &&
      badBundleResult.errors.some((e) => e.includes('metadata.catalogVersion required')),
    'catalog metadata required field check works',
  );
  assert(
    !badBundleResult.ok && badBundleResult.errors.some((e) => e.includes('events[0].eventId required')),
    'catalog event entry required field check works',
  );

  const badSummary = {
    ...eventCatalogSummaryFixture,
    misfitEventIds: null,
  };
  const badSummaryResult = validateEventCatalogSummary(badSummary);
  assert(
    !badSummaryResult.ok &&
      badSummaryResult.errors.some((e) => e.includes('misfitEventIds must be an array')),
    'catalog summary array checks work',
  );
  console.log('✓ event catalog validation helper');
}

console.log('\n✅ All contract validation helper tests passed');
