# P47 Sample Lines Content Anchor Gap Audit

生成时间：2026-06-26

## 1. 审计范围与方法

对照 P46 §10.1（0–40 岁最低体验要素）与 P47 PRD 三条样本线定义，盘点现有内容锚点与缺失节点。主要承载文件：

| 样本线 | 主承载文件 | 关联文件 |
|--------|------------|----------|
| 正派武道 | `orthodox.json`, `sect-wudang.json` | `preschool-passive-spine.json`（martial 标签）, `sect-shaolin.json` |
| 邪路偏锋 | `identity-demon.json`, `sect-marginal.json` | `p9-remediation.json`（demonic  childhood/youth hooks）, `identity-outlaw.json` |
| 商路崛起 | `merchant.json`, `identity-merchant.json` | `preschool-passive-spine.json`（merchant 标签）, `p9-remediation.json`（merchant midlife） |

本审计仅盘点与标注 gap，**不改 gameplay 行为**。

## 2. P46 最低节点对照（跨线共享）

| 要素 | 最低要求 | 正派武道 | 邪路偏锋 | 商路崛起 |
|------|----------|----------|----------|----------|
| 关键节点（≥5，0–40） | 童年→少年→青年→中年前→40 收束 | 部分覆盖 | 部分覆盖 | 部分覆盖 |
| 关键选择（≥2） | 方向性分叉 | 有 | 有 | 有 |
| 代价/失败回流（≥1） | 可感知损失 | 有 | 有 | 有 |
| 中期身份信号（≥1） | route/identity 可感知 | 有 | 有 | 弱 |
| 40 岁总结钩子 | 可复述人生差异 | 弱 | 弱 | 缺失 |

## 3. 正派武道（Orthodox Martial）锚点 Inventory

### 3.1 已存在锚点

| 生命阶段 | 事件/锚点 ID | 文件 | 年龄 | 关键 flags / routePoints |
|----------|-------------|------|------|--------------------------|
| 童年种子 | `preschool_martial_first_stance`, `preschool_martial_weapon_rack`, `preschool_martial_evening_drill` | preschool-passive-spine | 7–13 | originTags: martial（未绑定 `route_orthodox`） |
| 少年路线抉择 | `sect_path_choice` → `join_orthodox` | sect-wudang | 13–14 | `route_orthodox`, `orthodox_trial_active` |
| 少年入门试炼 | `orthodox_initiation`, `orthodox_trial_entry`, `orthodox_trial_service`, `orthodox_trial_completion` | sect-wudang | 13–18 | `orthodox_trial_*` 系列 |
| 青年门派链 | `orthodox_invitation` → `orthodox_formal_disciple` → `orthodox_sect_mission` | orthodox | 14–25 | `orthodox_member`, `orthodox_formal_disciple` |
| 青年守正选择 | `orthodox_help_people`, `orthodox_demon_suppression` | orthodox | 24–40 | `orthodox_demon_slayer`, `orthodox_savior` |
| 中年守正代价 | `sect_midlife_stewardship`, `sect_midlife_gray_mission`, `sect_midlife_public_judgment` | sect-wudang | 31–48 | `sect_midlife_gray_*`, `sect_midlife_public_judgment_done` |
| 40 岁附近 | `sect_midlife_public_judgment`（trigger age 40） | sect-wudang | 40–48 | 公开审判分支 |

### 3.2 缺失节点

| 缺失项 | 说明 | 优先级 |
|--------|------|--------|
| 童年→正派路线绑定 | preschool martial 种子未写入 `route_orthodox` 或等价 routePoint | P47 配置 |
| 少年首次被认可（样本线专节点） | 试炼链存在但缺少「样本线可读」的首次认可 milestone flag | P47 配置 |
| 0–40 样本线 age-40 identity summary hook | 无专用 `orthodox_age40_identity_summary` 或同级 routePoint | P47 配置 |
| orthodox.json 与 route_orthodox 续链 | 部分 orthodox 事件仅依赖 `orthodox_member`，未强制 `route_orthodox` | P48/P49 验证 |

## 4. 邪路偏锋（Demonic Edge）锚点 Inventory

### 4.1 已存在锚点

| 生命阶段 | 事件/锚点 ID | 文件 | 年龄 | 关键 flags / routePoints |
|----------|-------------|------|------|--------------------------|
| 童年/早期信号 | `p9_echo_training_hook` + `p9_milestone_route_signal: demonic_childhood_spark` | p9-remediation | 7–13 回声 | `p8_route_demonic`, `demonic_path_touched` |
| 少年越界入门 | `outlaw_identity_beginning` | identity-demon | 15–25 | `route_demonic`, `outlaw_identity_done` |
| 少年修炼/任务 | `outlaw_cultivation`, `outlaw_mission` | identity-demon | 16–35 | 邪路修炼与任务选择 |
| 青年诱惑/崛起 | `outlaw_rise`, `outlaw_final_choice` | identity-demon | 25–55 | `demonic_leader`, 底线/彻底分支 |
| 青年高收益诱惑 | `demonic_midlife_expansion`（含 territory/secret_art/consolidate 三分叉） | identity-demon | 31–38 | `demonic_midlife_expansion_*` |
| 中年代价回流 | `demonic_midlife_isolation_*`, `demonic_midlife_betrayal` | identity-demon | 33–45 | 关系/名声/背叛代价 |
| 40 岁附近分叉 | `demonic_midlife_fork`（redemption/escalate/balance） | identity-demon | 38–48 | `demonic_fork_*` |

