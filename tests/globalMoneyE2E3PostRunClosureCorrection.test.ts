import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { explainChoiceRequirement } from '../src/core/activePlanning/ChoiceRequirementExplanation';
import { ConditionEvaluator } from '../src/core/ConditionEvaluator';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { GAME_STATE_SNAPSHOT_SCHEMA_VERSION } from '../src/contracts/gameStateSnapshot';
import { WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { validateWorldProfileForGate } from '../src/p12/profileVerification';
import type { GameState } from '../src/types/eventTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function extractGetStatNameBlock(): string {
  const source = read('src/composables/useNewGameEngine.ts');
  const match = source.match(/const getStatName\s*=\s*\(stat:\s*string\):\s*string\s*=>\s*\{[\s\S]*?return statNames\[stat\][\s\S]*?\};/);
  assert(match, 'getStatName must exist in useNewGameEngine');
  return match[0];
}

function extractOutcomeNarrativeBlock(): string {
  const source = read('src/composables/useNewGameEngine.ts');
  const match = source.match(/statName === '金钱'[\s\S]{0,180}/);
  return match?.[0] ?? '';
}

function testUseNewGameEngineHasNoWalletPresentation(): void {
  const getStatName = extractGetStatNameBlock();
  assert.equal(/\bmoney\s*:/.test(getStatName), false, 'getStatName must not map money');
  assert.equal(/金钱|银两/.test(getStatName), false, 'getStatName must not expose wallet labels');

  const walletBranch = extractOutcomeNarrativeBlock();
  assert.equal(walletBranch.includes("statName === '金钱'"), false, 'wallet outcome branch must be retired');
  assert.equal(/钱袋|积蓄少了一些|积蓄/.test(read('src/composables/useNewGameEngine.ts').match(/case 'stat_modify':[\s\S]*?break;/)?.[0] ?? ''), false);
}

function testD6DenyGuardsRemain(): void {
  const source = read('src/composables/useNewGameEngine.ts');
  assert.equal((source.match(/if \(target === 'money'\) \{\s*continue;\s*\}/g) ?? []).length >= 1, true,
    'D6 money deny/ignore guards must remain');
}

function testChoiceRequirementExplanationHasNoMoneyVocabulary(): void {
  const source = read('src/core/activePlanning/ChoiceRequirementExplanation.ts');
  assert.equal(/\bmoney\s*:\s*'银两'/.test(source), false, 'STAT_LABELS must not map money→银两');

  const state = {
    player: {
      wealthCapacity: 'no_surplus',
      martialPower: 0,
      flags: {},
    },
    flags: {},
  } as unknown as GameState;
  const evaluator = new ConditionEvaluator();
  const moneyResult = explainChoiceRequirement(
    'money_gate',
    { type: 'expression', expression: 'player.money >= 100' },
    state,
    evaluator,
  );
  assert.equal(moneyResult.available, false);
  assert.equal(/银两|金钱|钱袋|积蓄/.test(moneyResult.summary), false,
    `money requirement must not form wallet player hint: ${moneyResult.summary}`);
  assert.equal(moneyResult.explanations.every((item) => item.gapKind === 'unsupported'), true);

  const wealthResult = explainChoiceRequirement(
    'wealth_capacity_gate',
    { type: 'wealth_capacity_at_least', minimum: 'modest_savings' },
    state,
    evaluator,
  );
  assert.equal(wealthResult.explanations[0]?.requirementId, 'wealth_capacity_at_least');
  assert.equal(wealthResult.summary.includes('财力'), true);
}

function testWorldProfileHasNoMoneyAuthority(): void {
  assert.equal(WUXIA_WORLD_PROFILE.stats.some((stat) => stat.id === 'money'), false);
  assert.equal(WUXIA_WORLD_PROFILE.resources.some((resource) => resource.id === 'money'), false);
  assert.deepEqual(
    WUXIA_WORLD_PROFILE.stats.filter((stat) => stat.role === 'scheduling_relevant').map((stat) => stat.id),
    ['influence'],
    'must not invent a replacement scheduling-relevant stat',
  );
}

function testP12AllowsSingleSchedulingRelevantStat(): void {
  const gate = validateWorldProfileForGate(WUXIA_WORLD_PROFILE);
  assert.equal(gate.decision, 'pass', `gate must pass without invented scheduling stats: ${gate.messages.join('; ')}`);
  assert.equal(
    gate.warnings.some((warning) => /Fewer than 2 scheduling-relevant/.test(warning)),
    false,
    'stale >=2 scheduling-stat heuristic must be retired',
  );
  assert.equal(
    WUXIA_WORLD_PROFILE.stats.filter((stat) => stat.role === 'scheduling_relevant').length,
    1,
  );
}

function testGameEngineDiagnosticHasNoMoneyLog(): void {
  const source = read('src/core/GameEngineIntegration.ts');
  assert.equal(/银两 \$\{oldMoney\}→\$\{newMoney\}/.test(source) || /银两 \$\{/.test(source), false);
  assert.equal(/\boldMoney\b/.test(source), false);
  assert.equal(/\bnewMoney\b/.test(source), false);
  assert.equal(/player\.money\s*=\s*nextState\.player\.money/.test(source), false,
    'compatibility money copy must be removed after Phase F');
}

function testPhaseFPhysicalRemovalBoundary(): void {
  assert.equal(GAME_STATE_SNAPSHOT_SCHEMA_VERSION, '3.16.0');
  assert.equal(/\bmoney:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/types/eventTypes.ts')), false);
  assert.equal(/\bmoney:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);
  assert.equal(/\bwealth\?:\s*number\b/.test(read('src/contracts/gameStateSnapshot.ts')), false);

  const validation = read('src/contracts/validation/canonicalGameStateValidation.ts');
  assert.equal(/PLAYER_KEYS[\s\S]*'money'/.test(validation), false);
  assert.equal(/REQUIRED_PLAYER_KEYS[\s\S]*'money'/.test(validation), false);
  assert.equal(/numericKeys[\s\S]*'wealth'/.test(validation), false);

  const engine = new GameEngineIntegration();
  engine.startNewGame('post-run', 'male');
  const player = engine.getGameState().player as unknown as Record<string, unknown>;
  assert.equal('money' in player, false);
  assert.equal('wealth' in player, false);
  assert.equal(player.wealthCapacity, 'no_surplus');
}

testUseNewGameEngineHasNoWalletPresentation();
testD6DenyGuardsRemain();
testChoiceRequirementExplanationHasNoMoneyVocabulary();
testWorldProfileHasNoMoneyAuthority();
testP12AllowsSingleSchedulingRelevantStat();
testGameEngineDiagnosticHasNoMoneyLog();
testPhaseFPhysicalRemovalBoundary();

console.log('globalMoneyE2E3PostRunClosureCorrection.test.ts: ok');
