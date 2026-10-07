import { spawnSync } from 'node:child_process';
import { lstat, readFile, symlink, writeFile, rm, stat } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
  BOUNDED_FORMAL_EVENT_PRODUCTION_PATH,
  BOUNDED_FORMAL_EVENT_TEST_PATH,
  validateBoundedFormalEventPayload,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import {
  validateBoundedFormalEventAdmissionV2,
  type BoundedFormalEventAdmissionV2,
} from '../../../src/evolution/boundedFormalEventAdmissionContract';
import {
  validateBoundedFormalEventProposalV2,
  validateBoundedFormalEventReviewAssessmentV2,
} from '../../../src/evolution/boundedFormalEventProposalContract';
import { validateAuthoringRequirementV1 } from '../../../src/evolution/authoringRequirementContract';
import {
  validateBoundedFormalEventShadowExecutionV1,
  type BoundedFormalEventShadowExecutionV1,
} from '../../../src/evolution/boundedFormalEventShadowExecutionContract';
import { EventLoader } from '../../../src/core/EventLoader';
import {
  captureAuthoritativeFingerprint,
  captureWorkspaceSnapshot,
  prepareAgentWorkspace,
} from '../problemAgnosticSolution/agentWorkspace';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { compareWorkspaceSnapshots, type CanonicalWorkspaceChange } from './workspaceChangeSet';
import { evaluateBoundedFormalEventAdmission } from './evaluateBoundedFormalEventAdmission';

const FOCUSED_TEST_COMMAND = `npm exec -- tsx ${BOUNDED_FORMAL_EVENT_TEST_PATH}`;
const SHADOW_REGRESSION_ENV = 'BOUNDED_FORMAL_EVENT_SHADOW_REGRESSION_EVENT_ID';

export interface BoundedFormalEventFocusedRegressionV1 {
  command: string;
  exitCode: number;
  output: string;
}

