import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getP8PersonaById } from '../../src/p8/personas';
import { DEEPSEEK_PLAYER_EXPERIENCE_MODEL } from '../../scripts/evolution/externalFeedback/deepseekPlayerExperienceFeedback';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';
import { runMinimalExternalFeedback } from '../../scripts/evolution/runMinimalExternalFeedback';
import { loadExternalFeedbackSource } from '../../scripts/evolution/improvementHypothesis/loadExternalFeedbackSource';

const API_KEY = 'sk-test-key-not-real';

async function createCompletedSource(outRoot: string, runRef: string): Promise<{
  invocationRef: string;
  experimentRootHash: string;
  observablePayloadHash: string;
}> {
  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');

  const result = await runMinimalExternalFeedback(
    {
      runRef,
      persona,
      seed: 424242,
      endAge: 22,
      catalogVersion: 'default',
      maxSteps: 200,
      outRoot,
      apiKey: API_KEY,
    },
    {
      invoke: async () => ({
        ok: true,
        responseId: 'chatcmpl_source_001',
        model: DEEPSEEK_PLAYER_EXPERIENCE_MODEL,
        httpStatus: 200,
        rawProviderResponse: '{"id":"chatcmpl_source_001"}',
        rawParticipantResponse: JSON.stringify({
          overallImpression: '后半段让我有些重复感。',
          observations: [{
            feedback: '几段经历给我的感觉很像。',
            evidenceRefs: ['entry-000001'],
          }],
        }),
      }),
    },
  );

  return {
    invocationRef: result.invocationRef,
    experimentRootHash: result.experimentRootHash,
    observablePayloadHash: result.observablePayloadHash,
  };
}

export async function runImprovementHypothesisSourceTests(): Promise<void> {
  const outRoot = await mkdtemp(join(tmpdir(), 'wuxia-hyp-source-'));
  const runRef = 'hypothesis-source-001';
  const created = await createCompletedSource(outRoot, runRef);

  const source = await loadExternalFeedbackSource({ sourceRoot: outRoot, runRef });
  assert.equal(source.runRef, runRef);
  assert.equal(source.feedbackInvocationRef, created.invocationRef);
  assert.equal(source.experimentRootHash, created.experimentRootHash);
  assert.equal(source.observablePayloadHash, created.observablePayloadHash);

  const feedbackObservableBytes = await readFile(
    join(outRoot, 'feedback-runs', runRef, 'observable-payload.json'),
    'utf8',
  );
  assert.equal(source.observablePayloadBytes, feedbackObservableBytes);
  assert.equal(sha256Hex(source.observablePayloadBytes), source.observablePayloadHash);
  assert.equal(source.feedbackHash, sha256Hex(source.feedbackBytes));

  const rawFeedback = JSON.parse(source.rawFeedbackParticipantResponse);
  const structuredFeedback = JSON.parse(source.feedbackBytes);
  assert.equal(canonicalJson(rawFeedback), canonicalJson(structuredFeedback));
  assert.equal(canonicalJson(source.feedback), canonicalJson(structuredFeedback));

  const invocationPath = join(outRoot, 'feedback-runs', runRef, 'invocation.json');
  const invocation = JSON.parse(await readFile(invocationPath, 'utf8')) as Record<string, unknown>;
  await writeFile(
    invocationPath,
    canonicalJson({ ...invocation, status: 'failed' }),
  );
  await assert.rejects(
    () => loadExternalFeedbackSource({ sourceRoot: outRoot, runRef }),
    /completed|status/i,
  );
  await writeFile(invocationPath, canonicalJson(invocation));

  const feedbackPayloadPath = join(outRoot, 'feedback-runs', runRef, 'observable-payload.json');
  const originalPayload = await readFile(feedbackPayloadPath, 'utf8');
  await writeFile(feedbackPayloadPath, `${originalPayload.slice(0, -1)} `);
  await assert.rejects(
    () => loadExternalFeedbackSource({ sourceRoot: outRoot, runRef }),
    /hash|mismatch|exact/i,
  );
  await writeFile(feedbackPayloadPath, originalPayload);

  const feedbackPath = join(outRoot, 'feedback-runs', runRef, 'feedback.json');
  const originalFeedback = await readFile(feedbackPath, 'utf8');
  const tamperedFeedback = JSON.parse(originalFeedback) as {
    overallImpression: string;
    observations: Array<{ feedback: string; evidenceRefs: string[] }>;
  };
  tamperedFeedback.overallImpression = `${tamperedFeedback.overallImpression}（被篡改）`;
  await writeFile(feedbackPath, canonicalJson(tamperedFeedback));
  await assert.rejects(
    () => loadExternalFeedbackSource({ sourceRoot: outRoot, runRef }),
    /does not match raw participant response/i,
  );
  await writeFile(feedbackPath, originalFeedback);

  const rawPath = join(outRoot, 'feedback-runs', runRef, 'raw-participant-response.txt');
  const originalRaw = await readFile(rawPath, 'utf8');
  const badEvidence = {
    overallImpression: '后半段让我有些重复感。',
    observations: [{
      feedback: '几段经历给我的感觉很像。',
      evidenceRefs: ['entry-999999'],
    }],
  };
  await writeFile(rawPath, JSON.stringify(badEvidence));
  await writeFile(feedbackPath, canonicalJson(badEvidence));
  await assert.rejects(
    () => loadExternalFeedbackSource({ sourceRoot: outRoot, runRef }),
    /entry-999999|unknown entryId/i,
  );
  await writeFile(rawPath, originalRaw);
  await writeFile(feedbackPath, originalFeedback);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runImprovementHypothesisSourceTests()
    .then(() => console.log('improvementHypothesisSource.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
