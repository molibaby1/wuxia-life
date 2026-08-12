import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Hex } from './hash';

export type SourceFreezeContract = {
  schemaVersion: 'b0-source-freeze-v1';
  expectedHeadSha: string;
  expectedBranch: string;
  allowedPathGlobs: string[];
};

export type SourceFingerprint = {
  expectedHeadSha: string;
  expectedBranch: string;
  liveHeadSha: string;
  liveBranch: string;
  trackedDiffHash: string;
  untrackedPathHashes: Record<string, string>;
  allowedPathGlobs: string[];
  matches: boolean;
  mismatchReasons: string[];
  frozenAt: string;
};

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONTRACT_PATH = join(HERE, 'fixtures', 'source-freeze.contract.json');

export function loadSourceFreezeContract(
  contractPath = DEFAULT_CONTRACT_PATH,
): SourceFreezeContract {
  if (!existsSync(contractPath)) {
    throw new Error(`B0_BLOCKED: source freeze contract missing at ${contractPath}`);
  }
  return JSON.parse(readFileSync(contractPath, 'utf8')) as SourceFreezeContract;
}

export function pathMatchesAllowlist(path: string, globs: string[]): boolean {
  const normalized = path.replace(/^\.\//, '');
  return globs.some(glob => {
    if (glob.endsWith('/**')) {
      const prefix = glob.slice(0, -3);
      return normalized === prefix || normalized.startsWith(`${prefix}/`);
    }
    return normalized === glob;
  });
}

function parsePorcelainPaths(status: string): string[] {
  const paths: string[] = [];
  for (const line of status.split('\n')) {
    if (!line.trim()) continue;
    // XY PATH or XY ORIG -> PATH
    const body = line.slice(3);
    if (body.includes(' -> ')) {
      paths.push(body.split(' -> ').pop()!.trim());
    } else {
      paths.push(body.trim());
    }
  }
  return paths;
}

function collectUntrackedHashes(paths: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const path of paths.sort()) {
    if (!existsSync(path)) {
      out[path] = 'missing';
      continue;
    }
    try {
      out[path] = sha256Hex(readFileSync(path));
    } catch {
      // directories or unreadable entries still freeze the path identity
      out[path] = `unreadable:${path}`;
    }
  }
  return out;
}

/**
 * Exact HEAD match, or descendant of the freeze tip whose commit range only
 * touches allowlisted paths (so advancing the freeze contract itself is possible).
 */
function explainHeadMismatch(
  liveHeadSha: string,
  expectedHeadSha: string,
  allowedPathGlobs: string[],
): string | null {
  if (liveHeadSha === expectedHeadSha) return null;
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', expectedHeadSha, liveHeadSha], {
      stdio: 'ignore',
    });
  } catch {
    return `HEAD mismatch: live=${liveHeadSha} expected=${expectedHeadSha}`;
  }
  const changed = execFileSync('git', ['diff', '--name-only', `${expectedHeadSha}..${liveHeadSha}`], {
    encoding: 'utf8',
  })
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const blocked = changed.filter(path => !pathMatchesAllowlist(path, allowedPathGlobs));
  if (blocked.length > 0) {
    return `HEAD advanced beyond freeze with non-allowlisted paths: ${blocked.join(',')}`;
  }
  return null;
}

export function captureSourceFingerprint(options?: {
  contractPath?: string;
  contract?: SourceFreezeContract;
  /** Test-only override of live HEAD/branch. */
  liveHeadSha?: string;
  liveBranch?: string;
}): SourceFingerprint {
  const contract = options?.contract ?? loadSourceFreezeContract(options?.contractPath);
  const liveHeadSha =
    options?.liveHeadSha ??
    execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const liveBranch =
    options?.liveBranch ??
    execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();

  const trackedDiff = [
    execFileSync('git', ['diff', 'HEAD'], { encoding: 'utf8' }),
    execFileSync('git', ['diff', '--cached'], { encoding: 'utf8' }),
  ].join('\n');
  const trackedDiffHash = sha256Hex(trackedDiff);

  const status = execFileSync('git', ['status', '--porcelain=v1'], { encoding: 'utf8' });
  const dirtyPaths = parsePorcelainPaths(status);
  const untrackedPaths = status
    .split('\n')
    .filter(line => line.startsWith('?? '))
    .map(line => line.slice(3).trim());
  const untrackedPathHashes = collectUntrackedHashes(untrackedPaths);

  const mismatchReasons: string[] = [];
  const headReason = explainHeadMismatch(
    liveHeadSha,
    contract.expectedHeadSha,
    contract.allowedPathGlobs,
  );
  if (headReason) mismatchReasons.push(headReason);
  if (liveBranch !== contract.expectedBranch) {
    mismatchReasons.push(
      `branch mismatch: live=${liveBranch} expected=${contract.expectedBranch}`,
    );
  }
  for (const path of dirtyPaths) {
    if (!pathMatchesAllowlist(path, contract.allowedPathGlobs)) {
      mismatchReasons.push(`dirty path outside allowlist: ${path}`);
    }
  }

  return {
    expectedHeadSha: contract.expectedHeadSha,
    expectedBranch: contract.expectedBranch,
    liveHeadSha,
    liveBranch,
    trackedDiffHash,
    untrackedPathHashes,
    allowedPathGlobs: [...contract.allowedPathGlobs],
    matches: mismatchReasons.length === 0,
    mismatchReasons,
    frozenAt: new Date().toISOString(),
  };
}
