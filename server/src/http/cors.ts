import type { IncomingMessage, ServerResponse } from 'node:http';
import type { BackendEnv } from '../config/env.js';

const ALLOWED_HEADERS = 'Content-Type, Authorization, X-Device-Token, X-Session-Token';

/** Apply dev CORS so Vite (localhost:5173) can call the API. Returns true if OPTIONS was handled. */
export function handleCors(req: IncomingMessage, res: ServerResponse, env: BackendEnv): boolean {
  if (env.nodeEnv === 'production') {
    return req.method === 'OPTIONS';
  }
  const origin = req.headers.origin;
  if (typeof origin === 'string' && origin.length > 0) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}
