# Contract-Constrained Autonomous Authoring v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first bounded Auto Evolution lane that can autonomously diagnose, author, implement, and verify a Human-approved preschool shared-neutral passive content expansion as a shadow-only patch, while leaving the authoritative repository unchanged until explicit Human promotion.

**Architecture:** Reuse the existing Candidate → Solution → Reviewer → Decision workflow and add a domain-neutral autonomous-authoring companion contract plus one direct v1 preschool contract. The Host independently verifies contract applicability from permitted Host-only evidence, routes only an eligible accepted instance to a separate isolated Shadow Executor, derives the real diff itself, performs five-layer verification, retains a durable exact-patch Promotion Package, and completes the candidate without a source transition. Do not build a second Content AE, generic contract registry, generic executor framework, or autonomous Git promotion path.

**Tech Stack:** TypeScript 5.9, Node.js, `tsx`, existing Auto Evolution contracts/workspaces/provenance, JSON catalog data, Git CLI for deterministic patch generation, existing `CODEX_CURRENT` workspace-capable Participant binding.

**Spec:** `docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md`

**Implementation baseline:** Current remote `dev` after `f9342a628f0b85794baea893694f1ac639d764ac`. The accepted design landed in `ce3a678a8a3fb32f25041e8bd96306b04746d2ac`. Preserve the typed execution-authority behavior introduced by `3a5d5641b1020bd7751d94104d62ce3f3572ce87`.

## Global Constraints

- Governance reconciliation MUST land before runtime activation: add `PD-121` and update the canonical Content Authoring Workflow so the PD-120 default remains Human approval except for a Human-approved Autonomous Authoring Contract executing shadow-only.
- `contractId = preschool-shared-neutral-passive-capacity-v1`, `contractVersion = 1`.
- v1 supports exactly one autonomous reference Contract; do not add a generic registry or DSL.
- Shadow execution may modify only an isolated workspace. It MUST NOT commit, push, merge, or mutate the authoritative repository.
- Authoritative promotion remains Human-controlled and exact-patch-only.
- Raw Phase 0 `internal/player-surface-source.json` and `passiveEntryIds` remain Participant-forbidden under PD-111.
- Host may use already-authorized internal evidence for admission and verification, but Host-only facts MUST NOT be copied into Solution/Reviewer workspaces or prompts.
- The preschool production write surface is exactly `src/data/lines/preschool-passive-spine.json`.
- The preschool shadow test write surface is exactly `tests/preschoolPassiveSpineTests.ts` and `tests/annualPassiveMemoryTests.ts`.
- New preschool rows MUST contain exactly `id`, `title`, `text`, `originTags`, `ageMin`, `ageMax`.
- New preschool rows MUST use `originTags: ["neutral"]`, `ageMin` integer `4..7`, `ageMax: 7`, and MUST omit `statDeltas` and `flags`.
- `maxNewEntriesPerShadowExecution = 8`; the Host MUST NOT truncate or split a larger minimum set to bypass this envelope.
- Existing catalog rows MUST remain byte/semantic-equivalent; new rows are append-only.
- Existing test content MUST NOT be weakened: each approved shadow test file is byte-prefix-preserving and append-only; the exact baseline bytes must remain the prefix of the final file.
- The Authoring Agent owns responsibility decomposition, IDs, age justification, titles, text, and scene design. The Shadow Executor may implement the accepted Cards exactly but may not rewrite them.
- Applicability, conformance, execution eligibility, and natural effectiveness remain separate judgments.
- `SHADOW_AUTHORING_VERIFIED` is not an authoritative source change: no new Phase 0 source, no source-change barrier, no pending-candidate supersede, no repository baseline change, and no source-transition-count consumption.
- A successful shadow result creates no Human Follow-up item. `CONTRACT_CHANGE_REQUIRED`, `EXECUTION_ENVELOPE_EXCEEDED`, and stale/invalid authority may use the existing Human escalation path.
- PD-118's `maxParticipantJobs = 11` per Host slice remains unchanged; candidate admission must reserve one possible shadow-execution Participant job.
- Unexpected executor runtime failure, scope violation, authoritative-root mutation, workspace/provenance failure, or verification-infrastructure failure remains fail-closed; do not widen PD-119.
- Historical reference validation MUST use the accepted pre-second-round baseline `e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf` and the already-established run `preschool-pver-20260922231805-71297571`; it MUST NOT rerun natural AE or reconstruct missing evidence by a new replay.
- The historical trial MUST NOT expose the 2026-09-23 five-entry answer set or later answer-bearing catalog rows/design/PVER material to Participants.
- After the controlled historical trial succeeds, stop tuning that case and return to ordinary natural full-flow observation.

## Review Focus

- **Historical compatibility:** a historical `SolutionWorkV1`, `SolutionReviewV1`, or `SolutionDecisionV1` with no autonomous-authoring companion must parse and route exactly as before; Task 2 and Task 5 pin this.
- **No config-authority bypass:** an autonomous-content option with missing, `NOT_APPLICABLE`, or failed Host admission must never fall through into `READY_FOR_CONFIG_EXECUTION`; Task 5 pins this.
- **PD-111 leakage:** internal packed-passive IDs and Host admission evidence must never enter Solution/Reviewer workspaces, prompts, or participant-facing contract packets; Task 4 pins this.
- **Test tampering:** the Shadow Executor must not delete or weaken pre-existing assertions in either approved test file; Task 7 pins additive-only test-file verification.
- **Budget after a source transition:** even when `sourceTransitionAvailable=false`, admission must still reserve five Participant jobs because a candidate can consume Solution + Reviewer + bounded continuation + Shadow Executor; Task 8 pins this.

---

## File Structure

The implementation is intentionally split by responsibility:

- `src/evolution/autonomousAuthoringContract.ts` — domain-neutral Solution/Reviewer companion types and validators.
- `src/evolution/preschoolSharedNeutralAuthoringContract.ts` — the single v1 preschool Contract constants, Card/payload schema, and mechanical Card validation.
- `src/evolution/autonomousAuthoringAdmissionContract.ts` — Host-owned admission status/artifact contract.
- `src/evolution/shadowAuthoringResultContract.ts` — durable shadow terminal result contract.
- `scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket.ts` — participant-safe, answer-free projection of the active Contract.
- `scripts/evolution/autonomousAuthoring/evaluatePreschoolAuthoringAdmission.ts` — Host-only applicability/admission and capacity reconstruction.
- `scripts/evolution/autonomousAuthoring/workspaceChangeSet.ts` — canonical before/after workspace comparison and deterministic patch generation.
- `scripts/evolution/autonomousAuthoring/shadowAuthoringExecutionParticipant.ts` — isolated exact implementation Participant.
- `scripts/evolution/autonomousAuthoring/verifyPreschoolShadowAuthoring.ts` — V1–V5 Host verification.
- `scripts/evolution/autonomousAuthoring/buildPromotionPackage.ts` — durable JSON/Markdown promotion package.
- `scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts` — contamination-controlled historical mechanism trial.
- Existing Solution/Reviewer/Decision/session files — wiring only; no preschool-specific rules should be embedded in the generic Decision schema beyond domain-neutral companion/admission fields.

---

### Task 1: Governance Reconciliation — PD-121 and Canonical Workflow

**Files:**
- Modify: `docs/governance/product-decisions.md:2216-end`
- Modify: `docs/product/content-authoring-workflow-contract-design.md:1-15, 103-end`
- Modify: `docs/product/auto-evolution-model.md` in the Candidate Pool, minimum loop, Configuration/Code Boundary, and current-stage sections
- Read-only authority: `docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md`

**Interfaces:**
- Consumes: accepted spec authority `contract-constrained-autonomous-authoring-v1-20260924`.
- Produces: operative governance authority for the runtime tasks below; no code authority exists until this task is committed.

- [ ] **Step 1: Append exact PD-121 governance semantics**

Append a new Product Decision headed:

```markdown
### PD-121：Contract-Constrained Autonomous Authoring v1

**产品决策（Human accepted：2026-09-24）**

PD-120 的默认规则继续有效：正式内容实例在 authoritative repository 中实施之前，默认需要 instance-level Human Approval。

新增且仅新增以下 delegated-authority 例外：

```text
Human-approved Autonomous Authoring Contract
+ current case proven APPLICABLE
+ independent semantic conformance
+ Host mechanical admission
→ AE may author + implement + verify a shadow-only patch
```

该例外只授权 isolated mutable workspace 中的 shadow authoring / implementation / verification，不授权 commit、push、merge 或任何 authoritative repository mutation。

v1 只激活：

```text
contractId: preschool-shared-neutral-passive-capacity-v1
version: 1
```

其完整语义由：

```text
docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md
```

定义。

`SHADOW_AUTHORING_VERIFIED` 不是 source change，不触发 PD-118 source-change barrier，不创建新 Phase 0 source，不 supersede 当前 Source Epoch 的 PENDING candidates，也不消费一次 authoritative source-changing transition。

PD-111、PD-118、PD-119、repository fingerprint / baseline integrity、Human authoritative-promotion authority 全部保持不变。

**明确不做**

- 不开放 autonomous commit / push / merge；
- 不开放 generic Event / Person / Milestone / origin-specific authoring；
- 不新增 generic Contract registry / DSL / executor plugin framework；
- 不扩大 raw Phase 0 Participant evidence；
- 不把 Reviewer acceptance 单独解释为 execution authority；
- 不把 shadow success 解释为 Natural PVER 或 generalized effectiveness。

**重新讨论条件**

只按 accepted design §28 的 re-discussion triggers 重新讨论。
```

- [ ] **Step 2: Upgrade the canonical Content Authoring Workflow wording without removing PD-120 history**

Change the document header to `Content Authoring Workflow Contract v3`, preserve PD-120 as historical/default authority, and add this exact branch to the standard workflow:

```text
Gap Diagnosis
→ Content Proposal
→ Draft Authoring Contract
→ Does a Human-approved Autonomous Authoring Contract apply?
   ├─ no / unknown / contract-changing
   │    → existing Human Approval boundary
   └─ yes, Host-proven APPLICABLE
        → bounded shadow authoring
        → semantic + mechanical verification
        → SHADOW_AUTHORING_VERIFIED
        → Human exact-patch promotion boundary
```

Also add explicit text:

```text
Shadow authoring never equals authoritative implementation.
A Natural Player-visible Experience Review still occurs only after a Human-authorized authoritative promotion.
```

Do not alter the seven top-level Gap categories or the PD-120 Content Capacity definition.

- [ ] **Step 3: Reconcile `auto-evolution-model.md`**

Update the minimum loop so it contains both positive execution paths:

