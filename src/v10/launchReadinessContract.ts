export const V10_LAUNCH_READINESS_CONTRACT_VERSION = 'v1.0-rules-v1';

export const V10_REQUIRED_DESIGN_DOCS = [
  'docs/designs/v1-0-launch-dimension-rules.md',
  'docs/designs/v1-0-blocker-and-deferral-rules.md',
  'docs/designs/v1-0-launch-freeze-boundary.md',
  'docs/designs/v1-0-post-launch-cadence.md',
] as const;

export const V10_REQUIRED_REPORT_DOCS = [
  'docs/test-reports/v1-0-launch-surfaces-audit.md',
  'docs/test-reports/v1-0-alignment-indicators.md',
] as const;

export const V10_ALL_LAUNCH_DOC_PATHS = [
  ...V10_REQUIRED_DESIGN_DOCS,
  ...V10_REQUIRED_REPORT_DOCS,
] as const;

/** Launch dimensions required for v1.0 — must match profile playtestDimensionConfigs. */
export const V10_REQUIRED_LAUNCH_DIMENSION_IDS = [
  'first_run_readability',
  'onboarding_motivation',
  'replay_distinctiveness',
  'route_differentiation',
  'late_game_payoff',
  'ending_aftertaste',
] as const;

export const V10_REQUIRED_ISSUE_CLASSES = [
  'Release blocker',
  'Launch-quality issue',
  'Post-launch candidate',
] as const;

export const V10_REQUIRED_FREEZE_LAYERS = [
  'Runtime core',
  'Content',
  'Tuning',
  'UI',
  'Process',
] as const;

export const V10_REQUIRED_RC_CHANGE_CLASSES = [
  'Ship-critical fix',
  'Launch-quality polish',
  'Deferred',
] as const;

export const V10_REQUIRED_CADENCE_TRAINS = ['hotfix', 'patch', 'content wave'] as const;

export const V10_REQUIRED_AUDIT_STATUSES = [
  'launch-ready',
  'borderline',
  'release-blocking',
] as const;

export interface V10LaunchDocRule {
  docId: string;
  path: string;
  requiredSections: readonly string[];
  requiredTokens: readonly string[];
}

export const V10_LAUNCH_DOC_RULES: readonly V10LaunchDocRule[] = [
  {
    docId: 'launch-dimensions',
    path: 'docs/designs/v1-0-launch-dimension-rules.md',
    requiredSections: ['## Dimensions in scope', '## How dimensions compose launch readiness'],
    requiredTokens: [...V10_REQUIRED_LAUNCH_DIMENSION_IDS, 'Technical stability'],
  },
  {
    docId: 'blocker-deferral',
    path: 'docs/designs/v1-0-blocker-and-deferral-rules.md',
    requiredSections: ['## Issue classes', '## Explicitly deferred beyond v1.0'],
    requiredTokens: [...V10_REQUIRED_ISSUE_CLASSES, 'deferredItems'],
  },
  {
    docId: 'freeze-boundary',
    path: 'docs/designs/v1-0-launch-freeze-boundary.md',
    requiredSections: ['## Freeze scope', '## RC change classes', '## Exit criteria'],
    requiredTokens: [...V10_REQUIRED_FREEZE_LAYERS, ...V10_REQUIRED_RC_CHANGE_CLASSES],
  },
  {
    docId: 'post-launch-cadence',
    path: 'docs/designs/v1-0-post-launch-cadence.md',
    requiredSections: [
      '## v1.0 → v1.0.1 hotfix path',
      '## Patch cadence (v1.0.x)',
      '## Content wave cadence (v1.1+)',
      '## Issue routing',
    ],
    requiredTokens: [...V10_REQUIRED_CADENCE_TRAINS, 'Release blocker'],
  },
  {
    docId: 'launch-surfaces-audit',
    path: 'docs/test-reports/v1-0-launch-surfaces-audit.md',
    requiredSections: ['## Classification legend', '## Surface inventory', '## Main launch risks'],
    requiredTokens: [
      ...V10_REQUIRED_AUDIT_STATUSES,
      'First-run quality',
      'Replay value',
      'Route clarity',
      'Technical stability',
    ],
  },
  {
    docId: 'alignment-indicators',
    path: 'docs/test-reports/v1-0-alignment-indicators.md',
    requiredSections: ['## Indicators', '## Decision mapping'],
    requiredTokens: ['Overestimate bias', 'healthyRange', 'alignmentGap'],
  },
] as const;
