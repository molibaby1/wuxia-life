import { activeActionCatalog } from '../data/activeActionCatalog';
import type { WorldProfile } from '../narrative/profile/types';
import {
  PLAYABLE_PROFILE_SECTION_KEYS,
  type PlayableProfileSectionKey,
  type ProfileSectionValidation,
  type ProfileValidationResult,
} from '../narrative/profile/types';
import {
  getProfileIdentityTrack,
  getProfileResourceEntry,
  getProfileRouteDefinition,
  getProfileStatEntry,
} from '../narrative/worldProfile';

function sectionCount(profile: WorldProfile, key: PlayableProfileSectionKey): number {
  const value = profile[key];
  return Array.isArray(value) ? value.length : 0;
}

export function validateWorldProfileCrossReferences(profile: WorldProfile): string[] {
  const issues: string[] = [];
  const catalogActionIds = new Set(activeActionCatalog.map(action => action.id));

  for (const family of profile.actionFamilies) {
    for (const actionId of family.actionIds) {
      if (!catalogActionIds.has(actionId)) {
        issues.push(
          `Missing required cross-reference: actionFamilies -> activeActionCatalog (${family.id} -> ${actionId})`,
        );
      }
    }
  }

  for (const track of profile.identityTracks) {
    if (!getProfileIdentityTrack(track.id)) {
      issues.push(`Missing identity track metadata entry: ${track.id}`);
    }
    for (const routeId of track.routeIds) {
      if (!getProfileRouteDefinition(routeId)) {
        issues.push(
          `Missing required cross-reference: identityTracks -> routeDefinitions (${track.id} -> ${routeId})`,
        );
      }
    }
  }

  for (const stat of profile.stats) {
    if (!getProfileStatEntry(stat.id)) {
      issues.push(`Missing stat metadata entry: ${stat.id}`);
    }
  }

  for (const resource of profile.resources) {
    if (!getProfileResourceEntry(resource.id)) {
      issues.push(`Missing resource metadata entry: ${resource.id}`);
    }
  }

  return issues;
}

export function validateWorldProfileSections(profile: WorldProfile): ProfileValidationResult {
  const sections: ProfileSectionValidation[] = PLAYABLE_PROFILE_SECTION_KEYS.map(key => ({
    key,
    present: sectionCount(profile, key) > 0,
    count: sectionCount(profile, key),
    required: true,
  }));

  const missingRequired = sections
    .filter(section => section.required && !section.present)
    .map(section => section.key);

  const messages: string[] = [];
  for (const section of sections) {
    if (!section.present) {
      messages.push(`Missing required section: ${section.key}`);
    }
  }

  let decision: ProfileValidationResult['decision'] = 'pass';
  if (missingRequired.length > 0) {
    decision = 'fail';
  }

  return {
    worldId: profile.id,
    sections,
    missingRequired,
    decision,
    messages,
    warnings: [],
  };
}

export function validateWorldProfileForGate(profile: WorldProfile): ProfileValidationResult {
  const base = validateWorldProfileSections(profile);
  const failures = [...base.messages, ...validateWorldProfileCrossReferences(profile)];
  const warnings: string[] = [];

  if (profile.stats.filter(stat => stat.role === 'scheduling_relevant').length < 2) {
    warnings.push('Fewer than 2 scheduling-relevant stats declared');
  }
  if (profile.actionFamilies.some(family => family.actionIds.length === 0)) {
    warnings.push('Action family with empty actionIds');
  }

  let decision = base.decision;
  if (failures.length > 0) {
    decision = 'fail';
  } else if (warnings.length > 0) {
    decision = 'warning';
  }

  return {
    ...base,
    decision,
    messages: [...failures, ...warnings.map(warning => `Warning: ${warning}`)],
    warnings,
  };
}

/** Probe helper for negative tests — omit one section from a copy. */
export function omitProfileSection(
  profile: WorldProfile,
  key: PlayableProfileSectionKey,
): WorldProfile {
  return { ...profile, [key]: [] };
}
