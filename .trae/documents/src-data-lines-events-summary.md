# src/data/lines 事件详细总结

## 目录结构

该目录包含 13 个 JSON 文件，存储了武侠人生游戏的各类事件数据：

### 空文件
- `buddhist.json` - 佛门路线事件（空）
- `demonic.json` - 魔教路线事件（空）
- `orthodox.json` - 正道路线事件（空）

### 含事件的文件

## 一、origin.json - 出身背景事件（1 个事件）

### 核心事件：出身背景选择
- **触发年龄**: 1 岁
- **事件类型**: choice（选择事件）
- **四个出身选项**:
  1. **武林世家**: 武力 +5, 外功 +4, 体质 +6
  2. **书香门第**: 内功 +4, 悟性 +8, 侠义 +4
  3. **商贾之家**: 金钱 +200, 魅力 +6
  4. **边疆异族**: 外功 +5, 轻功 +4, 体质 +4, 侠义 -2

---

## 二、general.json - 通用主线事件（28 个事件）

### 童年阶段（0-8 岁）
1. **birth_wuxia_family** - 降生武侠世家（自动事件）
2. **birth_with_phenomenon** - 天降异象（25% 概率，内功 +5）
3. **toddler_exploration** - 探索小能手（1 岁，轻功 +1）
4. **clever_speech** - 伶牙俐齿（3 岁，魅力 +2）
5. **childhood_preference** - 童年选择（4 岁，三选一）:
   - 专心读书练功（需侠义≥10）
   - 继续玩耍探索
   - 尝试平衡两者（需魅力≥15）
6. **childhood_summary** - 童年总结（8-12 岁）

### 青年阶段（13-18 岁）
7. **youth_begins** - 少年初长成（13 岁）
8. **sect_choice** - 门派选择（14 岁，四选一）:
   - 少林派（外功≥15）
   - 武当派（内功≥15）
   - 峨眉派（轻功≥15）
   - 留家修炼
9. **sect_trial_entry** - 入门试炼（14-17 岁，六选二）
10. **sect_trial_followup** - 试炼进阶
11. **sect_trial_recover** - 试炼养伤
12. **sect_trial_final** - 试炼终章
13. **jianghu_experience** - 江湖历练（16 岁）
14. **meet_love_interest** - 初遇意中人（17 岁，40% 概率）
15. **youth_fame** - 青年成名（18 岁，需武力≥50）
16. **martial_arts_invitation** - 武林大会邀请（18 岁，三选一）

### 成年阶段（19-35 岁）
17. **martial_arts_beginner** - 武林大会初试（19 岁）
18. **martial_arts_observer** - 武林大会观战（19 岁）
19. **fame_rising** - 江湖扬名（23 岁，需武力≥80）
20. **grudge_and_affection** - 恩怨情仇（25 岁，三选一）
21. **sect_contribution** - 门派贡献（29 岁，需为门派弟子）
22. **independent_path** - 独立门户（31 岁，需武力≥120，三选一）:
   - 创立门派（需魅力≥80, 武力≥140）
   - 成为自由江湖客
   - 为朝廷效力（需侠义≥70）
23. **martial_legacy** - 武学传承（35 岁，三选一）
24. **middle_age_summary** - 中年总结（35 岁）

### 中老年阶段（40-80 岁）
25. **sect_establishment** - 开宗立派（40 岁，需为门派创始人）
26. **disciples_everywhere** - 桃李满天下（45 岁）
27. **status_consolidation** - 江湖地位巩固（50 岁，需武力≥180）
28. **retirement** - 归隐田园（55 岁，三选一）
29. **martial_summary** - 武学总结（60 岁）
30. **family_happiness** - 天伦之乐（65 岁，需有道侣）

### 结局事件（4 种）
31. **legendary_life** - 传奇人生（70 岁，需武力≥250, 魅力≥100, 传奇状态）
32. **peaceful_old_age** - 幸福晚年（75 岁，需平静生活 + 家庭幸福）
33. **martial_master** - 武学宗师（78 岁，需建立门派 + 传承稳固）
34. **ordinary_life** - 平凡一生（80 岁，默认结局）

---

## 三、love.json - 爱情线事件（17 个事件）

