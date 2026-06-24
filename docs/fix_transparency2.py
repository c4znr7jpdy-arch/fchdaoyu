"""Remove checkerboard background using corner-sampling approach."""
from PIL import Image
import numpy as np
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

transparent_files = [
    "ink-mountain-cave.png", "ink-mountain-battle.png",
    "ink-smoke-alchemy.png", "ink-bamboo.png",
    "ink-cloud.png", "ink-lotus.png",
    "icon-message.png", "icon-cave.png", "icon-bag.png", "icon-skill.png",
    "icon-alchemy.png", "icon-market.png", "icon-avatar.png", "icon-rank.png",
]

def sample_checkerboard_color(img_arr, margin=10):
    """Sample the checkerboard color from image corners."""
    h, w = img_arr.shape[:2]
    # Grab corners
    corners = []
    for y in [margin, h - margin - 1]:
        for x in [margin, w - margin - 1]:
            corners.append(img_arr[y, x, :3])
    # Also sample along edges
    for x in range(margin, w - margin, 20):
        corners.append(img_arr[margin, x, :3])
        corners.append(img_arr[h - margin - 1, x, :3])
    for y in range(margin, h - margin, 20):
        corners.append(img_arr[y, margin, :3])
        corners.append(img_arr[y, w - margin - 1, :3])
    return np.array(corners).mean(axis=0)

def remove_checkerboard(img):
    """Remove checkerboard by comparing each pixel to sampled background color."""
    arr = np.array(img.convert("RGBA")).copy()
    h, w = arr.shape[:2]

    # Sample the checkerboard color from corners/edges
    bg_color = sample_checkerboard_color(arr)
    print(f"    Sampled BG color: RGB({bg_color[0]:.0f}, {bg_color[1]:.0f}, {bg_color[2]:.0f})")

    # Calculate color distance from background for each pixel
    rgb = arr[:, :, :3].astype(float)
    diff = rgb - bg_color.reshape(1, 1, 3)
    dist = np.sqrt(np.sum(diff ** 2, axis=2))

    # Threshold: pixels close to background color become transparent
    # Use a generous threshold to catch JPEG-compressed checkerboard
    threshold = 55
    mask = dist < threshold

    # Also: if pixel is very light and gray-ish, also remove
    r, g, b = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float)
    brightness = (r + g + b) / 3
    is_gray = (np.abs(r - g) < 20) & (np.abs(g - b) < 20) & (np.abs(r - b) < 20)
    is_light_gray = is_gray & (brightness > 180)
    mask = mask | is_light_gray

    # Don't remove dark ink pixels
    is_dark = brightness < 120
    mask = mask & ~is_dark

    arr[mask, 3] = 0

    removed = mask.sum()
    total = h * w
    print(f"    Removed {removed}/{total} pixels ({100*removed/total:.1f}%)")

    return Image.fromarray(arr)

for fname in transparent_files:
    path = os.path.join(ASSETS, fname)
    img = Image.open(path)
    print(f"Processing {fname}...")
    result = remove_checkerboard(img)
    result.save(path)

print("\nDone!")
