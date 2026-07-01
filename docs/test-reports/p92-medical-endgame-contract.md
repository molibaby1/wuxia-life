# P92 Medical Endgame Contract

> **Purpose:** Design-first contract for the `medical_sage_healer` endgame / final legacy stage — 6 variants based on late-life branch (2 variants × 3 choices), auto echo event at age 60+
> **Source of truth:** This contract defines what P93 (implementation) must deliver.
> **Status:** LOCKED — P92 design-first complete
> **Verdict:** CONDITIONAL_GO — lightweight only
> **Variants:** Compassionate (仁心医者) + Pragmatic (世故人医)

---

## 1. Core Direction

**Selected:** Single auto echo event with 6 variants — Medical Legacy Echo (医名身后事)

**Core narrative question:** 世人如何记住这位医者？

**Two fundamentally different legacy axes:**
- **Compassionate (薪火相传):** Spiritual/healing legacy — 你的仁心，传下去了吗？
- **Pragmatic (医名远播):** Social/medical reputation legacy — 你的医名，流传下来了吗？

**Why auto (not choice):**
- Endgame is an echo, not a new decision point
- Player made all their choices at payoff and late-life; endgame is the final consequence
- Feels like "世人怎么说你这位医者" — it happens to your legacy, not something you choose
- Consistent with lightweight constraint

**Why 6 variants:**
- Leverages the 6-branch / 2-variant structure from late-life
- Each branch delivers on the "medical legacy" promised by late-life identity
- Meaningful differentiation — not reskinned
- Still lightweight (1 event, 6 variants)

**Distinction from late-life:**
- Late-life = first-person: 你晚年怎么做医者
- Endgame = third-person: 世人怎么记住这位医者
- Late-life is an active life stage; endgame is a coda / echo

**Distinction from renown endgame:**
- Renown endgame = 1 variant × 3 choices, jianghu reputation only
- Medical endgame = 2 variants × 3 choices, healing legacy + medical reputation
- Renown = networker's reputation; Medical = healer's legacy
- 2 axes vs 1 axis — fundamentally richer

**Distinction from generic P19 endgame:**
- P19 = comprehensive end-of-life system (relationships + factions + legacy + memory)
- Medical endgame = route-specific thematic coda (healing legacy / medical reputation only)
- P19 = end of life / death; Medical endgame = 60-65 echo event, before final death

---

## 2. Endgame Event Spec

### Event ID
`medical_endgame_echo`

### Type
`auto`（自动触发，echo event）

### Age Range
60–65 岁 (推荐 62±3)

### Trigger
`age_reach` at age 60

