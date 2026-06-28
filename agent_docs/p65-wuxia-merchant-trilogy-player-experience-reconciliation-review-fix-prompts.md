# P65 Review Fix Prompts

&gt; **Date:** 2026-06-28
&gt; **Stage:** P65 Wuxia Merchant Trilogy Player Experience Reconciliation
&gt; **Status:** NEEDS_FIX

---

## 修复说明

P65 的文档产出质量良好，8 个 user stories 的核心内容都已完成。唯一需要修复的是 P65-001 commit 中混入了与 P65 范围无关的 headless 代码重构改动。

---

### FIX-001 [required] 清理 P65-001 commit 中混入的无关代码改动

**优先级：** High

**问题：** P65-001 commit (771664f) 包含了 5 个与 P65 范围无关的 headless 代码改动，违反了 scope contract 中"默认零运行时改动"的约定。

**涉及文件：**
- `src/headless/parity/routeTrackFixtures.ts`
- `src/headless/playability/adaptToGameProcessReport.ts`
- `src/headless/playability/createPersonaSession.ts`
- `src/headless/playability/headlessPersonaRunner.ts`
- `src/headless/progressionLoop.ts`

**修复步骤：**

1. **确认改动来源** — 检查这些 headless 代码改动是有意为之还是意外混入。从 commit message "P65-001: Add merchant trilogy player route audit" 和 "No runtime behavior changes" 来看，应该是意外混入。

2. **清理方案（二选一）：**

   **方案 A：revert 整个 commit，重新提交只含文档的版本**
   ```
   git revert 771664f --no-commit
   # 然后手动恢复 p65-merchant-trilogy-player-route-audit.md
   git checkout HEAD -- docs/test-reports/p65-merchant-trilogy-player-route-audit.md
   git commit -m "P65-001: Add merchant trilogy player route audit (docs only)"
   ```

   **方案 B：从 commit 中移除代码文件，保留文档**
   - 使用 interactive rebase 编辑 771664f commit
   - 将 5 个 src/ 文件的改动 revert 掉
   - 只保留 docs/test-reports/p65-merchant-trilogy-player-route-audit.md

3. **验证清理结果：**
   - 运行 `git diff <base>..HEAD --stat` 确认只有文档文件改动
   - 运行 `npm run typecheck` 确认类型检查通过
   - 运行 P58/P59/P61/P50 测试确认通过

4. **如果这些改动是有意的：**
   - 说明为什么它们属于 P65 的理由
   - 更新 scope contract 和 closure report 反映实际改动
   - 否则将它们移动到正确的分支/阶段

**验收标准：**
- P65 分支只有文档改动，没有 src/ 目录下的运行时代码改动
- 所有相关测试通过
- scope contract 与实际改动一致

---

### FIX-002 [optional] closure report 中 runtime changes 描述一致性

**优先级：** Low

**问题：** closure report §2.2 Runtime Changes 写了"None — P65 is documentation-only; zero runtime behavior changes"，但 P65-001 commit 实际上有代码改动。

**修复：**
- 如果 FIX-001 清理了代码改动，这条自动一致，无需额外修复
- 如果代码改动被保留，需要更新 closure report 如实反映实际改动

---

## 修复后验收

修复完成后，重新运行以下检查：

1. `git diff 733b956..HEAD --stat` — 确认只有文档文件
2. `npm run typecheck` — 通过
3. `npx tsx tests/p58ApprenticeBridgeTests.ts` — 通过
4. `npx tsx tests/p59TavernHandBridgeTests.ts` — 通过
5. `npx tsx tests/p61FarmPeasantBridgeTests.ts` — 通过
6. `npx tsx tests/p50SampleLineExpressionTests.ts` — 通过

全部通过后，P65 验收状态可更新为 PASS。
