/**
 * Random source adapter (P5 US-005).
 */

export interface RandomSource {
  /** Returns a float in [0, 1). */
  next(): number;
  /** Optional stable seed label for replay metadata. */
  readonly seedLabel?: string | number;
}

export interface RandomSourceRunner {
  runSync<T>(source: RandomSource, run: () => T): T;
  runAsync<T>(source: RandomSource, run: () => T | Promise<T>): Promise<T>;
}

export interface SeededRandomState {
  algorithm: 'mulberry32';
  algorithmVersion: 1;
  initialSeed: number;
  state: number;
  drawIndex: number;
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
  readonly initialSeed: number;
  private state: number;
  private drawIndex = 0;

  constructor(seed: number) {
    this.seedLabel = seed >>> 0;
    this.initialSeed = this.seedLabel;
    this.state = this.initialSeed;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    this.drawIndex += 1;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  exportState(): SeededRandomState {
    return {
      algorithm: 'mulberry32',
      algorithmVersion: 1,
      initialSeed: this.initialSeed,
      state: this.state,
      drawIndex: this.drawIndex,
    };
  }

  static fromState(value: unknown): SeededRandomSource {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('Invalid Mulberry32 state');
    }
    const state = value as Partial<SeededRandomState>;
    const isUint32 = (number: unknown): number is number =>
      typeof number === 'number' && Number.isInteger(number) && number >= 0 && number <= 0xffffffff;
    if (state.algorithm !== 'mulberry32'
      || state.algorithmVersion !== 1
      || !isUint32(state.initialSeed)
      || !isUint32(state.state)
      || typeof state.drawIndex !== 'number'
      || !Number.isSafeInteger(state.drawIndex)
      || state.drawIndex < 0) {
      throw new Error('Invalid Mulberry32 state');
    }
    const expectedState = Number(
      (BigInt(state.initialSeed) + 0x6d2b79f5n * BigInt(state.drawIndex)) & 0xffffffffn,
    );
    if (state.state !== expectedState) throw new Error('Inconsistent Mulberry32 state');

    const source = new SeededRandomSource(state.initialSeed);
    source.state = state.state;
    source.drawIndex = state.drawIndex;
    return source;
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
