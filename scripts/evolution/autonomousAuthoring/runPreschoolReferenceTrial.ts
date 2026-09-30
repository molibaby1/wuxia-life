import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { cp, copyFile, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises';
import {
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validatePreschoolCapacityEvidence,
  type AutonomousAuthoringAdmissionV1,
  type PreschoolCapacityEvidenceV1,
} from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import { serializeObservablePayload, type ObservablePayload } from '../../../src/evolution/playerObservableTranscript';
import type { ImprovementHypothesis } from '../../../src/evolution/improvementHypothesisContract';
import { buildProblemPackage } from '../problemAgnosticSolution/buildProblemPackage';
import { PARTICIPANT_ENVELOPE_RETRANSMISSION_PROMPT_1_ARTIFACT } from '../problemAgnosticSolution/runStructuredParticipantExecution';
import {
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
  type PreparedAgentWorkspace,
} from '../problemAgnosticSolution/agentWorkspace';
import {
  runSolutionAgent,
  type SolutionAgentRunResult,
} from '../problemAgnosticSolution/runSolutionAgent';
import {
  runSolutionReviewer,
  type SolutionReviewerRunResult,
} from '../problemAgnosticSolution/runSolutionReviewer';
import { validateSolutionWork } from '../../../src/evolution/solutionWorkContract';
import { routeSolutionDecision } from '../problemAgnosticSolution/routeSolutionDecision';
import {
  REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
  SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
} from '../problemAgnosticSolution/solutionParticipantSkills';
import type {
  ParticipantExecutionTraceV1,
  WorkspaceAgentJobInput,
  WorkspaceAgentParticipantOptions,
} from '../problemAgnosticSolution/agentParticipant';
import {
  referenceParticipantBindingLockSha256,
  resolveReferenceParticipantBindingFromLock,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import type { ResolvedOperatorParticipantBinding } from '../operator/resolveParticipantBinding';
import { canonicalJson, captureWorktreeSourceFingerprint, sha256Hex } from '../phase0/provenance';
import { buildPreschoolAutonomousAuthoringContractPacket } from './buildPreschoolContractPacket';
import { evaluatePreschoolAutonomousAuthoringAdmission } from './evaluatePreschoolAuthoringAdmission';
import { assertAcceptedAuthoring, runShadowAuthoringExecution } from './shadowAuthoringExecutionParticipant';
import {
  resolveHostNodeModulesRoot,
  verifyPreschoolShadowAuthoring,
} from './verifyPreschoolShadowAuthoring';
import { buildPromotionPackage } from './buildPromotionPackage';
import {
  PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE,
  PRESCHOOL_REFERENCE_VALIDATION_LAYER,
  PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256,
  assertPreschoolReferenceResponsibilitiesPreserved,
  readAcceptedPreschoolReferenceResponsibilityBrief,
  type AcceptedPreschoolReferenceResponsibilityBrief,
  type PreschoolReferenceResponsibilityAttestationV1,
  type PreschoolReferenceResponsibilityContextV1,
  type PreschoolReferenceResponsibilityMappingV1,
  type PreschoolReferenceResponsibilityBriefUnavailableReason,
} from './preschoolReferenceResponsibilityBrief';

export const PRESCHOOL_REFERENCE_TRIAL_RUN_REF = 'preschool-pver-20260922231805-71297571' as const;
export const PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA = 'e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf' as const;
// This digest is the Human-accepted reference evidence trust anchor.
export const PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256 =
  'b7adb3af9c32c7476186dadd592b82410b08ac9f0784df11495b5c4ebd3d74d3' as const;
// This digest anchors the Human-accepted exact sealed player-visible historical reference payload.
export const PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256 =
  'd91231e2967e75bf508d276c3163fc6ca5fcd2cbeba21db71132b3374b676ab4' as const;
export const PRESCHOOL_REFERENCE_TRIAL_AUTHORITY_PATHS = [
  'docs/governance/product-decisions.md',
  'docs/product/content-authoring-workflow-contract-design.md',
  'docs/product/auto-evolution-model.md',
] as const;

const ACCEPTED_DESIGN_PATH = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
const INFANT_CATALOG_PATH = 'src/data/infantPassiveNarrativeCatalog.ts';
const CAPACITY_SUMMARY_PATH = 'source/reference-trial/capacity-summary.json';
const OBSERVABLE_SUMMARY_PATH = 'source/reference-trial/observable-summary.json';
const OBSERVABLE_PAYLOAD_PATH = 'source/reference-trial/observable-payload.json';
const ACCEPTED_EVIDENCE_INPUT_PATH = 'source/reference-trial/accepted-evidence.json';
const REFERENCE_RESPONSIBILITY_BRIEF_PATH = 'source/reference-trial/reference-responsibility-brief.json';
const REFERENCE_RESPONSIBILITY_ATTESTATION_PATH = 'source/reference-trial/reference-responsibility-attestation.json';
const REFERENCE_SOURCE_ATTESTATION_PATH = 'source/reference-trial/reference-source-attestation.json';
const FEEDBACK_SUMMARY_PATH = 'source/reference-trial/external-feedback.json';
const HYPOTHESIS_SUMMARY_PATH = 'source/reference-trial/improvement-hypothesis.json';
const CONTRACT_PACKET_PATH = 'source/reference-trial/autonomous-authoring-contract-packet.json';
const FORBIDDEN_ANSWER_IDS = [
  'preschool_neutral_fair_play',
  'preschool_neutral_self_made_project',
  'preschool_neutral_stand_for_peer',
  'preschool_neutral_first_farewell',
  'preschool_neutral_neighborhood_help',
] as const;
const FORBIDDEN_RESIDUAL_DESIGN_PATH =
  'docs/superpowers/specs/2026-09-23-preschool-residual-content-capacity-authoring-design.md';

export interface PreschoolReferenceTrialStopV1 {
  schemaVersion: 'preschool-reference-trial-stop-v1';
  status: 'REFERENCE_EVIDENCE_UNAVAILABLE';
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  reason: 'Exact accepted chronology was not supplied; replay or evidence reconstruction is forbidden for this trial.';
}

export interface PreschoolReferenceTrialObservablePayloadStopV1 {
  schemaVersion: 'preschool-reference-trial-stop-v1';
  status: 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE';
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  reason: 'Exact sealed player-visible reference payload was not supplied or did not match the accepted digest.';
}

export interface PreschoolReferenceTrialResponsibilityBriefStopV1 {
  schemaVersion: 'preschool-reference-trial-stop-v1';
  status: 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE';
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  reason: PreschoolReferenceResponsibilityBriefUnavailableReason;
}

export interface PreschoolReferenceTrialAuthorizationStopV1 {
  schemaVersion: 'preschool-reference-trial-stop-v1';
  status: 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE';
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  reason: string;
}

export interface PreschoolReferenceTrialHistoryArtifactV1 {
  path: string;
  kind: 'file' | 'directory' | 'symlink';
  sha256?: string;
}

export interface PreschoolReferenceTrialAcknowledgedHistoryV1 {
  schemaVersion: 'preschool-reference-trial-acknowledged-history-v1';
  attemptsDirectoryPresent: boolean;
  attempts: Array<{
    attemptRef: string;
    manifestPresent: boolean;
    manifestState: 'CREATED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STOPPED' | null;
    artifacts: PreschoolReferenceTrialHistoryArtifactV1[];
  }>;
  runLevelMaterial: PreschoolReferenceTrialHistoryArtifactV1[];
}

export interface PreschoolReferenceTrialExecutionAuthorizationV2 {
  schemaVersion: 'preschool-reference-trial-execution-authorization-v2';
  authorizationRef: string;
  runRef: string;
  attemptRef: string;
  authorizedAt: string;
  acknowledgedLegacyHistory: PreschoolReferenceTrialAcknowledgedHistoryV1;
  participantBindingLock: ReferenceParticipantBindingLockV1;
  participantBindingLockSha256: string;
  canonicalSha256: string;
}

type TrialStage = 'PREFLIGHT' | 'PREPARATION' | 'INPUTS' | 'BINDING' | 'SOLUTION' | 'REVIEWER' | 'ADMISSION' | 'SHADOW_AUTHORING' | 'VERIFICATION' | 'PROMOTION' | 'CLEANUP';
const TRIAL_STAGE_ORDER: TrialStage[] = [
  'PREFLIGHT', 'PREPARATION', 'INPUTS', 'BINDING', 'SOLUTION', 'REVIEWER',
  'ADMISSION', 'SHADOW_AUTHORING', 'VERIFICATION', 'PROMOTION', 'CLEANUP',
];

type ManifestInputKey =
  | 'acceptedEvidence' | 'observablePayload' | 'observableSummary' | 'responsibilityBrief'
  | 'responsibilityAttestation' | 'sourceAttestation' | 'capacitySummary' | 'externalFeedback'
  | 'improvementHypothesis' | 'contractPacket' | 'problemPackage' | 'solutionResult' | 'reviewerResult';
type ManifestInputProvenance = {
  inputIdentity: string;
  artifactRef: string;
  sha256: string | 'ABSENT' | 'UNREADABLE';
  availability: 'PRESENT' | 'ABSENT' | 'UNREADABLE';
  diagnostic?: string;
};
type InvocationRole = 'solution' | 'reviewer' | 'shadowAuthoring';
type InvocationOutcome = 'completed' | 'failed' | 'timeout' | 'process_error';
type RetransmissionPromptProvenance = {
  retransmissionAttempt: 1;
  artifactRef: string;
  sha256: string;
  byteLength: number;
};
type RetransmissionRuntimeOutcome = 'COMPLETED' | 'TIMEOUT' | 'CONTINUATION_FAILURE' | 'RUNTIME_FAILURE';
type ParticipantRetransmissionLifecycle =
  | { status: 'AVAILABLE'; runtimeOutcomes: RetransmissionRuntimeOutcome[]; tracePresent: boolean; requestPresent: boolean }
  | { status: 'CORRUPTED'; diagnostic: string; runtimeOutcomes: RetransmissionRuntimeOutcome[]; tracePresent: boolean; requestPresent: boolean };
type ParticipantPromptProvenance =
  | { role: InvocationRole; status: 'NOT_INVOKED' }
  | { role: InvocationRole; status: 'AVAILABLE'; artifactRef: string; sha256: string; byteLength: number; retransmissionPrompts: RetransmissionPromptProvenance[] }
  | { role: InvocationRole; status: 'CORRUPTED'; artifactRef: string; diagnostic: string; sha256?: string; byteLength?: number; retransmissionPrompts: RetransmissionPromptProvenance[] };
interface AvailableInvocationProvenanceV1 {
  status: 'AVAILABLE';
  invocationRef: string;
  artifactRef: string;
  artifactSha256: string;
  completionEvidence: { artifactRef: string; sha256: string; outcome: InvocationOutcome };
}
type InvocationProvenance = null | AvailableInvocationProvenanceV1 | { status: 'CORRUPTED'; artifactRef: string; diagnostic: string };

interface AttemptManifest {
  schemaVersion: 'preschool-reference-trial-attempt-manifest-v1';
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  attemptRef: string;
  createdAt: string;
  updatedAt: string;
  runnerProvenance: { gitSha: string; branch: string; dirtyFingerprintSha256: string };
  historicalBaselineProvenance: {
    candidateBaselineGitSha: string;
    candidateBaselineFingerprintSha256: string | null;
    liveRepositoryFingerprintBefore: string;
  };
  authorizationRef: string;
  authorizationArtifactPath: string;
  authorizationDigest: string;
  expectedAuthorizationDigest: string;
  authorizedAt: string;
  acknowledgedLegacyHistory: PreschoolReferenceTrialAcknowledgedHistoryV1;
  participantBindingLock: ReferenceParticipantBindingLockV1;
  participantBindingLockSha256: string;
  artifactRefs: Record<string, string>;
  inputSet: Record<ManifestInputKey, ManifestInputProvenance>;
  participantPromptProvenance: Record<InvocationRole, ParticipantPromptProvenance>;
  invocationRefs: Record<InvocationRole, InvocationProvenance>;
  state: 'CREATED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STOPPED';
  currentStage: TrialStage;
  terminalOutcome: null | {
    status: 'SHADOW_AUTHORING_VERIFIED' | 'REFERENCE_EVIDENCE_UNAVAILABLE' | 'REFERENCE_PREFLIGHT_STOPPED' | 'FAILED' | 'CLEANUP_INCOMPLETE';
    stage?: TrialStage;
    errorKind?: string;
    failureMessage?: string;
    failureArtifactRef?: string;
    stopArtifactRef?: string;
    resultStatus?: PreschoolReferenceTrialResult['status'];
    trialResultRef?: string;
    trialResultStatus?: 'PRESENT_UNREMOVED';
    diagnosticFailures?: string[];
  };
}

interface AttemptManifestSnapshot {
  manifest: AttemptManifest;
  token: string;
}

const attemptManifestWriterTokens = new WeakMap<AttemptManifest, string>();

export interface PreschoolReferenceTrialVerifiedV2 {
  schemaVersion: 'preschool-reference-trial-result-v2';
  status: 'SHADOW_AUTHORING_VERIFIED';
  validationLayer: typeof PRESCHOOL_REFERENCE_VALIDATION_LAYER;
  responsibilityProvenance: typeof PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE;
  referenceResponsibilityBriefRef: typeof REFERENCE_RESPONSIBILITY_BRIEF_PATH;
  referenceResponsibilityBriefSha256: string;
  referenceResponsibilityAttestationRef: typeof REFERENCE_RESPONSIBILITY_ATTESTATION_PATH;
  responsibilityMappings: PreschoolReferenceResponsibilityMappingV1[];
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  attemptRef: string;
  attemptManifestRef: string;
  executionAuthorization: { authorizationRef: string; authorizationDigest: string; authorizedAt: string };
  invocationRefs: Record<InvocationRole, Exclude<InvocationProvenance, null>>;
  newEntryCount: number;
  changedFiles: string[];
  promotionPackagePath: string;
  promotionPatchPath: string;
  liveRepositoryFingerprintBefore: string;
  liveRepositoryFingerprintAfter: string;
}

export type PreschoolReferenceTrialResult =
  | PreschoolReferenceTrialStopV1
  | PreschoolReferenceTrialObservablePayloadStopV1
  | PreschoolReferenceTrialResponsibilityBriefStopV1
  | PreschoolReferenceTrialAuthorizationStopV1
  | PreschoolReferenceTrialVerifiedV2;

export function buildPreschoolReferenceTrialVerifiedResult(input: {
  briefSha256: string;
  responsibilityMappings: PreschoolReferenceResponsibilityMappingV1[];
  attemptRef: string;
  attemptManifestRef: string;
  executionAuthorization: { authorizationRef: string; authorizationDigest: string; authorizedAt: string };
  invocationRefs: Record<InvocationRole, Exclude<InvocationProvenance, null>>;
  downstream: Pick<PreschoolReferenceTrialVerifiedV2,
    'status' | 'runRef' | 'newEntryCount' | 'changedFiles' | 'promotionPackagePath'
    | 'promotionPatchPath' | 'liveRepositoryFingerprintBefore' | 'liveRepositoryFingerprintAfter'>;
}): PreschoolReferenceTrialVerifiedV2 {
  if (input.briefSha256 !== PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_RESPONSIBILITY_BRIEF_SHA256) {
    throw new Error('Reference Responsibility Brief digest is not the accepted trust anchor.');
  }
  return {
    schemaVersion: 'preschool-reference-trial-result-v2',
    validationLayer: PRESCHOOL_REFERENCE_VALIDATION_LAYER,
    responsibilityProvenance: PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE,
    referenceResponsibilityBriefRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH,
    referenceResponsibilityBriefSha256: input.briefSha256,
    referenceResponsibilityAttestationRef: REFERENCE_RESPONSIBILITY_ATTESTATION_PATH,
    responsibilityMappings: input.responsibilityMappings,
    attemptRef: input.attemptRef,
    attemptManifestRef: input.attemptManifestRef,
    executionAuthorization: input.executionAuthorization,
    invocationRefs: input.invocationRefs,
    ...input.downstream,
  };
}

export interface RunPreschoolReferenceTrialInput {
  liveRepositoryRoot: string;
  evidencePath?: string | null;
  observablePayloadPath?: string | null;
  responsibilityBriefPath?: string | null;
  attemptRef?: string | null;
  executionAuthorizationPath?: string | null;
  expectedExecutionAuthorizationSha256?: string | null;
}

export interface PreschoolReferenceTrialDependencies {
  resolveReferenceParticipantBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
}

export function canonicalAttemptManifestJson(value: unknown): string {
  const canonicalize = (current: unknown): unknown => {
    if (current === null || typeof current !== 'object') return current;
    if (Array.isArray(current)) return current.map(canonicalize);
    const ordered = Object.create(null) as Record<string, unknown>;
    for (const key of Object.keys(current).sort()) {
      const child = (current as Record<string, unknown>)[key];
      if (child !== undefined) ordered[key] = canonicalize(child);
    }
    return ordered;
  };
  return JSON.stringify(canonicalize(value));
}

export function createAttemptManifestTransitionToken(manifest: object): string {
  return sha256Hex(canonicalAttemptManifestJson(manifest));
}

class TrialAdmissionStop extends Error {}
class TrialPreflightStop extends Error {}
class TrialInvocationProvenanceFailure extends Error {
  readonly errorKind = 'INVOCATION_PROVENANCE_INVALID';

  constructor(readonly diagnostics: string[]) {
    super(`Required invocation provenance is invalid: ${diagnostics.join('; ')}`);
  }
}
export class TrialParticipantFailure extends Error {
  constructor(readonly errorKind: string, readonly failureArtifactRef: string, message: string) {
    super(message);
  }
}

function historyArtifactEntries(root: string, relativeRoot = '', excludedTopLevelNames: string[] = []): PreschoolReferenceTrialHistoryArtifactV1[] {
  const output: PreschoolReferenceTrialHistoryArtifactV1[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!relativeRoot && excludedTopLevelNames.includes(entry.name)) continue;
    const absolutePath = join(root, entry.name);
    const relativePath = relativeRoot ? `${relativeRoot}/${entry.name}` : entry.name;
    const stat = lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      output.push({ path: relativePath, kind: 'symlink', sha256: sha256Hex(readlinkSync(absolutePath)) });
    } else if (stat.isDirectory()) {
      output.push({ path: relativePath, kind: 'directory' });
      output.push(...historyArtifactEntries(absolutePath, relativePath));
    } else if (stat.isFile()) {
      output.push({ path: relativePath, kind: 'file', sha256: sha256Hex(readFileSync(absolutePath)) });
    } else {
      throw new TrialAdmissionStop(`Historical material ${relativePath} has an unsupported filesystem type.`);
    }
  }
  return output;
}

