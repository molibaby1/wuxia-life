/**
 * P9 narrative config loader — unified read access for stage, route, echo, summary config.
 */

export { getStageForAge, getAllStageConfigs, WUXIA_STAGE_CONFIG } from './config/stageConfig';
export type { LifeStageConfig, StageFeedbackExpectation } from './config/stageConfig';

export {
  getRouteDefinition,
  getRouteIdentityFromFlags,
  WUXIA_ROUTE_DEFINITIONS,
} from './config/routeDefinitions';
export type {
  RouteDefinition,
  RouteIdentityCandidate,
  RouteIdentityResolution,
  RouteSignalPoint,
  RouteSignalKind,
} from './config/routeDefinitions';

export {
  getEchoHookByActionId,
  getEchoHookByFlag,
  getAllEchoHooks,
  WUXIA_ECHO_HOOKS,
} from './config/echoHooks';
export type {
  EchoHook,
  EchoCallbackTarget,
  EchoSummaryContribution,
  EchoSummarySlot,
  EchoSummaryTextSource,
  EchoSummaryTextSourceKind,
} from './config/echoHooks';

export {
  getSummaryTemplateForIdentity,
  applySummaryTemplate,
  getAllSummaryTemplates,
  WUXIA_SUMMARY_TEMPLATES,
} from './config/summaryTemplates';
export type { SummaryTemplateMatch, SummaryTemplatePart } from './config/summaryTemplates';

import { getStageForAge } from './config/stageConfig';
import { getRouteIdentityFromFlags } from './config/routeDefinitions';
import { getAllEchoHooks, getEchoHookByFlag } from './config/echoHooks';
import { getSummaryTemplateForIdentity, applySummaryTemplate } from './config/summaryTemplates';

export function resolveConfiguredEchoSummaryVars(
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): Record<string, string> {
  const grouped = new Map<string, Array<{ order: number; text: string }>>();

  for (const hook of getAllEchoHooks()) {
    const contribution = hook.summaryContribution;
    if (!contribution?.enabled) {
      continue;
    }
    const hasHook = flags[hook.hookFlag] !== undefined && flags[hook.hookFlag] !== false;
    if (!hasHook) {
      continue;
    }

    const text = contribution.textSources
      .map(source => {
        if (source.kind === 'flag_value' && source.flagKey) {
          const value = flags[source.flagKey];
          if (value !== undefined && value !== false && value !== null && value !== '') {
            return String(value);
          }
        }
        if (source.kind === 'description') {
          return hook.description;
        }
        return '';
      })
      .find(Boolean);

    if (!text) {
      continue;
    }

    const current = grouped.get(contribution.variableName) ?? [];
    current.push({ order: contribution.order, text });
    grouped.set(contribution.variableName, current);
  }

  const vars: Record<string, string> = {};
  for (const [variableName, parts] of grouped.entries()) {
    const ordered = parts
      .sort((a, b) => a.order - b.order)
      .map(part => part.text);
    vars[variableName] = variableName.endsWith('_suffix')
      ? `，${ordered.join('，')}`
      : ordered.join('，');
  }

  return vars;
}

export function resolveConfiguredAge40Identity(
  flags: Record<string, unknown>,
  routePreference: string,
  origin: string | null,
): string {
  const routeIdentity = getRouteIdentityFromFlags(flags, routePreference);
  const template = getSummaryTemplateForIdentity(routeIdentity, routePreference, 'wuxia');
  const echoVars = resolveConfiguredEchoSummaryVars(flags, 'wuxia');
  return applySummaryTemplate(template, {
    origin: origin ?? '未知',
    route_identity: routeIdentity ?? routePreference,
    route_preference: routePreference,
    ...echoVars,
  });
}

export function getStagePurposeForAge(age: number): string | null {
  return getStageForAge(age)?.purpose ?? null;
}

export function getStageFeedbackExpectationForAge(age: number) {
  return getStageForAge(age)?.feedbackExpectation ?? null;
}

export function resolveEchoHookForFlags(flags: Record<string, unknown>) {
  for (const key of Object.keys(flags)) {
    const hook = getEchoHookByFlag(key);
    if (hook) return hook;
  }
  return undefined;
}

export function resolveEchoHooksForFlags(flags: Record<string, unknown>) {
  return Object.keys(flags)
    .map(key => getEchoHookByFlag(key))
    .filter((hook): hook is NonNullable<typeof hook> => hook !== undefined);
}
