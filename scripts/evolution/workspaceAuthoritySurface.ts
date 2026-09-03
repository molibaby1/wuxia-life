import { sep } from 'node:path';

/**
 * Canonical Evolution workspace authority-surface exclusion predicate.
 *
 * Extracted verbatim from agentWorkspace materialization/fingerprinting.
 * Paths matching this predicate are outside the authoritative product/config
 * surface: they are neither copied into agent workspaces nor counted by
 * execution scope snapshots.
 *
 * This is NOT gitignore matching and NOT write-permission expansion.
 */
export function isEvolutionWorkspacePathExcluded(relativePath: string): boolean {
  const path = relativePath.split(sep).join('/');
  if (!path) return false;
  if (path === '.agent-workspace-manifest.json') return true;
  if (path.toLowerCase().endsWith('.zip')) return true;
  if (
    path === '.tmp/evolution/problem-agnostic-agent-solution-loop'
    || path.startsWith('.tmp/evolution/problem-agnostic-agent-solution-loop/')
  ) return true;
  if (
    path.startsWith('public/reports/')
    && path !== 'public/reports/manifest.json'
    && (path.endsWith('.html') || path.endsWith('.json'))
  ) return true;
  if (path === '.tmp/evolution' || path.startsWith('.tmp/evolution/')) return true;
  return path.split('/').some(part =>
    part === '.git'
    || part === '.omx'
    || part === '.superpowers'
    || part === 'artifacts'
    || part === 'agent_docs'
    || part === '.tmp'
    || part === 'node_modules'
    || part === 'dist'
    || part === '.env'
    || part.startsWith('.env.'));
}
