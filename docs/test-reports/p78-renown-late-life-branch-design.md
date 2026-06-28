# P78 Renown Late-Life Branch Design

> **Date:** 2026-06-29
> **Stage:** P78 Wuxia Renown Late-Life Design-First
> **Purpose:** Design three distinct late-life branches (one per payoff choice) with meaningful differentiation

---

## 1. Design Decision: Single Event with 3 Branches

**Decision:** Late-life is a **single auto event with 3 branches** (branching based on payoff choice marker).

**Rationale:**
- Bounded scope — 1 event, not a full late-life expansion
- Leverages the 3-choice structure from payoff
- Each branch has distinct narrative and identity
- Consistent with prior renown pattern (each stage = 1 spine event)
- Lower implementation and testing cost

**Why not multi-event?**
- Renown route is still new (only 1 origin)
- Multi-event would balloon scope and testing burden
- 1 event with 3 branches already provides meaningful differentiation
- Can always expand later if justified

**Why auto (not choice)?**
- Late-life is the *consequence* of the payoff choice, not a new choice
- The player already chose their path at payoff; late-life is the result
- Auto feels like "life unfolding" based on prior decisions
- This mirrors merchant late-life pattern (auto milestones)

---

## 2. Late-Life Timing

**Age range:** 52–56

**Trigger:** `age_reach` at age 52

**Why 52?**
- ~9 years after payoff (age 43) — enough time for the payoff choice to "settle" and show long-term effects
- ~12 years after pressure (age 40) — clearly a new life stage, not just continuation
- Consistent with merchant late-life timing (age 45 payoff → late-life around 50s)
- Old enough to feel like "late life" but young enough to still be active

**Upstream gate:** `renown_midlife_payoff_done`

---

## 3. Branch A: 声名之累 → 油尽灯枯 (Hard Holder → Burnout)

### 3.1 Core Narrative

**Payoff choice:** 硬扛到底 — 把所有人情债都扛下来，名声更响了，但人也累垮了

**Late-life arc:** 一辈子硬撑面子，到了晚年，身体终于撑不住了。名声还在，但人已经油尽灯枯。酒肆的老掌柜若还在，大概会叹一句"傻孩子，面子哪有命重要"。

**Core question:** 为了名声硬扛一辈子，值得吗？

### 3.2 Tavern-Born Flavor Anchors
- 酒肆老掌柜的叹息 — "面子哪有命重要"
- 打落牙齿和血吞 — 扛了一辈子，终于扛不动了
- 酒肆的老客人们 — 有人念你的好，有人只是唏嘘
- 算盘珠子 — 算了一辈子人情账，最后算到了自己头上

### 3.3 Player Experience
- **Tone:** Tragic, poignant, bittersweet
- **Feeling:** "I knew this would happen, but it still hurts" — the natural consequence of always saying yes
- **Identity shift:** 硬撑面子的江湖好人 → 油尽灯枯的老好人
- **Emotional beat:** Sad but earned — the player chose this path, and late-life delivers on the promise

### 3.4 Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +2 | Still highly respected; name carries weight |
| connections | +1 | People still come around, but more out of pity/duty |
| charisma | 0 | Still charismatic but faded |
| **health/labor** | **-5** | **Body finally breaks from years of overextending** |
| **Net** | **-2** | Reputation up, but health severely down |

> Note: If health stat doesn't exist or isn't easily modifiable, use a strong narrative beat + existing stats (rep+2, con+1, cha-1 = net +2 but with clear "burnout" narrative framing).

### 3.5 Identity Marker
`tavern_renown_late_burnout`

### 3.6 Expression Signals
| Surface | Text Direction |
|---------|---------------|
| Cost label | 油尽灯枯 |
| Current goal | 守住这一辈子的名声，撑到最后 |
| Age-50+ identity | 油尽灯枯的老好人：硬扛了一辈子人情债，名声响了一辈子，身体也垮了。酒肆的老掌柜若还在，大概会说你傻吧。可你知道——有些人，就是为了名声活着的。 |
| Life memory | 身体越来越差了。可只要还有人找上门，你还是硬撑着答应。老客人们见了你，都叹口气——"这老好人，还是改不了。"夜深人静时，你摸着酸疼的骨头，想起小时候在酒肆跑堂的日子——那时候累是累，可身子骨硬朗啊。 |
| Origin summary | 酒肆出身的江湖名宿：硬扛了一辈子人情债，名声响遍江湖，最后油尽灯枯。有人念你的好，有人叹你的傻。 |

