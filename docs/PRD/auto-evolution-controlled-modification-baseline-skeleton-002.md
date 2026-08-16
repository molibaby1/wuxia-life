# Auto Evolution Controlled Modification Baseline Skeleton 002

> 状态：CLOSED / Human accepted
>
> 日期：2026-08-15
>
> 性质：探索型骨架实验历史证据；不授权重新执行、origin promotion 或下一 Skeleton。
>
> Authority：`docs/product/auto-evolution-model.md` + `docs/governance/current-product-stage.md` > 本 PRD > paired `prd.json` > Runtime inference

## 1. Objective

证明：

```text
Known Baseline B + Declared Modification M = Actual Runtime Source
```

不要解决长期 workspace framework，也不要进入自动 PRD 生成。

## 2. Baseline

以执行开始时 origin Wuxia-Life working tree 的实际 tracked + non-ignored untracked source bytes 为 baseline。

必须将 baseline manifest 与 exact-byte isolated-copy verification 保存到：

```text
.tmp/evolution/skeleton-002/evidence/
```

不得把 origin `HEAD` 当成当前 source baseline 的替代品。

不得在 origin 执行 commit / stash / reset / cleanup。

## 3. Isolated Workspace

创建：

```text
.tmp/evolution/skeleton-002/workspace/
```

复制 baseline source 后验证 exact match，再在 workspace 内初始化 synthetic Git repo 并 commit baseline。

该 synthetic commit 只服务于本实验的 source fingerprint；不得 push / merge / 回写 origin history。

允许在 commit 后创建 ignored `node_modules` symlink 指向 origin dependencies。

## 4. Only Declared Modification

仅在 isolated workspace 修改：

```text
src/data/lines/general.json
birth_wuxia_family.content.text
```

只追加：

```text
AE-SKELETON-002
```

origin 的 `src/data/lines/general.json` 必须始终不包含该 marker。

## 5. Exact Delta Rule

修改后、测试后、run 后，synthetic repo 的 non-ignored status 必须精确只有：

```text
 M src/data/lines/general.json
```

任何第二个 non-ignored source delta 都是 blocker。

## 6. Verification Before Run

在 isolated workspace：

```bash
npm run typecheck
npx tsx tests/evolution/runPhase0Tests.ts
```

必须全部 PASS。

## 7. One Authorized Phase 0 Run

只允许一次：

```text
runRef: ae-skeleton-002
persona: p8-martial-lin
seed: 802
endAge: 1
catalogVersion: 1.0.0
```

从 isolated workspace 执行，输出到 origin：

```text
.tmp/evolution/skeleton-002/phase0/
.tmp/evolution/skeleton-002/phase0-anchors/
```

若目标 run / anchor 已存在，STOP；不得删除后复用。

## 8. Required Runtime Evidence

必须验证：

- fingerprint `headSha` = synthetic baseline commit；
- fingerprint `worktreeEntries.length = 1`；
- 唯一 entry = `src/data/lines/general.json`, status=` M`；
- fingerprint target SHA-256 = isolated modified target actual SHA-256；
- baseline commit target 无 marker；working tree target marker 恰好一次；
- sealed catalog 的 `birth_wuxia_family.content.text` 含 marker；
- observable 中 `story_event` title=`降生武侠世家` body 含 marker；
- experiment root / anchor seal 正常；
- origin target 无 marker。

## 9. STOP Boundary

完成 evidence 后 STOP。

禁止：

- second Phase 0 run；
- feedback；
- hypothesis；
- investigation；
- candidate；
- promotion；
- external participant；
- 自动 PRD；
- origin Git cleanup；
- 长期 isolation framework。
