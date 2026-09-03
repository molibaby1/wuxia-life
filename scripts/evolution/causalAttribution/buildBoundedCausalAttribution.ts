import { open, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  parseImprovementHypothesisSet,
  type ImprovementHypothesis,
} from '../../../src/evolution/improvementHypothesisContract';
import {
  validateBoundedCausalAttribution,
  type BoundedCausalAttribution,
  type BoundedCausalAttributionItem,
  type BoundedCausalAttributionV1,
} from '../../../src/evolution/causalAttributionContract';
import { serializeObservablePayload } from '../../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../../src/evolution/wuxiaPlayerObservableProjector';
import {
  HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  type HeadlessApiPlayerSurfaceTrace,
} from '../../../src/headless/playability/playerSurfaceCapture';
import { canonicalJson, sha256Hex, validatePhase0RunRef } from '../phase0/provenance';
import { mapObservableEntriesToPlayerSurfaceSteps } from './playerSurfaceEntryMapping';
import { resolveActiveActionIdFromSurfaceStep } from './resolveActiveActionIdFromSurfaceStep';

export const CAUSAL_ATTRIBUTION_RELATIVE_PATH = 'diagnostic/causal-attribution.json';

export interface BuildBoundedCausalAttributionInput {
  sealedPhase0SourceRoot: string;
  sealedObservablePayloadPath: string;
  selectedHypothesisPath: string;
  sourceRunRef: string;
  sourceExperimentRootHash: string;
  destinationPath: string;
}

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function selectedHypothesisFromArtifact(value: unknown): ImprovementHypothesis {
  assertObject(value, 'selected hypothesis artifact');
  const selected = value.selectedHypothesis;
  assertObject(selected, 'selected hypothesis artifact.selectedHypothesis');
  if (typeof value.selectedHypothesisId !== 'string' || value.selectedHypothesisId.length === 0) {
    throw new Error('selected hypothesis artifact.selectedHypothesisId must be a non-empty string');
  }
  if (selected.hypothesisId !== value.selectedHypothesisId) {
    throw new Error('selected hypothesis id does not match artifact metadata');
  }
  const { hypothesisId: _hypothesisId, ...draft } = selected;
  const parsed = parseImprovementHypothesisSet(JSON.stringify({ hypotheses: [draft] }));
  const hypothesis = parsed.hypotheses[0];
  if (!hypothesis || hypothesis.hypothesisId !== value.selectedHypothesisId) {
    throw new Error('selected hypothesis artifact does not contain a valid hypothesis');
  }
  return hypothesis;
}

function assertSha256(value: string, label: string): string {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a SHA-256 hex string`);
  return value;
}

async function writeCreateOnly(path: string, bytes: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(bytes);
  } finally {
    await handle.close();
  }
}

function attributionForStep(
  step: ReturnType<typeof mapObservableEntriesToPlayerSurfaceSteps> extends Map<string, infer V>
    ? V['step']
    : never,
): BoundedCausalAttribution {
  if (step.kind === 'story_event') {
    const eventId = step.storyEvent?.eventId;
    if (typeof eventId !== 'string' || eventId.length === 0) {
      // Current surface schema requires eventId on storyEvent; absent capture → unavailable.
      return { kind: 'unavailable' };
    }
    return {
      kind: 'event',
      producerRef: eventId,
      ...(typeof step.selectedChoiceId === 'string' && step.selectedChoiceId.length > 0
        ? { selectedChoiceRef: step.selectedChoiceId }
        : {}),
    };
  }
  if (step.kind === 'active_action_result') {
    return {
      kind: 'action',
      producerRef: resolveActiveActionIdFromSurfaceStep(step),
    };
  }
  return { kind: 'unavailable' };
}

export async function buildBoundedCausalAttribution(
  input: BuildBoundedCausalAttributionInput,
): Promise<BoundedCausalAttributionV1> {
  const sourceRunRef = validatePhase0RunRef(input.sourceRunRef);
  const sourceExperimentRootHash = assertSha256(
    input.sourceExperimentRootHash,
    'sourceExperimentRootHash',
  );

  const surfaceBytes = await readFile(
    join(input.sealedPhase0SourceRoot, 'internal', 'player-surface-source.json'),
    'utf8',
  );
  const surface = JSON.parse(surfaceBytes) as HeadlessApiPlayerSurfaceTrace;
  if (surface.schemaVersion !== HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION) {
    throw new Error(`unsupported player surface source version: ${String(surface.schemaVersion)}`);
  }

  const sealedObservableBytes = await readFile(input.sealedObservablePayloadPath, 'utf8');
  const reprojected = projectHeadlessApiPlayerObservablePayload(surface);
  const reprojectedBytes = serializeObservablePayload(reprojected);
  if (reprojectedBytes !== sealedObservableBytes) {
    throw new Error(
      're-projected player-surface source does not exactly match sealed observable payload',
    );
  }

  const selectedArtifact = JSON.parse(await readFile(input.selectedHypothesisPath, 'utf8')) as unknown;
  const hypothesis = selectedHypothesisFromArtifact(selectedArtifact);
  const entryToStep = mapObservableEntriesToPlayerSurfaceSteps(surface);
  const seen = new Set<string>();
  const items: BoundedCausalAttributionItem[] = [];

  for (const entryId of hypothesis.evidenceRefs) {
    if (seen.has(entryId)) {
      throw new Error(`selected hypothesis evidenceRefs contains duplicate entry: ${entryId}`);
    }
    seen.add(entryId);
    const mapped = entryToStep.get(entryId);
    if (!mapped) {
      throw new Error(`selected evidenceRef ${entryId} has no mapped player-surface source step`);
    }
    const { step } = mapped;
    items.push({
      observableEntryRef: entryId,
      sourceSequence: step.sequence,
      sourceKind: step.kind,
      ...(step.age !== undefined ? { age: step.age } : {}),
      attribution: attributionForStep(step),
    });
  }

  const artifact = validateBoundedCausalAttribution({
    schemaVersion: 'bounded-causal-attribution-v1',
    sourceRunRef,
    sourceExperimentRootHash,
    observablePayloadSha256: sha256Hex(Buffer.from(sealedObservableBytes, 'utf8')),
    hypothesisId: hypothesis.hypothesisId,
    items,
  });

  await writeCreateOnly(input.destinationPath, `${canonicalJson(artifact)}\n`);
  return artifact;
}
