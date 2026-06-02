const DEVICE_TOKEN_KEY = 'wuxia-p6b-device-token';
const SESSION_TOKEN_KEY = 'wuxia-p6b-session-token';
const SESSION_ID_KEY = 'wuxia-p6b-session-id';

function hasBrowserStorage(): boolean {
  return (
    typeof globalThis !== 'undefined' &&
    'localStorage' in globalThis &&
    globalThis.localStorage != null
  );
}

export const webPlatformStorage = {
  getDeviceToken(): string | null {
    if (!hasBrowserStorage()) return null;
    return globalThis.localStorage.getItem(DEVICE_TOKEN_KEY);
  },
  setDeviceToken(token: string): void {
    if (!hasBrowserStorage()) return;
    globalThis.localStorage.setItem(DEVICE_TOKEN_KEY, token);
  },
  getSessionToken(): string | null {
    if (!hasBrowserStorage()) return null;
    return globalThis.localStorage.getItem(SESSION_TOKEN_KEY);
  },
  setSessionAuth(sessionId: string, sessionToken: string): void {
    if (!hasBrowserStorage()) return;
    globalThis.localStorage.setItem(SESSION_ID_KEY, sessionId);
    globalThis.localStorage.setItem(SESSION_TOKEN_KEY, sessionToken);
  },
  clearSessionAuth(): void {
    if (!hasBrowserStorage()) return;
    globalThis.localStorage.removeItem(SESSION_ID_KEY);
    globalThis.localStorage.removeItem(SESSION_TOKEN_KEY);
  },
  getSessionId(): string | null {
    if (!hasBrowserStorage()) return null;
    return globalThis.localStorage.getItem(SESSION_ID_KEY);
  },
};
