/**
 * v1.0 release candidate and launch readiness tests.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  V10_REQUIRED_DESIGN_DOCS,
  validateLaunchReadinessSemantics,
} from '../src/v10/launchReadinessDocs';
import { V10_ALL_LAUNCH_DOC_PATHS } from '../src/v10/launchReadinessContract';
import { assembleV10GateReport, assembleV10ClosurePayload } from '../src/v10/reportBuilder';
import { profileHasP24Sections } from '../src/p24/reportBuilder';
import { getWorldProfile, WUXIA_WORLD_PROFILE } from '../src/narrative/worldProfile';
import { buildPlaytestCalibrationMatrix, matrixComparisonsPass } from '../src/p24/validationMatrix';
import { runBoundedRcCalibrationWave } from '../src/p24/validationSlices';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function testLaunchRulesSemanticsOnRepo(): void {
  const rules = validateLaunchReadinessSemantics({ profile: WUXIA_WORLD_PROFILE });
  assert(rules.checks.docsPresent, `missing docs: ${rules.missing.join(', ')}`);
  assert(rules.checks.launchDimensions, 'launch dimensions doc semantics');
  assert(rules.checks.blockerDeferral, 'blocker/deferral doc semantics');
  assert(rules.checks.freezeBoundary, 'freeze boundary doc semantics');
  assert(rules.checks.postLaunchCadence, 'post-launch cadence doc semantics');
  assert(rules.checks.surfacesAudit, 'surfaces audit doc semantics');
  assert(rules.checks.alignmentIndicators, 'alignment indicators doc semantics');
  assert(rules.checks.profileDimensionAlignment, 'profile dimension alignment');
  assert(rules.ok, `launch rules must pass on repo: ${rules.violations.map(v => v.message).join('; ')}`);
  assert(rules.decision === 'pass', `launch rules decision ${rules.decision}`);
  assert(V10_REQUIRED_DESIGN_DOCS.length >= 4, 'design doc registry');
}

function loadRepoLaunchDocContents(): Record<string, string> {
  const rootDir = process.cwd();
  return Object.fromEntries(
    V10_ALL_LAUNCH_DOC_PATHS.map(rel => [
      rel,
      fs.readFileSync(path.join(rootDir, rel), 'utf8'),
    ]),
  );
}

function testAlignmentIndicatorDocMustReferenceProfileIds(): void {
  const docContents = loadRepoLaunchDocContents();
  docContents['docs/test-reports/v1-0-alignment-indicators.md'] =
    '# Indicators\n## Indicators\n## Decision mapping\nOverestimate bias healthyRange alignmentGap\n';
  const rules = validateLaunchReadinessSemantics({
    profile: WUXIA_WORLD_PROFILE,
    docContents,
  });
  assert(!rules.checks.alignmentIndicators, 'alignment check must fail when profile ids missing');
  assert(!rules.ok, 'semantic validation must fail');
  assert(rules.decision === 'fail', `expected fail, got ${rules.decision}`);
  assert(
    rules.violations.some(v => v.ruleId === 'alignment-indicators:profile-id'),
    'must report missing profile indicator ids',
  );
}

function testLaunchRulesRejectsEmptyStubDocs(): void {
  const stubContents = Object.fromEntries(
    V10_ALL_LAUNCH_DOC_PATHS.map(rel => [rel, '# Placeholder only\nFile exists but lacks launch semantics.\n']),
  );
  const rules = validateLaunchReadinessSemantics({
    profile: WUXIA_WORLD_PROFILE,
    docContents: stubContents,
  });
  assert(rules.checks.docsPresent, 'stub docs counted as present');
  assert(!rules.ok, 'empty stub docs must fail semantic validation');
  assert(rules.decision === 'fail', `expected fail, got ${rules.decision}`);
  assert(rules.violations.length > 0, 'must report violations');
  assert(!rules.checks.launchDimensions, 'launch dimensions check must fail on stub');
  assert(!rules.checks.blockerDeferral, 'blocker/deferral check must fail on stub');
  assert(!rules.checks.freezeBoundary, 'freeze boundary check must fail on stub');
  assert(!rules.checks.postLaunchCadence, 'cadence check must fail on stub');

}

function testV10GateFailsWhenLaunchRulesInvalid(): void {
  const stubContents = Object.fromEntries(
    V10_ALL_LAUNCH_DOC_PATHS.map(rel => [rel, '# empty\n']),
  );
  const rules = validateLaunchReadinessSemantics({
    profile: WUXIA_WORLD_PROFILE,
    docContents: stubContents,
  });
  assert(rules.decision === 'fail', 'invalid launch rules must fail');

  const gate = assembleV10GateReport(WUXIA_WORLD_PROFILE, { docContents: stubContents });
  assert(!gate.launchRules.ok, 'gate launch rules must fail on stub docs');
  assert(!gate.launchReadiness.launchRulesPass, 'launchRulesPass false on stub');
  assert(gate.decision === 'fail', `gate must fail when launch rules invalid, got ${gate.decision}`);

  const repoGate = assembleV10GateReport();
  assert(repoGate.launchRules.ok, 'repo launch rules must pass');
  assert(repoGate.launchReadiness.launchRulesPass, 'repo launchRulesPass');
}

function testV10Gate(): void {
  assert(profileHasP24Sections(WUXIA_WORLD_PROFILE), 'playtest calibration surfaces required');
  const gate = assembleV10GateReport();
  assert(gate.phase === 'v1.0', 'phase tag');
  assert(gate.launchRules.ok, 'launch rules semantics');
  assert(gate.launchReadiness.launchRulesPass, 'launchRulesPass');
  assert(gate.launchReadiness.baselinesHealthy, 'baselines');
  const matrix = buildPlaytestCalibrationMatrix(getWorldProfile());
  assert(
    gate.launchReadiness.playtestComparisonsHealthy === matrixComparisonsPass(matrix),
    'playtest comparisons flag must match matrix row results',
  );
  if (!matrix.summary.comparisonCoverageComplete) {
    assert(!gate.launchReadiness.playtestComparisonsHealthy, 'playtest comparisons unhealthy when coverage incomplete');
    assert(
      gate.decision === 'warning' || gate.decision === 'fail',
      `gate must warn/fail on comparison coverage gap, got ${gate.decision}`,
    );
  }
  assert(gate.launchReadiness.falsePositiveDetected, 'false-positive sample');
  assert(gate.launchReadiness.redirectionValidated, 'redirection sample');
  assert(gate.launchReadiness.blockerFixValidated, 'blocker-fix sample');
  assert(gate.decision !== 'fail', `gate decision: ${gate.decision}`);
}

function testValidationMatrix(): void {
  const matrix = buildPlaytestCalibrationMatrix(getWorldProfile());
  assert(matrix.baselineScores.length >= 6, 'baseline rows');
  assert(matrix.rcComparisonResults.length >= 3, 'RC samples');
  assert(matrix.alignmentIndicators.length >= 5, 'alignment indicators');
  assert(matrix.decision !== 'fail', `matrix: ${matrix.decision}`);
}

function testClosureWave(): void {
  const matrix = buildPlaytestCalibrationMatrix();
  const wave = runBoundedRcCalibrationWave(matrix);
  assert(wave.cases.length >= 3, 'wave cases');
  assert(wave.waveDecision !== 'fail', `wave: ${wave.waveDecision}`);
  const stronger = wave.cases.find(c => c.caseId === 'weak_dimension_improved');
  const falsePositive = wave.cases.find(c => c.caseId === 'internal_missed_player_problem');
  const redirection = wave.cases.find(c => c.caseId === 'rc_redirected_fix');
  if (stronger) assert(stronger.passed, 'measurable strengthening case');
  if (falsePositive) assert(falsePositive.passed, 'false-positive detection case');
  if (redirection) assert(redirection.passed, 'fix redirection case');
}

function testClosurePayload(): void {
  const payload = assembleV10ClosurePayload();
  assert(payload.gate.launchRules.ok, 'closure launch rules');
  assert(payload.gate.decision !== 'fail', 'closure gate');
  assert(payload.fullClosure.closureDecision !== 'fail', 'full closure');
}

function main(): void {
  const tests = [
    testLaunchRulesSemanticsOnRepo,
    testAlignmentIndicatorDocMustReferenceProfileIds,
    testLaunchRulesRejectsEmptyStubDocs,
    testV10GateFailsWhenLaunchRulesInvalid,
    testV10Gate,
    testValidationMatrix,
    testClosureWave,
    testClosurePayload,
  ];
  for (const test of tests) {
    test();
    console.log(`✔ ${test.name}`);
  }
  console.log(`\n${tests.length} v1.0 launch readiness tests passed`);
}

main();
