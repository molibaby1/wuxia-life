# P3 Midlife Experience and Trust Hardening — Demonic Path Midlife Arc (US-022)

生成时间：2026-05-31

Story：**US-022 Define Demonic Path Midlife Arc**

权威输入：`docs/PRD/p3-midlife-experience-and-trust-hardening.md`、`docs/test-reports/p3-midlife-simulation-segments.md`（US-017）、`docs/test-reports/p3-midlife-death-risk-rules.md`（US-004）、`docs/test-reports/p3-midlife-route-contradiction-audit.md`（US-016 约束）、`docs/test-reports/product-experience-governance-priority-route-specs.md`（Route 3）、`docs/test-reports/p3-midlife-romance-family-sample-arc.md`（§4 demonic 变体）、`src/data/lines/sect-marginal.json`、`src/data/route-conflict-table.json`。

本文档定义 **魔道路线（routeId: `demonic`，flag: `route_demonic`）** 在 **31–50 岁** 的中段叙事节拍与事件规格，供 **US-023** 实现、**US-024** gate 与 `golden-demonic` 确定性样本对齐。**不实现事件、不修改业务代码。**

---

## 1. 摘要

| 项 | 定义 |
| --- | --- |
| **Arc ID** | `arc_demonic_midlife` |
| **路线** | `demonic` · `route_demonic` · 资产文件 `sect-marginal.json`（主链）+ 可选 `identity-demon.json`（outlaw 侧线变体） |
| **年龄窗口** | 主链 **31–50**；与 0–30 青年链 **衔接** 但不重复 `demonic_aftermath` / `demonic_ending_*` 的收束功能 |
| **叙事主轴** | 权力扩张 → 社会代价 → 背叛或诱惑 → 救赎或加码 → 中年后果 |
| **P3-EVAL 样本** | `golden-demonic`（seed 303，`routeTrack: demonic`）须 **存活至 50** 且命中本 arc ≥3 事件、≥2 手动选择、≥2 回调 |
| **路线互斥** | 遵循 US-016：`route_orthodox` / `sect` active 时 **不得** 触发本 arc；条件表达式须含 `flags.has('route_demonic') && !flags.has('route_orthodox')` |
| **死亡风险** | 遵守 US-004 §3.4：midlife 须 ≥1 可读高风险 moment；**P3-EVAL 禁止 R4 致死**；severe harm 须 L2+ warning + 缓解 |

**相对 US-017 基线的缺口**

| 观察 | 本 spec 的处理 |
| --- | --- |
| `golden-demonic` 31–50 仅有 generic 事件，无路线专属 midlife 节拍 | 新增 5 个 **route-relevant** 事件 spec（§5） |
| 0–30 已有 `demonic_leader` / `demonic_usurp_failed` / redemption 链 | 31–50 **回调** 上述 flag，而非重跑夺位 |
| `demonic:completed` 可在 30 前达成 | midlife 事件以「掌权余波 / 退隐后债 / 赎罪未完」承接，不要求 `demonic` lifecycle 仍为 `active` |
| `family_crisis` 魔道变体在 US-008 已定义 | 本 arc **引用** 为 social cost 并行 echo，不重复实现 |

---

## 2. 设计原则

1. **权力有价**：midlife 增益（武力、门内掌控）须伴随声望、关系或家庭代价；choice feedback 须量化 stat impact。
2. **早选有回响**：0–30 的 encounter、试炼、权斗、夺位结果 **必须** 改变 31–50 文案、选项可用性或 outcome 权重（≥2 处，§7）。
3. **背叛或诱惑二选一**：每条样本路径至少命中 **外部背叛** 或 **内部诱惑** 之一；两者可拆为同一事件的互斥分支。
4. **救赎与加码同屏**：中年 fork 须同时呈现「抽身 / 赎罪 / 转向」与「更深魔功 / 铁腕巩固」；不得 silent 锁死 redemption。
5. **severe harm 可读可避**：参照 US-004 §4.2、§10；本 arc 最高 **R3**（强惩罚），P3-EVAL 下 **禁止 R4**；任何 health −≥10 分支须同事件提供无强惩罚选项。
6. **最小增量**：US-023 优先 **新增** §5 五事件；可 **补丁** 现有 `family_crisis` 魔道变体文案（US-008 §4），不得重写 0–30 主链。

