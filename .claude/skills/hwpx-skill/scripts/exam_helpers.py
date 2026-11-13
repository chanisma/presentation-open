#!/usr/bin/env python3
"""
시험지(정기고사) 양식 생성 헬퍼 — 샘플고등학교 "출제 원안 양식" 기반.

assets/exam-form.hwpx (빈 양식)을 복제한 뒤, 프레임(첫 문단 = secPr·머리말 제목표·
꼬리말 페이지번호·저작권 박스)은 그대로 보존하고 본문 문항만 교체하는 방식을 지원한다.

핵심 원칙 (hwpx_helpers.py와 동일한 문자열 기반 빌더):
  * 모든 빌더는 검증된 스타일 ID(charPr/paraPr/borderFill)만 사용한다.
  * 프레임은 바이트 단위로 보존하고(splice_body) 재직렬화하지 않는다.
  * 문항 외 불필요한 내용을 추가하지 않는다.

스타일 ID (assets/exam-form.hwpx 에서 추출, 변경 금지):
  charPr 35  = 11pt 함초롬바탕   (본문/문항/선택지)
  charPr 39  = 10pt 함초롬바탕   (종료 표시 보조 run)
  paraPr 21  = JUSTIFY           (문항 본문 줄)
  paraPr 23  = RIGHT             (연속/종료 표시)
  paraPr  2  = JUSTIFY           (빈 줄)
  borderFill 4 = SOLID 4면 박스   (보기/코드 박스)

사용법:
    import sys; sys.path.insert(0, "<skill>/scripts")
    from exam_helpers import *
    reset_id(base)                       # 프레임 최대 id 위에서 시작
    parts  = choice_question(1, "...", 3.1, jimun="...", choices=[...])
    parts += end_marker()
    splice_body("exam-form.hwpx", "out.hwpx", parts, examiner="홍길동")
"""

import os
import re
import zipfile

# --- 검증된 스타일 ID (exam-form.hwpx 전용) ---
CHAR_BODY = "35"    # 11pt 함초롬바탕 (본문)
CHAR_END = "39"     # 10pt 함초롬바탕 (종료 표시 보조)
PARA_BODY = "21"    # JUSTIFY (기본)
PARA_INDENT = "40"  # JUSTIFY + 좌측 들여쓰기 2칸(1100) — 선택지/지문
# keepWithNext+keepLines 변형: 한 문항이 단/페이지 경계에서 분리되지 않도록
PARA_STEM = "41"    # 문항 스템 (PARA_BODY + keep)
PARA_INDENT_KEEP = "42"  # 선택지/지문 (PARA_INDENT + keep)
PARA_MARK = "23"    # RIGHT   (연속/종료 표시)
PARA_EMPTY = "2"    # JUSTIFY (빈 줄 — keep 체인을 끊는 분리 지점)
BF_BOX = "4"        # SOLID 4면 박스 (보기/코드)

CIRCLED = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮"

# --- ID 카운터 (프레임 id와 충돌하지 않도록 splice 전 reset_id로 시드) ---
_id_counter = 1_000_000


def reset_id(start):
    """본문 id 카운터를 프레임 최대 id 위로 시드한다."""
    global _id_counter
    _id_counter = int(start)


def next_id():
    global _id_counter
    _id_counter += 1
    return str(_id_counter)


def xml_escape(text):
    """XML 특수문자 이스케이프."""
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


# --- 기본 문단/런 빌더 ---
def _p(parapr, runs_xml):
    return (
        f'<hp:p id="{next_id()}" paraPrIDRef="{parapr}" styleIDRef="0" '
        f'pageBreak="0" columnBreak="0" merged="0">{runs_xml}</hp:p>'
    )


def _run(charpr, text=None):
    if text is None or text == "":
        return f'<hp:run charPrIDRef="{charpr}"><hp:t/></hp:run>'
    return f'<hp:run charPrIDRef="{charpr}"><hp:t>{xml_escape(text)}</hp:t></hp:run>'


