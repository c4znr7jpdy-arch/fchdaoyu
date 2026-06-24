# M7 水墨素材库设计文档

## 概述

为「万界道友」微信小程序创建 SVG 水墨素材库，替代当前纯色背景，实现「水墨卷轴 × 圆润面包」UI 风格中的装饰层。

## 技术方案

**纯 SVG 方案**：所有素材使用 SVG 格式，代码内联生成，不依赖外部图片。

选择理由：
- 微信小程序主包 2MB 限制，SVG 体积优势明显（每个 ~1KB，总计 ~16KB）
- `feTurbulence` 滤镜可模拟宣纸纤维纹理
- SVG stroke 绘制完美适配白描图标风格
- 可通过 CSS `filter` 变色，适配不同主题
- 水墨风格本身就是写意的，SVG 的简洁感契合

## 文件结构

```
miniprogram/src/
├── assets/
│   ├── bg-paper.svg              # 宣纸纹理（可平铺）
│   ├── bg-paper-aged.svg         # 做旧宣纸（可平铺）
│   ├── ink-mountain-cave.svg     # 洞府背景
│   ├── ink-mountain-battle.svg   # 战斗背景
│   ├── ink-smoke-alchemy.svg     # 炼丹背景
│   ├── ink-bamboo.svg            # 储物袋背景
│   ├── ink-cloud.svg             # 排行榜背景
│   ├── ink-lotus.svg             # 修行背景
│   ├── icon-message.svg          # 传音玉简图标
│   ├── icon-cave.svg             # 洞府图标
│   ├── icon-bag.svg              # 储物袋图标
│   ├── icon-skill.svg            # 功法图标
│   ├── icon-alchemy.svg          # 炼丹图标
│   ├── icon-market.svg           # 坊市图标
│   ├── icon-avatar.svg           # 道身图标
│   └── icon-rank.svg             # 排行榜图标
```

共 16 个 SVG 文件。

## 素材规格

### 1. 宣纸纹理（2 个）

**bg-paper.svg**
- 用途：页面 `background-image`，替代当前纯色 `var(--paper)`
- 技术：`<feTurbulence>` 滤镜模拟纸张纤维
- 参数：`type="fractalNoise" baseFrequency="0.8" numOctaves="4"`
- 特性：可平铺（`stitchTiles="stitch"`）
- 底色：`#f0e6d0`（与 `--paper` 一致）

**bg-paper-aged.svg**
- 用途：需要做旧感的页面背景
- 技术：同上，`baseFrequency="0.65" numOctaves="5"`，更深的纤维感
- 底色：渐变 `#f5f0e6` → `#ede4d0` → `#e8dcc4`

### 2. 场景背景（6 个）

所有场景背景规格统一：
- viewBox：`0 0 400 200`
- 定位：底部对齐（`position: absolute; bottom: 0`）
- 高度：页面底部 200rpx 区域
- 透明度：元素使用 `rgba` 低透明度，营造水墨晕染感

| 文件 | 场景 | 主要元素 | 色调 |
|------|------|----------|------|
| `ink-mountain-cave.svg` | 洞府首页 | 远山椭圆 + 松树线条 + 云雾 | 灰褐 `rgba(160,150,130,0.2)` |
| `ink-mountain-battle.svg` | 战斗相关 | 浓墨远山 + 战旗三角 + 近景 | 深墨 `rgba(90,80,65,0.3)` |
| `ink-smoke-alchemy.svg` | 炼丹/炼器 | 烟雾椭圆 + 炉火暖光 | 灰 + 暖橙 `rgba(196,90,63,0.08)` |
| `ink-bamboo.svg` | 储物袋 | 竹竿线条 + 竹叶椭圆 | 青灰 `rgba(100,120,80,0.2)` |
| `ink-cloud.svg` | 排行榜 | 云海椭圆 + 山峰三角 | 浅灰 `rgba(180,170,150,0.18)` |
| `ink-lotus.svg` | 静室修行 | 莲花路径 + 静室轮廓 | 朱砂淡 `rgba(141,47,34,0.1)` |

### 3. 水墨白描图标（8 个）

所有图标规格统一：
- viewBox：`0 0 48 48`
- 绘制方式：`stroke` 描边，`fill="none"`
- 描边色：`#5a4a38`（`--ink-light`）
- 线宽：`1.5`
- 端点：`stroke-linecap="round" stroke-linejoin="round"`

