import type { EventDefinition } from '../src/types/eventTypes';

export type EventClass = 'injury' | 'illness' | 'economy';

/** 真实身体受伤信号（不含单字「伤」） */
const PHYSICAL_INJURY_PATTERN =
  /setback_injury|(?:^|[_\s])injury(?:$|[_\s])|\binjury\b|\bwound\b|受伤|创伤|伤势/;

/** 情感/流言语境，不得单独判为 injury */
const EMOTIONAL_INJURY_PHRASE = /伤人|伤心|伤感|伤情|最伤人/;

/** 非经济语境（「本钱」等含「钱/财」但非财产损失） */
const NON_ECONOMY_PHRASE = /本钱/g;

/** 明确经济/财产损失语义 */
const ECONOMY_SIGNAL_PATTERN =
  /economy|merchant|business|money|trade|finance|经济|商|银两|破产|财产损失|财富损失|财富|财产|缺钱|破财|损财/;

function collectTextParts(event: EventDefinition): string {
  return [
    event.id,
    event.category,
    event.type,
    event.eventType,
    event.content?.title,
    event.content?.description,
    event.content?.text,
    ...(event.tags || []),
    ...(event.metadata?.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function hasPhysicalInjurySignal(event: EventDefinition, textParts: string): boolean {
  const id = event.id.toLowerCase();

  if (/setback_injury|_injury\b/.test(id)) {
    return true;
  }

  const tagText = [...(event.tags || []), ...(event.metadata?.tags || [])]
    .join(' ')
    .toLowerCase();
  if (/\binjury\b|\bwound\b|受伤|创伤/.test(tagText)) {
    return true;
  }

  if (PHYSICAL_INJURY_PATTERN.test(textParts)) {
    return true;
  }

  return false;
}

function isEmotionalInjuryOnly(textParts: string): boolean {
  if (!EMOTIONAL_INJURY_PHRASE.test(textParts)) {
    return false;
  }
  const stripped = textParts.replace(EMOTIONAL_INJURY_PHRASE, '');
  return !PHYSICAL_INJURY_PATTERN.test(stripped);
}

function hasEconomySignal(event: EventDefinition, textParts: string): boolean {
  if (event.category === 'economy') {
    return true;
  }

  const id = event.id.toLowerCase();
  if (/property_loss|bankrupt|economy|merchant|finance/.test(id)) {
    return true;
  }

  const tagText = [...(event.tags || []), ...(event.metadata?.tags || [])]
    .join(' ')
    .toLowerCase();
  if (/economy|财产|经济|商|破产/.test(tagText)) {
    return true;
  }

  const stripped = textParts.replace(NON_ECONOMY_PHRASE, '');
  return ECONOMY_SIGNAL_PATTERN.test(stripped);
}

export function detectEventClasses(event: EventDefinition): EventClass[] {
  const textParts = collectTextParts(event);
  const classes = new Set<EventClass>();

  if (hasPhysicalInjurySignal(event, textParts) && !isEmotionalInjuryOnly(textParts)) {
    classes.add('injury');
  }

  if (
    /illness|disease|sick|medical|生病|疾病|病/.test(textParts)
  ) {
    classes.add('illness');
  }

  if (hasEconomySignal(event, textParts)) {
    classes.add('economy');
  }

  return [...classes];
}
