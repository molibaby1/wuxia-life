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
  WUXIA_INHERITANCE_CHANNEL_PATTERNS,
  WUXIA_LEGACY_OUTCOME_PATTERNS,
  WUXIA_SUCCESSOR_CULTIVATION_COST_PATTERNS,
  WUXIA_SUCCESSOR_ROLE_CONFIGS,
} from './profile/wuxiaLegacySurfaces';
import {
  WUXIA_ENDGAME_CATEGORY_CONFIGS,
  WUXIA_HISTORICAL_MEMORY_PATTERNS,
  WUXIA_PRE_ENDGAME_RECOVERY_PATTERNS,
} from './profile/wuxiaEndgameSurfaces';
import {
  WUXIA_ARCHETYPE_FAMILY_CONFIGS,
  WUXIA_ARCHETYPE_PACING_PROFILES,
  WUXIA_REPETITION_PRESSURE_CONFIGS,
  WUXIA_REPLAY_SLICE_CONFIGS,
} from './profile/wuxiaReplayabilitySurfaces';
import {
  WUXIA_CONTENT_DUPLICATE_CONSTRAINTS,
  WUXIA_CONTENT_STYLE_CONSTRAINTS,
  WUXIA_LLM_CONTENT_CONTRACT,
  WUXIA_LLM_TUNING_CONTRACT,
  WUXIA_TUNING_SAMPLE_CONFIGS,
} from './profile/wuxiaContentProductionSurfaces';
import {
  WUXIA_BASELINE_POOL_CONFIGS,
  WUXIA_LIBRARY_COVERAGE_EXPECTATIONS,
  WUXIA_LIVE_OPS_TUNING_SAMPLE_CONFIGS,
  WUXIA_LIVE_OPS_WAVE_CONFIGS,
} from './profile/wuxiaContentLibrarySurfaces';
import {
  WUXIA_EXPERIENCE_ACCEPTANCE_BASELINE_CONFIGS,
  WUXIA_EXPERIENCE_COMPARISON_SAMPLE_CONFIGS,
  WUXIA_EXPERIENCE_DIMENSION_CONFIGS,
  WUXIA_LIVE_BALANCE_WAVE_SAMPLE_CONFIGS,
  WUXIA_LONG_TERM_BALANCE_INDICATOR_CONFIGS,
} from './profile/wuxiaExperienceAcceptanceSurfaces';
import {
  WUXIA_ALIGNMENT_COMPARISON_CONFIGS,
  WUXIA_ALIGNMENT_INDICATOR_CONFIGS,
  WUXIA_PLAYTEST_CALIBRATION_BASELINE_CONFIGS,
  WUXIA_PLAYTEST_COMPARISON_SAMPLE_CONFIGS,
  WUXIA_PLAYTEST_DIMENSION_CONFIGS,
  WUXIA_PLAYTEST_FEEDBACK_SCHEMA,
  WUXIA_RC_COMPARISON_SAMPLE_CONFIGS,
  WUXIA_RC_EVALUATION_SCHEMA,
} from './profile/wuxiaPlaytestCalibrationSurfaces';
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
  successorRoleConfigs: WUXIA_SUCCESSOR_ROLE_CONFIGS,
  inheritanceChannelPatterns: WUXIA_INHERITANCE_CHANNEL_PATTERNS,
  successorCultivationCostPatterns: WUXIA_SUCCESSOR_CULTIVATION_COST_PATTERNS,
  legacyOutcomePatterns: WUXIA_LEGACY_OUTCOME_PATTERNS,
  endgameCategoryConfigs: WUXIA_ENDGAME_CATEGORY_CONFIGS,
  preEndgameRecoveryPatterns: WUXIA_PRE_ENDGAME_RECOVERY_PATTERNS,
  historicalMemoryPatterns: WUXIA_HISTORICAL_MEMORY_PATTERNS,
  archetypeFamilyConfigs: WUXIA_ARCHETYPE_FAMILY_CONFIGS,
  repetitionPressureConfigs: WUXIA_REPETITION_PRESSURE_CONFIGS,
  archetypePacingProfiles: WUXIA_ARCHETYPE_PACING_PROFILES,
  replaySliceConfigs: WUXIA_REPLAY_SLICE_CONFIGS,
  contentStyleConstraints: WUXIA_CONTENT_STYLE_CONSTRAINTS,
  contentDuplicateConstraints: WUXIA_CONTENT_DUPLICATE_CONSTRAINTS,
  llmContentContract: WUXIA_LLM_CONTENT_CONTRACT,
  llmTuningContract: WUXIA_LLM_TUNING_CONTRACT,
  tuningSampleConfigs: WUXIA_TUNING_SAMPLE_CONFIGS,
  baselinePoolConfigs: WUXIA_BASELINE_POOL_CONFIGS,
  libraryCoverageExpectations: WUXIA_LIBRARY_COVERAGE_EXPECTATIONS,
  liveOpsWaveConfigs: WUXIA_LIVE_OPS_WAVE_CONFIGS,
  liveOpsTuningSampleConfigs: WUXIA_LIVE_OPS_TUNING_SAMPLE_CONFIGS,
  experienceDimensionConfigs: WUXIA_EXPERIENCE_DIMENSION_CONFIGS,
  experienceAcceptanceBaselineConfigs: WUXIA_EXPERIENCE_ACCEPTANCE_BASELINE_CONFIGS,
  experienceComparisonSampleConfigs: WUXIA_EXPERIENCE_COMPARISON_SAMPLE_CONFIGS,
  longTermBalanceIndicatorConfigs: WUXIA_LONG_TERM_BALANCE_INDICATOR_CONFIGS,
  liveBalanceWaveSampleConfigs: WUXIA_LIVE_BALANCE_WAVE_SAMPLE_CONFIGS,
  playtestDimensionConfigs: WUXIA_PLAYTEST_DIMENSION_CONFIGS,
  playtestFeedbackSchema: WUXIA_PLAYTEST_FEEDBACK_SCHEMA,
  rcEvaluationSchema: WUXIA_RC_EVALUATION_SCHEMA,
  alignmentComparisonConfigs: WUXIA_ALIGNMENT_COMPARISON_CONFIGS,
  playtestCalibrationBaselineConfigs: WUXIA_PLAYTEST_CALIBRATION_BASELINE_CONFIGS,
  playtestComparisonSampleConfigs: WUXIA_PLAYTEST_COMPARISON_SAMPLE_CONFIGS,
  alignmentIndicatorConfigs: WUXIA_ALIGNMENT_INDICATOR_CONFIGS,
  rcComparisonSampleConfigs: WUXIA_RC_COMPARISON_SAMPLE_CONFIGS,
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
