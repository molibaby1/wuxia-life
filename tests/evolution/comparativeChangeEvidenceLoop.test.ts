import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  serializeObservablePayload,
  type ObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import {
  DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
  type DeepSeekComparativeExperienceFailure,
  type DeepSeekComparativeExperienceSuccess,
} from '../../scripts/evolution/comparativeFeedback/deepseekComparativeExperienceFeedback';
import { runComparativeChangeEvidence } from '../../scripts/evolution/runComparativeChangeEvidence';
import {
  sealPhase0Run,
  sha256Hex,
  validatePhase0RunSeal,
} from '../../scripts/evolution/phase0/provenance';

const API_KEY = 'sk-test-key-not-real';
const FORBIDDEN_INVOCATION_FIELDS = [
  'winner',
  'score',
  'rating',
  'confidence',
  'severity',
  'priority',
  'promotion',
  'participantQuality',
  'qualification',
];
const FORBIDDEN_PROVIDER_INPUT_MARKERS = [
  'internal/player-surface-source.json',
  'provenance/experiment-envelope.json',
  'provenance/source-fingerprint.json',
  'inputs/run-input.json',
  'inputs/persona.json',
  'inputs/catalog.json',
  'baseline',
  'candidate',
];

type Capture = {
  callCount: number;
  experienceAPayloadBytes?: string;
  experienceBPayloadBytes?: string;
  invocationRef?: string;
};

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
  capture: Capture,
): (input: {
  apiKey: string;
  invocationRef: string;
  experienceAPayloadBytes: string;
  experienceBPayloadBytes: string;
}) => Promise<DeepSeekComparativeExperienceSuccess | DeepSeekComparativeExperienceFailure> {
  const rawProviderResponse = JSON.stringify({
    id: 'chatcmpl_cmp_loop_001',
    object: 'chat.completion',
    model: DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
    choices: [{
      index: 0,
      message: { role: 'assistant', content: participantJson },
      finish_reason: 'stop',
    }],
  });
  return async input => {
    capture.callCount += 1;
    capture.experienceAPayloadBytes = input.experienceAPayloadBytes;
    capture.experienceBPayloadBytes = input.experienceBPayloadBytes;
    capture.invocationRef = input.invocationRef;
    return {
      ok: true,
      responseId: 'chatcmpl_cmp_loop_001',
      model: DEEPSEEK_COMPARATIVE_EXPERIENCE_MODEL,
      httpStatus: 200,
      rawProviderResponse,
      rawParticipantResponse: participantJson,
    };
  };
}

async function writeSealedPhase0Run(input: {
  root: string;
  runRef: string;
  payload: ObservablePayload;
  personaBytes?: string;
}): Promise<{ runPath: string; experimentRootHash: string; observablePayloadHash: string }> {
  const runPath = join(input.root, input.runRef);
  await mkdir(runPath, { recursive: true });
  const observablePayloadBytes = serializeObservablePayload(input.payload);
  const observablePayloadHash = sha256Hex(observablePayloadBytes);
  const files: Record<string, string> = {
    'inputs/run-input.json': JSON.stringify({
      schemaVersion: 'phase0-run-input-v1',
      runRef: input.runRef,
      seed: 101,
      endAge: 2,
    }),
    'inputs/persona.json': input.personaBytes ?? '{"id":"fixture-persona"}',
    'inputs/catalog.json': '{"schemaVersion":"phase0-catalog-input-v1","events":[]}',
    'provenance/source-fingerprint.json': '{"schemaVersion":"phase0-source-fingerprint-v1","headSha":"abc","branch":"x","worktreeEntries":[]}',
    'internal/player-surface-source.json': '{"hidden":true}',
    'reviewer-input/observable-payload.json': observablePayloadBytes,
    'provenance/experiment-envelope.json': JSON.stringify({
      envelopeVersion: 'phase0-experiment-envelope-v1',
      runRef: input.runRef,
      observablePayloadHash,
    }),
    'provenance/phase0-run-data-access-manifest.json': '{"schemaVersion":"phase0-run-data-access-manifest-v1"}',
  };
  for (const [relativePath, contents] of Object.entries(files)) {
    const absolutePath = join(runPath, relativePath);
    await mkdir(join(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, contents);
  }
  const sealed = await sealPhase0Run(runPath, input.runRef);
  return {
    runPath,
    experimentRootHash: sealed.experimentRootHash,
    observablePayloadHash,
  };
}

function makePayload(transcriptId: string, body: string, extraEntryId?: string): ObservablePayload {
  const entries: ObservablePayload['entries'] = [{
    entryId: 'entry-000001',
    kind: 'story_event',
    title: '降生武侠世家',
    body,
  }];
  if (extraEntryId) {
    entries.push({
      entryId: extraEntryId,
      kind: 'story_event',
      body: '仅一侧额外条目',
    });
  }
  return {
    transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
    surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
    transcriptId,
    entries,
  };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }
}

