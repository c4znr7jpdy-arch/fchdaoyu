"""Shrink paper textures to 256x256 for CSS tiling, then base64 encode."""
from PIL import Image
import base64, os, io

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

for name in ["bg-paper.png", "bg-paper-aged.png"]:
    path = os.path.join(ASSETS, name)
    img = Image.open(path)
    # Shrink to 256x256
    img = img.resize((256, 256), Image.LANCZOS)
    # Save as PNG
    img.save(path)
    # Base64 encode
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    print(f"{name}: {os.path.getsize(path)/1024:.0f} KB, base64: {len(b64)} chars")
    # Save for reference
    with open(os.path.join(ASSETS, name + ".b64"), "w") as f:
        f.write(b64)
