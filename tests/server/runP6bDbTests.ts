import { runMigrationTests } from './migration.test.js';
import { runP6bIntegrationTests } from './integration.test.js';
import { runMarketStallApiTests } from './marketStall.test.js';
import { runScholarOfficialPursuitApiTests } from './scholarOfficialPursuit.test.js';
import { runProgressionCheckpointRestartTest } from './progressionCheckpointRestart.test.js';
import { runProgressionCheckpointLegacyTests } from './progressionCheckpointLegacy.test.js';

export function requireDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      'P6B PostgreSQL tests require DATABASE_URL (see .env.p6b.example). ' +
        'Start the database with `npm run p6b:db:up`, then export DATABASE_URL or use `npm run p6b:setup`.',
    );
    process.exit(1);
  }
  return databaseUrl;
}

export async function runP6bDbTests(databaseUrl: string): Promise<void> {
  await runMigrationTests(databaseUrl);
  await runP6bIntegrationTests(databaseUrl);
  await runMarketStallApiTests(databaseUrl);
  await runScholarOfficialPursuitApiTests(databaseUrl);
  await runProgressionCheckpointRestartTest(databaseUrl);
  await runProgressionCheckpointLegacyTests(databaseUrl);
}

async function main(): Promise<void> {
  const databaseUrl = requireDatabaseUrl();
  await runP6bDbTests(databaseUrl);
  console.log('P6B PostgreSQL tests passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
