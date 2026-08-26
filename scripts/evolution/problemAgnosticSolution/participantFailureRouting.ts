import { lstat, readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import {
  validateParticipantFailureOutcome,
  type ParticipantFailureOutcomeV1,
  type ParticipantFailureStage,
} from '../../../src/evolution/participantFailureOutcomeContract';

export interface BuildParticipantFailureInput {
  repositoryRoot: string;
  experimentRoot: string;
  stage: ParticipantFailureStage;
  participantErrorKind: string;
  failureArtifactRefs: string[];
}

const LEGACY_STAGES = ['EXTERNAL_FEEDBACK', 'IMPROVEMENT_HYPOTHESIS'] as const;
type LegacyParticipantFailureStage = (typeof LEGACY_STAGES)[number];
type RecordValue = Record<string, unknown>;

function assertInside(root: string, target: string, label: string): string {
  const resolvedRoot = resolve(root);
  const resolvedTarget = resolve(target);
  const relativeTarget = relative(resolvedRoot, resolvedTarget);
  if (!relativeTarget || relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
    throw new Error(`${label} must be inside experimentRoot`);
  }
  return relativeTarget.split(sep).join('/');
}

function resolveArtifactReference(experimentRoot: string, reference: string): { absolutePath: string; relativePath: string } {
  const absolutePath = isAbsolute(reference)
    ? resolve(reference)
    : resolve(experimentRoot, reference);
  return {
    absolutePath,
    relativePath: assertInside(experimentRoot, absolutePath, 'failure artifact reference'),
  };
}

async function assertRegularFile(path: string, label: string): Promise<void> {
  const stat = await lstat(path);
  if (!stat.isFile()) throw new Error(`${label} must be a regular file: ${path}`);
}

function expectedInvocation(input: { stage: LegacyParticipantFailureStage; runRef: string }): {
  directory: 'feedback-runs' | 'hypothesis-runs';
  schemaVersion: 'minimal-external-feedback-invocation-v1' | 'improvement-hypothesis-invocation-v1';
  invocationRefField: 'invocationRef' | 'hypothesisInvocationRef';
  invocationRefs: {
    deepseek: string;
    local: string;
  };
} {
  if (input.stage === 'EXTERNAL_FEEDBACK') {
    return {
      directory: 'feedback-runs',
      schemaVersion: 'minimal-external-feedback-invocation-v1',
      invocationRefField: 'invocationRef',
      invocationRefs: {
        deepseek: `${input.runRef}-deepseek-player-feedback-001`,
        local: `${input.runRef}-local-player-feedback-001`,
      },
    };
  }
  return {
    directory: 'hypothesis-runs',
    schemaVersion: 'improvement-hypothesis-invocation-v1',
    invocationRefField: 'hypothesisInvocationRef',
    invocationRefs: {
      deepseek: `${input.runRef}-deepseek-improvement-hypothesis-001`,
      local: `${input.runRef}-local-improvement-hypothesis-001`,
    },
  };
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function buildParticipantFailureOutcome(
  input: BuildParticipantFailureInput,
): Promise<ParticipantFailureOutcomeV1> {
  const experimentRoot = resolve(input.experimentRoot);
  const failureArtifactRefs: string[] = [];
  for (const reference of input.failureArtifactRefs) {
    const resolved = resolveArtifactReference(experimentRoot, reference);
    await assertRegularFile(resolved.absolutePath, 'failure artifact');
    failureArtifactRefs.push(resolved.relativePath);
  }

  return validateParticipantFailureOutcome({
    schemaVersion: 'participant-failure-outcome-v1',
    outcome: 'PARTICIPANT_FAILURE',
    failedStage: input.stage,
    participantJobNumber: input.stage === 'EXTERNAL_FEEDBACK'
      ? 1
      : input.stage === 'IMPROVEMENT_HYPOTHESIS'
        ? 2
        : input.stage === 'SOLUTION'
          ? 3
          : 4,
    route: 'DEFER',
    participantErrorKind: input.participantErrorKind,
    failureArtifactRefs,
    budget: {
      actualParticipantJobs: input.stage === 'EXTERNAL_FEEDBACK'
        ? 1
        : input.stage === 'IMPROVEMENT_HYPOTHESIS'
          ? 2
          : input.stage === 'SOLUTION'
            ? 3
            : 4,
      maxParticipantJobs: 4,
      retryCount: 0,
    },
  });
}

export async function proveLegacyParticipantFailure(input: {
  experimentRoot: string;
  stage: LegacyParticipantFailureStage;
  runRef: string;
}): Promise<{ participantErrorKind: string; failureArtifactRefs: string[] } | null> {
  if (!input.runRef || input.runRef.includes('/') || input.runRef.includes('\\')) return null;
  const expected = expectedInvocation(input);
  const experimentRoot = resolve(input.experimentRoot);
  const runDirectory = resolve(experimentRoot, expected.directory, input.runRef);
  const invocationPath = resolve(runDirectory, 'invocation.json');
  try {
    await assertRegularFile(invocationPath, 'legacy Participant invocation');
    const parsed: unknown = JSON.parse(await readFile(invocationPath, 'utf8'));
    if (!isRecord(parsed)) return null;
    if (parsed.schemaVersion !== expected.schemaVersion) return null;
    if (parsed.runRef !== input.runRef) return null;
    const participant = parsed.participant;
    if (participant !== undefined && !isRecord(participant)) return null;
    const provider = isRecord(participant) ? participant.provider : undefined;
    if (provider !== undefined && provider !== 'deepseek' && provider !== 'codex-local-subagent') return null;
    const expectedInvocationRef = provider === 'codex-local-subagent'
      ? expected.invocationRefs.local
      : expected.invocationRefs.deepseek;
    if (parsed[expected.invocationRefField] !== expectedInvocationRef) return null;
    if (parsed.status !== 'failed') return null;
    if (typeof parsed.errorKind !== 'string' || parsed.errorKind.length === 0) return null;

    const failureArtifactRefs = [
      invocationPath,
      resolve(runDirectory, 'human-review.md'),
      resolve(runDirectory, 'raw-provider-response.txt'),
      resolve(runDirectory, 'raw-participant-response.txt'),
    ];
    const existingRefs: string[] = [];
    for (const reference of failureArtifactRefs) {
      try {
        await assertRegularFile(reference, 'legacy Participant failure artifact');
        existingRefs.push(assertInside(experimentRoot, reference, 'legacy Participant failure artifact'));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        return null;
      }
    }
    return {
      participantErrorKind: parsed.errorKind,
      failureArtifactRefs: existingRefs,
    };
  } catch (error) {
    if (error instanceof SyntaxError || (error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    return null;
  }
}
