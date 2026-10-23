import { SeededRandomSource } from '../../src/headless/adapters/randomSource.js';
import { serverRandomSourceScope } from '../../server/src/services/randomSourceScope.js';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function expectedPair(seed: number): [number, number] {
  const source = new SeededRandomSource(seed);
  return [source.next(), source.next()];
}

export async function runRandomSourceScopeTests(): Promise<void> {
  let releaseBarrier!: () => void;
  const barrier = new Promise<void>(resolve => { releaseBarrier = resolve; });
  let arrivals = 0;
  const waitForBoth = async () => {
    arrivals += 1;
    if (arrivals === 2) releaseBarrier();
    await barrier;
  };

  const sourceA = new SeededRandomSource(101);
  const sourceB = new SeededRandomSource(202);
  const drawPair = (source: SeededRandomSource) => serverRandomSourceScope.runAsync(source, async () => {
    const first = Math.random();
    await waitForBoth();
    const second = Math.random();
    return [first, second] as [number, number];
  });
  const [drawsA, drawsB] = await Promise.all([drawPair(sourceA), drawPair(sourceB)]);
  assert(drawsA.every((value, index) => value === expectedPair(101)[index]),
    'life A random draws must match its own serial stream across async interleaving');
  assert(drawsB.every((value, index) => value === expectedPair(202)[index]),
    'life B random draws must match its own serial stream across async interleaving');
  assert(sourceA.exportState().drawIndex === 2 && sourceB.exportState().drawIndex === 2,
    'each interleaved life must advance only its own random source');

  const dispatcher = Math.random;
  const failedSource = new SeededRandomSource(303);
  try {
    await serverRandomSourceScope.runAsync(failedSource, async () => {
      Math.random();
      throw new Error('controlled failure');
    });
    throw new Error('expected the controlled random scope to fail');
  } catch (error) {
    assert(error instanceof Error && error.message === 'controlled failure',
      'the original operation error should escape the random scope');
  }
  assert(Math.random === dispatcher, 'an exception must not replace the installed Math.random dispatcher');
  Math.random();
  assert(failedSource.exportState().drawIndex === 1,
    'an exception must not leave its life random source active outside the async scope');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRandomSourceScopeTests().then(() => console.log('randomSourceScope.test.ts: ok'));
}
