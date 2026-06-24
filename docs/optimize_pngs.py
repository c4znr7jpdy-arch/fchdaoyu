"""Optimize PNG assets for WeChat mini program size limit."""
from PIL import Image
import os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

def optimize_icon(name):
    """Optimize icon: crop to content, resize to 128x128, quantize."""
    path = os.path.join(ASSETS, name)
    img = Image.open(path).convert("RGBA")

    # Auto-crop to content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Resize to fit within 128x128, keeping aspect ratio
    img.thumbnail((128, 128), Image.LANCZOS)

    # Quantize to reduce colors (icons are mostly 2-color)
    img = img.quantize(colors=16, method=2).convert("RGBA")

    img.save(path, optimize=True)
    size_kb = os.path.getsize(path) / 1024
    print(f"  {name}: {img.size} -> {size_kb:.0f} KB")

def optimize_scene(name):
    """Optimize scene background: resize, quantize."""
    path = os.path.join(ASSETS, name)
    img = Image.open(path).convert("RGBA")

    # Resize to 800 wide (plenty for mobile)
    w, h = img.size
    new_w = 800
    new_h = int(h * new_w / w)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Quantize to fewer colors (ink wash doesn't need millions)
    img = img.quantize(colors=64, method=2).convert("RGBA")

    img.save(path, optimize=True)
    size_kb = os.path.getsize(path) / 1024
    print(f"  {name}: {img.size} -> {size_kb:.0f} KB")

# Optimize icons
print("=== Icons ===")
icon_files = [f for f in os.listdir(ASSETS) if f.startswith("icon-") and f.endswith(".png")]
for f in sorted(icon_files):
    optimize_icon(f)

# Optimize scene backgrounds
print("\n=== Scene Backgrounds ===")
scene_files = [f for f in os.listdir(ASSETS) if f.startswith("ink-") and f.endswith(".png")]
for f in sorted(scene_files):
    optimize_scene(f)

# Paper textures - resize to 256x256 (already done, just verify)
print("\n=== Paper Textures ===")
for name in ["bg-paper.png", "bg-paper-aged.png"]:
    path = os.path.join(ASSETS, name)
    size_kb = os.path.getsize(path) / 1024
    img = Image.open(path)
    print(f"  {name}: {img.size} -> {size_kb:.0f} KB")

print("\nDone!")
