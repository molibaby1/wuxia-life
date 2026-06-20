import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import type { LifeMemorySummary } from '../src/types/lifeMemory';
import { buildMainScreenModel } from '../src/components/mainScreenModel';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function createPlayer(overrides: Partial<PlayerSummaryDto> = {}): PlayerSummaryDto {
  return {
    name: '沈孤舟',
    age: 19,
    martialPower: 42,
    externalSkill: 31,
    internalSkill: 27,
    qinggong: 22,
    chivalry: 13,
    constitution: 18,
    comprehension: 24,
    money: 88,
    sect: '武当',
    alive: true,
    currentYear: 19,
    currentMonth: 6,
    currentDay: 1,
    ...overrides,
  };
}

function createLifeMemory(overrides: Partial<LifeMemorySummary> = {}): LifeMemorySummary {
  return {
    schemaVersion: '1.0.0',
    derivedAtAge: 19,
    routeStatus: {
      primary: { routeId: 'sect', name: '中立门派', phase: '未入门' },
      diagnostic: {
        routeStates: {},
        activeRouteFlags: [],
      },
    },
    risks: [
      {
        id: 'body-weak',
        visibility: 'player',
        label: '身子正虚',
        severity: 'medium',
        warningLevel: 'L1',
        sortKey: 10,
        diagnostic: { sourceFlags: [], statSignals: [] },
      },
    ],
    ...overrides,
  };
}

console.log('=== Main Screen Model Tests ===\n');

{
  const model = buildMainScreenModel(createPlayer(), createLifeMemory());

  assert(model.routeSummary === '中立门派 · 未入门', 'route summary should join name and phase');
  assert(model.stageTags.length === 2, 'stage tags should expose sect + phase only');
  assert(model.stageTags[0] === '武当', 'stage tags first item should be sect');
  assert(model.stageTags[1] === '未入门', 'stage tags second item should be route phase');
  assert(model.riskSummary === '中 · 身子正虚', 'risk summary should map severity to Chinese level');
  assert(model.tendencySummary === '悟性 24 / 体魄 18', 'tendency should prefer representative stats');
  assert(model.topResources.length === 3, 'top resources should stay capped at three');
  assert(
    model.coreStats.map((item) => item.label).join(',') === '功力,外功,内功,轻功,体魄,银两',
    'core stats should keep fixed six-item order',
  );
  assert(model.fullStatGroups.length === 4, 'full stats should be grouped into four sections');
  console.log('✓ builds default route/risk/tendency/core groups');
}

{
  const model = buildMainScreenModel(
    createPlayer({
      martialPower: 12,
      externalSkill: 11,
      internalSkill: 10,
      qinggong: 9,
      constitution: 8,
      comprehension: 7,
      chivalry: 6,
    }),
    createLifeMemory({ risks: [] }),
  );

  assert(model.riskSummary === '稳 · 暂无明显隐患', 'missing visible risk should degrade to safe copy');
  assert(model.tendencySummary === '尚未成势', 'flat low stats should degrade to no-tendency copy');
  console.log('✓ degrades risk and tendency when no strong signal exists');
}

{
  const model = buildMainScreenModel(
    createPlayer({
      martialPower: 35,
      internalSkill: 34,
      externalSkill: 33,
      qinggong: 15,
      constitution: 12,
      comprehension: 11,
      chivalry: 9,
    }),
    createLifeMemory(),
  );

  assert(model.tendencySummary === '功力 35', 'near-duplicate martial stats should collapse to one route-explaining stat');
  console.log('✓ avoids noisy duplicate tendency entries');
}

console.log('\n=== Main Screen Model Tests Passed ===');
