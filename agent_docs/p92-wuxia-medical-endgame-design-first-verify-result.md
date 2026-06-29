## Verification Result
status: NEEDS_FIX

## Summary
P92 medical endgame design-first 阶段整体完成度高，7/7 故事内容均已产出，设计质量扎实，无 runtime 代码改动，scope 控制良好。核心问题是 **US-005 endgame contract 文档路径不符合 PRD 要求**（应在 `docs/PRD/` 下，实际在 `docs/test-reports/` 下），与 P80/P90 等先例不一致。另有 1 处 minor 编号不一致。

## Fix Prompts (ordered)

### FIX-001 [required]
**问题：** US-005 endgame contract 文档路径错误。
PRD US-005 明确要求合同写入 `docs/PRD/p92-medical-endgame-contract.md`，但实际文件在 `docs/test-reports/p92-medical-endgame-contract.md`。
参考先例：P80 renown endgame contract 在 `docs/PRD/p80-renown-endgame-contract.md`，P90 medical late-life contract 在 `docs/PRD/p90-medical-late-life-contract.md`。

**修复提示词：**
将 `docs/test-reports/p92-medical-endgame-contract.md` 移动到 `docs/PRD/p92-medical-endgame-contract.md`，确保与 PRD US-005 的验收标准一致，并与 P80/P90 等 design-first 阶段的 contract 文件放置惯例保持一致。同时更新 closure report 中对 contract 文件路径的引用。

### FIX-002 [optional]
**问题：** US-006 validation shape 文档中的回归测试阶段编号与 PRD 不一致。
PRD US-006 要求 "P83/P84/P85/P87/P89/P91 既有 evidence 不退化的验证边界"，但 `docs/test-reports/p92-p93-validation-shape.md` 中写的是 P85/P86/P88/P90/P91。
这只是编号表述差异（P83=bridge, P84=entry, P85=on-ramp... vs P85/P86/P88/P90...），不影响实质内容，但建议统一。

**修复提示词：**
核对 `docs/test-reports/p92-p93-validation-shape.md` 中的 no-regression 边界阶段列表，与 PRD US-006 第 119 行的 "P83/P84/P85/P87/P89/P91" 保持一致。如果使用的是不同的编号体系（如 P85=bridge 而非 P83），请在文档中说明编号映射，避免 P93 实施阶段混淆。
