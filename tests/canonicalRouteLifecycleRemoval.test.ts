import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { SaveManager } from '../src/core/SaveManager';
import {
  DefaultSnapshotConverter,
  SnapshotConversionError,
} from '../src/headless/snapshot/SnapshotConverter';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { GameState } from '../src/types/eventTypes';

const legacyKeys = ['routeStates', 'routeHistory', 'roadCommitments'] as const;

function expectThrows(action: () => unknown, label: string): void {
  assert.throws(action, undefined, label);
}

function expectSnapshotError(action: () => unknown, label: string): void {
  assert.throws(action, (error: unknown) => error instanceof SnapshotConversionError, label);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function createConverter(): DefaultSnapshotConverter {
  return new DefaultSnapshotConverter();
}

function createState(): GameState {
  return new GameEngineIntegration().getGameState();
}

function testRuntimeShapeAndLegacyRejection(): void {
  const engine = new GameEngineIntegration();
  const state = engine.getGameState();
  for (const key of legacyKeys) assert.equal(key in state, false, `new game contains ${key}`);

  for (const key of legacyKeys) {
    const legacy = { ...state, [key]: {} } as GameState;
    expectThrows(() => engine.loadGameState(legacy), `loadGameState must reject ${key}`);
  }
}

function testSnapshot3_9Contract(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.9.0');
  const converter = createConverter();
  const snapshot = converter.toSnapshot(createState(), {
    eventCatalogVersion: 'test',
    sourcePlatform: 'node-headless',
    time: { now: () => 123 },
  });
  assert.equal(snapshot.metadata.schemaVersion, '3.9.0');
  for (const key of legacyKeys) assert.equal(key in snapshot.state, false, `snapshot emits ${key}`);
  converter.fromSnapshot(snapshot);

  for (const version of ['3.8.0', '3.7.0']) {
    const old = clone(snapshot);
    old.metadata.schemaVersion = version;
    expectSnapshotError(() => converter.fromSnapshot(old), `${version} must be rejected`);
  }
  for (const key of legacyKeys) {
    const invalid = clone(snapshot) as any;
    invalid.state[key] = {};
    expectSnapshotError(() => converter.fromSnapshot(invalid), `3.9.0 + ${key} must be rejected`);
    const validation = validateGameStateSnapshot(invalid);
    assert.equal('errors' in validation, true, `validator must reject ${key}`);
  }

  for (const key of legacyKeys) {
    const runtime = { ...createState(), [key]: {} } as GameState;
    expectSnapshotError(() => converter.toSnapshot(runtime, {
      eventCatalogVersion: 'test',
      sourcePlatform: 'node-headless',
      time: { now: () => 123 },
    }), `toSnapshot must reject dynamic ${key}`);
  }
}

function testSaveRejectsLegacyFields(): void {
  const manager = SaveManager.getInstance();
  const state = createState();
  manager.clearAllSaves();
  for (const key of legacyKeys) {
    const legacy = { ...state, [key]: {} } as GameState;
    expectThrows(() => manager.saveGame(legacy), `saveGame must reject ${key}`);
    expectThrows(() => manager.autoSave(legacy), `autoSave must reject ${key}`);
  }
}

function testRepositoryRemoval(): void {
  const srcFiles = [
    'src',
    'scripts',
    'tests',
    'docs/contracts',
  ];
  const forbidden = [
    'RouteStateManager',
    'RouteLifecycleState',
    'RoadCommitmentRecord',
    'LifeRoadStage',
    'LifeRoadId',
    'road_lifecycle',
    'normalizeRoadCommitments',
    'migrateLegacyRoutes',
  ];
  const scan = (root: string): string => {
    const files: string[] = [];
    const visit = (directory: string): void => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) visit(filePath);
        else if (/\.(ts|tsx|json|md)$/.test(entry.name)) files.push(filePath);
      }
    };
    visit(path.resolve(root));
    return files.map(file => fs.readFileSync(file, 'utf8')).join('\n');
  };
  for (const root of srcFiles) {
    const source = root === 'tests'
      ? scan(root).replace(fs.readFileSync(path.resolve('tests/canonicalRouteLifecycleRemoval.test.ts'), 'utf8'), '')
      : scan(root);
    for (const token of forbidden) assert.equal(source.includes(token), false, `${token} remains in ${root}`);
  }
  const merchant = fs.readFileSync(path.resolve('src/data/lines/merchant.json'), 'utf8');
  assert.equal((merchant.match(/"type"\s*:\s*"road_lifecycle"/g) ?? []).length, 0);
  assert.equal(fs.existsSync(path.resolve('src/core/RouteStateManager.ts')), false);
  assert.equal(fs.existsSync(path.resolve('src/core/RouteCompatibilityRules.ts')), false);
  assert.equal(fs.existsSync(path.resolve('src/data/route-conflict-table.json')), false);
}

testRuntimeShapeAndLegacyRejection();
testSnapshot3_9Contract();
testSaveRejectsLegacyFields();
testRepositoryRemoval();
console.log('canonicalRouteLifecycleRemoval.test.ts passed');
