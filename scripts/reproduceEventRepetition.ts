import { GameEngineIntegration } from '../src/core/GameEngineIntegration';
import { talentSystem } from '../src/core/TalentSystem';
import { eventLoader } from '../src/core/EventLoader';
import { EventExecutor } from '../src/core/EventExecutor';
import type { EventDefinition, GameState } from '../src/types/eventTypes';

type EventClass = 'injury' | 'illness' | 'economy';

interface SimulatedEvent {
  age: number;
  eventId: string;
  eventTitle: string;
  classes: EventClass[];
}

interface RepetitionIssue {
  age: number;
  previousEventId: string;
  currentEventId: string;
  reason: 'same_event' | 'same_class';
  repeatedClasses: EventClass[];
}

interface ReproductionResult {
  seed: number;
  maxAge: number;
  timeline: SimulatedEvent[];
  issues: RepetitionIssue[];
}

const SHORT_WINDOW_SIZE = 5;
const P0_REPETITION_THRESHOLDS = {
  adjacentSameEventRateMax: 0.08,
  adjacentSameClassRateMax: 0.35,
  shortWindowSameClassRateMax: 0.45,
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

function detectEventClasses(event: EventDefinition): EventClass[] {
  const textParts = [
    event.id,
    event.category,
    event.type,
    event.eventType,
    event.content?.title,
    event.content?.description,
    ...(event.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const classes = new Set<EventClass>();

  if (
    /injury|wound|受伤|伤|创伤/.test(textParts)
  ) {
    classes.add('injury');
  }

  if (
    /illness|disease|sick|medical|生病|疾病|病/.test(textParts)
  ) {
    classes.add('illness');
  }

  if (
    event.category === 'economy' ||
    /economy|merchant|business|money|trade|finance|经济|商|钱|财|破产/.test(textParts)
  ) {
    classes.add('economy');
  }

  return [...classes];
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

async function simulateWithSeed(seed: number, maxAge: number): Promise<ReproductionResult> {
  return withSeed(seed, async () => {
    await talentSystem.loadTalents();
    await eventLoader.loadAllEvents();

    const gameEngine = new GameEngineIntegration();
    const eventExecutor = new EventExecutor();
    const state = gameEngine.getGameState();

    if (state.player) {
      state.player.name = 'US-007-repro';
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

      const classes = detectEventClasses(selected);
      if (classes.length > 0) {
        timeline.push({
          age,
          eventId: selected.id,
          eventTitle: selected.content?.title || selected.id,
          classes,
        });
      }

      const effects = selected.autoEffects?.length
        ? selected.autoEffects
        : getFirstChoiceEffects(state, selected);
      if (effects.length > 0) {
        const nextState = await eventExecutor.executeEffects(effects, state);
        Object.assign(state, nextState);
      }
    }

    const issues: RepetitionIssue[] = [];
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const current = timeline[i];

      if (prev.eventId === current.eventId) {
        issues.push({
          age: current.age,
          previousEventId: prev.eventId,
          currentEventId: current.eventId,
          reason: 'same_event',
          repeatedClasses: current.classes,
        });
        continue;
      }

      const repeatedClasses = current.classes.filter(cls => prev.classes.includes(cls));
      if (repeatedClasses.length > 0) {
        issues.push({
          age: current.age,
          previousEventId: prev.eventId,
          currentEventId: current.eventId,
          reason: 'same_class',
          repeatedClasses,
        });
      }
    }

    return { seed, maxAge, timeline, issues };
  });
}

function formatResult(result: ReproductionResult): string {
  const lines: string[] = [];
  const adjacentPairs = Math.max(result.timeline.length - 1, 0);
  const sameEventIssues = result.issues.filter(issue => issue.reason === 'same_event');
  const sameClassIssues = result.issues.filter(issue => issue.reason === 'same_class');

  const shortWindowClassRepeatCountByClass: Record<EventClass, number> = {
    injury: 0,
    illness: 0,
    economy: 0,
  };
  let shortWindowRepeatedEvents = 0;
  for (let i = 0; i < result.timeline.length; i++) {
    const current = result.timeline[i];
    const start = Math.max(0, i - SHORT_WINDOW_SIZE);
    const recent = result.timeline.slice(start, i);
    const repeatedInWindow = current.classes.filter(cls =>
      recent.some(event => event.classes.includes(cls))
    );
    if (repeatedInWindow.length > 0) {
      shortWindowRepeatedEvents += 1;
      repeatedInWindow.forEach(cls => {
        shortWindowClassRepeatCountByClass[cls] += 1;
      });
    }
  }

  const eventFrequency = new Map<string, { title: string; count: number }>();
  result.timeline.forEach(event => {
    const current = eventFrequency.get(event.eventId);
    if (current) {
      current.count += 1;
      return;
    }
    eventFrequency.set(event.eventId, { title: event.eventTitle, count: 1 });
  });
  const mostRepeatedEvents = [...eventFrequency.entries()]
    .filter(([, value]) => value.count > 1)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const adjacentSameEventRate = adjacentPairs > 0 ? sameEventIssues.length / adjacentPairs : 0;
  const adjacentSameClassRate = adjacentPairs > 0 ? sameClassIssues.length / adjacentPairs : 0;
  const shortWindowSameClassRate = result.timeline.length > 0
    ? shortWindowRepeatedEvents / result.timeline.length
    : 0;

  lines.push('=== Event Repetition Reproduction Report ===');
  lines.push(`seed=${result.seed}`);
  lines.push(`maxAge=${result.maxAge}`);
  lines.push(`trackedEvents=${result.timeline.length}`);
  lines.push(`adjacentRepetitionIssues=${result.issues.length}`);
  lines.push('');

  lines.push('Adjacent repetition stats:');
  lines.push(
    `same_event=${sameEventIssues.length}/${adjacentPairs} (${(adjacentSameEventRate * 100).toFixed(1)}%) threshold<=${(P0_REPETITION_THRESHOLDS.adjacentSameEventRateMax * 100).toFixed(1)}%`
  );
  lines.push(
    `same_class=${sameClassIssues.length}/${adjacentPairs} (${(adjacentSameClassRate * 100).toFixed(1)}%) threshold<=${(P0_REPETITION_THRESHOLDS.adjacentSameClassRateMax * 100).toFixed(1)}%`
  );
  lines.push('');

  lines.push(`Short-window same-class stats (window=${SHORT_WINDOW_SIZE}):`);
  lines.push(
    `repeated_events=${shortWindowRepeatedEvents}/${result.timeline.length} (${(shortWindowSameClassRate * 100).toFixed(1)}%) threshold<=${(P0_REPETITION_THRESHOLDS.shortWindowSameClassRateMax * 100).toFixed(1)}%`
  );
  (Object.keys(shortWindowClassRepeatCountByClass) as EventClass[]).forEach(cls => {
    lines.push(`class_${cls}_window_repeats=${shortWindowClassRepeatCountByClass[cls]}`);
  });
  lines.push('');

  lines.push('Most repeated events (top 5):');
  if (mostRepeatedEvents.length === 0) {
    lines.push('No repeated event ids (>1 occurrence) in tracked classes.');
  } else {
    mostRepeatedEvents.forEach(([eventId, value], index) => {
      lines.push(`${index + 1}. ${eventId} count=${value.count} title=${value.title}`);
    });
  }
  lines.push('');

  if (result.issues.length === 0) {
    lines.push('No adjacent repetition issue found for this seed.');
  } else {
    lines.push('Adjacent repetition issues:');
    result.issues.forEach((issue, index) => {
      lines.push(
        `${index + 1}. age=${issue.age} ${issue.previousEventId} -> ${issue.currentEventId} reason=${issue.reason} repeatedClasses=${issue.repeatedClasses.join(',')}`
      );
    });
  }

  lines.push('');
  lines.push('Tracked timeline excerpt:');
  result.timeline.slice(0, 30).forEach((event, index) => {
    lines.push(
      `${index + 1}. age=${event.age} ${event.eventId} classes=[${event.classes.join(',')}] title=${event.eventTitle}`
    );
  });

  return lines.join('\n');
}

async function main() {
  const maxAge = Number(process.env.REPRO_MAX_AGE || '40');
  const explicitSeed = process.env.REPRO_SEED ? Number(process.env.REPRO_SEED) : null;
  const seedsToTry = explicitSeed !== null
    ? [explicitSeed]
    : Array.from({ length: 200 }, (_, i) => i + 1);

  for (const seed of seedsToTry) {
    const result = await simulateWithSeed(seed, maxAge);
    if (result.issues.length > 0 || explicitSeed !== null) {
      console.log(formatResult(result));
      if (result.issues.length === 0) {
        process.exitCode = 1;
      }
      return;
    }
  }

  console.log('=== Event Repetition Reproduction Report ===');
  console.log(`Searched seeds 1..${seedsToTry.length}, no adjacent repetition issue found.`);
  process.exitCode = 1;
}

main().catch(error => {
  console.error('[US-007] reproduction failed:', error);
  process.exitCode = 1;
});
