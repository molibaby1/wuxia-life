import assert from 'node:assert/strict';
import {
  createCursorAgentParticipant,
  cursorAgentArgs,
  interpretCursorCompletedOutput,
} from '../../scripts/evolution/problemAgnosticSolution/cursorAgentParticipant';

const solutionInput = {
  invocationRef: 'solution-agent-000001',
  role: 'solution' as const,
  workspaceRoot: '/tmp/workspace',
  prompt: 'Return structured output.',
};

function buildStream(overrides: {
  initSessionId?: string;
  resultPayload?: string;
  assistantSessionId?: string;
  includeInit?: boolean;
  includeResult?: boolean;
  malformedLine?: string;
} = {}): string {
  const {
    initSessionId = 'session-123',
    resultPayload = '{"schemaVersion":"solution-work-v1"}',
    assistantSessionId = initSessionId,
    includeInit = true,
    includeResult = true,
    malformedLine,
  } = overrides;
  const lines: string[] = [];
  if (malformedLine !== undefined) {
    lines.push(malformedLine);
  }
  if (includeInit) {
    lines.push(JSON.stringify({
      type: 'system',
      subtype: 'init',
      session_id: initSessionId,
    }));
  }
  lines.push(JSON.stringify({
    type: 'assistant',
    subtype: 'message',
    text: 'thinking is not terminal authority',
    session_id: assistantSessionId,
  }));
  if (includeResult) {
    lines.push(JSON.stringify({
      type: 'result',
      subtype: 'success',
      result: resultPayload,
      session_id: initSessionId,
    }));
  }
  lines.push('');
  return lines.join('\n');
}

export async function runCursorAgentParticipantTests(): Promise<void> {
  const args = cursorAgentArgs(solutionInput);

  assert.deepEqual(args.slice(0, 4), [
    'agent',
    '--print',
    '--trust',
    '--force',
  ]);
  assert.ok(args.includes('--output-format'));
  assert.ok(args.includes('stream-json'));
  assert.ok(args.includes('--workspace'));
  assert.equal(args.at(-1), solutionInput.prompt);
  assert.equal(args.includes('--resume'), false);

  const reviewerArgs = cursorAgentArgs({
    ...solutionInput,
    role: 'reviewer',
  });

  assert.equal(reviewerArgs.includes('--output-format'), false);
  assert.equal(reviewerArgs.includes('--resume'), false);

  const stream = buildStream();
  const interpreted = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: stream,
  });

  assert.deepEqual(interpreted, {
    ok: true,
    rawOutput: '{"schemaVersion":"solution-work-v1"}',
    threadRef: {
      provider: 'cursor',
      opaqueId: 'session-123',
    },
  });

  const missingInit = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: buildStream({ includeInit: false }),
  });
  assert.equal(missingInit.ok, false);
  if (!missingInit.ok) {
    assert.equal(missingInit.errorKind, 'invalid_output');
  }

  const missingResult = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: buildStream({ includeResult: false }),
  });
  assert.equal(missingResult.ok, false);
  if (!missingResult.ok) {
    assert.equal(missingResult.errorKind, 'invalid_output');
  }

  const malformed = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: buildStream({ malformedLine: '{not-json' }),
  });
  assert.equal(malformed.ok, false);
  if (!malformed.ok) {
    assert.equal(malformed.errorKind, 'invalid_output');
  }

  const continuationMismatch = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: buildStream({ initSessionId: 'session-999' }),
    expectedThreadRef: {
      provider: 'cursor',
      opaqueId: 'session-123',
    },
  });
  assert.equal(continuationMismatch.ok, false);
  if (!continuationMismatch.ok) {
    assert.equal(continuationMismatch.errorKind, 'continuation');
    assert.equal(
      continuationMismatch.message,
      'Cursor resumed session identity does not match the requested Participant thread',
    );
  }

  const eventSessionMismatch = interpretCursorCompletedOutput({
    job: solutionInput,
    stdout: buildStream({ assistantSessionId: 'session-999' }),
  });
  assert.equal(eventSessionMismatch.ok, false);
  if (!eventSessionMismatch.ok) {
    assert.equal(eventSessionMismatch.errorKind, 'invalid_output');
  }

  const participant = createCursorAgentParticipant({
    cursorExecutable: 'cursor',
  });

  assert.equal(participant.sameThreadContinuation?.provider, 'cursor');

  const resumeArgs = participant.sameThreadContinuation?.buildArgs(
    solutionInput,
    {
      provider: 'cursor',
      opaqueId: 'session-123',
    },
  );

  assert.ok(resumeArgs?.includes('--resume'));
  assert.ok(resumeArgs?.includes('session-123'));
  assert.ok(resumeArgs?.includes('--output-format'));
  assert.ok(resumeArgs?.includes('stream-json'));
  assert.ok(resumeArgs?.includes('--workspace'));
  assert.ok(resumeArgs?.includes(solutionInput.workspaceRoot));
  assert.equal(resumeArgs?.at(-1), solutionInput.prompt);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCursorAgentParticipantTests()
    .then(() => console.log('cursorAgentParticipant.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