function readAttemptManifestState(manifestPath: string, attemptRef: string): AttemptManifest['state'] | null {
  try {
    const stat = lstatSync(manifestPath);
    if (!stat.isFile()) throw new TrialAdmissionStop(`Existing attempt manifest ${attemptRef} is not a regular file.`);
    const parsed = JSON.parse(readFileSync(manifestPath, 'utf8')) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new TrialAdmissionStop(`Existing attempt manifest ${attemptRef} is malformed.`);
    }
    const manifest = parsed as Record<string, unknown>;
    if (manifest.schemaVersion !== 'preschool-reference-trial-attempt-manifest-v1'
      || manifest.runRef !== PRESCHOOL_REFERENCE_TRIAL_RUN_REF
      || manifest.attemptRef !== attemptRef
      || !['CREATED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'STOPPED'].includes(String(manifest.state))) {
      throw new TrialAdmissionStop(`Existing attempt manifest ${attemptRef} has invalid identity or state.`);
    }
    return manifest.state as AttemptManifest['state'];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function captureReferenceTrialLegacyHistory(
  referenceTrialRoot: string,
): Promise<PreschoolReferenceTrialAcknowledgedHistoryV1> {
  const root = resolve(referenceTrialRoot);
  let rootStat;
  try {
    rootStat = lstatSync(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        schemaVersion: 'preschool-reference-trial-acknowledged-history-v1',
        attemptsDirectoryPresent: false,
        attempts: [],
        runLevelMaterial: [],
      };
    }
    throw error;
  }
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new TrialAdmissionStop('Reference trial history root is not a regular directory.');
  }

  const runLevelMaterial = historyArtifactEntries(root, '', ['attempts']);
  const attemptsDirectoryPath = join(root, 'attempts');
  let attemptsStat;
  try {
    attemptsStat = lstatSync(attemptsDirectoryPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    return {
      schemaVersion: 'preschool-reference-trial-acknowledged-history-v1',
      attemptsDirectoryPresent: false,
      attempts: [],
      runLevelMaterial,
    };
  }
  if (!attemptsStat.isDirectory() || attemptsStat.isSymbolicLink()) {
    throw new TrialAdmissionStop('Reference trial attempts path is not a regular directory.');
  }

  const attempts = readdirSync(attemptsDirectoryPath, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .map(entry => {
      if (!/^attempt-[0-9]{6}$/.test(entry.name) || !entry.isDirectory() || entry.isSymbolicLink()) {
        throw new TrialAdmissionStop(`Unexpected attempt history entry ${entry.name}; admission cannot be proven.`);
      }
      const attemptRoot = join(attemptsDirectoryPath, entry.name);
      const manifestState = readAttemptManifestState(join(attemptRoot, 'attempt-manifest.json'), entry.name);
      return {
        attemptRef: entry.name,
        manifestPresent: manifestState !== null,
        manifestState,
        artifacts: historyArtifactEntries(attemptRoot),
      };
    });
  return {
    schemaVersion: 'preschool-reference-trial-acknowledged-history-v1',
    attemptsDirectoryPresent: true,
    attempts,
    runLevelMaterial,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertExactObjectKeys(value: Record<string, unknown>, keys: string[], description: string): void {
  if (Object.keys(value).sort().join('\0') !== [...keys].sort().join('\0')) {
    throw new TrialAdmissionStop(`${description} contains missing or unknown fields.`);
  }
}

async function readExecutionAuthorization(
  path: string,
  attemptRef: string,
  expectedExecutionAuthorizationSha256: string,
): Promise<PreschoolReferenceTrialExecutionAuthorizationV2> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
  } catch (error) {
    throw new TrialAdmissionStop(`Execution authorization artifact could not be read or parsed: ${String(error)}`);
  }
  if (!isRecord(parsed)) throw new TrialAdmissionStop('Execution authorization artifact must be a JSON object.');
  assertExactObjectKeys(parsed, [
    'schemaVersion', 'authorizationRef', 'runRef', 'attemptRef', 'authorizedAt',
    'acknowledgedLegacyHistory', 'participantBindingLock', 'participantBindingLockSha256', 'canonicalSha256',
  ], 'Execution authorization artifact');
  const body = Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== 'canonicalSha256'));
  const computedCanonicalSha256 = sha256Hex(canonicalAttemptManifestJson(body));
  let computedParticipantBindingLockSha256: string | null = null;
  if (isRecord(parsed.participantBindingLock)) {
    try {
      computedParticipantBindingLockSha256 = referenceParticipantBindingLockSha256(
        parsed.participantBindingLock as unknown as ReferenceParticipantBindingLockV1,
      );
    } catch {
      computedParticipantBindingLockSha256 = null;
    }
  }
  if (parsed.schemaVersion !== 'preschool-reference-trial-execution-authorization-v2'
    || typeof parsed.authorizationRef !== 'string'
    || parsed.authorizationRef.trim().length === 0
    || parsed.authorizationRef.length > 256
    || /[\u0000-\u001f\u007f]/.test(parsed.authorizationRef)
    || parsed.runRef !== PRESCHOOL_REFERENCE_TRIAL_RUN_REF
    || parsed.attemptRef !== attemptRef
    || typeof parsed.authorizedAt !== 'string'
    || !Number.isFinite(Date.parse(parsed.authorizedAt))
    || new Date(parsed.authorizedAt).toISOString() !== parsed.authorizedAt
    || typeof parsed.canonicalSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(parsed.canonicalSha256)
    || typeof parsed.participantBindingLockSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(parsed.participantBindingLockSha256)
    || computedParticipantBindingLockSha256 !== parsed.participantBindingLockSha256
    || computedCanonicalSha256 !== parsed.canonicalSha256) {
    throw new TrialAdmissionStop('Execution authorization identity, schema, binding-lock digest, timestamp, or canonical digest is invalid.');
  }
  if (typeof expectedExecutionAuthorizationSha256 !== 'string'
    || !/^[a-f0-9]{64}$/.test(expectedExecutionAuthorizationSha256)) {
    throw new TrialAdmissionStop('An exact external Human-approved authorization SHA-256 is required.');
  }
  if (computedCanonicalSha256 !== expectedExecutionAuthorizationSha256) {
    throw new TrialAdmissionStop('Execution authorization digest does not match the external Human-approved SHA-256.');
  }
  if (!isRecord(parsed.acknowledgedLegacyHistory)) {
    throw new TrialAdmissionStop('Execution authorization legacy history acknowledgement is malformed.');
  }
  return parsed as unknown as PreschoolReferenceTrialExecutionAuthorizationV2;
}

function nextManifestUpdatedAt(previousUpdatedAt: string): string {
  const previousTime = Date.parse(previousUpdatedAt);
  if (!Number.isFinite(previousTime)) throw new Error('Current attempt manifest updatedAt token is invalid.');
  return new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
}

function absentInputSet(): AttemptManifest['inputSet'] {
  return Object.fromEntries(Object.entries(INPUT_PROVENANCE_SPECS).map(([key, spec]) => [key, {
    ...spec,
    sha256: 'ABSENT',
    availability: 'ABSENT',
  }])) as AttemptManifest['inputSet'];
}

function referenceTrialRoot(root: string): string {
  return join(resolve(root), 'artifacts/evolution/autonomous-authoring/reference-trials', PRESCHOOL_REFERENCE_TRIAL_RUN_REF);
}

export async function admitReferenceTrialAttempt(input: {
  liveRepositoryRoot: string;
  attemptRef: string;
  executionAuthorizationPath: string;
  expectedExecutionAuthorizationSha256: string;
}, resolveBindingFromLock: typeof resolveReferenceParticipantBindingFromLock = resolveReferenceParticipantBindingFromLock): Promise<{ outputRoot: string; manifest: AttemptManifest }> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  const attemptRef = validateReferenceTrialAttemptRef(input.attemptRef);
  const authorizationPath = isAbsolute(input.executionAuthorizationPath)
    ? input.executionAuthorizationPath
    : resolve(liveRoot, input.executionAuthorizationPath);
  const authorization = await readExecutionAuthorization(
    authorizationPath,
    attemptRef,
    input.expectedExecutionAuthorizationSha256,
  );
  const runnerFingerprint = await captureWorktreeSourceFingerprint(process.cwd());
  const liveRepositoryFingerprintBefore = await captureAuthoritativeFingerprint(liveRoot);
  const trialRoot = referenceTrialRoot(liveRoot);
  const lockPath = `${trialRoot}.admission.lock`;
  await mkdir(dirname(trialRoot), { recursive: true });
  try {
    await mkdir(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new TrialAdmissionStop('Reference trial admission lock already exists; refusing admission.');
    }
    throw error;
  }
  try {
    const history = await captureReferenceTrialLegacyHistory(trialRoot);
    if (history.attempts.some(item => item.attemptRef === attemptRef)) {
      throw new TrialAdmissionStop(`Target attempt ${attemptRef} already exists; create-only admission is required.`);
    }
    const activeAttempt = history.attempts.find(item => item.manifestState === 'CREATED' || item.manifestState === 'RUNNING');
    if (activeAttempt) {
      throw new TrialAdmissionStop(`Reference trial runRef ${PRESCHOOL_REFERENCE_TRIAL_RUN_REF} already has active attempt ${activeAttempt.attemptRef} (${activeAttempt.manifestState}).`);
    }
    if (canonicalAttemptManifestJson(history) !== canonicalAttemptManifestJson(authorization.acknowledgedLegacyHistory)) {
      throw new TrialAdmissionStop('Execution authorization legacy history acknowledgement does not exactly match current disk history.');
    }
    for (const existing of history.attempts) {
      if (!existing.manifestPresent) continue;
      const manifest = JSON.parse(readFileSync(join(trialRoot, 'attempts', existing.attemptRef, 'attempt-manifest.json'), 'utf8')) as Record<string, unknown>;
      if (manifest.authorizationRef === authorization.authorizationRef
        || manifest.authorizationDigest === authorization.canonicalSha256) {
        throw new TrialAdmissionStop(`Execution authorization ${authorization.authorizationRef} was already consumed by attempt ${existing.attemptRef}.`);
      }
    }

    await resolveBindingFromLock({ repositoryRoot: liveRoot, lock: authorization.participantBindingLock });

    const outputRoot = join(trialRoot, 'attempts', attemptRef);
    await mkdir(dirname(outputRoot), { recursive: true });
    await mkdir(outputRoot, { recursive: false });
    await writeCreateOnlyJson(join(outputRoot, 'participant-binding-lock.json'), authorization.participantBindingLock);
    const createdAt = new Date().toISOString();
    const manifest: AttemptManifest = {
      schemaVersion: 'preschool-reference-trial-attempt-manifest-v1',
      runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
      attemptRef,
      createdAt,
      updatedAt: createdAt,
      runnerProvenance: {
        gitSha: runnerFingerprint.headSha,
        branch: runnerFingerprint.branch,
        dirtyFingerprintSha256: sha256Hex(canonicalAttemptManifestJson(runnerFingerprint.worktreeEntries)),
      },
      historicalBaselineProvenance: {
        candidateBaselineGitSha: PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA,
        candidateBaselineFingerprintSha256: null,
        liveRepositoryFingerprintBefore,
      },
      authorizationRef: authorization.authorizationRef,
      authorizationArtifactPath: authorizationPath,
      authorizationDigest: authorization.canonicalSha256,
      expectedAuthorizationDigest: input.expectedExecutionAuthorizationSha256,
      authorizedAt: authorization.authorizedAt,
      acknowledgedLegacyHistory: structuredClone(authorization.acknowledgedLegacyHistory),
      participantBindingLock: structuredClone(authorization.participantBindingLock),
      participantBindingLockSha256: authorization.participantBindingLockSha256,
      artifactRefs: {
        attemptManifest: 'attempt-manifest.json',
        trialResult: 'trial-result.json',
        attemptStop: 'attempt-stop.json',
        decision: 'decision.json',
        promotionPackage: 'promotion-package.json',
        promotionPatch: 'promotion.patch',
        solutionInvocation: 'solution-agent/invocation.json',
        solutionCompletion: 'solution-agent/execution-trace.json',
        solutionPrompt: 'solution-agent/participant-prompt.txt',
        reviewerInvocation: 'reviewer-agent/invocation.json',
        reviewerCompletion: 'reviewer-agent/execution-trace.json',
        reviewerPrompt: 'reviewer-agent/participant-prompt.txt',
        shadowInvocation: 'shadow-authoring/invocation.json',
        shadowCompletion: 'shadow-authoring/execution-trace.json',
        shadowPrompt: 'shadow-authoring/participant-prompt.txt',
        participantBindingLock: 'participant-binding-lock.json',
      },
      inputSet: absentInputSet(),
      participantPromptProvenance: {
        solution: { role: 'solution', status: 'NOT_INVOKED' },
        reviewer: { role: 'reviewer', status: 'NOT_INVOKED' },
        shadowAuthoring: { role: 'shadowAuthoring', status: 'NOT_INVOKED' },
      },
      invocationRefs: { solution: null, reviewer: null, shadowAuthoring: null },
      state: 'CREATED',
      currentStage: 'PREFLIGHT',
      terminalOutcome: null,
    };
    const manifestPath = join(outputRoot, 'attempt-manifest.json');
    await writeFile(manifestPath, `${canonicalAttemptManifestJson(manifest)}\n`, { flag: 'wx' });
    attemptManifestWriterTokens.set(manifest, createAttemptManifestTransitionToken(manifest));
    return { outputRoot, manifest };
  } finally {
    await rm(lockPath, { recursive: true, force: true });
  }
}

const INPUT_PROVENANCE_SPECS: Record<ManifestInputKey, { inputIdentity: string; artifactRef: string }> = {
  acceptedEvidence: { inputIdentity: 'ACCEPTED_EVIDENCE', artifactRef: ACCEPTED_EVIDENCE_INPUT_PATH },
  observablePayload: { inputIdentity: 'OBSERVABLE_PAYLOAD', artifactRef: OBSERVABLE_PAYLOAD_PATH },
  observableSummary: { inputIdentity: 'OBSERVABLE_SUMMARY', artifactRef: OBSERVABLE_SUMMARY_PATH },
  responsibilityBrief: { inputIdentity: 'RESPONSIBILITY_BRIEF', artifactRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH },
  responsibilityAttestation: { inputIdentity: 'RESPONSIBILITY_ATTESTATION', artifactRef: REFERENCE_RESPONSIBILITY_ATTESTATION_PATH },
  sourceAttestation: { inputIdentity: 'SOURCE_ATTESTATION', artifactRef: REFERENCE_SOURCE_ATTESTATION_PATH },
  capacitySummary: { inputIdentity: 'CAPACITY_SUMMARY', artifactRef: CAPACITY_SUMMARY_PATH },
  externalFeedback: { inputIdentity: 'EXTERNAL_FEEDBACK', artifactRef: FEEDBACK_SUMMARY_PATH },
  improvementHypothesis: { inputIdentity: 'IMPROVEMENT_HYPOTHESIS', artifactRef: HYPOTHESIS_SUMMARY_PATH },
  contractPacket: { inputIdentity: 'CONTRACT_PACKET', artifactRef: CONTRACT_PACKET_PATH },
  problemPackage: { inputIdentity: 'PROBLEM_PACKAGE', artifactRef: 'problem-package.json' },
  solutionResult: { inputIdentity: 'SOLUTION_RESULT', artifactRef: 'solution-agent/result.json' },
  reviewerResult: { inputIdentity: 'REVIEWER_RESULT', artifactRef: 'reviewer-agent/review.json' },
};