```text
effective Candidate Decision
├─ READY_FOR_CONFIG_EXECUTION
│    → authoritative bounded config execution
│    → source-change barrier
└─ READY_FOR_SHADOW_AUTHORING
     → isolated shadow execution + Host verification
     → candidate completes on the same Source Epoch
     → no source-change barrier
```

In the Configuration / Code Boundary section, preserve the current typed `executionAuthorityAssessment` rule and add:

```text
A Human-approved Autonomous Authoring Contract is a separate delegated shadow-execution authority.
It does not convert content authoring into ordinary configuration execution.
```

- [ ] **Step 4: Verify the governance diff is isolated and internally consistent**

Run:

```bash
git diff --check -- \
  docs/governance/product-decisions.md \
  docs/product/content-authoring-workflow-contract-design.md \
  docs/product/auto-evolution-model.md

git diff -- \
  docs/governance/product-decisions.md \
  docs/product/content-authoring-workflow-contract-design.md \
  docs/product/auto-evolution-model.md
```

Expected:
- `PD-121` appears exactly once.
- PD-120 remains present and described as the default/historical rule.
- No autonomous authoritative Git write is authorized.
- The only active autonomous Contract is `preschool-shared-neutral-passive-capacity-v1@1`.

- [ ] **Step 5: Commit governance before runtime code**

```bash
git add \
  docs/governance/product-decisions.md \
  docs/product/content-authoring-workflow-contract-design.md \
  docs/product/auto-evolution-model.md
git commit -m "docs: authorize shadow content authoring v1"
```

---

### Task 2: Domain-Neutral Companion Contracts and Preschool Card Schema

**Files:**
- Create: `src/evolution/autonomousAuthoringContract.ts`
- Create: `src/evolution/preschoolSharedNeutralAuthoringContract.ts`
- Modify: `src/evolution/solutionWorkContract.ts:7-43, 60-108`
- Modify: `src/evolution/solutionReviewContract.ts:1-45, 81-125`
- Test: `tests/evolution/autonomousAuthoringContracts.test.ts`
- Test: `tests/evolution/problemAgnosticSolutionContracts.test.ts`

**Interfaces:**
- Consumes: PD-121 and accepted spec.
- Produces:
  - `AutonomousAuthoringProposalV1`
  - `AutonomousAuthoringReviewAssessmentV1`
  - `PreschoolSharedNeutralAuthoringPayloadV1`
  - `validateAutonomousAuthoringProposal(value)`
  - `validateAutonomousAuthoringReviewAssessment(value)`
  - `validatePreschoolSharedNeutralPayload(value, responsibilities)`
  - `validateAutonomousAuthoringProposal()` returns only after the contract-specific payload validator succeeds
  - additive optional `SolutionOptionV1.autonomousAuthoring`
  - additive optional `SolutionReviewV1.autonomousAuthoringAssessment`

- [ ] **Step 1: Write failing contract tests for the domain-neutral companion**

Create tests that require these exact common types/values:

```ts
const proposal = {
  schemaVersion: 'autonomous-authoring-proposal-v1',
  contractId: 'preschool-shared-neutral-passive-capacity-v1',
  contractVersion: 1,
  gapClassification: 'CONTENT_GAP',
  gapSubtype: 'CONTENT_CAPACITY_GAP',
  applicabilityClaim: 'APPLICABLE',
  authorityRefs: ['docs/governance/product-decisions.md'],
  sourceEvidenceRefs: ['source/observable-payload.json'],
  responsibilities: [{
    responsibilityId: 'responsibility-000001',
    primaryLifeFunction: 'learn to repair a small shared obligation',
    playerVisibleNeed: 'The current evidence lacks this childhood responsibility.',
    evidenceRefs: ['source/observable-payload.json'],
  }],
  contractPayload: {
    schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1',
    cards: [{
      responsibilityId: 'responsibility-000001',
      primaryLifeFunction: 'learn to repair a small shared obligation',
      playerVisibleNeed: 'The current evidence lacks this childhood responsibility.',
      developmentalAgeJustification: {
        ageMin: 5,
        whyNotEarlier: 'The scene requires sustained responsibility beyond an immediate impulse.',
        whyFromThisAge: 'The child can plausibly understand and carry a small entrusted obligation.',
        whyThroughAgeSeven: 'The same responsibility remains age-appropriate through age seven.',
      },
      concreteSceneConcept: 'The child keeps a small shared task from being abandoned when play becomes distracting.',
      existingContentDistinction: {
        closestEntryIds: ['preschool_neutral_peer_repair'],
        sharedSemanticArea: 'peer-scale responsibility',
        specificDistinction: 'This entry is about maintaining an entrusted obligation rather than repairing a disagreement.',
      },
      actorClass: 'TRANSIENT_ROLE_ONLY',
      pastEvidenceConsumed: 'NONE',
      meaningfulPlayerDecision: 'NONE',
      durableResult: 'EVENT_HISTORY_ID_ONLY',
      futureHook: 'NONE',
      originPortability: 'The scene uses only generic children and a familiar adult, so it fits every canonical origin.',
      scopeCheck: 'CONTRACT_PRESERVING',
      proposedEntry: {
        id: 'preschool_neutral_shared_task_care',
        title: '守住小事',
        text: '大人把一件小事交给你照看，旁边的孩子喊你去玩。你几次回头，还是先把手里的事做完，才跑过去跟上他们。',
        originTags: ['neutral'],
        ageMin: 5,
        ageMax: 7,
      },
    }],
  },
};
```

The tests must also require these negative cases:

```ts
[
  'unknown contractId',
  'responsibility ids out of participant order',
  'APPLICABLE with zero responsibilities',
  'non-APPLICABLE with non-empty responsibilities',
  'contractVersion other than 1 for the preschool contract',
]
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```bash
npm exec tsx tests/evolution/autonomousAuthoringContracts.test.ts
```

Expected: FAIL because the new contract modules/exports do not exist.

- [ ] **Step 3: Implement `autonomousAuthoringContract.ts`**

Define exactly:

```ts
export type AutonomousAuthoringApplicability =
  | 'APPLICABLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED';

export type AutonomousAuthoringConformance =
  | 'CONFORMING'
  | 'NON_CONFORMING'
  | 'AMBIGUOUS';

export type AutonomousAuthoringExecutionEnvelope =
  | 'WITHIN_ENVELOPE'
  | 'EXECUTION_ENVELOPE_EXCEEDED'
  | 'UNKNOWN';

export interface AutonomousAuthoringResponsibilityV1 {
  responsibilityId: string;
  primaryLifeFunction: string;
  playerVisibleNeed: string;
  evidenceRefs: string[];
}

export interface AutonomousAuthoringProposalV1 {
  schemaVersion: 'autonomous-authoring-proposal-v1';
  contractId: string;
  contractVersion: number;
  gapClassification: 'CONTENT_GAP';
  gapSubtype: 'CONTENT_CAPACITY_GAP';
  applicabilityClaim: AutonomousAuthoringApplicability;
  authorityRefs: string[];
  sourceEvidenceRefs: string[];
  responsibilities: AutonomousAuthoringResponsibilityV1[];
  contractPayload: Record<string, unknown> | null;
}

export interface AutonomousAuthoringReviewAssessmentV1 {
  schemaVersion: 'autonomous-authoring-review-assessment-v1';
  contractId: string;
  contractVersion: number;
  applicabilityAssessment: AutonomousAuthoringApplicability;
  conformance: AutonomousAuthoringConformance;
  executionEnvelope: AutonomousAuthoringExecutionEnvelope;
  assessment: string;
  blockers: string[];
}
```

Validation rules:
- responsibility IDs are `responsibility-000001`, `...000002`, in array order;
- `APPLICABLE` requires `1..8` responsibilities and non-null payload;
- all other applicability values require `responsibilities=[]` and `contractPayload=null`;
- exact keys only;
- all refs are non-empty strings;
- the v1 parser recognizes only `preschool-shared-neutral-passive-capacity-v1@1`; unknown autonomous contracts are rejected rather than silently generalized.
- for the recognized preschool Contract, `validateAutonomousAuthoringProposal()` MUST dispatch `contractPayload` through `validatePreschoolSharedNeutralPayload(contractPayload, responsibilities)` before returning the proposal; an unvalidated `Record<string, unknown>` payload must never reach Reviewer or Host routing.

- [ ] **Step 4: Implement the exact preschool Card/payload contract**

In `preschoolSharedNeutralAuthoringContract.ts`, export:

```ts
export const PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID =
  'preschool-shared-neutral-passive-capacity-v1' as const;
export const PRESCHOOL_SHARED_NEUTRAL_CONTRACT_VERSION = 1 as const;
export const PRESCHOOL_SHARED_NEUTRAL_MAX_NEW_ENTRIES = 8 as const;

export const PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH =
  'src/data/lines/preschool-passive-spine.json' as const;

export const PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS = [
  'tests/preschoolPassiveSpineTests.ts',
  'tests/annualPassiveMemoryTests.ts',
] as const;

export const PRESCHOOL_SHARED_NEUTRAL_ALLOWED_WRITE_PATHS = [
  PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH,
  ...PRESCHOOL_SHARED_NEUTRAL_TEST_PATHS,
] as const;

export interface PreschoolSharedNeutralAuthoringCardV1 {
  responsibilityId: string;
  primaryLifeFunction: string;
  playerVisibleNeed: string;
  developmentalAgeJustification: {
    ageMin: 4 | 5 | 6 | 7;
    whyNotEarlier: string;
    whyFromThisAge: string;
    whyThroughAgeSeven: string;
  };
  concreteSceneConcept: string;
  existingContentDistinction: {
    closestEntryIds: string[];
    sharedSemanticArea: string;
    specificDistinction: string;
  };
  actorClass: 'TRANSIENT_ROLE_ONLY';
  pastEvidenceConsumed: 'NONE';
  meaningfulPlayerDecision: 'NONE';
  durableResult: 'EVENT_HISTORY_ID_ONLY';
  futureHook: 'NONE';
  originPortability: string;
  scopeCheck: 'CONTRACT_PRESERVING';
  proposedEntry: {
    id: string;
    title: string;
    text: string;
    originTags: ['neutral'];
    ageMin: 4 | 5 | 6 | 7;
    ageMax: 7;
  };
}

