import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assertAuthoritativeFingerprintUnchanged,
  captureAuthoritativeFingerprint,
  prepareAgentWorkspace,
} from '../../scripts/evolution/problemAgnosticSolution/agentWorkspace';
import { isEvolutionWorkspacePathExcluded } from '../../scripts/evolution/workspaceAuthoritySurface';

const AUTHORITY_SURFACE_CASES: Array<{ path: string; excluded: boolean }> = [
  { path: '.agent-workspace-manifest.json', excluded: true },
  { path: 'project.zip', excluded: true },
  { path: 'handoff.ZIP', excluded: true },
  { path: '.git/config', excluded: true },
  { path: '.omx/logs/omx-2026-09-03.jsonl', excluded: true },
  { path: '.superpowers/plans/noise.md', excluded: true },
  { path: 'artifacts/evolution/index.md', excluded: true },
  { path: 'agent_docs/noise.md', excluded: true },
  { path: '.tmp/evolution/noise.txt', excluded: true },
  { path: 'node_modules/pkg/index.js', excluded: true },
  { path: 'dist/bundle.js', excluded: true },
  { path: '.env', excluded: true },
  { path: '.env.local', excluded: true },
  { path: 'public/reports/generated-report.json', excluded: true },
  { path: 'public/reports/generated-report.html', excluded: true },
  { path: 'src/core/runtime.ts', excluded: false },
  { path: 'src/data/lines/family-life.json', excluded: false },
  { path: 'docs/authority.md', excluded: false },
  { path: 'package.json', excluded: false },
  { path: 'public/reports/manifest.json', excluded: false },
  { path: 'public/real-static-asset.ext', excluded: false },
];

async function pathExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') return true;
    return false;
  }
}

async function fixture(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'agent-workspace-fixture-'));
  await mkdir(join(root, 'src'), { recursive: true });
  await mkdir(join(root, 'public/reports'), { recursive: true });
  await mkdir(join(root, 'docs'), { recursive: true });
  await mkdir(join(root, 'skills/repository-grounded-investigation'), { recursive: true });
  await mkdir(join(root, '.git'), { recursive: true });
  await mkdir(join(root, 'node_modules/pkg'), { recursive: true });
  await mkdir(join(root, 'dist'), { recursive: true });
  await mkdir(join(root, '.tmp/evolution/problem-agnostic-agent-solution-loop/old'), { recursive: true });
  await writeFile(join(root, 'src/app.ts'), 'export const app = true;');
  await writeFile(join(root, 'public/real-static-asset.ext'), 'static asset');
  await writeFile(join(root, 'public/reports/generated-report.json'), '{"generated":true}');
  await writeFile(join(root, 'public/reports/generated-report.html'), '<html>generated</html>');
  await writeFile(join(root, 'public/reports/manifest.json'), '{"reports":[]}');
  await writeFile(join(root, 'docs/authority.md'), 'authority');
  await writeFile(
    join(root, 'skills/repository-grounded-investigation/SKILL.md'),
    'repository-grounded investigation method',
  );
  await writeFile(join(root, 'project.zip'), 'human handoff zip bytes v1');
  await writeFile(join(root, 'package.json'), '{}');
  await writeFile(join(root, '.env'), 'SECRET=one');
  await writeFile(join(root, '.env.local'), 'SECRET=two');
  await writeFile(join(root, '.git/config'), 'private');
  await writeFile(join(root, 'node_modules/pkg/index.js'), 'private');
  await writeFile(join(root, 'dist/bundle.js'), 'private');
  await writeFile(join(root, '.tmp/evolution/problem-agnostic-agent-solution-loop/old/secret'), 'private');
  return root;
}

