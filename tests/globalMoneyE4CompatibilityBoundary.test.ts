import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import { explainChoiceRequirement } from '../src/core/activePlanning/ChoiceRequirementExplanation';
import {
  EventLoader,
  collectFormalWalletAuthoringErrors,
} from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { createExperienceStateDelta } from '../src/headless/playability/experienceTraceTypes';
import { formatWealthEarlyAuditMarkdown, summarizeWealthEarlyAudit } from '../src/p45/wealthEarlyAudit';
import { readDimensionValueForDestiny } from '../src/p16/originSurfaces';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { validateWorldProfileForGate } from '../src/p12/profileVerification';
import {
  writePlayerNumeric,
  readPlayerNumeric,
  isCanonicalPlayerNumericStat,
} from '../src/utils/playerStatAccess';
import type { EffectDefinition, GameState, PlayerState } from '../src/types/eventTypes';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function read(relativePath: string): string {
  return fs.readFileSync(path.resolve(root, relativePath), 'utf8');
}

function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...listTsFiles(full));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

function relSrc(absPath: string): string {
  return path.relative(root, absPath).replace(/\\/g, '/');
}

/** Deny guards, anti-reintroduction, and identifier-only references — not ownership. */
const ALLOWED_NON_OWNERSHIP = new Set([
  'src/core/EventLoader.ts',
  'src/core/ConditionEvaluator.ts',
  'src/core/EventExecutor.ts',
  'src/core/activePlanning/ChoiceRequirementExplanation.ts',
  'src/composables/useNewGameEngine.ts',
  'src/utils/playerStatAccess.ts',
  'src/p8/collectPersonaMetrics.ts',
  'src/narrative/profile/wuxiaResources.ts',
  'src/core/TraitSystem.ts',
]);

/** Unloaded / deprecated parallel content — not current compiled runtime authority. */
const EXCLUDED_UNLOADED_LEGACY = new Set([
  'src/data/longEvents.ts',
  'src/data/storyData.ts',
  'src/data/longEventExample.ts',
  'src/core/EffectExecutor.ts',
  'src/composables/useGameEngine.ts',
  'src/types/effects.ts',
]);

const P16_P25_REPORT_ROOTS = ['src/p16', 'src/p17', 'src/p18', 'src/p19', 'src/p20', 'src/p21', 'src/p22', 'src/p23', 'src/p25'] as const;

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

