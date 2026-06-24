# M7 UI 重设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor all 19 mini program pages into a unified "水墨卷轴 × 圆润面包" design system with shared components, CSS variables, and consistent rpx units.

**Architecture:** Establish a design token layer in `app.css`, create 10 shared components in `components/`, then migrate each page to use them. Background assets (宣纸纹理, 水墨山水) are CSS-only approximations for now, replaceable with PNG later.

**Tech Stack:** Taro + React, WeChat mini program, pure CSS (no frameworks), rpx units.

---

## File Structure

```
miniprogram/src/
├── app.css                          # MODIFY: CSS variables + global tokens
├── components/
│   ├── section-title/
│   │   ├── index.tsx                # CREATE: 【】书名号标题
│   │   └── index.css                # CREATE
│   ├── ink-divider/
│   │   ├── index.tsx                # CREATE: 墨迹分隔线
│   │   └── index.css                # CREATE
│   ├── bread-button/
│   │   ├── index.tsx                # CREATE: 面包感按钮
│   │   └── index.css                # CREATE
│   ├── scroll-card/
│   │   ├── index.tsx                # CREATE: 卷轴卡片
│   │   └── index.css                # CREATE
│   ├── nav-grid/
│   │   ├── index.tsx                # CREATE: 快捷入口网格
│   │   └── index.css                # CREATE
│   ├── tab-bar/
│   │   ├── index.tsx                # CREATE: 通用 tab 切换
│   │   └── index.css                # CREATE
│   ├── progress-bar/
│   │   ├── index.tsx                # CREATE: 进度条
│   │   └── index.css                # CREATE
│   ├── role-card/
│   │   ├── index.tsx                # CREATE: 角色信息卡片
│   │   └── index.css                # CREATE
│   ├── tag/
│   │   ├── index.tsx                # CREATE: 状态标签
│   │   └── index.css                # CREATE
│   └── badge/
│       ├── index.tsx                # CREATE: 红点通知
│       └── index.css                # CREATE
├── pages/
│   ├── cave/index.css               # MODIFY: 使用新设计系统
│   ├── tasks/index.css              # MODIFY
│   ├── inventory/index.css          # MODIFY
│   ├── retreat/index.css            # MODIFY
│   ├── abilities/index.css          # MODIFY
│   ├── battle-history/index.css     # MODIFY
│   ├── battle-result/index.css      # MODIFY
│   ├── market/index.css             # MODIFY
│   ├── rankings/index.css           # MODIFY
│   ├── mail/index.css               # MODIFY
│   ├── redeem/index.css             # MODIFY
│   ├── world-chat/index.css         # MODIFY
│   ├── auction/index.css            # MODIFY
│   ├── create/index.css             # MODIFY
│   ├── cultivator/index.css         # MODIFY
│   ├── login/index.css              # MODIFY
│   ├── index/index.css              # MODIFY
│   ├── craft/index.css              # MODIFY
│   ├── alchemy/index.css            # MODIFY
│   └── refine/index.css             # MODIFY
└── assets/                          # CREATE: 背景素材目录
    └── (宣纸纹理等 PNG 素材)
```

---

### Task 1: Design Tokens — CSS 变量

**Files:**
- Modify: `miniprogram/src/app.css`

- [ ] **Step 1: Add CSS variables to app.css**

Replace the entire content of `app.css` with:

```css
:root {
  /* 墨色层级 */
  --ink: #2c2115;
  --ink-light: #5a4a38;
  --ink-muted: #8a7a60;
  --ink-faint: #a09080;

  /* 强调色 */
  --cinnabar: #8d2f22;
  --cinnabar-light: #c45a3f;
  --cinnabar-dark: #a83525;

  /* 语义色 */
  --jade: #2f7d4d;
  --danger: #c43a31;
  --amber: #876a2f;

  /* 宣纸底色 */
  --paper: #f0e6d0;
  --paper-light: #f8f3ea;
  --paper-overlay: rgba(255, 252, 242, 0.5);
  --paper-warm: #f5f0e6;
}

page {
  min-height: 100%;
  color: var(--ink);
  background: var(--paper);
  font-family: "STKaiti", "KaiTi", "FangSong", serif;
  /* 后续可替换为宣纸纹理 PNG */
  /* background-image: url('/assets/bg-paper.png'); */
}

view,
text {
  box-sizing: border-box;
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds, no errors.

- [ ] **Step 3: Commit**

```bash
git add miniprogram/src/app.css
git commit -m "feat(m7): add CSS design tokens for ink-scroll × bread-soft UI"
```

---

### Task 2: Shared Component — SectionTitle

**Files:**
- Create: `miniprogram/src/components/section-title/index.tsx`
- Create: `miniprogram/src/components/section-title/index.css`

- [ ] **Step 1: Create component files**

`components/section-title/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

