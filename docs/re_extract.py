"""Re-extract all assets from originals WITHOUT transparency processing."""
from PIL import Image
import os

SRC = "e:/wechatproject/project2/Daoyou/docs/images"
DST = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

# Re-extract paper textures
print("=== Paper Textures ===")
paper = Image.open(f"{SRC}/Generated Image June 24, 2026 - 1_36PM.jpg")
w = paper.width // 2
paper.crop((0, 0, w, paper.height)).save(f"{DST}/bg-paper.png")
paper.crop((w, 0, paper.width, paper.height)).save(f"{DST}/bg-paper-aged.png")
print("  bg-paper.png, bg-paper-aged.png")

# Re-extract scene backgrounds
print("\n=== Scene Backgrounds ===")
scenes = [
    ("Generated Image June 24, 2026 - 1_36PM (2).jpg", "ink-mountain-cave.png", "ink-mountain-battle.png"),
    ("Generated Image June 24, 2026 - 1_36PM (3).jpg", "ink-smoke-alchemy.png", "ink-bamboo.png"),
    ("Generated Image June 24, 2026 - 1_36PM (4).jpg", "ink-cloud.png", "ink-lotus.png"),
]
for fname, left, right in scenes:
    img = Image.open(f"{SRC}/{fname}")
    w = img.width // 2
    img.crop((0, 0, w, img.height)).save(f"{DST}/{left}")
    img.crop((w, 0, img.width, img.height)).save(f"{DST}/{right}")
    print(f"  {left}, {right}")

# Re-extract icons
print("\n=== Icons ===")
icon_sets = [
    ("Generated Image June 24, 2026 - 1_36PM (5).jpg",
     ["icon-message.png", "icon-cave.png", "icon-bag.png", "icon-skill.png"]),
    ("Generated Image June 24, 2026 - 1_36PM (1).jpg",
     ["icon-alchemy.png", "icon-market.png", "icon-avatar.png", "icon-rank.png"]),
]
for fname, names in icon_sets:
    img = Image.open(f"{SRC}/{fname}")
    hw, hh = img.width // 2, img.height // 2
    coords = [(0, 0, hw, hh), (hw, 0, img.width, hh),
              (0, hh, hw, img.height), (hw, hh, img.width, img.height)]
    for (x1, y1, x2, y2), name in zip(coords, names):
        crop = img.crop((x1, y1, x2, y2))
        bbox = crop.getbbox()
        if bbox:
            crop = crop.crop(bbox)
        crop.save(f"{DST}/{name}")
        print(f"  {name} ({crop.size})")

print("\nDone! All assets re-extracted (no transparency processing).")
