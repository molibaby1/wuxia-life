import { spawnSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import type { PassiveNarrativeEntry } from '../../../src/data/passiveNarrativeTypes';
import {
  PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
  PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES,
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
} from '../../../src/evolution/preschoolSharedNeutralAuthoringContract';
import {
  validateAutonomousAuthoringAdmission,
  type AutonomousAuthoringAdmissionV1,
  type PreschoolCapacityEvidenceV1,
} from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import {
  validateAutonomousAuthoringProposal,
  type AutonomousAuthoringProposalV1,
} from '../../../src/evolution/autonomousAuthoringContract';
import { validateSolutionReview, type SolutionReviewV1 } from '../../../src/evolution/solutionReviewContract';
import { validateSolutionWork, type SolutionWorkV1 } from '../../../src/evolution/solutionWorkContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import { captureAuthoritativeFingerprint, captureWorkspaceSnapshot } from '../problemAgnosticSolution/agentWorkspace';
import {
  buildDeterministicPromotionPatch,
  compareWorkspaceSnapshots,
  type CanonicalWorkspaceChange,
} from './workspaceChangeSet';

export type ShadowVerificationCheck = 'PASS' | 'FAIL' | 'NOT_RUN';

export interface PreschoolCapacityDeficit {
  demand: number;
  maximumMatchedAuthored: number;
  structuralDeficit: number;
}

export interface ShadowAuthoringCommandResult {
  command: string;
  exitCode: number;
  output: string;
}

export interface PreschoolShadowAuthoringVerificationResultV1 {
  schemaVersion: 'preschool-shadow-authoring-verification-v1';
  status: 'SHADOW_AUTHORING_VERIFIED' | 'SHADOW_AUTHORING_VERIFICATION_FAILED';
  checks: {
    authorityIntegrity: ShadowVerificationCheck;
    mechanicalConformance: ShadowVerificationCheck;
    semanticConformance: ShadowVerificationCheck;
    redGreenRegression: ShadowVerificationCheck;
    adjacentRegression: ShadowVerificationCheck;
    evidenceBoundedCompletion: ShadowVerificationCheck;
  };
  failures: string[];
  candidateBaselineGitSha: string;
  candidateBaselineFingerprintSha256: string;
  acceptedProposalSha256: string | null;
  acceptedReviewSha256: string | null;
  admissionSha256: string | null;
  authoritativeFingerprintBefore: string;
  authoritativeFingerprintAfter: string | null;
  changedFiles: CanonicalWorkspaceChange[];
  commandResults: ShadowAuthoringCommandResult[];
  capacityBefore: PreschoolCapacityDeficit | null;
  capacityAfter: PreschoolCapacityDeficit | null;
  patchSha256: string | null;
  promotionPatch: Buffer | null;
}

export interface VerifyPreschoolShadowAuthoringInput {
  repositoryRoot: string;
  authoritativeRepositoryRoot?: string;
  beforeWorkspaceRoot: string;
  finalWorkspaceRoot: string;
  candidateBaselineGitSha: string;
  candidateBaselineFingerprintSha256: string;
  authoritativeFingerprintBefore: string;
  solution: SolutionWorkV1;
  review: SolutionReviewV1;
  admission: AutonomousAuthoringAdmissionV1;
}

type VerificationCheckName = keyof PreschoolShadowAuthoringVerificationResultV1['checks'];
type RecordValue = Record<string, unknown>;

const AUTHORITY_PATHS = [
  'docs/governance/product-decisions.md',
  'docs/product/content-authoring-workflow-contract-design.md',
  'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md',
] as const;
const CANONICAL_ORIGINS = ['scholar', 'martial', 'merchant', 'frontier'] as const;
const RED_ERROR_MARKERS = [
  'SyntaxError',
  'ERR_MODULE_NOT_FOUND',
  'Cannot find module',
  'Cannot find package',
  'MODULE_NOT_FOUND',
  'TS1005',
  'TS1109',
  'TS1128',
  'TypeScript parse error',
  'Transform failed with',
];
const ADJACENT_COMMANDS = [
  'npm exec tsx tests/neutralPassiveDedupTests.ts',
  'npm exec tsx tests/evolution/playerSurfaceCapture.test.ts',
  'npm run typecheck',
] as const;

function newResult(input: VerifyPreschoolShadowAuthoringInput): PreschoolShadowAuthoringVerificationResultV1 {
  return {
    schemaVersion: 'preschool-shadow-authoring-verification-v1',
    status: 'SHADOW_AUTHORING_VERIFICATION_FAILED',
    checks: {
      authorityIntegrity: 'NOT_RUN',
      mechanicalConformance: 'NOT_RUN',
      semanticConformance: 'NOT_RUN',
      redGreenRegression: 'NOT_RUN',
      adjacentRegression: 'NOT_RUN',
      evidenceBoundedCompletion: 'NOT_RUN',
    },
    failures: [],
    candidateBaselineGitSha: input.candidateBaselineGitSha,
    candidateBaselineFingerprintSha256: input.candidateBaselineFingerprintSha256,
    acceptedProposalSha256: null,
    acceptedReviewSha256: null,
    admissionSha256: null,
    authoritativeFingerprintBefore: input.authoritativeFingerprintBefore,
    authoritativeFingerprintAfter: null,
    changedFiles: [],
    commandResults: [],
    capacityBefore: null,
    capacityAfter: null,
    patchSha256: null,
    promotionPatch: null,
  };
}

function recordFailure(
  result: PreschoolShadowAuthoringVerificationResultV1,
  check: VerificationCheckName,
  error: unknown,
): void {
  result.checks[check] = 'FAIL';
  result.failures.push(error instanceof Error ? error.message : String(error));
}

function fail(result: PreschoolShadowAuthoringVerificationResultV1): PreschoolShadowAuthoringVerificationResultV1 {
  result.status = 'SHADOW_AUTHORING_VERIFICATION_FAILED';
  result.promotionPatch = null;
  result.patchSha256 = null;
  return result;
}

function gitHead(repositoryRoot: string): string | null {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.status !== 0) {
    if (/not a git repository|not inside a work tree/i.test(result.stderr)) return null;
    throw new Error(`Candidate repository HEAD could not be read: ${result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

async function assertAuthorityFiles(root: string): Promise<void> {
  const [decisions, workflow, spec] = await Promise.all(
    AUTHORITY_PATHS.map(path => readFile(join(root, path), 'utf8')),
  );
  if (!decisions.includes('### PD-121：Contract-Constrained Autonomous Authoring v1')) {
    throw new Error('PD-121 is missing from the current product decisions.');
  }
  if (!workflow.startsWith('# Content Authoring Workflow Contract v3')
    || !workflow.includes('PD-121')
    || !workflow.includes('shadow authoring')
    || !workflow.includes('Human exact-patch promotion')) {
    throw new Error('The canonical Content Authoring Workflow does not identify the PD-121 shadow exception.');
  }
  if (!spec.includes('**HUMAN ACCEPTED — 2026-09-24**')) {
    throw new Error('The accepted autonomous authoring design is missing or no longer accepted.');
  }
}

function selectedAcceptedProposal(
  solutionValue: SolutionWorkV1,
  reviewValue: SolutionReviewV1,
): { solution: SolutionWorkV1; review: SolutionReviewV1; proposal: AutonomousAuthoringProposalV1 } {
  const solution = validateSolutionWork(solutionValue);
  const review = validateSolutionReview(reviewValue);
  if (solution.status !== 'OPTIONS' || review.decision !== 'ACCEPT_OPTION' || !review.acceptedOptionId) {
    throw new Error('The Solution and Reviewer must identify one accepted option.');
  }
  const option = solution.options.find(item => item.optionId === review.acceptedOptionId);
  if (!option || option.changeScope !== 'program' || !option.autonomousAuthoring) {
    throw new Error('The accepted option must be a program-scope autonomous authoring proposal.');
  }
  return { solution, review, proposal: validateAutonomousAuthoringProposal(option.autonomousAuthoring) };
}

async function verifyV1(input: VerifyPreschoolShadowAuthoringInput): Promise<string> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const authoritativeRepositoryRoot = resolve(input.authoritativeRepositoryRoot ?? input.repositoryRoot);
  const beforeWorkspaceRoot = resolve(input.beforeWorkspaceRoot);
  const [head, candidateFingerprint, authoritativeFingerprint, beforeSnapshot] = await Promise.all([
    Promise.resolve(gitHead(repositoryRoot)),
    captureAuthoritativeFingerprint(repositoryRoot),
    captureAuthoritativeFingerprint(authoritativeRepositoryRoot),
    captureWorkspaceSnapshot(beforeWorkspaceRoot),
  ]);
  if (head !== null && head !== input.candidateBaselineGitSha) {
    throw new Error(`Candidate baseline SHA changed: expected ${input.candidateBaselineGitSha}, got ${head}.`);
  }
  if (!/^[a-f0-9]{40,64}$/.test(input.candidateBaselineGitSha)) {
    throw new Error('Candidate baseline SHA is invalid.');
  }
  if (!/^[a-f0-9]{64}$/.test(input.candidateBaselineFingerprintSha256)
    || candidateFingerprint !== input.candidateBaselineFingerprintSha256
    || input.authoritativeFingerprintBefore !== authoritativeFingerprint
    || beforeSnapshot.fingerprintSha256 !== input.candidateBaselineFingerprintSha256) {
    throw new Error('Candidate baseline or authoritative repository fingerprint does not match its supplied baseline.');
  }
  const { proposal } = selectedAcceptedProposal(input.solution, input.review);
  const admission = validateAutonomousAuthoringAdmission(input.admission);
  if (proposal.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    || proposal.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION
    || admission.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    || admission.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION) {
    throw new Error('Accepted proposal or Host admission does not match the v1 preschool contract ID and version.');
  }
  await assertAuthorityFiles(authoritativeRepositoryRoot);
  return authoritativeFingerprint;
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function readCatalog(root: string): Promise<PassiveNarrativeEntry[]> {
  const raw = JSON.parse(await readFile(join(root, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH), 'utf8')) as unknown;
  if (!isRecord(raw) || !Array.isArray(raw.entries)) throw new Error('Preschool catalog must contain an entries array.');
  return raw.entries as PassiveNarrativeEntry[];
}

function assertCatalogEntries(entries: PassiveNarrativeEntry[], label: string): void {
  const ids = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (!isRecord(entry)
      || typeof entry.id !== 'string' || entry.id.length === 0
      || ids.has(entry.id)) {
      throw new Error(`${label} catalog entry ${index} has an invalid or duplicate ID.`);
    }
    ids.add(entry.id);
  }
}

function assertExactNewEntry(entry: unknown, acceptedEntry: unknown, label: string): asserts entry is RecordValue {
  if (!isRecord(entry) || !isRecord(acceptedEntry)) throw new Error(`${label} entry must be an object.`);
  const exactKeys = ['id', 'title', 'text', 'originTags', 'ageMin', 'ageMax'];
  if (JSON.stringify(Object.keys(entry)) !== JSON.stringify(exactKeys)) {
    throw new Error(`${label} entry keys must be exactly id,title,text,originTags,ageMin,ageMax.`);
  }
  if (canonicalJson(entry) !== canonicalJson(acceptedEntry)) {
    throw new Error(`${label} does not exactly equal its accepted Card proposedEntry.`);
  }
  if (typeof entry.id !== 'string' || !/^preschool_neutral_[a-z0-9_]+$/.test(entry.id)) {
    throw new Error(`${label} ID must use the preschool_neutral_ namespace.`);
  }
  if (!Array.isArray(entry.originTags) || entry.originTags.length !== 1 || entry.originTags[0] !== 'neutral') {
    throw new Error(`${label} originTags must be exactly ["neutral"].`);
  }
  if (typeof entry.ageMin !== 'number' || ![4, 5, 6, 7].includes(entry.ageMin)
    || entry.ageMax !== 7) {
    throw new Error(`${label} age bounds must be an allowed ageMin and ageMax 7.`);
  }
}

async function verifyV2(input: VerifyPreschoolShadowAuthoringInput) {
  const [beforeSnapshot, finalSnapshot, baselineEntries, finalEntries] = await Promise.all([
    captureWorkspaceSnapshot(input.beforeWorkspaceRoot),
    captureWorkspaceSnapshot(input.finalWorkspaceRoot),
    readCatalog(input.beforeWorkspaceRoot),
    readCatalog(input.finalWorkspaceRoot),
  ]);
  const changedFiles = compareWorkspaceSnapshots(beforeSnapshot, finalSnapshot);
  const changedPaths = changedFiles.map(change => change.path);
  const allowed = new Set<string>(PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS);
  const unexpected = changedPaths.filter(path => !allowed.has(path));
  if (unexpected.length > 0) throw new Error(`Shadow workspace changed paths outside the Contract: ${unexpected.join(', ')}.`);
  for (const requiredPath of PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS) {
    if (!changedPaths.includes(requiredPath)) throw new Error(`Required shadow change is missing: ${requiredPath}.`);
  }
  if (finalEntries.length < baselineEntries.length) throw new Error('Shadow catalog removed baseline entries.');
  assertCatalogEntries(baselineEntries, 'baseline');
  assertCatalogEntries(finalEntries, 'final');
  const unchangedBaseline = finalEntries.slice(0, baselineEntries.length);
  if (canonicalJson(unchangedBaseline) !== canonicalJson(baselineEntries)) {
    throw new Error('Existing catalog entries changed or moved from their baseline order.');
  }
  const { proposal } = selectedAcceptedProposal(input.solution, input.review);
  const cards = proposal.contractPayload?.cards;
  if (!cards || cards.length === 0 || cards.length > PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES) {
    throw new Error('Accepted Cards must be present and no more than eight.');
  }
  const addedEntries = finalEntries.slice(baselineEntries.length);
  if (addedEntries.length !== cards.length) throw new Error('New catalog row count must equal the accepted Card count.');
  for (const [index, card] of cards.entries()) {
    assertExactNewEntry(addedEntries[index], card.proposedEntry, `New catalog row ${index + 1}`);
  }
  for (const path of PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS) {
    const baselineBytes = await readFile(join(input.beforeWorkspaceRoot, path));
    const finalBytes = await readFile(join(input.finalWorkspaceRoot, path));
    if (!finalBytes.subarray(0, baselineBytes.length).equals(baselineBytes)) {
      throw new Error(`${path} does not preserve its exact baseline bytes as a prefix.`);
    }
    const appendedBlock = finalBytes.subarray(baselineBytes.length).toString('utf8');
    const filename = path.split('/').at(-1)!;
    const hasDirectExecutionGuard = (appendedBlock.includes('import.meta.url')
      && appendedBlock.includes('process.argv[1]')
      && appendedBlock.includes('==='))
      || appendedBlock.includes(`endsWith('${filename}')`)
      || appendedBlock.includes(`endsWith("${filename}")`);
    if (!hasDirectExecutionGuard) throw new Error(`${path} appended regression block lacks a direct-execution guard.`);
    if (!appendedBlock.includes('AUTONOMOUS_AUTHORING_MISSING_ENTRY')
      || !appendedBlock.includes('throw new Error')) {
      throw new Error(`${path} appended regression block must throw AUTONOMOUS_AUTHORING_MISSING_ENTRY for a missing accepted ID.`);
    }
    for (const card of selectedAcceptedProposal(input.solution, input.review).proposal.contractPayload!.cards) {
      if (!appendedBlock.includes(card.proposedEntry.id)) {
        throw new Error(`${path} appended regression block does not assert accepted ID ${card.proposedEntry.id}.`);
      }
    }
  }
  return { changedFiles, baselineEntries, finalEntries, cards };
}

function verifyV3(input: VerifyPreschoolShadowAuthoringInput): {
  proposalSha256: string;
  reviewSha256: string;
  admissionSha256: string;
} {
  const { solution, review, proposal } = selectedAcceptedProposal(input.solution, input.review);
  const option = solution.options.find(item => item.optionId === review.acceptedOptionId)!;
  const assessment = review.autonomousAuthoringAssessment;
  const admission = validateAutonomousAuthoringAdmission(input.admission);
  if (proposal.applicabilityClaim !== 'APPLICABLE'
    || review.executionAuthorityAssessment !== 'WITHIN_CURRENT_AUTHORITY'
    || !assessment
    || assessment.contractId !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    || assessment.contractVersion !== PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION
    || assessment.applicabilityAssessment !== 'APPLICABLE'
    || assessment.conformance !== 'CONFORMING'
    || assessment.executionEnvelope !== 'WITHIN_ENVELOPE'
    || assessment.blockers.length !== 0) {
    throw new Error('Reviewer assessment must be APPLICABLE / CONFORMING / WITHIN_ENVELOPE, blocker-free, and within current authority.');
  }
  const proposalSha256 = sha256Hex(canonicalJson(proposal));
  const reviewSha256 = sha256Hex(canonicalJson(review));
  if (admission.status !== 'ELIGIBLE'
    || admission.proposalSha256 !== proposalSha256
    || admission.reviewSha256 !== reviewSha256
    || option.changeScope !== 'program') {
    throw new Error('Host admission must be ELIGIBLE and bind the accepted proposal and Reviewer assessment.');
  }
  return {
    proposalSha256,
    reviewSha256,
    admissionSha256: sha256Hex(canonicalJson(admission)),
  };
}

function runCommand(root: string, command: string): ShadowAuthoringCommandResult {
  const args = command.startsWith('npm exec ')
    ? ['exec', ...command.slice('npm exec '.length).split(' ')]
    : command.startsWith('npm run ')
      ? ['run', ...command.slice('npm run '.length).split(' ')]
      : [];
  if (args.length === 0) return { command, exitCode: -1, output: 'Unsupported verification command.' };
  const result = spawnSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  });
  return {
    command,
    exitCode: result.status ?? -1,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

function workspaceCopyFilter(sourceRoot: string, sourcePath: string): boolean {
  const path = relative(sourceRoot, sourcePath);
  if (path === '') return true;
  const parts = path.split(sep);
  return !parts.some(part => [
    '.git', '.omx', '.superpowers', '.tmp', '.worktrees', 'artifacts', 'agent_docs',
    'node_modules', 'dist', 'coverage',
  ].includes(part) || part === '.DS_Store' || part.toLowerCase().endsWith('.zip') || part.startsWith('.env'));
}

async function copyWorkspace(sourceRoot: string, destinationRoot: string): Promise<void> {
  await cp(sourceRoot, destinationRoot, {
    recursive: true,
    dereference: false,
    filter: sourcePath => workspaceCopyFilter(sourceRoot, sourcePath),
  });
}

async function linkNodeModules(repositoryRoot: string, workspaceRoot: string): Promise<void> {
  let current = resolve(repositoryRoot);
  while (true) {
    const candidate = join(current, 'node_modules');
    try {
      await readFile(join(candidate, '.modules.yaml'), 'utf8');
      await symlink(candidate, join(workspaceRoot, 'node_modules'), 'dir');
      return;
    } catch {
      // Continue walking toward the filesystem root; cache-only npm exec remains available.
    }
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

async function runV4(
  input: VerifyPreschoolShadowAuthoringInput,
  result: PreschoolShadowAuthoringVerificationResultV1,
  proposedIds: string[],
): Promise<void> {
  const redRoot = await mkdtemp(join(tmpdir(), 'preschool-shadow-red-'));
  const greenRoot = await mkdtemp(join(tmpdir(), 'preschool-shadow-green-'));
  try {
    await copyWorkspace(input.finalWorkspaceRoot, redRoot);
    await copyWorkspace(input.finalWorkspaceRoot, greenRoot);
    await linkNodeModules(input.repositoryRoot, redRoot);
    await linkNodeModules(input.repositoryRoot, greenRoot);
    await writeFile(
      join(redRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH),
      await readFile(join(input.beforeWorkspaceRoot, PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH)),
    );
    const focusedCommands = PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS.map(path => `npm exec tsx ${path}`);
    const redResults = focusedCommands.map(command => runCommand(redRoot, command));
    result.commandResults.push(...redResults);
    const redOutput = redResults.map(commandResult => commandResult.output).join('\n');
    const redFailed = redResults.some(commandResult => commandResult.exitCode !== 0);
    if (!redFailed) throw new Error('RED phase passed with the baseline catalog; a missing authored entry was not demonstrated.');
    const invalidRed = RED_ERROR_MARKERS.find(marker => redOutput.includes(marker));
    if (invalidRed) throw new Error(`RED phase failed for an invalid syntax/import/path reason: ${invalidRed}.`);
    if (!redOutput.includes('AUTONOMOUS_AUTHORING_MISSING_ENTRY')
      || !proposedIds.some(id => redOutput.includes(id))) {
      throw new Error('RED phase did not report AUTONOMOUS_AUTHORING_MISSING_ENTRY with a proposed ID.');
    }

    const greenResults = focusedCommands.map(command => runCommand(greenRoot, command));
    result.commandResults.push(...greenResults);
    const greenFailure = greenResults.find(commandResult => commandResult.exitCode !== 0);
    if (greenFailure) throw new Error(`GREEN phase failed: ${greenFailure.command}\n${greenFailure.output}`);
    result.checks.redGreenRegression = 'PASS';

    const adjacentResults = ADJACENT_COMMANDS.map(command => runCommand(greenRoot, command));
    result.commandResults.push(...adjacentResults);
    const adjacentFailure = adjacentResults.find(commandResult => commandResult.exitCode !== 0);
    if (adjacentFailure) throw new Error(`Adjacent shadow regression failed: ${adjacentFailure.command}\n${adjacentFailure.output}`);
    result.checks.adjacentRegression = 'PASS';
  } finally {
    await Promise.all([
      rm(redRoot, { recursive: true, force: true }),
      rm(greenRoot, { recursive: true, force: true }),
    ]);
  }
}

export function computePreschoolCapacityDeficit(input: {
  demandAges: Array<4 | 5 | 6 | 7>;
  canonicalOriginTag: 'scholar' | 'martial' | 'merchant' | 'frontier';
  catalogEntries: PassiveNarrativeEntry[];
  preConsumedEntryIds: string[];
}): PreschoolCapacityDeficit {
  if (!(CANONICAL_ORIGINS as readonly string[]).includes(input.canonicalOriginTag)) {
    throw new Error('Capacity origin must be canonical.');
  }
  const consumed = new Set(input.preConsumedEntryIds);
  const unique = new Map<string, PassiveNarrativeEntry>();
  for (const entry of input.catalogEntries) {
    if (typeof entry.id !== 'string' || entry.id.length === 0 || unique.has(entry.id)) {
      throw new Error('Capacity catalog IDs must be non-empty and unique.');
    }
    unique.set(entry.id, entry);
  }
  const candidates = input.demandAges.map(age => [...unique.values()].filter(entry =>
    !consumed.has(entry.id)
    && (entry.originTags.includes(input.canonicalOriginTag) || entry.originTags.includes('neutral'))
    && entry.ageMin <= age
    && entry.ageMax >= age,
  ));
  const demandOrder = candidates
    .map((entries, index) => ({ index, count: entries.length }))
    .sort((left, right) => left.count - right.count || left.index - right.index);
  const matchedEntryToDemand = new Map<string, number>();
  const assign = (demandIndex: number, visited: Set<string>): boolean => {
    for (const entry of candidates[demandIndex]!) {
      if (visited.has(entry.id)) continue;
      visited.add(entry.id);
      const previousDemand = matchedEntryToDemand.get(entry.id);
      if (previousDemand === undefined || assign(previousDemand, visited)) {
        matchedEntryToDemand.set(entry.id, demandIndex);
        return true;
      }
    }
    return false;
  };
  for (const demand of demandOrder) assign(demand.index, new Set());
  const maximumMatchedAuthored = matchedEntryToDemand.size;
  return {
    demand: input.demandAges.length,
    maximumMatchedAuthored,
    structuralDeficit: input.demandAges.length - maximumMatchedAuthored,
  };
}

export async function verifyPreschoolShadowAuthoring(
  input: VerifyPreschoolShadowAuthoringInput,
): Promise<PreschoolShadowAuthoringVerificationResultV1> {
  const result = newResult(input);
  try {
    result.authoritativeFingerprintAfter = await verifyV1(input);
    result.checks.authorityIntegrity = 'PASS';
  } catch (error) {
    recordFailure(result, 'authorityIntegrity', error);
    return fail(result);
  }

  let mechanical: Awaited<ReturnType<typeof verifyV2>>;
  try {
    mechanical = await verifyV2(input);
    result.changedFiles = mechanical.changedFiles;
    result.checks.mechanicalConformance = 'PASS';
  } catch (error) {
    recordFailure(result, 'mechanicalConformance', error);
    return fail(result);
  }

  try {
    const acceptedHashes = verifyV3(input);
    result.acceptedProposalSha256 = acceptedHashes.proposalSha256;
    result.acceptedReviewSha256 = acceptedHashes.reviewSha256;
    result.admissionSha256 = acceptedHashes.admissionSha256;
    result.checks.semanticConformance = 'PASS';
  } catch (error) {
    recordFailure(result, 'semanticConformance', error);
    return fail(result);
  }

  try {
    const proposal = selectedAcceptedProposal(input.solution, input.review).proposal;
    const proposedIds = proposal.contractPayload!.cards.map(card => card.proposedEntry.id);
    await runV4(input, result, proposedIds);
  } catch (error) {
    recordFailure(result, result.checks.redGreenRegression === 'PASS' ? 'adjacentRegression' : 'redGreenRegression', error);
    return fail(result);
  }

  try {
    const admission = validateAutonomousAuthoringAdmission(input.admission);
    const evidence: PreschoolCapacityEvidenceV1 | null = admission.capacityEvidence;
    if (!evidence) throw new Error('Host admission has no accepted capacity evidence.');
    const demandAges = evidence.beats.map(beat => beat.age);
    const [baselineEntries, finalEntries] = await Promise.all([
      readCatalog(input.beforeWorkspaceRoot),
      readCatalog(input.finalWorkspaceRoot),
    ]);
    result.capacityBefore = computePreschoolCapacityDeficit({
      demandAges,
      canonicalOriginTag: evidence.canonicalOriginTag,
      catalogEntries: baselineEntries,
      preConsumedEntryIds: evidence.preConsumedEntryIds,
    });
    result.capacityAfter = computePreschoolCapacityDeficit({
      demandAges,
      canonicalOriginTag: evidence.canonicalOriginTag,
      catalogEntries: finalEntries,
      preConsumedEntryIds: evidence.preConsumedEntryIds,
    });
    if (evidence.evidenceMode === 'STRUCTURAL_EXHAUSTION'
      && !(result.capacityBefore.structuralDeficit > 0 && result.capacityAfter.structuralDeficit === 0)) {
      throw new Error('Structural capacity deficit must decrease from a positive value to zero.');
    }
    if (evidence.evidenceMode === 'SEMANTIC_VARIETY'
      && !(result.capacityBefore.structuralDeficit === 0 && result.capacityAfter.structuralDeficit === 0)) {
      throw new Error('Semantic-variety evidence requires structural capacity to remain zero-to-zero.');
    }
    result.checks.evidenceBoundedCompletion = 'PASS';
  } catch (error) {
    recordFailure(result, 'evidenceBoundedCompletion', error);
    return fail(result);
  }

  try {
    const patch = await buildDeterministicPromotionPatch({
      beforeRoot: input.beforeWorkspaceRoot,
      afterRoot: input.finalWorkspaceRoot,
      changes: result.changedFiles,
    });
    result.promotionPatch = patch.patch;
    result.patchSha256 = patch.patchSha256;
    result.status = 'SHADOW_AUTHORING_VERIFIED';
    return result;
  } catch (error) {
    recordFailure(result, 'mechanicalConformance', error);
    return fail(result);
  }
}