interface SectionTitleProps {
  children: string;
}

export default function SectionTitle({ children }: SectionTitleProps) {
  return (
    <View className='section-title'>
      <Text className='section-title-text'>{children}</Text>
    </View>
  );
}
```

`components/section-title/index.css`:
```css
.section-title {
  margin-bottom: 24rpx;
}

.section-title-text {
  color: var(--ink);
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  font-family: 'STKaiti', 'KaiTi', serif;
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add miniprogram/src/components/section-title/
git commit -m "feat(m7): add SectionTitle component"
```

---

### Task 3: Shared Component — InkDivider

**Files:**
- Create: `miniprogram/src/components/ink-divider/index.tsx`
- Create: `miniprogram/src/components/ink-divider/index.css`

- [ ] **Step 1: Create component files**

`components/ink-divider/index.tsx`:
```tsx
import { View } from '@tarojs/components';
import './index.css';

export default function InkDivider() {
  return <View className='ink-divider' />;
}
```

`components/ink-divider/index.css`:
```css
.ink-divider {
  height: 2rpx;
  margin: 28rpx 0;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(80, 60, 40, 0.15) 10%,
    rgba(80, 60, 40, 0.4) 50%,
    rgba(80, 60, 40, 0.15) 90%,
    transparent 100%
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add miniprogram/src/components/ink-divider/
git commit -m "feat(m7): add InkDivider component"
```

---

### Task 4: Shared Component — BreadButton

**Files:**
- Create: `miniprogram/src/components/bread-button/index.tsx`
- Create: `miniprogram/src/components/bread-button/index.css`

- [ ] **Step 1: Create component files**

`components/bread-button/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

interface BreadButtonProps {
  variant?: 'primary' | 'ghost';
  children: string;
  onClick?: () => void;
}

export default function BreadButton({ variant = 'primary', children, onClick }: BreadButtonProps) {
  return (
    <View className={`bread-btn bread-btn--${variant}`} onClick={onClick}>
      <Text className='bread-btn-text'>{children}</Text>
    </View>
  );
}
```

`components/bread-button/index.css`:
```css
.bread-btn {
  padding: 26rpx;
  text-align: center;
  border-radius: 32rpx;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
}

.bread-btn--primary {
  background: linear-gradient(135deg, var(--cinnabar), var(--cinnabar-dark));
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(141, 47, 34, 0.3),
              inset 0 2rpx 0 rgba(255, 255, 255, 0.15);
}

.bread-btn--ghost {
  background: rgba(141, 47, 34, 0.06);
  color: var(--cinnabar);
  border: 2rpx solid rgba(141, 47, 34, 0.15);
}

.bread-btn-text {
  color: inherit;
  font-size: inherit;
  font-weight: inherit;
}
```

- [ ] **Step 2: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add miniprogram/src/components/bread-button/
git commit -m "feat(m7): add BreadButton component"
```

---

### Task 5: Shared Components — ScrollCard, NavGrid, TabBar

**Files:**
- Create: `miniprogram/src/components/scroll-card/index.tsx` + `index.css`
- Create: `miniprogram/src/components/nav-grid/index.tsx` + `index.css`
- Create: `miniprogram/src/components/tab-bar/index.tsx` + `index.css`

- [ ] **Step 1: Create ScrollCard**

`components/scroll-card/index.tsx`:
```tsx
import { View } from '@tarojs/components';
import './index.css';

interface ScrollCardProps {
  children: any;
}

export default function ScrollCard({ children }: ScrollCardProps) {
  return <View className='scroll-card'>{children}</View>;
}
```

`components/scroll-card/index.css`:
```css
.scroll-card {
  background: var(--paper-overlay);
  border: 2rpx solid rgba(80, 60, 40, 0.12);
  padding: 24rpx 28rpx;
  margin-bottom: 16rpx;
  border-radius: 8rpx;
}
```

- [ ] **Step 2: Create NavGrid**

`components/nav-grid/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

export interface NavItem {
  icon: string;
  label: string;
  badge?: boolean;
  onClick?: () => void;
}

interface NavGridProps {
  items: NavItem[];
  columns?: number;
}

export default function NavGrid({ items, columns = 3 }: NavGridProps) {
  return (
    <View className='nav-grid' style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {items.map((item, i) => (
        <View key={i} className='nav-item' onClick={item.onClick}>
          <View className='nav-icon-wrap'>
            <Text className='nav-icon-text'>{item.icon}</Text>
            {item.badge && <View className='badge-dot' />}
          </View>
          <Text className='nav-label'>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
```

`components/nav-grid/index.css`:
```css
.nav-grid {
  display: grid;
  gap: 16rpx;
}

.nav-item {
  text-align: center;
  padding: 20rpx 8rpx;
  background: var(--paper-overlay);
  border-radius: 24rpx;
  border: 2rpx solid rgba(80, 60, 40, 0.06);
}

.nav-icon-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
}

.nav-icon-text {
  font-size: 40rpx;
}

.nav-label {
  display: block;
  font-size: 20rpx;
  color: var(--ink-light);
  margin-top: 8rpx;
  letter-spacing: 1rpx;
}

.badge-dot {
  position: absolute;
  top: -4rpx;
  right: -8rpx;
  width: 14rpx;
  height: 14rpx;
  background: var(--danger);
  border-radius: 50%;
}
```

- [ ] **Step 3: Create TabBar**

`components/tab-bar/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

export interface TabItem {
  key: string;
  label: string;
}

interface TabBarProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export default function TabBar({ items, active, onChange }: TabBarProps) {
  return (
    <View className='tabs'>
      {items.map((item) => (
        <View
          key={item.key}
          className={`tab ${item.key === active ? 'tab--active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <Text className='tab-text'>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}
```

`components/tab-bar/index.css`:
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
}

.tab--active {
  background: rgba(141, 47, 34, 0.08);
}

.tab-text {
  font-size: 24rpx;
  color: var(--ink-muted);
}

.tab--active .tab-text {
  color: var(--cinnabar);
  font-weight: 600;
}
```

- [ ] **Step 4: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/src/components/scroll-card/ miniprogram/src/components/nav-grid/ miniprogram/src/components/tab-bar/
git commit -m "feat(m7): add ScrollCard, NavGrid, TabBar components"
```

---

### Task 6: Shared Components — ProgressBar, RoleCard, Tag, Badge

**Files:**
- Create: `miniprogram/src/components/progress-bar/index.tsx` + `index.css`
- Create: `miniprogram/src/components/role-card/index.tsx` + `index.css`
- Create: `miniprogram/src/components/tag/index.tsx` + `index.css`
- Create: `miniprogram/src/components/badge/index.tsx` + `index.css`

- [ ] **Step 1: Create ProgressBar**

`components/progress-bar/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

interface ProgressBarProps {
  label: string;
  percent: number;
}

export default function ProgressBar({ label, percent }: ProgressBarProps) {
  return (
    <View className='progress-wrap'>
      <Text className='progress-label'>{label}</Text>
      <View className='progress-bar'>
        <View className='progress-fill' style={{ width: `${Math.min(percent, 100)}%` }} />
      </View>
      <Text className='progress-val'>{percent}%</Text>
    </View>
  );
}
```

`components/progress-bar/index.css`:
```css
.progress-wrap {
  padding: 20rpx 28rpx;
  background: rgba(255, 252, 242, 0.4);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.progress-label {
  font-size: 22rpx;
  color: var(--cinnabar);
  white-space: nowrap;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background: rgba(80, 60, 40, 0.08);
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cinnabar), var(--cinnabar-light));
  border-radius: 6rpx;
}

.progress-val {
  font-size: 22rpx;
  color: var(--ink-muted);
}
```

- [ ] **Step 2: Create RoleCard**

`components/role-card/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

interface RoleCardProps {
  name: string;
  subtitle: string;
  level?: string;
  avatar?: string;
}

export default function RoleCard({ name, subtitle, level, avatar }: RoleCardProps) {
  return (
    <View className='role-card'>
      <View className='role-avatar'>
        <Text className='role-avatar-text'>{avatar || name[0]}</Text>
      </View>
      <View className='role-info'>
        <Text className='role-name'>{name}</Text>
        <Text className='role-desc'>{subtitle}</Text>
      </View>
      {level && (
        <View className='role-level'>
          <Text className='role-level-text'>{level}</Text>
        </View>
      )}
    </View>
  );
}
```

`components/role-card/index.css`:
```css
.role-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 28rpx;
  background: var(--paper-overlay);
  border: 2rpx solid rgba(80, 60, 40, 0.1);
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
  flex-shrink: 0;
}

.role-avatar-text {
  font-size: 36rpx;
  color: #fff;
  font-weight: 700;
}

.role-info {
  flex: 1;
}

.role-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: var(--ink);
}

