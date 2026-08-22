import { runScopeValidationTests } from './multiRoundExecutionValidation.test';

runScopeValidationTests()
  .then(() => console.log('p2-scope.test.ts: ok'))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
