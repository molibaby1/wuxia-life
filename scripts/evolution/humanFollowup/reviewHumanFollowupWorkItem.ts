import { randomUUID } from 'node:crypto';
import { lstat, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildHumanFollowupInbox } from './buildHumanFollowupInbox';
import {
  canTransitionHumanFollowupStatus,
  parseHumanFollowupWorkItem,
  validateHumanFollowupWorkItem,
  type HumanFollowupStatus,
  type HumanFollowupWorkItemV1,
} from '../../../src/evolution/humanFollowupWorkItemContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';

export interface ReviewHumanFollowupWorkItemInput {
  repositoryRoot: string;
  itemId: string;
  toStatus: HumanFollowupStatus;
  note: string;
  formalTaskRef?: string;
  now?: () => string;
}

const ITEM_ROOT = 'artifacts/evolution/human-follow-up/items';

async function verifyEvidence(itemPath: string, item: HumanFollowupWorkItemV1): Promise<void> {
  const itemDirectory = dirname(itemPath);
  for (const entry of item.evidence) {
    const evidencePath = join(itemDirectory, 'evidence', entry.relativePath);
    const stat = await lstat(evidencePath);
    if (!stat.isFile()) throw new Error(`retained evidence is not a regular file: ${entry.relativePath}`);
    if (sha256Hex(await readFile(evidencePath)) !== entry.sha256) {
      throw new Error(`retained evidence hash mismatch: ${entry.relativePath}`);
    }
  }
}

export async function reviewHumanFollowupWorkItem(
  input: ReviewHumanFollowupWorkItemInput,
): Promise<HumanFollowupWorkItemV1> {
  if (!/^item-[a-f0-9]{64}$/.test(input.itemId)) throw new Error('itemId must use the deterministic item-<sha256> format');
  if (input.note.length === 0) throw new Error('note must be a non-empty string');
  if (input.toStatus === 'CONVERTED') {
    if (input.formalTaskRef === undefined || input.formalTaskRef.length === 0) {
      throw new Error('formalTaskRef is required when converting a Human follow-up item');
    }
  } else if (input.formalTaskRef !== undefined) {
    throw new Error('formalTaskRef is only allowed when converting a Human follow-up item');
  }

  const itemPath = join(resolve(input.repositoryRoot), ITEM_ROOT, input.itemId, 'item.json');
  let item: HumanFollowupWorkItemV1;
  try {
    item = parseHumanFollowupWorkItem(await readFile(itemPath, 'utf8'));
  } catch (error) {
    throw new Error(`Human follow-up item is invalid: ${String(error)}`);
  }
  await verifyEvidence(itemPath, item);
  if (!canTransitionHumanFollowupStatus(item.status, input.toStatus)) {
    throw new Error(`invalid Human follow-up status transition: ${item.status} -> ${input.toStatus}`);
  }

  const reviewedAt = (input.now ?? (() => new Date().toISOString()))();
  const nextItem = validateHumanFollowupWorkItem({
    ...item,
    updatedAt: reviewedAt,
    status: input.toStatus,
    reviewHistory: [
      ...item.reviewHistory,
      {
        reviewedAt,
        fromStatus: item.status,
        toStatus: input.toStatus,
        note: input.note,
      },
    ],
    formalTaskRef: input.toStatus === 'CONVERTED' ? input.formalTaskRef : null,
  });

  const temporaryPath = join(dirname(itemPath), `.item.json.${randomUUID()}.tmp`);
  try {
    await writeFile(temporaryPath, `${canonicalJson(nextItem)}\n`, { flag: 'wx' });
    await rename(temporaryPath, itemPath);
  } finally {
    await rm(temporaryPath, { force: true });
  }

  try {
    await buildHumanFollowupInbox({ repositoryRoot: resolve(input.repositoryRoot) });
  } catch {
    // Canonical item JSON is authoritative; a derived Inbox can be rebuilt later.
  }
  return nextItem;
}

function parseCliArgs(args: string[]): {
  repositoryRoot: string;
  itemId: string;
  toStatus: HumanFollowupStatus;
  note: string;
  formalTaskRef?: string;
} {
  let repositoryRoot = process.cwd();
  let itemId: string | undefined;
  let toStatus: HumanFollowupStatus | undefined;
  let note: string | undefined;
  let formalTaskRef: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[++index];
    if (!value) throw new Error(`${arg} requires a value`);
    if (arg === '--root') repositoryRoot = value;
    else if (arg === '--item-id') itemId = value;
    else if (arg === '--status') toStatus = value as HumanFollowupStatus;
    else if (arg === '--note') note = value;
    else if (arg === '--formal-task-ref') formalTaskRef = value;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!itemId || !toStatus || note === undefined) throw new Error('--item-id, --status, and --note are required');
  return {
    repositoryRoot,
    itemId,
    toStatus,
    note,
    ...(formalTaskRef === undefined ? {} : { formalTaskRef }),
  };
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  reviewHumanFollowupWorkItem(parseCliArgs(process.argv.slice(2)))
    .then(item => console.log(JSON.stringify(item)))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