export interface PreschoolSharedNeutralAuthoringPayloadV1 {
  schemaVersion: 'preschool-shared-neutral-passive-authoring-payload-v1';
  cards: PreschoolSharedNeutralAuthoringCardV1[];
}
```

`validatePreschoolSharedNeutralPayload()` must mechanically require:
- one Card per responsibility, same order and same `responsibilityId`;
- Card `primaryLifeFunction` and `playerVisibleNeed` exactly equal its responsibility;
- `cards.length <= 8`;
- proposed ID matches `^preschool_neutral_[a-z0-9_]+$`;
- reject IDs containing `filler`, `extra`, `capacity`, or a numeric-only semantic suffix;
- `originTags` exactly `["neutral"]`;
- `ageMax === 7`;
- `proposedEntry.ageMin === developmentalAgeJustification.ageMin`;
- closest-entry IDs are non-empty and unique;
- all prose fields are non-empty;
- no historical five-entry IDs or life functions are hardcoded in this validator.

- [ ] **Step 5: Add optional companion fields to existing Solution/Reviewer contracts**

In `SolutionOptionV1` add:

```ts
autonomousAuthoring?: AutonomousAuthoringProposalV1;
```

Add `'autonomousAuthoring'` to optional option keys only.

In `SolutionReviewV1` add:

```ts
autonomousAuthoringAssessment?: AutonomousAuthoringReviewAssessmentV1;
```

Validation:
- historical reviews without the field still parse;
- non-`ACCEPT_OPTION` reviews may omit it and continue current behavior;
- when present, it is exact-key validated;
- cross-artifact consistency is enforced in the Reviewer runner in Task 3, not by the standalone parser.

- [ ] **Step 6: Pin historical compatibility**

Extend `problemAgnosticSolutionContracts.test.ts` so this exact pattern still round-trips:

```ts
const historicalOption = {
  optionId: 'option-000001',
  proposedChange: 'Adjust an existing configuration value.',
  rationale: 'Historical option with no authoring companion.',
  repoRefs: [],
  artifactRefs: [],
  changeScope: 'configuration',
  expectedPlayerObservableDifference: 'A bounded configuration difference.',
  risks: [],
  unknowns: [],
};

assert.equal(
  parseSolutionWork(JSON.stringify({
    schemaVersion: 'solution-work-v1',
    status: 'OPTIONS',
    problemId: 'problem-historical',
    options: [historicalOption],
    recommendedOptionId: 'option-000001',
    summary: 'historical',
    repoRefs: [],
    artifactRefs: [],
  })).options[0]!.autonomousAuthoring,
  undefined,
);
```

Do the same for a historical `SolutionReviewV1` with no autonomous assessment.

- [ ] **Step 7: Run focused contract tests**

```bash
npm exec tsx tests/evolution/autonomousAuthoringContracts.test.ts
npm exec tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add \
  src/evolution/autonomousAuthoringContract.ts \
  src/evolution/preschoolSharedNeutralAuthoringContract.ts \
  src/evolution/solutionWorkContract.ts \
  src/evolution/solutionReviewContract.ts \
  tests/evolution/autonomousAuthoringContracts.test.ts \
  tests/evolution/problemAgnosticSolutionContracts.test.ts
git commit -m "feat: define autonomous authoring contracts"
```

---

### Task 3: Participant-Safe Contract Packet and Solution/Reviewer Authoring Semantics

**Files:**
- Create: `scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts:138-250`
- Modify: `scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts:94-190`
- Modify: `scripts/evolution/runCandidateLane.ts:158-330`
- Modify: `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts`
- Modify: `scripts/evolution/runCandidateReviewContinuation.ts`
- Modify: `scripts/evolution/runMultiCandidateSessionSlice.ts` default authority refs
- Test: `tests/evolution/solutionAgentLoop.test.ts`
- Test: `tests/evolution/solutionReviewerLoop.test.ts`
- Test: `tests/evolution/reviewContinuation.test.ts`
- Test: `tests/evolution/autonomousAuthoringContracts.test.ts`

**Interfaces:**
- Consumes: Task 2 companion contracts.
- Produces:
  - `PreschoolAutonomousAuthoringContractPacketV1`
  - `buildPreschoolAutonomousAuthoringContractPacket()`
  - optional `autonomousAuthoringContractPacket` inputs on Solution/Reviewer/revision/re-review runners
  - exact accepted `AutonomousAuthoringProposalV1` / review assessment available to Host.

- [ ] **Step 1: Write RED tests for an answer-free packet**

Write the test with the accepted spec bytes as the provenance anchor:

```ts
const authoritySourceRef =
  'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
const expectedAuthoritySha = sha256Hex(
  await readFile(join(repositoryRoot, authoritySourceRef)),
);

const packet = await buildPreschoolAutonomousAuthoringContractPacket({
  repositoryRoot,
});

assert.equal(packet.schemaVersion, 'preschool-autonomous-authoring-contract-packet-v1');
assert.equal(packet.authorityIdentifier, 'contract-constrained-autonomous-authoring-v1-20260924');
assert.equal(packet.authoritySourceRef, authoritySourceRef);
assert.equal(packet.authoritySourceSha256, expectedAuthoritySha);
assert.equal(packet.contractId, 'preschool-shared-neutral-passive-capacity-v1');
assert.equal(packet.contractVersion, 1);
assert.equal(packet.maxNewEntries, 8);
assert.equal(packet.productionPath, 'src/data/lines/preschool-passive-spine.json');
assert.deepEqual(packet.testPaths, [
  'tests/preschoolPassiveSpineTests.ts',
  'tests/annualPassiveMemoryTests.ts',
]);
assert.deepEqual(packet.allowedOriginTags, ['neutral']);
assert.deepEqual(packet.allowedAgeMin, [4, 5, 6, 7]);
assert.equal(packet.ageMax, 7);
assert.deepEqual(packet.forbiddenFields, ['statDeltas', 'flags']);
assert.equal(
  packet.forbiddenCapabilities.includes('person_or_relationship'),
  true,
);
assert.equal(
  packet.applicabilityRules.includes('Decide applicability before authoring.'),
  true,
);
assert.equal(
  packet.cardRules.includes('One primary responsibility maps to exactly one Card.'),
  true,
);
```

The serialized packet MUST NOT contain these historical answer strings:

```text
preschool_neutral_fair_play
preschool_neutral_self_made_project
preschool_neutral_stand_for_peer
preschool_neutral_first_farewell
preschool_neutral_neighborhood_help
fairness
self-directed persistence
moral courage
farewell
neighborhood participation
```

- [ ] **Step 2: Run packet/agent tests to verify RED**

```bash
npm exec tsx tests/evolution/autonomousAuthoringContracts.test.ts
npm exec tsx tests/evolution/solutionAgentLoop.test.ts
npm exec tsx tests/evolution/solutionReviewerLoop.test.ts
```

Expected: FAIL because the packet and prompt integration do not exist.

- [ ] **Step 3: Implement the participant-safe packet**

The packet is a Host-created projection, not independent authority. Include:

```ts
export interface PreschoolAutonomousAuthoringContractPacketV1 {
  schemaVersion: 'preschool-autonomous-authoring-contract-packet-v1';
  authorityIdentifier: 'contract-constrained-autonomous-authoring-v1-20260924';
  authoritySourceRef: 'docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md';
  authoritySourceSha256: string;
  contractId: typeof PRESCHOOL_SHARED_NEUTRAL_CONTRACT_ID;
  contractVersion: 1;
  maxNewEntries: 8;
  productionPath: typeof PRESCHOOL_SHARED_NEUTRAL_PRODUCTION_PATH;
  testPaths: readonly [
    'tests/preschoolPassiveSpineTests.ts',
    'tests/annualPassiveMemoryTests.ts',
  ];
  allowedOriginTags: readonly ['neutral'];
  allowedAgeMin: readonly [4, 5, 6, 7];
  ageMax: 7;
  forbiddenFields: readonly ['statDeltas', 'flags'];
  forbiddenCapabilities: readonly string[];
  applicabilityRules: readonly string[];
  cardRules: readonly string[];
}
```

Populate `applicabilityRules` and `cardRules` from the accepted Contract semantics, but do not include any historical answer names. Compute `authoritySourceSha256` from the current accepted spec bytes on the Host. The packet is a provenance-bound safe projection of that authority; the answer-bearing spec file itself is not materialized into Participant workspaces.

- [ ] **Step 4: Extend Solution prompt/input with the packet**

Add optional input:

```ts
autonomousAuthoringContractPacket?: PreschoolAutonomousAuthoringContractPacketV1;
```

When present, the Solution prompt must state in this order:

```text
1. Decide applicability before authoring.
2. Only APPLICABLE may contain responsibilities and Cards.
3. Derive the Minimum Sufficient Responsibility Set from permitted evidence and current catalog semantics.
4. Do not use a target count; max 8 is only an execution ceiling.
5. One primary responsibility maps to exactly one Card.
6. Do not author new content before applicability is established.
7. If evidence is insufficient, preserve INSUFFICIENT_EVIDENCE rather than guessing.
8. If a reasonable solution requires new semantics/mechanics, use CONTRACT_CHANGE_REQUIRED.
9. Attach autonomousAuthoring only to an option with changeScope='program'; this lane is not ordinary config execution.
```

Render the packet as canonical JSON after these instructions.

- [ ] **Step 5: Extend Reviewer prompt/input with the packet**

For an option carrying `autonomousAuthoring`, require the Reviewer to:
- independently inspect current catalog and allowed evidence;
- verify applicability, each responsibility, age reasoning, shared-neutral portability, closest-entry distinction, transient-role boundary, non-filler semantics, and no new durable state;
- emit `autonomousAuthoringAssessment`;
- use `executionAuthorityAssessment='WITHIN_CURRENT_AUTHORITY'` only when the reusable Contract itself covers shadow execution;
- still remember that authoritative repository promotion is not authorized.

The prompt must say:

```text
ACCEPT_OPTION + autonomous authoring requires:
- applicabilityAssessment = APPLICABLE
- conformance = CONFORMING
- executionEnvelope = WITHIN_ENVELOPE
- blockers = []
```

If those cannot be true, Reviewer must choose the existing `REQUEST_MORE_WORK`, `DEFER`, `REJECT`, or `ESCALATE` decision instead of encoding a contradiction.

- [ ] **Step 6: Add cross-artifact validation in the Reviewer runner**

Before accepting Reviewer output, enforce:

```ts
if (review.decision === 'ACCEPT_OPTION' && selectedOption.autonomousAuthoring) {
  const assessment = review.autonomousAuthoringAssessment;
  if (!assessment) throw outputSchemaFailure;
  if (assessment.contractId !== selectedOption.autonomousAuthoring.contractId) throw outputSchemaFailure;
  if (assessment.contractVersion !== selectedOption.autonomousAuthoring.contractVersion) throw outputSchemaFailure;
  if (assessment.applicabilityAssessment !== 'APPLICABLE') throw outputSchemaFailure;
  if (assessment.conformance !== 'CONFORMING') throw outputSchemaFailure;
  if (assessment.executionEnvelope !== 'WITHIN_ENVELOPE') throw outputSchemaFailure;
  if (assessment.blockers.length !== 0) throw outputSchemaFailure;
}
```

If the accepted option is not autonomous, preserve the current Reviewer semantics unchanged.

- [ ] **Step 7: Make the active Candidate lane deliver the packet without exposing Host internals**

Build one packet per Candidate lane and pass it directly to Solution/Reviewer prompt builders.

Add these repository authority refs to `DEFAULT_AUTHORITY_REFS`:

```text
docs/product/content-authoring-workflow-contract-design.md
docs/governance/product-decisions.md
```

Do **not** add the full accepted design spec to Participant authority refs; its historical reference-trial section names the old answer set.

The Candidate `artifactRelativePaths` must remain player-observable/current diagnostic artifacts only. Do not add `internal/player-surface-source.json`.

- [ ] **Step 8: Pass the same packet through bounded continuation**

Extend `RunReviewContinuationInput` and `RunCandidateReviewContinuationInput` with the optional packet and pass it to both Solution revision and re-review.

A continuation must not gain a different Contract version or packet than the base lane.

- [ ] **Step 9: Add prompt and identity tests**

Tests must assert:
- Solution prompt contains “applicability before authoring”, `maxNewEntries=8`, and `changeScope='program'`;
- Reviewer prompt contains the three accepted autonomous assessment values;
- packet serialization contains none of the forbidden historical answer strings;
- base and continuation prompts use the same `contractId/version`.

- [ ] **Step 10: Run focused tests**

```bash
npm exec tsx tests/evolution/autonomousAuthoringContracts.test.ts
npm exec tsx tests/evolution/solutionAgentLoop.test.ts
npm exec tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec tsx tests/evolution/reviewContinuation.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add \
  scripts/evolution/autonomousAuthoring/buildPreschoolContractPacket.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionAgent.ts \
  scripts/evolution/problemAgnosticSolution/runSolutionReviewer.ts \
  scripts/evolution/runCandidateLane.ts \
  scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts \
  scripts/evolution/runCandidateReviewContinuation.ts \
  scripts/evolution/runMultiCandidateSessionSlice.ts \
  tests/evolution/autonomousAuthoringContracts.test.ts \
  tests/evolution/solutionAgentLoop.test.ts \
  tests/evolution/solutionReviewerLoop.test.ts \
  tests/evolution/reviewContinuation.test.ts
