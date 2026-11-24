'use strict';
/* Comet Merge – iOS-Version. Spiellogik 1:1 nach der Android-App (7×7-Feld, Merge ab 3 gleichen Bloecken,
   Kettenreaktionen, Combo-Multiplikator, 4er-Gruppe = Bombenblock, 5er-Gruppe raeumt die Reihe, Perfect Clear +5000). */
const Cap = window.Capacitor;
const native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const plug = (n) => (native && Cap.registerPlugin ? Cap.registerPlugin(n) : null);
const Haptics = plug('Haptics'), Notif = plug('LocalNotifications'), Browser = plug('Browser');
const W = 7, H = 7, MAXL = 12;
const VERSION = '1.0.1';
Object.assign(STR.en, { daily: 'DAILY CHALLENGE', daily_best: 'Today’s best %1$d', shop: 'Shop', shop_note: 'Spend your coins on power-ups for your next game or on new block styles.', buy: 'Buy', owned: 'Owned', use: 'Use', in_use: 'In use', not_enough: 'Not enough coins.', skins: 'Block styles', powerups: 'Power-ups', inv_note: 'Bought power-ups are added at the start of your next game.', reward: '+1 %1$s for %2$d points!', howto: 'How to play', howto_text: 'Move the falling block with ◀ ▶ or tap a column, then DROP.\n\nThree or more touching blocks with the same number merge into one block with double the value.\n\nMerges can trigger chain reactions – each wave raises the COMBO multiplier.\n\nFour blocks at once create a special block, five or more also clear the whole row.\n\nEvery 1,000 points you earn a random power-up. 💣 clears 3×3 blocks, 🎨 upgrades all blocks of one number, 🔄 shuffles the bottom two rows, ↩️ takes back your last drop.\n\nThe game ends when a column is full to the top.', pause: 'Paused', resume: 'Resume', restart: 'Restart', settings_sound: 'Sound effects', version: 'Version %1$s', coins: '%1$d coins' });
Object.assign(STR.de, { daily: 'TAGES-CHALLENGE', daily_best: 'Heute bester %1$d', shop: 'Shop', shop_note: 'Gib Münzen für Power-ups für dein nächstes Spiel oder für neue Block-Designs aus.', buy: 'Kaufen', owned: 'Gekauft', use: 'Verwenden', in_use: 'Aktiv', not_enough: 'Nicht genug Münzen.', skins: 'Block-Designs', powerups: 'Power-ups', inv_note: 'Gekaufte Power-ups kommen zu Beginn deines nächsten Spiels dazu.', reward: '+1 %1$s für %2$d Punkte!', howto: 'So wird gespielt', howto_text: 'Bewege den fallenden Block mit ◀ ▶ oder tippe eine Spalte an, dann ABLEGEN.\n\nDrei oder mehr sich berührende Blöcke mit gleicher Zahl verschmelzen zu einem Block mit doppeltem Wert.\n\nMerges können Kettenreaktionen auslösen – jede Welle erhöht den COMBO-Multiplikator.\n\nVier Blöcke auf einmal ergeben einen Spezialblock, fünf oder mehr räumen zusätzlich die ganze Reihe.\n\nAlle 1.000 Punkte bekommst du ein zufälliges Power-up. 💣 räumt 3×3 Blöcke, 🎨 wertet alle Blöcke einer Zahl auf, 🔄 mischt die unteren zwei Reihen, ↩️ nimmt den letzten Zug zurück.\n\nDas Spiel endet, wenn eine Spalte bis oben voll ist.', pause: 'Pause', resume: 'Weiter', restart: 'Neu starten', settings_sound: 'Soundeffekte', version: 'Version %1$s', coins: '%1$d Münzen' });
const SKINS = { classic: ['#FF5252', '#448AFF', '#69F0AE', '#FFD740', '#B388FF', '#40C4FF', '#FFAB40'], neon: ['#FF2E88', '#00E5FF', '#76FF03', '#FFEA00', '#D500F9', '#2979FF', '#FF9100'], pastel: ['#F4A6A6', '#A6C8F4', '#B5E8C8', '#F7E1A1', '#D2B8F2', '#A8E3EC', '#F8C9A0'], ocean: ['#0077B6', '#00B4D8', '#48CAE4', '#023E8A', '#90E0EF', '#03045E', '#0096C7'], sunset: ['#FF6B6B', '#FF8E53', '#FFC75F', '#F9F871', '#C34A36', '#845EC2', '#D65DB1'] };
const SKIN_PRICE = { classic: 0, neon: 150, pastel: 150, ocean: 250, sunset: 400 };
const PU_PRICE = { BOMB: 60, PAINT: 90, SHUFFLE: 40, UNDO: 70 };
let rngSeed = null; function rng() { if (rngSeed == null) return Math.random(); rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff; return rngSeed / 0x80000000; }
const dayKey = () => new Date().toISOString().slice(0, 10);
const PRIVACY_URL = 'https://andiisharp.github.io/lumvero-apps/comet-merge-datenschutz.html';
const $ = (s, r = document) => r.querySelector(s);
const LS = { get(k, d) { try { const v = localStorage.getItem('cm.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('cm.' + k, JSON.stringify(v)); } catch (e) {} } };
let S = Object.assign({ haptics: true, reminder: false, theme: 'system', sound: true, skin: 'classic', howtoSeen: false }, LS.get('settings', {}));
let P = Object.assign({ coins: 0, xp: 0, highScore: 0, streak: 0, lastDay: -1, games: 0, merges: 0, inv: { BOMB: 0, PAINT: 0, SHUFFLE: 0, UNDO: 0 }, skins: ['classic'], daily: {} }, LS.get('player', {}));
let scores = LS.get('scores', []);
let ach = LS.get('ach', {});
const lang = () => ((navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en');
const t = (k, ...a) => { let s = (STR[lang()] && STR[lang()][k]) || STR.en[k] || k; return s.replace(/%(\d)\$[sd]/g, (m, n) => a[+n - 1]); };
const COLORS = ['#FF5252', '#448AFF', '#69F0AE', '#FFD740', '#B388FF', '#40C4FF', '#FFAB40'];
const colorOf = (l) => (SKINS[S.skin] || COLORS)[(l - 1) % 7];
const valOf = (l) => 2 ** l;
function applyTheme() { const d = S.theme === 'dark' || (S.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = d ? 'dark' : 'light'; }
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { applyTheme(); });
function buzz(ms) { if (!S.haptics) return; try { if (Haptics) Haptics.impact({ style: ms > 20 ? 'MEDIUM' : 'LIGHT' }); else if (navigator.vibrate) navigator.vibrate(ms || 12); } catch (e) {} }

// ---------- Erfolge (wie Android) ----------
const ACH = [
  ['first_merge', '✨', 'First Merge', 'Make your first merge', 'Erster Merge', 'Schaffe deinen ersten Merge'],
  ['score_1k', '🥉', 'Getting Started', 'Score 1,000 in a single game', 'Guter Start', 'Erreiche 1.000 Punkte in einem Spiel'],
  ['score_10k', '🥈', 'High Roller', 'Score 10,000 in a single game', 'Hoch hinaus', 'Erreiche 10.000 Punkte in einem Spiel'],
  ['score_50k', '🥇', 'Score Legend', 'Score 50,000 in a single game', 'Punkte-Legende', 'Erreiche 50.000 Punkte in einem Spiel'],
  ['combo_3', '🔥', 'Comboist', 'Reach a 3× combo', 'Combo-Fan', 'Erreiche eine 3×-Combo'],
  ['combo_5', '⚡', 'Combo Master', 'Reach a 5× combo', 'Combo-Meister', 'Erreiche eine 5×-Combo'],
  ['block_32', '🧱', 'Builder', 'Create a 32 block', 'Baumeister', 'Erschaffe einen 32er-Block'],
  ['block_1024', '🏛️', 'Architect', 'Create a 1024 block', 'Architekt', 'Erschaffe einen 1024er-Block'],
  ['chain_4', '⛓️', 'Chain Reaction', 'Trigger a 4-wave chain reaction', 'Kettenreaktion', 'Löse eine Kettenreaktion mit 4 Wellen aus'],
  ['games_10', '🎮', 'Dedicated', 'Play 10 games', 'Dranbleiber', 'Spiele 10 Runden'],
  ['games_100', '🏆', 'Veteran', 'Play 100 games', 'Veteran', 'Spiele 100 Runden'],
  ['streak_7', '📅', 'Week Warrior', 'Reach a 7-day play streak', 'Wochen-Held', 'Spiele 7 Tage in Folge'],
];
function unlock(id) { if (!ach[id]) { ach[id] = Date.now(); LS.set('ach', ach); } }

// ---------- Spiellogik ----------
const empty = () => Array.from({ length: H }, () => Array(W).fill(null));
function genBlock(moves) { // gewichteter Zufall: Top-Level steigt alle 5 Zuege, max. 6
  const top = Math.max(2, Math.min(6, Math.floor(moves / 5) + 2));
  const w = []; for (let i = 0; i < top; i++) w.push(1 << (top - 1 - i));
  let roll = Math.floor(rng() * w.reduce((a, b) => a + b, 0));
  for (let i = 0; i < top; i++) { if (roll < w[i]) return { l: i + 1 }; roll -= w[i]; }
  return { l: 1 };
}
const base = (l) => (1 << l) * 10;
function gravity(g) { const n = empty(); for (let c = 0; c < W; c++) { let tr = H - 1; for (let r = H - 1; r >= 0; r--) if (g[r][c]) n[tr--][c] = g[r][c]; } return n; }
function groups(g, chain) {
  const vis = empty().map((r) => r.map(() => false)); const out = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const b = g[r][c]; if (!b || vis[r][c]) continue;
    if (b.l >= MAXL) { vis[r][c] = true; continue; }
    const comp = [], st = [[r, c]]; vis[r][c] = true;
    while (st.length) { const [y, x] = st.pop(); comp.push([y, x]); for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ny = y + dy, nx = x + dx; if (ny < 0 || ny >= H || nx < 0 || nx >= W || vis[ny][nx]) continue; const nb = g[ny][nx]; if (nb && nb.l === b.l && nb.l < MAXL) { vis[ny][nx] = true; st.push([ny, nx]); } } }
    if (comp.length >= 3) { const anchor = comp.reduce((a, q) => (q[0] > a[0] || (q[0] === a[0] && q[1] > a[1]) ? q : a)); out.push({ cells: comp, src: b.l, res: Math.min(b.l + 1, MAXL), anchor, chain }); }
  }
  return out;
}
function settle(g) {
  let score = 0, combo = 0, chain = 0, waves = 0, merges = 0, top = 0;
  for (;;) {
    const gs = groups(g, chain); if (!gs.length) break;
    combo++; waves++;
    for (const gr of gs) { score += gr.cells.length * base(gr.src) * Math.max(combo, 1) + (chain > 0 ? Math.floor(base(gr.src) * 1.5 * chain) : 0); merges++; top = Math.max(top, gr.res); }
    const n = g.map((r) => r.slice());
    for (const gr of gs) { for (const [y, x] of gr.cells) n[y][x] = null; if (gr.cells.length >= 5) for (let x = 0; x < W; x++) n[gr.anchor[0]][x] = null; }
    for (const gr of gs) n[gr.anchor[0]][gr.anchor[1]] = { l: gr.res, bomb: gr.cells.length === 4 };
    g = gravity(n); chain++;
  }
  const isEmpty = g.every((r) => r.every((x) => !x));
  if (isEmpty && waves) score += 5000;
  return { g, score, combo, waves, merges, top };
}
const isFull = (g) => g[0].every((x) => x);

let G = LS.get('game', null);
function newGame(mode = 'classic') {
  rngSeed = mode === 'daily' ? parseInt(dayKey().replace(/-/g, ''), 10) : null;
  G = { mode, nextReward: 1000, grid: empty(), cur: genBlock(0), next: genBlock(0), score: 0, combo: 0, moves: 0, col: Math.floor(W / 2), pu: { BOMB: 1, PAINT: 0, SHUFFLE: 1, UNDO: 0 },
    stats: { merges: 0, combo: 0, top: 1, chain: 0 }, over: false, armed: null, undo: null };
  if (mode !== 'daily') { for (const k of Object.keys(P.inv)) { G.pu[k] += P.inv[k]; P.inv[k] = 0; } LS.set('player', P); }
  save();
}
const save = () => LS.set('game', G);
function applyResult(res) {
  G.grid = res.g; G.score += res.score; G.combo = res.combo;
  G.stats.merges += res.merges; G.stats.combo = Math.max(G.stats.combo, res.combo); G.stats.top = Math.max(G.stats.top, res.top); G.stats.chain = Math.max(G.stats.chain, res.waves);
  if (res.merges) { buzz(res.combo > 1 ? 30 : 15); unlock('first_merge'); }
  if (G.stats.combo >= 3) unlock('combo_3'); if (G.stats.combo >= 5) unlock('combo_5');
  if (G.stats.top >= 5) unlock('block_32'); if (G.stats.top >= 10) unlock('block_1024'); if (G.stats.chain >= 4) unlock('chain_4');
  while (G.nextReward && G.score >= G.nextReward) { const ks = ['BOMB', 'PAINT', 'SHUFFLE', 'UNDO']; const k = ks[Math.floor(Math.random() * 4)]; G.pu[k]++; toast(t('reward', ({ BOMB: '💣', PAINT: '🎨', SHUFFLE: '🔄', UNDO: '↩️' })[k], G.nextReward)); G.nextReward += 1000; sfx('reward'); }
  if (res.merges) sfx(res.combo > 1 ? 'combo' : 'merge');
  if (G.score >= 1000) unlock('score_1k'); if (G.score >= 10000) unlock('score_10k'); if (G.score >= 50000) unlock('score_50k');
}
function drop() {
  if (G.over || G.grid[0][G.col]) return;
  G.undo = JSON.stringify({ grid: G.grid, cur: G.cur, next: G.next, score: G.score, moves: G.moves, stats: G.stats });
  let r = H - 1; while (G.grid[r][G.col]) r--;
  const g = G.grid.map((x) => x.slice()); g[r][G.col] = G.cur;
  const res = settle(g); applyResult(res); buzz(8); sfx('drop');
  G.moves++; G.cur = G.next; G.next = genBlock(G.moves); G.col = Math.floor(W / 2);
  if (isFull(G.grid)) gameOver();
  save(); render();
}
function usePower(type, r, c) {
  if (!G.pu[type] || G.over) return;
  if (type === 'BOMB') { const g = G.grid.map((x) => x.slice()); for (let y = r - 1; y <= r + 1; y++) for (let x = c - 1; x <= c + 1; x++) if (y >= 0 && y < H && x >= 0 && x < W) g[y][x] = null; applyResult(settle(gravity(g))); buzz(40); }
  else if (type === 'PAINT') { const from = G.grid[r][c] && G.grid[r][c].l; if (!from) return; const to = Math.min(from + 1, MAXL); const g = G.grid.map((row) => row.map((b) => (b && b.l === from ? { l: to, bomb: b.bomb } : b))); applyResult(settle(g)); }
  else if (type === 'SHUFFLE') { const g = G.grid.map((x) => x.slice()); const col = []; for (let y = H - 2; y < H; y++) for (let x = 0; x < W; x++) { if (g[y][x]) col.push(g[y][x]); g[y][x] = null; }
    for (let i = col.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [col[i], col[j]] = [col[j], col[i]]; }
    let k = 0; for (let y = H - 1; y >= H - 2; y--) for (let x = 0; x < W; x++) if (k < col.length) g[y][x] = col[k++];
    applyResult(settle(gravity(g))); }
  else if (type === 'UNDO') { if (!G.undo) return; Object.assign(G, JSON.parse(G.undo)); G.undo = null; }
  G.pu[type]--; G.armed = null; save(); render();
}
function gameOver() {
  G.over = true; sfx('over');
  if (G.mode === 'daily') { P.daily[dayKey()] = Math.max(P.daily[dayKey()] || 0, G.score); }
  const today = Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);
  P.streak = P.lastDay === today ? P.streak : P.lastDay === today - 1 ? P.streak + 1 : 1; P.lastDay = today;
  G.newBest = G.score > P.highScore;
  P.highScore = Math.max(P.highScore, G.score); P.coins += Math.floor(G.score / 100); P.xp += Math.floor(G.score / 10); P.games++; P.merges += G.stats.merges;
  LS.set('player', P);
  scores.push({ s: G.score, at: Date.now(), top: G.stats.top, moves: G.moves }); scores.sort((a, b) => b.s - a.s); scores = scores.slice(0, 10); LS.set('scores', scores);
  if (P.games >= 10) unlock('games_10'); if (P.games >= 100) unlock('games_100'); if (P.streak >= 7) unlock('streak_7');
  buzz(60);
}

// ---------- Darstellung ----------
let screen = 'menu';
function go(s) { screen = s; render(); }
const blk = (b, extra = '') => (b ? `<div class="blk ${b.bomb ? 'bomb' : ''} ${extra}" style="background:${colorOf(b.l)}" aria-label="${b.bomb ? t('cd_block_special', 'BOMB', valOf(b.l)) : t('cd_block', valOf(b.l))}">${valOf(b.l)}</div>` : '');
const topBar = (title) => `<div class="top"><button class="back" data-go="menu" aria-label="${t('action_menu')}">←</button><h1>${title}</h1></div>`;
function vMenu() {
  return `<div class="menu"><p class="logo" aria-label="${t('cd_app_logo')}">${t('menu_title')}</p><p class="sub">${t('menu_subtitle')}</p>
  <button class="btn big" data-act="play">${t('action_play')}</button>
  <button class="btn out" data-act="daily">📅 ${t('daily')}${P.daily[dayKey()] ? ' · ' + t('daily_best', P.daily[dayKey()]) : ''}</button>
  <button class="btn out" data-go="shop">🛒 ${t('shop')} · ${t('coins', P.coins)}</button>
  <button class="btn out" data-go="leaderboard">${t('action_leaderboard')}</button><button class="btn out" data-go="achievements">${t('achievements_title')}</button>
  <button class="btn out" data-go="stats">${t('action_stats')}</button><button class="btn out" data-go="settings">${t('action_settings')}</button><button class="btn out" data-go="howto">${t('howto')}</button></div>`;
}
function vGame() {
  const g = G; const best = Math.max(P.highScore, g.score);
  let fall = ''; for (let c = 0; c < W; c++) fall += `<div class="cell" style="background:transparent">${c === g.col && !g.over ? blk(g.cur, 'prev') : ''}</div>`;
  let cells = ''; for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) cells += `<div class="cell" data-cell="${r},${c}">${blk(g.grid[r][c])}</div>`;
  const icons = { BOMB: '💣', PAINT: '🎨', SHUFFLE: '🔄', UNDO: '↩️' };
  return `<div class="game"><div style="display:flex;justify-content:space-between;align-items:center"><button class="back" data-act="pause" aria-label="${t('pause')}">⏸</button><small style="color:var(--muted)">${g.mode === 'daily' ? t('daily') : ''}</small></div><div class="hud"><div><small>${t('hud_score')}</small><b>${g.score}</b><div class="best">${t('hud_best', best)}</div></div>
    <div class="next"><small>${t('hud_next')}</small><div class="nextb">${blk(g.next, 'prev')}</div></div></div>
    <div class="combo">${g.combo > 1 ? t('hud_combo', g.combo) : ''}</div>
    <div class="field ${g.armed ? 'armed' : ''}"><div class="fall">${fall}</div><div class="grid">${cells}</div></div>
    <div class="pups">${Object.keys(icons).map((k) => `<button class="pup ${g.pu[k] ? '' : 'off'} ${g.armed === k ? 'arm' : ''}" data-pu="${k}" aria-label="${k} (${g.pu[k]})">${icons[k]} ${g.pu[k]}</button>`).join('')}</div>
    <div class="ctrl"><button data-mv="-1" aria-label="${t('cd_move_left')}">${t('action_move_left')}</button><button class="drop" data-act="drop" aria-label="${t('cd_drop')}">${t('action_drop')}</button><button data-mv="1" aria-label="${t('cd_move_right')}">${t('action_move_right')}</button></div></div>
    ${paused && !g.over ? `<div class="ov"><div class="card"><h2>${t('pause')}</h2><button class="btn big" data-act="resume">${t('resume')}</button><button class="btn out" data-act="restart">${t('restart')}</button><button class="btn out" data-go="menu">${t('action_menu')}</button></div></div>` : ''}${g.over ? `<div class="ov"><div class="card"><h2>${t('game_over_title')}</h2><p>${t('game_over_score', g.score)}</p>${g.newBest ? `<p class="nb">${t('game_over_new_best')}</p>` : `<p>${t('game_over_best', P.highScore)}</p>`}
      <button class="btn big" data-act="again">${t('action_play_again')}</button><button class="btn out" data-go="menu">${t('action_menu')}</button></div></div>` : ''}`;
}
function vLeader() {
  const loc = lang() === 'de' ? 'de-DE' : 'en-US';
  return `<div class="page">${topBar(t('leaderboard_title'))}${scores.length ? scores.map((s, i) => `<div class="row"><span>#${i + 1}&nbsp;&nbsp;<b>${s.s}</b></span><span class="note">${valOf(s.top)} · ${new Date(s.at).toLocaleDateString(loc)}</span></div>`).join('') : `<p class="note">${t('leaderboard_empty')}</p>`}</div>`;
}
function vAch() {
  const de = lang() === 'de'; const n = ACH.filter((a) => ach[a[0]]).length;
  return `<div class="page">${topBar(t('achievements_title'))}<p class="note">${t('achievements_progress', n, ACH.length)}</p>
    ${ACH.map((a) => `<div class="ach ${ach[a[0]] ? '' : 'lock'}" aria-label="${ach[a[0]] ? t('cd_unlocked') : t('cd_locked')}"><div class="ic">${ach[a[0]] ? a[1] : '🔒'}</div><div><b>${de ? a[4] : a[2]}</b><span>${de ? a[5] : a[3]}</span></div></div>`).join('')}</div>`;
}
function vStats() {
  const rows = [[t('stat_high_score'), P.highScore], [t('stat_level'), Math.floor(P.xp / 1000) + 1], [t('stat_coins'), P.coins], [t('stat_games'), P.games], [t('stat_streak'), P.streak], [t('stat_merges'), P.merges]];
  return `<div class="page">${topBar(t('stats_title'))}${rows.map(([a, b]) => `<div class="row"><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
}
function vSettings() {
  return `<div class="page">${topBar(t('settings_title'))}
    <div class="row" style="border:0"><span>${t('settings_haptics')}</span><button class="sw ${S.haptics ? 'on' : ''}" data-sw="haptics" role="switch" aria-checked="${S.haptics}" aria-label="${t('settings_haptics')}"></button></div>
    <div class="row" style="border:0"><span>${t('settings_reminder')}</span><button class="sw ${S.reminder ? 'on' : ''}" data-sw="reminder" role="switch" aria-checked="${S.reminder}" aria-label="${t('settings_reminder')}"></button></div>
    <p id="remnote" class="note"></p>
    <div class="row" style="border:0"><span>${t('settings_sound')}</span><button class="sw ${S.sound ? 'on' : ''}" data-sw="sound" role="switch" aria-checked="${S.sound}" aria-label="${t('settings_sound')}"></button></div>
    <h3 style="font-weight:500;margin:18px 0 6px">${t('settings_theme')}</h3>
    <div class="chips">${['system', 'light', 'dark'].map((k) => `<button class="chip ${S.theme === k ? 'on' : ''}" data-theme="${k}">${t('theme_' + k)}</button>`).join('')}</div>
    <button class="link" data-act="privacy">${t('settings_privacy_policy')}</button><p class="note">${t('version', VERSION)}</p></div>`;
}
function render() {
  applyTheme();
  const a = $('#app');
  a.innerHTML = ({ menu: vMenu, game: vGame, leaderboard: vLeader, achievements: vAch, stats: vStats, settings: vSettings, shop: vShop, howto: vHowto }[screen] || vMenu)();
  a.querySelectorAll('[data-go]').forEach((b) => b.onclick = () => go(b.dataset.go));
  const act = (n, f) => a.querySelectorAll(`[data-act="${n}"]`).forEach((b) => b.onclick = f);
  act('play', () => { if (!G || G.over || G.mode === 'daily') newGame(); go('game'); if (!S.howtoSeen) { S.howtoSeen = true; LS.set('settings', S); go('howto'); } });
  act('daily', () => { newGame('daily'); go('game'); });
  act('pause', () => { paused = true; render(); });
  act('resume', () => { paused = false; render(); });
  act('restart', () => { paused = false; newGame(G.mode); render(); });
  a.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => buy(b.dataset.buy));
  a.querySelectorAll('[data-skin]').forEach((b) => b.onclick = () => { S.skin = b.dataset.skin; LS.set('settings', S); render(); });
  act('again', () => { newGame(G.mode); render(); });
  act('drop', drop);
  act('privacy', () => { if (Browser) Browser.open({ url: PRIVACY_URL }); else window.open(PRIVACY_URL, '_blank'); });
  a.querySelectorAll('[data-mv]').forEach((b) => b.onclick = () => { if (G.over) return; G.col = Math.max(0, Math.min(W - 1, G.col + +b.dataset.mv)); buzz(5); save(); render(); });
  a.querySelectorAll('[data-pu]').forEach((b) => b.onclick = () => { const k = b.dataset.pu; if (!G.pu[k]) return; if (k === 'SHUFFLE' || k === 'UNDO') usePower(k); else { G.armed = G.armed === k ? null : k; render(); } });
  a.querySelectorAll('[data-cell]').forEach((el) => el.onclick = () => { const [r, c] = el.dataset.cell.split(',').map(Number); if (G.armed) usePower(G.armed, r, c); else { G.col = c; save(); render(); } });
  a.querySelectorAll('[data-theme]').forEach((b) => b.onclick = () => { S.theme = b.dataset.theme; LS.set('settings', S); render(); });
  a.querySelectorAll('[data-sw]').forEach((b) => b.onclick = () => toggle(b.dataset.sw));
  // Wischen auf dem Feld: links/rechts verschiebt, nach unten laesst fallen
  const f = $('.field'); if (f) { let sx = 0, sy = 0; f.ontouchstart = (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }; f.ontouchend = (e) => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (dy > 60 && Math.abs(dy) > Math.abs(dx)) drop(); }; }
}
async function toggle(k) {
  if (k === 'reminder') {
    const on = !S.reminder;
    if (on && Notif) { try { const p = await Notif.requestPermissions(); if (p.display !== 'granted') { $('#remnote').textContent = t('settings_reminder_permission_denied').replace(/Android/g, 'iOS'); return; } } catch (e) { return; } }
    S.reminder = on; LS.set('settings', S);
    if (Notif) { try { await Notif.cancel({ notifications: [{ id: 1 }] }); if (on) { const at = new Date(Date.now() + 24 * 3600000); await Notif.schedule({ notifications: [{ id: 1, title: t('reminder_title'), body: t('menu_title'), schedule: { on: { hour: at.getHours(), minute: at.getMinutes() }, allowWhileIdle: true } }] }); } } catch (e) {} }
  } else { S[k] = !S[k]; LS.set('settings', S); }
  render();
}
// Splash wie Android
document.body.insertAdjacentHTML('beforeend', `<div class="splash" id="splash"><p class="logo">${t('splash_title')}</p></div>`);
setTimeout(() => { const s = $('#splash'); s.style.opacity = '0'; setTimeout(() => s.remove(), 450); }, 900);
render();

