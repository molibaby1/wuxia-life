import type { AdversarialRecipe, B0RawTrace, KnownBadRecipe } from '../types';
import { stableStringify } from '../hash';

function basePlayer(age: number, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'B0Fixture',
    age,
    alive: true,
    gender: 'male',
    martialPower: 10,
    constitution: 10,
    knowledge: 10,
    connections: 5,
    reputation: 2,
    chivalry: 0,
    money: 100,
    healthStatus: 'healthy',
    statuses: [],
    lifeStates: { trainingHabit: 1, studyHabit: 1, businessHabit: 0 },
    flags: {},
    ...overrides,
  };
}

function record(partial: Record<string, unknown>): Record<string, unknown> {
  return {
    age: 15,
    eventId: 'b0_neutral_day',
    eventTitle: '寻常一日',
    eventText: '这一年并无特别波澜。',
    eventType: 'auto',
    progressionKind: 'story_event',
    timestamp: '2026-01-01T00:00:00.000Z',
    currentTime: { year: 1, month: 1, day: 1 },
    gameState: { player: basePlayer(15), flags: {}, eventHistory: [] },
    ...partial,
  };
}

function wrapTrace(
  sampleId: string,
  arm: 'baseline' | 'candidate',
  recipe: KnownBadRecipe,
  records: Array<Record<string, unknown>>,
  extra: Partial<B0RawTrace> = {},
): B0RawTrace {
  const steps = records.map((r, sequence) => ({
    sequence,
    age: r.age,
    event: { id: r.eventId, title: r.eventTitle, text: r.eventText },
    choiceCandidates: r.availableChoices
      ? (r.availableChoices as Array<Record<string, unknown>>).map((c, i) => ({
          choiceId: c.id ?? `c${i}`,
          text: c.text,
          description: c.description,
          directEffects: c.effects ?? [],
          outcomeEffects: [],
          selected: (r.selectedChoice as { id?: string } | undefined)?.id === c.id,
          baseScore: 0,
          personaAdjustedScore: 0,
          personaBonus: 0,
          outcomeCount: 0,
        }))
      : undefined,
    stateDelta: {
      playerStats: {},
      lifeStates: {},
      flagsAdded: {},
      flagsRemoved: [],
      flagsChanged: {},
      eventHistoryAdded: [r.eventId],
      timeBefore: null,
      timeAfter: null,
    },
  }));

  return {
    schemaVersion: 'b0-raw-trace-v1',
    sampleId,
    arm,
    seed: recipe.seed,
    personaId: recipe.personaId,
    records,
    experienceTrace: {
      schemaVersion: 'experience-trace-v1',
      seed: recipe.seed,
      persona: { id: recipe.personaId },
      selectionPolicy: { kind: 'oracle_effect_score_v1', usesHiddenEffects: true },
      steps,
      finalState: { player: basePlayer(Number(records[records.length - 1]?.age ?? 20)) },
      stoppedReason: 'fixture_end',
    },
    hiddenEffects: [{ type: 'stat_change', path: 'martialPower', value: -1 }],
    ...extra,
  };
}

