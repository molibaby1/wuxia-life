import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
} from '../../../src/evolution/boundedFormalEventAuthoringContract';
import { HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT } from '../../../src/evolution/boundedFormalEventReferenceRequirement';
import { validateBoundedFormalEventShadowResultV2 } from '../../../src/evolution/boundedFormalEventShadowResultContract';
import type { BoundedFormalEventShadowVerificationV2 } from './verifyBoundedFormalEventShadowAuthoring';
import { verifyBoundedFormalEventShadowAuthoring } from './verifyBoundedFormalEventShadowAuthoring';
import { evaluateBoundedFormalEventAdmission } from './evaluateBoundedFormalEventAdmission';
import {
  executeBoundedFormalEventShadowAuthoring,
  type BoundedFormalEventFocusedRegressionV1,
} from './executeBoundedFormalEventShadowAuthoring';
import type { BoundedFormalEventShadowExecutionV1 } from '../../../src/evolution/boundedFormalEventShadowExecutionContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { captureAuthoritativeFingerprint } from '../problemAgnosticSolution/agentWorkspace';
import { validateFreshBoundedFormalEventAuthorizationCandidate } from './boundedFormalEventTrialAuthorization';

export interface BoundedFormalEventShadowTrialInput {
  authoritativeRoot: string;
  shadowRoot: string;
  artifactRoot: string;
  proposal: unknown;
  review: unknown;
  observedLifeStates: { trainingHabit?: unknown; businessHabit?: unknown } | null;
  humanAuthorizationArtifactPath?: string;
  humanAuthorizationRef?: string;
  expectedHumanAuthorizationSha256?: string;
  participantJobs?: 0 | 1;
}

export interface BoundedFormalEventShadowTrialRun {
  result: ReturnType<typeof validateBoundedFormalEventShadowResultV2>;
  verification: BoundedFormalEventShadowVerificationV2 | null;
  execution: BoundedFormalEventShadowExecutionV1 | null;
  shadowRoot: string | null;
  focusedTest: BoundedFormalEventFocusedRegressionV1 | null;
}

