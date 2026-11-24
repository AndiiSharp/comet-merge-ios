// Comet Merge 1.0.1: Belohnungen, Shop, Skins, Tagesherausforderung, Toene, Anleitung, Pause.
import fs from 'node:fs';
const f = 'www/app.js'; let s = fs.readFileSync(f, 'utf8'); let n = 0;
const R = (a, b) => { if (!s.includes(a)) { console.log('FEHLT:', a.slice(0, 80)); return; } s = s.replace(a, b); n++; };
R("const W = 7, H = 7, MAXL = 12;", `const W = 7, H = 7, MAXL = 12;
const VERSION = '1.0.1';
Object.assign(STR.en, { daily: 'DAILY CHALLENGE', daily_best: 'Today’s best %1$d', shop: 'Shop', shop_note: 'Spend your coins on power-ups for your next game or on new block styles.', buy: 'Buy', owned: 'Owned', use: 'Use', in_use: 'In use', not_enough: 'Not enough coins.', skins: 'Block styles', powerups: 'Power-ups', inv_note: 'Bought power-ups are added at the start of your next game.', reward: '+1 %1$s for %2$d points!', howto: 'How to play', howto_text: 'Move the falling block with ◀ ▶ or tap a column, then DROP.\\n\\nThree or more touching blocks with the same number merge into one block with double the value.\\n\\nMerges can trigger chain reactions – each wave raises the COMBO multiplier.\\n\\nFour blocks at once create a special block, five or more also clear the whole row.\\n\\nEvery 1,000 points you earn a random power-up. 💣 clears 3×3 blocks, 🎨 upgrades all blocks of one number, 🔄 shuffles the bottom two rows, ↩️ takes back your last drop.\\n\\nThe game ends when a column is full to the top.', pause: 'Paused', resume: 'Resume', restart: 'Restart', settings_sound: 'Sound effects', version: 'Version %1$s', coins: '%1$d coins' });
Object.assign(STR.de, { daily: 'TAGES-CHALLENGE', daily_best: 'Heute bester %1$d', shop: 'Shop', shop_note: 'Gib Münzen für Power-ups für dein nächstes Spiel oder für neue Block-Designs aus.', buy: 'Kaufen', owned: 'Gekauft', use: 'Verwenden', in_use: 'Aktiv', not_enough: 'Nicht genug Münzen.', skins: 'Block-Designs', powerups: 'Power-ups', inv_note: 'Gekaufte Power-ups kommen zu Beginn deines nächsten Spiels dazu.', reward: '+1 %1$s für %2$d Punkte!', howto: 'So wird gespielt', howto_text: 'Bewege den fallenden Block mit ◀ ▶ oder tippe eine Spalte an, dann ABLEGEN.\\n\\nDrei oder mehr sich berührende Blöcke mit gleicher Zahl verschmelzen zu einem Block mit doppeltem Wert.\\n\\nMerges können Kettenreaktionen auslösen – jede Welle erhöht den COMBO-Multiplikator.\\n\\nVier Blöcke auf einmal ergeben einen Spezialblock, fünf oder mehr räumen zusätzlich die ganze Reihe.\\n\\nAlle 1.000 Punkte bekommst du ein zufälliges Power-up. 💣 räumt 3×3 Blöcke, 🎨 wertet alle Blöcke einer Zahl auf, 🔄 mischt die unteren zwei Reihen, ↩️ nimmt den letzten Zug zurück.\\n\\nDas Spiel endet, wenn eine Spalte bis oben voll ist.', pause: 'Pause', resume: 'Weiter', restart: 'Neu starten', settings_sound: 'Soundeffekte', version: 'Version %1$s', coins: '%1$d Münzen' });
const SKINS = { classic: ['#FF5252', '#448AFF', '#69F0AE', '#FFD740', '#B388FF', '#40C4FF', '#FFAB40'], neon: ['#FF2E88', '#00E5FF', '#76FF03', '#FFEA00', '#D500F9', '#2979FF', '#FF9100'], pastel: ['#F4A6A6', '#A6C8F4', '#B5E8C8', '#F7E1A1', '#D2B8F2', '#A8E3EC', '#F8C9A0'], ocean: ['#0077B6', '#00B4D8', '#48CAE4', '#023E8A', '#90E0EF', '#03045E', '#0096C7'], sunset: ['#FF6B6B', '#FF8E53', '#FFC75F', '#F9F871', '#C34A36', '#845EC2', '#D65DB1'] };
const SKIN_PRICE = { classic: 0, neon: 150, pastel: 150, ocean: 250, sunset: 400 };
const PU_PRICE = { BOMB: 60, PAINT: 90, SHUFFLE: 40, UNDO: 70 };
let rngSeed = null; function rng() { if (rngSeed == null) return Math.random(); rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff; return rngSeed / 0x80000000; }
const dayKey = () => new Date().toISOString().slice(0, 10);`);
R("let S = Object.assign({ haptics: true, reminder: false, theme: 'system' }", "let S = Object.assign({ haptics: true, reminder: false, theme: 'system', sound: true, skin: 'classic', howtoSeen: false }");
R("let P = Object.assign({ coins: 0, xp: 0, highScore: 0, streak: 0, lastDay: -1, games: 0, merges: 0 }", "let P = Object.assign({ coins: 0, xp: 0, highScore: 0, streak: 0, lastDay: -1, games: 0, merges: 0, inv: { BOMB: 0, PAINT: 0, SHUFFLE: 0, UNDO: 0 }, skins: ['classic'], daily: {} }");
R("const colorOf = (l) => COLORS[(l - 1) % COLORS.length];", "const colorOf = (l) => (SKINS[S.skin] || COLORS)[(l - 1) % 7];");
R("let roll = Math.floor(Math.random() * w.reduce", "let roll = Math.floor(rng() * w.reduce");
R("const j = Math.floor(Math.random() * (i + 1));", "const j = Math.floor(rng() * (i + 1));");
R(`function newGame() {
  G = {`, `function newGame(mode = 'classic') {
  rngSeed = mode === 'daily' ? parseInt(dayKey().replace(/-/g, ''), 10) : null;
  G = { mode, nextReward: 1000,`);
