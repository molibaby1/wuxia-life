import { lstat, mkdir, open, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep, join } from 'node:path';
import {
  validateProblemPackage,
  type ProblemPackage,
} from '../../../src/evolution/problemPackageContract';
import {
  validateSolutionWork,
  type SolutionWorkV1,
} from '../../../src/evolution/solutionWorkContract';
import { renderStructuredFinalOutputContractV1 } from '../../../src/evolution/participantStructuredOutputContract';
import { canonicalJson, sha256Hex } from '../phase0/provenance';
import {
  type WorkspaceAgentJobFailure,
  type WorkspaceAgentParticipantOptions,
} from './agentParticipant';
import { isEnvelopeRetransmissionEnabledForRole } from './envelopeRetransmission';
import { runStructuredParticipantExecution } from './runStructuredParticipantExecution';
import { assertRepoReferenceFile } from './repoReference';
import {
  loadParticipantSkills,
  type ParticipantSkillAssignment,
  type DeliveredParticipantSkill,
} from './solutionParticipantSkills';

export interface RunSolutionAgentInput {
  problemPackage: ProblemPackage;
  problemPackagePath: string;
  workspaceRoot: string;
  artifactRoot: string;
  workspaceBaselineFingerprintSha256: string;
  invocationRef: string;
  jobNumber: number;
  destinationRoot: string;
  skillAssignments: readonly ParticipantSkillAssignment[];
  participant: WorkspaceAgentParticipantOptions;
}

export type SolutionAgentRunResult =
  | {
    ok: true;
    result: SolutionWorkV1;
    invocationPath: string;
    rawOutputPath: string;
    resultPath: string;
  }
  | {
    ok: false;
    errorKind: WorkspaceAgentJobFailure['errorKind'];
    message: string;
    invocationPath: string;
    rawOutputPath: string;
    failurePath: string;
  };

function assertPathInside(root: string, reference: string, label: string): string {
  if (!reference || isAbsolute(reference)) throw new Error(`${label} must be a relative path: ${reference}`);
  const resolvedRoot = resolve(root);
  const target = resolve(resolvedRoot, reference);
  const escaped = relative(resolvedRoot, target);
  if (!escaped || escaped === '..' || escaped.startsWith(`..${sep}`) || isAbsolute(escaped)) {
    throw new Error(`${label} escapes its allowed root: ${reference}`);
  }
  return target;
}

async function assertFile(root: string, reference: string, label: string): Promise<void> {
  const target = assertPathInside(root, reference, label);
  const stat = await lstat(target);
  if (!stat.isFile()) throw new Error(`${label} must resolve to a regular file: ${reference}`);
}

async function validateReferences(result: SolutionWorkV1, input: RunSolutionAgentInput): Promise<void> {
  const repoRefs = [
    ...result.repoRefs,
    ...result.options.flatMap(option => option.repoRefs),
  ];
  const artifactRefs = [
    ...result.artifactRefs,
    ...result.options.flatMap(option => option.artifactRefs),
  ];
  for (const reference of repoRefs) await assertRepoReferenceFile(input.workspaceRoot, reference, 'repoRef');
  for (const reference of artifactRefs) {
    try {
      await assertFile(input.artifactRoot, reference, 'artifactRef');
    } catch (error) {
      await assertFile(input.workspaceRoot, reference, 'artifactRef');
    }
  }
}

export function buildSolutionAgentPrompt(
  problemPackage: ProblemPackage,
  assignedSkills: DeliveredParticipantSkill[],
): string {
  const skillSections = assignedSkills.flatMap(skill => [
    `Skill: ${skill.identity}`,
    `Version: ${skill.version}`,
    `Canonical artifact: ${skill.canonicalPath}`,
    `Content SHA-256: ${skill.contentSha256}`,
    skill.content.trim(),
    '',
  ]);
  return [
    'You own investigation and solution reasoning.',
    'You may run commands and make temporary changes inside this disposable workspace.',
    'Do not modify or assume access to the authoritative repository.',
    'Return zero to three options or an explicit no-proposal/insufficient-evidence/escalate result.',
    'Program/code recommendations are allowed, but execution permission is separate.',
    'Diagnostic evidence referenced by the Problem Package is trusted internal source-run provenance. It is not player-observable evidence. Producer attribution identifies which captured runtime producer generated an observed entry; it does not by itself prove the broader causal mechanism or that a proposed change is correct.',
    'The observable payload referenced by ProblemPackage.source.observablePayloadRef may include validated Experience Semantic Context on each entry. Read it as player-observable meaning: milestone meaning, life-stage meaning, experience category, and expected experience signals.',
    'The Experience Semantic Context is descriptive only. It contains no hidden runtime state, and you must not treat it as a solution recommendation, quality score, authority, or permission.',
    renderStructuredFinalOutputContractV1({
      roleSchemaName: 'SolutionWorkV1',
    }),
    '',
    'Convergence discipline (Solution work only):',
    '- Investigate only far enough to form a small set of plausible, repository-grounded explanations; do not treat the task as an exhaustive repository audit.',
    '- Once you have plausible candidates, stop broad exploration. Further investigation should verify, distinguish, or materially update those candidates or resolve a named blocking unknown.',
    '- Prefer targeted symbol/path searches and focused reads. Avoid repeated broad searches, repeated full-file reads, and large recursive output unless they answer a new specific question.',
    '- If verification undermines all candidates, you may perform one bounded re-grounding pass and form a new candidate set; do not repeatedly return to broad exploration.',
    '- As soon as the evidence supports a reviewable option, synthesize and return it rather than continuing only to increase confidence.',
    '- Use INSUFFICIENT_EVIDENCE only after grounded investigation and candidate verification leave a material unknown that the available evidence cannot resolve. Use NO_PROPOSAL only when the evidence supports that no change should be proposed. Neither is a time-budget escape hatch.',
    '- Produce a repository-grounded result that Reviewer can independently assess; do not perform an exhaustive second-pass review yourself.',
    '',
    'Assigned Skills (working methods only; they do not grant authority):',
    ...skillSections,
    'Reference format requirements:',
    '- repoRefs must reference repository-relative regular files.',
    '- Allowed repoRef forms:',
    '  - path',
    '  - path:line',
    '  - path:start-end',
    '- Do not use # fragments, symbol selectors, URLs, globs, or other locator syntax in repoRefs.',
    '',
    '- artifactRefs must be relative regular-file paths only.',
    '  In other words, use relative file paths that resolve to regular files.',
    '- Do not use line locators, # fragments, entry selectors, JSON selectors, or globs in artifactRefs.',
    '',
    '- If a symbol name, event id, entry id, observation index, or other semantic anchor is important,',
    '  mention it in rationale / summary / assessment text while keeping the corresponding reference field',
    '  as a valid file reference.',
    '',
    'Problem Package (the package references evidence; interpret it yourself):',
    canonicalJson(problemPackage),
  ].join('\n');
}

