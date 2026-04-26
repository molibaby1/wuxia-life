import { eventLoader } from '../src/core/EventLoader';
import type { EffectDefinition, EventCondition, EventDefinition } from '../src/types/eventTypes';
import {
  EVENT_QUALITY_RULES,
  type EventQualityIssueType,
  type EventQualitySeverity,
} from './eventQualityGateRules';
import originEventsJson from '../src/data/lines/origin.json';
import generalEventsJson from '../src/data/lines/general.json';
import loveEventsJson from '../src/data/lines/love.json';
import officialEventsJson from '../src/data/lines/official.json';
import middleAgeCareerEventsJson from '../src/data/lines/middle-age-career.json';
import familyLifeEventsJson from '../src/data/lines/family-life.json';
import jianghuConflictEventsJson from '../src/data/lines/jianghu-conflict.json';
import elderlyLegacyEventsJson from '../src/data/lines/elderly-legacy.json';
import sectBeggarsEventsJson from '../src/data/lines/sect-beggars.json';
import sectBorderEventsJson from '../src/data/lines/sect-border.json';
import sectMarginalEventsJson from '../src/data/lines/sect-marginal.json';
import sectShaolinEventsJson from '../src/data/lines/sect-shaolin.json';
import sectWudangEventsJson from '../src/data/lines/sect-wudang.json';
import trainingEventsJson from '../src/data/lines/training.json';
import heroEventsJson from '../src/data/lines/identity-hero.json';
import merchantEventsJson from '../src/data/lines/identity-merchant.json';
import demonEventsJson from '../src/data/lines/identity-demon.json';
import outlawEventsJson from '../src/data/lines/identity-outlaw.json';
import identityYearEventsJson from '../src/data/lines/identity-year-events.json';
import factionEventsJson from '../src/data/lines/faction-revelation.json';
import setbackEventsJson from '../src/data/lines/setback-events.json';

interface EventQualityIssue {
  eventId: string;
  source: string;
  issueType: EventQualityIssueType;
  severity: EventQualitySeverity;
  explanation: string;
  migrationHint?: string;
}

type EventFormatStatus = 'target' | 'legacy' | 'mixed';

interface EventFormatClassification {
  status: EventFormatStatus;
  signals: string[];
  migrationHints: string[];
  dangerousReasons: string[];
}

interface ValidationResult {
  issues: EventQualityIssue[];
  formatByEventId: Record<string, EventFormatClassification>;
}

const RULE_BY_TYPE = new Map(EVENT_QUALITY_RULES.map((rule) => [rule.issueType, rule]));
const STAT_KEYS = new Set([
  'martialPower',
  'externalSkill',
  'internalSkill',
  'qinggong',
  'constitution',
  'comprehension',
  'charisma',
  'chivalry',
  'reputation',
  'connections',
  'knowledge',
  'businessAcumen',
  'influence',
  'money',
  'health',
  'wealth',
]);
const SAME_AGE_CONGESTION_THRESHOLD = 18;

function createIssue(
  eventId: string,
  source: string,
  issueType: EventQualityIssueType,
  explanation: string,
  migrationHint?: string
): EventQualityIssue {
  const rule = RULE_BY_TYPE.get(issueType);
  if (!rule) {
    throw new Error(`Unknown issue type: ${issueType}`);
  }

  return {
    eventId,
    source,
    issueType,
    severity: rule.severity,
    explanation,
    migrationHint,
  };
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0;
}

function isExpressionCondition(condition: unknown): condition is EventCondition {
  if (!condition || typeof condition !== 'object') {
    return false;
  }

  const candidate = condition as EventCondition;
  return candidate.type === 'expression' && typeof candidate.expression === 'string' && candidate.expression.trim().length > 0;
}

function collectEffects(event: EventDefinition): EffectDefinition[] {
  const effects: EffectDefinition[] = [];

  if (Array.isArray(event.autoEffects)) {
    effects.push(...event.autoEffects);
  }
  if (Array.isArray(event.content?.autoEffects)) {
    effects.push(...event.content.autoEffects);
  }
  for (const choice of event.choices || []) {
    if (Array.isArray(choice.effects)) {
      effects.push(...choice.effects);
    }
    for (const outcome of choice.outcomes || []) {
      if (Array.isArray(outcome.effects)) {
        effects.push(...outcome.effects);
      }
    }
  }

  return effects;
}