git commit -m "feat: add autonomous authoring participant contract"
```

---

### Task 4: Host-Only Applicability Evidence and Admission Gate

**Files:**
- Create: `src/evolution/autonomousAuthoringAdmissionContract.ts`
- Create: `scripts/evolution/autonomousAuthoring/evaluatePreschoolAuthoringAdmission.ts`
- Modify: `scripts/evolution/runCandidateLane.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts`
- Test: `tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts`
- Test: `tests/evolution/phase0EndToEnd.test.ts`

**Interfaces:**
- Consumes: accepted selected option, Reviewer assessment, current catalog, sealed Host source.
- Produces:
  - `AutonomousAuthoringAdmissionStatus`
  - `AutonomousAuthoringAdmissionV1`
  - `evaluatePreschoolAutonomousAuthoringAdmission(input)`
  - Host-only `autonomous-authoring-admission.json`.

- [ ] **Step 1: Write RED tests for admission statuses and exact Host-only evidence behavior**

Define test cases for:

```text
ELIGIBLE
NOT_APPLICABLE
INSUFFICIENT_EVIDENCE
CONTRACT_CHANGE_REQUIRED
EXECUTION_ENVELOPE_EXCEEDED
AUTHORITY_STALE
```

At minimum:
- a gap with a legal unconsumed authored entry before it → `NOT_APPLICABLE`;
- foreign-exclusive authored IDs in one run → `NOT_APPLICABLE`;
- no `passiveEntryIds`/no fixed evidence → `INSUFFICIENT_EVIDENCE`;
- APPLICABLE proposal with 9 responsibilities → `EXECUTION_ENVELOPE_EXCEEDED`;
- missing PD-121/current Contract authority marker → `AUTHORITY_STALE`;
- exact whole-pool exhaustion plus conforming <=8 proposal → `ELIGIBLE` with `evidenceMode='STRUCTURAL_EXHAUSTION'`;
- a no-gap chronology with no scheduling/origin contradiction plus a Reviewer-confirmed player-visible semantic-variety gap → `ELIGIBLE` with `evidenceMode='SEMANTIC_VARIETY'`; Host must not invent a structural deficit for this case.

- [ ] **Step 2: Run RED**

```bash
npm exec tsx tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts
```

Expected: FAIL because admission types/evaluator do not exist.

- [ ] **Step 3: Implement the admission contract**

Use:

```ts
export type AutonomousAuthoringAdmissionStatus =
  | 'ELIGIBLE'
  | 'NOT_APPLICABLE'
  | 'INSUFFICIENT_EVIDENCE'
  | 'CONTRACT_CHANGE_REQUIRED'
  | 'EXECUTION_ENVELOPE_EXCEEDED'
  | 'AUTHORITY_STALE';

export interface PreschoolCapacityBeatEvidenceV1 {
  sequence: number;
  age: 4 | 5 | 6 | 7;
  selectedEntryId: string;
  kind: 'AUTHORED' | 'GAP';
  legalUnconsumedCountBeforeSelection: number;
}

export interface PreschoolCapacityEvidenceV1 {
  schemaVersion: 'preschool-capacity-evidence-v1';
  runRef: string;
  evidenceMode: 'STRUCTURAL_EXHAUSTION' | 'SEMANTIC_VARIETY';
  canonicalOriginTag: 'scholar' | 'martial' | 'merchant' | 'frontier';
  preConsumedEntryIds: string[];
  beats: PreschoolCapacityBeatEvidenceV1[];
  demandBeats: number;
  authoredBeats: number;
  gapBeats: number;
  foreignOriginLeakCount: number;
  duplicateAuthoredCount: number;
}

export interface AutonomousAuthoringAdmissionV1 {
  schemaVersion: 'autonomous-authoring-admission-v1';
  contractId: 'preschool-shared-neutral-passive-capacity-v1';
  contractVersion: 1;
  status: AutonomousAuthoringAdmissionStatus;
  proposalSha256: string;
  reviewSha256: string;
  sourceRunRef: string;
  authorityRefs: string[];
  allowedWritePaths: string[];
  maxNewEntries: 8;
  capacityEvidence: PreschoolCapacityEvidenceV1 | null;
  reasons: string[];
}
```

Exact-key validation is required.

- [ ] **Step 4: Implement natural-run evidence reconstruction from Host-only sealed source**

Input includes:

```ts
{
  repositoryRoot: string;
  sourceRoot: string;
  sourceRunRef: string;
  selectedOption: SolutionOptionV1;
  review: SolutionReviewV1;
  proposalSha256: string;
  reviewSha256: string;
}
```

Read only on the Host:

```text
<sourceRoot>/game-runs/<sourceRunRef>/internal/player-surface-source.json
```

Algorithm:
1. infer the canonical four-origin tag from Host-only packed-passive provenance across ages `0..7`, using any unambiguous origin-specific authored ID; if no canonical four-origin tag is inferable, return `INSUFFICIENT_EVIDENCE`; if conflicting canonical origins are observed, return `NOT_APPLICABLE`;
2. flatten `passive_narrative` steps with age `4..7` into ordered beats from `passiveEntryIds`;
3. if an applicable packed passive step lacks exact IDs, return `INSUFFICIENT_EVIDENCE`;
4. resolve every non-gap ID against the catalog for the repository baseline being evaluated; normal natural execution uses current `dev`, while the historical reference trial supplies the historical catalog snapshot explicitly;
5. collect `preConsumedEntryIds` from earlier packed-passive acknowledgements before age 4 whenever an authored ID belongs to the evaluated preschool candidate catalog; preserve first-consumption order and reject duplicate prior consumption as contradictory evidence;
6. initialize the consumed-ID set from `preConsumedEntryIds`, then walk age-4–7 beats sequentially;
7. before each beat, compute the legal current-age matching-origin + neutral, not-consumed pool;
8. recognize GAP IDs only as `preschool_passive_gap` or `preschool_passive_gap::*`;
9. if a GAP occurs while this pool is non-empty, return `NOT_APPLICABLE`;
10. if an AUTHORED ID is foreign, age-illegal, missing from the evaluated catalog, or already consumed, return `NOT_APPLICABLE`;
11. record counts and consume authored IDs;
12. when at least one valid whole-pool-exhaustion GAP exists, set `evidenceMode='STRUCTURAL_EXHAUSTION'`;
13. when there are no generic gaps, Host may set `evidenceMode='SEMANTIC_VARIETY'` only if the accepted proposal/review establishes the missing/repeated life-function problem from Participant-permitted player-visible evidence and Host checks find no Scheduling/Access/origin contradiction. This mode records zero structural deficit; it does not manufacture capacity failure.

Do not copy the raw source or exact `passiveEntryIds` into participant artifacts.

- [ ] **Step 5: Implement fixed-evidence injection for the historical reference trial**

The same evaluator accepts:

```ts
fixedCapacityEvidence?: PreschoolCapacityEvidenceV1;
```

Rules:
- if provided, it is validated and used instead of reading current sealed source;
- the evaluator never synthesizes missing beats;
- a missing/invalid required historical fixture produces `INSUFFICIENT_EVIDENCE`, not a replay.

- [ ] **Step 6: Implement authority and proposal/review checks**

`ELIGIBLE` requires all:
- `contractId/version` exact;
- `gapClassification='CONTENT_GAP'` and `gapSubtype='CONTENT_CAPACITY_GAP'`;
- proposal claim `APPLICABLE`;
- Reviewer assessment `APPLICABLE / CONFORMING / WITHIN_ENVELOPE / blockers=[]`;
- `executionAuthorityAssessment='WITHIN_CURRENT_AUTHORITY'`;
- `responsibilities.length <= 8`;
- current governance contains PD-121 and the canonical Content Authoring Workflow v3 authority;
- current accepted spec status is `HUMAN ACCEPTED — 2026-09-24`;
- Host evidence does not contradict the diagnosis:
  - `STRUCTURAL_EXHAUSTION` requires every observed GAP to occur at legal-unconsumed count `0`;
  - `SEMANTIC_VARIETY` requires no Host-observed scheduling/origin/access contradiction and does not claim structural exhaustion.

Map proposal claims:
- `INSUFFICIENT_EVIDENCE` → same admission status;
- `CONTRACT_CHANGE_REQUIRED` → same admission status;
- `NOT_APPLICABLE` → same admission status;
- APPLICABLE with >8 → `EXECUTION_ENVELOPE_EXCEEDED`.

- [ ] **Step 7: Write the admission only after Reviewer completion**

In base and continuation paths, create:

```text
autonomous-authoring-admission.json
```

only after the accepted Solution and independent Reviewer exist.

The file stays in the Candidate lane and is retained as Host evidence. It is never included in Solution/Reviewer workspace artifact lists.

- [ ] **Step 8: Add explicit PD-111 leakage regression**

Extend `phase0EndToEnd.test.ts` and admission tests so:
- reviewer observable payload still contains no `passiveEntryIds`;
- Solution/Reviewer prompt strings contain no raw selected preschool IDs supplied by Host admission;
- the participant contract packet contains no raw sealed-source fields;
- `autonomous-authoring-admission.json` is created after review and not present in either agent workspace materialization manifest.

- [ ] **Step 9: Run focused tests**

```bash
npm exec tsx tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add \
  src/evolution/autonomousAuthoringAdmissionContract.ts \
  scripts/evolution/autonomousAuthoring/evaluatePreschoolAuthoringAdmission.ts \
  scripts/evolution/runCandidateLane.ts \
  scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts \
  tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts \
  tests/evolution/phase0EndToEnd.test.ts
