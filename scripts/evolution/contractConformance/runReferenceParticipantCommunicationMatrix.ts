import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runReferenceParticipantCommunicationMatrix,
  type ReferenceParticipantCommunicationMatrixDependencies,
  type RunReferenceParticipantCommunicationMatrixInput,
} from './referenceParticipantCommunicationMatrix';

export type ParsedReferenceParticipantCommunicationMatrixArgs =
  | { help: true }
  | { help: false; input: RunReferenceParticipantCommunicationMatrixInput };

const REQUIRED_OPTIONS = [
  '--model',
  '--reasoning-effort',
  '--ambient-codex-config',
  '--evidence-root',
  '--matrix-ref',
] as const;

export function parseReferenceParticipantCommunicationMatrixArgs(
  argv: string[],
  repositoryRoot = process.cwd(),
): ParsedReferenceParticipantCommunicationMatrixArgs {
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
  const matrixRef = values.get('--matrix-ref')!;
  const evidenceRootValue = values.get('--evidence-root')!;
  const evidenceBase = isAbsolute(evidenceRootValue)
    ? resolve(evidenceRootValue)
    : resolve(root, evidenceRootValue);
  return {
    help: false,
    input: {
      repositoryRoot: root,
      evidenceRoot: resolve(evidenceBase, matrixRef),
      matrixRef,
      model: values.get('--model')!,
      reasoningEffort: values.get('--reasoning-effort')!,
      ambientCodexConfigPath: resolve(values.get('--ambient-codex-config')!),
    },
  };
}

export function referenceParticipantCommunicationMatrixUsage(): string {
  return [
    'Usage: npm run evolution:reference-communication:matrix -- --model <model> --reasoning-effort <effort> --ambient-codex-config <path> --evidence-root <directory> --matrix-ref <id>',
    'The runner creates <evidence-root>/<matrix-ref>/binding-lock.json and Matrix A-C evidence.',
  ].join('\n');
}

export async function runReferenceParticipantCommunicationMatrixCli(
  argv: string[],
  dependencies: ReferenceParticipantCommunicationMatrixDependencies = {},
  repositoryRoot = process.cwd(),
  writeOutput: (text: string) => void = text => process.stdout.write(text),
): Promise<number> {
  const parsed = parseReferenceParticipantCommunicationMatrixArgs(argv, repositoryRoot);
  if (parsed.help) {
    writeOutput(`${referenceParticipantCommunicationMatrixUsage()}\n`);
    return 0;
  }
  const result = await runReferenceParticipantCommunicationMatrix(parsed.input, dependencies);
  writeOutput(`${JSON.stringify({
    matrixRef: result.matrixRef,
    status: result.status,
    evidenceRoot: parsed.input.evidenceRoot,
    bindingLockSha256: result.bindingLockSha256,
    implementationSha: result.implementationSha,
  })}\n`);
  return result.status === 'PASS' ? 0 : 1;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runReferenceParticipantCommunicationMatrixCli(process.argv.slice(2)).then(code => {
    process.exitCode = code;
  }).catch(error => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