async function writeCreateOnly(path: string, value: string | unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const handle = await open(path, 'wx');
  try {
    await handle.writeFile(typeof value === 'string' ? value : `${canonicalJson(value)}\n`);
  } finally {
    await handle.close();
  }
}

export async function runSolutionAgent(input: RunSolutionAgentInput): Promise<SolutionAgentRunResult> {
  const problemPackage = validateProblemPackage(input.problemPackage);
  const problemPackageSha256 = sha256Hex(await readFile(input.problemPackagePath));
  const invocationPath = join(input.destinationRoot, 'invocation.json');
  const rawOutputPath = join(input.destinationRoot, 'raw-output.txt');
  const resultPath = join(input.destinationRoot, 'result.json');
  const failurePath = join(input.destinationRoot, 'failure.json');
  const commonInvocation = {
    schemaVersion: 'solution-agent-invocation-v2',
    invocationRef: input.invocationRef,
    jobNumber: input.jobNumber,
    role: 'solution',
    workspaceBaselineFingerprintSha256: input.workspaceBaselineFingerprintSha256,
    problemPackageSha256,
    participant: 'workspace-capable-agent',
    skillAssignments: input.skillAssignments,
  } as const;

  let assignedSkills: DeliveredParticipantSkill[];
  try {
    assignedSkills = await loadParticipantSkills(input.workspaceRoot, input.skillAssignments);
  } catch (error) {
    const message = `assigned Skill delivery failed: ${String(error)}`;
    await writeCreateOnly(rawOutputPath, '');
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills: [],
      status: 'failed',
      errorKind: 'process',
    });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'solution-agent-failure-v1',
      errorKind: 'process',
      message,
    });
    return {
      ok: false,
      errorKind: 'process',
      message,
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  }

  const deliveredSkills = assignedSkills.map(({ content: _content, ...provenance }) => provenance);
  const prompt = buildSolutionAgentPrompt(problemPackage, assignedSkills);
  const execution = await runStructuredParticipantExecution<SolutionWorkV1>({
    invocationRef: input.invocationRef,
    role: 'solution',
    workspaceRoot: input.workspaceRoot,
    destinationRoot: input.destinationRoot,
    initialPrompt: prompt,
    expectedRoleSchemaName: 'SolutionWorkV1',
    participant: input.participant,
    retransmissionEnabled: isEnvelopeRetransmissionEnabledForRole('solution'),
    validateSchema: validateSolutionWork,
    validateAcceptedResult: async result => {
      if (result.problemId !== problemPackage.problemId) {
        throw new Error('SolutionWork problemId does not match ProblemPackage');
      }
      await validateReferences(result, input);
    },
  });
  await writeCreateOnly(join(input.destinationRoot, 'execution-trace.json'), execution.executionTrace);

  if (!execution.ok) {
    await writeCreateOnly(rawOutputPath, execution.rawOutput ?? '');
    await writeCreateOnly(invocationPath, {
      ...commonInvocation,
      deliveredSkills,
      status: 'failed',
      errorKind: execution.errorKind,
    });
    await writeCreateOnly(failurePath, {
      schemaVersion: 'solution-agent-failure-v1',
      errorKind: execution.errorKind,
      message: execution.message,
    });
    return {
      ok: false,
      errorKind: execution.errorKind,
      message: execution.message,
      invocationPath,
      rawOutputPath,
      failurePath,
    };
  }

  await writeCreateOnly(rawOutputPath, execution.rawOutput);
  try {
    await writeCreateOnly(join(input.destinationRoot, 'stderr.txt'), execution.stderr);
  } catch {
    // stderr is forensic sidecar evidence; preserve the accepted Solution outcome if it cannot be written.
  }
  await writeCreateOnly(invocationPath, { ...commonInvocation, deliveredSkills, status: 'completed' });
  await writeCreateOnly(resultPath, execution.value);
  return { ok: true, result: execution.value, invocationPath, rawOutputPath, resultPath };
}