.role-desc {
  display: block;
  font-size: 22rpx;
  color: var(--ink-muted);
  margin-top: 4rpx;
}

.role-level {
  padding: 6rpx 16rpx;
  background: rgba(141, 47, 34, 0.08);
  border-radius: 12rpx;
}

.role-level-text {
  font-size: 22rpx;
  color: var(--cinnabar);
  font-weight: 600;
}
```

- [ ] **Step 3: Create Tag**

`components/tag/index.tsx`:
```tsx
import { View, Text } from '@tarojs/components';
import './index.css';

interface TagProps {
  variant?: 'default' | 'win' | 'lose' | 'equipped';
  children: string;
}

export default function Tag({ variant = 'default', children }: TagProps) {
  return (
    <View className={`tag tag--${variant}`}>
      <Text className='tag-text'>{children}</Text>
    </View>
  );
}
```

`components/tag/index.css`:
```css
.tag {
  display: inline-block;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
}

.tag-text {
  font-size: 22rpx;
  font-weight: 600;
}

.tag--default {
  background: rgba(80, 60, 40, 0.06);
}
.tag--default .tag-text { color: var(--ink-light); }

.tag--win {
  background: rgba(47, 125, 77, 0.1);
}
.tag--win .tag-text { color: var(--jade); }

.tag--lose {
  background: rgba(196, 58, 49, 0.1);
}
.tag--lose .tag-text { color: var(--danger); }

