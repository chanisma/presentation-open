#!/usr/bin/env python3
"""
Presentation Builder - 대화형 인터뷰 스크립트

Claude Code의 Bash 도구에서 단계별로 호출하여 사용합니다.
각 단계는 JSON으로 질문/선택지를 반환하고, 답변을 누적하여 최종 설정을 생성합니다.

사용법:
  python interview.py <step> [--answers '<json>']  # 특정 단계 질문 가져오기
  python interview.py summary --answers '<json>'    # 최종 설정 요약
  python interview.py validate --answers '<json>'   # 설정 유효성 검증

예시:
  python interview.py 1
  python interview.py 2 --answers '{"subject":"인공지능","title":"피지컬컴퓨팅 기초"}'
  python interview.py summary --answers '{"subject":"...","title":"...","audience":"중학생",...}'
"""

import json
import sys
import argparse

# ──────────────────────────────────────────────
# 질문 정의
# ──────────────────────────────────────────────

STEPS = {
    1: {
        "id": "subject_title",
        "question": "[질문 1/5] 📌 과목명과 수업 제목",
        "prompt": "과목명과 수업 제목을 알려주세요.",
        "example": '과목: "프로그래밍" / 제목: "2026 프로그래밍 수업 오리엔테이션"',
        "type": "free_text",
        "fields": ["subject", "title"],
    },
    2: {
        "id": "audience",
        "question": "[질문 2/5] 👥 발표 대상",
        "prompt": "발표 대상은 누구인가요?",
        "type": "select",
        "options": [
            {"key": "1", "label": "초등학생 (1~3학년)", "value": "elementary_lower"},
            {"key": "2", "label": "초등학생 (4~6학년)", "value": "elementary_upper"},
            {"key": "3", "label": "중학생", "value": "middle_school"},
            {"key": "4", "label": "고등학생", "value": "high_school"},
            {"key": "5", "label": "학부모", "value": "parents"},
            {"key": "6", "label": "교사/교직원", "value": "teachers"},
            {"key": "7", "label": "기타 (직접 입력)", "value": "custom"},
        ],
        "fields": ["audience"],
        "extra_prompt": "🏫 학교/기관명도 있으면 함께 알려주세요. (선택사항)",
        "extra_fields": ["school_name"],
    },
    3: {
        "id": "content_mode",
        "question": "[질문 3/5] 📝 내용 구성 방식",
        "prompt": "내용을 어떻게 구성할까요?",
        "type": "select",
        "options": [
            {"key": "1", "label": "직접 제공 — 내용을 붙여넣기", "value": "manual"},
            {"key": "2", "label": "자동 구성 — 주제만으로 제가 알아서 생성", "value": "auto"},
        ],
        "fields": ["content_mode"],
        "follow_up": {
            "manual": "내용을 붙여넣어 주세요. (텍스트, 개조식, 자유 형식 모두 가능)",
        },
    },
    4: {
        "id": "image_mode",
        "question": "[질문 4/5] 🖼️ 이미지 옵션",
        "prompt": "이미지는 어떻게 할까요?",
        "type": "select",
        "options": [
            {"key": "1", "label": "🔍 자동 검색 — 웹에서 이미지를 자동 검색하여 삽입 (시간 소요)", "value": "web_search"},
            {"key": "2", "label": "✏️ 사용자 설명 — 키워드나 URL로 직접 지정", "value": "user_provided"},
            {"key": "3", "label": "🚫 미사용 — 이모지와 CSS 컴포넌트만 사용 (가장 빠름, 권장)", "value": "none"},
        ],
        "fields": ["image_mode"],
    },
    5: {
        "id": "reference_materials",
        "question": "[질문 5/5] 📎 참고 자료",
        "prompt": '참고할 자료가 있나요? (없으면 "없음"이라고 답해주세요)',
        "type": "free_text",
        "supported_formats": "PDF, PPTX, 한글(HWPX), 이미지, CSV/Excel, 구글 문서 URL",
        "fields": ["references"],
    },
}

