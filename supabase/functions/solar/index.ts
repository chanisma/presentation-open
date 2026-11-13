// ============================================================
// Edge Function 'solar' — 활동지 「글의 설계도 되찾기」 전용 Solar 대리 호출
//
//   이 함수가 존재하는 이유는 두 가지다.
//   ① Upstage API 키를 학생 브라우저에 내려보내지 않기 위해서다.
//   ② 1단계 생성에 쓰는 시스템 프롬프트가 곧 이 활동의 정답지이기 때문이다.
//      학생이 B 구역에서 찾아내야 할 규칙이 그 안에 다 적혀 있으므로,
//      정적 HTML에 두면 개발자 도구로 즉시 읽히고 활동이 무너진다.
//
//   동작 세 가지:
//     generate  주제 한 줄 → 시스템 프롬프트를 붙여 규칙이 있는 글을 만든다
//     reproduce 학생 프롬프트만으로 글을 만든다 (시스템 프롬프트 없음)
//     score     원문과 재현문을 루브릭으로 채점하고 항목별 근거를 낸다
//
//   reproduce에서 시스템 프롬프트를 빼는 것이 결정적이다. 이것을 붙이면
//   학생이 무엇을 쓰든 같은 형식이 나와 점수가 항상 높게 나온다.
//
//   시크릿: SOLAR_API_KEY (같은 프로젝트의 solar-proxy·solar-chat와 공용)
//   자동 주입: SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
//
//   모델 메모: 이 프로젝트의 solar-proxy가 2026-08-14에 `GET /v1/models`로
//   실측한 목록은 solar-pro4 / solar-pro3 두 가지이고, 가장 최근에 만든
//   solar-chat도 solar-pro3 계열을 쓴다. solar-pro2는 그 목록에 없다.
//   그래서 여기서도 solar-pro3을 기본으로 둔다. 모델을 바꾸려면 이 상수
//   한 줄만 고치면 된다.
//
//   응답 시간 메모: solar-proxy 주석에 따르면 reasoning_effort를 'medium'으로
//   두었을 때 응답이 126~151초까지 늘어 엣지 함수가 504로 잘린 적이 있다.
//   이 활동은 추출·재작성 과제라 추론 의존도가 낮으므로 'low'로 고정하고,
//   모델이 그 파라미터를 거부하면(400) 떼고 다시 보낸다.
// ============================================================

const SOLAR_URL = 'https://api.upstage.ai/v1/chat/completions';
const MODEL = 'solar-pro3';

// 학생 브라우저 1대당 하루 호출 상한. 정상 진행이면 생성 1회 + 재현 2회 +
// 채점 2회 = 5회이므로, 다시 하기와 오류 재시도를 감안해 넉넉히 잡았다.
const DAILY_LIMIT = 40;

// 요청을 받아 줄 출처. 우연한 남용을 막는 1차 방어일 뿐이며, 진짜 상한은
// solar_bump_usage가 센다.
const ALLOW_ORIGIN_RE =
  /^https?:\/\/(localhost(:\d+)?|127\.0\.0\.1(:\d+)?|[a-z0-9-]+\.netlify\.app|[a-z0-9-]+\.kijun\.[a-z.]+)$/i;

/* ── 1단계 생성 규칙 — 학생에게 보이면 안 되는 정답지 ────────────────
   학생은 주제만 정하고, 아래 일곱 규칙은 모른 채 시작한다. 이 규칙을
   글에서 되찾아 프롬프트로 옮기는 것이 오늘의 과제다.
   규칙은 모두 "눈으로 세어 확인할 수 있는 것"으로만 골랐다. 학생이
   확인할 수 없는 규칙은 분석 단계에서 추측으로 흐른다. */
