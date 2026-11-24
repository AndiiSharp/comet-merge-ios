// WebKit-Test: Menue, Spiel, 3er-Merge (2+2+2 -> 4, 60 Punkte), Game Over, Unterseiten.
import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const require = createRequire('C:/Users/Andrej/projekte/test1/boardgames/tools/webkit-test/package.json');
const { webkit } = require('playwright');
const root = path.resolve('www'); const out = path.resolve('tools/shots'); fs.mkdirSync(out, { recursive: true });
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(new URL(q.url, 'http://x').pathname); if (p === '/') p = '/index.html'; const f = path.join(root, p);
  if (!fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((r) => srv.listen(8802, '127.0.0.1', r));
const br = await webkit.launch(); const ctx = await br.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: process.argv[2] || 'en-US' });
const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
const shot = (n) => pg.screenshot({ path: path.join(out, n + '.png') });
await pg.goto('http://127.0.0.1:8802/'); await pg.waitForTimeout(1500); await shot('01-menu');
await pg.click('[data-act=play]'); await pg.waitForTimeout(300);
// deterministisch: drei 2er (Level 1) setzen
await pg.evaluate(() => { G.cur = { l: 1 }; G.next = { l: 1 }; save(); render(); });
for (let i = 0; i < 3; i++) { await pg.evaluate(() => { G.cur = { l: 1 }; }); await pg.click('[data-act=drop]'); await pg.waitForTimeout(150); }
const st = await pg.evaluate(() => ({ score: G.score, bottom: G.grid[6][3] }));
console.log('Nach 3x Level-1:', JSON.stringify(st), st.score === 60 && st.bottom.l === 2 ? 'OK (wie Android: 60 Punkte, Block 4)' : 'ABWEICHUNG');
await shot('02-game');
await pg.evaluate(() => { for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) G.grid[r][c] = (r === 0 && c === 3) ? null : { l: ((r * 7 + c) % 2) + 3 + (r % 2) * 2 }; G.cur = { l: 9 }; G.col = 3; save(); render(); }); await pg.click('[data-act=drop]');
await pg.waitForTimeout(300); await shot('03-gameover');
await pg.click('.card [data-go=menu]'); for (const s of ['leaderboard', 'achievements', 'stats', 'settings']) { await pg.click(`[data-go=${s}]`); await pg.waitForTimeout(200); await shot('04-' + s); await pg.click('[data-go=menu]'); }
await br.close(); srv.close(); console.log(errs.length ? 'FEHLER: ' + errs.join(' | ') : 'Keine JS-Fehler');
