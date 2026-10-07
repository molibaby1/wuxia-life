import {
  validateAutonomousAuthoringProposal,
  type AutonomousAuthoringProposalV1,
} from './autonomousAuthoringContract';
import {
  validateAutonomousAuthoringAdmission,
  type AutonomousAuthoringAdmissionV1,
} from './autonomousAuthoringAdmissionContract';
import {
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID,
  PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION,
} from './preschoolSharedNeutralAuthoringContract';
import {
  BOUNDED_FORMAL_EVENT_CONTRACT_ID,
  BOUNDED_FORMAL_EVENT_CONTRACT_VERSION,
} from './boundedFormalEventAuthoringContract';
import {
  validateBoundedFormalEventProposalV2,
  type BoundedFormalEventProposalV2,
} from './boundedFormalEventProposalContract';
import {
  validateBoundedFormalEventAdmissionV2,
  type BoundedFormalEventAdmissionV2,
} from './boundedFormalEventAdmissionContract';

type RecordValue = Record<string, unknown>;

function identity(value: unknown, label: string): { schemaVersion: string; contractId: string; contractVersion: unknown } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(`${label} must be an object`);
  const record = value as RecordValue;
  if (typeof record.schemaVersion !== 'string' || typeof record.contractId !== 'string') {
    throw new Error(`${label} is missing explicit schema and contract identity`);
  }
  return { schemaVersion: record.schemaVersion, contractId: record.contractId, contractVersion: record.contractVersion };
}

export type RoutedAuthoringProposal =
  | { family: 'preschool-v1'; value: AutonomousAuthoringProposalV1 }
  | { family: 'bounded-formal-event-v1'; value: BoundedFormalEventProposalV2 };

export function validateAuthoringProposalByIdentity(value: unknown): RoutedAuthoringProposal['value'] {
  const found = identity(value, 'autonomous authoring proposal');
  if (
    found.schemaVersion === 'autonomous-authoring-proposal-v1'
    && found.contractId === PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    && found.contractVersion === PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION
  ) return validateAutonomousAuthoringProposal(value);
  if (
    found.schemaVersion === 'autonomous-authoring-proposal-v2'
    && found.contractId === BOUNDED_FORMAL_EVENT_CONTRACT_ID
    && found.contractVersion === BOUNDED_FORMAL_EVENT_CONTRACT_VERSION
  ) return validateBoundedFormalEventProposalV2(value);
  throw new Error(`unknown autonomous authoring proposal contract route: ${found.contractId}@${String(found.contractVersion)}`);
}

export type RoutedAuthoringAdmission =
  | { family: 'preschool-v1'; value: AutonomousAuthoringAdmissionV1 }
  | { family: 'bounded-formal-event-v1'; value: BoundedFormalEventAdmissionV2 };

export function validateAuthoringAdmissionByIdentity(value: unknown): RoutedAuthoringAdmission['value'] {
  const found = identity(value, 'autonomous authoring admission');
  if (
    found.schemaVersion === 'autonomous-authoring-admission-v1'
    && found.contractId === PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID
    && found.contractVersion === PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION
  ) return validateAutonomousAuthoringAdmission(value);
  if (
    found.schemaVersion === 'autonomous-authoring-admission-v2'
    && found.contractId === BOUNDED_FORMAL_EVENT_CONTRACT_ID
    && found.contractVersion === BOUNDED_FORMAL_EVENT_CONTRACT_VERSION
  ) return validateBoundedFormalEventAdmissionV2(value);
  throw new Error(`unknown autonomous authoring admission contract route: ${found.contractId}@${String(found.contractVersion)}`);
}
