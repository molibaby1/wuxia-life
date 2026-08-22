import { runFailureStopTest } from './multiRoundExecutionValidation.test';

runFailureStopTest('rerun')
  .then(() => console.log('p2-rerun-failure.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
