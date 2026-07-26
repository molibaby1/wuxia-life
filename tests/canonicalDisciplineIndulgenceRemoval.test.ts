import fs from 'node:fs';
import path from 'node:path';
import { assert, assertDeepEqual } from './GameTestFramework';
import { createDefaultPlayerLifeStates, lifeStates } from '../src/data/life/lifeStates';
import { dailyEvents } from '../src/data/life/dailyEvents';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

function findDailyEvent(id: string) {
  const event = dailyEvents.find(item => item.id === id);
  if (!event) throw new Error(`daily event not found: ${id}`);
  return event;
}

function assertNoLegacyState(value: unknown, message: string): void {
  assert(
    !JSON.stringify(value).match(/\b(?:discipline|indulgence)\b/),
    message,
  );
}

function testCanonicalLifeStates(): void {
  const defaults = createDefaultPlayerLifeStates() as unknown as Record<string, unknown>;
  assertDeepEqual(
    Object.keys(defaults).sort(),
    ['businessHabit', 'familyBond', 'socialMomentum', 'studyHabit', 'trainingHabit'].sort(),
    'canonical lifeStates must contain only five approved keys',
  );
  assert(!('discipline' in defaults), 'lifeStates.discipline must not exist');
  assert(!('indulgence' in defaults), 'lifeStates.indulgence must not exist');
  assert(!lifeStates.some(item => item.key === ('discipline' as never)), 'discipline config must not exist');
  assert(!lifeStates.some(item => item.key === ('indulgence' as never)), 'indulgence config must not exist');
}

function testDailyEventMapping(): void {
  const preferredState = (id: string) => findDailyEvent(id).preferredStates ?? [];
  assert(preferredState('daily_morning_training').some(rule => rule.state === 'trainingHabit' && rule.min === 1), 'morning training must prefer trainingHabit >= 1');
  assert(preferredState('daily_skip_training').some(rule => rule.state === 'trainingHabit' && rule.min === 2), 'skip training must prefer trainingHabit >= 2');
  assert(preferredState('daily_training_bottleneck').some(rule => rule.state === 'trainingHabit' && rule.min === 2), 'training bottleneck must prefer trainingHabit >= 2');
  assert(preferredState('daily_copybook_practice').some(rule => rule.state === 'studyHabit' && rule.min === 1), 'copybook practice must prefer studyHabit >= 1');
  assert(preferredState('daily_reading_notes').some(rule => rule.state === 'studyHabit' && rule.min === 1), 'reading notes must prefer studyHabit >= 1');
  assertNoLegacyState(preferredState('daily_second_guess'), 'second guess must not prefer legacy state');
  assert(findDailyEvent('daily_morning_training').outcomeBias?.positiveByTraits?.includes('disciplined') === true, 'disciplined trait outcome bias must remain');

  for (const event of dailyEvents) {
    assertNoLegacyState(event.preferredStates, `${event.id} must not consume legacy states`);
    for (const variant of [
      ...event.variants.positive,
      ...event.variants.neutral,
      ...event.variants.negative,
    ]) {
      assertNoLegacyState(variant.stateEffects, `${variant.id} must not produce legacy states`);
    }
    assertNoLegacyState(event.longTermHooks?.addStateOnRepeat, `${event.id} repeat hook must not use legacy states`);
  }
}

function testDailyEventSchedulingConsumers(): void {
  const source = fs.readFileSync(path.resolve('src/core/DailyEventSystem.ts'), 'utf8');
  assert(!/lifeStates[^\n]*\.(?:discipline|indulgence)/.test(source), 'DailyEventSystem must not read legacy life states');
  assert(!/positive \+= discipline/.test(source), 'DailyEventSystem must not apply global discipline outcome bonus');
  assert(source.includes('trainingHabit'), 'DailyEventSystem must use trainingHabit for training group');
  assert(source.includes('studyHabit'), 'DailyEventSystem must use studyHabit for study group');
}

function testSnapshotBoundary(): void {
  assert(GAME_STATE_SNAPSHOT_SCHEMA_VERSION === '3.6.0', 'snapshot schema must be 3.6.0');
  assert(validateGameStateSnapshot(gameStateSnapshotAge50).ok, 'age-50 fixture must be valid');

  for (const key of ['discipline', 'indulgence']) {
    const snapshot = JSON.parse(JSON.stringify(gameStateSnapshotAge50)) as any;
    snapshot.state.player.lifeStates[key] = 1;
    assert(!validateGameStateSnapshot(snapshot).ok, `${key} must be rejected by snapshot validation`);
    let threw = false;
    try {
      defaultSnapshotConverter.fromSnapshot(snapshot);
    } catch {
      threw = true;
    }
    assert(threw, `${key} must be rejected by snapshot converter`);
  }
}

function testSourceGuard(): void {
  const sourceRoot = path.resolve('src');
  const forbidden = /\blifeStates\.(?:discipline|indulgence)\b|\b(?:state|target)\s*:\s*['"](?:discipline|indulgence)['"]|"target"\s*:\s*"(?:discipline|indulgence)"/;
  const visit = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) return visit(filename);
    return /\.(?:ts|tsx|json)$/.test(entry.name) ? [filename] : [];
  });
  for (const filename of visit(sourceRoot)) {
    assert(!forbidden.test(fs.readFileSync(filename, 'utf8')), `legacy state reference remains in ${filename}`);
  }
}

export function runCanonicalDisciplineIndulgenceRemovalTests(): void {
  testCanonicalLifeStates();
  testDailyEventMapping();
  testDailyEventSchedulingConsumers();
  testSnapshotBoundary();
  testSourceGuard();
}

runCanonicalDisciplineIndulgenceRemovalTests();
console.log('canonicalDisciplineIndulgenceRemoval.test.ts: ok');
