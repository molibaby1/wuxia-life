import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
  type WorkspaceAgentCompletedOutputInput,
  type WorkspaceAgentOutputInterpretation,
} from '../problemAgnosticSolution/agentParticipant';

const execFileAsync = promisify(execFile);

export const OPERATOR_BINDING_CODEX_CURRENT = 'CODEX_CURRENT' as const;
export type OperatorParticipantBindingId = typeof OPERATOR_BINDING_CODEX_CURRENT;

export interface ResolvedOperatorParticipantBinding {
  bindingId: OperatorParticipantBindingId;
  provider: 'codex-local-subagent';
  executable: string;
  executableVersion: string;
  participant: WorkspaceAgentParticipantOptions;
  participantMode: 'local-subagent';
}

export class ParticipantBindingUnavailableError extends Error {
  readonly code = 'PARTICIPANT_BINDING_UNAVAILABLE' as const;

  constructor(message: string) {
    super(message);
    this.name = 'ParticipantBindingUnavailableError';
  }
}

const CODEX_THREAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function interpretCodexSolutionOutput(input: WorkspaceAgentCompletedOutputInput): WorkspaceAgentOutputInterpretation {
  if (input.job.role !== 'solution') {
    if (input.expectedThreadRef) return { ok: false, errorKind: 'continuation', message: 'Codex continuation is Solution-only' };
    return { ok: true, rawOutput: input.stdout };
  }
  const errorKind = input.expectedThreadRef ? 'continuation' : 'invalid_output';
  let threadId: string | undefined;
  let terminalPayload: string | undefined;
  let turnStarted = false;
  let turnCompleted = false;
  try {
    for (const line of input.stdout.split('\n')) {
      if (!line.trim()) continue;
      const event: unknown = JSON.parse(line);
      if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('invalid event object');
      const row = event as Record<string, unknown>;
      if (row.type === 'error' || row.type === 'turn.failed') throw new Error('failed Codex turn');
      if (turnCompleted && typeof row.type === 'string' && /^(thread|turn|item)\./.test(row.type)) throw new Error('activity after completed turn');
      if (row.type === 'thread.started') {
        if (threadId !== undefined || typeof row.thread_id !== 'string' || !CODEX_THREAD_ID.test(row.thread_id)) throw new Error('invalid or repeated thread identity');
        threadId = row.thread_id;
      }
      if (row.type === 'turn.started') {
        if (!threadId || turnStarted) throw new Error('invalid turn start');
        turnStarted = true;
      }
      if (row.type === 'item.completed') {
        const item = row.item;
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const message = item as Record<string, unknown>;
          if (message.type === 'agent_message') {
            if (!turnStarted || turnCompleted || typeof message.text !== 'string') throw new Error('invalid agent message');
            terminalPayload = message.text;
          }
        }
      }
      if (row.type === 'turn.completed') {
        if (!turnStarted || turnCompleted || terminalPayload === undefined) throw new Error('invalid turn completion');
        turnCompleted = true;
      }
    }
    if (!threadId || !turnCompleted || terminalPayload === undefined) throw new Error('missing completed turn, thread identity or message');
    if (input.expectedThreadRef && (input.expectedThreadRef.provider !== 'codex-exec' || input.expectedThreadRef.opaqueId !== threadId)) throw new Error('resumed thread identity mismatch');
    // Decode the CLI transport only; envelope/schema validation receives unchanged text.
    return { ok: true, rawOutput: terminalPayload, threadRef: { provider: 'codex-exec', opaqueId: threadId } };
  } catch (error) {
    return { ok: false, errorKind, message: `Invalid Codex Solution stream: ${String(error)}` };
  }
}

export function createCodexCurrentParticipant(
  executable: string,
  executableVersion: string,
): WorkspaceAgentParticipantOptions {
  // Matches the repository's ordinary-run Codex host binding (no -m override).
  return {
    executable,
    timeoutMs: DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
    bindingMetadata: {
      bindingId: OPERATOR_BINDING_CODEX_CURRENT,
      executableVersion,
    },
    buildArgs: (input: WorkspaceAgentJobInput) => [
      '--sandbox', 'workspace-write',
      '--ask-for-approval', 'never',
      'exec',
      // Solution must retain this invocation's session for bounded retransmission.
      ...(input.role === 'solution' ? ['--json'] : ['--ephemeral']),
      '--skip-git-repo-check',
      '--color', 'never',
      input.prompt,
    ],
    interpretCompletedOutput: interpretCodexSolutionOutput,
    sameThreadContinuation: {
      provider: 'codex-exec',
      buildArgs: (input, threadRef) => {
        if (input.role !== 'solution' || threadRef.provider !== 'codex-exec' || !CODEX_THREAD_ID.test(threadRef.opaqueId)) {
          throw new Error('Codex continuation requires the current Solution thread UUID');
        }
        return [
          '--sandbox', 'workspace-write',
          '--ask-for-approval', 'never',
          'exec', 'resume', '--json', '--skip-git-repo-check',
          threadRef.opaqueId, input.prompt,
        ];
      },
    },
  };
}

export function parseOperatorParticipantBindingId(
  value: string | undefined,
): OperatorParticipantBindingId {
  const normalized = (value ?? OPERATOR_BINDING_CODEX_CURRENT).trim();
  if (normalized === OPERATOR_BINDING_CODEX_CURRENT) return OPERATOR_BINDING_CODEX_CURRENT;
  throw new ParticipantBindingUnavailableError(
    `PARTICIPANT_BINDING_UNAVAILABLE: unsupported binding ${JSON.stringify(normalized)}`,
  );
}

export async function resolveOperatorParticipantBinding(
  bindingId: OperatorParticipantBindingId = OPERATOR_BINDING_CODEX_CURRENT,
): Promise<ResolvedOperatorParticipantBinding> {
  if (bindingId !== OPERATOR_BINDING_CODEX_CURRENT) {
    throw new ParticipantBindingUnavailableError(
      `PARTICIPANT_BINDING_UNAVAILABLE: unsupported binding ${JSON.stringify(bindingId)}`,
    );
  }

  let executable: string;
  try {
    const which = await execFileAsync('which', ['codex']);
    executable = which.stdout.trim().split('\n')[0] ?? '';
  } catch {
    executable = '';
  }
  if (!executable) {
    throw new ParticipantBindingUnavailableError(
      'PARTICIPANT_BINDING_UNAVAILABLE: CODEX_CURRENT requires a resolvable codex executable',
    );
  }

  let executableVersion: string;
  try {
    const version = await execFileAsync(executable, ['--version'], { timeout: 10_000 });
    executableVersion = `${version.stdout}${version.stderr}`.trim();
  } catch (error) {
    throw new ParticipantBindingUnavailableError(
      `PARTICIPANT_BINDING_UNAVAILABLE: codex --version failed: ${String(error)}`,
    );
  }

  return {
    bindingId: OPERATOR_BINDING_CODEX_CURRENT,
    provider: 'codex-local-subagent',
    executable,
    executableVersion,
    participant: createCodexCurrentParticipant(executable, executableVersion),
    participantMode: 'local-subagent',
  };
}
