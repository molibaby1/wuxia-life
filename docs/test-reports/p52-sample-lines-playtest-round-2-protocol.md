# P52 Sample Lines Playtest Round 2 — Protocol

> **Stage:** P52 cross-tester validation  
> **Date:** 2026-06-26  
> **Derived from:** `docs/test-reports/p49-sample-lines-playtest-round-1.md`, P46 §10.2  
> **Purpose:** Repeatable second-round human evidence without conversational drift

## 1. Tester constraints

- **Second tester only** — must not be the round-1 maintainer session author.
- **May read:** this protocol, P46 §10.2 shared口径, fixed seed/persona table below.
- **Must not read before completing checklist:** `docs/test-reports/p49-sample-lines-playtest-round-1.md` conclusions, round-1 verdict, or cross-tester summaries.
- **Evidence base:** run or review `docs/test-reports/p49-sample-lines-replay-latest.md` **after** P51 RW-05 replay refresh (804 merchant goal must show 商路经营表达 at age 25+).

## 2. Session setup (same as round 1)

| Line | Seed | Persona | Route track | Sample ID |
| --- | --- | --- | --- | --- |
| 正派武道 | 301 | 顾清和 | sect | golden-sect |
| 邪路偏锋 | 303 | 沈夜 | demonic | golden-demonic |
| 商路崛起 | 804 | 沈聚财 | wealth | p8-wealth-shen |

Method: fixed-seed replay to age 40 + life-memory / main-screen expression review against P46 §10.2 five human-evidence items.

## 3. Recording template (per line)

For each of the three lines, record:

### 3.1 P46 §10.2 checklist

| # | Question | Label | Notes (prose required for warning/fail) |
| --- | --- | --- | --- |
| 1 | 知道当前追求什么 | pass / warning / fail | Age 25+ currentGoal readable? Line-appropriate? |
| 2 | 感到选择有代价 | pass / warning / fail | Cost / debt / isolation signal visible? |
| 3 | 记得一个关键转折 | pass / warning / fail | Name one spine milestone (trial, transgression, first shop, etc.) |
| 4 | 愿意继续到下一阶段 | pass / warning / fail | Would you keep playing past current phase? Why? |
| 5 | 愿意重开另一条线 | pass / warning / fail | Distinct from other two lines? Would replay another seed? |

### 3.2 Cross-line retell (checklist §6)

- **Prompt:** 30 秒内各用一句话复述三线差异。
- Record one-line retell per line + **Distinguishable?** (yes / partial / no).

### 3.3 Required prose fields

Each line section must include explicit answers to:

1. **复述 (retell)** — one sentence summary of this life's direction at age 40.
2. **继续意愿 (continue intent)** — yes / maybe / no + 1–2 sentences why.
3. **重开意愿 (replay intent)** — yes / maybe / no + whether another sample line feels worth trying.
4. **关键转折记忆 (key turning point)** — one remembered event or flag milestone with age if known.

## 4. Pass / warning / fail bar

| Level | Per-line rule | Round-level rule |
| --- | --- | --- |
| **pass** | ≥4/5 §10.2 items pass; retell distinguishable from other lines | All three lines pass or warning-only; no fail on core identity/readability |
| **warning** | 3/5 pass OR one item fail but line still readable; retell partial | At least one line warning; document prose attribution (not score-only) |
| **fail** | ≤2/5 pass OR currentGoal/identity unreadable OR line indistinguishable from another | Any line fail on items 1 or 5 → round fail for that line |

**Warning prose rule:** Every **warning** must include a short explanation (e.g. “gray mission branch not hit on this seed” — not merely “3/5”).

**Non-blocking rule:** Single-tester preference (wording taste, pacing) → **warning** or monitor-only, not product blocker (P52 FR-5).

## 5. Comparison dimensions vs round 1

After round 2 is archived separately, maintainer compares:

| Dimension | What to compare |
| --- | --- |
| 可复述性 (retell clarity) | One-line retell quality; 30s cross-line distinction |
| 代价感知 (cost perception) | §10.2 item 2 pass/warning/fail + cost label readability |
| 继续意愿 (continue intent) | §10.2 item 4 + explicit continue prose |
| 重开意愿 (replay intent) | §10.2 item 5 + cross-line differentiation |

Record **agreement** (same label), **soft divergence** (pass vs warning both readable), or **hard divergence** (pass vs fail on same item) — analysis belongs in `p52-cross-tester-playtest-comparison.md`, not in round-2 raw file.

## 6. Archive target

Raw evidence only → `docs/test-reports/p49-sample-lines-playtest-round-2.md`

Do **not** embed cross-tester conclusions or round-1 quotes in the round-2 raw file.

## 7. Out of scope

- No gameplay or content changes during playtest execution.
- No new seeds or fourth sample line.
- No mandatory full `gate:playability` run as part of this protocol (see P52 guard contract for automation).
