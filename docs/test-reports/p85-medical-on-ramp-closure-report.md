# P85 Medical Sage On-Ramp Spine - Closure Report

**PRD**: p85-wuxia-medical-sage-on-ramp-spine
**Branch**: codex/p85-wuxia-medical-sage-on-ramp-spine
**Date**: 2026-06-29
**Status**: ✅ Complete

---

## 1. 交付物清单

### 1.1 文档类

| 文档 | 路径 | 对应 Story |
|------|------|-----------|
| Gap Audit | `docs/test-reports/p85-medical-on-ramp-gap-audit.md` | US-001 |
| Scope Contract | `docs/test-reports/p85-medical-on-ramp-scope-contract.md` | US-002 |
| On-Ramp Contract | `docs/PRD/p85-medical-on-ramp-contract.md` | US-003 |
| Targeted Proof | `docs/test-reports/p85-medical-on-ramp-targeted-proof.md` | US-006 |
| Closure Report | `docs/test-reports/p85-medical-on-ramp-closure-report.md` | US-008 |

### 1.2 代码类

| 文件 | 改动 | 对应 Story |
|------|------|-----------|
| `src/data/lines/sample-lines-spine.json` | 新增 2 个 auto event | US-004 |
| `src/p50/sampleLineExpression.ts` | medicalCurrentGoal 新增 2 个 on-ramp 分支 | US-005 |
| `src/p56/ordinaryOriginExpression.ts` | tavernCurrentGoal / tavernLifeMemory / deriveOrdinaryOriginSummary 各新增 2 个 on-ramp 分支 | US-005 |
| `tests/p85MedicalOnRampTests.ts` | 新增窄回归测试（8 项） | US-007 |

### 1.3 Commits

| Commit | Message |
|--------|---------|
| 1 | `feat: P85-001 - Medical on-ramp gap audit` |
| 2 | `docs: P85-002 - Lock P85 scope contract` |
| 3 | `feat: P85-003 - Define medical on-ramp contract` |
| 4 | `feat: P85-004 - Wire medical on-ramp spine event` |
| 5 | `feat: P85-005 - Add on-ramp player-facing expression` |
| 6 | `docs: P85-006 - Add targeted on-ramp proof` |
| 7 | `test: P85-007 - Add narrow regression coverage` |

---

## 2. 故事完成情况

| Story ID | 标题 | 状态 | 验证方式 |
|----------|------|------|---------|
| US-001 | Audit Medical On-Ramp Gap | ✅ Pass | 文档产出 |
| US-002 | Lock P85 Scope Contract | ✅ Pass | 文档产出 |
| US-003 | Define Medical On-Ramp Contract | ✅ Pass | 文档产出 |
| US-004 | Wire Medical On-Ramp Spine Event | ✅ Pass | JSON 验证 + 事件加载测试 |
| US-005 | Add On-Ramp Player-Facing Expression | ✅ Pass | TypeScript typecheck + 表达分支测试 |
| US-006 | Add Targeted On-Ramp Proof | ✅ Pass | 文档产出 |
| US-007 | Add Narrow Regression Coverage | ✅ Pass | 8/8 测试通过 |
| US-008 | Produce P85 Closure Report | ✅ Pass | 本文档 |

**总计**: 8/8 stories passed

---

## 3. 核心实现摘要

### 3.1 事件配置

- **2 个 auto event**：`medical_on_ramp_compassionate` / `medical_on_ramp_pragmatic`
- **触发年龄**：31-34 岁
- **前置条件**：`tavern_medical_bridge_crossed` + 对应 variant embrace marker
- **共享检查点**：`medical_on_ramp_done`（防止重复触发）
- **排除条件**：正邪童年种子线

### 3.2 Stats 设计

| 维度 | Compassionate 仁心医者 | Pragmatic 世故人医 |
|------|----------------------|-------------------|
| Reputation | +6 | +4 |
| Chivalry | +5 | — |
| Constitution | -2 | — |
| Money | — | +80 |
| Connections | — | +4 |
| Charisma | — | +3 |

### 3.3 表达更新（4 个面）

1. **sampleLineExpression.ts → medicalCurrentGoal**
2. **ordinaryOriginExpression.ts → tavernCurrentGoal**
3. **ordinaryOriginExpression.ts → tavernLifeMemory**
4. **ordinaryOriginExpression.ts → deriveOrdinaryOriginSummary**

每个面各 2 个 variant 分支（compassionate + pragmatic），共 8 个新分支。

---

## 4. 质量验证

### 4.1 自动化验证

| 验证项 | 结果 |
|--------|------|
| JSON 格式合法 | ✅ |
| TypeScript typecheck | ✅ 0 errors |
| 窄回归测试（8 项） | ✅ 8/8 passed |
| Flag 命名与 renown 路线一致 | ✅ |

### 4.2 手工验证清单（留给 A1-verify）

- [ ] 仁心医者 variant：从出生走到 on-ramp，事件正常触发
- [ ] 世故人医 variant：从出生走到 on-ramp，事件正常触发
- [ ] 未选 variant 的 bridge 状态：不会误触发 on-ramp
- [ ] 正邪童年种子线：不会触发 medical on-ramp
- [ ] 两个 variant 表达文案区分度足够
- [ ] 酒肆出生 flavor 贯穿始终（老掌柜、酒肆大堂等）

---

## 5. 边界与风险

### 5.1 已遵守的边界

- ✅ 仅触及 tavern 出生的 medical 路线
- ✅ 不涉及 pressure / payoff / endgame 阶段
- ✅ 不涉及其他 origin（farm_peasant / town_apprentice）
- ✅ 不触碰毒医路线
- ✅ 不新增系统，复用现有事件系统和表达系统

### 5.2 残余风险

| 风险 | 等级 | 说明 |
|------|------|------|
| 事件触发时序 | 低 | 需在真实游戏中验证 31 岁是否稳定触发 |
| 文案质量 | 低 | 文案为 AI 初稿，可后续润色 |
| 数值平衡 | 低 | stats 为初步设定，需 P86+ 阶段调优 |

---

## 6. 与 PRD 的差异说明

无差异。所有实现严格按照 PRD 和 on-ramp contract 执行。

---

## 7. 后续阶段接口（给 P86+）

P85 已设置以下 flag，可作为后续阶段的前置条件：

| Flag | 含义 |
|------|------|
| `medical_on_ramp_done` | on-ramp 阶段完成（共享检查点） |
| `tavern_medical_on_ramp_compassionate` | 仁心医者 variant 完成 on-ramp |
| `tavern_medical_on_ramp_pragmatic` | 世故人医 variant 完成 on-ramp |

**建议后续压力点方向**：
- Compassionate：身体垮掉 / 药材告急 / 被人利用善心
- Pragmatic：人情债 / 选边站 / 名声与利益的冲突

---

## 8. 结论

P85 medical_sage_healer on-ramp spine 全部 8 个 user stories 已完成。实现了从 P84 bridge 到 on-ramp 的完整过渡，包含 2 个 variant 的事件配置和 4 个表达面的更新。窄回归测试全部通过。

**可以进入 A1-verify 阶段。**
