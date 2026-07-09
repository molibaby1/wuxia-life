import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import type { PlayerLifeStates } from '../src/types/eventTypes';
import type { LifeMemorySummary } from '../src/types/lifeMemory';
import { buildMainScreenModel, type MainScreenPlayer, P124_NON_MARTIAL_SAMPLE, P124_MARTIAL_DOMINANT_SAMPLE } from '../src/components/mainScreenModel';

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

function createLifeStates(overrides: Partial<PlayerLifeStates> = {}): PlayerLifeStates {
  return {
    fatigue: 0,
    discipline: 0,
    indulgence: 0,
    anxiety: 0,
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
    socialMomentum: 0,
    familyBond: 0,
    ...overrides,
  };
}

function createMainScreenPlayer(overrides: Partial<MainScreenPlayer> = {}): MainScreenPlayer {
  return {
    ...createPlayer(),
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
  assert(model.shapingSummary === '塑形未成', 'shaping should degrade when no habit axis is strong');
  assert(model.topResources.length === 3, 'top resources should stay capped at three');
  assert(
    model.coreStats.map((item) => item.label).join(',') === '功力,银两',
    'core stats should keep narrowed martial readout plus money',
  );
  assert(
    model.coreStats.find((item) => item.key === 'martialPower')?.description === '武学总读数',
    'martialPower should read as overall martial readout on first screen',
  );
  assert(model.fullStatGroups.length === 5, 'full stats should be grouped into five sections after survival split');
  console.log('✓ builds default route/risk/tendency/core groups');
}

{
  const model = buildMainScreenModel(createPlayer(), createLifeMemory());
  const coreLabels = model.coreStats.map((item) => item.label);
  const combatGroup = model.fullStatGroups.find((group) => group.id === 'combat');
  const combatLabels = combatGroup?.items.map((item) => item.label) ?? [];

  assert(!coreLabels.includes('外功'), 'externalSkill should be downgraded from first-screen coreStats');
  assert(!coreLabels.includes('内功'), 'internalSkill should be downgraded from first-screen coreStats');
  assert(!coreLabels.includes('轻功'), 'qinggong should be downgraded from first-screen coreStats');
  assert(!coreLabels.includes('体魄'), 'constitution should not double-amplify on first-screen coreStats');
  assert(coreLabels.includes('功力'), 'martialPower should remain first-screen visible');
  assert(
    combatLabels.join(',') === '功力·总读数,外功,内功,轻功',
    'combat group should expose martial total readout plus specialization stats only',
  );
  const survivalGroup = model.fullStatGroups.find((group) => group.id === 'survival');
  assert(survivalGroup?.label === '生存底子', 'constitution should live in survival-base group');
  assert(
    survivalGroup?.items.find((item) => item.key === 'constitution')?.description?.includes('承伤耐受'),
    'constitution in full panel should read as survival foundation',
  );
  assert(
    combatGroup?.items.find((item) => item.key === 'martialPower')?.description?.includes('综合武学总读数'),
    'martialPower in full panel should read as overall martial readout',
  );
  for (const key of ['externalSkill', 'internalSkill', 'qinggong'] as const) {
    const description = combatGroup?.items.find((item) => item.key === key)?.description ?? '';
    assert(description.includes('风格特长'), `${key} should read as specialization-style dimension`);
    assert(description.includes('不单独代表总读数'), `${key} should not imply independent total-power readout`);
  }
  assert(
    model.topResources.find((item) => item.key === 'constitution')?.description === '生存底子',
    'constitution in topResources should read as survival base',
  );
  console.log('✓ keeps narrowed first-screen emphasis while preserving full martial stat access');
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

{
  const model = buildMainScreenModel(
    createMainScreenPlayer({
      martialPower: 22,
      externalSkill: 18,
      internalSkill: 16,
      qinggong: 14,
      knowledge: 24,
      connections: 22,
      charisma: 18,
      businessAcumen: 20,
      comprehension: 16,
      constitution: 14,
      chivalry: 8,
      reputation: 12,
      lifeStates: createLifeStates({ businessHabit: P124_NON_MARTIAL_SAMPLE.businessHabit }),
    }),
    createLifeMemory({
      routeStatus: {
        primary: {
          routeId: P124_NON_MARTIAL_SAMPLE.routeId,
          name: P124_NON_MARTIAL_SAMPLE.routeName,
          phase: P124_NON_MARTIAL_SAMPLE.routePhase,
        },
        diagnostic: { routeStates: {}, activeRouteFlags: [] },
      },
    }),
  );

  assert(
    !model.tendencySummary.includes('功力')
    && !model.tendencySummary.includes('内功')
    && !model.tendencySummary.includes('外功'),
    'merchant sample should not surface martial tendency when non-martial stats lead',
  );
  assert(
    model.tendencySummary.includes('学识') || model.tendencySummary.includes('经营') || model.tendencySummary.includes('人脉'),
    'merchant sample should surface non-martial life-direction stats',
  );
  assert(model.shapingSummary === '营生 · 渐成', 'merchant shaping should cooperate with tendency read');
  console.log('✓ merchant route surfaces non-martial tendency summary');
}

{
  const model = buildMainScreenModel(
    createPlayer({
      martialPower: P124_MARTIAL_DOMINANT_SAMPLE.martialPower,
      internalSkill: P124_MARTIAL_DOMINANT_SAMPLE.internalSkill,
      externalSkill: P124_MARTIAL_DOMINANT_SAMPLE.externalSkill,
      qinggong: 15,
      constitution: 12,
      comprehension: 11,
      chivalry: 9,
    }),
    createLifeMemory({
      routeStatus: {
        primary: { routeId: 'sect', name: '正道门派', phase: '路线进行中' },
        diagnostic: { routeStates: {}, activeRouteFlags: [] },
      },
    }),
  );

  assert(
    model.tendencySummary === `功力 ${P124_MARTIAL_DOMINANT_SAMPLE.martialPower}`,
    'martial-dominant sample should keep martialPower as top-level combat readout',
  );
  console.log('✓ martial-dominant route preserves martial tendency readability');
}

{
  const model = buildMainScreenModel(
    createMainScreenPlayer({
      lifeStates: createLifeStates({ trainingHabit: 3, studyHabit: 2 }),
    }),
    createLifeMemory(),
  );

  assert(model.shapingSummary === '习武 · 成形 / 饱学 · 渐成', 'shaping should rank habit axes with readable labels');
  console.log('✓ surfaces dominant habit shaping on main screen');
}

{
  const model = buildMainScreenModel(
    createPlayer({ lifeStates: createLifeStates({ businessHabit: 2 }) }),
    createLifeMemory(),
  );

  assert(model.shapingSummary === '营生 · 渐成', 'PlayerSummaryDto lifeStates should drive shapingSummary in API mode');
  console.log('✓ PlayerSummaryDto lifeStates feed shaping summary');
}

{
  const model = buildMainScreenModel(createPlayer(), createLifeMemory());
  const combatGroup = model.fullStatGroups.find((group) => group.id === 'combat');
  const survivalGroup = model.fullStatGroups.find((group) => group.id === 'survival');

  assert(combatGroup?.label === '武学', 'P125 combat tab should frame martial readout hierarchy');
  assert(
    combatGroup?.items.map((item) => item.key).join(',') === 'martialPower,externalSkill,internalSkill,qinggong',
    'P125 combat group should keep total readout plus three specialization stats',
  );
  assert(
    combatGroup?.items.find((item) => item.key === 'martialPower')?.label === '功力·总读数',
    'P125 martialPower label should signal total readout',
  );
  assert(
    combatGroup?.items.find((item) => item.key === 'martialPower')?.description?.includes('综合武学总读数'),
    'P125 martialPower description should explain overall martial readout',
  );

  for (const key of ['externalSkill', 'internalSkill', 'qinggong'] as const) {
    const item = combatGroup?.items.find((stat) => stat.key === key);
    assert(Boolean(item), `P125 should still expose ${key} in full panel`);
    assert(item?.description?.includes('风格特长'), `P125 ${key} should read as specialization dimension`);
    assert(
      !item?.description?.includes('综合武学总读数'),
      `P125 ${key} should not borrow total-readout wording`,
    );
  }

  assert(survivalGroup?.label === '生存底子', 'P125 constitution should sit in survival-base group');
  assert(
    survivalGroup?.items.length === 1 && survivalGroup.items[0]?.key === 'constitution',
    'P125 survival group should contain constitution only',
  );
  assert(
    survivalGroup?.items[0]?.description?.includes('不是外功/内功/轻功'),
    'P125 constitution should distance itself from martial specialization trio',
  );
  console.log('✓ P125 full-panel role clarification regression');
}

console.log('\n=== Main Screen Model Tests Passed ===');
