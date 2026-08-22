import { runFailureStopTest } from './multiRoundExecutionValidation.test';

runFailureStopTest('execution')
  .then(() => console.log('p2-execution-failure.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
