import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { eventLoader } from '../src/core/EventLoader';
import type { EffectDefinition, EventDefinition } from '../src/types/eventTypes';

type FormatClassification = 'main-flow' | 'legacy-compatible' | 'suspected-deprecated';

interface InventoryRow {
  format: string;
  count: number;
  classification: FormatClassification;
  notes: string;
}

interface InventorySection {
  section: string;
  rows: InventoryRow[];
}

function hasKey(record: unknown, key: string): boolean {
  return typeof record === 'object' && record !== null && Object.prototype.hasOwnProperty.call(record, key);
}

function asObject(record: unknown): Record<string, unknown> {
  return typeof record === 'object' && record !== null ? (record as Record<string, unknown>) : {};
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

function toRows(map: Map<string, number>, metadata: Record<string, Omit<InventoryRow, 'format' | 'count'>>): InventoryRow[] {
  const rows = [...map.entries()]
    .map(([format, count]) => ({
      format,
      count,
      classification: metadata[format]?.classification || 'legacy-compatible',
      notes: metadata[format]?.notes || '',
    }))
    .sort((a, b) => b.count - a.count || a.format.localeCompare(b.format));
  return rows;
}

function main(): void {
  const events = eventLoader.getAllEvents();

  const sections: InventorySection[] = [];

  const topLevelMap = new Map<string, number>();
  topLevelMap.set('event.requirements present', 0);
  topLevelMap.set('event.thresholds present', 0);
  topLevelMap.set('event.triggerConditions present', 0);
  let topLevelCanonical = 0;
  for (const event of events) {
    const hasCore =
      Boolean(event.id) &&
      typeof event.version === 'string' &&
      event.category !== undefined &&
      event.priority !== undefined &&
      typeof event.weight === 'number' &&
      !!event.ageRange &&
      Array.isArray(event.triggers) &&
      !!event.content &&
      typeof event.eventType === 'string';
    if (hasCore) {
      topLevelCanonical += 1;
    }
    if (hasKey(event, 'requirements')) {
      topLevelMap.set('event.requirements present', (topLevelMap.get('event.requirements present') || 0) + 1);
    }
    if (hasKey(event, 'thresholds')) {
      topLevelMap.set('event.thresholds present', (topLevelMap.get('event.thresholds present') || 0) + 1);
    }
    if (hasKey(event, 'triggerConditions')) {
      topLevelMap.set('event.triggerConditions present', (topLevelMap.get('event.triggerConditions present') || 0) + 1);
    }
  }
  topLevelMap.set('core event schema (id/version/category/priority/weight/ageRange/triggers/content/eventType)', topLevelCanonical);
  sections.push({
    section: 'top-level event fields',
    rows: toRows(topLevelMap, {
      'core event schema (id/version/category/priority/weight/ageRange/triggers/content/eventType)': {
        classification: 'main-flow',
        notes: 'Main runtime selection/execution path relies on this schema.',
      },
      'event.requirements present': {
        classification: 'legacy-compatible',
        notes: 'Used as a compatibility gate (`requirements.attributes`) in runtime selection.',
      },
      'event.thresholds present': {
        classification: 'main-flow',
        notes: 'Runtime threshold checker consumes this structure directly.',
      },
      'event.triggerConditions present': {
        classification: 'legacy-compatible',
        notes: 'Handled by `EventExecutor.canTriggerEvent` as broad compatibility payload.',
      },
    }),
  });

  const contentMap = new Map<string, number>();
  contentMap.set('content.text string', 0);
  contentMap.set('content.title string', 0);
  contentMap.set('content.description string', 0);
  contentMap.set('content.autoEffects[]', 0);
  contentMap.set('content.media object', 0);
  for (const event of events) {
    const content = asObject(event.content);
    if (typeof content.text === 'string') {
      contentMap.set('content.text string', (contentMap.get('content.text string') || 0) + 1);
    }
    if (typeof content.title === 'string') {
      contentMap.set('content.title string', (contentMap.get('content.title string') || 0) + 1);
    }
    if (typeof content.description === 'string') {
      contentMap.set('content.description string', (contentMap.get('content.description string') || 0) + 1);
    }
    if (Array.isArray(content.autoEffects)) {
      contentMap.set('content.autoEffects[]', (contentMap.get('content.autoEffects[]') || 0) + 1);
    }
    if (hasKey(content, 'media')) {
      contentMap.set('content.media object', (contentMap.get('content.media object') || 0) + 1);
    }
  }
  sections.push({
    section: 'content fields',
    rows: toRows(contentMap, {
      'content.text string': {
        classification: 'main-flow',
        notes: 'Main narrative text consumed by UI.',
      },
      'content.title string': {
        classification: 'main-flow',
        notes: 'Used for event title display and diagnostics.',
      },
      'content.description string': {
        classification: 'legacy-compatible',
        notes: 'Optional helper text; not required for runtime progression.',
      },
      'content.autoEffects[]': {
        classification: 'legacy-compatible',
        notes: 'Type marks it as compatibility access path.',
      },
      'content.media object': {
        classification: 'suspected-deprecated',
        notes: 'No active runtime/media execution path found in event engine.',
      },
    }),
  });

  const autoEffectsMap = new Map<string, number>();
  autoEffectsMap.set('event.autoEffects[]', 0);
  autoEffectsMap.set('event.content.autoEffects[]', 0);
  for (const event of events) {
    if (Array.isArray(event.autoEffects)) {
      autoEffectsMap.set('event.autoEffects[]', (autoEffectsMap.get('event.autoEffects[]') || 0) + 1);
    }
    if (Array.isArray(event.content?.autoEffects)) {
      autoEffectsMap.set('event.content.autoEffects[]', (autoEffectsMap.get('event.content.autoEffects[]') || 0) + 1);
    }
  }
  sections.push({
    section: 'autoEffects',
    rows: toRows(autoEffectsMap, {
      'event.autoEffects[]': {
        classification: 'main-flow',
        notes: 'Primary auto-event execution path (`executeAutoEvent`).',
      },
      'event.content.autoEffects[]': {
        classification: 'legacy-compatible',
        notes: 'Explicit compatibility field in type definition.',
      },
    }),
  });

  const effectsMap = new Map<string, number>();
  effectsMap.set('effect.type present', 0);
  effectsMap.set('effect.target field', 0);
  effectsMap.set('effect.value field', 0);
  effectsMap.set('effect.operator field', 0);
  effectsMap.set('effect.stat alias', 0);
  effectsMap.set('effect.flag alias', 0);
  effectsMap.set('effect.event alias', 0);
  effectsMap.set('effect.effects nested', 0);
  effectsMap.set('effect.ending_effect payload', 0);
  const allEffects = events.flatMap(collectEffects);
  for (const effect of allEffects) {
    effectsMap.set('effect.type present', (effectsMap.get('effect.type present') || 0) + 1);
    if (hasKey(effect, 'target')) {
      effectsMap.set('effect.target field', (effectsMap.get('effect.target field') || 0) + 1);
    }
    if (hasKey(effect, 'value')) {
      effectsMap.set('effect.value field', (effectsMap.get('effect.value field') || 0) + 1);
    }
    if (hasKey(effect, 'operator')) {
      effectsMap.set('effect.operator field', (effectsMap.get('effect.operator field') || 0) + 1);
    }
    if (hasKey(effect, 'stat')) {
      effectsMap.set('effect.stat alias', (effectsMap.get('effect.stat alias') || 0) + 1);
    }
    if (hasKey(effect, 'flag')) {
      effectsMap.set('effect.flag alias', (effectsMap.get('effect.flag alias') || 0) + 1);
    }
    if (hasKey(effect, 'event')) {
      effectsMap.set('effect.event alias', (effectsMap.get('effect.event alias') || 0) + 1);
    }
    if (hasKey(effect, 'effects')) {
      effectsMap.set('effect.effects nested', (effectsMap.get('effect.effects nested') || 0) + 1);
    }
    if (hasKey(effect, 'ending_effect')) {
      effectsMap.set('effect.ending_effect payload', (effectsMap.get('effect.ending_effect payload') || 0) + 1);
    }
  }
  sections.push({
    section: 'effects',
    rows: toRows(effectsMap, {
      'effect.type present': {
        classification: 'main-flow',
        notes: 'Dispatcher requires `type` to select handler.',
      },
      'effect.target field': {
        classification: 'main-flow',
        notes: 'Primary targeting field for stat/flag/event handlers.',
      },
      'effect.value field': {
        classification: 'main-flow',
        notes: 'Primary value payload used by most handlers.',
      },
      'effect.operator field': {
        classification: 'main-flow',
        notes: 'Arithmetic behavior selector in modifier handlers.',
      },
      'effect.stat alias': {
        classification: 'legacy-compatible',
        notes: 'Backward-compatible alias consumed with `target` fallback.',
      },
      'effect.flag alias': {
        classification: 'legacy-compatible',
        notes: 'Backward-compatible alias for flag handlers.',
      },
      'effect.event alias': {
        classification: 'legacy-compatible',
        notes: 'Backward-compatible alias for event record behavior.',
      },
      'effect.effects nested': {
        classification: 'main-flow',
        notes: 'Used by random/composite effect handlers.',
      },
      'effect.ending_effect payload': {
        classification: 'main-flow',
        notes: 'Consumed in executor post-processing to mark ending flags.',
      },
    }),
  });

  const choiceEffectsMap = new Map<string, number>();
  choiceEffectsMap.set('choice.effects[]', 0);
  choiceEffectsMap.set('choice.effects[] empty', 0);
  for (const event of events) {
    for (const choice of event.choices || []) {
      if (Array.isArray(choice.effects)) {
        choiceEffectsMap.set('choice.effects[]', (choiceEffectsMap.get('choice.effects[]') || 0) + 1);
        if (choice.effects.length === 0) {
          choiceEffectsMap.set('choice.effects[] empty', (choiceEffectsMap.get('choice.effects[] empty') || 0) + 1);
        }
      }
    }
  }
  sections.push({
    section: 'choice.effects',
    rows: toRows(choiceEffectsMap, {
      'choice.effects[]': {
        classification: 'main-flow',
        notes: 'Primary fallback execution path for choice events.',
      },
      'choice.effects[] empty': {
        classification: 'suspected-deprecated',
        notes: 'Runtime warns and treats as non-executable choice payload.',
      },
    }),
  });

  const choiceOutcomesMap = new Map<string, number>();
  choiceOutcomesMap.set('choice.outcomes[] present', 0);
  choiceOutcomesMap.set('outcome.condition expression object', 0);
  choiceOutcomesMap.set('outcome.condition function', 0);
  choiceOutcomesMap.set('outcome.condition missing', 0);
  choiceOutcomesMap.set('outcome.condition other shape', 0);
  choiceOutcomesMap.set('outcome.effects[]', 0);
  for (const event of events) {
    for (const choice of event.choices || []) {
      if (Array.isArray(choice.outcomes) && choice.outcomes.length > 0) {
        choiceOutcomesMap.set('choice.outcomes[] present', (choiceOutcomesMap.get('choice.outcomes[] present') || 0) + 1);
      }
      for (const outcome of choice.outcomes || []) {
        const condition = (outcome as { condition?: unknown }).condition;
        if (typeof condition === 'object' && condition !== null && (condition as { type?: unknown }).type === 'expression') {
          choiceOutcomesMap.set('outcome.condition expression object', (choiceOutcomesMap.get('outcome.condition expression object') || 0) + 1);
        } else if (typeof condition === 'function') {
          choiceOutcomesMap.set('outcome.condition function', (choiceOutcomesMap.get('outcome.condition function') || 0) + 1);
        } else if (condition === undefined || condition === null) {
          choiceOutcomesMap.set('outcome.condition missing', (choiceOutcomesMap.get('outcome.condition missing') || 0) + 1);
        } else {
          choiceOutcomesMap.set('outcome.condition other shape', (choiceOutcomesMap.get('outcome.condition other shape') || 0) + 1);
        }
        if (Array.isArray((outcome as { effects?: unknown }).effects)) {
          choiceOutcomesMap.set('outcome.effects[]', (choiceOutcomesMap.get('outcome.effects[]') || 0) + 1);
        }
      }
    }
  }
  sections.push({
    section: 'choice.outcomes',
    rows: toRows(choiceOutcomesMap, {
      'choice.outcomes[] present': {
        classification: 'main-flow',
        notes: 'Core branch-resolution structure in new game engine.',
      },
      'outcome.condition expression object': {
        classification: 'main-flow',
        notes: 'Preferred condition grammar path.',
      },
      'outcome.condition function': {
        classification: 'legacy-compatible',
        notes: 'Handled explicitly in composable as historical compatibility.',
      },
      'outcome.condition missing': {
        classification: 'legacy-compatible',
        notes: 'Treated as always-true branch in runtime helper.',
      },
      'outcome.condition other shape': {
        classification: 'suspected-deprecated',
        notes: 'Runtime warns and treats as unmet condition.',
      },
      'outcome.effects[]': {
        classification: 'main-flow',
        notes: 'Executable payload once outcome condition matches.',
      },
    }),
  });

  const requirementsMap = new Map<string, number>();
  requirementsMap.set('event.requirements.attributes', 0);
  requirementsMap.set('event.requirements extra keys', 0);
  requirementsMap.set('choice.requirements.statRequirements[]', 0);
  requirementsMap.set('choice.requirements.itemRequirements[]', 0);
  for (const event of events) {
    if (hasKey(event, 'requirements')) {
      const req = asObject(event.requirements);
      if (hasKey(req, 'attributes')) {
        requirementsMap.set('event.requirements.attributes', (requirementsMap.get('event.requirements.attributes') || 0) + 1);
      }
      const extraKeys = Object.keys(req).filter((key) => key !== 'attributes');
      if (extraKeys.length > 0) {
        requirementsMap.set('event.requirements extra keys', (requirementsMap.get('event.requirements extra keys') || 0) + 1);
      }
    }
    for (const choice of event.choices || []) {
      if (hasKey(choice, 'requirements')) {
        const req = asObject(choice.requirements);
        if (Array.isArray(req.statRequirements)) {
          requirementsMap.set('choice.requirements.statRequirements[]', (requirementsMap.get('choice.requirements.statRequirements[]') || 0) + 1);
        }
        if (Array.isArray(req.itemRequirements)) {
          requirementsMap.set('choice.requirements.itemRequirements[]', (requirementsMap.get('choice.requirements.itemRequirements[]') || 0) + 1);
        }
      }
    }
  }
  sections.push({
    section: 'requirements',
    rows: toRows(requirementsMap, {
      'event.requirements.attributes': {
        classification: 'main-flow',
        notes: 'Runtime availability filtering checks this map.',
      },
      'event.requirements extra keys': {
        classification: 'suspected-deprecated',
        notes: 'Not consumed by current core runtime filtering.',
      },
      'choice.requirements.statRequirements[]': {
        classification: 'legacy-compatible',
        notes: 'Propagated to UI payload but lacks strict runtime gate execution.',
      },
      'choice.requirements.itemRequirements[]': {
        classification: 'legacy-compatible',
        notes: 'Propagated to UI payload but lacks strict runtime gate execution.',
      },
    }),
  });

  const thresholdsMap = new Map<string, number>();
  thresholdsMap.set('thresholds.attributes', 0);
  thresholdsMap.set('thresholds.background', 0);
  thresholdsMap.set('thresholds.experience', 0);
  thresholdsMap.set('thresholds.identity', 0);
  for (const event of events) {
    if (!hasKey(event, 'thresholds')) {
      continue;
    }
    const thresholds = asObject(event.thresholds);
    if (hasKey(thresholds, 'attributes')) {
      thresholdsMap.set('thresholds.attributes', (thresholdsMap.get('thresholds.attributes') || 0) + 1);
    }
    if (hasKey(thresholds, 'background')) {
      thresholdsMap.set('thresholds.background', (thresholdsMap.get('thresholds.background') || 0) + 1);
    }
    if (hasKey(thresholds, 'experience')) {
      thresholdsMap.set('thresholds.experience', (thresholdsMap.get('thresholds.experience') || 0) + 1);
    }
    if (hasKey(thresholds, 'identity')) {
      thresholdsMap.set('thresholds.identity', (thresholdsMap.get('thresholds.identity') || 0) + 1);
    }
  }
  sections.push({
    section: 'thresholds',
    rows: toRows(thresholdsMap, {
      'thresholds.attributes': {
        classification: 'main-flow',
        notes: 'Checked by `checkThresholds` in formal selection path.',
      },
      'thresholds.background': {
        classification: 'main-flow',
        notes: 'Checked by `checkThresholds` with background tag evaluation.',
      },
      'thresholds.experience': {
        classification: 'main-flow',
        notes: 'Checked by `checkThresholds` against event history.',
      },
      'thresholds.identity': {
        classification: 'main-flow',
        notes: 'Checked by `checkThresholds` against current identity.',
      },
    }),
  });

  const triggerConditionsMap = new Map<string, number>();
  triggerConditionsMap.set('triggerConditions.choices', 0);
  triggerConditionsMap.set('triggerConditions.identity', 0);
  triggerConditionsMap.set('triggerConditions.karma', 0);
  triggerConditionsMap.set('triggerConditions extra keys', 0);
  for (const event of events) {
    if (!hasKey(event, 'triggerConditions')) {
      continue;
    }
    const tc = asObject(event.triggerConditions);
    if (hasKey(tc, 'choices')) {
      triggerConditionsMap.set('triggerConditions.choices', (triggerConditionsMap.get('triggerConditions.choices') || 0) + 1);
    }
    if (hasKey(tc, 'identity')) {
      triggerConditionsMap.set('triggerConditions.identity', (triggerConditionsMap.get('triggerConditions.identity') || 0) + 1);
    }
    if (hasKey(tc, 'karma')) {
      triggerConditionsMap.set('triggerConditions.karma', (triggerConditionsMap.get('triggerConditions.karma') || 0) + 1);
    }
    const extraKeys = Object.keys(tc).filter((key) => !['choices', 'identity', 'karma'].includes(key));
    if (extraKeys.length > 0) {
      triggerConditionsMap.set('triggerConditions extra keys', (triggerConditionsMap.get('triggerConditions extra keys') || 0) + 1);
    }
  }
  sections.push({
    section: 'triggerConditions',
    rows: toRows(triggerConditionsMap, {
      'triggerConditions.choices': {
        classification: 'legacy-compatible',
        notes: 'Consumed by `EventExecutor.canTriggerEvent` compatibility gate.',
      },
      'triggerConditions.identity': {
        classification: 'legacy-compatible',
        notes: 'Consumed by `EventExecutor.canTriggerEvent` compatibility gate.',
      },
      'triggerConditions.karma': {
        classification: 'legacy-compatible',
        notes: 'Consumed by `EventExecutor.canTriggerEvent` compatibility gate.',
      },
      'triggerConditions extra keys': {
        classification: 'suspected-deprecated',
        notes: 'No explicit runtime reader found for additional keys.',
      },
    }),
  });

  const now = new Date();
  const timestamp = now.toISOString();
  const output = {
    generatedAt: timestamp,
    scannedEvents: events.length,
    scannedEffects: allEffects.length,
    sections,
  };

  const reportLines: string[] = [];
  reportLines.push('# US-012 Event and Effect Format Inventory');
  reportLines.push('');
  reportLines.push(`- Generated at: ${timestamp}`);
  reportLines.push(`- Scanned events: ${events.length}`);
  reportLines.push(`- Scanned effects: ${allEffects.length}`);
  reportLines.push('- Data scope: runtime loaded events via `EventLoader.getAllEvents()`');
  reportLines.push('');
  reportLines.push('Classification legend:');
  reportLines.push('- `main-flow`: actively used by current main runtime paths.');
  reportLines.push('- `legacy-compatible`: retained compatibility shape still accepted by runtime.');
  reportLines.push('- `suspected-deprecated`: present in data but no clear active runtime consumer.');
  reportLines.push('');

  for (const section of sections) {
    reportLines.push(`## ${section.section}`);
    reportLines.push('');
    reportLines.push('| Format | Usage count | Classification | Notes |');
    reportLines.push('| --- | ---: | --- | --- |');
    for (const row of section.rows) {
      reportLines.push(`| ${row.format} | ${row.count} | ${row.classification} | ${row.notes} |`);
    }
    if (section.rows.length === 0) {
      reportLines.push('| (no usage detected) | 0 | suspected-deprecated | No matching data in currently loaded event set. |');
    }
    reportLines.push('');
  }

  const markdownPath = resolve(process.cwd(), 'docs/test-reports/us-012-event-effect-format-inventory.md');
  writeFileSync(markdownPath, `${reportLines.join('\n')}\n`, 'utf8');
  console.log(JSON.stringify(output, null, 2));
}

main();
