# 30 岁以后事件补充计划

**制定时间**: 2026-03-14  
**目标**: 补充 30-70 岁年龄段的事件，完善人生体验  
**优先级**: 高

---

## 📊 现状分析

### 当前事件分布
```
0-18 岁：成长期（教程 + 修炼） - 12 个事件 ✅
19-25 岁：爱情线（完整剧情） - 10 个事件 ✅
26-30 岁：边地线/官场线 - 16 个事件 ✅
31-54 岁：中年期 - 仅 1 个事件 ❌
55-70 岁：老年期 - 仅 1 个事件 ❌
```

### 问题
- 30-70 岁空白期长达 40 年
- 缺少事业发展、家庭生活、江湖地位等内容
- 人生体验不完整

---

## 🎯 补充目标

### 第一阶段：中年事业线（30-45 岁）

**目标**: 实现事业巅峰，建立江湖地位

#### 30-35 岁：事业起步
- 开宗立派（创建自己的门派）
- 武学创新（自创武功）
- 招收弟子（培养传人）
- 江湖扬名（参加武林大会）

#### 36-40 岁：事业发展
- 门派壮大（扩建山门）
- 武学交流（与其他门派切磋）
- 江湖调解（调解门派纷争）
- 著书立说（撰写武学著作）

#### 41-45 岁：事业巅峰
- 武林盟主（当选盟主）
- 正邪大战（对抗魔教）
- 江湖声望（达到巅峰）
- 衣钵传人（选定继承人）

**预计事件数**: 12-16 个

---

### 第二阶段：家庭生活线（28-50 岁）

**目标**: 体验家庭生活，培养下一代

#### 28-32 岁：成家立业
- 喜得贵子（第一个孩子）
- 子女教育（选择培养方向）
- 家庭和睦（处理家庭关系）
- 家族危机（应对家族困难）

#### 33-40 岁：子女成长
- 子女习武（指导子女练功）
- 子女求学（送子女读书）
- 子女叛逆（处理叛逆期）
- 子女成家（为子女操办婚事）

#### 41-50 岁：子孙满堂
- 喜得孙儿（第三代出生）
- 家族团圆（家庭聚会）
- 家风传承（传授家训）
- 家族荣耀（子女有出息）

**预计事件数**: 12-16 个

---

### 第三阶段：江湖纷争线（33-50 岁）

**目标**: 体验江湖恩怨，维护正义

#### 33-37 岁：江湖挑战
- 武林大会（参加比武）
- 高手挑战（接受挑战）
- 门派恩怨（调解或参战）
- 正邪对立（对抗邪教）

#### 38-45 岁：江湖责任
- 武林盟主（担任盟主）
- 江湖救急（救援同道）
- 铲除魔教（剿灭邪教）
- 武林公敌（被误解或陷害）

#### 46-50 岁：江湖传说
- 江湖传说（成为传说）
- 隐世高手（与隐士切磋）
- 最后的心愿（完成心愿）
- 江湖告别（告别江湖）

**预计事件数**: 12-16 个

---

### 第四阶段：老年传承线（50-70 岁）

**目标**: 传承武学，圆满人生

#### 50-55 岁：归隐准备
- 整理武学（整理毕生所学）
- 选择传人（选定衣钵传人）
- 归隐田园（准备归隐）
- 告别江湖（告别朋友）

#### 56-62 岁：归隐生活
- 田园生活（享受宁静）
- 著书立说（撰写回忆录）
- 故人重逢（老友来访）
- 传授绝学（传授给传人）

#### 63-70 岁：圆满人生
- 病中嘱托（临终嘱托）
- 衣钵传承（正式传承）
- 回顾一生（回忆录完成）
- 圆满谢幕（安详离世）

**预计事件数**: 12-16 个

---

## 📝 详细事件设计

### 一、中年事业线事件

#### 30-35 岁：事业起步

**1. 开宗立派 (age 30-32)**
```json
{
  "id": "career_found_sect",
  "name": "开宗立派",
  "ageRange": { "min": 30, "max": 35 },
  "priority": 80,
  "content": {
    "title": "开宗立派",
    "text": "经过多年的历练，你已学有所成。是时候开宗立派，将你的武学传承下去了。",
    "choices": [
      {
        "text": "创建门派 (财富 -100, 声望 +20)",
        "effects": [
          { "type": "add_stats", "stats": { "reputation": 20 } },
          { "type": "add_stats", "stats": { "wealth": -100 } },
          { "type": "set_flag", "flag": "has_own_sect", "value": true }
        ]
      },
      {
        "text": "继续游历，暂不考虑",
        "effects": []
      }
    ]
  }
}
```

