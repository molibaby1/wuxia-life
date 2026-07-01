# P78 Renown Late-Life Contract

> **Purpose:** Design-first contract for the `jianghu_renown_sage` late-life stage — 3 branches based on payoff choice, auto event at age 52+
> **Source of truth:** This contract defines what P79 (implementation) must deliver.
> **Status:** LOCKED — P78 design-first complete

---

## 1. Core Direction

**Selected:** Single auto event with 3 branches — late-life as consequence of payoff choice

**Why auto (not choice):**
- Late-life is the *consequence* of the payoff choice, not a new choice
- Player already chose their path at payoff; late-life is the result unfolding
- Feels like "life unfolding based on prior decisions"
- Consistent with merchant late-life pattern (auto milestones)

**Why 3 branches:**
- Leverages the 3-choice structure from payoff
- Each branch delivers on the "future shadow" promised at payoff
- Meaningful differentiation — not reskinned
- More narrative variety than merchant late-life (single path)

**Core narrative question:** 人情债的选择，决定了怎样的晚年？

**Distinction from payoff:**
- Payoff = "我选择这样了结人情债"（主动选择）
- Late-life = "这个选择，带来了这样的晚年"（自然结果）
- Payoff is choice event; Late-life is auto event

**Distinction from generic endgame:**
- Generic endgame = 临终回顾 / 最终结局
- Renown late-life = 50岁+的人生阶段，有自己的叙事和身份
- Late-life is *before* endgame/final legacy; it's an active life stage

---

## 2. Late-Life Event Spec

### Event ID
`renown_late_life`

### Type
`auto`（自动触发，不是玩家选择）

### Age Range
52–56 岁

### Trigger
`age_reach` at age 52

### Trigger Conditions
1. `flags.has('renown_midlife_payoff_done')` — payoff 已完成
2. `!flags.has('renown_late_life_done')` — 互斥 guard
3. `!flags.has('orthodox_childhood_seed_done')` — 排除正道种子
4. `!flags.has('demonic_childhood_seed_done')` — 排除魔道种子
5. `flags.has('tavern_renown_bridge_crossed')` — 隐含保证 tavern_hand origin + ally_network seed

### Upstream Gate
`renown_midlife_payoff_done`

### Branching Logic
Branching is based on which payoff choice marker is set:
- `tavern_renown_payoff_hard_holder` → Branch A (油尽灯枯 / Burnout)
- `tavern_renown_payoff_breaker` → Branch B (逍遥自在 / Lone Wolf)
- `tavern_renown_payoff_balancer` → Branch C (传承授业 / Mentor)

**Exactly one of these three will be set** (guaranteed by payoff event).

### Checkpoint Flag
`renown_late_life_done` — 通用 checkpoint，标记 late-life 已发生

### Late-Life Identity Flag
`renown_late_life_identity_done` — late-life 身份深化（P76 预留，现在正式定义）

### Branch-Specific Identity Markers
三选一设置：
- `tavern_renown_late_burnout`（Branch A：油尽灯枯）
- `tavern_renown_late_lone_wolf`（Branch B：逍遥自在）
- `tavern_renown_late_mentor`（Branch C：传承授业）

### Event Content (Title + Text)

**Title:** 晚景几何

**Shared opening text:**
五十岁这年，你站在酒肆门口，看着街上来来往往的人——有的认识，有的不认识。风一吹，你忽然想起年轻时的日子。

这一辈子，人情债的账，算到最后，到底是个什么结果？

**Then branch-specific text continues based on payoff choice.**

---

## 3. Three Branch Details

### Branch A: 油尽灯枯 (Burnout — Hard Holder Path)

#### Payoff Marker
`tavern_renown_payoff_hard_holder`

#### Core Narrative
硬扛了一辈子人情债，名声响了一辈子，身体也垮了。酒肆的老掌柜若还在，大概会说你傻吧。可你知道——有些人，就是为了名声活着的。

#### Branch-Specific Event Text
> 身体越来越差了。可只要还有人找上门，你还是硬撑着答应。
>
> 老客人们见了你，都叹口气——"这老好人，还是改不了。"
>
> 夜深人静时，你摸着酸疼的骨头，想起小时候在酒肆跑堂的日子——那时候累是累，可身子骨硬朗啊。
>
> 算盘珠子拨了一辈子人情账，最后算到了自己头上。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +2 | Still highly respected; name carries weight |
| connections | +1 | People still come around, but more out of pity/duty |
| charisma | -1 | Still charismatic but faded, tired |
| **Net** | **+2** | Modest gain, but narrative framing of decline |

