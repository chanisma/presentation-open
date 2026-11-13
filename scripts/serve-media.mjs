// 미디어 폴더를 따로 서빙한다 — 발표자 오버레이 영상처럼 용량이 커서 git·배포에 넣지 않는 자산용.
// Range 요청을 지원해 영상 구간 재생·되감기가 된다. 기본 폴더(저장소/presenter-media, gitignore)는
// dev 서버가 /presenter-media/로 이미 서빙하므로 보통은 필요 없다 — 다른 폴더·다른 기기에서 볼 때 쓴다.
//
//   node scripts/serve-media.mjs [폴더=<저장소>/presenter-media] [포트=5200]
//
// 이 서버를 쓰려면 덱을 VITE_PRESENTER_BASE=http://127.0.0.1:5200 으로 띄운다(기본은 /presenter-media).
// 배포할 때는 같은 폴더 구조를 다른 호스팅에 올리고 VITE_PRESENTER_BASE로 주소를 넘긴다.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'presenter-media'));
const PORT = Number(process.argv[3] || 5200);
const TYPES = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Accept-Ranges', 'bytes');
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(ROOT, '.' + rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404).end();
      return;
    }
    const size = fs.statSync(file).size;
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const start = m[1] ? Number(m[1]) : size - Number(m[2]);
      const end = m[1] && m[2] ? Number(m[2]) : size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      fs.createReadStream(file, { start, end }).pipe(res);
    } else {
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': size });
      fs.createReadStream(file).pipe(res);
    }
  })
  .listen(PORT, () => console.log(`미디어 서빙: ${ROOT} → http://127.0.0.1:${PORT}`));