export async function runComparativeChangeEvidenceLoopTests(): Promise<void> {
  await testHappyPathWithFakeInvoke();
  await testInvalidReferencePreservesRawAndFails();
}

async function testHappyPathWithFakeInvoke(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-cmp-ok-'));
  const runsRoot = join(root, 'runs');
  const outRoot = join(root, 'out');

  const baseline = await writeSealedPhase0Run({
    root: runsRoot,
    runRef: 'ae-skeleton-003-baseline',
    payload: makePayload('transcript-a', '基线出生文本。'),
    personaBytes: '{"id":"same-persona-bytes"}',
  });
  const candidate = await writeSealedPhase0Run({
    root: runsRoot,
    runRef: 'ae-skeleton-003-candidate',
    payload: makePayload('transcript-b', '基线出生文本。家中长辈常在夜里讲述江湖旧事。'),
    personaBytes: '{"id":"same-persona-bytes"}',
  });

  await validatePhase0RunSeal(baseline.runPath, baseline.experimentRootHash);
  await validatePhase0RunSeal(candidate.runPath, candidate.experimentRootHash);

  const capture: Capture = { callCount: 0 };
  const participant = {
    overallComparison: 'B 多了一句夜里旧事，我主观上更有江湖感。',
    observations: [{
      comparison: '两边都是 entry-000001，但正文不同。',
      experienceARefs: ['entry-000001'],
      experienceBRefs: ['entry-000001'],
    }],
  };
  const participantJson = JSON.stringify(participant);

  const result = await runComparativeChangeEvidence(
    {
      baselineRunPath: baseline.runPath,
      candidateRunPath: candidate.runPath,
      baselineExperimentRootHash: baseline.experimentRootHash,
      candidateExperimentRootHash: candidate.experimentRootHash,
      outRoot,
      apiKey: API_KEY,
    },
    { invoke: successInvoke(participantJson, capture) },
  );

  assert.equal(capture.callCount, 1);
  assert.equal(result.status, 'completed');
  assert.equal(result.baselineRunRef, 'ae-skeleton-003-baseline');
  assert.equal(result.candidateRunRef, 'ae-skeleton-003-candidate');
  assert.equal(result.invocationRef, 'ae-skeleton-003-comparative-001');
  assert.equal(capture.invocationRef, 'ae-skeleton-003-comparative-001');

  const baselineBytes = await readFile(
    join(baseline.runPath, 'reviewer-input', 'observable-payload.json'),
    'utf8',
  );
  const candidateBytes = await readFile(
    join(candidate.runPath, 'reviewer-input', 'observable-payload.json'),
    'utf8',
  );
  assert.equal(capture.experienceAPayloadBytes, baselineBytes);
  assert.equal(capture.experienceBPayloadBytes, candidateBytes);
  assert.equal(
    await readFile(join(result.comparisonDir, 'experience-a-observable-payload.json'), 'utf8'),
    baselineBytes,
  );
  assert.equal(
    await readFile(join(result.comparisonDir, 'experience-b-observable-payload.json'), 'utf8'),
    candidateBytes,
  );

  for (const marker of FORBIDDEN_PROVIDER_INPUT_MARKERS) {
    assert.equal(
      capture.experienceAPayloadBytes?.includes(marker),
      false,
      `Experience A leaked ${marker}`,
    );
    assert.equal(
      capture.experienceBPayloadBytes?.includes(marker),
      false,
      `Experience B leaked ${marker}`,
    );
  }

  const invocation = JSON.parse(
    await readFile(join(result.comparisonDir, 'invocation.json'), 'utf8'),
  ) as Record<string, unknown>;
  assert.equal(invocation.status, 'completed');
  assert.deepEqual(invocation.experienceMapping, { A: 'baseline', B: 'candidate' });
  assert.deepEqual(
    (invocation.participant as { thinking: unknown }).thinking,
    { type: 'disabled' },
  );
  const invocationKeys = collectObjectKeys(invocation);
  for (const forbidden of FORBIDDEN_INVOCATION_FIELDS) {
    assert.equal(invocationKeys.has(forbidden), false, `invocation leaked ${forbidden}`);
  }

  const feedback = JSON.parse(
    await readFile(join(result.comparisonDir, 'comparative-feedback.json'), 'utf8'),
  );
  assert.deepEqual(feedback, participant);

  const report = await readFile(result.humanReportPath, 'utf8');
  assert.match(report, /ae-skeleton-003-baseline/);
  assert.match(report, /ae-skeleton-003-candidate/);
  assert.match(report, /Experience A = baseline; Experience B = candidate/);
  assert.match(report, /基线出生文本/);
  assert.match(report, /家中长辈常在夜里讲述江湖旧事/);
  assert.match(report, /主观比较意见/);
  assert.match(report, /STOP/);
  assert.ok(report.includes(participantJson));
  assert.equal(await readFile(join(result.comparisonDir, 'raw-participant-response.txt'), 'utf8'), participantJson);
}

