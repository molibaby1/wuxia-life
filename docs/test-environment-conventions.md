# 测试与门禁环境约定

本文档说明本地与 CI 下运行 `npm test` / `npm run validate` 时的环境策略，减少「环境噪音」掩盖真实缺陷。

## localStorage 与持久化路径

| 环境 | 策略 |
|------|------|
| **Node（门禁子进程）** | 业务代码应通过 `typeof window !== 'undefined'` 且存在 `window.localStorage` 再访问浏览器存储。难度等配置在 Node 下**不写** `globalThis.localStorage`，避免触发 Node 的 `--localstorage-file` 相关告警。 |
| **Node（存档）** | `SaveManager` 在非浏览器环境使用项目目录下的 `.wuxia_saves/`（由 `SaveManager` 创建），不依赖 `localStorage`。 |
| **浏览器** | 使用系统提供的 `window.localStorage`；无需设置 `--localstorage-file`。 |

### 本地建议

- **不要**在全局 `NODE_OPTIONS` 中挂接空的 `--localstorage-file` 或无效的 Web Storage 实验参数；若 IDE 注入此类变量，真实测试门禁子进程会清除 `NODE_OPTIONS` 以获得可重复输出，但仍应以干净 shell 为准。
- 首次运行前执行 `npm ci`（或锁未变时使用 `npm install`），与 CI 一致。

### CI

- 使用 `actions/setup-node` 与 `npm ci`；不配置 `NODE_OPTIONS` 中的 Web Storage 相关标志。
- 工作目录为仓库根目录，相对路径 `.wuxia_saves` 可写。

## 告警清零检查清单（合并前）

- [ ] `npm run typecheck` 无错误。
- [ ] `npm test` 输出中无 `docs/test-output-severity-taxonomy.md` 所列 **Blocker** 子串。
- [ ] 无已知的「关键 Warning」复发（参见 `docs/release-validation-contract.md` 中 Warning 卫生条款）。
- [ ] 若新增依赖或 Node 主版本变更，在 PR 描述中注明并复跑完整 `npm run validate`。

## 可复现性

- 锁定 Node 主版本与 `package-lock.json`；CI 与文档命令一致：`npm ci` → `npm run typecheck` → `npm run build` → `npm test`（或工作流中等价步骤）。
- 不在仓库中依赖机器专属路径（除上述相对 `.wuxia_saves` 外）。
