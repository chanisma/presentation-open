/* 예시 장면·프롬프트 카드 SSOT — plan.md 「예시 장면 SSOT」·「프롬프트 카드 SSOT」와 글자까지 같아야 한다. */

import type { AspectKey } from './shared';

/* 「비 오는 하굣길」 ③ 반전 — 완성 장면 카드 */
export const RAIN_CARD: Record<AspectKey, string> = {
  intent: '반전 — 혼자인 줄 알았던 학생에게 누군가 우산을 씌워 준다',
  subject: '남색 후드티에 검은 책가방을 멘 여학생 · 노란 우산 (우산을 든 친구는 흰 소매와 손만 보인다)',
  motion: '① 처마 아래서 손바닥을 내밀어 비를 확인한다 → ② 노란 우산이 화면 위쪽에서 들어와 머리 위를 덮는다 → ③ 고개를 들어 오른쪽을 본다',
  scene: '비 오는 늦은 오후, 교문 처마 밑, 젖은 아스팔트, 흐린 회색 하늘, 부드러운 자연광',
  space: '미디엄 숏. 여학생은 화면 왼쪽 1/3, 중경. 후경은 흐릿한 빈 운동장. 끝에서 노란 우산이 위쪽 전경을 덮는다',
  camera: '눈높이, 삼각대 고정 숏(이동·줌 없음), 얕은 심도로 여학생에 초점',
  outside: '자막 「그날, 우산이 하나 더 있었다」',
};

/* 비트 맵 (20초 쇼츠) */
export const BEATS = [
  { role: '훅', en: 'hook', line: '교문 밖으로 쏟아지는 빗줄기' },
  { role: '고조', en: 'escalation', line: '우산 없는 학생이 처마 아래서 망설인다' },
  { role: '반전', en: 'reveal', line: '머리 위로 노란 우산이 들어온다' },
  { role: '착지', en: 'landing', line: '두 사람이 한 우산을 쓰고 빗속으로 걸어간다' },
];

/* 영어 조립본 — 줄마다 출처 칸 */
export const PROMPT_LINES: { keys: AspectKey[]; text: string }[] = [
  { keys: ['space', 'camera'], text: 'Medium shot at eye level, locked-off static camera on a tripod, shallow depth of field focused on the girl.' },
  { keys: ['subject', 'space'], text: "A high-school girl in a navy hoodie with a black backpack stands under the school gate's awning, in the left third of the frame." },
  { keys: ['motion'], text: 'First, she holds out her palm to check the rain. Then a bright yellow umbrella slides into frame from the top and covers her head, held by a hand in a white sleeve. She looks up and turns to her right.' },
  { keys: ['scene'], text: 'Rainy late afternoon, wet asphalt, grey overcast sky, soft natural light, a blurred empty schoolyard in the background.' },
  { keys: ['scene'], text: 'Realistic, muted colors, light film grain.' },
  { keys: ['outside'], text: 'No text on screen.' },
];
export const PROMPT_EN = PROMPT_LINES.map((l) => l.text).join('\n');

export const PROMPT_KO_LINES: string[] = [
  '눈높이 미디엄 숏, 삼각대에 고정된 카메라, 여학생에 초점이 맞고 배경은 흐림.',
  '남색 후드티에 검은 책가방을 멘 여고생이 교문 처마 아래, 화면 왼쪽 1/3에 서 있다.',
  '먼저 손바닥을 내밀어 비를 확인한다. 그다음 흰 소매의 손이 든 노란 우산이 화면 위쪽에서 들어와 머리 위를 덮는다. 여학생이 고개를 들어 오른쪽을 본다.',
  '비 오는 늦은 오후, 젖은 아스팔트, 흐린 회색 하늘, 부드러운 자연광, 뒤로 흐릿한 빈 운동장.',
  '사실적인 영상, 차분한 색, 옅은 필름 질감.',
  '화면에 글자 없음.',
];

/* 카드 A — 장면 카드 양식 (S19) */
export const CARD_A = `[숏 의도] 이 숏이 영상에서 맡는 일:
[피사체] 누가·무엇이 (다른 것과 구별되는 특징 2~3개):
[동작] 순서대로 ①→②→③ (마지막 상태까지):
[배경] 장소 · 시간 · 날씨 · 빛:
[공간 구도] 숏 크기 · 화면 속 위치 · 전경/중경/후경:
[카메라] 높이 · 각도 · 움직임(없으면 '고정') · 초점:
[영상 밖] 자막·제목 (편집에서 넣을 것):`;

/* 카드 B — 장면 감독 조수에게 보내는 부탁 (S16) */
export const CARD_B = `너는 짧은 영상의 장면 감독 조수야. 아래는 내가 쓴 장면 카드야.
1) 먼저 비어 있거나 애매한 칸을 질문해 줘. 네가 마음대로 채우지 마.
2) 내가 답하면, 영상 생성 AI에 넣을 영어 프롬프트를 100단어 안팎으로 써 줘.
   순서: 숏 크기와 카메라 → 피사체 → 동작(순서대로) → 배경과 빛 → 스타일.
3) 화면에 글자·자막은 넣지 마. 카드에 없는 사건이나 사람을 더하지 마.
4) 마지막에 카드의 어느 칸이 프롬프트의 어느 문장이 됐는지 표로 보여 줘.

(장면 카드 붙여 넣기)`;

/* 카드 C — 확정 전 점검 다섯 줄 (S17·S20) */
export const CARD_C = [
  '카드에 없는 것이 프롬프트에 들어갔나?',
  '동작이 순서대로, 끝 상태까지 있나?',
  "카메라가 '고정'인데 움직임 단어(dolly, zoom, pan)가 섞이지 않았나?",
  '감정 형용사(sad, epic, cinematic) 대신 눈에 보이는 것으로 썼나?',
  '글자·자막 요청이 없나?',
];