git commit -m "feat: gate shadow authoring with host evidence"
```

---

### Task 5: Decision Routing, HFL Mapping, and Continuation Identity

**Files:**
- Modify: `src/evolution/solutionDecisionContract.ts:1-190`
- Modify: `scripts/evolution/problemAgnosticSolution/routeSolutionDecision.ts:1-78`
- Modify: `scripts/evolution/runCandidateLane.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts`
- Modify: `scripts/evolution/runCandidateReviewContinuation.ts`
- Modify: `src/evolution/humanFollowupWorkItemContract.ts`
- Modify: `scripts/evolution/humanFollowup/retainHumanFollowupWorkItem.ts`
- Modify: `scripts/evolution/replay/runSolutionDecisionReplay.ts`
- Test: `tests/evolution/solutionDecisionRouter.test.ts`
- Test: `tests/evolution/solutionDecisionReplay.test.ts`
- Test: `tests/evolution/reviewContinuation.test.ts`
- Test: `tests/evolution/humanFollowupWorkItemContract.test.ts`
- Test: `tests/evolution/humanFollowupRetention.test.ts`

**Interfaces:**
- Consumes: `AutonomousAuthoringAdmissionStatus`.
- Produces:
  - new route `READY_FOR_SHADOW_AUTHORING`
  - new durable reason codes
  - optional Decision inputs `autonomousAuthoringRequested` and `autonomousAuthoringAdmissionStatus`
  - effective Solution/Review/admission paths from base and continuation.

- [ ] **Step 1: Write RED routing tests**

Add exact cases:

```ts
assert.equal(
  route({
    solutionScope: 'program',
    reviewScope: 'code_required',
    executionAuthorityAssessment: 'WITHIN_CURRENT_AUTHORITY',
    autonomousAuthoringRequested: true,
    autonomousAuthoringAdmissionStatus: 'ELIGIBLE',
  }).route,
  'READY_FOR_SHADOW_AUTHORING',
);
```

And:
- `INSUFFICIENT_EVIDENCE` → `DEFER`;
- `CONTRACT_CHANGE_REQUIRED` → `ESCALATE_HUMAN`;
- `EXECUTION_ENVELOPE_EXCEEDED` → `ESCALATE_HUMAN`;
- `AUTHORITY_STALE` → `ESCALATE_HUMAN`;
- autonomous requested + `NOT_APPLICABLE` + `changeScope='program'` → existing `ACCEPTED_OUT_OF_SCOPE` escalation;
- autonomous requested + admission missing/null MUST NOT return `READY_FOR_CONFIG_EXECUTION`;
- ordinary config + `WITHIN_CURRENT_AUTHORITY` remains `READY_FOR_CONFIG_EXECUTION`;
- historical decision with no autonomous fields still parses.

- [ ] **Step 2: Run routing tests to verify RED**

```bash
npm exec tsx tests/evolution/solutionDecisionRouter.test.ts
npm exec tsx tests/evolution/solutionDecisionReplay.test.ts
```

Expected: FAIL on unknown route/fields.

- [ ] **Step 3: Extend the Decision contract additively**

Add route:

```ts
| 'READY_FOR_SHADOW_AUTHORING'
```

Add reason codes:

```ts
| 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE'
| 'AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE'
| 'AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED'
| 'AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED'
| 'AUTONOMOUS_AUTHORING_AUTHORITY_STALE'
```

Add optional inputs:

```ts
autonomousAuthoringRequested?: boolean;
autonomousAuthoringAdmissionStatus?: AutonomousAuthoringAdmissionStatus | null;
```

Update `ROUTES`, `REASONS`, `INPUT_OPTIONAL_KEYS`, and `assertReasonRoute()` in the same change. The new reason/route pairs are exact:

```text
ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE → READY_FOR_SHADOW_AUTHORING
AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE → DEFER
AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED → ESCALATE_HUMAN
AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED → ESCALATE_HUMAN
AUTONOMOUS_AUTHORING_AUTHORITY_STALE → ESCALATE_HUMAN
```

`validateSolutionDecision()` must additionally reject `READY_FOR_SHADOW_AUTHORING` unless:
- `solutionStatus === 'OPTIONS'`;
- `reviewerDecision === 'ACCEPT_OPTION'`;
- `executionAuthorityAssessment === 'WITHIN_CURRENT_AUTHORITY'`;
- `autonomousAuthoringRequested === true`;
- `autonomousAuthoringAdmissionStatus === 'ELIGIBLE'`.

Historical decisions lacking both optional autonomous fields remain valid.

- [ ] **Step 4: Route autonomous authoring before ordinary config routing**

The accepted-option branch order must be:

```ts
if (input.autonomousAuthoringRequested) {
  if (input.executionAuthorityAssessment === 'HUMAN_AUTHORITY_REQUIRED') {
    return { route: 'ESCALATE_HUMAN', reasonCode: 'ACCEPTED_REQUIRES_HUMAN_AUTHORITY' };
  }
  if (input.executionAuthorityAssessment !== 'WITHIN_CURRENT_AUTHORITY') {
    return { route: 'ESCALATE_HUMAN', reasonCode: 'EXECUTION_AUTHORITY_UNCERTAIN' };
  }
  switch (input.autonomousAuthoringAdmissionStatus) {
    case 'ELIGIBLE':
      return { route: 'READY_FOR_SHADOW_AUTHORING', reasonCode: 'ACCEPTED_AUTONOMOUS_AUTHORING_SCOPE' };
    case 'INSUFFICIENT_EVIDENCE':
      return { route: 'DEFER', reasonCode: 'AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE' };
    case 'CONTRACT_CHANGE_REQUIRED':
      return { route: 'ESCALATE_HUMAN', reasonCode: 'AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED' };
    case 'EXECUTION_ENVELOPE_EXCEEDED':
      return { route: 'ESCALATE_HUMAN', reasonCode: 'AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED' };
    case 'AUTHORITY_STALE':
      return { route: 'ESCALATE_HUMAN', reasonCode: 'AUTONOMOUS_AUTHORING_AUTHORITY_STALE' };
    case 'NOT_APPLICABLE':
    case null:
      break;
  }
}
```

Then execute the existing config/program routing unchanged.

This ordering is the guard against silently treating formal content authoring as ordinary configuration execution.

- [ ] **Step 5: Make base and continuation lanes persist exact effective artifact paths**

Extend completed lane/continuation results with:

```ts
effectiveSolutionPath: string;
effectiveReviewPath: string | null;
autonomousAuthoringAdmissionPath: string | null;
```

For the base lane:
- solution = `solution-agent/result.json`;
- review = `reviewer-agent/review.json` when present;
- admission = `autonomous-authoring-admission.json` when an autonomous option was reviewed.

For continuation:
- return the actual revision/re-review artifact paths produced by `runReviewContinuation`;
- return the continuation admission path generated against the revised pair.

The session layer must never guess these paths from directory naming.

- [ ] **Step 6: Extend HFL typed reason support**

Allow these new `ESCALATE_HUMAN` reasons:

```text
AUTONOMOUS_AUTHORING_CONTRACT_CHANGE_REQUIRED
AUTONOMOUS_AUTHORING_EXECUTION_ENVELOPE_EXCEEDED
AUTONOMOUS_AUTHORING_AUTHORITY_STALE
```

Do not create HFL for `AUTONOMOUS_AUTHORING_INSUFFICIENT_EVIDENCE` because it routes `DEFER`.

- [ ] **Step 7: Preserve replay compatibility**

`runSolutionDecisionReplay.ts` accepts the two optional autonomous fields. Missing fields are normalized as absent/null and replay current historical inputs unchanged.

- [ ] **Step 8: Run focused routing/HFL/continuation tests**

```bash
npm exec tsx tests/evolution/solutionDecisionRouter.test.ts
npm exec tsx tests/evolution/solutionDecisionReplay.test.ts
npm exec tsx tests/evolution/reviewContinuation.test.ts
npm exec tsx tests/evolution/humanFollowupWorkItemContract.test.ts
npm exec tsx tests/evolution/humanFollowupRetention.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add \
  src/evolution/solutionDecisionContract.ts \
  scripts/evolution/problemAgnosticSolution/routeSolutionDecision.ts \
  scripts/evolution/runCandidateLane.ts \
  scripts/evolution/problemAgnosticSolution/runReviewContinuation.ts \
  scripts/evolution/runCandidateReviewContinuation.ts \
  src/evolution/humanFollowupWorkItemContract.ts \
  scripts/evolution/humanFollowup/retainHumanFollowupWorkItem.ts \
  scripts/evolution/replay/runSolutionDecisionReplay.ts \
  tests/evolution/solutionDecisionRouter.test.ts \
  tests/evolution/solutionDecisionReplay.test.ts \
  tests/evolution/reviewContinuation.test.ts \
  tests/evolution/humanFollowupWorkItemContract.test.ts \
  tests/evolution/humanFollowupRetention.test.ts
