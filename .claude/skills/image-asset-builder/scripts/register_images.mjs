#!/usr/bin/env node
// register_images.mjs — 생성 래스터 자산을 assets/manifest.json에 등록한다.
// (asset-library 스킬이 관리하는 단일 레지스트리 — SVG는 svg-asset-builder,
//  래스터 무대/스프라이트는 이 스크립트가 담당)
//
// 사용:
//   node .claude/skills/image-asset-builder/scripts/register_images.mjs \
//     --kind sprite --set 디오라마-샘플 --style cartoon-diorama \
//     [--origin generated] [--used-in diorama-demo] \
//     assets/sprites/디오라마-샘플/*.png
//
//   --kind  stage | sprite   (stage=무대 배경 1920x1080 · sprite=크롭 배우/소품)
//   --set   자산 세트명 (보통 수업 폴더명 — 재사용 판단의 1차 기준)
//   --style 스타일 계열 (cartoon-diorama · ink-sketch · watercolor-ghibli …)
//
// tags/alt는 비워 둔다 — 등록 직후 크롭 육안 검수와 동시에 에이전트가
// Read(멀티모달)로 보고 채운다 (asset-library의 "미태깅" 규약).

import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const opt = { origin: 'generated', files: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--kind') opt.kind = argv[++i];
  else if (a === '--set') opt.set = argv[++i];
  else if (a === '--style') opt.style = argv[++i];
  else if (a === '--origin') opt.origin = argv[++i];
  else if (a === '--used-in') opt.usedIn = argv[++i];
  else opt.files.push(a);
}
if (!opt.kind || !opt.set || !opt.style || opt.files.length === 0) {
  console.error(
    'usage: register_images.mjs --kind stage|sprite --set <세트명> --style <스타일> [--used-in <덱id>] <files...>'
  );
  process.exit(1);
}

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'assets', 'manifest.json');
const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
m.assets ??= [];

let added = 0;
let updated = 0;
const untagged = [];

for (const f of opt.files) {
  const abs = path.resolve(ROOT, f);
  if (!fs.existsSync(abs)) {
    console.warn(`  ⚠ 없음 — 건너뜀: ${f}`);
    continue;
  }
  const rel = path.relative(ROOT, abs).split(path.sep).join('/');
  const dim = pngSize(abs);
  let e = m.assets.find((x) => x.file === rel);
  if (!e) {
    e = {
      file: rel,
      type: 'image',
      origin: opt.origin,
      kind: opt.kind,
      set: opt.set,
      style: opt.style,
      w: dim?.w,
      h: dim?.h,
      tags: [],
      alt: '',
      usedIn: [],
    };
    m.assets.push(e);
    added++;
  } else {
    e.kind = opt.kind;
    e.set = opt.set;
    e.style = opt.style;
    if (dim) {
      e.w = dim.w;
      e.h = dim.h;
    }
    updated++;
  }
  if (opt.usedIn && !e.usedIn.includes(opt.usedIn)) e.usedIn.push(opt.usedIn);
  if (!e.tags?.length) untagged.push(rel);
}

fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
console.log(`✅ manifest 등록 — 신규 ${added} · 갱신 ${updated} (총 ${m.assets.length}건)`);
if (untagged.length) {
  console.log('\n⚠ 미태깅 — 이 파일들을 Read(멀티모달)로 보고 tags·alt를 채울 것:');
  for (const u of untagged) console.log(`   ${u}`);
}

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