async function inspectInputArtifact(
  outputRoot: string,
  spec: { inputIdentity: string; artifactRef: string },
): Promise<ManifestInputProvenance> {
  try {
    return {
      ...spec,
      sha256: sha256Hex(await readFile(join(outputRoot, spec.artifactRef))),
      availability: 'PRESENT',
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return { ...spec, sha256: 'ABSENT', availability: 'ABSENT' };
    return {
      ...spec,
      sha256: 'UNREADABLE',
      availability: 'UNREADABLE',
      diagnostic: `Input artifact could not be read (${code ?? 'UNKNOWN'}).`,
    };
  }
}

async function refreshInputSet(outputRoot: string, manifest: AttemptManifest): Promise<string[]> {
  const diagnostics: string[] = [];
  for (const [key, spec] of Object.entries(INPUT_PROVENANCE_SPECS) as Array<[
    ManifestInputKey,
    (typeof INPUT_PROVENANCE_SPECS)[ManifestInputKey],
  ]>) {
    const provenance = await inspectInputArtifact(outputRoot, spec);
    if (provenance.availability === 'UNREADABLE' && provenance.diagnostic) {
      diagnostics.push(`${provenance.artifactRef}: ${provenance.diagnostic}`);
    }
    manifest.inputSet[key] = provenance;
  }
  return diagnostics;
}

function expectedInvocationRef(attemptRef: string, role: InvocationRole): string {
  return referenceTrialInvocationRef(attemptRef, role === 'shadowAuthoring' ? 'shadow-authoring' : role);
}

async function readInvocationProvenance(
  path: string,
  artifactRef: string,
  expectedRef: string,
  role: InvocationRole,
  requireSuccessfulStatus = false,
): Promise<Exclude<InvocationProvenance, null>> {
  let invocationBytes: Buffer;
  try {
    invocationBytes = await readFile(path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return { status: 'CORRUPTED', artifactRef, diagnostic: code === 'ENOENT'
      ? 'Invocation artifact is missing after invocation began.'
      : `Invocation artifact could not be read (${code ?? 'UNKNOWN'}).` };
  }
  let invocation: Record<string, unknown>;
  try {
    const parsed = JSON.parse(invocationBytes.toString('utf8')) as unknown;
    if (!isRecord(parsed)) throw new Error('Invocation artifact must contain a JSON object.');
    invocation = parsed;
  } catch (error) {
    return { status: 'CORRUPTED', artifactRef, diagnostic: `Invocation artifact is not valid JSON (${String(error)}).` };
  }
  if (invocation.invocationRef !== expectedRef) {
    return { status: 'CORRUPTED', artifactRef, diagnostic: `Invocation artifact ref ${String(invocation.invocationRef)} does not match expected ref ${expectedRef}.` };
  }
  if (role !== 'shadowAuthoring' && invocation.status !== 'completed' && invocation.status !== 'failed') {
    return { status: 'CORRUPTED', artifactRef, diagnostic: `${role} invocation status is missing or invalid.` };
  }
  if (requireSuccessfulStatus && role !== 'shadowAuthoring' && invocation.status !== 'completed') {
    return { status: 'CORRUPTED', artifactRef, diagnostic: `${role} invocation status is not completed.` };
  }

  const completionArtifactRef = artifactRef.replace(/invocation\.json$/, 'execution-trace.json');
  let completionBytes: Buffer;
  try {
    completionBytes = await readFile(join(dirname(path), 'execution-trace.json'));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return { status: 'CORRUPTED', artifactRef: completionArtifactRef, diagnostic: code === 'ENOENT'
      ? 'Invocation completion evidence is missing after invocation began.'
      : `Invocation completion evidence could not be read (${code ?? 'UNKNOWN'}).` };
  }
  let trace: Record<string, unknown>;
  try {
    const parsed = JSON.parse(completionBytes.toString('utf8')) as unknown;
    if (!isRecord(parsed)) throw new Error('Execution trace must contain a JSON object.');
    trace = parsed;
  } catch (error) {
    return { status: 'CORRUPTED', artifactRef: completionArtifactRef, diagnostic: `Execution trace is not valid JSON (${String(error)}).` };
  }
  const invocationTrace = trace.invocation;
  const terminal = trace.terminal;
  const traceOutcome = isRecord(terminal) ? terminal.outcome : null;
  if (trace.schemaVersion !== 'participant-execution-trace-v1'
    || !isRecord(invocationTrace)
    || typeof invocationTrace.startedAt !== 'string'
    || !Number.isFinite(invocationTrace.timeoutMs)
    || !Array.isArray(trace.events)
    || !isRecord(terminal)
    || !['completed', 'failed', 'timeout', 'process_error'].includes(String(traceOutcome))
    || !Number.isFinite(terminal.elapsedMs)
    || (terminal.elapsedMs as number) < 0) {
    return { status: 'CORRUPTED', artifactRef: completionArtifactRef, diagnostic: 'Execution trace does not contain valid invocation completion evidence.' };
  }
  if (requireSuccessfulStatus && (traceOutcome !== 'completed'
    || (role !== 'shadowAuthoring' && invocation.status !== 'completed'))) {
    return { status: 'CORRUPTED', artifactRef: completionArtifactRef, diagnostic: `Invocation completion outcome is ${String(traceOutcome)}, not completed.` };
  }
  const completionOutcome: InvocationOutcome = role === 'shadowAuthoring'
    ? traceOutcome as InvocationOutcome
    : invocation.status as InvocationOutcome;
  return {
    status: 'AVAILABLE',
    invocationRef: expectedRef,
    artifactRef,
    artifactSha256: sha256Hex(invocationBytes),
    completionEvidence: {
      artifactRef: completionArtifactRef,
      sha256: sha256Hex(completionBytes),
      outcome: completionOutcome,
    },
  };
}

async function withAttemptManifestLock<T>(manifestPath: string, action: () => Promise<T>): Promise<T> {
  const lockPath = `${manifestPath}.lock`;
  try {
    await mkdir(lockPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Attempt manifest transition lock already exists for ${manifestPath}; refusing transition.`);
    }
    throw error;
  }
  try {
    return await action();
  } finally {
    await rm(lockPath, { recursive: true, force: true });
  }
}

async function readAttemptManifestSnapshot(path: string, context: string): Promise<AttemptManifestSnapshot> {
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    throw new Error(`Cannot read the current attempt manifest before ${context}: ${String(error)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString('utf8')) as unknown;
  } catch {
    throw new Error(`Cannot ${context} because the current attempt manifest is malformed.`);
  }
  if (!isRecord(parsed)) throw new Error(`Cannot ${context} because the current attempt manifest is malformed.`);
  const manifest = parsed as unknown as AttemptManifest;
  if (manifest.schemaVersion !== 'preschool-reference-trial-attempt-manifest-v1'
    || manifest.runRef !== PRESCHOOL_REFERENCE_TRIAL_RUN_REF
    || typeof manifest.attemptRef !== 'string'
    || !['CREATED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'STOPPED'].includes(manifest.state)
    || !TRIAL_STAGE_ORDER.includes(manifest.currentStage)) {
    throw new Error(`Cannot ${context} because the current attempt manifest identity or state is malformed.`);
  }
  return { manifest, token: createAttemptManifestTransitionToken(manifest) };
}

function assertAttemptManifestIdentity(snapshot: AttemptManifestSnapshot, expected: AttemptManifest): void {
  if (snapshot.manifest.schemaVersion !== 'preschool-reference-trial-attempt-manifest-v1'
    || snapshot.manifest.runRef !== PRESCHOOL_REFERENCE_TRIAL_RUN_REF
    || snapshot.manifest.runRef !== expected.runRef
    || snapshot.manifest.attemptRef !== expected.attemptRef) {
    throw new Error('Current attempt manifest identity does not match the supplied attempt.');
  }
}

function assertAttemptManifestTransitionToken(snapshot: AttemptManifestSnapshot, expectedToken: string): void {
  if (snapshot.token !== expectedToken) throw new Error('Current attempt manifest transition token does not match the caller version.');
}

function assertAttemptManifestSnapshotUnchanged(actual: AttemptManifestSnapshot, expected: AttemptManifestSnapshot): void {
  assertAttemptManifestIdentity(actual, expected.manifest);
  assertAttemptManifestTransitionToken(actual, expected.token);
  if (actual.manifest.state !== expected.manifest.state || actual.manifest.currentStage !== expected.manifest.currentStage) {
    throw new Error('Current attempt manifest changed during terminal transition; refusing to commit.');
  }
}

async function persistAttemptManifest(path: string, manifest: AttemptManifest): Promise<void> {
  const temporaryPath = `${path}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporaryPath, `${canonicalAttemptManifestJson(manifest)}\n`, { flag: 'wx' });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

export async function writeAttemptManifest(path: string, manifest: AttemptManifest): Promise<void> {
  const expectedToken = attemptManifestWriterTokens.get(manifest);
  if (!expectedToken) throw new Error('Attempt manifest writer has no transition token; refusing to update.');
  await withAttemptManifestLock(path, async () => {
    const current = await readAttemptManifestSnapshot(path, 'manifest update');
    assertAttemptManifestIdentity(current, manifest);
    assertAttemptManifestTransitionToken(current, expectedToken);
    if (current.manifest.state !== 'CREATED' && current.manifest.state !== 'RUNNING') {
      throw new Error(`Cannot update terminal attempt manifest state ${current.manifest.state}.`);
    }
    const createdStateTransition = current.manifest.state === 'CREATED'
      && (manifest.state === 'CREATED' || manifest.state === 'RUNNING' || manifest.state === 'STOPPED');
    const runningStateUpdate = current.manifest.state === 'RUNNING' && manifest.state === 'RUNNING';
    if (!createdStateTransition && !runningStateUpdate) {
      throw new Error(`Illegal attempt manifest state transition ${current.manifest.state} -> ${manifest.state}.`);
    }
    if (current.manifest.state === 'CREATED' && manifest.currentStage !== current.manifest.currentStage) {
      throw new Error('Cannot change the attempt stage before it enters RUNNING.');
    }
    if (current.manifest.state === 'RUNNING'
      && TRIAL_STAGE_ORDER.indexOf(manifest.currentStage) < TRIAL_STAGE_ORDER.indexOf(current.manifest.currentStage)) {
      throw new Error('Cannot move the attempt stage backwards.');
    }
    if (manifest.state === 'STOPPED'
      && (current.manifest.state !== 'CREATED' || manifest.terminalOutcome?.status !== 'REFERENCE_EVIDENCE_UNAVAILABLE')) {
      throw new Error('CREATED may transition to STOPPED only for unavailable reference evidence.');
    }
    const nextManifest = { ...manifest, updatedAt: nextManifestUpdatedAt(current.manifest.updatedAt) };
    await persistAttemptManifest(path, nextManifest);
    Object.assign(manifest, nextManifest);
    attemptManifestWriterTokens.set(manifest, createAttemptManifestTransitionToken(nextManifest));
  });
}

async function commitAttemptManifestTerminal(
  path: string,
  expected: AttemptManifestSnapshot,
  terminalManifest: AttemptManifest,
): Promise<void> {
  const current = await readAttemptManifestSnapshot(path, 'terminal commit');
  assertAttemptManifestSnapshotUnchanged(current, expected);
  const allowedTransition = (current.manifest.state === 'RUNNING'
    && (terminalManifest.state === 'SUCCEEDED' || terminalManifest.state === 'FAILED'
      || (terminalManifest.state === 'STOPPED' && terminalManifest.terminalOutcome?.status === 'CLEANUP_INCOMPLETE')))
    || (current.manifest.state === 'CREATED' && terminalManifest.state === 'STOPPED'
      && terminalManifest.terminalOutcome?.status === 'REFERENCE_PREFLIGHT_STOPPED');
  if (!allowedTransition) throw new Error(`Illegal terminal attempt manifest transition ${current.manifest.state} -> ${terminalManifest.state}.`);
  const committedManifest = { ...terminalManifest, updatedAt: nextManifestUpdatedAt(current.manifest.updatedAt) };
  await persistAttemptManifest(path, committedManifest);
  Object.assign(terminalManifest, committedManifest);
}

function invocationArtifact(role: InvocationRole): { stage: TrialStage; artifactRef: string } {
  if (role === 'solution') return { stage: 'SOLUTION', artifactRef: 'solution-agent/invocation.json' };
  if (role === 'reviewer') return { stage: 'REVIEWER', artifactRef: 'reviewer-agent/invocation.json' };
  return { stage: 'SHADOW_AUTHORING', artifactRef: 'shadow-authoring/invocation.json' };
}

function participantPromptArtifactRef(role: InvocationRole): string {
  if (role === 'solution') return 'solution-agent/participant-prompt.txt';
  if (role === 'reviewer') return 'reviewer-agent/participant-prompt.txt';
  return 'shadow-authoring/participant-prompt.txt';
}

async function readAttemptParticipantRetransmissionLifecycle(
  outputRoot: string,
  role: InvocationRole,
): Promise<ParticipantRetransmissionLifecycle> {
  const tracePath = join(outputRoot, dirname(invocationArtifact(role).artifactRef), 'execution-trace.json');
  let trace: unknown;
  try {
    trace = JSON.parse((await readFile(tracePath)).toString('utf8')) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { status: 'AVAILABLE', runtimeOutcomes: [], tracePresent: false, requestPresent: false };
    }
    return {
      status: 'CORRUPTED',
      diagnostic: `Cannot establish ${role} retransmission lifecycle evidence: ${String(error)}`,
      runtimeOutcomes: [],
      tracePresent: true,
      requestPresent: false,
    };
  }
  if (!isRecord(trace) || trace.schemaVersion !== 'participant-execution-trace-v1' || !Array.isArray(trace.events)) {
    return {
      status: 'CORRUPTED',
      diagnostic: `${role} execution trace has no valid retransmission event list.`,
      runtimeOutcomes: [],
      tracePresent: true,
      requestPresent: false,
    };
  }

  const requests = trace.events.filter((event: unknown) =>
    isRecord(event) && event.type === 'participant_envelope_retransmission_requested');
  const completions = trace.events.filter((event: unknown) =>
    isRecord(event) && event.type === 'participant_envelope_retransmission_completed') as Record<string, unknown>[];
  const runtimeOutcomes: RetransmissionRuntimeOutcome[] = [];
  const diagnostics: string[] = [];
  if (requests.length > 1 || requests.some((event: Record<string, unknown>) => event.retransmissionAttempt !== 1)) {
    diagnostics.push(`${role} execution trace contains unsupported or duplicate retransmission requests.`);
  }
  if (completions.length > 1
    || completions.some(event => event.retransmissionAttempt !== 1 || !requests.some((request: Record<string, unknown>) => request.retransmissionAttempt === event.retransmissionAttempt))) {
    diagnostics.push(`${role} execution trace contains unsupported, duplicate, or orphan retransmission completions.`);
  }
  if (requests.length !== completions.length) {
    diagnostics.push(`${role} retransmission request and completion events do not correspond one-to-one.`);
  }
  for (const completion of completions) {
    if (completion.runtimeOutcome !== 'COMPLETED'
      && completion.runtimeOutcome !== 'TIMEOUT'
      && completion.runtimeOutcome !== 'CONTINUATION_FAILURE'
      && completion.runtimeOutcome !== 'RUNTIME_FAILURE') {
      diagnostics.push(`${role} retransmission completion has an unsupported runtime outcome.`);
      continue;
    }
    runtimeOutcomes.push(completion.runtimeOutcome);
  }
  if (diagnostics.length > 0) {
    return {
      status: 'CORRUPTED', diagnostic: diagnostics.join(' '), runtimeOutcomes, tracePresent: true,
      requestPresent: requests.length > 0,
    };
  }
  return { status: 'AVAILABLE', runtimeOutcomes, tracePresent: true, requestPresent: requests.length > 0 };
}

export async function readAttemptParticipantPromptProvenance(
  outputRoot: string,
  role: InvocationRole,
): Promise<ParticipantPromptProvenance> {
  const artifactRef = participantPromptArtifactRef(role);
  const promptDirectory = dirname(artifactRef);
  const retransmissionArtifactRef = join(promptDirectory, PARTICIPANT_ENVELOPE_RETRANSMISSION_PROMPT_1_ARTIFACT);
  const diagnostics: string[] = [];
  const retransmissionPrompts: RetransmissionPromptProvenance[] = [];
  let initialBytes: Buffer | undefined;
  try {
    const path = join(outputRoot, artifactRef);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('persisted prompt is not a regular file');
    initialBytes = await readFile(path);
  } catch (error) {
    diagnostics.push(`Persisted ${role} participant prompt is missing or unreadable: ${String(error)}`);
  }

  let retransmissionArtifactPresent = false;
  try {
    const names = readdirSync(join(outputRoot, promptDirectory));
    for (const name of names) {
      if (!/^participant-envelope-retransmission-prompt-\d+\.txt$/.test(name)) continue;
      if (name !== PARTICIPANT_ENVELOPE_RETRANSMISSION_PROMPT_1_ARTIFACT) {
        diagnostics.push(`Unexpected ${role} retransmission prompt artifact ${name}.`);
        continue;
      }
      retransmissionArtifactPresent = true;
      try {
        const path = join(outputRoot, retransmissionArtifactRef);
        const stat = lstatSync(path);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('persisted retransmission prompt is not a regular file');
        const bytes = await readFile(path);
        retransmissionPrompts.push({
          retransmissionAttempt: 1,
          artifactRef: retransmissionArtifactRef,
          sha256: sha256Hex(bytes),
          byteLength: bytes.byteLength,
        });
      } catch (error) {
        diagnostics.push(`Persisted ${role} retransmission prompt is unreadable: ${String(error)}`);
      }
    }
  } catch (error) {
    diagnostics.push(`Cannot inspect ${role} retransmission prompt artifacts: ${String(error)}`);
  }

  const lifecycle = await readAttemptParticipantRetransmissionLifecycle(outputRoot, role);
  if (lifecycle.status === 'CORRUPTED') diagnostics.push(lifecycle.diagnostic);
  if (!lifecycle.tracePresent && retransmissionArtifactPresent) {
    diagnostics.push(`Cannot establish ${role} retransmission lifecycle evidence without an execution trace.`);
  }
  if (lifecycle.requestPresent !== retransmissionArtifactPresent) {
    diagnostics.push(`${role} retransmission trace and persisted prompt artifact do not correspond.`);
  }
  if (diagnostics.length > 0 || initialBytes === undefined) {
    return {
      role, status: 'CORRUPTED', artifactRef, diagnostic: diagnostics.join(' '),
      ...(initialBytes === undefined ? {} : { sha256: sha256Hex(initialBytes), byteLength: initialBytes.byteLength }),
      retransmissionPrompts,
    };
  }
  return {
    role, status: 'AVAILABLE', artifactRef,
    sha256: sha256Hex(initialBytes), byteLength: initialBytes.byteLength,
    retransmissionPrompts,
  };
}

function retransmissionPromptProvenanceMatches(
  recorded: RetransmissionPromptProvenance[],
  actual: RetransmissionPromptProvenance[],
): boolean {
  return Array.isArray(recorded)
    && recorded.length === actual.length
    && recorded.every((item, index) => item.retransmissionAttempt === actual[index]?.retransmissionAttempt
      && item.artifactRef === actual[index]?.artifactRef
      && item.sha256 === actual[index]?.sha256
      && item.byteLength === actual[index]?.byteLength);
}

async function persistParticipantPromptProvenance(
  outputRoot: string,
  manifestPath: string,
  manifest: AttemptManifest,
  role: InvocationRole,
): Promise<void> {
  const provenance = await readAttemptParticipantPromptProvenance(outputRoot, role);
  manifest.participantPromptProvenance[role] = provenance;
  await writeAttemptManifest(manifestPath, manifest);
  if (provenance.status === 'CORRUPTED') {
    throw new TrialInvocationProvenanceFailure([`${role} prompt: ${provenance.diagnostic}`]);
  }
}

async function runWithParticipantPromptProvenance<T>(input: {
  outputRoot: string;
  manifestPath: string;
  manifest: AttemptManifest;
  role: InvocationRole;
  invoke: () => Promise<T>;
}): Promise<T> {
  try {
    return await input.invoke();
  } finally {
    await persistParticipantPromptProvenance(
      input.outputRoot,
      input.manifestPath,
      input.manifest,
      input.role,
    );
  }
}

async function assertParticipantPromptProvenanceMatchesDisk(
  outputRoot: string,
  manifest: AttemptManifest,
): Promise<void> {
  const failures: string[] = [];
  for (const role of ['solution', 'reviewer', 'shadowAuthoring'] as const) {
    const recorded = manifest.participantPromptProvenance[role];
    const expectedArtifactRef = participantPromptArtifactRef(role);
    if (recorded.status !== 'AVAILABLE' || recorded.role !== role || recorded.artifactRef !== expectedArtifactRef) {
      failures.push(`${role} participant prompt provenance is missing or invalid.`);
      continue;
    }
    const actual = await readAttemptParticipantPromptProvenance(outputRoot, role);
    const lifecycle = await readAttemptParticipantRetransmissionLifecycle(outputRoot, role);
    if (actual.status !== 'AVAILABLE'
      || actual.sha256 !== recorded.sha256
      || actual.byteLength !== recorded.byteLength
      || !retransmissionPromptProvenanceMatches(recorded.retransmissionPrompts, actual.retransmissionPrompts)) {
      failures.push(`${role} participant prompt provenance does not match the persisted prompt bytes.`);
    }
    if (lifecycle.status !== 'AVAILABLE' || lifecycle.runtimeOutcomes.some(outcome => outcome !== 'COMPLETED')) {
      failures.push(`${role} retransmission completion is missing, invalid, or did not complete successfully.`);
    }
  }
  if (failures.length > 0) throw new TrialInvocationProvenanceFailure(failures);
}

export async function finalizeReferenceTrialSuccess(
  manifestPath: string,
  suppliedManifest: AttemptManifest,
  suppliedResult: PreschoolReferenceTrialVerifiedV2,
  expectedManifestToken: string,
): Promise<void> {
  const manifest = structuredClone(suppliedManifest);
  const result = structuredClone(suppliedResult);
  if (createAttemptManifestTransitionToken(manifest) !== expectedManifestToken) {
    throw new Error('Supplied attempt manifest transition token does not match the caller manifest.');
  }
  const initialSnapshot = await readAttemptManifestSnapshot(manifestPath, 'success finalization');
  assertAttemptManifestIdentity(initialSnapshot, manifest);
  if (manifest.state !== initialSnapshot.manifest.state || manifest.currentStage !== initialSnapshot.manifest.currentStage) {
    throw new Error('Current attempt manifest state or stage does not match the supplied attempt.');
  }
  assertAttemptManifestTransitionToken(initialSnapshot, expectedManifestToken);
  if (manifest.state !== 'RUNNING') throw new Error(`Cannot finalize a successful reference trial from attempt state ${manifest.state}.`);
  if (manifest.currentStage !== 'CLEANUP') throw new Error('Cannot finalize success before the attempt reaches the CLEANUP stage.');
  if (result.schemaVersion !== 'preschool-reference-trial-result-v2'
    || result.status !== 'SHADOW_AUTHORING_VERIFIED'
    || result.runRef !== manifest.runRef
    || result.attemptRef !== manifest.attemptRef
    || result.executionAuthorization.authorizationRef !== manifest.authorizationRef
    || result.executionAuthorization.authorizationDigest !== manifest.authorizationDigest
    || result.referenceResponsibilityBriefSha256 !== manifest.inputSet.responsibilityBrief.sha256) {
    throw new Error('Successful reference trial result identity or provenance does not match its attempt manifest.');
  }

  await withAttemptManifestLock(manifestPath, async () => {
    const lockedSnapshot = await readAttemptManifestSnapshot(manifestPath, 'success finalization');
    assertAttemptManifestSnapshotUnchanged(lockedSnapshot, initialSnapshot);
    const outputRoot = dirname(manifestPath);
    await assertParticipantPromptProvenanceMatchesDisk(outputRoot, manifest);
    const invocationRefs = { ...manifest.invocationRefs };
    const provenanceFailures: string[] = [];
    for (const role of ['solution', 'reviewer', 'shadowAuthoring'] as const) {
      const artifact = invocationArtifact(role);
      const provenance = await readInvocationProvenance(
        join(outputRoot, artifact.artifactRef),
        artifact.artifactRef,
        expectedInvocationRef(manifest.attemptRef, role),
        role,
        true,
      );
      invocationRefs[role] = provenance;
      if (provenance.status === 'CORRUPTED') provenanceFailures.push(`${role}: ${provenance.diagnostic}`);
    }
    if (provenanceFailures.length > 0) throw new TrialInvocationProvenanceFailure(provenanceFailures);
    const availableInvocationRefs = invocationRefs as Record<InvocationRole, Exclude<InvocationProvenance, null>>;
    result.invocationRefs = structuredClone(availableInvocationRefs);
    const beforeResultSnapshot = await readAttemptManifestSnapshot(manifestPath, 'success finalization');
    assertAttemptManifestSnapshotUnchanged(beforeResultSnapshot, initialSnapshot);
    const trialResultPath = join(outputRoot, 'trial-result.json');
    await writeCreateOnlyJson(trialResultPath, result);
    const succeededManifest: AttemptManifest = {
      ...manifest,
      invocationRefs,
      state: 'SUCCEEDED',
      terminalOutcome: { status: 'SHADOW_AUTHORING_VERIFIED', trialResultRef: 'trial-result.json' },
    };
    try {
      await commitAttemptManifestTerminal(manifestPath, initialSnapshot, succeededManifest);
    } catch (error) {
      await rm(trialResultPath, { force: true });
      throw error;
    }
  });
}

export async function finalizeReferenceTrialFailure(
  manifestPath: string,
  suppliedManifest: AttemptManifest,
  error: unknown,
  expectedManifestToken: string,
): Promise<never> {
  const manifest = structuredClone(suppliedManifest);
  if (createAttemptManifestTransitionToken(manifest) !== expectedManifestToken) {
    throw new Error('Supplied attempt manifest transition token does not match the caller manifest.');
  }
  const participantFailure = error instanceof TrialParticipantFailure;
  const invocationFailure = error instanceof TrialInvocationProvenanceFailure;
  const failureMetadata = {
    errorKind: participantFailure || invocationFailure ? error.errorKind : 'RUNTIME_EXCEPTION',
    message: error instanceof Error ? error.message : String(error),
    failureArtifactRef: participantFailure ? error.failureArtifactRef : undefined,
    diagnostics: invocationFailure ? structuredClone(error.diagnostics) : undefined,
  };
  const initialSnapshot = await readAttemptManifestSnapshot(manifestPath, 'failure finalization');
  assertAttemptManifestIdentity(initialSnapshot, manifest);
  if (initialSnapshot.manifest.state !== manifest.state || initialSnapshot.manifest.currentStage !== manifest.currentStage) {
    throw new Error('Current attempt manifest state or stage does not match the supplied attempt.');
  }
  assertAttemptManifestTransitionToken(initialSnapshot, expectedManifestToken);
  if (initialSnapshot.manifest.state !== 'CREATED' && initialSnapshot.manifest.state !== 'RUNNING') {
    throw new Error(`Cannot finalize failure from terminal attempt state ${initialSnapshot.manifest.state}.`);
  }

  await withAttemptManifestLock(manifestPath, async () => {
    const lockedSnapshot = await readAttemptManifestSnapshot(manifestPath, 'failure finalization');
    assertAttemptManifestSnapshotUnchanged(lockedSnapshot, initialSnapshot);
    const outputRoot = dirname(manifestPath);
    const workingManifest: AttemptManifest = {
      ...manifest,
      inputSet: { ...manifest.inputSet },
      participantPromptProvenance: { ...manifest.participantPromptProvenance },
      invocationRefs: { ...manifest.invocationRefs },
    };
    const diagnosticFailures = await refreshInputSet(outputRoot, workingManifest);
    for (const role of ['solution', 'reviewer', 'shadowAuthoring'] as const) {
      const artifact = invocationArtifact(role);
      if (TRIAL_STAGE_ORDER.indexOf(workingManifest.currentStage) < TRIAL_STAGE_ORDER.indexOf(artifact.stage)) {
        workingManifest.invocationRefs[role] = null;
        continue;
      }
      const recordedPrompt = workingManifest.participantPromptProvenance[role];
      const actualPrompt = await readAttemptParticipantPromptProvenance(outputRoot, role);
      if (recordedPrompt.status === 'NOT_INVOKED' && actualPrompt.status === 'AVAILABLE') {
        workingManifest.participantPromptProvenance[role] = actualPrompt;
      } else if (recordedPrompt.status !== 'AVAILABLE'
        || actualPrompt.status !== 'AVAILABLE'
        || recordedPrompt.sha256 !== actualPrompt.sha256
        || recordedPrompt.byteLength !== actualPrompt.byteLength
        || recordedPrompt.artifactRef !== actualPrompt.artifactRef
        || !retransmissionPromptProvenanceMatches(recordedPrompt.retransmissionPrompts, actualPrompt.retransmissionPrompts)) {
        const diagnostic = actualPrompt.status === 'CORRUPTED'
          ? actualPrompt.diagnostic
          : `${role} participant prompt bytes do not match the recorded invocation provenance.`;
        const preservedSha256 = actualPrompt.sha256
          ?? (recordedPrompt.status === 'NOT_INVOKED' ? undefined : recordedPrompt.sha256);
        const preservedByteLength = actualPrompt.byteLength
          ?? (recordedPrompt.status === 'NOT_INVOKED' ? undefined : recordedPrompt.byteLength);
        workingManifest.participantPromptProvenance[role] = {
          role,
          status: 'CORRUPTED',
          artifactRef: participantPromptArtifactRef(role),
          diagnostic,
          ...(preservedSha256 === undefined ? {} : { sha256: preservedSha256 }),
          ...(preservedByteLength === undefined ? {} : { byteLength: preservedByteLength }),
          retransmissionPrompts: recordedPrompt.status !== 'NOT_INVOKED' && recordedPrompt.retransmissionPrompts.length > 0
            ? structuredClone(recordedPrompt.retransmissionPrompts) : actualPrompt.retransmissionPrompts,
        };
        const message = `participantPromptProvenance.${role}: ${diagnostic}`;
        if (!diagnosticFailures.includes(message)) diagnosticFailures.push(message);
      }
      const provenance = await readInvocationProvenance(
        join(outputRoot, artifact.artifactRef),
        artifact.artifactRef,
        expectedInvocationRef(workingManifest.attemptRef, role),
        role,
      );
      workingManifest.invocationRefs[role] = provenance;
      if (provenance.status === 'CORRUPTED') {
        const diagnostic = `invocationRefs.${role}: ${provenance.diagnostic}`;
        if (!diagnosticFailures.includes(diagnostic)) diagnosticFailures.push(diagnostic);
      }
    }
    if (failureMetadata.diagnostics) {
      for (const diagnostic of failureMetadata.diagnostics) {
        const message = `invocationRefs: ${diagnostic}`;
        if (!diagnosticFailures.includes(message)) diagnosticFailures.push(message);
      }
    }
    if (workingManifest.state === 'CREATED') {
      try {
        await writeCreateOnlyJson(join(outputRoot, 'attempt-stop.json'), {
          schemaVersion: 'preschool-reference-trial-attempt-stop-v1',
          reason: failureMetadata.message,
        });
      } catch (diagnosticError) {
        diagnosticFailures.push(`attempt-stop.json: ${String(diagnosticError)}`);
      }
      workingManifest.state = 'STOPPED';
      workingManifest.terminalOutcome = {
        status: 'REFERENCE_PREFLIGHT_STOPPED',
        stage: workingManifest.currentStage,
        failureMessage: failureMetadata.message,
        ...(diagnosticFailures.some(message => message.startsWith('attempt-stop.json:')) ? {} : { stopArtifactRef: 'attempt-stop.json' }),
      };
    } else {
      let trialResultStatus: 'PRESENT_UNREMOVED' | undefined;
      let cleanupIncomplete = false;
      for (const artifactRef of ['trial-result.json', 'promotion-package.json', 'promotion-package.md', 'promotion.patch']) {
        const artifactPath = join(outputRoot, artifactRef);
        try {
          await rm(artifactPath, { recursive: artifactRef !== 'trial-result.json', force: true });
        } catch (cleanupError) {
          cleanupIncomplete = true;
          diagnosticFailures.push(`${artifactRef}: cleanup failed: ${String(cleanupError)}`);
        }
        try {
          lstatSync(artifactPath);
          cleanupIncomplete = true;
          if (artifactRef === 'trial-result.json') trialResultStatus = 'PRESENT_UNREMOVED';
          diagnosticFailures.push(`${artifactRef}: residual artifact remains after cleanup attempt.`);
        } catch (verificationError) {
          if ((verificationError as NodeJS.ErrnoException).code !== 'ENOENT') {
            cleanupIncomplete = true;
            if (artifactRef === 'trial-result.json') trialResultStatus = 'PRESENT_UNREMOVED';
            diagnosticFailures.push(`${artifactRef}: artifact absence could not be verified (${String(verificationError)}).`);
          }
        }
      }
      workingManifest.state = cleanupIncomplete ? 'STOPPED' : 'FAILED';
      workingManifest.terminalOutcome = {
        status: cleanupIncomplete ? 'CLEANUP_INCOMPLETE' : 'FAILED',
        stage: workingManifest.currentStage,
        errorKind: failureMetadata.errorKind,
        failureMessage: failureMetadata.message,
        ...(participantFailure ? { failureArtifactRef: failureMetadata.failureArtifactRef } : {}),
        ...(trialResultStatus ? { trialResultRef: 'trial-result.json', trialResultStatus } : {}),
      };
    }
    if (diagnosticFailures.length > 0) workingManifest.terminalOutcome!.diagnosticFailures = diagnosticFailures;
    await commitAttemptManifestTerminal(manifestPath, initialSnapshot, workingManifest);
  });
  throw error;
}

async function finalizeReferenceTrialPreflightStop(
  manifestPath: string,
  manifest: AttemptManifest,
  result: PreschoolReferenceTrialStopV1 | PreschoolReferenceTrialObservablePayloadStopV1 | PreschoolReferenceTrialResponsibilityBriefStopV1,
): Promise<void> {
  const snapshot = await readAttemptManifestSnapshot(manifestPath, 'preflight stop');
  assertAttemptManifestIdentity(snapshot, manifest);
  assertAttemptManifestTransitionToken(snapshot, createAttemptManifestTransitionToken(manifest));
  if (manifest.state !== 'CREATED') throw new Error('A structured preflight stop can only terminate a CREATED attempt.');
  if (result.status === 'REFERENCE_EVIDENCE_UNAVAILABLE') {
    manifest.state = 'STOPPED';
    manifest.terminalOutcome = {
      status: 'REFERENCE_EVIDENCE_UNAVAILABLE',
      stopArtifactRef: `artifacts/evolution/autonomous-authoring/reference-trial-stops/${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}.json`,
    };
    await writeAttemptManifest(manifestPath, manifest);
    return;
  }
  await withAttemptManifestLock(manifestPath, async () => {
    const locked = await readAttemptManifestSnapshot(manifestPath, 'preflight stop');
    assertAttemptManifestSnapshotUnchanged(locked, snapshot);
    const outputRoot = dirname(manifestPath);
    let stopArtifactRef: string | undefined;
    try {
      await writeCreateOnlyJson(join(outputRoot, 'attempt-stop.json'), {
        schemaVersion: 'preschool-reference-trial-attempt-stop-v1',
        result,
      });
      stopArtifactRef = 'attempt-stop.json';
    } catch {
      // The terminal outcome still records the stop when a diagnostic artifact cannot be created.
    }
    const terminal: AttemptManifest = {
      ...manifest,
      state: 'STOPPED',
      terminalOutcome: {
        status: 'REFERENCE_PREFLIGHT_STOPPED',
        stage: manifest.currentStage,
        resultStatus: result.status,
        failureMessage: result.status === 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE' ? result.reason : result.reason,
        ...(stopArtifactRef ? { stopArtifactRef } : {}),
      },
    };
    await commitAttemptManifestTerminal(manifestPath, snapshot, terminal);
    Object.assign(manifest, terminal);
  });
}

async function assertAuthorizationAndHistoryUnchanged(
  liveRoot: string,
  authorizationPath: string,
  manifest: AttemptManifest,
): Promise<void> {
  if (authorizationPath !== manifest.authorizationArtifactPath) {
    throw new TrialPreflightStop('Execution authorization artifact path changed after attempt admission.');
  }
  const authorization = await readExecutionAuthorization(
    authorizationPath,
    manifest.attemptRef,
    manifest.expectedAuthorizationDigest,
  );
  if (authorization.authorizationRef !== manifest.authorizationRef
    || authorization.canonicalSha256 !== manifest.authorizationDigest
    || authorization.participantBindingLockSha256 !== manifest.participantBindingLockSha256
    || referenceParticipantBindingLockSha256(authorization.participantBindingLock)
      !== referenceParticipantBindingLockSha256(manifest.participantBindingLock)) {
    throw new TrialPreflightStop('Execution authorization changed after attempt admission.');
  }
  const persistedLock = JSON.parse(await readFile(join(referenceTrialRoot(liveRoot), 'attempts', manifest.attemptRef, 'participant-binding-lock.json'), 'utf8')) as unknown;
  if (!isRecord(persistedLock)
    || referenceParticipantBindingLockSha256(persistedLock as unknown as ReferenceParticipantBindingLockV1)
      !== manifest.participantBindingLockSha256) {
    throw new TrialPreflightStop('Persisted Participant binding lock changed after attempt admission.');
  }
  const history = await captureReferenceTrialLegacyHistory(referenceTrialRoot(liveRoot));
  const withoutCurrentAttempt: PreschoolReferenceTrialAcknowledgedHistoryV1 = {
    ...history,
    attempts: history.attempts.filter(item => item.attemptRef !== manifest.attemptRef),
  };
  if (canonicalAttemptManifestJson(withoutCurrentAttempt) !== canonicalAttemptManifestJson(manifest.acknowledgedLegacyHistory)) {
    throw new TrialPreflightStop('Legacy attempt or run-level history changed after authorization admission.');
  }
  const activeOtherAttempt = withoutCurrentAttempt.attempts.find(item => item.manifestState === 'CREATED' || item.manifestState === 'RUNNING');
  if (activeOtherAttempt) throw new TrialPreflightStop(`Another manifest-based attempt ${activeOtherAttempt.attemptRef} is active.`);
}

export function validateReferenceTrialAttemptRef(value: string): string {
  if (!/^attempt-[0-9]{6}$/.test(value)) {
    throw new Error(`Invalid reference trial attemptRef: ${JSON.stringify(value)}`);
  }
  return value;
}

export async function createPreschoolReferenceTrialOutputRoot(
  liveRepositoryRoot: string,
  attemptRef?: string | null,
): Promise<string> {
  const referenceTrialRoot = join(
    resolve(liveRepositoryRoot),
    'artifacts/evolution/autonomous-authoring/reference-trials',
    PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  );
  const outputRoot = attemptRef === undefined || attemptRef === null
    ? referenceTrialRoot
    : join(referenceTrialRoot, 'attempts', validateReferenceTrialAttemptRef(attemptRef));
  await mkdir(dirname(outputRoot), { recursive: true });
  await mkdir(outputRoot, { recursive: false });
  return outputRoot;
}

export function referenceTrialInvocationRef(
  attemptRef: string | null | undefined,
  stage: 'solution' | 'reviewer' | 'shadow-authoring',
): string {
  if (attemptRef === undefined || attemptRef === null) {
    return stage === 'shadow-authoring'
      ? `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}/shadow-authoring`
      : `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}-${stage}-000001`;
  }
  const attemptBase = `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}/${validateReferenceTrialAttemptRef(attemptRef)}`;
  return stage === 'shadow-authoring'
    ? `${attemptBase}/shadow-authoring`
    : `${attemptBase}/${stage}-000001`;
}

const EVIDENCE_UNAVAILABLE: PreschoolReferenceTrialStopV1 = {
  schemaVersion: 'preschool-reference-trial-stop-v1',
  status: 'REFERENCE_EVIDENCE_UNAVAILABLE',
  runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  reason: 'Exact accepted chronology was not supplied; replay or evidence reconstruction is forbidden for this trial.',
};
const OBSERVABLE_PAYLOAD_UNAVAILABLE: PreschoolReferenceTrialObservablePayloadStopV1 = {
  schemaVersion: 'preschool-reference-trial-stop-v1',
  status: 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE',
  runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  reason: 'Exact sealed player-visible reference payload was not supplied or did not match the accepted digest.',
};

async function writeCreateOnlyJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${canonicalJson(value)}\n`, { flag: 'wx' });
}