#### Auto Effects (Branch A)
- `flag_set`: `renown_late_life_done`
- `flag_set`: `renown_late_life_identity_done`
- `flag_set`: `tavern_renown_late_burnout`
- `event_record`: `renown_late_life`
- `stat_modify`: reputation +2
- `stat_modify`: connections +1
- `stat_modify`: charisma -1

#### Tavern-Born Flavor Anchors
- 酒肆老掌柜的叹息 — "面子哪有命重要"
- 打落牙齿和血吞 — 扛了一辈子，终于扛不动了
- 算盘珠子 — 算了一辈子人情账，最后算到了自己头上
- 酒肆跑堂的回忆 — 那时候累是累，可身子骨硬朗

---

### Branch B: 逍遥自在 (Lone Wolf — Breaker Path)

#### Payoff Marker
`tavern_renown_payoff_breaker`

#### Core Narrative
撕破了一辈子假人情，断了所有不该有的牵绊。身边的人少了，心却宽了。有人说你可怜，你只笑笑——酒肆里三教九流见多了，真真假假，你分得清。孤独？不，这叫自由。

#### Branch-Specific Event Text
> 你常常一个人去酒肆，点一壶酒，坐一下午。
>
> 老客人们有的还打招呼，有的绕着走。你不在乎——这辈子撕破了那么多假人情，剩下的才是真的。
>
> 一个人喝酒怎么了？自在。
>
> 算盘珠子不算人情账了，算自己的逍遥账——赚了。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | -1 | Still somewhat notorious; not well-liked but respected |
| connections | -2 | Very few people left; most bridges burned |
| charisma | +3 | Sharp, witty, unapologetically authentic — magnetic in a different way |
| **Net** | **0** | Connections down, charisma up — roughly even |

#### Auto Effects (Branch B)
- `flag_set`: `renown_late_life_done`
- `flag_set`: `renown_late_life_identity_done`
- `flag_set`: `tavern_renown_late_lone_wolf`
- `event_record`: `renown_late_life`
- `stat_modify`: reputation -1
- `stat_modify`: connections -2
- `stat_modify`: charisma +3

#### Tavern-Born Flavor Anchors
- 三教九流见多了 — 真假人情，一眼看穿
- 酒肆的独酌 — 一个人喝酒，自在
- 老客人们的议论 — 有人说你绝情，有人佩服你的勇气
- 算盘珠子 — 不算人情账了，算自己的逍遥账

---

### Branch C: 传承授业 (Mentor — Balancer Path)

#### Payoff Marker
`tavern_renown_payoff_balancer`

#### Core Narrative
人情练达了一辈子，拿捏得准分寸，分得清真假。到了晚年，成了人人敬重的老前辈——年轻人来请教，你倾囊相授。酒肆掌柜的智慧，全被你用在了江湖上，也传给了后来人。

#### Branch-Specific Event Text
> 酒肆里常来年轻人，向你请教江湖上的人情世故。
>
> 你像当年老掌柜教你一样，慢慢点拨他们——该帮的帮，该推的推，有来有往才长久。
>
> 看着他们从青涩到练达，你觉得这辈子没白活。
>
> 算盘珠子算的不是人情债，是传承账——赚大了。

#### Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +3 | Widely respected as a mentor/elder |
| connections | +2 | Many former students/admirers; broad network |
| charisma | +2 | Wise, measured, deeply charismatic from experience |
| **Net** | **+7** | All around increase — the "best" outcome stat-wise |

#### Auto Effects (Branch C)
- `flag_set`: `renown_late_life_done`
- `flag_set`: `renown_late_life_identity_done`
- `flag_set`: `tavern_renown_late_mentor`
- `event_record`: `renown_late_life`
- `stat_modify`: reputation +3
- `stat_modify`: connections +2
- `stat_modify`: charisma +2

#### Tavern-Born Flavor Anchors
- 酒肆掌柜的智慧 — 人情不是债，是往来；有来有往才长久
- 带徒弟 / 指点晚辈 — 像老掌柜当年带你一样
- 酒肆的年轻人 — 来请教的，来道谢的，热热闹闹
- 算盘珠子 — 算的不是人情债，是传承账

---

## 4. Player-Facing Expression Updates

### 4.1 Sample Line Expression (`sampleLineExpression.ts`)

#### `deriveSampleLineCostLabel()` — late-life 分支

