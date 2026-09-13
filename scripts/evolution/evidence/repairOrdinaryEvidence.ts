import { readFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path';
import {
  buildMultiRoundSessionSummary,
  parseMultiRoundRunManifest,
  type MultiRoundRunManifest,
} from '../multiRoundRunManifestContract';
import { buildDurableEvidenceIndex } from './durableEvidenceIndex';
import { verifyDurableEvidenceCapsule, type DurableEvidenceCapsulePublishResult } from './durableEvidenceCapsule';
import { retainOrdinaryEvidenceCapsule } from './retainOrdinaryEvidence';

interface CompletedOperatorResult {
  schemaVersion: 'ordinary-evolution-operator-result-v3';
  sessionId: string;
  branch: string;
  headSha: string;
  workingTreeClean: boolean;
  sessionRoot?: string;
  experimentRoot: string;
}

export interface RepairOrdinaryEvidenceResult extends DurableEvidenceCapsulePublishResult {
  indexError: string | null;
}

function assertRecord(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
}

function assertWithin(root: string, candidate: string, label: string): string {
  if (isAbsolute(candidate)) throw new Error(`${label} must be repository-relative`);
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(resolvedRoot, candidate);
  const escaped = relative(resolvedRoot, resolvedCandidate);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`${label} escapes repository root`);
  }
  return resolvedCandidate;
}

async function readOperatorResult(sessionRoot: string): Promise<CompletedOperatorResult> {
  const raw = JSON.parse(await readFile(join(sessionRoot, 'operator-result.json'), 'utf8')) as unknown;
  assertRecord(raw, 'operator-result');
  if (raw.schemaVersion !== 'ordinary-evolution-operator-result-v3') throw new Error('operator-result schemaVersion is invalid');
  for (const field of ['sessionId', 'branch', 'headSha', 'experimentRoot'] as const) {
    if (typeof raw[field] !== 'string' || raw[field].length === 0) throw new Error(`operator-result.${field} is required`);
  }
  if (typeof raw.workingTreeClean !== 'boolean') throw new Error('operator-result.workingTreeClean is required');
  return raw as unknown as CompletedOperatorResult;
}

function sourceRefsFromManifest(manifest: MultiRoundRunManifest): string[] {
  const refs = [manifest.initialSourceRunRef, ...manifest.rounds.map(round => round.sourceRunRef)];
  if (manifest.execution.resultingRunRef !== null) refs.push(manifest.execution.resultingRunRef);
  return [...new Set(refs)];
}

export async function repairOrdinaryEvidence(input: {
  repositoryRoot: string;
  sessionRoot: string;
}): Promise<RepairOrdinaryEvidenceResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const sessionRoot = resolve(input.sessionRoot);
  const sessionEscape = relative(repositoryRoot, sessionRoot);
  if (!sessionEscape || sessionEscape === '..' || sessionEscape.startsWith(`..${sep}`) || isAbsolute(sessionEscape)) {
    throw new Error('sessionRoot escapes repository root');
  }
  const sessionId = basename(sessionRoot);
  const operatorResult = await readOperatorResult(sessionRoot);
  if (operatorResult.sessionId !== sessionId) throw new Error(`operator-result sessionId does not match session root: ${operatorResult.sessionId} != ${sessionId}`);
  const recordedSessionRoot = operatorResult.sessionRoot === undefined
    ? sessionRoot
    : assertWithin(repositoryRoot, operatorResult.sessionRoot, 'operator-result.sessionRoot');
  if (resolve(recordedSessionRoot) !== sessionRoot) throw new Error('operator-result.sessionRoot does not match supplied session root');
  const experimentRoot = assertWithin(repositoryRoot, operatorResult.experimentRoot, 'operator-result.experimentRoot');
  const manifestPath = join(experimentRoot, 'run-manifest.json');
  const manifest = parseMultiRoundRunManifest(JSON.parse(await readFile(manifestPath, 'utf8')));
  if (manifest.multiRoundRunRef !== sessionId) throw new Error(`run manifest session ref does not match session root: ${manifest.multiRoundRunRef}`);
  const summary = buildMultiRoundSessionSummary(manifest);
  const sourceRunRefs = sourceRefsFromManifest(manifest);
  const published = await retainOrdinaryEvidenceCapsule({
    repositoryRoot,
    sessionRoot,
    experimentRoot,
    sessionId,
    sourceRunRef: manifest.initialSourceRunRef,
    sourceRunRefs,
    repositoryIdentity: {
      branch: operatorResult.branch,
      headSha: operatorResult.headSha,
      workingTreeClean: operatorResult.workingTreeClean,
    },
    sessionExecution: summary,
  });
  await verifyDurableEvidenceCapsule(published.capsuleRoot);
  let indexError: string | null = null;
  try {
    await buildDurableEvidenceIndex({ repositoryRoot });
  } catch (error) {
    indexError = error instanceof Error ? error.message : String(error);
  }
  return { ...published, indexError };
}

function parseArgs(args: string[]): { repositoryRoot: string; sessionRoot: string } {
  let repositoryRoot = process.cwd();
  let sessionRoot: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') sessionRoot = args[++index] ?? (() => { throw new Error('--root requires a value'); })();
    else if (arg === '--repository-root') repositoryRoot = args[++index] ?? (() => { throw new Error('--repository-root requires a value'); })();
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!sessionRoot) throw new Error('--root is required');
  return { repositoryRoot: resolve(repositoryRoot), sessionRoot: resolve(repositoryRoot, sessionRoot) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  repairOrdinaryEvidence(parseArgs(process.argv.slice(2)))
    .then(result => {
      console.log(`Durable Evidence Capsule: ${result.capsuleRoot}`);
      if (result.indexError !== null) console.error(`Durable Evidence Index: ${result.indexError}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
