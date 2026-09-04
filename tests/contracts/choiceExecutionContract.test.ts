/**
 * P4 US-010: Choice execution contract fixture tests.
 */

import { assert, assertDeepEqual, assertEqual } from '../GameTestFramework';
import { generateChoiceFeedback } from '../../src/core/ChoiceFeedbackGenerator';
import { buildChoiceFeedbackOverlayCard } from '../../src/types/progressionOverlay';
import {
  choiceExecutionFailureResponseValidation,
  choiceExecutionRequestValid,
  choiceExecutionSuccessResponseValid,
  serializeChoiceExecutionFixtures,
} from '../../src/contracts/fixtures/choiceExecutionFixtures';

console.log('=== P4 US-010: Choice Execution Contract Fixture Tests ===\n');

{
  const { request, success, failure } = serializeChoiceExecutionFixtures();
  assert(request.length > 0 && success.length > 0 && failure.length > 0, 'fixtures serialize to JSON');

  const parsedRequest = JSON.parse(request);
  assertDeepEqual(parsedRequest, choiceExecutionRequestValid, 'request fixture round-trips');

  const parsedSuccess = JSON.parse(success);
  assertDeepEqual(parsedSuccess, choiceExecutionSuccessResponseValid, 'success fixture round-trips');

  const parsedFailure = JSON.parse(failure);
  assertDeepEqual(parsedFailure, choiceExecutionFailureResponseValidation, 'failure fixture round-trips');

  assert(parsedRequest.action.eventId.length > 0, 'request has eventId');
  assert(parsedSuccess.status === 'success', 'success fixture has success status');
  assert(parsedFailure.status === 'failure', 'failure fixture has failure status');
  assert(parsedFailure.error.code.length > 0, 'failure fixture has error code');

  assertEqual(String(parsedSuccess.responseVersion), '2.0.0', 'response contract is v2');
  assertEqual(
    parsedSuccess.feedback.player.narrativeResult,
    choiceExecutionSuccessResponseValid.feedback.player.narrativeResult,
    'explicit narrative remains in the player feedback',
  );
  console.log('✓ choice execution fixtures serialize and validate');
}

{
  const explicit = generateChoiceFeedback({
    narrativeResult: '  明确的结果叙事  ',
    effects: [],
  });
  assertEqual(explicit.player.narrativeResult, '明确的结果叙事', 'explicit narrative is normalized');

  const missing = generateChoiceFeedback({
    narrativeResult: '   ',
    effects: [],
  });
  assertEqual(
    missing.player.narrativeResult as string | null,
    null,
    'blank narrative is a successful null result',
  );
  assert(!('fallbackUsed' in missing.diagnostic), 'missing narrative has no fallback provenance');
  assert(!('fallbackReason' in missing.diagnostic), 'missing narrative has no fallback reason');

  const card = buildChoiceFeedbackOverlayCard(
    'choice-result',
    '阶段标题',
    '已选择的选项',
    missing,
    ['已选择的选项', '选项说明不应进入结果正文'],
  );
  assert(card !== null, 'null narrative still produces a result card');
  assert(card?.body === undefined, 'null narrative produces no overlay body');
  assert(card?.metaLines?.includes('选择：已选择的选项') === true, 'selected choice remains visible');
}

console.log('\n✅ All choice execution fixture tests passed');
