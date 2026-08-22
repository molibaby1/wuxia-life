import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';
import { runImprovementHypothesis } from '../../scripts/evolution/runImprovementHypothesis';

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
    buildArgs: input => {
      prompts.push(input.prompt);
      const response = input.role === 'feedback'
        ? JSON.stringify({ overallImpression: 'local feedback', observations: [] })
        : JSON.stringify({ hypotheses: [] });
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
  assert.equal(
    await readFile(join(hypothesis.hypothesisDir, 'participant-workspace/input/feedback.json'), 'utf8')
      .then(() => true),
    true,
  );
  assert.equal(await pathExists(join(hypothesis.hypothesisDir, 'participant-workspace/src')), false);
  assert.equal(prompts.length, 2);
  assert.match(prompts[0]!, /Observable material/);
  assert.match(prompts[1]!, /Participant feedback/);
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
