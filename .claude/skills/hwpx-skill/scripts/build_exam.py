#!/usr/bin/env python3
"""
시험지(정기고사) HWPX 생성기 — 샘플고등학교 출제 원안 양식.

assets/exam-form.hwpx(빈 양식)을 복제하여 머리말(시험명·과목·날짜·출제자·문항수·
총면수)을 채우고, JSON 스펙의 문항(선택형/단답형/서술형)으로 본문을 생성한다.
프레임(B4·2단·결재란·자동 페이지번호·저작권 박스)은 원본 그대로 보존된다.

파이프라인:
  복제+머리말 채움 → 본문 문항 splice → fix_namespaces → validate

사용법:
  python build_exam.py spec.json -o 시험지.hwpx
  python build_exam.py spec.json -o out.hwpx --no-validate

스펙(JSON) 예시는 references/exam-style.md 또는 --print-sample 참조.
"""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import exam_helpers as E  # noqa: E402

SCRIPT_DIR = Path(__file__).resolve().parent
SKILL_DIR = SCRIPT_DIR.parent
DEFAULT_FORM = SKILL_DIR / "assets" / "exam-form.hwpx"


def build_body(spec):
    """스펙의 questions → (문단 XML 리스트, (선택형, 단답형, 서술형) 개수).

    번호는 유형별로 자동 부여한다(문항에 'num'이 있으면 우선).
    'instruction'이 있으면 첫 서답형(단답형/서술형) 직전에 1회 삽입한다.
    """
    parts = []
    n_choice = n_short = n_essay = 0
    instr = spec.get("instruction")
    instr_done = False

    for q in spec.get("questions", []):
        qtype = q.get("type", "choice")
        if qtype in ("short", "essay") and instr and not instr_done:
            parts += E.instruction(instr)
            instr_done = True

        common = dict(
            stem=q["stem"], points=q.get("points"),
            jimun=q.get("jimun"), code=q.get("code"),
        )
        if qtype == "choice":
            n_choice += 1
            parts += E.choice_question(
                q.get("num", n_choice), choices=q.get("choices", []),
                trailing_blank=q.get("trailing_blank", 1), **common,
            )
        elif qtype == "short":
            n_short += 1
            parts += E.short_answer(
                q.get("num", n_short),
                answer_lines=q.get("answer_lines", 1), **common,
            )
        elif qtype == "essay":
            n_essay += 1
            parts += E.essay(
                q.get("num", n_essay),
                answer_lines=q.get("answer_lines", 3), **common,
            )
        else:
            raise ValueError(f"알 수 없는 문항 유형: {qtype}")

        # 페이지/단 경계용 연속 표시(선택). 예: {"after": true} 또는 문항에 'continuation'
        if q.get("continuation"):
            parts += E.continuation(q["continuation"])

    parts += E.end_marker()
    return parts, (n_choice, n_short, n_essay)


def generate(spec, output, form=DEFAULT_FORM, run_fix=True, run_validate=True):
    """스펙으로 시험지 HWPX를 생성한다."""
    form = Path(form)
    if not form.is_file():
        raise SystemExit(f"빈 양식을 찾을 수 없습니다: {form}")

    # 1) 프레임 최대 id 파악 → 본문 id 시드(충돌 방지)
    import zipfile
    with zipfile.ZipFile(form, "r") as z:
        sec = z.read("Contents/section0.xml").decode("utf-8")
    head, _ = E.split_after_frame(sec)
    E.reset_id(E.max_frame_id(head) + 100)

    # 2) 본문 생성
    body_parts, auto_counts = build_body(spec)
    counts = spec.get("counts") or list(auto_counts)

    # 3) 머리말/저작권 치환 맵
    reps = E.header_replacements(
        title=spec.get("title"),
        subject=spec.get("subject"),
        date=spec.get("date"),
        counts=counts,
        total_pages=spec.get("total_pages"),
        year=spec.get("year"), grade=spec.get("grade"),
        semester=spec.get("semester"), exam_round=spec.get("round"),
        exam_name=spec.get("exam_name", "정기시험"),
    )

    # 4) 복제 + 머리말 채움 + 본문 splice
    stats = E.splice_body(form, output, body_parts,
                          replacements=reps, examiner=spec.get("examiner"))

    # 5) 네임스페이스 후처리 (안전망)
    if run_fix:
        subprocess.run([sys.executable, str(SCRIPT_DIR / "fix_namespaces.py"),
                        str(output)], check=True)

    # 6) 검증
    if run_validate:
        r = subprocess.run([sys.executable, str(SCRIPT_DIR / "validate.py"),
                            str(output)])
        stats["valid"] = (r.returncode == 0)

    stats["counts"] = counts
    return stats