TOTAL_STEPS = len(STEPS)

# ──────────────────────────────────────────────
# 대상별 기본 추천 설정
# ──────────────────────────────────────────────

AUDIENCE_DEFAULTS = {
    "elementary_lower": {
        "label": "초등학생 (1~3학년)",
        "recommended_style": "Soft Pink Card UI",
        "recommended_slides": "8~10장",
        "font_size": "30px+",
        "tone": "쉬운 한글, 구어체, ~해요",
        "template": "수업자료용",
    },
    "elementary_upper": {
        "label": "초등학생 (4~6학년)",
        "recommended_style": "Glassmorphism",
        "recommended_slides": "8~12장",
        "font_size": "28px+",
        "tone": "기본 어휘, ~합니다",
        "template": "수업자료용",
    },
    "middle_school": {
        "label": "중학생",
        "recommended_style": "Glassmorphism",
        "recommended_slides": "10~12장",
        "font_size": "24px+",
        "tone": "일반 어휘, 간결한 문어체",
        "template": "오리엔테이션용",
    },
    "high_school": {
        "label": "고등학생",
        "recommended_style": "Bento Grid",
        "recommended_slides": "10~14장",
        "font_size": "22px+",
        "tone": "전문 어휘 허용, 논리적 문체",
        "template": "수업자료용",
    },
    "parents": {
        "label": "학부모",
        "recommended_style": "Soft Pink Card UI",
        "recommended_slides": "8~10장",
        "font_size": "22px+",
        "tone": "정중한 일상 어휘, ~드립니다",
        "template": "학부모 안내용",
    },
    "teachers": {
        "label": "교사/교직원",
        "recommended_style": "Swiss International",
        "recommended_slides": "10~14장",
        "font_size": "20px+",
        "tone": "교육 전문 용어, 간결한 업무 문체",
        "template": "교사 연수용",
    },
    "custom": {
        "label": "기타",
        "recommended_style": "Glassmorphism",
        "recommended_slides": "8~12장",
        "font_size": "22px+",
        "tone": "일반 발표 문체",
        "template": "수업자료용",
    },
}

IMAGE_MODE_LABELS = {
    "web_search": "🔍 자동 검색 (웹 이미지)",
    "user_provided": "✏️ 사용자 지정",
    "none": "🚫 미사용 (이모지 + CSS)",
}

CONTENT_MODE_LABELS = {
    "manual": "📝 직접 제공",
    "auto": "🤖 자동 구성",
}


# ──────────────────────────────────────────────
# 핵심 함수
# ──────────────────────────────────────────────

def get_step(step_num: int, answers: dict) -> dict:
    """특정 단계의 질문 정보를 JSON으로 반환"""
    if step_num < 1 or step_num > TOTAL_STEPS:
        return {"error": f"유효하지 않은 단계: {step_num}. (1~{TOTAL_STEPS})"}

    step = STEPS[step_num]
    result = {
        "step": step_num,
        "total_steps": TOTAL_STEPS,
        "id": step["id"],
        "question": step["question"],
        "prompt": step["prompt"],
        "type": step["type"],
    }

    if step["type"] == "select":
        result["options"] = step["options"]

    if "example" in step:
        result["example"] = step["example"]

    if "extra_prompt" in step:
        result["extra_prompt"] = step["extra_prompt"]

    if "supported_formats" in step:
        result["supported_formats"] = step["supported_formats"]

    if "follow_up" in step:
        result["follow_up"] = step["follow_up"]

    result["collected_so_far"] = answers
    return result


