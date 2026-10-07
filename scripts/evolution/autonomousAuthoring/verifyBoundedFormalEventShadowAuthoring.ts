import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { EventLoader, collectChoiceIdValidationErrors } from '../../../src/core/EventLoader';
import {
  BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS,
  BOUNDED_FORMAL_EVENT_PRODUCTION_PATH,
  BOUNDED_FORMAL_EVENT_TEST_PATH,
  eventConditionsPassForHabitState,
  validateBoundedFormalEventPayload,
  type BoundedFormalEventV1,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import {
  validateBoundedFormalEventProposalV2,
  validateBoundedFormalEventReviewAssessmentV2,
} from '../../../src/evolution/boundedFormalEventProposalContract';
import {
  validateBoundedFormalEventAdmissionV2,
  type BoundedFormalEventAdmissionV2,
} from '../../../src/evolution/boundedFormalEventAdmissionContract';
import { validateAuthoringRequirementV1 } from '../../../src/evolution/authoringRequirementContract';
import {
  validateBoundedFormalEventShadowExecutionV1,
  type BoundedFormalEventShadowExecutionV1,
} from '../../../src/evolution/boundedFormalEventShadowExecutionContract';
import type { EventDefinition } from '../../../src/types/eventTypes';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  captureWorkspaceSnapshot,
} from '../problemAgnosticSolution/agentWorkspace';
import { compareWorkspaceSnapshots, type CanonicalWorkspaceChange } from './workspaceChangeSet';

