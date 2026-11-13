# pyrun — 교육용 파이썬 실행기 부품

덱과 활동지가 **같은 부품 하나**를 쓴다. 학생 브라우저 안에서 Pyodide(파이썬 3.12)를
Web Worker로 돌린다. 처음 한 번 jsdelivr에서 약 10MB를 내려받고, 그 뒤는 브라우저 캐시를 쓴다.

| 파일 | 역할 |
|---|---|
| `engine.js` | 워커 하나를 페이지 전체가 같이 쓴다. 출력·오류(종류·메시지·줄)·변수·줄마다 상태(trace)·코드 구조 요약(info)을 돌려준다. 시간 제한(기본 8초)을 넘기면 워커를 끊고 다음 실행 때 다시 띄운다 |
| `explain.js` | 오류 한국어 풀이 사전. 원문은 그대로 두고 아래에 한 줄 덧붙인다. 새 수업에서 자주 나오는 오류는 `RULES`에 더한다 |
| `py-runner.js` | 웹 컴포넌트 `<py-runner>` (Shadow DOM, CSS 내장) |
| `demo.html` | 견본 페이지 (`/assets/pyrun/demo.html`) |
| `src/pyrun/PyRunner.tsx` | 덱용 React 감싸개 (서빙 URL에서 동적 import) |

`live/runtime/code-runner.js`(라이브 code 문항)와 같은 방식이지만 그 파일은 건드리지 않았다.

## 정적 HTML에서

```html
<script type="module" src="../../../../assets/pyrun/py-runner.js"></script>
<py-runner vars step persist="task2" style="height:360px">
  <script type="text/x-python">
name = "민지"
print(name)
  </script>
</py-runner>
<script type="module">
  const r = document.querySelector('py-runner');
  r.checks = [{ label: '오류 없이 실행', test: (res) => !res.error }];
  r.addEventListener('pyrun-run', (e) => console.log(e.detail));
</script>
```

## React 덱에서

```tsx
import PyRunner, { preloadPython } from '../../../../src/pyrun/PyRunner';
<PyRunner code={'hp = 100\nprint(hp)'} vars mode="step" font={26} style={{ height: 600 }} />
```

덱을 열 때 `preloadPython()`을 한 번 부르면 첫 실행기 장에 닿기 전에 엔진이 준비된다.
덱 썸네일(isStatic)에서는 감싸개가 `lazy`를 붙여 엔진을 내려받지 않는다.

## 속성

| 속성 | 뜻 |
|---|---|
| `vars` | 변수 상자 (이름표 → 값 카드, 문자열·숫자 색 구분) |
| `step` | [◀ 이전 줄] [다음 줄 ▶] 단추. `mode="step"`이면 [▶ 끝까지 실행]도 한 줄씩 보기로 동작 |
| `dots` | 들여쓰기 빈칸을 옅은 점으로 |
| `layout="stack"` | 편집 칸 위, 변수 상자·출력 아래 (좁은 화면·활동지) |
| `rows` | 편집 칸 최소 줄 수 |
| `readonly` · `lazy` · `label` | 편집 금지 · 엔진 미리 불러오지 않기 · 머리 띠 제목 |
| `mask="2-3"` | 그 줄을 흐리게 가린다. [가린 줄 보기] 단추가 생긴다 |
| `predict` | 출력 예측을 먼저 적어야 실행된다. 실행 뒤 예측과 결과를 나란히 비교 |
| `persist="key"` | 쓰던 코드를 localStorage `pyrun:key`에 임시 보관 (저장의 진실은 아니다) |
| `inputs='["2"]'` | 미리 넣은 입력(JSON 문자열 배열 또는 줄마다 하나). `input()`이 차례로 받는다. 프로퍼티 `.inputs`로도 설정 |
| `types` | 변수 상자에 자료형 이름(문자열 str · 정수형 int · 실수형 float)을 달고 정수·실수를 색으로 나눈다 |

CSS 변수: `--pyrun-font` `--pyrun-ui-font` `--pyrun-editor` `--pyrun-paper` `--pyrun-ink`
`--pyrun-primary` `--pyrun-tag` `--pyrun-str` `--pyrun-num` `--pyrun-float`.

