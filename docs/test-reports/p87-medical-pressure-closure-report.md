# P87 Medical Pressure Playable Implementation - Closure Report

**PRD**: p87-wuxia-medical-pressure-playable-implementation
**Branch**: codex/p87-wuxia-medical-pressure-playable-implementation
**Date**: 2026-06-29
**Status**: ✅ Complete

---

## 1. 交付物清单

### 1.1 文档类

| 文档 | 路径 | 对应 Story |
|------|------|-----------|
| Targeted Proof | `docs/test-reports/p87-medical-pressure-targeted-proof.md` | US-005 |
| Closure Report | `docs/test-reports/p87-medical-pressure-closure-report.md` | US-007 |

### 1.2 代码类

| 文件 | 改动 | 对应 Story |
|------|------|-----------|
| `src/data/lines/sample-lines-spine.json` | 新增 2 个 auto pressure event | US-001 |
| `src/p50/sampleLineExpression.ts` | medicalCurrentGoal + cost label 各新增 2 个 pressure 分支 + payoff TODO | US-002 / US-004 |
| `src/p56/ordinaryOriginExpression.ts` | tavernCurrentGoal / tavernLifeMemory / deriveOrdinaryOriginSummary 各新增 2 个 pressure 分支 | US-002 / US-003 |
| `tests/p87TavernHandMedicalPressureSpineTests.ts` | 新增窄回归测试（6 组，36 项） | US-006 |

---

## 2. 故事完成情况

| Story ID | 标题 | 状态 | 验证方式 |
|----------|------|------|---------|
| P87-001 | Wire medical pressure spine events (2 variants) | ✅ Pass | JSON 验证 + 事件加载测试 |
| P87-002 | Add pressure player-facing expression (core P0) | ✅ Pass | TypeScript typecheck + 表达分支测试 |
| P87-003 | Add pressure player-facing expression (bonus P1) | ✅ Pass | TypeScript typecheck + 表达分支测试 |
| P87-004 | Reserve payoff flag interfaces | ✅ Pass | 代码中 TODO 注释可见 |
| P87-005 | Add targeted pressure proof (2 variants) | ✅ Pass | 文档产出 |
| P87-006 | Add narrow regression coverage | ✅ Pass | 36/36 测试通过 |
| P87-007 | Produce P87 closure report | ✅ Pass | 本文档 |

**总计**: 7/7 stories passed

---

## 3. 核心实现摘要

### 3.1 事件配置（2 个 auto event）

| 事件 | Variant | 触发年龄 | 方向 |
|------|---------|----------|------|
| `medical_pressure_compassionate` | 仁心医者 | 36-40 | 向内消耗（身体垮掉） |
| `medical_pressure_pragmatic` | 世故人医 | 37-41 | 向外束缚（人情债缠身） |

**共享检查点**：`medical_midlife_pressure_done`（防止重复触发）
**Variant marker**：`tavern_medical_pressure_compassionate` / `tavern_medical_pressure_pragmatic`
**前置条件**：`medical_on_ramp_done` + 对应 on-ramp variant marker
**排除条件**：正邪童年种子线

### 3.2 Stats 设计

| 维度 | Compassionate 仁心耗尽 | Pragmatic 人情债缠身 |
|------|----------------------|-------------------|
| Reputation | +3 | +4 |
| Chivalry | +2 | — |
| Constitution | -3 | — |
| Money | — | +50 |
| Connections | — | +3 |
| Charisma | — | +2 |

**方向验证**：
- Compassionate = 向内消耗（constitution 大幅下降，chivalry 上升但代价沉重）
- Pragmatic = 向外束缚（connections 上升，人情网越织越密）

### 3.3 表达更新（P0 + P1）

**P0 核心表达（3 面 × 2 variants = 6 项）**：
1. sample line cost label：仁心之累→仁心耗尽 / 世故之秤→人情债缠身
2. sample line current goal：2 个 pressure 分支
3. ordinary origin current goal：2 个 pressure 分支

**P1 加分表达（2 面 × 2 variants = 4 项）**：
1. ordinary origin life memory：2 个 pressure 分支（完整叙事）
2. ordinary origin summary：2 个 pressure 分支（一句话概括）

**总计**：5 个表达面 × 2 variants = 10 个新分支

---

