import * as fs from 'fs';
import * as path from 'path';
import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  V10_ALL_LAUNCH_DOC_PATHS,
  V10_LAUNCH_DOC_RULES,
  V10_LAUNCH_READINESS_CONTRACT_VERSION,
  V10_REQUIRED_LAUNCH_DIMENSION_IDS,
} from './launchReadinessContract';

export interface LaunchRuleViolation {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LaunchRulesValidationResult {
  contractVersion: string;
  ok: boolean;
  decision: 'pass' | 'warning' | 'fail';
  missing: string[];
  violations: LaunchRuleViolation[];
  checks: {
    docsPresent: boolean;
    launchDimensions: boolean;
    blockerDeferral: boolean;
    freezeBoundary: boolean;
    postLaunchCadence: boolean;
    surfacesAudit: boolean;
    alignmentIndicators: boolean;
    profileDimensionAlignment: boolean;
  };
}

export interface ValidateLaunchReadinessOptions {
  rootDir?: string;
  profile?: WorldProfile;
  /** When set, skips disk reads and uses injected doc bodies (for tests). */
  docContents?: Record<string, string>;
}

function readDocContent(
  relPath: string,
  rootDir: string,
  docContents?: Record<string, string>,
): string | null {
  if (docContents !== undefined) {
    return docContents[relPath] ?? null;
  }
  const abs = path.join(rootDir, relPath);
  if (!fs.existsSync(abs)) return null;
  return fs.readFileSync(abs, 'utf8');
}

function validateDocRule(
  content: string | null,
  rule: (typeof V10_LAUNCH_DOC_RULES)[number],
): { passed: boolean; violations: LaunchRuleViolation[] } {
  const violations: LaunchRuleViolation[] = [];
  if (content === null) {
    violations.push({
      ruleId: `${rule.docId}:missing`,
      message: `Missing launch doc: ${rule.path}`,
      severity: 'error',
    });
    return { passed: false, violations };
  }

  for (const section of rule.requiredSections) {
    if (!content.includes(section)) {
      violations.push({
        ruleId: `${rule.docId}:section`,
        message: `${rule.path} missing section "${section}"`,
        severity: 'error',
      });
    }
  }

  for (const token of rule.requiredTokens) {
    if (!content.includes(token)) {
      violations.push({
        ruleId: `${rule.docId}:token`,
        message: `${rule.path} missing required token "${token}"`,
        severity: 'error',
      });
    }
  }

  return { passed: violations.length === 0, violations };
}

function validateProfileDimensionAlignment(profile: WorldProfile): LaunchRuleViolation[] {
  const profileIds = (profile.playtestDimensionConfigs ?? []).map(d => d.id).sort();
  const required = [...V10_REQUIRED_LAUNCH_DIMENSION_IDS].sort();
  const violations: LaunchRuleViolation[] = [];

  if (profileIds.length !== required.length) {
    violations.push({
      ruleId: 'profile-dimensions:count',
      message: `Profile has ${profileIds.length} playtest dimensions, contract requires ${required.length}`,
      severity: 'error',
    });
  }

  for (const id of required) {
    if (!profileIds.includes(id)) {
      violations.push({
        ruleId: 'profile-dimensions:missing',
        message: `Profile missing launch dimension "${id}"`,
        severity: 'error',
      });
    }
  }

  return violations;
}

function validateAlignmentIndicatorDoc(
  content: string | null,
  profile: WorldProfile,
): LaunchRuleViolation[] {
  const violations: LaunchRuleViolation[] = [];
  if (content === null) return violations;

  for (const indicator of profile.alignmentIndicatorConfigs ?? []) {
    if (!content.includes(indicator.id)) {
      violations.push({
        ruleId: 'alignment-indicators:profile-id',
        message: `Alignment indicators doc missing profile indicator id "${indicator.id}"`,
        severity: 'error',
      });
    }
  }

  return violations;
}

export function validateLaunchReadinessSemantics(
  options: ValidateLaunchReadinessOptions = {},
): LaunchRulesValidationResult {
  const rootDir = options.rootDir ?? process.cwd();
  const profile = options.profile ?? getWorldProfile();
  const docContents = options.docContents;

  const missing: string[] = [];
  const violations: LaunchRuleViolation[] = [];

  for (const rel of V10_ALL_LAUNCH_DOC_PATHS) {
    const content = readDocContent(rel, rootDir, docContents);
    if (content === null) {
      missing.push(rel);
    }
  }

  const ruleResults = V10_LAUNCH_DOC_RULES.map(rule => {
    const content = readDocContent(rule.path, rootDir, docContents);
    const result = validateDocRule(content, rule);
    violations.push(...result.violations);
    return { docId: rule.docId, passed: result.passed };
  });

  violations.push(...validateProfileDimensionAlignment(profile));
  violations.push(
    ...validateAlignmentIndicatorDoc(
      readDocContent('docs/designs/v1-0-alignment-indicators.md', rootDir, docContents),
      profile,
    ),
  );

  const alignmentDocPassed =
    ruleResults.find(r => r.docId === 'alignment-indicators')?.passed ?? false;
  const alignmentProfileIdsPass =
    violations.filter(v => v.ruleId.startsWith('alignment-indicators:profile-id')).length === 0;

  const checks = {
    docsPresent: missing.length === 0,
    launchDimensions: ruleResults.find(r => r.docId === 'launch-dimensions')?.passed ?? false,
    blockerDeferral: ruleResults.find(r => r.docId === 'blocker-deferral')?.passed ?? false,
    freezeBoundary: ruleResults.find(r => r.docId === 'freeze-boundary')?.passed ?? false,
    postLaunchCadence: ruleResults.find(r => r.docId === 'post-launch-cadence')?.passed ?? false,
    surfacesAudit: ruleResults.find(r => r.docId === 'launch-surfaces-audit')?.passed ?? false,
    alignmentIndicators: alignmentDocPassed && alignmentProfileIdsPass,
    profileDimensionAlignment:
      violations.filter(v => v.ruleId.startsWith('profile-dimensions:')).length === 0,
  };

  const hasErrors =
    missing.length > 0 || violations.some(v => v.severity === 'error');
  const ok = !hasErrors;
  const decision: LaunchRulesValidationResult['decision'] = hasErrors ? 'fail' : 'pass';

  return {
    contractVersion: V10_LAUNCH_READINESS_CONTRACT_VERSION,
    ok,
    decision,
    missing,
    violations,
    checks,
  };
}

/** @deprecated Use validateLaunchReadinessSemantics for presence + semantics. */
export function checkLaunchReadinessDocs(rootDir: string = process.cwd()): {
  ok: boolean;
  missing: string[];
} {
  const result = validateLaunchReadinessSemantics({ rootDir });
  return { ok: result.checks.docsPresent, missing: result.missing };
}
