#!/usr/bin/env tsx

import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import { ROUTE_TRACK_SAMPLES } from './runGameplaySimulation';

async function main(): Promise<void> {
  let completedSamples = 0;
  const completionFlags: Record<string, string[]> = {
    official: ['route_official_completed'],
    beggars: ['route_beggars_completed'],
    demonic: ['route_demonic_completed'],
    sect: ['orthodox_trial_completed', 'sect_trial_completed'],
  };

  for (const sample of ROUTE_TRACK_SAMPLES) {
    const simulator = new GameProcessSimulator({
      playerName: sample.personaName,
      gender: sample.gender,
      simulateYears: 85,
      runUntilDeath: true,
      seed: sample.seed,
      choiceTendency: sample.choiceTendency,
      routeTrack: sample.routeTrack,
      maxEvents: 280,
      verbose: false,
      enableAutoSave: false,
      enableManualSave: false,
      enableSaveRestore: false,
    });

    const report = await simulator.simulate();
    const finalState = report.records.at(-1)?.gameState;
    const flags = {
      ...(finalState?.flags ?? {}),
      ...(finalState?.player?.flags ?? {}),
    };
    const completed = (completionFlags[sample.routeTrack ?? ''] ?? [])
      .filter(flagName => Boolean(flags[flagName]));
    const hasCompleted = completed.length > 0;
    if (hasCompleted) {
      completedSamples += 1;
    }

    console.log(`${sample.id} => ${completed.join(', ') || 'no-completion-flag'}${hasCompleted ? ' [COMPLETED]' : ''}`);
  }

  console.log(`\ncompletedSamples=${completedSamples}/${ROUTE_TRACK_SAMPLES.length}`);
  if (completedSamples < 1) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