const SYSTEM_PROMPT = `너는 고등학생용 짧은 논설문을 쓰는 필자다.
사용자가 주제를 주면 아래 규칙을 모두 지켜 글을 쓴다.

[출력]
- 완성된 글만 내놓는다. 제목을 붙이지 않고, 받은 주제를 다시 적지 않는다.
- 이 지시문에 쓰인 낱말을 글 안에 옮겨 적지 않는다. '첫째 문단', '반대 의견', '근거' 같은 말이 글에 나타나면 안 된다.
- 번호, 목록 기호, 굵은 글씨, 소제목을 쓰지 않는다.

[구성]
- 문단은 정확히 세 개다. 문단 사이에만 빈 줄을 두고, 한 문단 안에서는 줄을 바꾸지 않는다.
- 문단마다 문장을 정확히 세 개씩 쓴다. 네 문장을 쓰지 않는다.
- 1문단은 현상을 두 문장으로 소개한 뒤, 세 번째 문장에서 이 글이 지지하는 입장을 못박는다.
- 2문단은 그 입장을 받치는 까닭을 대고, 구체적인 숫자를 하나 넣는다.
- 3문단은 반대편 주장을 한 문장으로 소개하고, 한 문장으로 되받아친 뒤, 세 번째 문장을 물음표로 끝나는 질문으로 쓴다. 이 질문이 글 전체의 마지막 문장이다. 그 뒤에는 문장도 문단도 덧붙이지 않는다.
- 글 전체가 하나의 입장을 지지한다. 양쪽 다 옳다는 식으로 얼버무리지 않는다.

[문장]
- 모든 문장은 '-다'로 끝나는 한다체다. '-습니다'와 '-요'를 쓰지 않는다.
- 문단마다 두 문장은 30자 안팎으로 짧게 쓰고, 나머지 한 문장은 두 절을 이어 붙여 45자를 넘기도록 길게 쓴다. 짧은 문장과 긴 문장이 한 문단 안에 반드시 섞여야 한다.
- 문단마다 '그러나', '따라서', '게다가', '왜냐하면' 같은 이음말을 적어도 하나 쓴다.
- 물음표는 글 전체에서 마지막 문장 하나에만 쓴다. 다른 문장에 물음표를 붙이지 않는다.`;

/* ── 채점 루브릭 — 다섯 항목 20점씩 ──────────────────────────────
   내용 주제의 일치가 아니라 형식 복원에 배점을 몰았다. 주제는 학생이
   프롬프트에 당연히 적으므로 변별력이 없고, 이 활동이 기르려는 것은
   글의 규칙을 찾아 말로 옮기는 능력이기 때문이다.
   활동지 B 구역의 네 칸이 이 다섯 항목을 모두 덮는다
   (1번 칸이 elements, 2번 칸이 structure, 3번 칸이 style·length·ending). */
const RUBRIC = [
  { key: 'structure', label: '문단 구성', desc: '문단 수가 원문과 같은가. 각 문단이 맡은 역할이 원문과 같은가. 원문처럼 첫째 문단에서 지지하는 입장을 밝히고, 끝까지 그 입장을 지켰는가.' },
  { key: 'style', label: '문체', desc: '문장을 맺는 말투가 원문과 같은가. 원문에 없던 높임말이 섞이지 않았는가.' },
  { key: 'length', label: '문장 짜임', desc: '문장 길이의 짜임이 원문과 같은가. 원문처럼 짧은 문장과 긴 문장이 한 문단 안에 섞여 있는가. 글 전체의 분량이 원문과 비슷한가. 절대적인 글자 수 기준은 없으며 오직 원문과 견준다.' },
  { key: 'elements', label: '내용 요소', desc: '원문에 있던 재료가 재현문에도 들어 있는가. 구체적인 숫자, 반대 의견 한 문장, 그리고 문장 사이 관계를 드러내는 말이 그 재료다. 숫자나 반론의 내용까지 같을 필요는 없고 들어 있기만 하면 된다.' },
  { key: 'ending', label: '마무리 형태', desc: '마지막 문장이 원문처럼 물음표로 끝나는 질문인가. 원문처럼 제목과 목록 기호가 없는가. 질문의 문구가 원문과 같은지는 보지 않는다.' },
];

