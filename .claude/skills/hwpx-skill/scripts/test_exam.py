#!/usr/bin/env python3
"""
시험지 생성(Workflow I) 테스트 스위트.

단위(빌더 XML 적합성) + 통합(전체 시험지 생성) + 엣지케이스 +
실제 규모 재현(선택형 18·단답형 2·서술형 4) + 프레임 바이트 보존을 검증한다.

실행:
    python test_exam.py
    python test_exam.py -v     # 실패 상세 출력
종료 코드 0 = 전부 통과.
"""

import os
import re
import sys
import zipfile
import tempfile
import subprocess
from pathlib import Path

from lxml import etree

SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import exam_helpers as E  # noqa: E402
from build_exam import generate  # noqa: E402
from hwpx_helpers import NS_DECL  # noqa: E402

SKILL_DIR = SCRIPT_DIR.parent
FORM = SKILL_DIR / "assets" / "exam-form.hwpx"
HP = "{http://www.hancom.co.kr/hwpml/2011/paragraph}"

_results = []


def check(name, cond, detail=""):
    _results.append((name, bool(cond), detail))


def parse_fragment(frag):
    """문단/박스 XML 조각을 네임스페이스로 감싸 파싱(적합성 검사). 실패 시 예외."""
    etree.fromstring(f"<hs:sec {NS_DECL}>{frag}</hs:sec>".encode("utf-8"))


def read_section(hwpx):
    return zipfile.ZipFile(hwpx).read("Contents/section0.xml").decode("utf-8")


def texts_of(data):
    return " ".join(
        re.sub(r"<[^>]+>", "", t)
        for t in re.findall(r"<hp:t>(.*?)</hp:t>", data, re.DOTALL)
    )


def top_paras(data):
    root = etree.fromstring(data.encode("utf-8"))
    return [c for c in root if etree.QName(c).localname == "p"]


# ════════════════════════════════════════════════════════════
# 1. 단위 테스트 — 빌더가 적합한 XML을 생성하는가
# ════════════════════════════════════════════════════════════
def test_unit_builders():
    E.reset_id(1_000_000)
    cases = {
        "choice_question(jimun)": E.choice_question(
            1, "다음 설명에 맞는 것은?", 3.1,
            jimun="센서와 네트워크를 갖춘 사물.",
            choices=["스마트팜", "증강현실", "사물인터넷", "분산저장", "디지털공장"]),
        "choice_question(code)": E.choice_question(
            2, "출력 결과는?", 4.1, code=["a = 3", "b = 4", "print(a+b)"],
            choices=["7", "34"]),
        "short_answer": E.short_answer(1, "빈칸을 채우시오.", 3.3,
                                       code=["for n in x:", "    ㉮"]),
        "essay": E.essay(1, "코드를 작성하시오.", 5.4, jimun="조건: 입력/조건문"),
        "box(str)": [E.box("한 줄 지문")],
        "box(list)": [E.box(["여러", "줄", "지문"])],
        "instruction": E.instruction("※ 안내문"),
        "continuation": E.continuation("다음 장에 계속"),
        "end_marker": E.end_marker(),
    }
    for name, parts in cases.items():
        is_list = isinstance(parts, list)
        try:
            parse_fragment("".join(parts))
            ok = is_list and len(parts) >= 1
            check(f"unit:{name} 적합 XML+list반환", ok)
        except etree.XMLSyntaxError as e:
            check(f"unit:{name} 적합 XML+list반환", False, str(e))

    # XML 이스케이프
    esc = "".join(E.choice_question(1, "a < b & c > d", 1, choices=['x"y']))
    try:
        parse_fragment(esc)
        check("unit:특수문자 이스케이프", "&lt;" in esc and "&amp;" in esc and "&quot;" in esc)
    except etree.XMLSyntaxError as e:
        check("unit:특수문자 이스케이프", False, str(e))

    # 배점 표기: 3.0 → "3", 3.1 → "3.1"
    p30 = "".join(E.choice_question(1, "q", 3.0, choices=["a"]))
    p31 = "".join(E.choice_question(1, "q", 3.1, choices=["a"]))
    check("unit:배점 3.0→'(3점)'", "(3점)" in p30 and "(3.0점)" not in p30)
    check("unit:배점 3.1→'(3.1점)'", "(3.1점)" in p31)

    # 선택지 원문자 ①..⑩
    many = "".join(E.choice_question(1, "q", 1, choices=list("abcdefghij")))
    check("unit:선택지 원문자 ①~⑩", "① a" in many and "⑩ j" in many)


