import { runEnvValidationTests } from './envValidation.test.js';
import { runLoggingTests } from './logging.test.js';
import { runWebApiClientTests } from '../adapters/webApiClient.test.js';
import { runProgressionCheckpointRepositoryTests } from './progressionCheckpointRepository.test.js';
import { runRandomSourceScopeTests } from './randomSourceScope.test.js';
import { runGameLifeRngRepositoryTests } from './gameLifeRngRepository.test.js';

export async function runP6bUnitTests(): Promise<void> {
  runEnvValidationTests();
  runLoggingTests();
  await runWebApiClientTests();
  await runProgressionCheckpointRepositoryTests();
  await runRandomSourceScopeTests();
  await runGameLifeRngRepositoryTests();
}

async function main(): Promise<void> {
  await runP6bUnitTests();
  console.log('P6B unit tests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