### 4.2 缺失节点

| 缺失项 | 说明 | 优先级 |
|--------|------|--------|
| 童年偏执/狠劲专用种子 | 无 preschool-passive-spine 级 demonic 标签事件；依赖 p9 回声 hook | P47 配置 |
| 少年第一次越界（样本线专节点） | `outlaw_identity_beginning` 在 15 岁，缺 13–14 轻量越界 preview | P47 配置 |
| 0–40 age-40 identity summary hook | 无专用 `demonic_age40_identity_summary` | P47 配置 |
| 底线型 vs 彻底沉沦分支文档化 | 内容有 partial/refuse 分支，但未作为样本线 spine 显式标注 | P47 配置 |

## 5. 商路崛起（Merchant Rise）锚点 Inventory

### 5.1 已存在锚点

| 生命阶段 | 事件/锚点 ID | 文件 | 年龄 | 关键 flags / routePoints |
|----------|-------------|------|------|--------------------------|
| 童年种子 | `preschool_merchant_first_coin`, `preschool_merchant_ledger_peek`, `preschool_merchant_caravan_news` | preschool-passive-spine | 7–13 | originTags: merchant |
| 童年天赋发现 | `merchant_talent_discovery` | merchant | 8–16 | `merchant_talent` |
| 少年第一桶金 | `merchant_first_shop`（grocery/weapon/herb 三分叉） | merchant | 16–22 | `merchant_shop_*` |
| 少年失败回流 | `merchant_shop_failure` | merchant | 17–24 | `merchant_shop_failed` |
| 青年商队/垄断分岔 | `merchant_caravan_guard`, `merchant_market_monopoly` | merchant | 18–30 | `merchant_caravan_success`, `merchant_monopoly` / `merchant_fair_trade` |
| 青年投资分岔 | `merchant_sect_investment`（good/evil/both） | merchant | 30–40 | `merchant_invest_*` |
| 中年路径 | `p9_merchant_midlife_caravan`（caravan_master/investor） | p9-remediation | midlife | `p9_merchant_midlife_path` |
| identity 链 | `merchant_first_trade`, `merchant_expand_business`, `merchant_crisis` | identity-merchant | 20–45 | identity: merchant |

### 5.2 缺失节点

| 缺失项 | 说明 | 优先级 |
|--------|------|--------|
| `route_merchant` 同级 route flag | 商路无统一 route flag，依赖 `merchant_talent` + identity 条件 | P47 配置 |
| 中年财富/义气冲突专节点 | `merchant_crisis` 在 identity-merchant 30+，未与 0–40 样本 spine 对齐 | P47 配置 |
| 0–40 age-40 identity summary hook | **缺失**；最近节点 `merchant_sect_investment` 在 30–40，无 40 岁收束 | P47 配置 |
| 中期身份信号（样本线级） | 缺专用 route signal / life-memory 写入点 | P48 展示 |

## 6. 已存在 / 缺失对照总表

| 节点类型 | 正派武道 | 邪路偏锋 | 商路崛起 |
|----------|----------|----------|----------|
| 童年种子 | 有（未绑 route） | 弱（p9 回声） | 有 |
| 少年首次认可/越界/第一桶金 | 有（13+ 试炼） | 有（15+ 入门） | 有（16 开店） |
| 青年入门/立志/诱惑 | 有 | 有 | 有 |
| 青年关键选择（≥2） | 有（试炼/守正） | 有（加入/崛起/扩张） | 有（店铺/商队/投资） |
| 代价回流（≥1） | 有（gray_mission） | 有（isolation/betrayal） | 有（shop_failure） |
| 中年代价钩子 | 有（sect midlife 链） | 有（demonic midlife 链） | 弱（p9 midlife 部分） |
| 40 岁身份总结钩子 | 弱 | 弱 | **缺失** |
| route flag 续链 | `route_orthodox` 明确 | `route_demonic` 明确 | **无统一 route flag** |

## 7. P47 配置阶段建议优先补齐项

1. 为三条线各定义 age-40 identity summary hook（配置规格见 P47 PRD §16）
2. 商路补 `route_merchant`（或等价 routePoint）与 0–40 续链条件
3. 童年种子与样本线路由 flag 的显式 wiring（§17）
4. 将现有 midlife 链标注为样本线 spine 的正式节点，而非散落事件

## 8. 审计结论

三条样本线均具备**可复用的青年至中年内容锚点**，但 0–40 样本线 spine 尚未在文档与 flag 续链层收口：童年绑定弱、商路缺 40 岁钩子、三线均缺专用 age-40 identity summary routePoint。P47 后续配置实施应优先补齐 §10–§17 规格中的缺失节点，而非新建平行内容体系。
