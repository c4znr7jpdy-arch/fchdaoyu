# M7 水墨素材库实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create 16 SVG ink-wash assets (paper textures, scene backgrounds, navigation icons) and integrate them into all 19 mini program pages.

**Architecture:** Pure SVG approach — paper textures via CSS data URI, scene backgrounds via a shared `SceneBg` React component wrapping `<Image>`, icons via `<Image>` imports. One reusable `SceneBg` component handles all background positioning, reducing per-page changes.

**Tech Stack:** Taro + React, WeChat mini program, SVG, CSS custom properties

---

## File Structure

```
miniprogram/src/
├── assets/                          # NEW — all SVG assets
│   ├── bg-paper.svg
│   ├── bg-paper-aged.svg
│   ├── ink-mountain-cave.svg
│   ├── ink-mountain-battle.svg
│   ├── ink-smoke-alchemy.svg
│   ├── ink-bamboo.svg
│   ├── ink-cloud.svg
│   ├── ink-lotus.svg
│   ├── icon-message.svg
│   ├── icon-cave.svg
│   ├── icon-bag.svg
│   ├── icon-skill.svg
│   ├── icon-alchemy.svg
│   ├── icon-market.svg
│   ├── icon-avatar.svg
│   └── icon-rank.svg
├── components/
│   └── scene-bg/                    # NEW — reusable background component
│       ├── index.tsx
│       └── index.css
├── app.css                          # MODIFY — add paper texture data URI
└── pages/
    ├── cave/index.css               # MODIFY — add scene background
    ├── retreat/index.css            # MODIFY — add scene background
    ├── craft/index.css              # MODIFY — add scene background (shared by alchemy/refine)
    ├── battle-history/index.css     # MODIFY — add scene background
    ├── battle-result/index.css      # MODIFY — add scene background
    ├── rankings/index.css           # MODIFY — add scene background
    └── inventory/index.css          # MODIFY — add scene background
```

---

### Task 1: Create assets directory and paper texture SVGs

**Files:**
- Create: `miniprogram/src/assets/bg-paper.svg`
- Create: `miniprogram/src/assets/bg-paper-aged.svg`

- [ ] **Step 1: Create assets directory**

Run: `mkdir -p e:/wechatproject/project2/Daoyou/miniprogram/src/assets`

- [ ] **Step 2: Write bg-paper.svg**

Create file `miniprogram/src/assets/bg-paper.svg` with the following content:

```xml
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
      <feComponentTransfer in="gray" result="faded">
        <feFuncA type="linear" slope="0.08"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="200" height="200" fill="#f0e6d0"/>
  <rect width="200" height="200" filter="url(#paper)"/>
</svg>
```

- [ ] **Step 3: Write bg-paper-aged.svg**

Create file `miniprogram/src/assets/bg-paper-aged.svg` with the following content:

```xml
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="aged" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="5" stitchTiles="stitch" result="noise"/>
      <feColorMatrix type="saturate" values="0" in="noise" result="gray"/>
      <feComponentTransfer in="gray" result="faded">
        <feFuncA type="linear" slope="0.12"/>
      </feComponentTransfer>
    </filter>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5f0e6"/>
      <stop offset="50%" stop-color="#ede4d0"/>
      <stop offset="100%" stop-color="#e8dcc4"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#base)"/>
  <rect width="200" height="200" filter="url(#aged)"/>
</svg>
```

