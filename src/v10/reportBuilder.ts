import type { WorldProfile } from '../narrative/profile/types';
import { getWorldProfile } from '../narrative/worldProfile';
import {
  assembleP24ClosurePayload,
  formatP24ClosureMarkdown,
  formatP24GateMarkdown,
  type P24GateReport,
} from '../p24/reportBuilder';
import { formatCalibrationMatrixMarkdown } from '../p24/validationMatrix';
import type { LaunchRulesValidationResult } from './launchReadinessValidation';
import { validateLaunchReadinessSemantics } from './launchReadinessValidation';

export interface V10GateReport {
  generatedAt: string;
  phase: 'v1.0';
  decision: 'pass' | 'warning' | 'fail';
  launchRules: LaunchRulesValidationResult;
  playtestCalibration: P24GateReport;
  launchReadiness: {
    launchRulesPass: boolean;
    baselinesHealthy: boolean;
    playtestComparisonsHealthy: boolean;
    alignmentHealthy: boolean;
    falsePositiveDetected: boolean;
    redirectionValidated: boolean;
    blockerFixValidated: boolean;
    closureWavePass: boolean;
  };
  messages: string[];
  warnings: string[];
}

function resolveV10Decision(
  launchRules: LaunchRulesValidationResult,
  playtest: P24GateReport,
  playtestWarnings: string[],
): V10GateReport['decision'] {
  if (launchRules.decision === 'fail' || playtest.decision === 'fail') {
    return 'fail';
  }
  if (!launchRules.ok || playtest.decision === 'warning' || playtestWarnings.length > 0) {
    return 'warning';
  }
  return 'pass';
}

function collectLaunchRuleWarnings(launchRules: LaunchRulesValidationResult): string[] {
  const warnings: string[] = [];
  if (!launchRules.checks.docsPresent) {
    warnings.push(`Missing v1.0 launch docs: ${launchRules.missing.join(', ')}`);
  }
  for (const violation of launchRules.violations) {
    if (violation.ruleId.endsWith(':missing')) continue;
    if (violation.severity === 'error') {
      warnings.push(`Launch rules: ${violation.message}`);
    }
  }
  return warnings;
}

function buildV10GateReport(
  launchRules: LaunchRulesValidationResult,
  p24: ReturnType<typeof assembleP24ClosurePayload>,
): V10GateReport {
  const playtest = p24.gate;
  const { matrix, rcWave, fullClosure } = p24;

  const warnings = collectLaunchRuleWarnings(launchRules);
  const messages: string[] = [];

  if (launchRules.ok) {
    messages.push(`v1.0 launch rules contract ${launchRules.contractVersion} satisfied`);
  } else {
    messages.push(`v1.0 launch rules contract ${launchRules.contractVersion} incomplete`);
  }

  warnings.push(...playtest.warnings);
  messages.push(...playtest.messages);

  const launchReadiness = {
    launchRulesPass: launchRules.ok,
    baselinesHealthy: playtest.validation.baselinesPass,
    playtestComparisonsHealthy: playtest.validation.comparisonsPass,
    alignmentHealthy: playtest.validation.indicatorsHealthy,
    falsePositiveDetected: playtest.validation.falsePositiveDetectionPass,
    redirectionValidated: playtest.validation.redirectionPass,
    blockerFixValidated: playtest.validation.targetedFixPass,
    closureWavePass: playtest.validation.rcWavePass && playtest.validation.fullClosurePass,
  };

  const decision = resolveV10Decision(launchRules, playtest, playtest.warnings);

  messages.push(`Launch matrix: ${matrix.decision}`);
  messages.push(`RC wave: ${rcWave.waveDecision}`);
  messages.push(`Full closure: ${fullClosure.closureDecision}`);

  return {
    generatedAt: new Date().toISOString(),
    phase: 'v1.0',
    decision,
    launchRules,
    playtestCalibration: playtest,
    launchReadiness,
    messages,
    warnings,
  };
}

export interface AssembleV10GateReportOptions {
  docContents?: Record<string, string>;
  rootDir?: string;
}

