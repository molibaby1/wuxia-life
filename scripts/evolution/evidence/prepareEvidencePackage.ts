import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { canonicalJson } from '../phase0/provenance';
import {
  buildDurableEvidenceIndex,
  DURABLE_EVIDENCE_INDEX_PATH,
  DURABLE_EVIDENCE_PACKAGE_METADATA_PATH,
  loadValidDurableEvidenceCapsules,
  selectDurableEvidenceCapsules,
} from './durableEvidenceIndex';

interface Arguments {
  repositoryRoot: string;
  selectionFile: string;
  explicitSessionIds: string[];
}

function parseArgs(args: string[]): Arguments {
  let repositoryRoot = process.cwd();
  let selectionFile: string | undefined;
  const explicitSessionIds: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--repository-root') repositoryRoot = args[++index] ?? (() => { throw new Error('--repository-root requires a value'); })();
    else if (arg === '--selection-file') selectionFile = args[++index] ?? (() => { throw new Error('--selection-file requires a value'); })();
    else if (arg === '--include-capsule') explicitSessionIds.push(args[++index] ?? (() => { throw new Error('--include-capsule requires a value'); })());
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!selectionFile) throw new Error('--selection-file is required');
  return { repositoryRoot: resolve(repositoryRoot), selectionFile: resolve(selectionFile), explicitSessionIds };
}

async function listFiles(root: string, current = ''): Promise<string[]> {
  const entries = (await readdir(join(root, current), { withFileTypes: true }))
    .sort((left, right) => left.name.localeCompare(right.name));
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = current ? `${current}/${entry.name}` : entry.name;
    const path = join(root, relativePath);
    if (entry.isDirectory()) files.push(...await listFiles(root, relativePath));
    else if (entry.isFile()) files.push(path);
    else throw new Error(`selected Capsule contains unsupported filesystem entry: ${path}`);
  }
  return files;
}

export async function prepareEvidencePackage(input: Arguments): Promise<void> {
  const capsules = await loadValidDurableEvidenceCapsules(input.repositoryRoot);
  const selected = selectDurableEvidenceCapsules({ capsules, explicitSessionIds: input.explicitSessionIds });
  const builtIndex = await buildDurableEvidenceIndex({ repositoryRoot: input.repositoryRoot });
  const paths = [DURABLE_EVIDENCE_INDEX_PATH, DURABLE_EVIDENCE_PACKAGE_METADATA_PATH];
  for (const capsule of selected) {
    for (const file of await listFiles(capsule.root)) {
      paths.push(relative(input.repositoryRoot, file).split(sep).join('/'));
    }
  }
  const metadata = {
    schemaVersion: 'durable-evidence-package-v1',
    defaultRecentCount: 5,
    locallyKnownCapsuleCount: builtIndex.index.capsuleCount,
    includedCapsuleCount: selected.length,
    includedSessionIds: selected.map(capsule => ({ sessionId: capsule.manifest.sessionId, reason: capsule.reason })),
    includedEvidenceBytes: selected.reduce((total, capsule) => total + capsule.capsuleBytes, 0),
  };
  await mkdir(resolve(input.repositoryRoot, DURABLE_EVIDENCE_PACKAGE_METADATA_PATH, '..'), { recursive: true });
  await writeFile(resolve(input.repositoryRoot, DURABLE_EVIDENCE_PACKAGE_METADATA_PATH), `${canonicalJson(metadata)}\n`, 'utf8');
  await writeFile(input.selectionFile, `${paths.join('\n')}\n`, 'utf8');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  prepareEvidencePackage(parseArgs(process.argv.slice(2)))
    .then(() => console.log('Prepared Durable Evidence package selection'))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