### Trigger Conditions
1. `flags.has('medical_late_life_done')` — late-life 已完成
2. `!flags.has('medical_endgame_echo_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. `flags.has('tavern_medical_bridge_crossed')` — 隐含保证 tavern_hand origin + medical route

### Upstream Gate
`medical_late_life_done`

### Branching Logic
Branching is based on which late-life branch marker is set:

**Compassionate (薪火相传):**
- `tavern_medical_late_compassionate_final` → Comp-A (仁心不灭·烬 / Ember of Compassion)
- `tavern_medical_late_compassionate_peaceful` → Comp-B (医者从容·淡 / Quiet Healer's Peace)
- `tavern_medical_late_compassionate_legacy` → Comp-C (仁心满天下·传 / Legacy of Compassion)

**Pragmatic (医名远播):**
- `tavern_medical_late_pragmatic_fallen` → Prag-A (医名犹存·寂 / Medical Name Remains)
- `tavern_medical_late_pragmatic_wanderer` → Prag-B (江湖游医·遥 / Wandering Healer Legend)
- `tavern_medical_late_pragmatic_master` → Prag-C (一代宗师·名 / Grand Master's Fame)

**Exactly one of these six will be set** (guaranteed by late-life events).

### Checkpoint Flag
`medical_endgame_echo_done` — 通用 checkpoint，标记 endgame 已发生

### Endgame Identity Flag
`medical_endgame_identity_done` — endgame 身份深化

### Branch-Specific Identity Markers
六选一设置：

**Compassionate:**
- `tavern_medical_endgame_compassionate_ember`（Comp-A：仁心不灭·烬）
- `tavern_medical_endgame_compassionate_peace`（Comp-B：医者从容·淡）
- `tavern_medical_endgame_compassionate_legacy`（Comp-C：仁心满天下·传）

**Pragmatic:**
- `tavern_medical_endgame_pragmatic_fame_remain`（Prag-A：医名犹存·寂）
- `tavern_medical_endgame_pragmatic_wanderer_legend`（Prag-B：江湖游医·遥）
- `tavern_medical_endgame_pragmatic_grand_master`（Prag-C：一代宗师·名）

### Stats
**None.** Endgame is about memory / legacy, not stat changes.

Rationale:
- Endgame is a coda, not a power-up
- Stat changes would feel like "more late-life" rather than a distinct endgame
- Lightweight constraint — keep it minimal

---

## 3. Six Variant Details

### 3.1 Compassionate Variant — 薪火相传 (Spiritual/Healing Legacy)

**Core question:** 你的仁心，传下去了吗？

---

#### Variant Comp-A — 仁心不灭·烬 (Ember of Compassion)

**Late-life root:** 最后仁心 (Burnout — 燃尽自己)
**Core theme:** 仁薪尽传，火种不灭
**Tone:** Bittersweet-tragic but warm — 燃尽了，但火种不灭

**Narrative beat:**
- 某个冬日，你坐在药庐门口晒太阳，越来越觉得累
- 恍惚间，你想起小时候在酒肆帮着熬药的日子，老掌柜说"这孩子心善"
- 这些年，你救过多少人？数不清了。有富人，有穷人，有好人，有坏人——你都救了
- 你不知道的是，你救过的那些人，有的成了好大夫，有的一辈子记着你的恩情
- 仁心像火种——你这盏灯快灭了，但别处的灯，还亮着
- 老掌柜若还在，大概会摸着你的头说："傻孩子，值了。"

**Expression updates:**
- Cost label: `仁心不灭·烬`
- Current goal: `仁薪尽传，此生无憾`
- Identity: `燃尽自己的点灯人`
- Life memory: `救过的人还在 + 仁心传了下去 + 灯熄了，别处还亮着`
- Summary: `一代名医 + 仁心不灭 + 薪火相传`

**Tavern-born anchors:** 酒肆熬药的味道、老掌柜的"傻孩子"、苦孩子出身、一盏灯的比喻

---

#### Variant Comp-B — 医者从容·淡 (Quiet Healer's Peace)

**Late-life root:** 从容自在 (Peaceful — 颐养天年)
**Core theme:** 从容淡然，润物细无声
**Tone:** Peaceful-content — 平淡从容，润物细无声

**Narrative beat:**
- 你常常搬个小凳子坐在门口晒太阳，像当年在酒肆门口看街景一样
- 偶尔还有老病人找上门来，你随手就给看了——不收钱，就当聊聊天
- 有人说"李大夫你真好"，你只笑笑——好什么呀，就是顺手的事
- 年轻时候总觉得"我不救谁救"，硬扛了半辈子，现在想通了
- 老掌柜若还在，大概会拍你肩膀说："臭小子，终于想通了？"
- 你也笑——是啊，早该这样了

**Expression updates:**
- Cost label: `医者从容·淡`
- Current goal: `晒晒太阳看看病，从容了此一生`
- Identity: `从容淡然的老医者`
- Life memory: `老病人还找上门 + 随手看病不收钱 + 这辈子值了`
- Summary: `仁心医者 + 从容淡然 + 润物细无声`

**Tavern-born anchors:** 晒太阳看街景、老掌柜的"想通了"、街坊邻里、随手看病不收钱

---

#### Variant Comp-C — 仁心满天下·传 (Legacy of Compassion)

**Late-life root:** 仁心传承 (Legacy — 桃李满天下)
**Core theme:** 仁心传承，薪火满天下
**Tone:** Warm-satisfied — 传承了，传下去了，而且传得好

**Narrative beat:**
- 逢年过节，徒弟们带着徒孙们来看你，热热闹闹一院子
- 大徒弟在江南开了药庐，二徒弟在塞外救牧民，三徒弟进宫做了太医……个个都像你
- 你坐在中间，看着这些年轻的面孔，像看着年轻时候的自己——一样的仁心，一样的热血
- 有人说"老恩师您是一代宗师"，你只摆摆手——"什么宗师不宗师的，救人而已"
- 老掌柜若还在，大概会捋着胡子笑——当年酒肆里熬药的苦孩子，现在桃李满天下了
- 你想想也是——从酒肆里的苦孩子，到满天下的仁医，这辈子，值了

**Expression updates:**
- Cost label: `仁心满天下·传`
- Current goal: `看着仁心一辈辈传下去，这就够了`
- Identity: `桃李满天下的仁医宗师`
- Life memory: `徒弟们散在各地 + 个个仁心仁术 + 仁心传了一辈又一辈`
- Summary: `一代名医 + 仁心传承 + 薪火满天下`

**Tavern-born anchors:** 徒弟们像当年的小帮工、老掌柜的欣慰、从苦孩子到宗师、仁心的传承

---

### 3.2 Pragmatic Variant — 医名远播 (Social/Medical Legacy)

**Core question:** 你的医名，流传下来了吗？

---

#### Variant Prag-A — 医名犹存·寂 (Medical Name Remains)

**Late-life root:** 人走茶凉 (Fallen — 失势跌落)
**Core theme:** 权势如烟，医名长久
**Tone:** Nostalgic-complex — 势倒了，但医名还在；冷中有暖

**Narrative beat:**
- 门前冷落鞍马稀。以前送礼的人能排半条街，现在连个问安的都没有
- 你倒是看得开——这辈子什么场面没见过？从酒肆里看人脸色，到太医院里给人脸色，再到现在门可罗雀，起起落落，不就是人生吗
- 只是有时候，你会翻翻自己写的医书，勾勾改改——这些东西，传下去就好
- 你不知道的是，太医院里的年轻太医还在看你的书，江湖上的游医还在用你的方
- 权势如烟云，说散就散了。但医名不一样——它比权势长久
- 老掌柜若还在，大概会叹口气——"爬那么高干什么呢？摔下来疼啊。" 但转头又会说："可你写的那些药方，管用！"

**Expression updates:**
- Cost label: `医名犹存·寂`
- Current goal: `权势如烟云，医名自长久`
- Identity: `失势但名存的老太医`
- Life memory: `门前冷落 + 医书药方还在传 + 医名比权势长久`
- Summary: `世故名医 + 医名犹存 + 失势不失名`

**Tavern-born anchors:** 从跑堂到御医的爬天梯、人走茶凉的势利眼、老掌柜的叹息、医书药方比权势长久

---

#### Variant Prag-B — 江湖游医·遥 (Wandering Healer Legend)

**Late-life root:** 逍遥自在 (Wanderer — 云游四方)
**Core theme:** 逍遥自在，医名远飘
**Tone:** Playful-mysterious — 传说真假参半，人逍遥

**Narrative beat:**
- 你还在路上。背着药箱，拄着拐杖，从一个村子走到另一个镇子
- 有人认出你，热情招待；没人认识，就自己找个破庙凑合一晚
- 你不在乎——这辈子什么场面没见过？从酒肆里听江湖故事，到自己成了江湖故事，够了
- 只是偶尔经过某个酒肆，会停下来喝一碗——听听这些年，江湖上把你传成了什么样
- 有人说你能活死人肉白骨，有人说你脾气古怪看人下菜碟，有人说你早就死在塞外了……你听着直乐
- 老掌柜若还在，大概会笑着骂你"这匹野马，到死都拴不住"。你也笑——人生在世，不就图个自在吗？

**Expression updates:**
- Cost label: `江湖游医·遥`
- Current goal: `传说真假谁在乎，自在就好`
- Identity: `传说里的逍遥游医`
- Life memory: `江湖上到处是你的传说 + 真假难辨 + 自在就好`
- Summary: `江湖游医 + 逍遥传说 + 医名远飘`

**Tavern-born anchors:** 酒肆里听江湖故事、老掌柜的"野马"、三教九流、真假传说

---

#### Variant Prag-C — 一代宗师·名 (Grand Master's Fame)

**Late-life root:** 德高望重 (Master — 一代名医)
**Core theme:** 德高望重，医名满天下
**Tone:** Warm-grand — 一生圆满，福寿双全，医名满天下

**Narrative beat:**
- 家里常常高朋满座，有达官贵人，也有江湖豪杰，还有你一手带出来的徒弟们
- 你坐在主位，笑眯眯地看着，什么人说什么话，你心里门儿清
- 太医院请你做院判你不去，江湖门派请你做供奉你也不去——就守着你的药庐，看着后辈们成长
- 有人说"李老先生您是一代宗师"，你只摆摆手——"什么宗师，就是个看病的"
- 老掌柜若还在，大概会捋着胡子得意——"我就说这小子是块料子！你看你看！"
- 你也笑——这一辈子，全靠当年在酒肆跟老掌柜学的那点人情世故。从跑堂的到一代名医，这条路，走得稳

**Expression updates:**
- Cost label: `一代宗师·名`
- Current goal: `看着这一世医名，守着这一份圆满`
- Identity: `德高望重的一代宗师`
- Life memory: `门生故吏满天下 + 人人敬重 + 医名远播`
- Summary: `一代名医 + 德高望重 + 医名满天下`

**Tavern-born anchors:** 老掌柜的得意、酒肆里学的人情世故、从跑堂到名医、人人给面子

---

## 4. Expression Update Surfaces

### 4.1 Medical Route Expression

| Surface | Function | Priority | Notes |
|---------|----------|----------|-------|
| Cost label | `deriveMedicalCostLabel()` | P0 | 6 endgame cost labels |
| Current goal | `medicalCurrentGoal()` | P0 | Endgame goal per branch |
| Age-60 identity | `medicalAge60Identity()` | P0 | Endgame identity per branch |

**Implementation pattern:** Done-flag-first — check `medical_endgame_echo_done` first, then variant + branch marker.

---

### 4.2 Ordinary Origin Expression

| Surface | Function | Priority | Notes |
|---------|----------|----------|-------|
| Current goal | `tavernCurrentGoal()` | P1 | Endgame goal per branch |
| Life memory | `tavernLifeMemory()` | P1 | Endgame memory per branch |
| Summary | `deriveOrdinaryOriginSummary()` | P1 | Endgame summary per branch |

**Implementation pattern:** Done-flag-first — check `medical_endgame_echo_done` first, then variant + branch marker.

---

**Total: 6 expression surfaces (3 medical route + 3 ordinary origin)**

---

## 5. Endgame-Specific Player-Facing Signals

**Minimum 2 core signals:** ✅ Satisfied (3+)

1. **Cost label change** — 仁心不灭·烬 / 医者从容·淡 / 仁心满天下·传 / 医名犹存·寂 / 江湖游医·遥 / 一代宗师·名 (clearly shows endgame state and branch)
2. **Current goal change** — each branch has distinct endgame goal
3. **Endgame identity** — 6 distinct endgame identities

**Bonus signals:**
4. Life memory updates
5. Summary updates

---

## 6. Gate Acceptance Criteria

For endgame to be considered "done" (P93 closure):

1. ✅ Endgame echo event fires at age 60-65 with correct conditions
2. ✅ All 6 variants present with distinct identities (3 compassionate + 3 pragmatic)
3. ✅ Branch-specific flags set correctly (one per path)
4. ✅ No stat changes (endgame is memory, not power)
5. ✅ Cost label + current goal update per branch
6. ✅ Endgame identity deepens per branch
7. ✅ Tavern-born medical healer flavor consistent across all branches
8. ✅ Two variants remain meaningfully different (not mirrors)
9. ✅ No P85/P88/P90/P91 regressions
10. ✅ Typecheck passes

---

## 7. Lightweight Compliance Contract

P93 implementation MUST adhere to these lightweight constraints:

| Constraint | Requirement |
|------------|-------------|
| 1 echo event maximum | Conceptually 1 echo event; implemented as 6 variant-specific auto events with unified event_record `medical_endgame_echo`, consistent with P91 late-life pattern |
| Expression updates only | No new systems, no new framework |
| Auto event | Not a choice event |
| ≤6 variants | 6 variants = 2 variants × 3 choices (one per late-life branch) |
| Single age window | 60-65, not multiple stages |
| 2+ endgame signals | Cost label + current goal minimum |
| No stat changes | Endgame is memory, not power |

**If P93 implementation requires more than this, STOP and reassess GO/NO-GO.**

---

## 8. P92 / P93 Boundary

| P92 (this stage) | P93 (implementation) |
|-------------------|---------------------|
| Prerequisite audit | — |
| Scope contract | — |
| GO/NO-GO assessment | — |
| Endgame direction & 6-branch design | Event wiring implementation |
| Endgame contract (THIS DOCUMENT) — LOCKED | Follows contract exactly |
| P93 validation shape definition | Targeted proof + regression tests |
| Closure report + handoff | Implementation + verification |

**P92 produces the contract; P93 implements it. No scope creep from P92 into P93.**

---

## 9. Reserved Flags

The following flags are reserved for endgame implementation in P93:

**Checkpoint + identity:**
- `medical_endgame_echo_done` — checkpoint
- `medical_endgame_identity_done` — identity deepening

**Compassionate branch markers:**
- `tavern_medical_endgame_compassionate_ember` — Comp-A: 仁心不灭·烬
- `tavern_medical_endgame_compassionate_peace` — Comp-B: 医者从容·淡
- `tavern_medical_endgame_compassionate_legacy` — Comp-C: 仁心满天下·传

**Pragmatic branch markers:**
- `tavern_medical_endgame_pragmatic_fame_remain` — Prag-A: 医名犹存·寂
- `tavern_medical_endgame_pragmatic_wanderer_legend` — Prag-B: 江湖游医·遥
- `tavern_medical_endgame_pragmatic_grand_master` — Prag-C: 一代宗师·名

**Total: 8 flags. No other flags should be needed. If more flags are required in P93, reassess scope creep.**

---

## 10. Quality Priority Order for P93

1. **Lightweight compliance** — stay within 1 event + expression updates only
2. **GO/NO-GO integrity** — if scope creeps, stop and reassess
3. **Two-variant differentiation** — compassionate ≠ pragmatic (different axes, not mirrors)
4. **Flavor consistency** — tavern-born medical healer throughout
5. **Branch differentiation** — 6 meaningfully different endgames
6. **Expression correctness** — all 6 surfaces update correctly
7. **No regressions** — P85/P88/P90/P91 all still pass

---

**Contract LOCKED. P93 may proceed with implementation — CONDITIONAL_GO, lightweight only.**
