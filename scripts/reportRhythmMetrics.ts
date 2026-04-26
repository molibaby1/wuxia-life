import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { talentSystem } from '../src/core/TalentSystem';
import { eventLoader } from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import { EventPriority, type EventDefinition, type GameState } from '../src/types/eventTypes';

interface SimulatedEvent {
  age: number;
  eventId: string;
  title: string;
  category: string;
  eventType: string;
  isDaily: boolean;
  isFormal: boolean;
  isChoice: boolean;
  isCritical: boolean;
  storyLine: string | null;
}

interface SimulationSample {
  sampleId: string;
  seed: number;
  maxAge: number;
  timeline: SimulatedEvent[];
}

interface RhythmMetrics {
  sampleId: string;
  seed: number;
  maxAge: number;
  eventCountPerAge: Array<{ age: number; count: number }>;
  emptyAges: number[];
  formalEventRatio: number;
  dailyEventRatio: number;
  choiceEventRatio: number;
  storylineContinuity: {
    continuityPairs: number;
    brokenPairs: number;
    continuityRate: number;
  };
  criticalEventDelay: {
    criticalAges: number[];
    averageDelay: number;
    maxDelay: number;
  };
}

const P1_BASELINES = {
  formalEventRatio: { min: 0.5, max: 0.9, label: 'P1 observation baseline' },
  dailyEventRatio: { min: 0.1, max: 0.5, label: 'P1 observation baseline' },
  choiceEventRatio: { min: 0.2, max: 0.8, label: 'P1 observation baseline' },
  storylineContinuityRate: { min: 0.3, max: 1.0, label: 'P1 observation baseline' },
  criticalEventDelayMax: { min: 0, max: 15, label: 'P1 observation baseline' },
  emptyAgeCount: { min: 0, max: 20, label: 'P1 observation baseline' },
} as const;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

async function withSeed<T>(seed: number, fn: () => Promise<T>): Promise<T> {
  const originalRandom = Math.random;
  Math.random = createSeededRandom(seed);
  try {
    return await fn();
  } finally {
    Math.random = originalRandom;
  }
}

function isDailyEvent(event: EventDefinition): boolean {
  return event.category === 'daily_event' || event.metadata?.tags?.includes('daily_pool') === true;
}

function isCriticalEvent(event: EventDefinition): boolean {
  const tags = (event.metadata?.tags || []).map(tag => tag.toLowerCase());
  return (
    event.priority === EventPriority.CRITICAL ||
    event.category === 'main_story' ||
    tags.includes('critical') ||
    tags.includes('mandatory') ||
    tags.includes('mainline')
  );
}

function getFirstChoiceEffects(_state: GameState, event: EventDefinition) {
  if (!event.choices || event.choices.length === 0) {
    return [];
  }

  const firstAvailableChoice = event.choices.find(choice => !choice.condition) || event.choices[0];
  if (!firstAvailableChoice) {
    return [];
  }

  if (firstAvailableChoice.outcomes && firstAvailableChoice.outcomes.length > 0) {
    const firstOutcome = firstAvailableChoice.outcomes.find(outcome => !outcome.condition);
    if (firstOutcome?.effects) {
      return firstOutcome.effects;
    }
  }

  return firstAvailableChoice.effects || [];
}

async function simulateSample(seed: number, maxAge: number): Promise<SimulationSample> {
  return withSeed(seed, async () => {
    await talentSystem.loadTalents();
    await eventLoader.loadAllEvents();

    const gameEngine = new GameEngineIntegration();
    const eventExecutor = new EventExecutor();
    const state = gameEngine.getGameState();

    if (state.player) {
      state.player.name = `rhythm-${seed}`;
      state.player.gender = 'male';
      state.player.talents = ['martial_genius', 'quick_learner'];
    }

    const timeline: SimulatedEvent[] = [];

    for (let age = 0; age <= maxAge; age++) {
      if (state.player) {
        state.player.age = age;
      }

      const selected = gameEngine.selectEvent(age);
      if (!selected) {
        continue;
      }

      timeline.push({
        age,
        eventId: selected.id,
        title: selected.content?.title || selected.id,
        category: selected.category,
        eventType: selected.eventType,
        isDaily: isDailyEvent(selected),
        isFormal: !isDailyEvent(selected),
        isChoice: selected.eventType === 'choice',
        isCritical: isCriticalEvent(selected),
        storyLine: selected.storyLine || null,
      });

      const effects = selected.autoEffects?.length
        ? selected.autoEffects
        : getFirstChoiceEffects(state, selected);
      if (effects.length > 0) {
        const nextState = await eventExecutor.executeEffects(effects, state);
        Object.assign(state, nextState);
      }
    }

    return {
      sampleId: `seed-${seed}-age-${maxAge}`,
      seed,
      maxAge,
      timeline,
    };
  });
}

