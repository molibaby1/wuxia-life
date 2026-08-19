import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export interface WorkspaceAgentJobInput {
  invocationRef: string;
  role: 'solution' | 'reviewer';
  workspaceRoot: string;
  prompt: string;
}

export interface WorkspaceAgentJobSuccess {
  ok: true;
  rawOutput: string;
  exitCode: 0;
}

export interface WorkspaceAgentJobFailure {
  ok: false;
  errorKind: 'runtime_unavailable' | 'process' | 'timeout' | 'invalid_output';
  message: string;
  rawOutput?: string;
  exitCode?: number;
}

export type WorkspaceAgentJobResult = WorkspaceAgentJobSuccess | WorkspaceAgentJobFailure;

export interface WorkspaceAgentParticipantOptions {
  executable: string;
  buildArgs: (input: WorkspaceAgentJobInput) => string[];
  spawnProcess?: typeof spawn;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

function combinedOutput(stdout: string, stderr: string): string {
  return stderr.length > 0 ? `${stdout}\n[stderr]\n${stderr}` : stdout;
}

export async function runWorkspaceAgentJob(
  input: WorkspaceAgentJobInput,
  options: WorkspaceAgentParticipantOptions,
): Promise<WorkspaceAgentJobResult> {
  const spawnProcess = options.spawnProcess ?? spawn;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const args = options.buildArgs(input);

  return new Promise(resolveResult => {
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawnProcess(options.executable, args, {
        cwd: input.workspaceRoot,
        env: { ...process.env, ...options.env },
        stdio: ['ignore', 'pipe', 'pipe'],
      }) as ChildProcessWithoutNullStreams;
    } catch (error) {
      resolveResult({
        ok: false,
        errorKind: 'process',
        message: `unable to start workspace Agent job ${input.invocationRef}: ${String(error)}`,
      });
      return;
    }

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    const settle = (result: WorkspaceAgentJobResult): void => {
      if (settled) return;
      settled = true;
      resolveResult(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      settle({
        ok: false,
        errorKind: 'timeout',
        message: `workspace Agent job timed out after ${timeoutMs}ms`,
        rawOutput: combinedOutput(stdout, stderr),
      });
    }, timeoutMs);

    child.stdout.on('data', chunk => { stdout += String(chunk); });
    child.stderr.on('data', chunk => { stderr += String(chunk); });
    child.on('error', error => {
      clearTimeout(timer);
      const errorCode = (error as NodeJS.ErrnoException).code;
      settle({
        ok: false,
        errorKind: errorCode === 'ENOENT' ? 'runtime_unavailable' : 'process',
        message: errorCode === 'ENOENT'
          ? `workspace Agent runtime is unavailable: ${options.executable}`
          : `workspace Agent job failed to start: ${String(error)}`,
        rawOutput: combinedOutput(stdout, stderr),
      });
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (timedOut || settled) return;
      if (code === 0) {
        settle({ ok: true, rawOutput: stdout, exitCode: 0 });
        return;
      }
      const rawOutput = combinedOutput(stdout, stderr);
      settle({
        ok: false,
        errorKind: 'process',
        message: `workspace Agent job exited with code ${String(code)}`,
        rawOutput,
        ...(typeof code === 'number' ? { exitCode: code } : {}),
      });
    });
  });
}