---

## 3. 弧线五段结构

```text
[权力扩张] → [社会代价] → [背叛或诱惑] → [救赎或加码] → [中年后果]
  31-38        33-42         36-45           38-48            45-50
```

### 3.1 阶段总表

| 阶段 | 年龄 | 叙事目标 | 事件 spec ID | 类型 |
| --- | ---: | --- | --- | --- |
| **Power expansion** | 31–38 | 魔功/domain 扩张，玩家感到「变强了」 | `demonic_midlife_expansion` | choice |
| **Social cost** | 33–42 | 孤立、名望、家庭/旧识压力 | `demonic_midlife_isolation` | auto |
| **Betrayal or temptation** | 36–45 | 亲信背叛或禁术诱惑 | `demonic_midlife_betrayal` | choice |
| **Redemption or escalation** | 38–48 | 抽身赎罪 vs 魔功加码 | `demonic_midlife_fork` | choice |
| **Midlife consequence** | 45–50 | 路线中年定格与未了债 | `demonic_midlife_consequence` | choice |

### 3.2 推荐阅读时间线（`golden-demonic` 主路径）

前提（0–30，与现有 spine 一致）：`accept_demonic` → `demonic_trial_shadow`（偏暗影）→ `demonic_usurp` → `demonic_usurp_success` → `demonic_leader`；可选 `love_demonic_conflict` redemption 侧 + `family_marriage` 明月。

| Age | Phase | Event ID | 玩家动作 |
| ---: | --- | --- | --- |
| 31–34 | Power expansion | `demonic_midlife_expansion` | 选「扩张总坛势力」或「秘传闭关」（MC-1 见 §6） |
| 34–38 | Social cost | `demonic_midlife_isolation` | auto；正文 echo 明月/旧友 |
| 37–42 | Betrayal or temptation | `demonic_midlife_betrayal` | 选「清洗内奸 / 反利用 / 暂压不发」（MC-2） |
| 40–46 | Redemption or escalation | `demonic_midlife_fork` | 选「接受暗中赎罪契机」或「炼化禁术」（MC-3） |
| 46–50 | Midlife consequence | `demonic_midlife_consequence` | 选「立规自治 / 金盆洗手 / 远遁江湖」（MC-4） |

**Renounce / redemption  youth 支（对照路径）**：若 0–30 走 `demonic_renounce` + `demonic_redemption_started`，则 §5.1 expansion 弱化、§5.3 betrayal 改为 **外部诱惑**（正派招安），§5.4 fork 默认偏 redemption。

---

## 4. 与 0–30 主链的衔接

| 0–30 终态 flag | 对 midlife 的影响 |
| --- | --- |
| `demonic_leader` | expansion 默认「门主扩张」文案；isolation 强调江湖惧名 |
| `demonic_usurp_failed` | **不得** 再触发 silent purge auto；若 31–50 出现清算压力，须走 manual + 缓解（US-006 已改 `demonic_ending_purge`）；midlife betrayal 偏「旧部清算余党」 |
| `demonic_renounce_done` / `demonic_withdrawn` | expansion 改为「余孽纠缠」；fork 偏 redemption |
| `demonic_redemption_success` | fork 的 redemption 选项加权；consequence 默认「洗名未竟」 |
| `youming_principled`（outlaw 有条件加入） | isolation 文案保留底线；fork 增加「公开底线」第三缓解支 |
| `spouse_mingyue` / `married` | isolation + consequence 须引用家庭（US-008 §4） |
| `demonic_trial_shadow` aggressive 侧 flag | expansion 禁术选项 **可用** 且 risk 升一级 |

