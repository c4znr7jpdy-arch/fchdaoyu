"""Remove checkerboard from scene backgrounds, make transparent."""
from PIL import Image
import numpy as np
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"
SRC = "e:/wechatproject/project2/Daoyou/docs/images"

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

        # Resize to 250 wide
        new_h = int(crop.height * 250 / crop.width)
        crop = crop.resize((250, new_h), Image.LANCZOS)

        arr = np.array(crop.convert("RGBA"))
        r, g, b = arr[:,:,0].astype(float), arr[:,:,1].astype(float), arr[:,:,2].astype(float)
        brightness = (r + g + b) / 3

        # The scene content is ink wash: has color variation, not pure gray
        # Background is gray checkerboard: R≈G≈B, brightness 170-240
        is_gray = (np.abs(r - g) < 15) & (np.abs(g - b) < 15) & (np.abs(r - b) < 15)
        is_checker_bg = is_gray & (brightness > 160)

        # Content pixels: either dark, or have color (warm/cool tints)
        has_color = (np.abs(r - b) > 15) | (np.abs(r - g) > 10) | (np.abs(g - b) > 10)
        is_content = (brightness < 160) | has_color

        # For semi-content (gray but not checkerboard range), keep with reduced alpha
        is_semi = is_gray & (brightness >= 130) & (brightness <= 160)

        alpha = np.zeros((h := arr.shape[0], w_img := arr.shape[1]), dtype=np.uint8)
        alpha[is_content] = 255
        alpha[is_semi] = 180

        # Soft edge: pixels between content and background
        is_edge = ~is_content & ~is_checker_bg & ~is_semi & (brightness >= 130)
        alpha[is_edge] = 80

        arr[:,:,3] = alpha

        result = Image.fromarray(arr)
        result.save(f"{ASSETS}/{name}")
        size_kb = os.path.getsize(f"{ASSETS}/{name}") / 1024
        print(f"  {name}: {result.size}, {size_kb:.0f} KB")

print("\nDone!")
