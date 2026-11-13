# -*- coding: utf-8 -*-
"""기존 수업 폴더를 live 가능 버전으로 변환하는 기계적 단계 자동화.

사용법: python upgrade_to_live.py <수업폴더>

하는 일 (모두 idempotent):
  1. 덱 유형 감지 — Contract v1(deck.js)이면 opt-in 불필요,
     legacy(인라인 네비)이면 </body> 직전에 live.js opt-in 태그 삽입
     (상대경로 깊이는 저장소 루트 기준으로 자동 계산)
  2. pages.json에서 해당 path 엔트리에 "live": true 플래그 설정
     (미등록이면 경고만 — 등록은 update_pages_json.py 몫)
  3. quiz.json 존재 여부 보고 (문항 저작은 이 스크립트가 하지 않음 —
     live-quiz-builder 스킬의 저작 원칙을 따라 에이전트/사용자가 작성)

종료 코드: 0 정상 / 1 오류
"""
import json
import sys
from pathlib import Path


def find_root(start: Path):
    """pages.json + app/runtime을 가진 조상 디렉터리 = 저장소 루트."""
    for cand in [start, *start.resolve().parents]:
        if (cand / "pages.json").exists() and (cand / "app" / "runtime").is_dir():
            return cand
    return None


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    folder = Path(sys.argv[1]).resolve()
    index = folder / "index.html"
    if not index.exists():
        print(f"오류: {index} 없음 — 수업 폴더(index.html 포함)를 지정하세요")
        return 1
    root = find_root(folder)
    if not root:
        print("오류: 저장소 루트(pages.json + app/runtime)를 찾지 못함")
        return 1

    rel = index.relative_to(root).as_posix()          # 예: data/2026-1/정보/조건문/index.html
    depth = rel.count("/")                            # 루트까지 올라갈 단계 수
    prefix = "../" * depth

    # ── 1) 덱 유형 감지 + opt-in 삽입 ──
    html = index.read_text(encoding="utf-8")
    if "app/runtime/deck.js" in html:
        deck_note = "Contract v1 덱 (deck.js) — ?live= 자동 지원, opt-in 불필요"
    elif "app/runtime/live.js" in html:
        deck_note = "opt-in 태그 이미 있음 — 변경 없음"
    else:
        tag = f'<script type="module" src="{prefix}app/runtime/live.js?v=2"></script>'
        i = html.rfind("</body>")
        if i < 0:
            print("오류: </body> 태그를 찾지 못해 opt-in을 삽입할 수 없음")
            return 1
        index.write_text(html[:i] + tag + "\n" + html[i:], encoding="utf-8")
        deck_note = f"legacy 덱 → opt-in 삽입: {tag}"

    # ── 2) pages.json live 플래그 ──
    pages_path = root / "pages.json"
    data = json.loads(pages_path.read_text(encoding="utf-8"))
    entry = None
    for subject in data.get("subjects", []):
        for page in subject.get("pages", []):
            if page.get("path") == rel:
                entry = page
    if entry is None:
        pages_note = f"경고: pages.json에 {rel} 미등록 — update_pages_json.py로 등록 후 다시 실행"
    elif entry.get("live") is True:
        pages_note = "pages.json live 플래그 이미 설정됨"
    else:
        entry["live"] = True
        pages_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        pages_note = "pages.json live: true 설정 → 뷰어에 LIVE 배지 + [▶ 발표 시작]"

    # ── 3) quiz.json 상태 ──
    quiz_json = folder / "quiz.json"
    lj_note = ("quiz.json 있음 — 검증기로 확인하세요"
               if quiz_json.exists()
               else "quiz.json 없음 — live-quiz-builder 원칙대로 문항을 저작하세요 (필수)")

    print(f"덱   : {deck_note}")
    print(f"등록 : {pages_note}")
    print(f"문항 : {lj_note}")
    print(f"\n다음 단계: python .claude/skills/live-quiz-builder/scripts/validate_live_config.py \"{folder}\"")
    return 0


if __name__ == "__main__":
    sys.exit(main())
