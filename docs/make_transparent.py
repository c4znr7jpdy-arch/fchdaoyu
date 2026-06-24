"""Properly extract icons with transparent backgrounds from original images."""
from PIL import Image
import numpy as np
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"
SRC = "e:/wechatproject/project2/Daoyou/docs/images"

def extract_with_transparency(img_crop, target_size=192):
    """Extract content from crop, make background transparent."""
    arr = np.array(img_crop.convert("RGBA"))
    h, w = arr.shape[:2]

    # Detect dark ink pixels (the actual icon content)
    r, g, b = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float)
    brightness = (r + g + b) / 3

    # Ink strokes are dark (brightness < 120) or have high saturation
    # The background is light gray checkerboard (brightness > 170)
    is_ink = brightness < 130

    # Also catch semi-dark pixels that form the brush stroke edges
    is_edge = (brightness >= 130) & (brightness < 180)

    # Create alpha channel: fully opaque for ink, transparent for background
    alpha = np.zeros((h, w), dtype=np.uint8)
    alpha[is_ink] = 255
    # Semi-transparent for edges (anti-aliasing)
    alpha[is_edge] = ((180 - brightness[is_edge]) / 50 * 255).astype(np.uint8)
    alpha[is_edge] = np.clip(alpha[is_edge], 0, 255).astype(np.uint8)

    arr[:,:,3] = alpha

    # Find bounding box of non-transparent content
    rows = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)
    if not rows.any() or not cols.any():
        return None

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    # Add small padding
    pad = 8
    rmin = max(0, rmin - pad)
    rmax = min(h - 1, rmax + pad)
    cmin = max(0, cmin - pad)
    cmax = min(w - 1, cmax + pad)

    cropped = Image.fromarray(arr[rmin:rmax+1, cmin:cmax+1])

    # Resize to target
    cropped.thumbnail((target_size, target_size), Image.LANCZOS)

    # Pad to square with transparent
    square = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
    offset = ((target_size - cropped.width) // 2, (target_size - cropped.height) // 2)
    square.paste(cropped, offset, cropped)

    return square

# Process icon set 1: message, cave, bag, skill
print("=== Icon Set 1 ===")
img1 = Image.open(f"{SRC}/Generated Image June 24, 2026 - 1_36PM (1).jpg")
hw, hh = img1.width // 2, img1.height // 2
icon_map_1 = [
    (0, 0, hw, hh, "icon-message.png"),
    (hw, 0, img1.width, hh, "icon-cave.png"),
    (0, hh, hw, img1.height, "icon-bag.png"),
    (hw, hh, img1.width, img1.height, "icon-skill.png"),
]
for x1, y1, x2, y2, name in icon_map_1:
    crop = img1.crop((x1, y1, x2, y2))
    result = extract_with_transparency(crop)
    if result:
        result.save(f"{ASSETS}/{name}")
        print(f"  {name}: {result.size}, {os.path.getsize(f'{ASSETS}/{name}')/1024:.0f} KB")

# Process icon set 2: alchemy, market, avatar, rank
print("\n=== Icon Set 2 ===")
img2 = Image.open(f"{SRC}/Generated Image June 24, 2026 - 1_36PM.jpg")
hw, hh = img2.width // 2, img2.height // 2
icon_map_2 = [
    (0, 0, hw, hh, "icon-alchemy.png"),
    (hw, 0, img2.width, hh, "icon-market.png"),
    (0, hh, hw, img2.height, "icon-avatar.png"),
    (hw, hh, img2.width, img2.height, "icon-rank.png"),
]
for x1, y1, x2, y2, name in icon_map_2:
    crop = img2.crop((x1, y1, x2, y2))
    result = extract_with_transparency(crop)
    if result:
        result.save(f"{ASSETS}/{name}")
        print(f"  {name}: {result.size}, {os.path.getsize(f'{ASSETS}/{name}')/1024:.0f} KB")

print("\nDone!")