**2. 武学创新 (age 32-35)**
```json
{
  "id": "career_martial_innovation",
  "name": "武学创新",
  "ageRange": { "min": 32, "max": 35 },
  "triggerConditions": {
    "flags": { "required": ["has_own_sect"] }
  },
  "content": {
    "title": "武学创新",
    "text": "在传授弟子的过程中，你对武学有了新的理解，决定自创一套武功。",
    "choices": [
      {
        "text": "闭关创作 (功力 +10, 外功 +10, 内功 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "martialPower": 10, "externalSkill": 10, "internalSkill": 10 } }
        ]
      },
      {
        "text": "参考古籍，稳步创新 (学识 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "knowledge": 5 } }
        ]
      }
    ]
  }
}
```

**3. 招收弟子 (age 30-35)**
```json
{
  "id": "career_recruit_disciples",
  "name": "招收弟子",
  "ageRange": { "min": 30, "max": 35 },
  "triggerConditions": {
    "flags": { "required": ["has_own_sect"] }
  },
  "content": {
    "title": "招收弟子",
    "text": "你的门派初建，需要招收弟子来传承武学。",
    "choices": [
      {
        "text": "严格筛选，只收天才弟子 (声望 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "reputation": 10 } },
          { "type": "set_flag", "flag": "has_disciples", "value": true }
        ]
      },
      {
        "text": "有教无类，广收门徒 (财富 +50)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": 50 } },
          { "type": "set_flag", "flag": "has_disciples", "value": true }
        ]
      }
    ]
  }
}
```

**4. 武林大会 (age 33-37)**
```json
{
  "id": "career_martial_arts_conference",
  "name": "武林大会",
  "ageRange": { "min": 33, "max": 37 },
  "priority": 85,
  "content": {
    "title": "武林大会",
    "text": "五年一度的武林大会即将召开，各路英雄豪杰都将参加。",
    "choices": [
      {
        "text": "参加比武，争夺盟主 (武力检定)",
        "effects": [
          { "type": "random_outcome", "success": { "reputation": 50 }, "failure": { "reputation": -10 } }
        ]
      },
      {
        "text": "作为观众，观摩学习 (外功 +5, 内功 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "externalSkill": 5, "internalSkill": 5 } }
        ]
      }
    ]
  }
}
```

#### 36-40 岁：事业发展

**5. 门派壮大 (age 36-40)**
```json
{
  "id": "career_sect_expansion",
  "name": "门派壮大",
  "ageRange": { "min": 36, "max": 40 },
  "triggerConditions": {
    "flags": { "required": ["has_own_sect", "has_disciples"] }
  },
  "content": {
    "title": "门派壮大",
    "text": "你的门派发展迅速，需要扩建山门以容纳更多弟子。",
    "choices": [
      {
        "text": "大规模扩建 (财富 -200, 声望 +30)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -200, "reputation": 30 } }
        ]
      },
      {
        "text": "稳步发展，量力而行 (财富 -50)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -50 } }
        ]
      }
    ]
  }
}
```

**6. 武学交流 (age 35-40)**
```json
{
  "id": "career_martial_exchange",
  "name": "武学交流",
  "ageRange": { "min": 35, "max": 40 },
  "triggerConditions": {
    "flags": { "required": ["has_own_sect"] }
  },
  "content": {
    "title": "武学交流",
    "text": "其他门派前来交流武学，这是互相学习的好机会。",
    "choices": [
      {
        "text": "倾囊相授，友好交流 (人脉 +20, 外功 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "connections": 20, "externalSkill": 5 } }
        ]
      },
      {
        "text": "保留绝学，只作表面交流",
        "effects": []
      }
    ]
  }
}
```

**7. 江湖调解 (age 38-42)**
```json
{
  "id": "career_mediate_conflict",
  "name": "江湖调解",
  "ageRange": { "min": 38, "max": 42 },
  "priority": 75,
  "content": {
    "title": "江湖调解",
    "text": "两个门派发生冲突，邀请你出面调解。",
    "choices": [
      {
        "text": "出面调解，化解恩怨 (声望 +30, 人脉 +20)",
        "effects": [
          { "type": "add_stats", "stats": { "reputation": 30, "connections": 20 } }
        ]
      },
      {
        "text": "拒绝介入，明哲保身",
        "effects": []
      }
    ]
  }
}
```