# ════════════════════════════════════════════════════════════
# 2. 단위 테스트 — 머리말 치환 맵
# ════════════════════════════════════════════════════════════
def test_unit_header():
    r = E.header_replacements(year="2025", grade="1", semester="1", exam_round="2",
                              subject="정보", date="2025. 7. 9.",
                              counts=(18, 2, 4), total_pages=5)
    check("hdr:시험명 조합", r[E.TITLE_ANCHOR] == "2025년  1학년  1학기  2차 정기시험")
    check("hdr:과목명", r[E.SUBJECT_ANCHOR] == "정보 ")
    check("hdr:날짜", r[E.DATE_ANCHOR] == "(2025. 7. 9.)")
    check("hdr:문항수", r[E.COUNTS_ANCHOR] == "선택형 ( 18 )문항, 단답형 ( 2 )문항, 서술형 ( 4 )문항")
    check("hdr:총면수 자동(치환 없음)", E.PAGES_ANCHOR not in r)  # 꼬리말 TOTAL_PAGE 자동필드

    r2 = E.header_replacements(title="2025학년도 2학년 1학기 1차고사", subject="수학 & 통계")
    check("hdr:title 직접지정", r2[E.TITLE_ANCHOR] == "2025학년도 2학년 1학기 1차고사")
    check("hdr:과목명 이스케이프", r2[E.SUBJECT_ANCHOR] == "수학 &amp; 통계 ")

    r3 = E.header_replacements()  # 아무것도 없으면 치환 없음
    check("hdr:빈 입력→치환 없음", E.TITLE_ANCHOR not in r3 and E.SUBJECT_ANCHOR not in r3)


# ════════════════════════════════════════════════════════════
# 3. 단위 테스트 — 프레임 경계/시드/출제자
# ════════════════════════════════════════════════════════════
def test_unit_frame():
    sec = read_section(FORM)
    head, tail = E.split_after_frame(sec)
    check("frame:head=secPr+머리·꼬리말+저작권",
          all(k in head for k in ["<hp:secPr", "<hp:header", "<hp:footer", "저작권"]))
    check("frame:head+tail 복원", head + tail == sec)
    check("frame:tail에 </hs:sec>", "</hs:sec>" in tail)
    check("frame:max_frame_id>0", E.max_frame_id(head) > 0)

    filled, applied = E.set_examiner(head, "홍길동")
    check("frame:출제자 채움", applied and "홍길동" in filled)
    # 앵커 모호하면 미적용(안전)
    _, applied2 = E.set_examiner(head + '<hp:run charPrIDRef="30"/>', "X")
    check("frame:앵커 중복→미적용(안전)", applied2 is False)


# ════════════════════════════════════════════════════════════
# 4. 통합 테스트 — 생성된 파일 구조 헬퍼
# ════════════════════════════════════════════════════════════
def _validate(hwpx):
    r = subprocess.run([sys.executable, str(SCRIPT_DIR / "validate.py"), str(hwpx)],
                       capture_output=True)
    return r.returncode == 0


def _verify(hwpx):
    r = subprocess.run([sys.executable, str(SCRIPT_DIR / "verify_hwpx.py"),
                        "--result", str(hwpx)], capture_output=True, text=True,
                       encoding="utf-8")
    return "PASS" in (r.stdout or "")


FRAME_TOKENS = ["<hp:secPr", 'colCount="2"', "<hp:header", "<hp:footer",
                'numType="TOTAL_PAGE"', 'numType="PAGE"', '<hp:colLine',
                'width="72852"', 'height="103180"', "저작권"]
LEFTOVERS = ["2026년  학년", "(2026. . .)", "선택형 (  )문항"]


