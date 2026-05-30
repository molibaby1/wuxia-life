# Product Experience Governance — Active Event Admission Rules

本文件定义 **US-004** 交付物：active 事件准入规则。PXG2 从 `candidate` 池晋升 `active` 时必须满足下列全部条件。

**Machine source of truth：** `src/data/event-asset-manifest.json`（由 `npm run report:event-asset-inventory` 生成）

**Scope reference：** `docs/PRD/product-experience-governance-scope-and-guardrails.md`

---

## 1. Asset status definitions

| Status | Meaning |
| --- | --- |
| `active` | 属于 0–30 黄金人生线 playable 验收范围；质量问题为 **blocker** |
| `candidate` | 可进入黄金线的 wired 事件；PXG2 脊柱选取前默认状态 |
| `broken` | 结构/质量 blocker；不得晋升 active |
| `deferred` | backlog、非优先路线、31+ 或非 wired 内容；问题为 warning/backlog |
| `dead` | 废弃或重复资产；不得加载 |

---

## 2. Admission rules (all required for `active`)

### 2.1 Runtime and scope

1. 事件来源文件必须在 `src/data/events.json` imports 中，且与 `EventLoader` lineMap 一致。
2. 事件 `ageRange` 必须与 ages **0–30** 有 overlap。
3. 事件不得来自 non-priority loaded 路线文件（`official.json`、`sect-beggars.json`），除非 scope doc 显式修订。
4. 不得将 non-wired deferred 文件批量迁入 active（须单独 story 审批）。

### 2.2 Trigger and executability

5. 必须具备可解析的 `triggers` / `triggerConditions`（或等价 age weight 规则）。
6. `choice` 事件至少有一个可执行 choice（含 `id`、`text`、`effects`）。
7. `auto` 事件必须具备 `autoEffects`（或 `content.autoEffects`）。

### 2.3 Player-facing feedback

8. 每个 choice 必须产生玩家可见反馈（`outcomeText`、choice result narrative，或经 `ChoiceFeedbackGenerator` 生成的等价文案）。
9. **禁止** vague fallback 作为 active 事件的最终反馈（如「你的选择引起了涟漪」类占位）。
10. Hidden-only stat 变化若无叙事解释，不得单独作为 active choice 的全部效果。

### 2.4 Durable state and payoff readiness

11. Key active choice 必须写入 durable state：flag、route state、relationship、critical choice 或 identity 之一。
12. 该 durable state 必须被至少一个 later **candidate 或 active** 事件读取（PXG2 payoff map 将验证）。
13. Key choice 定义见 PXG2 US-008；PXG1 仅要求晋升 active 前已识别写入点。

### 2.5 Quality gate

14. 不得存在 `validate:event-quality` **blocker** 级 issue。
15. 不得存在 `EventLoader.validateEvents()` 报错。

---

## 3. Promotion workflow

```
candidate (PXG1 inventory)
    → PXG2 selects golden spine + feedback cleanup
    → status = active in manifest
    → PXG4 gates scan active only as blockers
```

手动晋升 active 时：

1. 更新 `src/data/event-asset-manifest.json` 中对应 `events[].status`。
2. 运行 `npm run report:event-asset-inventory` 验证汇总。
3. 在 PR / handoff 中列出 event id 与晋升理由。

---

## 4. Explicit exclusions (frozen)

- `official.json`、`sect-beggars.json`：non-priority，不得默认 active。
- `middle-age-career.json`、`elderly-legacy.json` 等 primarily 31+ 文件：deferred。
- 39 个 non-wired backlog 文件：deferred，不批量 wired。

---

*PXG1 交付 — 2026-05-30*
