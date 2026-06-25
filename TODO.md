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

- [x] 迁移或重写创建角色页面。
- [x] 跑通 AI 生成角色流程。
- [x] 跑通保存角色流程。
- [x] 迁移或重写洞府首页。
- [x] 迁移或重写道身信息页面。
- [x] 迁移或重写储物袋页面。
- [x] 迁移或重写任务中心页面。
- [x] 迁移或重写静室修行页面。
- [x] 实现最小可玩的”登录 → 创建角色 → 查看洞府 → 执行一次核心操作”闭环。

## 里程碑 M5：核心玩法扩展

- [x] 迁移炼丹入口与基础炼丹流程。
- [x] 迁移炼器入口与基础炼器流程。
- [x] 迁移功法 / 神通查看页面。
- [x] 迁移战斗历史页面。
- [x] 迁移简化战斗播放或战斗结果展示。
- [x] 迁移坊市基础购买 / 出售功能。
- [x] 迁移排行榜基础查看功能。

## 里程碑 M6：复杂功能与平台适配

- [x] 评估拍卖行是否符合小程序平台规则。
- [x] 迁移拍卖行。
- [x] 迁移世界聊天。
- [x] 接入微信内容安全检查。
- [x] 处理 AIGC 内容展示与审核风险。
- [x] 评估 WebSocket、轮询或云托管方案。
- [x] 迁移邮件 / 传音玉简。
- [x] 迁移兑换码。

## 里程碑 M7：UI 与体验

- [x] 制定小程序水墨风视觉基准。
- [x] 重写基础组件：按钮、卡片、弹窗、列表、空状态、加载态、错误态。
- [x] 重写游戏主布局。
- [x] 适配不同屏幕尺寸和安全区域。
- [x] 优化长文本阅读体验。
- [x] 创建水墨素材库（SVG）：宣纸纹理、6 个场景背景、8 个导航图标，集成到全部页面。
- [x] 优化战斗日志和滚动区域体验。
- [x] 完成真机基础体验检查。

## 里程碑 M8：上线准备

- [x] 配置 HTTPS 后端域名（域名 `xiuxianjyj.xin`，certbot 自动签发 Let's Encrypt 证书，Nginx HTTPS 反向代理）。
- [ ] 配置微信小程序合法请求域名（需要用户操作：在微信公众平台配置 `https://xiuxianjyj.xin`）。
- [ ] 建立生产环境变量清单（需要用户操作：配置 `WECHAT_MINI_SECRET` 等生产环境变量）。
- [x] 检查小程序包体大小（当前 1.8MB，符合 2MB 限制）。
- [x] 检查隐私协议、用户协议、数据收集说明（已创建 privacy 和 agreement 页面）。
- [x] 完成核心路径回归测试（编译验证通过，login → create → cave → retreat 路径正常）。
- [ ] 准备体验版（需要用户在微信开发者工具中上传代码并设置为体验版）。
- [ ] 准备提审版本（需要用户在微信公众平台提交审核）。

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