function computeMetrics(sample: SimulationSample): RhythmMetrics {
  const ageCounts = new Map<number, number>();
  for (let age = 0; age <= sample.maxAge; age++) {
    ageCounts.set(age, 0);
  }
  sample.timeline.forEach(event => {
    ageCounts.set(event.age, (ageCounts.get(event.age) || 0) + 1);
  });

  const eventCountPerAge = Array.from(ageCounts.entries())
    .map(([age, count]) => ({ age, count }))
    .sort((a, b) => a.age - b.age);
  const emptyAges = eventCountPerAge.filter(item => item.count === 0).map(item => item.age);

  const totalEvents = sample.timeline.length;
  const formalCount = sample.timeline.filter(event => event.isFormal).length;
  const dailyCount = sample.timeline.filter(event => event.isDaily).length;
  const choiceCount = sample.timeline.filter(event => event.isChoice).length;
  const formalEventRatio = totalEvents > 0 ? formalCount / totalEvents : 0;
  const dailyEventRatio = totalEvents > 0 ? dailyCount / totalEvents : 0;
  const choiceEventRatio = totalEvents > 0 ? choiceCount / totalEvents : 0;

  const storyLineEvents = sample.timeline.filter(event => Boolean(event.storyLine));
  let continuityPairs = 0;
  let brokenPairs = 0;
  for (let i = 1; i < storyLineEvents.length; i++) {
    if (storyLineEvents[i].storyLine === storyLineEvents[i - 1].storyLine) {
      continuityPairs += 1;
    } else {
      brokenPairs += 1;
    }
  }
  const storyTransitions = continuityPairs + brokenPairs;
  const continuityRate = storyTransitions > 0 ? continuityPairs / storyTransitions : 0;

  const criticalAges = sample.timeline
    .filter(event => event.isCritical)
    .map(event => event.age);
  const criticalDelays: number[] = [];
  for (let i = 1; i < criticalAges.length; i++) {
    criticalDelays.push(criticalAges[i] - criticalAges[i - 1]);
  }
  const averageDelay = criticalDelays.length > 0
    ? criticalDelays.reduce((sum, delay) => sum + delay, 0) / criticalDelays.length
    : sample.maxAge + 1;
  const maxDelay = criticalDelays.length > 0
    ? Math.max(...criticalDelays)
    : sample.maxAge + 1;

  return {
    sampleId: sample.sampleId,
    seed: sample.seed,
    maxAge: sample.maxAge,
    eventCountPerAge,
    emptyAges,
    formalEventRatio,
    dailyEventRatio,
    choiceEventRatio,
    storylineContinuity: {
      continuityPairs,
      brokenPairs,
      continuityRate,
    },
    criticalEventDelay: {
      criticalAges,
      averageDelay,
      maxDelay,
    },
  };
}

function toPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMetrics(sample: SimulationSample, metrics: RhythmMetrics): string {
  const lines: string[] = [];
  lines.push('=== P1 Rhythm Metrics Report ===');
  lines.push(`sampleId=${sample.sampleId}`);
  lines.push(`seed=${sample.seed}`);
  lines.push(`maxAge=${sample.maxAge}`);
  lines.push(`timelineEvents=${sample.timeline.length}`);
  lines.push('');
  lines.push('Metrics:');
  lines.push(`event_count_per_age=${JSON.stringify(metrics.eventCountPerAge)}`);
  lines.push(`empty_ages=${JSON.stringify(metrics.emptyAges)}`);
  lines.push(
    `formal_event_ratio=${toPct(metrics.formalEventRatio)} baseline=[${toPct(P1_BASELINES.formalEventRatio.min)}, ${toPct(P1_BASELINES.formalEventRatio.max)}]`
  );
  lines.push(
    `daily_event_ratio=${toPct(metrics.dailyEventRatio)} baseline=[${toPct(P1_BASELINES.dailyEventRatio.min)}, ${toPct(P1_BASELINES.dailyEventRatio.max)}]`
  );
  lines.push(
    `choice_event_ratio=${toPct(metrics.choiceEventRatio)} baseline=[${toPct(P1_BASELINES.choiceEventRatio.min)}, ${toPct(P1_BASELINES.choiceEventRatio.max)}]`
  );
  lines.push(
    `storyline_continuity=${metrics.storylineContinuity.continuityPairs}/${metrics.storylineContinuity.continuityPairs + metrics.storylineContinuity.brokenPairs} (${toPct(metrics.storylineContinuity.continuityRate)}) baseline=[${toPct(P1_BASELINES.storylineContinuityRate.min)}, ${toPct(P1_BASELINES.storylineContinuityRate.max)}]`
  );
  lines.push(
    `critical_event_delay_avg=${metrics.criticalEventDelay.averageDelay.toFixed(2)}y critical_event_delay_max=${metrics.criticalEventDelay.maxDelay}y baseline_max<=${P1_BASELINES.criticalEventDelayMax.max}y`
  );
  lines.push('');
  lines.push('Critical event ages:');
  lines.push(JSON.stringify(metrics.criticalEventDelay.criticalAges));
  lines.push('');
  lines.push('Sample timeline excerpt:');
  sample.timeline.slice(0, 20).forEach((event, index) => {
    lines.push(
      `${index + 1}. age=${event.age} id=${event.eventId} category=${event.category} type=${event.eventType} storyline=${event.storyLine || '-'}`
    );
  });
  lines.push('');
  lines.push('Baselines (P1 observation):');
  lines.push(JSON.stringify(P1_BASELINES, null, 2));
  return lines.join('\n');
}

async function main() {
  const maxAge = Number(process.env.RHYTHM_MAX_AGE || '40');
  const explicitSeed = process.env.RHYTHM_SEED ? Number(process.env.RHYTHM_SEED) : 1;
  const sample = await simulateSample(explicitSeed, maxAge);
  const metrics = computeMetrics(sample);
  console.log(formatMetrics(sample, metrics));
}

main().catch(error => {
  console.error('[US-003] rhythm metrics report failed:', error);
  process.exitCode = 1;
});
