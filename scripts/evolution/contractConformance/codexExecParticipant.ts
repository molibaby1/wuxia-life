import type {
  WorkspaceAgentJobInput,
  WorkspaceAgentOutputInterpretation,
  WorkspaceAgentParticipantOptions,
} from '../problemAgnosticSolution/agentParticipant';

export interface CodexExecParticipantOptions {
  codexExecutable?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

/**
 * Experiment-only Codex exec adapter for contract-conformance trials.
 * Does not alter production Participant bindings.
 */
export function createCodexExecParticipant(
  options: CodexExecParticipantOptions = {},
): WorkspaceAgentParticipantOptions {
  const executable = options.codexExecutable ?? 'codex';
  return {
    executable,
    timeoutMs: options.timeoutMs,
    env: options.env,
    buildArgs: input => [
      'exec',
      '--json',
      '--ephemeral',
      '--skip-git-repo-check',
      '-C',
      input.workspaceRoot,
      '-s',
      'read-only',
      input.prompt,
    ],
    interpretCompletedOutput: interpretCodexCompletedOutput,
  };
}

export function interpretCodexCompletedOutput(input: {
  job: WorkspaceAgentJobInput;
  stdout: string;
}): WorkspaceAgentOutputInterpretation {
  const { stdout } = input;
  let threadId: string | undefined;
  let lastAgentMessage: string | undefined;
  let sawTurnCompleted = false;

  for (const line of stdout.split('\n')) {
    if (line.length === 0) continue;
    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        errorKind: 'invalid_output',
        message: 'Codex stdout is not valid JSONL',
      };
    }

    if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
      threadId = event.thread_id;
    }

    if (event.type === 'turn.completed') {
      sawTurnCompleted = true;
    }

    if (event.type === 'item.completed') {
      const item = event.item;
      if (
        item !== null
        && typeof item === 'object'
        && !Array.isArray(item)
        && (item as { type?: unknown }).type === 'agent_message'
        && typeof (item as { text?: unknown }).text === 'string'
      ) {
        lastAgentMessage = (item as { text: string }).text;
      }
    }
  }

  if (lastAgentMessage === undefined) {
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: sawTurnCompleted
        ? 'Codex JSONL missing item.completed agent_message after turn.completed'
        : 'Codex JSONL missing item.completed agent_message',
    };
  }

  return {
    ok: true,
    rawOutput: lastAgentMessage,
    ...(threadId === undefined
      ? {}
      : {
        threadRef: {
          provider: 'codex-exec',
          opaqueId: threadId,
        },
      }),
  };
}