---

## 5. 事件规格（≥3，本文 5 个）

### 5.1 `demonic_midlife_expansion` — 权力扩张

| 字段 | 值 |
| --- | --- |
| **年龄** | 31–38 |
| **优先级** | `priority: 88`（高于 generic midlife，低于 crisis） |
| **条件** | `route_demonic && !demonic_midlife_expansion_done && age>=31`；且 (`demonic_leader` \|\| `martialPower>=40` \|\| `demonic_ending_rule`) |
| **类型** | `choice` |
| **Beat** | Power expansion |

**正文要点**：幽影门总坛或所辖分坛进入「二次扩张」窗口——兼并周边势力、或闭关冲击更高魔功。

| Choice ID | 文案方向 | 效果（spec 级） | 风险 |
| --- | --- | --- | --- |
| `demonic_expand_territory` | 兼并周边，扩大门势 | `martialPower +6`, `reputation -8`, `connections +4`, flag `demonic_midlife_expansion_martial` | R1–R2；L1+L2 |
| `demonic_expand_secret_art` | 闭关炼化禁术 | `internalSkill +8`, `chivalry -6`, flag `demonic_midlife_expansion_secret` | R2；L2；须同事件有 territory 低风险替代 |
| `demonic_expand_consolidate` | 固守既有地盘 | `reputation +4`, `chivalry +2`, flag `demonic_midlife_expansion_stable` | R0 |

**持久写入**：`demonic_midlife_expansion_done`；`event_record` 对应 choice。

**Callback（实现时）**：

- 若 youth 选 `demonic_trial_shadow` 的激进试炼支 → `demonic_expand_secret_art` 描述提及「暗影试炼旧债」。
- 若 `demonic_leader` → 标题为「门主扩张」；否则「余孽借势」。

---

### 5.2 `demonic_midlife_isolation` — 社会代价

| 字段 | 值 |
| --- | --- |
| **年龄** | 33–42 |
| **条件** | `route_demonic && demonic_midlife_expansion_done && !demonic_midlife_isolation_done` |
| **类型** | `auto` |
| **Beat** | Social cost |

**正文要点**：江湖正道避你如蛇蝎、旧友疏远、若已婚则明月（或 `player.spouse`）质问「这条路还要走多远」。**不** 给选项；代价通过 stat 与 life memory 风险区可见。

**Auto 效果（spec 级）**：

- `reputation -6`（若 `demonic_midlife_expansion_martial` 则额外 `-4`）
- 若 `spouse_mingyue`：`relation_change lover_mingyue delta -8`；正文 callback KC-3 迎娶明月
- 若 `chivalry >= 10`（encounter 未彻底堕落）：正文增加「你曾婉拒或保留底线，如今却……」self-echo
- flag `demonic_midlife_isolation_done`

**并行 echo**：若同年触发 `family_crisis`（US-008 魔道变体），isolation 正文 **缩短** 避免重复；实现时二选一优先 crisis。

---

### 5.3 `demonic_midlife_betrayal` — 背叛或诱惑

| 字段 | 值 |
| --- | --- |
| **年龄** | 36–45 |
| **条件** | `route_demonic && demonic_midlife_isolation_done && !demonic_midlife_betrayal_done` |
| **类型** | `choice` |
| **Beat** | Betrayal **or** temptation |

**分支逻辑（由 youth 决定默认叙事，非互斥条件）**：

| Youth 状态 | 叙事模式 |
| --- | --- |
| `demonic_path_usurp` / `demonic_leader` | **背叛**：副门主或亲传弟子泄密 |
| `demonic_path_renounce` / 高 `chivalry` | **诱惑**：正派/旧识以洗名换情报 |
| `demonic_usurp_failed` | **背叛+清算压力**：余党卖你换赦免 |