def validate_answer(step_num: int, answer: str, answers: dict) -> dict:
    """답변 유효성 검증"""
    step = STEPS.get(step_num)
    if not step:
        return {"valid": False, "error": "유효하지 않은 단계"}

    if step["type"] == "select":
        valid_keys = [opt["key"] for opt in step["options"]]
        if answer not in valid_keys:
            return {
                "valid": False,
                "error": f"유효하지 않은 선택: {answer}. 가능한 값: {', '.join(valid_keys)}",
            }
        selected = next(opt for opt in step["options"] if opt["key"] == answer)
        return {"valid": True, "value": selected["value"], "label": selected["label"]}

    # free_text
    if not answer.strip():
        return {"valid": False, "error": "빈 입력입니다."}

    return {"valid": True, "value": answer.strip()}


def generate_summary(answers: dict) -> dict:
    """수집된 답변으로 최종 설정 요약 생성"""
    audience_key = answers.get("audience", "custom")
    defaults = AUDIENCE_DEFAULTS.get(audience_key, AUDIENCE_DEFAULTS["custom"])

    summary = {
        "설정_요약": {
            "📌 과목": answers.get("subject", "미정"),
            "📌 제목": answers.get("title", "미정"),
            "👥 대상": defaults["label"],
            "🏫 기관": answers.get("school_name", "미지정"),
            "📝 내용": CONTENT_MODE_LABELS.get(answers.get("content_mode", "auto"), "자동 구성"),
            "🖼️ 이미지": IMAGE_MODE_LABELS.get(answers.get("image_mode", "none"), "미사용"),
            "📎 참고자료": answers.get("references", "없음"),
        },
        "자동_추천": {
            "디자인_스타일": defaults["recommended_style"],
            "슬라이드_수": defaults["recommended_slides"],
            "폰트_크기": defaults["font_size"],
            "문체": defaults["tone"],
            "템플릿": defaults["template"],
        },
        "answers_raw": answers,
    }
    return summary


def generate_config(answers: dict) -> dict:
    """최종 생성 설정 (스킬에서 사용할 구조화된 config)"""
    audience_key = answers.get("audience", "custom")
    defaults = AUDIENCE_DEFAULTS.get(audience_key, AUDIENCE_DEFAULTS["custom"])

    config = {
        "subject": answers.get("subject", ""),
        "title": answers.get("title", ""),
        "audience": audience_key,
        "audience_label": defaults["label"],
        "school_name": answers.get("school_name", ""),
        "content_mode": answers.get("content_mode", "auto"),
        "image_mode": answers.get("image_mode", "none"),
        "references": answers.get("references", "없음"),
        "style": defaults["recommended_style"],
        "slides_count": defaults["recommended_slides"],
        "font_size_min": defaults["font_size"],
        "tone": defaults["tone"],
        "template": defaults["template"],
        "color_theme": "blue",
        "font": "noto-sans-kr",
        "card_style": "browser",
    }
    return config


# ──────────────────────────────────────────────
# CLI 엔트리포인트
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Presentation Builder 대화형 인터뷰")
    parser.add_argument("action", help="단계 번호(1-5), 'summary', 'config', 'validate'")
    parser.add_argument("--answers", default="{}", help="누적 답변 JSON")
    parser.add_argument("--step", type=int, help="validate 시 단계 번호")
    parser.add_argument("--answer", default="", help="validate 시 답변 값")

    args = parser.parse_args()

    try:
        answers = json.loads(args.answers)
    except json.JSONDecodeError:
        print(json.dumps({"error": "잘못된 JSON 형식"}, ensure_ascii=False, indent=2))
        sys.exit(1)

    if args.action == "summary":
        result = generate_summary(answers)
    elif args.action == "config":
        result = generate_config(answers)
    elif args.action == "validate":
        step_num = args.step or 1
        result = validate_answer(step_num, args.answer, answers)
    elif args.action.isdigit():
        step_num = int(args.action)
        result = get_step(step_num, answers)
    else:
        result = {"error": f"알 수 없는 action: {args.action}", "usage": "python interview.py <1-5|summary|config|validate>"}

    output = json.dumps(result, ensure_ascii=False, indent=2)
    sys.stdout.buffer.write(output.encode("utf-8"))
    sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    main()
