/**
 * 真实测试门禁共享策略（无副效应；可被其他 runner import）。
 */

export const GATE_BLOCKER_SUBSTRINGS = [
  'Failed to evaluate expression',
  'ReferenceError',
  'Unknown stat',
  'localstorage-file invalid path',
] as const;

export function findBlockerKeywordInLog(log: string): (typeof GATE_BLOCKER_SUBSTRINGS)[number] | undefined {
  for (const s of GATE_BLOCKER_SUBSTRINGS) {
    if (log.includes(s)) return s;
  }
  return undefined;
}

/** 子进程不继承 NODE_OPTIONS，避免宿主/IDE 注入的 Web Storage 相关标志污染门禁日志 */
export function gateChildEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  return env;
}