export function assembleV10GateReport(
  profile: WorldProfile = getWorldProfile(),
  options?: AssembleV10GateReportOptions,
): V10GateReport {
  const launchRules = validateLaunchReadinessSemantics({
    profile,
    docContents: options?.docContents,
    rootDir: options?.rootDir,
  });
  const p24 = assembleP24ClosurePayload(profile);
  return buildV10GateReport(launchRules, p24);
}

export function formatV10GateMarkdown(gate: V10GateReport): string {
  return [
    '# v1.0 Release Candidate Gate',
    '',
    `- Decision: **${gate.decision}**`,
    `- Generated: ${gate.generatedAt}`,
    '',
    '## v1.0 launch rules (semantic)',
    `- Contract: ${gate.launchRules.contractVersion}`,
    `- Launch rules pass: ${gate.launchRules.ok ? 'PASS' : 'FAIL'}`,
    `- Docs present: ${gate.launchRules.checks.docsPresent ? 'PASS' : 'FAIL'}`,
    `- Launch dimensions doc: ${gate.launchRules.checks.launchDimensions ? 'PASS' : 'FAIL'}`,
    `- Blocker/deferral doc: ${gate.launchRules.checks.blockerDeferral ? 'PASS' : 'FAIL'}`,
    `- Freeze boundary doc: ${gate.launchRules.checks.freezeBoundary ? 'PASS' : 'FAIL'}`,
    `- Post-launch cadence doc: ${gate.launchRules.checks.postLaunchCadence ? 'PASS' : 'FAIL'}`,
    `- Surfaces audit doc: ${gate.launchRules.checks.surfacesAudit ? 'PASS' : 'FAIL'}`,
    `- Alignment indicators doc: ${gate.launchRules.checks.alignmentIndicators ? 'PASS' : 'FAIL'}`,
    `- Profile dimension alignment: ${gate.launchRules.checks.profileDimensionAlignment ? 'PASS' : 'FAIL'}`,
    ...(gate.launchRules.missing.length > 0
      ? gate.launchRules.missing.map(m => `- Missing doc: ${m}`)
      : []),
    ...(gate.launchRules.violations.length > 0
      ? ['', '### Launch rule violations', ...gate.launchRules.violations.map(v => `- ${v.message}`)]
      : []),
    '',
    '## Launch readiness (P24-backed signals)',
    ...Object.entries(gate.launchReadiness).map(([k, v]) => `- ${k}: ${v ? 'PASS' : 'FAIL'}`),
    '',
    '## Playtest calibration (P24 surfaces)',
    formatP24GateMarkdown(gate.playtestCalibration).split('\n').slice(2).join('\n'),
    '',
    '## Messages',
    ...gate.messages.map(m => `- ${m}`),
    ...(gate.warnings.length > 0 ? ['', '## Warnings', ...gate.warnings.map(w => `- ${w}`)] : []),
  ].join('\n');
}

export function assembleV10ClosurePayload(
  profile: WorldProfile = getWorldProfile(),
  options?: AssembleV10GateReportOptions,
): Omit<ReturnType<typeof assembleP24ClosurePayload>, 'gate'> & { gate: V10GateReport } {
  const p24 = assembleP24ClosurePayload(profile);
  const launchRules = validateLaunchReadinessSemantics({
    profile,
    docContents: options?.docContents,
    rootDir: options?.rootDir,
  });
  const gate = buildV10GateReport(launchRules, p24);
  return { ...p24, gate };
}

export function formatV10ClosureMarkdown(
  gate: V10GateReport,
  matrix: ReturnType<typeof assembleP24ClosurePayload>['matrix'],
  rcWave: ReturnType<typeof assembleP24ClosurePayload>['rcWave'],
): string {
  return [
    '# v1.0 Launch Readiness Closure',
    '',
    '## Gate',
    `- Decision: **${gate.decision}**`,
    `- Launch rules: ${gate.launchRules.ok ? 'PASS' : 'FAIL'}`,
    '',
    '## Launch readiness wave',
    formatP24ClosureMarkdown(gate.playtestCalibration, matrix, rcWave),
    '',
    '## Validation matrix',
    formatCalibrationMatrixMarkdown(matrix),
  ].join('\n');
}
