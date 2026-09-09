import assert from 'node:assert/strict';
import { EventLoader } from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import { CHOICE_EXECUTION_REQUEST_VERSION } from '../src/contracts/choiceExecution';

process.env.WUXIA_ENGINE_QUIET = '1';
const cases = [
  ['jianghu_year_training', 'training_internal', '专注内功修炼', { martialPower: 3, knowledge: 3 }],
  ['jianghu_year_training', 'training_external', '专注外功修炼', { martialPower: 3 }],
  ['jianghu_year_training', 'training_qinggong', '修炼轻功', { martialPower: 3, constitution: 2 }],
  ['scholar_year_study', 'study_classics', '研读经典，夯实基础', { knowledge: 5 }],
  ['scholar_year_study', 'study_new', '涉猎新知拓宽视野', { knowledge: 4, charisma: 2 }],
] as const;

async function main() {
  for (const [eventId, choiceId, label, rewards] of cases) {
    const event = EventLoader.getInstance().getEventById(eventId)!;
    const choice = event.choices!.find(c => c.id === choiceId)!;
    assert.equal(choice.text, `${label}（耗时三个月）`);
    const effects = choice.effects!;
    assert.deepEqual(effects.at(-1), { type: 'time_advance', target: 'age', value: 3, timeUnit: 'month' });
    assert.deepEqual(effects.slice(0, -1), Object.entries(rewards).map(([target, value]) => ({ type: 'stat_modify', target, value, operator: 'add' })));
    for (const month of [1, 11]) {
      const bootstrap = HeadlessEngineSessionImpl.create({ playerName: '耗时验证', gender: 'male', randomSeed: 20260909, catalogVersion: '1.0.0' });
      const snapshot = bootstrap.serialize();
      snapshot.state.player.age = 20;
      snapshot.state.player.traits = [];
      snapshot.state.currentTime = { year: 21, month, day: 11 };
      snapshot.state.pendingStoryEventId = eventId;
      snapshot.state.eventHistory = [];
      const session = HeadlessEngineSessionImpl.create({ snapshot });
      const before = JSON.parse(JSON.stringify(session.getRuntimeState()));
      const display = session.describePendingEvent()!;
      assert.equal(display.event.choices?.find(c => c.id === choiceId)?.text, choice.text);
      assert.deepEqual(session.getRuntimeState().currentTime, before.currentTime, 'viewing does not consume time');
      await assert.rejects(session.executeChoice({ requestVersion: CHOICE_EXECUTION_REQUEST_VERSION, snapshotRef: { snapshot: session.serialize() }, action: { eventId, choiceId: 'invalid-choice' } }), /Choice id not found/);
      assert.deepEqual(session.getRuntimeState().currentTime, before.currentTime);
      const expectedRewards = await new EventExecutor().executeEffects(effects.slice(0, -1), structuredClone(before));
      const request = { requestVersion: CHOICE_EXECUTION_REQUEST_VERSION, snapshotRef: { snapshot: session.serialize() }, action: { eventId, choiceId } };
      const result = await session.executeChoice(request);
      assert.equal(result.status, 'success');
      const after = session.getRuntimeState();
      const expectedTime = { year: month === 11 ? 22 : 21, month: month === 11 ? 2 : 4, day: 11 };
      assert.deepEqual(after.currentTime, expectedTime);
      assert.equal(after.player.age, month === 11 ? 21 : 20);
      for (const stat of Object.keys(rewards)) assert.equal((after.player as any)[stat], (expectedRewards.player as any)[stat]);
      assert.deepEqual(after.player.investments, before.player.investments);
      assert.deepEqual(after.flags, before.flags);
      assert.equal(after.eventHistory.filter(e => e.eventId === eventId).length, 1);
      assert.equal(after.eventHistory.find(e => e.eventId === eventId)?.age, 20);
      if (result.status === 'success') assert.equal(result.feedback.player.narrativeResult, null);
      await session.executeChoice(request);
      assert.deepEqual(session.getRuntimeState().currentTime, expectedTime, 'replaying the same snapshot request does not compound time cost');
      assert.equal(session.getRuntimeState().eventHistory.filter(e => e.eventId === eventId).length, 1);
      await session.acknowledgeProgression('period_summary');
      assert.equal(session.getRuntimeState().eventHistory.filter(e => e.eventId === eventId).length, 1, 'acknowledging does not execute the choice again');
      assert.notEqual((await session.getNextEvent())?.eventId, eventId, 'completed event is not offered again');
    }
  }
  console.log('identityYearDuration.test.ts: ok');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