| Choice ID | 文案方向 | 效果 | 风险 |
| --- | --- | --- | --- |
| `demonic_betrayal_purge` | 铁腕清洗 | `martialPower +4`, `connections -10`, `health -8`, flag `demonic_midlife_purge` | R2；L2；缓解：`demonic_betrayal_coopt` |
| `demonic_betrayal_coopt` | 反利用，设局反杀 | `comprehension +5`, `reputation -4`, flag `demonic_midlife_coopt` | R1 |
| `demonic_betrayal_wait` | 按兵不动，静观其变 | `chivalry +2`, flag `demonic_midlife_wait` | R0；但若 youth 为 usurp 失败，L0 须提示「清算风险仍在」 |

**持久写入**：`demonic_midlife_betrayal_done`。

---

### 5.4 `demonic_midlife_fork` — 救赎或加码

| 字段 | 值 |
| --- | --- |
| **年龄** | 38–48 |
| **条件** | `route_demonic && demonic_midlife_betrayal_done && !demonic_midlife_fork_done` |
| **类型** | `choice` |
| **Beat** | Redemption **or** escalation |

**正文要点**：暗中使者（或旧日恩人，callback `demonic_redemption_offer` 若已 reject）再给你 **最后一次** 抽身洗名机会；同时幽影门镇派禁术也在召唤。

| Choice ID | 文案方向 | 效果 | 风险 |
| --- | --- | --- | --- |
| `demonic_fork_redemption` | 接受赎罪契机，交出一部分权柄 | `chivalry +8`, `martialPower -4`, flag `demonic_midlife_redemption_path`；若已有 `demonic_redemption_started` 则文案接续 | R1 |
| `demonic_fork_escalate` | 炼化禁术，力量再上一层 | `martialPower +10`, `chivalry -10`, `health -12`, flag `demonic_midlife_escalated` | **R3**；**L2 必须**；缓解：`demonic_fork_redemption` 或 `demonic_fork_balance` |
| `demonic_fork_balance` | 维持现状，既不洗名也不加码 | `comprehension +4`, flag `demonic_midlife_balanced` | R0 |

**Route turn 注意**：若选 redemption 且须 **脱离魔道**，须标记 `metadata.routeTransition: turn` 并 fail/turn `demonic` route（US-016）；midlife 内默认 **不 complete turn**，仅设 `demonic_midlife_redemption_path` 供 51+ 或 consequence 收束；P3-EVAL 仍保持 `route_demonic` 至 50。

**持久写入**：`demonic_midlife_fork_done`。

---

### 5.5 `demonic_midlife_consequence` — 中年后果

| 字段 | 值 |
| --- | --- |
| **年龄** | 45–50 |
| **条件** | `route_demonic && demonic_midlife_fork_done && !demonic_midlife_consequence_done` |
| **类型** | `choice` |
| **Beat** | Midlife consequence |

**正文要点**：至 50 岁前的定格——你以何种身份面对江湖与家人。

| Choice ID | 文案方向 | 效果 | 终态语义 |
| --- | --- | --- | --- |
| `demonic_consequence_rule` | 铁腕立规，幽影门进入「秩序化魔道」 | `reputation +6`, `martialPower +4`, flag `demonic_midlife_legacy_rule` | Escalation 后果 |
| `demonic_consequence_withdraw` | 金盆洗手，交权退隐 | `chivalry +6`, `martialPower -6`, flag `demonic_midlife_legacy_withdraw` | Redemption 后果 |
| `demonic_consequence_exile` | 远遁江湖，切断门内纠葛 | `qinggong +6`, `connections -8`, flag `demonic_midlife_legacy_exile` | 失败/清洗后余生 |

**选项可用性**：

- `demonic_midlife_escalated` → `rule` 加权文案
- `demonic_midlife_redemption_path` → `withdraw` 默认可用且 feedback 更积极
- `demonic_usurp_failed` + `demonic_midlife_wait` → `exile` 须 **默认可用**（防 purge 链）