---

## 4. Branch B: 快意恩仇 → 孤独自由 (Breaker → Lone Freedom)

### 4.1 Core Narrative

**Payoff choice:** 索性撕破脸 — 撕破了假人情，断了不该还的债，名声掉了，但自由了

**Late-life arc:** 一辈子快意恩仇，到了晚年，身边的人越来越少，但你活得比谁都通透。无牵无挂，独来独往——有人说你可怜，你只觉得可笑。酒肆里三教九流见多了，真真假假，你早就分得清。

**Core question:** 断了所有人情，换来了自由，值得吗？

### 4.2 Tavern-Born Flavor Anchors
- 三教九流见多了 — 真假人情，一眼看穿
- 酒肆的独酌 — 一个人喝酒，自在
- 老客人们的议论 — 有人说你绝情，有人佩服你的勇气
- 算盘珠子 — 不算人情账了，算自己的逍遥账

### 4.3 Player Experience
- **Tone:** Free, unapologetic, slightly lonely but content
- **Feeling:** "I gave up a lot, but I gained myself" — the freedom is real, so is the loneliness
- **Identity shift:** 快意恩仇的独行侠 → 逍遥自在的孤翁
- **Emotional beat:** Bittersweet freedom — not everyone's cup of tea, but authentic

### 4.4 Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | -1 | Still somewhat notorious; not well-liked but respected |
| connections | -2 | Very few people left; most bridges burned |
| charisma | +3 | Sharp, witty, unapologetically authentic — magnetic in a different way |
| **Net** | **0** | Connections down, charisma up — roughly even |

### 4.5 Identity Marker
`tavern_renown_late_lone_wolf`

### 4.6 Expression Signals
| Surface | Text Direction |
|---------|---------------|
| Cost label | 逍遥自在 |
| Current goal | 无牵无挂，过好剩下的日子 |
| Age-50+ identity | 逍遥自在的孤翁：撕破了一辈子假人情，断了所有不该有的牵绊。身边的人少了，心却宽了。有人说你可怜，你只笑笑——酒肆里三教九流见多了，真真假假，你分得清。孤独？不，这叫自由。 |
| Life memory | 你常常一个人去酒肆，点一壶酒，坐一下午。老客人们有的还打招呼，有的绕着走。你不在乎——这辈子撕破了那么多假人情，剩下的才是真的。一个人喝酒怎么了？自在。 |
| Origin summary | 酒肆出身的江湖独行：撕破了假人情，断了所有牵绊，换来一身自由。有人说你绝情，你只觉得可笑——真真假假，你早就分得清。 |

---

## 5. Branch C: 人情练达 → 传承授业 (Balancer → Mentorship/Legacy)

### 5.1 Core Narrative

**Payoff choice:** 找到平衡 — 拿捏人情往来的分寸，懂帮忙也懂拒绝，成了真正懂人情世故的江湖名宿

**Late-life arc:** 一辈子人情练达，到了晚年，成了人人敬重的老前辈。年轻人来请教，你倾囊相授——不是为了名声，是因为知道江湖路难走，有人指路能少走很多弯路。酒肆掌柜的智慧，全被你用在了江湖上，也传给了后来人。

**Core question:** 人情练达一辈子，最后留下了什么？

### 5.2 Tavern-Born Flavor Anchors
- 酒肆掌柜的智慧 — 人情不是债，是往来；有来有往才长久
- 带徒弟 / 指点晚辈 — 像老掌柜当年带你一样
- 酒肆的年轻人 — 来请教的，来道谢的，热热闹闹
- 算盘珠子 — 算的不是人情债，是传承账

### 5.3 Player Experience
- **Tone:** Warm, satisfying, redemptive
- **Feeling:** "I did well, and now I'm passing it on" — the most "complete" feeling of the three
- **Identity shift:** 人情练达的江湖名宿 → 德高望重的老前辈
- **Emotional beat:** Fulfilling — feels like a good ending to the renown arc

### 5.4 Stat Changes
| Stat | Change | Rationale |
|------|--------|-----------|
| reputation | +3 | Widely respected as a mentor/elder |
| connections | +2 | Many former students/admirers; broad network |
| charisma | +2 | Wise, measured, deeply charismatic from experience |
| **Net** | **+7** | All around increase — the "best" outcome stat-wise |

