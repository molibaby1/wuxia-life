# P4 Architecture Readiness (US-027)

P4 defines **engine contracts and service boundaries** before frontend/backend separation. Backend, database, accounts, cloud saves, and mini-program implementation are **out of P4 scope**.

## Contract Layer Index

| Domain | Document | Types |
| --- | --- | --- |
| Snapshot | [game-state-snapshot-contract.md](./contracts/game-state-snapshot-contract.md) | `src/contracts/gameStateSnapshot.ts` |
| Choice request | [choice-execution-request-contract.md](./contracts/choice-execution-request-contract.md) | `src/contracts/choiceExecution.ts` |
| Choice response | [choice-execution-response-contract.md](./contracts/choice-execution-response-contract.md) | `src/contracts/choiceExecution.ts` |
| Replay log | [replay-log-contract.md](./contracts/replay-log-contract.md) | `src/contracts/replayLog.ts` |
| Event catalog | [event-catalog-service-boundary.md](./contracts/event-catalog-service-boundary.md) | `src/contracts/eventCatalog.ts` |
| Save schema | [save-schema-versioning-policy.md](./contracts/save-schema-versioning-policy.md) | — |
| Save migration | [save-migration-strategy.md](./contracts/save-migration-strategy.md) | — |
| Database boundary | [future-database-model-boundary.md](./contracts/future-database-model-boundary.md) | — |
| Account ownership | [account-ownership-boundary.md](./contracts/account-ownership-boundary.md) | — |
| Frontend adapter | [frontend-adapter-boundary.md](./contracts/frontend-adapter-boundary.md) | — |
| Platform adapter | [platform-adapter-requirements.md](./contracts/platform-adapter-requirements.md) | — |
| API draft | [backend-api-draft-boundaries.md](./contracts/backend-api-draft-boundaries.md) | — |
| Extraction order | [service-extraction-risks-and-migration-order.md](./contracts/service-extraction-risks-and-migration-order.md) | — |

## Guardrails

See [p4-non-runtime-behavior-guardrails.md](./p4-non-runtime-behavior-guardrails.md).

## Verification

```bash
npm run typecheck
npm run test:contracts
```

P3 regression gates remain required during and after P4:

```bash
npm test
npm run gate:golden-line
npm run gate:experience
npm run gate:midlife
npm run simulate:p3-eval
```

## PRD

- [p4-engine-contract-and-service-boundary.md](./PRD/p4-engine-contract-and-service-boundary.md)

## Explicit Non-Goals (P4)

- No backend server, HTTP client, database, ORM, account system, cloud saves, or mini-program adapter.
- No gameplay runtime behavior changes.
