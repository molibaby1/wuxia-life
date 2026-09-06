import { getStageForAge } from '../narrative/config/stageConfig';

export const EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION = 'experience-semantic-context-v1' as const;

export type ExperienceCategory =
  | 'narrative'
  | 'practice'
  | 'reflection'
  | 'setback'
  | 'passive';

export type ExperienceSurfaceKind =
  | 'story_event'
  | 'active_action_result'
  | 'period_summary'
  | 'disturbance'
  | 'passive_narrative';

export interface ExperienceSemanticSource {
  type: string;
  ref?: string;
}

export interface ExperienceSemanticContext {
  schemaVersion: typeof EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION;
  semanticSource?: ExperienceSemanticSource;
  milestoneMeaning?: string;
  lifeStageMeaning?: string;
  experienceCategory: ExperienceCategory;
  expectedExperienceSignals: string[];
}

const CONTEXT_KEYS = [
  'schemaVersion',
  'semanticSource',
  'milestoneMeaning',
  'lifeStageMeaning',
  'experienceCategory',
  'expectedExperienceSignals',
] as const;

const EXPERIENCE_CATEGORIES = new Set<ExperienceCategory>([
  'narrative',
  'practice',
  'reflection',
  'setback',
  'passive',
]);

const SURFACE_KIND_CONTEXT: Record<ExperienceSurfaceKind, {
  category: ExperienceCategory;
  signal: string;
}> = {
  story_event: { category: 'narrative', signal: 'visible_story_event' },
  active_action_result: { category: 'practice', signal: 'visible_practice_result' },
  period_summary: { category: 'reflection', signal: 'period_reflection' },
  disturbance: { category: 'setback', signal: 'visible_setback_pressure' },
  passive_narrative: { category: 'passive', signal: 'passive_progression' },
};

const SEMANTIC_SOURCE_KEYS = ['type', 'ref'] as const;

function assertObject(value: unknown, label: string): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object and must not be null`);
  }
}

function assertExactKeys(value: Record<string, unknown>, label: string): void {
  const allowed = new Set(CONTEXT_KEYS);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key as (typeof CONTEXT_KEYS)[number])) {
      throw new Error(`${label} contains unknown field: ${key}`);
    }
  }
}

function assertNonEmptyString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
}

function assertOptionalString(value: unknown, path: string): asserts value is string | undefined {
  if (value !== undefined) assertNonEmptyString(value, path);
}

function parseSemanticSource(value: unknown): ExperienceSemanticSource {
  assertObject(value, 'experience context.semanticSource');
  const allowed = new Set(SEMANTIC_SOURCE_KEYS);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key as (typeof SEMANTIC_SOURCE_KEYS)[number])) {
      throw new Error(`experience context.semanticSource contains unknown field: ${key}`);
    }
  }
  if (!('type' in value)) {
    throw new Error('experience context.semanticSource missing required field: type');
  }
  assertNonEmptyString(value.type, 'experience context.semanticSource.type');
  assertOptionalString(value.ref, 'experience context.semanticSource.ref');
  return {
    type: value.type,
    ...(value.ref !== undefined ? { ref: value.ref } : {}),
  };
}

function assertStringArray(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  const seen = new Set<string>();
  value.forEach((item, index) => {
    assertNonEmptyString(item, `${path}[${index}]`);
    if (seen.has(item)) throw new Error(`${path} contains duplicate signal: ${item}`);
    seen.add(item);
  });
}

function assertNoNull(value: unknown, path: string): void {
  if (value === null) throw new Error(`${path} must not contain null`);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoNull(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) assertNoNull(child, `${path}.${key}`);
  }
}

export function validateExperienceSemanticContext(value: unknown): ExperienceSemanticContext {
  assertObject(value, 'experience context');
  assertNoNull(value, 'experience context');
  assertExactKeys(value, 'experience context');
  if (value.schemaVersion !== EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION) {
    throw new Error(`unsupported experience context schemaVersion: ${String(value.schemaVersion)}`);
  }
  const semanticSource = value.semanticSource === undefined
    ? undefined
    : parseSemanticSource(value.semanticSource);
  assertOptionalString(value.milestoneMeaning, 'experience context.milestoneMeaning');
  assertOptionalString(value.lifeStageMeaning, 'experience context.lifeStageMeaning');
  if (typeof value.experienceCategory !== 'string' || !EXPERIENCE_CATEGORIES.has(value.experienceCategory as ExperienceCategory)) {
    throw new Error('experience context.experienceCategory must be a known ExperienceCategory');
  }
  assertStringArray(value.expectedExperienceSignals, 'experience context.expectedExperienceSignals');
  return {
    schemaVersion: EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION,
    ...(semanticSource !== undefined ? { semanticSource } : {}),
    ...(value.milestoneMeaning !== undefined ? { milestoneMeaning: value.milestoneMeaning } : {}),
    ...(value.lifeStageMeaning !== undefined ? { lifeStageMeaning: value.lifeStageMeaning } : {}),
    experienceCategory: value.experienceCategory as ExperienceCategory,
    expectedExperienceSignals: [...value.expectedExperienceSignals],
  };
}

export function serializeExperienceSemanticContext(value: ExperienceSemanticContext): string {
  const context = validateExperienceSemanticContext(value);
  return JSON.stringify(context);
}

function lifeStageMeaningForAge(age: number, stageId: string | undefined): string {
  // Keep meaning aligned with WUXIA_STAGE_CONFIG when a stage exists; only age-bucket after stage coverage ends.
  if (stageId === 'stage_0_10' || stageId === 'stage_10_20') {
    return '早期成长：形成出身、习惯与最初方向。';
  }
  if (stageId === 'stage_20_30') return '中期发展：路线与关系开始分化。';
  if (stageId === 'stage_30_40') return '中年成就：身份与阶段成果逐步落地。';
  if (age <= 55) return '中年成就：身份与阶段成果逐步落地。';
  return '晚年传承：回顾投入并形成延续意义。';
}

export function buildExperienceSemanticContext(input: {
  age?: number;
  kind: ExperienceSurfaceKind;
}): ExperienceSemanticContext {
  const kindContext = SURFACE_KIND_CONTEXT[input.kind];
  if (!kindContext) throw new Error(`unsupported experience surface kind: ${String(input.kind)}`);
  if (input.age !== undefined && (!Number.isFinite(input.age) || input.age < 0)) {
    throw new Error('experience context age must be a finite number >= 0 when present');
  }

  const stage = input.age === undefined ? undefined : getStageForAge(input.age);
  // ponytail: ages past authored stages get no invented stage signals; extend WUXIA_STAGE_CONFIG when late-life semantics exist.
  const stageSignals = stage?.feedbackExpectation.expectedSignals ?? [];
  return validateExperienceSemanticContext({
    schemaVersion: EXPERIENCE_SEMANTIC_CONTEXT_SCHEMA_VERSION,
    semanticSource: {
      type: 'experience-context-builder',
      ref: `stage:${stage?.id ?? 'none'};surface:${input.kind}`,
    },
    ...(input.age !== undefined
      ? { lifeStageMeaning: lifeStageMeaningForAge(input.age, stage?.id) }
      : {}),
    experienceCategory: kindContext.category,
    expectedExperienceSignals: [...stageSignals, kindContext.signal],
  });
}
