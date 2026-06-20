import { HeadlessEngineSessionImpl } from '../src/headless/session/HeadlessEngineSessionImpl';
import type { GameStateSnapshot } from '../src/contracts/gameStateSnapshot';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function snapshotScholar(age: number): GameStateSnapshot {
  const bootstrap = HeadlessEngineSessionImpl.create({
    playerName: 'US009',
    gender: 'female',
    catalogVersion: '1.0.0',
    randomSeed: 9,
  });
  const snap = bootstrap.serialize();
  snap.state.player.age = age;
  snap.state.player.alive = true;
  snap.state.player.traitProfile = { origin: 'scholar_house' };
  snap.state.flags = { ...(snap.state.flags ?? {}), origin_scholar_family: true };
  return snap;
}

export async function runPreschoolLitePaletteBrowserVerifyTests(): Promise<void> {
  for (const age of [5, 7]) {
    const session = HeadlessEngineSessionImpl.create({
      playerName: 'US009',
      gender: 'female',
      catalogVersion: '1.0.0',
    });
    await session.hydrate(snapshotScholar(age));
    (session as unknown as { volatile: { storyGapPassiveServed: boolean } }).volatile.storyGapPassiveServed = true;
    assert(session.getSessionPhase() === 'active_planning', `age ${age} reaches active_planning after passive gap`);
    const options = session.getPlanningOptions();
    assert(options.length >= 1 && options.length <= 2, `age ${age} lite palette ≤2`);
  }

  const s5 = HeadlessEngineSessionImpl.create({ playerName: 'a', gender: 'female', catalogVersion: '1.0.0' });
  await s5.hydrate(snapshotScholar(5));
  (s5 as unknown as { volatile: { storyGapPassiveServed: boolean } }).volatile.storyGapPassiveServed = true;
  const s7 = HeadlessEngineSessionImpl.create({ playerName: 'b', gender: 'female', catalogVersion: '1.0.0' });
  await s7.hydrate(snapshotScholar(7));
  (s7 as unknown as { volatile: { storyGapPassiveServed: boolean } }).volatile.storyGapPassiveServed = true;

  const ids5 = s5.getPlanningOptions().map(o => o.actionId).sort().join(',');
  const ids7 = s7.getPlanningOptions().map(o => o.actionId).sort().join(',');
  assert(ids5 !== ids7, `scholar age 5 (${ids5}) vs age 7 (${ids7}) palette ids differ`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPreschoolLitePaletteBrowserVerifyTests()
    .then(() => console.log('preschoolLitePaletteBrowserVerifyTests: ok'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