## 입력 `input()` — 다시 실행 방식 (2026-11-12)

입력 기록이 떨어지면 출력 칸 끝에 입력 줄을 열고(머리에 「입력을 기다리는 중」), 값을 받으면 기록에
더해 **처음부터 다시 실행**한다. 출력은 덧붙이지 않고 교체하므로 이어서 실행된 것처럼 보인다.
출력 칸에는 안내 문구와 입력한 값(밑줄)이 터미널처럼 남는다.

- 코드를 고치거나 [▶ 실행]·[↺ 처음 코드로]를 누르면 입력 기록을 버린다
- 한 줄씩 보기는 입력을 먼저 다 받은 뒤(또는 `inputs`로 미리 넣은 값으로) 추적한다
- 시간 제한은 실행 한 번의 계산 시간에만 걸린다. 사용자가 입력하는 동안은 세지 않는다
- 입력 대기 신호는 `BaseException`을 바로 상속해 `except Exception`이 삼키지 못한다
- 결과 `status`: `completed` · `waiting_input` · `input_short`(시험 실행에서 입력 부족) · `error`
- 결과에는 `out`(터미널처럼 전부) 말고도 `prog`(프로그램 출력만)·`segs`(o 출력 · p 안내 문구 · e 입력 메아리)가
  있다. **자동 점검은 `prog`를 본다**
- 출력은 쓰는 순간 2만 자에서 자른다(`out_cut`)

**한계(이 방식의 성질)**: 실제로 멈췄다 이어 가는 것이 아니라 다시 실행한다. 무작위 수·시간·파일을 쓰거나
`try`/`finally`·맨 `except:`로 입력을 감싼 코드는 결과가 달라질 수 있다. 입력이 n개면 최대 n+1번 실행한다.
그런 수업이 오면 JSPI(Pyodide 0.27.7 이상, 크롬 137 이상) 방식으로 옮기는 것을 검토한다
(`data/2026-2/인공지능기초/파이썬-입력과-자료형/review/2026-11-12-실행기설계.md`).

## 이벤트와 자가 점검 API

- `pyrun-run` detail: `{code, output, prog, error, vars, info, checks, prediction, inputs, status}` — 실행이 **끝났을 때만** (입력 대기는 완료가 아니다)
- `pyrun-input` detail: `{prompt, inputs}` — 입력을 기다리기 시작할 때
  - `info`: `{prints, fprints(변수를 끼운 f-문자열 print), commaprints(인자 2개 이상), nameprints(print(변수) 꼴), defs:[{name, params}], calls:{이름: 코드에 적힌 호출 수}, assigns, ops:{'+': 수, '//': 수 …}, fstrings(변수를 끼운 f-문자열 수), assign_from:[{target, calls:[값 쪽에서 부른 함수], names}]}`
  - 변수 값 `{t, r}`의 숫자는 `t: 'num'`에 `n: 'int'|'float'`이 붙는다
- `checks` 규칙에 `inputs`를 주면 그 시험 입력으로 따로 실행한 결과를 `test(r, 화면결과)`에 넘긴다(입력 줄을 열지 않음). 점검 줄에 「시험 입력: …」이 함께 보인다
- `pyrun-change` detail: `{code}`
- `pyrun-step` detail: `{step, steps, line, vars, frames, output}` — 한 줄씩 보기에서 단계를 옮길 때
- `el.run()` `el.setCode(s)` `el.getCode()` `el.next()` `el.prev()` `el.reset()` `el.getState()` `el.sendInput(s)` `el.test(inputs, code?)`
- `window.__pyrun.list()` — 페이지의 모든 실행기

## 키

Ctrl+Enter 실행 · Tab 4칸 들여쓰기 · Shift+Tab 내어쓰기 · Enter는 들여쓰기 유지(쌍점 뒤면 4칸 더) ·
Esc 편집 칸에서 나가기. 부품 안에서 난 키 입력은 바깥(덱의 슬라이드 넘김)으로 새지 않는다.

## 아직 없는 것

그림 출력(거북이 그래픽), 라이브 `code` 문항과의 화면 통합, JSPI 입력.
