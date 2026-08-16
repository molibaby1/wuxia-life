import { runPlayerObservableTranscriptTests } from './playerObservableTranscript.test';
import { runPlayerSurfaceCaptureTests } from './playerSurfaceCapture.test';
import { runPhase0ProvenanceTests } from './phase0Provenance.test';
import { runPhase0EndToEndTests } from './phase0EndToEnd.test';

async function main(): Promise<void> {
  runPlayerObservableTranscriptTests();
  await runPlayerSurfaceCaptureTests();
  await runPhase0ProvenanceTests();
  await runPhase0EndToEndTests();
  console.log('Phase 0 evolution tests: ok');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
