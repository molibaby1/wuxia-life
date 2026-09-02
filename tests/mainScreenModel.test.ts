import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PlayerSummaryDto } from '../src/contracts/sessionProgression';
import type { PlayerLifeStates } from '../src/types/eventTypes';
import { LIFE_MEMORY_SCHEMA_VERSION, type LifeMemorySummary } from '../src/types/lifeMemory';
import { buildMainScreenModel, type MainScreenPlayer, P124_MARTIAL_DOMINANT_SAMPLE } from '../src/components/mainScreenModel';

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
    chivalry: 13,
    constitution: 18,
    knowledge: 24,
    connections: 11,
    reputation: 10,
    wealthCapacity: 'no_surplus',
    ownedAssets: [],
    charisma: 0,
    businessAcumen: 0,
    influence: 0,
    affiliation: 'wudang',
    title: null,
    alive: true,
    investments: { martial: 0, statecraft: 0, official: 0, hermit: 0 },
    currentYear: 19,
    currentMonth: 6,
    currentDay: 1,
    ...overrides,
  };
}

function createLifeStates(overrides: Partial<PlayerLifeStates> = {}): PlayerLifeStates {
  return {
    trainingHabit: 0,
    studyHabit: 0,
    businessHabit: 0,
    ...overrides,
  };
}

function createMainScreenPlayer(overrides: Partial<MainScreenPlayer> = {}): MainScreenPlayer {
  return {
    martialPower: 42,
    chivalry: 13,
    constitution: 18,
    knowledge: 24,
    connections: 11,
    reputation: 10,
    wealthCapacity: 'no_surplus',
    ownedAssets: [],
    charisma: 0,
    businessAcumen: 0,
    influence: 0,
    affiliation: 'wudang',
    title: null,
    ...overrides,
  };
}

