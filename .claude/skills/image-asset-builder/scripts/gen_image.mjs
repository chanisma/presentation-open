#!/usr/bin/env node
// gen_image.mjs — Codex CLI(내장 image_gen)로 래스터 이미지 1장을 생성해
// 저장소 안의 지정 경로에 놓는다. newVideoGen vg-story Phase 3의 codex 호출을
// 이 저장소 환경(ImageMagick 없음·한글 경로)에 맞게 이식한 것.
//
// 사용:
//   node .claude/skills/image-asset-builder/scripts/gen_image.mjs \
//     --out "data/dev/테스트 수업 자료/디오라마-샘플/images/stage-01.png" \
//     --prompt-file tmp/prompt.txt  [--prompt "..."] \
//     [--style-file tmp/style.txt]  [--ref anchor.png] [--ref prev.png] \
//     [--size 1920x1080] [--force] [--timeout 900]
//
// 동작:
//   1) 한글·공백 경로에서 codex가 파일 복사에 실패하는 사고를 피하려고,
//      codex에게는 항상 ASCII 스테이징 경로(tmp/imagegen/…)에 저장시킨다.
//   2) codex가 저장에 실패하면 $CODEX_HOME/generated_images 에서 실행 시각
//      이후에 생긴 최신 이미지를 회수한다 (내장 image_gen의 기본 저장 위치).
//   3) --size가 있으면 fit_image.py(PIL)로 정확한 해상도로 cover-crop.
// 프롬프트에는 "이미지 안 텍스트 금지"가 항상 자동으로 붙는다 (scene-grammar §17).

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const argv = process.argv.slice(2);
const opt = { refs: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--out') opt.out = argv[++i];
  else if (a === '--prompt') opt.prompt = argv[++i];
  else if (a === '--prompt-file') opt.promptFile = argv[++i];
  else if (a === '--style-file') opt.styleFile = argv[++i];
  else if (a === '--ref') opt.refs.push(argv[++i]);
  else if (a === '--size') opt.size = argv[++i];
  else if (a === '--force') opt.force = true;
  else if (a === '--timeout') opt.timeout = Number(argv[++i]);
  else if (a === '--model') opt.model = argv[++i];
}

if (!opt.out || (!opt.prompt && !opt.promptFile)) {
  console.error(
    'usage: gen_image.mjs --out <path.png> (--prompt "..." | --prompt-file <f>) [--style-file <f>] [--ref <img>]... [--size WxH] [--force]'
  );
  process.exit(1);
}

const ROOT = process.cwd();
const outAbs = path.resolve(ROOT, opt.out);
if (fs.existsSync(outAbs) && !opt.force) {
  console.log(`[skip] 이미 있음 (덮어쓰려면 --force): ${opt.out}`);
  process.exit(0);
}

const prompt = opt.prompt ?? fs.readFileSync(opt.promptFile, 'utf8');
const styleGuide = opt.styleFile ? fs.readFileSync(opt.styleFile, 'utf8').trim() : '';

// ── ASCII 스테이징 경로 (한글 폴더명에서 codex 복사 실패 회피)
const stageDir = path.join(ROOT, 'tmp', 'imagegen');
fs.mkdirSync(stageDir, { recursive: true });
let h = 0;
for (const c of opt.out) h = (h * 31 + c.charCodeAt(0)) >>> 0;
const stagePath = path.join(stageDir, `gen-${h.toString(36)}.png`);
if (fs.existsSync(stagePath)) fs.unlinkSync(stagePath);

const sizeNote = opt.size
  ? `Target resolution: ${opt.size.replace('x', ' x ')} (${
      Number(opt.size.split('x')[0]) >= Number(opt.size.split('x')[1])
        ? '16:9 landscape'
        : 'portrait'
    }). 가장 가까운 지원 해상도로 생성하면 된다 — 정확한 크기는 이후 스크립트가 맞춘다.`
  : '';

const refNote =
  opt.refs.length > 0
    ? `\n\nIMPORTANT: 첨부된 reference 이미지의 스타일(선·색감·질감·명암·medium)을 그대로 따라야 한다. 첫 번째 reference가 이 자산군 전체의 톤 anchor다. 내용이 아니라 스타일을 따르는 것이다.`
    : '';

