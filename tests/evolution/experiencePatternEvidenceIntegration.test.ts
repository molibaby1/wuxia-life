import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  serializeObservablePayload,
  type ObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import { buildExperienceSemanticContext } from '../../src/evolution/experienceSemanticContext';
import type { ExperiencePatternEvidence } from '../../src/evolution/experiencePatternEvidenceContract';
import type { HeadlessApiPlayerSurfaceTrace } from '../../src/headless/playability/playerSurfaceCapture';
import { projectHeadlessApiPlayerObservablePayload } from '../../src/evolution/wuxiaPlayerObservableProjector';
import {
  buildInvestigationEvidence,
  investigationEvidenceRefs,
} from '../../scripts/evolution/hypothesisInvestigation/buildInvestigationEvidence';
import type { HypothesisInvestigationSource } from '../../scripts/evolution/hypothesisInvestigation/loadHypothesisInvestigationSource';
import type { ExternalFeedbackSource } from '../../scripts/evolution/improvementHypothesis/loadExternalFeedbackSource';

async function buildSource(): Promise<HypothesisInvestigationSource> {
  const root = await mkdtemp(join(tmpdir(), 'wuxia-pattern-investigation-'));
  const gameRunPath = join(root, 'game-run');
  await mkdir(join(gameRunPath, 'internal'), { recursive: true });
  await mkdir(join(gameRunPath, 'inputs'), { recursive: true });
  const surface: HeadlessApiPlayerSurfaceTrace = {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps: [{
      sequence: 1,
      kind: 'story_event',
      age: 16,
      experienceContext: buildExperienceSemanticContext({ age: 16, kind: 'story_event' }),
      storyEvent: { eventId: 'event-1', title: '早期经历', text: '玩家可见经历。' },
    }],
  };
  await writeFile(join(gameRunPath, 'internal', 'player-surface-source.json'), JSON.stringify(surface));
  await writeFile(join(gameRunPath, 'inputs', 'catalog.json'), JSON.stringify({
    schemaVersion: 'phase0-catalog-input-v1',
    events: [],
  }));

  const observablePayload: ObservablePayload = projectHeadlessApiPlayerObservablePayload(surface);
  const observablePayloadBytes = serializeObservablePayload(observablePayload);
  const feedback = {
    overallImpression: '有一段早期经历。',
    observations: [{ feedback: '观察。', evidenceRefs: ['entry-000001'] }],
  };
  const mefSource: ExternalFeedbackSource = {
    runRef: 'run-000001',
    feedbackInvocationRef: 'feedback-000001',
    experimentRootHash: 'a'.repeat(64),
    observablePayloadHash: 'b'.repeat(64),
    feedbackHash: 'c'.repeat(64),
    observablePayloadBytes,
    feedbackBytes: JSON.stringify(feedback),
    rawFeedbackParticipantResponse: JSON.stringify(feedback),
    observablePayload,
    feedback,
  };
  return {
    runRef: 'run-000001',
    hypothesisId: 'hypothesis-000001',
    feedbackInvocationRef: mefSource.feedbackInvocationRef,
    hypothesisInvocationRef: 'hypothesis-invocation-000001',
    experimentRootHash: mefSource.experimentRootHash,
    observablePayloadHash: mefSource.observablePayloadHash,
    feedbackHash: mefSource.feedbackHash,
    hypothesesHash: 'd'.repeat(64),
    selectedHypothesisHash: 'e'.repeat(64),
    selectedHypothesis: {
      hypothesisId: 'hypothesis-000001',
      hypothesis: '早期体验可能有重复模式。',
      observedBasis: '玩家可见经历。',
      feedbackRefs: ['observations[0]'],
      evidenceRefs: ['entry-000001'],
      unknowns: ['是否跨 run 重复。'],
      productSignificance: '用于调查。',
    },
    sourceHypothesesBytes: '{}',
    sourceHypothesisInvocationBytes: '{}',
    mefSource,
    gameRunPath,
  };
}

const patternEvidence: ExperiencePatternEvidence = {
  schemaVersion: 'experience-pattern-evidence-v1',
  patterns: [{
    patternId: 'pattern-000001',
    patternType: 'frequency',
    description: '重复出现的玩家可见体验语义。',
    supportingRuns: ['run-000001', 'run-000002'],
    evidenceRefs: ['run:run-000001:observable:entry-000001'],
    experienceContextRefs: ['run:run-000001:entry:entry-000001:experienceContext'],
  }],
};

export async function runExperiencePatternEvidenceIntegrationTests(): Promise<void> {
  const source = await buildSource();
  const withoutPattern = await buildInvestigationEvidence({ source });
  assert.equal(withoutPattern.schemaVersion, 'hypothesis-investigation-evidence-v1');
  assert.equal(investigationEvidenceRefs(withoutPattern).has('pattern:pattern-000001'), false);

  const withPattern = await buildInvestigationEvidence({ source, patternEvidence });
  const patternItem = withPattern.items.find(item => item.evidenceId === 'pattern:pattern-000001');
  assert.ok(patternItem);
  assert.equal(patternItem.kind, 'experience_pattern');
  assert.deepEqual(patternItem.payload, patternEvidence.patterns[0]);
  assert.equal(investigationEvidenceRefs(withPattern).has('pattern:pattern-000001'), true);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExperiencePatternEvidenceIntegrationTests()
    .then(() => console.log('experiencePatternEvidenceIntegration.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
