import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { readValidatedPreschoolReferenceArtifactBackedProbeBindingLock } from "../../scripts/evolution/autonomousAuthoring/runPreschoolReferenceArtifactBackedSolutionProbe";
import { executePreschoolArtifactBackedSolution } from "../../scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial";
import { artifactBackedReferenceParticipantBindingLockSha256 } from "../../scripts/evolution/operator/referenceParticipantBinding";
import type { ArtifactBackedReferenceParticipantBindingLockV2 } from "../../scripts/evolution/operator/referenceParticipantBinding";

const lock: ArtifactBackedReferenceParticipantBindingLockV2 = {
  schemaVersion: "reference-participant-binding-lock-v2",
  bindingId: "CODEX_CURRENT",
  provider: "codex-local-subagent",
  executableRealPath: "/usr/bin/codex",
  executableVersion: "0.159.0",
  modelConfigured: "gpt-6-luna",
  reasoningEffort: "max",
  ambientCodexConfigPath: "/tmp/config.toml",
  ambientCodexConfigSha256: "ABSENT",
  structuredResultDelivery: {
    kind: "WORKSPACE_ARTIFACT_RECEIPT_V1",
    resultRelativePath: ".evolution-participant/final-result.json",
    receiptSchemaRef:
      "scripts/evolution/operator/codexArtifactBackedReceipt.schema.json",
    receiptSchemaSha256: "a".repeat(64),
  },
};

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "artifact-solution-probe-"));
  const matrixRoot = join(root, "matrix");
  await mkdir(matrixRoot);
  const matrix = {
    schemaVersion: "reference-artifact-backed-communication-matrix-v1",
    implementationSha: "b".repeat(40),
    bindingLockRef: "binding-lock.json",
    bindingLockSha256:
      artifactBackedReferenceParticipantBindingLockSha256(lock),
    status: "PASS",
    trials: [
      {
        status: "PASS",
        runtimeOutcome: "COMPLETED",
        elapsedMs: 100,
        receiptValid: true,
        artifactIntegrityValid: true,
        artifactEnvelopeValid: true,
        syntheticStructureValid: true,
        hostRepairApplied: false,
        retransmissions: 0,
      },
      {
        status: "PASS",
        runtimeOutcome: "COMPLETED",
        elapsedMs: 100,
        receiptValid: true,
        artifactIntegrityValid: true,
        artifactEnvelopeValid: true,
        syntheticStructureValid: true,
        hostRepairApplied: false,
        retransmissions: 0,
      },
      {
        status: "PASS",
        runtimeOutcome: "COMPLETED",
        elapsedMs: 100,
        receiptValid: true,
        artifactIntegrityValid: true,
        artifactEnvelopeValid: true,
        syntheticStructureValid: true,
        hostRepairApplied: false,
        retransmissions: 0,
      },
    ],
  };
  await writeFile(join(matrixRoot, "binding-lock.json"), JSON.stringify(lock));
  await writeFile(join(matrixRoot, "matrix.json"), JSON.stringify(matrix));
  return { root, matrixRoot, matrix };
}

