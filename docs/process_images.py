"""Process AI-generated images: split combined images into individual assets."""
from PIL import Image
import os

SRC = "e:/wechatproject/project2/Daoyou/docs/images"
DST = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

def split_left_right(img, left_path, right_path):
    """Split image vertically at midpoint."""
    w, h = img.size
    mid = w // 2
    left = img.crop((0, 0, mid, h))
    right = img.crop((mid, 0, w, h))
    left.save(left_path)
    right.save(right_path)
    print(f"  -> {os.path.basename(left_path)} ({left.size}), {os.path.basename(right_path)} ({right.size})")

def split_2x2(img, names, out_dir):
    """Split image into 2x2 grid."""
    w, h = img.size
    hw, hh = w // 2, h // 2
    regions = [(0, 0, hw, hh), (hw, 0, w, hh), (0, hh, hw, h), (hw, hh, w, h)]
    for (x1, y1, x2, y2), name in zip(regions, names):
        crop = img.crop((x1, y1, x2, y2))
        # Auto-crop transparent borders
        bbox = crop.getbbox()
        if bbox:
            crop = crop.crop(bbox)
        path = os.path.join(out_dir, name)
        crop.save(path)
        print(f"  -> {name} ({crop.size})")

# 1. Paper textures (image 1) - split left/right
print("=== Paper Textures ===")
paper = Image.open(f"{SRC}/Generated Image June 24, 2026 - 1_36PM.jpg")
split_left_right(paper, f"{DST}/bg-paper.png", f"{DST}/bg-paper-aged.png")

# 2. Scene backgrounds (images 2-4) - each has 2 scenes
print("\n=== Scene Backgrounds ===")
scenes = [
    ("Generated Image June 24, 2026 - 1_36PM (2).jpg", "ink-mountain-cave.png", "ink-mountain-battle.png"),
    ("Generated Image June 24, 2026 - 1_36PM (3).jpg", "ink-smoke-alchemy.png", "ink-bamboo.png"),
    ("Generated Image June 24, 2026 - 1_36PM (4).jpg", "ink-cloud.png", "ink-lotus.png"),
]
for fname, left_name, right_name in scenes:
    img = Image.open(f"{SRC}/{fname}")
    print(f"Processing {fname} ({img.size})...")
    split_left_right(img, f"{DST}/{left_name}", f"{DST}/{right_name}")

# 3. Icons (images 5-6) - each has 4 icons in 2x2 grid
print("\n=== Icons ===")
icon_sets = [
    ("Generated Image June 24, 2026 - 1_36PM (5).jpg",
     ["icon-message.png", "icon-cave.png", "icon-bag.png", "icon-skill.png"]),
    ("Generated Image June 24, 2026 - 1_36PM (1).jpg",
     ["icon-alchemy.png", "icon-market.png", "icon-avatar.png", "icon-rank.png"]),
]
for fname, names in icon_sets:
    img = Image.open(f"{SRC}/{fname}")
    print(f"Processing {fname} ({img.size})...")
    split_2x2(img, names, DST)

print("\nDone! All assets saved to", DST)
