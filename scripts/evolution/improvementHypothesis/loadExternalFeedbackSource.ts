import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  parseExternalFeedback,
  validateExternalFeedbackReferences,
  type ExternalFeedback,
} from '../../../src/evolution/externalFeedbackContract';
import type { ObservablePayload } from '../../../src/evolution/playerObservableTranscript';
import {
  canonicalJson,
  resolvePhase0RunPath,
  sha256Hex,
  validatePhase0RunRef,
  validatePhase0RunSeal,
} from '../phase0/provenance';

const INVOCATION_SCHEMA_VERSION = 'minimal-external-feedback-invocation-v1' as const;

export interface ExternalFeedbackSource {
  runRef: string;
  feedbackInvocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  feedbackHash: string;
  observablePayloadBytes: string;
  feedbackBytes: string;
  rawFeedbackParticipantResponse: string;
  observablePayload: ObservablePayload;
  feedback: ExternalFeedback;
}

interface SourceInvocationRecord {
  schemaVersion: typeof INVOCATION_SCHEMA_VERSION;
  runRef: string;
  invocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
  status: 'completed' | 'failed';
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function parseSourceInvocation(value: unknown): SourceInvocationRecord {
  assertObject(value, 'MEF source invocation');
  assertNonEmptyString(value.schemaVersion, 'MEF source invocation.schemaVersion');
  if (value.schemaVersion !== INVOCATION_SCHEMA_VERSION) {
    throw new Error(
      `MEF source invocation.schemaVersion must be ${INVOCATION_SCHEMA_VERSION}`,
    );
  }
  assertNonEmptyString(value.runRef, 'MEF source invocation.runRef');
  assertNonEmptyString(value.invocationRef, 'MEF source invocation.invocationRef');
  assertNonEmptyString(value.experimentRootHash, 'MEF source invocation.experimentRootHash');
  assertNonEmptyString(value.observablePayloadHash, 'MEF source invocation.observablePayloadHash');
  if (value.status !== 'completed' && value.status !== 'failed') {
    throw new Error('MEF source invocation.status must be completed or failed');
  }
  return {
    schemaVersion: INVOCATION_SCHEMA_VERSION,
    runRef: value.runRef,
    invocationRef: value.invocationRef,
    experimentRootHash: value.experimentRootHash,
    observablePayloadHash: value.observablePayloadHash,
    status: value.status,
  };
}

function assertCompletedAndMatchingRun(
  invocation: SourceInvocationRecord,
  runRef: string,
): void {
  if (invocation.runRef !== runRef) {
    throw new Error(
      `MEF source invocation.runRef mismatch: expected ${runRef}, got ${invocation.runRef}`,
    );
  }
  if (invocation.status !== 'completed') {
    throw new Error(
      `MEF source invocation status must be completed, got ${invocation.status}`,
    );
  }
}

export async function loadExternalFeedbackSource(input: {
  sourceRoot: string;
  runRef: string;
}): Promise<ExternalFeedbackSource> {
  const runRef = validatePhase0RunRef(input.runRef);
  const sourceRoot = resolve(input.sourceRoot);
  const gameRunPath = resolvePhase0RunPath(join(sourceRoot, 'game-runs'), runRef);
  const feedbackDir = resolvePhase0RunPath(join(sourceRoot, 'feedback-runs'), runRef);

  const invocation = parseSourceInvocation(
    JSON.parse(await readFile(join(feedbackDir, 'invocation.json'), 'utf8')),
  );
  assertCompletedAndMatchingRun(invocation, runRef);
  await validatePhase0RunSeal(gameRunPath, invocation.experimentRootHash);

  const phase0ObservableBytes = await readFile(
    join(gameRunPath, 'reviewer-input', 'observable-payload.json'),
    'utf8',
  );
  const feedbackObservableBytes = await readFile(
    join(feedbackDir, 'observable-payload.json'),
    'utf8',
  );
  if (feedbackObservableBytes !== phase0ObservableBytes) {
    throw new Error('MEF observable payload does not exactly match sealed Phase 0 observable payload');
  }
  if (sha256Hex(feedbackObservableBytes) !== invocation.observablePayloadHash) {
    throw new Error('MEF observable payload hash mismatch');
  }

  const observablePayload = JSON.parse(feedbackObservableBytes) as ObservablePayload;
  const feedbackBytes = await readFile(join(feedbackDir, 'feedback.json'), 'utf8');
  const rawFeedbackParticipantResponse = await readFile(
    join(feedbackDir, 'raw-participant-response.txt'),
    'utf8',
  );
  const feedback = parseExternalFeedback(feedbackBytes);
  const rawFeedback = parseExternalFeedback(rawFeedbackParticipantResponse);
  if (canonicalJson(rawFeedback) !== canonicalJson(feedback)) {
    throw new Error('MEF feedback.json does not match raw participant response');
  }
  validateExternalFeedbackReferences(feedback, observablePayload);

  return {
    runRef,
    feedbackInvocationRef: invocation.invocationRef,
    experimentRootHash: invocation.experimentRootHash,
    observablePayloadHash: invocation.observablePayloadHash,
    feedbackHash: sha256Hex(feedbackBytes),
    observablePayloadBytes: feedbackObservableBytes,
    feedbackBytes,
    rawFeedbackParticipantResponse,
    observablePayload,
    feedback,
  };
}
