# P84 Medical Entry Differentiation Contract

> **Stage:** P84 — Medical Sage Entry Differentiation Refinement
> **Type:** Entry differentiation contract (tavern-born healer + 2 variants)
> **Pattern reference:** P72 Renown Entry Differentiation

## 1. Core Identity Signals (Tavern-Born Healer)

The medical route's entry layer must preserve these core identity signals. These distinguish "tavern-born healer" from generic "神医" (divine doctor).

### 1.1 Non-Negotiable Identity Anchors

| Signal | Description | Why It Matters |
|--------|-------------|----------------|
| **酒肆底色** | All medical entry expression must reference tavern context: 跑堂、酒肆、熟客、三教九流 | Prevents the route from feeling like a generic scholarly doctor |
| **自学出身** | Emphasize learning from observation, not formal apprenticeship: 耳濡目染、偷偷翻医书、听过的方子 | Distinguishes from 拜师名医 path in medical.json |
| **人情与医术交织** | Medical practice is woven with tavern-style social judgment: 看人下菜碟、熟客面子、人情往来 | Keeps the route's social/tavern character alive |
| **不是神医，是跑堂的会看病** | Humble, grounded tone — no "在世华佗" / "一代神医" language at entry | Entry should feel like the beginning, not the peak |

### 1.2 Forbidden Generic Phrases (Entry Layer)

These phrases may appear later (e.g., at payoff or ending), but MUST NOT appear at entry:
- ❌ "神医" (divine doctor) — use "小郎中" / "会看病的跑堂" / "镇上有名的大夫" instead
- ❌ "在世华佗" — too lofty for entry
- ❌ "一代名医" — achievement language, not entry language
- ❌ "妙手回春" — too dramatic for early practice

## 2. Variant Differentiation Contract

### 2.1 Compassionate Healer (仁心医者)

**Core flavor:** Driven by empathy, takes losses to help people, reputation built on goodwill.

| Dimension | Expression |
|-----------|------------|
| **Motivation** | 见不得人受苦 — can't stand to see people suffer |
| **Practice style** | 有钱没钱都给看 — treats regardless of ability to pay |
| **Cost** | 自己贴钱、身体累 — personal cost is financial/physical |
| **Reputation source** | 穷人念你的好 — reputation from poor people's gratitude |
| **Tavern anchor** | 酒肆的老客人都心疼你 — tavern regulars worry about you |

**Stats profile:** Higher chivalry, lower money, higher comprehension

### 2.2 Pragmatic Healer (世故人医)

**Core flavor:** Driven by practicality, reads people well, reputation built on effectiveness and social skill.

| Dimension | Expression |
|-----------|------------|
| **Motivation** | 看病也是生意 — medicine is also a business |
| **Practice style** | 看人下菜碟、大户多出、穷人少收 — tiered pricing, reads social context |
| **Cost** | 欠的人情多 — personal cost is social/reputational debt |
| **Reputation source** | 大户人家捧你、穷人也说公道 — reputation across classes |
| **Tavern anchor** | 酒肆练出来的眼力 — tavern-honed judgment of people |

**Stats profile:** Higher charisma, higher money, higher reputation

### 2.3 Variant Differentiation Map

| Surface | Compassionate | Pragmatic | Differentiated? |
|---------|---------------|-----------|-----------------|
| **Life memory** | "见不得人受苦，有钱没钱都给看" | "看病收钱，也看人下菜碟" | ✅ P83 — keep |
| **Current goal (ordinary origin)** | "酒肆后面辟出小药庐，有钱没钱都给看" | "酒肆后面辟出小药庐，看病也讲人情世故" | ✅ P84 — add |
| **Summary (ordinary origin)** | "仁心医者：靠自学在镇上行医，有钱没钱都给看" | "世故人医：靠眼力在镇上行医，看病也讲分寸" | ✅ P84 — add |
| **Sample-line cost label** | "仁心之累" | "世故之秤" | ✅ P84 — add |
| **Sample-line current goal** | "多救一个是一个，酒肆的小药庐挤不下了" | "名声银子都要挣，酒肆出来的大夫懂分寸" | ✅ P84 — add |
| **Route display name** | "仁心医者" | "世故人医" | ✅ P84 — add |

**Target: 6 differentiated expression surfaces at entry layer** (up from 1 currently)

## 3. Expression vs Light Markers

### 3.1 Expression Changes (Player-Visible Text)

These are text changes in existing expression surfaces. No new flags needed.

