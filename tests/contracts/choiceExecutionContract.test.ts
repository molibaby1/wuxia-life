/**
 * P4 US-010: Choice execution contract fixture tests.
 */

import { assert, assertDeepEqual } from '../GameTestFramework';
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

  console.log('✓ choice execution fixtures serialize and validate');
}

console.log('\n✅ All choice execution fixture tests passed');
