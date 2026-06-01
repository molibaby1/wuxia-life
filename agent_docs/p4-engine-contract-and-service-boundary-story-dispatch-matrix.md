# P4 Engine Contract and Service Boundary Story Dispatch Matrix

本矩阵用于按 `docs/PRD/p4-engine-contract-and-service-boundary.prd.json` 分发 P4 story。每个 story 应单独领取、先只读分析、提交计划、获批后实施。

## Dispatch Rules

- 默认按 priority 从 US-001 到 US-028 执行。
- Audit 与 definition story 交付报告或边界文档，不修改业务代码。
- Type、fixture、helper 与 test story 不得接入 gameplay runtime。
- 每个 story 完成后记录验证证据，供 US-028 closure 使用。
- 如果发现必须改变 runtime 行为或扩展 PRD 范围，停止并写入 handoff，不自行实施。

## Matrix

| Story | Priority | Type | Depends On | Main Touchpoints | Required Validation | Done State |
|---|---:|---|---|---|---|---|
| US-001 Rebaseline Current Engine Boundaries | 1 | Audit | PRD approval | Engine, UI, saves, events, simulation, baseline report | `npm run typecheck` | Current boundaries and extraction blockers are inventoried |
| US-002 Define P4 Non-Runtime-Behavior Guardrails | 2 | Definition | US-001 | Guardrail doc, P3 gate commands | `npm run typecheck` | Allowed additions and prohibited behavior changes are explicit |
| US-003 Define Game State Snapshot Contract | 3 | Definition | US-001, US-002 | Snapshot contract doc | `npm run typecheck` | Versioned fields, metadata, and classifications are explicit |
| US-004 Add Game State Snapshot Types | 4 | Types | US-003 | Contract module exports | `npm run typecheck` | Snapshot types compile without replacing runtime `GameState` |
| US-005 Add Snapshot Serialization Fixture | 5 | Fixture | US-004 | Snapshot fixture | `npm run typecheck`; tests | Representative 0-50 fixture parses and serializes |
| US-006 Add Snapshot Contract Tests | 6 | Tests | US-005 | Snapshot tests, validation surface | `npm run typecheck`; tests | Metadata, round trip, optional and forbidden fields are checked |
| US-007 Define Choice Execution Request Contract | 7 | Definition | US-002, US-003 | Choice request contract doc | `npm run typecheck` | Required, optional, untrusted fields and errors are explicit |
| US-008 Define Choice Execution Response Contract | 8 | Definition | US-007 | Choice response contract doc | `npm run typecheck` | Success, failure, feedback, diagnostics, and deltas are explicit |
| US-009 Add Choice Execution Contract Types | 9 | Types | US-007, US-008 | Contract module exports | `npm run typecheck` | Choice types compile without replacing runtime execution |
| US-010 Add Choice Execution Contract Fixtures | 10 | Fixture | US-009 | Choice fixtures | `npm run typecheck`; tests | Valid request, success, and failure fixtures parse |
| US-011 Define Replay Log Contract | 11 | Definition | US-003, US-007, US-008 | Replay contract doc | `npm run typecheck` | Metadata, entries, determinism data, and hashes are explicit |
| US-012 Add Replay Log Types and Fixtures | 12 | Types/Fixture | US-011 | Replay types, fixture | `npm run typecheck`; tests | Serializable 0-50 replay fixture includes state change |
| US-013 Add Replay Contract Tests | 13 | Tests | US-012 | Replay tests, validation surface | `npm run typecheck`; tests | Valid and malformed replay entries are checked |
| US-014 Define Event Catalog Service Boundary | 14 | Definition | US-001, US-002 | Catalog boundary doc | `npm run typecheck` | Query, filtering, status, and payload boundaries are explicit |
| US-015 Add Event Catalog Contract Types | 15 | Types | US-014 | Catalog contract exports | `npm run typecheck` | Catalog types compile without changing `EventLoader` |
| US-016 Add Event Catalog Contract Validation Report | 16 | Audit | US-014, US-015 | Event assets, catalog report | `npm run typecheck` | Counts, non-fitting fields, and restricted fields are reported |
| US-017 Define Save Schema Versioning Policy | 17 | Definition | US-003 | Save policy doc | `npm run typecheck` | Compatibility states and reject rules are explicit |
| US-018 Define Save Migration Strategy | 18 | Definition | US-017 | Migration strategy doc | `npm run typecheck` | Ordering, tests, fixtures, and rollback rules are explicit |
| US-019 Define Future Database Model Boundary | 19 | Definition | US-003, US-011, US-014, US-017 | Database boundary doc | `npm run typecheck` | Conceptual models, relationships, and forbidden storage are explicit |
| US-020 Define Account and Ownership Boundary | 20 | Definition | US-017, US-019 | Ownership boundary doc | `npm run typecheck` | Anonymous, account, slot, and import/export ownership are explicit |
| US-021 Define Frontend Adapter Boundary | 21 | Audit/Definition | US-001, US-002, US-009 | UI and platform dependencies, adapter doc | `npm run typecheck` | Responsibilities and dependencies needing wrappers are explicit |
| US-022 Define Platform Adapter Requirements | 22 | Definition | US-021 | Platform adapter doc | `npm run typecheck` | Adapter capabilities, sync model, and metadata are explicit |
| US-023 Add Contract Validation Helpers | 23 | Implementation | US-005, US-010, US-012, US-015, US-017 | Validation helpers, fixtures | `npm run typecheck`; tests | Structured fixture validation exists outside gameplay runtime |
| US-024 Add Contract Test Suite Entry | 24 | Tests | US-006, US-013, US-023 | Contract suite, package scripts or docs | `npm run typecheck`; tests | Contract suite runs without browser, backend, or database |
| US-025 Define Backend API Draft Boundaries | 25 | Definition | US-009, US-015, US-017, US-019, US-020 | API draft doc | `npm run typecheck` | Endpoint drafts reference P4 contracts without implementing HTTP |
| US-026 Define Service Extraction Risks and Migration Order | 26 | Definition | US-016, US-018, US-021, US-022, US-025 | Extraction plan doc | `npm run typecheck` | Order, risks, mitigations, and P3 gates are explicit |
| US-027 Update Documentation for P4 Architecture Readiness | 27 | Documentation | US-024, US-025, US-026 | Architecture docs | `npm run typecheck` | P4 contract layer and backend non-goal are documented |
| US-028 Produce P4 Closure Report | 28 | Closure | US-001 through US-027 | Closure report, verification evidence | `npm run typecheck`; contract tests; P3 gates | Closure supports backend implementation PRD decision |

## Parallelization Notes

- US-003 and US-014 can be prepared in parallel after US-001 and US-002 because both are definition-only and own separate boundary documents.
- US-017 can begin after US-003 while US-007 through US-016 continue, but US-019 waits for snapshot, replay, catalog, and save policy boundaries.
- US-021 can begin after current dependencies are mapped and choice types are stable; US-022 waits for US-021.
- US-023 and US-024 are intentionally late shared-infrastructure stories. Do not add a second validator or parallel contract suite in earlier fixture stories.
- US-025 through US-028 execute in order because they consolidate earlier boundaries.

## Handoff Evidence Required Per Story

- Story id and title.
- Files changed or report files produced.
- Validation commands and results.
- Any PRD acceptance criteria not completed.
- Any discovered runtime behavior change requirement.
- Any residual risk that US-028 should include.

