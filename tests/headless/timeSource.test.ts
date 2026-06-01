import { FixedTimeSource, RuntimeTimeSource } from '../../src/headless/adapters/timeSource';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runTimeSourceTests(): void {
  const fixed = new FixedTimeSource(1_700_000_000_000);
  assert(fixed.now() === 1_700_000_000_000, 'Fixed time source should return fixed value');
  const runtime = new RuntimeTimeSource();
  const t = runtime.now();
  assert(typeof t === 'number' && t > 0, 'Runtime time source should return positive ms');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTimeSourceTests();
  console.log('timeSource.test.ts: ok');
}
