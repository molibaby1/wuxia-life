import { gameEngine } from '../src/core/GameEngineIntegration';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';
import { preparePackedPassiveMemory } from '../src/core/activePlanning/annualPassiveMemory';

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function testSinglePathStageCompletesAndAdvancesInOneClick(): void {
  const engine = useNewGameEngine();
  const originalSelectEvent = gameEngine.selectEvent;

  try {
    gameEngine.startNewGame('单次推进验收', 'male');
    const state = gameEngine.getGameState();
    state.player.age = 5;
    state.flags.origin_id = 'martial';
    const packed = preparePackedPassiveMemory(state, () => 0);
    assert(packed !== null, 'age 5 should prepare packed passive memory');

    engine.engineState.currentEvent = null;
    engine.engineState.availableChoices = [];
    engine.engineState.availableActiveActions = [];
    engine.engineState.isActiveActionMode = false;
    engine.engineState.isPassiveProgressionMode = true;
    engine.engineState.annualPassiveMemory = packed;
    engine.engineState.passiveNarrative = { title: packed.headline, text: packed.body };
    engine.engineState.pendingPeriodSummary = null;
    engine.engineState.progressionOverlay = null;

    (gameEngine as unknown as { selectEvent: typeof gameEngine.selectEvent }).selectEvent = () => ({
      id: 'next-real-stage',
      eventType: 'choice',
      content: { title: '下一阶段', text: '请做出新的选择。' },
      choices: [
        { id: 'next-a', text: '选项一', effects: [{ type: 'flag_set', target: 'next_a' }] },
        { id: 'next-b', text: '选项二', effects: [{ type: 'flag_set', target: 'next_b' }] },
      ],
    } as never);

    engine.continueProgressionFlow();

    assert(
      engine.engineState.currentEvent?.id === 'next-real-stage',
      '单路径阶段点击一次后必须直接进入下一真实阶段',
    );
    assert(
      engine.engineState.pendingPeriodSummary === null,
      '内部 period summary 不得成为第二个玩家操作页',
    );
    assert(
      (engine.engineState.progressionOverlay?.cards.length ?? 0) > 0,
      '下一阶段必须保留上一阶段的结算结果',
    );
  } finally {
    (gameEngine as unknown as { selectEvent: typeof gameEngine.selectEvent }).selectEvent = originalSelectEvent;
  }
}

testSinglePathStageCompletesAndAdvancesInOneClick();
console.log('stageAtomicProgression.test.ts: ok');
