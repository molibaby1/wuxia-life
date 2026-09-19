import { applyPassiveNarrativeFlags } from '../../data/originInfantPassiveChain';
import {
  selectPassiveNarrative,
  shouldRecordPassiveNarrativeInHistory,
} from '../../data/infantPassiveNarratives';
import {
  appendPassiveTitleToHistory,
  selectPreschoolSeasonEntry,
} from '../../data/preschoolPassiveSpine';
import type { GameState } from '../../types/eventTypes';
import type { PassiveNarrativeEntry } from '../../data/passiveNarrativeTypes';
import { applyStatDeltas } from './ActivePlanningService';
import { clampPassiveStatDeltasForAge } from './ageActionStatCaps';

export const ANNUAL_PASSIVE_MEMORY_MAX_AGE = 3;
export const ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT = 2;
export const PRESCHOOL_SEASON_MEMORY_MIN_AGE = 4;
export const PRESCHOOL_SEASON_MEMORY_MAX_AGE = 7;
export const PRESCHOOL_SEASON_MEMORY_ENTRY_COUNT = 3;

export interface AnnualPassiveMemoryPlan {
  headline: string;
  body: string;
  entries: PassiveNarrativeEntry[];
}

export interface AnnualPassiveMemoryResult {
  headline: string;
  body: string;
  deltas: Record<string, number>;
  entryIds: string[];
}

export function isAnnualPassiveMemoryAge(age: number): boolean {
  return age >= 0 && age <= ANNUAL_PASSIVE_MEMORY_MAX_AGE;
}

export function isPreschoolSeasonMemoryAge(age: number): boolean {
  return age >= PRESCHOOL_SEASON_MEMORY_MIN_AGE && age <= PRESCHOOL_SEASON_MEMORY_MAX_AGE;
}

function addDeltas(target: Record<string, number>, source: Record<string, number>): void {
  for (const [stat, value] of Object.entries(source)) {
    target[stat] = (target[stat] ?? 0) + value;
  }
}

function applyEntry(state: GameState, entry: PassiveNarrativeEntry, deltas: Record<string, number>): void {
  const age = state.player?.age ?? 0;
  const applied = clampPassiveStatDeltasForAge(age, entry.statDeltas);
  applyStatDeltas(state.player, applied);
  applyPassiveNarrativeFlags(state, entry.flags);
  addDeltas(deltas, applied);
  if (!state.eventHistory) state.eventHistory = [];
  if (shouldRecordPassiveNarrativeInHistory(entry.id)) {
    state.eventHistory.push({
      eventId: entry.id,
      age,
      ...(state.currentTime ? { timestamp: { ...state.currentTime } } : {}),
    });
  }
  appendPassiveTitleToHistory(state, entry.title);
}

export function prepareAnnualPassiveMemory(
  state: GameState,
  random: () => number = Math.random,
): AnnualPassiveMemoryPlan {
  const working = JSON.parse(JSON.stringify(state)) as GameState;
  const entries: PassiveNarrativeEntry[] = [];
  for (let index = 0; index < ANNUAL_PASSIVE_MEMORY_ENTRY_COUNT; index += 1) {
    const entry = selectPassiveNarrative(working, random);
    applyEntry(working, entry, {});
    entries.push(entry);
  }
  const age = state.player?.age ?? 0;
  return {
    headline: `${age}岁这一年`,
    body: entries.map(entry => `【${entry.title}】${entry.text}`).join('\n\n'),
    entries,
  };
}

export function preparePreschoolSeasonMemory(
  state: GameState,
  random: () => number = Math.random,
): AnnualPassiveMemoryPlan {
  const working = JSON.parse(JSON.stringify(state)) as GameState;
  const entries: PassiveNarrativeEntry[] = [];
  for (let index = 0; index < PRESCHOOL_SEASON_MEMORY_ENTRY_COUNT; index += 1) {
    const entry = selectPreschoolSeasonEntry(working, random);
    applyEntry(working, entry, {});
    entries.push(entry);
  }
  const age = state.player?.age ?? 0;
  return {
    headline: `${age}岁这一季`,
    body: entries.map(entry => `【${entry.title}】${entry.text}`).join('\n\n'),
    entries,
  };
}

export function preparePackedPassiveMemory(
  state: GameState,
  random: () => number = Math.random,
): AnnualPassiveMemoryPlan | null {
  const age = state.player?.age ?? 0;
  if (isAnnualPassiveMemoryAge(age)) return prepareAnnualPassiveMemory(state, random);
  if (isPreschoolSeasonMemoryAge(age)) return preparePreschoolSeasonMemory(state, random);
  return null;
}

export function commitAnnualPassiveMemory(
  state: GameState,
  plan: AnnualPassiveMemoryPlan,
): AnnualPassiveMemoryResult {
  const deltas: Record<string, number> = {};
  for (const entry of plan.entries) applyEntry(state, entry, deltas);

  return {
    headline: plan.headline,
    body: plan.body,
    deltas,
    entryIds: plan.entries.map(entry => entry.id),
  };
}
