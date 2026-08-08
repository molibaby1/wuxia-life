import { gameEngine } from '../src/core/GameEngineIntegration';
import { useNewGameEngine } from '../src/composables/useNewGameEngine';

function assert(condition: boolean, message: string): void {
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

    engine.engineState.currentEvent = null;
    engine.engineState.availableChoices = [];
    engine.engineState.availableActiveActions = [];
    engine.engineState.isActiveActionMode = false;
    engine.engineState.isPassiveProgressionMode = true;
    engine.engineState.passiveNarrative = {
      title: '初识马步',
      text: '父亲教你扎马步，你坚持不到半盏茶便腿软。',
    };
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
