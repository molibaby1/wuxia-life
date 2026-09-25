import { spawnSync } from 'node:child_process';
import { access, cp, copyFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import {
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validatePreschoolCapacityEvidence, type PreschoolCapacityEvidenceV1 } from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import type { ImprovementHypothesis } from '../../../src/evolution/improvementHypothesisContract';
import { buildProblemPackage } from '../problemAgnosticSolution/buildProblemPackage';
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
import { routeSolutionDecision } from '../problemAgnosticSolution/routeSolutionDecision';
import {
  REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
  SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
} from '../problemAgnosticSolution/solutionParticipantSkills';
import type { WorkspaceAgentJobInput, WorkspaceAgentParticipantOptions } from '../problemAgnosticSolution/agentParticipant';
import { resolveOperatorParticipantBinding, OPERATOR_BINDING_CODEX_CURRENT } from '../operator/resolveParticipantBinding';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { buildPreschoolAutonomousAuthoringContractPacket } from './buildPreschoolContractPacket';
import { evaluatePreschoolAutonomousAuthoringAdmission } from './evaluatePreschoolAuthoringAdmission';
import { runShadowAuthoringExecution } from './shadowAuthoringExecutionParticipant';
import { verifyPreschoolShadowAuthoring } from './verifyPreschoolShadowAuthoring';
import { buildPromotionPackage } from './buildPromotionPackage';

export const PRESCHOOL_REFERENCE_TRIAL_RUN_REF = 'preschool-pver-20260922231805-71297571' as const;
export const PRESCHOOL_REFERENCE_TRIAL_BASELINE_SHA = 'e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf' as const;
export const PRESCHOOL_REFERENCE_TRIAL_AUTHORITY_PATHS = [
  'docs/governance/product-decisions.md',
  'docs/product/content-authoring-workflow-contract-design.md',
  'docs/product/auto-evolution-model.md',
] as const;

const ACCEPTED_DESIGN_PATH = 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
const INFANT_CATALOG_PATH = 'src/data/infantPassiveNarrativeCatalog.ts';
const CAPACITY_SUMMARY_PATH = 'source/reference-trial/capacity-summary.json';
const OBSERVABLE_SUMMARY_PATH = 'source/reference-trial/observable-summary.json';
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

export interface PreschoolReferenceTrialVerifiedV1 {
  schemaVersion: 'preschool-reference-trial-result-v1';
  status: 'SHADOW_AUTHORING_VERIFIED';
  runRef: typeof PRESCHOOL_REFERENCE_TRIAL_RUN_REF;
  newEntryCount: number;
  changedFiles: string[];
  promotionPackagePath: string;
  promotionPatchPath: string;
  liveRepositoryFingerprintBefore: string;
  liveRepositoryFingerprintAfter: string;
}

export type PreschoolReferenceTrialResultV1 = PreschoolReferenceTrialStopV1 | PreschoolReferenceTrialVerifiedV1;

export interface RunPreschoolReferenceTrialInput {
  liveRepositoryRoot: string;
  evidencePath?: string | null;
}

export interface PreschoolReferenceTrialDependencies {
  resolveParticipantBinding?: typeof resolveOperatorParticipantBinding;
}

const EVIDENCE_UNAVAILABLE: PreschoolReferenceTrialStopV1 = {
  schemaVersion: 'preschool-reference-trial-stop-v1',
  status: 'REFERENCE_EVIDENCE_UNAVAILABLE',
  runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  reason: 'Exact accepted chronology was not supplied; replay or evidence reconstruction is forbidden for this trial.',
};

async function writeCreateOnlyJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${canonicalJson(value)}\n`, { flag: 'wx' });
}

async function readExactAcceptedEvidence(path: string | null | undefined): Promise<PreschoolCapacityEvidenceV1 | null> {
  if (typeof path !== 'string' || path.length === 0) return null;
  try {
    const evidence = validatePreschoolCapacityEvidence(JSON.parse(await readFile(path, 'utf8')) as unknown);
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
      return null;
    }
    return evidence;
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

function assertNoParticipantContamination(workspaceRoot: string, prompt = ''): void {
  for (const marker of [...FORBIDDEN_ANSWER_IDS, FORBIDDEN_RESIDUAL_DESIGN_PATH]) {
    if (prompt.includes(marker)) throw new Error(`Participant-visible contamination detected in prompt: ${marker}`);
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
  const buildArgs = participant.buildArgs;
  const sameThreadContinuation = participant.sameThreadContinuation;
  return {
    ...participant,
    buildArgs: (input: WorkspaceAgentJobInput) => {
      assertNoParticipantContamination(input.workspaceRoot, input.prompt);
      return buildArgs(input);
    },
    ...(sameThreadContinuation === undefined
      ? {}
      : {
        sameThreadContinuation: {
          ...sameThreadContinuation,
          buildArgs: (input: WorkspaceAgentJobInput, threadRef) => {
            assertNoParticipantContamination(input.workspaceRoot, input.prompt);
            return sameThreadContinuation.buildArgs(input, threadRef);
          },
        },
      }),
  };
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
}): Promise<{ trialBaselineRoot: string; hostAuthorityRoot: string; baselineFingerprint: string }> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  const trialBaselineRoot = join(input.temporaryRoot, 'trial-baseline');
  await mkdir(trialBaselineRoot, { recursive: false });
  extractTarArchive(trialBaselineRoot, runGitArchive(liveRoot));
  await overlayReferenceTrialAuthority(liveRoot, trialBaselineRoot);
  await assertHistoricalInfantCatalogMatches(liveRoot, trialBaselineRoot);

  const nodeModulesPath = join(liveRoot, 'node_modules');
  try {
    await access(join(nodeModulesPath, '.modules.yaml'));
    await symlink(nodeModulesPath, join(trialBaselineRoot, 'node_modules'), 'dir');
  } catch {
    // Verification falls back to the normal npm exec cache when no pnpm runtime is present.
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
  return { trialBaselineRoot, hostAuthorityRoot, baselineFingerprint };
}

async function writeTrialInputs(input: {
  outputRoot: string;
  authorityRepositoryRoot: string;
  candidateBaselineRoot: string;
  runRef: string;
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
    unknowns: [],
    productSignificance: 'Completing a minimum sufficient set of existing shared-neutral preschool experiences can close the four evidenced gaps without adding game mechanics.',
  } satisfies ImprovementHypothesis;

  const contractPacket = await buildPreschoolAutonomousAuthoringContractPacket({
    repositoryRoot: input.authorityRepositoryRoot,
  });
  await writeCreateOnlyJson(join(input.outputRoot, CONTRACT_PACKET_PATH), contractPacket);
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
    observablePayloadRef: OBSERVABLE_SUMMARY_PATH,
    externalFeedbackRef: FEEDBACK_SUMMARY_PATH,
    improvementHypothesisRef: HYPOTHESIS_SUMMARY_PATH,
    diagnosticEvidenceRefs: [CAPACITY_SUMMARY_PATH],
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
  resolveParticipantBinding: typeof resolveOperatorParticipantBinding;
}): Promise<PreschoolReferenceTrialVerifiedV1> {
  const liveRoot = resolve(input.liveRepositoryRoot);
  const liveRepositoryFingerprintBefore = await captureAuthoritativeFingerprint(liveRoot);
  const outputRoot = join(
    liveRoot,
    'artifacts/evolution/autonomous-authoring/reference-trials',
    PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
  );
  await mkdir(dirname(outputRoot), { recursive: true });
  await mkdir(outputRoot, { recursive: false });
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'preschool-reference-trial-'));

  try {
    const { trialBaselineRoot, hostAuthorityRoot, baselineFingerprint } = await materializeHistoricalTrialRoots({
      liveRepositoryRoot: liveRoot,
      temporaryRoot,
    });
    const trialInputs = await writeTrialInputs({
      outputRoot,
      authorityRepositoryRoot: liveRoot,
      candidateBaselineRoot: trialBaselineRoot,
      runRef: input.evidence.runRef,
    });
    const binding = await input.resolveParticipantBinding(OPERATOR_BINDING_CODEX_CURRENT);
    const participant = withParticipantContaminationGuard(binding.participant);
    const workspaceDestinationRoot = join(temporaryRoot, 'participant-workspaces');

    const solutionWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: trialBaselineRoot,
      destinationRoot: workspaceDestinationRoot,
      jobKind: 'solution',
      artifactSourceRoot: outputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    const solution = await runSolutionAgent({
      problemPackage: trialInputs.problemPackage,
      problemPackagePath: trialInputs.problemPackagePath,
      workspaceRoot: solutionWorkspace.workspaceRoot,
      repositoryRoot: trialBaselineRoot,
      artifactRoot: outputRoot,
      workspaceBaselineFingerprintSha256: solutionWorkspace.workspaceBaselineFingerprintSha256,
      invocationRef: `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}-solution-000001`,
      jobNumber: 1,
      destinationRoot: join(outputRoot, 'solution-agent'),
      skillAssignments: SOLUTION_PARTICIPANT_SKILL_ASSIGNMENTS,
      participant,
      autonomousAuthoringContractPacket: trialInputs.contractPacket,
    });
    if (!solution.ok) throw new Error(`Solution Participant failed: ${solution.message}`);

    const reviewerWorkspace = await prepareReferenceTrialParticipantWorkspace({
      baselineRoot: trialBaselineRoot,
      destinationRoot: workspaceDestinationRoot,
      jobKind: 'reviewer',
      artifactSourceRoot: outputRoot,
      artifactRelativePaths: trialInputs.artifactRelativePaths,
    });
    const reviewer = await runSolutionReviewer({
      problemPackage: trialInputs.problemPackage,
      problemPackagePath: trialInputs.problemPackagePath,
      solutionWork: solution.result,
      workspaceRoot: reviewerWorkspace.workspaceRoot,
      repositoryRoot: trialBaselineRoot,
      artifactRoot: outputRoot,
      workspaceBaselineFingerprintSha256: reviewerWorkspace.workspaceBaselineFingerprintSha256,
      invocationRef: `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}-reviewer-000001`,
      jobNumber: 2,
      destinationRoot: join(outputRoot, 'reviewer-agent'),
      skillAssignments: REVIEWER_PARTICIPANT_SKILL_ASSIGNMENTS,
      participant,
      autonomousAuthoringContractPacket: trialInputs.contractPacket,
    });
    if (!reviewer.ok) throw new Error(`Reviewer Participant failed: ${reviewer.message}`);

    const selectedOption = acceptedAuthoringOption(solution, reviewer);
    const admission = await evaluatePreschoolAutonomousAuthoringAdmission({
      repositoryRoot: hostAuthorityRoot,
      sourceRoot: trialBaselineRoot,
      sourceRunRef: input.evidence.runRef,
      selectedOption,
      review: reviewer.review,
      proposalSha256: sha256Hex(canonicalJson(selectedOption.autonomousAuthoring)),
      reviewSha256: sha256Hex(canonicalJson(reviewer.review)),
      fixedCapacityEvidence: input.evidence,
    });
    if (admission.status !== 'ELIGIBLE') {
      throw new Error(`Host admission did not establish eligibility: ${admission.status} (${admission.reasons.join('; ')})`);
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

    const execution = await runShadowAuthoringExecution({
      repositoryRoot: trialBaselineRoot,
      workspaceDestinationRoot: join(temporaryRoot, 'shadow-workspace'),
      artifactRoot: join(outputRoot, 'shadow-authoring'),
      invocationRef: `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}/shadow-authoring`,
      solution: solution.result,
      review: reviewer.review,
      admission,
      participant,
    });
    if (execution.status !== 'completed' || execution.failure !== null) {
      throw new Error(`Shadow Executor failed: ${execution.failure ?? 'unknown failure'}`);
    }
    if (execution.authoritativeFingerprintBefore !== baselineFingerprint
      || execution.authoritativeFingerprintAfter !== baselineFingerprint) {
      throw new Error('The historical candidate baseline changed during shadow execution.');
    }

    const verification = await verifyPreschoolShadowAuthoring({
      repositoryRoot: trialBaselineRoot,
      authoritativeRepositoryRoot: hostAuthorityRoot,
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
    const result: PreschoolReferenceTrialVerifiedV1 = {
      schemaVersion: 'preschool-reference-trial-result-v1',
      status: 'SHADOW_AUTHORING_VERIFIED',
      runRef: PRESCHOOL_REFERENCE_TRIAL_RUN_REF,
      newEntryCount,
      changedFiles: verification.changedFiles.map(change => change.path),
      promotionPackagePath,
      promotionPatchPath,
      liveRepositoryFingerprintBefore,
      liveRepositoryFingerprintAfter,
    };
    await writeCreateOnlyJson(join(outputRoot, 'trial-result.json'), result);
    return result;
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function runPreschoolReferenceTrial(
  input: RunPreschoolReferenceTrialInput,
  dependencies: PreschoolReferenceTrialDependencies = {},
): Promise<PreschoolReferenceTrialResultV1> {
  const evidencePath = typeof input.evidencePath === 'string'
    ? (isAbsolute(input.evidencePath) ? input.evidencePath : resolve(input.liveRepositoryRoot, input.evidencePath))
    : null;
  const evidence = await readExactAcceptedEvidence(evidencePath);
  if (!evidence) return EVIDENCE_UNAVAILABLE;
  return runVerifiedHistoricalTrial({
    liveRepositoryRoot: input.liveRepositoryRoot,
    evidence,
    resolveParticipantBinding: dependencies.resolveParticipantBinding ?? resolveOperatorParticipantBinding,
  });
}

async function persistEvidenceUnavailableStop(
  repositoryRoot: string,
  result: PreschoolReferenceTrialStopV1,
): Promise<void> {
  const path = join(
    repositoryRoot,
    'artifacts/evolution/autonomous-authoring/reference-trial-stops',
    `${PRESCHOOL_REFERENCE_TRIAL_RUN_REF}.json`,
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

export async function runPreschoolReferenceTrialCli(argv: string[]): Promise<number> {
  let evidencePath: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== '--evidence') continue;
    if (evidencePath !== null || !argv[index + 1] || argv[index + 1]!.startsWith('--')) {
      throw new Error('Usage: --evidence <path-to-existing-accepted-preschool-capacity-evidence.json>');
    }
    evidencePath = argv[index + 1]!;
    index += 1;
  }
  const result = await runPreschoolReferenceTrial({
    liveRepositoryRoot: process.cwd(),
    evidencePath,
  });
  if (result.status === 'REFERENCE_EVIDENCE_UNAVAILABLE') {
    await persistEvidenceUnavailableStop(process.cwd(), result);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result.status === 'REFERENCE_EVIDENCE_UNAVAILABLE' ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPreschoolReferenceTrialCli(process.argv.slice(2)).then((exitCode) => {
    process.exitCode = exitCode;
  }).catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