**8. 著书立说 (age 40-45)**
```json
{
  "id": "career_write_book",
  "name": "著书立说",
  "ageRange": { "min": 40, "max": 45 },
  "triggerConditions": {
    "stats": { "knowledge": { "min": 50 } }
  },
  "content": {
    "title": "著书立说",
    "text": "你决定将毕生所学整理成书，流传后世。",
    "choices": [
      {
        "text": "撰写武学秘籍 (学识 +20, 声望 +30)",
        "effects": [
          { "type": "add_stats", "stats": { "knowledge": 20, "reputation": 30 } },
          { "type": "set_flag", "flag": "wrote_martial_book", "value": true }
        ]
      },
      {
        "text": "撰写回忆录 (学识 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "knowledge": 10 } }
        ]
      }
    ]
  }
}
```

#### 41-45 岁：事业巅峰

**9. 武林盟主 (age 42-48)**
```json
{
  "id": "career_sect_leader",
  "name": "武林盟主",
  "ageRange": { "min": 42, "max": 48 },
  "priority": 90,
  "triggerConditions": {
    "stats": { "reputation": { "min": 80 }, "martialPower": { "min": 70 } },
    "flags": { "required": ["has_own_sect"] }
  },
  "content": {
    "title": "武林盟主",
    "text": "你的声望和武艺得到了武林公认，被推举为武林盟主。",
    "choices": [
      {
        "text": "接受推举，领导武林 (声望 +50, 人脉 +50)",
        "effects": [
          { "type": "add_stats", "stats": { "reputation": 50, "connections": 50 } },
          { "type": "set_flag", "flag": "is_sect_leader", "value": true }
        ]
      },
      {
        "text": "婉拒，专心门派事务",
        "effects": []
      }
    ]
  }
}
```

**10. 正邪大战 (age 45-50)**
```json
{
  "id": "career_good_evil_war",
  "name": "正邪大战",
  "ageRange": { "min": 45, "max": 50 },
  "priority": 95,
  "triggerConditions": {
    "flags": { "required": ["is_sect_leader"] }
  },
  "content": {
    "title": "正邪大战",
    "text": "魔教卷土重来，武林面临浩劫。作为盟主，你必须领导正道武林对抗魔教。",
    "choices": [
      {
        "text": "亲征魔教，誓死一战 (武力检定，成功则声望 +100)",
        "effects": [
          { "type": "random_outcome", 
            "success": { "reputation": 100, "chivalry": 50 },
            "failure": { "martialPower": -20, "reputation": -30 }
          }
        ]
      },
      {
        "text": "派遣弟子出征",
        "effects": []
      }
    ]
  }
}
```

---

### 二、家庭生活线事件

#### 28-32 岁：成家立业

**11. 喜得贵子 (age 28-32)**
```json
{
  "id": "family_child_born",
  "name": "喜得贵子",
  "ageRange": { "min": 28, "max": 32 },
  "triggerConditions": {
    "flags": { "required": ["married"] }
  },
  "content": {
    "title": "喜得贵子",
    "text": "你的孩子出生了，全家都沉浸在喜悦之中。",
    "choices": [
      {
        "text": "大摆宴席，普天同庆 (财富 -50, 人脉 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -50, "connections": 10 } },
          { "type": "set_flag", "flag": "has_child", "value": true }
        ]
      },
      {
        "text": "简单庆祝，低调行事 (财富 -10)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -10 } },
          { "type": "set_flag", "flag": "has_child", "value": true }
        ]
      }
    ]
  }
}
```

**12. 子女教育 (age 32-38)**
```json
{
  "id": "family_child_education",
  "name": "子女教育",
  "ageRange": { "min": 32, "max": 38 },
  "triggerConditions": {
    "flags": { "required": ["has_child"] }
  },
  "content": {
    "title": "子女教育",
    "text": "孩子到了学习的年龄，你需要决定他的培养方向。",
    "choices": [
      {
        "text": "习武：传承你的武学 (外功 +5, 内功 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "externalSkill": 5, "internalSkill": 5 } },
          { "type": "set_flag", "flag": "child_martial", "value": true }
        ]
      },
      {
        "text": "读书：考取功名 (学识 +10, 人脉 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "knowledge": 10, "connections": 10 } },
          { "type": "set_flag", "flag": "child_scholar", "value": true }
        ]
      },
      {
        "text": "从商：继承家业 (财富 +50)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": 50 } },
          { "type": "set_flag", "flag": "child_merchant", "value": true }
        ]
      }
    ]
  }
}
```