| Surface | File | Change Type |
|---------|------|-------------|
| Ordinary origin current goal | `ordinaryOriginExpression.ts` | Add variant branches for medical |
| Ordinary origin summary | `ordinaryOriginExpression.ts` | Add variant branches for medical |
| Sample-line detection | `sampleLineExpression.ts` | Add `'medical'` to SampleLineId + detectSampleLine |
| Sample-line cost label | `sampleLineExpression.ts` | Add medical entry branch with variants |
| Sample-line current goal | `sampleLineExpression.ts` | Add medical entry branch with variants |
| Route display names | `playerFacingLabels.ts` | Add medical display names |
| Route flag labels | `playerFacingLabels.ts` | Add medical flag labels |
| Long-term flag labels | `playerFacingLabels.ts` | Add tavern_medical_bridge_crossed |
| Route summary | `playerFacingLabels.ts` | Add medical route detection |
| Raw route key | `playerFacingLabels.ts` | Add medical route detection |

### 3.2 Light Markers (Flags, No New Events)

These use EXISTING flags only. No new flags or events are added.

| Marker | Flag Used | Purpose |
|--------|-----------|---------|
| Medical bridge crossed | `tavern_medical_bridge_crossed` | Sample-line detection trigger |
| Medical route committed | `route_medical_committed` | Route summary detection |
| Compassionate variant | `tavern_embrace_compassionate_healer` | Variant expression branching |
| Pragmatic variant | `tavern_embrace_pragmatic_healer` | Variant expression branching |
| Medical pure | `medical_pure` | Gate satisfaction (already exists) |
| Medical talent | `medical_talent` | Gate satisfaction (already exists) |

**No new flags.** P84 reuses P83 bridge flags entirely.

## 4. Shared Destination Skeleton (Intact)

P84 does NOT modify the shared destination skeleton:

| Skeleton Element | Status | Why |
|------------------|--------|-----|
| `medical_sage_healer` composite gate | ✅ Unchanged | Already works with P83 bridge flags |
| `medical.json` event pool | ✅ Unchanged | Short-chain events are separate from tavern-born spine |
| `sample-lines-spine.json` | ✅ Unchanged | No spine events in P84 scope |
| Ordinary origin midlife events | ✅ Unchanged | Bridge already complete (P83) |
| Life memory summary system | ✅ Unchanged | Entry differentiation doesn't touch summary infrastructure |

P84 only adds branches to EXISTING expression functions. The underlying systems remain intact.

## 5. Sample-Line Detection Contract

### 5.1 Medical as a Sample Line

The medical route joins the sample-line detection system at entry level. It follows the same pattern as renown (which also originates from tavern_hand).

### 5.2 Detection Priority

Medical detection should follow these rules:
1. If `tavern_medical_bridge_crossed` or `route_medical_committed` is set → return `'medical'`
2. Medical takes priority over generic merchant/orthodox/demonic for tavern_hand origins
3. Medical does NOT override explicit sect faction or childhood seeds from other origins

### 5.3 Placement in detectSampleLine()

Medical detection should be placed:
- After renown check (tavern-born routes are related)
- Before the childhood seed checks (medical is more specific for tavern_hand)

## 6. Entry-Level Expression Contract

### 6.1 Sample-Line Cost Label (Entry)

Medical entry has a cost label, following the pattern of other sample lines:

| Variant | Cost Label | Meaning |
|---------|------------|---------|
| Compassionate | 仁心之累 | The cost of being a compassionate healer |
| Pragmatic | 世故之秤 | The balancing act of pragmatic medicine |

Both are distinct from:
- 守正代价 (orthodox)
- 邪路代价 (demonic)
- 商路债务 / 巨贾负担 (merchant)
- 江湖声名之累 / 人情债渐重 (renown)

### 6.2 Sample-Line Current Goal (Entry)

Both variants have entry-level current goals in the sample-line system:

- **Compassionate:** Focus on helping people, the small pharmacy getting busier
- **Pragmatic:** Focus on building reputation and livelihood, tavern-honed people skills

### 6.3 Route Summary

`getPlayerRouteSummary()` should return:
- **Name:** "医者之路" (medical route) or variant-specific names
- **Phase:** "路线进行中" (same pattern as other routes)

## 7. Validation Contract

The entry differentiation contract is satisfied when:

1. `detectSampleLine()` returns `'medical'` for both variants
2. `deriveSampleLineCostLabel()` returns distinct text for compassionate vs pragmatic
3. `deriveSampleLineCurrentGoal()` returns distinct text for compassionate vs pragmatic
4. `getPlayerRouteSummary()` recognizes medical route
5. `tavernCurrentGoal()` has variant-specific text for medical
6. `deriveOrdinaryOriginSummary()` has variant-specific text for medical
7. All text carries tavern-born healer flavor (no generic "神医")
8. P83 bridge tests still pass (no regression)

---

*Contract locked. Next: P84-004 Wire Entry-Level Differentiation.*
