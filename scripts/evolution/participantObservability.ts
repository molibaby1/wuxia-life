import { mkdir, open } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { canonicalJson } from './phase0/provenance';
import {
  DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
  type WorkspaceAgentParticipantOptions,
} from './problemAgnosticSolution/agentParticipant';

export function buildParticipantBindingReceipt(
  participant: WorkspaceAgentParticipantOptions,
): Record<string, unknown> {
  const modelConfigured = participant.model ?? null;
  return {
    schemaVersion: 'local-participant-binding-v1',
    provider: 'codex-local-subagent',
    bindingId: participant.bindingMetadata?.bindingId ?? null,
    executable: participant.executable,
    executableVersion: participant.bindingMetadata?.executableVersion ?? null,
    modelConfigured,
    modelResolution: modelConfigured === null ? 'HOST_CONFIGURED_UNOBSERVED' : 'EXPLICIT',
    reasoningEffort: participant.reasoningEffort ?? null,
    timeoutMs: participant.timeoutMs ?? DEFAULT_WORKSPACE_AGENT_TIMEOUT_MS,
  };
}

export interface ParticipantObservabilityPersistResult {
  status: 'PASS' | 'FAILED';
  errors: string[];
}

export async function persistParticipantPromptAndBinding(input: {
  destinationRoot: string;
  prompt: string;
  participant: WorkspaceAgentParticipantOptions;
}): Promise<ParticipantObservabilityPersistResult> {
  const root = resolve(input.destinationRoot);
  const errors: string[] = [];
  for (const [path, content] of [
    ['participant-prompt.txt', input.prompt],
    ['participant-binding.json', `${canonicalJson(buildParticipantBindingReceipt(input.participant))}\n`],
  ] as const) {
    try {
      await writeCreateOnly(join(root, path), content);
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { status: errors.length === 0 ? 'PASS' : 'FAILED', errors };
}

async function writeCreateOnly(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(content, 'utf8');
  } finally {
    await handle.close();
  }
}
