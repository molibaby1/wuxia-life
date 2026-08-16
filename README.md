# Wuxia-Life

> 一个以选择、经历与人生反馈为核心的数据驱动武侠人生模拟器。
>
> **不是把人生压缩成一组不断增长的数字，而是让选择形成经历，让经历塑造人生。**

Wuxia-Life 试图回答一个简单但困难的问题：

> 如果玩家只能活一次，他能否从一次次选择中，逐渐看见自己正在成为怎样的人？

项目以武侠人生为当前内容载体。玩家从出生开始经历家庭、求学、练功、营生、人际关系、门派、挫折与晚年，通过事件选择和主动规划塑造一段完整人生。

从更底层看，Wuxia-Life 也是一个“**可选择的故事播放器**”：运行时负责状态、时间、条件、选择与结果；故事内容通过数据定义。武侠只是当前世界，播放器本身不应与某一条剧情、某一种身份或某一组文案紧耦合。

---

## 项目宗旨

### 1. 选择必须形成可感知的经历

游戏的核心循环不是“点击并增加数值”，而是：

```text
玩家做出选择
→ 世界和人物状态发生变化
→ 后续内容承认这些变化
→ 玩家理解这段人生为何成为现在的样子
```

选择不需要完全透明，也不应泄露后台精确公式；但玩家必须能够理解它的大致方向、代价和已经发生的结果。

### 2. 数值需要被翻译成人生意义

“学识 30”或“功力 50”本身不是体验。玩家还需要知道：

- 这个水平意味着什么；
- 自己已经形成了哪些特点；
- 之前的投入产生了什么阶段成果；
- 现在正在接近什么可能性。

因此，项目重视 Life Memory、实践轨迹、人生印记和其他只读派生反馈。它们负责解释正式事实，而不是创建第二套身份或状态真相。

### 3. 人生可以没有标准答案，但不能没有方向感

Wuxia-Life 不希望把人生做成线性任务清单。玩家可以练功、读书、营生、入仕、隐逸，也可以混合发展，甚至经历失败和偏离预期。

但开放不等于含糊。游戏应通过阶段反馈、社会评价、重要经历和可接近的可能性，让玩家知道：

> 我现在是谁，我做过什么，我可能走向哪里。

### 4. 自动化验证工程事实，实际游玩验证体验

Headless 模拟适合验证：

- 路径是否可达；
- 状态是否正确执行；
- Local、API 与 Headless 是否一致；
- Contract、Snapshot 和调度是否回归；
- 已知产品规则是否被破坏。

它不能单独证明：

- 玩家理解选项；
- 游戏节奏有趣；
- 不同人生在主观上足够不同；
- 玩家愿意继续下一年或重开一局。

自动化是证据工具，不是现实玩家的替身。

### 5. 内容与逻辑分离，高内聚、低耦合

事件、条件、效果和展示内容应尽量数据驱动。一个系统应当：

- 只负责一个清晰职责；
- 消费明确的正式事实；
- 不创建平行状态来源；
- 可以独立替换或移除；
- 不依赖事件文本、测试标签或隐式约定猜测业务语义。

理想情况下，移除某个反馈系统后，核心人生仍能继续运行，只是体验会少一层表达。

---

## 当前产品模型

当前武侠世界将人物信息分为不同语义层，不允许互相替代。

### 四项人生投入

- 武道投入
- 经世投入
- 仕途投入
- 隐逸投入

投入表示玩家把人生时间花在哪里。四项可以同时发展，不是互斥职业或固定路线，也不保证成功。

### 六项核心属性

- **功力**：综合武学能力
- **体魄**：长期身体基础和恢复能力
- **学识**：知识、理解与文化能力
- **人脉**：获取信息和调动社会资源的能力
- **名望**：知名程度和影响范围
- **侠义声誉**：外界对行为和品行的评价

### 其他正式事实

- **资源**：例如金钱
- **特质**：少量、相对稳定的个人特点
- **状态**：疲惫、焦虑、重伤等临时处境
- **Habit**：练功、读书和营生的长期实践记录
- **Affiliation**：当前正式组织归属
- **Title**：世界内明确授予的社会称号
- **Ending**：完整人生的最终分类与解释
- **故事事实**：会影响后续内容的重要经历

详细规范见 [`docs/product/player-model.md`](docs/product/player-model.md)。

---

## 核心体验

一次人生主要由三种交互构成。

### 事件与选择

玩家阅读当前处境，在多个选择中决定如何回应。选择可以改变属性、资源、状态、关系、组织归属和故事事实。

### 主动人生规划

玩家可以主动把时间投入练功、读书、营生、交游、游历等行动。主动行动以实际结算后的公开状态变化为结果来源，不用理论收益覆盖真实结果。

### 人生反馈

游戏通过结果卡、阶段总结、Life Memory、实践轨迹、所属、称号、重要经历和结局，让玩家理解这段人生如何形成。

项目正在持续强化的方向是：让已有数值和经历转化为更清晰的阶段成果与人生定位，而不是继续堆叠玩家无法理解的内部指标。

---

## 架构概览

```text
JSON 事件与内容数据
        ↓
事件条件 / 效果 / 调度
        ↓
统一游戏引擎与 Canonical GameState
        ↓
Snapshot / Contract / Save
        ↓
派生投影（Life Memory、人生方向、结果反馈）
        ↓
Browser UI / API / Headless Simulation
```

主要目录：

