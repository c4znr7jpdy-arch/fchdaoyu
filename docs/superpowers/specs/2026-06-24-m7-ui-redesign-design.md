# M7 UI 重设计：水墨卷轴 × 圆润面包融合方案

## 目标

将小程序 19 个页面从当前无统一规范、大量 copy-paste 的状态，重构为一套有设计系统支撑的「水墨卷轴 × 圆润面包」融合风格。核心感受：**古朴空灵 + 蓬松柔软**。

## 设计语言

### 1. 色彩体系

**主色板（CSS 变量）：**

| 变量 | 色值 | 用途 |
|------|------|------|
| `--ink` | `#2c2115` | 主文字、标题 |
| `--ink-light` | `#5a4a38` | 次要文字、图标描边 |
| `--ink-muted` | `#8a7a60` | 辅助信息、时间戳 |
| `--ink-faint` | `#a09080` | 最弱文字 |
| `--cinnabar` | `#8d2f22` | 主强调色（按钮、标签、红点） |
| `--cinnabar-light` | `#c45a3f` | 渐变终点、进度条 |
| `--jade` | `#2f7d4d` | 成功、胜局、正面状态 |
| `--danger` | `#c43a31` | 失败、败局、警示 |
| `--amber` | `#876a2f` | 加载中、检查状态 |
| `--paper` | `#f0e6d0` | 页面底色（宣纸） |
| `--paper-light` | `#f8f3ea` | 卡片背景 |
| `--paper-overlay` | `rgba(255,252,242,0.5)` | 半透明卡片 |
| `--paper-warm` | `#f5f0e6` | 温暖底色变体 |

**背景图：**
- 全局：宣纸纤维纹理 PNG（平铺）
- 场景装饰：水墨山水画 PNG（各场景不同，见下方）

### 2. 字体

微信小程序无法加载 Google Fonts，使用系统内置楷体：

```css
font-family: 'STKaiti', 'KaiTi', 'FangSong', serif;
```

- 标题：STKaiti（楷体，系统自带）
- 正文：STKaiti / KaiTi
- 若需书法体效果，可后续引入本地 `.ttf` 字体文件（需评估包体大小影响）
- 字号体系：
  - 页面标题：`40rpx`，font-weight 700
  - 区块标题（【】）：`34rpx`，STKaiti 楷体
  - 正文：`28rpx`
  - 辅助文字：`24rpx`
  - 最小文字：`22rpx`

### 3. 布局基础

**页面容器：**
```css
.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 20rpx;
  /* 宣纸纹理背景图 + 基底色 */
  background: var(--paper);
  background-image: url('/assets/bg-paper.png');
  position: relative;
  overflow: hidden;
}
```

**场景背景层（伪元素或独立 view）：**
- 每个页面可在 `.page` 内放置一个背景装饰层
- 使用绝对定位，`pointer-events: none`，低透明度
- 各场景素材见下方

### 4. 组件规范

#### 4.1 【】书名号标题
```css
.section-title {
  color: var(--ink);
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  margin-bottom: 24rpx;
  font-family: 'STKaiti', 'KaiTi', serif;
}
```
```html
<div class="section-title">【快捷入口】</div>
```

#### 4.2 墨迹分隔线
```css
.ink-divider {
  height: 2rpx;
  margin: 28rpx 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(80,60,40,0.15) 10%,
    rgba(80,60,40,0.4) 50%,
    rgba(80,60,40,0.15) 90%,
    transparent 100%
  );
}
```

#### 4.3 面包按钮
```css
.btn-primary {
  padding: 26rpx;
  background: linear-gradient(135deg, var(--cinnabar), #a83525);
  color: #fff;
  text-align: center;
  border-radius: 32rpx;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
  border: none;
  box-shadow: 0 8rpx 32rpx rgba(141,47,34,0.3),
              inset 0 2rpx 0 rgba(255,255,255,0.15);
}

.btn-ghost {
  padding: 26rpx;
  background: rgba(141,47,34,0.06);
  color: var(--cinnabar);
  text-align: center;
  border-radius: 32rpx;
  font-size: 28rpx;
  border: 2rpx solid rgba(141,47,34,0.15);
}
```

#### 4.4 卷轴卡片
```css
.scroll-card {
  background: var(--paper-overlay);
  border: 2rpx solid rgba(80,60,40,0.12);
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  border-radius: 8rpx;
}
```

#### 4.5 快捷入口网格
```css
.nav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.nav-item {
  text-align: center;
  padding: 20rpx 8rpx;
  background: var(--paper-overlay);
  border-radius: 24rpx;
  border: 2rpx solid rgba(80,60,40,0.06);
}
```