function classifyEventFormat(event: EventDefinition): EventFormatClassification {
  const effects = collectEffects(event);
  const canonicalSignals: string[] = [];
  const legacySignals: string[] = [];
  const migrationHints: string[] = [];
  const dangerousReasons: string[] = [];

  const hasTopLevelAutoEffects = Array.isArray(event.autoEffects) && event.autoEffects.length > 0;
  if (hasTopLevelAutoEffects) {
    canonicalSignals.push('top-level autoEffects');
  }

  const hasModernConditions = (event.conditions || []).some((condition) => isExpressionCondition(condition));
  if (hasModernConditions) {
    canonicalSignals.push('expression-based conditions');
  }

  if (event.thresholds && typeof event.thresholds === 'object') {
    canonicalSignals.push('thresholds gate');
  }

  const hasLegacyContentAutoEffects = Array.isArray(event.content?.autoEffects) && event.content.autoEffects.length > 0;
  if (hasLegacyContentAutoEffects) {
    legacySignals.push('content.autoEffects');
    migrationHints.push('Move `content.autoEffects` to top-level `autoEffects`.');
  }

  const hasLegacyRequirementsAttributes =
    event.requirements &&
    typeof event.requirements === 'object' &&
    Object.prototype.hasOwnProperty.call(event.requirements, 'attributes');
  if (hasLegacyRequirementsAttributes) {
    legacySignals.push('requirements.attributes');
    migrationHints.push('Move `requirements.attributes` to `thresholds.attributes` and expression `conditions`.');
  }

  const hasLegacyTriggerConditions = event.triggerConditions && typeof event.triggerConditions === 'object';
  if (hasLegacyTriggerConditions) {
    legacySignals.push('triggerConditions payload');
    migrationHints.push('Replace `triggerConditions` with explicit `conditions` and `thresholds` fields.');
  }

  let hasAliasWithTarget = false;
  for (const effect of effects) {
    const hasTarget = typeof effect.target === 'string' && effect.target.trim().length > 0;
    if (hasTarget) {
      canonicalSignals.push('effect.target');
    }

    if (typeof effect.stat === 'string' && effect.stat.trim().length > 0) {
      legacySignals.push('effect.stat alias');
      migrationHints.push('Replace `effect.stat` with canonical `effect.target` for `stat_modify`.');
      if (hasTarget) {
        hasAliasWithTarget = true;
      }
    }

    if (typeof effect.flag === 'string' && effect.flag.trim().length > 0) {
      legacySignals.push('effect.flag alias');
      migrationHints.push('Replace `effect.flag` with canonical `effect.target` for flag effects.');
      if (hasTarget) {
        hasAliasWithTarget = true;
      }
    }

    if (typeof effect.event === 'string' && effect.event.trim().length > 0) {
      legacySignals.push('effect.event alias');
      migrationHints.push('Replace `effect.event` with canonical `effect.target` for event record/trigger effects.');
      if (hasTarget) {
        hasAliasWithTarget = true;
      }
    }
  }

  if (hasAliasWithTarget) {
    dangerousReasons.push('Effect payload mixes canonical target and legacy alias on the same effect object.');
  }

  if (hasTopLevelAutoEffects && hasLegacyContentAutoEffects) {
    dangerousReasons.push('Both `autoEffects` and `content.autoEffects` are present in one event.');
  }

  const canonicalDetected = canonicalSignals.length > 0;
  const legacyDetected = legacySignals.length > 0;
  const status: EventFormatStatus = canonicalDetected && legacyDetected ? 'mixed' : legacyDetected ? 'legacy' : 'target';

  return {
    status,
    signals: [...new Set([...canonicalSignals, ...legacySignals])],
    migrationHints: [...new Set(migrationHints)],
    dangerousReasons,
  };
}

function hasExecutableEffects(event: EventDefinition): boolean {
  if (collectEffects(event).length > 0) {
    return true;
  }

  if (event.eventType === 'choice' && Array.isArray(event.choices) && event.choices.length > 0) {
    return event.choices.some((choice) => {
      if (Array.isArray(choice.effects) && choice.effects.length > 0) {
        return true;
      }
      return Array.isArray(choice.outcomes) && choice.outcomes.some((outcome) => Array.isArray(outcome.effects) && outcome.effects.length > 0);
    });
  }

  return false;
}

