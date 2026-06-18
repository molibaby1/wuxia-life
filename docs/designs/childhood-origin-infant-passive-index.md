# 四出身 · 0～2 岁被动事件链索引

**状态：** 待审批（内容策划稿）  
**范围：** 书香门第、武林世家、商贾之家、边疆异族 — 各 5 节点被动链  
**非目标：** 不改 runtime、不写代码

---

## 1. 文档清单

| 出身 | Quest ID | 规格文档 | 出身 flag |
| --- | --- | --- | --- |
| 书香门第 | `quest_scholar_infant_passive_0_2` | `childhood-scholar-origin-0-2-quest-spec.md` | `origin_scholar_family` |
| 武林世家 | `quest_martial_infant_passive_0_2` | `childhood-martial-origin-0-2-quest-spec.md` | `origin_wuxia_family` |
| 商贾之家 | `quest_merchant_infant_passive_0_2` | `childhood-merchant-origin-0-2-quest-spec.md` | `origin_merchant_family` |
| 边疆异族 | `quest_frontier_infant_passive_0_2` | `childhood-frontier-origin-0-2-quest-spec.md` | `origin_frontier` |

---

## 2. 共用约束（四链一致）

| 项 | 规则 |
| --- | --- |
| **Agency** | 0～2 岁仅「继续」；`planningOptions.length === 0` |
| **属性** | 仅 `constitution` / `health` / `comprehension`；单节点 Δ≤1 |
| **禁止** | `chivalry` / `internalSkill` / `martialPower` / `money` / `qinggong` 跳变 |
| **结构** | 每链 5 节点：N1/N2 @0 岁 → N3/N4 @1 岁 → N5 @2 岁收官 |
| **链完成 flag** | `*_infant_chain_complete` 防重复 |
| **节奏** | 0～2 岁约 8～12 期 passive 中，专属链 5 次有情节叙事 |

---

## 3. 四链对照（叙事锚点）

| 节点序 | 书香门第 | 武林世家 | 商贾之家 | 边疆异族 |
| --- | --- | --- | --- | --- |
| **N1** 降生氛围 | 书斋初啼 / 藏书阁 | 武堂初啼 / 木匾 | 商号初啼 / 前堂买卖 | 营寨初啼 / 号声 |
| **N2** 襁褓 | 墨香 / 诵诗描红 | 桩影 / 拳风 | 算盘 / 抓铜钱 | 风沙 / 铠甲寒意 |
| **N3** 抓周 | 拈毫（笔） | 握木（剑鞘） | 拈秤（秤砣） | 扣弦（弓弦） |
| **N4** 1 岁活动 | 榻前描红 / 学爬 | 廊下观摩练桩 | 柜后学爬 / 递样布 | 毡帐学爬 / 拽皮靴 |
| **N5** 2 岁收官 | 书廊学步 | 院栏学步 | 巷口学步 | 哨边学步 / 黄沙风 |

**差异化验收：** 任意两出身推进至 2 岁，被动叙事 ID **重合度 <50%**（P2-2）。

---

## 4. 数值倾向对照（建议配置）

| 出身 | 体魄 | 悟性 | 健康 | 设计意图 |
| --- | --- | --- | --- | --- |
| 书香门第 | +2 | **+3** | +0～+1 | 耳濡目染、启蒙伏笔 |
| 武林世家 | **+3～+5**（建议压 +3） | 0 | +0～+1 | 筋骨环境，非练功 |
| 商贾之家 | +2 | **+3** | +0～+1 | 察言观色、人声敏感 |
| 边疆异族 | **+3～+5**（建议压 +3） | 0 | +0～+1 | 边地风寒、活动量 |

四链均不触碰侠义/内功/功力/银两。

---

## 5. 与 catalog 合并映射

| 现有 `infantPassiveNarratives` ID | 并入节点 |
| --- | --- |
| `infant_swaddle_scholar` | 书香 N2 |
| `infant_swaddle_martial` | 武林 N2 |
| `infant_swaddle_merchant` | 商贾 N2 |
| `infant_swaddle_frontier` | 边疆 N2 |

`infant_crawl_home`（中立）保留为**四出身共用 filler**，在专属链完成后、3 岁前随机插入，不与 N4 同 age 强制同屏。

---

## 6. 横切验收（四出身）

### AC-X-1：互斥

- **Given** 玩家仅有一种 `origin_*` flag  
- **When** 0～2 岁推进  
- **Then** 仅触发对应 quest 链 ID 前缀（`scholar_infant_*` / `martial_infant_*` / `merchant_infant_*` / `frontier_infant_*`）

### AC-X-2：Agency（复用各链 AC-1）

- **When** 四出身各测 10 期（0～2 岁）  
- **Then** 均无规划三选一、无占位句

### AC-X-3：矩阵差异化

- **When** 四出身各模拟至 2 岁，两两对比叙事 ID  
- **Then** 六组对比（C(4,2)）重合度均 <50%

### AC-X-4：实机回归

- **When** 复用 `api-browser-playtest-experience-2026-06-17.md` §9，四出身各开局  
- **Then** 无首回合侠义/内功荒谬跳变；继续前叙事非空

---

## 7. 实施顺序建议

1. 四链 JSON / TS 配置 + `*_chain_complete` 门控  
2. 与 `passive_progression` 相位按序 dequeue  
3. 合并 catalog 襁褓四条，避免双结算  
4. 四出身 headless 快照对比验收 AC-X-3
