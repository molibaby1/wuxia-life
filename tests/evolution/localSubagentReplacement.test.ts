import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';
import { runImprovementHypothesis } from '../../scripts/evolution/runImprovementHypothesis';
import { NO_PROBLEM_JSON_EXAMPLE } from '../../scripts/evolution/improvementHypothesis/deepseekImprovementHypothesis';
import { DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS } from '../../scripts/evolution/problemAgnosticSolution/agentParticipant';

export async function runLocalSubagentReplacementTests(): Promise<void> {
  process.env.WUXIA_ENGINE_QUIET = '1';
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'the deterministic persona must exist');

  const outRoot = await mkdtemp(join(tmpdir(), 'local-subagent-replacement-'));
  const prompts: string[] = [];
  const participant = {
    executable: process.execPath,
    model: 'gpt-5.6-luna',
    reasoningEffort: 'high',
    bindingMetadata: {
      bindingId: 'TEST_LOCAL_BINDING',
      executableVersion: 'test-exec-1.0.0',
    },
    buildArgs: input => {
      prompts.push(input.prompt);
      let response: string;
      if (input.role === 'feedback') {
        response = JSON.stringify({ overallImpression: 'local feedback', observations: [] });
      } else {
        assert.ok(
          input.prompt.includes(NO_PROBLEM_JSON_EXAMPLE),
          'local participant must receive a usable zero-hypothesis example',
        );
        response = NO_PROBLEM_JSON_EXAMPLE;
      }
      return ['-e', `process.stdout.write(${JSON.stringify(response)})`];
    },
  };

  const feedback = await runMinimalExternalFeedback({
    runRef: 'local-subagent-feedback-001',
    persona,
    seed: 42,
    endAge: 1,
    catalogVersion: 'local-subagent-test',
    maxSteps: 20,
    outRoot,
    localParticipant: participant,
  });
  const feedbackInvocation = JSON.parse(
    await readFile(join(feedback.feedbackDir, 'invocation.json'), 'utf8'),
  );
  assert.equal(feedbackInvocation.participant.provider, 'codex-local-subagent');
  assert.equal(feedbackInvocation.participant.modelRequested, 'gpt-5.6-luna');
  assert.equal(feedbackInvocation.participant.reasoningEffort, 'high');
  assert.deepEqual(feedbackInvocation.participant.evidenceOnlyWorkspace.inputFiles, [
    'input/observable-payload.json',
  ]);
  assert.match(feedbackInvocation.participant.evidenceOnlyWorkspace.manifestSha256, /^[a-f0-9]{64}$/);
  assert.equal(feedbackInvocation.status, 'completed');
  assert.equal(feedbackInvocation.invocationRef, 'local-subagent-feedback-001-local-player-feedback-001');
  assert.equal(await pathExists(join(feedback.feedbackDir, 'participant-workspace/src')), false);
  assert.equal(
    await readFile(join(feedback.feedbackDir, 'participant-workspace/input/observable-payload.json'), 'utf8')
      .then(() => true),
    true,
  );

  const retainedPrompt = await readFile(join(feedback.feedbackDir, 'participant-prompt.txt'), 'utf8');
  assert.equal(retainedPrompt, prompts[0]);
  const binding = JSON.parse(
    await readFile(join(feedback.feedbackDir, 'participant-binding.json'), 'utf8'),
  ) as Record<string, unknown>;
  assert.equal(binding.schemaVersion, 'local-participant-binding-v1');
  assert.equal(binding.provider, 'codex-local-subagent');
  assert.equal(binding.bindingId, 'TEST_LOCAL_BINDING');
  assert.equal(binding.executable, process.execPath);
  assert.equal(binding.executableVersion, 'test-exec-1.0.0');
  assert.equal(binding.modelConfigured, 'gpt-5.6-luna');
  assert.equal(binding.modelResolution, 'EXPLICIT');
  assert.equal(binding.reasoningEffort, 'high');
  assert.equal(binding.timeoutMs, DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS);
  const bindingText = JSON.stringify(binding);
  assert.equal(bindingText.includes('env'), false);
  assert.equal(bindingText.includes('apiKey'), false);
  assert.equal(bindingText.includes('Authorization'), false);
  const successTrace = JSON.parse(
    await readFile(join(feedback.feedbackDir, 'participant-execution-trace.json'), 'utf8'),
  );
  assert.equal(successTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.equal(successTrace.terminal.outcome, 'completed');

  const hypothesis = await runImprovementHypothesis({
    runRef: 'local-subagent-feedback-001',
    sourceRoot: outRoot,
    outRoot,
    localParticipant: participant,
  });
  const hypothesisInvocation = JSON.parse(
    await readFile(join(hypothesis.hypothesisDir, 'invocation.json'), 'utf8'),
  );
  assert.equal(hypothesisInvocation.participant.provider, 'codex-local-subagent');
  assert.equal(hypothesisInvocation.participant.modelRequested, 'gpt-5.6-luna');
  assert.equal(hypothesisInvocation.participant.reasoningEffort, 'high');
  assert.deepEqual(hypothesisInvocation.participant.evidenceOnlyWorkspace.inputFiles, [
    'input/feedback.json',
    'input/observable-payload.json',
  ]);
  assert.match(hypothesisInvocation.participant.evidenceOnlyWorkspace.manifestSha256, /^[a-f0-9]{64}$/);
  assert.equal(hypothesisInvocation.status, 'completed');
  const storedHypotheses = JSON.parse(
    await readFile(join(hypothesis.hypothesisDir, 'hypotheses.json'), 'utf8'),
  );
  assert.equal(storedHypotheses.hypotheses.length, 0);
  assert.ok(storedHypotheses.noProblemAssessment.rationale);
  assert.deepEqual(storedHypotheses.noProblemAssessment.feedbackRefs, ['overallImpression']);
  assert.deepEqual(storedHypotheses.noProblemAssessment.evidenceRefs, []);
  assert.equal(
    await readFile(join(hypothesis.hypothesisDir, 'participant-workspace/input/feedback.json'), 'utf8')
      .then(() => true),
    true,
  );
  assert.equal(await pathExists(join(hypothesis.hypothesisDir, 'participant-workspace/src')), false);
  assert.equal(prompts.length, 2);
  assert.match(prompts[0]!, /Observable material/);
  assert.match(prompts[1]!, /Participant feedback/);

  const invalidRefOutRoot = await mkdtemp(join(tmpdir(), 'local-subagent-invalid-ref-'));
  const invalidRefJson = JSON.stringify({
    overallImpression: 'test',
    observations: [
      {
        feedback: 'invalid ref fixture',
        evidenceRefs: ['entry-999999'],
      },
    ],
  });
  const invalidRefParticipant = {
    executable: process.execPath,
    model: 'gpt-5.6-luna',
    reasoningEffort: 'high',
    bindingMetadata: {
      bindingId: 'TEST_LOCAL_BINDING',
      executableVersion: 'test-exec-1.0.0',
    },
    buildArgs: () => ['-e', `process.stdout.write(${JSON.stringify(invalidRefJson)})`],
  };
  await assert.rejects(
    () => runMinimalExternalFeedback({
      runRef: 'local-subagent-invalid-ref-001',
      persona,
      seed: 42,
      endAge: 1,
      catalogVersion: 'local-subagent-test',
      maxSteps: 20,
      outRoot: invalidRefOutRoot,
      localParticipant: invalidRefParticipant,
    }),
    /entry-999999|unknown entryId/,
  );
  const invalidFeedbackDir = join(
    invalidRefOutRoot,
    'feedback-runs',
    'local-subagent-invalid-ref-001',
  );
  for (const name of [
    'observable-payload.json',
    'raw-participant-response.txt',
    'participant-prompt.txt',
    'participant-binding.json',
    'participant-execution-trace.json',
    'invocation.json',
    'human-review.md',
  ]) {
    assert.equal(await pathExists(join(invalidFeedbackDir, name)), true, `missing ${name}`);
  }
  const invalidInvocation = JSON.parse(
    await readFile(join(invalidFeedbackDir, 'invocation.json'), 'utf8'),
  );
  assert.equal(invalidInvocation.status, 'failed');
  assert.equal(invalidInvocation.errorKind, 'invalid_reference');
  assert.ok(
    (await readFile(join(invalidFeedbackDir, 'raw-participant-response.txt'), 'utf8'))
      .includes('entry-999999'),
  );
  const invalidTrace = JSON.parse(
    await readFile(join(invalidFeedbackDir, 'participant-execution-trace.json'), 'utf8'),
  );
  assert.equal(invalidTrace.schemaVersion, 'participant-execution-trace-v1');
  assert.equal(invalidTrace.terminal.outcome, 'completed');
}

async function pathExists(path: string): Promise<boolean> {
  return readFile(path).then(() => true, () => false);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runLocalSubagentReplacementTests()
    .then(() => console.log('localSubagentReplacement.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
