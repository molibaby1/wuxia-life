import { SeededRandomSource, withRandomSourceSync } from '../../src/headless/adapters/randomSource';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runRandomSourceTests(): void {
  const a = new SeededRandomSource(42);
  const b = new SeededRandomSource(42);
  const seqA = [a.next(), a.next(), a.next()];
  const seqB = [b.next(), b.next(), b.next()];
  assert(seqA.every((v, i) => v === seqB[i]), 'Seeded random should be deterministic');

  let patched = 0;
  withRandomSourceSync(new SeededRandomSource(7), () => {
    patched = Math.random();
  });
  const direct = new SeededRandomSource(7).next();
  assert(patched === direct, 'withRandomSourceSync should patch Math.random');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRandomSourceTests();
  console.log('randomSource.test.ts: ok');
}