async function testInvalidReferencePreservesRawAndFails(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-cmp-bad-'));
  const runsRoot = join(root, 'runs');
  const outRoot = join(root, 'out');

  const baseline = await writeSealedPhase0Run({
    root: runsRoot,
    runRef: 'cmp-bad-baseline',
    payload: makePayload('transcript-a', 'A'),
  });
  const candidate = await writeSealedPhase0Run({
    root: runsRoot,
    runRef: 'cmp-bad-candidate',
    // Same entry-000001 on both sides; invalid A ref must fail against A only.
    payload: makePayload('transcript-b', 'B', 'entry-000002'),
  });

  const capture: Capture = { callCount: 0 };
  const participantJson = JSON.stringify({
    overallComparison: '引用错误。',
    observations: [{
      comparison: 'A 引用了不存在的 entry。',
      experienceARefs: ['entry-000002'],
      experienceBRefs: ['entry-000001'],
    }],
  });

  await assert.rejects(
    () => runComparativeChangeEvidence(
      {
        baselineRunPath: baseline.runPath,
        candidateRunPath: candidate.runPath,
        baselineExperimentRootHash: baseline.experimentRootHash,
        candidateExperimentRootHash: candidate.experimentRootHash,
        outRoot,
        apiKey: API_KEY,
      },
      { invoke: successInvoke(participantJson, capture) },
    ),
    /experienceARefs.*entry-000002|unknown entryId/,
  );

  assert.equal(capture.callCount, 1);
  const comparisonDir = join(outRoot, 'ae-skeleton-003-comparison');
  assert.equal(
    await readFile(join(comparisonDir, 'raw-participant-response.txt'), 'utf8'),
    participantJson,
  );
  assert.equal(await pathExists(join(comparisonDir, 'raw-provider-response.txt')), true);
  await assert.rejects(
    () => readFile(join(comparisonDir, 'comparative-feedback.json'), 'utf8'),
    /ENOENT/,
  );
  const invocation = JSON.parse(await readFile(join(comparisonDir, 'invocation.json'), 'utf8')) as {
    status: string;
    errorKind: string;
  };
  assert.equal(invocation.status, 'failed');
  assert.equal(invocation.errorKind, 'invalid_reference');
  const report = await readFile(join(comparisonDir, 'human-review.md'), 'utf8');
  assert.match(report, /STOP/);
  assert.match(report, /failed/);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runComparativeChangeEvidenceLoopTests()
    .then(() => console.log('comparativeChangeEvidenceLoop.test.ts: ok'))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
