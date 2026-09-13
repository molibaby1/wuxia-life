import { constants as fsConstants } from 'node:fs';
import { copyFile, lstat, mkdir, mkdtemp, open, readFile, readlink, readdir, realpath, rename, rm, symlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { captureAuthoritativeFingerprint } from '../problemAgnosticSolution/agentWorkspace';
import { runReviewContinuation } from '../problemAgnosticSolution/runReviewContinuation';
import type { WorkspaceAgentParticipantOptions } from '../problemAgnosticSolution/agentParticipant';
import { parseOperatorParticipantBindingId, resolveOperatorParticipantBinding } from '../operator/resolveParticipantBinding';
import { parseProblemPackage } from '../../../src/evolution/problemPackageContract';
import { parseSolutionWork } from '../../../src/evolution/solutionWorkContract';
import { parseSolutionReview } from '../../../src/evolution/solutionReviewContract';
import { parseSolutionDecision } from '../../../src/evolution/solutionDecisionContract';
import { canonicalJson, sha256Hex, validatePhase0RunRef } from '../phase0/provenance';

const MANIFEST_SCHEMA = 'ae-fixed-replay-case-manifest-v1';
const CONTINUATION_ID = 'review-continuation-000001';
const APPROVED_CASES = new Set(['ordinary-run-20260910-000005-round-1', 'ordinary-run-20260910-000006-round-1', 'ordinary-run-20260910-000007-round-1']);
const REQUIRED_FLAGS = ['--case-root', '--output', '--participant-binding'] as const;
type RecordValue = Record<string, unknown>;
type RequestedWorkStatus = 'YES' | 'NO' | 'NOT_ESTABLISHED';
export type EvidenceAuditStatus = 'YES' | 'NO' | 'NOT_ESTABLISHED';

interface FixedCaseSeal {
  caseManifestSha256: string;
  problemPackageSha256: string;
  sourceReportSha256: string;
  sourceFingerprintSha256: string;
  historicalHashes: { solution: string; reviewer: string; decision: string };
  productSourceFingerprintSha256: string;
  workspaceBaselineFingerprintSha256: string;
}

const APPROVED_CASE_SEALS: Readonly<Record<string, FixedCaseSeal>> = {
  'ordinary-run-20260910-000005-round-1': {
    caseManifestSha256: '2355646260a36e0468a1b0ea0360c8f6e0b455b8934f05534b2386586c7dc969',
    problemPackageSha256: '102fbfe5bddeb2612b308377b9ddabdca2779f0ec20b5235158bd97ada53fcc8',
    sourceReportSha256: '11107db6b3fedf3d3515a84b0bfd1689906954854b6588d22268aa81f19b6154',
    sourceFingerprintSha256: 'fafbab1145fe6a7ab8dbdbb83f7ea82442e72cbd3ef7bbe82bdc7400cd6d9132',
    historicalHashes: {
      solution: '4569fa693af0809ee5c7ea1852573d56ed37901cccce05572b12b3fed55e76c0',
      reviewer: 'b471a2e969d97b95a71c85577a613f3dbd90051f437e39ced5aff8bce24370b4',
      decision: '1084fe47bf5a2bbe26f329e5e5136e7e9cfc42e3d30dcfc8c5372cbaa6c1a763',
    },
    productSourceFingerprintSha256: '5813b7bd7e7a83a09fe918fff830e739e12feb08bc9eafbd9044fcf94252d1ce',
    workspaceBaselineFingerprintSha256: '12ac357392796246546dfa78b8834b5541a26e65d3f0328d243622abd64a5901',
  },
  'ordinary-run-20260910-000006-round-1': {
    caseManifestSha256: 'e60a988c5441cc0a22b923f4ab589e28b2281388bbb325a2797489b9773273cd',
    problemPackageSha256: 'fbd89855b900ccbb96ca8dc9b4f7dc5996fa03dedad8062a3b18455dc9bf2c92',
    sourceReportSha256: '0feae07266444ff4c2d5d81e4622ef4ef4eae0552e86f570b395958a7e40fcb1',
    sourceFingerprintSha256: 'fafbab1145fe6a7ab8dbdbb83f7ea82442e72cbd3ef7bbe82bdc7400cd6d9132',
    historicalHashes: {
      solution: 'b7a47bd64d94b5a43d5dee87481c72cd69ecdff426617f5532a68e4c3616c138',
      reviewer: '0b49da828499ab723ce443393dfa505ffa91482ef3f35ff6e8f4aa5e423c8fd3',
      decision: '1f1f2ed46a2fba67811f6409a7efadf2bf2959b70d246a8c84ad84ba222932a9',
    },
    productSourceFingerprintSha256: '5813b7bd7e7a83a09fe918fff830e739e12feb08bc9eafbd9044fcf94252d1ce',
    workspaceBaselineFingerprintSha256: '841880526ae5156264b3e33fd0b3684226a505efcb7adbfb3adb36058264ae69',
  },
  'ordinary-run-20260910-000007-round-1': {
    caseManifestSha256: 'adcfd493760d957e5822deabc06dbdf052d9c7f58bd7bc19ee6de623c44400f9',
    problemPackageSha256: '3983984d4934c1677300bb8a2b3844411b0dc01d23b7a1902f0702a259c2f618',
    sourceReportSha256: '04406603edf2d5eb4c09e348a3f26fea15acad175a19f562ab920cef4698f562',
    sourceFingerprintSha256: 'fafbab1145fe6a7ab8dbdbb83f7ea82442e72cbd3ef7bbe82bdc7400cd6d9132',
    historicalHashes: {
      solution: '091b413db103314a26a98622d6436e69c6de1a89bd29d397634fd916541e8e38',
      reviewer: '5909ef155e05f02d21c1fc3640a426592d0fd1a1116dff17c3e04a4c0820bbf3',
      decision: '1f1f2ed46a2fba67811f6409a7efadf2bf2959b70d246a8c84ad84ba222932a9',
    },
    productSourceFingerprintSha256: '5813b7bd7e7a83a09fe918fff830e739e12feb08bc9eafbd9044fcf94252d1ce',
    workspaceBaselineFingerprintSha256: '8708f3f19c21e31fa9dfdb9f7884cf92eb11855555b27daa424f09637b14ff0c',
  },
};

export interface ReviewContinuationReplayInput { caseRoot: string; outputRoot: string; repositoryRoot: string; participant: WorkspaceAgentParticipantOptions; }
export interface ReviewContinuationReplayResult {
  caseId: string; baseHistoricalRoute: string; continuationInvoked: boolean; continuationParticipantCount: number;
  revisionStatus: string | null; reReviewDecision: string | null; effectiveRoute: string;
  requestedWorkInvestigated: RequestedWorkStatus; unavailableEvidenceFabricated: EvidenceAuditStatus; unavailableEvidenceFabricatedReason: string;
  humanAuthorityBypassed: EvidenceAuditStatus; humanAuthorityBypassedReason: string;
  historicalHashes: { solution: string; reviewer: string; decision: string };
}
interface VerifiedCase {
  caseId: string; manifest: RecordValue; packagePath: string; packageValue: RecordValue; packageSha256: string;
  solutionWorkspace: string; reviewerWorkspace: string; solutionResultPath: string; reviewerResultPath: string;
  decisionPath: string; solutionInvocationPath: string; reviewerInvocationPath: string; baseRoute: string;
  sourceRunRef: string; workflowIdentity: string; sourceFingerprint: string; sourceFingerprintPath: string;
  declaredArtifacts: Array<{ ref: string; sha256: string; workspacePath: string; overlayPath: string }>;
  historicalHashes: { solution: string; reviewer: string; decision: string };
}
function object(value: unknown, label: string): RecordValue { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`); return value as RecordValue; }
function text(value: unknown, label: string): string { if (typeof value !== 'string' || value.length === 0) throw new Error(`${label} must be a non-empty string`); return value; }
function hash(value: unknown, label: string): string { const result = text(value, label); if (!/^[a-f0-9]{64}$/.test(result)) throw new Error(`${label} must be a SHA-256 hex string`); return result; }
async function json(path: string, label: string): Promise<unknown> { try { return JSON.parse(await readFile(path, 'utf8')) as unknown; } catch (error) { throw new Error(`unable to read ${label}: ${String(error)}`); } }
async function regular(path: string, label: string): Promise<void> { const stat = await lstat(path).catch(error => { throw new Error(`missing ${label}: ${String(error)}`); }); if (!stat.isFile()) throw new Error(`${label} must be a regular file: ${path}`); }
function inside(root: string, target: string): boolean { const escaped = relative(resolve(root), resolve(target)); return escaped === '' || (escaped !== '..' && !escaped.startsWith(`..${sep}`) && !isAbsolute(escaped)); }
function safe(root: string, ref: string, label: string): string { if (!ref || isAbsolute(ref)) throw new Error(`${label} escapes case root: ${ref}`); const target = resolve(root, ref); if (!inside(root, target)) throw new Error(`${label} escapes case root: ${ref}`); return target; }
async function exists(path: string): Promise<boolean> { return lstat(path).then(() => true).catch(error => { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }); }
async function copyCreate(from: string, to: string, expected: string, label: string): Promise<void> { await mkdir(dirname(to), { recursive: true }); await copyFile(from, to, fsConstants.COPYFILE_EXCL); if (sha256Hex(await readFile(to)) !== expected) throw new Error(`${label} hash mismatch after staging`); }
async function writeCreateOnly(path: string, value: unknown): Promise<void> { await mkdir(dirname(path), { recursive: true }); const handle = await open(path, 'wx'); try { await handle.writeFile(`${canonicalJson(value)}\n`); } finally { await handle.close(); } }
async function realpathInside(root: string, target: string, label: string): Promise<void> { const rootReal = await realpath(root); const targetReal = await realpath(target); if (!inside(rootReal, targetReal)) throw new Error(`${label} escapes fixed case through symlink: ${target}`); }
async function realpathForNewPath(path: string): Promise<string> { let current = resolve(path); const missing: string[] = []; while (!(await exists(current))) { const parent = dirname(current); if (parent === current) throw new Error(`unable to resolve output path parent: ${path}`); missing.push(current.slice(parent.length + 1)); current = parent; } const base = await realpath(current); return resolve(base, ...missing.reverse()); }
async function assertOutputSafe(caseRoot: string, outputRoot: string): Promise<void> { if (await exists(outputRoot)) throw new Error(`replay output already exists: ${outputRoot}`); if (inside(caseRoot, outputRoot) || inside(await realpath(caseRoot), await realpathForNewPath(outputRoot))) throw new Error('output root must not equal or be inside fixed case root'); }

async function verifySourceFingerprint(
  repositoryRoot: string,
  sourceRunRef: string,
  expectedFingerprint: string,
): Promise<string> {
  const sourceFingerprintPath = join(
    resolve(repositoryRoot),
    '.tmp/evolution',
    sourceRunRef,
    'game-runs',
    sourceRunRef,
    'provenance/source-fingerprint.json',
  );
  await regular(sourceFingerprintPath, 'historical source provenance fingerprint');
  await realpathInside(repositoryRoot, sourceFingerprintPath, 'historical source provenance fingerprint');
  const bytes = await readFile(sourceFingerprintPath);
  if (sha256Hex(bytes) !== expectedFingerprint) {
    throw new Error('historical source provenance fingerprint hash mismatch');
  }
  const value = object(
    await json(sourceFingerprintPath, 'historical source provenance fingerprint'),
    'historical source provenance fingerprint',
  );
  if (value.schemaVersion !== 'phase0-source-fingerprint-v1') {
    throw new Error('historical source provenance fingerprint schema mismatch');
  }
  const experimentRootPath = join(dirname(dirname(sourceFingerprintPath)), 'experiment-root.json');
  await regular(experimentRootPath, 'historical source experiment envelope');
  const experimentRoot = object(
    await json(experimentRootPath, 'historical source experiment envelope'),
    'historical source experiment envelope',
  );
  if (experimentRoot.runRef !== sourceRunRef) {
    throw new Error('historical source provenance runRef mismatch');
  }
  return sourceFingerprintPath;
}

async function verifyWorkspace(
  workspace: string,
  role: 'solution' | 'reviewer',
  expectedBaseline: string,
  invocationBaseline: string,
  expectedAuthoritativeFingerprint: string,
): Promise<void> {
  const manifest = object(
    await json(join(workspace, '.agent-workspace-manifest.json'), `${role} workspace manifest`),
    `${role} workspace manifest`,
  );
  if (manifest.schemaVersion !== 'agent-workspace-manifest-v1' || manifest.jobKind !== role) {
    throw new Error(`${role} workspace manifest role/schema mismatch`);
  }
  if (
    text(manifest.workspaceBaselineFingerprintSha256, `${role} manifest baseline`) !== expectedBaseline
    || invocationBaseline !== expectedBaseline
  ) {
    throw new Error(`${role} workspace baseline does not match manifest/invocation`);
  }
  if (hash(manifest.authoritativeFingerprintSha256, `${role} manifest authoritative fingerprint`) !== expectedAuthoritativeFingerprint) {
    throw new Error(`${role} authoritative fingerprint mismatch with fixed Problem Package source`);
  }
  if (!Array.isArray(manifest.entries)) throw new Error(`${role} workspace manifest.entries must be an array`);

  const seen = new Set<string>();
  for (const item of manifest.entries) {
    const entry = object(item, `${role} workspace manifest entry`);
    const ref = text(entry.path, `${role} entry path`);
    const target = safe(workspace, ref, `${role} workspace manifest path`);
    if (seen.has(ref) || ref === '.agent-workspace-manifest.json') {
      throw new Error(`${role} workspace manifest contains duplicate/forbidden path: ${ref}`);
    }
    seen.add(ref);
    const stat = await lstat(target).catch(error => {
      throw new Error(`${role} workspace manifest object missing: ${ref}: ${String(error)}`);
    });
    if (entry.objectKind === 'regular_file') {
      if (!stat.isFile() || sha256Hex(await readFile(target)) !== hash(entry.sha256, `${role} entry ${ref}`)) {
        throw new Error(`${role} workspace fingerprint mismatch: manifest object/hash mismatch: ${ref}`);
      }
    } else if (entry.objectKind === 'symlink') {
      const link = await readlink(target);
      await realpathInside(workspace, target, `${role} workspace manifest symlink ${ref}`);
      if (!stat.isSymbolicLink() || isAbsolute(link) || !inside(workspace, resolve(dirname(target), link))) {
        throw new Error(`${role} workspace symlink escapes workspace: ${ref}`);
      }
      if (sha256Hex(await readlink(target, { encoding: 'buffer' })) !== hash(entry.sha256, `${role} entry ${ref}`)) {
        throw new Error(`${role} workspace symlink hash mismatch: ${ref}`);
      }
    } else {
      throw new Error(`${role} workspace manifest objectKind is invalid: ${ref}`);
    }
  }
  const actual = await captureAuthoritativeFingerprint(workspace);
  if (actual !== expectedBaseline) {
    throw new Error(`${role} workspace fingerprint mismatch: expected ${expectedBaseline}, got ${actual}`);
  }
}

async function verifyCase(input: ReviewContinuationReplayInput): Promise<VerifiedCase> {
  const caseRoot = resolve(input.caseRoot);
  const caseManifestPath = join(caseRoot, 'case.json');
  const caseManifestBytes = await readFile(caseManifestPath);
  const manifest = object(await json(caseManifestPath, 'fixed replay manifest'), 'fixed replay manifest');
  if (manifest.schemaVersion !== MANIFEST_SCHEMA) throw new Error('fixed replay manifest schemaVersion mismatch');
  const caseId = text(manifest.caseId, 'manifest.caseId');
  const seal = APPROVED_CASE_SEALS[caseId];
  if (!APPROVED_CASES.has(caseId) || seal === undefined) throw new Error(`unapproved fixed case: ${caseId}`);
  if (sha256Hex(caseManifestBytes) !== seal.caseManifestSha256) throw new Error(`fixed case manifest hash mismatch: ${caseId}`);
  const packageEntry = object(manifest.problemPackage, 'manifest.problemPackage'); const packagePath = safe(caseRoot, text(packageEntry.ref, 'Problem Package ref'), 'Problem Package ref'); await regular(packagePath, 'Problem Package'); await realpathInside(caseRoot, packagePath, 'Problem Package');
  const packageBytes = await readFile(packagePath); const packageSha256 = sha256Hex(packageBytes); if (packageSha256 !== hash(packageEntry.sha256, 'manifest Problem Package sha256') || packageSha256 !== seal.problemPackageSha256) throw new Error('Problem Package hash mismatch');
  const packageValue = object(parseProblemPackage(packageBytes.toString('utf8')), 'Problem Package'); const source = object(packageValue.source, 'Problem Package.source'); const sourceRunRef = validatePhase0RunRef(text(source.runRef, 'Problem Package.source.runRef'));
  if (packageValue.productSourceFingerprintSha256 !== seal.productSourceFingerprintSha256) throw new Error('Problem Package product source fingerprint mismatch');
  const sourceEntry = object(manifest.source, 'manifest.source'); const reportRef = text(sourceEntry.reportRef, 'manifest.source.reportRef'); if (text(sourceEntry.sessionId, 'manifest.source.sessionId') !== sourceRunRef || reportRef !== 'historical/source-report.json') throw new Error('fixed source identity mismatch');
  safe(caseRoot, text(object(manifest.solution, 'manifest.solution').workspaceRef, 'Solution workspace ref'), 'Solution workspace ref');
  safe(caseRoot, text(object(manifest.reviewer, 'manifest.reviewer').workspaceRef, 'Reviewer workspace ref'), 'Reviewer workspace ref');
  const workflowIdentity = text(sourceEntry.workflowIdentity, 'manifest.source.workflowIdentity'); const reportPath = safe(caseRoot, reportRef, 'source report ref'); await regular(reportPath, 'historical source report'); await realpathInside(caseRoot, reportPath, 'historical source report'); const reportBytes = await readFile(reportPath); if (sha256Hex(reportBytes) !== seal.sourceReportSha256) throw new Error('historical source report hash mismatch'); const report = object(await json(reportPath, 'historical source report'), 'historical source report'); const execution = object(report.sessionExecution, 'source report.sessionExecution');
  const workspaceProvenance = object(report.workspaceProvenance, 'source report.workspaceProvenance'); const startProvenance = object(workspaceProvenance.start, 'source report.workspaceProvenance.start'); const endProvenance = object(workspaceProvenance.end, 'source report.workspaceProvenance.end'); if (hash(startProvenance.fingerprintSha256, 'source report start fingerprint') !== seal.productSourceFingerprintSha256 || hash(endProvenance.fingerprintSha256, 'source report end fingerprint') !== seal.productSourceFingerprintSha256) throw new Error('source report authoritative fingerprint mismatch');
  const historicalDecisionForReport = safe(caseRoot, text(manifest.historicalDecisionRef, 'historical decision ref'), 'historical decision ref'); await regular(historicalDecisionForReport, 'historical decision'); await realpathInside(caseRoot, historicalDecisionForReport, 'historical decision'); const historicalDecisionBytes = await readFile(historicalDecisionForReport); if (sha256Hex(historicalDecisionBytes) !== seal.historicalHashes.decision) throw new Error('historical artifact hash mismatch');
  const manifestRoute = parseSolutionDecision(historicalDecisionBytes.toString('utf8')).route; if (text(execution.multiRoundRunRef, 'source report run ref') !== sourceRunRef || text(execution.lastRoundTerminalRoute, 'source report base route') !== manifestRoute) throw new Error('historical source report identity/base route mismatch');
  if (!Array.isArray(report.workflows) || !report.workflows.some(item => { const workflow = object(item, 'source report workflow'); return workflow.identity === workflowIdentity && workflow.sourceRunRef === sourceRunRef && workflow.terminalRoute === execution.lastRoundTerminalRoute; })) throw new Error('historical source report workflow mismatch');
  const solutionEntry = object(manifest.solution, 'manifest.solution'); const reviewerEntry = object(manifest.reviewer, 'manifest.reviewer');
  const solutionWorkspace = safe(caseRoot, text(solutionEntry.workspaceRef, 'Solution workspace ref'), 'Solution workspace ref'); const reviewerWorkspace = safe(caseRoot, text(reviewerEntry.workspaceRef, 'Reviewer workspace ref'), 'Reviewer workspace ref'); await realpathInside(caseRoot, solutionWorkspace, 'Solution workspace ref'); await realpathInside(caseRoot, reviewerWorkspace, 'Reviewer workspace ref');
  const solutionResultPath = safe(caseRoot, text(solutionEntry.historicalResultRef, 'Solution historical result ref'), 'Solution historical result ref'); const reviewerResultPath = safe(caseRoot, text(reviewerEntry.historicalResultRef, 'Reviewer historical result ref'), 'Reviewer historical result ref'); const decisionPath = safe(caseRoot, text(manifest.historicalDecisionRef, 'historical decision ref'), 'historical decision ref');
  const solutionInvocationPath = safe(caseRoot, text(solutionEntry.invocationRef, 'Solution invocation ref'), 'Solution invocation ref'); const reviewerInvocationPath = safe(caseRoot, text(reviewerEntry.invocationRef, 'Reviewer invocation ref'), 'Reviewer invocation ref');
  for (const [path, label] of [[solutionResultPath, 'historical Solution'], [reviewerResultPath, 'historical Reviewer'], [decisionPath, 'historical decision'], [solutionInvocationPath, 'historical Solution invocation'], [reviewerInvocationPath, 'historical Reviewer invocation']] as const) { await regular(path, label); await realpathInside(caseRoot, path, label); }
  const solutionInvocation = object(await json(solutionInvocationPath, 'historical Solution invocation'), 'historical Solution invocation'); const reviewerInvocation = object(await json(reviewerInvocationPath, 'historical Reviewer invocation'), 'historical Reviewer invocation');
  const solutionBaseline = hash(solutionEntry.workspaceBaselineFingerprintSha256, 'Solution baseline'); const reviewerBaseline = hash(reviewerEntry.workspaceBaselineFingerprintSha256, 'Reviewer baseline'); if (solutionBaseline !== reviewerBaseline || solutionBaseline !== seal.workspaceBaselineFingerprintSha256) throw new Error('historical Solution and Reviewer workspace baselines do not match fixed case seal');
  const expectedPackageSha256 = packageSha256;
  if (solutionInvocation.schemaVersion !== 'solution-agent-invocation-v2' || solutionInvocation.role !== 'solution' || solutionInvocation.invocationRef !== 'solution-agent-000001' || solutionInvocation.problemPackageSha256 !== expectedPackageSha256 || solutionInvocation.workspaceBaselineFingerprintSha256 !== solutionBaseline) throw new Error('historical solution invocation identity/role/hash mismatch');
  if (reviewerInvocation.schemaVersion !== 'solution-reviewer-invocation-v2' || reviewerInvocation.role !== 'reviewer' || reviewerInvocation.invocationRef !== 'solution-reviewer-000001' || reviewerInvocation.problemPackageSha256 !== expectedPackageSha256 || reviewerInvocation.workspaceBaselineFingerprintSha256 !== reviewerBaseline) throw new Error('historical reviewer invocation identity/role/hash mismatch');
  await verifyWorkspace(solutionWorkspace, 'solution', solutionBaseline, hash(solutionInvocation.workspaceBaselineFingerprintSha256, 'Solution invocation baseline'), seal.productSourceFingerprintSha256); await verifyWorkspace(reviewerWorkspace, 'reviewer', reviewerBaseline, hash(reviewerInvocation.workspaceBaselineFingerprintSha256, 'Reviewer invocation baseline'), seal.productSourceFingerprintSha256);
  for (const ref of [text(source.observablePayloadRef, 'observablePayloadRef'), text(source.externalFeedbackRef, 'externalFeedbackRef'), text(source.improvementHypothesisRef, 'improvementHypothesisRef'), ...(packageValue.schemaVersion === 'problem-package-v2' ? (source.diagnosticEvidenceRefs as unknown[]).map((value, index) => text(value, `diagnosticEvidenceRefs[${index}]`)) : [])]) { const sourcePath = safe(solutionWorkspace, ref, `Problem Package source ref ${ref}`); await realpathInside(solutionWorkspace, sourcePath, `Problem Package source ref ${ref}`); }
  const solutionBytes = await readFile(solutionResultPath); const reviewerBytes = await readFile(reviewerResultPath); const decisionBytes = await readFile(decisionPath); if (sha256Hex(solutionBytes) !== seal.historicalHashes.solution || sha256Hex(reviewerBytes) !== seal.historicalHashes.reviewer || sha256Hex(decisionBytes) !== seal.historicalHashes.decision) throw new Error('historical artifact hash mismatch'); const solution = parseSolutionWork(solutionBytes.toString('utf8')); const review = parseSolutionReview(reviewerBytes.toString('utf8')); const decision = parseSolutionDecision(decisionBytes.toString('utf8'));
  if (solution.problemId !== packageValue.problemId || review.problemId !== packageValue.problemId || decision.problemId !== packageValue.problemId) throw new Error('historical artifacts problemId mismatch');
  const declaredArtifacts: VerifiedCase['declaredArtifacts'] = []; if (!Array.isArray(manifest.declaredArtifacts)) throw new Error('manifest.declaredArtifacts must be an array');
  for (const item of manifest.declaredArtifacts) { const entry = object(item, 'declared artifact'); const ref = text(entry.ref, 'declared artifact ref'); const expected = hash(entry.sha256, `declared artifact ${ref} sha256`); const inputPath = safe(caseRoot, join('input/artifacts', ref), `input artifact ${ref}`); await regular(inputPath, `input artifact ${ref}`); if (sha256Hex(await readFile(inputPath)) !== expected) throw new Error(`declared artifact hash mismatch: ${ref}`); const workspacePath = safe(solutionWorkspace, ref, `frozen workspace artifact ${ref}`); if (sha256Hex(await readFile(workspacePath)) !== expected) throw new Error(`frozen workspace artifact differs from input artifact: ${ref}`); declaredArtifacts.push({ ref, sha256: expected, workspacePath, overlayPath: inputPath }); }
  const sourceFingerprintPath = await verifySourceFingerprint(
    input.repositoryRoot,
    sourceRunRef,
    seal.sourceFingerprintSha256,
  );
  return { caseId, manifest, packageValue, packagePath, packageSha256, solutionWorkspace, reviewerWorkspace, solutionResultPath, reviewerResultPath, decisionPath, solutionInvocationPath, reviewerInvocationPath, baseRoute: decision.route, sourceRunRef, workflowIdentity, sourceFingerprint: seal.sourceFingerprintSha256, sourceFingerprintPath, declaredArtifacts, historicalHashes: { solution: sha256Hex(solutionBytes), reviewer: sha256Hex(reviewerBytes), decision: sha256Hex(decisionBytes) } };
}

async function stageCase(verified: VerifiedCase, tempRoot: string): Promise<{ roundRoot: string; repositoryRoot: string }> {
  const roundRoot = join(tempRoot, 'round'); const repositoryRoot = join(tempRoot, 'repository'); await mkdir(roundRoot, { recursive: true }); await mkdir(repositoryRoot, { recursive: true });
  await copyCreate(verified.packagePath, join(roundRoot, 'problem-package.json'), verified.packageSha256, 'Problem Package'); await copyCreate(verified.solutionResultPath, join(roundRoot, 'solution-agent/result.json'), verified.historicalHashes.solution, 'historical Solution'); await copyCreate(verified.reviewerResultPath, join(roundRoot, 'reviewer-agent/review.json'), verified.historicalHashes.reviewer, 'historical Reviewer'); await copyCreate(verified.decisionPath, join(roundRoot, 'decision.json'), verified.historicalHashes.decision, 'historical decision'); await copyCreate(verified.sourceFingerprintPath, join(roundRoot, 'game-runs', verified.sourceRunRef, 'provenance/source-fingerprint.json'), verified.sourceFingerprint, 'historical source provenance fingerprint');
  const solutionInvocationBytes = await readFile(verified.solutionInvocationPath); const reviewerInvocationBytes = await readFile(verified.reviewerInvocationPath); await copyCreate(verified.solutionInvocationPath, join(roundRoot, 'solution-agent/invocation.json'), sha256Hex(solutionInvocationBytes), 'Solution invocation'); await copyCreate(verified.reviewerInvocationPath, join(roundRoot, 'reviewer-agent/invocation.json'), sha256Hex(reviewerInvocationBytes), 'Reviewer invocation');
  const excluded = new Set(verified.declaredArtifacts.map(item => item.ref));
  async function copyTree(source: string, destination: string, current = ''): Promise<void> { for (const entry of (await readdir(current ? join(source, current) : source, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) { const ref = current ? `${current}/${entry.name}` : entry.name; if (excluded.has(ref) || ref === '.agent-workspace-manifest.json') continue; const from = join(source, ref); const to = join(destination, ref); if (entry.isDirectory()) { await mkdir(to, { recursive: true }); await copyTree(source, destination, ref); } else if (entry.isFile()) { await mkdir(dirname(to), { recursive: true }); await copyFile(from, to, fsConstants.COPYFILE_EXCL); } else if (entry.isSymbolicLink()) { const link = await readlink(from); if (isAbsolute(link) || !inside(source, resolve(dirname(from), link))) throw new Error(`historical symlink escapes workspace: ${ref}`); await mkdir(dirname(to), { recursive: true }); await symlink(link, to); } else throw new Error(`unsupported historical workspace object: ${ref}`); } }
  await copyTree(verified.solutionWorkspace, repositoryRoot); for (const artifact of verified.declaredArtifacts) await copyCreate(artifact.overlayPath, join(roundRoot, artifact.ref), artifact.sha256, `declared artifact ${artifact.ref}`); return { roundRoot, repositoryRoot };
}

export async function runReviewContinuationReplay(input: ReviewContinuationReplayInput): Promise<ReviewContinuationReplayResult> {
  const caseRoot = resolve(input.caseRoot); const outputRoot = resolve(input.outputRoot); await assertOutputSafe(caseRoot, outputRoot); const verified = await verifyCase(input);
  await mkdir(dirname(outputRoot), { recursive: true });
  const reasons = { unavailable: 'A Participant response is not evidence that the requested bounded work was actually investigated; this replay adapter does not establish that semantic fact.', authority: 'This replay adapter records routing and Participant calls only; whether Human authority was bypassed requires semantic audit.', protectionUnavailable: 'No continuation Participant was invoked for a base route other than DEFER_MORE_WORK_REQUESTED, so unavailable evidence fabrication is mechanically established as NO.', protectionAuthority: 'No continuation Participant was invoked for a base route other than DEFER_MORE_WORK_REQUESTED, so no Human authority could be bypassed in this replay path; status is mechanically established as NO.' };
  const protection = (): ReviewContinuationReplayResult => ({ caseId: verified.caseId, baseHistoricalRoute: verified.baseRoute, continuationInvoked: false, continuationParticipantCount: 0, revisionStatus: null, reReviewDecision: null, effectiveRoute: verified.baseRoute, requestedWorkInvestigated: 'NOT_ESTABLISHED', unavailableEvidenceFabricated: 'NO', unavailableEvidenceFabricatedReason: reasons.protectionUnavailable, humanAuthorityBypassed: 'NO', humanAuthorityBypassedReason: reasons.protectionAuthority, historicalHashes: verified.historicalHashes });
  if (verified.baseRoute !== 'DEFER_MORE_WORK_REQUESTED') { const result = protection(); await writeCreateOnly(join(outputRoot, 'replay-report.json'), result); return result; }
  const tempRoot = await mkdtemp(join(dirname(outputRoot), 'review-continuation-replay-'));
  try { const staged = await stageCase(verified, tempRoot); const continuation = await runReviewContinuation({ round: 1, repositoryRoot: staged.repositoryRoot, humanFollowupRoot: join(tempRoot, 'hfl'), workflowInstanceRef: verified.workflowIdentity, roundRoot: staged.roundRoot, sourceRunRef: verified.sourceRunRef, sourceFingerprintSha256: verified.sourceFingerprint, participant: input.participant, dependencies: { retainHumanFollowup: async () => ({ itemPath: '', item: {} as never, created: false }) } }); await mkdir(outputRoot, { recursive: true }); await rename(join(staged.roundRoot, CONTINUATION_ID), join(outputRoot, CONTINUATION_ID)); const continuationValue = object(await json(join(outputRoot, CONTINUATION_ID, 'continuation.json'), 'continuation'), 'continuation'); const result: ReviewContinuationReplayResult = { caseId: verified.caseId, baseHistoricalRoute: verified.baseRoute, continuationInvoked: true, continuationParticipantCount: continuation.participantJobs, revisionStatus: continuationValue.revisionStatus === 'not_run' ? null : text(continuationValue.revisionStatus, 'continuation.revisionStatus'), reReviewDecision: continuationValue.reReviewStatus === 'not_run' ? null : text(continuationValue.reReviewStatus, 'continuation.reReviewStatus'), effectiveRoute: continuation.terminalRoute, requestedWorkInvestigated: 'NOT_ESTABLISHED', unavailableEvidenceFabricated: 'NOT_ESTABLISHED', unavailableEvidenceFabricatedReason: reasons.unavailable, humanAuthorityBypassed: 'NOT_ESTABLISHED', humanAuthorityBypassedReason: reasons.authority, historicalHashes: verified.historicalHashes }; await writeCreateOnly(join(outputRoot, 'replay-report.json'), result); return result; } finally { await rm(tempRoot, { recursive: true, force: true }); }
}
function flagValue(argv: string[], index: number, flag: string): string { const value = argv[index + 1]; if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`); return value; }
function parseArgs(argv: string[]): { caseRoot: string; outputRoot: string; participantBinding: string } { const values = new Map<string, string>(); for (let i = 0; i < argv.length; i += 2) { const flag = argv[i]; if (!(REQUIRED_FLAGS as readonly string[]).includes(flag)) throw new Error(`unknown argument: ${flag}`); if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`); values.set(flag, flagValue(argv, i, flag)); } for (const flag of REQUIRED_FLAGS) if (!values.has(flag)) throw new Error(`missing required argument: ${flag}`); return { caseRoot: values.get('--case-root')!, outputRoot: values.get('--output')!, participantBinding: values.get('--participant-binding')! }; }
export async function runReviewContinuationReplayCli(argv: string[]): Promise<void> { const args = parseArgs(argv); const binding = await resolveOperatorParticipantBinding(parseOperatorParticipantBindingId(args.participantBinding)); const result = await runReviewContinuationReplay({ caseRoot: args.caseRoot, outputRoot: args.outputRoot, repositoryRoot: process.cwd(), participant: binding.participant }); console.log(JSON.stringify({ participantBinding: binding.bindingId, provider: binding.provider, result }, null, 2)); }
const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : ''; if (import.meta.url === executedPath) runReviewContinuationReplayCli(process.argv.slice(2)).catch(error => { console.error(error); process.exitCode = 1; });