### 爱情发展阶段
1. **love_first_meet** - 初遇（15-20 岁，需魅力≥12）
2. **love_shared_mission** - 并肩同行（16-22 岁）
3. **love_family_obstacle** - 家族阻碍（17-23 岁，二选一）
4. **love_rival_appears** - 情敌出现（18-24 岁，二选一）
5. **love_separation** - 别离（19-26 岁）
6. **love_reunion** - 重逢（20-28 岁，二选一）
7. **love_misunderstanding** - 误会（18-24 岁，二选一）
8. **love_secret_help** - 暗中相助（19-26 岁）
9. **love_life_or_death** - 生死相救（20-28 岁，二选一）
10. **love_family_reconcile** - 家族和解（21-30 岁）

### 爱情结局（5 种）
11. **love_ending_good** - 良缘（24-35 岁，美好结局）
12. **love_ending_sad** - 缘尽（24-35 岁，悲伤结局）
13. **love_ending_sacrifice** - 殉情（22-35 岁）
14. **love_ending_hideaway** - 隐居（23-36 岁）
15. **love_hideaway_pull** - 隐居牵扯（24-36 岁，二选一）

### 特殊联动
16. **love_demonic_conflict** - 情与立场（19-30 岁，魔教路线专属）

---

## 四、official.json - 官场线事件（3 个事件）

1. **official_entry** - 入仕机会（16-22 岁，需悟性≥12）
2. **official_first_post** - 初任官职（18-26 岁）
3. **official_love_obstacle** - 仕途与爱情（19-30 岁，与爱情线联动）

---

## 五、sect-beggars.json - 丐帮路线事件（15 个事件）

### 入门阶段
1. **beggars_encounter** - 丐帮相逢（14-20 岁，需侠义≥12 或轻功≥10）
2. **beggars_trial_entry** - 丐帮试炼（14-22 岁，三选一）
3. **beggars_trial_followup** - 丐帮行脚

### 发展阶段
4. **beggars_rumor_network** - 丐帮耳目（16-28 岁）
5. **beggars_internal_strife** - 帮内纷争（18-30 岁，三选一）
6. **beggars_assembly** - 丐帮大会（19-30 岁，三选一）
7. **beggars_inheritance** - 帮主传功（20-32 岁，二选一）
8. **beggars_official_tension** - 官府施压（20-34 岁，二选一）
9. **beggars_tenacity** - 风雨同舟（22-36 岁）

### 丐帮结局（4 种）
10. **beggars_ending** - 丐帮中坚（24-40 岁）
11. **beggars_ending_leader** - 帮主继位（26-45 岁）
12. **beggars_ending_retire** - 退隐市井（26-45 岁）
13. **beggars_ending_official** - 官府协办（26-45 岁）
14. **beggars_ending_wanderer** - 江湖独行（26-45 岁）

---

## 六、sect-border.json - 边地异族路线事件（14 个事件）

### 入门阶段
1. **border_encounter** - 边地奇缘（15-24 岁，需轻功≥12 或悟性≥12）
2. **border_trial_entry** - 边地试炼（15-26 岁，三选一）
3. **border_trial_followup** - 边地巡行

### 发展阶段
4. **border_clan_conflict** - 部族纷争（18-32 岁，三选一）
5. **border_trade_route** - 互市通道（17-30 岁，二选一）
6. **border_alliance** - 部族盟约（19-32 岁，三选一）
7. **border_crisis** - 边关危机（21-36 岁，三选一）
8. **border_reconciliation** - 旧怨调停（22-38 岁）

### 边地结局（4 种）
9. **border_ending** - 边关使者（25-40 岁）
10. **border_ending_commander** - 边关统领（26-45 岁，需武力路线）
11. **border_ending_merchant** - 商盟盟主（26-45 岁，需商路路线）
12. **border_ending_envoy** - 和亲使者（26-45 岁，需盟约路线）
13. **border_ending_home** - 归隐故乡（26-45 岁）

---

## 七、sect-marginal.json - 幽影门（魔教）路线事件（19 个事件）

### 入门阶段
1. **demonic_encounter** - 幽影门奇遇（14-17 岁，需侠义≤30 或流浪路线）
2. **demonic_trial** - 幽影门试炼（14-16 岁）
3. **demonic_trial_shadow** - 暗影试炼（14-18 岁，三选一）
4. **demonic_trial_blood** - 血影试炼
5. **demonic_trial_recover** - 幽影门疗伤
6. **demonic_trial_completion** - 试炼完成

