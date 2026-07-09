# P130 Ordinary-Origin Parallel-Sample Defer Rationale

**Date:** 2026-07-09  
**Branch:** `codex/p130-wuxia-visible-growth-three-sample-wave-closure-reconciliation`  
**Story:** P130-004  
**Verdict:** **`farm_peasant` and `town_apprentice` parallel ordinary visible-growth samples remain DEFERRED**

---

## 1. Context

P122 closed visible growth on `merchant_house` / `businessHabit` (vivid). P127 closed the martial branch on `martial_family` / `trainingHabit` (vivid). P129 closed one ordinary sample on `tavern_hand` / `socialMomentum`. P130 formally closes the three-sample wave.

**P130 does NOT imply farm_peasant or town_apprentice implementation.** Future Discovery must not assume P130 closure requires or schedules a multi-origin ordinary batch.

---

## 2. Why farm_peasant and town_apprentice Remain OUT OF SCOPE

### 2.1 P129 Non-Goals (explicit)

P129 PRD §4 Out of Scope list:

- `farm_peasant`、`town_apprentice` 平行样板
- Wave 4 全量 expansion
- 跨出身模板抽象

P129 was scoped as a **single ordinary sample** (`tavern_hand` only), not a second/third ordinary batch. Farm and apprentice were excluded at design time, not deferred by accident.

### 2.2 Habit axis directness comparison (P129 §3.1)

| Origin | Best habit axis | Directness | Early echo hooks | Continuation assets | Sample fit |
| --- | --- | --- | --- | --- | --- |
| **farm_peasant** | unclear single axis | **Mixed** (constitution/labor bias) | No dedicated p9 echo pair | P60 design-first only | **Poor** |
| **town_apprentice** | businessHabit possible | **Moderate** (craft→trade) | business hooks exist but merchant-adjacent | P58 merchant bridge | **Moderate** |
| **tavern_hand** (delivered) | socialMomentum | **Direct** | p9_echo_social_hook, p9_early_social_focus | P56/P59/P71 renown bridge | **Best** |

**farm_peasant:** No consolidated single habit axis with direct action→echo→shaping chain. Proof would require inventing or retrofitting a habit axis — high cost, low clarity, risks scope creep into Wave 4 farm content.

**town_apprentice:** `businessHabit` axis exists but is **merchant-adjacent**. A second ordinary sample on businessHabit adds little beyond what P122 already proved on vivid `merchant_house`. Player-facing differentiation is weak; proof value is marginal.

### 2.3 Cost vs proof value after three-sample closure

| Factor | Assessment |
| --- | --- |
| Cross-tier reusability already proven? | **Yes** — vivid×2 + ordinary×1 with distinct habit axes |
| New systems required? | No — but farm needs axis definition; apprentice duplicates merchant pattern |
| Player-facing differentiation? | **Low** for apprentice (merchant-adjacent); **Unclear** for farm |
| Risk of scope creep? | **High** — parallel batch invites multi-origin engineering and「统一模板」 |

P127 §14: after sufficient samples, stop visible-growth expansion and转向 higher-priority backlog. **Three samples are sufficient.**

### 2.4 P128 §3.2 drift context

P128 listed ordinary early visible growth as OPEN. P129 closed single-sample scope. P130 corrects the record:

- Early visible growth on ordinary origins: **Met** (tavern_hand single sample)
- Parallel farm/apprentice expansion: **Defer** (this document)
- Wave 4 ordinary-origin **expansion** (midlife opportunity structure): **OPEN** at product level — distinct from early visible growth samples

---

## 3. Optional Preconditions for a Future Second Ordinary Sample Stage

**Not commitments.** Discovery may spawn a future stage only if **all** relevant preconditions are met:

| Precondition | farm_peasant | town_apprentice |
| --- | --- | --- |
| Dedicated direct habit axis identified with p9 echo pair | Required — currently **missing** | Partial — businessHabit exists but merchant-adjacent |
| Continuation assets beyond design-first docs | Required — P60 design-first only today | Moderate — P58 merchant bridge |
| Proof value beyond three-sample closure | Must demonstrate **new** category (not duplicate P122/P129) | Must show ordinary-specific differentiation vs merchant_house |
| Product priority exceeds Wave 2–4 backlog items | Discovery decision | Discovery decision |
| No「统一成长模板」engineering scope | Required for any future sample | Required |

**Default recommendation:** Do **not** spawn farm/apprentice parallel visible-growth samples unless product explicitly prioritizes Wave 4 ordinary **expansion** (midlife depth) over Wave 2 pinnacle or Wave 1 mainstream gaps — and even then, early visible growth samples are not the highest-leverage entry point.

---

## 4. Explicit Non-Implications

| Statement | True? |
| --- | --- |
| P130 closed visible-growth wave → must implement farm next | **No** |
| P129 tavern_hand → implies 3/3 ordinary origins need samples | **No** — single sample proves ordinary tier |
| Defer = forgotten | **No** — preconditions documented above for future Discovery |
| Scholar third sample implied | **No** — defer per P128-004 |

---

## 5. Related Artifacts

| Artifact | Role |
| --- | --- |
| `p130-visible-growth-three-sample-reconciliation.md` §7 | Defer queue ledger |
| `p128-scholar-visible-growth-defer-rationale.md` | Scholar parallel defer (unchanged) |
| `docs/PRD/p129-wuxia-ordinary-origin-early-visible-growth-sample.md` §3.1 | Origin selection rationale |

**P130-004 complete. Farm and apprentice parallel samples explicitly deferred with preconditions for future Discovery.**
