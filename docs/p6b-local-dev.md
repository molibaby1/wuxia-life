# P6B 本地联调（PostgreSQL + 后端 + 前端）

三终端工作流：数据库 → API → Vite 前端。

## 0. 一次性准备

```bash
# 安装依赖
npm install

# 后端环境（勿提交仓库）
cp .env.p6b.example .env.p6b

# 前端 API 地址（勿提交仓库，匹配 *.local 忽略规则）
cp .env.development.local.example .env.development.local
```

`.env.p6b` 默认已与 `docker-compose.p6b.yml` 对齐：

```env
DATABASE_URL=postgres://wuxia:wuxia@localhost:5432/wuxia_p6b
TOKEN_HASH_SECRET=change-me-to-a-long-random-secret
ENGINE_VERSION=p6b-headless
EVENT_CATALOG_VERSION=1.0.0
HTTP_PORT=8787
```

## 1. 启动 PostgreSQL

```bash
docker compose -f docker-compose.p6b.yml up -d
docker compose -f docker-compose.p6b.yml ps
```

等待 `healthy` 后再继续。

停止并删除数据卷（慎用，会清空本地库）：

```bash
docker compose -f docker-compose.p6b.yml down -v
```

## 2. 初始化 schema + 目录种子

在**同一 shell** 中加载后端环境变量后执行迁移（`npm` 脚本不会自动读取 `.env.p6b`）：

```bash
set -a && source .env.p6b && set +a
npm run p6b:migrate
npm run p6b:seed-catalog
```

或使用快捷命令（内部 `source .env.p6b`）：

```bash
npm run p6b:setup
```

## 3. 启动后端 API（终端 A）

开发环境下 API 需启用 CORS（`server/src/http/cors.ts`），否则浏览器会显示「后端未就绪」。修改后端代码后请重启本终端。

```bash
set -a && source .env.p6b && set +a
npm run p6b:serve
```

验证：

```bash
curl -s http://localhost:8787/health/live
curl -s http://localhost:8787/health/ready
```

`ready` 返回 `{"status":"ready",...}` 表示数据库与事件目录均已就绪。

## 4. 启动前端（终端 B）

确保已有 `.env.development.local`：

```env
VITE_P6B_API_URL=http://localhost:8787
```

```bash
npm run dev
```

浏览器打开 Vite 提示的地址（通常 `http://localhost:5173`）。此时应看到**三槽位**选档界面（API 模式），而非仅姓名/性别的旧开始页。

## 5. 联调检查清单

| 步骤 | 预期 |
| --- | --- |
| 进入首页 | 显示 3 个存档槽位；空槽可「新人生」，有档可「继续」 |
| 新游戏 | 选空槽 → 输入名字/性别 → 进入事件 |
| 选择选项 | 请求 `POST /v1/sessions/{id}/choices`，进度写入 PostgreSQL |
| 刷新页面 | 同一设备 token 下可「继续」恢复 |
| 覆盖存档 |  occupied 槽「新人生」需确认覆盖 |

设备 token 存在浏览器 `localStorage`（键名见 `webPlatformStorage`）。

## 6. 可选：跑集成测试

```bash
set -a && source .env.p6b && set +a
npm run test:p6b
```

## 7. 端口冲突

| 服务 | 默认端口 |
| --- | --- |
| PostgreSQL (P6B Docker) | 5433（映射到容器内 5432） |
| P6B API | 8787 |
| Vite | 5173 |

默认使用 **5433**，避免与本机已有 Postgres（常占用 5432）冲突。若改端口，请同步 `docker-compose.p6b.yml` 与 `.env.p6b` 中的 `DATABASE_URL`。

## 8. 不使用 Docker 时

使用本机 PostgreSQL，自行创建库与用户后，只改 `.env.p6b` 的 `DATABASE_URL`，其余步骤相同。