**持久写入**：`demonic_midlife_consequence_done`；可选 mirror `route_demonic_completed` 若尚未设置（与现有 ending 不冲突）。

**Choice feedback**：须汇总 callback 摘要（§7）在 `summary` 或 `riskHints` 中一句点题。

---

## 6. 关键玩家抉择（≥2 manual choices）

US-023 / US-024 须稳定可测的 midlife manual choices：

| # | Event | Choice ID | 阶段 | 持久写入 | 设计意图 |
| --- | --- | --- | --- | --- | --- |
| **MC-1** | `demonic_midlife_expansion` | `demonic_expand_territory` vs `demonic_expand_secret_art` vs `demonic_expand_consolidate` | Power expansion | §5.1 flags | 定义中年权力风格；secret 支影响后续 risk |
| **MC-2** | `demonic_midlife_betrayal` | `demonic_betrayal_purge` vs `demonic_betrayal_coopt` vs `demonic_betrayal_wait` | Betrayal/temptation | §5.3 flags | 路线道德与伤亡分水岭 |
| **MC-3** | `demonic_midlife_fork` | `demonic_fork_redemption` vs `demonic_fork_escalate` vs `demonic_fork_balance` | Redemption/escalation | §5.4 flags | **US-004 高风险 moment**（escalate 须 L2+ 缓解） |
| **MC-4** | `demonic_midlife_consequence` | 三选一 legacy | Midlife consequence | §5.5 flags | 50 岁前的玩家定格 |

**Gate 最低要求**：MC-1 + MC-2 或 MC-3 中 **至少 2 个** 在 31–50 被触发（US-023 确定性样本）。

---

## 7. 对 0–30 的回调（≥2）

| # | 来源（0–30） | 影响 midlife 的方式 | 命中事件 |
| --- | --- | --- | --- |
| **CB-1** | `demonic_power_struggle`：`demonic_usurp` vs `demonic_renounce` | 决定 §5.3 默认叙事（背叛 vs 诱惑）及 `demonic_betrayal_wait` 的 L0 清算提示 | `demonic_midlife_betrayal` |
| **CB-2** | `demonic_usurpation`：`demonic_leader` vs `demonic_usurp_failed` | 决定 expansion 标题/语气；consequence `exile` 可用性；isolation 声望跌幅 | `demonic_midlife_expansion`, `demonic_midlife_consequence` |
| **CB-3** | `demonic_trial_shadow` / `outlaw_cultivation` 激进修炼 | 解锁/强化 `demonic_expand_secret_art` 文案与 `demonic_fork_escalate` 诱惑句 | `demonic_midlife_expansion`, `demonic_midlife_fork` |
| **CB-4** | `love_demonic_conflict` + `family_marriage`（明月） | isolation 与 consequence 的家庭段落；crisis 线互文 | `demonic_midlife_isolation`, `demonic_midlife_consequence` |

**US-023 最低实现**：CB-1 + CB-2 必须有 **可测** 文本或选项差异（golden-demonic 断言）。

---

## 8. 死亡与 severe harm 护栏（US-004）

| 事件 | 最高风险 | Warning | 缓解 |
| --- | --- | --- | --- |
| `demonic_midlife_expansion` | R2 | L2 on secret_art | `demonic_expand_consolidate` / `demonic_expand_territory` |
| `demonic_midlife_isolation` | R1 | L1 正文 | auto，无手动伤害 |
| `demonic_midlife_betrayal` | R2 | L2 on purge | `coopt` / `wait` |
| `demonic_midlife_fork` | R3 | L2 on escalate | `redemption` / `balance` |
| `demonic_midlife_consequence` | R1 | L1 | 无强惩罚选项 |

**禁止**：

- 新增 auto-only 致死链（§7.2 X2）
- P3-EVAL 路径上 R4 或 `alive=false`
- 无 L2 的 `health -≥10` 单一选项

