/**
 * Bounded Phase B player-visible presentation review.
 * Uses real derive + presentation helpers; does not mutate gameplay eligibility.
 */
import { strict as assert } from 'node:assert';
import { deriveLifeMemorySummary } from '../src/core/deriveLifeMemorySummary';
import { buildMainScreenModel } from '../src/components/mainScreenModel';
import {
  buildLifeMemoryFeedbackOverlayCards,
  collectNewLifeMemoryFeedback,
} from '../src/components/lifeMemoryFeedback';
import { formatAchievedMilestoneHistoryTitle } from '../src/components/milestonePresentation';
import type { GameState, PlayerState } from '../src/types/eventTypes';
import { LIFE_MEMORY_SCHEMA_VERSION } from '../src/types/lifeMemory';

function createState(overrides: Partial<GameState> = {}): GameState {
  const player: PlayerState = {
    name: '审阅侠客', gender: 'male', age: 26, martialPower: 20, chivalry: 10,
    charisma: 10, constitution: 40, knowledge: 30,
    businessAcumen: 10, influence: 10, connections: 10, martialHeritage: 0,
    scholarlyHeritage: 0, merchantNetwork: 0, wealthCapacity: 'no_surplus', reputation: 20,
    affiliation: null, title: null, healthStatus: 'healthy', statuses: [], alive: true,
    items: [], flags: {}, events: [], relationships: [], children: 0, spouse: null,
    lifeStates: { trainingHabit: 0, studyHabit: 0, businessHabit: 0 },
  };
  return {
    saveVersion: '1.0.0',
    lastSavedAt: Date.now(),
    gameTimestamp: 0,
    player,
    currentTime: { year: 26, month: 1, day: 1 },
    flags: {},
    relations: {},
    eventHistory: [],
    statistics: { totalEvents: 0, totalChoices: 0, totalYears: 0 },
    achievements: [],
    actionHistory: [],
    ...overrides,
  };
}

function action(category: 'study' | 'training' | 'business', age: number) {
  return {
    actionId: `${category}-${age}`, category, age, sourceKind: 'active_action' as const,
    duration: { value: 1, unit: 'year' as const }, deltas: {},
    timestamp: { year: age, month: 1, day: 1 },
  };
}

function cardText(state: GameState, previous?: GameState) {
  const prev = previous ? deriveLifeMemorySummary(previous) : {
    schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
    derivedAtAge: 0,
  };
  const current = deriveLifeMemorySummary(state);
  const items = collectNewLifeMemoryFeedback(prev, current);
  return {
    summary: current,
    cards: buildLifeMemoryFeedbackOverlayCards(items),
    model: buildMainScreenModel(state.player, current),
    history: (current.achievedMilestones ?? []).map(formatAchievedMilestoneHistoryTitle),
  };
}

const findings: string[] = [];

{
  const before = createState();
  const after = createState({ actionHistory: [action('study', 18)] });
  const { cards, model } = cardText(after, before);
  const card = cards.find(c => c.title?.includes('初涉书卷'));
  assert(card, 'T1 card missing');
  assert.match(card!.sourceLabel ?? '', /起步/);
  assert.match(card!.title, /★ 初涉书卷/);
  assert.doesNotMatch(JSON.stringify(card), /恭喜|知道了|modal/);
  findings.push(`T1: source=${card!.sourceLabel}; title=${card!.title}; position=${model.milestoneSummary}`);
}

{
  const before = createState({
    player: { ...createState().player, lifeStates: { studyHabit: 1, trainingHabit: 0, businessHabit: 0 } },
    actionHistory: [action('study', 18)],
  });
  const after = createState({
    player: { ...createState().player, lifeStates: { studyHabit: 2, trainingHabit: 0, businessHabit: 0 } },
    actionHistory: [action('study', 18)],
  });
  const { cards, model } = cardText(after, before);
  const card = cards.find(c => c.title?.includes('读书成习'));
  assert(card, 'T2 card missing');
  assert.match(card!.sourceLabel ?? '', /成形/);
  assert.match(card!.title, /★★ 读书成习/);
  findings.push(`T2: source=${card!.sourceLabel}; title=${card!.title}; position=${model.milestoneSummary}`);
}

{
  const before = createState({
    player: { ...createState().player, lifeStates: { trainingHabit: 3, studyHabit: 0, businessHabit: 0 } },
  });
  const after = createState({
    player: { ...createState().player, lifeStates: { trainingHabit: 4, studyHabit: 0, businessHabit: 0 } },
  });
  const { cards, model } = cardText(after, before);
  const card = cards.find(c => c.title?.includes('功行渐深'));
  assert(card, 'T3 card missing');
  assert.match(card!.sourceLabel ?? '', /深化/);
  assert.match(card!.title, /★★★ 功行渐深/);
  findings.push(`T3: source=${card!.sourceLabel}; title=${card!.title}; position=${model.milestoneSummary}`);
}

