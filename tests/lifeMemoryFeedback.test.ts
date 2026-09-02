import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildLifeMemoryFeedbackOverlayCards,
  collectNewLifeMemoryFeedback,
} from '../src/components/lifeMemoryFeedback';
import {
  formatAchievedMilestoneCompactLabel,
  formatAchievedMilestoneHistoryTitle,
  formatAchievedProgressLabel,
  milestoneKindSurfaceLabel,
  progressStageStars,
} from '../src/components/milestonePresentation';
import {
  LIFE_MEMORY_SCHEMA_VERSION,
  type LifeMemorySummary,
} from '../src/types/lifeMemory';
import type { MilestoneKind, MilestoneTier } from '../src/types/milestone';

const base = (overrides: Partial<LifeMemorySummary> = {}): LifeMemorySummary => ({
  schemaVersion: LIFE_MEMORY_SCHEMA_VERSION,
  derivedAtAge: 18,
  ...overrides,
});

const milestone = (
  id: string,
  label: string,
  options: {
    visibility?: 'player' | 'hidden';
    kind?: MilestoneKind;
    tier?: MilestoneTier;
    description?: string;
    evidenceLabels?: string[];
    sortKey?: number;
  } = {},
) => ({
  id,
  visibility: options.visibility ?? 'player',
  sortKey: options.sortKey ?? 80,
  label,
  description: options.description ?? `${label}说明`,
  category: 'study' as const,
  kind: options.kind ?? ('progress_stage' as const),
  ...(options.tier === undefined ? {} : { tier: options.tier }),
  evidenceLabels: options.evidenceLabels ?? ['主动读书 1 次'],
  diagnostic: {
    milestoneId: id.replace('milestone-', ''),
    conditionTypes: ['action_count' as const],
  },
});

const achievement = (id: string, label: string, visibility: 'player' | 'hidden' = 'player') => ({
  id: `achievement-${id}`,
  visibility,
  sortKey: 70,
  label,
  category: 'moral' as const,
  diagnostic: { achievementId: id, sourceFlags: [] },
});

const previous = base({
  achievedMilestones: [milestone('milestone-old', '旧印记', { kind: 'progress_stage', tier: 1 })],
  achievements: [],
});
const current = base({
  achievedMilestones: [
    milestone('milestone-old', '旧印记', { kind: 'progress_stage', tier: 1 }),
    milestone('milestone-new', '新印记', { kind: 'progress_stage', tier: 1 }),
    milestone('milestone-hidden', '隐藏印记', { visibility: 'hidden', kind: 'progress_stage', tier: 1 }),
  ],
  achievements: [achievement('save-village', '拯救村庄')],
});

const feedback = collectNewLifeMemoryFeedback(previous, current);
assert.deepEqual(
  feedback.map(item => item.id),
  ['achievement-save-village', 'milestone-new'],
  'new achievements should precede new milestones and hidden entries should stay hidden',
);
assert.equal(feedback[1]?.description, '新印记说明');
assert.equal(feedback[1]?.kind, 'milestone');
if (feedback[1]?.kind === 'milestone') {
  assert.equal(feedback[1].milestoneKind, 'progress_stage');
  assert.equal(feedback[1].milestoneTier, 1);
}
assert.deepEqual(collectNewLifeMemoryFeedback(current, current), []);
assert.deepEqual(collectNewLifeMemoryFeedback(base(), base()), []);

{
  const cards = buildLifeMemoryFeedbackOverlayCards(feedback);
  assert.equal(cards.length, 2, 'achievement card + one milestone card');
  assert.equal(cards[0]?.title, '新的成就');
  assert.match(cards[0]?.body ?? '', /拯救村庄/);
  assert.equal(cards[1]?.sourceLabel, '里程碑 · 起步');
  assert.match(cards[1]?.title ?? '', /★/);
  assert.match(cards[1]?.title ?? '', /新印记/);
  assert.match((cards[1]?.metaLines ?? []).join(' '), /主动读书 1 次/);
}

{
  const t1 = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-study-first-step', '初涉书卷', {
          kind: 'progress_stage',
          tier: 1,
          description: '你开始主动把时间投入读书',
        }),
      ],
    }),
  ));
  assert.equal(t1.length, 1);
  assert.match(t1[0]?.sourceLabel ?? '', /起步/);
  assert.match(t1[0]?.title ?? '', /★/);
  assert.doesNotMatch(t1[0]?.title ?? '', /★★/);
  assert.match(t1[0]?.title ?? '', /初涉书卷/);
  assert.doesNotMatch(JSON.stringify(t1), /恭喜/);
}

{
  const t2 = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-study-habit-formed', '读书成习', {
          kind: 'progress_stage',
          tier: 2,
        }),
      ],
    }),
  ));
  assert.match(t2[0]?.sourceLabel ?? '', /成形/);
  assert.match(t2[0]?.title ?? '', /★★/);
  assert.doesNotMatch(t2[0]?.title ?? '', /★★★/);
}