async function readExactAcceptedEvidence(path: string | null | undefined): Promise<{
  evidence: PreschoolCapacityEvidenceV1 | null;
  bytes: Buffer | null;
}> {
  const trustedDigest = PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_EVIDENCE_SHA256;
  if (typeof path !== 'string' || path.length === 0
    || typeof trustedDigest !== 'string'
    || !/^[a-f0-9]{64}$/.test(trustedDigest)) return { evidence: null, bytes: null };
  let evidenceBytes: Buffer;
  try {
    evidenceBytes = await readFile(path);
  } catch {
    return { evidence: null, bytes: null };
  }
  try {
    if (sha256Hex(evidenceBytes) !== trustedDigest) return { evidence: null, bytes: evidenceBytes };
    const evidence = validatePreschoolCapacityEvidence(JSON.parse(evidenceBytes.toString('utf8')) as unknown);
    if (evidence.runRef !== PRESCHOOL_REFERENCE_TRIAL_RUN_REF
      || evidence.evidenceMode !== 'STRUCTURAL_EXHAUSTION'
      || evidence.preConsumedEntryIds.length !== 0
      || evidence.demandBeats !== 30
      || evidence.authoredBeats !== 26
      || evidence.gapBeats !== 4
      || evidence.foreignOriginLeakCount !== 0
      || evidence.duplicateAuthoredCount !== 0
      || evidence.beats.length !== 30
      || evidence.beats.filter(beat => beat.kind === 'GAP').length !== 4
      || evidence.beats.some(beat => beat.kind === 'GAP' && beat.legalUnconsumedCountBeforeSelection !== 0)) {
      return { evidence: null, bytes: evidenceBytes };
    }
    return { evidence, bytes: evidenceBytes };
  } catch {
    return { evidence: null, bytes: evidenceBytes };
  }
}

