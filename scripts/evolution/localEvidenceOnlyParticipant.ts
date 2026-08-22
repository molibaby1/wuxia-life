import { mkdir, open } from 'node:fs/promises';
import { sha256Hex, canonicalJson } from './phase0/provenance';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import {
  runWorkspaceAgentJob,
  type WorkspaceAgentParticipantOptions,
} from './problemAgnosticSolution/agentParticipant';

export type EvidenceOnlyParticipantRole = 'feedback' | 'hypothesis';

export interface CreateEvidenceOnlyWorkspaceInput {
  workspaceRoot: string;
  files: Record<string, string | Uint8Array>;
}

export interface EvidenceOnlyWorkspaceManifest {
  workspaceRoot: string;
  files: string[];
  manifestPath: string;
  manifestSha256: string;
}

export interface RunLocalEvidenceOnlyParticipantInput {
  invocationRef: string;
  role: EvidenceOnlyParticipantRole;
  workspaceRoot: string;
  prompt: string;
  participant: WorkspaceAgentParticipantOptions;
}

export interface LocalEvidenceOnlyParticipantSuccess {
  ok: true;
  rawParticipantResponse: string;
}

export interface LocalEvidenceOnlyParticipantFailure {
  ok: false;
  errorKind: 'runtime_unavailable' | 'process' | 'timeout';
  message: string;
  rawProviderResponse?: string;
}

export type LocalEvidenceOnlyParticipantResult =
  | LocalEvidenceOnlyParticipantSuccess
  | LocalEvidenceOnlyParticipantFailure;

function resolveWorkspaceFile(workspaceRoot: string, relativePath: string): string {
  if (!relativePath || isAbsolute(relativePath)) {
    throw new Error(`evidence-only input must be a relative file path: ${relativePath}`);
  }
  const root = resolve(workspaceRoot);
  const target = resolve(root, relativePath);
  const escaped = relative(root, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`evidence-only input escapes workspace: ${relativePath}`);
  }
  return target;
}

async function writeCreateOnly(path: string, value: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(value);
  } finally {
    await handle.close();
  }
}

export async function createEvidenceOnlyWorkspace(
  input: CreateEvidenceOnlyWorkspaceInput,
): Promise<EvidenceOnlyWorkspaceManifest> {
  await mkdir(resolve(input.workspaceRoot), { recursive: false });
  const files = Object.keys(input.files).sort();
  const manifestFiles = files.map(path => ({
    path,
    sha256: sha256Hex(input.files[path]!),
  }));
  for (const relativePath of files) {
    await writeCreateOnly(resolveWorkspaceFile(input.workspaceRoot, relativePath), input.files[relativePath]!);
  }
  const manifestPath = resolveWorkspaceFile(input.workspaceRoot, '.evidence-only-manifest.json');
  const manifestBytes = `${canonicalJson({
    schemaVersion: 'evidence-only-workspace-manifest-v1',
    files: manifestFiles,
  })}\n`;
  await writeCreateOnly(manifestPath, manifestBytes);
  return {
    workspaceRoot: resolve(input.workspaceRoot),
    files,
    manifestPath,
    manifestSha256: sha256Hex(manifestBytes),
  };
}

export async function runLocalEvidenceOnlyParticipant(
  input: RunLocalEvidenceOnlyParticipantInput,
): Promise<LocalEvidenceOnlyParticipantResult> {
  const result = await runWorkspaceAgentJob(
    {
      invocationRef: input.invocationRef,
      role: input.role,
      workspaceRoot: resolve(input.workspaceRoot),
      prompt: input.prompt,
    },
    input.participant,
  );
  if (!result.ok) {
    return {
      ok: false,
      errorKind: result.errorKind === 'invalid_output' ? 'process' : result.errorKind,
      message: result.message,
      ...(result.rawOutput !== undefined ? { rawProviderResponse: result.rawOutput } : {}),
    };
  }
  return { ok: true, rawParticipantResponse: result.rawOutput };
}
