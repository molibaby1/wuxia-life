import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  referenceParticipantBindingLockSha256,
  type ReferenceParticipantBindingLockV1,
} from '../operator/referenceParticipantBinding';
import {
  runPreschoolReferenceSolutionCommunicationProbe,
  type PreschoolReferenceSolutionCommunicationProbeDependencies,
} from './runPreschoolReferenceTrial';

interface RunPreschoolReferenceSolutionCommunicationProbeInput {
  liveRepositoryRoot: string;
  evidencePath: string;
  observablePayloadPath: string;
  responsibilityBriefPath: string;
  probeRef: string;
  destinationRoot: string;
  participantBindingLockPath: string;
}

export type ParsedPreschoolReferenceSolutionCommunicationProbeArgs =
  | { help: true }
  | { help: false; input: RunPreschoolReferenceSolutionCommunicationProbeInput };

const REQUIRED_OPTIONS = [
  '--evidence',
  '--observable-payload',
  '--responsibility-brief',
  '--probe-ref',
  '--binding-lock',
] as const;

function resolveInputPath(repositoryRoot: string, path: string): string {
  return isAbsolute(path) ? resolve(path) : resolve(repositoryRoot, path);
}

export function parsePreschoolReferenceSolutionCommunicationProbeArgs(
  argv: string[],
  repositoryRoot = process.cwd(),
): ParsedPreschoolReferenceSolutionCommunicationProbeArgs {
  if (argv.length === 1 && argv[0] === '--help') return { help: true };

  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index]!;
    if (!(REQUIRED_OPTIONS as readonly string[]).includes(option)) {
      throw new Error(`Unknown option: ${option}`);
    }
    if (values.has(option)) throw new Error(`Duplicate option: ${option}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`${option} requires a value.`);
    values.set(option, value);
    index += 1;
  }
  for (const option of REQUIRED_OPTIONS) {
    if (!values.has(option)) throw new Error(`${option} is required.`);
  }

  const root = resolve(repositoryRoot);
  const probeRef = values.get('--probe-ref')!;
  const destinationRoot = resolve(
    root,
    '.tmp/evolution/preschool-reference-solution-communication-probes',
    probeRef,
  );
  return {
    help: false,
    input: {
      liveRepositoryRoot: root,
      evidencePath: resolveInputPath(root, values.get('--evidence')!),
      observablePayloadPath: resolveInputPath(root, values.get('--observable-payload')!),
      responsibilityBriefPath: resolveInputPath(root, values.get('--responsibility-brief')!),
      probeRef,
      destinationRoot,
      participantBindingLockPath: resolveInputPath(root, values.get('--binding-lock')!),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

export async function readValidatedPreschoolReferenceProbeBindingLock(input: {
  repositoryRoot: string;
  participantBindingLockPath: string;
  currentImplementationSha: string;
}): Promise<ReferenceParticipantBindingLockV1> {
  const lockPath = resolve(input.participantBindingLockPath);
  if (basename(lockPath) !== 'binding-lock.json') {
    throw new Error('Matrix D requires the exact matrix binding-lock.json path.');
  }
  const matrixRoot = realpathWithMissingSuffix(dirname(lockPath));
  const governedRoot = realpathWithMissingSuffix(resolve(
    input.repositoryRoot,
    'artifacts/evolution/autonomous-authoring/reference-trials',
  ));
  const relativeToGoverned = relative(governedRoot, matrixRoot);
  if (relativeToGoverned === '' || (relativeToGoverned !== '..'
    && !relativeToGoverned.startsWith(`..${sep}`) && !isAbsolute(relativeToGoverned))) {
    throw new Error('Matrix D binding evidence must be outside governed reference-trial history.');
  }
  const matrixPath = join(matrixRoot, 'matrix.json');
  const [lockText, matrixText] = await Promise.all([
    readFile(lockPath, 'utf8'),
    readFile(matrixPath, 'utf8'),
  ]);
  const lockValue: unknown = JSON.parse(lockText);
  const matrixValue: unknown = JSON.parse(matrixText);
  if (!isRecord(lockValue) || lockValue.schemaVersion !== 'reference-participant-binding-lock-v1') {
    throw new Error('Matrix D binding lock has an unsupported schema.');
  }
  if (!isRecord(matrixValue)
    || matrixValue.schemaVersion !== 'reference-participant-communication-matrix-v1'
    || matrixValue.status !== 'PASS'
    || matrixValue.bindingLockRef !== 'binding-lock.json'
    || matrixValue.implementationSha !== input.currentImplementationSha
    || !isRecord(matrixValue.matrices)
    || !isRecord(matrixValue.matrices.A)
    || matrixValue.matrices.A.gatePassed !== true
    || !isRecord(matrixValue.matrices.B)
    || matrixValue.matrices.B.gatePassed !== true
    || !isRecord(matrixValue.matrices.C)
    || matrixValue.matrices.C.gatePassed !== true) {
    throw new Error('Matrix D requires a passing A-C matrix for the current implementation SHA.');
  }
  const lock = lockValue as unknown as ReferenceParticipantBindingLockV1;
  const lockSha256 = referenceParticipantBindingLockSha256(lock);
  if (matrixValue.bindingLockSha256 !== lockSha256) {
    throw new Error('Matrix D binding-lock SHA does not match the passing A-C matrix.');
  }
  return lock;
}

export function preschoolReferenceSolutionCommunicationProbeUsage(): string {
  return [
    'Usage: npm run evolution:reference-communication:solution-probe -- --evidence <accepted-evidence.json> --observable-payload <observable-payload.json> --responsibility-brief <reference-responsibility-brief.json> --probe-ref <id> --binding-lock <matrix-root>/binding-lock.json',
    'The CLI requires the sibling matrix.json to show passing Matrix A-C evidence for the current implementation SHA.',
  ].join('\n');
}

export async function runPreschoolReferenceSolutionCommunicationProbeCli(
  argv: string[],
  dependencies: PreschoolReferenceSolutionCommunicationProbeDependencies & {
    implementationSha?: (repositoryRoot: string) => string | Promise<string>;
  } = {},
  repositoryRoot = process.cwd(),
  writeOutput: (text: string) => void = text => process.stdout.write(text),
): Promise<number> {
  const parsed = parsePreschoolReferenceSolutionCommunicationProbeArgs(argv, repositoryRoot);
  if (parsed.help) {
    writeOutput(`${preschoolReferenceSolutionCommunicationProbeUsage()}\n`);
    return 0;
  }

  const currentImplementationSha = (dependencies.implementationSha
    ?? (root => execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()))(
      parsed.input.liveRepositoryRoot,
    );
  const participantBindingLock = await readValidatedPreschoolReferenceProbeBindingLock({
    repositoryRoot: parsed.input.liveRepositoryRoot,
    participantBindingLockPath: parsed.input.participantBindingLockPath,
    currentImplementationSha,
  });
  const result = await runPreschoolReferenceSolutionCommunicationProbe({
    ...parsed.input,
    participantBindingLock,
  }, dependencies);
  writeOutput(`${JSON.stringify({
    probeRef: result.probeRef,
    status: result.status,
    solutionOutcome: result.solutionOutcome,
    implementationSha: result.implementationSha,
    participantBindingLockSha256: result.participantBindingLockSha256,
    authoritativeFingerprintUnchanged: result.authoritativeFingerprintUnchanged,
    governedHistoryUnchanged: result.governedHistoryUnchanged,
  })}\n`);
  return result.solutionOutcome.reachedRoleSchemaValidation
    && result.solutionOutcome.envelopeValid === true
    && result.authoritativeFingerprintUnchanged
    && result.governedHistoryUnchanged
    && result.status !== 'CONTAINMENT_FAILURE'
    ? 0
    : 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPreschoolReferenceSolutionCommunicationProbeCli(process.argv.slice(2)).then(code => {
    process.exitCode = code;
  }).catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
