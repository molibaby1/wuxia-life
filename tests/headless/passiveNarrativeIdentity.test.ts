import assert from 'node:assert/strict';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl.js';
import { SeededRandomSource, withRandomSourceSync } from '../../src/headless/adapters/randomSource.js';
import type { HeadlessProgressionVolatileState } from '../../src/headless/session/sessionTypes.js';
import { selectPassiveNarrative } from '../../src/data/infantPassiveNarratives.js';

type PassiveIdentityState = HeadlessProgressionVolatileState & {
  passiveNarrativeId: string | null;
};

function buildOrdinaryPassiveSession(seed: number, scholarOrigin = true, age = 3.5) {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: '被动条目身份测试侠',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: seed,
  });
  const snapshot = bootstrap.serialize();
  snapshot.state.player.age = age;
  snapshot.state.player.alive = true;
  snapshot.state.player.events = [];
  snapshot.state.eventHistory = [];
  snapshot.state.flags = scholarOrigin
    ? { ...(snapshot.state.flags ?? {}), origin_scholar_family: true }
    : {};
  if (!scholarOrigin) snapshot.state.player.flags = {};
  delete snapshot.state.pendingStoryEventId;

  const random = new SeededRandomSource(seed);
  const session = HeadlessEngineSessionImpl.create({ snapshot }, { random });
  const selected = withRandomSourceSync(random, () => selectPassiveNarrative(session.getRuntimeState()));
  const current = session.getProgressionVolatileState();
  session.applyProgressionVolatileState({
    ...current,
    passiveNarrative: { title: selected.title, text: selected.text },
    annualPassiveMemory: null,
    passiveNarrativeId: selected.id,
  } as PassiveIdentityState);
  return { session, random, selected };
}

async function settleOrdinaryPassive(session: HeadlessEngineSessionImpl): Promise<void> {
  await (session as unknown as { executePassiveChildhoodTick(): Promise<void> })
    .executePassiveChildhoodTick();
}

export async function runPassiveNarrativeIdentityTests(): Promise<void> {
  const failures: string[] = [];
  const rememberFailure = (label: string, run: () => void) => {
    try {
      run();
    } catch (error) {
      failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const selectedCase = buildOrdinaryPassiveSession(812);
  const persisted = selectedCase.session.getProgressionVolatileState() as PassiveIdentityState;
  rememberFailure('the selected stable identity is persisted beside its display', () => {
    assert.equal(persisted.passiveNarrativeId, selectedCase.selected.id);
    assert.deepEqual(persisted.passiveNarrative, {
      title: selectedCase.selected.title,
      text: selectedCase.selected.text,
    });
  });
  const drawIndexBeforeConfirmation = selectedCase.random.exportState().drawIndex;
  await settleOrdinaryPassive(selectedCase.session);
  rememberFailure('confirmation settles the persisted entry without another RNG draw', () => {
    assert.equal(selectedCase.random.exportState().drawIndex, drawIndexBeforeConfirmation);
    assert.equal(
      selectedCase.session.getProgressionVolatileState().pendingPeriodSummary?.headline,
      selectedCase.selected.title,
    );
    assert.equal(
      selectedCase.session.getRuntimeState().eventHistory?.at(-1)?.eventId,
      selectedCase.selected.id,
    );
  });

  const invalidCase = buildOrdinaryPassiveSession(813);
  const invalidState = invalidCase.session.getProgressionVolatileState();
  invalidCase.session.applyProgressionVolatileState({
    ...invalidState,
    passiveNarrativeId: 'missing-preschool-passive-entry',
  } as PassiveIdentityState);
  const snapshotBeforeInvalidConfirmation = structuredClone(invalidCase.session.serialize().state);
  const randomBeforeInvalidConfirmation = invalidCase.random.exportState();
  let rejected = false;
  try {
    await settleOrdinaryPassive(invalidCase.session);
  } catch {
    rejected = true;
  }
  rememberFailure('an unresolved selected identity fails closed without advancing runtime or RNG', () => {
    assert.equal(rejected, true);
    assert.deepEqual(invalidCase.session.serialize().state, snapshotBeforeInvalidConfirmation);
    assert.deepEqual(invalidCase.random.exportState(), randomBeforeInvalidConfirmation);
  });

  const mismatchedCase = buildOrdinaryPassiveSession(815);
  const mismatchedState = mismatchedCase.session.getProgressionVolatileState();
  mismatchedCase.session.applyProgressionVolatileState({
    ...mismatchedState,
    passiveNarrative: {
      title: `${mismatchedCase.selected.title}（错误展示）`,
      text: mismatchedCase.selected.text,
    },
  });
  const snapshotBeforeMismatchedConfirmation = structuredClone(mismatchedCase.session.serialize().state);
  const randomBeforeMismatchedConfirmation = mismatchedCase.random.exportState();
  let mismatchedRejected = false;
  try {
    await settleOrdinaryPassive(mismatchedCase.session);
  } catch {
    mismatchedRejected = true;
  }
  rememberFailure('a valid ID paired with a different display fails closed before state advances', () => {
    assert.equal(mismatchedRejected, true);
    assert.deepEqual(mismatchedCase.session.serialize().state, snapshotBeforeMismatchedConfirmation);
    assert.deepEqual(mismatchedCase.random.exportState(), randomBeforeMismatchedConfirmation);
  });

  const gapCase = buildOrdinaryPassiveSession(814, false, 8);
  const gapState = gapCase.session.getProgressionVolatileState() as PassiveIdentityState;
  assert.equal(gapState.passiveNarrativeId, gapCase.selected.id);
  assert.equal(gapCase.selected.id, 'preschool_passive_gap',
    'the controlled originless state uses the existing generated gap entry');
  const gapDrawIndex = gapCase.random.exportState().drawIndex;
  await settleOrdinaryPassive(gapCase.session);
  assert.equal(gapCase.random.exportState().drawIndex, gapDrawIndex,
    'the generated gap entry also settles without a new selection draw');
  assert.equal(
    gapCase.session.getRuntimeState().eventHistory?.[
      (gapCase.session.getRuntimeState().eventHistory?.length ?? 0) - 1
    ]?.eventId,
    gapCase.selected.id,
    'generated gap identity remains the event-history identity after settlement');

  assert.deepEqual(failures, [], failures.join('\n'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPassiveNarrativeIdentityTests()
    .then(() => console.log('passiveNarrativeIdentity.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
