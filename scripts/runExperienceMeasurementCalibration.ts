#!/usr/bin/env tsx

import * as fs from 'node:fs';
import { eventLoader } from '../src/core/EventLoader';
import { GameProcessSimulator } from '../tests/GameProcessSimulator';
import {
  buildFormalEventTimeline,
  formatCalibrationReport,
  getCalibrationAnnotation,
  type CalibrationCatalogAnchor,
  type CalibrationTrace,
} from './experienceMeasurementCalibration';
import { getGameplaySimulationSamples, type SimulationSample } from './runGameplaySimulation';

function parseOutputPath(argv: string[]): string | undefined {
  for (let index = 0; index < argv.length; index += 1) {
    const raw = argv[index];
    if (raw === '--output') {
      const outputPath = argv[index + 1];
      if (!outputPath) throw new Error('--output requires a path');
      return outputPath;
    }
    if (raw.startsWith('--output=')) {
      const outputPath = raw.slice('--output='.length);
      if (!outputPath) throw new Error('--output requires a path');
      return outputPath;
    }
    throw new Error(`Unknown argument: ${raw}`);
  }
  return undefined;
}

async function runSample(sample: SimulationSample): Promise<CalibrationTrace> {
  const report = await new GameProcessSimulator({
    playerName: sample.personaName,
    gender: sample.gender,
    simulateYears: sample.years,
    runUntilDeath: true,
    seed: sample.seed,
    choiceTendency: sample.choiceTendency,
    routeTrack: sample.routeTrack,
    verbose: false,
    enableAutoSave: false,
    enableManualSave: false,
    enableSaveRestore: false,
  }).simulate();

  return {
    sampleId: sample.id,
    seed: sample.seed,
    routeTrack: sample.routeTrack,
    timeline: buildFormalEventTimeline(report, eventId => eventLoader.getEventById(eventId)),
  };
}

function loadCatalogAnchors(): CalibrationCatalogAnchor[] {
  const event = eventLoader.getEventById('official_entry');
  if (!event) throw new Error('Calibration catalog anchor official_entry is not runtime-loaded');
  return [{
    eventId: event.id,
    title: event.content.title,
    annotation: getCalibrationAnnotation(event.id),
  }];
}

async function main(): Promise<void> {
  process.env.WUXIA_ENGINE_QUIET = '1';
  const outputPath = parseOutputPath(process.argv.slice(2));
  const traces: CalibrationTrace[] = [];
  for (const sample of getGameplaySimulationSamples(true)) {
    traces.push(await runSample(sample));
  }

  const report = formatCalibrationReport(traces, loadCatalogAnchors());
  if (outputPath) {
    fs.writeFileSync(outputPath, report, 'utf8');
  } else {
    process.stdout.write(report);
  }
}

main().catch(error => {
  console.error('[experience-measurement-calibration] failed:', error);
  process.exitCode = 1;
});