**Gate order:** `renown_late_life_done` > `renown_midlife_payoff_done` > `renown_midlife_pressure_done` > base

| Branch | Cost Label Text |
|--------|----------------|
| Branch A (Burnout) | 油尽灯枯 |
| Branch B (Lone Wolf) | 逍遥自在 |
| Branch C (Mentor) | 传承授业 |

#### `renownCurrentGoal()` — late-life 分支

**Gate order:** `renown_late_life_done` > `renown_midlife_payoff_done` > `renown_midlife_pressure_done` > `renown_on_ramp_done` > `tavern_renown_bridge_crossed` > base

| Branch | Current Goal Text |
|--------|------------------|
| Branch A (Burnout) | 守住这一辈子的名声，撑到最后 |
| Branch B (Lone Wolf) | 无牵无挂，过好剩下的日子 |
| Branch C (Mentor) | 指点后辈，把这一辈子的人情世故传下去 |

#### `renownAge40Identity()` → expand to late-life identity

**Note:** The existing function covers age-40 identity. For late-life, we add a deeper identity layer. The function should check `renown_late_life_identity_done` first, then fall back to `renown_age40_identity_done`.

**Gate order:** `renown_late_life_identity_done` > `renown_age40_identity_done` > base

| Branch | Late-Life Identity Text |
|--------|------------------------|
| Branch A (Burnout) | 你是油尽灯枯的老好人：从酒肆跑堂到江湖名宿，硬扛了一辈子人情债，名声响了一辈子，身体也垮了。酒肆的老掌柜若还在，大概会说你傻吧。可你知道——有些人，就是为了名声活着的。 |
| Branch B (Lone Wolf) | 你是逍遥自在的孤翁：从酒肆跑堂到江湖独行，撕破了一辈子假人情，断了所有不该有的牵绊。身边的人少了，心却宽了。有人说你可怜，你只笑笑——酒肆里三教九流见多了，真真假假，你分得清。孤独？不，这叫自由。 |
| Branch C (Mentor) | 你是德高望重的老前辈：从酒肆跑堂到江湖名宿，人情练达了一辈子，拿捏得准分寸，分得清真假。到了晚年，成了人人敬重的老前辈——年轻人来请教，你倾囊相授。酒肆掌柜的智慧，全被你用在了江湖上，也传给了后来人。 |

### 4.2 Ordinary Origin Expression (`ordinaryOriginExpression.ts`)

#### `tavernCurrentGoal()` — late-life 分支

**Gate order:** `renown_late_life_done` > `renown_midlife_payoff_done` > `renown_midlife_pressure_done` > `renown_on_ramp_done` > `tavern_renown_bridge_crossed` > base

(Same as sample line current goal)

#### `tavernLifeMemory()` — late-life 记忆

| Branch | Life Memory Text |
|--------|-----------------|
| Branch A (Burnout) | 身体越来越差了。可只要还有人找上门，你还是硬撑着答应。老客人们见了你，都叹口气——"这老好人，还是改不了。"夜深人静时，你摸着酸疼的骨头，想起小时候在酒肆跑堂的日子——那时候累是累，可身子骨硬朗啊。算盘珠子拨了一辈子人情账，最后算到了自己头上。 |
| Branch B (Lone Wolf) | 你常常一个人去酒肆，点一壶酒，坐一下午。老客人们有的还打招呼，有的绕着走。你不在乎——这辈子撕破了那么多假人情，剩下的才是真的。一个人喝酒怎么了？自在。算盘珠子不算人情账了，算自己的逍遥账——赚了。 |
| Branch C (Mentor) | 酒肆里常来年轻人，向你请教江湖上的人情世故。你像当年老掌柜教你一样，慢慢点拨他们——该帮的帮，该推的推，有来有往才长久。看着他们从青涩到练达，你觉得这辈子没白活。算盘珠子算的不是人情债，是传承账——赚大了。 |

#### `deriveOrdinaryOriginSummary()` — late-life 终局总结

| Branch | Summary Text |
|--------|-------------|
| Branch A (Burnout) | 酒肆出身的江湖名宿：硬扛了一辈子人情债，名声响遍江湖，最后油尽灯枯。有人念你的好，有人叹你的傻。 |
| Branch B (Lone Wolf) | 酒肆出身的江湖独行：撕破了假人情，断了所有牵绊，换来一身自由。有人说你绝情，你只觉得可笑——真真假假，你早就分得清。 |
| Branch C (Mentor) | 酒肆出身的江湖名宿：人情练达了一辈子，拿捏得住分寸，分得清真假。晚年成了人人敬重的老前辈，把这一辈子的智慧都传了下去。酒肆掌柜的智慧，后继有人。 |