function buildLoadedSourceById(loadedEvents: EventDefinition[]): Map<string, string> {
  const sourceMap = new Map<string, string>();
  const loadedIds = new Set(loadedEvents.map((event) => event.id));
  const lineMap: Array<{ source: string; events: EventDefinition[] }> = [
    { source: './lines/origin.json', events: originEventsJson as EventDefinition[] },
    { source: './lines/general.json', events: generalEventsJson as EventDefinition[] },
    { source: './lines/love.json', events: loveEventsJson as EventDefinition[] },
    { source: './lines/official.json', events: officialEventsJson as EventDefinition[] },
    { source: './lines/middle-age-career.json', events: middleAgeCareerEventsJson as EventDefinition[] },
    { source: './lines/family-life.json', events: familyLifeEventsJson as EventDefinition[] },
    { source: './lines/jianghu-conflict.json', events: jianghuConflictEventsJson as EventDefinition[] },
    { source: './lines/elderly-legacy.json', events: elderlyLegacyEventsJson as EventDefinition[] },
    { source: './lines/sect-beggars.json', events: sectBeggarsEventsJson as EventDefinition[] },
    { source: './lines/sect-border.json', events: sectBorderEventsJson as EventDefinition[] },
    { source: './lines/sect-marginal.json', events: sectMarginalEventsJson as EventDefinition[] },
    { source: './lines/sect-shaolin.json', events: sectShaolinEventsJson as EventDefinition[] },
    { source: './lines/sect-wudang.json', events: sectWudangEventsJson as EventDefinition[] },
    { source: './lines/training.json', events: trainingEventsJson as EventDefinition[] },
    { source: './lines/identity-hero.json', events: heroEventsJson as EventDefinition[] },
    { source: './lines/identity-merchant.json', events: merchantEventsJson as EventDefinition[] },
    { source: './lines/identity-demon.json', events: demonEventsJson as EventDefinition[] },
    { source: './lines/identity-outlaw.json', events: outlawEventsJson as EventDefinition[] },
    { source: './lines/identity-year-events.json', events: identityYearEventsJson as EventDefinition[] },
    { source: './lines/faction-revelation.json', events: factionEventsJson as EventDefinition[] },
    { source: './lines/setback-events.json', events: setbackEventsJson as EventDefinition[] },
  ];

  for (const { source, events } of lineMap) {
    for (const event of events) {
      if (loadedIds.has(event.id) && !sourceMap.has(event.id)) {
        sourceMap.set(event.id, source);
      }
    }
  }

  return sourceMap;
}