git commit -m "feat: route eligible shadow authoring"
```

---

### Task 6: Isolated Shadow Executor and Canonical Workspace Change Set

**Files:**
- Create: `src/evolution/shadowAuthoringResultContract.ts`
- Create: `scripts/evolution/autonomousAuthoring/shadowAuthoringExecutionParticipant.ts`
- Create: `scripts/evolution/autonomousAuthoring/workspaceChangeSet.ts`
- Modify: `scripts/evolution/problemAgnosticSolution/agentWorkspace.ts:20-70, 193-end`
- Test: `tests/evolution/shadowAuthoringExecution.test.ts`
- Test: `tests/evolution/agentWorkspaceIsolation.test.ts`

**Interfaces:**
- Consumes: accepted effective Solution/Review/admission and `CODEX_CURRENT`-compatible `WorkspaceAgentParticipantOptions`.
- Produces:
  - isolated `shadow-authoring` workspace kind
  - diagnostic executor result
  - canonical Host-derived changed-file set
  - deterministic `promotion.patch` bytes and SHA-256.

- [ ] **Step 1: Write RED tests for exact implementation and Host-derived changes**

Tests must prove:
- `jobKind='shadow-authoring'` can be materialized with the same exclusion/fingerprint rules as Solution/Reviewer;
- executor is given exactly the three allowed paths;
- participant-reported `changedFiles` is ignored for authority;
- Host detects an undeclared changed file even if Participant omits it from its result;
- existing authoritative fingerprint remains identical;
- deterministic patch bytes are stable for the same before/after trees.

- [ ] **Step 2: Run RED**

```bash
npm exec tsx tests/evolution/shadowAuthoringExecution.test.ts
npm exec tsx tests/evolution/agentWorkspaceIsolation.test.ts
```

Expected: FAIL because the workspace kind/executor/change-set utilities do not exist.

- [ ] **Step 3: Extend workspace materialization with a `shadow-authoring` job kind**

Change:

```ts
jobKind: 'solution' | 'reviewer' | 'evolution' | 'shadow-authoring';
```

Export a read-only snapshot function:

```ts
export interface WorkspaceSnapshotEntry {
  path: string;
  objectKind: 'regular_file' | 'symlink';
  sha256: string;
}

export interface WorkspaceSnapshot {
  fingerprintSha256: string;
  entries: WorkspaceSnapshotEntry[];
}

export async function captureWorkspaceSnapshot(root: string): Promise<WorkspaceSnapshot>;
```

It must use the same exclusion predicate as existing workspace fingerprinting.

- [ ] **Step 4: Define `shadowAuthoringResultContract.ts`**

Use these exact terminal statuses:

```ts
export type ShadowAuthoringTerminalStatus =
  | 'SHADOW_AUTHORING_VERIFIED'
  | 'SHADOW_AUTHORING_EXECUTION_FAILED'
  | 'SHADOW_AUTHORING_CONFORMANCE_FAILED'
  | 'SHADOW_AUTHORING_VERIFICATION_FAILED'
  | 'CONTRACT_CHANGE_REQUIRED'
  | 'EXECUTION_ENVELOPE_EXCEEDED';
```

The executor itself returns only implementation facts:

```ts
export interface ShadowAuthoringExecutionParticipantResultV1 {
  schemaVersion: 'shadow-authoring-execution-participant-result-v1';
  status: 'completed' | 'failed';
  changedFiles: string[];
  verificationCommandsRun: string[];
  deviations: string[];
}
```

Host-owned final `ShadowAuthoringResultV1` additionally contains:
- terminal status;
- contract identity;
- proposal/review/admission hashes;
- canonical changed-file refs;
- verification artifact ref;
- promotion package ref or null;
- authoritative fingerprint before/after;
- `participantJobs: 1`.

- [ ] **Step 5: Implement the Shadow Executor prompt**

The prompt must include:
- exact accepted Cards as immutable product content;
- exact allowed write paths;
- exact production path and two test paths;
- instruction to append accepted catalog rows exactly;
- instruction to append a self-contained focused regression block at EOF of each approved test file for the proposed rows; existing test-file bytes must remain untouched;
- instruction not to alter any accepted title/text/age/ID;
- instruction not to modify any other file;
- instruction not to commit/push/merge;
- instruction that its `changedFiles` report is diagnostic and Host will independently diff.

The prompt must not contain raw Phase 0 internal source.

- [ ] **Step 6: Implement canonical change-set comparison**

Export:

```ts
export interface CanonicalWorkspaceChange {
  path: string;
  changeType: 'ADDED' | 'MODIFIED' | 'DELETED';
  beforeSha256: string | null;
  afterSha256: string | null;
}

export function compareWorkspaceSnapshots(
  before: WorkspaceSnapshot,
  after: WorkspaceSnapshot,
): CanonicalWorkspaceChange[];
```

Sort by `path`. Host authority uses only this result.

- [ ] **Step 7: Implement deterministic patch generation**

For changed regular text files:
1. create a temporary `before/` and `after/` mirror containing only changed paths;
2. run Git CLI `git diff --no-index --binary --no-ext-diff --no-renames before after`; treat exit code `1` as the expected “differences found” result, exit code `0` as “no differences”, and any exit code `>1` as infrastructure failure;
3. rewrite only the fixed temporary root prefixes so patch headers become normal `a/<repo-path>` and `b/<repo-path>`;
4. write exact bytes ending in one newline;
5. hash with existing `sha256Hex`.

Do not depend on a new npm diff library.

- [ ] **Step 8: Run focused tests**

```bash
npm exec tsx tests/evolution/shadowAuthoringExecution.test.ts
npm exec tsx tests/evolution/agentWorkspaceIsolation.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add \
  src/evolution/shadowAuthoringResultContract.ts \
  scripts/evolution/autonomousAuthoring/shadowAuthoringExecutionParticipant.ts \
  scripts/evolution/autonomousAuthoring/workspaceChangeSet.ts \
  scripts/evolution/problemAgnosticSolution/agentWorkspace.ts \
  tests/evolution/shadowAuthoringExecution.test.ts \
  tests/evolution/agentWorkspaceIsolation.test.ts
git commit -m "feat: add isolated shadow authoring executor"
```

---

### Task 7: Five-Layer Host Verification and Promotion Package

**Files:**
- Create: `scripts/evolution/autonomousAuthoring/verifyPreschoolShadowAuthoring.ts`
- Create: `scripts/evolution/autonomousAuthoring/buildPromotionPackage.ts`
- Test: `tests/evolution/preschoolShadowAuthoringVerification.test.ts`
- Modify for regression markers only when executing shadow patch: `tests/preschoolPassiveSpineTests.ts`
- Modify for regression markers only when executing shadow patch: `tests/annualPassiveMemoryTests.ts`

**Interfaces:**
- Consumes: before/final workspace snapshots, accepted proposal/review/admission, fixed/natural capacity evidence.
- Produces:
  - `shadow-authoring/verification.json`
  - `shadow-authoring/change-set.json`
  - `shadow-authoring/promotion.patch`
  - `shadow-authoring/promotion-package.json`
  - `shadow-authoring/promotion-package.md`
  - final `SHADOW_AUTHORING_VERIFIED` only when V1–V5 all pass.

- [ ] **Step 1: Write RED verification tests covering all five layers**

Synthetic fixture tests must independently fail on:
- authoritative fingerprint mismatch;
- production path outside the catalog;
- changed existing catalog row;
- forbidden `flags` or `statDeltas`;
- test-file deletion/removal of a pre-existing non-whitespace line;
- accepted Card != implemented row;
- RED phase that fails for a syntax/import/path reason rather than missing authored entries;
- GREEN phase failure;
- adjacent regression failure;
- capacity deficit not eliminated.

Include a success fixture that reaches `SHADOW_AUTHORING_VERIFIED`.

- [ ] **Step 2: Run RED**

```bash
npm exec tsx tests/evolution/preschoolShadowAuthoringVerification.test.ts
```

Expected: FAIL because verification/package builders do not exist.

- [ ] **Step 3: Implement V1 Authority Integrity**

Verify all:
- authoritative fingerprint before == after;
- current repository baseline SHA/fingerprint still matches the Candidate session baseline supplied by caller;
- PD-121 exists;
- canonical workflow identifies the shadow exception;
- accepted spec remains `HUMAN ACCEPTED — 2026-09-24`;
- contract ID/version exact.

Any mismatch returns `SHADOW_AUTHORING_VERIFICATION_FAILED` and no Promotion Package.

- [ ] **Step 4: Implement V2 Scope / Mechanical Conformance**

Host must independently parse baseline/final catalog JSON and enforce:
- only the exact production path plus two test paths changed;
- no production path except catalog changed;
- all baseline catalog entries preserve exact JSON field/value equality and order;
- new rows are appended after all baseline rows;
- number of new rows equals accepted Cards and is <=8;
- each row exactly equals its Card `proposedEntry`;
- row keys exactly `id,title,text,originTags,ageMin,ageMax`;
- global IDs unique;
- neutral exact;
- age bounds exact;
- no forbidden fields.

For each approved test file, require `finalBytes.startsWith(baselineBytes)` exactly. All focused shadow regression code must be appended after the baseline EOF. This prevents deletion, replacement, reordering, comment-wrapping, or early-return weakening of any existing assertion. The appended block may use dynamic `await import(...)` calls so no existing import line needs editing.

- [ ] **Step 5: Implement V3 Semantic Conformance**

Require the accepted Reviewer assessment to remain:

```text
applicabilityAssessment = APPLICABLE
conformance = CONFORMING
executionEnvelope = WITHIN_ENVELOPE
blockers = []
executionAuthorityAssessment = WITHIN_CURRENT_AUTHORITY
```

Verification must not reinterpret semantic quality after execution; it only confirms the implemented rows are byte/field-identical to the accepted Cards.

- [ ] **Step 6: Implement strong V4 RED → GREEN**

Create a temporary RED workspace from the final shadow workspace and replace only:

```text
src/data/lines/preschool-passive-spine.json
```

with the baseline catalog.

Run the accepted focused tests in RED workspace:

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
```

RED is accepted only if:
- at least one command exits non-zero;
- stderr/stdout contains at least one proposed ID;
- output contains exact marker `AUTONOMOUS_AUTHORING_MISSING_ENTRY`;
- output does not contain `SyntaxError`, `Cannot find module`, `MODULE_NOT_FOUND`, or TypeScript parse diagnostics.

Then run the same commands in the final shadow workspace and require both PASS.

The Shadow Executor's appended focused assertions must deliberately throw:

```ts
throw new Error(`AUTONOMOUS_AUTHORING_MISSING_ENTRY: ${expectedId}`);
```

when an accepted row is absent. The appended block must be guarded by the file's direct-execution condition (or an equivalent second direct-execution block) so the focused proof runs under the explicit V4 commands without changing semantics when the test module is merely imported by other runners.

