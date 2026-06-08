import type { EchoHook } from './config/echoHooks';
import { WUXIA_ECHO_HOOKS } from './config/echoHooks';
import type { RouteDefinition } from './config/routeDefinitions';
import { WUXIA_ROUTE_DEFINITIONS } from './config/routeDefinitions';
import type { LifeStageConfig } from './config/stageConfig';
import { WUXIA_STAGE_CONFIG } from './config/stageConfig';
import { WUXIA_SUMMARY_TEMPLATES } from './config/summaryTemplates';
import { WUXIA_PROFILE_ACTION_FAMILIES } from './profile/wuxiaActionFamilies';
import { WUXIA_PROFILE_IDENTITY_TRACKS } from './profile/wuxiaIdentityTracks';
import { WUXIA_PROFILE_RESOURCES } from './profile/wuxiaResources';
import { WUXIA_PROFILE_STATS } from './profile/wuxiaStats';
import { WUXIA_PROFILE_SUMMARY_SIGNALS } from './profile/wuxiaSummarySignals';
import {
  WUXIA_ACHIEVEMENT_MAINTENANCE_PATTERNS,
  WUXIA_FACTION_IDENTITY_CONSEQUENCE_PATTERNS,
  WUXIA_RELATIONSHIP_CONSEQUENCE_PATTERNS,
} from './profile/wuxiaConsequenceSurfaces';
import {
  WUXIA_CHILDHOOD_SHAPING_RULES,
  WUXIA_COMPOSITE_DESTINY_OUTCOMES,
  WUXIA_ORIGIN_SURFACES,
  WUXIA_RARE_EVENT_LINES,
} from './profile/wuxiaOriginSurfaces';
import type { WorldProfile } from './profile/types';

export type {
  WorldProfile,
  WorldProfileStatEntry,
  WorldProfileResourceEntry,
  WorldProfileIdentityTrack,
  WorldProfileActionFamily,
  WorldProfileSummarySignal,
  PlayableProfileSectionKey,
  ProfileValidationResult,
} from './profile/types';

export {
  PLAYABLE_PROFILE_SECTION_KEYS,
} from './profile/types';

export const WUXIA_WORLD_PROFILE: WorldProfile = {
  id: 'wuxia',
  label: '武侠人生',
  stats: WUXIA_PROFILE_STATS,
  resources: WUXIA_PROFILE_RESOURCES,
  identityTracks: WUXIA_PROFILE_IDENTITY_TRACKS,
  actionFamilies: WUXIA_PROFILE_ACTION_FAMILIES,
  summarySignals: WUXIA_PROFILE_SUMMARY_SIGNALS,
  stageConfig: WUXIA_STAGE_CONFIG,
  routeDefinitions: WUXIA_ROUTE_DEFINITIONS,
  echoHooks: WUXIA_ECHO_HOOKS,
  summaryTemplates: WUXIA_SUMMARY_TEMPLATES,
  originSurfaces: WUXIA_ORIGIN_SURFACES,
  compositeDestinyOutcomes: WUXIA_COMPOSITE_DESTINY_OUTCOMES,
  childhoodShapingRules: WUXIA_CHILDHOOD_SHAPING_RULES,
  rareEventLines: WUXIA_RARE_EVENT_LINES,
  relationshipConsequencePatterns: WUXIA_RELATIONSHIP_CONSEQUENCE_PATTERNS,
  factionIdentityConsequencePatterns: WUXIA_FACTION_IDENTITY_CONSEQUENCE_PATTERNS,
  achievementMaintenancePatterns: WUXIA_ACHIEVEMENT_MAINTENANCE_PATTERNS,
};

export function getWorldProfile(worldId = 'wuxia'): WorldProfile {
  if (worldId !== 'wuxia') {
    throw new Error(`Unsupported world profile: ${worldId}`);
  }
  return WUXIA_WORLD_PROFILE;
}

export function getProfileMinimumActionIds(): string[] {
  return WUXIA_WORLD_PROFILE.actionFamilies.flatMap(family => family.actionIds);
}

export function getProfileStageConfigs(): LifeStageConfig[] {
  return WUXIA_WORLD_PROFILE.stageConfig;
}

export function getProfileStageForAge(age: number): LifeStageConfig | undefined {
  return WUXIA_WORLD_PROFILE.stageConfig.find(stage => age >= stage.ageMin && age < stage.ageMax);
}

export function getProfileRouteDefinition(routeId: string): RouteDefinition | undefined {
  return WUXIA_WORLD_PROFILE.routeDefinitions.find(route => route.id === routeId);
}

export function getProfileEchoHookByFlag(flag: string): EchoHook | undefined {
  return WUXIA_WORLD_PROFILE.echoHooks.find(hook => hook.hookFlag === flag);
}

export function getProfileEchoHookByActionId(actionId: string): EchoHook | undefined {
  return WUXIA_WORLD_PROFILE.echoHooks.find(hook => hook.sourceActionId === actionId);
}

export function getProfileStatEntry(statId: string) {
  return WUXIA_WORLD_PROFILE.stats.find(entry => entry.id === statId);
}

export function getProfileResourceEntry(resourceId: string) {
  return WUXIA_WORLD_PROFILE.resources.find(entry => entry.id === resourceId);
}

export function getProfileIdentityTrack(trackId: string) {
  return WUXIA_WORLD_PROFILE.identityTracks.find(entry => entry.id === trackId);
}