.tag--equipped {
  background: rgba(47, 125, 77, 0.1);
}
.tag--equipped .tag-text { color: var(--jade); }
```

- [ ] **Step 4: Create Badge**

`components/badge/index.tsx`:
```tsx
import { View } from '@tarojs/components';
import './index.css';

interface BadgeProps {
  count?: number;
}

export default function Badge({ count }: BadgeProps) {
  if (count && count > 0) {
    return (
      <View className='badge-count'>
        <Text className='badge-count-text'>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  }
  return <View className='badge-dot' />;
}
```

`components/badge/index.css`:
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

.badge-count {
  position: absolute;
  top: -8rpx;
  right: -12rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 6rpx;
  background: var(--danger);
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.badge-count-text {
  font-size: 18rpx;
  color: #fff;
  font-weight: 600;
}
```

- [ ] **Step 5: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/src/components/progress-bar/ miniprogram/src/components/role-card/ miniprogram/src/components/tag/ miniprogram/src/components/badge/
git commit -m "feat(m7): add ProgressBar, RoleCard, Tag, Badge components"
```

---

### Task 7: Migrate Cave Page

**Files:**
- Modify: `miniprogram/src/pages/cave/index.tsx`
- Modify: `miniprogram/src/pages/cave/index.css`

- [ ] **Step 1: Rewrite cave/index.css**

Replace entire content with:

```css
.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 20rpx;
  background: var(--paper);
  position: relative;
  overflow: hidden;
}

.section-title {
  margin-bottom: 24rpx;
}

