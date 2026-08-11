import assert from 'node:assert/strict';
import { runHeadlessPersona } from '../../src/headless/playability/headlessPersonaRunner';
import { getP8PersonaById } from '../../src/p8/personas';
import { eventLoader } from '../../src/core/EventLoader';

async function main(): Promise<void> {
  const event = eventLoader.getEventById('love_after_greet');
  assert.ok(event, 'love_after_greet must exist');
  assert.ok(
    !(event.autoEffects ?? []).some(
      effect =>
        effect.type === 'stat_modify' &&
        (effect as { target?: string }).target === 'martialPower',
    ),
    'love_after_greet must not declare martialPower effects',
  );

  const persona = getP8PersonaById('p8-balanced-wei');
  assert.ok(persona, 'missing persona');

  // endAge 18: with seed 808, love_after_greet lands around 17 after attribution fix
  const result = await runHeadlessPersona({
    persona,
    seed: 808,
    endAge: 18,
    catalogVersion: '1.0.0',
    maxSteps: 1200,
    experienceTrace: true,
  });

  const love = result.records.find(record => record.eventId === 'love_after_greet');
  assert.ok(love, 'expected love_after_greet in headless records');
  assert.ok(love.outcomeEvidence, 'expected outcomeEvidence');

  const beforePower = love.outcomeEvidence!.stateBefore.player.martialPower;
  const afterPower = love.outcomeEvidence!.stateAfter.player.martialPower;
  assert.equal(
    afterPower,
    beforePower,
    `love_after_greet must not absorb later-event martialPower delta (${beforePower}→${afterPower})`,
  );

  const beforeMoney = love.outcomeEvidence!.stateBefore.player.money;
  const afterMoney = love.outcomeEvidence!.stateAfter.player.money;
  if (afterMoney < beforeMoney) {
    const visible = `${love.eventText ?? ''}\n${love.outcomeText ?? ''}`;
    assert.match(
      visible,
      /生意|亏损|商场|失败|变故/,
      'same-frame setback money loss must carry player-visible setback explanation',
    );
  }

  const loveIdx = result.records.findIndex(record => record.eventId === 'love_after_greet');
  const laterLove = result.records.slice(loveIdx + 1).find(record => record.eventId.startsWith('love_'));
  if (laterLove) {
    assert.notEqual(laterLove.eventId, 'love_after_greet');
  }

  console.log('autoEventOutcomeAttribution: PASS');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