def _assert_doc(tag, hwpx, must_have=(), must_not=(), counts=None, body_max=None):
    data = read_section(hwpx)
    txt = texts_of(data)
    check(f"{tag}:VALID", _validate(hwpx))
    check(f"{tag}:verify PASS", _verify(hwpx))
    check(f"{tag}:프레임 보존", all(t in data for t in FRAME_TOKENS))
    check(f"{tag}:잔여 플레이스홀더 0", not any(l in txt for l in LEFTOVERS))
    for m in must_have:
        check(f"{tag}:포함 {m!r}", m in txt, txt[:120])
    for m in must_not:
        check(f"{tag}:불포함 {m!r}", m not in txt)
    if counts:
        a, b, c = counts
        check(f"{tag}:문항수 ({a},{b},{c})",
              f"선택형 ( {a} )문항, 단답형 ( {b} )문항, 서술형 ( {c} )문항" in txt)
    if body_max is not None:
        n = len(top_paras(data)) - 1  # 프레임 1 제외
        check(f"{tag}:불필요 패딩 없음(본문<{body_max})", 0 <= n < body_max, f"본문 {n}문단")
    return data


def test_integration(tmp):
    # 4-1) 샘플 규모
    spec1 = {
        "year": "2025", "grade": "1", "semester": "1", "round": "2",
        "subject": "정보", "date": "2025. 7. 9.", "examiner": "홍길동",
        "total_pages": 5,
        "instruction": "※ 단답형은 OMR카드 앞면에 작성하시오.",
        "questions": [
            {"type": "choice", "stem": "IoT 용어?", "points": 3.1,
             "jimun": "센서와 네트워크.", "choices": ["스마트팜", "IoT", "AR", "VR", "ML"]},
            {"type": "choice", "stem": "출력은?", "points": 4.1,
             "code": ["a=3", "b=4", "print(a+b)"], "choices": ["7", "34"]},
            {"type": "short", "stem": "빈칸?", "points": 3.3, "code": ["for n in x:", " ㉮"]},
            {"type": "essay", "stem": "작성하시오.", "points": 5.4},
        ],
    }
    out1 = tmp / "sample.hwpx"
    generate(spec1, out1)
    _assert_doc("샘플", out1,
                must_have=["1. IoT 용어? (3.1점)", "① 스마트팜", "2. 출력은? (4.1점)",
                           "※ 단답형은 OMR카드 앞면에 작성하시오.",
                           "[단답형 1] 빈칸? (3.3점)", "[서술형 1] 작성하시오. (5.4점)",
                           "홍길동", "정보", "(2025. 7. 9.)", "- 끝. 수고하셨습니다. -"],
                counts=(2, 1, 1), body_max=40)

    # 4-2) 실제 규모 재현: 선택형 18 + 단답형 2 + 서술형 4
    qs = [{"type": "choice", "stem": f"{i}번 문항?", "points": 3.0 + i * 0.1,
           "choices": ["①후보", "②후보", "③후보", "④후보", "⑤후보"]} for i in range(1, 19)]
    qs += [{"type": "short", "stem": f"단답 {i}?", "points": 3.0} for i in range(1, 3)]
    qs += [{"type": "essay", "stem": f"서술 {i}?", "points": 5.0} for i in range(1, 5)]
    spec2 = {"year": "2025", "grade": "1", "semester": "1", "round": "2",
             "subject": "정보", "date": "2025. 7. 9.", "examiner": "권민결",
             "total_pages": 5,
             "instruction": "※ 단답형은 OMR카드 앞면에, 서술형은 뒷면에 작성하시오.",
             "questions": qs}
    out2 = tmp / "full.hwpx"
    generate(spec2, out2)
    _assert_doc("실제규모(18·2·4)", out2,
                must_have=["1. 1번 문항? (3.1점)", "18. 18번 문항? (4.8점)",
                           "[단답형 1] 단답 1? (3점)", "[단답형 2] 단답 2? (3점)",
                           "[서술형 1] 서술 1? (5점)", "[서술형 4] 서술 4? (5점)",
                           "권민결", "면 중", "- 끝. 수고하셨습니다. -"],
                counts=(18, 2, 4))

    # 4-3) title 직접 + 출제자 없음 + counts 자동
    spec3 = {"title": "2025학년도 2학년 1학기 1차고사", "subject": "인공지능 기초",
             "date": "2025. 4. 25.", "total_pages": 4,
             "questions": [
                 {"type": "choice", "stem": "옳은 것은?", "points": 3.0,
                  "choices": ["가", "나", "다", "라", "마"]},
                 {"type": "essay", "stem": "작성하시오.", "points": 5.0, "answer_lines": 5}]}
    out3 = tmp / "title.hwpx"
    generate(spec3, out3)
    _assert_doc("title직접·출제자없음", out3,
                must_have=["2025학년도 2학년 1학기 1차고사", "인공지능 기초", "면 중"],
                must_not=["홍길동", "권민결"], counts=(1, 0, 1))

    # 4-4) 엣지: 문항 없음
    out4 = tmp / "empty.hwpx"
    generate({"subject": "공통", "questions": []}, out4)
    data4 = read_section(out4)
    check("엣지:문항0 VALID", _validate(out4))
    check("엣지:문항0 종료표시만", "- 끝. 수고하셨습니다. -" in texts_of(data4))
    check("엣지:문항0 본문≤2문단", len(top_paras(data4)) - 1 <= 2)

    # 4-5) 엣지: 선택지 10개 + jimun+code 동시 + 배점 3.0 + continuation opt-in
    spec5 = {"year": "2025", "grade": "1", "semester": "1", "round": "2",
             "subject": "정보", "date": "2025. 7. 9.", "total_pages": 3, "questions": [
                 {"type": "choice", "stem": "10지선다?", "points": 3.0,
                  "jimun": "지문 박스", "code": ["x = 1", "y = 2"],
                  "choices": list("abcdefghij"), "continuation": "다음 장에 계속"}]}
    out5 = tmp / "edge.hwpx"
    generate(spec5, out5)
    d5 = _assert_doc("엣지:10지+지문+코드", out5,
                     must_have=["① a", "⑩ j", "지문 박스", "x = 1", "(3점)",
                                "-다음 장에 계속"],
                     counts=(1, 0, 0))
    # jimun+code 둘 다 박스(테이블)인지
    check("엣지:지문+코드 박스 2개", d5.count("<hp:tbl ") >= 3)  # 머리말1+저작권1+지문1+코드1