export async function readExactReferenceObservablePayload(
  path: string | null | undefined,
  expectedSha256: string,
): Promise<Buffer | null> {
  if (typeof path !== 'string' || path.length === 0 || !/^[a-f0-9]{64}$/.test(expectedSha256)) return null;
  try {
    const bytes = await readFile(path);
    if (sha256Hex(bytes) !== expectedSha256) return null;
    serializeObservablePayload(JSON.parse(bytes.toString('utf8')) as ObservablePayload);
    return bytes;
  } catch {
    return null;
  }
}

async function assertCurrentAuthorityDocuments(repositoryRoot: string): Promise<void> {
  const [decisions, workflow, autoEvolution] = await Promise.all(
    PRESCHOOL_REFERENCE_TRIAL_AUTHORITY_PATHS.map(path => readFile(join(repositoryRoot, path), 'utf8')),
  );
  if (!decisions.includes('### PD-121：Contract-Constrained Autonomous Authoring v1')
    || !workflow.startsWith('# Content Authoring Workflow Contract v3')
    || !workflow.includes('PD-121')
    || !workflow.includes('Human exact-patch promotion')
    || !autoEvolution.includes('PD-121')) {
    throw new Error('Current PD-121 authority overlay is incomplete or stale.');
  }
}

export async function overlayReferenceTrialAuthority(
  liveRepositoryRoot: string,
  trialBaselineRoot: string,
): Promise<void> {
  const liveRoot = resolve(liveRepositoryRoot);
  const baselineRoot = resolve(trialBaselineRoot);
  await assertCurrentAuthorityDocuments(liveRoot);
  for (const relativePath of PRESCHOOL_REFERENCE_TRIAL_AUTHORITY_PATHS) {
    const destination = join(baselineRoot, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(liveRoot, relativePath), destination);
  }
}

function containsMarker(bytes: Buffer, marker: string): boolean {
  return bytes.includes(Buffer.from(marker, 'utf8'));
}

interface TrustedCurrentRunPromptFragment {
  role: WorkspaceAgentJobInput['role'];
  before: string;
  content: string;
  after: string;
}

function removeTrustedCurrentRunPromptFragment(
  prompt: string,
  fragment: TrustedCurrentRunPromptFragment,
): string {
  const exactSegment = `${fragment.before}${fragment.content}${fragment.after}`;
  const first = prompt.indexOf(exactSegment);
  if (first < 0 || first !== prompt.lastIndexOf(exactSegment)) {
    throw new Error('Verified current-run output is not present exactly once at its expected prompt boundary.');
  }
  return prompt.slice(0, first)
    + `${fragment.before}${fragment.after}`
    + prompt.slice(first + exactSegment.length);
}

function assertNoParticipantContamination(
  workspaceRoot: string,
  prompt = '',
  trustedCurrentRunFragment?: TrustedCurrentRunPromptFragment,
): void {
  if (prompt.includes(FORBIDDEN_RESIDUAL_DESIGN_PATH)) {
    throw new Error(`Participant-visible contamination detected in prompt: ${FORBIDDEN_RESIDUAL_DESIGN_PATH}`);
  }
  const promptForAnswerScan = trustedCurrentRunFragment
    ? removeTrustedCurrentRunPromptFragment(prompt, trustedCurrentRunFragment)
    : prompt;
  for (const marker of FORBIDDEN_ANSWER_IDS) {
    if (promptForAnswerScan.includes(marker)) throw new Error(`Participant-visible contamination detected in prompt: ${marker}`);
  }

  const root = resolve(workspaceRoot);
  const visited = new Set<string>();
  const inspect = (absolutePath: string, relativePath: string): void => {
    const normalizedPath = relativePath.split(sep).join('/');
    if (normalizedPath.includes(ACCEPTED_DESIGN_PATH)
      || normalizedPath.includes(FORBIDDEN_RESIDUAL_DESIGN_PATH)
      || FORBIDDEN_ANSWER_IDS.some(marker => normalizedPath.includes(marker))) {
      throw new Error(`Participant-visible contamination detected in path: ${normalizedPath}`);
    }
    const stat = lstatSync(absolutePath);
    if (stat.isSymbolicLink()) {
      const targetText = readlinkSync(absolutePath);
      if (FORBIDDEN_ANSWER_IDS.some(marker => targetText.includes(marker))
        || targetText.includes(FORBIDDEN_RESIDUAL_DESIGN_PATH)) {
        throw new Error(`Participant-visible contamination detected in symlink: ${normalizedPath}`);
      }
      const resolvedTarget = realpathSync(absolutePath);
      const escaped = relative(root, resolvedTarget);
      if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
        throw new Error(`Participant workspace contains an external symlink that cannot be scanned: ${normalizedPath}`);
      }
      inspect(resolvedTarget, normalizedPath);
      return;
    }
    if (stat.isDirectory()) {
      const realDirectory = realpathSync(absolutePath);
      if (visited.has(realDirectory)) return;
      visited.add(realDirectory);
      for (const entry of readdirSync(absolutePath, { withFileTypes: true })) {
        inspect(join(absolutePath, entry.name), relativePath ? join(relativePath, entry.name) : entry.name);
      }
      return;
    }
    if (!stat.isFile()) throw new Error(`Participant workspace contains an unsupported file type: ${normalizedPath}`);
    const bytes = readFileSync(absolutePath);
    for (const marker of FORBIDDEN_ANSWER_IDS) {
      if (containsMarker(bytes, marker)) throw new Error(`Participant-visible contamination detected in file: ${normalizedPath}`);
    }
    if (containsMarker(bytes, FORBIDDEN_RESIDUAL_DESIGN_PATH)) {
      throw new Error(`Participant-visible contamination detected in file: ${normalizedPath}`);
    }
  };
  inspect(root, '');
}

export async function prepareReferenceTrialParticipantWorkspace(input: {
  baselineRoot: string;
  destinationRoot: string;
  jobKind: 'solution' | 'reviewer' | 'shadow-authoring';
  artifactSourceRoot: string;
  artifactRelativePaths: string[];
}): Promise<PreparedAgentWorkspace> {
  const prepared = await prepareAgentWorkspace({
    authoritativeRoot: input.baselineRoot,
    destinationRoot: input.destinationRoot,
    jobKind: input.jobKind,
    artifactSourceRoot: input.artifactSourceRoot,
    artifactRelativePaths: input.artifactRelativePaths,
  });
  assertNoParticipantContamination(prepared.workspaceRoot);
  return prepared;
}

export function withParticipantContaminationGuard(
  participant: WorkspaceAgentParticipantOptions,
): WorkspaceAgentParticipantOptions {
  return withPromptContaminationGuard(participant);
}

function withPromptContaminationGuard(
  participant: WorkspaceAgentParticipantOptions,
  trustedCurrentRunFragment?: TrustedCurrentRunPromptFragment,
): WorkspaceAgentParticipantOptions {
  const buildArgs = participant.buildArgs;
  const sameThreadContinuation = participant.sameThreadContinuation;
  const assertCleanJob = (input: WorkspaceAgentJobInput): void => {
    if (trustedCurrentRunFragment && input.role !== trustedCurrentRunFragment.role) {
      throw new Error('Verified current-run output cannot be applied to a different Participant role.');
    }
    assertNoParticipantContamination(input.workspaceRoot, input.prompt, trustedCurrentRunFragment);
  };
  return {
    ...participant,
    buildArgs: (input: WorkspaceAgentJobInput) => {
      assertCleanJob(input);
      return buildArgs(input);
    },
    ...(sameThreadContinuation === undefined
      ? {}
      : {
        sameThreadContinuation: {
          ...sameThreadContinuation,
          buildArgs: (input: WorkspaceAgentJobInput, threadRef) => {
            assertCleanJob(input);
            return sameThreadContinuation.buildArgs(input, threadRef);
          },
        },
      }),
  };
}

function assertAvailableCurrentRunInvocation(input: {
  provenance: AvailableInvocationProvenanceV1;
  attemptRef: string;
  role: 'solution' | 'reviewer';
}): void {
  const expectedArtifactRef = input.role === 'solution'
    ? 'solution-agent/invocation.json'
    : 'reviewer-agent/invocation.json';
  const expectedCompletionArtifactRef = expectedArtifactRef.replace('invocation.json', 'execution-trace.json');
  if (input.provenance.status !== 'AVAILABLE'
    || input.provenance.invocationRef !== expectedInvocationRef(input.attemptRef, input.role)
    || input.provenance.artifactRef !== expectedArtifactRef
    || !/^[a-f0-9]{64}$/.test(input.provenance.artifactSha256)
    || input.provenance.completionEvidence.artifactRef !== expectedCompletionArtifactRef
    || !/^[a-f0-9]{64}$/.test(input.provenance.completionEvidence.sha256)
    || input.provenance.completionEvidence.outcome !== 'completed') {
    throw new Error(`Current-run ${input.role} output exemption requires completed, valid invocation provenance for ${input.attemptRef}.`);
  }
}

function withVerifiedSolutionWorkContaminationGuard(
  participant: WorkspaceAgentParticipantOptions,
  input: {
    attemptRef: string;
    solution: SolutionAgentRunResult;
    solutionProvenance: AvailableInvocationProvenanceV1;
  },
): WorkspaceAgentParticipantOptions {
  if (!input.solution.ok) throw new Error('Current-run SolutionWork exemption requires a completed Solution result.');
  assertAvailableCurrentRunInvocation({ provenance: input.solutionProvenance, attemptRef: input.attemptRef, role: 'solution' });
  const solutionWork = validateSolutionWork(input.solution.result);
  return withPromptContaminationGuard(participant, {
    role: 'reviewer',
    before: 'Structured Solution Result:\n',
    content: canonicalJson(solutionWork),
    after: '',
  });
}

function withVerifiedAcceptedCardsContaminationGuard(
  participant: WorkspaceAgentParticipantOptions,
  input: {
    attemptRef: string;
    solution: SolutionAgentRunResult;
    solutionProvenance: AvailableInvocationProvenanceV1;
    reviewer: SolutionReviewerRunResult;
    reviewerProvenance: AvailableInvocationProvenanceV1;
    admission: AutonomousAuthoringAdmissionV1;
  },
): WorkspaceAgentParticipantOptions {
  if (!input.solution.ok || !input.reviewer.ok) {
    throw new Error('Current-run accepted Cards exemption requires completed Solution and Reviewer results.');
  }
  assertAvailableCurrentRunInvocation({ provenance: input.solutionProvenance, attemptRef: input.attemptRef, role: 'solution' });
  assertAvailableCurrentRunInvocation({ provenance: input.reviewerProvenance, attemptRef: input.attemptRef, role: 'reviewer' });
  if (input.admission.sourceRunRef !== PRESCHOOL_REFERENCE_TRIAL_RUN_REF) {
    throw new Error('Current-run accepted Cards exemption requires Host admission for the reference trial source.');
  }
  const accepted = assertAcceptedAuthoring({
    solution: validateSolutionWork(input.solution.result),
    review: input.reviewer.review,
    admission: input.admission,
  });
  return withPromptContaminationGuard(participant, {
    role: 'configuration-execution',
    before: 'Accepted Cards:\n',
    content: canonicalJson(accepted.cards),
    after: '\n\nThe only allowed write paths are exactly these three paths:',
  });
}

function runGitArchive(repositoryRoot: string): Buffer {
  const archive = spawnSync('git', ['archive', PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA], {
    cwd: repositoryRoot,
    encoding: null,
    maxBuffer: 128 * 1024 * 1024,
  });
  if (archive.error || archive.status !== 0 || !Buffer.isBuffer(archive.stdout)) {
      throw new Error(`Could not archive historical baseline ${PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA}: ${archive.error ?? archive.stderr?.toString() ?? 'unknown git archive failure'}`);
  }
  return archive.stdout;
}