- [ ] **Step 7: Run adjacent verification in final shadow workspace**

Require:

```bash
npm exec tsx tests/neutralPassiveDedupTests.ts
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
npm run typecheck
```

All must PASS.

Do not run a natural Phase 0 or AE session as part of V4.

- [ ] **Step 8: Implement V5 evidence-bounded capacity adequacy**

Use a deterministic maximum matching between demand beat ages and unique legal catalog entries for the canonical origin.

Export:

```ts
export function computePreschoolCapacityDeficit(input: {
  demandAges: Array<4 | 5 | 6 | 7>;
  canonicalOriginTag: 'scholar' | 'martial' | 'merchant' | 'frontier';
  catalogEntries: PassiveNarrativeEntry[];
  preConsumedEntryIds: string[];
}): {
  demand: number;
  maximumMatchedAuthored: number;
  structuralDeficit: number;
};
```

Eligibility uses existing age windows and neutral/matching-origin rules. One authored ID can satisfy at most one demand beat.

For `evidenceMode='STRUCTURAL_EXHAUSTION'`:
- baseline `structuralDeficit > 0`;
- final shadow catalog `structuralDeficit === 0`.

For `evidenceMode='SEMANTIC_VARIETY'`, require baseline and final structural deficit to remain `0 → 0`; V5 then records structural non-regression while V3 carries the accepted evidence-derived responsibility/semantic-coverage proof. Do not fabricate a structural deficit merely to satisfy V5.

No scheduler/selector file may be changed.

- [ ] **Step 9: Build the durable Promotion Package**

JSON fields:

```ts
{
  schemaVersion: 'shadow-authoring-promotion-package-v1',
  contractId,
  contractVersion,
  problemId,
  sourceRunRef,
  gapSummary,
  applicabilitySummary,
  responsibilitySummaries,
  acceptedCards,
  changedFiles,
  patchSha256,
  allowedHumanOutcomes: ['PROMOTE_EXACT_PATCH', 'DEFER', 'REJECT'],
  promotionRequiresExactPatchSha256: true,
  verification: {
    authorityIntegrity: 'PASS',
    mechanicalConformance: 'PASS',
    semanticConformance: 'PASS',
    redGreenRegression: 'PASS',
    evidenceBoundedCompletion: 'PASS',
  },
  capacityBefore,
  capacityAfter,
  authoritativeRepositoryUnchanged: true,
  deviations: [],
  unresolvedUncertainty,
  naturalPverPerformed: false,
}
```

Markdown must surface the same facts and explicitly state:

```text
Natural Player-visible Experience Review has not been performed.
This package is eligible only for Human exact-patch promotion review.
Allowed Human outcomes: PROMOTE_EXACT_PATCH / DEFER / REJECT.
Any requested content or code edit invalidates this verified patch identity and requires a new shadow result with a new patch SHA-256.
```

- [ ] **Step 10: Run focused verification tests**

```bash
npm exec tsx tests/evolution/preschoolShadowAuthoringVerification.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit**

```bash
git add \
  scripts/evolution/autonomousAuthoring/verifyPreschoolShadowAuthoring.ts \
  scripts/evolution/autonomousAuthoring/buildPromotionPackage.ts \
  tests/evolution/preschoolShadowAuthoringVerification.test.ts
