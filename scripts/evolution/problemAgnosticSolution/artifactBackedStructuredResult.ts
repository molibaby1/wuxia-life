import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { open, lstat, mkdir, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES,
  ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND,
  ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH,
  type ArtifactBackedStructuredFinalResultReceiptV1,
} from '../../../src/evolution/artifactBackedStructuredFinalResultContract';
import { validateStructuredTerminalEnvelope } from '../../../src/evolution/structuredTerminalEnvelope';

const RAW_ARTIFACT_EVIDENCE_NAME = 'structured-result-artifact.raw.json';
const PREFLIGHT_SCRIPT_RELATIVE_PATH = 'scripts/evolution/problemAgnosticSolution/preflightSolutionWorkArtifact.ts';

export interface ConsumedArtifactBackedStructuredResult {
  rawBytes: Buffer;
  rawText: string;
  bytes: number;
  sha256: string;
  parsedObject: Record<string, unknown>;
}

function isInside(root: string, target: string): boolean {
  const pathFromRoot = relative(root, target);
  return pathFromRoot === '' || (
    pathFromRoot !== '..'
    && !pathFromRoot.startsWith(`..${sep}`)
    && !isAbsolute(pathFromRoot)
  );
}

async function resolveWorkspaceRoot(workspaceRoot: string): Promise<string> {
  let root: string;
  try {
    root = await realpath(workspaceRoot);
  } catch (error) {
    throw new Error(`unable to resolve disposable workspace ${workspaceRoot}: ${String(error)}`);
  }
  const rootStat = await lstat(root);
  if (!rootStat.isDirectory()) throw new Error(`disposable workspace must be a directory: ${workspaceRoot}`);
  return root;
}

function resultPaths(workspaceRoot: string): { parentPath: string; resultPath: string } {
  const parentPath = resolve(workspaceRoot, dirname(ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH));
  const resultPath = resolve(workspaceRoot, ARTIFACT_BACKED_STRUCTURED_RESULT_RELATIVE_PATH);
  if (!isInside(workspaceRoot, parentPath) || !isInside(workspaceRoot, resultPath)) {
    throw new Error('Host-fixed structured result path escapes the disposable workspace');
  }
  return { parentPath, resultPath };
}

