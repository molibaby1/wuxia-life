import assert from 'node:assert/strict';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { validateGameStateSnapshot } from '../src/contracts/validation/contractValidation';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import { SaveManager } from '../src/core/SaveManager';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';

function cloneSnapshot() {
  return structuredClone(gameStateSnapshotAge50);
}

function assertRejected(snapshot: unknown, label: string): void {
  assert.equal(validateGameStateSnapshot(snapshot).ok, false, `${label} must be rejected`);
  assert.throws(() => defaultSnapshotConverter.fromSnapshot(snapshot as never), label);
}

const nestedForbiddenCases: Array<[string, (snapshot: ReturnType<typeof cloneSnapshot>) => void]> = [
  ['nested energy', snapshot => { snapshot.state.eventHistory = [{ eventId: 'nested', stateSnapshot: { player: { energy: 1 } } }]; }],
  ['nested health', snapshot => { snapshot.state.eventHistory = [{ eventId: 'nested', stateSnapshot: { player: { health: 1 } } }]; }],
  ['nested old lifeStates', snapshot => { snapshot.state.eventHistory = [{ eventId: 'nested', stateSnapshot: { player: { lifeStates: { familyBond: 1 } } } }]; }],
  ['nested routeStates', snapshot => { snapshot.state.eventHistory = [{ eventId: 'nested', stateSnapshot: { routeStates: {} } }]; }],
  ['nested routeHistory', snapshot => { snapshot.state.eventHistory = [{ eventId: 'nested', stateSnapshot: { routeHistory: [] } }]; }],
  ['nested roadCommitments', snapshot => { snapshot.state.eventHistory = [{ eventId: 'nested', stateSnapshot: { roadCommitments: [] } }]; }],
];

for (const [label, mutate] of nestedForbiddenCases) {
  const snapshot = cloneSnapshot();
  mutate(snapshot);
  assertRejected(snapshot, label);
}

for (const [label, mutate] of [
  ['invalid name primitive', snapshot => { snapshot.state.player.name = 123 as never; }],
  ['invalid age primitive', snapshot => { snapshot.state.player.age = '50' as never; }],
  ['invalid gender enum', snapshot => { snapshot.state.player.gender = 'unknown' as never; }],
  ['invalid alive primitive', snapshot => { snapshot.state.player.alive = 'yes' as never; }],
  ['missing martialPower', snapshot => { delete (snapshot.state.player as Record<string, unknown>).martialPower; }],
  ['forbidden money field', snapshot => { snapshot.state.player.money = 100; }],
  ['invalid fact object', snapshot => { (snapshot.state.facts as Record<string, unknown>).bad = {}; }],
  ['invalid relation string', snapshot => { (snapshot.state.relations as Record<string, unknown>).someone = 'high'; }],
  ['empty event id', snapshot => { snapshot.state.eventHistory = [{ eventId: '' }]; }],
  ['event without id', snapshot => { snapshot.state.eventHistory = [{} as never]; }],
  ['invalid current time', snapshot => { snapshot.state.currentTime = { year: '50', month: 1, day: 1 } as never; }],
  ['invalid engine version', snapshot => { snapshot.metadata.engineVersion = 123 as never; }],
  ['unknown state key', snapshot => { (snapshot.state as Record<string, unknown>).shadowAxis = {}; }],
  ['unknown player key', snapshot => { (snapshot.state.player as Record<string, unknown>).shadowAxis = 42; }],
  ['unknown event key', snapshot => { (snapshot.state.eventHistory[0] as Record<string, unknown>).shadow = true; }],
  ['unknown metadata key', snapshot => { (snapshot.metadata as Record<string, unknown>).shadow = true; }],
] as const) {
  const snapshot = cloneSnapshot();
  mutate(snapshot);
  assertRejected(snapshot, label);
}