.section-title-text {
  color: var(--ink);
  font-size: 34rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.subtitle {
  display: block;
  color: var(--ink-muted);
  font-size: 24rpx;
  line-height: 1.6;
  margin-top: 8rpx;
}

.ink-divider {
  height: 2rpx;
  margin: 28rpx 0;
  background: linear-gradient(90deg, transparent 0%, rgba(80,60,40,0.15) 10%, rgba(80,60,40,0.4) 50%, rgba(80,60,40,0.15) 90%, transparent 100%);
}

.bread-btn {
  padding: 26rpx;
  text-align: center;
  border-radius: 32rpx;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 6rpx;
}

.bread-btn.primary {
  background: linear-gradient(135deg, var(--cinnabar), var(--cinnabar-dark));
  color: #fff;
  box-shadow: 0 8rpx 32rpx rgba(141,47,34,0.3), inset 0 2rpx 0 rgba(255,255,255,0.15);
}

.bread-btn.ghost {
  background: rgba(141,47,34,0.06);
  color: var(--cinnabar);
  border: 2rpx solid rgba(141,47,34,0.15);
}
```

- [ ] **Step 2: Update cave/index.tsx to use shared components**

Import and use SectionTitle, InkDivider, BreadButton, NavGrid. Replace inline title/divider/button markup with component usage. Keep the existing navigation logic (Taro.navigateTo) intact.

- [ ] **Step 3: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/src/pages/cave/
git commit -m "feat(m7): migrate cave page to ink-scroll design system"
```

---

### Task 8: Migrate Tasks Page

**Files:**
- Modify: `miniprogram/src/pages/tasks/index.tsx`
- Modify: `miniprogram/src/pages/tasks/index.css`

- [ ] **Step 1: Rewrite tasks/index.css with design tokens**

Replace all hardcoded colors with CSS variables. Keep existing class structure but update values to match the design spec.

- [ ] **Step 2: Update tasks/index.tsx to use shared components**

Replace title/divider/button markup with SectionTitle, InkDivider, BreadButton.

- [ ] **Step 3: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/src/pages/tasks/
git commit -m "feat(m7): migrate tasks page to ink-scroll design system"
```

---

### Task 9: Migrate Inventory, Retreat, Abilities Pages

**Files:**
- Modify: `miniprogram/src/pages/inventory/index.css`
- Modify: `miniprogram/src/pages/retreat/index.css`
- Modify: `miniprogram/src/pages/abilities/index.css`

- [ ] **Step 1: Rewrite inventory/index.css**

Replace all hardcoded values with CSS variables. Unify px → rpx where still using px.

- [ ] **Step 2: Rewrite retreat/index.css**

Same: replace hardcoded values, unify units.

- [ ] **Step 3: Rewrite abilities/index.css**

Same: replace hardcoded values, unify units.

- [ ] **Step 4: Update each tsx to use shared components**

Replace title/divider/button markup with SectionTitle, InkDivider, BreadButton, TabBar in each page.

- [ ] **Step 5: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/src/pages/inventory/ miniprogram/src/pages/retreat/ miniprogram/src/pages/abilities/
git commit -m "feat(m7): migrate inventory, retreat, abilities pages to design system"
```

---

### Task 10: Migrate Battle History, Battle Result Pages

**Files:**
- Modify: `miniprogram/src/pages/battle-history/index.css`
- Modify: `miniprogram/src/pages/battle-history/index.tsx`
- Modify: `miniprogram/src/pages/battle-result/index.css`
- Modify: `miniprogram/src/pages/battle-result/index.tsx`

- [ ] **Step 1: Rewrite battle-history/index.css**

Replace all hardcoded values with CSS variables.

- [ ] **Step 2: Update battle-history/index.tsx**

Use TabBar, ScrollCard, Tag, SectionTitle, InkDivider, BreadButton.

- [ ] **Step 3: Rewrite battle-result/index.css**

Replace all hardcoded values with CSS variables.

- [ ] **Step 4: Update battle-result/index.tsx**

Use SectionTitle, InkDivider, ScrollCard.

- [ ] **Step 5: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/src/pages/battle-history/ miniprogram/src/pages/battle-result/
git commit -m "feat(m7): migrate battle-history, battle-result pages to design system"
```

---

### Task 11: Migrate Market, Rankings, Auction Pages

**Files:**
- Modify: `miniprogram/src/pages/market/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/rankings/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/auction/index.css` + `index.tsx`

- [ ] **Step 1: Rewrite market/index.css + update tsx**

Replace hardcoded values with CSS variables, use TabBar, ScrollCard, BreadButton.

- [ ] **Step 2: Rewrite rankings/index.css + update tsx**

Replace hardcoded values with CSS variables, use TabBar, ScrollCard.

- [ ] **Step 3: Rewrite auction/index.css + update tsx**

Replace hardcoded values with CSS variables, use TabBar, ScrollCard, BreadButton.

- [ ] **Step 4: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/src/pages/market/ miniprogram/src/pages/rankings/ miniprogram/src/pages/auction/
git commit -m "feat(m7): migrate market, rankings, auction pages to design system"
```

---

### Task 12: Migrate Mail, Redeem, World Chat Pages

**Files:**
- Modify: `miniprogram/src/pages/mail/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/redeem/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/world-chat/index.css` + `index.tsx`

- [ ] **Step 1: Rewrite mail/index.css + update tsx**

Replace hardcoded values, use ScrollCard, BreadButton, Badge.

- [ ] **Step 2: Rewrite redeem/index.css + update tsx**

Replace hardcoded values, use BreadButton, ScrollCard.

- [ ] **Step 3: Rewrite world-chat/index.css + update tsx**

Replace hardcoded values. World chat has unique flex-column layout — keep it but use design tokens.

- [ ] **Step 4: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/src/pages/mail/ miniprogram/src/pages/redeem/ miniprogram/src/pages/world-chat/
git commit -m "feat(m7): migrate mail, redeem, world-chat pages to design system"
```

---

### Task 13: Migrate Login, Index, Create, Cultivator Pages

**Files:**
- Modify: `miniprogram/src/pages/login/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/index/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/create/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/cultivator/index.css` + `index.tsx`

- [ ] **Step 1: Rewrite login/index.css + update tsx**

Replace all px → rpx, hardcoded colors → CSS variables, use BreadButton.

- [ ] **Step 2: Rewrite index/index.css + update tsx**

Same treatment.

- [ ] **Step 3: Rewrite create/index.css + update tsx**

Same treatment.

- [ ] **Step 4: Rewrite cultivator/index.css + update tsx**

Same treatment.

- [ ] **Step 5: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add miniprogram/src/pages/login/ miniprogram/src/pages/index/ miniprogram/src/pages/create/ miniprogram/src/pages/cultivator/
git commit -m "feat(m7): migrate login, index, create, cultivator pages to design system"
```

---

### Task 14: Migrate Craft, Alchemy, Refine Pages

**Files:**
- Modify: `miniprogram/src/pages/craft/index.css` + `index.tsx`
- Modify: `miniprogram/src/pages/alchemy/index.css`
- Modify: `miniprogram/src/pages/refine/index.css`

- [ ] **Step 1: Rewrite craft/index.css**

Replace all hardcoded values with CSS variables. This is the largest CSS file (252 lines) — focus on token replacement, keep class structure.

- [ ] **Step 2: Update craft/index.tsx**

Use SectionTitle, InkDivider, BreadButton, ScrollCard where applicable.

- [ ] **Step 3: Update alchemy/index.css and refine/index.css**

These are `@import '../craft/index.css'` — they inherit automatically after craft is updated.

- [ ] **Step 4: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add miniprogram/src/pages/craft/ miniprogram/src/pages/alchemy/ miniprogram/src/pages/refine/
git commit -m "feat(m7): migrate craft, alchemy, refine pages to design system"
```

---

### Task 15: Safe Area & Long Text Optimization

**Files:**
- Modify: `miniprogram/src/app.css`

- [ ] **Step 1: Add safe area padding to app.css**

Add to `page` rule:
```css
page {
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 2: Add long text reading styles to app.css**

```css
/* 长文本阅读优化 */
.text-body {
  font-size: 28rpx;
  line-height: 1.8;
  color: var(--ink);
  letter-spacing: 1rpx;
}

.text-secondary {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--ink-muted);
}
```

- [ ] **Step 3: Build and verify**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add miniprogram/src/app.css
git commit -m "feat(m7): add safe area padding and long text reading styles"
```

---

### Task 16: Final Build Verification & TODO Update

**Files:**
- Modify: `Daoyou/TODO.md`

- [ ] **Step 1: Full build verification**

Run: `npm run build:weapp --prefix miniprogram`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Update TODO.md**

Mark M7 items as completed in the main TODO.md. Add changelog entry.

- [ ] **Step 3: Commit**

```bash
git add Daoyou/TODO.md
git commit -m "docs: update TODO.md with M7 completion"
```