### 4.3 Core Late-Life Signals（至少 3 个）

1. **Cost label**（油尽灯枯 / 逍遥自在 / 传承授业）— 主屏幕路线代价标签
2. **Current goal**（撑到最后 / 过好剩下的日子 / 指点后辈）— 主屏幕当前目标
3. **Late-life identity**（油尽灯枯的老好人 / 逍遥自在的孤翁 / 德高望重的老前辈）— 身份总结
4. **Life memory**（late-life 记忆）— 人生记忆面板
5. **Origin summary**（终局总结）— 出身总结行

---

## 5. Stat Changes Summary

| Stat | Branch A (Burnout) | Branch B (Lone Wolf) | Branch C (Mentor) |
|------|---------------------|----------------------|--------------------|
| reputation | +2 | -1 | +3 |
| connections | +1 | -2 | +2 |
| charisma | -1 | +3 | +2 |
| **净值** | **+2** | **0** | **+7** |

**Design note:**
- Branch C (Mentor) is the "best" outcome stat-wise — balanced life leads to best late-life
- Branch A (Burnout) has modest stat gains but narrative decline — reputation up but "body breaking"
- Branch B (Lone Wolf) is net zero — traded connections for charisma, freedom for loneliness
- Each branch has different tradeoffs; no single "correct" choice
- Branch A does not introduce a new health/labor stat — the renown route uses only reputation/connections/charisma as its core stat vocabulary; burnout is conveyed through narrative framing and charisma penalty rather than a new stat dimension

---

## 6. Reserved Flag Interfaces (for Future Stages)

预留以下 flag 接口（本阶段不实现逻辑，仅占位命名）：
- `renown_endgame_echo_done` — 终局回响（P80+ 或更远）

**预留意图：** 确保 late-life 的三个分支方向都能在 endgame / final legacy 阶段有差异化延伸，不会因为今天的设计把未来的路堵死。

---

## 7. Flavor Constraints

1. **Tavern-born first:** 所有分支和表达都必须有酒肆出身的味道——酒肆、人情往来、老掌柜、算盘、跑堂的、三教九流
2. **Not generic jianghu:** 不能写成通用的"江湖晚年"，必须是"酒肆出身的人遇到晚年会怎样"
3. **Distinct from merchant:** Merchant late-life 是守成与传承（商业帝国）；Renown late-life 是人情选择的后果（社会关系）
4. **Three branches feel meaningfully different:** 不是换皮选择，属性变化、身份感、叙事调性、情感基调都要有实质差异
5. **Payoff → Late-life 递进自然:** Payoff 是"我选择这样了结"，Late-life 是"这个选择带来了这样的晚年"

---

## 8. Gate Acceptance Criteria

### Pre-Late-Life (must be true for event to fire)
- [ ] `renown_midlife_payoff_done === true`
- [ ] `renown_late_life_done === false`
- [ ] `tavern_renown_bridge_crossed === true`
- [ ] Age between 52 and 56
- [ ] No orthodox/demonic childhood seeds
- [ ] Exactly one of the three payoff choice markers is set

### Post-Late-Life (must be true after event)
- [ ] `renown_late_life_done === true`
- [ ] `renown_late_life_identity_done === true`
- [ ] Exactly one of the three late-life markers is set
- [ ] The late-life marker matches the payoff marker (A→A, B→B, C→C)
- [ ] Cost label matches the selected branch
- [ ] Current goal matches the selected branch
- [ ] Late-life identity matches the selected branch
- [ ] Stat changes match the branch spec

---

## 9. Boundary with P79 (Implementation)

| P78 (Design-First) | P79 (Implementation) |
|-------------------|---------------------|
| Prerequisite audit | Runtime event wiring in sample-lines-spine.json |
| Scope contract | Expression updates in sampleLineExpression.ts |
| Branch design | Expression updates in ordinaryOriginExpression.ts |
| Late-life contract (本文档) | Targeted proof document |
| Validation shape | Regression tests (~20-25 tests) |
| Closure report + GO/NO-GO | Closure report |

**P79 must deliver on everything defined in this contract. No scope expansion beyond what's defined here without a new PRD.**

---

*Contract locked by P78 design-first stage. P79 implementation proceeds from here (if GO).*
