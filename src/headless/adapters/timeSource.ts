/**
 * Time source adapter (P5 US-006).
 */

export interface TimeSource {
  now(): number;
}

export class RuntimeTimeSource implements TimeSource {
  now(): number {
    return Date.now();
  }
}

export class FixedTimeSource implements TimeSource {
  constructor(private readonly fixedMs: number) {}

  now(): number {
    return this.fixedMs;
  }
}

export function createDefaultTimeSource(): TimeSource {
  return new RuntimeTimeSource();
}
