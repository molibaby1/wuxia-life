import type { B0PlayerVisibleTrace, B0RawTrace } from '../types';

const FORBIDDEN_VISIBLE_KEYS = new Set([
  'directEffects',
  'outcomeEffects',
  'executedEffects',
  'hiddenEffects',
  'finalState',
  'selectionPolicy',
  'mechanicalVerdict',
  'abIdentity',
  'knownBadLabel',
  'expectedDetections',
]);

function stripForbidden(value: unknown, path: string[] = []): unknown {
  if (Array.isArray(value)) {
    return value.map((item, i) => stripForbidden(item, [...path, String(i)]));
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(obj)) {
      if (FORBIDDEN_VISIBLE_KEYS.has(key)) {
        continue;
      }
      out[key] = stripForbidden(child, [...path, key]);
    }
    return out;
  }
  return value;
}

function containsForbiddenKeys(value: unknown): string[] {
  const hits: string[] = [];
  const walk = (node: unknown) => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
        if (FORBIDDEN_VISIBLE_KEYS.has(key)) {
          hits.push(key);
        }
        walk(child);
      }
    }
  };
  walk(value);
  return hits;
}

export type ProjectionResult =
  | { ok: true; visible: B0PlayerVisibleTrace }
  | { ok: false; reason: string; leakedKeys: string[] };

export function projectPlayerVisibleTrace(raw: B0RawTrace): ProjectionResult {
  const steps = ((raw.experienceTrace.steps as unknown[]) ?? []).map(step =>
    stripForbidden(step),
  ) as Array<Record<string, unknown>>;

  const visible: B0PlayerVisibleTrace = {
    schemaVersion: 'b0-player-visible-trace-v1',
    sampleId: raw.sampleId,
    arm: raw.arm,
    seed: raw.seed,
    personaId: raw.personaId,
    steps,
  };

  const leakedKeys = containsForbiddenKeys(visible);
  if (leakedKeys.length > 0) {
    return {
      ok: false,
      reason: 'player-visible Trace still contains hidden keys',
      leakedKeys: [...new Set(leakedKeys)],
    };
  }

  return { ok: true, visible };
}
