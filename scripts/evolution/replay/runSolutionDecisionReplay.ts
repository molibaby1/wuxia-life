import { open, mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  validateSolutionDecision,
  type SolutionDecisionV1,
} from '../../../src/evolution/solutionDecisionContract';
import type { ExecutionAuthorityAssessment } from '../../../src/evolution/solutionReviewContract';
import type { AutonomousAuthoringAdmissionStatus } from '../../../src/evolution/autonomousAuthoringAdmissionContract';
import {
  routeSolutionDecision,
  type RouteSolutionDecisionInput,
} from '../problemAgnosticSolution/routeSolutionDecision';

const INPUT_REQUIRED_KEYS = [
  'problemId',
  'solutionStatus',
  'reviewerDecision',
  'solutionScope',
  'reviewScope',
  'permissions',
  'budget',
] as const;
const INPUT_OPTIONAL_KEYS = [
  'executionAuthorityAssessment',
  'autonomousAuthoringRequested',
  'autonomousAuthoringAdmissionStatus',
] as const;
const AUTONOMOUS_AUTHORING_ADMISSION_STATUSES: readonly AutonomousAuthoringAdmissionStatus[] = [
  'ELIGIBLE',
  'NOT_APPLICABLE',
  'INSUFFICIENT_EVIDENCE',
  'CONTRACT_CHANGE_REQUIRED',
  'EXECUTION_ENVELOPE_EXCEEDED',
  'AUTHORITY_STALE',
];
const PERMISSION_KEYS = [
  'authoritativeProductWrite',
  'sandboxWrite',
  'productExecution',
  'codeExecution',
] as const;
const BUDGET_KEYS = ['actualParticipantJobs', 'maxParticipantJobs', 'retryCount'] as const;
type RecordValue = Record<string, unknown>;

function assertObject(value: unknown, label: string): asserts value is RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertExactKeys(
  value: RecordValue,
  required: readonly string[],
  label: string,
  optional: readonly string[] = [],
): void {
  const allowedSet = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) throw new Error(`${label} contains unknown field: ${key}`);
  }
  for (const key of required) {
    if (!(key in value)) throw new Error(`${label} is missing field: ${key}`);
  }
}

function assertNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function assertBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`${label} must be a boolean`);
  return value;
}

function assertInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  return value;
}

function assertNullableString(value: unknown, label: string): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new Error(`${label} must be a string or null`);
  return value;
}