const SCORE_SYSTEM = `너는 글의 형식을 비교하는 채점자다.
원문과 재현문을 받아 다섯 항목을 각각 0점에서 20점으로 채점한다.
내용 주제가 같은지가 아니라 형식이 얼마나 같은지를 본다.
어떤 항목이든 판단 기준은 오직 원문이다. 미리 정해 둔 글자 수나 문구를 기준으로 삼지 않는다.
표현이나 소재가 원문과 다르다는 이유로 감점하지 않는다.

점수는 아래 다섯 단계 중 하나로만 준다. 부분 점수를 반드시 활용한다.
20점 — 재현문이 그 항목을 완전히 지켰다.
15점 — 대체로 지켰고 어긋난 곳이 한 군데뿐이다.
10점 — 절반쯤 지켰다.
5점 — 일부만 지켰다.
0점 — 전혀 지키지 않았다.

0점과 20점은 확실할 때만 준다. 판단이 애매하면 중간 점수를 준다.
어긋난 곳을 하나 찾았다고 해서 0점을 주지 않는다. 지켜진 부분이 있으면 그만큼 점수를 준다.
근거에 "지켰다"고 쓰면서 0점을 주는 일이 없도록, 근거와 점수를 반드시 일치시킨다.

근거는 두 글에서 실제로 확인한 사실로만 쓰고, 한 문장으로 짧게 쓴다.
근거에는 학생이 다음 시도에서 고칠 수 있는 단서를 담는다.
반드시 아래 JSON 형식으로만 답한다. 다른 말을 덧붙이지 않는다.

{"items":[{"key":"structure","score":0,"reason":""},{"key":"style","score":0,"reason":""},{"key":"length","score":0,"reason":""},{"key":"elements","score":0,"reason":""},{"key":"ending","score":0,"reason":""}]}`;

