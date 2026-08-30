import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseHumanFollowupWorkItem,
  type HumanFollowupStatus,
  type HumanFollowupWorkItemV1,
} from '../../../src/evolution/humanFollowupWorkItemContract';
import { sha256Hex } from '../phase0/provenance';

export interface BuildHumanFollowupInboxInput {
  repositoryRoot: string;
  outputPath?: string;
}

const ITEM_ROOT = 'artifacts/evolution/human-follow-up/items';
const ACTIVE_STATUSES: readonly HumanFollowupStatus[] = [
  'OPEN',
  'INVESTIGATING',
  'READY_FOR_FORMAL_TASK',
];

async function tryLstat(path: string): Promise<Awaited<ReturnType<typeof lstat>> | null> {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function verifyEvidence(itemPath: string, item: HumanFollowupWorkItemV1): Promise<void> {
  const itemDirectory = dirname(itemPath);
  for (const entry of item.evidence) {
    const evidencePath = join(itemDirectory, 'evidence', entry.relativePath);
    const stat = await tryLstat(evidencePath);
    if (!stat || !stat.isFile()) {
      throw new Error(`retained evidence is missing or not a regular file: ${entry.relativePath}`);
    }
    if (sha256Hex(await readFile(evidencePath)) !== entry.sha256) {
      throw new Error(`retained evidence hash mismatch: ${entry.relativePath}`);
    }
  }
}

async function readCanonicalItems(itemsRoot: string): Promise<HumanFollowupWorkItemV1[]> {
  const rootStat = await tryLstat(itemsRoot);
  if (!rootStat) return [];
  if (!rootStat.isDirectory()) throw new Error('Human follow-up items root must be a directory');
  const items: HumanFollowupWorkItemV1[] = [];
  for (const entry of await readdir(itemsRoot, { withFileTypes: true })) {
    if (entry.name.startsWith('.staging-')) {
      throw new Error(`Human follow-up items root contains staging state: ${entry.name}`);
    }
    if (!entry.isDirectory()) throw new Error(`Human follow-up item entry must be a directory: ${entry.name}`);
    const itemPath = join(itemsRoot, entry.name, 'item.json');
    const itemStat = await tryLstat(itemPath);
    if (!itemStat || !itemStat.isFile()) throw new Error(`Human follow-up item is missing item.json: ${entry.name}`);
    let item: HumanFollowupWorkItemV1;
    try {
      item = parseHumanFollowupWorkItem(await readFile(itemPath, 'utf8'));
    } catch (error) {
      throw new Error(`Human follow-up item ${entry.name} is invalid: ${String(error)}`);
    }
    if (item.itemId !== entry.name) throw new Error(`Human follow-up item directory does not match itemId: ${entry.name}`);
    await verifyEvidence(itemPath, item);
    items.push(item);
  }
  return items;
}

function markdownCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\r', ' ').replaceAll('\n', ' ');
}

function buildMarkdown(items: HumanFollowupWorkItemV1[]): string {
  const counts = {
    active: items.filter(item => ACTIVE_STATUSES.includes(item.status)).length,
    deferred: items.filter(item => item.status === 'DEFERRED').length,
    rejected: items.filter(item => item.status === 'REJECTED').length,
    converted: items.filter(item => item.status === 'CONVERTED').length,
    total: items.length,
  };
  const activeItems = items
    .filter(item => ACTIVE_STATUSES.includes(item.status))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.itemId.localeCompare(right.itemId));
  const lines = [
    '# Human Follow-up Inbox',
    '',
    '## Summary',
    '',
    `- active: ${counts.active}`,
    `- deferred: ${counts.deferred}`,
    `- rejected: ${counts.rejected}`,
    `- converted: ${counts.converted}`,
    `- total: ${counts.total}`,
    '',
    '## Active items',
    '',
    '| itemId | status | problem | trigger | source run | createdAt |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  if (activeItems.length === 0) {
    lines.push('| *(none)* |  |  |  |  |  |');
  } else {
    for (const item of activeItems) {
      lines.push(
        `| ${markdownCell(item.itemId)} | ${item.status} | ${markdownCell(item.problem.statement)} | ${item.trigger.reasonCode} | ${markdownCell(item.provenance.sourceRunRef)} | ${item.createdAt} |`,
      );
    }
  }
  lines.push('', 'This is a derived view of canonical Human follow-up item JSON. It does not authorize implementation or execution.', '');
  return lines.join('\n');
}

export async function buildHumanFollowupInbox(input: BuildHumanFollowupInboxInput): Promise<string> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const outputPath = resolve(input.outputPath ?? join(repositoryRoot, 'artifacts/evolution/human-follow-up/index.md'));
  const items = await readCanonicalItems(join(repositoryRoot, ITEM_ROOT));
  const content = buildMarkdown(items);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content);
  return outputPath;
}

function parseCliArgs(args: string[]): { repositoryRoot: string; outputPath?: string } {
  let repositoryRoot = process.cwd();
  let outputPath: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      const value = args[++index];
      if (!value) throw new Error('--root requires a value');
      repositoryRoot = value;
    } else if (arg === '--output') {
      const value = args[++index];
      if (!value) throw new Error('--output requires a value');
      outputPath = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { repositoryRoot, ...(outputPath === undefined ? {} : { outputPath }) };
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  buildHumanFollowupInbox(parseCliArgs(process.argv.slice(2)))
    .then(path => console.log(path))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
