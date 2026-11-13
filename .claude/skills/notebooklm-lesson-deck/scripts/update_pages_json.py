"""Add a new lesson entry to pages.json under the given subject.

Usage:
    python update_pages_json.py \
        --pages-json E:/presentation/pages.json \
        --subject 정보 \
        --title "반복문 — 고등학생 파이썬 입문 (Whiteboard 마커 판서)" \
        --path "data/2026-1/정보/반복문/index.html" \
        --emoji 🔁 \
        --description "..." \
        --tag "반복문 for/while:purple" \
        --tag "Whiteboard:blue" \
        --tag "입문자용:orange" \
        --gradient "linear-gradient(90deg, #1E5BD0, #1B9E4B)"

태그는 "라벨:컬러" 형식으로 여러 번 지정 가능.
이미 같은 path가 등록되어 있으면 덮어쓴다 (idempotent).
JSON 구조 변경 없이 UTF-8로 안전하게 다시 쓴다.
"""
import argparse
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")


def parse_tag(spec: str) -> dict:
    label, _, color = spec.partition(":")
    if not color:
        color = "purple"
    return {"label": label.strip(), "color": color.strip()}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pages-json", required=True)
    ap.add_argument("--subject", required=True, help="Subject name, e.g. 정보")
    ap.add_argument("--title", required=True)
    ap.add_argument("--path", required=True, help="Relative path, e.g. data/2026-1/정보/반복문/index.html")
    ap.add_argument("--emoji", required=True)
    ap.add_argument("--description", required=True)
    ap.add_argument("--tag", action="append", default=[], help="Repeat: label:color")
    ap.add_argument("--gradient", required=True)
    ap.add_argument("--live", action="store_true",
                    help="라이브 문항(quiz.json) 지원 덱 — 허브 카드에 QUIZ 배지")
    ap.add_argument("--subject-icon", default="📐", help="Icon if subject must be created")
    ap.add_argument("--subject-color", default="purple")
    args = ap.parse_args()

    with open(args.pages_json, "r", encoding="utf-8") as f:
        data = json.load(f)

    subjects = data.setdefault("subjects", [])
    subj = next((s for s in subjects if s.get("name") == args.subject), None)
    if subj is None:
        subj = {
            "name": args.subject,
            "icon": args.subject_icon,
            "color": args.subject_color,
            "pages": [],
        }
        subjects.append(subj)
        print(f"[created] subject {args.subject}")

    pages = subj.setdefault("pages", [])
    entry = {
        "title": args.title,
        "path": args.path,
        "emoji": args.emoji,
        "description": args.description,
        "tags": [parse_tag(t) for t in args.tag],
        "gradient": args.gradient,
    }
    if args.live:
        entry["live"] = True

    # idempotent: replace existing entry with same path
    for i, p in enumerate(pages):
        if p.get("path") == args.path:
            pages[i] = entry
            print(f"[replaced] {args.path}")
            break
    else:
        pages.append(entry)
        print(f"[appended] {args.path}")

    with open(args.pages_json, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"[saved] {args.pages_json} (subject={args.subject}, total pages={len(pages)})")


if __name__ == "__main__":
    main()
