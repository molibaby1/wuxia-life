import { lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  collectWorkflowSummaries,
  renderOperationalRunReportMarkdown,
  type WorkflowSummary,
} from './buildOperationalRunReport';
import {
  OPERATIONAL_RUN_REPORT_SCHEMA_VERSION,
  RUN_REPORTS_ROOT,
  buildOperationalObservabilityIndex,
  parseOperationalRunReport,
  type OperationalRunReportV1,
} from './buildOperationalObservabilityIndex';

const REPORT_ID_PREFIX = 'ae-report-';
const REPORT_ID_HASH_PREFIX_LENGTH = 16;

export interface ArchiveOperationalRunReportInput {
  repositoryRoot: string;
  root: string;
}

export interface ArchiveOperationalRunReportResult {
  reportId: string;
  reportDirectory: string;
  reportJsonPath: string;
  reportMarkdownPath: string;
  createdAt: string;
  reusedCreatedAt: boolean;
  workflowCount: number;
  runReportsIndexPath: string;
  topLevelIndexPath: string;
}

function toRepositoryRelativePath(repositoryRoot: string, absolutePath: string): string {
  const relativePath = relative(repositoryRoot, absolutePath).split(sep).join('/');
  if (!relativePath || relativePath === '..' || relativePath.startsWith('../') || isAbsolute(relativePath)) {
    throw new Error(`--root must resolve inside the repository: ${absolutePath}`);
  }
  return relativePath;
}

function durableWorkflowSemantics(summary: WorkflowSummary): Record<string, unknown> {
  return {
    identity: summary.identity,
    status: summary.status,
    sourceRunRef: summary.sourceRunRef,
    problemStatement: summary.problemStatement,
    solutionStatus: summary.solutionStatus,
    reviewerDecision: summary.reviewerDecision,
    terminalRoute: summary.terminalRoute,
    reason: summary.reason,
    failedStage: summary.failedStage,
    participantErrorKind: summary.participantErrorKind,
    authoritativeModification: summary.authoritativeModification,
    artifactRefs: summary.artifactRefs,
    structuredTerminalDelivery: summary.structuredTerminalDelivery,
  };
}

export function computeOperationalRunReportId(input: {
  sourceRoot: string;
  workflows: WorkflowSummary[];
}): string {
  const digest = sha256Hex(canonicalJson({
    sourceRoot: input.sourceRoot,
    workflows: input.workflows.map(durableWorkflowSemantics),
  }));
  return `${REPORT_ID_PREFIX}${digest.slice(0, REPORT_ID_HASH_PREFIX_LENGTH)}`;
}

function buildReportDocument(input: {
  reportId: string;
  createdAt: string;
  sourceRoot: string;
  workflows: WorkflowSummary[];
}): OperationalRunReportV1 {
  return {
    schemaVersion: OPERATIONAL_RUN_REPORT_SCHEMA_VERSION,
    reportId: input.reportId,
    createdAt: input.createdAt,
    sourceRoot: input.sourceRoot,
    workflowCount: input.workflows.length,
    workflows: input.workflows,
  };
}

async function tryReadExistingCreatedAt(
  reportJsonPath: string,
  reportId: string,
): Promise<string | null> {
  try {
    const existing = parseOperationalRunReport(await readFile(reportJsonPath, 'utf8'), reportId);
    return existing.createdAt;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    // Missing or unreadable prior sidecar → treat as first archive for this identity.
    try {
      await lstat(reportJsonPath);
    } catch (statError) {
      if ((statError as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw statError;
    }
    return null;
  }
}

export async function archiveOperationalRunReport(
  input: ArchiveOperationalRunReportInput,
): Promise<ArchiveOperationalRunReportResult> {
  const repositoryRoot = resolve(input.repositoryRoot);
  const absoluteRoot = resolve(repositoryRoot, input.root);
  const rootStat = await lstat(absoluteRoot).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') throw new Error(`--root does not exist: ${input.root}`);
    throw error;
  });
  if (!rootStat.isDirectory()) throw new Error(`--root must be a directory: ${input.root}`);

  const sourceRoot = toRepositoryRelativePath(repositoryRoot, absoluteRoot);
  const workflows = await collectWorkflowSummaries(absoluteRoot);
  const reportId = computeOperationalRunReportId({ sourceRoot, workflows });
  const reportDirectory = join(repositoryRoot, RUN_REPORTS_ROOT, reportId);
  const reportJsonPath = join(reportDirectory, 'report.json');
  const reportMarkdownPath = join(reportDirectory, 'report.md');

  const existingCreatedAt = await tryReadExistingCreatedAt(reportJsonPath, reportId);
  const createdAt = existingCreatedAt ?? new Date().toISOString();
  const report = buildReportDocument({
    reportId,
    createdAt,
    sourceRoot,
    workflows,
  });
  const markdown = renderOperationalRunReportMarkdown({
    summaries: workflows,
    reportId,
    createdAt,
    includeArtifactRetentionNote: true,
  });

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await writeFile(reportMarkdownPath, markdown, 'utf8');

  const indexes = await buildOperationalObservabilityIndex({ repositoryRoot });

  return {
    reportId,
    reportDirectory,
    reportJsonPath,
    reportMarkdownPath,
    createdAt,
    reusedCreatedAt: existingCreatedAt !== null,
    workflowCount: workflows.length,
    runReportsIndexPath: indexes.runReportsIndexPath,
    topLevelIndexPath: indexes.topLevelIndexPath,
  };
}

function parseCliArgs(args: string[]): ArchiveOperationalRunReportInput {
  let repositoryRoot = process.cwd();
  let root: string | undefined;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--root') {
      const value = args[++index];
      if (!value) throw new Error('--root requires a value');
      root = value;
    } else if (arg === '--repository-root') {
      const value = args[++index];
      if (!value) throw new Error('--repository-root requires a value');
      repositoryRoot = value;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  if (!root) throw new Error('--root is required and must point at the AE workflow/session root to archive');
  return { repositoryRoot, root };
}

const executedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === executedPath) {
  archiveOperationalRunReport(parseCliArgs(process.argv.slice(2)))
    .then(result => {
      console.log(`Archived operational run report: ${result.reportId}`);
      console.log(`Workflows: ${result.workflowCount}`);
      console.log(`Created: ${result.createdAt}${result.reusedCreatedAt ? ' (preserved)' : ''}`);
      console.log(`Wrote ${result.reportJsonPath}`);
      console.log(`Wrote ${result.reportMarkdownPath}`);
      console.log(`Wrote ${result.runReportsIndexPath}`);
      console.log(`Wrote ${result.topLevelIndexPath}`);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
