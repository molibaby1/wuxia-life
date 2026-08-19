import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { WorkspaceAgentParticipantOptions } from './agentParticipant';

const execFileAsync = promisify(execFile);

export interface CursorAgentParticipantOptions {
  cursorExecutable?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function cursorAgentArgs(input: { workspaceRoot: string; prompt: string }): string[] {
  return [
    'agent',
    '--print',
    '--trust',
    '--force',
    '--workspace',
    input.workspaceRoot,
    input.prompt,
  ];
}

export function createCursorAgentParticipant(
  options: CursorAgentParticipantOptions = {},
): WorkspaceAgentParticipantOptions {
  const executable = options.cursorExecutable ?? 'cursor';
  return {
    executable,
    timeoutMs: options.timeoutMs,
    env: options.env,
    buildArgs: input => cursorAgentArgs(input),
  };
}

export async function preflightCursorRuntime(
  options: Pick<CursorAgentParticipantOptions, 'cursorExecutable' | 'env'> = {},
): Promise<{ available: true; executable: string } | { available: false; reason: string }> {
  const executable = options.cursorExecutable ?? 'cursor';
  try {
    await execFileAsync(executable, ['--version'], { env: { ...process.env, ...options.env } });
    return { available: true, executable };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return {
      available: false,
      reason: code === 'ENOENT'
        ? `Cursor CLI is unavailable: ${executable}`
        : `Cursor CLI preflight failed: ${String(error)}`,
    };
  }
}
