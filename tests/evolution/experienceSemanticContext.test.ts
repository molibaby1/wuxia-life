import assert from 'node:assert/strict';
import {
  EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION,
  buildExperienceSemanticContext,
  serializeExperienceSemanticContext,
  validateExperienceSemanticContext,
} from '../../src/evolution/experienceSemanticContext';
import {
  HEADLESS_API_PLAYER_SURFACE_ID,
  PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
  serializeObservablePayload,
} from '../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../src/evolution/wuxiaPlayerObservableProjector';
import type { HeadlessApiPlayerSurfaceTrace } from '../../src/headless/playability/playerSurfaceCapture';
import { getP8PersonaById } from '../../src/p8/personas';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import {
  buildSolutionAgentPrompt,
} from '../../scripts/evolution/problemAgnosticSolution/runSolutionAgent';
import {
  buildSolutionReviewerPrompt,
} from '../../scripts/evolution/problemAgnosticSolution/runSolutionReviewer';
import type { ProblemPackageV1 } from '../../src/evolution/problemPackageContract';
import type { SolutionWorkV1 } from '../../src/evolution/solutionWorkContract';

const context = buildExperienceSemanticContext({ age: 16, kind: 'story_event' });

const problemPackage: ProblemPackageV1 = {
  schemaVersion: 'problem-package-v1',
  problemId: 'problem-000001',
  source: {
    runRef: 'run-000001',
    observablePayloadRef: 'source/observable-payload.json',
    externalFeedbackRef: 'feedback.json',
    improvementHypothesisRef: 'hypothesis.json',
  },
  problem: {
    hypothesisId: 'hypothesis-000001',
    statement: 'A bounded player-observable problem.',
    observedBasis: 'Observed in the player surface.',
    feedbackRefs: ['observations[0]'],
    evidenceRefs: ['entry-000001'],
    unknowns: ['An unknown.'],
    productSignificance: 'It matters to the player experience.',
  },
  authorityRefs: ['docs/product/auto-evolution-model.md'],
  productSourceFingerprintSha256: 'a'.repeat(64),
  permissions: {
    authoritativeProductWrite: false,
    sandboxWrite: true,
    productExecution: false,
    codeExecution: false,
  },
};

const solutionWork: SolutionWorkV1 = {
  schemaVersion: 'solution-work-v1',
  status: 'OPTIONS',
  problemId: problemPackage.problemId,
  options: [],
  recommendedOptionId: null,
  summary: 'No option is needed for this prompt test.',
  repoRefs: [],
  artifactRefs: [],
};