function createMinimalState(): GameState {
  const player: PlayerState = {
    name: 'E4边界',
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
  return { player, flags: {}, relations: {}, eventHistory: [], actionHistory: [] };
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

function hasCompiledMoneyWealthOwnership(source: string): boolean {
  const body = stripComments(source);
  if (/\bplayer\.money\b/.test(body)) return true;
  if (/\bplayer\.wealth\b/.test(body)) return true;
  if (/\bupdates\.money\b/.test(body)) return true;
  if (/case\s+['"]MONEY_MODIFY['"]/.test(body)) return true;
  if (/replaceOptionalPlayerField\(\s*['"]wealth['"]\s*\)/.test(body)) return true;
  if (/\bmoney:\s*(?!0\b)\d/.test(body)) return true;
  if (/\bwealth:\s*\d/.test(body)) return true;
  return false;
}

function testFormalCatalogMoneyAndNumericWealthZero(): void {
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
}

async function testRuntimeCannotAuthorOrReadExactBalances(): Promise<void> {
  assert.equal(read('src/core/EventExecutor.ts').includes("'money'"), false);
  assert.equal(read('src/core/EventExecutor.ts').includes("'wealth'"), false);
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('money'), false);
  assert.equal(ConditionEvaluator.DIRECT_PLAYER_PROPERTIES.has('wealth'), false);

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
}

function testGenericNumericWriterCannotCreateRetiredBalances(): void {
  assert.equal(isCanonicalPlayerNumericStat('money'), false);
  assert.equal(isCanonicalPlayerNumericStat('wealth'), false);
  const player = createMinimalState().player;
  writePlayerNumeric(player, 'money', 9999);
  writePlayerNumeric(player, 'wealth', 8888);
  assert.equal('money' in player, false);
  assert.equal('wealth' in player, false);
  assert.equal(readPlayerNumeric(player, 'money'), 0);
  assert.equal(readPlayerNumeric(player, 'wealth'), 0);
}

function testCompositeDestinyResourcesNoLongerReadsBalances(): void {
  const typeBlock = read('src/narrative/profile/types.ts').match(/export type DestinyDimension\s*=([\s\S]*?);/)?.[0];
  assert(typeBlock);
  assert.equal(/\|\s*'resources'/.test(typeBlock!), false);

  const fn = read('src/p16/originSurfaces.ts').match(/export function readDimensionValueForDestiny\([\s\S]*?\n\}/)?.[0];
  assert(fn);
  assert.equal(/case\s+'resources'/.test(fn!), false);
  assert.equal(/player\.money|player\.wealth/.test(fn!), false);

  const player = { martialPower: 10, connections: 20, reputation: 30 } as PlayerState;
  assert.equal(readDimensionValueForDestiny(player, {}, 'resources'), 0);
}

function testObservabilityAndP16P25NoStructuralBalanceDependency(): void {
  assert.equal(read('src/headless/playability/experienceTraceTypes.ts').includes("'money'"), false);
  assert.equal(read('src/headless/playability/experienceTraceTypes.ts').includes("'wealth'"), false);
  assert.equal(/moneyGrowth/.test(read('src/types/simulationRecordTypes.ts')), false);
  assert.equal(/moneyGrowth/.test(read('src/headless/playability/adaptToGameProcessReport.ts')), false);

  const p45Source = read('src/p45/wealthEarlyAudit.ts');
  assert.equal(/\|\s*money\s*\|/.test(p45Source), false);
  assert.equal(/checkpoint\.money/.test(p45Source), false);

  const offenders: string[] = [];
  for (const phaseRoot of P16_P25_REPORT_ROOTS) {
    for (const file of listTsFiles(path.join(root, phaseRoot))) {
      const rel = relSrc(file);
      if (rel === 'src/p25/simulationPlayerState.ts') continue;
      const source = read(rel);
      if (/\bmoney\s*:/.test(source)) offenders.push(`${rel}: money fixture field`);
      if (/\.money\s*=/.test(source)) offenders.push(`${rel}: money mutation`);
      if (/\bwealth\s*:\s*\d/.test(source)) offenders.push(`${rel}: numeric wealth fixture`);
      if (/player\.wealth\b/.test(source)) offenders.push(`${rel}: player.wealth access`);
    }
  }
  assert.equal(offenders.length, 0, offenders.join('\n'));

  const report = {
    records: [{
      age: 10,
      eventId: 'daily_small_trade_pos_1',
      eventTitle: '小本生意',
      eventType: 'auto',
      gameState: { player: { age: 10, businessAcumen: 3, money: 500, lifeStates: { trainingHabit: 0, studyHabit: 1, businessHabit: 1 } }, flags: {} },
      timestamp: '2026-01-01T00:00:00.000Z',
    }],
    config: { p8PersonaId: 'p8-wealth-shen' },
  } as GameProcessReport;
  const audit = summarizeWealthEarlyAudit(report);
  assert.equal('money' in audit.checkpoints[0], false);
  assert.equal(formatWealthEarlyAuditMarkdown(audit).includes('| money |'), false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('E4-trace', 'male');
  const before = engine.getGameState();
  const after = engine.getGameState();
  (after.player as unknown as Record<string, unknown>).money = 99;
  (after.player as unknown as Record<string, unknown>).wealth = 77;
  const delta = createExperienceStateDelta(before, after);
  assert.equal('money' in delta.playerStats, false);
  assert.equal('wealth' in delta.playerStats, false);
}

function testE2E3PlayerFacingClosureRemains(): void {
  assert.equal(WUXIA_WORLD_PROFILE.stats.some((stat) => stat.id === 'money'), false);
  assert.equal(WUXIA_WORLD_PROFILE.resources.some((resource) => resource.id === 'money'), false);
  const gate = validateWorldProfileForGate(WUXIA_WORLD_PROFILE);
  assert.equal(gate.decision, 'pass', gate.messages.join('; '));

  const d6Source = read('src/composables/useNewGameEngine.ts');
  assert.equal(/const getStatName\s*=/.test(d6Source), false);
  assert.equal((d6Source.match(/if \(target === 'money'\) \{\s*continue;\s*\}/g) ?? []).length >= 1, true);

  const state = createMinimalState();
  const evaluator = new ConditionEvaluator();
  const moneyResult = explainChoiceRequirement(
    'money_gate',
    { type: 'expression', expression: 'player.money >= 100' },
    state,
    evaluator,
  );
  assert.equal(moneyResult.available, false);
  assert.equal(/银两|金钱|钱袋|积蓄/.test(moneyResult.summary), false);

  const model = buildMainScreenModel({
    name: 'E4',
    age: 30,
    martialPower: 0,
    chivalry: 0,
    constitution: 0,
    wealthCapacity: 'no_surplus',
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
  } as PlayerSummaryDto, { schemaVersion: LIFE_MEMORY_SCHEMA_VERSION, derivedAtAge: 30 });
  assert.equal(model.topResources.some((item) => item.key === 'money'), false);
}

function testNoCompiledMoneyWealthOwnership(): void {
  const violations: string[] = [];
  for (const file of listTsFiles(path.join(root, 'src'))) {
    const rel = relSrc(file);
    if (ALLOWED_NON_OWNERSHIP.has(rel)) continue;
    if (EXCLUDED_UNLOADED_LEGACY.has(rel)) continue;
    if (rel.startsWith('src/narrative/')) continue;
    if (rel.startsWith('tests/')) continue;

    const source = read(rel);
    if (!hasCompiledMoneyWealthOwnership(source)) continue;
    violations.push(rel);
  }
  assert.deepEqual(
    violations,
    [],
    `compiled money/numeric-wealth ownership must be zero after Phase F:\n${violations.join('\n')}`,
  );
}

function testPhaseFPhysicalRemovalComplete(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  assert.equal(/\bmoney:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bmoney:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal('money' in gameStateSnapshotAge50.state.player, false);
  assert.equal('wealth' in gameStateSnapshotAge50.state.player, false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('E4-phase-f', 'male');
  const player = engine.getGameState().player as unknown as Record<string, unknown>;
  assert.equal('money' in player, false);
  assert.equal('wealth' in player, false);
  assert.equal(player.wealthCapacity, 'no_surplus');
  assert.equal(/player\.money\s*=\s*nextState\.player\.money/.test(read('src/core/GameEngineIntegration.ts')), false);
}

async function main(): Promise<void> {
  testFormalCatalogMoneyAndNumericWealthZero();
  await testRuntimeCannotAuthorOrReadExactBalances();
  testGenericNumericWriterCannotCreateRetiredBalances();
  testCompositeDestinyResourcesNoLongerReadsBalances();
  testObservabilityAndP16P25NoStructuralBalanceDependency();
  testE2E3PlayerFacingClosureRemains();
  testNoCompiledMoneyWealthOwnership();
  testPhaseFPhysicalRemovalComplete();
  console.log('globalMoneyE4CompatibilityBoundary.test.ts: ok');
}

void main();
