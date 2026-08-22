import { runFailureStopTest } from './multiRoundExecutionValidation.test';

runFailureStopTest('verification')
  .then(() => console.log('p2-verification-failure.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
