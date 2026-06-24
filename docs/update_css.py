"""Generate updated app.css with paper texture as base64 data URI."""
import base64, os

ASSETS = "e:/wechatproject/project2/Daoyou/miniprogram/src/assets"
APP_CSS = "e:/wechatproject/project2/Daoyou/miniprogram/src/app.css"

# Read base64 of bg-paper.png
with open(os.path.join(ASSETS, "bg-paper.png"), "rb") as f:
    b64 = base64.b64encode(f.read()).decode()

# Read current app.css
with open(APP_CSS, "r", encoding="utf-8") as f:
    css = f.read()

# Replace the old SVG background-image with PNG base64 data URI
old_bg = '''  background-image: url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='n' x='0' y='0' width='100%25' height='100%25'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0' in='noise' result='gray'/%3E%3CfeComponentTransfer in='gray'%3E%3CfeFuncA type='linear' slope='0.06'/%3E%3C/feComponentTransfer%3E%3C/filter%3E%3C/defs%3E%3Crect width='200' height='200' fill='%23f0e6d0'/%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");'''

new_bg = f'  background-image: url("data:image/png;base64,{b64}");'

if old_bg in css:
    css = css.replace(old_bg, new_bg)
    with open(APP_CSS, "w", encoding="utf-8") as f:
        f.write(css)
    print(f"Updated app.css with PNG texture ({len(b64)} chars)")
else:
    print("ERROR: Could not find old background-image in app.css")
    print("Searching for partial match...")
    if "feTurbulence" in css:
        print("  Found feTurbulence reference - will do manual replacement")
