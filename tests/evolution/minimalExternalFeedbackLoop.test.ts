import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ObservablePayload } from '../../src/evolution/playerObservableTranscript';
import { getP8PersonaById } from '../../src/p8/personas';
import {
  DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
  type DeepSeekPlayerExperienceFailure,
  type DeepSeekPlayerExperienceSuccess,
} from '../../scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback';
import { sha256Hex, validatePhase0RunSeal } from '../../scripts/evolution/phase0/provenance';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';

const API_KEY = 'sk-test-key-not-real';
const FORBIDDEN_INVOCATION_FIELDS = [
  'participantQuality',
  'qualification',
  'confidence',
  'correctness',
];
const FORBIDDEN_PROVIDER_INPUT_MARKERS = [
  'internal/player-surface-source.json',
  'provenance/experiment-envelope.json',
  'provenance/source-fingerprint.json',
  'inputs/run-input.json',
  'inputs/persona.json',
  'inputs/catalog.json',
  'oracle_effect_score_v1',
];

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

function collectObjectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const child of value) collectObjectKeys(child, keys);
    return keys;
  }
  if (!value || typeof value !== 'object') return keys;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectObjectKeys(child, keys);
  }
  return keys;
}

function successInvoke(
  participantJson: string,
  capture: { payloadBytes?: string; invocationRef?: string },
): (input: {
  apiKey: string;
  invocationRef: string;
  observablePayloadBytes: string;
}) => Promise<DeepSeekPlayerExperienceSuccess | DeepSeekPlayerExperienceFailure> {
  const rawProviderResponse = JSON.stringify({
    id: 'chatcmpl_test_001',
    object: 'chat.completion',
    model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: participantJson },
      finish_reason: 'stop',
    }],
  });
  return async input => {
    capture.payloadBytes = input.observablePayloadBytes;
    capture.invocationRef = input.invocationRef;
    return {
      ok: true,
      responseId: 'chatcmpl_test_001',
      model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
      httpStatus: 200,
      rawProviderResponse,
      rawParticipantResponse: participantJson,
    };
  };
}

export async function runMinimalExternalFeedbackLoopTests(): Promise<void> {
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-mef-loop-'));
  const shared = {
    persona,
    seed: 101,
    endAge: 2,
    catalogVersion: '1.0.0',
    maxSteps: 120,
    outRoot,
    apiKey: API_KEY,
  } as const;

  await testHappyPathWithBoringSubjective(shared);
  await testInvalidEvidenceRefPreservesRawAndFails(shared);
}

async function testHappyPathWithBoringSubjective(shared: {
  persona: NonNullable<ReturnType<typeof getP8PersonaById>>;
  seed: number;
  endAge: number;
  catalogVersion: string;
  maxSteps: number;
  outRoot: string;
  apiKey: string;
}): Promise<void> {
  const runRef = 'mef-ok';
  const capture: { payloadBytes?: string; invocationRef?: string } = {};
  const participant = {
    overallImpression: '整个过程非常无聊',
    observations: [{
      feedback: '这一段让我记得很清楚。',
      evidenceRefs: ['entry-000001'],
    }],
  };
  const participantJson = JSON.stringify(participant);

  const result = await runMinimalExternalFeedback(
    { ...shared, runRef },
    { invoke: successInvoke(participantJson, capture) },
  );

  const expectedInvocationRef = `${runRef}-deepseek-player-feedback-001`;
  assert.equal(result.runRef, runRef);
  assert.equal(result.invocationRef, expectedInvocationRef);
  assert.equal(capture.invocationRef, expectedInvocationRef);
  assert.equal(result.phase0RunPath, join(shared.outRoot, 'game-runs', runRef));
  assert.equal(result.feedbackDir, join(shared.outRoot, 'feedback-runs', runRef));
  assert.equal(result.humanReportPath, join(result.feedbackDir, 'human-review.md'));

  await validatePhase0RunSeal(result.phase0RunPath, result.experimentRootHash);

  const phase0PayloadPath = join(result.phase0RunPath, 'reviewer-input', 'observable-payload.json');
  const phase0PayloadBytes = await readFile(phase0PayloadPath, 'utf8');
  const copiedPayloadBytes = await readFile(join(result.feedbackDir, 'observable-payload.json'), 'utf8');
  assert.equal(copiedPayloadBytes, phase0PayloadBytes);
  assert.equal(sha256Hex(copiedPayloadBytes), result.observablePayloadHash);
  assert.equal(capture.payloadBytes, phase0PayloadBytes);

  for (const marker of FORBIDDEN_PROVIDER_INPUT_MARKERS) {
    assert.equal(
      capture.payloadBytes?.includes(marker),
      false,
      `provider input leaked ${marker}`,
    );
  }
  assert.equal(capture.payloadBytes?.includes(shared.persona.id), false, 'provider input leaked persona identity');
  assert.ok(capture.payloadBytes?.startsWith('{"transcriptVersion"'), 'provider must receive observable payload bytes only');

  const payload = JSON.parse(copiedPayloadBytes) as ObservablePayload;
  assert.ok(payload.entries.length > 0, 'real Phase 0 must produce at least one observable entry');
  assert.equal(payload.entries[0]?.entryId, 'entry-000001');

  const invocation = JSON.parse(await readFile(join(result.feedbackDir, 'invocation.json'), 'utf8')) as Record<string, unknown>;
  assert.equal(invocation.runRef, runRef);
  assert.equal(invocation.invocationRef, expectedInvocationRef);
  assert.equal(invocation.experimentRootHash, result.experimentRootHash);
  assert.equal(invocation.observablePayloadHash, result.observablePayloadHash);
  assert.equal(invocation.status, 'completed');
  const invocationKeys = collectObjectKeys(invocation);
  for (const forbidden of FORBIDDEN_INVOCATION_FIELDS) {
    assert.equal(invocationKeys.has(forbidden), false, `invocation leaked ${forbidden}`);
  }
  assert.doesNotMatch(JSON.stringify(invocation), /sk-test-key-not-real/);

  const rawProvider = await readFile(join(result.feedbackDir, 'raw-provider-response.txt'), 'utf8');
  const rawParticipant = await readFile(join(result.feedbackDir, 'raw-participant-response.txt'), 'utf8');
  assert.equal(rawParticipant, participantJson);
  assert.ok(rawProvider.includes('chatcmpl_test_001'));

  const feedback = JSON.parse(await readFile(join(result.feedbackDir, 'feedback.json'), 'utf8'));
  assert.deepEqual(feedback, participant);

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, new RegExp(runRef));
  assert.match(report, new RegExp(expectedInvocationRef));
  assert.match(report, new RegExp(result.observablePayloadHash));
  assert.match(report, new RegExp(result.experimentRootHash));
  assert.match(report, /deepseek/);
  assert.match(report, /deepseek-v4-flash/);
  assert.match(report, /completed/);
  assert.match(report, /反馈为该参与者的主观意见，未经过体验正确率\/资格评分/);
  assert.match(report, /整个过程非常无聊/);
  assert.ok(report.includes(participantJson), 'human report must include raw participant response');
  const firstEntry = payload.entries[0]!;
  if (firstEntry.title) assert.ok(report.includes(firstEntry.title));
  if (firstEntry.body) assert.ok(report.includes(firstEntry.body));
  if (firstEntry.visibleOutcome) assert.ok(report.includes(firstEntry.visibleOutcome));
  for (const line of firstEntry.visibleFeedbackLines ?? []) {
    assert.ok(report.includes(line));
  }
  for (const choice of firstEntry.visibleChoices ?? []) {
    assert.ok(report.includes(choice.label));
  }
}

