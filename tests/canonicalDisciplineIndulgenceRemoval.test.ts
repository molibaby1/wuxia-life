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
  const serialized = JSON.stringify(value) ?? '';
  assert(
    !serialized.match(/\b(?:discipline|indulgence)\b/),
    message,
  );
}

function testCanonicalLifeStates(): void {
  const defaults = createDefaultPlayerLifeStates();
  assertDeepEqual(
    Object.keys(defaults).sort(),
    ['businessHabit', 'studyHabit', 'trainingHabit'].sort(),
    'canonical lifeStates must contain only three approved keys',
  );
  assert(!('familyBond' in defaults), 'lifeStates.familyBond must not exist');
  assert(!('socialMomentum' in defaults), 'lifeStates.socialMomentum must not exist');
  assert(!('discipline' in defaults), 'lifeStates.discipline must not exist');
  assert(!('indulgence' in defaults), 'lifeStates.indulgence must not exist');
  assert(!lifeStates.some(item => item.key === ('discipline' as never)), 'discipline config must not exist');
  assert(!lifeStates.some(item => item.key === ('indulgence' as never)), 'indulgence config must not exist');
}

function testDailyEventMapping(): void {
  for (const event of dailyEvents) {
    assert(!('preferredStates' in event), `${event.id} must not expose removed preferredStates contract`);
  }
  assert(findDailyEvent('daily_morning_training').outcomeBias?.positiveByTraits?.includes('disciplined') === true, 'disciplined trait outcome bias must remain');

  for (const event of dailyEvents) {
    for (const variant of [
      ...event.variants.positive,
      ...event.variants.neutral,
      ...event.variants.negative,
    ]) {
      assertNoLegacyState(variant.stateEffects, `${variant.id} must not produce legacy states`);
    }
    assert(!('longTermHooks' in event), `${event.id} must not expose longTermHooks`);
  }
}

function testDailyEventSchedulingConsumers(): void {
  const source = fs.readFileSync(path.resolve('src/core/DailyEventSystem.ts'), 'utf8');
  assert(!/lifeStates[^\n]*\.(?:discipline|indulgence)/.test(source), 'DailyEventSystem must not read legacy life states');
  assert(!/positive \+= discipline/.test(source), 'DailyEventSystem must not apply global discipline outcome bonus');
  assert(!/getGroupStateMultiplier[\s\S]*trainingHabit/.test(source), 'DailyEventSystem group multiplier must ignore trainingHabit');
  assert(!/getGroupStateMultiplier[\s\S]*studyHabit/.test(source), 'DailyEventSystem group multiplier must ignore studyHabit');
}

function testFormalEventConsumers(): void {
  const source = fs.readFileSync(path.resolve('src/core/GameEngineIntegration.ts'), 'utf8');
  assert(!/lifeStates[^\n]*\.(?:discipline|indulgence)/.test(source), 'Formal Event code must not read legacy life states');
  assert(!source.includes('getFormalEventOutcomeFriction'), 'Formal Event friction helper must be removed');
  assert(!source.includes('shrinkPositiveGain'), 'Formal Event gain shrinking helper must be removed');
  assert(!source.includes('buildPartialOutcomeNote'), 'Formal Event partial outcome helper must be removed');
}

function testEndingConsumers(): void {
  const source = fs.readFileSync(path.resolve('src/core/EndingSystem.ts'), 'utf8');
  assert(!/lifeStates[^\n]*\.(?:discipline|indulgence)/.test(source), 'EndingSystem must not read legacy life states');
  assert(!source.includes('discipline >='), 'EndingSystem must not require discipline');
  assert(!source.includes('discipline <='), 'EndingSystem must not classify by discipline');
  assert(!source.includes('indulgence >='), 'EndingSystem must not classify by indulgence');
}

function testSnapshotBoundary(): void {
  assert(GAME_STATE_SNAPSHOT_SCHEMA_VERSION === '3.16.0', 'snapshot schema must be 3.16.0');
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
  testFormalEventConsumers();
  testEndingConsumers();
  testSnapshotBoundary();
  testSourceGuard();
}

runCanonicalDisciplineIndulgenceRemovalTests();
console.log('canonicalDisciplineIndulgenceRemoval.test.ts: ok');
