# P38 Recurring Setback Causality Wiring — Before/After

**Date:** 2026-06-24  
**Story:** P38-002  
**Audit reference:** `docs/test-reports/p38-opaque-setback-root-cause-audit.md`

---

## setback_injury

| | Text |
| --- | --- |
| **Before** | 在一次练功中，你不慎受伤。疼痛让你意识到江湖险恶，需要更加小心谨慎。 |
| **After** | 在一次练功中，因用力过猛导致你不慎受伤。暂停调息后还有恢复之机，疼痛也让你意识到江湖险恶，需要更加小心谨慎。 |
| **Expected classification** | `explained` (`导致`) |

---

## setback_property_loss

| | Text |
| --- | --- |
| **Before** | 遭遇盗匪或经营失败，你损失了部分财产。江湖上的风险总是防不胜防。 |
| **After** | 由于遭遇盗匪，你损失了部分积蓄；此事导致你短期内手头紧拙，但慢慢经营还有机会补回。江湖上的风险总是防不胜防。 |
| **Expected classification** | `explained` (`由于`, `导致`) |

---

## love_secret_help

| | Text |
| --- | --- |
| **Before** | 你在暗处协助明月度过危机，未曾留下姓名。 |
| **After** | 你在暗处协助明月脱身，未曾留下姓名。由于先前流言误会，你宁愿暗中出手也不欲再惹是非。 |
| **Expected classification** | Non-setback (no negative trigger) or `explained` if reclassified |

**Note:** Baseline false-positive from `危机` keyword on a positive love-line event. After fix, text no longer matches negative trigger regex.

---

## Files changed

- `src/data/lines/setback-events.json` — `setback_injury`, `setback_property_loss`
- `src/data/lines/love.json` — `love_secret_help`