const fullPrompt = `내장 image_gen 도구로 이미지를 정확히 한 장 생성하고, 반드시 아래 경로에 저장해줘 (다른 파일은 만들지 말 것):

${stagePath.replace(/\\/g, '/')}

${sizeNote}${refNote}

${styleGuide ? `Style guide (이 자산군 공통 톤 — 반드시 준수):\n${styleGuide}\n\n` : ''}Image content:
${prompt}

Forbidden (HARD): 이미지 안의 글자·문자·숫자·라벨·로고·워터마크·자막, 사진 실사(photorealistic), 스톡 일러스트/SaaS 랜딩 톤, 프레임·테두리 장식, 그리드선.
작업이 끝나면 저장 여부만 한 줄로 보고해. 다른 설명·분석·리팩터링은 하지 마.`;

// ── codex 실행
const args = ['exec', '--sandbox', 'workspace-write', '--skip-git-repo-check'];
if (opt.model) args.push('--model', opt.model);
for (const r of opt.refs) {
  const abs = path.resolve(ROOT, r);
  if (fs.existsSync(abs)) args.push('--image', abs);
  else console.warn(`  ⚠ reference 없음 — 건너뜀: ${r}`);
}
args.push('-');

const startedAt = Date.now() - 5000; // 시계 오차 여유
console.log(`▶ codex 이미지 생성 — ${opt.out}${opt.refs.length ? ` (ref ${opt.refs.length}장)` : ''}`);

// Windows에서 codex는 .cmd 셔임이라 shell:true가 필요하고, 그러면 인자를
// 직접 따옴표로 감싸야 한다 (한글·공백 경로가 통째로 쪼개지는 사고 방지).
const WIN = process.platform === 'win32';
const shellArgs = WIN ? args.map((a) => (/[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a)) : args;

const code = await new Promise((resolve) => {
  const proc = spawn('codex', shellArgs, { stdio: ['pipe', 'pipe', 'pipe'], shell: WIN });
  let tail = '';
  const timer = setTimeout(() => proc.kill(), (opt.timeout ?? 900) * 1000);
  proc.stdout.on('data', (c) => (tail = (tail + c.toString()).slice(-4000)));
  proc.stderr.on('data', (c) => (tail = (tail + c.toString()).slice(-4000)));
  proc.stdin.write(fullPrompt);
  proc.stdin.end();
  proc.on('error', (e) => {
    clearTimeout(timer);
    console.error(`  ✗ codex 실행 실패: ${e.message}`);
    resolve(1);
  });
  proc.on('exit', (c) => {
    clearTimeout(timer);
    if (c !== 0) console.error(`  ⚠ codex exit ${c}\n${tail.slice(-600)}`);
    resolve(c ?? 1);
  });
});

// ── 산출물 회수: 스테이징 → 없으면 $CODEX_HOME/generated_images 최신 파일
let produced = fs.existsSync(stagePath) ? stagePath : null;
if (!produced) {
  const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  const genDir = path.join(home, 'generated_images');
  const found = [];
  const walk = (d) => {
    let entries = [];
    try {
      entries = fs.readdirSync(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(png|webp|jpe?g)$/i.test(e.name)) {
        const st = fs.statSync(p);
        if (st.mtimeMs >= startedAt) found.push({ p, m: st.mtimeMs });
      }
    }
  };
  walk(genDir);
  found.sort((a, b) => b.m - a.m);
  if (found.length) {
    produced = found[0].p;
    console.log(`  ⓘ 스테이징 저장 실패 — generated_images에서 회수: ${path.basename(produced)}`);
  }
}

if (!produced) {
  console.error(`  ✗ 이미지를 찾지 못했다 (codex exit ${code}). 프롬프트를 줄이거나 다시 시도할 것.`);
  process.exit(2);
}

fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.copyFileSync(produced, outAbs);
if (produced === stagePath) fs.unlinkSync(stagePath);

// ── 해상도 보정 (PIL)
if (opt.size) {
  const [w, hh] = opt.size.split('x').map(Number);
  const fit = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fit_image.py');
  await new Promise((resolve) => {
    // python은 shell 없이 (shell:true면 한글·공백 경로가 쪼개진다)
    const p = spawn('python', [fit, outAbs, String(w), String(hh)], { stdio: 'inherit' });
    p.on('error', () => {
      console.warn('  ⚠ python/PIL 없음 — 해상도 보정 건너뜀');
      resolve();
    });
    p.on('exit', () => resolve());
  });
}

const dim = pngSize(outAbs);
console.log(`✅ ${opt.out}${dim ? ` (${dim.w}x${dim.h})` : ''}`);

function pngSize(p) {
  try {
    const fd = fs.openSync(p, 'r');
    const buf = Buffer.alloc(24);
    fs.readSync(fd, buf, 0, 24, 0);
    fs.closeSync(fd);
    if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  } catch {
    return null;
  }
}
