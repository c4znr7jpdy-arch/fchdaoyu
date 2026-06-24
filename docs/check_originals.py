"""Check original AI-generated images for transparency."""
from PIL import Image
import os

SRC = "e:/wechatproject/project2/Daoyou/docs/images"

for fname in sorted(os.listdir(SRC)):
    path = os.path.join(SRC, fname)
    img = Image.open(path)
    print(f"{fname}: mode={img.mode}, size={img.size}, info_keys={list(img.info.keys())}")
    if 'transparency' in img.info:
        print(f"  Has transparency chunk!")
