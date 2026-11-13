# 수업 자료 라이선스 — CC BY-NC-SA 4.0

이 저장소는 **코드와 수업 자료에 서로 다른 라이선스**를 쓴다.

| 대상 | 라이선스 | 파일 |
|---|---|---|
| 코드 | SPACEKIJUN 교육용 비상업 1.0 (학교 안 활용 자유 · 상용 서비스 제작 제한) | [`LICENSE`](LICENSE) |
| **수업 자료** | **CC BY-NC-SA 4.0** | 이 문서 |
| 외부에서 가져온 것 | 각자의 라이선스 | [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md) |

## 적용 범위

**CC BY-NC-SA 4.0이 적용되는 것** — 이 저장소에서 만든 수업 콘텐츠

- `data/` 아래의 슬라이드 본문·발표자 노트·활동지·`quiz.json` 문항과 선택지
- 이 저장소에서 생성한 이미지·SVG·영상
  (`assets/svg/`, `assets/sprites/`, `data/**/media/`, `assets/manifest.json`에서
  `origin: "generated"`·`"notebooklm"`·`"openmontage"`로 기록된 항목)
- 수업 설계 문서(`plan.md` 등)

**적용되지 않는 것**

- **코드** — `src/`, `scripts/`, `test/`, `live/`, `supabase/`, 루트 설정 파일은 SPACEKIJUN 교육용 비상업 1.0(`LICENSE`).
  단 `src/deck/`·`src/components/`·`src/styles/base.css`는 bolt-slides에서 온 코드이며
  그쪽 MIT 고지가 함께 간다(THIRD-PARTY-NOTICES.md §1).
- **외부에서 가져온 자료** — 위키미디어 사진, 서비스 로고, 벤더 라이브러리 등은 원
  저작자의 라이선스를 그대로 따른다. 이쪽에서 CC BY-NC-SA로 바꿀 권한이 없다.
  출처는 `assets/manifest.json`의 `license` 필드에 있다.
- **`.claude/` 저작 도구 문서** — 씬 문법 문서 상당수가 외부 프로젝트(newVideoGen)에서
  이식된 것이라 권리 관계가 아직 확정되지 않았다(THIRD-PARTY-NOTICES.md §2).

## 이용 조건 세 가지

전문: https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode.ko
요약: https://creativecommons.org/licenses/by-nc-sa/4.0/deed.ko

- **BY(저작자 표시)** — 출처를 밝힌다. 고친 경우 고쳤다는 사실도 밝힌다.
- **NC(비영리)** — 수업·연수·공유는 자유롭게. 유료 강의 상품, 교재 판매, 사교육 자료처럼
  영리 목적으로는 쓸 수 없다.
- **SA(동일조건변경허락)** — 고쳐서 다시 배포한다면 같은 CC BY-NC-SA 4.0으로 공개한다.

## 출처 표기 예시

```
샘플고등학교 수업 자료 허브 (chanisma), CC BY-NC-SA 4.0
https://github.com/chanisma/presentation-open
```

슬라이드 안에서는 마지막 장이나 각주에 한 줄이면 충분하다. 고쳐서 쓴 경우
"○○ 수업을 우리 학교 상황에 맞게 고침"처럼 변경 사실을 덧붙인다.

## 외부 사진이 섞인 덱은 어떻게 되나

수업 덱은 여러 저작물을 모아 놓은 **수집물**이다. 덱 전체(구성·본문·직접 만든 그림)는
CC BY-NC-SA 4.0이지만, 그 안에 넣은 위키미디어 사진 같은 외부 자료는 **원래 라이선스를
그대로 유지한다.** 그래서 실무에서 지킬 것은 하나다 — **사진을 넣을 때 그 사진의 출처를
같이 싣는다.** CC BY·CC BY-SA 사진은 저작자 표시가 의무이기 때문이다.

## 다른 선생님이 쓰실 때

수업에 쓰고, 학교 사정에 맞게 고치고, 동료와 나누는 것은 모두 환영이다. 위 세 조건만
지켜 주시면 된다. 영리 목적으로 쓰고 싶다면 저장소 소유자에게 문의할 것.