for (const [label, mutate] of [
  ['missing facts', snapshot => { delete (snapshot.state as Partial<typeof snapshot.state>).facts; }],
  ['missing investments key', snapshot => { delete (snapshot.state.player.investments as Partial<typeof snapshot.state.player.investments>).hermit; }],
  ['extra investments key', snapshot => { (snapshot.state.player.investments as Record<string, unknown>).extra = 1; }],
  ['negative investment', snapshot => { snapshot.state.player.investments.martial = -1; }],
  ['duplicate status', snapshot => { snapshot.state.player.statuses = ['ill', 'ill']; }],
  ['invalid trait', snapshot => { snapshot.state.player.traits = ['not-a-trait' as never]; }],
] as const) {
  const snapshot = cloneSnapshot();
  mutate(snapshot);
  assertRejected(snapshot, label);
}

for (const [label, mutate] of [
  ['non-player potential field', snapshot => { (snapshot.state.player as Record<string, unknown>).martialPotential = 1; }],
  ['missing affiliation', snapshot => { delete (snapshot.state.player as Record<string, unknown>).affiliation; }],
  ['missing title', snapshot => { delete (snapshot.state.player as Record<string, unknown>).title; }],
  ['missing spouse', snapshot => { delete (snapshot.state.player as Record<string, unknown>).spouse; }],
  ['missing action history', snapshot => { delete (snapshot.state as Record<string, unknown>).actionHistory; }],
  ['missing action focus streak', snapshot => { delete (snapshot.state as Record<string, unknown>).actionFocusStreak; }],
  ['invalid relationship role', snapshot => { snapshot.state.player.relationships![0].role = 'colleague' as never; }],
  ['invalid life stage', snapshot => { snapshot.state.lifePath!.lifeStage = 'retirement' as never; }],
  ['invalid critical choice', snapshot => { snapshot.state.criticalChoices!.life_goal = 'warrior' as never; }],
  ['non JSON-safe ending', snapshot => { snapshot.state.ending = new Date() as never; }],
] as const) {
  const snapshot = cloneSnapshot();
  mutate(snapshot);
  assertRejected(snapshot, label);
}

const isolatedRuntime = defaultSnapshotConverter.fromSnapshot(cloneSnapshot());
isolatedRuntime.eventHistory = [{
  eventId: 'nested-isolation',
  stateSnapshot: {
    currentTime: { year: 50, month: 3, day: 15 },
    player: { lifeStates: { trainingHabit: 4, studyHabit: 3, businessHabit: 2 } },
  },
}];
const isolatedSnapshot = defaultSnapshotConverter.toSnapshot(isolatedRuntime, {
  eventCatalogVersion: '1.0.0',
  sourcePlatform: 'node-headless',
  time: { now: () => 1717200000000 },
});
isolatedSnapshot.state.player.investments.martial = 99;
isolatedSnapshot.state.actionFocusStreak.count = 99;
isolatedSnapshot.state.eventHistory[0].stateSnapshot!.player!.lifeStates!.trainingHabit = 0;
assert.equal(isolatedRuntime.player.investments.martial, 1.5, 'toSnapshot must not share player investments');
assert.equal(isolatedRuntime.actionFocusStreak!.count, 0, 'toSnapshot must not share actionFocusStreak');
assert.equal(isolatedRuntime.eventHistory[0].stateSnapshot!.player!.lifeStates!.trainingHabit, 4, 'toSnapshot must not share nested event state');

const hydratedIsolation = defaultSnapshotConverter.fromSnapshot(isolatedSnapshot);
hydratedIsolation.currentTime!.year = 99;
hydratedIsolation.player.lifeStates.trainingHabit = 99;
hydratedIsolation.actionFocusStreak!.count = 98;
hydratedIsolation.eventHistory[0].stateSnapshot!.currentTime!.year = 98;
assert.equal(isolatedSnapshot.state.currentTime!.year, 50, 'fromSnapshot must not share currentTime');
assert.equal(isolatedSnapshot.state.player.lifeStates.trainingHabit, 4, 'fromSnapshot must not share player lifeStates');
assert.equal(isolatedSnapshot.state.actionFocusStreak.count, 99, 'fromSnapshot must not share actionFocusStreak');
assert.equal(isolatedSnapshot.state.eventHistory[0].stateSnapshot!.currentTime!.year, 50, 'fromSnapshot must not share nested event state');

