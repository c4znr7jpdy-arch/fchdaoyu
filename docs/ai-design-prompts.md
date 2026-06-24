# 万界道友 — 素材设计需求（AI 生图用）

> 拿这段内容直接给 AI 图像生成工具（Midjourney / DALL-E / Stable Diffusion 等）使用。

---

## 整体风格定义

**项目：** "万界道友"——一款修仙题材的微信小程序
**美术风格：** 中国水墨画（国画写意风），配合宣纸质感
**色调基准：**
- 墨色层级：#2c2115（浓墨）、#5a4a38（中墨）、#8a7a60（淡墨）
- 朱砂红：#8d2f22（强调色，用于印章、重要元素）
- 宣纸底色：#f0e6d0（暖黄纸色）
- 翠玉绿：#2f7d4d
- 琥珀黄：#876a2f

**关键要求：**
- 所有素材必须是**透明背景**（PNG）或纯色背景可后期去除
- 线条要有毛笔的**飞白**和**枯笔**效果，不要矢量光滑感
- 色彩克制，以墨色为主，点缀朱砂红
- 不要出现文字、汉字、英文
- 不要出现人物脸部或具象人物

---

## 一、导航图标（8 个）

**尺寸：** 256 x 256 px（输出后会被缩放到 24x24mm 显示）
**风格：** 单色水墨线描图标，类似印章/篆刻风格的简化图形
**用法：** 小程序底部导航栏图标，需要在极小尺寸下仍清晰可辨

