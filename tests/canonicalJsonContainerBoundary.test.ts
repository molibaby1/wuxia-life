import assert from 'node:assert/strict';
import { gameStateSnapshotAge50 } from '../src/contracts/fixtures/gameStateSnapshotAge50';
import {
  assertCanonicalSnapshot,
  CanonicalValidationError,
} from '../src/contracts/validation/canonicalGameStateValidation';

class SnapshotPayload {
  value = 'class-instance';
}

function rejected(label: string, mutate: (snapshot: ReturnType<typeof cloneSnapshot>) => void): void {
  const snapshot = cloneSnapshot();
  mutate(snapshot);
  assert.throws(
    () => assertCanonicalSnapshot(snapshot),
    error => error instanceof CanonicalValidationError && !(error instanceof RangeError),
    `${label} must produce a canonical validation error`,
  );
}

function cloneSnapshot() {
  return structuredClone(gameStateSnapshotAge50);
}

for (const [label, value] of [
  ['Map', new Map([['key', 'value']])],
  ['Set', new Set(['value'])],
  ['Date', new Date(0)],
  ['RegExp', /value/],
  ['class instance', new SnapshotPayload()],
] as const) {
  rejected(`${label} ending`, snapshot => { snapshot.state.ending = value; });
}

rejected('custom prototype', snapshot => {
  const value = Object.create({ inherited: true }) as Record<string, unknown>;
  value.own = true;
  snapshot.state.ending = value;
});

rejected('Object.create(null)', snapshot => {
  const value = Object.create(null) as Record<string, unknown>;
  value.own = true;
  snapshot.state.ending = value;
});

{
  const snapshot = cloneSnapshot();
  delete (snapshot.state as Record<string, unknown>).facts;
  Object.defineProperty(Object.prototype, 'facts', { value: {}, configurable: true });
  try {
    assert.throws(
      () => assertCanonicalSnapshot(snapshot),
      error => error instanceof CanonicalValidationError && /snapshot\.state\.facts/.test(error.message),
      'inherited required field must not satisfy required own property',
    );
  } finally {
    delete (Object.prototype as Record<string, unknown>).facts;
  }
}

rejected('symbol key', snapshot => {
  Object.defineProperty(snapshot.state.flags, Symbol('symbol-key'), { enumerable: true, value: true });
});

rejected('non-enumerable property', snapshot => {
  Object.defineProperty(snapshot.state.flags, 'hidden', { enumerable: false, value: true });
});

rejected('accessor property', snapshot => {
  Object.defineProperty(snapshot.state, 'unsafe', { enumerable: true, get: () => { throw new Error('getter invoked'); } });
});

rejected('ending cycle', snapshot => {
  const ending = { title: 'cycle' } as Record<string, unknown>;
  ending.self = ending;
  snapshot.state.ending = ending;
});

rejected('flags cycle', snapshot => {
  snapshot.state.flags.self = snapshot.state.flags;
});

rejected('self-referential array', snapshot => {
  const values: unknown[] = [];
  values.push(values);
  snapshot.state.achievements = values as string[];
});

rejected('nested event stateSnapshot cycle', snapshot => {
  const stateSnapshot = {} as Record<string, unknown>;
  stateSnapshot.self = stateSnapshot;
  snapshot.state.eventHistory[0].stateSnapshot = stateSnapshot;
});

rejected('sparse array', snapshot => {
  const values: string[] = [];
  values.length = 1;
  snapshot.state.achievements = values;
});

for (const [label, value] of [
  ['undefined', undefined],
  ['NaN', Number.NaN],
  ['Infinity', Number.POSITIVE_INFINITY],
  ['bigint', BigInt(1)],
  ['function', () => true],
  ['symbol value', Symbol('value')],
] as const) {
  rejected(`${label} value`, snapshot => { snapshot.state.flags.invalid = value; });
}

console.log('✅ Canonical JSON container boundary tests passed');
