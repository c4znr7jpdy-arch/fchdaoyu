"""Further optimize scene backgrounds for size."""
from PIL import Image
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

scene_files = [f for f in os.listdir(ASSETS) if f.startswith("ink-") and f.endswith(".png")]
for name in sorted(scene_files):
    path = os.path.join(ASSETS, name)
    img = Image.open(path).convert("RGBA")

    # Resize to 600 wide (displayed at ~375px on most phones)
    w, h = img.size
    new_w = 600
    new_h = int(h * new_w / w)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Aggressive quantize
    img = img.quantize(colors=32, method=2).convert("RGBA")

    img.save(path, optimize=True)
    size_kb = os.path.getsize(path) / 1024
    print(f"  {name}: {img.size} -> {size_kb:.0f} KB")

print("Done!")
