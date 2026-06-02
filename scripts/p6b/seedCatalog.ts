import { loadBackendEnv } from '../../server/src/config/env.js';
import { runMigrations } from '../../server/src/db/migrate.js';
import { closePool } from '../../server/src/db/pool.js';
import { seedActiveCatalog } from '../../server/src/http/router.js';

async function main(): Promise<void> {
  const env = loadBackendEnv();
  await runMigrations(env.databaseUrl);
  await seedActiveCatalog(env);
  await closePool();
  console.log(`Seeded catalog version ${env.eventCatalogVersion}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
