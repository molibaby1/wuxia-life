/**
 * Adapts headless persona run output to GameProcessReport for buildPersonaRunMetrics.
 */

import type { GameProcessReport } from '../../types/simulationRecordTypes';
import type { HeadlessPersonaRunConfig, HeadlessPersonaRunResult } from './types';
import { traitSystem } from '../../core/TraitSystem';
import { getOriginId } from '../../p20/stateAccess';

export function adaptHeadlessRunToGameProcessReport(
  config: HeadlessPersonaRunConfig,
  result: HeadlessPersonaRunResult,
): GameProcessReport {
  const { persona } = config;
  const finalState = result.finalGameState;
  const traitNames = traitSystem.getTraitNames(finalState?.player?.traits);

  let childhoodEvents = 0;
  let youthEvents = 0;
  let adultEvents = 0;
  let autoEvents = 0;
  let choiceEvents = 0;

  for (const record of result.records) {
    if (record.age < 13) childhoodEvents += 1;
    else if (record.age < 25) youthEvents += 1;
    else adultEvents += 1;
    if (record.eventType === 'auto') autoEvents += 1;
    if (record.eventType === 'choice') choiceEvents += 1;
  }

  return {
    id: `headless-${persona.id}-${result.randomSeed}`,
    timestamp: new Date().toISOString(),
    config: {
      playerName: persona.name,
      gender: persona.gender,
      simulateYears: config.endAge,
      runUntilDeath: false,
      ageRange: { startAge: 0, endAge: config.endAge },
      seed: persona.seed,
      maxEvents: result.records.length,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
      verbose: false,
      choiceTendency: persona.choiceTendency,
      p8PersonaId: persona.id,
      autoSaveMode: 'age',
      saveAgeInterval: 5,
      saveEventInterval: 10,
      maxRestoreCount: 0,
      sampleId: persona.id,
    },
    randomSeed: persona.seed,
    runMode: 'age_range',
    ageRange: { startAge: 0, endAge: config.endAge },
    totalYears: result.records.length,
    finalAge: result.finalAge,
    isAlive: result.isAlive,
    deathReason: result.deathReason,
    totalEvents: result.records.length,
    totalChoices: result.totalChoices,
    totalSaves: 0,
    totalLoads: 0,
    persistenceConsistency: {
      totalChecks: 0,
      passedChecks: 0,
      failedChecks: 0,
      results: [],
    },
    records: result.records,
    statistics: {
      childhoodEvents,
      youthEvents,
      adultEvents,
      elderlyEvents: 0,
      autoEvents,
      choiceEvents,
      martialPowerGrowth: 0,
      moneyGrowth: 0,
      sectJoined: null,
      sectStatus: null,
      spouse: null,
      children: 0,
      origin: traitSystem.getOriginName(finalState ? getOriginId(finalState) : undefined),
      coreTalent: traitNames.coreTalent,
      weakness: traitNames.weakness,
      temperament: traitNames.temperament,
      lifeStates: { ...(finalState?.player?.lifeStates ?? {}) },
      dailyEventCount: 0,
      growthBiasSummary: traitSystem.getGrowthBiasSummary(finalState?.player?.traits),
      endingSummary: null,
      flags: Object.fromEntries(
        Object.entries(finalState?.flags ?? {}).filter(([, v]) => typeof v === 'boolean' && v),
      ),
    },
    p8ChoiceDiagnostics: result.choiceDiagnostics,
    p8ActiveActionReasons: result.activeActionSelectionReasons,
  };
}
