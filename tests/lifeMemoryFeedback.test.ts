import { strict as assert } from 'node:assert';
import * as lifeMemoryFeedback from '../src/components/lifeMemoryFeedback';
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
  } = {},
) => ({
  id,
  visibility: options.visibility ?? 'player',
  sortKey: 80,
  label,
  description: `${label}说明`,
  category: 'study' as const,
  kind: options.kind ?? ('progress_stage' as const),
  ...(options.tier === undefined ? {} : { tier: options.tier }),
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

const feedback = lifeMemoryFeedback.collectNewLifeMemoryFeedback(previous, current);
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
assert.deepEqual(lifeMemoryFeedback.collectNewLifeMemoryFeedback(current, current), []);
assert.deepEqual(lifeMemoryFeedback.collectNewLifeMemoryFeedback(base(), base()), []);

{
  const turningFeedback = lifeMemoryFeedback.collectNewLifeMemoryFeedback(
    base(),
    base({
      achievedMilestones: [
        milestone('milestone-turning', '行功遇险', { kind: 'turning_point' }),
      ],
    }),
  );
  assert.equal(turningFeedback.length, 1);
  assert.equal(turningFeedback[0]?.kind, 'milestone');
  if (turningFeedback[0]?.kind === 'milestone') {
    assert.equal(turningFeedback[0].milestoneKind, 'turning_point');
    assert.equal(turningFeedback[0].milestoneTier, undefined);
  }
}

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
