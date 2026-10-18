import { runEnvValidationTests } from './envValidation.test.js';
import { runLoggingTests } from './logging.test.js';
import { runWebApiClientTests } from '../adapters/webApiClient.test.js';

export async function runP6bUnitTests(): Promise<void> {
  runEnvValidationTests();
  runLoggingTests();
  await runWebApiClientTests();
}

async function main(): Promise<void> {
  await runP6bUnitTests();
  console.log('P6B unit tests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