```text
wuxia-life/
├── src/
│   ├── core/          # 游戏引擎、状态执行与派生逻辑
│   ├── data/          # 数据驱动事件、人生内容与配置
│   ├── components/    # Vue 玩家界面
│   ├── contracts/     # Snapshot、Choice、Replay 等正式契约
│   ├── adapters/      # Browser/API 等运行时适配
│   ├── headless/      # 无界面运行与同源验证
│   ├── narrative/     # 叙事投影与摘要
│   └── types/         # 正式类型定义
├── server/            # API、PostgreSQL 持久化与服务端会话
├── tests/             # 单元、契约、Headless、Parity 与阶段回归
├── scripts/           # 仿真、门禁、报告和验证脚本
└── docs/              # 当前权威规范与历史资料
```

### 多运行时一致性

项目同时维护：

- Browser Local 模式；
- API 服务端权威模式；
- Headless simulation；
- Snapshot 与 Replay。

它们应共享同一正式状态、事件执行和玩家可见结果语义。不得为了让某个测试或运行时通过而创建平行业务逻辑。

---

## 技术栈

- Vue 3
- TypeScript
- Vite
- Node.js
- PostgreSQL 16（API 模式）
- Docker Compose（本地数据库）
- TSX 测试与仿真脚本

---

## 快速开始

### 仅运行本地前端引擎

适合快速开发和离线调试。

```bash
npm install
```

确保 `.env.development.local` 中没有启用 `VITE_P6B_API_URL`，然后：

```bash
npm run dev
```

### 运行 API 权威模式

这是服务端会话、数据库存档和正式联调路径。

```bash
npm install
cp .env.p6b.example .env.p6b
cp .env.development.local.example .env.development.local
npm run p6b:setup
```

分别启动后端和前端：

```bash
npm run p6b:serve
```

```bash
npm run dev
```

也可以在数据库初始化完成后使用：

```bash
npm run dev:all
```

更详细的本地联调说明见 [`docs/local-api-dev.md`](docs/local-api-dev.md)。

---

## 验证

常用验证：

```bash
npm run typecheck
npm test
npm run build
```

快速契约验证：

```bash
npm run verify:quick
```

Headless 与运行时一致性：

```bash
npm run test:headless
npm run test:headless:parity
```

可玩性与调度门禁：

```bash
npm run gate:playability
npm run gate:p11-scheduling
```

完整验证：

```bash
npm run verify:full
```

部分脚本会生成报告或运行较长时间。开始治理任务前，应先确认当前阶段真正要求哪些命令，不要为了“全部绿色”擅自修改未授权系统。

---

## 文档与权威层级

仓库保留了大量历史 PRD、阶段报告和验证资料。它们记录项目演进，但不自动代表当前产品语义。

开始分析或实施前，优先阅读：

1. [`docs/product/player-model.md`](docs/product/player-model.md)
2. [`docs/governance/project-convergence.md`](docs/governance/project-convergence.md)
3. [`docs/governance/product-decisions.md`](docs/governance/product-decisions.md)
4. [`docs/governance/current-product-stage.md`](docs/governance/current-product-stage.md)
5. [`docs/governance/ai-collaboration-workflow.md`](docs/governance/ai-collaboration-workflow.md)
6. [`AGENTS.md`](AGENTS.md)

当前唯一工作目标以 `current-product-stage.md` 为准。历史代码、测试和文档只能说明过去或当前实现状态，不能反向覆盖更高层产品语义。

---

## 开发原则

### 先裁决产品语义，再修改实现

测试失败不自动等于产品缺陷。需要先判断它属于：

- 真实玩家体验问题；
- 实现错误；
- Contract 漂移；
- metric 或 evidence 问题；
- 过期基线；
- 尚不足以裁决。

### 一个阶段只解决一个问题

每个 Slice 必须明确：

- 目标状态；
- 已确认事实；
- 允许范围；
- 禁止范围；
- 结构性 blocker；
- 验收标准。

完成当前阶段后停止，不顺带进入相邻系统。

### 最小修改，不做未来设计

- 不为“以后可能需要”提前增加扩展点；
- 不创建第二套 canonical source；
- 不用 compatibility layer 掩盖语义冲突；
- 不顺手重构无关模块；
- 不通过放宽测试或修改 seed 获得假绿。

### 数据驱动，但不是无限通用化

内容应从逻辑中分离，但只抽象当前需求真正需要的能力。项目未来可能承载其他人生世界，但当前不建设多世界插件系统，也不为尚不存在的题材提前设计框架。

---

## AI 协作方式

项目采用阶段目标驱动的 ChatGPT × Codex 协作：

- **ChatGPT / 深推理模型**：产品分析、语义裁决、范围控制和结果复核；
- **Codex / 执行模型**：真实仓库核对、实现、测试和结构化汇报；
- **人工维护者**：最终产品责任、审批、Git 管理和发布决策。

Codex 可以在已批准阶段内自主闭环普通工程问题，但遇到需要改变 PlayerState、Snapshot、Schema、正式 Contract 或产品边界的结构性问题时必须停止。

完整规则见 [`docs/governance/ai-collaboration-workflow.md`](docs/governance/ai-collaboration-workflow.md)。

---

## 当前状态

Wuxia-Life 已完成多轮玩家模型、身份归属、终局、主动行动、可玩性证据和测试门禁治理。当前正式 Snapshot 版本、已关闭阶段和 Authorized Slice 可能随治理推进发生变化，因此 README 不复制滚动状态。

请以以下文档为准：

- [`docs/governance/current-product-stage.md`](docs/governance/current-product-stage.md)
- [`docs/governance/product-decisions.md`](docs/governance/product-decisions.md)

---

## 项目愿景

Wuxia-Life 的目标不是复刻现实人生，也不是寻找唯一正确的成长路线。

它希望提供一种可以反复进入的叙事空间：玩家做出有限但有分量的选择，承担意料之中或意料之外的结果，并在多年之后回头看见——

> 这不是系统替我写好的一生，而是我的选择、运气、坚持、妥协和失去，共同形成的一段经历。
