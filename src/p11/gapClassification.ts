import { listEventsCoveringStageSignal } from './signalDetection';
import type { StageGapCause, StageGapEntry, StageSignalKey } from './types';

export function classifyStageGap(
  stageId: string,
  signal: StageSignalKey,
  observedInAnyPersona: boolean,
): StageGapEntry {
  const contentEvents = listEventsCoveringStageSignal(signal);
  let cause: StageGapCause;
  let example: string;

  if (contentEvents.length === 0) {
    cause = 'no-content';
    example = `${stageId}/${signal}: no event declares stageSignals or matching tags in catalog`;
  } else if (!observedInAnyPersona) {
    cause = 'weak-scheduling';
    example = `${stageId}/${signal}: content exists (${contentEvents.slice(0, 2).map(e => e.id).join(', ')}) but simulation never triggered it`;
  } else {
    cause = 'weak-detection';
    example = `${stageId}/${signal}: signal may be present but normalized detection did not classify it`;
  }

  return { stageId, signal, cause, example };
}

export function classifyMissingSignals(
  stageId: string,
  missingSignals: StageSignalKey[],
  observedSignalsAcrossPersonas: Set<StageSignalKey>,
): StageGapEntry[] {
  return missingSignals.map(signal =>
    classifyStageGap(stageId, signal, observedSignalsAcrossPersonas.has(signal)),
  );
}
