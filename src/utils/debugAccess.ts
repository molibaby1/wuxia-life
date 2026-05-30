/**
 * Debug UI is opt-in only. Default player flow never shows debug panels.
 * Enable in local dev: `?debug=1` or `localStorage.setItem('wuxia-debug', '1')`.
 */
export function isPlayerDebugEnabled(): boolean {
  if (import.meta.env.PROD) {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get('debug') === '1') {
    return true;
  }
  try {
    return window.localStorage.getItem('wuxia-debug') === '1';
  } catch {
    return false;
  }
}