## 4. 12 条 Closure Criteria 满足情况

| # | 标准 | 状态 | 证据 |
|---|------|------|------|
| 1 | 2 个 pressure 事件正确配置 | ✅ | sample-lines-spine.json 验证 |
| 2 | Compassionate 触发条件正确（on-ramp + variant + age 36-40 + 互斥） | ✅ | 事件条件测试 |
| 3 | Pragmatic 触发条件正确（on-ramp + variant + age 37-41 + 互斥） | ✅ | 事件条件测试 |
| 4 | 共享 checkpoint + 独立 variant marker | ✅ | flag 设置测试 |
| 5 | Cost label 更新（2 variants） | ✅ | P0 表达测试 |
| 6 | Current goal 更新（2 variants, sample line + ordinary origin） | ✅ | P0 表达测试 |
| 7 | Life memory + summary 更新（2 variants） | ✅ | P1 表达测试 |
| 8 | 2 variants 有本质差异（向内消耗 vs 向外束缚） | ✅ | 差异化测试 |
| 9 | 与 renown/merchant pressure 明确区分 | ✅ | 跨路线测试 |
| 10 | P83/P84/P85 既有 evidence 不退化 | ✅ | 回归测试 |
| 11 | Payoff flag 接口预留 | ✅ | 代码 TODO 注释 |
| 12 | Targeted proof + closure report 产出 | ✅ | 本文档 + proof 文档 |

**结果**：12/12 closure criteria 全部满足

---

## 5. 质量验证

### 5.1 自动化验证

| 验证项 | 结果 |
|--------|------|
| JSON 格式合法 | ✅ |
| TypeScript typecheck | ✅ 0 errors |
| P87 窄回归测试（6 组，36 项） | ✅ 36/36 passed |
| P83 bridge 回归 | ✅ 通过 |
| P84 entry 回归 | ✅ 通过 |
| P85 on-ramp 回归 | ✅ 通过 |
| P75 renown pressure 回归 | ✅ 通过 |
| Flag 命名与 renown 路线一致 | ✅ |

### 5.2 手工验证清单（留给 A1-verify）

- [ ] 仁心医者 variant：从出生走到 pressure，事件正常触发
- [ ] 世故人医 variant：从出生走到 pressure，事件正常触发
- [ ] 两个 variant 互斥：一个触发后另一个不会再触发
- [ ] 未走 on-ramp 的 bridge 状态：不会误触发 pressure
- [ ] 正邪童年种子线：不会触发 medical pressure
- [ ] pressure 后 cost label 和 current goal 正确更新
- [ ] 两个 variant 表达文案区分度足够
- [ ] 酒肆出生 flavor 贯穿始终（老掌柜、酒肆大堂、小药庐等）

---

## 6. Variant 差异化验证

### 6.1 本质差异确认

| 维度 | Compassionate 仁心耗尽 | Pragmatic 人情债缠身 |
|------|----------------------|-------------------|
| 压力方向 | 向内（身体/精神） | 向外（社会关系） |
| 核心代价 |  constitution -3（身体垮掉） | connections +3（债多人不自由） |
| Cost label | 仁心耗尽 | 人情债缠身 |
| 叙事关键词 | 老掌柜劝歇、夜里咳醒、手发颤、药庐门口望天 | 翻人情账、张老爷/李掌柜/县衙师爷、人情网缠住 |
| Summary 身份 | 仁心医者 | 世故人医 |
| 触发时机 | 36-40（稍早，累垮快） | 37-41（稍晚，债慢积） |

### 6.2 与其他路线的区分

- 与 renown pressure 区分：renown 是"江湖名声带来的人情债"，medical 是"行医带来的人情债"，来源和风味不同
- 与 merchant pressure 区分：merchant 是"生意/债务压力"，medical 是"仁心/人情网压力"，核心矛盾不同
- Medical 有自己的独特元素：药庐、老掌柜、行医、仁心、病人

---

## 7. 边界与风险

### 7.1 已遵守的边界

- ✅ 仅触及 tavern 出生的 medical 路线
- ✅ 严格按 P86 contract 落地，不偏离方向
- ✅ 不涉及 payoff / late-life / endgame 阶段
- ✅ 不涉及其他 origin（farm_peasant / town_apprentice）
- ✅ 不触碰毒医路线
- ✅ 不新增系统，复用现有事件系统和表达系统
- ✅ 不新增 UI 组件
- ✅ P83/P84/P85 既有 evidence 保持通过