function extractTarArchive(destinationRoot: string, archive: Buffer): void {
  const extracted = spawnSync('tar', ['-x', '-f', '-'], {
    cwd: destinationRoot,
    input: archive,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (extracted.error || extracted.status !== 0) {
    throw new Error(`Could not extract the pinned historical baseline: ${extracted.error ?? extracted.stderr ?? 'unknown tar extraction failure'}`);
  }
}

async function assertHistoricalInfantCatalogMatches(liveRoot: string, baselineRoot: string): Promise<void> {
  const [liveCatalog, historicalCatalog] = await Promise.all([
    readFile(join(liveRoot, INFANT_CATALOG_PATH)),
    readFile(join(baselineRoot, INFANT_CATALOG_PATH)),
  ]);
  if (!liveCatalog.equals(historicalCatalog)) {
    throw new Error(`${INFANT_CATALOG_PATH} differs between the live repository and pinned historical baseline.`);
  }
}

async function materializeHistoricalTrialRoots(input: {
  liveRepositoryRoot: string;
  temporaryRoot: string;
}): Promise<{
  trialBaselineRoot: string;
  hostAuthorityRoot: string;
  baselineFingerprint: string;
  hostNodeModulesRoot: string | null;
}> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  const trialBaselineRoot = join(input.temporaryRoot, 'trial-baseline');
  await mkdir(trialBaselineRoot, { recursive: false });
  extractTarArchive(trialBaselineRoot, runGitArchive(liveRoot));
  await overlayReferenceTrialAuthority(liveRoot, trialBaselineRoot);
  await assertHistoricalInfantCatalogMatches(liveRoot, trialBaselineRoot);

  const hostNodeModulesRoot = await resolveHostNodeModulesRoot(liveRoot);
  if (hostNodeModulesRoot) {
    await symlink(hostNodeModulesRoot, join(trialBaselineRoot, 'node_modules'), 'dir');
  }

  const hostAuthorityRoot = join(input.temporaryRoot, 'host-authority');
  await cp(trialBaselineRoot, hostAuthorityRoot, { recursive: true, dereference: false });
  const specPath = join(hostAuthorityRoot, ACCEPTED_DESIGN_PATH);
  await mkdir(dirname(specPath), { recursive: true });
  await copyFile(join(liveRoot, ACCEPTED_DESIGN_PATH), specPath);

  const [baselineFingerprint, hostAuthorityFingerprint] = await Promise.all([
    captureAuthoritativeFingerprint(trialBaselineRoot),
    captureAuthoritativeFingerprint(hostAuthorityRoot),
  ]);
  if (baselineFingerprint !== hostAuthorityFingerprint) {
    throw new Error('Host-only authority material changed the historical candidate baseline fingerprint.');
  }
  return { trialBaselineRoot, hostAuthorityRoot, baselineFingerprint, hostNodeModulesRoot };
}

export async function writePreschoolReferenceTrialInputs(input: {
  outputRoot: string;
  authorityRepositoryRoot: string;
  candidateBaselineRoot: string;
  runRef: string;
  observablePayloadBytes: Buffer;
  responsibilityBrief: AcceptedPreschoolReferenceResponsibilityBrief;
}): Promise<{
  problemPackagePath: string;
  problemPackage: Awaited<ReturnType<typeof buildProblemPackage>>;
  contractPacket: Awaited<ReturnType<typeof buildPreschoolAutonomousAuthoringContractPacket>>;
  artifactRelativePaths: string[];
}> {
  const candidate = {
    hypothesisId: 'hypothesis-000001',
    hypothesis: 'The 4–7 preschool shared-neutral passive experience has a bounded content-capacity gap that can be addressed within the approved authoring Contract.',
    observedBasis: 'The fixed accepted reference facts record 30 demand beats, 26 authored beats, and four generic content-capacity gaps after the whole legal pool is exhausted at each gap.',
    feedbackRefs: ['overallImpression'],
    evidenceRefs: [CAPACITY_SUMMARY_PATH],
    unknowns: [
      'Whether the supplied Human-approved responsibilities admit independently authored contract-conforming content instances remains to be determined and independently reviewed.',
    ],
    productSignificance: 'Completing a minimum sufficient set of existing shared-neutral preschool experiences can close the four evidenced gaps without adding game mechanics.',
  } satisfies ImprovementHypothesis;

  const contractPacket = await buildPreschoolAutonomousAuthoringContractPacket({
    repositoryRoot: input.authorityRepositoryRoot,
  });
  await writeCreateOnlyJson(join(input.outputRoot, CONTRACT_PACKET_PATH), contractPacket);
  await mkdir(dirname(join(input.outputRoot, OBSERVABLE_PAYLOAD_PATH)), { recursive: true });
  await writeFile(join(input.outputRoot, OBSERVABLE_PAYLOAD_PATH), input.observablePayloadBytes, { flag: 'wx' });
  await writeFile(join(input.outputRoot, REFERENCE_RESPONSIBILITY_BRIEF_PATH), input.responsibilityBrief.bytes, { flag: 'wx' });
  await writeCreateOnlyJson(join(input.outputRoot, REFERENCE_RESPONSIBILITY_ATTESTATION_PATH), {
    schemaVersion: 'preschool-reference-responsibility-attestation-v1',
    runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
    validationLayer: PRESCHOOL_REFERENCE_VALIDATION_LAYER,
    responsibilityProvenance: PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE,
    referenceResponsibilityBriefRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH,
    referenceResponsibilityBriefSha256: input.responsibilityBrief.sha256,
  } satisfies PreschoolReferenceResponsibilityAttestationV1);
  await writeCreateOnlyJson(join(input.outputRoot, REFERENCE_SOURCE_ATTESTATION_PATH), {
    schemaVersion: 'preschool-reference-source-attestation-v1',
    runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
    historicalBaselineGitSha: PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA,
    observablePayloadSha256: sha256Hex(input.observablePayloadBytes),
    verification: 'HOST_VERIFIED_FIXED_REFERENCE_CASE',
  });
  await writeCreateOnlyJson(join(input.outputRoot, CAPACITY_SUMMARY_PATH), {
    schemaVersion: 'preschool-reference-capacity-summary-v1',
    runRef: input.runRef,
    ageRange: [4, 7],
    demandBeats: 30,
    authoredBeats: 26,
    gapBeats: 4,
    gapClassification: 'CONTENT_GAP',
    gapSubtype: 'CONTENT_CAPACITY_GAP',
    wholeLegalPoolExhaustedAtEveryAcceptedGap: true,
  });
  await writeCreateOnlyJson(join(input.outputRoot, OBSERVABLE_SUMMARY_PATH), {
    schemaVersion: 'preschool-reference-observable-summary-v1',
    runRef: input.runRef,
    ageRange: [4, 7],
    experienceShape: 'packed passive experience',
    demandBeats: 30,
    authoredBeats: 26,
    gapBeats: 4,
  });
  await writeCreateOnlyJson(join(input.outputRoot, FEEDBACK_SUMMARY_PATH), {
    overallImpression: 'The accepted reference facts show four structural content-capacity gaps in the 4–7 preschool packed passive experience.',
    observations: [],
  });
  await writeCreateOnlyJson(join(input.outputRoot, HYPOTHESIS_SUMMARY_PATH), {
    schemaVersion: 'improvement-hypothesis-set-v2',
    hypotheses: [candidate],
    noProblemAssessment: null,
  });

  const problemPackagePath = join(input.outputRoot, 'problem-package.json');
  const problemPackage = await buildProblemPackage({
    activeCandidate: candidate,
    activeCandidateRef: `reference-trial/${candidate.hypothesisId}`,
    activeCandidateSourceIndex: 0,
    runRef: input.runRef,
    observablePayloadRef: OBSERVABLE_PAYLOAD_PATH,
    externalFeedbackRef: FEEDBACK_SUMMARY_PATH,
    improvementHypothesisRef: HYPOTHESIS_SUMMARY_PATH,
    diagnosticEvidenceRefs: [CAPACITY_SUMMARY_PATH, REFERENCE_SOURCE_ATTESTATION_PATH],
    authorityRefs: [...PRESCHOOL_REFERENCE_TRIAL_AUTHORITY_PATHS],
    productSourceFingerprintSha256: await captureAuthoritativeFingerprint(input.candidateBaselineRoot),
    destinationPath: problemPackagePath,
  });
  return {
    problemPackagePath,
    problemPackage,
    contractPacket,
    artifactRelativePaths: [
      OBSERVABLE_SUMMARY_PATH,
      OBSERVABLE_PAYLOAD_PATH,
      REFERENCE_RESPONSIBILITY_BRIEF_PATH,
      REFERENCE_RESPONSIBILITY_ATTESTATION_PATH,
      REFERENCE_SOURCE_ATTESTATION_PATH,
      FEEDBACK_SUMMARY_PATH,
      HYPOTHESIS_SUMMARY_PATH,
      CAPACITY_SUMMARY_PATH,
      CONTRACT_PACKET_PATH,
    ],
  };
}

function acceptedAuthoringOption(solution: SolutionAgentRunResult, reviewer: SolutionReviewerRunResult) {
  if (!solution.ok || !reviewer.ok || solution.result.status !== 'OPTIONS'
    || reviewer.review.decision !== 'ACCEPT_OPTION'
    || !reviewer.review.acceptedOptionId) {
    throw new Error('The reference trial requires an accepted Solution option and a conforming Reviewer result.');
  }
  const selected = solution.result.options.find(option => option.optionId === reviewer.review.acceptedOptionId);
  if (!selected?.autonomousAuthoring) {
    throw new Error('The accepted Solution option does not contain an autonomous authoring proposal.');
  }
  return selected;
}

async function runVerifiedHistoricalTrial(input: {
  liveRepositoryRoot: string;
  evidence: PreschoolCapacityEvidenceV1;
  observablePayloadBytes: Buffer;
  responsibilityBrief: AcceptedPreschoolReferenceResponsibilityBrief;
  attemptRef: string;
  outputRoot: string;
  manifestPath: string;
  manifest: AttemptManifest;
  executionAuthorizationPath: string;
  resolveParticipantBinding: typeof resolveReferenceParticipantBindingFromLock;
}): Promise<PreschoolReferenceTrialVerifiedV2> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  const liveRepositoryFingerprintBefore = await captureAuthoritativeFingerprint(liveRoot);
  const outputRoot = input.outputRoot;
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-reference-trial-'));

  try {
    const { trialBaselineRoot, hostAuthorityRoot, baselineFingerprint, hostNodeModulesRoot } = await materializeHistoricalTrialRoots({
      liveRepositoryRoot: liveRoot,
      temporaryRoot,
    });
    input.manifest.historicalBaselineProvenance.candidateBaselineFingerprintSha256 = baselineFingerprint;
    input.manifest.currentStage = 'INPUTS';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const trialInputs = await writePreschoolReferenceTrialInputs({
      outputRoot,
      authorityRepositoryRoot: liveRoot,
      candidateBaselineRoot: trialBaselineRoot,
      runRef: input.evidence.runRef,
      observablePayloadBytes: input.observablePayloadBytes,
      responsibilityBrief: input.responsibilityBrief,
    });
    await refreshInputSet(outputRoot, input.manifest);
    await writeAttemptManifest(input.manifestPath, input.manifest);
    await assertAuthorizationAndHistoryUnchanged(liveRoot, input.executionAuthorizationPath, input.manifest);
    input.manifest.currentStage = 'BINDING';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const binding: ResolvedOperatorParticipantBinding = await input.resolveParticipantBinding({
      repositoryRoot: liveRoot,
      lock: input.manifest.participantBindingLock,
    });
    const solutionParticipant = withParticipantContaminationGuard(binding.participant);
    const workspaceDestinationRoot = join(temporaryRoot, 'participant-workspaces');

    const solutionWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: trialBaselineRoot,
      destinationRoot: workspaceDestinationRoot,
      jobKind: 'solution',
      artifactSourceRoot: outputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    input.manifest.currentStage = 'SOLUTION';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const solution = await runWithParticipantPromptProvenance({
      outputRoot,
      manifestPath: input.manifestPath,
      manifest: input.manifest,
      role: 'solution',
      invoke: () => runSolutionAgent({
        problemPackage: trialInputs.problemPackage,
        problemPackagePath: trialInputs.problemPackagePath,
        workspaceRoot: solutionWorkspace.workspaceRoot,
        repositoryRoot: trialBaselineRoot,
        artifactRoot: outputRoot,
        workspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
        invocationRef: referenceTrialInvocationRef(input.attemptRef, 'solution'),
        jobNumber: 1,
        destinationRoot: join(outputRoot, 'solution-agent'),
        skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
        participant: solutionParticipant,
        autonomousAuthoringContractPacket: trialInputs.contractPacket,
        referenceResponsibilityContext: {
          validationLayer: PRESCHOOL_REFERENCE_VALIDATION_LAYER,
          responsibilityProvenance: PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE,
          briefRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH,
          attestationRef: REFERENCE_RESPONSIBILITY_ATTESTATION_PATH,
          brief: input.responsibilityBrief.brief,
        } satisfies PreschoolReferenceResponsibilityContextV1,
      }),
    });
    input.manifest.invocationRefs.solution = await readInvocationProvenance(
      join(outputRoot, 'solution-agent/invocation.json'),
      'solution-agent/invocation.json',
      expectedInvocationRef(input.attemptRef, 'solution'),
      'solution',
      solution.ok,
    );
    await refreshInputSet(outputRoot, input.manifest);
    await writeAttemptManifest(input.manifestPath, input.manifest);
    if (input.manifest.invocationRefs.solution.status === 'CORRUPTED') {
      throw new TrialInvocationProvenanceFailure([`solution: ${input.manifest.invocationRefs.solution.diagnostic}`]);
    }
    if (!solution.ok) throw new TrialParticipantFailure(solution.errorKind, 'solution-agent/failure.json', `Solution Participant failed: ${solution.message}`);
    const solutionProvenance = input.manifest.invocationRefs.solution;
    if (!solutionProvenance || solutionProvenance.status !== 'AVAILABLE') {
      throw new TrialInvocationProvenanceFailure(['solution: completed invocation provenance is unavailable.']);
    }
    const reviewerParticipant = withVerifiedSolutionWorkContaminationGuard(binding.participant, {
      attemptRef: input.attemptRef,
      solution,
      solutionProvenance,
    });

    const reviewerWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: trialBaselineRoot,
      destinationRoot: workspaceDestinationRoot,
      jobKind: 'reviewer',
      artifactSourceRoot: outputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    input.manifest.currentStage = 'REVIEWER';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const reviewer = await runWithParticipantPromptProvenance({
      outputRoot,
      manifestPath: input.manifestPath,
      manifest: input.manifest,
      role: 'reviewer',
      invoke: () => runSolutionReviewer({
        problemPackage: trialInputs.problemPackage,
        problemPackagePath: trialInputs.problemPackagePath,
        solutionWork: solution.result,
        workspaceRoot: reviewerWorkspace.workspaceRoot,
        repositoryRoot: trialBaselineRoot,
        artifactRoot: outputRoot,
        workspaceBaselineFingerprintSha256: reviewerWorkspace.workspaceBaselineFingerprintSha256,
        invocationRef: referenceTrialInvocationRef(input.attemptRef, 'reviewer'),
        jobNumber: 2,
        destinationRoot: join(outputRoot, 'reviewer-agent'),
        skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
        participant: reviewerParticipant,
        autonomousAuthoringContractPacket: trialInputs.contractPacket,
        referenceResponsibilityContext: {
          validationLayer: PRESCHOOL_REFERENCE_VALIDATION_LAYER,
          responsibilityProvenance: PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE,
          briefRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH,
          attestationRef: REFERENCE_RESPONSIBILITY_ATTESTATION_PATH,
          brief: input.responsibilityBrief.brief,
        },
      }),
    });
    input.manifest.invocationRefs.reviewer = await readInvocationProvenance(
      join(outputRoot, 'reviewer-agent/invocation.json'),
      'reviewer-agent/invocation.json',
      expectedInvocationRef(input.attemptRef, 'reviewer'),
      'reviewer',
      reviewer.ok,
    );
    await refreshInputSet(outputRoot, input.manifest);
    await writeAttemptManifest(input.manifestPath, input.manifest);
    if (input.manifest.invocationRefs.reviewer.status === 'CORRUPTED') {
      throw new TrialInvocationProvenanceFailure([`reviewer: ${input.manifest.invocationRefs.reviewer.diagnostic}`]);
    }
    if (!reviewer.ok) throw new TrialParticipantFailure(reviewer.errorKind, 'reviewer-agent/failure.json', `Reviewer Participant failed: ${reviewer.message}`);
    const reviewerProvenance = input.manifest.invocationRefs.reviewer;
    if (!reviewerProvenance || reviewerProvenance.status !== 'AVAILABLE') {
      throw new TrialInvocationProvenanceFailure(['reviewer: completed invocation provenance is unavailable.']);
    }

    const selectedOption = acceptedAuthoringOption(solution, reviewer);
    input.manifest.currentStage = 'ADMISSION';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const admission = await evaluatePreschoolAutonomousAuthoringAdmission({
      repositoryRoot: hostAuthorityRoot,
      sourceRoot: trialBaselineRoot,
      sourceRunRef: input.evidence.runRef,
      selectedOption,
      review: reviewer.review,
      proposalSha256: sha256Hex(canonicalJson(selectedOption.autonomousAuthoring)),
      reviewSha256: sha256Hex(canonicalJson(reviewer.review)),
      fixedCapacityEvidence: input.evidence,
      referenceResponsibilityContext: {
        brief: input.responsibilityBrief.brief,
        briefSha256: input.responsibilityBrief.sha256,
        briefRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH,
        attestationRef: REFERENCE_RESPONSIBILITY_ATTESTATION_PATH,
      },
    });
    if (admission.status !== 'ELIGIBLE') {
      throw new Error(`Host admission did not establish eligibility: ${admission.status} (${admission.reasons.join('; ')})`);
    }
    let responsibilityMappings: PreschoolReferenceResponsibilityMappingV1[];
    try {
      responsibilityMappings = assertPreschoolReferenceResponsibilitiesPreserved({
        brief: input.responsibilityBrief.brief,
        proposal: selectedOption.autonomousAuthoring!,
      });
    } catch (error) {
      throw new Error('Internal invariant failure: eligible Host admission did not preserve reference responsibilities.', { cause: error });
    }

    const decision = routeSolutionDecision({
      problemId: trialInputs.problemPackage.problemId,
      solutionStatus: solution.result.status,
      reviewerDecision: reviewer.review.decision,
      solutionScope: selectedOption.changeScope,
      reviewScope: reviewer.review.scopeAssessment ?? null,
      executionAuthorityAssessment: reviewer.review.executionAuthorityAssessment ?? null,
      autonomousAuthoringRequested: true,
      autonomousAuthoringAdmissionStatus: admission.status,
      permissions: trialInputs.problemPackage.permissions,
      budget: { actualParticipantJobs: 2, maxParticipantJobs: 4, retryCount: 0 },
    });
    await writeCreateOnlyJson(join(outputRoot, 'decision.json'), decision);
    if (decision.route !== 'READY_FOR_SHADOW_AUTHORING') {
      throw new Error(`Reference trial did not route to READY_FOR_SHADOW_AUTHORING: ${decision.route}`);
    }
    const shadowParticipant = withVerifiedAcceptedCardsContaminationGuard(binding.participant, {
      attemptRef: input.attemptRef,
      solution,
      solutionProvenance,
      reviewer,
      reviewerProvenance,
      admission,
    });

    input.manifest.currentStage = 'SHADOW_AUTHORING';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const execution = await runWithParticipantPromptProvenance({
      outputRoot,
      manifestPath: input.manifestPath,
      manifest: input.manifest,
      role: 'shadowAuthoring',
      invoke: () => runShadowAuthoringExecution({
        repositoryRoot: trialBaselineRoot,
        workspaceDestinationRoot: join(temporaryRoot, 'shadow-workspace'),
        artifactRoot: join(outputRoot, 'shadow-authoring'),
        invocationRef: referenceTrialInvocationRef(input.attemptRef, 'shadow-authoring'),
        solution: solution.result,
        review: reviewer.review,
        admission,
        participant: shadowParticipant,
      }),
    });
    input.manifest.invocationRefs.shadowAuthoring = await readInvocationProvenance(
      join(outputRoot, 'shadow-authoring/invocation.json'),
      'shadow-authoring/invocation.json',
      expectedInvocationRef(input.attemptRef, 'shadowAuthoring'),
      'shadowAuthoring',
      execution.status === 'completed' && execution.failure === null,
    );
    await writeAttemptManifest(input.manifestPath, input.manifest);
    if (input.manifest.invocationRefs.shadowAuthoring.status === 'CORRUPTED') {
      throw new TrialInvocationProvenanceFailure([`shadowAuthoring: ${input.manifest.invocationRefs.shadowAuthoring.diagnostic}`]);
    }
    if (execution.status !== 'completed' || execution.failure !== null) {
      throw new TrialParticipantFailure('process', 'shadow-authoring/execution-trace.json', `Shadow Executor failed: ${execution.failure ?? 'unknown failure'}`);
    }
    if (execution.authoritativeFingerprintBefore !== baselineFingerprint
      || execution.authoritativeFingerprintAfter !== baselineFingerprint) {
      throw new Error('The historical candidate baseline changed during shadow execution.');
    }

    input.manifest.currentStage = 'VERIFICATION';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const verification = await verifyPreschoolShadowAuthoring({
      repositoryRoot: trialBaselineRoot,
      authoritativeRepositoryRoot: hostAuthorityRoot,
      ...(hostNodeModulesRoot ? { hostNodeModulesRoot } : {}),
      beforeWorkspaceRoot: trialBaselineRoot,
      finalWorkspaceRoot: execution.preparedWorkspace.workspaceRoot,
      candidateBaselineGitSha: PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA,
      candidateBaselineFingerprintSha256: baselineFingerprint,
      authoritativeFingerprintBefore: execution.authoritativeFingerprintBefore,
      solution: solution.result,
      review: reviewer.review,
      admission,
    });
    if (verification.status !== 'SHADOW_AUTHORING_VERIFIED'
      || !verification.promotionPatch
      || !verification.promotionPatch.equals(execution.promotionPatch)
      || verification.patchSha256 !== execution.promotionPatchSha256) {
      throw new Error(`Host V1–V5 verification failed: ${verification.failures.join('; ') || verification.status}`);
    }
    input.manifest.currentStage = 'PROMOTION';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const promotionPackage = buildPromotionPackage({
      verification,
      solution: solution.result,
      review: reviewer.review,
      admission,
    });
    const newEntryCount = promotionPackage.packageJson.acceptedCards.length;
    if (newEntryCount > 8) throw new Error('The accepted new-entry set exceeds the eight-entry envelope.');
    const promotionPackagePath = join(outputRoot, 'promotion-package.json');
    const promotionPatchPath = join(outputRoot, 'promotion.patch');
    await writeCreateOnlyJson(promotionPackagePath, promotionPackage.packageJson);
    await writeFile(join(outputRoot, 'promotion-package.md'), promotionPackage.markdown, { flag: 'wx' });
    await writeFile(promotionPatchPath, verification.promotionPatch, { flag: 'wx' });

    const liveRepositoryFingerprintAfter = await captureAuthoritativeFingerprint(liveRoot);
    if (liveRepositoryFingerprintAfter !== liveRepositoryFingerprintBefore) {
      throw new Error('The live authoritative repository changed during the historical reference trial.');
    }
    input.manifest.currentStage = 'CLEANUP';
    await writeAttemptManifest(input.manifestPath, input.manifest);
    const invocationRefs = input.manifest.invocationRefs;
    if (invocationRefs.solution?.status !== 'AVAILABLE'
      || invocationRefs.reviewer?.status !== 'AVAILABLE'
      || invocationRefs.shadowAuthoring?.status !== 'AVAILABLE') {
      throw new TrialInvocationProvenanceFailure(['A required invocation provenance record is unavailable before success finalization.']);
    }
    const result = buildPreschoolReferenceTrialVerifiedResult({
      briefSha256: input.responsibilityBrief.sha256,
      responsibilityMappings,
      attemptRef: input.attemptRef,
      attemptManifestRef: `artifacts/evolution/autonomous-authoring/reference-trials/${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}/attempts/${input.attemptRef}/attempt-manifest.json`,
      executionAuthorization: {
        authorizationRef: input.manifest.authorizationRef,
        authorizationDigest: input.manifest.authorizationDigest,
        authorizedAt: input.manifest.authorizedAt,
      },
      invocationRefs: invocationRefs as Record<InvocationRole, Exclude<InvocationProvenance, null>>,
      downstream: {
      status: 'SHADOW_AUTHORING_VERIFIED',
      runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
      newEntryCount,
      changedFiles: verification.changedFiles.map(change => change.path),
      promotionPackagePath,
      promotionPatchPath,
      liveRepositoryFingerprintBefore,
      liveRepositoryFingerprintAfter,
      },
    });
    return result;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function runPreschoolReferenceTrial(
  input: RunPreschoolReferenceTrialInput,
  dependencies: PreschoolReferenceTrialDependencies = {},
): Promise<PreschoolReferenceTrialResult> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  const resolveBindingFromLock = dependencies.resolveReferenceParticipantBindingFromLock
    ?? resolveReferenceParticipantBindingFromLock;
  const authorizationStop = (reason: string): PreschoolReferenceTrialAuthorizationStopV1 => ({
    schemaVersion: 'preschool-reference-trial-stop-v1',
    status: 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE',
    runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
    reason,
  });
  let attemptRef: string | null;
  try {
    attemptRef = input.attemptRef === undefined || input.attemptRef === null
      ? null
      : validateReferenceTrialAttemptRef(input.attemptRef);
  } catch (error) {
    return authorizationStop(error instanceof Error ? error.message : String(error));
  }
  if (input.executionAuthorizationPath !== undefined && input.executionAuthorizationPath !== null
    && (typeof input.executionAuthorizationPath !== 'string' || input.executionAuthorizationPath.length === 0)) {
    return authorizationStop('Execution authorization artifact path is invalid or empty.');
  }
  const executionAuthorizationPath = typeof input.executionAuthorizationPath === 'string'
    && input.executionAuthorizationPath.length > 0
    ? (isAbsolute(input.executionAuthorizationPath)
      ? input.executionAuthorizationPath
      : resolve(liveRoot, input.executionAuthorizationPath))
    : null;
  const expectedExecutionAuthorizationSha256 = input.expectedExecutionAuthorizationSha256;
  if (executionAuthorizationPath !== null
    && (typeof expectedExecutionAuthorizationSha256 !== 'string'
      || !/^[a-f0-9]{64}$/.test(expectedExecutionAuthorizationSha256))) {
    return authorizationStop('An exact external Human-approved authorization SHA-256 is required with the authorization artifact.');
  }
  if (executionAuthorizationPath === null
    && expectedExecutionAuthorizationSha256 !== undefined
    && expectedExecutionAuthorizationSha256 !== null) {
    return authorizationStop('An authorization SHA-256 cannot be supplied without its authorization artifact path.');
  }
  let admitted: Awaited<ReturnType<typeof admitReferenceTrialAttempt>> | null = null;
  if (executionAuthorizationPath && attemptRef) {
    try {
      admitted = await admitReferenceTrialAttempt({
        liveRepositoryRoot: liveRoot,
        attemptRef,
        executionAuthorizationPath,
        expectedExecutionAuthorizationSha256: expectedExecutionAuthorizationSha256!,
      }, resolveBindingFromLock);
    } catch (error) {
      return authorizationStop(error instanceof Error ? error.message : String(error));
    }
  } else {
    let existingHistory: PreschoolReferenceTrialAcknowledgedHistoryV1;
    try {
      existingHistory = await captureReferenceTrialLegacyHistory(referenceTrialRoot(liveRoot));
    } catch (error) {
      return authorizationStop(error instanceof Error ? error.message : String(error));
    }
    if (existingHistory.attempts.length > 0) {
      const legacyRefs = existingHistory.attempts.filter(item => !item.manifestPresent).map(item => item.attemptRef);
      const detail = legacyRefs.length > 0
        ? ` Manifestless legacy attempts require exact Human acknowledgement: ${legacyRefs.join(', ')}.`
        : ' Existing manifest-based attempt history requires a new attempt-specific Human authorization.';
      return authorizationStop(`A Human execution authorization artifact is required before any new attempt.${detail}`);
    }
    if (executionAuthorizationPath && !attemptRef) {
      return authorizationStop('A valid attemptRef is required with an execution authorization artifact.');
    }
  }

  const evidencePath = typeof input.evidencePath === 'string'
    ? (isAbsolute(input.evidencePath) ? input.evidencePath : resolve(input.liveRepositoryRoot, input.evidencePath))
    : null;
  const acceptedEvidence = await readExactAcceptedEvidence(evidencePath);
  if (admitted && acceptedEvidence.bytes) {
    const evidenceInputPath = join(admitted.outputRoot, ACCEPTED_EVIDENCE_INPUT_PATH);
    await mkdir(dirname(evidenceInputPath), { recursive: true });
    await writeFile(evidenceInputPath, acceptedEvidence.bytes, { flag: 'wx' });
    await refreshInputSet(admitted.outputRoot, admitted.manifest);
    await writeAttemptManifest(join(admitted.outputRoot, 'attempt-manifest.json'), admitted.manifest);
  }
  if (!acceptedEvidence.evidence) {
    if (!admitted) return EVIDENCE_UNAVAILABLE;
    await persistReferenceTrialStop(liveRoot, EVIDENCE_UNAVAILABLE);
    await finalizeReferenceTrialPreflightStop(join(admitted.outputRoot, 'attempt-manifest.json'), admitted.manifest, EVIDENCE_UNAVAILABLE);
    return EVIDENCE_UNAVAILABLE;
  }
  const observablePayloadPath = typeof input.observablePayloadPath === 'string'
    ? (isAbsolute(input.observablePayloadPath)
      ? input.observablePayloadPath
      : resolve(input.liveRepositoryRoot, input.observablePayloadPath))
    : null;
  const observablePayloadBytes = await readExactReferenceObservablePayload(
    observablePayloadPath,
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
  );
  if (!observablePayloadBytes) {
    if (!admitted) return OBSERVABLE_PAYLOAD_UNAVAILABLE;
    await finalizeReferenceTrialPreflightStop(join(admitted.outputRoot, 'attempt-manifest.json'), admitted.manifest, OBSERVABLE_PAYLOAD_UNAVAILABLE);
    return OBSERVABLE_PAYLOAD_UNAVAILABLE;
  }
  const responsibilityBriefPath = typeof input.responsibilityBriefPath === 'string'
    ? (isAbsolute(input.responsibilityBriefPath)
      ? input.responsibilityBriefPath
      : resolve(input.liveRepositoryRoot, input.responsibilityBriefPath))
    : null;
  const responsibilityBrief = await readAcceptedPreschoolReferenceResponsibilityBrief(responsibilityBriefPath);
  if (!responsibilityBrief.ok) {
    const stop: PreschoolReferenceTrialResponsibilityBriefStopV1 = {
      schemaVersion: 'preschool-reference-trial-stop-v1',
      status: 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE',
      runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
      reason: responsibilityBrief.reason,
    };
    if (!admitted) return stop;
    await finalizeReferenceTrialPreflightStop(join(admitted.outputRoot, 'attempt-manifest.json'), admitted.manifest, stop);
    return stop;
  }
  if (!admitted || !attemptRef || !executionAuthorizationPath || !expectedExecutionAuthorizationSha256) {
    return authorizationStop('A valid exact Human execution authorization artifact is required before Participant binding.');
  }

  const manifestPath = join(admitted.outputRoot, 'attempt-manifest.json');
  try {
    admitted.manifest.state = 'RUNNING';
    await writeAttemptManifest(manifestPath, admitted.manifest);
    admitted.manifest.currentStage = 'PREPARATION';
    await writeAttemptManifest(manifestPath, admitted.manifest);
    const result = await runVerifiedHistoricalTrial({
    liveRepositoryRoot: liveRoot,
    evidence: acceptedEvidence.evidence,
    observablePayloadBytes,
    responsibilityBrief: responsibilityBrief.value,
    attemptRef,
    outputRoot: admitted.outputRoot,
    manifestPath,
    manifest: admitted.manifest,
    executionAuthorizationPath,
    resolveParticipantBinding: resolveBindingFromLock,
  });
    await finalizeReferenceTrialSuccess(
      manifestPath,
      admitted.manifest,
      result,
      createAttemptManifestTransitionToken(admitted.manifest),
    );
    return result;
  } catch (error) {
    return finalizeReferenceTrialFailure(
      manifestPath,
      admitted.manifest,
      error,
      createAttemptManifestTransitionToken(admitted.manifest),
    );
  }
}

async function persistReferenceTrialStop(
  repositoryRoot: string,
  result: PreschoolReferenceTrialStopV1 | PreschoolReferenceTrialObservablePayloadStopV1 | PreschoolReferenceTrialResponsibilityBriefStopV1,
): Promise<void> {
  const path = join(
    repositoryRoot,
    'artifacts/evolution/autonomous-authoring/reference-trial-stops',
    result.status === 'REFERENCE_EVIDENCE_UNAVAILABLE'
      ? `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}.json`
      : result.status === 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE'
        ? `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}-observable-payload.json`
        : `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}-responsibility-brief.json`,
  );
  const bytes = `${JSON.stringify(result, null, 2)}\n`;
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, bytes, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST'
      || (await readFile(path, 'utf8')) !== bytes) {
      throw error;
    }
  }
}

