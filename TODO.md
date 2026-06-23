# Daoyou 微信小程序迁移 TODO

本文件用于跟踪将《万界道友》从现有 Web 项目长期迁移为微信小程序的工程进度。后续每完成一个任务，都需要同步更新本文件。

## 状态约定

- `[ ]` 未开始
- `[~]` 进行中
- `[x]` 已完成
- `[!]` 阻塞或需要决策

## 当前原则

- 保留现有 Hono + Bun 后端，将微信小程序作为主要客户端接入同一套 API。
- Web 端不长期保留，迁移完成后可删除 `src/react-app/`、React Router、Vite Web 构建等 Web 专属代码。
- 小程序前端新建独立目录，技术路线确定为 Taro + React，优先复用 `src/shared/` 中的纯 TypeScript 类型、契约和游戏逻辑。
- 认证、请求、存储、路由、UI 需要按微信小程序运行时重新适配。
- 每完成一个任务，立即更新本文件对应条目和“变更记录”。

## 里程碑 M0：工程准备

- [x] 克隆 `https://github.com/ChurchTao/Daoyou` 到本地项目目录。
- [x] 初步识别现有技术栈：Hono + Bun 后端、React + Vite SPA 前端、PostgreSQL + Drizzle、Better Auth、Redis、AI SDK。
- [x] 初步确认迁移策略：保留后端，新建小程序客户端。
- [x] 确认小程序技术路线：Taro + React。
- [x] 确认 Web 版是否长期保留：不保留，最终以微信小程序为主客户端。
- [x] 确认微信小程序 AppID：`wx3b4802aee0f5b7db`。
- [x] 确认微信开发者工具准备情况：已具备。
- [x] 确认后端服务器准备情况：已有服务器。
- [x] 服务器部署完成：阿里云轻量应用服务器，Ubuntu 22.04，2核2G，IP `47.242.208.64`。
- [x] 服务器环境已安装：Bun、Node.js 20、PostgreSQL 14、Redis、Nginx、pm2。
- [x] 后端代码已部署到服务器，pm2 守护进程已配置开机自启。
- [ ] 确认后端服务器 HTTPS 域名与微信小程序合法请求域名配置。
- [ ] 确认生产部署资源：小规模上线建议升级到 2 核 4G，并将 PostgreSQL / Redis 托管或单独部署。

## 里程碑 M1：小程序工程骨架

- [x] 新建小程序前端目录：`miniprogram/`。
- [x] 初始化小程序项目配置。
- [x] 配置基础页面、入口、全局样式和 tabBar。
- [x] 配置 TypeScript 支持。
- [x] 配置开发、构建、检查脚本。
- [x] 在微信开发者工具中跑通空白首页。
- [x] 建立小程序环境变量或配置文件方案。

## 里程碑 M2：请求与会话基础设施

- [x] 新建小程序 API 请求封装。
- [x] 支持统一 API Base URL 配置。
- [x] 支持请求携带登录 token。
- [x] 支持统一处理后端错误响应。
- [x] 新建小程序本地存储封装，替代 Web `localStorage`。
- [x] 建立登录状态恢复流程。
- [x] 跑通 `/api/health-check` 请求。

## 里程碑 M3：微信登录与后端认证适配

- [x] 新增微信小程序登录 API 设计。
- [x] 新增后端环境变量：`WECHAT_MINI_APPID`、`WECHAT_MINI_SECRET`。
- [x] 实现后端 `wx.login` code 换取 `openid` 的服务。
- [x] 设计微信用户与现有用户表的绑定关系。
- [x] 实现小程序 session token 签发。
- [x] 改造后端鉴权中间件，使其同时支持 Web cookie session 和小程序 token。
- [x] 小程序端实现微信登录按钮与会话保存。
- [x] 跑通登录后访问 `/api/player/active`。

## 里程碑 M4：核心游戏闭环 V1

- [ ] 迁移或重写创建角色页面。
- [ ] 跑通 AI 生成角色流程。
- [ ] 跑通保存角色流程。
- [ ] 迁移或重写洞府首页。
- [ ] 迁移或重写道身信息页面。
- [ ] 迁移或重写储物袋页面。
- [ ] 迁移或重写任务中心页面。
- [ ] 迁移或重写静室修行页面。
- [ ] 实现最小可玩的“登录 → 创建角色 → 查看洞府 → 执行一次核心操作”闭环。

## 里程碑 M5：核心玩法扩展

- [ ] 迁移炼丹入口与基础炼丹流程。
- [ ] 迁移炼器入口与基础炼器流程。
- [ ] 迁移功法 / 神通查看页面。
- [ ] 迁移战斗历史页面。
- [ ] 迁移简化战斗播放或战斗结果展示。
- [ ] 迁移坊市基础购买 / 出售功能。
- [ ] 迁移排行榜基础查看功能。

## 里程碑 M6：复杂功能与平台适配

- [ ] 评估拍卖行是否符合小程序平台规则。
- [ ] 迁移拍卖行。
- [ ] 迁移世界聊天。
- [ ] 接入微信内容安全检查。
- [ ] 处理 AIGC 内容展示与审核风险。
- [ ] 评估 WebSocket、轮询或云托管方案。
- [ ] 迁移邮件 / 传音玉简。
- [ ] 迁移兑换码。

## 里程碑 M7：UI 与体验