export async function runAgentWorkspaceIsolationTests(): Promise<void> {
  for (const sample of AUTHORITY_SURFACE_CASES) {
    assert.equal(
      isEvolutionWorkspacePathExcluded(sample.path),
      sample.excluded,
      `authority surface mismatch for ${sample.path}`,
    );
  }

  const root = await fixture();
  const destinationRoot = join(root, '.tmp/evolution/problem-agnostic-agent-solution-loop');
  const initialFingerprint = await captureAuthoritativeFingerprint(root);
  const solution = await prepareAgentWorkspace({
    authoritativeRoot: root,
    destinationRoot,
    jobKind: 'solution',
  });
  assert.equal(await pathExists(join(solution.workspaceRoot, 'src/app.ts')), true);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'public/real-static-asset.ext')), true);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'public/reports/generated-report.json')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'public/reports/generated-report.html')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'public/reports/manifest.json')), true);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'docs/authority.md')), true);
  assert.equal(
    await pathExists(join(solution.workspaceRoot, 'skills/repository-grounded-investigation/SKILL.md')),
    true,
  );
  assert.equal(await pathExists(join(solution.workspaceRoot, 'project.zip')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, '.env')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, '.env.local')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, '.git/config')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'node_modules/pkg/index.js')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, 'dist/bundle.js')), false);
  assert.equal(await pathExists(join(solution.workspaceRoot, '.tmp/evolution/problem-agnostic-agent-solution-loop/old/secret')), false);
  const manifest = JSON.parse(await readFile(solution.manifestPath, 'utf8')) as { jobKind: string; entries: Array<{ path: string }> };
  assert.equal(manifest.jobKind, 'solution');
  assert.equal(manifest.entries.some(entry => entry.path === 'public/reports/manifest.json'), true);
  assert.equal(manifest.entries.some(entry => entry.path === 'public/reports/generated-report.json'), false);
  assert.equal(manifest.entries.some(entry => entry.path === 'public/reports/generated-report.html'), false);
  assert.equal(manifest.entries.some(entry => entry.path === 'public/real-static-asset.ext'), true);
  assert.equal(
    manifest.entries.some(entry => entry.path === 'skills/repository-grounded-investigation/SKILL.md'),
    true,
  );
  assert.equal(manifest.entries.some(entry => entry.path === 'project.zip'), false);
  await writeFile(join(root, 'public/reports/generated-report.json'), '{"generated":false,"changed":true}');
  assert.equal(await captureAuthoritativeFingerprint(root), initialFingerprint);
  await assertAuthoritativeFingerprintUnchanged(root, solution.authoritativeFingerprintSha256);
  await writeFile(join(root, 'public/reports/generated-report.html'), '<html>changed</html>');
  assert.equal(await captureAuthoritativeFingerprint(root), initialFingerprint);
  await writeFile(join(root, 'project.zip'), 'human handoff zip bytes v2');
  assert.equal(await captureAuthoritativeFingerprint(root), initialFingerprint);
  await assertAuthoritativeFingerprintUnchanged(root, solution.authoritativeFingerprintSha256);
  await writeFile(join(root, 'public/reports/manifest.json'), '{"reports":["changed"]}');
  assert.notEqual(await captureAuthoritativeFingerprint(root), initialFingerprint);
  await writeFile(join(root, 'public/reports/manifest.json'), '{"reports":[]}');
  await assertAuthoritativeFingerprintUnchanged(root, solution.authoritativeFingerprintSha256);
  await writeFile(join(root, 'src/app.ts'), 'export const app = false;');
  assert.notEqual(await captureAuthoritativeFingerprint(root), initialFingerprint);
  await writeFile(join(root, 'src/app.ts'), 'export const app = true;');

  await writeFile(join(solution.workspaceRoot, 'src/app.ts'), 'sandbox-only-change');
  const reviewer = await prepareAgentWorkspace({
    authoritativeRoot: root,
    destinationRoot,
    jobKind: 'reviewer',
  });
  assert.equal(solution.workspaceBaselineFingerprintSha256, reviewer.workspaceBaselineFingerprintSha256);
  assert.notEqual(await readFile(join(reviewer.workspaceRoot, 'src/app.ts'), 'utf8'), 'sandbox-only-change');
}

export async function runNestedAgentWorkspaceMaterializationTest(): Promise<void> {
  const authoritativeRoot = await fixture();
  const evolution = await prepareAgentWorkspace({
    authoritativeRoot,
    destinationRoot: join(authoritativeRoot, '.tmp/nested-evolution'),
    jobKind: 'evolution',
  });
  const evolutionManifest = JSON.parse(await readFile(evolution.manifestPath, 'utf8')) as {
    jobKind: string;
    entries: Array<{ path: string }>;
  };
  const evolutionFingerprint = await captureAuthoritativeFingerprint(evolution.workspaceRoot);
  evolutionManifest.jobKind = 'evolution-with-parent-metadata';
  await writeFile(evolution.manifestPath, `${JSON.stringify(evolutionManifest)}\n`);
  assert.equal(await captureAuthoritativeFingerprint(evolution.workspaceRoot), evolutionFingerprint);

  const solution = await prepareAgentWorkspace({
    authoritativeRoot: evolution.workspaceRoot,
    destinationRoot: join(authoritativeRoot, '.tmp/nested-solution'),
    jobKind: 'solution',
  });
  const solutionManifestText = await readFile(solution.manifestPath, 'utf8');
  const solutionManifest = JSON.parse(solutionManifestText) as {
    jobKind: string;
    entries: Array<{ path: string }>;
  };
  assert.equal(await pathExists(solution.manifestPath), true);
  assert.equal(solutionManifest.jobKind, 'solution');
  assert.notEqual(solutionManifestText, await readFile(evolution.manifestPath, 'utf8'));
  assert.equal(await pathExists(join(solution.workspaceRoot, 'src/app.ts')), true);
  assert.equal(solutionManifest.entries.some(entry => entry.path === '.agent-workspace-manifest.json'), false);
  assert.equal(solution.authoritativeFingerprintSha256, evolutionFingerprint);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAgentWorkspaceIsolationTests()
    .then(() => runNestedAgentWorkspaceMaterializationTest())
    .then(() => console.log('agentWorkspaceIsolation.test.ts: ok'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
