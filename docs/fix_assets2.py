"""Fix icon resolution and scene background cropping."""
from PIL import Image
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"
SRC = "e:/wechatproject/project2/Daoyou/docs/images"

# 1. Re-extract icons at higher resolution (256x256, just crop + auto-trim)
print("=== Icons (higher res) ===")
icon_sets = [
    (f"{SRC}/Generated Image June 24, 2026 - 1_36PM (1).jpg",
     ["icon-message.png", "icon-cave.png", "icon-bag.png", "icon-skill.png"]),
    (f"{SRC}/Generated Image June 24, 2026 - 1_36PM.jpg",
     ["icon-alchemy.png", "icon-market.png", "icon-avatar.png", "icon-rank.png"]),
]
for src_path, names in icon_sets:
    img = Image.open(src_path)
    hw, hh = img.width // 2, img.height // 2
    coords = [(0, 0, hw, hh), (hw, 0, img.width, hh),
              (0, hh, hw, img.height), (hw, hh, img.width, img.height)]
    for (x1, y1, x2, y2), name in zip(coords, names):
        crop = img.crop((x1, y1, x2, y2))
        # Auto-crop to content bounding box
        bbox = crop.getbbox()
        if bbox:
            crop = crop.crop(bbox)
        # Resize to fit within 256x256, keep aspect ratio
        crop.thumbnail((256, 256), Image.LANCZOS)
        # Pad to square with paper color
        square = Image.new("RGB", (256, 256), (240, 230, 208))
        offset = ((256 - crop.width) // 2, (256 - crop.height) // 2)
        square.paste(crop, offset)
        square.save(f"{ASSETS}/{name}")
        print(f"  {name}: {square.size}, {os.path.getsize(f'{ASSETS}/{name}')/1024:.0f} KB")

# 2. Re-extract scene backgrounds, crop to content area
print("\n=== Scene Backgrounds (cropped to content) ===")
scenes = [
    (f"{SRC}/Generated Image June 24, 2026 - 1_36PM (2).jpg",
     "ink-mountain-cave.png", "ink-mountain-battle.png"),
    (f"{SRC}/Generated Image June 24, 2026 - 1_36PM (3).jpg",
     "ink-smoke-alchemy.png", "ink-bamboo.png"),
    (f"{SRC}/Generated Image June 24, 2026 - 1_36PM (4).jpg",
     "ink-cloud.png", "ink-lotus.png"),
]
for src_path, left_name, right_name in scenes:
    img = Image.open(src_path)
    w = img.width // 2
    for name, x_start in [(left_name, 0), (right_name, w)]:
        crop = img.crop((x_start, 0, x_start + w, img.height))
        # The content is in the bottom ~60% of the image
        # Find the actual content bounding box
        # Convert to RGBA to detect non-white/non-gray pixels
        arr = crop.convert("RGBA")
        pixels = list(arr.getdata())
        # Find rows/cols with actual content (not pure gray/white)
        h, w_img = arr.height, arr.width
        # Content detection: pixel differs from average gray
        import numpy as np
        np_arr = np.array(arr)
        r, g, b = np_arr[:,:,0], np_arr[:,:,1], np_arr[:,:,2]
        brightness = (r.astype(int) + g.astype(int) + b.astype(int)) / 3
        # Content pixels: not pure gray/white (saturation > threshold or brightness < threshold)
        is_content = (brightness < 230) | ((np.abs(r.astype(int) - b.astype(int)) > 15))
        # Find bounding box of content
        rows = np.any(is_content, axis=1)
        cols = np.any(is_content, axis=0)
        if rows.any() and cols.any():
            rmin, rmax = np.where(rows)[0][[0, -1]]
            cmin, cmax = np.where(cols)[0][[0, -1]]
            # Add padding
            pad = 20
            rmin = max(0, rmin - pad)
            rmax = min(h - 1, rmax + pad)
            cmin = max(0, cmin - pad)
            cmax = min(w_img - 1, cmax + pad)
            crop = crop.crop((cmin, rmin, cmax + 1, rmax + 1))

        # Resize to 800 wide
        new_w = 800
        new_h = int(crop.height * new_w / crop.width)
        crop = crop.resize((new_w, new_h), Image.LANCZOS)
        crop.save(f"{ASSETS}/{name}")
        print(f"  {name}: {crop.size}, {os.path.getsize(f'{ASSETS}/{name}')/1024:.0f} KB")

print("\nDone!")
