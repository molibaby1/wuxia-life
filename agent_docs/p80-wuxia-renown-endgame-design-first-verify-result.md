## Verification Result
status: PASS

## Summary
P80 design-first 阶段所有 7 个 user story 均通过验收。endgame contract 完整、GO/NO-GO 结论合理（CONDITIONAL_GO）、lightweight 约束明确、零运行时代码改动。发现少量可选的文档格式优化项，不影响核心交付质量。

## Fix Prompts (ordered)

### FIX-001 [optional] 修复 scope-contract.md 中 lightweight constraint 列表的引号格式问题
**文件：** `docs/test-reports/p80-renown-endgame-scope-contract.md`

**问题：** 第 4 节 Lightweight Constraint 列表中，第 3 项和第 6 项的引号未闭合/嵌套有误：
- 第 3 项：`Auto event (recommended) — not another choice point` 开头缺少左引号
- 第 6 项：`2+ endgame-specific signals — not just "more late-life"` 缺少右引号

**修复提示词：**
```
请修复 docs/test-reports/p80-renown-endgame-scope-contract.md 第 4 节 Lightweight Constraint 列表的引号格式：
1. 第 3 项开头加上左引号
2. 第 6 项结尾加上右引号
3. 确保所有列表项引号一致（左右都有）
4. 只改格式，不改内容
```

### FIX-002 [optional] 统一 closure report 中 deferred items 与 PRD non-goals 的表述一致性
**文件：** `docs/test-reports/p80-renown-endgame-closure-report.md`

**问题：** 第 5 节 Deferred Renown-Expansion Items 列表中有 10 项，而 PRD §3 Non-Goals 有 10 项，两边分类和表述略有差异（比如 PRD 说"不做第二条成就线（medical_sage_healer）"，但 deferred list 里没有明确对应项）。

**修复提示词：**
```
请对照 docs/PRD/p80-wuxia-renown-endgame-design-first.md §3 Non-Goals 的 10 项非目标，检查 docs/test-reports/p80-renown-endgame-closure-report.md 第 5 节 Deferred Renown-Expansion Items 是否完整覆盖。如果有遗漏（例如 medical_sage_healer 第二条成就线、巅峰/混合成就 Wave 2/3），补充到 deferred list 中并说明 rationale。保持现有格式，只补充遗漏项。
```

### FIX-003 [optional] 修复 branch-design.md 中 stat changes 表述的一致性
**文件：** `docs/test-reports/p80-renown-endgame-branch-design.md`

**问题：** 
- Branch A §3.4 写的是 "rep: 0"、"或者: 0"、"净变化最小"，表述模糊
- Branch B §4.4 和 Branch C §5.4 明确写了 0
- 但第 7 节 Stats 又明确说 "None — Endgame is about memory/jianghu memory, not stat changes."

**修复提示词：**
```
请统一 docs/test-reports/p80-renown-endgame-branch-design.md 中关于 stat changes 的表述：
1. Branch A §3.4 改为与 B、C 一致的格式（rep/con/cha 都是 0，净变化 0）
2. 移除 "或者: 0"、"净变化最小" 等模糊表述
3. 与第 7 节 Stats 的 "None" 结论保持一致
4. 只改表述一致性，不改设计结论
```
