import type { AuthoringRequirementV1 } from './authoringRequirementContract';

export const HUMAN_DIRECT_FORMAL_EVENT_REFERENCE_REQUIREMENT: AuthoringRequirementV1 = {
  schemaVersion: 'authoring-requirement-v1',
  requirementId: 'human-direct-formal-event-training-business-coordination-v1',
  source: {
    kind: 'HUMAN_DIRECT',
    refs: ['human-direct:formal-event-training-business-reference'],
  },
  authorityRefs: [
    'PD-124',
    'docs/product/content-authoring-workflow-contract-design.md',
    'docs/superpowers/specs/2026-10-07-authoring-requirement-bounded-formal-event-v1-design.md',
  ],
  target: 'FORMAL_EVENT',
  intent: 'Author one Formal Event that places sustained training and business practice in one concrete situation where the directions coordinate, conflict, or require a trade-off.',
  requiredContext: [
    'The person has already formed a sustained training practice.',
    'The person has already formed a sustained business practice.',
  ],
  desiredPlayerExperience: 'The player recognizes both real life directions in the same situation and understands how the present choice or outcome affects what follows.',
  scopeConstraints: [
    'Author exactly one Formal Event.',
    'The event must have meaningful Past-to-Present-to-Future continuity.',
    'Future Hook must be NONE.',
    'Do not introduce a new flag, fact, state, stat, scheduler rule, or runtime semantic.',
  ],
};
