import { strict as assert } from 'node:assert';
import * as lifeMemoryFeedback from '../src/components/lifeMemoryFeedback';
import type { LifeMemorySummary } from '../src/types/lifeMemory';

const base = (overrides: Partial<LifeMemorySummary> = {}): LifeMemorySummary => ({
  schemaVersion: '3.1.0',
  derivedAtAge: 18,
  ...overrides,
});

const milestone = (id: string, label: string, visibility: 'player' | 'hidden' = 'player') => ({
  id,
  visibility,
  sortKey: 80,
  label,
  description: `${label}说明`,
  category: 'study' as const,
  evidenceLabels: ['主动读书 1 次'],
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
  achievedMilestones: [milestone('milestone-old', '旧印记')],
  achievements: [],
});
const current = base({
  achievedMilestones: [
    milestone('milestone-old', '旧印记'),
    milestone('milestone-new', '新印记'),
    milestone('milestone-hidden', '隐藏印记', 'hidden'),
  ],
  achievements: [achievement('save-village', '拯救村庄')],
});

const feedback = lifeMemoryFeedback.collectNewLifeMemoryFeedback(previous, current);
assert.deepEqual(
  feedback.map(item => item.id),
  ['achievement-save-village', 'milestone-new'],
  'new achievements should precede new milestones and hidden entries should stay hidden',
);
assert.equal(feedback[1]?.description, '新印记说明');
assert.deepEqual(lifeMemoryFeedback.collectNewLifeMemoryFeedback(current, current), []);
assert.deepEqual(lifeMemoryFeedback.collectNewLifeMemoryFeedback(base(), base()), []);

const buildLifeMemoryFeedbackOverlayCard = (
  lifeMemoryFeedback as typeof lifeMemoryFeedback & {
    buildLifeMemoryFeedbackOverlayCard: (
      items: ReturnType<typeof lifeMemoryFeedback.collectNewLifeMemoryFeedback>,
    ) => { title: string; body?: string; metaLines?: string[] } | null;
  }
).buildLifeMemoryFeedbackOverlayCard;
assert.equal(
  typeof buildLifeMemoryFeedbackOverlayCard,
  'function',
  'Life Memory unlocks must provide a non-modal progression echo card',
);
const echoCard = buildLifeMemoryFeedbackOverlayCard(feedback);
assert.equal(echoCard?.title, '新的成就与里程碑');
assert.match(echoCard?.body ?? '', /拯救村庄/);
assert.match(echoCard?.body ?? '', /新印记/);
assert.match((echoCard?.metaLines ?? []).join(' '), /主动读书 1 次/);

console.log('lifeMemoryFeedback: ok');
