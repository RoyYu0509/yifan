import { H, W, clamp, ditherSky, layer, makeRng, mix, type Scene } from './common';
import { createHerd } from './unicorn';

// off：高墙环绕的小镇，没有指针的钟楼，田野里的独角兽。
// 田野里的小池塘是回到 work 的入口 (见 Base.astro 的 .portal)。
const HORIZON = 108;
const GATE_X = 140;
const POOL = { cx: 192, cy: 154, rx: 23, ry: 7 };
const PAD = 12; // 远景层左右各多画一截，视差移动时不露边

export function createOffScene(): Scene {
  const rnd = makeRng(20260509);

  const sky = layer();
  ditherSky(sky.x, [[0, '#04050b'], [0.5, '#141a33'], [0.85, '#3a2f4a'], [1, '#8a5a52']], HORIZON + 4);

  // ---- 远景：山 / 墙 / 钟楼 / 门 ----
  const far = layer(W + PAD * 2, H);
  const wallTop = HORIZON - 16;
  const towerX = 214 + PAD;
  {
    const x = far.x;
    x.fillStyle = '#12162a';
    for (let i = 0; i < W + PAD * 2; i++) {
      const h = 14 + Math.sin(i * 0.035) * 6 + Math.sin(i * 0.11 + 1) * 3;
      x.fillRect(i, HORIZON - h, 1, h + 2);
    }
    // 墙后的屋顶剪影
    x.fillStyle = '#0a0c1a';
    for (const [rx, rw, rh] of [[80, 18, 9], [100, 14, 12], [118, 20, 8], [148, 16, 10], [166, 22, 7], [262, 18, 11], [284, 22, 8]]) {
      x.fillRect(rx + PAD, wallTop - rh, rw, rh + 2);
      for (let k = 0; k < Math.floor(rh / 2); k++) x.fillRect(rx + PAD + k, wallTop - rh - k - 1, rw - k * 2, 1);
    }
    // 城墙 + 垛口 + 砖缝
    x.fillStyle = '#0d1020';
    x.fillRect(0, wallTop, W + PAD * 2, 24);
    for (let i = 0; i < W + PAD * 2; i += 6) x.fillRect(i, wallTop - 3, 3, 3);
    x.fillStyle = '#171b30';
    for (let r = 0; r < 4; r++) for (let i = (r % 2) * 4; i < W + PAD * 2; i += 8) x.fillRect(i, wallTop + 3 + r * 4, 7, 1);
    // 城门
    x.fillStyle = '#05060b';
    x.fillRect(GATE_X + PAD, wallTop + 6, 14, 18);
    x.fillRect(GATE_X + 2 + PAD, wallTop + 3, 10, 3);
    x.fillStyle = '#2a2236';
    x.fillRect(GATE_X + 6 + PAD, wallTop + 6, 1, 18);
    // 门卫的剪影
    x.fillStyle = '#05060b';
    x.fillRect(GATE_X + 18 + PAD, wallTop + 16, 3, 8);
    x.fillRect(GATE_X + 17 + PAD, wallTop + 18, 5, 4);
    // 钟楼：只有钟面，没有指针
    const tx = towerX;
    x.fillStyle = '#0a0c1a';
    x.fillRect(tx, wallTop - 48, 14, 52);
    x.fillRect(tx - 2, wallTop - 52, 18, 5);
    x.fillRect(tx + 2, wallTop - 62, 10, 10);
    x.fillRect(tx + 5, wallTop - 70, 4, 8);
    x.fillRect(tx + 6, wallTop - 74, 2, 4);
    // 钟面：一圈圆环 + 12/3/6/9 四个刻度，没有指针
    const RING = [
      '...XXXXX...', '..X.....X..', '.X.......X.', 'X.........X', 'X.........X', 'X.........X',
      'X.........X', 'X.........X', '.X.......X.', '..X.....X..', '...XXXXX...',
    ];
    const cx0 = tx + 1, cy0 = wallTop - 41;
    x.fillStyle = '#5a5848';
    RING.forEach((row, ry) => { for (let rx = 0; rx < 11; rx++) if (row[rx] === 'X') x.fillRect(cx0 + rx, cy0 + ry, 1, 1); });
    x.fillStyle = '#a39e80';
    for (const [rx, ry] of [[5, 1], [5, 9], [1, 5], [9, 5]]) x.fillRect(cx0 + rx, cy0 + ry, 1, 1);
    // 窗光
    x.fillStyle = '#e0b857';
    for (const [wx, wy] of [[22, 0], [28, 0], [34, 3], [100, 0], [186, 2], [236, -2], [242, -2]]) x.fillRect(wx + PAD, wallTop + wy, 2, 3);
    x.fillStyle = '#c99a42';
    x.fillRect(tx + 6, wallTop - 17, 2, 4);
  }

  // ---- 田野 ----
  const field = layer();
  for (let y = HORIZON; y < H; y++) {
    const t = (y - HORIZON) / (H - HORIZON);
    field.x.fillStyle = mix('#2b2312', '#080705', Math.pow(t, 0.7));
    field.x.fillRect(0, y, W, 1);
  }
  field.x.fillStyle = '#1d2744';
  for (let i = 0; i < W; i++) field.x.fillRect(i, (HORIZON + 8 + Math.sin(i * 0.02) * 3) | 0, 1, 2);

  const stars = Array.from({ length: 70 }, () => ({
    x: (rnd() * W) | 0, y: (rnd() * (HORIZON - 40)) | 0, p: rnd() * 6.28, s: 0.6 + rnd() * 1.6, b: rnd() > 0.85,
  }));

  // ---- 独角兽 (行为见 unicorn.ts) ----
  // 独角兽绕开水潭
  const herd = createHerd(rnd, W, HORIZON, 5, (x, y) => ((x - POOL.cx) / (POOL.rx + 14)) ** 2 + ((y - POOL.cy) / (POOL.ry + 8)) ** 2 < 1);

  const blades0 = Array.from({ length: 260 }, () => {
    const y = HORIZON + 12 + Math.pow(rnd(), 0.9) * (H - HORIZON - 12);
    const near = (y - HORIZON) / (H - HORIZON);
    return { x: rnd() * W, y, h: 1 + near * 2.5 * (0.5 + rnd()), p: rnd() * 6.28, c: rnd(), near };
  });
  const blades = blades0.filter((b) => ((b.x - POOL.cx) / (POOL.rx + 2)) ** 2 + ((b.y - POOL.cy) / (POOL.ry + 2)) ** 2 > 1);
  const motes = Array.from({ length: 30 }, () => ({
    x: rnd() * W, y: HORIZON + rnd() * (H - HORIZON), vx: (rnd() - 0.5) * 3, vy: -(0.5 + rnd() * 2), p: rnd() * 6.28,
  }));
  const fogBands = Array.from({ length: 4 }, (_, i) => ({ y: HORIZON - 6 + i * 10, sp: 2 + i * 1.5, a: 0.05 + i * 0.012, off: rnd() * 100 }));

  // ---- 池塘：不规则的岸线，逐行上色 + 棋盘抖动，水面映着天光 ----
  // mask[行] = 这一行水面向左 / 向右伸出多远 (相对池心)
  const mask: { l: number; r: number }[] = [];
  for (let dy = -POOL.ry; dy <= POOL.ry; dy++) {
    const e = Math.sqrt(Math.max(0, 1 - (dy / (POOL.ry + 0.6)) ** 2));
    const wob = (k: number) => Math.round(Math.sin(dy * 1.3 + k) * 1.6 + Math.sin(dy * 0.5 + k * 2) * 1.2);
    mask.push({ l: Math.max(3, Math.round(POOL.rx * e) + wob(0)), r: Math.max(3, Math.round(POOL.rx * e) + wob(3)) });
  }
  const rowOf = (y: number) => mask[y - POOL.cy + POOL.ry];
  const inWater = (x: number, y: number) => {
    const m = rowOf(y);
    return !!m && x > POOL.cx - m.l && x < POOL.cx + m.r;
  };
  const pond = layer();
  {
    const g = pond.x;
    mask.forEach((m, i) => {
      const y = POOL.cy - POOL.ry + i;
      const t = i / (mask.length - 1);
      // 岸：深色的泥，夹着几粒浅色的沙
      g.fillStyle = '#17130a';
      g.fillRect(POOL.cx - m.l - 2, y, m.l + m.r + 5, 1);
      for (let x = POOL.cx - m.l - 2; x < POOL.cx + m.r + 3; x++) {
        if ((x < POOL.cx - m.l || x > POOL.cx + m.r - 1) && rnd() < 0.3) { g.fillStyle = '#3a2d14'; g.fillRect(x, y, 1, 1); }
      }
      // 水：上浅下深，奇偶格交错形成抖动
      const a = mix('#26406a', '#0b1426', t);
      const b = mix('#2e4a78', '#101c34', t);
      for (let x = POOL.cx - m.l + 1; x < POOL.cx + m.r; x++) {
        g.fillStyle = (x + y) & 1 ? a : b;
        g.fillRect(x, y, 1, 1);
      }
      g.fillStyle = '#070d1a'; // 水边一圈深色
      g.fillRect(POOL.cx - m.l + 1, y, 1, 1);
      g.fillRect(POOL.cx + m.r - 1, y, 1, 1);
    });
    // 对岸映进水里的一条亮边
    const top = mask[0];
    g.fillStyle = '#4a6a9a';
    g.fillRect(POOL.cx - top.l + 3, POOL.cy - POOL.ry, top.l + top.r - 6, 1);
    // 睡莲
    for (const [dx, dy] of [[-10, 2], [9, -2], [-3, 3]]) {
      const x = POOL.cx + dx, y = POOL.cy + dy;
      g.fillStyle = '#2d4b2c'; g.fillRect(x, y, 3, 1);
      g.fillStyle = '#3f6a3a'; g.fillRect(x + 1, y - 1, 2, 1);
    }
    g.fillStyle = '#d9a3b4'; g.fillRect(POOL.cx + 10, POOL.cy - 3, 1, 1);
  }
  const reeds = [[-1, -2, 7], [-1, 1, 5], [-1, 2, 6], [1, -3, 6], [1, 0, 8], [1, 2, 5]].map(([side, dy, h], i) => {
    const m = rowOf(POOL.cy + dy);
    return { x: side < 0 ? POOL.cx - m.l - 2 : POOL.cx + m.r + 1, y: POOL.cy + dy + 1, h, p: i * 1.7 };
  });

  return {
    draw(ctx, t, dt, mx, my, { reduce, calm, hot }) {
      ctx.drawImage(sky.c, 0, 0);

      for (const s of stars) {
        const a = reduce ? 0.75 : 0.45 + 0.55 * Math.sin(t * s.s + s.p);
        ctx.fillStyle = `rgba(230,225,200,${clamp(a, 0.1, 1)})`;
        ctx.fillRect(s.x - mx * 2, s.y - my, s.b ? 2 : 1, s.b ? 2 : 1);
      }
      const moonX = 252 - mx * 4, moonY = 36 - my * 2;
      for (let r = 22; r > 12; r -= 3) {
        ctx.fillStyle = `rgba(224,184,87,${0.015 * (23 - r)})`;
        ctx.beginPath(); ctx.arc(moonX, moonY, r, 0, 6.3); ctx.fill();
      }
      ctx.fillStyle = '#f2e6b8';
      ctx.beginPath(); ctx.arc(moonX, moonY, 10, 0, 6.3); ctx.fill();
      ctx.fillStyle = '#141a33';
      ctx.beginPath(); ctx.arc(moonX + 5, moonY - 2, 9, 0, 6.3); ctx.fill();

      ctx.drawImage(far.c, Math.round(-PAD - mx * 5), Math.round(-my * 1.5));
      // 门卫旁的火光
      const fl = 0.6 + 0.4 * Math.sin(t * 9) * Math.sin(t * 5.3);
      const fx = GATE_X + 18 - mx * 5, fy = wallTop + 20 - my * 1.5;
      ctx.fillStyle = `rgba(255,150,60,${0.5 * fl})`;
      ctx.fillRect(Math.round(fx), Math.round(fy), 2, 2);
      ctx.fillStyle = `rgba(255,150,60,${0.06 * fl})`;
      ctx.beginPath(); ctx.arc(fx + 1, fy + 1, 9, 0, 6.3); ctx.fill();

      ctx.drawImage(field.c, 0, 0);

      // 池塘：水面慢慢荡开涟漪；靠近时更亮、更密 (点击这里进入另一面)
      {
        ctx.drawImage(pond.c, 0, 0);
        if (hot) {
          ctx.fillStyle = 'rgba(110,160,220,0.16)';
          mask.forEach((m, i) => ctx.fillRect(POOL.cx - m.l + 1, POOL.cy - POOL.ry + i, m.l + m.r - 1, 1));
        }
        // 水面上缓缓滑动的亮线
        ctx.fillStyle = 'rgba(180,210,245,0.3)';
        for (let i = 0; i < 7; i++) {
          const y = POOL.cy - POOL.ry + 1 + ((i * 5 + 2) % (mask.length - 2));
          const m = rowOf(y);
          const span = m.l + m.r - 6;
          const len = 3 + (i % 3) * 2;
          const x = POOL.cx - m.l + 3 + Math.floor(reduce ? i * 5 : (t * (1.2 + (i % 3) * 0.5) + i * 9) % Math.max(span, 1));
          const w = Math.min(len, POOL.cx + m.r - 3 - x);
          if (w > 0) ctx.fillRect(x, y, w, 1);
        }
        // 偶尔一闪的碎光
        ctx.fillStyle = 'rgba(245,236,190,0.75)';
        for (let k = 0; k < 4; k++) {
          const gx = POOL.cx - 12 + k * 8 + (k % 2) * 2, gy = POOL.cy - 2 + ((k * 3) % 5);
          if (inWater(gx, gy) && (reduce ? k < 2 : Math.sin(t * 1.7 + k * 2.3) > 0.8)) ctx.fillRect(gx, gy, 1, 1);
        }
        // 涟漪：逐像素描出，不做抗锯齿
        const rings = hot ? 3 : 2;
        for (let k = 0; k < rings; k++) {
          const ph = reduce ? (k + 0.4) / rings : (t * (hot ? 0.5 : 0.22) + k / rings) % 1;
          const rr = 2 + ph * (POOL.rx - 3), ry = 1 + ph * (POOL.ry - 1);
          ctx.fillStyle = `rgba(190,220,250,${(1 - ph) * (hot ? 0.65 : 0.4)})`;
          const n = Math.round((rr + ry) * 3);
          for (let i = 0; i < n; i++) {
            const ang = (i / n) * 6.2832;
            const px = Math.round(POOL.cx + Math.cos(ang) * rr), py = Math.round(POOL.cy + Math.sin(ang) * ry);
            if (inWater(px, py)) ctx.fillRect(px, py, 1, 1);
          }
        }
        // 岸边的芦苇
        for (const r of reeds) {
          const sw = reduce ? 0 : Math.round(Math.sin(t * 1.1 + r.p) * 0.9);
          ctx.fillStyle = '#4a4420';
          ctx.fillRect(r.x, r.y - r.h, 1, r.h);
          ctx.fillRect(r.x + sw, r.y - r.h - 1, 1, 1);
          ctx.fillStyle = '#7a5226'; // 蒲棒
          ctx.fillRect(r.x + sw, r.y - r.h - 3, 1, 2);
        }
      }

      for (const f of fogBands) {
        for (let x = 0; x < W; x += 4) {
          const v = Math.sin((x + f.off + t * f.sp) * 0.045) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(150,150,190,${f.a * v})`;
          ctx.fillRect(x, f.y + Math.sin((x + t * f.sp) * 0.05) * 2, 4, 5);
        }
      }

      const drawBlades = (from: number, to: number) => {
        for (const b of blades) {
          if (b.near < from || b.near >= to) continue;
          const sway = Math.sin(t * 1.2 + b.p + b.x * 0.03) * (0.5 + b.near * 1.2);
          ctx.fillStyle = b.c > 0.85 ? '#c9ad66' : b.c > 0.3 ? '#8c6a2a' : '#4e3a18';
          ctx.fillRect(Math.round(b.x - mx * (4 + b.near * 10) + sway), Math.round(b.y - b.h), 1, Math.max(1, Math.round(b.h)));
        }
      };
      drawBlades(0, 0.6);

      herd.draw(ctx, t, dt, mx, my, !reduce);
      drawBlades(0.6, 1.01);

      for (const m of motes) {
        if (!reduce) {
          m.x += (m.vx + Math.sin(t + m.p) * 2) * dt;
          m.y += m.vy * dt;
        }
        if (m.y < HORIZON - 10) { m.y = H + 2; m.x = rnd() * W; }
        if (m.x < 0) m.x = W;
        if (m.x > W) m.x = 0;
        ctx.fillStyle = `rgba(255,230,160,${0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + m.p))})`;
        ctx.fillRect(m.x | 0, m.y | 0, 1, 1);
      }
    },
  };
}