### 5.5 Identity Marker
`tavern_renown_late_mentor`

### 5.6 Expression Signals
| Surface | Text Direction |
|---------|---------------|
| Cost label | 传承授业 |
| Current goal | 指点后辈，把这一辈子的人情世故传下去 |
| Age-50+ identity | 德高望重的老前辈：人情练达了一辈子，拿捏得准分寸，分得清真假。到了晚年，成了人人敬重的老前辈——年轻人来请教，你倾囊相授。酒肆掌柜的智慧，全被你用在了江湖上，也传给了后来人。 |
| Life memory | 酒肆里常来年轻人，向你请教江湖上的人情世故。你像当年老掌柜教你一样，慢慢点拨他们——该帮的帮，该推的推，有来有往才长久。看着他们从青涩到练达，你觉得这辈子没白活。 |
| Origin summary | 酒肆出身的江湖名宿：人情练达了一辈子，拿捏得住分寸，分得清真假。晚年成了人人敬重的老前辈，把这一辈子的智慧都传了下去。酒肆掌柜的智慧，后继有人。 |

---

## 6. Differentiation Check

### 6.1 Across Three Branches

| Dimension | Branch A (Burnout) | Branch B (Lone Wolf) | Branch C (Mentor) |
|-----------|---------------------|----------------------|--------------------|
| **Core narrative** | 硬扛一辈子，油尽灯枯 | 撕破脸一辈子，逍遥自在 | 练达一辈子，传承授业 |
| **Tone** | Tragic / poignant | Free / bittersweet | Warm / fulfilling |
| **Identity** | 油尽灯枯的老好人 | 逍遥自在的孤翁 | 德高望重的老前辈 |
| **Cost label** | 油尽灯枯 | 逍遥自在 | 传承授业 |
| **Net stat change** | -2 (or +2 no health) | 0 | +7 |
| **Dominant stat** | reputation | charisma | all three |
| **Tavern anchor** | 老掌柜的叹息 | 三教九流见多了 | 老掌柜的传承 |
| **Emotional beat** | Sad but earned | Free but lonely | Fulfilling and warm |
| **Player feeling** | "I knew this would happen" | "Freedom has a price" | "I did well" |

### 6.2 Differentiation Verdict
✅ **Meaningfully different — not reskinned.** Each branch has:
- Distinct narrative arc
- Different emotional tone
- Different stat profile
- Different tavern-born flavor anchor
- Different identity and expression
- Different "core question"

---

## 7. Comparison with Merchant Late-Life

| Dimension | Merchant Late-Life (守成与传承) | Renown Late-Life (3 branches) |
|-----------|-------------------------------|-------------------------------|
| **Core theme** | Business empire stewardship | Social/consequence of choices |
| **Structure** | Auto milestone | Auto event with 3 branches |
| **Choice leverage** | Single path | 3 paths from prior choice |
| **Flavor** | Merchant / business | Tavern / renown /人情 |
| **Late-life question** | How to pass on the empire? | What did this life amount to? |
| **Tone range** | Mostly positive (stewardship) | A: tragic, B: bittersweet, C: warm |

✅ **Clearly differentiated from merchant late-life.** Different core themes, different structure (branching vs single path), different flavor.

---

## 8. Does Late-Life Add Value?

### 8.1 Why Yes
1. **Delivers on payoff promises:** Each payoff choice had "future shadow" hints — late-life delivers on those
2. **Choice consequence:** Makes the payoff choice feel more meaningful — it doesn't just change stats, it changes the rest of your life
3. **3-branch variety:** More narrative variety than merchant late-life (single path)
4. **Emotional closure:** Late-life gives a sense of "how did my life turn out?" that payoff alone doesn't
5. **Tavern-born flavor:** Each branch has distinct tavern anchors, not generic jianghu

### 8.2 Why It Might Not
1. **Single origin only:** Only tavern_hand — lower replication value
2. **Payoff already satisfying:** Payoff already gives a strong identity shift
3. **Implementation cost:** 1 event + 6 expression updates × 3 branches = significant work for 1 origin

### 8.3 Verdict
**Late-life adds meaningful value.** The 3-branch structure leverages the payoff choice in a way that single-path late-life (like merchant) doesn't. Each branch delivers on the "future shadow" promised at payoff, and the emotional range (tragic / free / fulfilling) gives real replay value.

---

*Branch design complete. P78-003 passed.*
