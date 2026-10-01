import { resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  runReferenceArtifactBackedCommunicationMatrix,
  type RunReferenceArtifactBackedCommunicationMatrixInput,
} from './referenceArtifactBackedCommunicationMatrix';

export type ParsedReferenceArtifactBackedCommunicationMatrixArgs =
  | { help: true }
  | { help: false; input: RunReferenceArtifactBackedCommunicationMatrixInput };

const REQUIRED_OPTIONS = ['--model', '--reasoning-effort', '--ambient-codex-config', '--matrix-ref'] as const;
const OPTIONAL_OPTIONS = ['--evidence-root'] as const;

export function parseReferenceArtifactBackedCommunicationMatrixArgs(
  argv: string[],
  repositoryRoot = process.cwd(),
): ParsedReferenceArtifactBackedCommunicationMatrixArgs {
  if (argv.length === 1 && argv[0] === '--help') return { help: true };
  const allowed = [...REQUIRED_OPTIONS, ...OPTIONAL_OPTIONS] as readonly string[];
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const option = argv[index]!;
    if (!allowed.includes(option)) throw new Error(`Unknown option: ${option}`);
    if (values.has(option)) throw new Error(`Duplicate option: ${option}`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`${option} requires a value.`);
    if (value.trim().length === 0) throw new Error(`${option} requires a non-empty value.`);
    values.set(option, value);
    index += 1;
  }
  for (const option of REQUIRED_OPTIONS) {
    if (!values.has(option)) throw new Error(`${option} is required.`);
  }

  const root = resolve(repositoryRoot);
  const matrixRef = values.get('--matrix-ref')!;
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(matrixRef) || /^attempt-[0-9]{6}$/.test(matrixRef)) {
    throw new Error('Matrix reference is invalid.');
  }
  const evidenceRootValue = values.get('--evidence-root') ?? '.tmp/evolution/reference-artifact-backed-communication';
  const evidenceBase = isAbsolute(evidenceRootValue) ? resolve(evidenceRootValue) : resolve(root, evidenceRootValue);
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

export function referenceArtifactBackedCommunicationMatrixUsage(): string {
  return [
    'Usage: npm run evolution:reference-communication:artifact-backed-matrix -- --model <model> --reasoning-effort <effort> --ambient-codex-config <path> --matrix-ref <id> [--evidence-root <directory>]',
    'The runner creates <evidence-root>/<matrix-ref>/binding-lock.json and three artifact-backed synthetic trial records.',
  ].join('\n');
}

export async function runReferenceArtifactBackedCommunicationMatrixCli(
  argv: string[],
  repositoryRoot = process.cwd(),
): Promise<number> {
  try {
    const parsed = parseReferenceArtifactBackedCommunicationMatrixArgs(argv, repositoryRoot);
    if (parsed.help) {
      process.stdout.write(`${referenceArtifactBackedCommunicationMatrixUsage()}\n`);
      return 0;
    }
    const evidence = await runReferenceArtifactBackedCommunicationMatrix(parsed.input);
    process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
    return evidence.status === 'PASS' ? 0 : 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.stderr.write(`${referenceArtifactBackedCommunicationMatrixUsage()}\n`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runReferenceArtifactBackedCommunicationMatrixCli(process.argv.slice(2)).then(code => {
    process.exitCode = code;
  });
}