export interface PreschoolReferenceSolutionCommunicationOutcomeV1 {
  status: 'SUCCEEDED' | 'INITIAL_TIMEOUT' | 'TIMEOUT_AFTER_ROLE_SCHEMA' | 'PROCESS_FAILURE' | 'ENVELOPE_FAILURE' | 'ROLE_SCHEMA_FAILURE' | 'ACCEPTED_RESULT_FAILURE' | 'PRE_VALIDATION_FAILURE' | 'PREPARATION_FAILURE';
  envelopeValid: boolean | null;
  schemaValidationAttempted: boolean;
  schemaValid: boolean | null;
  reachedRoleSchemaValidation: boolean;
  elapsedMs: number | null;
  lastObservableActivityElapsedMs: number | null;
  failureOrigin?: string;
  failureReason?: string;
}

export interface PreschoolReferenceSolutionCommunicationProbeResultV1 {
  schemaVersion: 'preschool-reference-solution-communication-probe-v1';
  probeRef: string;
  status: PreschoolReferenceSolutionCommunicationOutcomeV1['status'] | 'CONTAINMENT_FAILURE';
  implementationSha: string;
  participantBindingLock: ReferenceParticipantBindingLockV1;
  participantBindingLockSha256: string;
  acceptedEvidenceSha256: string;
  observablePayloadSha256: string;
  responsibilityBriefSha256: string;
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string;
  authoritativeFingerprintUnchanged: boolean;
  governedHistorySha256Before: string;
  governedHistorySha256After: string;
  governedHistoryUnchanged: boolean;
  attempt000012Absent: boolean;
  admissionLockAbsent: boolean;
  noReviewerShadowPromotion: boolean;
  solutionOutcome: PreschoolReferenceSolutionCommunicationOutcomeV1;
  evidenceArtifactRefs: {
    bindingLock: 'participant-binding-lock.json';
    probeInputs: 'probe-inputs.json';
    solutionInvocation: string;
    solutionRawOutput: string;
    solutionExecutionTrace: string | null;
    solutionResult: string | null;
    solutionFailure: string | null;
    probeResult: 'probe-result.json';
  };
  failure?: string;
}

export interface PreschoolReferenceSolutionCommunicationProbeDependencies {
  resolveReferenceParticipantBindingFromLock?: typeof resolveReferenceParticipantBindingFromLock;
  runSolutionAgent?: typeof runSolutionAgent;
}