- [ ] **Step 4: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/assets/bg-paper.svg miniprogram/src/assets/bg-paper-aged.svg
git commit -m "feat: add paper texture SVG assets"
```

---

### Task 2: Add paper texture to global styles

**Files:**
- Modify: `miniprogram/src/app.css`

- [ ] **Step 1: Add paper texture data URI to page selector**

Open `miniprogram/src/app.css`. In the `page` selector, replace the commented-out background-image line and add the texture as a data URI overlay:

```css
page {
  min-height: 100%;
  color: var(--ink);
  background-color: var(--paper);
  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncA type='linear' slope='0.06'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='200' height='200' fill='%23f0e6d0'/%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 200px 200px;
  font-family: "STKaiti", "KaiTi", "FangSong", serif;
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 2: Verify build**

Run: `cd e:/wechatproject/project2/Daoyou/miniprogram && npx taro build --type weapp 2>&1 | tail -5`
Expected: Build succeeds without errors.

- [ ] **Step 3: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/app.css
git commit -m "feat: add paper texture to global page background"
```

---

### Task 3: Create SceneBg component

**Files:**
- Create: `miniprogram/src/components/scene-bg/index.tsx`
- Create: `miniprogram/src/components/scene-bg/index.css`

- [ ] **Step 1: Write SceneBg component**

Create `miniprogram/src/components/scene-bg/index.tsx`:

```tsx
import { View, Image } from '@tarojs/components'
import './index.css'

interface SceneBgProps {
  src: string
}

export default function SceneBg({ src }: SceneBgProps) {
  return (
    <View className='scene-bg'>
      <Image src={src} className='scene-bg-img' mode='aspectFill' />
    </View>
  )
}
```

- [ ] **Step 2: Write SceneBg styles**

Create `miniprogram/src/components/scene-bg/index.css`:

```css
.scene-bg {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  z-index: 0;
  pointer-events: none;
}
.scene-bg-img {
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: Verify build**

Run: `cd e:/wechatproject/project2/Daoyou/miniprogram && npx taro build --type weapp 2>&1 | tail -5`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/components/scene-bg/
git commit -m "feat: add SceneBg component for ink wash backgrounds"
```

---

### Task 4: Create 6 scene background SVGs

**Files:**
- Create: `miniprogram/src/assets/ink-mountain-cave.svg`
- Create: `miniprogram/src/assets/ink-mountain-battle.svg`
- Create: `miniprogram/src/assets/ink-smoke-alchemy.svg`
- Create: `miniprogram/src/assets/ink-bamboo.svg`
- Create: `miniprogram/src/assets/ink-cloud.svg`
- Create: `miniprogram/src/assets/ink-lotus.svg`

- [ ] **Step 1: Write ink-mountain-cave.svg (洞府)**

Create `miniprogram/src/assets/ink-mountain-cave.svg`:

```xml
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <!-- 远山 -->
  <ellipse cx="80" cy="200" rx="120" ry="90" fill="rgba(160,150,130,0.2)"/>
  <ellipse cx="250" cy="200" rx="100" ry="70" fill="rgba(140,130,115,0.15)"/>
  <ellipse cx="360" cy="200" rx="80" ry="60" fill="rgba(150,140,125,0.18)"/>
  <!-- 近山 -->
  <ellipse cx="150" cy="200" rx="90" ry="50" fill="rgba(120,110,95,0.25)"/>
  <ellipse cx="320" cy="200" rx="70" ry="40" fill="rgba(110,100,85,0.22)"/>
  <!-- 松树 -->
  <line x1="350" y1="120" x2="350" y2="160" stroke="rgba(80,70,55,0.3)" stroke-width="2"/>
  <ellipse cx="350" cy="115" rx="18" ry="14" fill="rgba(80,90,60,0.2)"/>
  <line x1="370" y1="135" x2="370" y2="165" stroke="rgba(80,70,55,0.2)" stroke-width="1.5"/>
  <ellipse cx="370" cy="132" rx="12" ry="10" fill="rgba(80,90,60,0.15)"/>
</svg>
```

- [ ] **Step 2: Write ink-mountain-battle.svg (战斗)**

Create `miniprogram/src/assets/ink-mountain-battle.svg`:

```xml
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <!-- 浓墨远山 -->
  <ellipse cx="60" cy="200" rx="100" ry="100" fill="rgba(90,80,65,0.3)"/>
  <ellipse cx="200" cy="200" rx="130" ry="85" fill="rgba(100,90,75,0.25)"/>
  <ellipse cx="350" cy="200" rx="90" ry="75" fill="rgba(85,75,60,0.28)"/>
  <!-- 战旗 -->
  <line x1="50" y1="90" x2="50" y2="130" stroke="rgba(141,47,34,0.25)" stroke-width="2"/>
  <polygon points="52,90 70,96 65,106 52,100" fill="rgba(141,47,34,0.15)"/>
  <!-- 近景 -->
  <ellipse cx="180" cy="200" rx="80" ry="45" fill="rgba(80,70,55,0.3)"/>
</svg>
```

- [ ] **Step 3: Write ink-smoke-alchemy.svg (炼丹)**

Create `miniprogram/src/assets/ink-smoke-alchemy.svg`:

```xml
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <!-- 烟雾 -->
  <ellipse cx="120" cy="140" rx="60" ry="40" fill="rgba(180,170,150,0.15)"/>
  <ellipse cx="250" cy="120" rx="50" ry="35" fill="rgba(170,160,140,0.12)"/>
  <ellipse cx="340" cy="150" rx="40" ry="30" fill="rgba(160,150,130,0.1)"/>
  <!-- 炉火微光 -->
  <ellipse cx="200" cy="190" rx="80" ry="15" fill="rgba(196,90,63,0.08)"/>
  <ellipse cx="200" cy="185" rx="40" ry="8" fill="rgba(196,120,63,0.06)"/>
</svg>
```

- [ ] **Step 4: Write ink-bamboo.svg (储物袋)**

Create `miniprogram/src/assets/ink-bamboo.svg`:

```xml
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <!-- 竹子 -->
  <line x1="40" y1="80" x2="40" y2="200" stroke="rgba(100,120,80,0.2)" stroke-width="3"/>
  <line x1="55" y1="100" x2="55" y2="200" stroke="rgba(100,120,80,0.15)" stroke-width="2"/>
  <line x1="350" y1="90" x2="350" y2="200" stroke="rgba(100,120,80,0.18)" stroke-width="2.5"/>
  <!-- 竹叶 -->
  <ellipse cx="35" cy="100" rx="14" ry="8" fill="rgba(100,120,80,0.12)" transform="rotate(-20 35 100)"/>
  <ellipse cx="50" cy="120" rx="12" ry="7" fill="rgba(100,120,80,0.1)" transform="rotate(15 50 120)"/>
  <ellipse cx="355" cy="105" rx="13" ry="7" fill="rgba(100,120,80,0.11)" transform="rotate(20 355 105)"/>
</svg>
```

- [ ] **Step 5: Write ink-cloud.svg (排行榜)**

Create `miniprogram/src/assets/ink-cloud.svg`:

```xml
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <!-- 云海 -->
  <ellipse cx="80" cy="140" rx="90" ry="25" fill="rgba(180,170,150,0.18)"/>
  <ellipse cx="300" cy="130" rx="80" ry="20" fill="rgba(170,160,140,0.15)"/>
  <ellipse cx="200" cy="155" rx="60" ry="18" fill="rgba(160,150,130,0.12)"/>
  <!-- 山峰 -->
  <polygon points="180,200 200,110 220,200" fill="rgba(140,130,115,0.15)"/>
  <polygon points="280,200 295,130 310,200" fill="rgba(130,120,105,0.12)"/>
</svg>
```

- [ ] **Step 6: Write ink-lotus.svg (修行)**

Create `miniprogram/src/assets/ink-lotus.svg`:

```xml
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
  <!-- 莲花 -->
  <ellipse cx="200" cy="170" rx="30" ry="8" fill="rgba(141,47,34,0.08)"/>
  <path d="M200,140 Q185,155 190,170 Q200,165 210,170 Q215,155 200,140Z" fill="rgba(141,47,34,0.1)"/>
  <path d="M200,145 Q180,160 185,170" stroke="rgba(141,47,34,0.08)" fill="none" stroke-width="1"/>
  <path d="M200,145 Q220,160 215,170" stroke="rgba(141,47,34,0.08)" fill="none" stroke-width="1"/>
  <!-- 静室轮廓 -->
  <line x1="160" y1="180" x2="160" y2="150" stroke="rgba(80,70,55,0.1)" stroke-width="1.5"/>
  <line x1="240" y1="180" x2="240" y2="150" stroke="rgba(80,70,55,0.1)" stroke-width="1.5"/>
  <path d="M155,150 L200,130 L245,150" stroke="rgba(80,70,55,0.12)" fill="none" stroke-width="1.5"/>
</svg>
```

- [ ] **Step 7: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/assets/ink-*.svg
git commit -m "feat: add 6 ink wash scene background SVGs"
```

---

### Task 5: Integrate scene backgrounds into pages

**Files:**
- Modify: `miniprogram/src/pages/cave/index.tsx`
- Modify: `miniprogram/src/pages/cave/index.css`
- Modify: `miniprogram/src/pages/retreat/index.tsx`
- Modify: `miniprogram/src/pages/retreat/index.css`
- Modify: `miniprogram/src/pages/craft/index.tsx`
- Modify: `miniprogram/src/pages/craft/index.css`
- Modify: `miniprogram/src/pages/battle-history/index.tsx`
- Modify: `miniprogram/src/pages/battle-history/index.css`
- Modify: `miniprogram/src/pages/battle-result/index.tsx`
- Modify: `miniprogram/src/pages/battle-result/index.css`
- Modify: `miniprogram/src/pages/rankings/index.tsx`
- Modify: `miniprogram/src/pages/rankings/index.css`
- Modify: `miniprogram/src/pages/inventory/index.tsx`
- Modify: `miniprogram/src/pages/inventory/index.css`

- [ ] **Step 1: Add SceneBg to cave page**

In `pages/cave/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkMountainCave from '@/assets/ink-mountain-cave.svg'
```

Inside the root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkMountainCave} />
```

In `pages/cave/index.css`, add `.page` z-index and position:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 2: Add SceneBg to retreat page**

In `pages/retreat/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkLotus from '@/assets/ink-lotus.svg'
```

Inside root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkLotus} />
```

In `pages/retreat/index.css`, add:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 3: Add SceneBg to craft page (shared by alchemy/refine)**

Note: `pages/alchemy/index.tsx` and `pages/refine/index.tsx` are thin wrappers that render `<CraftPage>`. The SceneBg only needs to be added to `pages/craft/index.tsx` — it will appear on both alchemy and refine pages automatically.

In `pages/craft/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkSmokeAlchemy from '@/assets/ink-smoke-alchemy.svg'
```

Inside root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkSmokeAlchemy} />
```

In `pages/craft/index.css`, add:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 4: Add SceneBg to battle-history page**

In `pages/battle-history/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkMountainBattle from '@/assets/ink-mountain-battle.svg'
```

Inside root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkMountainBattle} />
```

