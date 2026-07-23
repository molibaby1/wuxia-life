/**
 * Headless unit test entry (P5 US-020).
 */

import { runRandomSourceTests } from './randomSource.test';
import { runTimeSourceTests } from './timeSource.test';
import { runCatalogAdapterTests } from './catalogAdapter.test';
import { runSnapshotAdapterTests } from './snapshotAdapter.test';
import { runHeadlessSessionTests } from './headlessSession.test';
import { runCatalogVersionPinningTests } from './catalogVersionPinning.test';
import { runParityHarnessTests } from './parityHarness.test';
import { runParitySamplesTests } from './paritySamples.test';
import { runP72SessionPhaseTests } from './p72SessionPhase.test';
import { runPeriodSummaryPlanningHandoffTests } from '../periodSummaryPlanningHandoffTests';
import { runP72ActivePlanningParityTests } from './p72ActivePlanningParity.test';
import { runP81HeadlessPersonaToAge20Test, runP81HeadlessGatePersonasSmokeTest } from './p81HeadlessPersonaRunner.test';
import { runP81HeadlessLocalParityTest } from './p81HeadlessLocalParity.test';

async function main(): Promise<void> {
  process.env.WUXIA_ENGINE_QUIET = '1';
  await runRandomSourceTests();
  runTimeSourceTests();
  runCatalogAdapterTests();
  runSnapshotAdapterTests();
  runCatalogVersionPinningTests();
  await runHeadlessSessionTests();
  await runP72SessionPhaseTests();
  await runPeriodSummaryPlanningHandoffTests();
  await runP72ActivePlanningParityTests();
  await runP81HeadlessPersonaToAge20Test();
  await runP81HeadlessGatePersonasSmokeTest();
  await runP81HeadlessLocalParityTest();
  runParityHarnessTests();
  await runParitySamplesTests();
  console.log('headless test suite: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