async function requireReservedParent(input: {
  workspaceRoot: string;
  parentPath: string;
  createIfMissing: boolean;
}): Promise<void> {
  let parentStat;
  try {
    parentStat = await lstat(input.parentPath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' || !input.createIfMissing) {
      if (code === 'ENOENT') throw new Error(`reserved result directory is missing: ${input.parentPath}`);
      throw new Error(`unable to inspect reserved result directory ${input.parentPath}: ${String(error)}`);
    }
    try {
      await mkdir(input.parentPath);
    } catch (mkdirError) {
      if ((mkdirError as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw new Error(`unable to prepare reserved result directory ${input.parentPath}: ${String(mkdirError)}`);
      }
    }
    try {
      parentStat = await lstat(input.parentPath);
    } catch (inspectError) {
      throw new Error(`unable to inspect reserved result directory ${input.parentPath}: ${String(inspectError)}`);
    }
  }

  if (parentStat.isSymbolicLink()) throw new Error('reserved result directory must not be a symlink');
  if (!parentStat.isDirectory()) throw new Error('reserved result parent must be a directory');

  const canonicalParent = await realpath(input.parentPath);
  if (canonicalParent !== input.parentPath || !isInside(input.workspaceRoot, canonicalParent)) {
    throw new Error('reserved result directory resolves outside the disposable workspace');
  }
}

async function assertResultAbsent(resultPath: string): Promise<void> {
  try {
    await lstat(resultPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return;
    throw new Error(`unable to inspect Host-fixed result path ${resultPath}: ${String(error)}`);
  }
  throw new Error(`Host-fixed result path already exists: ${resultPath}`);
}

function javascriptStringLiteral(value: string): string {
  return JSON.stringify(value).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

async function installPreflightLauncher(workspaceRoot: string, parentPath: string): Promise<void> {
  const hostRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const hostTsxPath = resolve(hostRoot, 'node_modules/.bin/tsx');
  const hostPreflightPath = resolve(hostRoot, PREFLIGHT_SCRIPT_RELATIVE_PATH);
  const launcherPath = resolve(workspaceRoot, ARTIFACT_BACKED_STRUCTURED_RESULT_PREFLIGHT_COMMAND);
  if (!isInside(workspaceRoot, launcherPath) || dirname(launcherPath) !== parentPath) {
    throw new Error('Host preflight launcher path escapes the reserved participant directory');
  }

  const launcher = [
    '#!/usr/bin/env node',
    '(async () => {',
    "  const { spawnSync } = await import('node:child_process');",
    `  const result = spawnSync(${javascriptStringLiteral(hostTsxPath)}, [${javascriptStringLiteral(hostPreflightPath)}, ...process.argv.slice(2)], { stdio: 'inherit', shell: false });`,
    "  if (result.error) { console.error(`Unable to start Host Role-schema preflight: ${result.error.message}`); process.exitCode = 1; }",
    '  else { process.exitCode = result.status ?? 1; }',
    '})().catch(error => { console.error(`Unable to start Host Role-schema preflight: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1; });',
    '',
  ].join('\n');

  let handle;
  try {
    handle = await open(launcherPath, 'wx', 0o755);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Host Role-schema preflight launcher already exists: ${launcherPath}`);
    }
    throw new Error(`unable to create Host Role-schema preflight launcher ${launcherPath}: ${String(error)}`);
  }

  try {
    await handle.writeFile(launcher);
    await handle.chmod(0o755);
  } finally {
    await handle.close();
  }
}

export async function prepareArtifactBackedStructuredResult(input: {
  workspaceRoot: string;
}): Promise<{ resultPath: string }> {
  const workspaceRoot = await resolveWorkspaceRoot(input.workspaceRoot);
  const paths = resultPaths(workspaceRoot);
  await requireReservedParent({
    workspaceRoot,
    parentPath: paths.parentPath,
    createIfMissing: true,
  });
  await assertResultAbsent(paths.resultPath);
  await installPreflightLauncher(workspaceRoot, paths.parentPath);
  return { resultPath: paths.resultPath };
}

async function requireEvidenceDestination(destinationRoot: string): Promise<string> {
  let destinationStat;
  try {
    destinationStat = await lstat(destinationRoot);
  } catch (error) {
    throw new Error(`Host evidence destination must already exist: ${destinationRoot}: ${String(error)}`);
  }
  if (destinationStat.isSymbolicLink() || !destinationStat.isDirectory()) {
    throw new Error(`Host evidence destination must be a real directory: ${destinationRoot}`);
  }
  return realpath(destinationRoot);
}

async function readBoundedRegularFile(resultPath: string): Promise<Buffer> {
  let resultStat;
  try {
    resultStat = await lstat(resultPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`missing fixed result artifact: ${resultPath}`);
    }
    throw new Error(`unable to inspect fixed result artifact ${resultPath}: ${String(error)}`);
  }
  if (resultStat.isSymbolicLink()) throw new Error('fixed result artifact must not be a symlink');
  if (!resultStat.isFile()) throw new Error('fixed result artifact must be a regular file');
  if (resultStat.size > ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES) {
    throw new Error(`fixed result artifact exceeds ${ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES.toLocaleString('en-US')} bytes`);
  }

  let handle;
  try {
    handle = await open(resultPath, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    throw new Error(`unable to open fixed result artifact without following symlinks: ${String(error)}`);
  }

  try {
    const openedStat = await handle.stat();
    if (!openedStat.isFile()) throw new Error('opened fixed result artifact is not a regular file');
    if (openedStat.size > ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES) {
      throw new Error(`fixed result artifact exceeds ${ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES.toLocaleString('en-US')} bytes`);
    }

    const boundedBytes = Buffer.alloc(ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES + 1);
    let totalBytes = 0;
    while (totalBytes < boundedBytes.length) {
      const { bytesRead } = await handle.read(
        boundedBytes,
        totalBytes,
        boundedBytes.length - totalBytes,
        totalBytes,
      );
      if (bytesRead === 0) break;
      totalBytes += bytesRead;
    }
    if (totalBytes > ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES) {
      throw new Error(`fixed result artifact exceeds ${ARTIFACT_BACKED_STRUCTURED_RESULT_MAX_BYTES.toLocaleString('en-US')} bytes`);
    }
    if (totalBytes !== openedStat.size) throw new Error('fixed result artifact changed while being read');
    return Buffer.from(boundedBytes.subarray(0, totalBytes));
  } finally {
    await handle.close();
  }
}

async function writeCreateOnly(path: string, bytes: Buffer): Promise<void> {
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

export async function consumeArtifactBackedStructuredResult(input: {
  workspaceRoot: string;
  destinationRoot: string;
  receipt: ArtifactBackedStructuredFinalResultReceiptV1;
}): Promise<ConsumedArtifactBackedStructuredResult> {
  const workspaceRoot = await resolveWorkspaceRoot(input.workspaceRoot);
  const paths = resultPaths(workspaceRoot);
  await requireReservedParent({
    workspaceRoot,
    parentPath: paths.parentPath,
    createIfMissing: false,
  });
  const rawBytes = await readBoundedRegularFile(paths.resultPath);
  const bytes = rawBytes.byteLength;
  const sha256 = createHash('sha256').update(rawBytes).digest('hex');

  if (input.receipt.bytes !== bytes) {
    throw new Error(`artifact receipt byte length mismatch: expected ${input.receipt.bytes}, actual ${bytes}`);
  }
  if (input.receipt.sha256 !== sha256) {
    throw new Error(`artifact receipt SHA-256 mismatch: expected ${input.receipt.sha256}, actual ${sha256}`);
  }

  const destinationRoot = await requireEvidenceDestination(input.destinationRoot);
  const evidencePath = resolve(destinationRoot, RAW_ARTIFACT_EVIDENCE_NAME);
  if (!isInside(destinationRoot, evidencePath)) throw new Error('raw artifact evidence path escapes Host evidence destination');
  await writeCreateOnly(evidencePath, rawBytes);

  let rawText: string;
  try {
    rawText = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(rawBytes);
  } catch (error) {
    throw new Error(`fixed result artifact is not strict UTF-8: ${String(error)}`);
  }
  const envelope = validateStructuredTerminalEnvelope(rawText);
  if (!envelope.ok) {
    throw new Error(`fixed result artifact structured envelope failed: ${envelope.reason}`);
  }

  return {
    rawBytes,
    rawText,
    bytes,
    sha256,
    parsedObject: envelope.parsedObject,
  };
}
