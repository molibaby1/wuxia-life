import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LifePathManager } from '../src/core/LifePathSystem';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { SaveManager } from '../src/core/SaveManager';
import {
  DefaultSnapshotConverter,
  SnapshotConversionError,
} from '../src/headless/snapshot/SnapshotConverter';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import type { LifePath, GameState } from '../src/types/eventTypes';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function expectSnapshotRejected(value: unknown, label: string): void {
  assert.equal(validateGameStateSnapshot(value).ok, false, `${label}: validator must reject`);
  assert.throws(
    () => new DefaultSnapshotConverter().fromSnapshot(value as never),
    (error: unknown) => error instanceof SnapshotConversionError,
    `${label}: converter must reject`,
  );
}

function createRuntimeState(): GameState {
  return new GameEngineIntegration().getGameState();
}

function scanActiveCode(): string {
  const roots = ['src', 'tests'];
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (/\.(ts|tsx|json)$/.test(entry.name)) files.push(filePath);
    }
  };
  roots.forEach(root => visit(path.resolve(root)));
  return files
    .filter(filePath => filePath !== path.resolve('tests/canonicalLifePathFocusRemoval.test.ts'))
    .map(filePath => fs.readFileSync(filePath, 'utf8'))
    .join('\n');
}

const lifePath = LifePathManager.create();
assert.equal('focus' in lifePath, false, 'new LifePath must not contain focus');
assert.equal(Object.prototype.hasOwnProperty.call(lifePath, 'focus'), false, 'new LifePath must not own focus');

const source = scanActiveCode();
for (const token of [
  'FocusType',
  'LIFEPATH_ADD_FOCUS',
  'lifepath_add_focus',
  'LifepathAddFocusHandler',
  'minFocus',
  'lifePath.focus',
]) {
  assert.equal(source.includes(token), false, `${token} remains in active code or tests`);
}

const heroLines = JSON.parse(fs.readFileSync(path.resolve('src/data/lines/identity-hero.json'), 'utf8')) as unknown;
assert.equal(JSON.stringify(heroLines).includes('lifepath_add_focus'), false, 'hero lines must not contain lifepath_add_focus');

const legacyFocusLifePath = {
  ...LifePathManager.create(),
  primaryIdentity: 'hero',
  focus: { martial: 100, business: 0, academic: 0, leadership: 0 },
} as unknown as LifePath;
assert.equal(
  LifePathManager.canChangeIdentity(legacyFocusLifePath, 'merchant'),
  true,
  'identity conversion must ignore injected legacy focus',
);

assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.11.0');
const converter = new DefaultSnapshotConverter();
const snapshot = clone(gameStateSnapshotAge50);
assert.equal(snapshot.metadata.schemaVersion, '3.11.0');
assert.equal('focus' in (snapshot.state.lifePath ?? {}), false, 'normal snapshot must not contain focus');

const oldVersion = clone(snapshot);
oldVersion.metadata.schemaVersion = '3.10.0';
expectSnapshotRejected(oldVersion, '3.10.0 snapshot');

const topLevelFocus = clone(snapshot) as typeof snapshot & { state: { lifePath: LifePath & { focus: unknown } } };
topLevelFocus.state.lifePath.focus = { martial: 0, business: 0, academic: 0, leadership: 0 };
expectSnapshotRejected(topLevelFocus, 'top-level lifePath.focus');

const nestedFocus = clone(snapshot);
nestedFocus.state.eventHistory = [{
  eventId: 'nested-focus',
  stateSnapshot: { lifePath: { ...clone(snapshot.state.lifePath!), focus: { martial: 0, business: 0, academic: 0, leadership: 0 } } as never },
}];
expectSnapshotRejected(nestedFocus, 'nested stateSnapshot lifePath.focus');

const runtimeFocus = LifePathManager.initialize(createRuntimeState()) as GameState & { lifePath: LifePath & { focus: unknown } };
runtimeFocus.lifePath.focus = { martial: 0, business: 0, academic: 0, leadership: 0 };
assert.throws(() => converter.toSnapshot(runtimeFocus, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 123 },
}), SnapshotConversionError, 'toSnapshot must reject runtime focus');
assert.throws(() => new GameEngineIntegration().loadGameState(runtimeFocus), 'loadGameState must reject runtime focus');
const saveManager = SaveManager.getInstance();
saveManager.clearAllSaves();
assert.throws(() => saveManager.saveGame(runtimeFocus), 'saveGame must reject runtime focus');
assert.throws(() => saveManager.autoSave(runtimeFocus), 'autoSave must reject runtime focus');

const roundTrip = converter.fromSnapshot(clone(snapshot));
const roundTripSnapshot = converter.toSnapshot(roundTrip, {
  eventCatalogVersion: 'test',
  sourcePlatform: 'node-headless',
  time: { now: () => 123 },
});
assert.deepEqual(roundTripSnapshot.state.lifePath, snapshot.state.lifePath, 'LifePath fields must round-trip unchanged');
assert.equal('focus' in (roundTrip.lifePath ?? {}), false, 'round-trip runtime must not contain focus');
assert.equal('focus' in (roundTripSnapshot.state.lifePath ?? {}), false, 'round-trip snapshot must not contain focus');

console.log('✅ Canonical LifePath focus removal tests passed');