#### 4.6 Tab 栏
```css
.tabs {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
}

.tab {
  flex: 1;
  padding: 16rpx;
  text-align: center;
  background: var(--paper-overlay);
  border-radius: 20rpx;
  font-size: 24rpx;
  color: var(--ink-muted);
}

.tab.active {
  background: rgba(141,47,34,0.08);
  color: var(--cinnabar);
  font-weight: 600;
}
```

#### 4.7 状态标签
```css
.tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
  font-weight: 600;
}
.tag-win { color: var(--jade); background: rgba(47,125,77,0.1); }
.tag-lose { color: var(--danger); background: rgba(196,58,49,0.1); }
.tag-equipped { color: var(--jade); background: rgba(47,125,77,0.1); }
```

#### 4.8 进度条
```css
.progress-wrap {
  padding: 20rpx 28rpx;
  background: rgba(255,252,242,0.4);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.progress-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(80,60,40,0.08);
  border-radius: 6rpx;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cinnabar), var(--cinnabar-light));
  border-radius: 6rpx;
}
```

#### 4.9 红点通知
```css
.badge-dot {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 14rpx;
  height: 14rpx;
  background: var(--danger);
  border-radius: 50%;
}
```

#### 4.10 角色卡片
```css
.role-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 28rpx;
  background: var(--paper-overlay);
  border: 2rpx solid rgba(80,60,40,0.1);
  border-radius: 24rpx;
}
.role-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: linear-gradient(135deg, var(--cinnabar), var(--cinnabar-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: #fff;
}
```

### 5. 场景背景素材

每个页面的背景装饰层使用不同的水墨画素材（PNG，低透明度叠加）：

| 场景 | 背景元素 | 适用页面 |
|------|----------|----------|
| 洞府 | 远山 + 松树 + 云雾 | index, cave |
| 战斗 | 浓墨远山 + 战旗剪影 | battle-history, battle-result |
| 炼丹 | 烟雾缭绕 + 炉火微光 | alchemy, refine |
| 储物袋 | 竹林掩映 | inventory |
| 排行榜 | 云海 + 山峰剪影 | rankings |
| 任务 | 卷轴展开 + 墨迹 | tasks |
| 功法 | 经卷 + 墨迹 | abilities |
| 修行 | 静室 + 莲花 | retreat |
| 坊市 | 集市热闹 + 墨色 | market, auction |
| 聊天 | 云气缭绕 | world-chat |
| 邮件 | 信笺 + 印章 | mail |
| 兑换 | 卷轴 + 印章 | redeem |
| 登录 | 大幅山水画卷 | login, create |

### 6. 需要的资源文件

- `assets/bg-paper.png` — 宣纸纤维纹理（平铺）
- `assets/ink-mountain-cave.png` — 洞府背景
- `assets/ink-mountain-battle.png` — 战斗背景
- `assets/ink-smoke-alchemy.png` — 炼丹背景
- `assets/ink-bamboo.png` — 储物袋背景
- `assets/ink-cloud.png` — 排行榜背景
- `assets/ink-divider.png` — 墨迹分隔线（可选，替代 CSS）
- 各场景水墨图标 SVG

### 7. 共享组件清单

在 `miniprogram/src/components/` 下新建：

| 组件 | 文件 | 用途 |
|------|------|------|
| SectionTitle | `section-title/index.tsx` | 【】书名号标题 |
| InkDivider | `ink-divider/index.tsx` | 墨迹分隔线 |
| BreadButton | `bread-button/index.tsx` | 面包感按钮（primary/ghost） |
| ScrollCard | `scroll-card/index.tsx` | 卷轴卡片 |
| NavGrid | `nav-grid/index.tsx` | 快捷入口网格 |
| TabBar | `tab-bar/index.tsx` | 通用 tab 切换 |
| ProgressBar | `progress-bar/index.tsx` | 进度条 |
| RoleCard | `role-card/index.tsx` | 角色信息卡片 |
| Tag | `tag/index.tsx` | 状态标签 |
| Badge | `badge/index.tsx` | 红点通知 |

### 8. 实施范围

**Phase 1：设计基础**
- 建立 CSS 变量（`app.css` 中 `:root`）
- 创建宣纸纹理背景图
- 创建共享组件
- 统一所有 CSS 为 rpx 单位

**Phase 2：逐页迁移**
- 按优先级逐页替换内联样式为共享组件
- 为每个页面添加对应的场景背景装饰
- 处理安全区域适配（`env(safe-area-inset-*`)

**Phase 3：体验优化**
- 长文本阅读体验（行高、段距）
- 战斗日志滚动区域
- 真机测试与调整

## 约束

- 不引入新的 CSS 框架（Tailwind 等），保持纯 CSS
- 所有单位使用 rpx
- 背景素材优先使用 PNG，控制包体大小
- 组件 API 保持简单，不过度抽象
