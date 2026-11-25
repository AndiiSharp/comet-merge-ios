// Comet-Merge-Rundgang: Anleitung, Spiel mit Verschmelzungen, Pause, Shop, Tages-Challenge.
(function () {
  const D = window.DEMO;
  // beste Spalte: moeglichst viele gleiche Nachbarn an der Landestelle
  const best = () => {
    let bc = 3, bs = -1;
    for (let c = 0; c < W; c++) {
      let r = -1; for (let y = H - 1; y >= 0; y--) if (!G.grid[y][c]) { r = y; break; }
      if (r < 1) continue;
      let s = 0; const l = G.cur.l;
      for (const [dy, dx] of [[1, 0], [0, 1], [0, -1]]) { const b = G.grid[r + dy] && G.grid[r + dy][c + dx]; if (b && b.l === l) s += 3; }
      s += r * 0.2 + Math.random() * 0.5;
      if (s > bs) { bs = s; bc = c; }
    }
    return bc;
  };
  const turn = (useCell) => async () => {
    if (!G || G.over || !document.querySelector('[data-act=drop]')) return;
    const c = best();
    if (useCell) { const r = H - 1; await D.tap(`[data-cell="${r},${c}"]`, { after: 350 }); }
    else { let n = c - G.col; while (n !== 0) { await D.tap(`[data-mv="${n > 0 ? 1 : -1}"]`, { after: 250 }); n += n > 0 ? -1 : 1; } }
    await D.tap('[data-act=drop]', { after: 1300 });
  };
  const turns = (n, startCell) => Array.from({ length: n }, (_, i) => turn((i + startCell) % 3 === 0));
  D.run([
    () => D.wait(1500),
    () => D.tap('[data-go=howto]', { after: 1800 }),
    () => D.scroll(450), () => D.scroll(-450),
    () => D.tap('[data-go=menu]', { after: 1200 }),
    () => D.tap('[data-act=play]', { after: 1500 }),
    async () => { if (!document.querySelector('[data-act=drop]')) await D.tap('[data-act=play]', { after: 1500 }); },
    ...turns(14, 1),
    () => D.tap('[data-act=pause]', { after: 1800 }),
    () => D.tap('[data-act=resume]', { after: 1000 }),
    ...turns(14, 0),
    () => D.tap('[data-act=pause]', { after: 1500 }),
    () => D.tap('[data-go=menu]', { after: 1500 }),
    () => D.tap('[data-go=shop]', { after: 1800 }),
    () => D.scroll(450), () => D.scroll(-450),
    () => D.tap('[data-go=menu]', { after: 1200 }),
    () => D.tap('[data-act=daily]', { after: 1500 }),
    ...turns(5, 2),
    () => D.tap('[data-act=pause]', { after: 1500 }),
    () => D.tap('[data-go=menu]', { after: 1500 }),
    () => D.tap('[data-go=stats]', { after: 2000 }),
    () => D.tap('[data-go=menu]', { after: 2000 }),
  ]);
})();
