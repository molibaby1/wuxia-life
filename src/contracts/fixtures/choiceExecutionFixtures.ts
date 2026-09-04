/**
 * Choice execution contract fixtures (P4 US-010).
 *
 * @see docs/contracts/choice-execution-request-contract.md
 * @see docs/contracts/choice-execution-response-contract.md
 */

import { EffectType } from '../../types/eventTypes';
import {
  CHOICE_EXECUTION_REQUEST_VERSION,
  CHOICE_EXECUTION_RESPONSE_VERSION,
  type ChoiceExecutionFailureResponse,
  type ChoiceExecutionRequest,
  type ChoiceExecutionSuccessResponse,
} from '../choiceExecution';
import { gameStateSnapshotAge50 } from './gameStateSnapshotAge50';

export const choiceExecutionRequestValid: ChoiceExecutionRequest = {
  requestVersion: CHOICE_EXECUTION_REQUEST_VERSION,
  snapshotRef: {
    snapshotId: gameStateSnapshotAge50.metadata.snapshotId,
    snapshot: gameStateSnapshotAge50,
  },
  action: {
    eventId: 'age50_reflection_01',
    choiceId: 'reflect_on_legacy',
    outcomeId: 'legacy_peaceful',
    playerInput: { kind: 'confirm', value: true },
  },
  randomContext: {
    seed: 'fixture-seed-1717203600000',
    sequence: 42,
  },
  clientMetadata: {
    platform: 'web-browser',
    clientVersion: '0.0.0',
    traceId: 'trace_fixture_choice_001',
    submittedAt: 1717203601000,
  },
};

export const choiceExecutionSuccessResponseValid: ChoiceExecutionSuccessResponse = {
  responseVersion: CHOICE_EXECUTION_RESPONSE_VERSION,
  status: 'success',
  traceId: 'trace_fixture_choice_001',
  nextSnapshot: {
    ...gameStateSnapshotAge50,
    metadata: {
      ...gameStateSnapshotAge50.metadata,
      updatedAt: 1717203602000,
    },
    state: {
      ...gameStateSnapshotAge50.state,
      lastSavedAt: 1717203602000,
      eventHistory: [
        ...gameStateSnapshotAge50.state.eventHistory,
        {
          eventId: 'age50_reflection_01',
          age: 50,
          timestamp: { year: 50, month: 3, day: 16 },
          selectedChoice: 'reflect_on_legacy',
          appliedEffects: [
            {
              type: EffectType.FLAG_SET,
              flag: 'legacy_reflected',
              target: 'player',
              value: true,
            },
          ],
        },
      ],
      flags: {
        ...gameStateSnapshotAge50.state.flags,
        legacy_reflected: true,
      },
    },
  },
  feedback: {
    player: {
      narrativeResult: '你静观一生起伏，心中澄明，侠名与亲情皆已安放。',
      statImpacts: [
        {
          stat: 'chivalry',
          delta: 2,
          visibility: 'player',
          label: '侠义',
        },
      ],
      relationshipImpacts: [
        {
          relationId: 'spouse_lin',
          relationName: '林婉儿',
          delta: 3,
          visibility: 'player',
        },
      ],
      routeImpact: null,
      longTermFlags: [
        {
          flag: 'legacy_reflected',
          value: true,
          reason: 'midlife_reflection',
          visibility: 'player',
        },
      ],
      riskHints: [],
    },
    diagnostic: {
      sourceEventId: 'age50_reflection_01',
      sourceChoiceId: 'reflect_on_legacy',
      sourceOutcomeId: 'legacy_peaceful',
      rawEffects: [
        {
          type: EffectType.FLAG_SET,
          flag: 'legacy_reflected',
          target: 'player',
          value: true,
        },
      ],
    },
  },
  append: {
    eventHistory: [
      {
        eventId: 'age50_reflection_01',
        age: 50,
        timestamp: { year: 50, month: 3, day: 16 },
        selectedChoice: 'reflect_on_legacy',
      },
    ],
    generatedLogs: ['沈无名在武当后山静思，江湖往事如潮水般涌来。'],
  },
  deltas: {
    relationshipChanges: [{ relationId: 'spouse_lin', delta: 3 }],
    lifeMemoryInputs: {
      flags: { legacy_reflected: true },
    },
  },
  hints: {
    nextEventIds: ['age51_transition_01'],
    autoAdvance: false,
  },
  diagnostics: {
    engineVersion: '0.0.0',
    eventCatalogVersion: '1.0.0',
    snapshotHashBefore: 'sha256:fixture_before',
    snapshotHashAfter: 'sha256:fixture_after',
    executionMs: 12,
  },
};

export const choiceExecutionFailureResponseValidation: ChoiceExecutionFailureResponse = {
  responseVersion: CHOICE_EXECUTION_RESPONSE_VERSION,
  status: 'failure',
  traceId: 'trace_fixture_choice_fail_001',
  error: {
    code: 'CHOICE_NOT_FOUND',
    message: '该选项已不可用，请刷新后重试。',
    details: 'choiceId "invalid_choice" not found on event "age50_reflection_01"',
    field: 'action.choiceId',
  },
  diagnostics: {
    engineVersion: '0.0.0',
    eventCatalogVersion: '1.0.0',
    snapshotHashBefore: 'sha256:fixture_before',
  },
};

export function serializeChoiceExecutionFixtures(): {
  request: string;
  success: string;
  failure: string;
} {
  return {
    request: JSON.stringify(choiceExecutionRequestValid),
    success: JSON.stringify(choiceExecutionSuccessResponseValid),
    failure: JSON.stringify(choiceExecutionFailureResponseValidation),
  };
}