In `pages/battle-history/index.css`, add:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 5: Add SceneBg to battle-result page**

In `pages/battle-result/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkMountainBattle from '@/assets/ink-mountain-battle.svg'
```

Inside root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkMountainBattle} />
```

In `pages/battle-result/index.css`, add:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 6: Add SceneBg to rankings page**

In `pages/rankings/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkCloud from '@/assets/ink-cloud.svg'
```

Inside root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkCloud} />
```

In `pages/rankings/index.css`, add:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 7: Add SceneBg to inventory page**

In `pages/inventory/index.tsx`, add import and render `SceneBg`:

```tsx
import SceneBg from '@/components/scene-bg'
import inkBamboo from '@/assets/ink-bamboo.svg'
```

Inside root `<View className='page'>`, add as first child:

```tsx
<SceneBg src={inkBamboo} />
```

In `pages/inventory/index.css`, add:

```css
.page {
  position: relative;
  z-index: 1;
}
```

- [ ] **Step 8: Verify build**

Run: `cd e:/wechatproject/project2/Daoyou/miniprogram && npx taro build --type weapp 2>&1 | tail -10`
Expected: Build succeeds, all 7 pages compiled.

- [ ] **Step 9: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/pages/cave/ miniprogram/src/pages/retreat/ miniprogram/src/pages/craft/ miniprogram/src/pages/battle-history/ miniprogram/src/pages/battle-result/ miniprogram/src/pages/rankings/ miniprogram/src/pages/inventory/
git commit -m "feat: integrate scene backgrounds into 7 pages via SceneBg component"
```

---

### Task 6: Create 8 navigation icon SVGs

**Files:**
- Create: `miniprogram/src/assets/icon-message.svg`
- Create: `miniprogram/src/assets/icon-cave.svg`
- Create: `miniprogram/src/assets/icon-bag.svg`
- Create: `miniprogram/src/assets/icon-skill.svg`
- Create: `miniprogram/src/assets/icon-alchemy.svg`
- Create: `miniprogram/src/assets/icon-market.svg`
- Create: `miniprogram/src/assets/icon-avatar.svg`
- Create: `miniprogram/src/assets/icon-rank.svg`

All icons share: `viewBox="0 0 48 48"`, `fill="none"`, `stroke="#5a4a38"`, `stroke-width="1.5"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

