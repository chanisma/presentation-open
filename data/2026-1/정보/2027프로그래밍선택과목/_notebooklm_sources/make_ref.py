# -*- coding: utf-8 -*-
"""Generate a Totoro-forest watercolor style reference swatch (16:9)."""
import math, random
from PIL import Image, ImageDraw, ImageFilter

random.seed(7)
W, H = 1600, 900
img = Image.new("RGB", (W, H), (252, 246, 227))
px = img.load()

# Vertical gradient: sky-blue -> cream -> leaf-green
sky = (126, 182, 217)
cream = (252, 246, 227)
green = (168, 213, 186)
for y in range(H):
    t = y / (H - 1)
    if t < 0.5:
        u = t / 0.5
        r = int(sky[0] + (cream[0]-sky[0])*u)
        g = int(sky[1] + (cream[1]-sky[1])*u)
        b = int(sky[2] + (cream[2]-sky[2])*u)
    else:
        u = (t-0.5)/0.5
        r = int(cream[0] + (green[0]-cream[0])*u)
        g = int(cream[1] + (green[1]-cream[1])*u)
        b = int(cream[2] + (green[2]-cream[2])*u)
    for x in range(W):
        px[x, y] = (r, g, b)

img = img.filter(ImageFilter.GaussianBlur(2))
draw = ImageDraw.Draw(img, "RGBA")

# Soft clouds
for cx, cy, s in [(300, 150, 90), (1150, 120, 110), (780, 200, 70)]:
    for dx in range(-2, 3):
        draw.ellipse([cx-s+dx*20, cy-s//2, cx+s+dx*20, cy+s//2],
                     fill=(255, 255, 255, 60))

# Rolling green hill
hill = [(0, H)]
for x in range(0, W+1, 40):
    y = 640 + int(40*math.sin(x/220.0))
    hill.append((x, y))
hill.append((W, H))
draw.polygon(hill, fill=(111, 174, 126, 235))

# Big watercolor tree (bark-brown trunk + green canopy)
tx, ty = 1180, 560
draw.polygon([(tx-28, H), (tx-14, ty), (tx+14, ty), (tx+28, H)],
             fill=(176, 137, 104, 255))
for cx, cy, s, a in [(tx, ty-120, 190, 210), (tx-120, ty-70, 130, 200),
                     (tx+120, ty-60, 140, 200), (tx, ty-40, 160, 220)]:
    draw.ellipse([cx-s, cy-s, cx+s, cy+s], fill=(111, 174, 126, a))
    draw.ellipse([cx-s+30, cy-s+20, cx+s-30, cy+s-20], fill=(140, 197, 160, 160))

# Chubby Totoro silhouette under the tree
gx, gy = 430, 690
gray = (92, 88, 83, 235)
draw.ellipse([gx-110, gy-160, gx+110, gy+150], fill=gray)      # body
draw.ellipse([gx-95, gy-250, gx+95, gy-90], fill=gray)          # head
draw.polygon([(gx-55, gy-250), (gx-80, gy-330), (gx-30, gy-260)], fill=gray)  # ear
draw.polygon([(gx+55, gy-250), (gx+80, gy-330), (gx+30, gy-260)], fill=gray)  # ear
draw.ellipse([gx-115, gy-40, gx-45, gy+120], fill=(240, 240, 235, 255))       # belly
draw.ellipse([gx+45, gy-40, gx+115, gy+120], fill=(240, 240, 235, 255))
# eyes
draw.ellipse([gx-42, gy-210, gx-14, gy-182], fill=(255, 255, 255, 255))
draw.ellipse([gx+14, gy-210, gx+42, gy-182], fill=(255, 255, 255, 255))
draw.ellipse([gx-34, gy-202, gx-22, gy-190], fill=(40, 40, 40, 255))
draw.ellipse([gx+22, gy-202, gx+34, gy-190], fill=(40, 40, 40, 255))

# Acorns rolling near Totoro
def acorn(ax, ay, s=22):
    draw.ellipse([ax-s, ay-s//2, ax+s, ay+s], fill=(200, 160, 110, 255))
    draw.pieslice([ax-s, ay-s, ax+s, ay+s//2], 180, 360, fill=(150, 110, 70, 255))
    draw.line([ax, ay-s, ax, ay-s-10], fill=(120, 90, 55, 255), width=4)
for i, ax in enumerate([560, 620, 690]):
    acorn(ax, 760 - i*4)

# Floating leaves
for _ in range(14):
    lx, ly = random.randint(60, W-60), random.randint(100, 600)
    ls = random.randint(10, 20)
    col = random.choice([(140, 197, 160, 180), (176, 137, 104, 150), (111, 174, 126, 180)])
    draw.ellipse([lx-ls, ly-ls//2, lx+ls, ly+ls//2], fill=col)

# Soft soot-sprite dust
for _ in range(30):
    dx, dy = random.randint(0, W), random.randint(100, 700)
    draw.ellipse([dx-3, dy-3, dx+3, dy+3], fill=(255, 255, 255, 120))

img = img.filter(ImageFilter.GaussianBlur(1.2))
out = "03_스타일_참조.png"
img.save(out, "PNG")
print("saved", out, img.size)