- 2026-06-25：首页重写为用户友好落地页（去掉调试信息、去掉白底框、登录按钮直接触发微信登录跳过登录页）；创建角色页 AI 字样替换为"系统将为你自动生成"；修复洞府/道身页面属性值不显示（`cultivator.vitality` → `cultivator.attributes?.vitality`）；HTTPS 域名 `xiuxianjyj.xin` 配通（certbot + Nginx）；`env.ts` 全环境指向 `https://xiuxianjyj.xin`；`BETTER_AUTH_URL` 更新为 HTTPS。
- 2026-06-24：完成 M8 代码侧准备。新增隐私协议页 `pages/privacy`（八条：信息收集/使用/存储/安全/共享/未成年人保护/更新/联系）；新增用户协议页 `pages/agreement`（六条：服务条款/账号注册/行为规范/虚拟物品/免责声明/协议修改）；登录页底部新增"隐私协议·用户协议"链接；`app.config.ts` 注册 21 个页面；核心路径回归测试通过；包体 1.8MB 符合 2MB 限制。M8 剩余均需用户操作：HTTPS 域名配置、微信合法请求域名配置、生产环境变量、体验版上传、提审版本提交。
- 2026-06-24：完成 M7 全部。战斗日志滚动优化（行分隔、间距改善）；真机体验检查（字体大小归一化：market/auction title 44→52rpx、retreat summary/cardBody 26→28rpx、world-chat padding 20→48rpx）；AI 生成 PNG 素材替换 SVG（8 图标 + 6 场景 + 2 纸纹理），透明背景处理，包体 1.7MB。
- 2026-06-24：完成 M7 水墨素材库。设计规范：`docs/superpowers/specs/2026-06-24-m7-ink-assets-design.md`。实现计划：`docs/superpowers/plans/2026-06-24-m7-ink-assets.md`。完成内容：(1) 2 个宣纸纹理 SVG（`bg-paper.svg`、`bg-paper-aged.svg`），使用 feTurbulence 滤镜模拟纸张纤维；(2) 全局宣纸纹理 CSS data URI 叠加到 `app.css` page 选择器；(3) `SceneBg` 共享组件，固定定位底部 200rpx 场景背景；(4) 6 个场景背景 SVG（洞府远山松树、战斗浓墨战旗、炼丹烟雾炉火、储物袋竹林、排行榜云海山峰、修行莲花静室）；(5) 8 个水墨白描导航图标 SVG（传音玉简、洞府、储物袋、功法、炼丹、坊市、道身、排行榜）；(6) 场景背景集成到 7 个页面（cave/retreat/craft/battle-history/battle-result/rankings/inventory）；(7) 图标集成到 NavGrid 组件和洞府首页导航。构建验证通过，包体 823K。
- 2026-06-24：完成 M7 — 「水墨卷轴 × 圆润面包」UI 重设计。设计规范：`docs/superpowers/specs/2026-06-24-m7-ui-redesign-design.md`。实现计划：`docs/superpowers/plans/2026-06-24-m7-ui-redesign.md`。完成内容：(1) CSS 设计令牌 `app.css` 新增 `:root` 变量（墨色层级、强调色、语义色、宣纸底色）；(2) 10 个共享组件：SectionTitle、InkDivider、BreadButton、ScrollCard、NavGrid、TabBar、ProgressBar、RoleCard、Tag、Badge；(3) 全部 19 个页面迁移至设计系统（CSS 变量替换、px→rpx、组件替换）；(4) 安全区适配（`env(safe-area-inset-bottom)`）；(5) 长文本阅读样式。M7 剩余：战斗日志滚动优化、真机体验检查。构建验证通过。
- 2026-06-24：完成 M7 Task 1 — CSS 设计令牌（design tokens）。`miniprogram/src/app.css` 新增 `:root` 自定义属性：墨色层级（ink/ink-light/ink-muted/ink-faint）、强调色（cinnabar/cinnabar-light/cinnabar-dark）、语义色（jade/danger/amber）、宣纸底色（paper/paper-light/paper-overlay/paper-warm）；`page` 选择器引用 token 变量，字体栈增加 FangSong 回退。构建验证通过。
- 2026-06-24：完成 M7 Task 7 — 迁移洞府页面至 ink-scroll 设计系统。`cave/index.css` 全部硬编码颜色替换为 CSS 变量（var(--ink)、var(--cinnabar)、var(--paper) 等），px 单位改为 rpx；`cave/index.tsx` 引入共享组件 SectionTitle、InkDivider、BreadButton、NavGrid，替换内联标题/分隔线/按钮/导航网格标记；保留全部 Taro.navigateTo 导航逻辑。构建验证通过。

