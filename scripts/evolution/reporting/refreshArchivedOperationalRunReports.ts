import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildOperationalObservabilityIndex,
  parseOperationalRunReport,
  RUN_REPORTS_ROOT,
} from './buildOperationalObservabilityIndex';
import { renderOperationalRunReportMarkdownFromReport } from './buildOperationalRunReport';

export async function refreshArchivedOperationalRunReports(input: {
  repositoryRoot: string;
}): Promise<{ refreshedCount: number; runReportsIndexPath: string; topLevelIndexPath: string }> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const reportsRoot = join(repositoryRoot, RUN_REPORTS_ROOT);
  let refreshedCount = 0;
  let entries;
  try {
    entries = await readdir(reportsRoot, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const indexes = await buildOperationalObservabilityIndex({ repositoryRoot });
      return { refreshedCount, ...indexes };
    }
    throw error;
  }

  for (const entry of entries.filter(item => item.isDirectory()).sort((left, right) => left.name.localeCompare(right.name))) {
    const reportJsonPath = join(reportsRoot, entry.name, 'report.json');
    const report = parseOperationalRunReport(await readFile(reportJsonPath, 'utf8'), entry.name);
    const markdown = renderOperationalRunReportMarkdownFromReport({
      reportId: report.reportId,
      createdAt: report.createdAt,
      workflows: report.workflows,
      ...(report.schemaVersion === 'auto-evolution-operational-run-report-v1' ? {} : { sessionExecution: report.sessionExecution }),
    });
    await writeFile(join(reportsRoot, entry.name, 'report.md'), markdown, 'utf8');
    refreshedCount += 1;
  }

  const indexes = await buildOperationalObservabilityIndex({ repositoryRoot });
  return { refreshedCount, ...indexes };
}
function parseCliArgs(args: string[]): { repositoryRoot: string } {
  let repositoryRoot = process.cwd();
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== '--repository-root') throw new Error(`unknown argument: ${args[index]}`);
    const value = args[++index];
    if (!value) throw new Error('--repository-root requires a value');
    repositoryRoot = value;
  }
  return { repositoryRoot };
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  refreshArchivedOperationalRunReports(parseCliArgs(process.argv.slice(2)))
    .then(result => {
      console.log(`Refreshed ${result.refreshedCount} archived run report(s)`);
      console.log(`Wrote ${result.runReportsIndexPath}`);
      console.log(`Wrote ${result.topLevelIndexPath}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
