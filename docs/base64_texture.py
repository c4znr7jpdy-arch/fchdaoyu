"""Convert paper texture PNGs to base64 data URIs for CSS embedding."""
import base64, os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"

for name in ["bg-paper.png", "bg-paper-aged.png"]:
    path = os.path.join(ASSETS, name)
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    size_kb = os.path.getsize(path) / 1024
    print(f"{name}: {size_kb:.0f} KB, base64 length: {len(data)} chars")
    # Save base64 string for use in CSS
    with open(os.path.join(ASSETS, name + ".b64"), "w") as f:
        f.write(data)