// ---------- Update 1.0.1 ----------
let paused = false;
function toast(m) { let el = document.getElementById('toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 70px);transform:translateX(-50%);background:var(--primary);color:#fff;padding:10px 18px;border-radius:999px;font-weight:700;z-index:80;transition:opacity .3s'; document.body.appendChild(el); } el.textContent = m; el.style.opacity = '1'; clearTimeout(toast.t); toast.t = setTimeout(() => { el.style.opacity = '0'; }, 1800); }
let AC = null;
function sfx(kind) {
  if (!S.sound) return;
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(); const now = AC.currentTime;
    const F = { drop: [220, 0.06], merge: [523, 0.12], combo: [784, 0.18], reward: [988, 0.25], over: [147, 0.5] }[kind] || [440, 0.1];
    o.type = kind === 'over' ? 'sawtooth' : 'triangle'; o.frequency.setValueAtTime(F[0], now); if (kind !== 'drop') o.frequency.exponentialRampToValueAtTime(F[0] * (kind === 'over' ? 0.5 : 1.5), now + F[1]);
    g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + F[1]); o.connect(g); g.connect(AC.destination); o.start(now); o.stop(now + F[1] + 0.02);
  } catch (e) {}
}
function buy(id) {
  const [kind, k] = id.split(':'); const price = kind === 'pu' ? PU_PRICE[k] : SKIN_PRICE[k];
  if (P.coins < price) { toast(t('not_enough')); return; }
  P.coins -= price; if (kind === 'pu') P.inv[k]++; else { P.skins.push(k); S.skin = k; LS.set('settings', S); }
  LS.set('player', P); sfx('reward'); buzz(20); render();
}
function vShop() {
  const icons = { BOMB: '💣', PAINT: '🎨', SHUFFLE: '🔄', UNDO: '↩️' };
  return `<div class="page">${topBar(t('shop'))}<p class="note">${t('shop_note')}</p><p><b>${t('coins', P.coins)}</b></p>
    <h3 style="font-weight:600">${t('powerups')}</h3><p class="note">${t('inv_note')}</p>
    ${Object.keys(icons).map((k) => `<div class="row"><span>${icons[k]} × ${P.inv[k]}</span><button class="chip" data-buy="pu:${k}">${t('buy')} · ${PU_PRICE[k]} 🪙</button></div>`).join('')}
    <h3 style="font-weight:600;margin-top:22px">${t('skins')}</h3>
    ${Object.keys(SKINS).map((k) => `<div class="row"><span style="display:flex;gap:3px">${SKINS[k].slice(0, 5).map((c) => `<i style="display:inline-block;width:18px;height:18px;border-radius:4px;background:${c}"></i>`).join('')}&nbsp; ${k[0].toUpperCase() + k.slice(1)}</span>
      ${P.skins.includes(k) ? (S.skin === k ? `<span class="note">${t('in_use')}</span>` : `<button class="chip" data-skin="${k}">${t('use')}</button>`) : `<button class="chip" data-buy="skin:${k}">${t('buy')} · ${SKIN_PRICE[k]} 🪙</button>`}</div>`).join('')}</div>`;
}
function vHowto() { return `<div class="page">${topBar(t('howto'))}${t('howto_text').split('\n\n').map((p) => `<p style="line-height:1.5">${p}</p>`).join('')}<button class="btn big" data-act="play">${t('action_play')}</button></div>`; }
