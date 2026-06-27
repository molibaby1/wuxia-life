# P57 Wuxia Sample Lines Second 40+ Node — Fix Prompts

**Generated:** 2026-06-27
**Context:** Phase C1 验收发现 2 个文档级 bug

## Fix #1: 修复 prd.json 重复 notes key

**Priority:** MEDIUM
**Type:** 文档修正

```
Fix duplicate "notes" keys in prd.json. In docs/PRD/p57-wuxia-sample-lines-second-40-plus-node.prd.json:

For P57-007 (lines ~100-104), P57-008 (lines ~115-119), P57-009 (lines ~130-134):
Each has two "notes" lines. Merge into one. Keep the N/A note as the primary value.

Before (P57-007 example):
      "notes": "All lines no-go; no configuration changes needed. N/A."
      "notes": "Configuration story."

After:
      "notes": "All lines no-go; no configuration changes needed. N/A."

Apply the same fix to P57-008 and P57-009.

Verify: Each story object should have exactly one "notes" key after the edit.
```

## Fix #2: 修复 Gap Audit Appendix C 标题

**Priority:** MEDIUM
**Type:** 文档修正

```
Fix Appendix C title in gap audit. In docs/test-reports/p57-sample-lines-second-40-plus-gap-audit.md:

Line 89: Change "## Appendix C — Demonic Second-Node Contract (US-005)"
To:      "## Appendix C — Merchant Second-Node Contract (US-005)"

US-005 is the Merchant contract. Demonic is US-004 (Appendix B).

Verify: Appendix titles should be:
- Appendix A — Orthodox (US-003)
- Appendix B — Demonic (US-004)
- Appendix C — Merchant (US-005)
```
