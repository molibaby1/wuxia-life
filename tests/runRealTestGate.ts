import { spawn } from 'node:child_process';
import {
  GATE_BLOCKER_SUBSTRINGS,
  findBlockerKeywordInLog,
  gateChildEnv,
} from './qualityGatePolicy.ts';

export { GATE_BLOCKER_SUBSTRINGS, findBlockerKeywordInLog } from './qualityGatePolicy.ts';

type Suite = {
  name: string;
  entry: string;
};

const suites: Suite[] = [
  { name: 'activeActionAttributeBalance', entry: 'tests/activeActionAttributeBalance.test.ts' },
  { name: 'activeActionResultDifferentiation', entry: 'tests/activeActionResultDifferentiation.test.ts' },
  { name: 'activeActionResultParity', entry: 'tests/activeActionResultParity.test.ts' },
  { name: 'stageAtomicProgression', entry: 'tests/stageAtomicProgression.test.ts' },
  { name: 'experienceTraceTests', entry: 'tests/headless/experienceTrace.test.ts' },
  { name: 'normalLongevityEndingClosure', entry: 'tests/normalLongevityEndingClosure.test.ts' },
  { name: 'earlyDeathTerminalConsistency', entry: 'tests/earlyDeathTerminalConsistency.test.ts' },
  { name: 'quietFamilyLifeEndingExplanation', entry: 'tests/quietFamilyLifeEndingExplanation.test.ts' },
  { name: 'p8PlayabilityTests', entry: 'tests/p8PlayabilityTests.ts' },
  { name: 'p9PlayabilityTests', entry: 'tests/p9PlayabilityTests.ts' },
  { name: 'p9FinalStateReplayMetricsRegression', entry: 'tests/p9FinalStateReplayMetricsRegression.test.ts' },
  { name: 'p9SocialEventEligibilityRegression', entry: 'tests/p9SocialEventEligibilityRegression.test.ts' },
  { name: 'p11SchedulingTests', entry: 'tests/p11SchedulingTests.ts' },
  { name: 'p12ProfileTests', entry: 'tests/p12ProfileTests.ts' },
  { name: 'p16OriginDestinyTests', entry: 'tests/p16OriginDestinyTests.ts' },
  { name: 'annualPassiveMemoryTests', entry: 'tests/annualPassiveMemoryTests.ts' },
  { name: 'merchantChildhoodCausalSliceTests', entry: 'tests/merchantChildhoodCausalSliceTests.ts' },
  { name: 'infantPassiveChainVerificationTests', entry: 'tests/infantPassiveChainVerificationTests.ts' },
  { name: 'preschoolPassiveSpineTests', entry: 'tests/preschoolPassiveSpineTests.ts' },
  { name: 'preschoolOriginIsolationTests', entry: 'tests/preschoolOriginIsolationTests.ts' },
  { name: 'spineOriginIsolationTests', entry: 'tests/spineOriginIsolationTests.ts' },
  { name: 'spineOriginConfigValidationTests', entry: 'tests/spineOriginConfigValidationTests.ts' },
  { name: 'primaryOriginFlagTests', entry: 'tests/primaryOriginFlagTests.ts' },
  { name: 'traitLineSpineEligibilityTests', entry: 'tests/traitLineSpineEligibilityTests.ts' },
  { name: 'dailyFallbackOriginGateTests', entry: 'tests/dailyFallbackOriginGateTests.ts' },
  { name: 'neutralPassiveDedupTests', entry: 'tests/neutralPassiveDedupTests.ts' },
  { name: 'lateChildhoodAgencyStage9Tests', entry: 'tests/lateChildhoodAgencyStage9Tests.ts' },
  { name: 'youthAgencyStage10Tests', entry: 'tests/youthAgencyStage10Tests.ts' },
  { name: 'youthRouteEntryTimingStage10Tests', entry: 'tests/youthRouteEntryTimingStage10Tests.ts' },
  { name: 'p17ConsequenceTests', entry: 'tests/p17ConsequenceTests.ts' },
  { name: 'p18LegacyTests', entry: 'tests/p18LegacyTests.ts' },
  { name: 'p19EndgameTests', entry: 'tests/p19EndgameTests.ts' },
  { name: 'p20ReplayabilityTests', entry: 'tests/p20ReplayabilityTests.ts' },
  { name: 'p32RuntimeParityTests', entry: 'tests/p32RuntimeParityTests.ts' },
  { name: 'p33RuntimeParityTests', entry: 'tests/p33RuntimeParityTests.ts' },
  { name: 'p34LifetimeParityTests', entry: 'tests/p34LifetimeParityTests.ts' },
  { name: 'p35MixedPinnacleParityTests', entry: 'tests/p35MixedPinnacleParityTests.ts' },
  { name: 'p36ConsistencyTests', entry: 'tests/p36ConsistencyTests.ts' },
  { name: 'p37AdditionalMixedPinnacleParityTests', entry: 'tests/p37AdditionalMixedPinnacleParityTests.ts' },
  { name: 'p38FrustrationRemediationTests', entry: 'tests/p38FrustrationRemediationTests.ts' },
  { name: 'p39ContentPoolConsistencyTests', entry: 'tests/p39ContentPoolConsistencyTests.ts' },
  { name: 'p40ReplayPacingPolishTests', entry: 'tests/p40ReplayPacingPolishTests.ts' },
  { name: 'p41HabitFeedbackTests', entry: 'tests/p41HabitFeedbackTests.ts' },
  { name: 'p122EarlyVisibleGrowthFeedbackTests', entry: 'tests/p122EarlyVisibleGrowthFeedbackTests.ts' },
  { name: 'p127MartialSecondVisibleGrowthTests', entry: 'tests/p127MartialSecondVisibleGrowthTests.ts' },
  { name: 'mainScreenModelTests', entry: 'tests/mainScreenModel.test.ts' },
  { name: 'gameScreenPresentationTests', entry: 'tests/gameScreenPresentationTests.ts' },
  { name: 'hvgMerchantVisibleGrowthLoopTests', entry: 'tests/hvgMerchantVisibleGrowthLoopTests.ts' },
  { name: 'p41ChoiceFeedbackValidationTests', entry: 'tests/p41ChoiceFeedbackValidationTests.ts' },
  { name: 'p42ContentDensityTests', entry: 'tests/p42ContentDensityTests.ts' },
  { name: 'p43ArchetypeRecapEndingTests', entry: 'tests/p43ArchetypeRecapEndingTests.ts' },
  { name: 'p44HabitAuditTests', entry: 'tests/p44HabitAuditTests.ts' },
  { name: 'p45TrajectoryReplayTests', entry: 'tests/p45TrajectoryReplayTests.ts' },
  { name: 'p45WealthEarlyAuditTests', entry: 'tests/p45WealthEarlyAuditTests.ts' },
  { name: 'p45ShapingBiasRegressionTests', entry: 'tests/p45ShapingBiasRegressionTests.ts' },
  { name: 'personalityHabitTrajectoryTests', entry: 'tests/personalityHabitTrajectoryTests.ts' },
  { name: 'p21ContentProductionTests', entry: 'tests/p21ContentProductionTests.ts' },
  { name: 'p22ContentLibraryTests', entry: 'tests/p22ContentLibraryTests.ts' },
  { name: 'p23ExperienceAcceptanceTests', entry: 'tests/p23ExperienceAcceptanceTests.ts' },
  { name: 'p24PlaytestCalibrationTests', entry: 'tests/p24PlaytestCalibrationTests.ts' },
  { name: 'v10LaunchReadinessTests', entry: 'tests/v10LaunchReadinessTests.ts' },
  { name: 'AllTests', entry: 'tests/AllTests.ts' },
  { name: 'IntegrationTests', entry: 'tests/IntegrationTests.ts' },
  { name: 'formalChoiceIdGate', entry: 'tests/formalChoiceIdGate.test.ts' },
  { name: 'multiRoundExecutionValidation', entry: 'tests/evolution/multiRoundExecutionValidation.test.ts' },
  { name: 'skillBehavioralValidation', entry: 'tests/evolution/skillBehavioralValidation.test.ts' },
  { name: 'skillBehavioralTerminalReport', entry: 'tests/evolution/skillBehavioralTerminalReport.test.ts' },
  { name: 'operationalRunReport', entry: 'tests/evolution/operationalRunReport.test.ts' },
  { name: 'testGameSimulation', entry: 'tests/testGameSimulation.ts' },
  { name: 'testLifeMemorySummary', entry: 'tests/testLifeMemorySummary.ts' },
  { name: 'lifeMemoryFeedback', entry: 'tests/lifeMemoryFeedback.test.ts' },
  { name: 'lifeMilestoneSystem', entry: 'tests/lifeMilestoneSystem.test.ts' },
  { name: 'merchantStatecraftVerticalSlice', entry: 'tests/testMerchantStatecraftVerticalSlice.ts' },
  { name: 'canonicalWealthCapacityState', entry: 'tests/canonicalWealthCapacityState.test.ts' },
  { name: 'wealthCapacityEventSemantics', entry: 'tests/wealthCapacityEventSemantics.test.ts' },
  { name: 'wealthDailyCashAbstraction', entry: 'tests/wealthDailyCashAbstraction.test.ts' },
  { name: 'wealthMerchantVerticalSlice', entry: 'tests/wealthMerchantVerticalSlice.test.ts' },
  { name: 'wealthCapacityPresentation', entry: 'tests/wealthCapacityPresentation.test.ts' },
  { name: 'assetOwnershipSemantics', entry: 'tests/assetOwnershipSemantics.test.ts' },
  { name: 'assetEventSemantics', entry: 'tests/assetEventSemantics.test.ts' },
  { name: 'merchantShopAssetVertical', entry: 'tests/merchantShopAssetVertical.test.ts' },
  { name: 'merchantShopLegacyMoneyMigration', entry: 'tests/merchantShopLegacyMoneyMigration.test.ts' },
  { name: 'merchantCaravanLegacyMoneyMigration', entry: 'tests/merchantCaravanLegacyMoneyMigration.test.ts' },
  { name: 'merchantMarketMonopolyLegacyMoneyMigration', entry: 'tests/merchantMarketMonopolyLegacyMoneyMigration.test.ts' },
  { name: 'merchantOfficialIntelligenceChamberLegacyMoneyMigration', entry: 'tests/merchantOfficialIntelligenceChamberLegacyMoneyMigration.test.ts' },
  { name: 'merchantLateEconomicProgressionLegacyMoneyMigration', entry: 'tests/merchantLateEconomicProgressionLegacyMoneyMigration.test.ts' },
  { name: 'merchantBankruptEndingTemporaryRetirement', entry: 'tests/merchantBankruptEndingTemporaryRetirement.test.ts' },
  { name: 'parallelIdentityMerchantProgressionRetirement', entry: 'tests/parallelIdentityMerchantProgressionRetirement.test.ts' },
  { name: 'genericRichestManLegacyAliasRetirement', entry: 'tests/genericRichestManLegacyAliasRetirement.test.ts' },
  { name: 'globalMoneyRelationshipSetbackRetirement', entry: 'tests/globalMoneyRelationshipSetbackRetirement.test.ts' },
  { name: 'globalMoneyEndingAchievementRetirement', entry: 'tests/globalMoneyEndingAchievementRetirement.test.ts' },
  { name: 'globalMoneyBittersweetEndingRetirement', entry: 'tests/globalMoneyBittersweetEndingRetirement.test.ts' },
  { name: 'globalMoneyP17ResourceRetirement', entry: 'tests/globalMoneyP17ResourceRetirement.test.ts' },
  { name: 'globalMoneyP18ResourceRetirement', entry: 'tests/globalMoneyP18ResourceRetirement.test.ts' },
  {
    name: 'globalMoneyP8HeadlessEvaluationRetirement',
    entry: 'tests/globalMoneyP8HeadlessEvaluationRetirement.test.ts',
  },
  {
    name: 'globalMoneyEarlyLifeBootstrapRetirement',
    entry: 'tests/globalMoneyEarlyLifeBootstrapRetirement.test.ts',
  },
  {
    name: 'globalMoneyBusinessHabitRewardRetirement',
    entry: 'tests/globalMoneyBusinessHabitRewardRetirement.test.ts',
  },
  {
    name: 'globalMoneyMedicalRouteRewardRetirement',
    entry: 'tests/globalMoneyMedicalRouteRewardRetirement.test.ts',
  },
  {
    name: 'globalMoneyIdentityYearWalletFlowRetirement',
    entry: 'tests/globalMoneyIdentityYearWalletFlowRetirement.test.ts',
  },
  {
    name: 'globalMoneyHabitConsequenceWalletRetirement',
    entry: 'tests/globalMoneyHabitConsequenceWalletRetirement.test.ts',
  },
  {
    name: 'globalMoneyLocalAutoResolveScoringRetirement',
    entry: 'tests/globalMoneyLocalAutoResolveScoringRetirement.test.ts',
  },
  {
    name: 'globalMoneyBeggarsRouteWalletRetirement',
    entry: 'tests/globalMoneyBeggarsRouteWalletRetirement.test.ts',
  },
  {
    name: 'globalMoneyLegacyWealthAuthorityConsumerMigration',
    entry: 'tests/globalMoneyLegacyWealthAuthorityConsumerMigration.test.ts',
  },
  {
    name: 'globalMoneyDeadParallelContentRetirement',
    entry: 'tests/globalMoneyDeadParallelContentRetirement.test.ts',
  },
  {
    name: 'globalMoneyP22CommercialCommitmentChoiceRedesign',
    entry: 'tests/globalMoneyP22CommercialCommitmentChoiceRedesign.test.ts',
  },
  {
    name: 'globalMoneyFamilyChildBornChoiceIntegrityRedesign',
    entry: 'tests/globalMoneyFamilyChildBornChoiceIntegrityRedesign.test.ts',
  },
  {
    name: 'globalMoneyClassifiedOrdinaryWalletAbstraction',
    entry: 'tests/globalMoneyClassifiedOrdinaryWalletAbstraction.test.ts',
  },
  {
    name: 'globalMoneyFinalStrategicProducerMigration',
    entry: 'tests/globalMoneyFinalStrategicProducerMigration.test.ts',
  },
  {
    name: 'globalMoneyDifficultySetbackWalletMutationRetirement',
    entry: 'tests/globalMoneyDifficultySetbackWalletMutationRetirement.test.ts',
  },
  { name: 'assetPersistence', entry: 'tests/assetPersistence.test.ts' },
  { name: 'assetPresentation', entry: 'tests/assetPresentation.test.ts' },
  { name: 'canonicalPlayerStateSlice2aTests', entry: 'tests/canonicalPlayerStateSlice2a.test.ts' },
  { name: 'canonicalPlayerStateSlice2b1Tests', entry: 'tests/canonicalPlayerStateSlice2b1.test.ts' },
  { name: 'canonicalPlayerStateSlice2b2Tests', entry: 'tests/canonicalPlayerStateSlice2b2.test.ts' },
  { name: 'canonicalStatusFoundationTests', entry: 'tests/canonicalStatusFoundation.test.ts' },
  { name: 'canonicalEnergyEliminationTests', entry: 'tests/canonicalEnergyElimination.test.ts' },
  { name: 'canonicalHealthNoiseEliminationTests', entry: 'tests/canonicalHealthNoiseElimination.test.ts' },
  { name: 'canonicalHealthStatusContractTests', entry: 'tests/canonicalHealthStatusContract.test.ts' },
  { name: 'canonicalLegacyHealthRemovalTests', entry: 'tests/canonicalLegacyHealthRemoval.test.ts' },
  { name: 'canonicalFatigueAnxietyStatusMigrationTests', entry: 'tests/canonicalFatigueAnxietyStatusMigration.test.ts' },
  { name: 'canonicalDisciplineIndulgenceRemovalTests', entry: 'tests/canonicalDisciplineIndulgenceRemoval.test.ts' },
  { name: 'canonicalHabitPracticeNarrowingTests', entry: 'tests/canonicalHabitPracticeNarrowing.test.ts' },
  { name: 'canonicalP25HabitSimulationNarrowing', entry: 'tests/canonicalP25HabitSimulationNarrowing.test.ts' },
  { name: 'canonicalFamilySocialLifeStateRemovalTests', entry: 'tests/canonicalFamilySocialLifeStateRemoval.test.ts' },
  { name: 'canonicalRouteLifecycleRemovalTests', entry: 'tests/canonicalRouteLifecycleRemoval.test.ts' },
  { name: 'canonicalLifePathFocusRemovalTests', entry: 'tests/canonicalLifePathFocusRemoval.test.ts' },
  { name: 'canonicalIdentityAffiliationClosure', entry: 'tests/canonicalIdentityAffiliationClosure.test.ts' },
  { name: 'playerRolePresentation', entry: 'tests/playerRolePresentation.test.ts' },
  { name: 'canonicalPersistenceBoundaryTests', entry: 'tests/canonicalPersistenceBoundary.test.ts' },
  { name: 'canonicalCriticalChoiceNormalizationTests', entry: 'tests/canonicalCriticalChoiceNormalization.test.ts' },
  { name: 'youthCausalOpportunity', entry: 'tests/youthCausalOpportunity.test.ts' },
  { name: 'b0GuardrailCalibration', entry: 'tests/b0/b0GuardrailCalibration.test.ts' },
  { name: 'b0IsolationAndHash', entry: 'tests/b0/b0IsolationAndHash.test.ts' },
  { name: 'b0PatchScopeAndBlocked', entry: 'tests/b0/b0PatchScopeAndBlocked.test.ts' },
  { name: 'b0RealControlHeadless', entry: 'tests/b0/b0RealControlHeadless.test.ts' },
  { name: 'canonicalRuntimeLoadIsolationTests', entry: 'tests/canonicalRuntimeLoadIsolation.test.ts' },
  { name: 'canonicalRuntimeExactApplicationTests', entry: 'tests/canonicalRuntimeExactApplication.test.ts' },
  { name: 'canonicalJsonContainerBoundaryTests', entry: 'tests/canonicalJsonContainerBoundary.test.ts' },
  { name: 'canonicalUndefinedPropertyEliminationTests', entry: 'tests/canonicalUndefinedPropertyElimination.test.ts' },
  { name: 'canonicalMartialLegacyConsumerRemovalTests', entry: 'tests/canonicalMartialLegacyConsumerRemoval.test.ts' },
  { name: 'canonicalMartialLegacyProducerPruningTests', entry: 'tests/canonicalMartialLegacyProducerPruning.test.ts' },
  { name: 'canonicalComprehensionRemoval', entry: 'tests/canonicalComprehensionRemoval.test.ts' },
];

