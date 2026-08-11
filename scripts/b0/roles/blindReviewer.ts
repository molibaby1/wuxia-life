import type { BlindObservation, B0PlayerVisibleTrace } from '../types';

/** Blind reviewer: only player-visible traces + anonymous sample keys. Deterministic heuristics. */
export function reviewPlayerVisibleTraces(
  samples: Array<{ sampleKey: string; visible: B0PlayerVisibleTrace }>,
): BlindObservation[] {
  return samples.map(({ sampleKey, visible }) => {
    const observations: string[] = [];
    const evidenceRefs: string[] = [];
    const eventIds = visible.steps
      .map(s => (s.event as { id?: string } | undefined)?.id)
      .filter(Boolean) as string[];

    if (eventIds.length >= 3 && new Set(eventIds).size === 1) {
      observations.push('短窗口内事件标题/身份高度重复');
      evidenceRefs.push(`steps[0..${eventIds.length - 1}].event.id=${eventIds[0]}`);
    }

    const titles = visible.steps
      .map(s => (s.event as { title?: string } | undefined)?.title ?? '')
      .join(' ');
    if (/琐事|低影响|填充/.test(titles) && visible.steps.length >= 8) {
      observations.push('长期低影响日常，正式事件感弱');
      evidenceRefs.push(`stepCount=${visible.steps.length}`);
    }

    for (const step of visible.steps) {
      const text = `${(step.event as { text?: string } | undefined)?.text ?? ''}`;
      if (/未见明显说明|继续前行/.test(text)) {
        observations.push('结果说明偏空，难以理解代价');
        evidenceRefs.push(`age=${step.age}`);
      }
    }

    if (observations.length === 0) {
      observations.push('公开轨迹未见明显结构性异常');
    }

    return { sampleKey, observations, evidenceRefs };
  });
}