# ════════════════════════════════════════════════════════════
# 5. 프레임 바이트 보존 — 생성 프레임 == 양식 프레임 + 치환값
# ════════════════════════════════════════════════════════════
def test_frame_preservation(tmp):
    spec = {"year": "2025", "grade": "3", "semester": "2", "round": "1",
            "subject": "물리학", "date": "2025. 10. 1.", "examiner": "김출제",
            "total_pages": 6, "questions": [
                {"type": "choice", "stem": "q", "points": 2.0, "choices": ["a", "b"]}]}
    out = tmp / "frame.hwpx"
    generate(spec, out)

    form_head, _ = E.split_after_frame(read_section(FORM))
    reps = E.header_replacements(year="2025", grade="3", semester="2", exam_round="1",
                                 subject="물리학", date="2025. 10. 1.",
                                 counts=(1, 0, 0), total_pages=6)
    expected = form_head
    for o, n in reps.items():
        expected = expected.replace(o, n)
    expected, _ = E.set_examiner(expected, "김출제")

    gen_head, _ = E.split_after_frame(read_section(out))
    check("preserve:프레임=양식+치환(바이트 동일)", gen_head == expected,
          f"len gen={len(gen_head)} exp={len(expected)}")


# ════════════════════════════════════════════════════════════
# 6. 라운드트립 — 스킬 내장 리더(zipfile 기반, 외부 의존성 없음)로 재독
# ════════════════════════════════════════════════════════════
def test_roundtrip(tmp):
    from clone_form import extract_texts
    spec = {"year": "2025", "grade": "1", "semester": "1", "round": "1",
            "subject": "정보", "date": "2025. 7. 9.", "total_pages": 2, "questions": [
                {"type": "choice", "stem": "고유질문문구ABC?", "points": 3.0,
                 "choices": ["선택지XYZ", "b"]}]}
    out = tmp / "rt.hwpx"
    generate(spec, out)
    texts = extract_texts(str(out))
    check("roundtrip:extract_texts 성공", len(texts) > 0)
    check("roundtrip:질문문구 추출", any("고유질문문구ABC" in t for t in texts))
    check("roundtrip:선택지 추출", any("선택지XYZ" in t for t in texts))


