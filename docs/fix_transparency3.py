"""Remove checkerboard by detecting the two alternating grid colors."""
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

def detect_checkerboard_colors(arr, sample_size=40):
    """Detect the two checkerboard colors by sampling background regions."""
    h, w = arr.shape[:2]
    regions = [
        arr[:sample_size, :sample_size],
        arr[:sample_size, w-sample_size:],
        arr[h-sample_size:, :sample_size],
        arr[h-sample_size:, w-sample_size:],
    ]
    all_pixels = np.vstack([r[:,:,:3].reshape(-1, 3) for r in regions]).astype(float)

    # Simple 2-means: pick two seeds far apart, iterate
    # Sort by brightness to pick initial seeds
    brightness = all_pixels.mean(axis=1)
    sorted_idx = np.argsort(brightness)
    seed1 = all_pixels[sorted_idx[len(sorted_idx)//4]]      # darker quartile
    seed2 = all_pixels[sorted_idx[3*len(sorted_idx)//4]]    # lighter quartile

    for _ in range(10):
        d1 = np.sum((all_pixels - seed1) ** 2, axis=1)
        d2 = np.sum((all_pixels - seed2) ** 2, axis=1)
        mask1 = d1 < d2
        mask2 = ~mask1
        if mask1.sum() > 0:
            seed1 = all_pixels[mask1].mean(axis=0)
        if mask2.sum() > 0:
            seed2 = all_pixels[mask2].mean(axis=0)

    return np.array([seed1, seed2])

def is_checkerboard_pixel(pixel, cb_colors, threshold=40):
    """Check if a pixel is close to either checkerboard color."""
    d1 = np.sqrt(np.sum((pixel.astype(float) - cb_colors[0]) ** 2))
    d2 = np.sqrt(np.sum((pixel.astype(float) - cb_colors[1]) ** 2))
    return min(d1, d2) < threshold

def remove_checkerboard(img):
    arr = np.array(img.convert("RGBA")).copy()
    h, w = arr.shape[:2]

    # Detect checkerboard colors
    cb_colors = detect_checkerboard_colors(arr)
    print(f"    CB colors: {cb_colors.astype(int)}")

    # For each pixel, check if it matches either checkerboard color
    rgb = arr[:, :, :3].astype(float)

    # Calculate distance to both checkerboard colors
    d1 = np.sqrt(np.sum((rgb - cb_colors[0].reshape(1,1,3)) ** 2, axis=2))
    d2 = np.sqrt(np.sum((rgb - cb_colors[1].reshape(1,1,3)) ** 2, axis=2))
    min_dist = np.minimum(d1, d2)

    # Use adaptive threshold based on the distance distribution
    # The checkerboard pixels should cluster tightly around the two colors
    threshold = 45  # generous for JPEG compression artifacts

    mask = min_dist < threshold

    # Don't remove very dark pixels (ink content)
    brightness = np.mean(arr[:, :, :3], axis=2)
    mask = mask & (brightness > 100)

    # Don't remove very saturated/colored pixels (red accents, etc)
    r, g, b = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float)
    max_c = np.maximum(np.maximum(r, g), b)
    min_c = np.minimum(np.minimum(r, g), b)
    saturation = (max_c - min_c) / (max_c + 1e-5)
    mask = mask & (saturation < 0.25)  # keep saturated pixels

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