### 7.2 残余风险

| 风险 | 等级 | 说明 |
|------|------|------|
| 事件触发时序 | 低 | 需在真实游戏中验证 36/37 岁是否稳定触发 |
| 文案质量 | 低 | 文案为 AI 初稿，可后续润色 |
| 数值平衡 | 低 | stats 为初步设定，需 payoff 阶段整体调优 |
| Pragmatic 与 renown 的"人情债"方向接近 | 低 | 来源不同（行医 vs 江湖名声），风味有别，但可在 payoff 阶段进一步区分 |

---

## 8. 与 PRD 的差异说明

无差异。所有实现严格按照 P87 PRD 和 P86 pressure contract 执行。

---

## 9. 后续阶段接口（给 P88+）

### 9.1 已预留的 Flag

| Flag | 预留位置 | 说明 |
|------|---------|------|
| `medical_payoff_done` | sampleLineExpression.ts TODO | payoff 阶段共享检查点 |
| `medical_age40_identity_done` | sampleLineExpression.ts TODO | age-40 identity 检查点 |
| `tavern_medical_payoff_compassionate` | sampleLineExpression.ts TODO | compassionate payoff marker |
| `tavern_medical_payoff_pragmatic` | sampleLineExpression.ts TODO | pragmatic payoff marker |

### 9.2 Payoff 阶段方向建议

**Compassionate 仁心耗尽的 payoff 方向**：
- 硬扛到底（继续消耗，油尽灯枯）
- 学会放手（接受自己不是神，该推的推）
- 找到传承（把医术传下去，仁心延续）

**Pragmatic 人情债缠身的 payoff 方向**：
- 硬扛所有人情（维持名声，越缠越紧）
- 撕破脸皮（断了不该有的债，落个骂名）
- 人情练达（拿捏分寸，游刃有余）

---

## 10. 更大 Medical-Expansion 项的 Defer

以下项目**不在** P87 范围内，留待后续阶段：

| 项目 | 说明 |
|------|------|
| Payoff 阶段 | P88+ design-first |
| Age-40 identity 深化 | P88+ |
| Late-life 阶段 | P90+ |
| 毒医路线（poison path） | 独立大方向，defer |
| Plague hero / medical pure 完整抉择 | 深度内容，defer |
| 其他 origin 的 medical 路线 | farm_peasant / town_apprentice，defer |
| Choice-based pressure | contract 规定为 auto，defer |
| Stat threshold gate 完整实现 | 可选增强，defer |
| 新 UI 组件 | 不在 scope 内 |
| Full lifetime exhaust | targeted proof 足够，不需要 |

---

## 11. Payoff 阶段 GO/NO-GO 判断

**结论**：✅ GO - 建议进入 P88 payoff design-first 阶段

**理由**：

1. ✅ Pressure 阶段已完整落地（2 variants，runtime 可见）
2. ✅ 两个 variant 有本质差异，不是换皮
3. ✅ Tavern-born 风味保持良好
4. ✅ 与 renown pressure 模式一致，可复用方法论
5. ✅ Payoff flag 接口已预留
6. ✅ P83/P84/P85 既有 evidence 未退化
7. ✅ 有明确的 payoff 方向（3 选 1 的 choice-based payoff，与 renown 模式对齐）
8. ✅ Medical 路线从"只有上升期"推进到"有代价的成长"，价值已验证

**建议的 P88 scope**：
- Payoff design-first（参考 P76 renown payoff design-first 模式）
- 2 variants × 3 choices = 6 payoff 分支
- Choice 事件（非 auto），给玩家 agency
- 5 个表达面更新（cost label, current goal, age40 identity, life memory, summary）
- Targeted proof + narrow regression + closure report

---

## 12. 结论

P87 medical_sage_healer pressure playable implementation 全部 7 个 user stories 已完成。实现了从 P85 on-ramp 到 pressure 的完整过渡，包含 2 个 variant 的事件配置和 5 个表达面的更新。窄回归测试全部通过，P83/P84/P85/P75 回归全部通过。

**可以进入 A1-verify 阶段。**
