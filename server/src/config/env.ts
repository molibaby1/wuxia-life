export interface BackendEnv {
  nodeEnv: 'development' | 'test' | 'production';
  httpHost: string;
  httpPort: number;
  databaseUrl: string;
  tokenHashSecret: string;
  engineVersion: string;
  eventCatalogVersion: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parsePort(raw: string | undefined, fallback: number): number {
  const value = raw?.trim() ?? String(fallback);
  const port = Number.parseInt(value, 10);
  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid HTTP port: ${value}`);
  }
  return port;
}

export function loadBackendEnv(processEnv: NodeJS.ProcessEnv = process.env): BackendEnv {
  const nodeEnvRaw = processEnv.NODE_ENV?.trim() ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnvRaw)) {
    throw new Error(`Invalid NODE_ENV: ${nodeEnvRaw}`);
  }
  const nodeEnv = nodeEnvRaw as BackendEnv['nodeEnv'];

  const databaseUrl = required('DATABASE_URL', processEnv.DATABASE_URL);
  const tokenHashSecret = required('TOKEN_HASH_SECRET', processEnv.TOKEN_HASH_SECRET);
  if (tokenHashSecret.length < 16) {
    throw new Error('TOKEN_HASH_SECRET must be at least 16 characters');
  }

  const engineVersion = required('ENGINE_VERSION', processEnv.ENGINE_VERSION);
  const eventCatalogVersion = required(
    'EVENT_CATALOG_VERSION',
    processEnv.EVENT_CATALOG_VERSION,
  );

  const logLevelRaw = processEnv.LOG_LEVEL?.trim() ?? (nodeEnv === 'production' ? 'info' : 'debug');
  if (!['debug', 'info', 'warn', 'error'].includes(logLevelRaw)) {
    throw new Error(`Invalid LOG_LEVEL: ${logLevelRaw}`);
  }

  return {
    nodeEnv,
    httpHost: processEnv.HTTP_HOST?.trim() || '0.0.0.0',
    httpPort: parsePort(processEnv.HTTP_PORT, 8787),
    databaseUrl,
    tokenHashSecret,
    engineVersion,
    eventCatalogVersion,
    logLevel: logLevelRaw as BackendEnv['logLevel'],
  };
}
