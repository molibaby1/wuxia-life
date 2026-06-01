# Account and Ownership Boundary (P4 US-020)

Ownership rules for future accounts and cloud persistence. No account system in P4.

## 1. Ownership Concepts

| Mode | Owner | Save slot ownership |
| --- | --- | --- |
| Anonymous local play | Device/browser profile | Local slot ids |
| Logged-in user play | `userId` | Server-assigned slot ids |
| Export/import | Initiating user/session | Exported blob carries export token metadata |
| Shared replay audit | Service operator | Replay log id, not player slot |

## 2. Anonymous Save Attachment

When anonymous save attaches to future account:

- Generate new server `slotId`; retain `snapshotId` lineage in migration record
- Re-verify snapshot schema and catalog version
- Do not trust client-provided `userId` without auth token
- Conflicts: last-write-wins only if explicitly chosen; default prompt merge/replace

## 3. Authorization Questions (Pre-Backend)

- Who can execute choices on a snapshot? (owner, shared read-only, admin)
- Can replay logs be read without save slot access?
- Export/import: one-time token vs signed blob?
- Mini-program storage limits: partial sync vs full snapshot?
- Account deletion: snapshot retention policy?

## 4. Non-Goals

- No account system
- No cloud saves