git commit -m "feat: verify shadow authoring patches"
```

Do not commit any generated shadow catalog/test modifications from a synthetic test fixture.

---

### Task 8: Multi-Candidate Session Integration, Budgeting, Durability, and No Source Change

**Files:**
- Modify: `scripts/evolution/candidateSliceBudget.ts:1-30`
- Modify: `scripts/evolution/runMultiCandidateSessionSlice.ts:1-end`
- Modify: `scripts/evolution/candidateSessionStore.ts` only if a helper is needed to retain the new shadow directory; do not change immutable semantics
- Test: `tests/evolution/candidateSliceBudget.test.ts`
- Test: `tests/evolution/multiCandidateSessionSlice.test.ts`
- Test: `tests/evolution/multiCandidateSessionAcceptance.test.ts`
- Test: `tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts`

**Interfaces:**
- Consumes: `READY_FOR_SHADOW_AUTHORING`, effective artifact paths, Shadow Executor, Host verifier/package builder.
- Produces: one complete Candidate disposition on the same Source Epoch and durable retained `shadow-authoring/**` artifacts.

- [ ] **Step 1: Write RED budget tests**

Change the expected maximum candidate admission envelope to five jobs regardless of source-transition availability:

```ts
assert.equal(
  requiredCandidateAdmissionJobs({ sourceTransitionAvailable: true }),
  5,
);
assert.equal(
  requiredCandidateAdmissionJobs({ sourceTransitionAvailable: false }),
  5,
);
```

Reason:
- Solution 1
- Reviewer 1
- bounded continuation up to 2
- either source transition or shadow execution up to 1

The Host-slice maximum remains 11.

- [ ] **Step 2: Write RED session tests for successful shadow execution**

Simulate a Candidate whose effective decision is `READY_FOR_SHADOW_AUTHORING`.

Require:
- Shadow runner invoked exactly once;
- one Participant job consumed;
- Candidate becomes `COMPLETED`, not `SOURCE_CHANGE_PENDING`;
- `sourceTransitionCount` remains unchanged;
- `runSourceTransition` is not called;
- no HFL item is created;
- pending next Candidate is still eligible for ordinary scheduling if budget permits;
- durable lane contains `shadow-authoring/result.json` and `shadow-authoring/promotion-package.json`.

Add a second scenario with `sourceTransitionCount === 1`; shadow admission still works because the route is not an authoritative source change.

- [ ] **Step 3: Write RED fail-closed tests**

For each:
- executor runtime failure;
- scope verification failure;
- authoritative fingerprint mutation;
- Host verification infrastructure failure;

require:
- active Candidate/session fail closed;
- no next Candidate starts;
- no source transition occurs;
- durable failure/result artifact remains.

`CONTRACT_CHANGE_REQUIRED` and `EXECUTION_ENVELOPE_EXCEEDED` are not executor failures; they should already have routed to Human before this branch.

- [ ] **Step 4: Run RED**

```bash
npm exec tsx tests/evolution/candidateSliceBudget.test.ts
npm exec tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm exec tsx tests/evolution/multiCandidateSessionAcceptance.test.ts
```

Expected: FAIL because the session has no shadow branch and admission still reserves 4 jobs after a source transition.

- [ ] **Step 5: Fix candidate admission budgeting**

Implement:

```ts
export function requiredCandidateAdmissionJobs(
  _input: { sourceTransitionAvailable: boolean },
): 5 {
  return 5;
}
```

Keep the parameter for compatibility; document that v1 shadow execution remains possible when config source transition is unavailable.

- [ ] **Step 6: Add the shadow branch after continuation and before ordinary HFL completion**

Session logic:

```text
effective decision
├─ READY_FOR_CONFIG_EXECUTION
│    → existing source transition unchanged
├─ READY_FOR_SHADOW_AUTHORING
│    → load exact effective Solution/Review/admission
│    → prepare isolated shadow workspace from current authoritative repo
│    → run one Shadow Executor Participant job
│    → consume one Host job
│    → Host V1–V5 verification
│    → retain shadow-authoring artifacts
│    → if VERIFIED: complete Candidate, no HFL, continue pool
│    → if runtime/integrity/verification failure: fail closed
└─ existing ordinary routes
```

Do not mark source change pending for shadow.

- [ ] **Step 7: Retain shadow evidence durably**

Before completing the Candidate, call the existing lane-retention mechanism again after all `shadow-authoring/**` files are written.

Because `candidateSessionStore.writeImmutable()` already accepts same bytes and rejects changed bytes, repeated retention must preserve its current semantics.

Required retained files:

```text
shadow-authoring/invocation.json
shadow-authoring/raw-output.txt
shadow-authoring/participant-binding.json
shadow-authoring/participant-prompt.txt
shadow-authoring/execution-trace.json
shadow-authoring/executor-result.json
shadow-authoring/change-set.json
shadow-authoring/verification.json
shadow-authoring/promotion.patch
shadow-authoring/promotion-package.json
shadow-authoring/promotion-package.md
shadow-authoring/result.json
```

Missing optional stderr is not a semantic failure.

- [ ] **Step 8: Keep reports backward-compatible**

Do not bump Operational Run Report v7 merely to expose the package. The durable Candidate lane is the canonical package location in v1; the report's existing `effectiveDecisionRef` remains sufficient to identify the Candidate.

A later report-link enhancement requires separate evidence that discoverability is a bottleneck.

- [ ] **Step 9: Run focused session/operator tests**

```bash
npm exec tsx tests/evolution/candidateSliceBudget.test.ts
npm exec tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm exec tsx tests/evolution/multiCandidateSessionAcceptance.test.ts
npm exec tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add \
  scripts/evolution/candidateSliceBudget.ts \
  scripts/evolution/runMultiCandidateSessionSlice.ts \
  scripts/evolution/candidateSessionStore.ts \
  tests/evolution/candidateSliceBudget.test.ts \
  tests/evolution/multiCandidateSessionSlice.test.ts \
  tests/evolution/multiCandidateSessionAcceptance.test.ts \
  tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
git commit -m "feat: execute verified shadow authoring in candidate sessions"
```

If `candidateSessionStore.ts` required no code change, omit it from `git add`.

---

### Task 9: Contamination-Controlled Historical Preschool Reference Trial

**Files:**
- Create: `scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts`
- Create: `tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts`
- Modify: `package.json` to add exact reference-trial/test scripts
- Runtime input only, not committed answer fixture: an already-established exact evidence file for `preschool-pver-20260922231805-71297571`

**Interfaces:**
- Consumes: current Host mechanism, historical Git tree `e80eecc...`, accepted fixed evidence from the existing first PVER/replay record.
- Produces: a controlled `SHADOW_AUTHORING_VERIFIED` Promotion Package or a typed `REFERENCE_EVIDENCE_UNAVAILABLE` stop result. It never generates replacement evidence.

- [ ] **Step 1: Write RED tests for contamination controls before calling a real Participant**

The test harness must create a synthetic historical tree and assert:
- current five answer-bearing rows are absent;
- forbidden residual design path is absent;
- full 2026-09-24 accepted design spec is absent from the Participant workspace because its reference-validation section names the old answer set;
- participant-safe Contract packet is present;
- current PD-121 / canonical Content Authoring Workflow authority overlay is present;
- later PVER material is absent;
- the harness refuses to run when exact fixed evidence is missing.

- [ ] **Step 2: Run RED**

```bash
npm exec tsx tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts
```

Expected: FAIL because the trial harness does not exist.

- [ ] **Step 3: Implement historical tree materialization without mutating the working tree**

Use Git CLI:

```bash
git archive e80eecc868a6ca99f4a53ff5d2493a13b4c0a8bf
```

Extract into a new temporary `trialBaselineRoot`.

Keep two roots explicit throughout the harness:

```text
liveRepositoryRoot = current dev working tree; read-only integrity anchor
trialBaselineRoot = historical e80 product tree + allowed current authority overlay
```

Solution, Reviewer, admission, Shadow Executor, RED/GREEN, and V5 operate against `trialBaselineRoot`. The harness separately fingerprints `liveRepositoryRoot` before/after and requires it to remain unchanged.

Do not use `git checkout`, `git reset`, `git stash`, or a branch switch.

Before invoking Participants, compare `src/data/infantPassiveNarrativeCatalog.ts` between current `dev` and `e80eecc...`. The current investigation established that the bytes are equal; the trial harness must re-check and fail closed if they ever diverge, rather than mixing a changed current non-answer catalog with the historical baseline.

Overlay only these current authority documents into the historical Participant workspace:

```text
docs/governance/product-decisions.md
docs/product/content-authoring-workflow-contract-design.md
docs/product/auto-evolution-model.md
```

Do not overlay current catalog, current preschool tests, the accepted design spec, the 2026-09-23 residual-content spec, or later PVER artifacts.

- [ ] **Step 4: Define the exact reference evidence input contract**

The CLI requires:

```text
--evidence <path-to-existing-accepted-preschool-capacity-evidence.json>
```

The file must validate as `PreschoolCapacityEvidenceV1`, remains Host-only, is never copied to Solution/Reviewer workspaces, and must satisfy:

```text
runRef = preschool-pver-20260922231805-71297571
evidenceMode = STRUCTURAL_EXHAUSTION
preConsumedEntryIds = []
demandBeats = 30
authoredBeats = 26
gapBeats = 4
foreignOriginLeakCount = 0
duplicateAuthoredCount = 0
```

The harness MUST NOT infer or synthesize missing beat chronology.

If the exact existing evidence cannot be located/provided, write:

```json
{
  "schemaVersion": "preschool-reference-trial-stop-v1",
  "status": "REFERENCE_EVIDENCE_UNAVAILABLE",
  "runRef": "preschool-pver-20260922231805-71297571",
  "reason": "Exact accepted chronology was not supplied; replay or evidence reconstruction is forbidden for this trial."
}
```

and exit non-zero without invoking Solution, Reviewer, or Shadow Executor.

This is a valid evidence-integrity stop, not a successful reference trial.

- [ ] **Step 5: Construct an answer-free fixed Problem Package / candidate context**

Use the accepted problem facts only:

```text
4–7 preschool packed passive experience
30 demanded beats
26 authored beats
4 structural generic gaps
whole legal pool exhausted at each accepted gap
CONTENT_GAP / CONTENT_CAPACITY_GAP
```

Do not include the historical five later-selected life functions, IDs, titles, texts, or later PVER observations.

Provide the participant-safe Contract packet from Task 3.

- [ ] **Step 6: Run the real current Solution/Reviewer/Shadow path against the historical product tree**

Use the ordinary `CODEX_CURRENT` binding. Treat `trialBaselineRoot` as the repository baseline supplied to the existing Solution/Reviewer/Shadow workflow for this controlled trial only; `liveRepositoryRoot` is never a Participant workspace and is only checked for integrity.

The trial must require:
- Solution claims `APPLICABLE`;
- it derives its own Minimum Sufficient Responsibility Set;
- new entry count <=8;
- Reviewer returns conforming autonomous assessment;
- Host admission is `ELIGIBLE` using the supplied fixed evidence;
- Shadow Executor changes only historical catalog + two historical test files;
- V1–V5 pass;
- current authoritative `dev` fingerprint remains unchanged;
- a Promotion Package is produced.

Do not compare the generated life functions, IDs, titles, or texts to the historical five Human answers.

- [ ] **Step 7: Add explicit answer-contamination scan before Participant invocation**

Recursively scan all Participant-visible files and prompt strings. Refuse the trial if any contain:

```text
preschool_neutral_fair_play
preschool_neutral_self_made_project
preschool_neutral_stand_for_peer
preschool_neutral_first_farewell
preschool_neutral_neighborhood_help
```

Also reject the exact later Human-approved five-entry design path:

```text
docs/superpowers/specs/2026-09-23-preschool-residual-content-capacity-authoring-design.md
```

- [ ] **Step 8: Add package scripts**

Add:

```json
"test:evolution:autonomous-authoring": "tsx tests/evolution/autonomousAuthoringContracts.test.ts && tsx tests/evolution/preschoolAutonomousAuthoringAdmission.test.ts && tsx tests/evolution/shadowAuthoringExecution.test.ts && tsx tests/evolution/preschoolShadowAuthoringVerification.test.ts && tsx tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts",
"evolution:autonomous-authoring:reference-trial": "tsx scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts"
```

- [ ] **Step 9: Run synthetic reference-trial tests**

```bash
npm exec tsx tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts
npm run test:evolution:autonomous-authoring
```

Expected: PASS.

- [ ] **Step 10: Commit the harness before the real controlled trial**

```bash
git add \
  scripts/evolution/autonomousAuthoring/runPreschoolReferenceTrial.ts \
  tests/evolution/preschoolAutonomousAuthoringReferenceTrial.test.ts \
  package.json
git commit -m "test: add preschool shadow authoring reference trial"
```

- [ ] **Step 11: Run the one controlled historical reference trial only when exact accepted evidence is available**

Run:

```bash
npm run evolution:autonomous-authoring:reference-trial -- \
  --evidence <existing-accepted-evidence-path>
```

Success criterion is exactly:
- `SHADOW_AUTHORING_VERIFIED`;
- `newEntryCount <= 8`;
- no answer-contamination finding;
- only three allowed paths changed in shadow;
- V1–V5 PASS;
- authoritative repository unchanged;
- Promotion Package produced.

If the exact accepted evidence path is unavailable, stop at `REFERENCE_EVIDENCE_UNAVAILABLE`. Do not run replay, natural AE, or a substitute sample.

- [ ] **Step 12: Preserve trial evidence without promoting the patch**

Archive the produced trial result/package under the existing durable test/run evidence location chosen by the harness, but do not apply `promotion.patch` to `dev`.

The historical trial is mechanism evidence only.

---

### Task 10: Whole-Branch Verification and Return to Natural Observation

**Files:**
- No production files should be added in this task.
- Verify all files changed by Tasks 1–9.
- Read: `docs/superpowers/specs/2026-09-24-contract-constrained-autonomous-authoring-v1-design.md`
- Read: `docs/governance/product-decisions.md`
- Read: `docs/product/content-authoring-workflow-contract-design.md`

**Interfaces:**
- Consumes: completed implementation and, when available, successful controlled reference trial.
- Produces: evidence-based completion report distinguishing engineering completion from reference-trial and natural-effectiveness status.

- [ ] **Step 1: Run the autonomous-authoring focused suite**

```bash
npm run test:evolution:autonomous-authoring
```

Expected: PASS.

- [ ] **Step 2: Run adjacent AE regression suites**

```bash
npm exec tsx tests/evolution/problemAgnosticSolutionContracts.test.ts
npm exec tsx tests/evolution/solutionDecisionRouter.test.ts
npm exec tsx tests/evolution/solutionDecisionReplay.test.ts
npm exec tsx tests/evolution/solutionAgentLoop.test.ts
npm exec tsx tests/evolution/solutionReviewerLoop.test.ts
npm exec tsx tests/evolution/reviewContinuation.test.ts
npm exec tsx tests/evolution/candidateSliceBudget.test.ts
npm exec tsx tests/evolution/multiCandidateSessionSlice.test.ts
npm exec tsx tests/evolution/multiCandidateSessionAcceptance.test.ts
npm exec tsx tests/evolution/multiCandidateOrdinaryEvolutionOperator.test.ts
npm exec tsx tests/evolution/phase0EndToEnd.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run preschool/product adjacent tests and typecheck**

```bash
npm exec tsx tests/preschoolPassiveSpineTests.ts
npm exec tsx tests/annualPassiveMemoryTests.ts
npm exec tsx tests/neutralPassiveDedupTests.ts
npm exec tsx tests/evolution/playerSurfaceCapture.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run repository test gate and classify any differential failure**

```bash
npm test
```

Expected: PASS.

If it fails, compare against the exact pre-task current `dev` baseline with the same command. Do not fix unrelated pre-existing failures inside this scope. Report:
- command;
- baseline result;
- current result;
- whether the failure is newly introduced by this implementation.

- [ ] **Step 5: Prove ordinary config execution did not regress**

Run:

```bash
npm exec tsx tests/evolution/p2-success-path.test.ts
npm exec tsx tests/evolution/p2-real-rerun.test.ts
npm exec tsx tests/evolution/multiRoundExecutionValidation.test.ts
```

Expected:
- ordinary config + `WITHIN_CURRENT_AUTHORITY` still reaches config execution/source transition;
- Human-required/uncertain authority still escalates;
- no autonomous companion is required for historical config cases.

- [ ] **Step 6: Review the implementation against all 18 accepted design criteria**

Record PASS/FAIL for every criterion in spec §29. In particular, do not mark criterion 17 PASS unless the real contamination-controlled historical trial reached `SHADOW_AUTHORING_VERIFIED`.

Allowed completion wording:

```text
Engineering implementation: COMPLETE
Governance reconciliation: COMPLETE
Focused/adjacent verification: PASS
Historical reference trial: PASS | BLOCKED_BY_REFERENCE_EVIDENCE
Natural activation effectiveness: NOT YET OBSERVED
Authoritative autonomous promotion: NOT AUTHORIZED
```

Do not write “design fully implemented” when the reference trial is blocked.

- [ ] **Step 7: Check final diff scope**

Run:

```bash
git status --short
git diff --check
git log --oneline --decorate -12
```

Unrelated pre-existing artifact modifications may remain outside this task, but no task commit may contain them.

- [ ] **Step 8: Stop local tuning and return to normal AE after reference success**

Only after the controlled reference trial succeeds:
- do not create another historical trial;
- do not generate a forced preschool candidate;
- run the ordinary natural full-flow command on a clean authoritative baseline in a separate operational step;
- wait for a genuinely applicable future candidate to activate the lane.

That natural run is post-implementation effectiveness observation, not part of this implementation plan's code changes.
