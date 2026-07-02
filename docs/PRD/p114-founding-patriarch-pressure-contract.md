# P114 Founding Patriarch Pressure Contract

> **Route:** `founding_patriarch`（开派祖师）  
> **Stage:** Midlife pressure（设计合同）  
> **Selected direction:** 门派延续之责  
> **Preceding:** P113 on-ramp  
> **Subsequent:** P115 playable pressure implementation（defer）

## 1. Core Narrative

开派并非终点。进入中年后，门派延续责任集中显形：弟子争议、规矩执行、盟约期望同时压上来。压力不是“有没有成名”，而是“能否持续背责并维持传承秩序”。

---

## 2. Trigger Contract

### 2.1 Prerequisites

| Condition | Value |
| --------- | ----- |
| On-ramp done | `founding_patriarch_on_ramp_done` |
| Route context | `orthodox_childhood_seed_done` |
| One-shot guard | `!founding_patriarch_midlife_pressure_done` |
| Order guard | `!founding_patriarch_payoff_done` |

### 2.2 Age Band

| Field | Value | Rationale |
| ----- | ----- | --------- |
| `ageMin` | 40 | 给 P113 on-ramp 留出成长窗口 |
| `ageMax` | 45 | 在 payoff 之前完成压力段 |
| trigger hint | `age_reach: 40` | 与 midlife 节奏一致 |

---

## 3. Core Event Specification

| Field | Value |
| ----- | ----- |
| Event ID | `founding_patriarch_midlife_pressure` |
| Version | `1.0.0` |
| Type | `choice` |
| Category | `main_story` |
| Goal | 在单事件中完成 pressure checkpoint + scholar/alliance 变体承接 |

### 3.1 Variant priority (scholar vs alliance)

1. 若 `founding_patriarch_on_ramp_scholar=true`，优先进入 scholar 叙事文本分支。  
2. 否则若 `founding_patriarch_on_ramp_alliance=true`，进入 alliance 叙事文本分支。  
3. 两者都存在时，按 **scholar 优先**，alliance 作为附加语义（不分裂成第二事件）。  

### 3.2 Choice branches (bounded)

- **Branch A: 守规治学优先**  
  强化门规与内部门徒传承秩序，表达“守成之重”。
- **Branch B: 续盟扩责优先**  
  继续承接对外盟约责任，表达“续责之重”。

两分支都必须设置 pressure checkpoint，差异体现在表达信号和后续 payoff 预留接口。

### 3.3 Required checkpoint flags

| Flag | Purpose |
| ---- | ------- |
| `founding_patriarch_midlife_pressure_done` | pressure 完成检查点（必设） |
| `founding_patriarch_pressure_rule_first` | 分支 A 标记 |
| `founding_patriarch_pressure_alliance_first` | 分支 B 标记 |

---

## 4. Player-Facing Signals (>=2 required)

至少落地以下 2 个核心信号（可在 P115 扩展更多）：

1. **Cost label signal**（orthodox sample line）  
   - pressure 前：开派立名之重（或等价 on-ramp 成本）  
   - pressure 后：**门派延续之重**

2. **Current goal signal**（orthodox sample line）  
   - pressure 前：开宗立派、广收门徒  
   - pressure 后：**一面维持门规传承，一面承接盟约续责**

可选第三信号（推荐）：`orthodoxAge40Identity` 从“开派苗子”推进为“背责掌门”语义。

---

## 5. Payoff Gate Adjustment Contract

P113 当前顺序为 on-ramp 可直达 payoff echo。P114 合同要求调整为：

`on-ramp done -> midlife pressure done -> payoff echo`

即 payoff gate 需新增 pressure 前置：

- before: `founding_patriarch_on_ramp_done && !founding_patriarch_payoff_done`
- after: `founding_patriarch_on_ramp_done && founding_patriarch_midlife_pressure_done && !founding_patriarch_payoff_done`

---

## 6. Route Distinction Contract

| Route | Pressure burden type | Difference from founding_patriarch |
| ----- | -------------------- | ---------------------------------- |
| Renown | 人情债渐重 | founding 是门派传承责任，不是社会人情债 |
| Patron | 护商武力负担 | founding 是治学与门规治理负担，不是护商战力负担 |
| Magnate | 经营/资金债 | founding 是制度与传承续责，不是商业经营债 |

---

## 7. Deferred Interfaces for P115+

| Deferred item | Decision |
| ------------- | -------- |
| Stat threshold gates | 可选增强，P115 决定是否引入 |
| Multi-event pressure chain | defer，P114 仅单核心事件合同 |
| Payoff narrative redesign | defer，不在 P114 执行 |

---

## 8. Contract Summary

| Item | Value |
| ---- | ----- |
| Checkpoint flag | `founding_patriarch_midlife_pressure_done` |
| Core event | `founding_patriarch_midlife_pressure` (`choice`) |
| Age band | 40–45 |
| Variant priority | scholar > alliance |
| Minimum signals | cost label + current goal |
| Payoff order | on-ramp -> pressure -> payoff |
| New systems | None |

**Contract status:** Defined for P115 implementation.