function validateEventQuality(events: EventDefinition[]): ValidationResult {
  const issues: EventQualityIssue[] = [];
  const formatByEventId: Record<string, EventFormatClassification> = {};
  const sourceById = buildLoadedSourceById(events);
  const sourceOf = (eventId: string) => sourceById.get(eventId) || 'unknown_loaded_source';

  const ids = new Map<string, number>();
  const titles = new Map<string, string[]>();
  const exactAgeBuckets = new Map<number, string[]>();
  const storylineBuckets = new Map<string, string[]>();

  for (const event of events) {
    ids.set(event.id, (ids.get(event.id) || 0) + 1);

    const normalizedTitle = event.content?.title?.trim().toLowerCase();
    if (normalizedTitle) {
      const known = titles.get(normalizedTitle) || [];
      known.push(event.id);
      titles.set(normalizedTitle, known);
    }

    if (typeof event.ageRange?.min === 'number' && typeof event.ageRange?.max === 'number' && event.ageRange.min === event.ageRange.max) {
      const list = exactAgeBuckets.get(event.ageRange.min) || [];
      list.push(event.id);
      exactAgeBuckets.set(event.ageRange.min, list);
    }

    if (event.storyLine && event.storyLine.trim().length > 0) {
      const key = event.storyLine.trim();
      const list = storylineBuckets.get(key) || [];
      list.push(event.id);
      storylineBuckets.set(key, list);
    }
  }

  for (const event of events) {
    const source = sourceOf(event.id);
    const formatInfo = classifyEventFormat(event);
    formatByEventId[event.id] = formatInfo;

    if (formatInfo.status === 'legacy') {
      const hintText = formatInfo.migrationHints.join(' ');
      issues.push(
        createIssue(
          event.id,
          source,
          'legacy_format_detected',
          `Legacy format signals detected: ${formatInfo.signals.join(', ')}.`,
          hintText
        )
      );
    } else if (formatInfo.status === 'mixed') {
      const hintText = formatInfo.migrationHints.join(' ');
      if (formatInfo.dangerousReasons.length > 0) {
        issues.push(
          createIssue(
            event.id,
            source,
            'mixed_format_dangerous',
            `Dangerous mixed format detected: ${formatInfo.dangerousReasons.join(' ')}`,
            hintText
          )
        );
      } else {
        issues.push(
          createIssue(
            event.id,
            source,
            'mixed_format_detected',
            `Mixed target/legacy format detected: ${formatInfo.signals.join(', ')}.`,
            hintText
          )
        );
      }
    }

    const maxAge = event.ageRange?.max ?? event.ageRange?.min;
    if (
      typeof event.ageRange?.min !== 'number' ||
      typeof maxAge !== 'number' ||
      event.ageRange.min < 0 ||
      maxAge < event.ageRange.min
    ) {
      issues.push(
        createIssue(
          event.id,
          source,
          'invalid_age_range',
          `Age range is invalid: min=${String(event.ageRange?.min)}, max=${String(maxAge)}.`
        )
      );
    }

    for (const condition of event.conditions || []) {
      if (!isExpressionCondition(condition)) {
        issues.push(
          createIssue(event.id, source, 'invalid_condition', 'Event-level condition is not a supported expression payload.')
        );
      }
    }

    for (const choice of event.choices || []) {
      if (choice.condition && !isExpressionCondition(choice.condition)) {
        issues.push(
          createIssue(
            event.id,
            source,
            'invalid_condition',
            `Choice condition is invalid for choice ${choice.id || '(missing-id)'}.`
          )
        );
      }
      for (const outcome of choice.outcomes || []) {
        if (!isExpressionCondition(outcome.condition)) {
          issues.push(
            createIssue(
              event.id,
              source,
              'invalid_condition',
              `Outcome condition is invalid for choice ${choice.id || '(missing-id)'} / outcome ${outcome.id || '(missing-id)'}.`
            )
          );
        }
      }
    }

    if (isBlank(event.content?.text)) {
      issues.push(createIssue(event.id, source, 'empty_content', 'Event content.text is empty.'));
    }

    if (!hasExecutableEffects(event)) {
      issues.push(
        createIssue(
          event.id,
          source,
          'empty_effects',
          'No executable effects found in autoEffects/content.autoEffects/choice.effects/choice.outcomes.effects.'
        )
      );
      issues.push(
        createIssue(
          event.id,
          source,
          'unreachable_event',
          'Event has no executable effects and cannot produce meaningful state progression.'
        )
      );
    }

    for (const effect of collectEffects(event)) {
      if (effect.type === 'stat_modify') {
        const statKey = typeof effect.target === 'string' ? effect.target : (typeof effect.stat === 'string' ? effect.stat : '');
        if (!statKey || !STAT_KEYS.has(statKey)) {
          issues.push(
            createIssue(
              event.id,
              source,
              'invalid_stat',
              `STAT_MODIFY uses unsupported stat key: ${statKey || '(empty)'}.`
            )
          );
        }
      }
    }

    if (event.storyLine) {
      const storyline = event.storyLine.trim();
      if (storyline.length > 0 && (storylineBuckets.get(storyline)?.length || 0) < 2) {
        issues.push(
          createIssue(
            event.id,
            source,
            'broken_storyline',
            `storyLine "${storyline}" has only one event; expected at least a chain of 2 events.`
          )
        );
      }
    }

    const age = event.ageRange?.min;
    if (typeof age === 'number' && event.ageRange?.max === age) {
      const bucketSize = exactAgeBuckets.get(age)?.length || 0;
      if (bucketSize > SAME_AGE_CONGESTION_THRESHOLD) {
        issues.push(
          createIssue(
            event.id,
            source,
            'same_age_congestion',
            `Age ${age} has ${bucketSize} exact-age events (threshold=${SAME_AGE_CONGESTION_THRESHOLD}).`
          )
        );
      }
    }
  }

  for (const [eventId, count] of ids.entries()) {
    if (count > 1) {
      issues.push(
        createIssue(
          eventId,
          sourceOf(eventId),
          'duplicate_id',
          `Duplicate event id detected ${count} times in loaded event set.`
        )
      );
    }
  }

  for (const [title, eventIds] of titles.entries()) {
    if (eventIds.length > 1) {
      for (const eventId of eventIds) {
        issues.push(
          createIssue(
            eventId,
            sourceOf(eventId),
            'duplicate_title',
            `Duplicate normalized title "${title}" shared by events: ${eventIds.join(', ')}.`
          )
        );
      }
    }
  }

  const sortedIssues = issues.sort((a, b) => {
    if (a.severity === b.severity) {
      return a.eventId.localeCompare(b.eventId);
    }
    const rank: Record<EventQualitySeverity, number> = { blocker: 0, major: 1, minor: 2 };
    return rank[a.severity] - rank[b.severity];
  });

  return {
    issues: sortedIssues,
    formatByEventId,
  };
}

function main(): void {
  const events = eventLoader.getAllEvents();
  const { issues, formatByEventId } = validateEventQuality(events);
  const formatSummary = {
    target: Object.values(formatByEventId).filter((item) => item.status === 'target').length,
    legacy: Object.values(formatByEventId).filter((item) => item.status === 'legacy').length,
    mixed: Object.values(formatByEventId).filter((item) => item.status === 'mixed').length,
  };

  const blockerCount = issues.filter((issue) => issue.severity === 'blocker').length;
  const majorCount = issues.filter((issue) => issue.severity === 'major').length;
  const minorCount = issues.filter((issue) => issue.severity === 'minor').length;

  const output = {
    scannedEvents: events.length,
    summary: {
      blocker: blockerCount,
      major: majorCount,
      minor: minorCount,
      total: issues.length,
    },
    formatSummary,
    formatByEventId,
    issues,
  };

  console.log(JSON.stringify(output, null, 2));

  if (blockerCount > 0) {
    process.exitCode = 1;
  }
}

main();
