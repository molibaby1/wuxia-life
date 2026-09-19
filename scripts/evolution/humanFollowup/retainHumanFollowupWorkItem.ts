import { copyFile, lstat, mkdir, mkdtemp, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  canonicalJson,
  sha256Hex,
  validatePhase0RunRef,
} from '../phase0/provenance';
import {
  parseHumanFollowupWorkItem,
  validateHumanFollowupWorkItem,
  type HumanFollowupEvidenceEntry,
  type HumanFollowupWorkItemV1,
} from '../../../src/evolution/humanFollowupWorkItemContract';
import { validateProblemPackage, type ProblemPackage } from '../../../src/evolution/problemPackageContract';
import { validateSolutionDecision, type SolutionDecisionV1 } from '../../../src/evolution/solutionDecisionContract';

export interface RetainHumanFollowupWorkItemInput {
  repositoryRoot: string;
  workflowRoot: string;
  workflowInstanceRef: string;
  sourceRunRef: string;
  sourceFingerprintSha256: string;
  problemPackagePath: string;
  decisionPath: string;
  continuation?: HumanFollowupContinuationEvidence;
  candidateProvenance?: {
    mode: 'candidate-activation-v1';
    candidateActivationPath: string;
    hypothesisSetPath: string;
  };
}

export interface HumanFollowupContinuationEvidence {
  effectiveDecisionPath: string;
  continuationRelativePaths: string[];
}

export interface RetainedHumanFollowupWorkItem {
  itemPath: string;
  item: HumanFollowupWorkItemV1;
  created: boolean;
}

interface EvidenceSource {
  relativePath: string;
  sourcePath: string;
}

const ITEM_ROOT = 'artifacts/evolution/human-follow-up/items';
const SELECTION_PATH = 'selection/selected-hypothesis.json';
const SOLUTION_PATH = 'solution-agent/result.json';
const REVIEWER_PATH = 'reviewer-agent/review.json';
const BASE_DECISION_RELATIVE_PATH = 'decision.json';
const CONTINUATION_DECISION_RELATIVE_PATH = 'review-continuation-000001/decision.json';
const CONTINUATION_REVISION_REQUEST_PATH = 'review-continuation-000001/revision-request.json';
const CONTINUATION_SOLUTION_RESULT_PATH = 'review-continuation-000001/solution-revision/result.json';
const CONTINUATION_REVIEW_PATH = 'review-continuation-000001/reviewer-agent/review.json';
const CONTINUATION_ARTIFACT_PATH = 'review-continuation-000001/continuation.json';

function nonEmpty(value: string, label: string): string {
  if (!value) throw new Error(`${label} must be a non-empty string`);
  return value;
}

