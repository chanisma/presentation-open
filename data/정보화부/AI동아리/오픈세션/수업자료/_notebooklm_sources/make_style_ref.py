# -*- coding: utf-8 -*-
"""화이트톤 현대 미니멀 스타일 참조 이미지 생성 (NotebookLM 자료 3번)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1600, 900
BG = (255, 255, 255)
INK = (17, 24, 39)
SUB = (107, 114, 128)
INDIGO = (79, 70, 229)
AMBER = (245, 158, 11)
GREEN = (5, 150, 105)
CARD = (248, 250, 252)
BORDER = (229, 231, 235)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

FB = "C:/Windows/Fonts/malgunbd.ttf"
FR = "C:/Windows/Fonts/malgun.ttf"
def f(path, sz): return ImageFont.truetype(path, sz)

def rrect(xy, r, fill=None, outline=None, width=1):
    d.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)

def center(text, font):
    bb = d.textbbox((0, 0), text, font=font); return bb[2]-bb[0], bb[3]-bb[1]

# top accent line + title
d.rectangle([80, 70, 200, 76], fill=INDIGO)
d.text((80, 92), "화이트톤 현대 미니멀", font=f(FB, 58), fill=INK)
d.text((82, 168), "White Modern · 흰 배경 + 인디고/앰버 포인트 · 굵은 산세리프 · 둥근 카드 · 선 아이콘", font=f(FR, 24), fill=SUB)

# ── pipeline (5 step) ──
steps = [("1", "기초정보", INDIGO), ("2", "프롬프트", INDIGO), ("3", "통합엑셀", INDIGO),
         ("4", "평가문", AMBER), ("5", "검수·업로드", INDIGO)]
y0, cw, ch, gap = 250, 250, 120, 40
x = 90
cx_centers = []
for i, (num, label, col) in enumerate(steps):
    rrect([x, y0, x+cw, y0+ch], 16, fill=CARD, outline=BORDER, width=2)
    # number circle
    d.ellipse([x+22, y0+34, x+22+52, y0+34+52], fill=col)
    nw, nh = center(num, f(FB, 30))
    d.text((x+22+26-nw/2, y0+34+26-nh/2-2), num, font=f(FB, 30), fill=(255, 255, 255))
    d.text((x+92, y0+46), label, font=f(FB, 30), fill=INK)
    cx_centers.append((x, x+cw))
    if i < len(steps)-1:
        ax = x+cw+8
        d.line([ax, y0+ch/2, ax+gap-16, y0+ch/2], fill=SUB, width=3)
        d.polygon([(ax+gap-16, y0+ch/2-7), (ax+gap-16, y0+ch/2+7), (ax+gap-4, y0+ch/2)], fill=SUB)
    x += cw+gap
# amber callout on step 4
sx0, sx1 = cx_centers[3]
d.line([(sx0+cw/2, y0+ch), (sx0+cw/2, y0+ch+34)], fill=AMBER, width=3)
rrect([sx0-30, y0+ch+34, sx1+30, y0+ch+92], 12, fill=(255, 247, 237), outline=AMBER, width=2)
t = "여기서 사람처럼 NLP로 작성"
tw, th = center(t, f(FB, 22))
d.text((((sx0+sx1)/2)-tw/2, y0+ch+50), t, font=f(FB, 22), fill=AMBER)

# ── bottom: left/right compare + output card ──
by = 560
# left grey (죽임)
rrect([90, by, 690, by+260], 16, fill=(249, 250, 251), outline=BORDER, width=2)
d.text((120, by+26), "✕  한 명씩 반복", font=f(FB, 30), fill=SUB)
for k in range(4):
    yy = by+90+k*38
    d.rounded_rectangle([120, yy, 660, yy+26], radius=8, fill=(238, 240, 243))
    d.text((130, yy+1), "자료 → 초안 → 수정 → 완성", font=f(FR, 18), fill=(170, 175, 183))

# right indigo (강조)
rrect([720, by, 1320, by+260], 16, fill=(238, 242, 255), outline=INDIGO, width=3)
d.text((752, by+26), "✓  능력은 유지 + 자동 반복", font=f(FB, 30), fill=INDIGO)
for ic, lab in [("📂", "파일 읽기"), ("🔁", "반복 실행"), ("🔢", "바이트 계산"), ("💾", "저장")]:
    pass
chips = ["파일 읽기", "반복 실행", "바이트 계산", "저장"]
cxp = 752
for c in chips:
    cwid = center(c, f(FB, 20))[0]+36
    rrect([cxp, by+96, cxp+cwid, by+140], 22, fill=(255, 255, 255), outline=INDIGO, width=2)
    d.text((cxp+18, by+104), c, font=f(FB, 20), fill=INDIGO)
    cxp += cwid+16
d.text((752, by+168), "에이전틱 AI = 잘 쓰는 LLM + 스스로 실행", font=f(FB, 24), fill=INK)

# output result card (far right)
rrect([1350, by, 1520, by+260], 16, fill=CARD, outline=BORDER, width=2)
d.text((1372, by+24), "세특", font=f(FB, 24), fill=INK)
d.text((1372, by+60), "초안 ✓", font=f(FR, 20), fill=SUB)
# green byte badge
rrect([1372, by+150, 1500, by+196], 12, fill=(236, 253, 245), outline=GREEN, width=2)
d.text((1388, by+158), "1,452B ✓", font=f(FB, 22), fill=GREEN)

img.save(r"C:\repository\presentation\정보\오픈세션\_notebooklm_sources\03_스타일_참조.png")
print("saved 03_스타일_참조.png", img.size)
