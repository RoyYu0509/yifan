import { H, W, clamp, ditherSky, layer, makeRng, type Layer, type Scene } from './common';

// work：雨夜的城市。两块相对的霓虹，高架上的车灯，
// 地下入口里偶尔亮起的一对眼睛 —— 那是通往另一面的入口 (见 Base.astro 的 .portal)。
const GROUND = 150;
const PAD = 14;

const GLYPH: Record<string, string[]> = {
  S: ['111', '100', '111', '001', '111'],
  Y: ['101', '101', '010', '010', '010'],
  T: ['111', '010', '010', '010', '010'],
  E: ['111', '100', '110', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  F: ['111', '100', '110', '100', '100'],
  A: ['010', '101', '111', '101', '101'],
  C: ['011', '100', '100', '100', '011'],
  O: ['111', '101', '101', '101', '111'],
  R: ['110', '101', '110', '101', '101'],
};

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number) {
  let cx = x;
  for (const ch of s) {
    const g = GLYPH[ch];
    if (g) g.forEach((row, r) => { for (let c = 0; c < 3; c++) if (row[c] === '1') ctx.fillRect(cx + c, y + r, 1, 1); });
    cx += 4;
  }
}

interface Win { x: number; y: number; c: string; ph: number; flick: boolean }

export function createWorkScene(): Scene {
  const rnd = makeRng(1985);
  const LW = W + PAD * 2;

  const sky = layer();
  ditherSky(sky.x, [[0, '#02050a'], [0.45, '#07141c'], [0.8, '#12303a'], [1, '#3a2c48']], GROUND);

  const WINC = ['#f0e6a0', '#9fe8e0', '#ffffff', '#ffd9a0', '#f0e6a0'];
  const tops: { x: number; y: number }[] = [];

  function skyline(color: string, base: number, hMin: number, hMax: number, wMin: number, wMax: number, winP: number, collectTops = false) {
    const l: Layer = layer(LW, H);
    const wins: Win[] = [];
    let x = -4;
    while (x < LW) {
      const w = Math.round(wMin + rnd() * (wMax - wMin));
      const h = Math.round(hMin + rnd() * (hMax - hMin));
      l.x.fillStyle = color;
      l.x.fillRect(x, base - h, w, h + 40);
      if (rnd() > 0.7) l.x.fillRect(x + (w >> 1), base - h - 4 - ((rnd() * 6) | 0), 1, 8); // antenna
      if (collectTops && h > hMax * 0.75) tops.push({ x: x + (w >> 1), y: base - h - 1 });
      for (let wx = x + 2; wx < x + w - 2; wx += 3) {
        for (let wy = base - h + 3; wy < base - 2; wy += 4) {
          if (rnd() < winP) {
            const c = WINC[(rnd() * WINC.length) | 0];
            l.x.globalAlpha = 0.55 + rnd() * 0.4;
            l.x.fillStyle = c;
            l.x.fillRect(wx, wy, 2, 2);
            l.x.globalAlpha = 1;
            wins.push({ x: wx, y: wy, c, ph: rnd() * 10, flick: rnd() < 0.07 });
          }
        }
      }
      x += w + (rnd() > 0.6 ? 1 : 0);
    }
    return { l, wins };
  }

  const farSky = skyline('#0a1a24', GROUND - 28, 24, 78, 10, 24, 0.12);
  const midSky = skyline('#071119', GROUND - 14, 20, 62, 12, 28, 0.2, true);
  const nearSky = skyline('#03080c', GROUND, 8, 34, 16, 34, 0.22);

  // ---- 地面 ----
  const ground = layer();
  for (let y = GROUND; y < H; y++) {
    const t = (y - GROUND) / (H - GROUND);
    ground.x.fillStyle = `rgb(${6 - t * 4 | 0},${12 - t * 8 | 0},${16 - t * 10 | 0})`;
    ground.x.fillRect(0, y, W, 1);
  }
  // 高架
  ground.x.fillStyle = '#04090d';
  ground.x.fillRect(0, GROUND - 16, W, 3);
  for (let x = 6; x < W; x += 34) ground.x.fillRect(x, GROUND - 13, 3, 13);

  // 地下通道的入口：带雨棚的台阶，一路往下 (点击这里进入另一面)
  const tunnel = { x: 146, y: GROUND + 2, w: 34, h: 22 };
  {
    const g = ground.x;
    g.fillStyle = '#0a141b'; // 立柱
    g.fillRect(tunnel.x - 2, tunnel.y - 3, 2, tunnel.h + 3);
    g.fillRect(tunnel.x + tunnel.w, tunnel.y - 3, 2, tunnel.h + 3);
    g.fillStyle = '#0d1a22'; // 雨棚
    g.fillRect(tunnel.x - 3, tunnel.y - 7, tunnel.w + 6, 4);
    g.fillStyle = '#1a2e39';
    g.fillRect(tunnel.x - 3, tunnel.y - 7, tunnel.w + 6, 1);
    g.fillStyle = '#010203'; // 开口
    g.fillRect(tunnel.x, tunnel.y - 3, tunnel.w, tunnel.h + 3);
    for (let i = 0; i < 6; i++) { // 台阶：越往下越窄、越暗
      g.fillStyle = i % 2 ? '#0b161d' : '#122029';
      g.fillRect(tunnel.x + 2 + i * 2, tunnel.y + 6 + i * 2, tunnel.w - 4 - i * 4, 1);
    }
    g.fillStyle = '#1d3340'; // 扶手
    g.fillRect(tunnel.x + 1, tunnel.y - 2, 1, 11);
    g.fillRect(tunnel.x + tunnel.w - 2, tunnel.y - 2, 1, 11);
    g.fillStyle = '#12202a';
    g.fillRect(tunnel.x - 3, tunnel.y + tunnel.h, tunnel.w + 6, 1);
  }
  // 入口上方的向下箭头 (5×6)
  const ARROW = ['..X..', '..X..', '..X..', 'X.X.X', '.XXX.', '..X..'];

  const signs = [
    { s: 'SYSTEM', x: 208, y: 70, c: '#5ff0d0', ph: 0 },
    { s: 'FACTORY', x: 136, y: 108, c: '#ffb86b', ph: 3 },
  ];

  const drops = Array.from({ length: 150 }, () => ({ x: rnd() * (W + 40), y: rnd() * H, v: 90 + rnd() * 70, l: 3 + ((rnd() * 3) | 0) }));
  const cars = Array.from({ length: 6 }, () => ({ x: rnd() * W, v: (rnd() > 0.5 ? 1 : -1) * (18 + rnd() * 30), red: rnd() > 0.5 }));
    let eyesUntil = 0;
  let nextEyes = 3;

  return {
    draw(ctx, t, dt, mx, my, { reduce, calm, hot }) {
      ctx.drawImage(sky.c, 0, 0);

      const par = (k: number) => Math.round(-PAD - mx * k);
      ctx.drawImage(farSky.l.c, par(3), Math.round(-my));
      ctx.drawImage(midSky.l.c, par(6), Math.round(-my * 2));

      // 红色航空灯
      const blink = Math.floor(t * 0.9) % 2 === 0;
      if (blink || reduce) {
        ctx.fillStyle = '#ff3b3b';
        for (const p of tops) ctx.fillRect(Math.round(p.x - PAD - mx * 6), Math.round(p.y - my * 2), 1, 1);
      }

      // 霓虹
      for (const sg of signs) {
        const on = reduce || Math.sin(t * 7 + sg.ph) > -0.85;
        const x = Math.round(sg.x - mx * 6);
        const y = Math.round(sg.y - my * 2);
        const w = sg.s.length * 4 + 3;
        ctx.fillStyle = '#04090d';
        ctx.fillRect(x - 2, y - 2, w + 1, 10);
        ctx.fillStyle = sg.c;
        ctx.globalAlpha = calm ? 0.06 : on ? 0.18 : 0.05;
        ctx.fillRect(x - 5, y - 5, w + 7, 16);
        ctx.globalAlpha = on ? 1 : 0.25;
        text(ctx, sg.s, x, y);
        ctx.globalAlpha = 1;
      }

      ctx.drawImage(nearSky.l.c, par(10), Math.round(-my * 3));

      // 窗子偶尔熄灭
      if (!reduce) {
        for (const sl of [midSky, nearSky]) {
          const k = sl === midSky ? 6 : 10;
          const base = sl === midSky ? 2 : 3;
          for (const w of sl.wins) {
            if (!w.flick) continue;
            if (Math.sin(t * 0.7 + w.ph) > 0.2) {
              ctx.fillStyle = '#03080c';
              ctx.fillRect(Math.round(w.x - PAD - mx * k), Math.round(w.y - my * base), 2, 2);
            }
          }
        }
      }

      ctx.drawImage(ground.c, 0, 0);

      // 高架上的车灯
      for (const c of cars) {
        if (!reduce) { c.x += c.v * dt; if (c.x > W + 8) c.x = -8; if (c.x < -8) c.x = W + 8; }
        const y = GROUND - 17;
        ctx.fillStyle = c.v > 0 ? '#ffe9b0' : '#ff4a4a';
        ctx.fillRect(Math.round(c.x), y, 2, 1);
        ctx.fillStyle = c.v > 0 ? 'rgba(255,233,176,0.25)' : 'rgba(255,74,74,0.25)';
        ctx.fillRect(Math.round(c.x) - (c.v > 0 ? 5 : -2), y, 5, 1);
      }

      // 湿地面的倒影
      for (const sg of signs) {
        const cx = Math.round(sg.x + (sg.s.length * 4) / 2 - mx * 6);
        ctx.fillStyle = sg.c;
        for (let i = 0; i < 26; i += 2) {
          const y = GROUND + 4 + i;
          ctx.globalAlpha = 0.12 * (1 - i / 26);
          const w = sg.s.length * 4;
          ctx.fillRect(cx - (w >> 1) + Math.round(Math.sin(t * 1.5 + i * 0.5)), y, w, 1);
        }
      }
      ctx.globalAlpha = 1;

      // 入口：上方一支向下的箭头缓慢呼吸，靠近时变亮；里面偶尔有一对眼睛
      {
        if (t > nextEyes) { eyesUntil = t + 0.5 + rnd() * 1.2; nextEyes = t + 8 + rnd() * 8; }
        const show = hot || (!reduce && t < eyesUntil);
        const pulse = reduce ? 0.5 : 0.35 + 0.25 * Math.sin(t * 1.6);
        ctx.fillStyle = `rgba(255,207,112,${hot ? 0.95 : pulse})`;
        const ax = tunnel.x + (tunnel.w >> 1) - 2, ay = tunnel.y - 17 + (hot ? Math.round(Math.sin(t * 6)) : 0);
        ARROW.forEach((row, ry) => { for (let rx = 0; rx < 5; rx++) if (row[rx] === 'X') ctx.fillRect(ax + rx, ay + ry, 1, 1); });
        ctx.fillStyle = hot ? 'rgba(95,240,208,0.6)' : 'rgba(95,240,208,0.2)';
        ctx.fillRect(tunnel.x + (tunnel.w >> 1) - 2, tunnel.y - 5, 5, 1); // 雨棚下的灯
        if (show) {
          ctx.fillStyle = '#ffcf70';
          const ex = tunnel.x + 10 + (hot ? 0 : (t * 3) % 2 < 1 ? 0 : 6);
          ctx.fillRect(ex, tunnel.y + 4, 2, 1);
          ctx.fillRect(ex + 5, tunnel.y + 4, 2, 1);
          ctx.fillStyle = 'rgba(255,207,112,0.16)';
          ctx.fillRect(ex - 1, tunnel.y + 3, 9, 3);
        }
      }

      // 雨
      {
        ctx.fillStyle = 'rgba(160,210,220,0.32)';
        for (const d of drops) {
          if (!reduce) {
            d.y += d.v * dt;
            d.x -= d.v * 0.18 * dt;
            if (d.y > H) { d.y = -4; d.x = rnd() * (W + 40); }
            if (d.x < -4) d.x += W + 40;
          }
          for (let i = 0; i < d.l; i++) ctx.fillRect((d.x - i * 0.2) | 0, (d.y + i) | 0, 1, 1);
          if (!reduce && d.y > GROUND + 4 && d.y < GROUND + 5.5) ctx.fillRect(((d.x) | 0) - 1, d.y | 0, 3, 1);
        }
      }

    },
  };
}
