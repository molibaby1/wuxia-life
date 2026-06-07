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
export type { RouteDefinition, RouteSignalPoint, RouteSignalKind } from './config/routeDefinitions';

export {
  getEchoHookByActionId,
  getEchoHookByFlag,
  getAllEchoHooks,
  WUXIA_ECHO_HOOKS,
} from './config/echoHooks';
export type { EchoHook, EchoCallbackTarget } from './config/echoHooks';

export {
  getSummaryTemplateForIdentity,
  applySummaryTemplate,
  getAllSummaryTemplates,
  WUXIA_SUMMARY_TEMPLATES,
} from './config/summaryTemplates';
export type { SummaryTemplatePart } from './config/summaryTemplates';

import { getStageForAge } from './config/stageConfig';
import { getRouteIdentityFromFlags } from './config/routeDefinitions';
import { getEchoHookByFlag } from './config/echoHooks';
import { getSummaryTemplateForIdentity, applySummaryTemplate } from './config/summaryTemplates';

export function resolveConfiguredAge40Identity(
  flags: Record<string, unknown>,
  routePreference: string,
  origin: string | null,
): string {
  const routeIdentity = getRouteIdentityFromFlags(flags);
  const template = getSummaryTemplateForIdentity(routeIdentity, routePreference);
  const echoParts = [
    flags.p9_summary_echo_training,
    flags.p9_summary_echo_study,
    flags.p9_summary_echo_social,
    flags.p9_summary_echo_deviant,
  ]
    .filter(Boolean)
    .map(String);
  const echoSuffix = echoParts.length > 0 ? `，${echoParts.join('，')}` : '';
  return applySummaryTemplate(template, {
    origin: origin ?? '未知',
    route_identity: routeIdentity ?? routePreference,
    route_preference: routePreference,
    echo_suffix: echoSuffix,
  });
}

export function getStagePurposeForAge(age: number): string | null {
  return getStageForAge(age)?.purpose ?? null;
}

export function resolveEchoHookForFlags(flags: Record<string, unknown>) {
  for (const key of Object.keys(flags)) {
    const hook = getEchoHookByFlag(key);
    if (hook) return hook;
  }
  return undefined;
}