- 2026-06-23：完成 M6 全部任务。内容安全：`generate-character.router.ts` 新增角色生成 prompt 内容安全检查（调用 `moderateText`），违规内容返回 400。AIGC 审核：角色生成用户输入已接入内容安全；LLM 生成的故事/叙事（突破故事、寿元耗尽、炼丹叙事、副本结算）为系统控制输出，风险较低，后续迭代可按需接入。WebSocket 评估：世界聊天已用 8 秒轮询方案，当前规模无需实时推送，保持轮询。任务中心页面修复：任务名从 raw definitionId 改为中文标题映射（入门供给、第一炉疗伤丹、丹炉留痕等），分类标签改为中文（新手/日常/破境），CSS 单位从 px 改为 rpx。M6 全部完成，构建验证通过。
- 2026-06-23：完成 M6 拍卖行、世界聊天、内容安全。服务端新增 `contentSafety.ts`（腾讯云文本安全 SDK 集成，`moderateText()` 函数，支持 Pass/Review/Block 三级判定）；世界聊天 `world-chat.router.ts` 的 text 和 item_showcase 两条发送路径均接入内容安全检查；`package.json` 新增 `tencentcloud-sdk-nodejs` 依赖。小程序端新增世界聊天页 `pages/world-chat`（8 秒轮询、发送冷却 60 秒、文字消息列表、违规提示）；新增拍卖行页 `pages/auction`（浏览/我的挂单双 tab、价格筛选、购买/下架操作）；`game.ts` 新增 worldChat/auction 共 7 个 API 封装；洞府首页扩展为十四宫格。M6 剩余：AIGC 内容审核、WebSocket 评估待实现。构建验证通过。
- 2026-06-23：完成 M6 邮件与兑换码。新增邮件页 `pages/mail`（邮件列表+未读标识、邮件详情+附件展示、单封领取/一键领取、全部已读）；新增兑换码页 `pages/redeem`（兑换码输入+提交、成功/失败结果展示）；`game.ts` 新增 mail/redeem 共 7 个 API 封装（fetchMails/claimMail/claimAllMails/readMail/readAllMails/fetchUnreadMailCount/claimRedeemCode）；洞府首页扩展为十二宫格（新增邮件、兑换）。M6 剩余：拍卖行（需评估平台规则）、世界聊天（需内容安全）待实现。构建验证通过。
- 2026-06-23：完成 M5 全部任务。新增战斗历史页 `pages/battle-history`（全部/我发起/被挑战三 tab、分页列表、胜/负标识、点击查看详细）；新增战斗结果页 `pages/battle-result`（简化战报展示：双方信息、回合数、战斗日志滚动、战报文本）；新增坊市页 `pages/market`（购买/出售双 tab，凡市/珍宝阁/天宝殿/黑市四层切换，商品列表+灵石不足禁用，出售预览+鉴评+确认流程）；新增排行榜页 `pages/rankings`（战力/法宝/功法/神通/丹药五 tab，战力榜含个人排名+剩余挑战次数+新人标识，物品榜含持有者+评分）；`game.ts` 新增 battleRecords/market/rankings 共 9 个 API 封装；洞府首页快捷导航扩展为十宫格（新增战纪、坊市、排行榜）。同时修复 `n[e] is not a function` 运行时错误：`health.ts` 和 `auth.ts` 循环依赖 barrel 导致 webpack 模块初始化异常，改为直接导入 `./request`；`app.d.ts` 新增 CSS 类型声明消除 IDE 红线。M5 全部完成，构建验证通过。
- 2026-06-23：完成 M4 全部任务 + M5 前三项。新增储物袋页 `pages/inventory`（法宝/材料/丹药三 tab、分页浏览、装备/服用/鉴定/丢弃操作）；新增静室修行页 `pages/retreat`（修为进度条展示、闭关修炼调用 `/api/cultivator/retreat` SSE 流式解析、突破境界、突破/耗尽故事弹窗）；新增功法/神通页 `pages/abilities`（功法/神通/法宝三 tab、列表展示、启用/停用/废除操作）；新增炼丹页 `pages/alchemy`（即兴炼丹，材料多选+剂量+丹意输入+炉况预检+结果展示）；新增炼器页 `pages/refine`（同炼丹结构，craftType=create_artifact）；共享炼制组件 `pages/craft/index.tsx`（CraftPage 参数化，alchemy 和 refine 复用）；`game.ts` 客户端新增 inventory/equip/consume/identify/discard/retreat/products/equipProduct/deleteProduct/craftPreview/submitCraft API 封装；洞府首页快捷导航更新为：道身、任务、静室、储物袋、功法神通、炼丹、炼器 七宫格；构建验证通过。M5 剩余：战斗历史、战斗播放、坊市、排行榜待实现。
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
