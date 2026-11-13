# -*- coding: utf-8 -*-
"""라이브 문항 검증기 — 덱 마크업(legacy) + quiz.json(권장) 겸용.

사용법: python validate_live_config.py <경로>
  <경로>가 index.html → 덱 내 data-live 마크업 검사 (legacy)
  <경로>가 quiz.json  → 수업 폴더 문항 파일 검사
  <경로>가 폴더       → 둘 다 검사 (존재하는 것만)

검사 항목 (공통): kind/prompt 필수, kind별 스키마(choice options 2~6, answer 범위,
  code language/tests, peerInstruction 제약), 식별자 중복
마크업 전용: live-config JSON 파싱, opt-in 태그, .live-stage 폴백 (경고)
quiz.json 전용: id 필수, slide는 0 이상 정수 | "last" | 생략
종료 코드: 오류 있으면 1, 없으면 0 (경고는 통과)
"""
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

VALID_KINDS = {"choice", "ox", "short", "wordcloud", "exit", "code"}


class DeckParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.slides = []          # {index, live, live_id, configs: [str], has_stage}
        self._depth = 0
        self._slide_stack = []    # (slide_dict, depth_at_open)
        self._in_config = False
        self._config_buf = []
        self.has_optin = False
        self._slide_count = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get("class") or "").split()
        if tag == "div" and "slide" in cls:
            slide = {
                "index": self._slide_count,
                "live": "data-live" in a,
                "live_id": a.get("data-live-id"),
                "configs": [],
                "has_stage": False,
            }
            self._slide_count += 1
            self.slides.append(slide)
            self._slide_stack.append((slide, self._depth))
        if self._slide_stack:
            slide = self._slide_stack[-1][0]
            if "live-stage" in cls:
                slide["has_stage"] = True
            if tag == "script" and "live-config" in cls:
                self._in_config = True
                self._config_buf = []
        if tag == "script" and "app/runtime/live.js" in (a.get("src") or ""):
            self.has_optin = True
        self._depth += 1

    def handle_endtag(self, tag):
        self._depth -= 1
        if tag == "script" and self._in_config:
            self._in_config = False
            if self._slide_stack:
                self._slide_stack[-1][0]["configs"].append("".join(self._config_buf))
        while self._slide_stack and self._depth <= self._slide_stack[-1][1]:
            self._slide_stack.pop()

    def handle_data(self, data):
        if self._in_config:
            self._config_buf.append(data)


def validate_config(cfg, where, errors, warnings):
    kind = cfg.get("kind")
    if kind not in VALID_KINDS:
        errors.append(f"{where}: kind가 유효하지 않음: {kind!r} (허용: {sorted(VALID_KINDS)})")
        return
    prompt = cfg.get("prompt")
    if not isinstance(prompt, str) or not prompt.strip():
        errors.append(f"{where}: prompt가 비어 있음")
    if kind == "choice":
        opts = cfg.get("options")
        if not isinstance(opts, list) or not (2 <= len(opts) <= 6):
            errors.append(f"{where}: choice options는 2~6개 배열이어야 함 (현재: {opts!r:.60})")
            return
        if any(not isinstance(o, str) or not o.strip() for o in opts):
            errors.append(f"{where}: 빈 보기 문자열이 있음")
        ans = cfg.get("answer")
        if ans is not None and (not isinstance(ans, int) or not (0 <= ans < len(opts))):
            errors.append(f"{where}: answer는 0~{len(opts)-1} 정수여야 함 (현재: {ans!r})")
        if ans is None:
            warnings.append(f"{where}: answer 없음 → 투표 모드로 동작 (의도 확인)")
        mc = cfg.get("misconceptions")
        if mc is not None:
            if not isinstance(mc, dict):
                errors.append(f"{where}: misconceptions는 객체여야 함")
            else:
                for k in mc:
                    if not k.isdigit() or not (0 <= int(k) < len(opts)):
                        errors.append(f"{where}: misconceptions 키 {k!r}가 보기 범위를 벗어남")
                    elif ans is not None and int(k) == ans:
                        warnings.append(f"{where}: misconceptions 키 {k}가 정답 인덱스임 (오답에만 다는 것을 권장)")
    elif kind == "ox":
        ans = cfg.get("answer")
        if ans is not None and not isinstance(ans, bool):
            errors.append(f"{where}: ox answer는 true/false여야 함 (현재: {ans!r})")
    elif kind == "code":
        lang = cfg.get("language")
        if lang not in ("python", "web"):
            errors.append(f"{where}: code language는 'python' 또는 'web' 필수 (현재: {lang!r})")
        starter = cfg.get("starter")
        if starter is not None and not isinstance(starter, str):
            errors.append(f"{where}: starter는 문자열이어야 함")
        tests = cfg.get("tests")
        if tests is not None:
            if lang == "web":
                warnings.append(f"{where}: web 언어는 tests 자동 채점 미지원 (무시됨)")
            if (not isinstance(tests, list) or not tests or any(
                    not isinstance(t, dict)
                    or not isinstance(t.get("call"), str) or not t["call"].strip()
                    or not str(t.get("expected", "")).strip()
                    for t in tests)):
                errors.append(f"{where}: tests는 [{{call, expected}}] 비어있지 않은 배열이어야 함")
        elif lang == "python":
            warnings.append(f"{where}: python인데 tests 없음 → 자동 채점 없이 실행만 가능")
    # short/wordcloud/exit: prompt만 필수

    pi = cfg.get("peerInstruction")
    if pi is not None:
        if not isinstance(pi, bool):
            errors.append(f"{where}: peerInstruction은 true/false여야 함 (현재: {pi!r})")
        elif pi and kind not in ("choice", "ox"):
            errors.append(f"{where}: peerInstruction(2라운드 투표)은 choice/ox에서만 지원됨")

    if cfg.get("gamify") is not None:
        warnings.append(f"{where}: gamify는 문항 필드가 아니라 **세션 단위 설정**임 "
                        "(교사 콘솔 세션 생성 시 '⚡ 스피드 퀴즈 세션' 체크) — 이 필드는 무시됨")