function parseReplayInput(raw: string): RouteSolutionDecisionInput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('decision replay input must be valid JSON');
  }

  assertObject(parsed, 'decision replay input');
  assertExactKeys(parsed, INPUT_REQUIRED_KEYS, 'decision replay input', INPUT_OPTIONAL_KEYS);
  assertObject(parsed.permissions, 'decision replay input.permissions');
  assertExactKeys(parsed.permissions, PERMISSION_KEYS, 'decision replay input.permissions');
  assertObject(parsed.budget, 'decision replay input.budget');
  assertExactKeys(parsed.budget, BUDGET_KEYS, 'decision replay input.budget');

  const autonomousAuthoringRequested = Object.hasOwn(parsed, 'autonomousAuthoringRequested')
    ? assertBoolean(parsed.autonomousAuthoringRequested, 'decision replay input.autonomousAuthoringRequested')
    : undefined;
  let autonomousAuthoringAdmissionStatus: AutonomousAuthoringAdmissionStatus | null | undefined;
  if (Object.hasOwn(parsed, 'autonomousAuthoringAdmissionStatus')) {
    const value = parsed.autonomousAuthoringAdmissionStatus;
    if (value === null) {
      autonomousAuthoringAdmissionStatus = null;
    } else if (typeof value === 'string' && AUTONOMOUS_AUTHORING_ADMISSION_STATUSES.includes(value as AutonomousAuthoringAdmissionStatus)) {
      autonomousAuthoringAdmissionStatus = value as AutonomousAuthoringAdmissionStatus;
    } else {
      throw new Error(`decision replay input.autonomousAuthoringAdmissionStatus has invalid value: ${String(value)}`);
    }
  }

  // Input shape/types are enforced here; enum/policy legality remains with route + validateSolutionDecision.
  return {
    problemId: assertNonEmptyString(parsed.problemId, 'decision replay input.problemId'),
    solutionStatus: assertNonEmptyString(parsed.solutionStatus, 'decision replay input.solutionStatus') as RouteSolutionDecisionInput['solutionStatus'],
    reviewerDecision: assertNullableString(parsed.reviewerDecision, 'decision replay input.reviewerDecision') as RouteSolutionDecisionInput['reviewerDecision'],
    solutionScope: assertNullableString(parsed.solutionScope, 'decision replay input.solutionScope') as RouteSolutionDecisionInput['solutionScope'],
    reviewScope: assertNullableString(parsed.reviewScope, 'decision replay input.reviewScope') as RouteSolutionDecisionInput['reviewScope'],
    executionAuthorityAssessment: parsed.executionAuthorityAssessment === undefined
      ? null
      : assertNonEmptyString(parsed.executionAuthorityAssessment, 'decision replay input.executionAuthorityAssessment') as ExecutionAuthorityAssessment,
    ...(autonomousAuthoringRequested !== undefined ? { autonomousAuthoringRequested } : {}),
    ...(autonomousAuthoringAdmissionStatus !== undefined
      ? { autonomousAuthoringAdmissionStatus }
      : {}),
    permissions: {
      authoritativeProductWrite: assertBoolean(parsed.permissions.authoritativeProductWrite, 'decision replay input.permissions.authoritativeProductWrite'),
      sandboxWrite: assertBoolean(parsed.permissions.sandboxWrite, 'decision replay input.permissions.sandboxWrite'),
      productExecution: assertBoolean(parsed.permissions.productExecution, 'decision replay input.permissions.productExecution'),
      codeExecution: assertBoolean(parsed.permissions.codeExecution, 'decision replay input.permissions.codeExecution'),
    },
    budget: {
      actualParticipantJobs: assertInteger(parsed.budget.actualParticipantJobs, 'decision replay input.budget.actualParticipantJobs'),
      maxParticipantJobs: assertInteger(parsed.budget.maxParticipantJobs, 'decision replay input.budget.maxParticipantJobs'),
      retryCount: assertInteger(parsed.budget.retryCount, 'decision replay input.budget.retryCount'),
    },
  };
}

export function replaySolutionDecision(raw: string): SolutionDecisionV1 {
  const decision = routeSolutionDecision(parseReplayInput(raw));
  return validateSolutionDecision(decision);
}

function requireValue(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`missing value for ${flag}`);
  return value;
}

function parseCliArgs(argv: string[]): { inputPath: string; outputPath: string } {
  const values = new Map<string, string>();
  const allowed = new Set(['--input', '--output']);

  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    if (!allowed.has(flag)) throw new Error(`unknown argument: ${flag}`);
    if (values.has(flag)) throw new Error(`duplicate argument: ${flag}`);
    values.set(flag, requireValue(argv, index, flag));
  }

  if (!values.has('--input')) throw new Error('missing required argument: --input');
  if (!values.has('--output')) throw new Error('missing required argument: --output');

  return {
    inputPath: values.get('--input')!,
    outputPath: values.get('--output')!,
  };
}

async function readInputFile(inputPath: string): Promise<string> {
  try {
    return await readFile(inputPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`input file does not exist: ${inputPath}`);
    }
    throw new Error(`unable to read input file ${inputPath}: ${(error as Error).message}`);
  }
}

async function writeCreateOnly(outputPath: string, content: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  let handle;
  try {
    handle = await open(outputPath, 'wx');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`output file already exists: ${outputPath}`);
    }
    throw error;
  }
  try {
    await handle.writeFile(content);
  } finally {
    await handle.close();
  }
}

export async function runSolutionDecisionReplayCli(argv: string[]): Promise<void> {
  const args = parseCliArgs(argv);
  const decision = replaySolutionDecision(await readInputFile(args.inputPath));
  await writeCreateOnly(args.outputPath, `${JSON.stringify(decision, null, 2)}\n`);
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  runSolutionDecisionReplayCli(process.argv.slice(2)).catch(error => {
    console.error(error);
    process.exit(1);
  });
}