- [ ] **Step 1: Write icon-message.svg (传音玉简)**

Create `miniprogram/src/assets/icon-message.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M24 6 C24 6, 14 14, 14 24 C14 32, 18 38, 24 38 C30 38, 34 32, 34 24 C34 14, 24 6, 24 6Z"/>
  <path d="M20 20 Q24 15 28 20" opacity="0.5"/>
  <line x1="24" y1="38" x2="24" y2="44"/>
</svg>
```

- [ ] **Step 2: Write icon-cave.svg (洞府)**

Create `miniprogram/src/assets/icon-cave.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 38 L10 20 L24 10 L38 20 L38 38 Z"/>
  <rect x="19" y="28" width="10" height="10" rx="1"/>
</svg>
```

- [ ] **Step 3: Write icon-bag.svg (储物袋)**

Create `miniprogram/src/assets/icon-bag.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 14 L34 14 L34 40 L14 40 Z" rx="2"/>
  <path d="M19 14 L19 9 L29 9 L29 14" opacity="0.5"/>
  <line x1="19" y1="22" x2="29" y2="22" opacity="0.3"/>
  <line x1="19" y1="28" x2="26" y2="28" opacity="0.3"/>
</svg>
```

- [ ] **Step 4: Write icon-skill.svg (功法)**

