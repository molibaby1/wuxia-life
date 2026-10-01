import { execFileSync, spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { readFile } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";
import {
  artifactBackedReferenceParticipantBindingLockSha256,
  type ArtifactBackedReferenceParticipantBindingLockV2,
} from "../operator/referenceParticipantBinding";
import {
  runPreschoolReferenceArtifactBackedSolutionCommunicationProbe,
  type PreschoolReferenceArtifactBackedSolutionCommunicationProbeDependencies,
} from "./runPreschoolReferenceTrial";

interface ProbeInput {
  liveRepositoryRoot: string;
  evidencePath: string;
  observablePayloadPath: string;
  responsibilityBriefPath: string;
  probeRef: string;
  destinationRoot: string;
  participantBindingLockPath: string;
}
export type ParsedPreschoolReferenceArtifactBackedSolutionProbeArgs =
  { help: true } | { help: false; input: ProbeInput };

const REQUIRED_OPTIONS = [
  "--evidence",
  "--observable-payload",
  "--responsibility-brief",
  "--probe-ref",
  "--binding-lock",
] as const;
function resolveInputPath(root: string, path: string): string {
  return isAbsolute(path) ? resolve(path) : resolve(root, path);
}

export function parsePreschoolReferenceArtifactBackedSolutionProbeArgs(
  argv: string[],
  repositoryRoot = process.cwd(),
): ParsedPreschoolReferenceArtifactBackedSolutionProbeArgs {
  if (argv.length === 1 && argv[0] === "--help") return { help: true };
  const values = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const option = argv[i]!;
    if (!(REQUIRED_OPTIONS as readonly string[]).includes(option))
      throw new Error(`Unknown option: ${option}`);
    if (values.has(option)) throw new Error(`Duplicate option: ${option}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--"))
      throw new Error(`${option} requires a value.`);
    values.set(option, value);
    i += 1;
  }
  for (const option of REQUIRED_OPTIONS)
    if (!values.has(option)) throw new Error(`${option} is required.`);
  const root = resolve(repositoryRoot);
  const probeRef = values.get("--probe-ref")!;
  return {
    help: false,
    input: {
      liveRepositoryRoot: root,
      evidencePath: resolveInputPath(root, values.get("--evidence")!),
      observablePayloadPath: resolveInputPath(
        root,
        values.get("--observable-payload")!,
      ),
      responsibilityBriefPath: resolveInputPath(
        root,
        values.get("--responsibility-brief")!,
      ),
      probeRef,
      destinationRoot: resolve(
        root,
        ".tmp/evolution/preschool-reference-artifact-backed-solution-probes",
        probeRef,
      ),
      participantBindingLockPath: resolveInputPath(
        root,
        values.get("--binding-lock")!,
      ),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function realpathWithMissingSuffix(path: string): string {
  let cursor = resolve(path);
  const suffix: string[] = [];
  while (true) {
    try {
      return resolve(realpathSync(cursor), ...suffix);
    } catch (error) {
      if (
        !error ||
        typeof error !== "object" ||
        !("code" in error) ||
        error.code !== "ENOENT"
      )
        throw error;
      const parent = dirname(cursor);
      if (parent === cursor) throw error;
      suffix.unshift(basename(cursor));
      cursor = parent;
    }
  }
}
function isWithin(root: string, target: string): boolean {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
}

export async function readValidatedPreschoolReferenceArtifactBackedProbeBindingLock(input: {
  repositoryRoot: string;
  participantBindingLockPath: string;
  currentImplementationSha: string;
}): Promise<ArtifactBackedReferenceParticipantBindingLockV2> {
  const lockPath = resolve(input.participantBindingLockPath);
  if (basename(lockPath) !== "binding-lock.json")
    throw new Error(
      "Artifact-backed probe requires the exact matrix binding-lock.json path.",
    );
  const matrixRoot = realpathWithMissingSuffix(dirname(lockPath));
  const governedRoot = realpathWithMissingSuffix(
    resolve(
      input.repositoryRoot,
      "artifacts/evolution/autonomous-authoring/reference-trials",
    ),
  );
  if (isWithin(governedRoot, matrixRoot))
    throw new Error(
      "Artifact-backed matrix binding evidence must be outside governed reference-trial history.",
    );
  const [lockText, matrixText] = await Promise.all([
    readFile(lockPath, "utf8"),
    readFile(join(matrixRoot, "matrix.json"), "utf8"),
  ]);
  const lockValue: unknown = JSON.parse(lockText);
  const matrixValue: unknown = JSON.parse(matrixText);
  if (
    !isRecord(lockValue) ||
    lockValue.schemaVersion !== "reference-participant-binding-lock-v2" ||
    !isRecord(lockValue.structuredResultDelivery) ||
    lockValue.structuredResultDelivery.kind !== "WORKSPACE_ARTIFACT_RECEIPT_V1"
  ) {
    throw new Error(
      "Artifact-backed probe requires a V2 artifact-backed binding lock.",
    );
  }
  const lock =
    lockValue as unknown as ArtifactBackedReferenceParticipantBindingLockV2;
  if (
    !isRecord(matrixValue) ||
    matrixValue.schemaVersion !==
      "reference-artifact-backed-communication-matrix-v1" ||
    matrixValue.status !== "PASS" ||
    matrixValue.bindingLockRef !== "binding-lock.json" ||
    matrixValue.implementationSha !== input.currentImplementationSha ||
    !Array.isArray(matrixValue.trials) ||
    matrixValue.trials.length !== 3 ||
    !matrixValue.trials.every(
      (trial) =>
        isRecord(trial) &&
        trial.status === "PASS" &&
        trial.runtimeOutcome === "COMPLETED" &&
        typeof trial.elapsedMs === "number" &&
        trial.elapsedMs >= 0 &&
        trial.elapsedMs <= 300_000 &&
        trial.receiptValid === true &&
        trial.artifactIntegrityValid === true &&
        trial.artifactEnvelopeValid === true &&
        trial.syntheticStructureValid === true &&
        trial.hostRepairApplied === false &&
        trial.retransmissions === 0,
    )
  ) {
    throw new Error(
      "Artifact-backed probe requires exactly three passing trials from a matrix for the current clean implementation SHA.",
    );
  }
  if (
    matrixValue.bindingLockSha256 !==
    artifactBackedReferenceParticipantBindingLockSha256(lock)
  ) {
    throw new Error(
      "Artifact-backed matrix binding-lock SHA does not match the V2 lock.",
    );
  }
  return lock;
}

export function readCleanPreschoolArtifactBackedProbeImplementationSha(
  repositoryRoot: string,
): string {
  const diff = spawnSync(
    "git",
    ["-C", repositoryRoot, "diff", "--quiet", "HEAD", "--"],
    { encoding: "utf8" },
  );
  if (diff.error)
    throw new Error(
      `Could not verify tracked implementation worktree: ${diff.error.message}`,
    );
  if (diff.status === 1)
    throw new Error(
      "Tracked implementation worktree must be clean before communication validation.",
    );
  if (diff.status !== 0)
    throw new Error(
      `Could not verify tracked implementation worktree: ${diff.stderr}`,
    );
  return execFileSync("git", ["-C", repositoryRoot, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
}

export function preschoolReferenceArtifactBackedSolutionProbeUsage(): string {
  return "Usage: --evidence <accepted-evidence.json> --observable-payload <observable-payload.json> --responsibility-brief <reference-responsibility-brief.json> --probe-ref <id> --binding-lock <matrix-root>/binding-lock.json";
}

export async function runPreschoolReferenceArtifactBackedSolutionProbeCli(
  argv: string[],
  dependencies: PreschoolReferenceArtifactBackedSolutionCommunicationProbeDependencies & {
    implementationSha?: (root: string) => string | Promise<string>;
  } = {},
  repositoryRoot = process.cwd(),
  writeOutput: (text: string) => void = (text) => process.stdout.write(text),
): Promise<number> {
  const parsed = parsePreschoolReferenceArtifactBackedSolutionProbeArgs(
    argv,
    repositoryRoot,
  );
  if (parsed.help) {
    writeOutput(`${preschoolReferenceArtifactBackedSolutionProbeUsage()}\n`);
    return 0;
  }
  const currentSha = dependencies.implementationSha
    ? await dependencies.implementationSha(parsed.input.liveRepositoryRoot)
    : readCleanPreschoolArtifactBackedProbeImplementationSha(
        parsed.input.liveRepositoryRoot,
      );
  const participantBindingLock =
    await readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
      repositoryRoot: parsed.input.liveRepositoryRoot,
      participantBindingLockPath: parsed.input.participantBindingLockPath,
      currentImplementationSha: currentSha,
    });
  const result =
    await runPreschoolReferenceArtifactBackedSolutionCommunicationProbe(
      { ...parsed.input, participantBindingLock },
      dependencies,
    );
  writeOutput(
    `${JSON.stringify({ probeRef: result.probeRef, status: result.status, solutionOutcome: result.solutionOutcome, implementationSha: result.implementationSha, participantBindingLockSha256: result.participantBindingLockSha256, authoritativeFingerprintUnchanged: result.authoritativeFingerprintUnchanged, governedHistoryUnchanged: result.governedHistoryUnchanged })}\n`,
  );
  return result.solutionOutcome.reachedRoleSchemaValidation &&
    result.authoritativeFingerprintUnchanged &&
    result.governedHistoryUnchanged &&
    result.status !== "CONTAINMENT_FAILURE"
    ? 0
    : 1;
}

if (
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runPreschoolReferenceArtifactBackedSolutionProbeCli(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
