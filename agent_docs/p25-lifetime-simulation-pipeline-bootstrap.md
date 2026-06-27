# P25 Lifetime Simulation — Pipeline Bootstrap

## 启动命令

```text
/prd-pipeline-orchestrator --discovery docs/PRD/p25-wuxia-lifetime-simulation-experience.md:docs/PRD/p25-wuxia-lifetime-simulation-experience.prd.json
```

## 文档真值

| 文档 | 路径 | 角色 |
| --- | --- | --- |
| 起始 PRD（Wave 1 backlog） | `docs/PRD/p25-wuxia-lifetime-simulation-experience.md` | 产品真值 + Wave 1 Stories |
| 执行索引 | `docs/PRD/p25-wuxia-lifetime-simulation-experience.prd.json` | Ralph / Discovery 读写 |
| **最终目标（North Star）** | `docs/designs/p25-lifetime-simulation-north-star.md` | Discovery 对照基准 |
| 优化工作流 | `docs/designs/simulation-driven-optimization-workflow.md` | 每个 slice 分层约束 |

## 冻结决策（Wave 1 主流成就）

五条固定：**P16 三条** + **`jianghu_renown_sage`（江湖名宿）** + **`medical_sage_healer`（一代名医）**；巨贾行商推迟 Wave 3。详见 PRD §12 与 North Star §3.1。

## 预期流水线

```text
Wave 1: A2-ralph (US-001..008)
  → A1-verify → A2-fix (≤3轮)
  → A2-finalize
  → A1-discovery (--pipeline-auto)
       ├─ CLEAR → 一生模拟 North Star 完全达成
       ├─ NEEDS_STORIES → 自动追加 Wave 2+ Story → 再 ralph-run
       └─ BLOCKED → PRD Goals 需人工澄清后 --resume
```

Discovery 最多自动循环 **2 轮**（`max_discovery_rounds = 2`）。若仍 `NEEDS_STORIES`，pipeline 会 `PAUSED`，需人工审 gaps 后 `--resume` 或修订 PRD。

## Wave 路线图（Discovery 应自动追加的方向）

1. **Wave 1**（已在 prd.json）：主流成就 + 选择后果 + 一致性验收
2. **Wave 2**：稀有线 / 意外因素 + 巅峰成就运气门槛
3. **Wave 3**：混合成就（跨轨组合）
4. **Wave 4**：平凡出身与机会结构
5. **Wave 5+**：整局 pacing、重玩 polish（按 gaps）

## 会话必读（每个子代理）

1. `AGENTS.md`
2. `docs/designs/p25-lifetime-simulation-north-star.md`
3. `docs/designs/simulation-driven-optimization-workflow.md`
4. 当前 Wave 相关 `docs/test-reports/` baseline / before-after

## 成功信号

| 信号 | 含义 |
| --- | --- |
| `EXECUTION_COMPLETE` | 当前 prd.json 全部 Story 实施 + verify PASS |
| `DISCOVERY_CLEAR` | North Star §8 全部达成 |
| `BLOCKED` | 需扩 PRD scope 或澄清 Goals |

Generated: 2026-06-23.
