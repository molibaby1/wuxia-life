import { loadBackendEnv } from '../../server/src/config/env.js';
import { migrateCli } from '../../server/src/db/migrate.js';

const env = loadBackendEnv();
migrateCli(env.databaseUrl).catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