const manager = SaveManager.getInstance();
manager.clearAllSaves();
const runtimeState = defaultSnapshotConverter.fromSnapshot(cloneSnapshot());
runtimeState.lastSavedAt = 111111;
runtimeState.gameTimestamp = 222222;
runtimeState.actionHistory = [{
  actionId: 'action_household_errand',
  category: 'business',
  duration: { value: 1, unit: 'month' },
  deltas: { money: 3 },
  sourceKind: 'active_action',
  age: 12,
  timestamp: { year: 12, month: 2, day: 1 },
}];
runtimeState.actionFocusStreak = { category: 'business', count: 2 };
runtimeState.p16TendencyShaping = {
  discipline: 1,
  endurance: 2,
  caution: 3,
  empathy: 4,
  ambition: 5,
  socialEase: 6,
};
const runtime = new GameEngineIntegration();
for (const [label, mutate] of [
  ['runtime missing facts', state => { delete (state as Partial<typeof state>).facts; }],
  ['runtime missing lifeStates', state => { delete (state.player as Partial<typeof state.player>).lifeStates; }],
  ['runtime invalid statuses', state => { state.player.statuses = ['unknown' as never]; }],
] as const) {
  const invalidState = structuredClone(runtimeState);
  mutate(invalidState);
  assert.throws(() => runtime.loadGameState(invalidState), label);
}
const saveId = manager.saveGame(runtimeState, 'canonical-boundary');
const save = manager.loadGame(saveId);
assert(save, 'canonical save should load');
assert('snapshot' in save, 'browser save must persist a canonical snapshot');
assert.equal((save as { snapshot: { metadata: { schemaVersion: string } } }).snapshot.metadata.schemaVersion, '3.16.0');
const restored = defaultSnapshotConverter.fromSnapshot(save.snapshot);
assert.equal(restored.player.wealthCapacity, runtimeState.player.wealthCapacity, 'wealthCapacity must round-trip');
assert.deepEqual(restored.actionHistory, runtimeState.actionHistory, 'actionHistory must round-trip');
assert.deepEqual(restored.actionFocusStreak, runtimeState.actionFocusStreak, 'actionFocusStreak must round-trip');
assert.deepEqual(restored.p16TendencyShaping, runtimeState.p16TendencyShaping, 'p16TendencyShaping must round-trip');
assert.equal(restored.lastSavedAt, runtimeState.lastSavedAt, 'lastSavedAt must come from snapshot state');
assert.equal(restored.gameTimestamp, runtimeState.gameTimestamp, 'gameTimestamp must come from snapshot state');
manager.autoSave(runtimeState);
assert(manager.loadAutoSave(), 'autosave should use the canonical snapshot boundary');
const exported = manager.exportSave(saveId);
assert(exported, 'canonical save should export');
const malformedExport = JSON.parse(exported) as Record<string, unknown>;
(malformedExport.save as Record<string, unknown>).shadow = true;
assert.equal(manager.importSave(JSON.stringify(malformedExport)), false, 'unknown save wrapper key must be rejected');
const missingMetadata = JSON.parse(exported) as Record<string, unknown>;
(missingMetadata.save as Record<string, unknown>).metadata = {};
assert.equal(manager.importSave(JSON.stringify(missingMetadata)), false, 'incomplete save metadata must be rejected');
manager.clearAllSaves();
assert.equal(manager.importSave(exported), true, 'canonical export should import');
manager.clearAllSaves();

console.log('✅ Canonical persistence boundary tests passed');