function runSuite(suite: Suite): Promise<{ status: number | null; log: string }> {
  return new Promise(resolve => {
    const child = spawn('npm', ['exec', '--', 'tsx', suite.entry], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: gateChildEnv(),
    });
    let log = '';

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      log += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      log += text;
      process.stderr.write(text);
    });
    child.on('close', status => resolve({ status, log }));
    child.on('error', error => {
      const text = `${error}\n`;
      process.stderr.write(text);
      resolve({ status: null, log: text });
    });
  });
}

async function main(): Promise<void> {
  let failed = false;
  let aggregatedLog = '';

  for (const suite of suites) {
    console.log(`\n▶ Running ${suite.name} (${suite.entry})`);
    const result = await runSuite(suite);
    aggregatedLog += result.log;

    if (result.status !== 0) {
      failed = true;
      console.error(`✖ ${suite.name} failed with exit code ${result.status ?? 'unknown'}`);
    } else {
      console.log(`✔ ${suite.name} passed`);
    }
  }

  const blockerHit = findBlockerKeywordInLog(aggregatedLog);
  if (blockerHit !== undefined) {
    console.error(
      `\n✖ Log-aware gate: blocker keyword detected in output: "${blockerHit}"\n` +
        '  Policy: any of these substrings in gate logs fails the run regardless of exit codes:\n' +
        `  ${GATE_BLOCKER_SUBSTRINGS.map((s) => `  - ${s}`).join('\n')}`,
    );
    failed = true;
  }

  process.exitCode = failed ? 1 : 0;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