export function synthesizeKnownBadTrace(
  sampleId: string,
  arm: 'baseline' | 'candidate',
  recipe: KnownBadRecipe,
): B0RawTrace {
  // baseline arm for known-bad is healthy control-shaped; candidate encodes the defect
  if (arm === 'baseline' && recipe.mode !== 'control_healthy') {
    return synthesizeKnownBadTrace(sampleId, 'candidate', {
      ...recipe,
      mode: 'control_healthy',
      badId: 'control_healthy',
    });
  }

  switch (recipe.mode) {
    case 'control_healthy': {
      const records = [14, 15, 16, 17, 18].map(age =>
        record({
          age,
          eventId: `b0_varied_${age}`,
          eventTitle: `见闻 ${age}`,
          eventText: `第 ${age} 年经历不同人事。`,
        }),
      );
      return wrapTrace(sampleId, arm, recipe, records);
    }
    case 'repeat_short_window': {
      const records = [15, 16, 17, 18, 19].map(age =>
        record({
          age,
          eventId: 'b0_repeat_event',
          eventTitle: '同一事件反复',
          eventText: '短窗口内反复触发同一正式事件。',
        }),
      );
      return wrapTrace(sampleId, arm, recipe, records);
    }
    case 'category_monopoly': {
      const records = Array.from({ length: 8 }, (_, i) =>
        record({
          age: 15 + i,
          eventId: `b0_mono_${i}`,
          eventTitle: '垄断类别',
          eventText: '同类事件垄断日程。',
          eventCategory: 'training',
        }),
      );
      return wrapTrace(sampleId, arm, recipe, records);
    }
    case 'formal_event_drought': {
      const records = Array.from({ length: 12 }, (_, i) =>
        record({
          age: 20 + i,
          eventId: `b0_daily_filler_${i}`,
          eventTitle: '琐事',
          eventText: '低影响日常填充。',
          progressionKind: 'active_action',
          eventType: 'auto',
          lowImpact: true,
        }),
      );
      return wrapTrace(sampleId, arm, recipe, records);
    }
    case 'choice_unreachable': {
      const records = [
        record({
          age: 16,
          eventId: 'b0_unreachable_choice',
          eventTitle: '不可达选择',
          eventType: 'choice',
          availableChoices: [
            { id: 'a', text: '可见选项 A', effects: [] },
            { id: 'b', text: '可见选项 B', effects: [], unreachable: true },
          ],
          selectedChoice: { id: 'a', text: '可见选项 A' },
          choiceUnreachableIds: ['b'],
        }),
      ];
      return wrapTrace(sampleId, arm, recipe, records);
    }
    case 'choice_collapse': {
      const records = [
        record({
          age: 17,
          eventId: 'b0_collapse_choice',
          eventTitle: '分支坍缩',
          eventType: 'choice',
          availableChoices: [
            { id: 'a', text: '向东', effects: [{ type: 'flag_set', flag: 'same' }] },
            { id: 'b', text: '向西', effects: [{ type: 'flag_set', flag: 'same' }] },
          ],
          selectedChoice: { id: 'a', text: '向东' },
          choiceEquivalent: true,
        }),
      ];
      return wrapTrace(sampleId, arm, recipe, records);
    }
    case 'opaque_negative': {
      const before = { player: basePlayer(18, { healthStatus: 'healthy', martialPower: 20 }) };
      const after = { player: basePlayer(18, { healthStatus: 'injured', martialPower: 12 }) };
      const records = [
        record({
          age: 18,
          eventId: 'b0_opaque_hurt',
          eventTitle: '暗伤',
          eventText: '你继续前行。',
          outcomeText: '未见明显说明。',
          outcomeEvidence: {
            stateBefore: before,
            stateAfter: after,
            executedEffects: [{ type: 'stat_change', target: 'martialPower', value: -8 }],
          },
        }),
      ];
      return wrapTrace(sampleId, arm, recipe, records);
    }
    default: {
      const _exhaustive: never = recipe.mode;
      throw new Error(`unknown recipe mode: ${_exhaustive}`);
    }
  }
}

export function synthesizeAdversarialProbe(
  sampleId: string,
  recipe: AdversarialRecipe,
  holdoutSeeds: number[],
): {
  proposedPaths: string[];
  rawTrace: B0RawTrace;
  visibleContamination?: Record<string, unknown>;
  leakedHoldoutSeed?: number;
  crossReviewPayload?: unknown;
} {
  const healthyRecipe: KnownBadRecipe = {
    schemaVersion: 'b0-known-bad-recipe-v1',
    badId: 'control_healthy',
    mode: 'control_healthy',
    personaId: 'p8-balanced-wei',
    seed: 9001,
  };
  let rawTrace = synthesizeKnownBadTrace(sampleId, 'candidate', healthyRecipe);

  if (recipe.injectHiddenIntoVisible || recipe.mode === 'hidden_in_visible_trace') {
    rawTrace = {
      ...rawTrace,
      experienceTrace: {
        ...rawTrace.experienceTrace,
        steps: (
          (rawTrace.experienceTrace.steps as Array<Record<string, unknown>>) ?? []
        ).map(step => ({
          ...step,
          choiceCandidates: [
            {
              choiceId: 'leak',
              text: '泄漏',
              directEffects: [{ type: 'stat_change', value: -1 }],
              outcomeEffects: [{ type: 'hidden', value: true }],
            },
          ],
        })),
      },
    };
  }

  return {
    proposedPaths: recipe.proposedPaths,
    rawTrace,
    leakedHoldoutSeed:
      recipe.mode === 'holdout_leak' ? recipe.leakHoldoutSeed ?? holdoutSeeds[0] : undefined,
    crossReviewPayload:
      recipe.mode === 'cross_reviewer_contamination' || recipe.contaminateWithMechanicalVerdict
        ? { mechanicalVerdict: { hardKill: true, detections: ['forged'] } }
        : undefined,
    visibleContamination: undefined,
  };
}

/** Ensure synthesizer output is byte-stable for a recipe+seed. */
export function synthesizerFingerprint(recipe: KnownBadRecipe): string {
  return stableStringify(synthesizeKnownBadTrace(recipe.badId, 'candidate', recipe));
}