### 权斗阶段
7. **demonic_power_struggle** - 权位暗涌（16-25 岁，二选一）
8. **demonic_usurpation** - 夺位之夜（17-30 岁，二选一）
9. **demonic_renounce_path** - 退隐修行（17-28 岁）
10. **demonic_aftermath** - 权斗余波（18-35 岁，二选一）

### 救赎阶段
11. **demonic_redemption_offer** - 改过契机（18-35 岁，二选一）
12. **demonic_redemption_test** - 赎罪试炼（18-35 岁，二选一）
13. **demonic_redemption_ending** - 浪子回头（20-40 岁）
14. **demonic_redemption_audit** - 清查（20-40 岁，二选一）
15. **demonic_redemption_chase** - 亡命天涯

### 魔教结局（3 种）
16. **demonic_ending_rule** - 幽影门之主（25-45 岁）
17. **demonic_ending_exile** - 隐退江湖（25-45 岁）
18. **demonic_ending_purge** - 清算覆灭（25-45 岁）

---

## 八、training.json - 修炼事件（8 个事件）

### 基础修炼
1. **martial_arts_enlightenment** - 武学启蒙（6 岁，五选一）
   - 专注外功（需勤奋学生）
   - 注重内功（需天降异象）
   - 专修轻功（需自由灵魂/好奇孩童）
   - 全面发展（需平衡路线）
   - 常规修炼

### 进阶修炼
2. **sect_trial** - 门派试炼（15 岁，三选一）
3. **martial_improvement** - 武艺精进（17 岁，无爱情线时触发）
4. **training_focus** - 修炼抉择（15-17 岁，三选一）

### 突破事件
5. **comprehension_breakthrough** - 悟性突破（15-18 岁，需悟性≥30）
6. **constitution_breakthrough** - 体魄突破（15-18 岁，需体质≥30）
7. **continued_journey** - 江湖历练继续（19 岁）
8. **martial_peak** - 武学巅峰（33 岁，需武力≥150）

---

## 事件类型分类

### 按触发方式
- **choice**: 选择事件（需要玩家做出选择）
- **auto**: 自动事件（自动触发并应用效果）
- **ending**: 结局事件（触发游戏结局）

### 按事件类别
- **main_story**: 主线事件（推动主要剧情）
- **side_quest**: 支线事件（可选剧情）
- **special_event**: 特殊事件（突破、奇遇等）
- **daily_event**: 日常事件
- **ending**: 结局事件

### 按路线分类
- **通用路线**: general.json, training.json, origin.json
- **爱情路线**: love.json
- **官场路线**: official.json
- **丐帮路线**: sect-beggars.json
- **边地路线**: sect-border.json
- **魔教路线**: sect-marginal.json
- **佛门路线**: buddhist.json（空）
- **正道路线**: orthodox.json（空）
- **邪道路线**: demonic.json（空）

---

## 核心属性系统

事件中涉及的属性包括：
- **martialPower**: 武力
- **externalSkill**: 外功
- **internalSkill**: 内功
- **qinggong**: 轻功
- **constitution**: 体质
- **comprehension**: 悟性
- **charisma**: 魅力
- **chivalry**: 侠义
- **health**: 健康
- **money**: 金钱
- **reputation**: 名声

---

## 事件触发机制

### 触发条件类型
1. **age_reach**: 年龄达到指定值
2. **expression**: 表达式判断（如属性值、flag 状态）
3. **random**: 概率触发

### 效果类型
1. **stat_modify**: 属性修改（add/subtract）
2. **flag_set**: 设置标记
3. **flag_unset**: 移除标记
4. **time_advance**: 时间推进
5. **relation_change**: 关系变化
6. **event_record**: 事件记录

---

## 总结

该目录共包含 **105+ 个事件**，覆盖了一个武侠人生的完整历程：
- **出身选择** → **童年成长** → **门派抉择** → **江湖历练** → **中年发展** → **老年结局**
- 多条路线并行：正道、魔教、丐帮、边地、官场、爱情、佛门等
- 丰富的选择分支和结局变化
- 属性、标记、关系系统相互关联
- 事件之间通过 conditions 和 flags 形成复杂的依赖关系
