/**
 * Random source adapter (P5 US-005).
 */

export interface RandomSource {
  /** Returns a float in [0, 1). */
  next(): number;
  /** Optional stable seed label for replay metadata. */
  readonly seedLabel?: string | number;
}

const nativeRandom = Math.random.bind(Math);

export class PlatformRandomSource implements RandomSource {
  next(): number {
    return nativeRandom();
  }
}

/** Mulberry32 PRNG for deterministic tests and replay. */
export class SeededRandomSource implements RandomSource {
  readonly seedLabel: number;
  private state: number;

  constructor(seed: number) {
    this.seedLabel = seed;
    this.state = seed >>> 0;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

export function createDefaultRandomSource(): RandomSource {
  return new PlatformRandomSource();
}

/** Patches global Math.random for the duration of `run` (matches GameProcessSimulator). */
export function withRandomSourceSync<T>(source: RandomSource, run: () => T): T {
  const original = Math.random;
  Math.random = () => source.next();
  try {
    return run();
  } finally {
    Math.random = original;
  }
}

export async function withRandomSource<T>(
  source: RandomSource,
  run: () => T | Promise<T>,
): Promise<T> {
  const original = Math.random;
  Math.random = () => source.next();
  try {
    return await run();
  } finally {
    Math.random = original;
  }
}