**13. 家族危机 (age 35-40)**
```json
{
  "id": "family_crisis",
  "name": "家族危机",
  "ageRange": { "min": 35, "max": 40 },
  "priority": 70,
  "content": {
    "title": "家族危机",
    "text": "家族遭遇困难，需要你出面解决。",
    "choices": [
      {
        "text": "倾尽家财，帮助家族 (财富 -100, 声望 +20)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -100, "reputation": 20 } }
        ]
      },
      {
        "text": "尽力而为，量力而行 (财富 -30)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -30 } }
        ]
      }
    ]
  }
}
```

#### 41-50 岁：子孙满堂

**14. 子女成家 (age 40-48)**
```json
{
  "id": "family_child_marriage",
  "name": "子女成家",
  "ageRange": { "min": 40, "max": 48 },
  "triggerConditions": {
    "flags": { "required": ["has_child"] }
  },
  "content": {
    "title": "子女成家",
    "text": "孩子长大了，到了成家的年龄。",
    "choices": [
      {
        "text": "操办婚事，风光大嫁 (财富 -100, 人脉 +20)",
        "effects": [
          { "type": "add_stats", "stats": { "wealth": -100, "connections": 20 } }
        ]
      },
      {
        "text": "简办婚事，尊重子女",
        "effects": []
      }
    ]
  }
}
```

**15. 喜得孙儿 (age 45-55)**
```json
{
  "id": "family_grandchild_born",
  "name": "喜得孙儿",
  "ageRange": { "min": 45, "max": 55 },
  "triggerConditions": {
    "flags": { "required": ["child_married"] }
  },
  "content": {
    "title": "喜得孙儿",
    "text": "你当爷爷奶奶了，子孙满堂，人生圆满。",
    "choices": [
      {
        "text": "疼爱孙儿，享受天伦之乐 (幸福 +50)",
        "effects": [
          { "type": "set_flag", "flag": "has_grandchild", "value": true }
        ]
      },
      {
        "text": "传授孙儿武学 (外功 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "externalSkill": 5 } }
        ]
      }
    ]
  }
}
```

---

### 三、老年传承线事件

#### 50-55 岁：归隐准备

**16. 整理武学 (age 50-55)**
```json
{
  "id": "elderly_organize_martial",
  "name": "整理武学",
  "ageRange": { "min": 50, "max": 55 },
  "content": {
    "title": "整理武学",
    "text": "年事已高，你决定整理毕生所学，以免失传。",
    "choices": [
      {
        "text": "系统整理，著书立说 (学识 +20, 声望 +20)",
        "effects": [
          { "type": "add_stats", "stats": { "knowledge": 20, "reputation": 20 } }
        ]
      },
      {
        "text": "口传心授，传给弟子",
        "effects": []
      }
    ]
  }
}
```

**17. 选择传人 (age 52-58)**
```json
{
  "id": "elderly_choose_successor",
  "name": "选择传人",
  "ageRange": { "min": 52, "max": 58 },
  "priority": 85,
  "content": {
    "title": "选择传人",
    "text": "你需要选择一个传人来继承你的衣钵。",
    "choices": [
      {
        "text": "传给最有天赋的弟子 (外功 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "externalSkill": 10 } },
          { "type": "set_flag", "flag": "has_successor", "value": true }
        ]
      },
      {
        "text": "传给最孝顺的弟子 (侠义 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "chivalry": 10 } },
          { "type": "set_flag", "flag": "has_successor", "value": true }
        ]
      },
      {
        "text": "传给子女",
        "effects": [
          { "type": "set_flag", "flag": "has_successor", "value": true }
        ]
      }
    ]
  }
}
```

#### 56-62 岁：归隐生活

**18. 田园生活 (age 56-62)**
```json
{
  "id": "elderly_retirement_life",
  "name": "田园生活",
  "ageRange": { "min": 56, "max": 62 },
  "triggerConditions": {
    "flags": { "required": ["retired"] }
  },
  "content": {
    "title": "田园生活",
    "text": "归隐田园，远离江湖纷争，享受宁静生活。",
    "choices": [
      {
        "text": "种花养草，修身养性 (体魄 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "constitution": 5 } }
        ]
      },
      {
        "text": "品茶论道，会友聊天 (人脉 +5)",
        "effects": [
          { "type": "add_stats", "stats": { "connections": 5 } }
        ]
      }
    ]
  }
}
```

**19. 故人重逢 (age 58-65)**
```json
{
  "id": "elderly_reunion",
  "name": "故人重逢",
  "ageRange": { "min": 58, "max": 65 },
  "content": {
    "title": "故人重逢",
    "text": "多年未见的老友前来拜访，回忆往昔岁月。",
    "choices": [
      {
        "text": "把酒言欢，畅谈往事 (人脉 +10)",
        "effects": [
          { "type": "add_stats", "stats": { "connections": 10 } }
        ]
      },
      {
        "text": "感慨万千，珍惜当下",
        "effects": []
      }
    ]
  }
}
```