async function testInvalidEvidenceRefPreservesRawAndFails(shared: {
  persona: NonNullable<ReturnType<typeof getP8PersonaById>>;
  seed: number;
  endAge: number;
  catalogVersion: string;
  maxSteps: number;
  outRoot: string;
  apiKey: string;
}): Promise<void> {
  const runRef = 'mef-bad-ref';
  const capture: { payloadBytes?: string; invocationRef?: string } = {};
  const participantJson = JSON.stringify({
    overallImpression: '前面几次变化让我有参与感，后面有一点重复。',
    observations: [{
      feedback: '这一段让我记得很清楚。',
      evidenceRefs: ['entry-999999'],
    }],
  });

  await assert.rejects(
    () => runMinimalExternalFeedback(
      { ...shared, runRef },
      { invoke: successInvoke(participantJson, capture) },
    ),
    /entry-999999|unknown entryId/,
  );

  const phase0RunPath = join(shared.outRoot, 'game-runs', runRef);
  const feedbackDir = join(shared.outRoot, 'feedback-runs', runRef);
  const experimentRootHash = await readFile(join(phase0RunPath, 'experiment-root.sha256'), 'utf8');
  await validatePhase0RunSeal(phase0RunPath, experimentRootHash);
  const envelope = JSON.parse(
    await readFile(join(phase0RunPath, 'provenance', 'experiment-envelope.json'), 'utf8'),
  ) as { observablePayloadHash: string };

  const copiedPayloadBytes = await readFile(join(feedbackDir, 'observable-payload.json'), 'utf8');
  const phase0PayloadBytes = await readFile(
    join(phase0RunPath, 'reviewer-input', 'observable-payload.json'),
    'utf8',
  );
  assert.equal(copiedPayloadBytes, phase0PayloadBytes);
  assert.equal(sha256Hex(copiedPayloadBytes), envelope.observablePayloadHash);
  assert.equal(capture.payloadBytes, phase0PayloadBytes);

  assert.equal(await readFile(join(feedbackDir, 'raw-participant-response.txt'), 'utf8'), participantJson);
  assert.equal(await pathExists(join(feedbackDir, 'raw-provider-response.txt')), true);
  assert.equal(await pathExists(join(feedbackDir, 'feedback.json')), false, 'must not write successful feedback.json');

  const invocation = JSON.parse(await readFile(join(feedbackDir, 'invocation.json'), 'utf8')) as Record<string, unknown>;
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.runRef, runRef);
  assert.equal(invocation.invocationRef, `${runRef}-deepseek-player-feedback-001`);
  assert.equal(invocation.observablePayloadHash, envelope.observablePayloadHash);
  const invocationKeys = collectObjectKeys(invocation);
  for (const forbidden of FORBIDDEN_INVOCATION_FIELDS) {
    assert.equal(invocationKeys.has(forbidden), false, `failed invocation leaked ${forbidden}`);
  }

  const report = await readFile(join(feedbackDir, 'human-review.md'), 'utf8');
  assert.match(report, /failed/);
  assert.ok(report.includes(participantJson));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMinimalExternalFeedbackLoopTests()
    .then(() => console.log('minimalExternalFeedbackLoop.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
