// 나레이션 녹음 길이 → ../voice.ts (장면 시각이 목소리를 따라가게). tts.py 다음에 실행: node video/voice.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const lines = JSON.parse(fs.readFileSync(path.join(HERE, 'narration.json'), 'utf8'));
const map = Object.fromEntries(lines.filter((l) => l.seconds).map((l) => [l.key, l.seconds]));
fs.writeFileSync(path.join(HERE, '..', 'voice.ts'), `/* 나레이션 녹음 길이(초) — video/voice.mjs 가 narration.json 에서 만든다 */\nexport const VOICE: Record<string, number> = ${JSON.stringify(map, null, 1)};\n`);
console.log(Object.keys(map).length, '줄', Object.values(map).reduce((a, b) => a + b, 0).toFixed(1), '초');