R("stats: { merges: 0, combo: 0, top: 1, chain: 0 }, over: false, armed: null, undo: null };\n  save();", `stats: { merges: 0, combo: 0, top: 1, chain: 0 }, over: false, armed: null, undo: null };
  if (mode !== 'daily') { for (const k of Object.keys(P.inv)) { G.pu[k] += P.inv[k]; P.inv[k] = 0; } LS.set('player', P); }
  save();`);
R("if (G.score >= 1000) unlock('score_1k');", `while (G.nextReward && G.score >= G.nextReward) { const ks = ['BOMB', 'PAINT', 'SHUFFLE', 'UNDO']; const k = ks[Math.floor(Math.random() * 4)]; G.pu[k]++; toast(t('reward', ({ BOMB: '💣', PAINT: '🎨', SHUFFLE: '🔄', UNDO: '↩️' })[k], G.nextReward)); G.nextReward += 1000; sfx('reward'); }
  if (res.merges) sfx(res.combo > 1 ? 'combo' : 'merge');
  if (G.score >= 1000) unlock('score_1k');`);
R("const res = settle(g); applyResult(res); buzz(8);", "const res = settle(g); applyResult(res); buzz(8); sfx('drop');");
R("function gameOver() {\n  G.over = true;", "function gameOver() {\n  G.over = true; sfx('over');\n  if (G.mode === 'daily') { P.daily[dayKey()] = Math.max(P.daily[dayKey()] || 0, G.score); }");
// Menue
R("<button class=\"btn big\" data-act=\"play\">${t('action_play')}</button>", `<button class="btn big" data-act="play">\${t('action_play')}</button>
  <button class="btn out" data-act="daily">📅 \${t('daily')}\${P.daily[dayKey()] ? ' · ' + t('daily_best', P.daily[dayKey()]) : ''}</button>
  <button class="btn out" data-go="shop">🛒 \${t('shop')} · \${t('coins', P.coins)}</button>`);
