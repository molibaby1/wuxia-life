import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GAME_STATE_SNAPSHOT_SCHEMA_VERSION,
} from '../src/contracts/gameStateSnapshot';
import { assertCanonicalSnapshot } from '../src/contracts/validation/canonicalGameStateValidation';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { EventExecutor } from '../src/core/EventExecutor';
import { EffectType } from '../src/types/eventTypes';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';
import { getAffiliationDefinition } from '../src/core/affiliationCatalog';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';

const repoRoot = resolve(fileURLToPath(import.meta.url), '../..');

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

function assertNoActiveSource(relativePath: string, patterns: RegExp[]): void {
  const source = readRepoFile(relativePath);
  for (const pattern of patterns) {
    assert.equal(
      pattern.test(source),
      false,
      `${relativePath} still contains forbidden active source: ${pattern}`,
    );
  }
}

function visitJson(value: unknown, path: string, visit: (value: unknown, path: string) => void): void {
  visit(value, path);
  if (Array.isArray(value)) {
    value.forEach((item, index) => visitJson(item, `${path}[${index}]`, visit));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      visitJson(child, `${path}.${key}`, visit);
    }
  }
}

function assertRejected(snapshot: unknown, label: string): void {
  assert.throws(
    () => assertCanonicalSnapshot(snapshot),
    undefined,
    `${label} must be rejected by the canonical Snapshot boundary`,
  );
}

function cloneFixture(): any {
  return JSON.parse(JSON.stringify(gameStateSnapshotAge50));
}

console.log('=== Canonical Identity / Affiliation Closure Tests ===');

assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
assert.equal(LIFE_MEMORY_SCHEMA_VERSION, '3.2.0');

const engine = new GameEngineIntegration();
const initialState = engine.getGameState() as any;
assert(!('sect' in initialState.player), 'PlayerState must not expose sect');
assert.equal(initialState.player.affiliation, null, 'new games must start unaffiliated');
assert(!('identity' in initialState), 'GameState must not expose generic identity');
assert(!('primaryIdentity' in (initialState.lifePath ?? {})), 'LifePath must not expose primaryIdentity');

for (const id of ['shaolin', 'wudang', 'beggars', 'border', 'shadow_sect'] as const) {
  assert.equal(getAffiliationDefinition(id).id, id);
}
assert.throws(
  () => getAffiliationDefinition('unknown' as never),
  undefined,
  'unknown affiliations must not fall back to raw strings',
);

const executor = new EventExecutor();
const setState = await executor.executeEffects(
  [{ type: 'affiliation_set', value: 'wudang' } as any],
  initialState,
);
assert.equal((setState.player as any).affiliation, 'wudang');
assert.equal((setState.player as any).sect, undefined);
assert.equal((setState.flags as any).sect_faction, undefined);

const repeatState = await executor.executeEffects(
  [{ type: 'affiliation_set', value: 'wudang' } as any],
  setState,
);
assert.equal((repeatState.player as any).affiliation, 'wudang');

const switchedState = await executor.executeEffects(
  [{ type: 'affiliation_set', value: 'shaolin' } as any],
  repeatState,
);
assert.equal((switchedState.player as any).affiliation, 'shaolin');

const clearedState = await executor.executeEffects(
  [{ type: 'affiliation_clear' } as any],
  switchedState,
);
assert.equal((clearedState.player as any).affiliation, null);
const clearedAgain = await executor.executeEffects(
  [{ type: 'affiliation_clear' } as any],
  clearedState,
);
assert.equal((clearedAgain.player as any).affiliation, null);

const roundTripState = await executor.executeEffects(
  [{ type: 'affiliation_set', value: 'wudang' } as any],
  initialState,
);
const roundTrip = defaultSnapshotConverter.fromSnapshot(
  defaultSnapshotConverter.toSnapshot(roundTripState, {
    eventCatalogVersion: '1.0.0',
    sourcePlatform: 'node-headless',
    time: { now: () => 1780000000000 },
  }),
);
assert.equal((roundTrip.player as any).affiliation, 'wudang');

const baseSnapshot = cloneFixture();
assert.equal(baseSnapshot.metadata.schemaVersion, '3.16.0');
assert.equal(baseSnapshot.metadata.lifeMemorySchemaVersion, '3.2.0');
assert.equal(baseSnapshot.state.player.affiliation, 'wudang');
assert.equal(baseSnapshot.state.player.title, '武当长老');

const oldVersion = cloneFixture();
oldVersion.metadata.schemaVersion = '3.12.0';
assertRejected(oldVersion, '3.12.0 snapshot');

const oldSect = cloneFixture();
oldSect.state.player.sect = '武当派';
assertRejected(oldSect, 'snapshot with player.sect');

const oldIdentity = cloneFixture();
oldIdentity.state.identity = { identities: ['hero'], primary: 'hero' };
assertRejected(oldIdentity, 'snapshot with state.identity');

const oldLifePath = cloneFixture();
oldLifePath.state.lifePath.primaryIdentity = 'hero';
assertRejected(oldLifePath, 'snapshot with lifePath.primaryIdentity');

for (const [relativePath, patterns] of Object.entries({
  'src/types/eventTypes.ts': [/PlayerIdentity/, /IdentityInfo/, /IdentityCriteria/, /IdentityEffects/, /\bsect\??:/],
  'src/core/EventExecutor.ts': [/IdentitySystem/, /conditions\.identity/, /thresholds\.identity/, /current_sect/],
  'src/core/GameEngineIntegration.ts': [/IdentitySystem/, /\.identity\b/, /\.sect\b/, /addIdentity|removeIdentity|hasIdentity|getIdentities/],
  'src/core/LifePathSystem.ts': [/primaryIdentity/, /setPrimaryIdentity/, /canChangeIdentity/, /getIdentityFaction/, /requirements\.identity/],
  'src/core/deriveLifeMemorySummary.ts': [/state\.identity/, /summary\.identity/],
  'src/contracts/gameStateSnapshot.ts': [/IdentityInfo/, /\bsect\b/, /identity\?:/],
  'src/contracts/validation/canonicalGameStateValidation.ts': [/primaryIdentity/, /\bsect\b/, /\bidentity\b/],
} as Record<string, RegExp[]>)) {
  assertNoActiveSource(relativePath, patterns);
}

const eventIndex = JSON.parse(readRepoFile('src/data/events.json')) as { imports: string[] };
for (const importPath of eventIndex.imports) {
  const eventPath = importPath.replace(/^\.\//, 'src/data/');
  const parsed = JSON.parse(readRepoFile(eventPath));
  visitJson(parsed, eventPath, (value, path) => {
    if (path.endsWith('.triggerConditions.identity') || path.endsWith('.thresholds.identity') || path.endsWith('.requirements.identity')) {
      assert.fail(`formal event catalog still contains generic identity gate at ${path}`);
    }
    if (path.endsWith('.type') && value === 'flag_set') {
      const parent = path.slice(0, -5);
      void parent;
    }
  });
  assertNoActiveSource(eventPath, [/current_sect/]);
}

console.log('✓ canonical state, effects, event gates, Snapshot rejection, and source guards');