export function classifyPreschoolReferenceSolutionCommunicationOutcome(input: {
  solution: SolutionAgentRunResult;
  executionTrace: ParticipantExecutionTraceV1 | null;
}): PreschoolReferenceSolutionCommunicationOutcomeV1 {
  const validationEvents = input.executionTrace?.events.filter(event => event.type === 'participant_terminal_validation') ?? [];
  const lastValidation = validationEvents.at(-1);
  const schemaValidationEvents = validationEvents.filter(event => event.schemaValidationAttempted === true);
  const schemaValidationAttempted = schemaValidationEvents.length > 0;
  const schemaValid = schemaValidationAttempted
    ? schemaValidationEvents.at(-1)?.schemaValid ?? null
    : null;
  let status: PreschoolReferenceSolutionCommunicationOutcomeV1['status'];
  if (!input.solution.ok && input.solution.errorKind === 'timeout') {
    status = schemaValidationAttempted ? 'TIMEOUT_AFTER_ROLE_SCHEMA' : 'INITIAL_TIMEOUT';
  } else if (lastValidation?.envelopeValid === false) {
    status = 'ENVELOPE_FAILURE';
  } else if (schemaValidationAttempted && schemaValid === false) {
    status = 'ROLE_SCHEMA_FAILURE';
  } else if (schemaValidationAttempted && schemaValid === true && !input.solution.ok) {
    status = 'ACCEPTED_RESULT_FAILURE';
  } else if (input.solution.ok && schemaValidationAttempted && schemaValid === true) {
    status = 'SUCCEEDED';
  } else if (!input.executionTrace && !input.solution.ok
    && input.solution.failure.origin === 'HOST_INFRASTRUCTURE') {
    status = 'PREPARATION_FAILURE';
  } else if (!input.solution.ok && ['process', 'runtime_unavailable', 'continuation'].includes(input.solution.errorKind)) {
    status = 'PROCESS_FAILURE';
  } else {
    status = 'PRE_VALIDATION_FAILURE';
  }
  return {
    status,
    envelopeValid: lastValidation?.envelopeValid ?? null,
    schemaValidationAttempted,
    schemaValid,
    reachedRoleSchemaValidation: schemaValidationAttempted,
    elapsedMs: input.executionTrace?.terminal.elapsedMs ?? null,
    lastObservableActivityElapsedMs: input.executionTrace?.terminal.lastObservableActivityElapsedMs ?? null,
    ...(!input.solution.ok ? {
      failureOrigin: input.solution.failure.origin,
      failureReason: input.solution.failure.reason,
    } : {}),
  };
}

function referenceProbePathExists(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return false;
    throw error;
  }
}

function realpathWithMissingSuffix(path: string): string {
  let cursor = resolve(path);
  const missingSuffix: string[] = [];
  while (true) {
    try {
      return resolve(realpathSync(cursor), ...missingSuffix);
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw error;
      missingSuffix.unshift(basename(cursor));
      cursor = parent;
    }
  }
}

function pathIsWithin(root: string, target: string): boolean {
  const relativePath = relative(realpathWithMissingSuffix(root), realpathWithMissingSuffix(target));
  return relativePath === '' || (relativePath !== '..'
    && !relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath));
}

function assertReferenceSolutionProbeDestination(liveRoot: string, destinationRoot: string): void {
  const governedRoot = join(resolve(liveRoot), 'artifacts/evolution/autonomous-authoring/reference-trials');
  if (pathIsWithin(governedRoot, destinationRoot)) {
    throw new Error('Solution communication probe destination must be outside governed reference-trial history.');
  }
}

function readGitHead(repositoryRoot: string): string {
  const diff = spawnSync('git', ['-C', repositoryRoot, 'diff', '--quiet', 'HEAD', '--'], { encoding: 'utf8' });
  if (diff.error) throw new Error(`Could not verify tracked implementation worktree: ${diff.error.message}`);
  if (diff.status === 1) throw new Error('Tracked implementation worktree must be clean before communication validation.');
  if (diff.status !== 0) throw new Error(`Could not verify tracked implementation worktree: ${diff.stderr}`);
  const head = spawnSync('git', ['-C', repositoryRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (head.error || head.status !== 0) throw new Error(`Could not read implementation SHA: ${head.error ?? head.stderr}`);
  return head.stdout.trim();
}

async function readSolutionExecutionTrace(path: string): Promise<ParticipantExecutionTraceV1 | null> {
  try {
    const parsed = JSON.parse(await readFile(path, 'utf8')) as unknown;
    if (!isRecord(parsed) || parsed.schemaVersion !== 'participant-execution-trace-v1'
      || !Array.isArray(parsed.events) || !isRecord(parsed.invocation) || !isRecord(parsed.terminal)) {
      throw new Error('Solution execution trace artifact is malformed.');
    }
    return parsed as unknown as ParticipantExecutionTraceV1;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
}

export async function runPreschoolReferenceSolutionCommunicationProbe(
  input: {
    liveRepositoryRoot: string;
    evidencePath: string;
    observablePayloadPath: string;
    responsibilityBriefPath: string;
    probeRef: string;
    destinationRoot: string;
    participantBindingLock: ReferenceParticipantBindingLockV1;
  },
  dependencies: PreschoolReferenceSolutionCommunicationProbeDependencies = {},
): Promise<PreschoolReferenceSolutionCommunicationProbeResultV1> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(input.probeRef) || /^attempt-[0-9]{6}$/.test(input.probeRef)) {
    throw new Error('Solution communication probe reference is invalid.');
  }
  const destinationRoot = isAbsolute(input.destinationRoot)
    ? resolve(input.destinationRoot)
    : resolve(liveRoot, input.destinationRoot);
  assertReferenceSolutionProbeDestination(liveRoot, destinationRoot);

  const trialRoot = referenceTrialRoot(liveRoot);
  const attemptTwelvePath = join(trialRoot, 'attempts/attempt-000012');
  const admissionLockPath = `${trialRoot}.admission.lock`;
  if (referenceProbePathExists(attemptTwelvePath)) throw new Error('attempt-000012 already exists; probe will not run.');
  if (referenceProbePathExists(admissionLockPath)) throw new Error('Reference-trial admission lock exists; probe will not run.');

  const evidencePath = isAbsolute(input.evidencePath) ? input.evidencePath : resolve(liveRoot, input.evidencePath);
  const observablePayloadPath = isAbsolute(input.observablePayloadPath)
    ? input.observablePayloadPath : resolve(liveRoot, input.observablePayloadPath);
  const responsibilityBriefPath = isAbsolute(input.responsibilityBriefPath)
    ? input.responsibilityBriefPath : resolve(liveRoot, input.responsibilityBriefPath);
  const acceptedEvidence = await readExactAcceptedEvidence(evidencePath);
  if (!acceptedEvidence.evidence || !acceptedEvidence.bytes) throw new Error('Exact accepted historical evidence is unavailable.');
  const observablePayloadBytes = await readExactReferenceObservablePayload(
    observablePayloadPath,
    PRESCHOOL_REFERENCE_TRIAL_ACCEPTED_SEALED_OBSERVABLE_PAYLOAD_SHA256,
  );
  if (!observablePayloadBytes) throw new Error('Exact accepted historical observable payload is unavailable.');
  const responsibilityBrief = await readAcceptedPreschoolReferenceResponsibilityBrief(responsibilityBriefPath);
  if (!responsibilityBrief.ok) throw new Error(responsibilityBrief.reason);
  await assertCurrentAuthorityDocuments(liveRoot);

  const historyBefore = await captureReferenceTrialLegacyHistory(trialRoot);
  const governedHistorySha256Before = sha256Hex(canonicalJson(historyBefore));
  const authoritativeFingerprintBefore = await captureAuthoritativeFingerprint(liveRoot);
  const participantBindingLockSha256 = referenceParticipantBindingLockSha256(input.participantBindingLock);
  const resolveBinding = dependencies.resolveReferenceParticipantBindingFromLock
    ?? resolveReferenceParticipantBindingFromLock;
  const binding = await resolveBinding({ repositoryRoot: liveRoot, lock: input.participantBindingLock });
  const implementationSha = readGitHead(liveRoot);

  await mkdir(dirname(destinationRoot), { recursive: true });
  await mkdir(destinationRoot, { recursive: false });
  await writeCreateOnlyJson(join(destinationRoot, 'participant-binding-lock.json'), input.participantBindingLock);
  await writeCreateOnlyJson(join(destinationRoot, 'probe-inputs.json'), {
    schemaVersion: 'preschool-reference-solution-communication-probe-inputs-v1',
    probeRef: input.probeRef,
    implementationSha,
    participantBindingLockSha256,
    acceptedEvidenceSha256: sha256Hex(acceptedEvidence.bytes),
    observablePayloadSha256: sha256Hex(observablePayloadBytes),
    responsibilityBriefSha256: responsibilityBrief.value.sha256,
    runRef: acceptedEvidence.evidence.runRef,
  });

  const temporaryRoot = await mkdtemp(join(tmpdir(), `preschool-reference-solution-probe-${input.probeRef}-`));
  let solution: SolutionAgentRunResult | null = null;
  let executionTrace: ParticipantExecutionTraceV1 | null = null;
  let failure: string | undefined;
  const solutionDestinationRoot = join(destinationRoot, 'solution-agent');
  try {
    const { trialBaselineRoot } = await materializeHistoricalTrialRoots({
      liveRepositoryRoot: liveRoot,
      temporaryRoot,
    });
    const solutionInputsRoot = join(destinationRoot, 'solution-inputs');
    const trialInputs = await writePreschoolReferenceTrialInputs({
      outputRoot: solutionInputsRoot,
      authorityRepositoryRoot: liveRoot,
      candidateBaselineRoot: trialBaselineRoot,
      runRef: acceptedEvidence.evidence.runRef,
      observablePayloadBytes,
      responsibilityBrief: responsibilityBrief.value,
    });
    const solutionWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: trialBaselineRoot,
      destinationRoot: join(temporaryRoot, 'participant-workspaces'),
      jobKind: 'solution',
      artifactSourceRoot: solutionInputsRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    const runSolution = dependencies.runSolutionAgent ?? runSolutionAgent;
    solution = await runSolution({
      problemPackage: trialInputs.problemPackage,
      problemPackagePath: trialInputs.problemPackagePath,
      workspaceRoot: solutionWorkspace.workspaceRoot,
      repositoryRoot: trialBaselineRoot,
      artifactRoot: solutionInputsRoot,
      workspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
      invocationRef: `preschool-reference-solution-communication-${input.probeRef}`,
      jobNumber: 1,
      destinationRoot: solutionDestinationRoot,
      skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
      participant: withParticipantContaminationGuard(binding.participant),
      autonomousAuthoringContractPacket: trialInputs.contractPacket,
      referenceResponsibilityContext: {
        validationLayer: PRESCHOOL_REFERENCE_VALIDATION_LAYER,
        responsibilityProvenance: PRESCHOOL_REFERENCE_RESPONSIBILITY_PROVENANCE,
        briefRef: REFERENCE_RESPONSIBILITY_BRIEF_PATH,
        attestationRef: REFERENCE_RESPONSIBILITY_ATTESTATION_PATH,
        brief: responsibilityBrief.value.brief,
      } satisfies PreschoolReferenceResponsibilityContextV1,
    });
    executionTrace = await readSolutionExecutionTrace(join(solutionDestinationRoot, 'execution-trace.json'));
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
    try {
      executionTrace = await readSolutionExecutionTrace(join(solutionDestinationRoot, 'execution-trace.json'));
    } catch {
      executionTrace = null;
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }

  const solutionOutcome = solution
    ? classifyPreschoolReferenceSolutionCommunicationOutcome({ solution, executionTrace })
    : {
      status: 'PREPARATION_FAILURE' as const,
      envelopeValid: null,
      schemaValidationAttempted: false,
      schemaValid: null,
      reachedRoleSchemaValidation: false,
      elapsedMs: null,
      lastObservableActivityElapsedMs: null,
    };
  const [authoritativeFingerprintAfter, historyAfter] = await Promise.all([
    captureAuthoritativeFingerprint(liveRoot),
    captureReferenceTrialLegacyHistory(trialRoot),
  ]);
  const governedHistorySha256After = sha256Hex(canonicalJson(historyAfter));
  const authoritativeFingerprintUnchanged = authoritativeFingerprintAfter === authoritativeFingerprintBefore;
  const governedHistoryUnchanged = governedHistorySha256After === governedHistorySha256Before;
  const attempt000012Absent = !referenceProbePathExists(attemptTwelvePath);
  const admissionLockAbsent = !referenceProbePathExists(admissionLockPath);
  const forbiddenArtifacts = [
    'reviewer-agent', 'shadow-authoring', 'promotion-package.json', 'promotion.patch',
  ].filter(path => referenceProbePathExists(join(destinationRoot, path)));
  const noReviewerShadowPromotion = forbiddenArtifacts.length === 0;
  const status = authoritativeFingerprintUnchanged
    && governedHistoryUnchanged
    && attempt000012Absent
    && admissionLockAbsent
    && noReviewerShadowPromotion
    ? solutionOutcome.status
    : 'CONTAINMENT_FAILURE';
  const result: PreschoolReferenceSolutionCommunicationProbeResultV1 = {
    schemaVersion: 'preschool-reference-solution-communication-probe-v1',
    probeRef: input.probeRef,
    status,
    implementationSha,
    participantBindingLock: input.participantBindingLock,
    participantBindingLockSha256,
    acceptedEvidenceSha256: sha256Hex(acceptedEvidence.bytes),
    observablePayloadSha256: sha256Hex(observablePayloadBytes),
    responsibilityBriefSha256: responsibilityBrief.value.sha256,
    authoritativeFingerprintBefore: authoritativeFingerprintBefore,
    authoritativeFingerprintAfter,
    authoritativeFingerprintUnchanged,
    governedHistorySha256Before,
    governedHistorySha256After,
    governedHistoryUnchanged,
    attempt000012Absent,
    admissionLockAbsent,
    noReviewerShadowPromotion,
    solutionOutcome,
    evidenceArtifactRefs: {
      bindingLock: 'participant-binding-lock.json',
      probeInputs: 'probe-inputs.json',
      solutionInvocation: relative(destinationRoot, join(solutionDestinationRoot, 'invocation.json')),
      solutionRawOutput: relative(destinationRoot, join(solutionDestinationRoot, 'raw-output.txt')),
      solutionExecutionTrace: referenceProbePathExists(join(solutionDestinationRoot, 'execution-trace.json'))
        ? relative(destinationRoot, join(solutionDestinationRoot, 'execution-trace.json')) : null,
      solutionResult: referenceProbePathExists(join(solutionDestinationRoot, 'result.json'))
        ? relative(destinationRoot, join(solutionDestinationRoot, 'result.json')) : null,
      solutionFailure: referenceProbePathExists(join(solutionDestinationRoot, 'failure.json'))
        ? relative(destinationRoot, join(solutionDestinationRoot, 'failure.json')) : null,
      probeResult: 'probe-result.json',
    },
    ...(failure === undefined ? {} : { failure }),
  };
  await writeCreateOnlyJson(join(destinationRoot, 'probe-result.json'), result);
  return result;
}

export async function runPreschoolReferenceTrialCli(
  argv: string[],
  dependencies: PreschoolReferenceTrialDependencies = {},
): Promise<number> {
  let evidencePath: string | null = null;
  let observablePayloadPath: string | null = null;
  let responsibilityBriefPath: string | null = null;
  let executionAuthorizationPath: string | null = null;
  let expectedExecutionAuthorizationSha256: string | null = null;
  let attemptRef: string | null = null;
  let authorizationArgumentError: string | null = null;
  const usage = 'Usage: --evidence <accepted-capacity-evidence-path> --observable-payload <exact-sealed-observable-payload-path> --responsibility-brief <accepted-brief-path> --execution-authorization <human-authorization-artifact-path> --execution-authorization-sha256 <64-char-sha256> --attempt-ref <attempt-NNNNNN>';
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--evidence') {
      if (evidencePath !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
        throw new Error(usage);
      }
      evidencePath = argv[index + 1]!;
      index += 1;
      continue;
    }
    if (argv[index] === '--observable-payload') {
      if (observablePayloadPath !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
        throw new Error(usage);
      }
      observablePayloadPath = argv[index + 1]!;
      index += 1;
      continue;
    }
    if (argv[index] === '--responsibility-brief') {
      if (responsibilityBriefPath !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
        throw new Error(usage);
      }
      responsibilityBriefPath = argv[index + 1]!;
      index += 1;
      continue;
    }
    if (argv[index] === '--attempt-ref') {
      if (attemptRef !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
        authorizationArgumentError = 'Attempt reference is missing or specified more than once.';
        if (argv[index + 1] && !argv[index + 1]!.startsWith('--')) index += 1;
        continue;
      }
      try {
        attemptRef = validateReferenceTrialAttemptRef(argv[index + 1]!);
      } catch (error) {
        authorizationArgumentError = error instanceof Error ? error.message : String(error);
      }
      index += 1;
      continue;
    }
    if (argv[index] === '--execution-authorization') {
      if (executionAuthorizationPath !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
        authorizationArgumentError = 'Execution authorization artifact path is missing or specified more than once.';
        if (argv[index + 1] && !argv[index + 1]!.startsWith('--')) index += 1;
        continue;
      }
      executionAuthorizationPath = argv[index + 1]!;
      index += 1;
      continue;
    }
    if (argv[index] === '--execution-authorization-sha256') {
      if (expectedExecutionAuthorizationSha256 !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
        authorizationArgumentError = 'Execution authorization SHA-256 is missing or specified more than once.';
        if (argv[index + 1] && !argv[index + 1]!.startsWith('--')) index += 1;
        continue;
      }
      expectedExecutionAuthorizationSha256 = argv[index + 1]!;
      index += 1;
    }
  }
  if (!authorizationArgumentError
    && (executionAuthorizationPath === null || expectedExecutionAuthorizationSha256 === null)) {
    authorizationArgumentError = 'Both the execution authorization artifact path and external SHA-256 are required.';
  }
  if (authorizationArgumentError) {
    process.stdout.write(`${JSON.stringify({
      schemaVersion: 'preschool-reference-trial-stop-v1',
      status: 'REFERENCE_EXECUTION_AUTHORIZATION_UNAVAILABLE',
      runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
      reason: authorizationArgumentError,
    }, null, 2)}\n`);
    return 1;
  }
  const result = await runPreschoolReferenceTrial({
    liveRepositoryRoot: process.cwd(),
    evidencePath,
    observablePayloadPath,
    responsibilityBriefPath,
    attemptRef,
    executionAuthorizationPath,
    expectedExecutionAuthorizationSha256,
  }, dependencies);
  if (result.status === 'REFERENCE_EVIDENCE_UNAVAILABLE'
    || result.status === 'REFERENCE_OBSERVABLE_PAYLOAD_UNAVAILABLE'
    || result.status === 'REFERENCE_RESPONSIBILITY_BRIEF_UNAVAILABLE') {
    await persistReferenceTrialStop(process.cwd(), result);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.status === 'SHADOW_AUTHORING_VERIFIED' ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPreschoolReferenceTrialCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
