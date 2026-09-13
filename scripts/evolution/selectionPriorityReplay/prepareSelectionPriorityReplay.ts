import { resolve } from 'node:path';
import { prepareSelectionPriorityReplayCorpus } from './selectionPriorityReplay';

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<void> {
  const repoRoot = resolve(option('--repo-root') ?? process.cwd());
  const outputRoot = resolve(option('--output-root') ?? resolve(repoRoot, 'artifacts/ae-selection-priority-replay-v1-20260911'));
  const cases = await prepareSelectionPriorityReplayCorpus({ repoRoot, outputRoot });
  console.log(`Prepared ${cases.length} selection priority replay cases at ${outputRoot}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
