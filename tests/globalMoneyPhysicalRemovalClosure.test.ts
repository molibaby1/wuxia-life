/**
 * US-010 final guard: Global Money Retirement physical closure.
 * Proves canonical economic state = wealthCapacity only; no exact wallet/numeric wealth fields.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import {
  validateCanonicalGameState,
  validateCanonicalSnapshot,
} from '../src/contracts/validation/canonicalGameStateValidation';
import { applyStatDeltas } from '../src/core/activePlanning/ActivePlanningService';
import {
  EventLoader,
  collectFormalWalletAuthoringErrors,
} from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { defaultSnapshotConverter } from '../src/headless/snapshot/SnapshotConverter';
import {
  SETBACK_MODIFIABLE_STATS,
  applySetbackEffects,
} from '../src/core/SetbackEventSystem';
import { SETBACK_EVENTS } from '../src/data/setbackEvents';
import { readDimensionValueForDestiny } from '../src/p16/originSurfaces';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import {
  readPlayerNumeric,
  writePlayerNumeric,
  isCanonicalPlayerNumericStat,
} from '../src/utils/playerStatAccess';
import type { EffectDefinition, GameState, PlayerState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(read(relativePath)) as T;
}

function createMinimalPlayer(): PlayerState {
  return {
    name: 'US-010',
    gender: 'male',
    age: 30,
    martialPower: 0,
    chivalry: 0,
    charisma: 0,
    constitution: 0,
    knowledge: 0,
    businessAcumen: 0,
    influence: 0,
    connections: 0,
    martialHeritage: 0,
    scholarlyHeritage: 0,
    merchantNetwork: 0,
    wealthCapacity: 'no_surplus',
    reputation: 0,
    affiliation: null,
    title: null,
    healthStatus: 'healthy',
    statuses: [],
    alive: true,
    items: [],
    flags: {},
    events: [],
    relationships: [],
    children: 0,
    spouse: null,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
    traits: [],
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
  };
}

function createMinimalState(): GameState {
  return { player: createMinimalPlayer(), flags: {}, relations: {}, eventHistory: [], actionHistory: [] };
}

function isMoneyEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'money';
}

function isExactNumericWealthEffect(effect: EffectDefinition): boolean {
  return effect.type === 'stat_modify' && (effect.target ?? effect.stat) === 'wealth';
}

function isExactNumericWealthCondition(condition: { type?: string; expression?: string } | null | undefined): boolean {
  if (!condition || condition.type !== 'expression' || typeof condition.expression !== 'string') return false;
  return /(?:player\s*\.\s*wealth\b|\bwealth\b)/i.test(condition.expression);
}

// 1–2. Runtime PlayerState canonical shape; fresh player has no money/wealth own properties
function testRuntimePlayerStateHasNoExactBalanceFields(): void {
  assert.equal(/\bmoney:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth:\s*number\b/.test(read('src/types/eventTypes.ts')), false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('US-010-closure', 'male');
  const player = engine.getGameState().player as unknown as Record<string, unknown>;
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'money'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(player, 'wealth'), false);
  assert.equal(typeof player.wealthCapacity, 'string');
  assert.equal(player.wealthCapacity, 'no_surplus');
}

// 3. Snapshot 3.16.0 player shape has no money/wealth fields
function testSnapshotPlayerShapeHasNoExactBalanceFields(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  assert.equal(/\bmoney:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal('money' in gameStateSnapshotAge50.state.player, false);
  assert.equal('wealth' in gameStateSnapshotAge50.state.player, false);
  assert.equal(gameStateSnapshotAge50.metadata.schemaVersion, '3.16.0');
}

// 4–5. Validators reject injected balance fields; 3.15.0 rejected with no migration
function testValidatorsRejectLegacyBalanceAndSchema(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('US-010-validate', 'female');
  const snapshot = defaultSnapshotConverter.toSnapshot(engine.getGameState(), {
    eventCatalogVersion: 'test',
    sourcePlatform: 'node-headless',
    time: { now: () => 1 },
  });

  const injectedMoney = structuredClone(snapshot) as Record<string, unknown>;
  (injectedMoney.state as Record<string, unknown>).player = {
    ...(injectedMoney.state as { player: Record<string, unknown> }).player,
    money: 100,
  };
  assert(validateCanonicalSnapshot(injectedMoney).some((issue) => issue.path === 'snapshot.state.player.money'));

  const injectedWealth = structuredClone(snapshot) as Record<string, unknown>;
  (injectedWealth.state as Record<string, unknown>).player = {
    ...(injectedWealth.state as { player: Record<string, unknown> }).player,
    wealth: 50,
  };
  assert(validateCanonicalSnapshot(injectedWealth).some((issue) => issue.path === 'snapshot.state.player.wealth'));

  const legacy315 = structuredClone(snapshot) as Record<string, unknown>;
  (legacy315.metadata as Record<string, unknown>).schemaVersion = '3.15.0';
  const legacyIssues = validateCanonicalSnapshot(legacy315);
  assert(legacyIssues.some((issue) => issue.path === 'snapshot.metadata.schemaVersion'));
  assert.equal(
    legacyIssues.some((issue) => issue.message.includes('migration')),
    false,
    '3.15.0 must be rejected without migration path',
  );

  const runtimeInjected = JSON.parse(JSON.stringify(engine.getGameState())) as Record<string, unknown>;
  (runtimeInjected.player as Record<string, unknown>).money = 77;
  assert(validateCanonicalGameState(runtimeInjected).some((issue) => issue.path === 'state.player.money'));
}

// 6. wealthCapacity required and round-trips
function testWealthCapacityRequiredAndRoundTrips(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('US-010-capacity', 'male');
  const state = engine.getGameState();
  assert.equal(state.player.wealthCapacity, 'no_surplus');

  const snapshot = defaultSnapshotConverter.toSnapshot(state, {
    eventCatalogVersion: 'test',
    sourcePlatform: 'node-headless',
    time: { now: () => 2 },
  });
  assert.equal(snapshot.state.player.wealthCapacity, 'no_surplus');

  const missing = structuredClone(snapshot) as Record<string, unknown>;
  delete (missing.state as { player: Record<string, unknown> }).player.wealthCapacity;
  assert(validateCanonicalSnapshot(missing).some((issue) => issue.path === 'snapshot.state.player.wealthCapacity'));

  const roundTripped = defaultSnapshotConverter.fromSnapshot(snapshot);
  assert.equal(roundTripped.player.wealthCapacity, 'no_surplus');
  assert.equal('money' in roundTripped.player, false);
  assert.equal('wealth' in roundTripped.player, false);
}

// 7. Formal EventLoader money/numeric-wealth authoring zero/rejected
function testFormalEventLoaderAuthoringZeroAndRejected(): void {
  const events = EventLoader.getInstance().getAllEvents();
  assert.equal(events.length, 392);

  const moneyWrites: string[] = [];
  const wealthWrites: string[] = [];
  const wealthConditions: string[] = [];

  for (const event of events) {
    const scanEffects = (effects: EffectDefinition[] | undefined, label: string) => {
      for (const effect of effects ?? []) {
        if (isMoneyEffect(effect)) moneyWrites.push(`${event.id}:${label}`);
        if (isExactNumericWealthEffect(effect)) wealthWrites.push(`${event.id}:${label}`);
      }
    };
    scanEffects(event.autoEffects, 'auto');
    for (const choice of event.choices ?? []) {
      scanEffects(choice.effects, `choice:${choice.id}`);
      for (const outcome of choice.outcomes ?? []) {
        scanEffects(outcome.effects, `outcome:${outcome.id ?? 'anon'}`);
      }
      if (isExactNumericWealthCondition(choice.condition as { type?: string; expression?: string } | undefined)) {
        wealthConditions.push(`${event.id}:choice:${choice.id}`);
      }
    }
    const conditions = [
      ...(Array.isArray(event.conditions) ? event.conditions : event.conditions ? [event.conditions] : []),
    ];
    for (const condition of conditions) {
      if (isExactNumericWealthCondition(condition as { type?: string; expression?: string })) {
        wealthConditions.push(`${event.id}:conditions`);
      }
    }
  }

  assert.deepEqual(moneyWrites, []);
  assert.deepEqual(wealthWrites, []);
  assert.deepEqual(wealthConditions, []);
  assert.deepEqual(collectFormalWalletAuthoringErrors(events), []);

  const syntheticErrors = collectFormalWalletAuthoringErrors([
    {
      id: 'probe_money',
      name: 'probe',
      description: 'probe',
      version: '1.0.0',
      category: 'family',
      priority: 1,
      weight: 1,
      ageRange: { min: 1, max: 1 },
      type: 'family',
      eventType: 'choice',
      tags: [],
      storyLine: 'fixture',
      triggers: [],
      triggerConditions: null,
      conditions: [{ type: 'expression', expression: 'player.money >= 1' }],
      content: { title: 'probe', text: 'probe' },
      autoEffects: [{ type: 'stat_modify', target: 'money', value: 10, operator: 'add' }],
      choices: [],
    },
  ]);
  assert.equal(syntheticErrors.length > 0, true);
}

// 8. Difficulty Setback money mutation zero
function testDifficultySetbackMoneyMutationZero(): void {
  assert.equal(SETBACK_MODIFIABLE_STATS.has('money'), false);
  const mutations = SETBACK_EVENTS.flatMap((event) => {
    const delta = event.effects.statChanges?.money;
    return typeof delta === 'number' ? [{ id: event.id, delta }] : [];
  });
  assert.deepEqual(mutations, []);

  const state = createMinimalState();
  for (const event of SETBACK_EVENTS) {
    applySetbackEffects(state, event.id);
    assert.equal('money' in state.player, false);
    assert.equal('wealth' in state.player, false);
  }
}

// 9. EventExecutor/ConditionEvaluator/generic numeric writer cannot restore exact balance
async function testRuntimeCannotRestoreExactBalances(): Promise<void> {
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('money'), false);
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('wealth'), false);
  assert.equal(isCanonicalPlayerNumericStat('money'), false);
  assert.equal(isCanonicalPlayerNumericStat('wealth'), false);

  const before = createMinimalState();
  const afterMoney = await new EventExecutor().executeEffects(
    [{ type: 'stat_modify', target: 'money', value: 50, operator: 'add' }],
    before,
  );
  const afterWealth = await new EventExecutor().executeEffects(
    [{ type: 'stat_modify', target: 'wealth', value: 50, operator: 'add' }],
    afterMoney,
  );
  assert.equal('money' in afterWealth.player, false);
  assert.equal('wealth' in afterWealth.player, false);

  const evaluator = new ConditionEvaluator();
  assert.equal(evaluator.evaluate({ type: 'expression', expression: 'player.money >= 1' }, before), false);
  assert.equal(evaluator.evaluate({ type: 'expression', expression: 'player.wealth >= 1' }, before), false);

  const player = createMinimalPlayer();
  writePlayerNumeric(player, 'money', 9999);
  writePlayerNumeric(player, 'wealth', 8888);
  applyStatDeltas(player, { money: 50, wealth: 40, martialPower: 3 });
  assert.equal('money' in player, false);
  assert.equal('wealth' in player, false);
  assert.equal(readPlayerNumeric(player, 'money'), 0);
  assert.equal(readPlayerNumeric(player, 'wealth'), 0);
}

// 10. Live presentation/profile/report surfaces do not own exact balances
function testLiveSurfacesDoNotOwnExactBalances(): void {
  assert.equal(WUXIA_WORLD_PROFILE.stats.some((stat) => stat.id === 'money'), false);
  assert.equal(WUXIA_WORLD_PROFILE.resources.some((resource) => resource.id === 'money'), false);

  const summary: PlayerSummaryDto = {
    name: 'US-010',
    age: 30,
    martialPower: 0,
    chivalry: 0,
    constitution: 0,
    wealthCapacity: 'modest_savings',
    ownedAssets: [],
    reputation: 0,
    connections: 0,
    knowledge: 0,
    businessAcumen: 0,
    influence: 0,
    charisma: 0,
    affiliation: null,
    title: null,
    alive: true,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    currentYear: 30,
    currentMonth: 1,
    currentDay: 1,
  };
  assert.equal('money' in summary, false);
  const model = buildMainScreenModel(summary, { schemaVersion: LIFE_MEMORY_SCHEMA_VERSION, derivedAtAge: 30 });
  assert.equal(model.topResources.some((item) => item.key === 'money' || item.label === '银两'), false);
  assert.equal(model.topResources.some((item) => item.key === 'wealthCapacity'), true);

  const dtoBlock = read('src/contracts/sessionProgression.ts').match(
    /export interface PlayerSummaryDto \{[\s\S]*?\n\}/,
  )?.[0];
  assert(dtoBlock);
  assert.equal(/\bmoney\b/.test(dtoBlock!), false);
}

// 11. Composite Destiny has no exact balance resources dimension
function testCompositeDestinyNoExactBalanceResources(): void {
  const typeBlock = read('src/narrative/profile/types.ts').match(/export type DestinyDimension\s*=([\s\S]*?);/)?.[0];
  assert(typeBlock);
  assert.equal(/\|\s*'resources'/.test(typeBlock!), false);

  const fn = read('src/p16/originSurfaces.ts').match(/export function readDimensionValueForDestiny\([\s\S]*?\n\}/)?.[0];
  assert(fn);
  assert.equal(/case\s+'resources'/.test(fn!), false);
  assert.equal(/player\.money|player\.wealth/.test(fn!), false);

  const player = { martialPower: 10, connections: 20, reputation: 30, money: 999, wealth: 888 } as PlayerState;
  assert.equal(readDimensionValueForDestiny(player, {}, 'resources'), 0);
}

// 12. Unloaded legacy files non-authoritative; cannot enter formal catalog without guard failure
function testUnloadedLegacyRemainsNonAuthoritative(): void {
  const eventsIndex = readJson<{ imports: string[] }>('src/data/events.json');
  const deferredBacklog = ['money-events.json', 'economy.json', 'shop.json'];
  for (const file of deferredBacklog) {
    assert.equal(
      eventsIndex.imports.some((entry) => entry.includes(file)),
      false,
      `${file} must not be wired into events.json`,
    );
  }
  assert.equal(EventLoader.getInstance().getUndeclaredImportPaths().length, 0);

  const loader = EventLoader.getInstance();
  for (const file of deferredBacklog) {
    const stem = file.replace('.json', '');
    assert.equal(
      loader.getAllEvents().some((event) => event.id.includes(stem) && event.storyLine?.includes(stem)),
      false,
      `no runtime event from unloaded ${file}`,
    );
  }

  const legacyTsPaths = [
    'src/data/longEvents.ts',
    'src/data/storyData.ts',
    'src/core/EffectExecutor.ts',
  ];
  const legacyWithWalletHistory = legacyTsPaths.filter((rel) => {
    const abs = path.resolve(root, rel);
    return fs.existsSync(abs) && (/\bmoney\b/.test(read(rel)) || /MONEY_MODIFY/.test(read(rel)));
  });
  assert.equal(legacyWithWalletHistory.length >= 2, true,
    'unloaded legacy TS backlog must remain on disk as non-authoritative history');

  const deferredOfficial = read('src/data/lines/identity-official.json');
  assert.equal(deferredOfficial.includes('"target": "money"') || deferredOfficial.includes('"stat": "money"'), true);
  assert.equal(eventsIndex.imports.includes('./lines/identity-official.json'), false);

  const sampleLegacyEvents = readJson<Array<{ id: string; autoEffects?: EffectDefinition[]; choices?: Array<{ effects?: EffectDefinition[] }> }>>(
    'src/data/lines/money-events.json',
  );
  const sampleLegacyEvent = sampleLegacyEvents[0];
  assert(sampleLegacyEvent);
  const guardErrors = collectFormalWalletAuthoringErrors([sampleLegacyEvent as never]);
  assert.equal(guardErrors.length > 0, true, 'unloaded legacy wallet content must fail formal guard if imported');
}

async function main(): Promise<void> {
  testRuntimePlayerStateHasNoExactBalanceFields();
  testSnapshotPlayerShapeHasNoExactBalanceFields();
  testValidatorsRejectLegacyBalanceAndSchema();
  testWealthCapacityRequiredAndRoundTrips();
  testFormalEventLoaderAuthoringZeroAndRejected();
  testDifficultySetbackMoneyMutationZero();
  await testRuntimeCannotRestoreExactBalances();
  testLiveSurfacesDoNotOwnExactBalances();
  testCompositeDestinyNoExactBalanceResources();
  testUnloadedLegacyRemainsNonAuthoritative();
  console.log('globalMoneyPhysicalRemovalClosure.test.ts: ok');
}

void main();