Create `miniprogram/src/assets/icon-skill.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 38 L16 14 L24 22 L32 14 L36 38"/>
  <path d="M14 32 L34 32" opacity="0.3"/>
  <circle cx="24" cy="10" r="3" fill="#5a4a38" opacity="0.2"/>
</svg>
```

- [ ] **Step 5: Write icon-alchemy.svg (炼丹)**

Create `miniprogram/src/assets/icon-alchemy.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="24" cy="30" rx="12" ry="7"/>
  <path d="M16 30 L16 20 Q24 12 32 20 L32 30" opacity="0.5"/>
  <path d="M20 22 L24 17 L28 22" opacity="0.4"/>
</svg>
```

- [ ] **Step 6: Write icon-market.svg (坊市)**

Create `miniprogram/src/assets/icon-market.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <path d="M14 36 L24 10 L34 36"/>
  <path d="M18 28 L30 28" opacity="0.3"/>
  <circle cx="24" cy="40" r="2.5" fill="#5a4a38" opacity="0.2"/>
</svg>
```

- [ ] **Step 7: Write icon-avatar.svg (道身)**

Create `miniprogram/src/assets/icon-avatar.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="20" r="8"/>
  <path d="M16 34 Q24 28 32 34"/>
  <path d="M20 18 Q24 14 28 18" opacity="0.4"/>
</svg>
```

- [ ] **Step 8: Write icon-rank.svg (排行榜)**

Create `miniprogram/src/assets/icon-rank.svg`:

```xml
<svg viewBox="0 0 48 48" fill="none" stroke="#5a4a38" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="14" width="28" height="24" rx="2"/>
  <line x1="10" y1="22" x2="38" y2="22" opacity="0.3"/>
  <line x1="24" y1="22" x2="24" y2="38" opacity="0.3"/>
  <circle cx="17" cy="18" r="2" fill="#5a4a38" opacity="0.2"/>
  <circle cx="31" cy="18" r="2" fill="#5a4a38" opacity="0.2"/>
</svg>
```

- [ ] **Step 9: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/assets/icon-*.svg
git commit -m "feat: add 8 ink wash navigation icon SVGs"
```

---

### Task 7: Integrate icons into NavGrid and pages

**Files:**
- Modify: `miniprogram/src/components/nav-grid/index.tsx`
- Modify: `miniprogram/src/components/nav-grid/index.css`

- [ ] **Step 1: Update NavGrid component to accept icon prop**

Open `miniprogram/src/components/nav-grid/index.tsx`. Add an optional `icon` field to the `NavItem` interface and render it:

```tsx
import { View, Text, Image } from '@tarojs/components'
import './index.css'