#### 63-70 岁：圆满人生

**20. 衣钵传承 (age 65-70)**
```json
{
  "id": "elderly_succession",
  "name": "衣钵传承",
  "ageRange": { "min": 65, "max": 70 },
  "priority": 100,
  "triggerConditions": {
    "flags": { "required": ["has_successor"] }
  },
  "content": {
    "title": "衣钵传承",
    "text": "你决定正式将衣钵传给选定的人。",
    "choices": [
      {
        "text": "举行传承仪式 (声望 +30)",
        "effects": [
          { "type": "add_stats", "stats": { "reputation": 30 } },
          { "type": "set_flag", "flag": "succession_completed", "value": true }
        ]
      },
      {
        "text": "简单传授，顺其自然",
        "effects": [
          { "type": "set_flag", "flag": "succession_completed", "value": true }
        ]
      }
    ]
  }
}
```

**21. 回顾一生 (age 68-75)**
```json
{
  "id": "elderly_life_review",
  "name": "回顾一生",
  "ageRange": { "min": 68, "max": 75 },
  "priority": 95,
  "content": {
    "title": "回顾一生",
    "text": "回首往事，你的一生充满了传奇色彩。",
    "choices": [
      {
        "text": "无怨无悔，心满意足 (圆满结局)",
        "effects": [
          { "type": "set_flag", "flag": "life_fulfilled", "value": true }
        ]
      },
      {
        "text": "仍有遗憾，希望来生",
        "effects": []
      }
    ]
  }
}
```

**22. 圆满谢幕 (age 70-80)**
```json
{
  "id": "elderly_final_ending",
  "name": "圆满谢幕",
  "ageRange": { "min": 70, "max": 80 },
  "priority": 100,
  "triggerConditions": {
    "flags": { "required": ["life_fulfilled"] }
  },
  "isEnding": true,
  "content": {
    "title": "圆满谢幕",
    "text": "在一个平静的午后，你安详地闭上了眼睛。你的一生，是传奇的一生，是奋斗的一生，是无悔的一生。你的故事，将在江湖中流传。",
    "choices": [
      {
        "text": "【游戏结束】",
        "effects": [
          { "type": "end_game", "ending": "perfect_life" }
        ]
      }
    ]
  }
}
```

---

## 📊 实施计划

### Phase 1: 中年事业线 (优先级：高)
- [ ] 创建文件：`src/data/lines/middle-age-career.json`
- [ ] 实现 10-12 个事件
- [ ] 添加触发条件和效果
- **预计工作量**: 4-6 小时

### Phase 2: 家庭生活线 (优先级：高)
- [ ] 创建文件：`src/data/lines/family-life.json`
- [ ] 实现 10-12 个事件
- [ ] 添加子女系统
- **预计工作量**: 4-6 小时

### Phase 3: 江湖纷争线 (优先级：中)
- [ ] 创建文件：`src/data/lines/jianghu-conflict.json`
- [ ] 实现 10-12 个事件
- [ ] 添加声望系统
- **预计工作量**: 4-6 小时

### Phase 4: 老年传承线 (优先级：中)
- [ ] 创建文件：`src/data/lines/elderly-legacy.json`
- [ ] 实现 10-12 个事件
- [ ] 添加传承系统
- [ ] 添加多种结局
- **预计工作量**: 6-8 小时

### Phase 5: 测试与优化 (优先级：高)
- [ ] 运行模拟测试 (0-80 岁)
- [ ] 验证事件触发合理性
- [ ] 平衡事件密度
- [ ] 修复 bug
- **预计工作量**: 4-6 小时

---

## 📈 预期效果

### 事件分布改进后
```
0-18 岁：12 个事件 ✅
19-25 岁：10 个事件 ✅
26-30 岁：16 个事件 ✅
31-45 岁：12-16 个事件 ✅ (新增)
46-55 岁：10-12 个事件 ✅ (新增)
56-70 岁：10-12 个事件 ✅ (新增)
71-80 岁：2-4 个事件 (结局) ✅ (新增)
```

### 人生体验完整度
- **事业发展**: 从创建门派到武林盟主 ✅
- **家庭生活**: 从结婚生子到子孙满堂 ✅
- **江湖地位**: 从无名小卒到江湖传说 ✅
- **武学传承**: 从学习武学到传承衣钵 ✅

---

## 🎯 下一步

**立即开始 Phase 1**: 创建中年事业线事件文件

是否需要我立即开始实施？