def validate_quiz_json(path, errors, warnings):
    """<수업폴더>/quiz.json 검사. 문항 수 반환."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        errors.append(f"quiz.json: JSON 파싱 실패 — {e}")
        return 0
    acts = data.get("activities")
    if not isinstance(acts, list) or not acts:
        errors.append("quiz.json: activities는 비어있지 않은 배열이어야 함")
        return 0
    seen = {}
    for i, a in enumerate(acts):
        if not isinstance(a, dict):
            errors.append(f"quiz.json[{i}]: 객체가 아님")
            continue
        aid = a.get("id")
        where = f"quiz.json[{i}]" + (f"({aid})" if aid else "")
        if not isinstance(aid, str) or not aid.strip():
            errors.append(f"{where}: id 필수 (kebab-case 권장)")
        elif aid in seen:
            errors.append(f"{where}: id 중복 — [{seen[aid]}]와 충돌")
        else:
            seen[aid] = i
        slide = a.get("slide")
        if slide is not None and slide != "last" and not (isinstance(slide, int) and slide >= 0):
            errors.append(f"{where}: slide는 0 이상 정수 | \"last\" | 생략 (현재: {slide!r})")
        validate_config(a, where, errors, warnings)
    return len(acts)


def validate_deck_html(path, errors, warnings):
    """덱 HTML의 data-live 마크업 검사 (legacy). 라이브 슬라이드 수 반환."""
    html = path.read_text(encoding="utf-8")
    parser = DeckParser()
    parser.feed(html)
    live_slides = [s for s in parser.slides if s["live"]]
    if not live_slides:
        return 0

    seen_ids = {}
    for s in live_slides:
        where = f"슬라이드#{s['index']}" + (f"({s['live_id']})" if s["live_id"] else "")
        if not s["configs"]:
            errors.append(f"{where}: script.live-config 블록이 없음")
            continue
        if len(s["configs"]) > 1:
            errors.append(f"{where}: live-config 블록이 {len(s['configs'])}개 (1개만 허용)")
        try:
            cfg = json.loads(s["configs"][0])
        except json.JSONDecodeError as e:
            errors.append(f"{where}: live-config JSON 파싱 실패 — {e}")
            continue
        validate_config(cfg, where, errors, warnings)
        key = s["live_id"] or f"s{s['index']}-{cfg.get('kind', 'quiz')}"
        if key in seen_ids:
            errors.append(f"{where}: slide_key 중복 — {key!r} (슬라이드#{seen_ids[key]}와 충돌)")
        seen_ids[key] = s["index"]
        if not s["live_id"]:
            warnings.append(f"{where}: data-live-id 미지정 → 슬라이드 순서 변경 시 문항 식별자가 바뀜")
        if not s["has_stage"]:
            warnings.append(f"{where}: .live-stage 정적 폴백 없음 → 라이브 미사용 시 빈 슬라이드로 보임")

    if not parser.has_optin:
        # Contract v1 덱(deck.js)은 live.js를 내장 로드하므로 opt-in 태그 불필요
        if "app/runtime/deck.js" not in html:
            errors.append("opt-in 스크립트 태그 없음: deck.js(Contract v1) 또는 "
                          '<script type="module" src="../../app/runtime/live.js?v=1"></script> 필요')

    return len(live_slides)


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"오류: 경로 없음 — {path}")
        return 1

    errors, warnings = [], []
    n_html = n_json = 0
    checked = []

    if path.is_dir():
        html_p, json_p = path / "index.html", path / "quiz.json"
        if json_p.exists():
            n_json = validate_quiz_json(json_p, errors, warnings)
            checked.append("quiz.json")
        if html_p.exists():
            n_html = validate_deck_html(html_p, errors, warnings)
            checked.append("index.html")
        if not checked:
            print("검사할 파일 없음 (index.html/quiz.json)")
            return 1
    elif path.suffix == ".json":
        n_json = validate_quiz_json(path, errors, warnings)
        checked.append(path.name)
    else:
        n_html = validate_deck_html(path, errors, warnings)
        checked.append(path.name)

    total = n_html + n_json
    if total == 0 and not errors:
        print("라이브 문항이 없습니다. (라이브 미사용)")
        return 0

    print(f"검사 완료 [{', '.join(checked)}] — quiz.json 문항 {n_json}개 · 마크업 슬라이드 {n_html}개")
    for w in warnings:
        print(f"  경고: {w}")
    for e in errors:
        print(f"  오류: {e}")
    if errors:
        print(f"\n실패: 오류 {len(errors)}건")
        return 1
    print(f"\n통과 (경고 {len(warnings)}건)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