export interface NavItem {
  label: string
  url: string
  badge?: number
  icon?: string
}

interface NavGridProps {
  items: NavItem[]
}

export default function NavGrid({ items }: NavGridProps) {
  return (
    <View className='nav-grid'>
      {items.map((item, i) => (
        <View
          key={i}
          className='nav-grid-item'
          onClick={() => Taro.navigateTo({ url: item.url })}
        >
          {item.icon && <Image src={item.icon} className='nav-grid-icon' />}
          <Text className='nav-grid-label'>{item.label}</Text>
          {item.badge && item.badge > 0 ? (
            <View className='nav-grid-badge'>
              <Text className='nav-grid-badge-text'>{item.badge > 99 ? '99+' : item.badge}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  )
}
```

- [ ] **Step 2: Update NavGrid styles for icon**

Open `miniprogram/src/components/nav-grid/index.css`. Add icon styles:

```css
.nav-grid-icon {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 8rpx;
}
```

- [ ] **Step 3: Add icons to cave page NavGrid items**

Open `pages/cave/index.tsx`. Import the icons:

```tsx
import iconCave from '@/assets/icon-cave.svg'
import iconAvatar from '@/assets/icon-avatar.svg'
import iconBag from '@/assets/icon-bag.svg'
import iconSkill from '@/assets/icon-skill.svg'
import iconAlchemy from '@/assets/icon-alchemy.svg'
import iconMarket from '@/assets/icon-market.svg'
import iconRank from '@/assets/icon-rank.svg'
import iconMessage from '@/assets/icon-message.svg'
```

Add `icon` field to each NavGrid item that has a matching icon:

```tsx
const navItems = [
  { label: '道身', url: '/pages/cultivator/index', icon: iconAvatar },
  { label: '任务', url: '/pages/tasks/index' },
  { label: '静室', url: '/pages/retreat/index' },
  { label: '储物袋', url: '/pages/inventory/index', icon: iconBag },
  { label: '功法神通', url: '/pages/abilities/index', icon: iconSkill },
  { label: '炼丹', url: '/pages/alchemy/index', icon: iconAlchemy },
  { label: '炼器', url: '/pages/refine/index', icon: iconAlchemy },
  { label: '战纪', url: '/pages/battle-history/index' },
  { label: '坊市', url: '/pages/market/index', icon: iconMarket },
  { label: '排行榜', url: '/pages/rankings/index', icon: iconRank },
  { label: '世界', url: '/pages/world-chat/index', icon: iconMessage },
  { label: '传音', url: '/pages/mail/index', icon: iconMessage },
  { label: '邮件', url: '/pages/mail/index', icon: iconMessage },
  { label: '兑换', url: '/pages/redeem/index' },
]
```

- [ ] **Step 4: Verify build**

Run: `cd e:/wechatproject/project2/Daoyou/miniprogram && npx taro build --type weapp 2>&1 | tail -10`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
cd e:/wechatproject/project2/Daoyou
git add miniprogram/src/components/nav-grid/ miniprogram/src/pages/cave/index.tsx
git commit -m "feat: integrate ink wash icons into NavGrid component"
```

---

### Task 8: Final build verification

**Files:** None (verification only)

- [ ] **Step 1: Full build**

Run: `cd e:/wechatproject/project2/Daoyou/miniprogram && npx taro build --type weapp 2>&1`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Check build output size**

Run: `du -sh e:/wechatproject/project2/Daoyou/miniprogram/dist/`
Expected: Under 2MB for the main package.

- [ ] **Step 3: Check that all SVG files are included in dist**

Run: `ls e:/wechatproject/project2/Daoyou/miniprogram/dist/assets/ 2>/dev/null || echo "Assets not in dist — may be handled differently by Taro"`
Expected: SVG files present in dist output.

- [ ] **Step 4: Commit any final fixes (if needed)**

If build had issues, fix and commit. Otherwise, skip.