function createLifeMemory(overrides: Partial<LifeMemorySummary> = {}): LifeMemorySummary {
  return {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: 19,
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

  assert(model.currentGoalSummary === '暂无明确目标', 'current goal should degrade to explicit empty copy');
  assert(model.stageTags.length === 1, 'stage tags should expose affiliation only');
  assert(model.stageTags[0] === '武当派', 'stage tags first item should be affiliation');
  assert(model.riskSummary === '中 · 身子正虚', 'risk summary should map severity to Chinese level');
  assert(model.tendencySummary === '功力 42', 'martial-dominant tendency collapses to martialPower readout');
  assert(!('shapingSummary' in model), 'main screen should not expose shapingSummary');
  assert(model.topResources.length === 1, 'main screen should show only canonical wealth capacity');
  assert(model.topResources[0]?.key === 'wealthCapacity', 'wealth capacity must be the primary economic resource');
  assert(model.topResources[0]?.label === '财力', 'wealth capacity should render the player-facing 财力 label');
  assert(model.topResources[0]?.value === '无余财', 'default wealth capacity should use the canonical label value');
  assert(!model.topResources.some((item) => item.key === 'money' || item.label === '银两'), 'retired wallet must not appear in top resources');
  assert(
    !model.fullStatGroups.find((group) => group.id === 'resource')?.items.some((item) => item.key === 'money' || item.label === '银两'),
    'retired wallet must not appear in expanded resource group',
  );
  assert(model.assetSummary === '暂无资产', 'empty canonical asset ownership should use explicit empty copy');
  assert(
    model.coreStats.map((item) => item.label).join(',') === '功力,体魄,学识,人脉,名望,侠义声誉',
    'core stats should expose the six canonical attributes with equal priority',
  );
  assert(!model.coreStats.some((item) => item.key === 'wealthCapacity'), 'wealth capacity must stay out of the six core attributes');
  assert(
    model.coreStats.find((item) => item.key === 'martialPower')?.description === '武学总读数',
    'martialPower should read as overall martial readout on first screen',
  );
  assert(model.fullStatGroups.length === 5, 'full stats should be grouped into five sections after survival split');
  console.log('✓ builds canonical goal/risk/tendency/core groups');
}

{
  const model = buildMainScreenModel(
    createPlayer(),
    createLifeMemory({ habitTrajectory: [] }),
  );

  assert(model.practiceSummary === '尚未形成持续实践', 'empty player-visible practice should use explicit empty copy');
  console.log('✓ shows an explicit empty practice summary');
}

{
  const model = buildMainScreenModel(
    createPlayer(),
    createLifeMemory({
      habitTrajectory: [
        {
          id: 'habit-trajectory-0',
          visibility: 'player',
          label: '练功实践',
          tierLabel: '有过实质实践',
          sortKey: 1,
        },
      ],
    }),
  );

  assert(model.practiceSummary === '练功实践 · 有过实质实践', 'single practice should keep formal label and tier');
  console.log('✓ renders a single player-visible practice');
}

{
  const model = buildMainScreenModel(
    createPlayer(),
    createLifeMemory({
      habitTrajectory: [
        {
          id: 'habit-trajectory-0',
          visibility: 'player',
          label: '营生实践',
          tierLabel: '贯穿多个阶段',
          sortKey: 5,
        },
        {
          id: 'habit-trajectory-1',
          visibility: 'player',
          label: '读书实践',
          tierLabel: '长期深入',
          sortKey: 4,
        },
        {
          id: 'habit-trajectory-hidden',
          visibility: 'hidden',
          label: '练功实践',
          tierLabel: '贯穿多个阶段',
          sortKey: 5,
        },
        {
          id: 'habit-trajectory-diagnostic',
          visibility: 'diagnostic',
          label: '练功实践',
          tierLabel: '贯穿多个阶段',
          sortKey: 5,
        },
      ],
    }),
  );

  assert(
    model.practiceSummary === '营生实践 · 贯穿多个阶段 / 读书实践 · 长期深入',
    'practice should keep existing order, filter non-player entries, and cap at two items',
  );
  console.log('✓ keeps ordered player-visible practice to two items');
}

{
  const lifeMemory = createLifeMemory({
    achievements: [{
      id: 'achievement-1',
      visibility: 'player',
      label: '完成正道试炼',
      category: 'route',
      sortKey: 10,
      diagnostic: { achievementId: 'achievement-1', sourceFlags: [] },
    }],
    habitTrajectory: [
      {
        id: 'habit-trajectory-0',
        visibility: 'player',
        label: '营生实践',
        tierLabel: '长期深入',
        sortKey: 4,
      },
    ],
  });
  const before = buildMainScreenModel(createPlayer(), lifeMemory);
  const after = buildMainScreenModel(
    createPlayer({
      lifeStates: createLifeStates({
        trainingHabit: 5,
        studyHabit: 5,
        businessHabit: 5,
      }),
      flags: {
        p9_echo_training_hook: true,
        p9_echo_study_hook: true,
        p9_echo_business_hook: true,
        p9_echo_social_hook: true,
        p9_echo_travel_hook: true,
      },
    } as Partial<MainScreenPlayer>),
    lifeMemory,
  );

  assert(before.practiceSummary === after.practiceSummary, 'practice display must only consume LifeMemory trajectory');
  assert(before.tendencySummary === after.tendencySummary, 'practice must not change tendency summary');
  assert(before.affiliationSummary === after.affiliationSummary, 'practice must not change affiliation summary');
  assert(before.titleSummary === after.titleSummary, 'practice must not change title summary');
  assert(before.experienceSummary === after.experienceSummary, 'practice must not change experience summary');
  assert(before.riskSummary === after.riskSummary, 'practice must not change risk summary');
  assert(!after.practiceSummary.includes('交游') && !after.practiceSummary.includes('游历'), 'social/travel flags must not enter practice summary');
  console.log('✓ keeps practice separate from other summary semantics');
}

{
  const summarySource = readFileSync(resolve(process.cwd(), 'src/components/MainScreenLifeSummary.vue'), 'utf8');
  const gameScreenSource = readFileSync(resolve(process.cwd(), 'src/components/GameScreen.vue'), 'utf8');

  assert(summarySource.includes('实践'), 'formal main-screen summary must render the practice row');
  assert(summarySource.includes('practiceSummary'), 'practice row must consume the practiceSummary prop');
  assert(summarySource.includes('印记') && summarySource.includes('milestoneSummary'), 'milestone row must remain conditional and model-driven');
  assert(summarySource.includes('方向') && summarySource.includes('milestoneProspectSummary'), 'prospect row must remain conditional and model-driven');
  assert(gameScreenSource.includes(':practice-summary="mainScreenModel.practiceSummary"'), 'GameScreen must pass the shared practice summary');
  assert(gameScreenSource.includes(':milestone-summary="mainScreenModel.milestoneSummary"'), 'GameScreen must pass the shared milestone summary');
  assert(gameScreenSource.includes(':milestone-prospect-summary="mainScreenModel.milestoneProspectSummary"'), 'GameScreen must pass the shared milestone prospect summary');
  assert(gameScreenSource.includes('buildMainScreenModel(attributePanelPlayer.value, lifeMemorySummary.value)'), 'Local/API must keep the shared main-screen model builder');
  console.log('✓ keeps formal component rendering and Local/API shared builder');
}

{
  const model = buildMainScreenModel(createPlayer(), createLifeMemory());
  const coreLabels = model.coreStats.map((item) => item.label);

  assert(!coreLabels.includes('外功'), 'externalSkill should be downgraded from first-screen coreStats');
  assert(!coreLabels.includes('内功'), 'internalSkill should be downgraded from first-screen coreStats');
  assert(!coreLabels.includes('轻功'), 'qinggong should be downgraded from first-screen coreStats');
  assert(coreLabels.includes('体魄'), 'constitution should remain equally visible with all canonical attributes');
  assert(coreLabels.includes('学识'), 'knowledge should be immediately visible on the first screen');
  assert(coreLabels.includes('功力'), 'martialPower should remain first-screen visible');
  assert(
    model.topResources.map((item) => item.key).join(',') === 'wealthCapacity',
    'resource row must present wealth capacity only',
  );
  console.log('✓ keeps narrowed first-screen emphasis (P123)');
}

{
  const model = buildMainScreenModel(
    createPlayer({
      martialPower: 12,
      constitution: 8,
      knowledge: 7,
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
      constitution: 12,
      knowledge: 11,
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
      knowledge: 24,
      connections: 22,
      charisma: 18,
      businessAcumen: 20,
      constitution: 14,
      chivalry: 8,
      reputation: 12,
      lifeStates: createLifeStates(),
    }),
    createLifeMemory(),
  );

  assert(
    model.tendencySummary.includes('学识') || model.tendencySummary.includes('经营') || model.tendencySummary.includes('人脉'),
    'merchant sample should surface numeric life-direction stats',
  );
  const highHabitModel = buildMainScreenModel(
    createMainScreenPlayer({
      martialPower: 22,
      knowledge: 24,
      connections: 22,
      charisma: 18,
      businessAcumen: 20,
      constitution: 14,
      chivalry: 8,
      reputation: 12,
      lifeStates: createLifeStates({ businessHabit: 5 }),
    }),
    createLifeMemory(),
  );
  assert(model.tendencySummary === highHabitModel.tendencySummary, 'businessHabit must not change tendency summary');
  console.log('✓ non-martial tendency surfaces canonical numeric signals');
}

{
  const model = buildMainScreenModel(
    createPlayer({
      martialPower: P124_MARTIAL_DOMINANT_SAMPLE.martialPower,
      constitution: 12,
      knowledge: 11,
      chivalry: 9,
    }),
    createLifeMemory(),
  );

  assert(
    model.tendencySummary === `功力 ${P124_MARTIAL_DOMINANT_SAMPLE.martialPower}`,
    'martial-dominant sample should keep martialPower as top-level combat readout',
  );
  console.log('✓ martial-dominant tendency remains independent of route lifecycle');
}

{
  const model = buildMainScreenModel(
    createMainScreenPlayer({
      lifeStates: createLifeStates({ trainingHabit: 3, studyHabit: 2 }),
    }),
    createLifeMemory(),
  );

  assert(!('shapingSummary' in model), 'practice habits must not define main-screen shaping summary');
  console.log('✓ keeps practice out of main-screen shaping summary');
}

{
  const model = buildMainScreenModel(
    createPlayer({ lifeStates: createLifeStates({ businessHabit: 2 }) }),
    createLifeMemory(),
  );

  assert(!('shapingSummary' in model), 'PlayerSummaryDto practice lifeStates must not drive shaping summary');
  console.log('✓ PlayerSummaryDto practice lifeStates stay out of shaping summary');
}

{
  const model = buildMainScreenModel(createPlayer(), createLifeMemory({
    achievedMilestones: [
      { id: 'milestone-1', visibility: 'player', label: '初涉书卷', description: '开始读书', category: 'study', evidenceLabels: ['主动读书 1 次'], sortKey: 80, diagnostic: { milestoneId: 'study-first-step', conditionTypes: ['action_count'] } },
      { id: 'milestone-2', visibility: 'player', label: '读书成习', description: '读书成习', category: 'study', evidenceLabels: ['读书实践 2 级'], sortKey: 90, diagnostic: { milestoneId: 'study-habit-formed', conditionTypes: ['habit_at_least'] } },
      { id: 'milestone-3', visibility: 'player', label: '文武并进', description: '文武并进', category: 'mixed', evidenceLabels: ['读书实践 2 级'], sortKey: 110, diagnostic: { milestoneId: 'study-training-balanced', conditionTypes: ['habit_at_least'] } },
    ],
    milestoneProspects: [
      { id: 'prospect-1', visibility: 'player', label: '少年勤学', description: '少年读书', category: 'study', progressRatio: 2 / 3, progressLabels: ['20 岁前主动读书 3 次 2/3'], sortKey: 100, diagnostic: { milestoneId: 'study-young-diligent', conditionTypes: ['action_count'] } },
      { id: 'prospect-2', visibility: 'player', label: '练功成习', description: '练功', category: 'training', progressRatio: 1 / 2, progressLabels: ['练功实践 2 级 1/2'], sortKey: 90, diagnostic: { milestoneId: 'training-habit-formed', conditionTypes: ['habit_at_least'] } },
    ],
  }));
  assert(model.milestoneSummary === '文武并进、读书成习', 'milestones should be priority-ranked and capped at two');
  assert(model.milestoneProspectSummary === '少年勤学 · 20 岁前主动读书 3 次 2/3', 'only the top prospect should be rendered');
  const empty = buildMainScreenModel(createPlayer(), createLifeMemory());
  assert(empty.milestoneSummary === undefined && empty.milestoneProspectSummary === undefined, 'empty milestone data should not render summaries');
  console.log('✓ summarizes visible milestone feedback without changing existing summaries');
}

{
  const model = buildMainScreenModel(createPlayer(), createLifeMemory());
  const combatGroup = model.fullStatGroups.find((group) => group.id === 'combat');
  const survivalGroup = model.fullStatGroups.find((group) => group.id === 'survival');

  assert(combatGroup?.label === '武学', 'P125 combat tab should frame martial readout hierarchy');
  assert(
    combatGroup?.items.map((item) => item.key).join(',') === 'martialPower',
    'P125 combat group should expose martialPower only',
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
    assert(
      !combatGroup?.items.some((stat) => stat.key === key),
      `P125 combat group must not expose deleted field ${key}`,
    );
  }

  assert(survivalGroup?.label === '生存底子', 'P125 constitution should sit in survival-base group');
  assert(
    survivalGroup?.items.length === 1 && survivalGroup.items[0]?.key === 'constitution',
    'P125 survival group should contain constitution only',
  );
  assert(
    survivalGroup?.items[0]?.description?.includes('身体底子'),
    'P125 constitution should describe survival base',
  );
  console.log('✓ P125 full-panel role clarification regression');
}

console.log('\n=== Main Screen Model Tests Passed ===');
