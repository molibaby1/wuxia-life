import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseBoundedCausalAttribution,
  validateBoundedCausalAttribution,
} from '../../src/evolution/causalAttributionContract';
import { serializeObservablePayload } from '../../src/evolution/playerObservableTranscript';
import { projectHeadlessApiPlayerObservablePayload } from '../../src/evolution/wuxiaPlayerObservableProjector';
import {
  HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
  type HeadlessApiPlayerSurfaceTrace,
} from '../../src/headless/playability/playerSurfaceCapture';
import {
  buildBoundedCausalAttribution,
} from '../../scripts/evolution/causalAttribution/buildBoundedCausalAttribution';
import { canonicalJson, sha256Hex } from '../../scripts/evolution/phase0/provenance';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

function baseValid(): Record<string, unknown> {
  return {
    schemaVersion: 'bounded-causal-attribution-v1',
    sourceRunRef: 'cohort-run-000001',
    sourceExperimentRootHash: HASH_A,
    observablePayloadSha256: HASH_B,
    hypothesisId: 'hypothesis-000001',
    items: [{
      observableEntryRef: 'entry-000001',
      sourceSequence: 1,
      sourceKind: 'story_event',
      attribution: { kind: 'event', producerRef: 'event_alpha', selectedChoiceRef: 'choice_a' },
    }],
  };
}

function buildSurfaceTrace(): HeadlessApiPlayerSurfaceTrace {
  return {
    schemaVersion: HEADLESS_API_PLAYER_SURFACE_SOURCE_VERSION,
    steps: [
      {
        sequence: 1,
        kind: 'story_event',
        age: 16,
        storyEvent: {
          eventId: 'event_alpha',
          title: 'Alpha',
          text: 'Alpha body',
          choices: [{ id: 'choice_a', text: 'Accept' }, { id: 'choice_b', text: 'Decline' }],
        },
        selectedChoiceId: 'choice_a',
        presentationCards: [{ title: 'Alpha outcome', body: 'Accepted' }],
      },
      {
        sequence: 2,
        kind: 'period_summary',
        age: 16,
        presentationCards: [{ title: 'Year summary', body: 'Quiet year' }],
      },
      {
        sequence: 3,
        kind: 'active_action_result',
        age: 17,
        actionId: 'train_internal',
        presentationCards: [{ title: '闭关修炼', body: 'Training done' }],
      },
      {
        sequence: 4,
        kind: 'story_event',
        age: 18,
        storyEvent: {
          eventId: 'event_beta',
          title: 'Beta',
          text: 'Beta body',
        },
        presentationCards: [{ title: 'Beta outcome' }],
      },
      {
        sequence: 5,
        kind: 'story_event',
        age: 19,
        storyEvent: {
          eventId: 'event_gamma',
          title: 'Gamma',
          text: 'Gamma body',
        },
        presentationCards: [{ title: 'Gamma outcome' }],
      },
      {
        sequence: 6,
        kind: 'disturbance',
        age: 19,
        presentationCards: [{ title: 'Noise', body: 'Unrelated' }],
      },
    ],
  };
}

async function writeSelection(
  root: string,
  evidenceRefs: string[],
): Promise<string> {
  await mkdir(root, { recursive: true });
  const path = join(root, 'selection.json');
  await writeFile(path, canonicalJson({
    schemaVersion: 'fresh-problem-hypothesis-selection-v1',
    rule: 'first_hypothesis_in_participant_order',
    sourceHypothesesSha256: HASH_A,
    hypothesisCount: 1,
    selectedIndex: 0,
    selectedHypothesisId: 'hypothesis-000001',
    selectedHypothesis: {
      hypothesisId: 'hypothesis-000001',
      hypothesis: 'Selected evidence problem.',
      observedBasis: 'Observed.',
      feedbackRefs: ['overallImpression'],
      evidenceRefs,
      unknowns: ['Cause remains unknown.'],
      productSignificance: 'Significant.',
    },
  }));
  return path;
}

