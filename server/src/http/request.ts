import type { IncomingMessage } from 'node:http';

const MAX_BODY_SIZE = 10 * 1024 * 1024;

export async function readJsonBody<T = Record<string, unknown>>(
  req: IncomingMessage,
): Promise<T> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;
    if (totalBytes > MAX_BODY_SIZE) {
      const err = new Error('Request body too large');
      (err as NodeJS.ErrnoException).code = 'ERR_BODY_TOO_LARGE';
      throw err;
    }
    chunks.push(buf);
  }
  if (chunks.length === 0) return {} as T;
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw) as T;
}

export function getBearerToken(req: IncomingMessage, headerName: string): string | undefined {
  const direct = req.headers[headerName.toLowerCase()];
  if (typeof direct === 'string' && direct.trim()) return direct.trim();
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice('Bearer '.length).trim();
  }
  return undefined;
}
