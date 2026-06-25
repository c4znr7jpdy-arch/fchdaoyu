# M8 上线部署指南

## 前置条件

- 服务器：`47.242.208.64`（阿里云轻量 Ubuntu 22.04）
- 已安装：Bun、Node.js 20、PostgreSQL 14、Redis、Nginx、pm2
- 已部署：后端代码在 `/root/daoyou`，pm2 守护运行在 3000 端口

## 第一步：购买域名并解析

1. 购买域名（阿里云/腾讯云/Cloudflare 等）
2. 添加 A 记录，将域名指向 `47.242.208.64`
3. 等待 DNS 生效（通常 5-10 分钟）

## 第二步：配置 HTTPS

```bash
# 1. 安装 certbot
apt update && apt install -y certbot python3-certbot-nginx

# 2. 先确保 80 端口可达（当前已有 Nginx 配置，certbot 会自动处理）
# 3. 申请证书（替换 YOUR_DOMAIN）
certbot --nginx -d YOUR_DOMAIN --non-interactive --agree-tos -m YOUR_EMAIL

# 4. 验证证书自动续期
systemctl status certbot.timer

# 5. 测试 Nginx 配置
nginx -t && systemctl reload nginx
```

## 第三步：配置微信小程序合法请求域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入「开发管理 → 开发设置 → 服务器域名」
3. 在 `request` 合法域名中添加：`https://YOUR_DOMAIN`
4. 保存

## 第四步：配置生产环境变量

```bash
# SSH 到服务器
ssh root@47.242.208.64

# 编辑环境变量文件（假设在 /root/daoyou/.env）
cd /root/daoyou
nano .env
```

需要配置的变量：
- `WECHAT_MINI_APPID=wx3b4802aee0f5b7db`
- `WECHAT_MINI_SECRET=你的微信小程序 AppSecret`
- `DATABASE_URL=postgresql://daoyou:密码@localhost:5432/daoyou`
- `REDIS_URL=redis://localhost:6379`
- `BETTER_AUTH_SECRET=随机密钥字符串`
- `AUTH_SECRET=随机密钥字符串`

```bash
# 重启后端
pm2 restart daoyou
```

## 第五步：更新小程序 env.ts

```typescript
// miniprogram/src/config/env.ts
// 将 release 的 apiBaseUrl 改为 HTTPS 域名
release: {
  apiBaseUrl: 'https://YOUR_DOMAIN',
},
```

然后重新构建并上传：
```bash
cd miniprogram && npm run build:weapp
```

## 第六步：上传体验版

1. 打开微信开发者工具
2. 导入 `miniprogram/dist` 目录
3. 点击「上传」填写版本号和描述
4. 在微信公众平台「管理 → 版本管理 → 体验版」中设置

## 第七步：提交审核

1. 在微信公众平台「管理 → 版本管理 → 正式版」中提交审核
2. 填写必要的审核信息（功能介绍、测试账号等）
3. 等待审核通过后发布

## 环境变量清单

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `WECHAT_MINI_APPID` | 微信小程序 AppID | `wx3b4802aee0f5b7db` |
| `WECHAT_MINI_SECRET` | 微信小程序 AppSecret | （从微信公众平台获取） |
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://daoyou:xxx@localhost:5432/daoyou` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |
| `BETTER_AUTH_SECRET` | Better Auth 签名密钥 | （随机生成） |
| `AUTH_SECRET` | 通用认证密钥 | （随机生成） |
| `TENCENT_CLOUD_SECRET_ID` | 腾讯云 Secret ID（内容安全） | （可选） |
| `TENCENT_CLOUD_SECRET_KEY` | 腾讯云 Secret Key（内容安全） | （可选） |
