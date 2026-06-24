"""Remove checkerboard background from split images, making them truly transparent."""
from PIL import Image
import numpy as np
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

# Files that need transparency (scene backgrounds + icons, NOT paper textures)
transparent_files = [
    "ink-mountain-cave.png", "ink-mountain-battle.png",
    "ink-smoke-alchemy.png", "ink-bamboo.png",
    "ink-cloud.png", "ink-lotus.png",
    "icon-message.png", "icon-cave.png", "icon-bag.png", "icon-skill.png",
    "icon-alchemy.png", "icon-market.png", "icon-avatar.png", "icon-rank.png",
]

def remove_checkerboard(img):
    """Convert checkerboard background to transparency."""
    arr = np.array(img.convert("RGBA"))
    h, w = arr.shape[:2]

    # Sample checkerboard color from corners (should be pure gray/white pattern)
    # The checkerboard alternates between ~204,204,204 and ~255,255,255
    # We detect pixels that are close to either of these gray values
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]

    # Check if pixel is close to gray (R≈G≈B) and either light or medium gray
    is_gray = (np.abs(r.astype(int) - g.astype(int)) < 15) & \
              (np.abs(g.astype(int) - b.astype(int)) < 15) & \
              (np.abs(r.astype(int) - b.astype(int)) < 15)

    is_checkerboard_tone = is_gray & ((r > 180) & (r < 260))  # gray to white range

    # Also check: pixel brightness should be relatively uniform (not ink-dark)
    brightness = (r.astype(int) + g.astype(int) + b.astype(int)) / 3
    is_light = brightness > 170

    # Mark checkerboard pixels as transparent
    mask = is_checkerboard_tone & is_light
    arr[mask, 3] = 0

    # Clean up: remove isolated single-pixel noise with a simple blur on alpha
    # Use a slight erosion on the alpha channel to clean edges
    from PIL import ImageFilter
    result = Image.fromarray(arr, "RGBA")

    # Create a slightly cleaned version by dilating the opaque area
    # This helps fill small holes near edges
    r_arr = np.array(result)

    return result

for fname in transparent_files:
    path = os.path.join(ASSETS, fname)
    img = Image.open(path)
    print(f"Processing {fname} ({img.size})...")
    result = remove_checkerboard(img)
    result.save(path)
    print(f"  -> Saved with transparency")

print("\nDone!")