export interface BoundedFormalEventShadowExecutionOutputV1 {
  shadowRoot: string;
  execution: BoundedFormalEventShadowExecutionV1;
  focusedTest: BoundedFormalEventFocusedRegressionV1;
  canonicalChanges: CanonicalWorkspaceChange[];
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

function isWithin(parentRoot: string, candidatePath: string): boolean {
  const path = relative(parentRoot, candidatePath);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

async function findHostNodeModulesRoot(repositoryRoot: string): Promise<string> {
  let current = resolve(repositoryRoot);
  while (true) {
    const candidate = join(current, 'node_modules');
    try {
      if ((await stat(join(candidate, '.bin/tsx'))).isFile()) return candidate;
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error('Host tsx dependency is unavailable for bounded Formal Event focused verification');
}

async function readRegularFile(root: string, relativePath: string): Promise<string> {
  const path = join(root, relativePath);
  const info = await lstat(path);
  if (info.isSymbolicLink() || !info.isFile()) throw new Error(`${relativePath} must be an existing regular file`);
  return readFile(path, 'utf8');
}

function parseEventArray(raw: string, path: string): unknown[] {
  const value = JSON.parse(raw) as unknown;
  if (!Array.isArray(value)) throw new Error(`${path} must contain an Event array`);
  return value;
}

function eventIds(events: readonly unknown[]): string[] {
  return events.flatMap(event => {
    if (typeof event !== 'object' || event === null || Array.isArray(event)) return [];
    const id = (event as Record<string, unknown>).id;
    return typeof id === 'string' ? [id] : [];
  });
}

function appendArrayItemPreservingExistingBytes(raw: string, item: unknown): string {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) throw new Error(`${BOUNDED_FORMAL_EVENT_PRODUCTION_PATH} must contain an Event array`);
  let closing = raw.length - 1;
  while (closing >= 0 && /\s/.test(raw[closing]!)) closing -= 1;
  if (raw[closing] !== ']') throw new Error('P22 Event catalog must be a top-level JSON array');

  const itemJson = JSON.stringify(item, null, 2).split('\n').map(line => `  ${line}`).join('\n');
  if (parsed.length === 0) {
    let opening = 0;
    while (opening < closing && /\s/.test(raw[opening]!)) opening += 1;
    if (raw[opening] !== '[') throw new Error('P22 Event catalog must be a top-level JSON array');
    const insertionIndex = opening + 1;
    const insertion = `\n${itemJson}\n`;
    const appended = `${raw.slice(0, insertionIndex)}${insertion}${raw.slice(insertionIndex)}`;
    if (appended.slice(0, insertionIndex) !== raw.slice(0, insertionIndex)
      || appended.slice(insertionIndex + insertion.length) !== raw.slice(insertionIndex)) {
      throw new Error('Formal Event execution failed to preserve existing catalog bytes');
    }
    return appended;
  }

  let lastItemEnd = closing - 1;
  while (lastItemEnd >= 0 && /\s/.test(raw[lastItemEnd]!)) lastItemEnd -= 1;
  if (lastItemEnd < 0) throw new Error('P22 Event catalog has no final Event value');
  const insertionIndex = lastItemEnd + 1;
  const insertion = `,\n${itemJson}`;
  const appended = `${raw.slice(0, insertionIndex)}${insertion}${raw.slice(insertionIndex)}`;
  if (appended.slice(0, insertionIndex) !== raw.slice(0, insertionIndex)
    || appended.slice(insertionIndex + insertion.length) !== raw.slice(insertionIndex)) {
    throw new Error('Formal Event execution failed to preserve existing catalog bytes');
  }
  return appended;
}

function buildFocusedRegression(requirement: unknown, payload: unknown, eventId: string): string {
  return `\n// Deterministic bounded Formal Event shadow regression: ${eventId}\n{\n`
    + `  const shadowRequirement = ${JSON.stringify(requirement)};\n`
    + `  const shadowPayload = ${JSON.stringify(payload)};\n`
    + `  const validatedShadowPayload = validateBoundedFormalEventPayload(shadowPayload, shadowRequirement);\n`
    + `  const materializedShadowEvent = EventLoader.getInstance().getAllEvents().find(event => event.id === ${JSON.stringify(eventId)});\n`
    + `  assert.ok(materializedShadowEvent, 'the exact proposal Event must load from the shadow catalog');\n`
    + `  assert.deepEqual(materializedShadowEvent, validatedShadowPayload.events[0]);\n`
    + `  const predicateEvent = materializedShadowEvent as unknown as Parameters<typeof eventConditionsPassForHabitState>[0];\n`
    + `  assert.equal(eventConditionsPassForHabitState(predicateEvent, { trainingHabit: 2, businessHabit: 2 }), true);\n`
    + `  assert.equal(eventConditionsPassForHabitState(predicateEvent, { trainingHabit: 2, businessHabit: 0 }), false);\n`
    + `  assert.equal(eventConditionsPassForHabitState(predicateEvent, { trainingHabit: 0, businessHabit: 2 }), false);\n`
    + `  const executionEvent = materializedShadowEvent;\n`
    + `  const configuredTriggerAge = executionEvent.triggers?.find(trigger => trigger.type === 'age_reach')?.value;\n`
    + `  const executionAge = typeof configuredTriggerAge === 'number' ? configuredTriggerAge : executionEvent.ageRange.min;\n`
    + `  const initialEventState = () => {\n`
    + `    const engine = new GameEngineIntegration();\n`
    + `    engine.setPlayerAttributes({ age: executionAge, martialPower: 10, connections: 10, reputation: 10, statuses: [], traits: [], lifeStates: { trainingHabit: 2, studyHabit: 0, businessHabit: 2 } });\n`
    + `    return engine;\n`
    + `  };\n`
    + `  const assertNoUndeclaredPublicDelta = (before: Record<string, unknown>, after: Record<string, unknown>, effects: Array<{ type: string; target?: string }>) => {\n`
    + `    const allowedFields = new Set(effects.flatMap(effect => effect.type === 'stat_modify' && effect.target ? [effect.target] : effect.type === 'life_state_change' ? ['lifeStates'] : effect.type === 'status_add' || effect.type === 'status_remove' ? ['statuses'] : []));\n`
    + `    for (const [field, value] of Object.entries(before)) if (!allowedFields.has(field)) assert.deepEqual(after[field], value, 'event execution must not change an undeclared public player field');\n`
    + `  };\n`
    + `  const assertHistory = (execution: { gameState: { eventHistory: Array<{ eventId: string; age?: number }> } }) => {\n`
    + `    const matchingHistory = execution.gameState.eventHistory.filter(record => record.eventId === executionEvent.id);\n`
    + `    assert.equal(matchingHistory.length, 1, 'canonical Event execution must append history exactly once');\n`
    + `    assert.equal(matchingHistory[0]?.age, executionAge, 'canonical Event history must preserve the trigger age');\n`
    + `  };\n`
    + `  if (executionEvent.eventType === 'choice') {\n`
    + `    const executionChoices = executionEvent.choices ?? [];\n`
    + `    assert.ok(executionChoices.length > 0, 'the materialized choice Event must expose at least one choice');\n`
    + `    if (executionEvent.id === 'p42_training_business_river_delivery') assert.deepEqual(executionChoices.map(choice => choice.id).sort(), ['carry_the_river_road', 'keep_the_full_drill'].sort(), 'the accepted Formal Event must retain both reviewed choices');\n`
    + `    let isolatedInitialPlayer: Record<string, unknown> | undefined;\n`
    + `    for (const choice of executionChoices) {\n`
    + `      const engine = initialEventState();\n`
    + `      const beforePlayer = JSON.parse(JSON.stringify(engine.getGameState().player)) as Record<string, unknown>;\n`
    + `      if (isolatedInitialPlayer === undefined) isolatedInitialPlayer = beforePlayer;\n`
    + `      else assert.deepEqual(beforePlayer, isolatedInitialPlayer, 'each choice must use an isolated identical initial state');\n`
    + `      const expectedPlayerAfter = JSON.parse(JSON.stringify(beforePlayer)) as Record<string, unknown>;\n`
    + `      if (executionEvent.id === 'p42_training_business_river_delivery') {\n`
    + `        if (choice.id === 'carry_the_river_road') Object.assign(expectedPlayerAfter, { martialPower: 12, connections: 12, statuses: ['fatigued'] });\n`
    + `        else if (choice.id === 'keep_the_full_drill') Object.assign(expectedPlayerAfter, { martialPower: 13, reputation: 8 });\n`
    + `        else assert.fail('the accepted Formal Event must retain its reviewed choice IDs');\n`
    + `      }\n`
    + `      const execution = await engine.executeChoiceEffects(choice.effects, executionEvent.id, choice.id);\n`
    + `      const afterPlayer = execution.gameState.player as unknown as Record<string, unknown>;\n`
    + `      if (executionEvent.id === 'p42_training_business_river_delivery') assert.deepEqual(afterPlayer, expectedPlayerAfter, 'the accepted choice must apply exactly its declared public state delta');\n`
    + `      else assertNoUndeclaredPublicDelta(beforePlayer, afterPlayer, choice.effects);\n`
    + `      assertHistory(execution);\n`
    + `    }\n`
    + `  } else {\n`
    + `    const effects = executionEvent.autoEffects ?? [];\n`
    + `    const engine = initialEventState();\n`
    + `    const beforePlayer = JSON.parse(JSON.stringify(engine.getGameState().player)) as Record<string, unknown>;\n`
    + `    const execution = await engine.executeAutoEvent(executionEvent);\n`
    + `    assertNoUndeclaredPublicDelta(beforePlayer, execution.gameState.player as unknown as Record<string, unknown>, effects);\n`
    + `    assertHistory(execution);\n`
    + `  }\n`
    + `  console.log(${JSON.stringify(`bounded-formal-event-shadow-regression:${eventId}:choiceEffectExecution:PASS`)});\n`
    + `  console.log(${JSON.stringify(`bounded-formal-event-shadow-regression:${eventId}:eventHistory:PASS`)});\n`
    + `  console.log(${JSON.stringify(`bounded-formal-event-shadow-regression:${eventId}:ok`)});\n`
    + `}\n`;
}

async function runFocusedRegression(repositoryRoot: string, shadowRoot: string, eventId: string): Promise<BoundedFormalEventFocusedRegressionV1> {
  const shadowModulesPath = join(shadowRoot, 'node_modules');
  try {
    await lstat(shadowModulesPath);
    throw new Error('Shadow workspace already contains node_modules; refusing to execute the focused test there');
  } catch (error) {
    if (!isMissing(error)) throw error;
  }
  const hostNodeModulesRoot = await findHostNodeModulesRoot(repositoryRoot);
  await symlink(hostNodeModulesRoot, shadowModulesPath, 'dir');
  try {
    const child = spawnSync('npm', ['exec', '--', 'tsx', BOUNDED_FORMAL_EVENT_TEST_PATH], {
      cwd: shadowRoot,
      encoding: 'utf8',
      timeout: 120_000,
      maxBuffer: 8 * 1024 * 1024,
      env: { ...process.env, [SHADOW_REGRESSION_ENV]: eventId },
    });
    return {
      command: FOCUSED_TEST_COMMAND,
      exitCode: child.status ?? -1,
      output: `${child.stdout ?? ''}${child.stderr ?? ''}${child.error ? `\n${child.error.message}` : ''}`,
    };
  } finally {
    await rm(shadowModulesPath, { force: true });
  }
}

function assertReviewMatchesProposal(
  proposal: ReturnType<typeof validateBoundedFormalEventProposalV2>,
  review: ReturnType<typeof validateBoundedFormalEventReviewAssessmentV2>,
  requirementSha256: string,
): void {
  const proposalSha256 = sha256Hex(canonicalJson(proposal));
  if (
    review.requirementSha256 !== requirementSha256
    || review.proposalSha256 !== proposalSha256
    || review.reviewerRef === proposal.proposedBy
    || review.decision !== 'ACCEPT'
    || review.applicabilityAssessment !== 'APPLICABLE'
    || review.conformance !== 'CONFORMING'
    || review.executionEnvelope !== 'WITHIN_ENVELOPE'
    || review.requirementCoverage !== 'COVERED'
    || review.pastPresentFutureAssessment !== 'COHERENT'
    || review.blockers.length !== 0
  ) throw new Error('Bounded Formal Event execution requires an independent accepting review bound to this proposal');
}

export async function executeBoundedFormalEventShadowAuthoring(input: {
  authoritativeRoot: string;
  workspaceDestinationRoot: string;
  requirement: unknown;
  proposal: unknown;
  review: unknown;
  admission: unknown;
  observedLifeStates: { trainingHabit?: unknown; businessHabit?: unknown } | null;
}): Promise<BoundedFormalEventShadowExecutionOutputV1> {
  const authoritativeRoot = resolve(input.authoritativeRoot);
  const workspaceDestinationRoot = resolve(input.workspaceDestinationRoot);
  if (isWithin(authoritativeRoot, workspaceDestinationRoot)) {
    throw new Error('Bounded Formal Event shadow workspace must be isolated outside the authoritative repository');
  }

  const authoritativeFingerprintBefore = await captureAuthoritativeFingerprint(authoritativeRoot);
  const requirement = validateAuthoringRequirementV1(input.requirement);
  const authoritativeCatalogRaw = await readRegularFile(authoritativeRoot, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH);
  const authoritativeEvents = parseEventArray(authoritativeCatalogRaw, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH);
  const existingEventIds = [...new Set([
    ...EventLoader.getInstance().getAllEvents().map(event => event.id),
    ...eventIds(authoritativeEvents),
  ])];
  const proposal = validateBoundedFormalEventProposalV2(input.proposal, existingEventIds);
  const review = validateBoundedFormalEventReviewAssessmentV2(input.review);
  const admission = validateBoundedFormalEventAdmissionV2(input.admission) as BoundedFormalEventAdmissionV2;
  if (admission.status !== 'ELIGIBLE') throw new Error('Bounded Formal Event execution requires ELIGIBLE Host admission');
  if (canonicalJson(proposal.requirement) !== canonicalJson(requirement)) {
    throw new Error('Bounded Formal Event execution Requirement must exactly match the reviewed proposal');
  }
  const requirementSha256 = sha256Hex(canonicalJson(requirement));
  assertReviewMatchesProposal(proposal, review, requirementSha256);
  if (
    admission.requirementSha256 !== requirementSha256
    || admission.proposalSha256 !== sha256Hex(canonicalJson(proposal))
    || admission.reviewSha256 !== sha256Hex(canonicalJson(review))
    || admission.authoritativeFingerprintBefore !== authoritativeFingerprintBefore
    || admission.applicability.status !== 'APPLICABLE'
  ) throw new Error('Host admission does not bind the current Requirement, proposal, review, or authoritative baseline');
  const expectedAdmission = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: authoritativeRoot,
    requirement,
    proposal,
    review,
    observedLifeStates: input.observedLifeStates ?? null,
  });
  if (canonicalJson(expectedAdmission) !== canonicalJson(admission)) {
    throw new Error('Supplied Host admission does not match deterministic re-evaluation');
  }
  if (!proposal.contractPayload) throw new Error('ELIGIBLE Formal Event proposal must contain one reviewed Event');
  const payload = validateBoundedFormalEventPayload(proposal.contractPayload, requirement, existingEventIds);
  const event = payload.events[0];
  if (!event) throw new Error('Bounded Formal Event payload must contain exactly one Event');

  const prepared = await prepareAgentWorkspace({
    authoritativeRoot,
    destinationRoot: workspaceDestinationRoot,
    jobKind: 'shadow-authoring',
  });
  const shadowRoot = resolve(prepared.workspaceRoot);
  if (isWithin(authoritativeRoot, shadowRoot)) throw new Error('Prepared Formal Event shadow workspace is inside the authoritative repository');
  if (
    prepared.authoritativeFingerprintSha256 !== authoritativeFingerprintBefore
    || prepared.workspaceBaselineFingerprintSha256 !== authoritativeFingerprintBefore
  ) throw new Error('Prepared Formal Event shadow workspace does not match the admitted authoritative baseline');

  const [beforeShadowSnapshot, shadowCatalogRaw, authoritativeFocusedTest, shadowFocusedTest] = await Promise.all([
    captureWorkspaceSnapshot(shadowRoot),
    readRegularFile(shadowRoot, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH),
    readRegularFile(authoritativeRoot, BOUNDED_FORMAL_EVENT_TEST_PATH),
    readRegularFile(shadowRoot, BOUNDED_FORMAL_EVENT_TEST_PATH),
  ]);
  if (beforeShadowSnapshot.fingerprintSha256 !== authoritativeFingerprintBefore) {
    throw new Error('Fresh Formal Event shadow workspace contains unexpected pre-existing changes');
  }
  if (shadowCatalogRaw !== authoritativeCatalogRaw || shadowFocusedTest !== authoritativeFocusedTest) {
    throw new Error('Fresh Formal Event shadow workspace does not exactly copy its authoritative source files');
  }

  const appendedCatalog = appendArrayItemPreservingExistingBytes(shadowCatalogRaw, event);
  const afterCatalog = parseEventArray(appendedCatalog, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH);
  if (afterCatalog.length !== authoritativeEvents.length + 1) throw new Error('Formal Event execution must materialize exactly one Event');
  if (canonicalJson(afterCatalog.slice(0, authoritativeEvents.length)) !== canonicalJson(authoritativeEvents)) {
    throw new Error('Formal Event execution changed an existing catalog entry');
  }
  await writeFile(join(shadowRoot, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH), appendedCatalog, { flag: 'w' });

  const focusedTestPath = join(shadowRoot, BOUNDED_FORMAL_EVENT_TEST_PATH);
  await writeFile(focusedTestPath, `${shadowFocusedTest}${buildFocusedRegression(requirement, payload, event.id)}`, { flag: 'w' });
  const focusedTest = await runFocusedRegression(authoritativeRoot, shadowRoot, event.id);
  if (focusedTest.exitCode !== 0) {
    throw new Error(`Bounded Formal Event focused regression failed (${focusedTest.command}, exit ${focusedTest.exitCode}).\n${focusedTest.output}`);
  }

  const [shadowAfter, authoritativeFingerprintAfter] = await Promise.all([
    captureWorkspaceSnapshot(shadowRoot),
    captureAuthoritativeFingerprint(authoritativeRoot),
  ]);
  if (authoritativeFingerprintAfter !== authoritativeFingerprintBefore) {
    throw new Error('Authoritative repository fingerprint changed during bounded Formal Event execution');
  }
  const canonicalChanges = compareWorkspaceSnapshots(beforeShadowSnapshot, shadowAfter);
  const expectedPaths = [BOUNDED_FORMAL_EVENT_PRODUCTION_PATH, BOUNDED_FORMAL_EVENT_TEST_PATH].sort();
  if (JSON.stringify(canonicalChanges.map(change => change.path).sort()) !== JSON.stringify(expectedPaths)) {
    throw new Error(`Bounded Formal Event executor changed paths outside its exact write surface: ${canonicalChanges.map(change => change.path).join(', ')}`);
  }
  if (canonicalChanges.some(change => change.changeType !== 'MODIFIED')) {
    throw new Error('Bounded Formal Event execution may only modify the existing catalog and focused test files');
  }

  const shadowCatalogAfter = parseEventArray(
    await readRegularFile(shadowRoot, BOUNDED_FORMAL_EVENT_PRODUCTION_PATH),
    BOUNDED_FORMAL_EVENT_PRODUCTION_PATH,
  );
  if (canonicalJson(shadowCatalogAfter.slice(0, authoritativeEvents.length)) !== canonicalJson(authoritativeEvents)) {
    throw new Error('Materialized Formal Event shadow catalog does not preserve its authoritative baseline');
  }
  const materializedCandidate = shadowCatalogAfter[shadowCatalogAfter.length - 1];
  if (canonicalJson(materializedCandidate) !== canonicalJson(event)) {
    throw new Error('Materialized Event differs from the exact reviewed proposal payload');
  }

  const execution = validateBoundedFormalEventShadowExecutionV1({
    schemaVersion: 'bounded-formal-event-shadow-execution-v1',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    status: 'EXECUTED',
    requirementSha256,
    proposalSha256: sha256Hex(canonicalJson(proposal)),
    reviewSha256: sha256Hex(canonicalJson(review)),
    admissionSha256: sha256Hex(canonicalJson(admission)),
    eventId: event.id,
    candidateEventSha256: sha256Hex(canonicalJson(event)),
    authoritativeFingerprintBefore,
    authoritativeFingerprintAfter,
    shadowBaselineFingerprint: beforeShadowSnapshot.fingerprintSha256,
    shadowFingerprintAfter: shadowAfter.fingerprintSha256,
    canonicalChangedFileRefs: canonicalChanges.map(change => change.path),
    focusedTestExitCode: 0,
    participantJobs: 0,
  });
  return { shadowRoot, execution, focusedTest, canonicalChanges };
}
