import assert from 'node:assert/strict';
import { buildChoiceFeedbackOverlayCard } from '../../src/types/progressionOverlay';
import type { ChoiceFeedbackModel } from '../../src/types/choiceFeedback';
import type { NextEventResult } from '../../src/headless/session/sessionTypes';
import {
  buildChoiceSurfacePresentation,
  capturePlayerSafeStoryEvent,
} from '../../src/headless/playability/playerSurfaceCapture';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import { P8_PERSONA_ROSTER } from '../../src/p8/personas';

export async function runPlayerSurfaceCaptureTests(): Promise<void> {
  const next = {
    eventId: 'internal-event',
    requiresChoice: true,
    isAutomatic: false,
    raw: { id: 'internal-event' } as NextEventResult['raw'],
    event: {
      eventId: 'internal-event',
      title: '山门之前',
      text: '门前有人问你来意。',
      eventType: 'choice',
      choices: [
        { id: 'available-a', text: '上前询问', description: '先了解情况。', available: true },
        {
          id: 'locked-secret',
          text: '潜入密道',
          description: '不可见说明',
          available: false,
          lockReason: 'LOCK-REASON-SHOULD-NOT-LEAK',
        },
        { id: 'available-b', text: '暂且离开', available: true },
      ],
    },
  } as NextEventResult;

  const capturedStory = capturePlayerSafeStoryEvent(next);
  assert.deepEqual(capturedStory, {
    eventId: 'internal-event',
    title: '山门之前',
    text: '门前有人问你来意。',
    choices: [
      { id: 'available-a', text: '上前询问', description: '先了解情况。' },
      { id: 'available-b', text: '暂且离开' },
    ],
  });
  const capturedStoryBytes = JSON.stringify(capturedStory);
  assert.equal(capturedStoryBytes.includes('locked-secret'), false);
  assert.equal(capturedStoryBytes.includes('LOCK-REASON-SHOULD-NOT-LEAK'), false);
  assert.equal(capturedStoryBytes.includes('不可见说明'), false);

  const feedback: ChoiceFeedbackModel = {
    player: {
      narrativeResult: '守门人让开一步。',
      statImpacts: [
        { stat: 'reputation', delta: 1, visibility: 'player' },
        { stat: 'money', delta: -99, visibility: 'hidden' },
      ],
      relationshipImpacts: [],
      routeImpact: null,
      longTermFlags: [],
      riskHints: [{ code: 'secret-risk', hint: '不应进入 overlay', severity: 'high', visibility: 'player' }],
    },
    diagnostic: {
      fallbackUsed: false,
      sourceEventId: 'internal-event',
      sourceChoiceId: 'available-a',
      rawEffects: [],
    },
  };

  const story = capturePlayerSafeStoryEvent(next);
  const actual = buildChoiceSurfacePresentation(story, 'available-a', feedback);
  const expected = buildChoiceFeedbackOverlayCard(
    'surface-choice-result',
    '山门之前',
    '上前询问',
    feedback,
    ['上前询问', '先了解情况。'],
  );
  assert.deepEqual(actual, expected && {
    title: expected.title,
    ...(expected.body !== undefined ? { body: expected.body } : {}),
    metaLines: expected.metaLines,
  });
  assert.equal(JSON.stringify(actual).includes('secret-risk'), false);
  assert.equal(JSON.stringify(actual).includes('-99'), false);

  assert.throws(
    () => buildChoiceSurfacePresentation(story, 'missing-choice', feedback),
    /not present in the player-visible choice set/i,
  );

  const persona = P8_PERSONA_ROSTER[0];
  const capturedRun = await runHeadlessPersona({
    persona,
    endAge: 8,
    catalogVersion: '1.0.0',
    seed: 101,
    maxSteps: 320,
    playerSurfaceTrace: true,
  });
  assert.equal(capturedRun.playerSurfaceTrace?.schemaVersion, 'headless-api-player-surface-source-v1');
  assert.ok((capturedRun.playerSurfaceTrace?.steps.length ?? 0) > 0);
  const capturedBytes = JSON.stringify(capturedRun.playerSurfaceTrace);
  assert.equal(capturedBytes.includes('lockReason'), false);
  assert.equal(capturedBytes.includes('"available":false, '), false);
  assert.equal(capturedBytes.includes('riskHints'), false);
  assert.ok(
    capturedRun.playerSurfaceTrace?.steps.some(step => typeof step.age === 'number'),
    'captured surface should preserve age on at least one step',
  );

  const ordinaryRun = await runHeadlessPersona({
    persona,
    endAge: 2,
    catalogVersion: '1.0.0',
    seed: 101,
    maxSteps: 80,
  });
  assert.equal(ordinaryRun.playerSurfaceTrace, undefined);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runPlayerSurfaceCaptureTests();
  console.log('playerSurfaceCapture.test.ts: ok');
}
