import {
  B0_ALLOWED_CANDIDATE_PATH_GLOBS,
  B0_FORBIDDEN_PATH_GLOBS,
} from './types';

export type PatchScopeResult = {
  ok: boolean;
  code?: 'out_of_scope' | 'forbidden_path';
  path?: string;
  detail?: string;
};

function matchGlob(path: string, glob: string): boolean {
  // ponytail: only ** suffix / exact; enough for B0 allow/forbid lists
  if (glob.endsWith('/**')) {
    const prefix = glob.slice(0, -3);
    return path === prefix || path.startsWith(`${prefix}/`);
  }
  return path === glob;
}

export function validateProposedPaths(proposedPaths: string[]): PatchScopeResult {
  for (const path of proposedPaths) {
    for (const forbidden of B0_FORBIDDEN_PATH_GLOBS) {
      if (matchGlob(path, forbidden)) {
        return {
          ok: false,
          code: 'forbidden_path',
          path,
          detail: `path hits forbidden glob ${forbidden}`,
        };
      }
    }
    const allowed = B0_ALLOWED_CANDIDATE_PATH_GLOBS.some(glob => matchGlob(path, glob));
    if (!allowed) {
      return {
        ok: false,
        code: 'out_of_scope',
        path,
        detail: 'path outside allowedCandidatePaths',
      };
    }
  }
  return { ok: true };
}