def text_line(text, charpr=CHAR_BODY, parapr=PARA_BODY):
    """문항 본문 한 줄."""
    return _p(parapr, _run(charpr, text))


def empty_line(charpr=CHAR_BODY, parapr=PARA_EMPTY):
    """빈 줄."""
    return _p(parapr, _run(charpr))


# --- 보기/코드 박스 (1×1 SOLID 테이블, 단 안에서 inline 흐름) ---
def box(lines, charpr=CHAR_BODY, parapr=PARA_BODY, width=30000, bf=BF_BOX, indent=True):
    """지문(보기)·코드 박스. lines: 문자열 또는 문자열 리스트.

    실제 시험지의 보기 박스(1행 1열, 실선 테두리)를 재현한다.
    treatAsChar="1" 로 본문 단(column) 안에서 글자처럼 흐른다.
    """
    if isinstance(lines, str):
        lines = [lines]
    inner = "".join(_p(parapr, _run(charpr, ln)) for ln in lines)
    height = max(282, len(lines) * 1300 + 400)
    outer_parapr = PARA_INDENT_KEEP  # 들여쓰기 + 문항과 함께 유지(분리 방지)
    tbl_id = next_id()
    cell = (
        f'<hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="0" '
        f'borderFillIDRef="{bf}">'
        f'<hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" '
        f'linkListIDRef="0" linkListNextIDRef="0" textWidth="{width}" textHeight="0" '
        f'hasTextRef="0" hasNumRef="0">{inner}</hp:subList>'
        f'<hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="1" rowSpan="1"/>'
        f'<hp:cellSz width="{width}" height="{height}"/>'
        f'<hp:cellMargin left="283" right="283" top="141" bottom="141"/></hp:tc>'
    )
    return (
        f'<hp:p id="{next_id()}" paraPrIDRef="{outer_parapr}" styleIDRef="0" '
        f'pageBreak="0" columnBreak="0" merged="0">'
        f'<hp:run charPrIDRef="{CHAR_BODY}">'
        f'{"<hp:t>  </hp:t>" if indent else ""}'  # 선택형 지문/코드만 띄어쓰기 2개 들여쓰기
        f'<hp:tbl id="{tbl_id}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" '
        f'textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="0" '
        f'rowCnt="1" colCnt="1" cellSpacing="0" borderFillIDRef="{bf}" noAdjust="0">'
        f'<hp:sz width="{width}" widthRelTo="ABSOLUTE" height="{height}" heightRelTo="ABSOLUTE" protect="0"/>'
        f'<hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" '
        f'holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="CENTER" '
        f'vertOffset="0" horzOffset="0"/>'
        f'<hp:outMargin left="0" right="0" top="0" bottom="113"/>'
        f'<hp:inMargin left="0" right="0" top="0" bottom="0"/>'
        f'<hp:tr>{cell}</hp:tr></hp:tbl><hp:t/></hp:run></hp:p>'
    )


# --- 문항 빌더 ---
def _stem(label, stem, points):
    pt = f" ({_fmt_points(points)}점)" if points not in (None, "") else ""
    return text_line(f"{label} {stem}{pt}", parapr=PARA_STEM)


def _fmt_points(points):
    """배점 표기. 3.0 → '3', 3.1 → '3.1'."""
    f = float(points)
    return str(int(f)) if f == int(f) else (f"{f:g}")


def choice_question(num, stem, points=None, jimun=None, code=None, choices=None,
                    trailing_blank=1):
    """선택형 문항: '번호. 질문 (배점점)' + 보기 박스 + 선택지(① 개별 줄)."""
    parts = [_stem(f"{num}.", stem, points)]
    if jimun:
        parts.append(box(jimun))
    if code:
        parts.append(box(code))
    for i, ch in enumerate(choices or []):
        # 선택지 앞 들여쓰기 = 띄어쓰기 2개
        parts.append(text_line(f"  {CIRCLED[i]} {ch}", parapr=PARA_INDENT_KEEP))
    for _ in range(trailing_blank):
        parts.append(empty_line())
    return parts