{
  const t3 = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-training-practice-deepened', '功行渐深', {
          kind: 'progress_stage',
          tier: 3,
        }),
      ],
    }),
  ));
  assert.match(t3[0]?.sourceLabel ?? '', /深化/);
  assert.match(t3[0]?.title ?? '', /★★★/);
  assert.match(t3[0]?.title ?? '', /功行渐深/);
}

{
  const turning = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-training-cultivation-deviation', '行功遇险', {
          kind: 'turning_point',
          description: '一次行功失序',
        }),
      ],
    }),
  ));
  const text = JSON.stringify(turning);
  assert.match(turning[0]?.sourceLabel ?? '', /人生转折/);
  assert.match(turning[0]?.title ?? '', /行功遇险/);
  assert.doesNotMatch(text, /★/);
  assert.doesNotMatch(text, /恭喜/);
  assert.doesNotMatch(text, /奖励/);
}

{
  const echo = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-study-old-scroll-echo', '旧卷回声', {
          kind: 'payoff_echo',
          description: '多年读书的积累终于派上了用场',
          evidenceLabels: ['经历旧卷回声'],
        }),
      ],
    }),
  ));
  const text = JSON.stringify(echo);
  assert.match(echo[0]?.sourceLabel ?? '', /往事回响/);
  assert.match(echo[0]?.title ?? '', /旧卷回声/);
  assert.doesNotMatch(text, /★/);
  assert.match(echo[0]?.body ?? '', /多年读书/);
}

{
  const synthesis = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-study-training-balanced', '文武并进', {
          kind: 'synthesis',
        }),
      ],
    }),
  ));
  const text = JSON.stringify(synthesis);
  assert.match(synthesis[0]?.sourceLabel ?? '', /人生印记/);
  assert.match(synthesis[0]?.title ?? '', /文武并进/);
  assert.doesNotMatch(text, /★/);
  assert.doesNotMatch(text, /更高级/);
}

{
  const multi = buildLifeMemoryFeedbackOverlayCards(collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-a', '初涉书卷', { kind: 'progress_stage', tier: 1, sortKey: 80 }),
        milestone('milestone-b', '行功遇险', { kind: 'turning_point', sortKey: 105 }),
        milestone('milestone-c', '文武并进', { kind: 'synthesis', sortKey: 110 }),
      ],
    }),
  ));
  assert.deepEqual(
    multi.map(card => card.id),
    [
      'life-memory-milestone-a',
      'life-memory-milestone-b',
      'life-memory-milestone-c',
    ],
    'multi-milestone acquisition must emit one semantic card each in deterministic order',
  );
}

assert.equal(progressStageStars(1), '★');
assert.equal(progressStageStars(2), '★★');
assert.equal(progressStageStars(3), '★★★');
assert.equal(milestoneKindSurfaceLabel('progress_stage', 2), '里程碑 · 成形');
assert.equal(formatAchievedMilestoneCompactLabel({
  kind: 'progress_stage', tier: 2, label: '读书成习',
}), '读书成习 · ★★');
assert.equal(formatAchievedMilestoneCompactLabel({
  kind: 'turning_point', label: '行功遇险',
}), '行功遇险');
assert.equal(formatAchievedMilestoneHistoryTitle({
  kind: 'payoff_echo', label: '旧卷回声',
}), '往事回响 · 旧卷回声');
assert.equal(formatAchievedMilestoneHistoryTitle({
  kind: 'synthesis', label: '文武并进',
}), '人生印记 · 文武并进');
assert.equal(formatAchievedProgressLabel('读书成习', 2), '★★ 读书成习');

{
  const panel = readFileSync(resolve(process.cwd(), 'src/components/LifeMemoryPanel.vue'), 'utf8');
  assert(panel.includes('人生里程碑'), 'Life Memory panel section must be 人生里程碑');
  assert(panel.includes('visibleMilestones'), 'Life Memory panel must render achievedMilestones');
  assert(panel.includes('formatAchievedMilestoneHistoryTitle'), 'Life Memory panel must use shared milestone presentation');
  assert(!panel.includes('memory-section-title">人生印记<'), 'section title must not remain 人生印记');
  assert(!panel.includes('locked'), 'Life Memory panel must not expose locked milestone catalog');
  assert(!panel.includes('???'), 'Life Memory panel must not invent unknown tiers');
  assert(!panel.includes('☆'), 'Life Memory panel must not render empty stars');
}

{
  const gameScreen = readFileSync(resolve(process.cwd(), 'src/components/GameScreen.vue'), 'utf8');
  assert(gameScreen.includes('buildLifeMemoryFeedbackOverlayCards'), 'GameScreen must emit Kind/Tier-aware milestone cards');
  assert(!gameScreen.includes('buildLifeMemoryFeedbackOverlayCard('), 'singular aggregate milestone card builder must not remain');
  assert(!gameScreen.includes('life-memory-feedback-backdrop'), 'acquisition must stay non-modal');
  assert(!gameScreen.includes('知道了'), 'acquisition must not require confirmation');
}

console.log('lifeMemoryFeedback: ok');
