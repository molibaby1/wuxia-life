# 本地 API 栈联调

PostgreSQL + 后端 API + Vite 前端的当前联调说明。

命令名里仍可能出现历史脚本前缀（如 `p6b:*`）；那是 npm script 名称，不是文档阶段编号。

## 模式定位

- **API 模式（默认产品 / QA 路径）**：设置 `VITE_P6B_API_URL` 后，主动人生规划、行动小结与扰动确认由服务端权威会话驱动（见 `docs/designs/session-progression-api.md`）。
- **本地模式（仅开发 / 离线兜底）**：不设置 `VITE_P6B_API_URL` 时走 `useNewGameEngine` + 浏览器 `localStorage` 存档；用于无数据库时的快速调试，**不是**人工验收主路径。

**推荐联调命令（API 栈）：**

```bash
npm run p6b:setup && npm run p6b:serve   # 终端 A
npm run dev                               # 终端 B（需 VITE_P6B_API_URL）
```

## 0. 一次性准备

```bash
npm install
cp .env.p6b.example .env.p6b
cp .env.development.local.example .env.development.local
```

`.env.p6b` 默认与 `docker-compose.p6b.yml` 对齐：

```env
DATABASE_URL=postgres://wuxia:wuxia@localhost:5432/wuxia_p6b
TOKEN_HASH_SECRET=change-me-to-a-long-random-secret
ENGINE_VERSION=p6b-headless
EVENT_CATALOG_VERSION=1.0.0
HTTP_PORT=8787
```

### 后端环境变量

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串（密钥不进仓库） |
| `TOKEN_HASH_SECRET` | device/session token 哈希 pepper（至少 16 字符） |
| `ENGINE_VERSION` | 引擎版本标签 |
| `EVENT_CATALOG_VERSION` | 钉住的事件目录版本 |
| `HTTP_HOST` | 默认 `0.0.0.0` |
| `HTTP_PORT` | 默认 `8787` |
| `NODE_ENV` | `development` / `test` / `production` |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` |

前端：`VITE_P6B_API_URL` = API base URL。模板见 `.env.p6b.example`。

## 1. 启动 PostgreSQL

```bash
docker compose -f docker-compose.p6b.yml up -d
docker compose -f docker-compose.p6b.yml ps
```

等待 `healthy`。清空本地库（慎用）：

```bash
docker compose -f docker-compose.p6b.yml down -v
```

Schema 以仓库 migration 为准：`npm run p6b:migrate`。不要依赖已删除的静态 schema 文档。

## 2. 初始化 schema + 目录种子

```bash
set -a && source .env.p6b && set +a
npm run p6b:migrate
npm run p6b:seed-catalog
```

或：

```bash
npm run p6b:setup
```

## 3. 启动后端 API（终端 A）

```bash
set -a && source .env.p6b && set +a
npm run p6b:serve
```

验证：

```bash
curl -s http://localhost:8787/health/live
curl -s http://localhost:8787/health/ready
```

## 4. 启动前端（终端 B）

`.env.development.local`：

```env
VITE_P6B_API_URL=http://localhost:8787
```

```bash
npm run dev
```

应看到三槽位选档界面（API 模式）。

## 5. 联调检查清单

| 步骤 | 预期 |
| --- | --- |
| 进入首页 | 3 个存档槽；空槽可「新人生」，有档可「继续」 |
| 新游戏 | 选空槽 → 名字/性别 → 进入事件 |
| 选择选项 | `POST /v1/sessions/{id}/choices`，进度写入 PostgreSQL |
| 刷新页面 | 同一设备 token 下可「继续」恢复 |
| 覆盖存档 | occupied 槽「新人生」需确认覆盖 |

## 6. 服务端何时落盘

- **会持久化**：新游戏初始快照；成功 choice + 自动推进链后的新快照与 replay；终局；显式 `POST .../save`（hash 有变化时）。
- **不持久化**：校验失败 / 409 冲突 / 鉴权失败；前端 pacing、动画、auto-play 计时器。

客户端变更请求须带 `expectedSlotVersion` 与 `expectedSnapshotId`；收到 `409` 应停止继续提交并提示重新加载存档列表。

## 7. 可选：集成测试与可玩性门禁

```bash
set -a && source .env.p6b && set +a
npm run test:p6b
```

```bash
npm run gate:playability                    # 默认 headless_server
npm run gate:playability -- --mode local_direct
```

报告：`artifacts/gates/p8-playability-gate-latest.{json,md}`  
Tracked baseline：`tests/fixtures/gates/p8-playability-gate-latest.json`

## 8. 端口

| 服务 | 默认端口 |
| --- | --- |
| PostgreSQL (Docker 映射) | 5433 → 容器 5432 |
| API | 8787 |
| Vite | 5173 |

## 9. 不使用 Docker

本机 PostgreSQL 建库后，只改 `.env.p6b` 的 `DATABASE_URL`，其余步骤相同。

## 10. 部署要点（摘要）

- 迁移：`npm run p6b:migrate`；目录：`npm run p6b:seed-catalog`；API：`npm run p6b:serve`
- Health：`GET /health/live`、`GET /health/ready`
- 生产构建前设置 `VITE_P6B_API_URL`；TLS 在反代终止
- 当前限制：匿名设备、无跨设备同步；账号与小程序适配仍属后续工作
