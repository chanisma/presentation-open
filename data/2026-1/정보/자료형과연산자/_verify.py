import json, os, re, sys
sys.stdout.reconfigure(encoding="utf-8")

base = r"E:\presentation\정보\자료형과연산자"

imgs = sorted([f for f in os.listdir(os.path.join(base, "images")) if f.startswith("slide-")])
print(f"Images: {len(imgs)} files | {imgs[0]} ... {imgs[-1]}")

with open(os.path.join(base, "index.html"), "r", encoding="utf-8") as f:
    html = f.read()
total = re.search(r"const TOTAL = (\d+);", html).group(1)
counter = re.search(r'id="counter">([^<]+)</div>', html).group(1)
sub = re.search(r'class="sub">([^<]+)</div>', html).group(1)
print(f"index.html | TOTAL={total} | counter={counter} | sub={sub}")

with open(r"E:\presentation\pages.json", "r", encoding="utf-8") as f:
    data = json.load(f)
for s in data["subjects"]:
    if s["name"] == "정보":
        for p in s["pages"]:
            if "자료형과 연산자" in p["title"]:
                print("pages.json entry:", p["title"])
                idx = p["description"].find("NotebookLM")
                print("  desc fragment:", p["description"][idx:idx+35])
print("--- all checks complete ---")
