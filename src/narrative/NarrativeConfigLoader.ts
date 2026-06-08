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

export {
  getWorldProfile,
  WUXIA_WORLD_PROFILE,
  getProfileMinimumActionIds,
  PLAYABLE_PROFILE_SECTION_KEYS,
} from './worldProfile';
export type {
  WorldProfile,
  WorldProfileIdentityTrack,
  WorldProfileSummarySignal,
  WorldProfileStatEntry,
  WorldProfileResourceEntry,
  WorldProfileActionFamily,
  PlayableProfileSectionKey,
  ProfileValidationResult,
} from './worldProfile';

import { getRouteIdentityFromFlags } from './config/routeDefinitions';
import { getSummaryTemplateForIdentity, applySummaryTemplate } from './config/summaryTemplates';
import { getWorldProfile } from './worldProfile';
import { buildTendencySurfaceSummary } from '../p16/tendencyShaping';
import type { OriginWorldviewShaping } from './profile/types';

export function resolveConfiguredEchoSummaryVars(
  flags: Record<string, unknown>,
  worldId = 'wuxia',
): Record<string, string> {
  const profile = getWorldProfile(worldId);
  const grouped = new Map<string, Array<{ order: number; text: string }>>();

  for (const hook of profile.echoHooks) {
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

export function resolveTendencySummaryFromShaping(
  shaping: OriginWorldviewShaping | undefined,
  worldId = 'wuxia',
): string {
  if (!shaping) return '';
  const parts = buildTendencySurfaceSummary(shaping, worldId);
  if (parts.length === 0) return '';
  return `幼年塑形：${parts.join('、')}`;
}

export function resolveConfiguredAge40Identity(
  flags: Record<string, unknown>,
  routePreference: string,
  origin: string | null,
  tendencyShaping?: OriginWorldviewShaping,
): string {
  const profile = getWorldProfile('wuxia');
  const routeIdentity = profile.routeDefinitions.length > 0
    ? getRouteIdentityFromFlags(flags, routePreference, profile.routeDefinitions)
    : null;
  const template = getSummaryTemplateForIdentity(routeIdentity, routePreference, profile.id);
  const echoVars = resolveConfiguredEchoSummaryVars(flags, profile.id);
  const tendencySuffix = resolveTendencySummaryFromShaping(tendencyShaping, profile.id);
  const base = applySummaryTemplate(template, {
    origin: origin ?? '未知',
    route_identity: routeIdentity ?? routePreference,
    route_preference: routePreference,
    ...echoVars,
  });
  return tendencySuffix ? `${base}，${tendencySuffix}` : base;
}

export function getStagePurposeForAge(age: number): string | null {
  return getWorldProfile('wuxia').stageConfig.find(stage => age >= stage.ageMin && age < stage.ageMax)?.purpose ?? null;
}

export function getStageFeedbackExpectationForAge(age: number) {
  return getWorldProfile('wuxia').stageConfig.find(stage => age >= stage.ageMin && age < stage.ageMax)?.feedbackExpectation ?? null;
}

export function resolveEchoHookForFlags(
  flags: Record<string, unknown>,
  worldId = 'wuxia',
) {
  const profile = getWorldProfile(worldId);
  for (const key of Object.keys(flags)) {
    const hook = profile.echoHooks.find(entry => entry.hookFlag === key);
    if (hook) return hook;
  }
  return undefined;
}

export function resolveEchoHooksForFlags(
  flags: Record<string, unknown>,
  worldId = 'wuxia',
) {
  const profile = getWorldProfile(worldId);
  return Object.keys(flags)
    .map(key => profile.echoHooks.find(entry => entry.hookFlag === key))
    .filter((hook): hook is NonNullable<typeof hook> => hook !== undefined);
}