# ════════════════════════════════════════════════════════════
# 7. 레이아웃 기능 — 분리방지(keep) / 2칸 들여쓰기 / TOTAL_PAGE
# ════════════════════════════════════════════════════════════
def test_layout_features(tmp):
    spec = {"year": "2025", "grade": "1", "semester": "1", "round": "1",
            "subject": "정보", "date": "2025. 7. 9.", "questions": [
                {"type": "choice", "stem": "질문?", "points": 3.0,
                 "jimun": "지문", "choices": ["가", "나", "다", "라", "마"]},
                {"type": "short", "stem": "단답?", "points": 3.0, "jimun": "주관식지문"}]}
    out = tmp / "layout.hwpx"
    generate(spec, out)
    sec = read_section(out)
    hdr = etree.fromstring(zipfile.ZipFile(str(out)).read("Contents/header.xml"))
    HH = "{http://www.hancom.co.kr/hwpml/2011/head}"
    HC = "{http://www.hancom.co.kr/hwpml/2011/core}"

    # 꼬리말 전체 페이지 자동 필드
    check("layout:꼬리말 TOTAL_PAGE 자동", 'numType="TOTAL_PAGE"' in sec)

    # keep paraPr 41/42 의 keepWithNext+keepLines=1
    def keep_ok(pid):
        pp = next((x for x in hdr.iter(HH + "paraPr") if x.get("id") == pid), None)
        bs = pp.find(HH + "breakSetting") if pp is not None else None
        return bs is not None and bs.get("keepWithNext") == "1" and bs.get("keepLines") == "1"
    check("layout:paraPr41(스템) keep", keep_ok("41"))
    check("layout:paraPr42(지문/선택지) keep", keep_ok("42"))

    # 본문 문단 keep 스타일 + 들여쓰기 = 띄어쓰기 2개(margin 아님)
    paras = top_paras(sec)
    def txt_raw(p): return "".join(t.text or "" for t in p.iter(HP + "t"))
    stem = next((p for p in paras if txt_raw(p).strip().startswith("1.")), None)
    choice = next((p for p in paras if txt_raw(p).strip().startswith("①")), None)
    jimun = next((p for p in paras
                  if p.find(".//" + HP + "tbl") is not None and "지문" in txt_raw(p)), None)
    check("layout:스템 paraPr=41(keep)", stem is not None and stem.get("paraPrIDRef") == "41")
    check("layout:선택지 paraPr=42(keep)", choice is not None and choice.get("paraPrIDRef") == "42")
    check("layout:선택지 앞 공백 2칸", choice is not None and txt_raw(choice).startswith("  ①"))
    check("layout:지문 상자 앞 공백 2칸", jimun is not None and txt_raw(jimun).startswith("  "))
    # 주관식(단답형) 지문은 들여쓰기 미적용
    sa_jimun = next((p for p in paras if p.find(".//" + HP + "tbl") is not None
                     and "주관식지문" in txt_raw(p)), None)
    check("layout:주관식 지문 들여쓰기 없음",
          sa_jimun is not None and not txt_raw(sa_jimun).startswith("  "))
    # margin 들여쓰기는 사용 안 함
    pp40 = next(x for x in hdr.iter(HH + "paraPr") if x.get("id") == "40")
    case = pp40.find(".//" + HP + "case")
    left = case.find(HH + "margin").find(HC + "left").get("value") if case is not None else "?"
    check("layout:margin 들여쓰기 미사용(left=0)", left == "0", f"left={left}")


# ════════════════════════════════════════════════════════════
def main():
    verbose = "-v" in sys.argv
    if not FORM.is_file():
        print(f"FATAL: 빈 양식 없음 {FORM}")
        sys.exit(2)

    test_unit_builders()
    test_unit_header()
    test_unit_frame()
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        test_integration(tmp)
        test_frame_preservation(tmp)
        test_roundtrip(tmp)
        test_layout_features(tmp)

    passed = sum(1 for _, ok, _ in _results if ok)
    failed = [(n, d) for n, ok, d in _results if not ok]
    print("=" * 64)
    print(f"  시험지 생성(Workflow I) 테스트: {passed}/{len(_results)} 통과")
    print("=" * 64)
    if verbose or failed:
        for name, ok, detail in _results:
            mark = "✓" if ok else "✗"
            if not ok or verbose:
                print(f"  {mark} {name}" + (f"  → {detail}" if detail and not ok else ""))
    if failed:
        print(f"\n  ✗ 실패 {len(failed)}개")
        sys.exit(1)
    print("\n  ✅ 전부 통과")
    sys.exit(0)


if __name__ == "__main__":
    main()