**与 `demonic_ending_purge` 关系**：若 youth 遗留 `demonic_usurp_failed`，midlife **优先** 用 `demonic_midlife_betrayal` + `consequence.exile` 承接压力；purge 若仍保留在库中，须 **manual + 缓解**（US-006 现状）；本 arc 不依赖 purge 触发。

---

## 9. 调度与 `golden-demonic` 策略

### 9.1 事件优先级（31–50）

| 规则 | 说明 |
| --- | --- |
| **顺序** | expansion → isolation → betrayal → fork → consequence（前序 `*_done` flag  gating） |
| **窗口保底** | `routeTrack=demonic` 样本在 31–50 内 **至少触发 §5 中 3 个** route-relevant 事件 |
| **与 family 共存** | 允许 `family_crisis` / `spouse_mingyue_daily` 并行；`demonic_midlife_isolation` 与 `family_crisis` 同 age 时 **crisis 优先** |
| **与 generic 共存** | `middle-age-career` / `adventure` 可填充空年；route 事件 priority ≥ 85 |

### 9.2 确定性样本（US-023 预置）

| 样本 ID | 策略 |
| --- | --- |
| `golden-demonic` | 0–30：usurp 成功线 + 可选明月；31–50：MC-1 `territory` → MC-2 `coopt` → MC-3 `balance` → MC-4 `rule`（可调，但须覆盖 ≥3 事件、≥2 MC、≥2 CB） |
| 报告字段 | `arc_id=arc_demonic_midlife`, `midlife_events[]`, `midlife_choices[]`, `callbacks_hit[]` |

---

## 10. US-023 实现清单（交接）

按优先级排序；超出须回 US-022 修订 spec。

1. 在 `sect-marginal.json` 新增 §5 五个事件 JSON（`metadata.routeTargets: ["demonic"]`, `enabled: true`）。
2. 注册 choice feedback / key choice id（MC-1..3 至少）供 payoff 与 gate 统计。
3. 实现 CB-1、CB-2 的 `triggerConditions.expression` 或分支 `content.text` 变体。
4. `demonic_midlife_fork` escalate 分支：L2 `riskHints` + choice feedback stat impact。
5. 更新 `event-asset-manifest.json`（`npm run report:event-asset-inventory`）。
6. `GameProcessSimulator` / golden-demonic：31–50 选题策略优先本 arc 链。
7. 确定性测试：≥3 route events、≥2 manual choices、≥2 callbacks、50 岁 alive。

**可选（非必须）**：outlaw 侧线 `outlaw_final_choice`（35+）与本 arc 互斥触发，避免双「终极抉择」。

**不在 US-023**：修改 US-016 route conflict 引擎；新增 51+ late-life 结局。

---

## 11. 非目标（本 story）

- 不编写或修改 JSON 事件 / 引擎代码。
- 不让 severe harm 无预警（§8）。
- 不实现 US-024 gate。
- 不要求 neutral / sect 样本走本 arc。
- 不合并或删除现有 `demonic_redemption_*` 链（可并行，age 18–35 与 midlife 38–48 错开）。

---

## 12. US-022 验收对照

| Acceptance criterion | Status |
| --- | --- |
| Define ages 31–50 beats: power expansion, social cost, betrayal/temptation, redemption/escalation, midlife consequence | done — §3 |
| Include at least 3 midlife events or event specs | done — §5（5 个） |
| Include at least 2 manual choices | done — §6（4 个 MC，gate 最低 2） |
| Include at least 2 callbacks to ages 0–30 choices or route state | done — §7（4 个 CB） |
| Typecheck passes | 见 §13 |
| Ready for US-023 implementation | done — §10 |

---

## 13. 验证

```bash
npm run typecheck
```

预期：exit 0（本文档仅 markdown，无 TS 变更）。

---

*P3-W5 / US-022 — 2026-05-31*
