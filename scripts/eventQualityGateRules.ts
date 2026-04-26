export type EventQualitySeverity = 'blocker' | 'major' | 'minor';

export type EventQualityIssueType =
  | 'duplicate_id'
  | 'invalid_age_range'
  | 'invalid_condition'
  | 'broken_storyline'
  | 'unreachable_event'
  | 'empty_content'
  | 'empty_effects'
  | 'invalid_stat'
  | 'same_age_congestion'
  | 'duplicate_title';

export interface EventQualityRule {
  issueType: EventQualityIssueType;
  severity: EventQualitySeverity;
  blocking: boolean;
  description: string;
}

export const EVENT_QUALITY_SEVERITY_DEFINITIONS: Record<EventQualitySeverity, string> = {
  blocker: 'Must fail validation immediately; indicates progression or runtime correctness risk.',
  major: 'Warning in iterative development; must be resolved before release quality sign-off.',
  minor: 'Warning-only hygiene issue for normal content maintenance.',
};

export const EVENT_QUALITY_RULES: ReadonlyArray<EventQualityRule> = [
  {
    issueType: 'duplicate_id',
    severity: 'blocker',
    blocking: true,
    description: 'Event IDs must be globally unique.',
  },
  {
    issueType: 'invalid_age_range',
    severity: 'blocker',
    blocking: true,
    description: 'Age constraints must be valid and non-inverted.',
  },
  {
    issueType: 'invalid_condition',
    severity: 'blocker',
    blocking: true,
    description: 'Condition payloads must conform to supported grammar and shape.',
  },
  {
    issueType: 'broken_storyline',
    severity: 'blocker',
    blocking: true,
    description: 'Storyline references and sequencing must remain coherent.',
  },
  {
    issueType: 'unreachable_event',
    severity: 'blocker',
    blocking: true,
    description: 'Events must have at least one feasible trigger path.',
  },
  {
    issueType: 'empty_content',
    severity: 'major',
    blocking: false,
    description: 'Narrative-facing content should not be blank.',
  },
  {
    issueType: 'empty_effects',
    severity: 'major',
    blocking: false,
    description: 'Expected effect containers should not be empty.',
  },
  {
    issueType: 'invalid_stat',
    severity: 'major',
    blocking: false,
    description: 'Stat keys and payloads must match the canonical stat contract.',
  },
  {
    issueType: 'same_age_congestion',
    severity: 'major',
    blocking: false,
    description: 'Age-bucket concentration should remain within pacing thresholds.',
  },
  {
    issueType: 'duplicate_title',
    severity: 'minor',
    blocking: false,
    description: 'Titles should remain unique enough for content management clarity.',
  },
] as const;

export const EVENT_QUALITY_BLOCKING_ISSUES = EVENT_QUALITY_RULES.filter((rule) => rule.blocking).map(
  (rule) => rule.issueType
);

export const EVENT_QUALITY_WARNING_ONLY_ISSUES = EVENT_QUALITY_RULES.filter((rule) => !rule.blocking).map(
  (rule) => rule.issueType
);
