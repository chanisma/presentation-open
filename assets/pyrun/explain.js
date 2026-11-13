// assets/pyrun/explain.js — 파이썬 오류에 붙이는 한국어 풀이 사전
//
// 원문 오류는 지우지 않는다. 이 풀이는 원문 아래에 한 줄 덧붙이는 안내다.
// 사전에 없는 오류는 null을 돌려주고, 실행기는 원문만 보여 준다.
// 새 수업에서 자주 나오는 오류가 생기면 RULES에 한 줄씩 더한다.

const hasHangul = (s) => /[가-힣]/.test(s);

const RULES = [
  // NameError ────────────────────────────────────────────
  {
    type: 'NameError',
    test: /name '(.+)' is not defined/,
    say: (m, ctx) => {
      const name = m[1];
      const near = (ctx.names || []).find((n) => n !== name && n.toLowerCase() === name.toLowerCase());
      if (near) return `「${name}」 이름표를 찾지 못했어요. 위에서 만든 이름은 「${near}」입니다. 대문자와 소문자가 다르면 다른 이름이에요.`;
      if (hasHangul(name)) return `따옴표가 없으면 파이썬은 「${name}」 같은 글자를 변수 이름으로 읽어요. 그런 변수는 아직 없어요. 글자 값이라면 "${name}"처럼 따옴표로 감싸 주세요.`;
      if (name === 'Print' || name === 'PRINT') return '함수 이름은 대문자와 소문자를 구분해요. print는 모두 소문자로 써요.';
      return `「${name}」 이름표를 찾지 못했어요. 글자 값이면 따옴표를 쳤는지, 변수라면 위에서 먼저 만들었는지, 철자와 대소문자가 같은지 확인하세요.`;
    },
  },
  // SyntaxError ──────────────────────────────────────────
  { type: 'SyntaxError', test: /unterminated string literal/, say: () => '따옴표를 열고 닫지 않았어요. 연 따옴표와 같은 따옴표로 글자 값을 닫아 주세요.' },
  { type: 'SyntaxError', test: /unterminated triple-quoted string/, say: () => '따옴표 세 개로 연 글자 값을 닫지 않았어요.' },
  { type: 'SyntaxError', test: /'\(' was never closed/, say: () => '여는 괄호 ( 를 닫지 않았어요. 줄 끝에 ) 가 있는지 확인하세요.' },
  { type: 'SyntaxError', test: /'\[' was never closed/, say: () => '여는 대괄호 [ 를 닫지 않았어요.' },
  { type: 'SyntaxError', test: /unmatched '\)'/, say: () => '닫는 괄호 ) 가 여는 괄호보다 많아요.' },
  { type: 'SyntaxError', test: /invalid decimal literal/, say: () => '숫자 바로 뒤에 글자가 붙었어요. 변수 이름이 숫자로 시작하지 않는지 확인하세요.' },
  { type: 'SyntaxError', test: /cannot assign to expression/, say: () => '등호 왼쪽에는 이름 하나만 올 수 있어요. 이름에 - 같은 기호가 있으면 빼기로 읽혀요. 밑줄 _ 을 쓰세요.' },
  { type: 'SyntaxError', test: /cannot assign to literal/, say: () => '등호 왼쪽에 값이 왔어요. 이름 = 값 순서로 써야 해요.' },
  { type: 'SyntaxError', test: /Missing parentheses in call to 'print'/, say: () => 'print 뒤에는 괄호가 있어야 해요. print(...)처럼 써 주세요.' },
  { type: 'SyntaxError', test: /expected ':'/, say: () => 'def 줄 끝에 쌍점(:)이 있어야 해요.' },
  { type: 'SyntaxError', test: /Perhaps you forgot a comma/, say: () => '값 사이에 쉼표가 빠진 것 같아요. 여러 값을 나열할 때는 쉼표로 나눠요.' },
  { type: 'SyntaxError', test: /f-string/, say: () => 'f-문자열 안의 중괄호 { } 를 확인하세요. 여는 것과 닫는 것이 짝이 맞아야 해요.' },
  {
    type: 'SyntaxError',
    test: /invalid syntax/,
    say: (m, ctx) => {
      const line = ctx.lineText || '';
      const left = line.split('=')[0].trim();
      const KW = ['class', 'for', 'if', 'def', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'while', 'return', 'import', 'from', 'pass', 'break', 'else', 'elif', 'try', 'with', 'as', 'global', 'lambda', 'del', 'yield'];
      if (line.includes('=') && KW.includes(left)) return `「${left}」 같은 단어는 파이썬이 이미 쓰는 키워드라서 변수 이름으로 쓸 수 없어요.`;
      return '문법에 맞지 않는 곳이 있어요. 이 줄과 바로 윗줄의 따옴표·괄호·쉼표를 확인하세요.';
    },
  },
  // IndentationError ─────────────────────────────────────
  { type: 'IndentationError', test: /expected an indented block/, say: () => 'def 다음 줄은 앞을 띄어(보통 4칸) 써야 함수 안의 줄이 돼요.' },
  { type: 'IndentationError', test: /unexpected indent/, say: () => '띄어 쓸 필요가 없는 줄 앞에 빈칸이 있어요. 줄 앞 빈칸을 지워 보세요.' },
  { type: 'IndentationError', test: /unindent does not match/, say: () => '들여쓰기 칸 수가 위아래 줄과 맞지 않아요. 같은 묶음의 줄은 같은 칸만큼 띄어요.' },
  { type: 'TabError', test: /./, say: () => '탭과 빈칸이 섞여 있어요. 들여쓰기는 빈칸으로만 맞춰 주세요.' },
  // TypeError ────────────────────────────────────────────
  { type: 'TypeError', test: /can only concatenate str \(not "(int|float)"\) to str/, say: () => '문자열의 + 는 문자열끼리만 이을 수 있어요. 계산하려면 int()로 바꾸고, 문장에 끼우려면 쉼표나 f-문자열을 써 보세요. input()으로 받은 값은 숫자처럼 보여도 문자열이에요.' },
  { type: 'TypeError', test: /unsupported operand type\(s\) for \+: '(int|float)' and 'str'/, say: () => '숫자와 문자열은 + 로 더할 수 없어요. 따옴표로 감싼 숫자와 input()으로 받은 값은 문자열이에요.' },
  {
    type: 'TypeError',
    test: /unsupported operand type\(s\) for ([-*/%]+|\*\*|\/\/): '(str|int|float)' and '(str|int|float)'/,
    say: (m) => {
      const op = m[1];
      if (m[2] === 'str' || m[3] === 'str') return `문자열로는 ${op} 계산을 할 수 없어요. input()으로 받은 값이라면 int()나 float()로 바꾼 뒤 계산하세요.`;
      return `이 두 값으로는 ${op} 계산을 할 수 없어요.`;
    },
  },
  { type: 'TypeError', test: /can't multiply sequence by non-int of type '(str|float)'/, say: () => '문자열에는 정수만 곱할 수 있어요(반복). 두 값이 모두 문자열이라면 int()나 float()로 바꾼 뒤 곱하세요.' },
  { type: 'TypeError', test: /missing (\d+) required positional argument/, say: () => '함수를 부를 때 인자가 모자라요. 매개변수 수만큼 괄호 안에 값을 건네세요.' },
  { type: 'TypeError', test: /takes (\d+) positional arguments? but (\d+) (?:were|was) given/, say: (m) => `이 함수는 인자를 ${m[1]}개 받는데 ${m[2]}개를 건넸어요.` },
  { type: 'TypeError', test: /'(str|int|NoneType)' object is not callable/, say: (m) => `${m[1] === 'NoneType' ? '값이 없는 것' : '값'} 뒤에 괄호를 붙여 불렀어요. 함수 이름과 같은 이름의 변수를 만들지 않았는지 확인하세요.` },
  // ValueError ───────────────────────────────────────────
  {
    type: 'ValueError',
    test: /invalid literal for int\(\) with base 10: '(.*)'/,
    say: (m) => {
      const v = m[1];
      if (v === '') return '아무것도 입력하지 않은 빈 문자열은 int()로 바꿀 수 없어요. 값을 쓰고 Enter를 누르세요.';
      if (/^\s*[-+]?\d*\.\d+\s*$/.test(v)) return `문자열 "${v}"는 소수 부분이 있어서 int()로 바로 바꿀 수 없어요. 소수가 나올 수 있는 값은 float()로 바꾸세요.`;
      return `문자열 "${v}"는 정수 모양이 아니라서 int()로 바꿀 수 없어요. 숫자를 입력했는지 확인하세요.`;
    },
  },
  { type: 'ValueError', test: /could not convert string to float: '(.*)'/, say: (m) => `문자열 "${m[1]}"는 수 모양이 아니라서 float()로 바꿀 수 없어요. 숫자를 입력했는지 확인하세요.` },
  // 실행 환경
  { type: 'ZeroDivisionError', test: /./, say: () => '0으로 나눌 수는 없어요. 나누는 값이 0이 되지 않았는지 확인하세요.' },
  { type: 'EOFError', test: /./, say: () => '입력이 더 필요한데 받을 값이 없어요.' },
];

/**
 * @param {{type:string,msg:string,line:number|null}} err
 * @param {{names?:string[], lineText?:string}} ctx 사용자 변수 이름들과 오류 줄 원문
 * @returns {string|null}
 */
export function explain(err, ctx = {}) {
  if (!err) return null;
  for (const r of RULES) {
    if (r.type !== err.type) continue;
    const m = String(err.msg).match(r.test);
    if (m) return r.say(m, ctx);
  }
  return null;
}

/** 파이썬이 실제로 보여 주는 모양의 원문 한 줄 */
export function original(err) {
  if (!err) return '';
  return `${err.type}: ${err.msg}`;
}
