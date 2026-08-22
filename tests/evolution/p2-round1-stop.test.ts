import { runRound1NonReadyStopTest } from './multiRoundExecutionValidation.test';

runRound1NonReadyStopTest()
  .then(() => console.log('p2-round1-stop.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