def short_answer(num, stem, points=None, jimun=None, code=None,
                 answer_lines=1, trailing_blank=1):
    """단답형 문항: '[단답형 N] 질문' + 보기/코드 박스 + 답란."""
    parts = [_stem(f"[단답형 {num}]", stem, points)]
    if jimun:
        parts.append(box(jimun, indent=False))   # 주관식 지문은 들여쓰기 미적용
    if code:
        parts.append(box(code, indent=False))
    for _ in range(answer_lines):
        parts.append(empty_line())
    for _ in range(trailing_blank):
        parts.append(empty_line())
    return parts


def essay(num, stem, points=None, jimun=None, code=None,
          answer_lines=3, trailing_blank=1):
    """서술형 문항: '[서술형 N] 질문' + 보기/코드 박스 + 답란."""
    parts = [_stem(f"[서술형 {num}]", stem, points)]
    if jimun:
        parts.append(box(jimun, indent=False))   # 주관식 지문은 들여쓰기 미적용
    if code:
        parts.append(box(code, indent=False))
    for _ in range(answer_lines):
        parts.append(empty_line())
    for _ in range(trailing_blank):
        parts.append(empty_line())
    return parts


# --- 표시 마커 (문항 빌더처럼 list[str] 반환) ---
def instruction(text):
    """안내 문구 (예: '※ 단답형은 OMR카드 앞면에...')."""
    return [text_line(text)]


def continuation(text="뒷면에 계속"):
    """연속 표시 (오른쪽 정렬). 예: '-뒷면에 계속', '-다음 장에 계속'."""
    return [_p(PARA_MARK, _run(CHAR_BODY, f"-{text}"))]


def end_marker():
    """종료 표시: '- 끝. 수고하셨습니다. -' (오른쪽 정렬)."""
    return [_p(PARA_MARK, _run(CHAR_BODY, "- 끝. 수고하셨습니다. -"))]


# --- 머리말/저작권 박스 텍스트 치환 맵 (clone_form Phase 1 용) ---
TITLE_ANCHOR = "2026년  학년  학기  차 정기시험"
SUBJECT_ANCHOR = "과목명 "
DATE_ANCHOR = "(2026. . .)"
COUNTS_ANCHOR = "선택형 (  )문항, 　단답형 (  )문항, 서술형 (  )문항"
PAGES_ANCHOR = "5면 중 "


def header_replacements(title=None, subject=None, date=None, counts=None,
                        total_pages=None, year=None, grade=None, semester=None,
                        exam_round=None, exam_name="정기시험"):
    """머리말·저작권 박스 고정 라벨을 채우기 위한 치환 맵 (전체 문자열 치환).

    값은 XML에 직접 삽입되므로 이스케이프하여 반환한다.
    counts: (선택형, 단답형, 서술형) 개수 튜플.
    """
    reps = {}

    if title:
        new_title = title
    elif any(v is not None for v in (year, grade, semester, exam_round)):
        new_title = (
            f"{year or '2026'}년  {grade or ''}학년  "
            f"{semester or ''}학기  {exam_round or ''}차 {exam_name}"
        )
    else:
        new_title = None
    if new_title:
        reps[TITLE_ANCHOR] = xml_escape(new_title)

    if subject:
        reps[SUBJECT_ANCHOR] = xml_escape(f"{subject} ")
    if date:
        reps[DATE_ANCHOR] = xml_escape(f"({date})")
    if counts:
        a, b, c = counts
        # '단답형' 앞 불필요한 전각공백(U+3000) 제거 — 서술형과 동일하게 ", " 만 사용
        reps[COUNTS_ANCHOR] = xml_escape(
            f"선택형 ( {a} )문항, 단답형 ( {b} )문항, 서술형 ( {c} )문항"
        )
    # 총 면수(N면 중)는 꼬리말의 TOTAL_PAGE 자동 필드가 계산하므로 치환하지 않는다.
    # (total_pages 인자는 하위 호환을 위해 받되 무시한다.)
    return reps