export async function runBoundedCausalAttributionContractTests(): Promise<void> {
  assert.deepEqual(validateBoundedCausalAttribution(baseValid()).items[0]?.attribution.kind, 'event');
  assert.equal(
    validateBoundedCausalAttribution({
      ...baseValid(),
      items: [{
        observableEntryRef: 'entry-000002',
        sourceSequence: 2,
        sourceKind: 'active_action_result',
        attribution: { kind: 'action', producerRef: 'train_internal' },
      }],
    }).items[0]?.attribution.kind,
    'action',
  );
  assert.equal(
    validateBoundedCausalAttribution({
      ...baseValid(),
      items: [{
        observableEntryRef: 'entry-000003',
        sourceSequence: 3,
        sourceKind: 'period_summary',
        attribution: { kind: 'unavailable' },
      }],
    }).items[0]?.attribution.kind,
    'unavailable',
  );

  assert.throws(
    () => validateBoundedCausalAttribution({ ...baseValid(), extra: true }),
    /unknown field/,
  );
  assert.throws(
    () => validateBoundedCausalAttribution({
      ...baseValid(),
      items: [
        baseValid().items![0],
        { ...(baseValid().items![0] as object), observableEntryRef: 'entry-000001' },
      ],
    }),
    /duplicate observableEntryRef/,
  );
  assert.throws(
    () => validateBoundedCausalAttribution({
      ...baseValid(),
      items: [{
        observableEntryRef: 'entry-000001',
        sourceSequence: 1,
        sourceKind: 'story_event',
        attribution: { kind: 'event', producerRef: '' },
      }],
    }),
    /producerRef/,
  );
  assert.throws(
    () => validateBoundedCausalAttribution({
      ...baseValid(),
      observablePayloadSha256: 'not-a-hash',
    }),
    /SHA-256/,
  );
  assert.throws(
    () => validateBoundedCausalAttribution({
      ...baseValid(),
      items: [{
        observableEntryRef: 'entry-000001',
        sourceSequence: 1,
        sourceKind: 'story_event',
        attribution: { kind: 'event', producerRef: 'event_alpha', seed: 1 },
      }],
    }),
    /unknown field/,
  );
  assert.deepEqual(parseBoundedCausalAttribution(JSON.stringify(baseValid())).hypothesisId, 'hypothesis-000001');
}

