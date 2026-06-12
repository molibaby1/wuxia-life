# P7.2 Scope Guardrails (US-004)

## Product path

- **API mode is canonical** after P7.2 — full session loop including active planning, summary, disturbance ack.
- **Local mode is dev/offline fallback only** — not the primary QA or player path.

## Required validation commands

```bash
npm run build
npm test
npm run test:p6b:unit    # server unit (no DB)
npm run test:p6b:db      # integration (requires DATABASE_URL)
```

## Out of scope (do not expand)

- Deferred event batch import
- New DB tables or account systems
- Separate GET disturbance endpoint
- Removing local mode code (document only)

No feature implementation in this guardrail note.