### 1. 消息图标（icon-message）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a traditional scroll or letter envelope, single color black ink on transparent background, simple bold strokes, zen calligraphy style, no text, no background, icon design, 256x256px
```

### 2. 洞府图标（icon-cave）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a mountain cave entrance with stalactites, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

### 3. 背包图标（icon-bag）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a traditional Chinese cloth pouch or medicine bag with a drawstring, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

### 4. 功法图标（icon-skill）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of an ancient Chinese martial arts manual or talisman paper with mystical symbols, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

### 5. 炼丹图标（icon-alchemy）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a traditional Chinese alchemy cauldron (ding) with wisps of smoke rising, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

### 6. 坊市图标（icon-market）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a traditional Chinese market stall or shop with a curved roof, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

### 7. 头像图标（icon-avatar）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a cultivation immortal silhouette or lotus meditation pose, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

### 8. 排行图标（icon-rank）
提示词：
```
A minimalist Chinese ink wash brush stroke icon of a Chinese pagoda or tiered tower, single color black ink on transparent background, simple bold strokes, zen style, no text, no background, icon design, 256x256px
```

---

## 二、场景背景图（6 个）

**尺寸：** 1200 x 600 px（宽幅横图，底部显示 100px 高度）
**风格：** 水墨写意山水/元素，底部构图，上方留白渐变透明
**用法：** 固定在页面底部作为氛围装饰，需要上方渐变融入页面背景
**关键要求：**
- 构图重心在**画面下方 1/3**
- 上方 2/3 应该是**渐变透明**（从有到无），方便与页面背景融合
- 色调淡雅，不要太浓重，作为背景装饰不能抢前景内容
- 建议用**浅墨 + 淡彩**（淡赭石、淡花青）

### 1. 洞府场景（ink-mountain-cave）— 首页/洞府页
提示词：
```
Chinese ink wash painting of misty mountains with a hidden cave entrance, wide panoramic format, composition focused on the bottom third, top fades to transparent/white, light ink strokes with subtle pale ochre tints, ethereal and mystical atmosphere, rice paper texture, traditional Chinese shanshui painting style, no text, no people, 1200x600px
```

### 2. 战斗场景（ink-mountain-battle）— 战斗/历练页
提示词：
```
Chinese ink wash painting of dramatic mountain peaks with swirling clouds and lightning energy, wide panoramic format, composition focused on the bottom third, top fades to transparent/white, bold dynamic brushstrokes with touches of cinnabar red, intense martial atmosphere, traditional Chinese painting style, no text, no people, 1200x600px
```

### 3. 炼丹场景（ink-smoke-alchemy）— 炼丹页
提示词：
```
Chinese ink wash painting of ethereal smoke wisps and flame tendrils rising from below, wide panoramic format, composition focused on the bottom third, top fades to transparent/white, flowing calligraphic brushstrokes, subtle amber and cinnabar red accents on black ink, alchemical mystical atmosphere, traditional Chinese painting style, no text, no people, 1200x600px
```

### 4. 竹林场景（ink-bamboo）— 修炼/静室页
提示词：
```
Chinese ink wash painting of elegant bamboo grove with gentle wind, wide panoramic format, composition focused on the bottom third, top fades to transparent/white, delicate ink strokes with pale green tints, serene meditative atmosphere, traditional Chinese painting style, no text, no people, 1200x600px
```

### 5. 云海场景（ink-cloud）— 排行/天梯页
提示词：
```
Chinese ink wash painting of vast sea of clouds with mountain peaks emerging, wide panoramic format, composition focused on the bottom third, top fades to transparent/white, light airy brushstrokes, ethereal heavenly atmosphere, traditional Chinese painting style, no text, no people, 1200x600px
```

### 6. 莲池场景（ink-lotus）— 炼器/工坊页
提示词：
```
Chinese ink wash painting of lotus flowers and lily pads on calm water surface, wide panoramic format, composition focused on the bottom third, top fades to transparent/white, graceful brushstrokes with soft pink and green tints, tranquil refined atmosphere, traditional Chinese painting style, no text, no people, 1200x600px
```

---

## 三、宣纸纹理背景（2 个）

**尺寸：** 512 x 512 px（可平铺 tiles）
**风格：** 宣纸质感，需要能无缝平铺
**用法：** 作为整个小程序页面的背景底纹

### 1. 普通宣纸（bg-paper）
提示词：
```
Seamless tileable rice paper texture, warm cream beige color (#f0e6d0), subtle fiber patterns and natural imperfections, soft organic texture, traditional Chinese xuan paper, high resolution, flat scan, no shadows, 512x512px seamless tile
```

### 2. 古旧宣纸（bg-paper-aged）
提示词：
```
Seamless tileable aged antique rice paper texture, darker warm tone with subtle yellowing and foxing spots, visible paper fiber strands, natural wear marks, traditional old Chinese scroll paper texture, high resolution flat scan, no shadows, 512x512px seamless tile
```

---

## 四、补充：朱砂印章素材（可选）

如果你还想给小程序加一些装饰性印章元素：

### 万界道友 Logo 印章
提示词：
```
Traditional Chinese red cinnabar seal stamp (zhuan ke) of the characters "道" in ancient seal script (zhuan shu), square format, red ink on white background, authentic carved stone seal impression style, slightly uneven edges showing handmade quality, 256x256px
```

---

## 输出建议

| 素材类型 | 推荐尺寸 | 格式 | 用途 |
|---------|---------|------|------|
| 导航图标 | 256x256 px | PNG 透明底 | 底部导航栏，缩至 24px |
| 场景背景 | 1200x600 px | PNG 透明底或白底 | 页面底部装饰，显示 100px 高 |
| 宣纸纹理 | 512x512 px | PNG | 页面背景平铺 |
| 印章 | 256x256 px | PNG 透明底 | 装饰元素 |

**后处理要求：**
1. 所有素材导出后我会裁剪为 SVG 或通过代码处理透明度
2. 场景背景图上方需要做**线性渐变透明**处理（CSS mask 或后处理）
3. 图标需要在 **24px** 极小尺寸下仍清晰可辨——细节太多的图会被简化
4. 色彩模式用 **sRGB**

---

## 风格参考关键词（通用）

在任何 AI 生图工具中都可以附加这些关键词来统一风格：

```
Chinese ink wash painting, shanshui, sumi-e, calligraphic brush strokes,
rice paper texture, zen minimalist, traditional Chinese art,
cinnabar red accent, monochrome with subtle color tints,
transparent background, no text, no watermark
```

**反面参考（不要出现的）：**
- 不要日式浮世绘风格
- 不要写实 3D 渲染
- 不要卡通/Q版风格
- 不要赛博朋克/现代元素
- 不要金色、银色等金属质感
