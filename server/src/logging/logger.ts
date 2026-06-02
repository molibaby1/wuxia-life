import type { BackendEnv } from '../config/env.js';

const REDACT_KEYS = new Set([
  'deviceToken',
  'sessionToken',
  'token',
  'authorization',
  'password',
  'databaseUrl',
]);

export function redactContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    if (REDACT_KEYS.has(key)) {
      out[key] = '[REDACTED]';
    } else {
      out[key] = value;
    }
  }
  return out;
}

export interface RequestLogFields {
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  sessionId?: string;
  errorCode?: string;
}

export class StructuredLogger {
  private readonly env: BackendEnv;

  constructor(env: BackendEnv) {
    this.env = env;
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.write('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.write('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.write('error', message, context);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.env.nodeEnv === 'production' && this.env.logLevel !== 'debug') return;
    this.write('debug', message, context);
  }

  request(fields: RequestLogFields): void {
    this.info('request', {
      ...fields,
      level: 'request',
    });
  }

  private write(level: string, message: string, context?: Record<string, unknown>): void {
    const line = JSON.stringify({
      level,
      message,
      time: new Date().toISOString(),
      ...redactContext(context),
    });
    if (level === 'error') {
      console.error(line);
    } else {
      console.log(line);
    }
  }
}