R("<button class=\"btn out\" data-go=\"settings\">${t('action_settings')}</button></div>`;", "<button class=\"btn out\" data-go=\"settings\">${t('action_settings')}</button><button class=\"btn out\" data-go=\"howto\">${t('howto')}</button></div>`;");
R("leaderboard: vLeader, achievements: vAch, stats: vStats, settings: vSettings }", "leaderboard: vLeader, achievements: vAch, stats: vStats, settings: vSettings, shop: vShop, howto: vHowto }");
R("act('play', () => { if (!G || G.over) newGame(); go('game'); });", `act('play', () => { if (!G || G.over || G.mode === 'daily') newGame(); go('game'); if (!S.howtoSeen) { S.howtoSeen = true; LS.set('settings', S); go('howto'); } });
  act('daily', () => { newGame('daily'); go('game'); });
  act('pause', () => { paused = true; render(); });
  act('resume', () => { paused = false; render(); });
  act('restart', () => { paused = false; newGame(G.mode); render(); });
  a.querySelectorAll('[data-buy]').forEach((b) => b.onclick = () => buy(b.dataset.buy));
  a.querySelectorAll('[data-skin]').forEach((b) => b.onclick = () => { S.skin = b.dataset.skin; LS.set('settings', S); render(); });`);
R("act('again', () => { newGame(); render(); });", "act('again', () => { newGame(G.mode); render(); });");
// Spielbildschirm: Pause-Knopf
R("return `<div class=\"game\"><div class=\"hud\">", "return `<div class=\"game\"><div style=\"display:flex;justify-content:space-between;align-items:center\"><button class=\"back\" data-act=\"pause\" aria-label=\"${t('pause')}\">⏸</button><small style=\"color:var(--muted)\">${g.mode === 'daily' ? t('daily') : ''}</small></div><div class=\"hud\">");
R("${g.over ? `<div class=\"ov\">", "${paused && !g.over ? `<div class=\"ov\"><div class=\"card\"><h2>${t('pause')}</h2><button class=\"btn big\" data-act=\"resume\">${t('resume')}</button><button class=\"btn out\" data-act=\"restart\">${t('restart')}</button><button class=\"btn out\" data-go=\"menu\">${t('action_menu')}</button></div></div>` : ''}${g.over ? `<div class=\"ov\">");
// Einstellungen: Ton + Version
R("<p id=\"remnote\" class=\"note\"></p>", "<p id=\"remnote\" class=\"note\"></p>\n    <div class=\"row\" style=\"border:0\"><span>${t('settings_sound')}</span><button class=\"sw ${S.sound ? 'on' : ''}\" data-sw=\"sound\" role=\"switch\" aria-checked=\"${S.sound}\" aria-label=\"${t('settings_sound')}\"></button></div>");
R("<button class=\"link\" data-act=\"privacy\">${t('settings_privacy_policy')}</button></div>`;", "<button class=\"link\" data-act=\"privacy\">${t('settings_privacy_policy')}</button><p class=\"note\">${t('version', VERSION)}</p></div>`;");
s += `
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
  return \`<div class="page">\${topBar(t('shop'))}<p class="note">\${t('shop_note')}</p><p><b>\${t('coins', P.coins)}</b></p>
    <h3 style="font-weight:600">\${t('powerups')}</h3><p class="note">\${t('inv_note')}</p>
    \${Object.keys(icons).map((k) => \`<div class="row"><span>\${icons[k]} × \${P.inv[k]}</span><button class="chip" data-buy="pu:\${k}">\${t('buy')} · \${PU_PRICE[k]} 🪙</button></div>\`).join('')}
    <h3 style="font-weight:600;margin-top:22px">\${t('skins')}</h3>
    \${Object.keys(SKINS).map((k) => \`<div class="row"><span style="display:flex;gap:3px">\${SKINS[k].slice(0, 5).map((c) => \`<i style="display:inline-block;width:18px;height:18px;border-radius:4px;background:\${c}"></i>\`).join('')}&nbsp; \${k[0].toUpperCase() + k.slice(1)}</span>
      \${P.skins.includes(k) ? (S.skin === k ? \`<span class="note">\${t('in_use')}</span>\` : \`<button class="chip" data-skin="\${k}">\${t('use')}</button>\`) : \`<button class="chip" data-buy="skin:\${k}">\${t('buy')} · \${SKIN_PRICE[k]} 🪙</button>\`}</div>\`).join('')}</div>\`;
}
function vHowto() { return \`<div class="page">\${topBar(t('howto'))}\${t('howto_text').split('\\n\\n').map((p) => \`<p style="line-height:1.5">\${p}</p>\`).join('')}<button class="btn big" data-act="play">\${t('action_play')}</button></div>\`; }
`;
fs.writeFileSync(f, s); console.log('Ersetzungen:', n);