function corsHeaders(origin: string | null) {
  const ok = origin && ALLOW_ORIGIN_RE.test(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin! : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

async function callSolar(
  messages: unknown[],
  maxTokens: number,
  jsonMode = false,
): Promise<string> {
  const key = Deno.env.get('SOLAR_API_KEY');
  if (!key) throw new Error('SOLAR_API_KEY 시크릿이 등록되어 있지 않습니다.');

  const body: Record<string, unknown> = {
    model: MODEL,
    messages,
    // 채점이 매번 흔들리면 2차 시도의 근거가 되지 못한다. 생성 쪽도 온도를
    // 낮게 두되 0으로 두지는 않는다 (S12에서 다룬 대로 같은 프롬프트가 늘
    // 같은 글을 내놓지 않는다는 사실 자체가 수업 소재다).
    temperature: 0.3,
    max_tokens: maxTokens,
    stream: false,
    reasoning_effort: 'low',
  };
  if (jsonMode) body.response_format = { type: 'json_object' };

  const post = (payload: Record<string, unknown>) =>
    fetch(SOLAR_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

  let res = await post(body);

  // 모델 계열마다 지원 파라미터가 다르다. 400이면 거부당했을 법한 선택
  // 파라미터를 하나씩 떼고 재시도해, 모델 교체가 기능을 통째로 죽이지
  // 않게 한다 (같은 프로젝트 solar-proxy가 겪은 문제를 그대로 물려받는다).
  if (!res.ok && res.status === 400) {
    const noReason = { ...body };
    delete noReason.reasoning_effort;
    res = await post(noReason);
    if (!res.ok && res.status === 400 && jsonMode) {
      const noJson = { ...noReason };
      delete noJson.response_format;
      res = await post(noJson);
    }
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`Solar 응답 오류 (HTTP ${res.status}) ${text.slice(0, 300)}`);

  let data: Record<string, any> | null = null;
  try { data = JSON.parse(text); } catch { throw new Error('Solar 응답을 해석하지 못했습니다.'); }
  const out = data?.choices?.[0]?.message?.content;
  if (typeof out !== 'string' || !out.trim()) throw new Error('Solar가 빈 응답을 돌려주었습니다.');
  return out.trim();
}

async function bumpUsage(clientId: string) {
  const url = Deno.env.get('SUPABASE_URL');
  const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !svc) return { allowed: true, calls: 0, limit: DAILY_LIMIT };

  try {
    const res = await fetch(`${url}/rest/v1/rpc/solar_bump_usage`, {
      method: 'POST',
      headers: { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_client_id: clientId, p_limit: DAILY_LIMIT }),
    });
    if (!res.ok) return { allowed: true, calls: 0, limit: DAILY_LIMIT };
    return await res.json();
  } catch {
    // 계수에 실패했다고 수업을 막지는 않는다
    return { allowed: true, calls: 0, limit: DAILY_LIMIT };
  }
}

/* 문단 안에서 문장마다 줄을 바꾸는 버릇이 있어(2026-08-21 실측) 학생이 문단을
   세기 어려웠다. 문단 사이 빈 줄은 남기고 문단 안의 줄바꿈만 공백으로 합친다.
   generate 결과에만 적용한다. 재현문은 학생이 자기 프롬프트가 무엇을 만들어
   냈는지 그대로 봐야 하므로 손대지 않는다(목록이 나왔다면 목록인 채로 본다). */
function tidyParagraphs(text: string, topic?: string) {
  const NL = String.fromCharCode(10);
  let paras = text
    .split(new RegExp(NL + '\\s*' + NL))
    .map((p) => p.split(NL).map((l) => l.trim()).filter(Boolean).join(' '))
    .filter(Boolean);

  // 지시문 표현이 본문에 새어 나온 흔적을 떼어 낸다. 주제를 물음 형태로
  // 바꾼 뒤 "첫째 문단 최근 도시 곳곳에…" 같은 출력이 나왔다(2026-08-21 실측).
  paras = paras
    .map((p) => p.replace(/^(첫째|둘째|셋째|첫|두|세)\s*(번째)?\s*문단\s*[:.)\-]?\s*/, '').trim())
    .filter(Boolean);

  // 주제를 제목처럼 되풀이한 첫 줄을 떼어 낸다. 문단이 네 개 이상일 때만
  // 손대므로, 정상 출력(세 문단)은 건드리지 않는다.
  if (topic && paras.length >= 4) {
    const norm = (s: string) => s.replace(/[^가-힣a-zA-Z0-9]/g, '');
    const head = norm(paras[0]);
    const t = norm(topic);
    if (head && (head === t || t.startsWith(head) || head.startsWith(t))) paras = paras.slice(1);
  }

  // 그래도 문단이 셋을 넘으면 셋째부터 하나로 합친다. 마지막 질문을 별도
  // 문단으로 떼어 내는 출력이 남아 있어서(2026-08-21 실측), 학생이 가장 먼저
  // 세는 규칙인 "문단 수"만큼은 어긋나지 않게 못박는다.
  if (paras.length > 3) paras = [paras[0], paras[1], paras.slice(2).join(' ')];

  return paras.join(NL + NL);
}

/* 원문 문장을 프롬프트에 그대로 붙여 넣는 우회를 잡는다. 원문이 이미지가
   아니라 글이라 복사가 가능해졌기 때문에 필요한 검사다. 어절 6개가 연달아
   일치하면 베낀 것으로 본다. */
