import type { EventDefinition } from '../types/eventTypes';
import type { LlmContentValidationResult } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import { evaluateContentConstraints, evaluateEventContentConstraints } from './constraintEvaluation';
import {
  getLlmContentContract,
  validateLlmContentInputs,
  validateLlmContentOutputShape,
  type LlmContentDraftInput,
} from './llmContentContract';

export function evaluateLlmContentDraft(
  input: LlmContentDraftInput,
  event: Partial<EventDefinition>,
): LlmContentValidationResult {
  const profile = getWorldProfile();
  const contract = getLlmContentContract(profile);
  const inputCheck = validateLlmContentInputs(input, profile);
  const outputCheck = validateLlmContentOutputShape(event, profile);
  const blockedOutputs: string[] = [];
  if (event.metadata?.authoringSemantics?.contentRole === 'endgame_sensitive' &&
    !contract.allowedContentRoles.includes('endgame_sensitive')) {
    blockedOutputs.push('endgame_sensitive without contract allowance');
  }

  const missingFields = [...inputCheck.missing, ...outputCheck.missingFields];
  const constraintFindings = event.id && event.content?.text
    ? evaluateEventContentConstraints(event as EventDefinition, profile)
    : [];

  const constraintFailures = constraintFindings.filter(finding => !finding.passed);
  const constraintDecision: LlmContentValidationResult['decision'] =
    constraintFailures.length === 0 ? 'pass' : 'fail';

  const valid = inputCheck.valid && outputCheck.valid && blockedOutputs.length === 0
    && constraintDecision !== 'fail';

  const decision: LlmContentValidationResult['decision'] = valid ? 'pass' : 'fail';

  return {
    valid,
    missingFields,
    blockedOutputs,
    constraintFindings,
    decision,
  };
}

/** Detect low-quality LLM event draft (missing semantics or tone failure). */
export function detectLowQualityContent(event: Partial<EventDefinition>): boolean {
  if (!event.content?.text || event.content.text.length < 20) return true;
  if (!event.metadata?.authoringSemantics) return true;
  const toneMarkers = event.metadata.authoringSemantics.toneMarkers ?? [];
  if (toneMarkers.length > 0) {
    const text = `${event.content.title ?? ''}${event.content.text}`;
    if (!toneMarkers.some(m => text.includes(m))) return true;
  }
  return false;
}