export async function runBoundedCausalAttributionBuilderTests(): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), 'bounded-causal-'));
  const surface = buildSurfaceTrace();
  // Prefer a known catalog action id if train_internal is absent.
  const { getActionById } = await import('../../src/data/activeActionCatalog');
  if (!getActionById('train_internal')) {
    const { activeActionCatalog } = await import('../../src/data/activeActionCatalog');
    const first = activeActionCatalog[0];
    assert.ok(first);
    surface.steps[2]!.actionId = first.id;
    surface.steps[2]!.presentationCards = [{ title: first.name, body: 'Training done' }];
  }
  const observableBytes = serializeObservablePayload(projectHeadlessApiPlayerObservablePayload(surface));
  const sourceRoot = join(root, 'game-run');
  await mkdir(join(sourceRoot, 'internal'), { recursive: true });
  await writeFile(join(sourceRoot, 'internal/player-surface-source.json'), `${canonicalJson(surface)}\n`);
  const observablePath = join(root, 'source/observable-payload.json');
  await mkdir(join(root, 'source'), { recursive: true });
  await writeFile(observablePath, observableBytes);
  const selectedPath = await writeSelection(root, ['entry-000001', 'entry-000003', 'entry-000004']);
  const destinationPath = join(root, 'diagnostic/causal-attribution.json');

  const artifact = await buildBoundedCausalAttribution({
    sealedPhase0SourceRoot: sourceRoot,
    sealedObservablePayloadPath: observablePath,
    selectedHypothesisPath: selectedPath,
    sourceRunRef: 'cohort-run-000001',
    sourceExperimentRootHash: HASH_A,
    destinationPath,
  });

  assert.deepEqual(artifact.items.map(item => item.observableEntryRef), [
    'entry-000001',
    'entry-000003',
    'entry-000004',
  ]);
  assert.equal(artifact.items[0]?.attribution.kind, 'event');
  if (artifact.items[0]?.attribution.kind === 'event') {
    assert.equal(artifact.items[0].attribution.producerRef, 'event_alpha');
    assert.equal(artifact.items[0].attribution.selectedChoiceRef, 'choice_a');
  }
  assert.equal(artifact.items[1]?.attribution.kind, 'action');
  if (artifact.items[1]?.attribution.kind === 'action') {
    assert.equal(artifact.items[1].attribution.producerRef, surface.steps[2]!.actionId);
  }
  assert.equal(artifact.items[2]?.attribution.kind, 'event');
  if (artifact.items[2]?.attribution.kind === 'event') {
    assert.equal(artifact.items[2].attribution.producerRef, 'event_beta');
    assert.equal(artifact.items[2].attribution.selectedChoiceRef, undefined);
  }

  const producerRefs = new Set(
    artifact.items
      .map(item => (item.attribution.kind === 'unavailable' ? null : item.attribution.producerRef))
      .filter((value): value is string => value !== null),
  );
  assert.equal(producerRefs.has('event_gamma'), false);

  const unavailablePath = join(root, 'diagnostic/unavailable.json');
  const unavailableSelection = await writeSelection(join(root, 'unavailable'), ['entry-000002']);
  const unavailable = await buildBoundedCausalAttribution({
    sealedPhase0SourceRoot: sourceRoot,
    sealedObservablePayloadPath: observablePath,
    selectedHypothesisPath: unavailableSelection,
    sourceRunRef: 'cohort-run-000001',
    sourceExperimentRootHash: HASH_A,
    destinationPath: unavailablePath,
  });
  assert.equal(unavailable.items[0]?.attribution.kind, 'unavailable');
  assert.equal(unavailable.items[0]?.sourceKind, 'period_summary');

  const tamperedObservable = join(root, 'source/tampered-observable.json');
  await writeFile(tamperedObservable, `${observableBytes.slice(0, -2)}x"`);
  await assert.rejects(
    () => buildBoundedCausalAttribution({
      sealedPhase0SourceRoot: sourceRoot,
      sealedObservablePayloadPath: tamperedObservable,
      selectedHypothesisPath: selectedPath,
      sourceRunRef: 'cohort-run-000001',
      sourceExperimentRootHash: HASH_A,
      destinationPath: join(root, 'diagnostic/fail.json'),
    }),
    /exactly match sealed observable payload/,
  );

  const serialized = await readFile(destinationPath, 'utf8');
  const parsed = JSON.parse(serialized) as Record<string, unknown>;
  const forbiddenKeys = [
    'seed',
    'persona',
    'effects',
    'stateDelta',
    'flags',
    'lifeStates',
    'weights',
    'candidate',
    'GameState',
  ];
  function assertNoForbidden(value: unknown, path = '$'): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => assertNoForbidden(item, `${path}[${index}]`));
      return;
    }
    if (typeof value !== 'object' || value === null) return;
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbiddenKeys.includes(key), false, `forbidden key at ${path}.${key}`);
      assertNoForbidden(child, `${path}.${key}`);
    }
  }
  assertNoForbidden(parsed);
  assert.equal(typeof parsed.sourceExperimentRootHash, 'string');
  assert.equal(sha256Hex(Buffer.from(observableBytes, 'utf8')), artifact.observablePayloadSha256);

  // Missing actionId with ambiguous title must fail closed.
  const ambiguous = structuredClone(surface);
  delete ambiguous.steps[2]!.actionId;
  ambiguous.steps[2]!.presentationCards = [{ title: 'Ambiguous Duplicate Name', body: 'x' }];
  const ambiguousRoot = join(root, 'ambiguous-source');
  await mkdir(join(ambiguousRoot, 'internal'), { recursive: true });
  await writeFile(join(ambiguousRoot, 'internal/player-surface-source.json'), `${canonicalJson(ambiguous)}\n`);
  const ambiguousObservable = serializeObservablePayload(projectHeadlessApiPlayerObservablePayload(ambiguous));
  const ambiguousObservablePath = join(root, 'ambiguous-observable.json');
  await writeFile(ambiguousObservablePath, ambiguousObservable);
  const ambiguousSelection = await writeSelection(join(root, 'ambiguous-selection'), ['entry-000003']);
  await assert.rejects(
    () => buildBoundedCausalAttribution({
      sealedPhase0SourceRoot: ambiguousRoot,
      sealedObservablePayloadPath: ambiguousObservablePath,
      selectedHypothesisPath: ambiguousSelection,
      sourceRunRef: 'cohort-run-000001',
      sourceExperimentRootHash: HASH_A,
      destinationPath: join(root, 'diagnostic/ambiguous.json'),
    }),
    /cannot resolve active action identity|no formal action named/,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  Promise.all([
    runBoundedCausalAttributionContractTests(),
    runBoundedCausalAttributionBuilderTests(),
  ])
    .then(() => console.log('boundedCausalAttribution.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