function assertSha256(value: string, label: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a SHA-256 hex string`);
  return value;
}

function safeRelativePath(value: string, label: string): string {
  nonEmpty(value, label);
  if (isAbsolute(value) || /^[A-Za-z]:/.test(value)) throw new Error(`${label} must be repository-relative`);
  const segments = value.split(/[\\/]/);
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`${label} must be a safe relative path`);
  }
  return value.split(sep).join('/');
}

function isWithin(root: string, candidate: string): boolean {
  const child = relative(root, candidate);
  return child !== '' && child !== '..' && !child.startsWith(`..${sep}`) && !isAbsolute(child);
}

async function readJson(path: string, label: string): Promise<unknown> {
  let raw: string;
  try {
    raw = await readFile(path, 'utf8');
  } catch (error) {
    throw new Error(`unable to read ${label}: ${String(error)}`);
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

async function tryLstat(path: string): Promise<Awaited<ReturnType<typeof lstat>> | null> {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function assertRegularFile(path: string, label: string, workflowRoot: string): Promise<void> {
  const stat = await tryLstat(path);
  if (!stat) throw new Error(`required evidence is missing: ${label}`);
  if (!stat.isFile()) throw new Error(`required evidence must be a regular file: ${label}`);
  const resolvedRoot = await realpath(workflowRoot);
  const resolvedFile = await realpath(path);
  if (!isWithin(resolvedRoot, resolvedFile)) {
    throw new Error(`required evidence escapes workflow root: ${label}`);
  }
}

function workflowRelativePath(workflowRoot: string, path: string, label: string): string {
  const relativePath = relative(resolve(workflowRoot), resolve(path));
  return safeRelativePath(relativePath, label);
}

async function optionalRegularFile(path: string, label: string, workflowRoot: string): Promise<boolean> {
  const stat = await tryLstat(path);
  if (!stat) return false;
  await assertRegularFile(path, label, workflowRoot);
  return true;
}

async function copyAndHashEvidence(
  source: EvidenceSource,
  stagingRoot: string,
  workflowRoot: string,
): Promise<HumanFollowupEvidenceEntry> {
  await assertRegularFile(source.sourcePath, source.relativePath, workflowRoot);
  const destination = join(stagingRoot, 'evidence', source.relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source.sourcePath, destination);
  const bytes = await readFile(destination);
  return { relativePath: source.relativePath, sha256: sha256Hex(bytes) };
}

async function verifyEvidence(
  itemPath: string,
  item: HumanFollowupWorkItemV1,
): Promise<void> {
  const itemDirectory = dirname(itemPath);
  for (const evidence of item.evidence) {
    const path = join(itemDirectory, 'evidence', evidence.relativePath);
    const stat = await tryLstat(path);
    if (!stat || !stat.isFile()) {
      throw new Error(`retained evidence is missing or not a regular file: ${evidence.relativePath}`);
    }
    const actualHash = sha256Hex(await readFile(path));
    if (actualHash !== evidence.sha256) {
      throw new Error(`retained evidence hash mismatch: ${evidence.relativePath}`);
    }
  }
}

function evidencePathsMatch(item: HumanFollowupWorkItemV1, expected: string[]): boolean {
  return canonicalJson(item.evidence.map(entry => entry.relativePath)) === canonicalJson(expected);
}

async function validateExistingItem(
  itemPath: string,
  expected: {
    itemId: string;
    sourceRunRef: string;
    workflowInstanceRef: string;
    decisionSha256: string;
    sourceFingerprintSha256: string;
    productSourceFingerprintSha256: string;
    problem: ProblemPackage['problem'];
    reasonCode: HumanFollowupWorkItemV1['trigger']['reasonCode'];
    evidencePaths: string[];
  },
): Promise<HumanFollowupWorkItemV1> {
  let item: HumanFollowupWorkItemV1;
  try {
    item = parseHumanFollowupWorkItem(await readFile(itemPath, 'utf8'));
  } catch (error) {
    throw new Error(`existing Human follow-up item is invalid: ${String(error)}`);
  }
  await verifyEvidence(itemPath, item);
  if (
    item.itemId !== expected.itemId
    || item.provenance.sourceRunRef !== expected.sourceRunRef
    || item.provenance.workflowInstanceRef !== expected.workflowInstanceRef
    || item.provenance.decisionSha256 !== expected.decisionSha256
    || item.provenance.sourceFingerprintSha256 !== expected.sourceFingerprintSha256
    || item.provenance.productSourceFingerprintSha256 !== expected.productSourceFingerprintSha256
    || item.trigger.reasonCode !== expected.reasonCode
    || canonicalJson(item.problem) !== canonicalJson(expected.problem)
    || !evidencePathsMatch(item, expected.evidencePaths)
  ) {
    throw new Error('existing Human follow-up item does not match the current escalation identity');
  }
  return item;
}

async function assertNoPreExistingStaging(itemsRoot: string): Promise<void> {
  for (const entry of await readdir(itemsRoot, { withFileTypes: true })) {
    if (entry.name.startsWith('.staging-')) {
      throw new Error(`pre-existing Human follow-up staging directory: ${entry.name}`);
    }
  }
}

function buildEvidenceSources(
  workflowRoot: string,
  problemPackage: ProblemPackage,
  problemPackagePath: string,
  decisionPath: string,
  reviewerPresent: boolean,
  continuation?: HumanFollowupContinuationEvidence,
  candidateProvenance?: RetainHumanFollowupWorkItemInput['candidateProvenance'],
): EvidenceSource[] {
  const sources: EvidenceSource[] = [
    { relativePath: 'problem-package.json', sourcePath: problemPackagePath },
    { relativePath: safeRelativePath(problemPackage.source.observablePayloadRef, 'observablePayloadRef'), sourcePath: join(workflowRoot, problemPackage.source.observablePayloadRef) },
    { relativePath: safeRelativePath(problemPackage.source.externalFeedbackRef, 'externalFeedbackRef'), sourcePath: join(workflowRoot, problemPackage.source.externalFeedbackRef) },
    { relativePath: safeRelativePath(problemPackage.source.improvementHypothesisRef, 'improvementHypothesisRef'), sourcePath: join(workflowRoot, problemPackage.source.improvementHypothesisRef) },
  ];
  if (problemPackage.schemaVersion === 'problem-package-v2') {
    for (const diagnosticRef of problemPackage.source.diagnosticEvidenceRefs) {
      sources.push({
        relativePath: safeRelativePath(diagnosticRef, 'diagnosticEvidenceRef'),
        sourcePath: join(workflowRoot, diagnosticRef),
      });
    }
  }
  if (candidateProvenance) {
    const candidateActivationPath = safeRelativePath(candidateProvenance.candidateActivationPath, 'candidateActivationPath');
    const hypothesisSetPath = safeRelativePath(candidateProvenance.hypothesisSetPath, 'hypothesisSetPath');
    if (!sources.some(source => source.relativePath === candidateActivationPath)) {
      sources.push({ relativePath: candidateActivationPath, sourcePath: join(workflowRoot, candidateActivationPath) });
    }
    if (!sources.some(source => source.relativePath === hypothesisSetPath)) {
      sources.push({ relativePath: hypothesisSetPath, sourcePath: join(workflowRoot, hypothesisSetPath) });
    }
  } else {
    sources.push({ relativePath: SELECTION_PATH, sourcePath: join(workflowRoot, SELECTION_PATH) });
  }
  sources.push({ relativePath: SOLUTION_PATH, sourcePath: join(workflowRoot, SOLUTION_PATH) });
  if (reviewerPresent) sources.push({ relativePath: REVIEWER_PATH, sourcePath: join(workflowRoot, REVIEWER_PATH) });
  sources.push({
    relativePath: 'decision.json',
    sourcePath: continuation ? join(workflowRoot, 'decision.json') : decisionPath,
  });
  if (continuation) {
    for (const relativePath of continuation.continuationRelativePaths) {
      sources.push({ relativePath, sourcePath: join(workflowRoot, relativePath) });
    }
  }
  return sources;
}

// ponytail: PD-117 allows exactly review-continuation-000001. A second continuation id is a contract change, not a search.
export async function deriveHumanFollowupContinuationEvidence(
  workflowRoot: string,
  decisionPath: string,
): Promise<HumanFollowupContinuationEvidence | undefined> {
  const root = resolve(nonEmpty(workflowRoot, 'workflowRoot'));
  const rawDecisionPath = nonEmpty(decisionPath, 'decisionPath');
  const decisionRelativePath = isAbsolute(rawDecisionPath)
    ? workflowRelativePath(root, rawDecisionPath, 'decisionPath')
    : workflowRelativePath(root, resolve(root, safeRelativePath(rawDecisionPath, 'decisionPath')), 'decisionPath');
  if (decisionRelativePath === BASE_DECISION_RELATIVE_PATH) return undefined;
  if (decisionRelativePath !== CONTINUATION_DECISION_RELATIVE_PATH) {
    throw new Error('decisionPath must be workflowRoot/decision.json or workflowRoot/review-continuation-000001/decision.json');
  }
  const continuationRelativePaths = [
    CONTINUATION_REVISION_REQUEST_PATH,
    CONTINUATION_SOLUTION_RESULT_PATH,
  ];
  for (const relativePath of continuationRelativePaths) {
    await assertRegularFile(join(root, relativePath), relativePath, root);
  }
  if (await optionalRegularFile(join(root, CONTINUATION_REVIEW_PATH), CONTINUATION_REVIEW_PATH, root)) {
    continuationRelativePaths.push(CONTINUATION_REVIEW_PATH);
  }
  for (const relativePath of [CONTINUATION_DECISION_RELATIVE_PATH, CONTINUATION_ARTIFACT_PATH]) {
    await assertRegularFile(join(root, relativePath), relativePath, root);
    continuationRelativePaths.push(relativePath);
  }
  return {
    effectiveDecisionPath: CONTINUATION_DECISION_RELATIVE_PATH,
    continuationRelativePaths,
  };
}

export async function retainHumanFollowupWorkItem(
  input: RetainHumanFollowupWorkItemInput,
): Promise<RetainedHumanFollowupWorkItem> {
  const repositoryRoot = resolve(nonEmpty(input.repositoryRoot, 'repositoryRoot'));
  const workflowRoot = resolve(nonEmpty(input.workflowRoot, 'workflowRoot'));
  const workflowInstanceRef = safeRelativePath(nonEmpty(input.workflowInstanceRef, 'workflowInstanceRef'), 'workflowInstanceRef');
  const problemPackagePath = resolve(nonEmpty(input.problemPackagePath, 'problemPackagePath'));
  const decisionPath = resolve(nonEmpty(input.decisionPath, 'decisionPath'));
  validatePhase0RunRef(nonEmpty(input.sourceRunRef, 'sourceRunRef'));
  const sourceFingerprintSha256 = assertSha256(input.sourceFingerprintSha256, 'sourceFingerprintSha256');
  if (input.candidateProvenance?.mode !== 'candidate-activation-v1' && input.candidateProvenance !== undefined) {
    throw new Error('candidateProvenance mode must be candidate-activation-v1');
  }

  const realRepositoryRoot = await realpath(repositoryRoot);
  const realWorkflowRoot = await realpath(workflowRoot);
  if (workflowRelativePath(workflowRoot, problemPackagePath, 'problemPackagePath') !== 'problem-package.json') {
    throw new Error('problemPackagePath must be workflowRoot/problem-package.json');
  }
  const baseDecisionPath = join(workflowRoot, 'decision.json');
  const continuation = input.continuation;
  if (!continuation) {
    if (workflowRelativePath(workflowRoot, decisionPath, 'decisionPath') !== 'decision.json') {
      throw new Error('decisionPath must be workflowRoot/decision.json');
    }
  } else {
    const effectiveDecisionRelativePath = safeRelativePath(continuation.effectiveDecisionPath, 'continuation.effectiveDecisionPath');
    if (effectiveDecisionRelativePath === 'decision.json' || !effectiveDecisionRelativePath.startsWith('review-continuation-000001/')) {
      throw new Error('continuation.effectiveDecisionPath must be nested below review-continuation-000001');
    }
    if (workflowRelativePath(workflowRoot, decisionPath, 'decisionPath') !== effectiveDecisionRelativePath) {
      throw new Error('decisionPath must match continuation.effectiveDecisionPath');
    }
    if (continuation.continuationRelativePaths.length === 0) {
      throw new Error('continuation.continuationRelativePaths must not be empty');
    }
    const normalizedContinuationPaths = continuation.continuationRelativePaths.map((path, index) => {
      const normalized = safeRelativePath(path, `continuation.continuationRelativePaths[${index}]`);
      if (!normalized.startsWith('review-continuation-000001/')) {
        throw new Error(`continuation.continuationRelativePaths[${index}] must be nested below review-continuation-000001`);
      }
      return normalized;
    });
    if (new Set(normalizedContinuationPaths).size !== normalizedContinuationPaths.length) {
      throw new Error('continuation.continuationRelativePaths must not contain duplicates');
    }
    if (!normalizedContinuationPaths.includes(effectiveDecisionRelativePath)) {
      throw new Error('continuation.continuationRelativePaths must include effectiveDecisionPath');
    }
  }

  const problemPackage = validateProblemPackage(await readJson(problemPackagePath, 'problem package'));
  const baseDecision = validateSolutionDecision(await readJson(baseDecisionPath, 'base decision'));
  const decision = continuation
    ? validateSolutionDecision(await readJson(decisionPath, 'effective continuation decision'))
    : baseDecision;
  if (problemPackage.source.runRef !== input.sourceRunRef) {
    throw new Error('problem package source runRef does not match sourceRunRef');
  }
  if (continuation && (
    baseDecision.route !== 'DEFER_MORE_WORK_REQUESTED'
    || baseDecision.reasonCode !== 'REVIEW_REQUEST_MORE_WORK'
  )) {
    throw new Error('continuation Human follow-up retention requires a base REQUEST_MORE_WORK decision');
  }
  if (decision.problemId !== problemPackage.problemId) {
    throw new Error('decision problemId does not match problem package problemId');
  }
  if (decision.route !== 'ESCALATE_HUMAN') {
    throw new Error('Human follow-up retention requires decision.route ESCALATE_HUMAN');
  }
  if (decision.reasonCode !== 'EXPLICIT_ESCALATION' && decision.reasonCode !== 'ACCEPTED_OUT_OF_SCOPE') {
    throw new Error(`Human follow-up retention does not accept reasonCode ${decision.reasonCode}`);
  }

  const decisionSha256 = sha256Hex(canonicalJson(decision));
  const identitySha256 = sha256Hex(canonicalJson({ workflowInstanceRef, sourceRunRef: input.sourceRunRef, decisionSha256 }));
  const itemId = `item-${identitySha256}`;
  const itemsRoot = join(repositoryRoot, ITEM_ROOT);
  const finalDirectory = join(itemsRoot, itemId);
  const itemPath = join(finalDirectory, 'item.json');
  const reviewerPath = join(workflowRoot, REVIEWER_PATH);
  const reviewerPresent = await optionalRegularFile(reviewerPath, REVIEWER_PATH, workflowRoot);
  const evidenceSources = buildEvidenceSources(workflowRoot, problemPackage, problemPackagePath, decisionPath, reviewerPresent, continuation, input.candidateProvenance);
  const evidencePaths = evidenceSources.map(source => source.relativePath);
  const workflowRef = isWithin(realRepositoryRoot, realWorkflowRoot)
    ? workflowRelativePath(repositoryRoot, workflowRoot, 'workflowRef')
    : workflowInstanceRef;
  const expected = {
    itemId,
    sourceRunRef: input.sourceRunRef,
    workflowInstanceRef,
    decisionSha256,
    sourceFingerprintSha256,
    productSourceFingerprintSha256: problemPackage.productSourceFingerprintSha256,
    problem: problemPackage.problem,
    reasonCode: decision.reasonCode as HumanFollowupWorkItemV1['trigger']['reasonCode'],
    evidencePaths,
  };

  await mkdir(itemsRoot, { recursive: true });
  await assertNoPreExistingStaging(itemsRoot);
  const existingDirectory = await tryLstat(finalDirectory);
  if (existingDirectory) {
    if (!existingDirectory.isDirectory()) throw new Error(`existing Human follow-up item path is not a directory: ${itemId}`);
    const existingItem = await tryLstat(itemPath);
    if (!existingItem || !existingItem.isFile()) throw new Error(`existing Human follow-up item is missing item.json: ${itemId}`);
    const item = await validateExistingItem(itemPath, expected);
    return { itemPath, item, created: false };
  }
  let stagingDirectory: string | null = null;
  try {
    stagingDirectory = await mkdtemp(join(itemsRoot, `.staging-${itemId}-`));
    const evidence: HumanFollowupEvidenceEntry[] = [];
    for (const source of evidenceSources) {
      evidence.push(await copyAndHashEvidence(source, stagingDirectory, workflowRoot));
    }
    const now = new Date().toISOString();
    const item = validateHumanFollowupWorkItem({
      schemaVersion: 'human-follow-up-work-item-v1',
      itemId,
      identitySha256,
      createdAt: now,
      updatedAt: now,
      status: 'OPEN',
      problem: problemPackage.problem,
      trigger: { route: 'ESCALATE_HUMAN', reasonCode: decision.reasonCode },
      provenance: {
        sourceRunRef: input.sourceRunRef,
        workflowInstanceRef,
        workflowRef,
        decisionSha256,
        sourceFingerprintSha256,
        productSourceFingerprintSha256: problemPackage.productSourceFingerprintSha256,
      },
      evidence,
      reviewHistory: [],
      formalTaskRef: null,
    });
    const stagedItemPath = join(stagingDirectory, 'item.json');
    await writeFile(stagedItemPath, `${canonicalJson(item)}\n`, { flag: 'wx' });
    validateHumanFollowupWorkItem(JSON.parse(await readFile(stagedItemPath, 'utf8')));
    try {
      await rename(stagingDirectory, finalDirectory);
      stagingDirectory = null;
      return { itemPath, item, created: true };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'EEXIST' && code !== 'ENOTEMPTY') throw error;
      const finalStat = await tryLstat(finalDirectory);
      const finalItemStat = await tryLstat(itemPath);
      if (!finalStat?.isDirectory() || !finalItemStat?.isFile()) {
        throw new Error(`concurrent Human follow-up item promotion left an invalid final path: ${itemId}`);
      }
      const existingItem = await validateExistingItem(itemPath, expected);
      return { itemPath, item: existingItem, created: false };
    }
  } finally {
    if (stagingDirectory) await rm(stagingDirectory, { recursive: true, force: true });
  }
}
