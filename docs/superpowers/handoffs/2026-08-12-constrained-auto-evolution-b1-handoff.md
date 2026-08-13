# 自动进化系统 B1 交接记录

> 更新时间：2026-08-12
>
> 这是跨会话交接记录，不是新的产品规范，也不替代 `docs/governance/` 权威文档。

## 1. 当前结论

```text
B0                 accepted / closed
B1.0               accepted / closed
B1.1               未开始，等待新的明确授权
正式配置发布       未授权
自动合入/自动发布   未授权
```

B1.0 的 `accepted` 只证明 Headless candidate catalog 注入边界真实接通、可复现且隔离；不表示接受任何具体 weight 候选。

## 2. 唯一 B1.0 依据

```text
.tmp/b1/b1-review-20260812-4/
```

关键文件：

```text
manifest.json
base-catalog.json
overlay.json
raw-traces/baseline.json
raw-traces/candidate.json
player-visible-traces/baseline.json
player-visible-traces/candidate.json
metrics/baseline.json
metrics/candidate.json
evidence-index.json
human-decision.json
run-summary.json
```

人工裁决：

```json
{
  "decision": "accepted",
  "runId": "b1-review-20260812-4",
  "decisionHash": "d62a2f529c6db02804c06743b722e33e0866602f8eda52c03cafb2fd26ab87e2"
}
```

关键 hash：

```text
chainOk              = true
sourceFingerprintHash = 03c6e31ba06dc197c3263dec1e73898c94e30ecae2222afd2d4550218be93e0e
baseCatalogHash       = 380bcf8379772ef825177bcd5a2b81e4e0011b49cbfb8901ecca7fe00cb04294
overlayHash           = 8dd3b19579cbde7a44fd9a385fbe9018b71d12ef75bf25da00884e5160c263b7
decisionHash          = d62a2f529c6db02804c06743b722e33e0866602f8eda52c03cafb2fd26ab87e2
```

## 3. B1.0 验证结论

- baseline 与 candidate 使用相同 persona、seed、endAge 和 source fingerprint。
- Headless engine、runner history、事件分类和指标使用同一个注入 catalog。
- candidate 使用不可变 weight overlay，不修改正式 `src/data/**`。
- 默认 catalog parity 通过，candidate 能在专项测试中真实改变 Headless 选择分布。
- 重复运行的 raw trace、player-visible trace、metrics 和 canonical final-state hash 可复现。
- overlay 只允许顶层 `weight` 变化，最多 8 个 patch，倍率 `0.8x～1.2x`，最小 weight 为 1。
- critical、mandatory、mainline 事件会被阻断。
- artifact 不可覆盖，证据 hash 可校验，visible trace 不泄露 hidden state、identity、seed 或 arm。
- 没有修改 Snapshot、Contract、Schema、正式 gate、Local/API/Browser 入口或正式事件目录。

本次 review overlay 只是边界探针：

```text
toddler_exploration: weight 80 → 96
```

该候选没有被接受，也没有写回正式配置。

## 4. 已修复的阻断

旧 artifact `b1-review-20260812-3` 曾因完整 Headless 测试失败而被标记为 `blocked`：

```text
expected sect_choice, got youth_road_peril
```

根因是测试 fixture 同时满足 `sect_choice` 与 `youth_road_peril`，两者都是 priority=1 storyline；测试使用未固定的系统随机源，却直接断言返回 `sect_choice`。

最小修复是让 `tests/headless/playerVisibleFeedback.test.ts` 通过依赖注入使用固定 `SeededRandomSource(1)`。没有修改正式事件条件、priority、weight 或调度规则。随后生成了不可覆盖的 `b1-review-20260812-4`。

## 5. 已通过的验证

```text
npm run test:headless
npm run test:headless:parity
npm run test:contracts
npm run typecheck
git diff --check
```

B1 专项：

```text
npm exec -- tsx tests/b1/runtimeEventCatalog.test.ts
npm exec -- tsx tests/b1/headlessCatalogParity.test.ts
npm exec -- tsx tests/b1/headlessCandidateScheduling.test.ts
npm exec -- tsx tests/b1/weightOverlayScope.test.ts
npm exec -- tsx tests/b1/b1ArtifactIsolation.test.ts
```

decision seal 复核确认：

```text
human-decision.decisionHash == stableJsonHash(去除 decisionHash 后的内容)
evidence-index.humanDecisionHash == human-decision.decisionHash
evidence-index.chainOk == true
```

## 6. 工作树与范围

当前分支 `dev`，HEAD `7605c63`。工作树 dirty/uncommitted；不得 reset、clean、覆盖或提交无关改动。没有执行 commit、stage、push、merge 或发布。

B1.0 相关 owner 文件包括：

```text
src/core/RuntimeEventCatalog.ts
src/core/EventLoaderRuntimeCatalog.ts
src/core/WeightOverlayRuntimeCatalog.ts
src/core/GameEngineIntegration.ts
src/headless/**（仅 catalog 注入链）
tests/headless/playerVisibleFeedback.test.ts
tests/b1/**
scripts/b1/**
```

## 7. 下一会话规则

新会话依次读取：

1. `docs/README.md`
2. `docs/governance/current-product-stage.md`
3. 本交接记录
4. `docs/superpowers/specs/2026-08-12-constrained-auto-evolution-b1-design.md`
5. `docs/superpowers/plans/2026-08-12-constrained-auto-evolution-b1.md`

然后只读检查 `git status --short --branch`、B1.0 artifact 的三个裁决文件，以及 source fingerprint 是否仍匹配 accepted manifest。

没有新的明确授权前，不得：

- 进入 B1.1；
- 生成或搜索新的 weight candidate；
- 把 `toddler_exploration` 写回正式配置；
- 自动合入、发布或启动下一轮循环；
- 把 B1.0 单 persona artifact 当作 B1.1 train/holdout 证据。

## 8. B1.1 进入前提

只有用户或新的阶段裁决明确授权后，才可开始 B1.1。必须重新建立独立 artifact，并使用结构化 proposal、确定性 scope controller、冻结的 baseline/train/holdout/adversarial、隔离的 mechanical/blind/red-team 审查和独立人工裁决。B1.1 的 `accepted` 也只接受 artifact，不等于正式发布。

## 9. 新会话开场提示词

```text
请先读取 docs/README.md、docs/governance/current-product-stage.md、
docs/superpowers/handoffs/2026-08-12-constrained-auto-evolution-b1-handoff.md、
docs/superpowers/specs/2026-08-12-constrained-auto-evolution-b1-design.md 和
docs/superpowers/plans/2026-08-12-constrained-auto-evolution-b1.md。

当前 B1.0 已人工 accepted，但 B1.1 尚未授权。请先只读核对当前工作树、
B1.0 artifact 和 source fingerprint，然后说明如果要开始 B1.1 需要我做出的
唯一授权，以及新的 B1.1 最小执行计划。不要修改正式事件配置，不要自动启动 B1.1。
```
