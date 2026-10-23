import { SeededRandomSource, withRandomSourceSync } from '../../src/headless/adapters/randomSource';
import { HeadlessEngineSessionImpl } from '../../src/headless/session/HeadlessEngineSessionImpl';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

async function preschoolPassiveTitle(seed: number): Promise<string> {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: 'rng',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: seed,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = 5;
  snap.state.player.alive = true;
  snap.state.flags = { ...(snap.state.flags ?? {}), origin_scholar_family: true };
  snap.state.player.flags = { ...(snap.state.player.flags ?? {}), origin_scholar_family: true };

  const session = HeadlessEngineSessionImpl.create({
    playerName: 'rng',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: seed,
  });
  await session.hydrate(snap);
  session.ensurePassivePresentation();
  return session.getProgressionVolatileState().passiveNarrative?.title ?? '';
}

export async function runRandomSourceTests(): Promise<void> {
  const a = new SeededRandomSource(42);
  const b = new SeededRandomSource(42);
  const seqA = [a.next(), a.next(), a.next()];
  const seqB = [b.next(), b.next(), b.next()];
  assert(seqA.every((v, i) => v === seqB[i]), 'Seeded random should be deterministic');

  const persisted = new SeededRandomSource(42);
  persisted.next();
  persisted.next();
  const checkpoint = persisted.exportState();
  assert(checkpoint.drawIndex === 2, 'SeededRandomSource should expose the cumulative draw index');
  const resumed = SeededRandomSource.fromState(checkpoint);
  const uninterrupted = new SeededRandomSource(42);
  uninterrupted.next();
  uninterrupted.next();
  assert(resumed.next() === uninterrupted.next(),
    'restored SeededRandomSource should continue at the exact next value');

  let patched = 0;
  withRandomSourceSync(new SeededRandomSource(7), () => {
    patched = Math.random();
  });
  const direct = new SeededRandomSource(7).next();
  assert(patched === direct, 'withRandomSourceSync should patch Math.random');

  const titleA = await preschoolPassiveTitle(70001);
  const titleB = await preschoolPassiveTitle(70001);
  assert(titleA.length > 0, 'seeded passive title should be non-empty');
  assert(titleA === titleB, 'ensurePassivePresentation should be deterministic under fixed randomSeed');

  const idSnapshot = HeadlessEngineSessionImpl.create({
    playerName: 'rng',
    gender: 'male',
    catalogVersion: '1.0.0',
    randomSeed: 70001,
  }).serialize();
  const idRandom = new SeededRandomSource(9876);
  const sourceBeforeSession = idRandom.exportState();
  HeadlessEngineSessionImpl.create(
    { snapshot: idSnapshot },
    { random: idRandom },
  );
  assert(idRandom.exportState().drawIndex === sourceBeforeSession.drawIndex,
    'creating a technical Headless session id must not consume the game random source');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRandomSourceTests().then(() => {
    console.log('randomSource.test.ts: ok');
  });
}
