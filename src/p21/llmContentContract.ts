import type { EventDefinition } from '../types/eventTypes';
import type { LlmContentContractConfig, WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';

export interface LlmContentDraftInput {
  contentRole: string;
  targetRouteOrStage: string;
  toneMarkers: string[];
  duplicateRiskClass: string;
  referenceEventId?: string;
}

export interface LlmContentDraftOutput {
  event?: Partial<EventDefinition>;
  echoHookId?: string;
  summaryTemplateId?: string;
}

export function getLlmContentContract(profile: WorldProfile = getWorldProfile()): LlmContentContractConfig {
  return profile.llmContentContract ?? {
    id: 'missing',
    label: 'Missing contract',
    allowedContentRoles: [],
    requiredInputs: [],
    allowedOutputs: [],
    requiredOutputFields: [],
    validationSteps: [],
    disallowedOutputs: [],
  };
}

export function validateLlmContentInputs(
  input: LlmContentDraftInput,
  profile: WorldProfile = getWorldProfile(),
): { valid: boolean; missing: string[] } {
  const contract = getLlmContentContract(profile);
  const provided: Record<string, unknown> = {
    contentRole: input.contentRole,
    targetRouteOrStage: input.targetRouteOrStage,
    toneMarkers: input.toneMarkers,
    duplicateRiskClass: input.duplicateRiskClass,
    referenceEventId: input.referenceEventId,
  };
  const missing = contract.requiredInputs.filter(key => {
    const value = provided[key];
    return value === undefined || (Array.isArray(value) && value.length === 0) || value === '';
  });
  if (!contract.allowedContentRoles.includes(input.contentRole)) {
    missing.push(`contentRole not in ${contract.allowedContentRoles.join(', ')}`);
  }
  return { valid: missing.length === 0, missing };
}

export function validateLlmContentOutputShape(
  event: Partial<EventDefinition>,
  profile: WorldProfile = getWorldProfile(),
): { valid: boolean; missingFields: string[] } {
  const contract = getLlmContentContract(profile);
  const missingFields: string[] = [];
  for (const field of contract.requiredOutputFields) {
    if (field === 'id' && !event.id) missingFields.push('id');
    if (field === 'content.text' && !event.content?.text) missingFields.push('content.text');
    if (field === 'ageRange' && !event.ageRange) missingFields.push('ageRange');
    if (field === 'metadata.authoringSemantics' && !event.metadata?.authoringSemantics) {
      missingFields.push('metadata.authoringSemantics');
    }
  }
  return { valid: missingFields.length === 0, missingFields };
}