function isWithin(parentRoot: string, candidatePath: string): boolean {
  const path = relative(parentRoot, candidatePath);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

function authorizationRequiredResult(fingerprint: string) {
  return validateBoundedFormalEventShadowResultV2({
    schemaVersion: 'shadow-authoring-result-v2',
    terminalStatus: 'EXECUTION_AUTHORIZATION_REQUIRED',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirementSha256: null,
    proposalSha256: null,
    reviewSha256: null,
    admissionSha256: null,
    humanAuthorizationRef: null,
    humanAuthorizationSha256: null,
    eventId: null,
    canonicalChangedFileRefs: [],
    verificationArtifactRef: null,
    authoritativeFingerprintBefore: fingerprint,
    authoritativeFingerprintAfter: fingerprint,
    participantJobs: 0,
  });
}

export async function runBoundedFormalEventShadowTrial(
  input: BoundedFormalEventShadowTrialInput,
): Promise<BoundedFormalEventShadowTrialRun> {
  const authoritativeRoot = resolve(input.authoritativeRoot);
  const shadowRoot = resolve(input.shadowRoot);
  const artifactRoot = resolve(input.artifactRoot);
  if (isWithin(authoritativeRoot, shadowRoot)) {
    throw new Error('Bounded Formal Event shadow workspace must be isolated outside the authoritative repository');
  }
  if (isWithin(shadowRoot, artifactRoot)) {
    throw new Error('Bounded Formal Event trial artifacts must be stored outside the shadow workspace');
  }
  if (isWithin(authoritativeRoot, artifactRoot)) {
    const artifactPath = relative(authoritativeRoot, artifactRoot).split(sep).join('/');
    if (!artifactPath.startsWith('artifacts/') && !artifactPath.startsWith('.tmp/evolution/')) {
      throw new Error('Bounded Formal Event trial artifacts inside the repository must be under artifacts/ or .tmp/evolution/');
    }
  }
  const initialFingerprint = await captureAuthoritativeFingerprint(authoritativeRoot);
  const authorizationFields = [
    input.humanAuthorizationArtifactPath,
    input.humanAuthorizationRef,
    input.expectedHumanAuthorizationSha256,
  ];
  if (authorizationFields.every(value => value === undefined)) {
    return {
      result: authorizationRequiredResult(initialFingerprint),
      verification: null,
      execution: null,
      shadowRoot: null,
      focusedTest: null,
    };
  }
  if (authorizationFields.some(value => value === undefined)) {
    throw new Error('Human authorization artifact path, reference, and accepted SHA-256 must be supplied together');
  }
  if (input.humanAuthorizationRef!.trim().length === 0) throw new Error('Human authorization reference must be non-empty');

  const expectedAuthorizationSha256 = input.expectedHumanAuthorizationSha256!;
  if (!/^[a-f0-9]{64}$/.test(expectedAuthorizationSha256)) {
    throw new Error('Human authorization SHA-256 must be a lowercase 64-character digest');
  }
  const authorizationArtifactPath = resolve(input.humanAuthorizationArtifactPath!);
  const authorizationStat = await lstat(authorizationArtifactPath);
  if (authorizationStat.isSymbolicLink() || !authorizationStat.isFile()) {
    throw new Error('Human authorization artifact must be an existing regular file');
  }
  const authorizationBytes = await readFile(authorizationArtifactPath);
  const actualAuthorizationSha256 = sha256Hex(authorizationBytes);
  // The external Human/PD-122 gate supplies the accepted digest; this family runner only pins those bytes.
  if (actualAuthorizationSha256 !== expectedAuthorizationSha256) {
    throw new Error('Human authorization artifact does not match the separately supplied accepted SHA-256');
  }
  await validateFreshBoundedFormalEventAuthorizationCandidate({
    repositoryRoot: authoritativeRoot,
    authorizationArtifactPath,
    expectedCanonicalSha256: expectedAuthorizationSha256,
    proposal: input.proposal,
    review: input.review,
    observedLifeStates: input.observedLifeStates,
    participantJobs: input.participantJobs ?? 0,
  });

  const admission = await evaluateBoundedFormalEventAdmission({
    repositoryRoot: authoritativeRoot,
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal: input.proposal,
    review: input.review,
    observedLifeStates: input.observedLifeStates,
  });
  if (admission.status !== 'ELIGIBLE') {
    const currentFingerprint = await captureAuthoritativeFingerprint(authoritativeRoot);
    return {
      result: validateBoundedFormalEventShadowResultV2({
        schemaVersion: 'shadow-authoring-result-v2',
        terminalStatus: 'SHADOW_AUTHORING_CONFORMANCE_FAILED',
        contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
        contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
        requirementSha256: admission.requirementSha256,
        proposalSha256: admission.proposalSha256,
        reviewSha256: admission.reviewSha256,
        admissionSha256: sha256Hex(canonicalJson(admission)),
        humanAuthorizationRef: input.humanAuthorizationRef!,
        humanAuthorizationSha256: actualAuthorizationSha256,
        eventId: null,
        canonicalChangedFileRefs: [],
        verificationArtifactRef: null,
        authoritativeFingerprintBefore: initialFingerprint,
        authoritativeFingerprintAfter: currentFingerprint,
        participantJobs: input.participantJobs ?? 0,
      }),
      verification: null,
      execution: null,
      shadowRoot: null,
      focusedTest: null,
    };
  }

  const executionOutput = await executeBoundedFormalEventShadowAuthoring({
    authoritativeRoot,
    workspaceDestinationRoot: shadowRoot,
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal: input.proposal,
    review: input.review,
    admission,
    observedLifeStates: input.observedLifeStates,
  });
  const { focusedTest } = executionOutput;
  const verification = await verifyBoundedFormalEventShadowAuthoring({
    authoritativeRoot,
    shadowRoot: executionOutput.shadowRoot,
    requirement: HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT,
    proposal: input.proposal,
    review: input.review,
    admission,
    executionResult: executionOutput.execution,
    focusedTestExitCode: focusedTest.exitCode,
  });
  const result = validateBoundedFormalEventShadowResultV2({
    schemaVersion: 'shadow-authoring-result-v2',
    terminalStatus: 'SHADOW_AUTHORING_VERIFIED',
    contractId: BOUNDED_FORMAL_EVENT_CONTRACT_ID,
    contractVersion: BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
    requirementSha256: admission.requirementSha256,
    proposalSha256: admission.proposalSha256,
    reviewSha256: admission.reviewSha256,
    admissionSha256: sha256Hex(canonicalJson(admission)),
    humanAuthorizationRef: input.humanAuthorizationRef!,
    humanAuthorizationSha256: actualAuthorizationSha256,
    eventId: verification.eventId,
    canonicalChangedFileRefs: verification.canonicalChanges.map(change => change.path),
    verificationArtifactRef: 'verification.json',
    authoritativeFingerprintBefore: verification.authoritativeFingerprintBefore,
    authoritativeFingerprintAfter: verification.authoritativeFingerprintAfter,
    participantJobs: input.participantJobs ?? 0,
  });
  await mkdir(artifactRoot, { recursive: true });
  await writeFile(join(artifactRoot, 'verification.json'), `${canonicalJson(verification)}\n`, { flag: 'wx' });
  await writeFile(join(artifactRoot, 'focused-test.log'), focusedTest.output, { flag: 'wx' });
  await writeFile(join(artifactRoot, 'result.json'), `${canonicalJson(result)}\n`, { flag: 'wx' });
  return {
    result,
    verification,
    execution: executionOutput.execution,
    shadowRoot: executionOutput.shadowRoot,
    focusedTest,
  };
}

function parseArgs(argv: string[]): Map<string, string> {
  const result = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined || result.has(key)) {
      throw new Error('Arguments must be unique --name value pairs');
    }
    result.set(key, value);
  }
  return result;
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, 'utf8')) as unknown;
}

