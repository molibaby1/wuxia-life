import {
  getActionById,
  activeActionCatalog,
} from '../../../src/data/activeActionCatalog';
import { childhoodActionCatalog } from '../../../src/data/childhoodActionCatalog';
import type { ActiveActionDefinition } from '../../../src/types/activeActionTypes';
import type { HeadlessApiPlayerSurfaceStep } from '../../../src/headless/playability/playerSurfaceCapture';

function formalActiveActions(): readonly ActiveActionDefinition[] {
  return [...activeActionCatalog, ...childhoodActionCatalog];
}

/**
 * Resolve formal action identity from a player-surface active_action_result step.
 * Prefer sealed/captured actionId; otherwise fail-closed unique name join against formal catalogs.
 * Does not dump catalog contents into diagnostic evidence.
 */
export function resolveActiveActionIdFromSurfaceStep(
  step: HeadlessApiPlayerSurfaceStep,
): string {
  if (step.kind !== 'active_action_result') {
    throw new Error(`expected active_action_result step, got ${step.kind}`);
  }

  if (typeof step.actionId === 'string' && step.actionId.length > 0) {
    const byId = getActionById(step.actionId);
    if (!byId) {
      throw new Error(`unknown active action id on surface step: ${step.actionId}`);
    }
    return byId.id;
  }

  const title = step.presentationCards?.[0]?.title;
  if (typeof title !== 'string' || title.length === 0) {
    throw new Error(
      'active_action_result step missing actionId and presentation title; cannot resolve formal action identity',
    );
  }

  const matches = formalActiveActions().filter(action => action.name === title);
  if (matches.length === 0) {
    throw new Error(
      `cannot resolve active action identity: no formal action named ${JSON.stringify(title)}`,
    );
  }
  if (matches.length > 1) {
    throw new Error(
      `cannot resolve active action identity: ambiguous formal action name ${JSON.stringify(title)}`,
    );
  }
  return matches[0]!.id;
}