# --- 프레임 경계 탐지 (첫 문단 = 프레임) ---
def split_after_frame(section_xml):
    """section0.xml 문자열을 (헤드+프레임문단, 본문+꼬리) 로 분리한다.

    첫 <hp:p>(secPr·머리말·꼬리말·저작권 박스를 모두 담은 프레임 문단)의
    닫는 태그까지를 헤드로 본다. 표 안의 중첩 <hp:p>를 고려하여 태그 깊이를
    추적한다. 프레임은 바이트 단위로 보존되므로 네임스페이스 손상이 없다.
    """
    start = section_xml.index("<hp:p ")
    depth = 0
    for m in re.finditer(r"<hp:p\b|</hp:p>", section_xml[start:]):
        if m.group() == "</hp:p>":
            depth -= 1
            if depth == 0:
                end = start + m.end()
                return section_xml[:end], section_xml[end:]
        else:
            depth += 1
    raise ValueError("프레임 문단(<hp:p>) 경계를 찾지 못했습니다.")


def max_frame_id(frame_xml):
    """프레임 내 가장 큰 정수 id 를 반환 (본문 id 시드용). 특수값 0x80000000 제외."""
    ids = [int(x) for x in re.findall(r'\bid="(\d+)"', frame_xml)]
    ids = [i for i in ids if i < 2147483648]
    return max(ids) if ids else 1_000_000


def set_examiner(frame_xml, name):
    """머리말 결재란 '출제자' 칸(빈 charPr 30 런)에 출제자 이름을 채운다.

    앵커가 정확히 1개일 때만 치환한다(안전). 없거나 모호하면 그대로 둔다.
    Returns: (수정된 frame_xml, 적용 여부)
    """
    anchor = '<hp:run charPrIDRef="30"/>'
    if frame_xml.count(anchor) == 1:
        filled = f'<hp:run charPrIDRef="30"><hp:t>{xml_escape(name)}</hp:t></hp:run>'
        return frame_xml.replace(anchor, filled), True
    return frame_xml, False


# --- 본문 교체 (핵심) ---
def splice_body(form_hwpx, out_hwpx, body_parts, replacements=None, examiner=None):
    """빈 양식을 복제하고 본문(첫 문단 이후)을 생성 문항으로 교체한다.

    Args:
        form_hwpx: 원본 빈 양식 (assets/exam-form.hwpx)
        out_hwpx: 출력 경로
        body_parts: 생성된 문단 XML 문자열 리스트
        replacements: 머리말/저작권 텍스트 치환 맵 (header_replacements 결과)
        examiner: 출제자 이름 (선택)

    Returns:
        dict 통계 {frame_max_id, body_paras, examiner_applied}
    """
    replacements = replacements or {}
    body_xml = "".join(body_parts)

    tmp = str(out_hwpx) + ".tmp"
    stats = {}
    with zipfile.ZipFile(form_hwpx, "r") as zin:
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename == "Contents/section0.xml":
                    sec = data.decode("utf-8")
                    head, tail = split_after_frame(sec)
                    # 머리말/저작권 텍스트 치환은 프레임(head)에만 적용
                    for old, new in replacements.items():
                        head = head.replace(old, new)
                    if examiner:
                        head, applied = set_examiner(head, examiner)
                        stats["examiner_applied"] = applied
                    stats["frame_max_id"] = max_frame_id(head)
                    # </hs:sec> 보존, 그 앞 본문은 교체
                    close = tail.rindex("</hs:sec>")
                    sec = head + body_xml + tail[close:]
                    data = sec.encode("utf-8")
                if item.filename == "mimetype":
                    zout.writestr(item, data, compress_type=zipfile.ZIP_STORED)
                else:
                    zout.writestr(item, data)
    os.replace(tmp, str(out_hwpx))
    stats["body_paras"] = body_xml.count("<hp:p ")
    return stats