export async function runBoundedFormalEventShadowTrialCli(argv = process.argv.slice(2)): Promise<void> {
  const args = parseArgs(argv);
  const allowed = new Set([
    '--shadow-root', '--proposal', '--review', '--observed-life-states', '--artifact-root',
    '--human-authorization', '--human-authorization-ref', '--human-authorization-sha256', '--participant-jobs',
  ]);
  for (const key of args.keys()) if (!allowed.has(key)) throw new Error(`Unknown argument ${key}`);
  const required = ['--shadow-root', '--proposal', '--review', '--observed-life-states', '--artifact-root'];
  for (const key of required) if (!args.has(key)) throw new Error(`Missing required argument ${key}`);
  const participantJobsValue = args.get('--participant-jobs') ?? '0';
  if (participantJobsValue !== '0' && participantJobsValue !== '1') {
    throw new Error('--participant-jobs must be 0 or 1');
  }
  const output = await runBoundedFormalEventShadowTrial({
    authoritativeRoot: process.cwd(),
    shadowRoot: args.get('--shadow-root')!,
    artifactRoot: args.get('--artifact-root')!,
    proposal: await readJson(args.get('--proposal')!),
    review: await readJson(args.get('--review')!),
    observedLifeStates: await readJson(args.get('--observed-life-states')!) as { trainingHabit?: unknown; businessHabit?: unknown } | null,
    humanAuthorizationArtifactPath: args.get('--human-authorization'),
    humanAuthorizationRef: args.get('--human-authorization-ref'),
    expectedHumanAuthorizationSha256: args.get('--human-authorization-sha256'),
    participantJobs: Number(participantJobsValue) as 0 | 1,
  });
  if (output.result.terminalStatus === 'EXECUTION_AUTHORIZATION_REQUIRED') {
    process.stdout.write(`${canonicalJson(output.result)}\n`);
    return;
  }
  process.stdout.write(`${canonicalJson(output.result)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runBoundedFormalEventShadowTrialCli().catch(error => {
    const reason = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${reason}\n`);
    process.exitCode = 1;
  });
}
