import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { attributeMeaningCatalog } from '../src/data/attributeMeanings';
import { createExperienceStateDelta } from '../src/headless/playability/experienceTraceTypes';
import { formatWealthEarlyAuditMarkdown, summarizeWealthEarlyAudit } from '../src/p45/wealthEarlyAudit';
import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import type { GameProcessReport } from '../src/types/simulationRecordTypes';

process.env.WUXIA_ENGINE_QUIET = '1';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

function testWealthEarlyAuditOmitsWalletBalance(): void {
  const report = {
    records: [{
      age: 10,
      eventId: 'daily_small_trade_pos_1',
      eventTitle: '小本生意',
      eventType: 'auto',
      gameState: {
        player: {
          age: 10,
          businessAcumen: 3,
          lifeStates: { trainingHabit: 0, studyHabit: 1, businessHabit: 1 },
        },
        flags: { p8_persona_id: 'p8-wealth-shen' },
      },
      timestamp: '2026-01-01T00:00:00.000Z',
    }],
    config: { p8PersonaId: 'p8-wealth-shen' },
  } as GameProcessReport;

  const audit = summarizeWealthEarlyAudit(report);
  const markdown = formatWealthEarlyAuditMarkdown(audit);

  assert.equal('money' in audit.checkpoints[0], false);
  assert.equal(markdown.includes('| money |'), false);
  assert.equal(markdown.includes('银两'), false);
}

function testExperienceTraceIgnoresRetiredWalletStats(): void {
  const engine = new GameEngineIntegration();
  engine.startNewGame('US-004', 'male');
  const before = engine.getGameState();
  const after = engine.getGameState();
  after.player.wealth = 77;

  const delta = createExperienceStateDelta(before, after);
  assert.equal('money' in delta.playerStats, false);
  assert.equal('wealth' in delta.playerStats, false);
  assert.equal(read('src/headless/playability/experienceTraceTypes.ts').includes("'money'"), false);
  assert.equal(read('src/headless/playability/experienceTraceTypes.ts').includes("'wealth'"), false);
}

function testSimulationReportHasNoMoneyGrowth(): void {
  const source = read('src/types/simulationRecordTypes.ts');
  assert.equal(/moneyGrowth/.test(source), false);
  assert.equal(/moneyGrowth/.test(read('src/headless/playability/adaptToGameProcessReport.ts')), false);
}

function testAttributeCatalogOmitsMoney(): void {
  assert.equal(attributeMeaningCatalog.some(entry => entry.key === 'money'), false);
  assert.equal(attributeMeaningCatalog.some(entry => entry.name === '银两'), false);
}

function testInfantPassiveVerificationOmitsWalletSnapshot(): void {
  const source = read('src/p16/infantPassiveChainVerification.ts');
  assert.equal(/money:\s*player/.test(source), false);
  assert.equal(source.includes("FORBIDDEN_INFANT_STATS = ['chivalry', 'martialPower', 'money']"), false);
}

function testBrowserAcceptanceDoesNotParseSilverLabel(): void {
  const source = read('tests/experience/lateLifeBrowserCheckpointAcceptance.ts');
  assert.equal(/银两/.test(source), false);
  assert.equal(source.includes("'money'"), false);
}

function main(): void {
  testWealthEarlyAuditOmitsWalletBalance();
  testExperienceTraceIgnoresRetiredWalletStats();
  testSimulationReportHasNoMoneyGrowth();
  testAttributeCatalogOmitsMoney();
  testInfantPassiveVerificationOmitsWalletSnapshot();
  testBrowserAcceptanceDoesNotParseSilverLabel();
  console.log('globalMoneyObservabilityReportRetirement.test.ts: all passed');
}

main();