SAMPLE_SPEC = {
    "year": "2025", "grade": "1", "semester": "1", "round": "2",
    "exam_name": "정기시험",
    "subject": "정보", "date": "2025. 7. 9.", "examiner": "홍길동",
    "total_pages": 5,
    "instruction": "※ 단답형은 OMR카드 앞면에, 서술형은 뒷면에 검정 펜으로 작성하시오.",
    "questions": [
        {"type": "choice", "stem": "다음 설명에 가장 알맞은 용어를 고르면?",
         "points": 3.1,
         "jimun": "센서와 네트워크를 갖춘 사물들이 사용자 개입 없이 상호 연결되어 "
                  "데이터를 주고받으며 자율적으로 동작할 수 있는 기술이다.",
         "choices": ["스마트팜", "증강 현실", "사물 인터넷", "분산 저장 시스템", "디지털 공장"]},
        {"type": "choice", "stem": "다음 코드의 출력 결과는?", "points": 4.1,
         "code": ["a = 3", "b = 4", "print(a + b)"],
         "choices": ["12", "7", "34", "a + b", "에러 발생"]},
        {"type": "short", "stem": "빈칸에 들어갈 코드를 작성하시오.", "points": 3.3,
         "code": ["numbers = [10, 20, 30]", "total = 0", "for n in numbers:", "    ㉮"]},
        {"type": "essay", "stem": "다음 조건에 맞게 전체 코드를 작성하시오.", "points": 5.4,
         "jimun": "사용자로부터 정수를 입력받아 짝수인지 판별하는 프로그램을 작성하시오."},
    ],
}


def main():
    ap = argparse.ArgumentParser(description="시험지(정기고사) HWPX 생성기")
    ap.add_argument("spec", nargs="?", help="문항 스펙 JSON 경로")
    ap.add_argument("-o", "--output", help="출력 .hwpx 경로")
    ap.add_argument("--form", default=str(DEFAULT_FORM), help="빈 양식 경로")
    ap.add_argument("--no-fix", action="store_true", help="fix_namespaces 생략")
    ap.add_argument("--no-validate", action="store_true", help="validate 생략")
    ap.add_argument("--print-sample", action="store_true", help="샘플 스펙 출력 후 종료")
    args = ap.parse_args()

    if args.print_sample:
        print(json.dumps(SAMPLE_SPEC, ensure_ascii=False, indent=2))
        return
    if not args.spec or not args.output:
        ap.error("spec 과 -o/--output 이 필요합니다 (또는 --print-sample).")

    with open(args.spec, "r", encoding="utf-8") as f:
        spec = json.load(f)

    stats = generate(spec, args.output, form=args.form,
                     run_fix=not args.no_fix, run_validate=not args.no_validate)
    print(f"생성 완료: {args.output}")
    print(f"  문항수(선택/단답/서술): {stats['counts']}")
    print(f"  본문 문단: {stats['body_paras']}개")
    if "examiner_applied" in stats:
        print(f"  출제자 채움: {stats['examiner_applied']}")
    if "valid" in stats:
        print(f"  검증: {'VALID' if stats['valid'] else 'INVALID'}")


if __name__ == "__main__":
    main()