| 文件 | 图标 | 造型描述 |
|------|------|----------|
| `icon-message.svg` | 传音玉简 | 水滴形玉简 + 内部音波纹 + 底部流苏 |
| `icon-cave.svg` | 洞府 | 五边形山洞轮廓 + 矩形门 |
| `icon-bag.svg` | 储物袋 | 矩形布袋 + 顶部绳结 + 内部横线 |
| `icon-skill.svg` | 功法 | 山形卷轴 + 顶部光环圆 + 底部横线 |
| `icon-alchemy.svg` | 炼丹 | 椭圆丹炉 + 上方火焰路径 |
| `icon-market.svg` | 坊市 | 三角鼎形 + 内部横线 + 底部圆点 |
| `icon-avatar.svg` | 道身 | 圆形头部 + 弧形身体 + 内部光轮 |
| `icon-rank.svg` | 排行榜 | 矩形四宫格 + 顶部两个徽章圆 |

图标变色：通过 CSS `filter: brightness()` 或直接修改 SVG `stroke` 属性。

### 4. 墨迹分隔线

保持现有 CSS 实现（简线、圆点、笔触三种样式），无需 SVG 替换。

## 页面适配

### 资源引用方式

微信小程序对 SVG 的支持有限制，需采用以下策略：

**场景背景（6 个）**：作为 Taro 资源导入，在 TSX 中通过 `<Image>` 组件渲染，绝对定位到底部。

```tsx
// 页面 TSX
import inkMountainCave from '../../assets/ink-mountain-cave.svg';

<View className="page-wrapper">
  <View className="page-content">{/* 页面内容 */}</View>
  <Image src={inkMountainCave} className="page-bg" mode="aspectFill" />
</View>
```

```css
/* 页面 WXSS */
.page-wrapper { position: relative; min-height: 100vh; }
.page-bg {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 200rpx;
  width: 100%;
  z-index: 0;
  pointer-events: none;
}
.page-content { position: relative; z-index: 1; }
```

**功能图标（8 个）**：作为 Taro 资源导入，通过 `<Image>` 组件渲染。

```tsx
import iconCave from '../../assets/icon-cave.svg';

<Image src={iconCave} className="nav-icon" />
```

**宣纸纹理**：采用 CSS 内联 SVG（data URI）方式，避免外部文件引用问题。

```css
page {
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E");
  background-size: 200px 200px;
}
```

> **注意**：`feTurbulence` 滤镜在部分低端机型可能渲染较慢，需真机测试。如遇性能问题，可降级为纯色背景。

## 页面-素材映射

| 页面 | 背景素材 | 图标 |
|------|----------|------|
| 洞府首页 | ink-mountain-cave.svg | icon-cave.svg |
| 道身信息 | — | icon-avatar.svg |
| 储物袋 | ink-bamboo.svg | icon-bag.svg |
| 任务中心 | — | — |
| 静室修行 | ink-lotus.svg | — |
| 功法神通 | — | icon-skill.svg |
| 炼丹 | ink-smoke-alchemy.svg | icon-alchemy.svg |
| 炼器 | ink-smoke-alchemy.svg | icon-alchemy.svg |
| 战斗历史 | ink-mountain-battle.svg | — |
| 战斗结果 | ink-mountain-battle.svg | — |
| 坊市 | — | icon-market.svg |
| 排行榜 | ink-cloud.svg | icon-rank.svg |
| 世界聊天 | — | icon-message.svg |
| 传音玉简 | — | icon-message.svg |
| 邮件 | — | icon-message.svg |
| 兑换码 | — | — |
| 创建角色 | — | — |
| 登录 | — | — |
| 角色详情 | — | — |

## 实现阶段

### Phase 1：基础素材
1. 创建 `assets/` 目录
2. 编写 `bg-paper.svg` 和 `bg-paper-aged.svg`
3. 验证微信小程序 SVG 加载

### Phase 2：场景背景
4. 编写 6 个场景背景 SVG
5. 逐页面添加背景图样式
6. 验证各页面背景显示

### Phase 3：功能图标
7. 编写 8 个水墨白描图标
8. 替换各页面内联图标
9. 验证图标显示和变色

### Phase 4：集成验证
10. 全局宣纸纹理叠加
11. 真机验证所有素材
12. 构建体积检查

## 约束与注意事项

- 微信小程序 `<image>` 组件支持 SVG 作为数据源，`<img>` 标签不支持
- SVG 文件需放在 `src/` 下，Taro 构建会自动处理资源引用
- `feTurbulence` 滤镜在部分低端机型可能渲染较慢，需真机测试
- 宣纸纹理使用 CSS data URI 内联，避免 `background-image` 对外部 SVG 的兼容性问题
- 场景背景和图标使用 `<Image>` 组件渲染，确保跨平台兼容
- 图标颜色通过 CSS `filter` 或 SVG 属性控制