test("accepts only a passing complete artifact-backed matrix bound to the exact V2 lock and current SHA", async () => {
  const f = await fixture();
  try {
    const actual =
      await readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
        repositoryRoot: f.root,
        participantBindingLockPath: join(f.matrixRoot, "binding-lock.json"),
        currentImplementationSha: f.matrix.implementationSha,
      });
    assert.equal(actual.schemaVersion, "reference-participant-binding-lock-v2");
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("rejects terminal binding locks and failed or incomplete matrix evidence", async () => {
  const f = await fixture();
  try {
    const lockPath = join(f.matrixRoot, "binding-lock.json");
    const terminalLock = {
      ...lock,
      schemaVersion: "reference-participant-binding-lock-v1",
      nativeEnvelopeAssistance: { enabled: true },
    };
    await writeFile(lockPath, JSON.stringify(terminalLock));
    await assert.rejects(
      readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
        repositoryRoot: f.root,
        participantBindingLockPath: lockPath,
        currentImplementationSha: f.matrix.implementationSha,
      }),
      /V2 artifact-backed/,
    );
    await writeFile(lockPath, JSON.stringify(lock));
    const broken = { ...f.matrix, trials: f.matrix.trials.slice(0, 2) };
    await writeFile(join(f.matrixRoot, "matrix.json"), JSON.stringify(broken));
    await assert.rejects(
      readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
        repositoryRoot: f.root,
        participantBindingLockPath: lockPath,
        currentImplementationSha: f.matrix.implementationSha,
      }),
      /three passing/,
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("rejects matrix SHA drift and binding roots or symlink aliases into governed history", async () => {
  const f = await fixture();
  try {
    const lockPath = join(f.matrixRoot, "binding-lock.json");
    await assert.rejects(
      readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
        repositoryRoot: f.root,
        participantBindingLockPath: lockPath,
        currentImplementationSha: "c".repeat(40),
      }),
      /current clean implementation SHA/,
    );
    const governed = join(
      f.root,
      "artifacts/evolution/autonomous-authoring/reference-trials/matrix",
    );
    await mkdir(governed, { recursive: true });
    await writeFile(join(governed, "binding-lock.json"), JSON.stringify(lock));
    await writeFile(join(governed, "matrix.json"), JSON.stringify(f.matrix));
    await assert.rejects(
      readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
        repositoryRoot: f.root,
        participantBindingLockPath: join(governed, "binding-lock.json"),
        currentImplementationSha: f.matrix.implementationSha,
      }),
      /outside governed/,
    );
    const alias = join(f.root, "alias");
    await symlink(governed, alias);
    await assert.rejects(
      readValidatedPreschoolReferenceArtifactBackedProbeBindingLock({
        repositoryRoot: f.root,
        participantBindingLockPath: join(alias, "binding-lock.json"),
        currentImplementationSha: f.matrix.implementationSha,
      }),
      /outside governed/,
    );
  } finally {
    await rm(f.root, { recursive: true, force: true });
  }
});

test("runs Solution with artifact delivery and reports transport and Role-schema evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "artifact-solution-core-"));
  const evidencePath = join(root, "artifact-backed-validation.json");
  const fakeSolution = {
    ok: false as const,
    errorKind: "invalid_output" as const,
    message: "fixture failure",
    failure: {
      origin: "PARTICIPANT" as const,
      reason: "INVALID_OUTPUT" as const,
      participantErrorKind: "invalid_output" as const,
      message: "fixture failure",
    },
    invocationPath: join(root, "invocation.json"),
    rawOutputPath: join(root, "raw-output.txt"),
    failurePath: join(root, "failure.json"),
  };
  let observedDelivery: unknown;
  try {
    const result = await executePreschoolArtifactBackedSolution({
      runInput: {} as never,
      evidencePath,
      runSolution: async (input) => {
        observedDelivery = input.structuredResultDelivery;
        await writeFile(
          evidencePath,
          JSON.stringify({
            schemaVersion: "artifact-backed-validation-v1",
            receiptValidationValid: true,
            artifactIntegrityValid: true,
            artifactEnvelopeValid: true,
            roleSchemaValidationAttempted: true,
            roleSchemaValid: false,
          }),
        );
        return fakeSolution;
      },
    });
    assert.deepEqual(observedDelivery, {
      kind: "WORKSPACE_ARTIFACT_RECEIPT_V1",
      resultRelativePath: ".evolution-participant/final-result.json",
    });
    assert.deepEqual(result.solution, fakeSolution);
    assert.equal(result.validation.receiptValidationValid, true);
    assert.equal(result.validation.artifactIntegrityValid, true);
    assert.equal(result.validation.roleSchemaValidationAttempted, true);
    assert.equal(result.validation.roleSchemaValid, false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