{
  const before = createState();
  const after = createState({
    eventHistory: [{ eventId: 'setback_cultivation_deviation', age: 22 }],
  });
  const { cards, history } = cardText(after, before);
  const card = cards.find(c => c.title?.includes('行功遇险'));
  assert(card, 'turning point card missing');
  const blob = JSON.stringify(card);
  assert.match(card!.sourceLabel ?? '', /人生转折/);
  assert.doesNotMatch(blob, /★|恭喜|奖励/);
  assert(history.some(line => line.includes('人生转折 · 行功遇险')));
  findings.push(`TURNING_POINT: source=${card!.sourceLabel}; title=${card!.title}`);
}

{
  const before = createState();
  const after = createState({
    eventHistory: [{ eventId: 'p26_study_habit_midlife_callback', age: 26 }],
  });
  const { cards, history } = cardText(after, before);
  const card = cards.find(c => c.title?.includes('旧卷回声'));
  assert(card, 'payoff card missing');
  assert.match(card!.sourceLabel ?? '', /往事回响/);
  assert.doesNotMatch(JSON.stringify(card), /★/);
  assert.match(card!.body ?? '', /读书|积累|用场/);
  assert(history.some(line => line.includes('往事回响 · 旧卷回声')));
  findings.push(`PAYOFF_ECHO: source=${card!.sourceLabel}; body=${card!.body}`);
}

{
  const before = createState({
    player: { ...createState().player, lifeStates: { studyHabit: 2, trainingHabit: 1, businessHabit: 0 } },
  });
  const after = createState({
    player: { ...createState().player, lifeStates: { studyHabit: 2, trainingHabit: 2, businessHabit: 0 } },
  });
  const { cards, history } = cardText(after, before);
  const card = cards.find(c => c.title?.includes('文武并进'));
  assert(card, 'synthesis card missing');
  assert.match(card!.sourceLabel ?? '', /人生印记/);
  assert.doesNotMatch(JSON.stringify(card), /★|更高级/);
  assert(history.some(line => line.includes('人生印记 · 文武并进')));
  findings.push(`SYNTHESIS: source=${card!.sourceLabel}; title=${card!.title}`);
}

{
  const studyState = createState({
    player: { ...createState().player, lifeStates: { studyHabit: 2, trainingHabit: 0, businessHabit: 0 } },
    actionHistory: [action('study', 16), action('study', 17), action('study', 18)],
  });
  const { summary, model, history, cards } = cardText(studyState);
  const blob = [
    model.milestoneSummary,
    model.milestoneProspectSummary,
    ...history,
    JSON.stringify(cards),
    JSON.stringify(summary.achievedMilestones),
  ].join('\n');
  assert(!blob.includes('★★★'), 'Study path must not invent T3 stars');
  assert(!blob.includes('☆'));
  assert(!/Study.*2\/3|读书.*2\/3|读书等级|locked|下一阶段 \?\?\?/.test(blob));
  assert(!summary.achievedMilestones?.some(m => m.diagnostic.milestoneId.includes('study') && m.tier === 3));
  assert(model.milestoneSummary?.includes('少年勤学 · ★★') || model.milestoneSummary?.includes('读书成习 · ★★'));
  assert(!model.milestoneSummary?.includes('★★ 少年勤学'));
  assert(!model.milestoneSummary?.includes('★★ 读书成习'));
  findings.push(`MISSING_STUDY_T3 surface: position=${model.milestoneSummary}; prospect=${model.milestoneProspectSummary}`);
}

{
  const businessState = createState({
    player: { ...createState().player, lifeStates: { studyHabit: 0, trainingHabit: 0, businessHabit: 2 } },
    actionHistory: [action('business', 20)],
  });
  const { model, history } = cardText(businessState);
  const blob = [model.milestoneSummary, ...history].join('\n');
  assert(!blob.includes('★★★'));
  assert(!blob.includes('☆'));
  assert(!/营生.*2\/3|Business.*2\/3|locked/.test(blob));
  findings.push(`MISSING_BUSINESS_T3 surface: position=${model.milestoneSummary}`);
}

{
  const prospectState = createState({
    player: { ...createState().player, age: 19 },
    actionHistory: [action('study', 18), action('study', 19)],
  });
  const { model } = cardText(prospectState);
  assert(model.milestoneProspectSummary?.includes('少年勤学'), `unexpected prospect: ${model.milestoneProspectSummary}`);
  assert(model.milestoneProspectSummary?.includes('2/3'));
  assert(!model.milestoneProspectSummary?.includes('★'));
  findings.push(`PROSPECT: ${model.milestoneProspectSummary}`);
}

console.log('=== Phase B Player Review Surfaces ===');
for (const line of findings) console.log(line);
console.log('MISSING_TIER_FALSE_AFFORDANCE=PASS');
console.log('ACQUISITION_SALIENCE=SUFFICIENT');
console.log('pd108PhaseBPlayerReview: ok');
