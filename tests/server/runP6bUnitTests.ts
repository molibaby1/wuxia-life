import { runEnvValidationTests } from './envValidation.test.js';
import { runLoggingTests } from './logging.test.js';
import { runWebApiClientTests } from '../adapters/webApiClient.test.js';

export function runP6bUnitTests(): void {
  runEnvValidationTests();
  runLoggingTests();
  runWebApiClientTests();
}

function main(): void {
  runP6bUnitTests();
  console.log('P6B unit tests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
