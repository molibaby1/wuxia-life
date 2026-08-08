import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function scanActiveSource(): string {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const filePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(filePath);
      else if (/\.(ts|vue|json)$/.test(entry.name)) files.push(filePath);
    }
  };
  visit(path.resolve('src'));
  return files.map(filePath => fs.readFileSync(filePath, 'utf8')).join('\n');
}

const engine = new GameEngineIntegration();
engine.startNewGame('悟性退役', 'male');
const player = engine.getGameState().player as unknown as Record<string, unknown>;
assert.equal('comprehension' in player, false, 'new runtime player must not contain comprehension');

assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.14.0', 'hard removal must advance Snapshot schema');
assert.equal(
  'comprehension' in (gameStateSnapshotAge50.state.player as unknown as Record<string, unknown>),
  false,
  'canonical fixture must not contain comprehension',
);

const invalidSnapshot = clone(gameStateSnapshotAge50) as typeof gameStateSnapshotAge50 & {
  state: { player: Record<string, unknown> };
};
invalidSnapshot.state.player.comprehension = 20;
const validation = validateGameStateSnapshot(invalidSnapshot);
assert.equal(validation.ok, false, 'Snapshot validator must reject retired comprehension');
assert(
  validation.errors.some(error => error.includes('comprehension')),
  'Snapshot rejection must identify comprehension',
);
assert.throws(
  () => defaultSnapshotConverter.fromSnapshot(invalidSnapshot as never),
  'Snapshot converter must reject retired comprehension without migration',
);

const model = buildMainScreenModel(
  {
    ...engine.getGameState().player,
    reputation: 12,
    connections: 13,
    knowledge: 14,
    chivalry: 15,
  },
  { schemaVersion: '3.1.0', derivedAtAge: 0, risks: [] } as never,
);
assert.deepEqual(
  model.coreStats.map(item => item.key),
  ['martialPower', 'constitution', 'knowledge', 'connections', 'reputation', 'chivalry'],
  'main screen must expose exactly the six canonical attributes',
);
assert.equal(
  model.fullStatGroups.some(group => group.items.some(item => item.key === 'comprehension')),
  false,
  'full stats must not expose comprehension',
);

const source = scanActiveSource();
assert.equal(
  /\bcomprehension\b/.test(source),
  false,
  'retired comprehension token remains in active source, data, UI, or contracts',
);

console.log('canonicalComprehensionRemoval.test.ts: ok');
