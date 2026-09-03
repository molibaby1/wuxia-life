import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
  type WorkspaceAgentJobInput,
  type WorkspaceAgentParticipantOptions,
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

function createCodexCurrentParticipant(executable: string): WorkspaceAgentParticipantOptions {
  // Matches the repository's ordinary-run Codex host binding (no -m override).
  return {
    executable,
    timeoutMs: DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
    buildArgs: (input: WorkspaceAgentJobInput) => [
      '--sandbox', 'workspace-write',
      '--ask-for-approval', 'never',
      'exec',
      '--ephemeral',
      '--skip-git-repo-check',
      '--color', 'never',
      input.prompt,
    ],
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
    participant: createCodexCurrentParticipant(executable),
    participantMode: 'local-subagent',
  };
}
