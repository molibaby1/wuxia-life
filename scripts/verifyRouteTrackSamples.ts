#!/usr/bin/env tsx

import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import { ROUTE_TRACK_SAMPLES } from './runGameplaySimulation';

async function main(): Promise<void> {
  let completedSamples = 0;

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
    const lifecycle = Object.entries(finalState?.routeStates || {})
      .map(([routeId, state]) => `${routeId}:${state.lifecycle}`)
      .join(', ');

    const hasCompleted = Object.values(finalState?.routeStates || {}).some(
      routeState => routeState.lifecycle === 'completed'
    );
    if (hasCompleted) {
      completedSamples += 1;
    }

    console.log(`${sample.id} => ${lifecycle || 'no-route-states'}${hasCompleted ? ' [COMPLETED]' : ''}`);
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
