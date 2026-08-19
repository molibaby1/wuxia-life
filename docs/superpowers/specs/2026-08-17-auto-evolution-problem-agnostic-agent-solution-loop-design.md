# Problem-Agnostic Agent Solution Loop — Formal Design

## Status

Human ACCEPTED.

## Product Goal

Prove that Wuxia-Life Auto Evolution can hand one real, previously-unclassified product problem to a workspace-capable Solution Agent, let that Agent inspect the repository and investigate autonomously, hand its structured result to an independent Reviewer Agent, and route the outcome without the Orchestrator understanding the problem domain.

The experiment ends at routing. It does not execute configuration changes, modify gameplay, generate a Candidate, or enter Modification Work.

## Core Principle

> Orchestrator owns workflow. Agents own reasoning.

The Orchestrator may know identity, provenance, permissions, work status, contracts, and routing state. It must not encode a problem taxonomy or domain-specific investigation method.

## Fixed First Case

Use the already-sealed Cross-Run Cohort run `cohort-run-000001` as the source experience. Do not reuse historical cohort/longitudinal/resource-dynamics conclusions.

Fresh workflow:

```text
sealed player-observable experience
→ External Feedback
→ Improvement Hypothesis
→ deterministic first-hypothesis selection
→ Problem Package
→ workspace-capable Solution Agent
→ independent Reviewer Agent
→ deterministic Decision Router
→ STOP FOR HUMAN WORKFLOW REVIEW
```

If Improvement Hypothesis returns zero hypotheses, `NO_PROBLEM / SKIP` is a valid terminal result and the later jobs do not run.

## Problem Package

`problem-package-v1` is a lightweight reference and permission package. It contains:

- problem identity;
- source run and artifact references;
- selected hypothesis fields verbatim;
- repository authority references;
- authoritative source fingerprint;
- disposable workspace identity;
- write and execution permissions.

It must not contain `problemType`, domain classification, mechanism classification, resource-stat semantics, investigation mode, or mechanism-specific preprocessing.

The package references evidence. The Agent interprets evidence.

## Solution Agent

The Solution Agent receives a disposable writable copy of the product baseline plus the Problem Package and referenced source artifacts. It may inspect source, search the repository, run tests or scripts, and make temporary sandbox edits while investigating.

Sandbox edits have no product authority and are discarded after the job.

The Agent must return one of:

- `OPTIONS`
- `NO_PROPOSAL`
- `INSUFFICIENT_EVIDENCE`
- `ESCALATE`

`OPTIONS` contains at most three options. Each option includes proposed change, rationale, repository/artifact references, change scope, expected player-observable difference, risks, and unknowns. Change scope is one of `configuration`, `program`, `mixed`, or `uncertain`.

The Agent may conclude that program changes are required. Reasoning permission is not execution permission.

## Reviewer Agent

The Reviewer runs as a fresh Agent job in a separately-created clean disposable workspace from the same authoritative baseline. It receives the Problem Package and structured Solution Result, not the Solution Agent's scratch workspace or raw working context.

The Reviewer independently checks repository/source as needed and returns one of:

- `ACCEPT_OPTION`
- `ACCEPT_NO_ACTION`
- `REJECT`
- `REQUEST_MORE_WORK`
- `DEFER`
- `ESCALATE`

If accepting an option it independently reports scope as `config_only`, `code_required`, `mixed`, or `uncertain`.

## Decision Router

The Router is deterministic and reads only structured workflow fields: Solution status, Reviewer decision, scope assessments, permissions, and budget state. It must not inspect or branch on domain content.

Minimum routing:

- accepted option + both scope assessments config-only → `READY_FOR_CONFIG_EXECUTION`
- accepted option + any code/mixed/uncertain assessment → `ESCALATE_HUMAN`
- reject → `SKIP`
- no proposal → `SKIP` or `DEFER`
- insufficient evidence → `DEFER`
- request more work → `DEFER_MORE_WORK_REQUESTED`
- explicit escalation → `ESCALATE_HUMAN`

For this experiment, `READY_FOR_CONFIG_EXECUTION` is terminal. No execution occurs.

## Participant Runtime

Product semantics use `Workspace-capable Agent Participant`, not Cursor/Ralph/provider-specific names.

The generic loop requires the execution host to explicitly supply a workspace-capable Agent Participant. Runtime binding is supplied by the execution host; the generic Orchestrator does not name or select a runtime.

The same Host Runtime is the default execution policy. An alternate runtime requires explicit Human authorization. There is no silent fallback. Reviewer independence comes from separate invocation, clean context, fresh workspace, and independent source inspection; it does not require a different runtime.

## Job Budget

The budget unit is Participant Job Invocation, not internal model turns.

Maximum:

- 1 External Feedback job
- 1 Improvement Hypothesis job
- 1 Solution Agent job
- 1 Reviewer Agent job

Maximum participant jobs: 4. Retry: 0.

If an earlier valid terminal outcome occurs, later jobs are skipped.

## Isolation

The authoritative repository is never the Agent working directory.

Each Agent gets a disposable writable workspace copied from the same clean authoritative baseline. Secrets are not copied. Before and after each Agent job, the authoritative repository source fingerprint must remain unchanged.

The Reviewer workspace must not be derived from the Solution workspace.

## Historical Leakage Boundary

Do not provide Solution or Reviewer with historical longitudinal Investigation, cohort Investigation, resource-dynamics work, Human review decisions, Modification Work history, or prior conclusions about this run.

They receive only:

- the fixed run's player-observable source;
- fresh External Feedback;
- fresh selected Improvement Hypothesis;
- current authority docs;
- current product source.

## Experiment Success Questions

Human reviews three architecture questions:

1. `ORCHESTRATION_AGNOSTIC` / `ORCHESTRATION_NOT_AGNOSTIC`
2. `AGENT_OWNS_REASONING` / `AGENT_DOES_NOT_OWN_REASONING`
3. `INDEPENDENT_REVIEW_AND_BOUNDARY` / `INDEPENDENT_REVIEW_OR_BOUNDARY_FAILED`

The strongest valid claim is:

> Problem-agnostic Agent Solution handoff proven on one fixed workflow case.

This does not prove solution quality, configuration execution, Candidate transfer, or autonomous evolution.