export async function runExperienceSemanticContextTests(): Promise<void> {
  assert.equal(context.schemaVersion, EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION);
  assert.equal(context.experienceCategory, 'narrative');
  assert.equal(context.lifeStageMeaning, '早期成长：形成出身、习惯与最初方向。');
  assert.deepEqual(context.semanticSource, {
    type: 'experience-context-builder',
    ref: 'stage:stage_10_20;surface:story_event',
  });
  assert.ok(context.expectedExperienceSignals.includes('route_entry'));
  assert.ok(context.expectedExperienceSignals.includes('visible_story_event'));
  assert.equal(Object.keys(context).includes('age'), false);
  assert.equal(Object.keys(context).includes('flags'), false);

  const age20 = buildExperienceSemanticContext({ age: 20, kind: 'story_event' });
  assert.equal(age20.lifeStageMeaning, '中期发展：路线与关系开始分化。');
  assert.deepEqual(age20.semanticSource, {
    type: 'experience-context-builder',
    ref: 'stage:stage_20_30;surface:story_event',
  });
  assert.ok(age20.expectedExperienceSignals.includes('route_reinforcement'));
  assert.equal(age20.expectedExperienceSignals.includes('continuity'), false);

  const age30 = buildExperienceSemanticContext({ age: 30, kind: 'active_action_result' });
  assert.equal(age30.lifeStageMeaning, '中年成就：身份与阶段成果逐步落地。');
  assert.deepEqual(age30.semanticSource, {
    type: 'experience-context-builder',
    ref: 'stage:stage_30_40;surface:active_action_result',
  });

  const age41 = buildExperienceSemanticContext({ age: 41, kind: 'period_summary' });
  assert.equal(age41.lifeStageMeaning, '中年成就：身份与阶段成果逐步落地。');
  assert.deepEqual(age41.semanticSource, {
    type: 'experience-context-builder',
    ref: 'stage:none;surface:period_summary',
  });
  assert.deepEqual(age41.expectedExperienceSignals, ['period_reflection']);

  const age56 = buildExperienceSemanticContext({ age: 56, kind: 'passive_narrative' });
  assert.equal(age56.lifeStageMeaning, '晚年传承：回顾投入并形成延续意义。');
  assert.deepEqual(age56.expectedExperienceSignals, ['passive_progression']);

  assert.deepEqual(
    validateExperienceSemanticContext(JSON.parse(serializeExperienceSemanticContext(context))),
    context,
  );
  const legacyContext = {
    schemaVersion: EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION,
    experienceCategory: 'narrative' as const,
    expectedExperienceSignals: ['visible_story_event'],
  };
  assert.deepEqual(validateExperienceSemanticContext(legacyContext), legacyContext);
  assert.equal(
    serializeExperienceSemanticContext(legacyContext),
    '{"schemaVersion":"experience-semantic-context-v1","experienceCategory":"narrative","expectedExperienceSignals":["visible_story_event"]}',
  );
  assert.throws(
    () => validateExperienceSemanticContext({ ...context, hiddenFlags: ['secret'] }),
    /unknown field.*hiddenFlags/i,
  );
  assert.throws(
    () => validateExperienceSemanticContext({ ...context, qualityScore: 0.9 }),
    /unknown field.*qualityScore/i,
  );
  assert.throws(
    () => validateExperienceSemanticContext({ ...context, solutionRecommendation: 'change it' }),
    /unknown field.*solutionRecommendation/i,
  );
  assert.throws(
    () => validateExperienceSemanticContext({
      ...context,
      semanticSource: { ...context.semanticSource, hiddenFlags: ['secret'] },
    }),
    /unknown field.*hiddenFlags/i,
  );

  const oldPayloadBytes = serializeObservablePayload({
    transcriptVersion: PLAYER_OBSERVABLE_TRANSCRIPT_VERSION,
    surfaceId: HEADLESS_API_PLAYER_SURFACE_ID,
    transcriptId: 'transcript-legacy',
    entries: [{ entryId: 'entry-000001', kind: 'story_event', body: '旧 artifact。' }],
  });
  assert.equal(
    oldPayloadBytes,
    '{"transcriptVersion":"player-observable-v1","surfaceId":"headless-api-player-v1","transcriptId":"transcript-legacy","entries":[{"entryId":"entry-000001","kind":"story_event","body":"旧 artifact。"}]}',
  );

  const source: HeadlessApiPlayerSurfaceTrace = {
    schemaVersion: 'headless-api-player-surface-source-v1',
    steps: [{
      sequence: 1,
      kind: 'story_event',
      age: 16,
      experienceContext: context,
      storyEvent: { eventId: 'internal-event', title: '山门抉择', text: '玩家可见经历。' },
    }],
  };
  const projected = projectHeadlessApiPlayerObservablePayload(source);
  assert.deepEqual(projected.entries[0]?.experienceContext, context);
  const projectedBytes = serializeObservablePayload(projected);
  assert.match(projectedBytes, /experienceContext/);
  assert.doesNotMatch(projectedBytes, /internal-event/);
  assert.doesNotMatch(projectedBytes, /hiddenFlags|qualityScore|solutionRecommendation/);

  const solutionPrompt = buildSolutionAgentPrompt(problemPackage, []);
  const reviewerPrompt = buildSolutionReviewerPrompt(problemPackage, solutionWork, []);
  for (const prompt of [solutionPrompt, reviewerPrompt]) {
    assert.match(prompt, /experience semantic context/i);
    assert.match(prompt, /player-observable meaning/i);
    assert.match(prompt, /source\/observable-payload\.json/);
    assert.match(prompt, /must not treat.*solution recommendation/i);
  }

  const persona = getP8PersonaById('p8-martial-lin');
  assert.ok(persona, 'p8-martial-lin must exist');
  const run = await runHeadlessPersona({
    persona,
    seed: 101,
    endAge: 12,
    catalogVersion: '1.0.0',
    maxSteps: 600,
    playerSurfaceTrace: true,
  });
  assert.ok(run.playerSurfaceTrace);
  assert.ok((run.playerSurfaceTrace.steps.length ?? 0) > 0);
  for (const step of run.playerSurfaceTrace.steps) {
    assert.ok(step.experienceContext, `step ${step.sequence} must carry experience context`);
    assert.equal(Object.prototype.hasOwnProperty.call(step.experienceContext, 'flags'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(step.experienceContext, 'finalState'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(step.experienceContext, 'score'), false);
  }
  const runPayload = projectHeadlessApiPlayerObservablePayload(run.playerSurfaceTrace);
  assert.ok(runPayload.entries.every(entry => entry.experienceContext !== undefined));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExperienceSemanticContextTests()
    .then(() => console.log('experienceSemanticContext.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