export interface BoundedFormalEventShadowVerificationV2 {
  terminalStatus: 'SHADOW_AUTHORING_VERIFIED';
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string;
  executionResultSha256: string | null;
  canonicalChanges: CanonicalWorkspaceChange[];
  eventId: string;
  checks: {
    exactContractIdentity: 'PASS';
    exactWriteSurface: 'PASS';
    exactlyOneEvent: 'PASS';
    appendOnlyCatalog: 'PASS';
    appendOnlyFocusedTest: 'PASS';
    uniqueEventId: 'PASS';
    eventLoaderShape: 'PASS';
    conditionEvaluator: 'PASS';
    effectAllowlist: 'PASS';
    bothHabitConditions: 'PASS';
    focusedTest: 'PASS';
    authoritativeFingerprintUnchanged: 'PASS';
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readEventArray(root: string, path: string): Promise<unknown[]> {
  const parsed = JSON.parse(await readFile(join(root, path), 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error(`${path} must contain an Event array`);
  return parsed;
}

function eventIds(events: readonly unknown[]): string[] {
  return events.flatMap(event => isRecord(event) && typeof event.id === 'string' ? [event.id] : []);
}

function assertExactChangedPaths(changes: readonly CanonicalWorkspaceChange[]): void {
  const changedPaths = changes.map(change => change.path).sort();
  const allowed = [...BOUNDED_FORMAL_EVENT_ALLOWED_WRITE_PATHS].sort();
  if (JSON.stringify(changedPaths) !== JSON.stringify(allowed)) {
    throw new Error(`Formal Event shadow changed paths must be exactly ${allowed.join(', ')}; got ${changedPaths.join(', ')}`);
  }
  if (changes.some(change => change.changeType !== 'MODIFIED')) {
    throw new Error('Formal Event shadow may only append to existing production and focused-test files');
  }
}

function appendOnly(before: string, after: string, path: string): string {
  if (!after.startsWith(before)) throw new Error(`${path} must preserve its complete original content and append only`);
  const appended = after.slice(before.length);
  if (appended.trim().length === 0) throw new Error(`${path} must contain a non-empty appended regression block`);
  return appended;
}

function assertBothHabitPredicates(event: BoundedFormalEventV1): void {
  if (!eventConditionsPassForHabitState(event, { trainingHabit: 2, businessHabit: 2 })) {
    throw new Error('Formal Event condition rejects the state satisfying both Habit predicates');
  }
  if (eventConditionsPassForHabitState(event, { trainingHabit: 2, businessHabit: 0 })) {
    throw new Error('Formal Event condition allows training without business Habit');
  }
  if (eventConditionsPassForHabitState(event, { trainingHabit: 0, businessHabit: 2 })) {
    throw new Error('Formal Event condition allows business without training Habit');
  }
}

export async function verifyBoundedFormalEventShadowAuthoring(input: {
  authoritativeRoot: string;
  shadowRoot: string;
  requirement: unknown;
  proposal: unknown;
  review: unknown;
  admission: unknown;
  executionResult?: unknown;
  focusedTestExitCode: number;
  existingEventIds?: readonly string[];
}): Promise<BoundedFormalEventShadowVerificationV2> {
  const authoritativeRoot = resolve(input.authoritativeRoot);
  const shadowRoot = resolve(input.shadowRoot);
  const requirement = validateAuthoringRequirementV1(input.requirement);
  const baselineEvents = await readEventArray(authoritativeRoot, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH);
  const baselineIds = [
    ...new Set([
      ...(input.existingEventIds ?? EventLoader.getInstance().getAllEvents().map(event => event.id)),
      ...eventIds(baselineEvents),
    ]),
  ];
  const proposal = validateBoundedFormalEventProposalV2(input.proposal, baselineIds);
  const review = validateBoundedFormalEventReviewAssessmentV2(input.review);
  const admission = validateBoundedFormalEventAdmissionV2(input.admission) as BoundedFormalEventAdmissionV2;
  const executionResult: BoundedFormalEventShadowExecutionV1 | null = input.executionResult === undefined
    ? null
    : validateBoundedFormalEventShadowExecutionV1(input.executionResult);
  if (admission.status !== 'ELIGIBLE') throw new Error('Formal Event shadow verification requires ELIGIBLE Host admission');
  if (canonicalJson(proposal.requirement) !== canonicalJson(requirement)) throw new Error('Formal Event shadow Requirement does not match the admitted proposal');
  if (proposal.applicabilityClaim !== 'APPLICABLE' || !proposal.contractPayload) throw new Error('Formal Event shadow proposal must be APPLICABLE and contain one Event');
  if (review.reviewerRef === proposal.proposedBy) throw new Error('Formal Event review must be independent of the proposal author');
  if (
    admission.requirementSha256 !== sha256Hex(canonicalJson(requirement))
    || admission.proposalSha256 !== sha256Hex(canonicalJson(proposal))
    || admission.reviewSha256 !== sha256Hex(canonicalJson(review))
  ) throw new Error('Formal Event admission does not bind the current Requirement, proposal, and review');
  if (executionResult && (
    executionResult.requirementSha256 !== admission.requirementSha256
    || executionResult.proposalSha256 !== admission.proposalSha256
    || executionResult.reviewSha256 !== admission.reviewSha256
    || executionResult.admissionSha256 !== sha256Hex(canonicalJson(admission))
    || executionResult.authoritativeFingerprintBefore !== admission.authoritativeFingerprintBefore
    || executionResult.eventId !== proposal.contractPayload?.events[0]?.id
  )) throw new Error('Formal Event execution result does not bind the admitted proposal and authoritative baseline');

  const authoritativeBefore = await captureWorkspaceSnapshot(authoritativeRoot);
  if (authoritativeBefore.fingerprintSha256 !== admission.authoritativeFingerprintBefore) {
    throw new Error('Authoritative repository fingerprint changed after Host admission');
  }
  const shadowAfter = await captureWorkspaceSnapshot(shadowRoot);
  if (executionResult && (
    executionResult.shadowBaselineFingerprint !== authoritativeBefore.fingerprintSha256
    || executionResult.shadowFingerprintAfter !== shadowAfter.fingerprintSha256
  )) throw new Error('Formal Event execution result does not match the verified shadow workspace snapshots');
  const changes = compareWorkspaceSnapshots(authoritativeBefore, shadowAfter);
  assertExactChangedPaths(changes);
  if (executionResult && JSON.stringify(
    [...executionResult.canonicalChangedFileRefs].sort(),
  ) !== JSON.stringify(changes.map(change => change.path).sort())) {
    throw new Error('Formal Event execution result changed paths do not match the verifier snapshot');
  }

  const beforeCatalog = baselineEvents;
  const afterCatalog = await readEventArray(shadowRoot, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH);
  if (afterCatalog.length !== beforeCatalog.length + 1) {
    throw new Error('Formal Event shadow must append exactly one Event to the production catalog');
  }
  if (canonicalJson(afterCatalog.slice(0, beforeCatalog.length)) !== canonicalJson(beforeCatalog)) {
    throw new Error('Formal Event shadow must preserve every existing production catalog entry');
  }

  const payload = validateBoundedFormalEventPayload(proposal.contractPayload, requirement, baselineIds);
  const event = payload.events[0];
  const candidate = afterCatalog[afterCatalog.length - 1];
  if (canonicalJson(candidate) !== canonicalJson(event)) {
    throw new Error('The appended catalog Event does not exactly match the reviewed proposal');
  }
  if (executionResult && executionResult.candidateEventSha256 !== sha256Hex(canonicalJson(candidate))) {
    throw new Error('Formal Event execution result candidate digest does not match the materialized Event');
  }
  if (new Set([...baselineIds, event.id]).size !== baselineIds.length + 1) {
    throw new Error(`Formal Event ID is not unique: ${event.id}`);
  }
  const choiceErrors = collectChoiceIdValidationErrors([event as unknown as EventDefinition]);
  if (choiceErrors.length > 0) throw new Error(`EventLoader choice validation failed: ${choiceErrors.join('; ')}`);
  if (EventLoader.getInstance().getWeightForAge(event as unknown as EventDefinition, event.ageRange.min) !== event.weight) {
    throw new Error('EventLoader cannot schedule the appended Formal Event at its minimum age');
  }
  assertBothHabitPredicates(event);

  const authoritativeAfter = await captureWorkspaceSnapshot(authoritativeRoot);
  if (authoritativeAfter.fingerprintSha256 !== authoritativeBefore.fingerprintSha256) {
    throw new Error('Authoritative repository fingerprint changed during shadow verification');
  }

  const beforeTest = await readFile(join(authoritativeRoot, BOUNDED_FORMAL_EVENT_TEST_PATH), 'utf8');
  const afterTest = await readFile(join(shadowRoot, BOUNDED_FORMAL_EVENT_TEST_PATH), 'utf8');
  const appendedTest = appendOnly(beforeTest, afterTest, BOUNDED_FORMAL_EVENT_TEST_PATH);
  if (!appendedTest.includes(event.id)) throw new Error('Appended focused test must identify the proposed Event');
  if (input.focusedTestExitCode !== 0) throw new Error('Focused bounded Formal Event regression did not pass');

  return {
    terminalStatus: 'SHADOW_AUTHORING_VERIFIED',
    authoritativeFingerprintBefore: authoritativeBefore.fingerprintSha256,
    authoritativeFingerprintAfter: authoritativeAfter.fingerprintSha256,
    executionResultSha256: executionResult === null ? null : sha256Hex(canonicalJson(executionResult)),
    canonicalChanges: changes,
    eventId: event.id,
    checks: {
      exactContractIdentity: 'PASS',
      exactWriteSurface: 'PASS',
      exactlyOneEvent: 'PASS',
      appendOnlyCatalog: 'PASS',
      appendOnlyFocusedTest: 'PASS',
      uniqueEventId: 'PASS',
      eventLoaderShape: 'PASS',
      conditionEvaluator: 'PASS',
      effectAllowlist: 'PASS',
      bothHabitConditions: 'PASS',
      focusedTest: 'PASS',
      authoritativeFingerprintUnchanged: 'PASS',
    },
  };
}
