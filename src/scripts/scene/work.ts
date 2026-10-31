import { H, W, clamp, ditherSky, layer, makeRng, type Layer, type Scene } from './common';

// work：雨夜的街。画面自上而下：天际线 → 临街的楼 (有小巷、店面) → 人行道 → 马路牙子 → 马路。
// 路灯立在人行道边上，光落在湿漉漉的路面上；马路牙子上有一个下水口，偶尔有一双眼睛在里面看来看去，
// 那是通往另一面的入口 (见 Base.astro 的 .portal)。
const GROUND = 120; // 楼脚 / 人行道的内侧边
const WALK_END = 135; // 人行道外侧边
const CURB_TOP = 136; // 马路牙子的顶面
const ROAD = 141; // 路面开始
const PAD = 14;

// 下水口：开在马路牙子的侧面，路面上对应一块格栅
const DRAIN = { x: 167, w: 10 };

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
interface NearWin { x: number; y: number; ph: number }
interface Car { x: number; v: number; far: boolean; body: string }

export function createWorkScene(): Scene {
  const rnd = makeRng(1985);
  const LW = W + PAD * 2;

  const sky = layer();
  ditherSky(sky.x, [[0, '#02050a'], [0.45, '#07141c'], [0.8, '#12303a'], [1, '#3a2c48']], GROUND);

  const WINC = ['#f0e6a0', '#9fe8e0', '#ffffff', '#ffd9a0', '#f0e6a0'];
  const tops: { x: number; y: number }[] = [];

  // 远处的楼：窗子很小，只是一片灯火
  function skyline(color: string, base: number, hMin: number, hMax: number, wMin: number, wMax: number, winP: number, collectTops = false) {
    const l: Layer = layer(LW, H);
    const wins: Win[] = [];
    let x = -4;
    while (x < LW) {
      const w = Math.round(wMin + rnd() * (wMax - wMin));
      const h = Math.round(hMin + rnd() * (hMax - hMin));
      l.x.fillStyle = color;
      l.x.fillRect(x, base - h, w, h + 30);
      if (rnd() > 0.7) l.x.fillRect(x + (w >> 1), base - h - 4 - ((rnd() * 6) | 0), 1, 8); // antenna
      if (collectTops && h > hMax * 0.75) tops.push({ x: x + (w >> 1), y: base - h - 1 });
      for (let wx = x + 2; wx < x + w - 2; wx += 3) {
        for (let wy = base - h + 3; wy < base - 2; wy += 4) {
          if (rnd() < winP) {
            const c = WINC[(rnd() * WINC.length) | 0];
            l.x.globalAlpha = 0.5 + rnd() * 0.4;
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

  const farSky = skyline('#0a1a24', GROUND - 22, 22, 56, 10, 24, 0.12);
  const midSky = skyline('#071119', GROUND - 8, 18, 46, 12, 28, 0.2, true);

  // ---- 临街的楼：按人的尺度画 (一层约 9 像素，窗子 4×5) ----
  const near = layer(LW, H);
  const nearWins: NearWin[] = [];
  const BLD = [
    { x: -14, w: 78, h: 62, c: '#04090d', rim: '#0c1c27', front: 'door' },
    { x: 78, w: 52, h: 46, c: '#050c11', rim: '#0d202c', front: 'store' },
    { x: 130, w: 62, h: 76, c: '#040a0e', rim: '#0c1c27', front: 'shop' },
    { x: 192, w: 50, h: 52, c: '#050c11', rim: '#0d202c', front: 'shutter' },
    { x: 242, w: 92, h: 66, c: '#04090d', rim: '#0c1c27', front: 'shutter' },
  ];
  const ALLEY = { x: 64, w: 14 };
  const FACTORY = { x: 147, y: GROUND - 30 }; // 挂在店面上方的招牌
  const SYSTEM = { x: 272, y: GROUND - 66 - 11 }; // 立在屋顶上的招牌

  {
    const g = near.x;
    const X = (cx: number) => cx + PAD;
    for (const b of BLD) {
      const top = GROUND - b.h;
      g.fillStyle = b.c;
      g.fillRect(X(b.x), top, b.w, b.h + 30);
      g.fillStyle = b.rim; // 受光的边
      g.fillRect(X(b.x), top, 1, b.h);
      g.fillRect(X(b.x), top, b.w, 1);
      g.fillStyle = '#0a1822'; // 女儿墙
      g.fillRect(X(b.x), top + 1, b.w, 1);
      // 上面的楼层
      for (let fy = GROUND - 24, row = 0; fy > top + 5; fy -= 9, row++) {
        if (row % 3 === 2) { g.fillStyle = '#0a1822'; g.fillRect(X(b.x), fy + 7, b.w, 1); } // 腰线
        for (let wx = b.x + 4; wx + 4 <= b.x + b.w - 3; wx += 8) {
          if (wx + 4 > ALLEY.x && wx < ALLEY.x + ALLEY.w) continue;
          g.fillStyle = '#081520'; // 暗着的窗
          g.fillRect(X(wx), fy, 4, 5);
          if (rnd() < 0.3) {
            const c = WINC[(rnd() * WINC.length) | 0];
            g.globalAlpha = 0.6 + rnd() * 0.35;
            g.fillStyle = c;
            g.fillRect(X(wx), fy, 4, 5);
            g.globalAlpha = 1;
            if (rnd() < 0.4) { g.fillStyle = '#0a1822'; g.fillRect(X(wx), fy, 4, 2); } // 拉了一半帘子
            if (rnd() < 0.07) nearWins.push({ x: X(wx), y: fy, ph: rnd() * 10 });
          } else if (rnd() < 0.18) {
            g.fillStyle = '#0c1d28'; // 空调外机
            g.fillRect(X(wx) + 1, fy + 6, 3, 2);
          }
        }
      }
      // 屋顶上的东西
      if (b.h > 60) {
        g.fillStyle = b.c;
        g.fillRect(X(b.x + 10), top - 6, 9, 6); // 水箱
        g.fillRect(X(b.x + 12), top - 8, 1, 2);
        g.fillStyle = b.rim;
        g.fillRect(X(b.x + 10), top - 6, 9, 1);
      }
    }

    // 底层的店面
    const shopfront = (b: (typeof BLD)[number]) => {
      const y0 = GROUND - 13;
      if (b.front === 'shop') {
        g.fillStyle = '#2a1d10'; // 暖光的橱窗
        g.fillRect(X(b.x + 6), y0 + 3, 26, 10);
        g.fillStyle = '#7a5a2e';
        g.globalAlpha = 0.65;
        g.fillRect(X(b.x + 7), y0 + 4, 24, 8);
        g.globalAlpha = 1;
        g.fillStyle = '#c99a58'; // 橱窗里的货架
        g.fillRect(X(b.x + 9), y0 + 7, 8, 1);
        g.fillRect(X(b.x + 20), y0 + 9, 8, 1);
        for (let i = 0; i < 26; i += 4) { // 遮阳篷
          g.fillStyle = (i / 4) % 2 ? '#5a2824' : '#7a342d';
          g.fillRect(X(b.x + 5 + i), y0, 4, 3);
        }
        g.fillStyle = '#02060a'; // 门
        g.fillRect(X(b.x + 38), y0 + 1, 9, 12);
        g.fillStyle = '#ffcf8a';
        g.globalAlpha = 0.5;
        g.fillRect(X(b.x + 39), y0 + 2, 1, 11);
        g.globalAlpha = 1;
      } else if (b.front === 'store') {
        g.fillStyle = '#10241f'; // 便利店：冷白的光
        g.fillRect(X(b.x + 5), y0 + 2, 34, 11);
        g.fillStyle = '#bfe9d8';
        g.globalAlpha = 0.55;
        g.fillRect(X(b.x + 6), y0 + 3, 32, 9);
        g.globalAlpha = 1;
        g.fillStyle = '#4c7f72'; // 货架
        for (let i = 0; i < 4; i++) g.fillRect(X(b.x + 8 + i * 8), y0 + 5, 5, 1);
        for (let i = 0; i < 4; i++) g.fillRect(X(b.x + 8 + i * 8), y0 + 9, 5, 1);
        g.fillStyle = '#2f6b5a'; // 门头
        g.fillRect(X(b.x + 4), y0, 36, 2);
        g.fillStyle = '#d8f4e8';
        g.fillRect(X(b.x + 4), y0, 36, 1);
      } else if (b.front === 'shutter') {
        g.fillStyle = '#07121a'; // 卷帘门
        g.fillRect(X(b.x + 4), y0 + 1, b.w - 8, 12);
        g.fillStyle = '#0a1a24';
        for (let y = y0 + 2; y < y0 + 13; y += 2) g.fillRect(X(b.x + 4), y, b.w - 8, 1);
        g.fillStyle = '#16303d';
        g.fillRect(X(b.x + 4), y0, b.w - 8, 1);
      } else {
        g.fillStyle = '#02060a'; // 大楼的门
        g.fillRect(X(b.x + 44), y0 + 1, 7, 12);
        g.fillStyle = '#ffcf8a';
        g.globalAlpha = 0.55;
        g.fillRect(X(b.x + 44), y0, 7, 1); // 门楣上的小灯
        g.globalAlpha = 1;
        g.fillStyle = '#0d1d27';
        g.fillRect(X(b.x + 42), y0 - 1, 11, 1);
      }
    };
    BLD.forEach(shopfront);

    // 小巷：窄窄的一道缝，深处有一盏灯
    {
      const ax = X(ALLEY.x), top = GROUND - 44;
      g.fillStyle = '#020507';
      g.fillRect(ax, top, ALLEY.w, 44 + 30);
      g.fillStyle = '#050d14'; // 里面的墙
      g.fillRect(ax + 3, top + 6, ALLEY.w - 6, 44 - 6);
      g.fillStyle = '#9fe8e0'; // 深处亮着的窗
      g.globalAlpha = 0.55;
      g.fillRect(ax + 8, GROUND - 28, 3, 4);
      g.globalAlpha = 1;
      g.fillStyle = '#ffcf8a'; // 深处的门灯
      g.globalAlpha = 0.9;
      g.fillRect(ax + 6, GROUND - 10, 4, 9);
      g.globalAlpha = 0.18;
      g.fillRect(ax + 4, GROUND - 12, 8, 12);
      g.globalAlpha = 1;
      g.fillStyle = '#16303d'; // 太平梯
      for (let i = 0; i < 4; i++) {
        g.fillRect(ax + 1, GROUND - 38 + i * 8, 4, 1);
        g.fillRect(ax + 1 + (i % 2) * 3, GROUND - 37 + i * 8, 1, 7);
      }
      g.fillStyle = '#0a1a24'; // 垃圾桶
      g.fillRect(ax + 9, GROUND - 5, 4, 5);
      g.fillStyle = '#16303d';
      g.fillRect(ax + 9, GROUND - 5, 4, 1);
    }
  }

  // ---- 地面：人行道 / 马路牙子 / 马路 (静态) ----
  const ground = layer();
  {
    const g = ground.x;
    // 人行道：越靠近路沿越亮 (湿)，砖缝越疏
    for (let y = GROUND; y <= WALK_END; y++) {
      const t = (y - GROUND) / (WALK_END - GROUND);
      g.fillStyle = `rgb(${10 + t * 8 | 0},${22 + t * 16 | 0},${30 + t * 18 | 0})`;
      g.fillRect(0, y, W, 1);
    }
    const rows = [GROUND + 4, GROUND + 9, GROUND + 15];
    g.fillStyle = 'rgba(2,8,12,0.55)';
    rows.forEach((y) => g.fillRect(0, y, W, 1));
    let top = GROUND + 1;
    rows.concat([WALK_END + 1]).forEach((bot, i) => {
      const sp = 9 + i * 5;
      for (let x = (i % 2) * (sp >> 1); x < W; x += sp) g.fillRect(x, top, 1, bot - top);
      top = bot + 1;
    });
    // 水洼的反光
    for (let i = 0; i < 16; i++) {
      g.fillStyle = `rgba(120,180,200,${0.06 + rnd() * 0.08})`;
      g.fillRect((rnd() * W) | 0, GROUND + 3 + ((rnd() * 12) | 0), 6 + ((rnd() * 12) | 0), 1);
    }
    // 小巷口的地面更暗，并映着深处的门灯
    g.fillStyle = 'rgba(0,0,0,0.5)';
    g.fillRect(ALLEY.x, GROUND, ALLEY.w, 6);
    g.fillStyle = 'rgba(255,207,138,0.28)';
    g.fillRect(ALLEY.x + 6, GROUND + 1, 4, 1);
    g.fillRect(ALLEY.x + 7, GROUND + 2, 2, 2);

    // 马路牙子
    g.fillStyle = '#3a5663';
    g.fillRect(0, CURB_TOP, W, 1);
    g.fillStyle = '#1b2f3a';
    g.fillRect(0, CURB_TOP + 1, W, 3);
    g.fillStyle = '#080f14';
    g.fillRect(0, CURB_TOP + 4, W, 1);
    for (let x = 11; x < W; x += 29) { g.fillStyle = '#0c1a22'; g.fillRect(x, CURB_TOP + 1, 1, 3); } // 石块接缝

    // 路面
    for (let y = ROAD; y < H; y++) {
      const t = (y - ROAD) / (H - ROAD);
      g.fillStyle = `rgb(${9 - t * 4 | 0},${19 - t * 9 | 0},${25 - t * 11 | 0})`;
      g.fillRect(0, y, W, 1);
    }
    for (let i = 0; i < 520; i++) { // 沥青的颗粒
      g.fillStyle = `rgba(90,140,160,${0.04 + rnd() * 0.06})`;
      g.fillRect((rnd() * W) | 0, ROAD + ((rnd() * (H - ROAD)) | 0), 1, 1);
    }
    // 车道线 (中间虚线) + 近处的路沿线
    for (let x = -8; x < W; x += 40) {
      g.fillStyle = 'rgba(214,196,130,0.34)';
      g.fillRect(x, 161, 22, 2);
    }
    g.fillStyle = 'rgba(214,196,130,0.18)';
    g.fillRect(0, ROAD + 2, W, 1);
    // 下水口：马路牙子侧面的开口 + 路面上的格栅
    g.fillStyle = '#010204';
    g.fillRect(DRAIN.x, CURB_TOP + 1, DRAIN.w, 4);
    g.fillStyle = '#2b4553';
    g.fillRect(DRAIN.x - 1, CURB_TOP + 1, 1, 4);
    g.fillRect(DRAIN.x + DRAIN.w, CURB_TOP + 1, 1, 4);
    g.fillStyle = 'rgba(0,0,0,0.35)'; // 开口下面被水冲出的一小块深色
    g.fillRect(DRAIN.x - 2, ROAD, DRAIN.w + 4, 2);
    g.fillStyle = '#0b161d'; // 开口上沿的石过梁
    g.fillRect(DRAIN.x - 1, CURB_TOP + 1, DRAIN.w + 2, 1);
    g.fillStyle = '#010204';
    g.fillRect(DRAIN.x, CURB_TOP + 1, DRAIN.w, 1);
  }

  // 霓虹
  const signs = [
    { s: 'SYSTEM', x: SYSTEM.x, y: SYSTEM.y, c: '#5ff0d0', ph: 0, roof: true },
    { s: 'FACTORY', x: FACTORY.x, y: FACTORY.y, c: '#ffb86b', ph: 3, roof: false },
  ];

  // 路灯 (立在人行道外侧)
  const LAMPS = [
    { x: 30, d: 1, faulty: false },
    { x: 112, d: -1, faulty: false },
    { x: 228, d: 1, faulty: false },
    { x: 298, d: -1, faulty: true },
  ];
  const LAMP_TOP = 95;

  // 雨：每一滴有自己的落点，落在人行道 / 路面上溅起一圈
  const drops = Array.from({ length: 130 }, () => ({
    x: rnd() * (W + 40), y: rnd() * H, v: 90 + rnd() * 70, l: 3 + ((rnd() * 3) | 0),
    ly: GROUND + 8 + rnd() * (H - GROUND - 10),
  }));

  // 车：远处一条车道向右，近处一条向左，不多，偶尔经过
  const cars: Car[] = [
    { x: 40, v: 20, far: true, body: '#0a1822' },
    { x: 290, v: 17, far: true, body: '#160d12' },
    { x: 200, v: -40, far: false, body: '#0b1a22' },
    { x: -90, v: -34, far: false, body: '#101820' },
  ];

  // 撑伞走过的人
  const ped = { x: 58, v: 7 };

  // 下水口里的眼睛
  const eye = { on: false, until: 0, next: 5, gx: 0, pl: 1, look: 0, blinkAt: 0, blinkEnd: 0, a: 0 };

  function drawCar(ctx: CanvasRenderingContext2D, c: Car) {
    const dir = c.v > 0 ? 1 : -1;
    const L = c.far ? 17 : 25;
    const h = c.far ? 6 : 9;
    const base = c.far ? 157 : 177;
    const bodyH = Math.round(h * 0.45);
    const cabinH = h - 2 - bodyH;
    const x = Math.round(c.x);
    const by = base - 2 - bodyH;
    ctx.fillStyle = c.body;
    ctx.fillRect(x, by, L, bodyH);
    const cx = x + Math.round(L * (dir > 0 ? 0.2 : 0.28));
    const cw = Math.round(L * 0.5);
    ctx.fillRect(cx, by - cabinH, cw, cabinH);
    ctx.fillStyle = 'rgba(60,110,130,0.55)'; // 车窗上映的一点光
    ctx.fillRect(cx + 1, by - cabinH + 1, cw - 2, 1);
    ctx.fillStyle = 'rgba(120,170,190,0.4)';
    ctx.fillRect(cx, by - cabinH, cw, 1);
    ctx.fillStyle = '#010203'; // 轮子
    const ww = c.far ? 2 : 3;
    ctx.fillRect(x + 2, base - 2, ww, 2);
    ctx.fillRect(x + L - 2 - ww, base - 2, ww, 2);
    const front = dir > 0 ? x + L : x;
    const rear = dir > 0 ? x : x + L;
    ctx.fillStyle = '#fff3c8'; // 前灯 + 光束
    ctx.fillRect(front - (dir > 0 ? 2 : 0), by + 1, 2, 1);
    ctx.fillStyle = 'rgba(255,240,190,0.12)';
    ctx.fillRect(dir > 0 ? front : front - 20, by, 20, 3);
    ctx.fillStyle = 'rgba(255,240,190,0.1)';
    ctx.fillRect(dir > 0 ? front : front - 9, by + 1, 9, 1);
    ctx.fillStyle = '#ff3a3a'; // 尾灯
    ctx.fillRect(rear - (dir > 0 ? 0 : 1), by + 1, 1, 1);
    ctx.fillStyle = 'rgba(255,58,58,0.22)';
    ctx.fillRect(rear - (dir > 0 ? 2 : 0), by, 3, 3);
    // 湿路面上的倒影：灯光在车下面拉出细长的光
    ctx.fillStyle = 'rgba(255,240,190,0.2)';
    ctx.fillRect(front - (dir > 0 ? 3 : 0), base + 1, 4, 1);
    ctx.fillRect(front - (dir > 0 ? 2 : -1), base + 2, 2, 1);
    ctx.fillStyle = 'rgba(255,58,58,0.18)';
    ctx.fillRect(rear - 1, base + 1, 3, 1);
  }

  return {
    draw(ctx, t, dt, mx, my, { reduce, calm, hot }) {
      const sx = (cx: number, k: number) => Math.round(cx - mx * k);
      const glow = calm ? 0.65 : 1;

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

      ctx.drawImage(near.c, par(10), Math.round(-my * 3));

      // 远处的窗子偶尔熄灭 (近处的也是)
      if (!reduce) {
        for (const w of midSky.wins) {
          if (!w.flick || Math.sin(t * 0.7 + w.ph) <= 0.2) continue;
          ctx.fillStyle = '#071119';
          ctx.fillRect(Math.round(w.x - PAD - mx * 6), Math.round(w.y - my * 2), 2, 2);
        }
        for (const w of nearWins) {
          if (Math.sin(t * 0.5 + w.ph) <= 0.25) continue;
          ctx.fillStyle = '#081520';
          ctx.fillRect(Math.round(w.x - PAD - mx * 10), Math.round(w.y - my * 3), 4, 5);
        }
      }

      // 小巷里升起的蒸汽
      {
        for (let i = 0; i < 6; i++) {
          const ph = reduce ? i / 6 : (t * 0.09 + i / 6) % 1;
          const y = GROUND - 22 - ph * 34 - my * 3;
          const x = ALLEY.x + 5 + Math.sin(t * 0.8 + i * 2) * 1.5 + ph * 4;
          ctx.fillStyle = `rgba(150,190,200,${0.16 * Math.sin(ph * Math.PI)})`;
          const s = 2 + Math.round(ph * 3);
          ctx.fillRect(sx(x, 10), Math.round(y), s, s - 1);
        }
      }

      // 霓虹招牌：挂在近处的楼上
      for (const sg of signs) {
        const on = reduce || Math.sin(t * 7 + sg.ph) > -0.85;
        const x = sx(sg.x, 10);
        const y = Math.round(sg.y - my * 3);
        const w = sg.s.length * 4 + 3;
        ctx.fillStyle = '#03080c';
        ctx.fillRect(x - 2, y - 2, w + 1, 10);
        ctx.fillStyle = '#0d1d27';
        ctx.fillRect(x - 2, y - 2, w + 1, 1);
        if (sg.roof) { ctx.fillStyle = '#0a1822'; ctx.fillRect(x + 1, y + 8, 1, 3); ctx.fillRect(x + w - 3, y + 8, 1, 3); }
        ctx.fillStyle = sg.c;
        ctx.globalAlpha = (on ? 0.16 : 0.04) * glow;
        ctx.fillRect(x - 5, y - 5, w + 7, 16);
        ctx.globalAlpha = on ? 1 : 0.25;
        text(ctx, sg.s, x, y);
        ctx.globalAlpha = 1;
      }

      ctx.drawImage(ground.c, 0, 0);

      // 店里漏出来的光，落在人行道上
      {
        const spill = (x0: number, w: number, color: string, a: number) => {
          ctx.fillStyle = color;
          for (let i = 0; i < 6; i++) {
            ctx.globalAlpha = a * (1 - i / 7) * glow;
            ctx.fillRect(sx(x0 - i, 10), GROUND + 1 + i * 2, w + i * 2, 2);
          }
          ctx.globalAlpha = 1;
        };
        spill(BLD[2].x + 5, 28, '#ffb86b', 0.2);
        spill(BLD[1].x + 4, 34, '#bfe9d8', 0.16);
      }

      // 路灯在湿地面上的倒影 (车之前画，车压在上面)
      for (const l of LAMPS) {
        const hx = sx(l.x + l.d * 6, 12);
        let k = 1;
        if (l.faulty && !reduce) k = Math.sin(t * 23) > 0.2 && Math.sin(t * 0.6) > 0.55 ? 0.15 : 1;
        const len = LAMP_TOP + 2;
        for (let y = ROAD; y < WALK_END + (WALK_END - len); y++) {
          const f = (y - ROAD) / (WALK_END + (WALK_END - len) - ROAD);
          if ((y + (reduce ? 0 : Math.floor(t * 2.5))) % 3 === 0) continue; // 水面的起伏把倒影切成断断续续的碎光
          const wob = reduce ? 0 : Math.sin(t * 2.2 + y * 1.7);
          const w = 2 + Math.round(f * 3 + wob * 1.2);
          ctx.fillStyle = `rgba(255,214,150,${(0.04 + f * 0.17) * k * glow})`;
          ctx.fillRect(hx - (w >> 1) + (y % 2), y, w, 1);
        }
        const hy = WALK_END + (WALK_END - len);
        ctx.fillStyle = `rgba(255,226,170,${0.38 * k * glow})`;
        ctx.fillRect(hx - 2, hy - 1, 5, 2);
      }

      // 车
      for (const c of cars) {
        if (!reduce) {
          c.x += c.v * dt;
          if (c.v > 0 && c.x > W + 40) { c.x = -40 - rnd() * 260; c.v = 16 + rnd() * 8; }
          if (c.v < 0 && c.x < -60) { c.x = W + 30 + rnd() * 260; c.v = -(32 + rnd() * 14); }
        }
        drawCar(ctx, c);
      }

      // 路灯
      for (const l of LAMPS) {
        const lx = sx(l.x, 12);
        const hx = lx + l.d * 6;
        let k = 1;
        if (l.faulty && !reduce) k = Math.sin(t * 23) > 0.2 && Math.sin(t * 0.6) > 0.55 ? 0.15 : 1;
        // 光锥
        for (let y = LAMP_TOP + 3; y < WALK_END; y++) {
          const f = (y - LAMP_TOP) / 40;
          const hw = Math.round(2 + f * 15);
          ctx.fillStyle = `rgba(255,214,150,${0.045 * (1 - f * 0.55) * k * glow})`;
          ctx.fillRect(hx - hw, y, hw * 2 + 1, 1);
        }
        // 落在地面上的光斑
        for (let y = 130; y <= 148; y++) {
          const e = 1 - Math.pow((y - 139) / 9, 2);
          if (e <= 0) continue;
          const hw = Math.round(22 * Math.sqrt(e));
          ctx.fillStyle = `rgba(255,214,150,${0.075 * e * k * glow})`;
          ctx.fillRect(hx - hw, y, hw * 2 + 1, 1);
        }
        // 杆 + 臂 + 灯头
        ctx.fillStyle = '#0b1820';
        ctx.fillRect(lx, LAMP_TOP, 2, WALK_END - LAMP_TOP + 1);
        ctx.fillRect(lx - 1, WALK_END - 1, 4, 2);
        ctx.fillRect(l.d > 0 ? lx : hx, LAMP_TOP, Math.abs(hx - lx) + 1, 1);
        ctx.fillStyle = '#233f4d';
        ctx.fillRect(lx, LAMP_TOP + 3, 1, WALK_END - LAMP_TOP - 3);
        ctx.fillStyle = '#16303d';
        ctx.fillRect(hx - 3, LAMP_TOP, 7, 2);
        // 灯泡 + 光晕
        for (const [hw, hh, a] of [[9, 4, 0.04], [7, 3, 0.06], [5, 2, 0.1], [4, 1, 0.16]]) {
          ctx.fillStyle = `rgba(255,226,170,${a * glow * k})`;
          ctx.fillRect(hx - hw, LAMP_TOP + 1 - hh, hw * 2 + 1, hh * 2 + 1);
        }
        ctx.fillStyle = k > 0.5 ? '#ffeec4' : '#7a6a48';
        ctx.fillRect(hx - 3, LAMP_TOP + 2, 7, 1);
      }

      // 撑伞走过的人
      {
        if (!reduce) { ped.x += ped.v * dt; if (ped.x > W + 24) ped.x = -24; }
        const px = Math.round(ped.x), fy = WALK_END - 2;
        const step = reduce ? 0 : Math.floor(t * 3.2) % 2;
        ctx.fillStyle = '#7d3835'; // 伞
        ctx.fillRect(px - 3, fy - 15, 7, 1);
        ctx.fillRect(px - 5, fy - 14, 11, 1);
        ctx.fillStyle = '#5a2826';
        ctx.fillRect(px - 6, fy - 13, 13, 1);
        ctx.fillStyle = '#0a1620'; // 人
        ctx.fillRect(px, fy - 12, 1, 3);
        ctx.fillRect(px - 1, fy - 10, 3, 2);
        ctx.fillRect(px - 2, fy - 8, 5, 5);
        ctx.fillRect(px - 1, fy - 3, 1, 3 - step);
        ctx.fillRect(px + 1, fy - 3, 1, 2 + step);
        ctx.fillStyle = 'rgba(120,180,200,0.16)'; // 湿地上的倒影
        ctx.fillRect(px - 2, fy + 1, 5, 4);
        ctx.fillRect(px - 1, fy + 5, 3, 2);
      }

      // 下水口里的眼睛：偶尔睁开，看来看去，眨一下，再合上
      {
        if (reduce) {
          eye.a = 0.45; eye.gx = 0; eye.pl = 1; eye.on = true;
        } else {
          if (!eye.on && (hot || t > eye.next)) {
            eye.on = true;
            eye.until = t + 5 + rnd() * 4;
            eye.look = t + 0.5;
            eye.blinkAt = t + 2 + rnd() * 2;
          }
          if (eye.on) {
            if (!hot && t > eye.until) { eye.on = false; eye.next = t + 6 + rnd() * 8; }
            if (hot) { eye.gx = 0; eye.pl = 1; }
            else if (t > eye.look) {
              eye.gx = ((rnd() * 3) | 0) - 1;
              eye.pl = (rnd() * 3) | 0;
              eye.look = t + 0.6 + rnd() * 1.1;
            }
            if (!hot && t > eye.blinkAt) { eye.blinkEnd = t + 0.14; eye.blinkAt = t + 2 + rnd() * 2.5; }
          }
          eye.a = clamp(eye.a + (eye.on ? dt * 2.5 : -dt * 4), 0, 1);
        }
        const blinking = t < eye.blinkEnd;
        if (eye.a > 0.02 && !blinking) {
          const ey = CURB_TOP + 2;
          const lx = DRAIN.x + 1 + eye.gx + 1;
          const rx = lx + 5;
          ctx.globalAlpha = eye.a * (hot ? 1 : 0.85);
          for (const x of [lx, rx]) {
            ctx.fillStyle = '#ffd98a';
            ctx.fillRect(x, ey, 3, 2);
            ctx.fillStyle = '#2a1604';
            ctx.fillRect(x + eye.pl, ey + 1, 1, 1);
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(255,207,112,${0.1 * eye.a})`;
          ctx.fillRect(lx - 1, ey - 1, 10, 4);
        }
      }

      // 雨
      {
        ctx.fillStyle = 'rgba(160,210,220,0.3)';
        for (const d of drops) {
          if (!reduce) {
            d.y += d.v * dt;
            d.x -= d.v * 0.18 * dt;
            if (d.x < -4) d.x += W + 40;
            if (d.y >= d.ly) { // 落地：溅起一圈
              ctx.fillRect(((d.x) | 0) - 1, d.ly | 0, 3, 1);
              d.y = -4; d.x = rnd() * (W + 40); d.ly = GROUND + 8 + rnd() * (H - GROUND - 10);
              continue;
            }
          }
          for (let i = 0; i < d.l; i++) ctx.fillRect((d.x - i * 0.2) | 0, (d.y + i) | 0, 1, 1);
        }
      }
    },
  };
}
