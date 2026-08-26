import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type {
  ParticipantThreadRef,
  WorkspaceAgentJobInput,
  WorkspaceAgentOutputInterpretation,
  WorkspaceAgentParticipantOptions,
} from './agentParticipant';

const execFileAsync = promisify(execFile);

export interface CursorAgentParticipantOptions {
  cursorExecutable?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function cursorAgentArgs(input: WorkspaceAgentJobInput): string[] {
  const base = [
    'agent',
    '--print',
    '--trust',
    '--force',
  ];
  if (input.role === 'solution') {
    return [
      ...base,
      '--output-format',
      'stream-json',
      '--workspace',
      input.workspaceRoot,
      input.prompt,
    ];
  }
  return [
    ...base,
    '--workspace',
    input.workspaceRoot,
    input.prompt,
  ];
}

function cursorAgentContinuationArgs(
  input: WorkspaceAgentJobInput,
  threadRef: ParticipantThreadRef,
): string[] {
  const base = [
    'agent',
    '--print',
    '--trust',
    '--force',
    '--resume',
    threadRef.opaqueId,
  ];
  if (input.role === 'solution') {
    return [
      ...base,
      '--output-format',
      'stream-json',
      '--workspace',
      input.workspaceRoot,
      input.prompt,
    ];
  }
  return [
    ...base,
    '--workspace',
    input.workspaceRoot,
    input.prompt,
  ];
}

export function interpretCursorCompletedOutput(input: {
  job: WorkspaceAgentJobInput;
  stdout: string;
  expectedThreadRef?: ParticipantThreadRef;
}): WorkspaceAgentOutputInterpretation {
  const { job, stdout, expectedThreadRef } = input;

  if (job.role !== 'solution' && expectedThreadRef === undefined) {
    return { ok: true, rawOutput: stdout };
  }

  let initSessionId: string | undefined;
  let terminalResult: string | undefined;

  for (const line of stdout.split('\n')) {
    if (line.length === 0) continue;

    let event: Record<string, unknown>;
    try {
      event = JSON.parse(line) as Record<string, unknown>;
    } catch {
      return {
        ok: false,
        errorKind: 'invalid_output',
        message: 'Cursor stdout is not valid NDJSON',
      };
    }

    if (event.type === 'system' && event.subtype === 'init') {
      const sessionId = event.session_id;
      if (typeof sessionId === 'string' && sessionId.length > 0) {
        if (initSessionId !== undefined && initSessionId !== sessionId) {
          return {
            ok: false,
            errorKind: 'invalid_output',
            message: 'Cursor stream has conflicting init session identities',
          };
        }
        initSessionId = sessionId;
      }
    }

    if (event.type === 'result' && event.subtype === 'success') {
      const result = event.result;
      if (typeof result === 'string') {
        terminalResult = result;
      }
    }

    const eventSessionId = event.session_id;
    if (
      initSessionId !== undefined
      && typeof eventSessionId === 'string'
      && eventSessionId.length > 0
      && eventSessionId !== initSessionId
    ) {
      return {
        ok: false,
        errorKind: 'invalid_output',
        message: 'Cursor stream event session_id does not match init session',
      };
    }
  }

  if (initSessionId === undefined) {
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: 'Cursor stream missing system/init session_id',
    };
  }

  if (expectedThreadRef !== undefined && initSessionId !== expectedThreadRef.opaqueId) {
    return {
      ok: false,
      errorKind: 'continuation',
      message: 'Cursor resumed session identity does not match the requested Participant thread',
    };
  }

  if (terminalResult === undefined) {
    return {
      ok: false,
      errorKind: 'invalid_output',
      message: 'Cursor stream missing result/success result',
    };
  }

  return {
    ok: true,
    rawOutput: terminalResult,
    threadRef: {
      provider: 'cursor',
      opaqueId: initSessionId,
    },
  };
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
    interpretCompletedOutput: interpretCursorCompletedOutput,
    sameThreadContinuation: {
      provider: 'cursor',
      buildArgs: (input, threadRef) => cursorAgentContinuationArgs(input, threadRef),
    },
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
