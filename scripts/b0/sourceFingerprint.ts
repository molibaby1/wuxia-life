import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { sha256Hex } from './hash';

export type SourceFingerprint = {
  headSha: string;
  branch: string;
  statusPorcelainHash: string;
  dirtyDiffHash: string;
  pathSha256ManifestHash: string;
  baselineDirHint: string;
  baselineDirtyDiffHash: string;
  dirtyMatchesBaseline: boolean;
  frozenAt: string;
};

const DEFAULT_BASELINE = '/tmp/wuxia-life-b0-baseline-20260811-145828';

export function captureSourceFingerprint(baselineDir = DEFAULT_BASELINE): SourceFingerprint {
  if (!existsSync(`${baselineDir}/dirty.diff`)) {
    throw new Error(`B0_BLOCKED: dirty baseline missing at ${baselineDir}`);
  }

  const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim();
  const status = execFileSync('git', ['status', '--porcelain=v1'], { encoding: 'utf8' });
  const liveDiff = execFileSync('git', ['diff'], { encoding: 'utf8' });
  const baselineDiffHash = sha256Hex(readFileSync(`${baselineDir}/dirty.diff`));
  const liveDiffHash = sha256Hex(liveDiff);
  const pathManifest = readFileSync(`${baselineDir}/path-sha256.txt`);

  return {
    headSha,
    branch,
    statusPorcelainHash: sha256Hex(status),
    dirtyDiffHash: liveDiffHash,
    pathSha256ManifestHash: sha256Hex(pathManifest),
    baselineDirHint: baselineDir,
    baselineDirtyDiffHash: baselineDiffHash,
    dirtyMatchesBaseline: liveDiffHash === baselineDiffHash,
    frozenAt: new Date().toISOString(),
  };
}