- [ ] 制定小程序水墨风视觉基准。
- [ ] 重写基础组件：按钮、卡片、弹窗、列表、空状态、加载态、错误态。
- [ ] 重写游戏主布局。
- [ ] 适配不同屏幕尺寸和安全区域。
- [ ] 优化长文本阅读体验。
- [ ] 优化战斗日志和滚动区域体验。
- [ ] 完成真机基础体验检查。

## 里程碑 M8：上线准备

- [ ] 配置 HTTPS 后端域名。
- [ ] 配置微信小程序合法请求域名。
- [ ] 建立生产环境变量清单。
- [ ] 检查小程序包体大小。
- [ ] 检查隐私协议、用户协议、数据收集说明。
- [ ] 完成核心路径回归测试。
- [ ] 准备体验版。
- [ ] 准备提审版本。

## 暂缓范围

- [ ] 管理后台迁移。
- [ ] 后台邮件广播迁移。
- [ ] LLM 指标管理页面迁移。
- [ ] 完整 Web 端清理，包括 `src/react-app/`、React Router、Web 专属构建配置和不再需要的依赖。
- [ ] 小程序支付能力接入。

## 风险与待决策

- [x] 小程序技术路线已确认：Taro + React。
- [x] 微信登录已实现：通过 Redis 存储 session token，中间件同时支持 Bearer token 和 cookie session。
- [!] AIGC 内容和世界聊天需要内容安全策略。
- [!] 小程序包体限制可能要求分包。
- [!] React + Tailwind UI 无法直接复用，需要大量重写。
- [!] 后端服务器已部署，但 HTTPS 域名和微信合法请求域名配置待完成。
- [!] 当前服务器为 2 核 2G，内测可用；上线前建议升级到 2 核 4G 并配置 HTTPS。
- [!] 云函数不适合作为当前项目主后端替代方案，可作为微信登录、内容安全等边缘能力补充。

## 变更记录

- 2026-06-23：完成 M3 全部任务并部署服务器。服务器：阿里云轻量 Ubuntu 22.04 2核2G，IP `47.242.208.64`，已安装 Bun/Node.js 20/PostgreSQL 14/Redis/Nginx/pm2，后端通过 pm2 守护运行在 3000 端口，Nginx 反向代理 80 端口。数据库：创建 `daoyou` 用户和数据库，运行 Better Auth migration，手动创建 `better_auth` schema 并迁移表，添加 `wxOpenid` 字段。后端修复 TypeScript 编译错误（`randomUUID` 生成 id、`openid`/`session_key` 类型守卫）。小程序 `env.ts` 配置指向服务器 IP。微信登录联调成功：`wx.login` → `POST /api/wx/wx/login` → 用户创建 → token 签发 → Bearer 鉴权 → `/api/player/active` 访问通过。GitHub 仓库迁移至 `c4znr7jpdy-arch/fchdaoyu`。
- 2026-06-23：推进 M3：后端 `authUsers` 表新增 `wxOpenid` 字段并创建迁移 `0051_add_wx_openid.sql`；新增 `POST /api/wx/wx/login` 端点，调用微信 `jscode2session` 换取 `openid`，按 `wxOpenid` 查找或创建用户（synthetic email `wx_{openid}@wx.local`），session_key 存入 Redis，签发 30 天有效期的随机 token 并存入 Redis；改造 `resolveUser` 中间件，优先解析 `Authorization: Bearer <token>`，回退到 Better Auth cookie session；小程序新增登录页面 `pages/login/index` 与 `loginWithWeChat` 客户端，调用 `wx.login` 获取 code 并换取 token；首页新增”前往登录”入口；构建验证通过，实际登录链路需配置后端 `WECHAT_MINI_SECRET` 与合法域名后联调。
- 2026-06-09：推进 M2：新增本地存储封装、session token 读写与恢复、Authorization 请求头、统一 `ApiRequestError`、`/api/health-check` 客户端和首页后端探针；小程序构建验证通过，实际 health-check 需等待后端服务和域名/本地调试配置。
- 2026-06-09：完成 M1：新增 `src/config/env.ts` 环境配置、`ENV.md` 配置说明、Taro alias 配置和基础 `request` 封装；首页展示当前环境与 API Base URL，并通过小程序构建验证。
- 2026-06-09：微信开发者工具已成功导入 `miniprogram/`，模拟器已显示 Taro + React 基础首页；M1 仅剩环境变量 / API Base URL 配置方案。
- 2026-06-09：完成 M1 部分任务：创建 `miniprogram/` Taro + React 骨架，配置 AppID、TypeScript、基础首页、开发/构建脚本，并通过 `npm run build:weapp --prefix miniprogram` 构建验证。
- 2026-06-09：评估后端承载方式：优先使用自有服务器部署 Hono + Bun 后端；截图中的 2 核 2G 4M 配置适合开发/内测，不建议使用 Windows Server 2012 做长期生产；云函数仅作为补充。
- 2026-06-09：确认小程序技术路线为 Taro + React。
- 2026-06-09：记录关键决策：Web 端不长期保留；微信小程序 AppID 为 `wx3b4802aee0f5b7db`；微信开发者工具和后端服务器已准备。
- 2026-06-09：创建长期迁移 TODO 文档；记录初始迁移策略、里程碑、风险与待决策项。
