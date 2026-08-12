import type { BlindObservation, BlindPackage, BlindPair } from '../types';

function observeArm(steps: Array<Record<string, unknown>>, armKey: string): {
  observations: string[];
  evidenceRefs: string[];
} {
  const observations: string[] = [];
  const evidenceRefs: string[] = [];
  const eventIds = steps
    .map(s => (s.event as { id?: string } | undefined)?.id)
    .filter(Boolean) as string[];

  if (eventIds.length >= 3 && new Set(eventIds).size === 1) {
    observations.push(`${armKey}: 短窗口内事件标题/身份高度重复`);
    evidenceRefs.push(`${armKey}.steps[0..${eventIds.length - 1}].event.id=${eventIds[0]}`);
  }

  const titles = steps
    .map(s => (s.event as { title?: string } | undefined)?.title ?? '')
    .join(' ');
  if (/琐事|低影响|填充/.test(titles) && steps.length >= 8) {
    observations.push(`${armKey}: 长期低影响日常，正式事件感弱`);
    evidenceRefs.push(`${armKey}.stepCount=${steps.length}`);
  }

  for (const step of steps) {
    const text = `${(step.event as { text?: string } | undefined)?.text ?? ''}`;
    if (/未见明显说明|继续前行/.test(text)) {
      observations.push(`${armKey}: 结果说明偏空，难以理解代价`);
      evidenceRefs.push(`${armKey}.age=${step.age}`);
    }
  }

  return { observations, evidenceRefs };
}

/** Blind reviewer: only anonymized A/B pairs. No sampleId/arm/seed/persona/labels. */
export function reviewBlindPackage(blindPackage: BlindPackage): BlindObservation[] {
  return blindPackage.pairs.map((pair: BlindPair) => {
    const observations: string[] = [];
    const evidenceRefs: string[] = [];
    for (const arm of pair.arms) {
      const part = observeArm(arm.steps, arm.anonymousKey);
      observations.push(...part.observations);
      evidenceRefs.push(...part.evidenceRefs);
    }
    if (observations.length === 0) {
      observations.push('公开轨迹未见明显结构性异常');
    }
    return { pairKey: pair.pairKey, observations, evidenceRefs };
  });
}

/** @deprecated use reviewBlindPackage */
export function reviewPlayerVisibleTraces(
  samples: Array<{ sampleKey: string; visible: { steps: Array<Record<string, unknown>> } }>,
): BlindObservation[] {
  const pairs: BlindPair[] = samples.map((s, i) => ({
    pairKey: s.sampleKey,
    arms: [
      {
        schemaVersion: 'b0-blind-arm-v1',
        anonymousKey: `${s.sampleKey}-A`,
        steps: s.visible.steps,
      },
      {
        schemaVersion: 'b0-blind-arm-v1',
        anonymousKey: `${s.sampleKey}-B`,
        steps: [],
      },
    ],
  }));
  return reviewBlindPackage({ schemaVersion: 'b0-blind-package-v1', pairs });
}
