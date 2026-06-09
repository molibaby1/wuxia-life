import type { LlmTuningContractConfig, TuningSampleConfig, WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';

export interface LlmTuningDraftInput {
  tuningClass: string;
  targetFieldPath: string;
  baselineReportId: string;
  desiredMetricDelta: string;
  proposedValue?: number;
}

export function getLlmTuningContract(profile: WorldProfile = getWorldProfile()): LlmTuningContractConfig {
  return profile.llmTuningContract ?? {
    id: 'missing',
    label: 'Missing contract',
    allowedTuningClasses: [],
    requiredInputs: [],
    allowedOutputFields: [],
    validationSteps: [],
    disallowedOutputs: [],
  };
}

export function validateLlmTuningInputs(
  input: LlmTuningDraftInput,
  profile: WorldProfile = getWorldProfile(),
): { valid: boolean; missing: string[] } {
  const contract = getLlmTuningContract(profile);
  const provided: Record<string, unknown> = {
    tuningClass: input.tuningClass,
    targetFieldPath: input.targetFieldPath,
    baselineReportId: input.baselineReportId,
    desiredMetricDelta: input.desiredMetricDelta,
  };
  const missing = contract.requiredInputs.filter(key => !provided[key]);
  if (!contract.allowedTuningClasses.includes(input.tuningClass)) {
    missing.push(`tuningClass not in ${contract.allowedTuningClasses.join(', ')}`);
  }
  return { valid: missing.length === 0, missing };
}

export function fieldPathAllowed(fieldPath: string, profile: WorldProfile = getWorldProfile()): boolean {
  const contract = getLlmTuningContract(profile);
  const leaf = fieldPath.split('.').pop() ?? fieldPath;
  return contract.allowedOutputFields.some(allowed => fieldPath.includes(allowed) || leaf === allowed);
}

export function getTuningSamples(profile: WorldProfile = getWorldProfile()): TuningSampleConfig[] {
  return profile.tuningSampleConfigs ?? [];
}
