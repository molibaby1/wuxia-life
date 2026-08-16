import { runFreshProblemTransferSelectionTests } from './freshProblemTransferSelection.test';
import { runFreshProblemTransferWorkspaceTests } from './freshProblemTransferWorkspace.test';

async function main(): Promise<void> {
  await runFreshProblemTransferWorkspaceTests();
  await runFreshProblemTransferSelectionTests();
  console.log('Fresh Problem Transfer tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
