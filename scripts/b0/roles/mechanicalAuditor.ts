import type { B0RawTrace, MechanicalAuditResult, MechanicalDetection } from '../types';

// ponytail: B0-only guardrail constants; not P8 formal thresholds
const REPEAT_WINDOW_YEARS = 5;
const REPEAT_MIN_COUNT = 3;
const MONOPOLY_MIN_SHARE = 0.75;
const DROUGHT_MIN_YEARS = 8;

function asRecords(raw: B0RawTrace): Array<Record<string, unknown>> {
  return raw.records ?? [];
}

function detectRepeat(records: Array<Record<string, unknown>>): MechanicalDetection[] {
  const byId = new Map<string, number[]>();
  for (const r of records) {
    const id = String(r.eventId ?? '');
    const age = Number(r.age ?? 0);
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id)!.push(age);
  }
  const out: MechanicalDetection[] = [];
  for (const [eventId, ages] of byId) {
    ages.sort((a, b) => a - b);
    for (let i = 0; i < ages.length; i++) {
      const window = ages.filter(a => a >= ages[i] && a <= ages[i] + REPEAT_WINDOW_YEARS - 1);
      if (window.length >= REPEAT_MIN_COUNT) {
        out.push({
          code: 'repeat_short_window',
          severity: 'hard',
          evidence: `${eventId} x${window.length} within ${REPEAT_WINDOW_YEARS}y`,
        });
        break;
      }
    }
  }
  return out;
}

function detectMonopoly(records: Array<Record<string, unknown>>): MechanicalDetection[] {
  // ponytail: need enough events or single-choice fixtures false-positive as 100% monopoly
  if (records.length < 4) return [];
  const counts = new Map<string, number>();
  for (const r of records) {
    const key = String(r.eventCategory ?? r.eventId ?? 'unknown');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (const [key, count] of counts) {
    if (count / records.length >= MONOPOLY_MIN_SHARE) {
      return [
        {
          code: 'category_monopoly',
          severity: 'hard',
          evidence: `${key} share ${(count / records.length).toFixed(2)}`,
        },
      ];
    }
  }
  return [];
}

function detectDrought(records: Array<Record<string, unknown>>): MechanicalDetection[] {
  const low = records.filter(r => r.lowImpact === true || r.progressionKind === 'active_action');
  if (low.length >= DROUGHT_MIN_YEARS) {
    const ages = low.map(r => Number(r.age)).sort((a, b) => a - b);
    const span = ages[ages.length - 1] - ages[0];
    if (span >= DROUGHT_MIN_YEARS - 1) {
      return [
        {
          code: 'formal_event_drought',
          severity: 'hard',
          evidence: `low-impact span ${span}y count=${low.length}`,
        },
      ];
    }
  }
  return [];
}

function detectChoiceIssues(records: Array<Record<string, unknown>>): MechanicalDetection[] {
  const out: MechanicalDetection[] = [];
  for (const r of records) {
    const unreachable = r.choiceUnreachableIds as string[] | undefined;
    if (unreachable && unreachable.length > 0) {
      out.push({
        code: 'choice_unreachable',
        severity: 'hard',
        evidence: `unreachable=${unreachable.join(',')}`,
      });
    }
    if (r.choiceEquivalent === true) {
      out.push({
        code: 'choice_collapse',
        severity: 'hard',
        evidence: `event=${r.eventId}`,
      });
    }
    const choices = r.availableChoices as Array<{ effects?: unknown[] }> | undefined;
    if (choices && choices.length >= 2) {
      const signatures = choices.map(c => JSON.stringify(c.effects ?? []));
      if (new Set(signatures).size === 1) {
        out.push({
          code: 'choice_collapse',
          severity: 'hard',
          evidence: `equivalent effects on ${r.eventId}`,
        });
      }
    }
  }
  return out;
}

function detectOpaqueNegative(records: Array<Record<string, unknown>>): MechanicalDetection[] {
  const out: MechanicalDetection[] = [];
  for (const r of records) {
    const evidence = r.outcomeEvidence as
      | {
          stateBefore?: { player?: { healthStatus?: string; martialPower?: number } };
          stateAfter?: { player?: { healthStatus?: string; martialPower?: number } };
          executedEffects?: unknown[];
        }
      | undefined;
    if (!evidence) continue;
    const before = evidence.stateBefore?.player;
    const after = evidence.stateAfter?.player;
    const healthWorsened =
      before?.healthStatus === 'healthy' && after?.healthStatus && after.healthStatus !== 'healthy';
    const powerDrop =
      typeof before?.martialPower === 'number' &&
      typeof after?.martialPower === 'number' &&
      after.martialPower < before.martialPower;
    if (!healthWorsened && !powerDrop && !(evidence.executedEffects?.length)) continue;

    const text = `${r.eventText ?? ''} ${r.outcomeText ?? ''} ${r.eventTitle ?? ''}`;
    const warned = /受伤|危险|损失|衰减|重伤|预警/.test(text);
    const explained = /因为|导致|所以|结果是/.test(text);
    if (!warned && !explained) {
      out.push({
        code: 'opaque_negative',
        severity: 'hard',
        evidence: `event=${r.eventId} negative without warning/explanation`,
      });
    }
  }
  return out;
}

export function auditRawTrace(raw: B0RawTrace): MechanicalAuditResult {
  const records = asRecords(raw);
  const detections = [
    ...detectRepeat(records),
    ...detectMonopoly(records),
    ...detectDrought(records),
    ...detectChoiceIssues(records),
    ...detectOpaqueNegative(records),
  ];
  // dedupe by code
  const seen = new Set<string>();
  const unique = detections.filter(d => {
    if (seen.has(d.code)) return false;
    seen.add(d.code);
    return true;
  });
  return {
    sampleId: raw.sampleId,
    arm: raw.arm,
    detections: unique,
    hardKill: unique.some(d => d.severity === 'hard'),
  };
}