function detectCopy(source: string, prompt: string) {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const src = norm(source);
  const words = norm(prompt).split(' ');
  for (let i = 0; i + 6 <= words.length; i++) {
    const chunk = words.slice(i, i + 6).join(' ');
    if (chunk.length >= 12 && src.includes(chunk)) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (req.method !== 'POST') return json({ error: 'POST만 받습니다.' }, 405, origin);
  if (origin && !ALLOW_ORIGIN_RE.test(origin)) {
    return json({ error: '허용되지 않은 출처입니다.' }, 403, origin);
  }

  let body: Record<string, any> | null = null;
  try { body = await req.json(); } catch { return json({ error: '요청 본문을 해석하지 못했습니다.' }, 400, origin); }

  const action = String(body?.action || '');
  const clientId = String(body?.clientId || '');

  const usage = await bumpUsage(clientId);
  if (!usage.allowed) {
    return json(
      { error: `오늘 이 기기에서 쓸 수 있는 횟수(${usage.limit}회)를 다 썼습니다. 선생님께 말씀해 주세요.` },
      429,
      origin,
    );
  }

  try {
    if (action === 'generate') {
      const topic = String(body?.topic || '').trim();
      if (!topic) return json({ error: '주제가 비어 있습니다.' }, 400, origin);
      if (topic.length > 120) return json({ error: '주제는 120자 이내로 적어 주세요.' }, 400, origin);

      const text = await callSolar(
        [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `주제: ${topic}` },
        ],
        2000,
      );
      return json({ text: tidyParagraphs(text, topic) }, 200, origin);
    }

    if (action === 'reproduce') {
      const prompt = String(body?.prompt || '').trim();
      if (!prompt) return json({ error: '프롬프트가 비어 있습니다.' }, 400, origin);
      if (prompt.length > 1200) return json({ error: '프롬프트는 1200자 이내로 적어 주세요.' }, 400, origin);

      // 이 활동의 정답지인 시스템 프롬프트는 절대 붙이지 않는다. 대신 아무
      // 규칙도 알려 주지 않는 중립 지시문만 system 자리에 둔다.
      //
      // 2026-08-21 실측 두 번:
      //   ① 학생 프롬프트를 user 자리에만 두었더니 규칙을 정확히 적었는데도
      //      1문단 160자로 재현되어, 제대로 찾은 학생이 손해를 봤다.
      //   ② 학생 프롬프트를 통째로 system 자리에 옮겼더니 같은 문단을 세 번
      //      반복하는 응답이 나왔다.
      // 그래서 중립 지시문을 system에 두고 학생 프롬프트는 user에 남긴다.
      // 이 지시문은 "사용자가 정한 형식을 지켜라"까지만 말하므로 정답 규칙은
      // 하나도 새어 나가지 않는다.
      const text = await callSolar(
        [
          {
            role: 'system',
            content:
              '너는 사용자가 요구한 대로 글을 쓰는 필자다.\n' +
              '사용자가 형식을 지정하면 그 형식을 하나도 빠뜨리지 않고 정확히 지킨다.\n' +
              '사용자가 정하지 않은 것은 네가 알아서 정한다.\n' +
              '같은 문장이나 같은 문단을 되풀이하지 않는다.\n' +
              '완성된 글만 출력하고 설명이나 머리말을 붙이지 않는다.',
          },
          { role: 'user', content: prompt },
        ],
        2000,
      );
      return json({ text }, 200, origin);
    }

    if (action === 'score') {
      const source = String(body?.source || '').trim();
      const candidate = String(body?.candidate || '').trim();
      const prompt = String(body?.prompt || '').trim();
      if (!source || !candidate) return json({ error: '원문과 재현문이 모두 필요합니다.' }, 400, origin);

      const raw = await callSolar(
        [
          { role: 'system', content: SCORE_SYSTEM },
          {
            role: 'user',
            content:
              `채점 항목\n` +
              RUBRIC.map((r) => `- ${r.key} (${r.label}): ${r.desc}`).join('\n') +
              `\n\n[원문]\n${source}\n\n[재현문]\n${candidate}`,
          },
        ],
        3000,
        true,
      );

      let parsed: Record<string, any> | null = null;
      try {
        const m = raw.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(m ? m[0] : raw);
      } catch {
        return json({ error: '채점 결과를 해석하지 못했습니다. 한 번 더 눌러 주세요.' }, 502, origin);
      }

      const items = RUBRIC.map((r) => {
        const hit = (parsed?.items || []).find((x: Record<string, any>) => x?.key === r.key) || {};
        const s = Math.max(0, Math.min(20, Number(hit.score) || 0));
        return { key: r.key, label: r.label, score: s, reason: String(hit.reason || '').slice(0, 200) };
      });
      const total = items.reduce((a, b) => a + b.score, 0);

      return json({ total, items, copied: prompt ? detectCopy(source, prompt) : false }, 200, origin);
    }

    return json({ error: '알 수 없는 동작입니다.' }, 400, origin);
  } catch (e) {
    return json({ error: (e as Error).message || '알 수 없는 오류' }, 502, origin);
  }
});
