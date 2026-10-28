import { POSES, PAL, SW, SH } from './unicorn-data';
import { layer, clamp, type Layer } from './common';

// 独角兽的行为：在田野里随机游荡 —— 挑一个附近的目标点走过去，
// 到了就发呆一会儿、或者卧下休息，然后再挑下一个点。
// 像素数据在 unicorn-data.ts；这里负责状态机和绘制。
type State = 'walk' | 'idle' | 'lieDown' | 'lie' | 'lieUp';

interface Beast {
  cx: number; // 身体中心 x
  foot: number; // 脚底 y
  tx: number;
  ty: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  state: State;
  since: number;
  until: number;
  sleepy: boolean;
}

const BODY_CENTER = 12; // 精灵里身体中心所在的列
const MARGIN = 24; // 距屏幕左右边缘的最小距离 (留出视差位移)

function bake(): Record<string, { c: HTMLCanvasElement; tip: [number, number] }> {
  const out: Record<string, { c: HTMLCanvasElement; tip: [number, number] }> = {};
  for (const [name, pose] of Object.entries(POSES)) {
    const l: Layer = layer(SW, SH);
    pose.rows.forEach((row, y) => {
      for (let x = 0; x < SW; x++) {
        const ch = row[x];
        if (ch === '.') continue;
        l.x.fillStyle = PAL[ch];
        l.x.fillRect(x, y, 1, 1);
      }
    });
    out[name] = { c: l.c, tip: pose.tip };
  }
  return out;
}

export function createHerd(rnd: () => number, W: number, horizon: number, count = 5, avoid?: (x: number, y: number) => boolean) {
  const sprites = bake();
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const minY = horizon + 24;
  const maxY = 176; // 脚底最低不超过画面

  function pickTarget(b: Beast) {
    // 只挑附近的点，走起来是闲逛，不是赶路；并且始终待在画面里
    for (let tries = 0; tries < 10; tries++) {
      b.tx = clamp(b.cx + between(-90, 90), MARGIN, W - MARGIN);
      b.ty = clamp(b.foot + between(-18, 18), minY, maxY);
      if (!avoid || !avoid(b.tx, b.ty)) break;
    }
    if (Math.abs(b.tx - b.cx) > 1) b.dir = b.tx > b.cx ? 1 : -1;
  }

  const beasts: Beast[] = Array.from({ length: count }, (_, i) => {
    const b: Beast = {
      cx: between(MARGIN + 10, W - MARGIN - 10),
      foot: minY + ((maxY - minY) * (i + 0.5)) / count,
      tx: 0, ty: 0,
      dir: rnd() > 0.5 ? 1 : -1,
      speed: between(4, 7),
      phase: rnd() * 10,
      state: 'walk',
      since: 0,
      until: 0,
      sleepy: false,
    };
    pickTarget(b);
    return b;
  });

  function enter(b: Beast, st: State, t: number, dur = 0) {
    b.state = st;
    b.since = t;
    b.until = t + dur;
  }

  function arrived(b: Beast, t: number) {
    const r = rnd();
    if (r < 0.55) enter(b, 'idle', t, between(1.5, 4));
    else if (r < 0.8) { b.sleepy = rnd() > 0.5; enter(b, 'lieDown', t, 0.9); }
    else { pickTarget(b); enter(b, 'walk', t); }
  }

  function update(b: Beast, t: number, dt: number) {
    switch (b.state) {
      case 'walk': {
        const dx = b.tx - b.cx, dy = b.ty - b.foot;
        const d = Math.hypot(dx, dy);
        if (d < 1.5) return arrived(b, t);
        const step = Math.min(d, b.speed * dt);
        b.cx += (dx / d) * step;
        b.foot += (dy / d) * step * 0.6;
        if (Math.abs(dx) > 0.5) b.dir = dx > 0 ? 1 : -1;
        return;
      }
      case 'idle':
        if (t >= b.until) { pickTarget(b); enter(b, 'walk', t); }
        return;
      case 'lieDown':
        if (t >= b.until) enter(b, 'lie', t, between(7, 14));
        return;
      case 'lie':
        if (t >= b.until) enter(b, 'lieUp', t, 0.9);
        return;
      case 'lieUp':
        if (t >= b.until) { pickTarget(b); enter(b, 'walk', t); }
        return;
    }
  }

  function frame(b: Beast, t: number): { key: string; bob: number } {
    const age = t - b.since;
    switch (b.state) {
      case 'walk': return { key: ((t * 2 + b.phase) | 0) % 2 ? 'stand1' : 'stand0', bob: Math.round(Math.sin(t * 4 + b.phase) * 0.5) };
      case 'idle': return { key: 'stand0', bob: 0 };
      case 'lieDown': return { key: age < 0.45 ? 'down2' : 'down3', bob: 0 };
      case 'lieUp': return { key: age < 0.45 ? 'down3' : 'down2', bob: 0 };
      case 'lie': {
        const asleep = b.sleepy && age > 3;
        return { key: asleep ? 'lieSleep' : 'lie', bob: ((t * 0.8 + b.phase) | 0) % 2 ? 0 : 1 }; // 呼吸
      }
    }
  }

  return {
    draw(ctx: CanvasRenderingContext2D, t: number, dt: number, mx: number, my: number, moving: boolean) {
      const sorted = [...beasts].sort((a, b) => a.foot - b.foot);
      for (const b of sorted) {
        if (moving) update(b, t, dt);
        const { key, bob } = frame(b, t);
        const sp = sprites[key];
        const cx = Math.round(b.cx - mx * 6);
        const px = b.dir > 0 ? cx - BODY_CENTER : cx - SW + BODY_CENTER + 1;
        const py = Math.round(b.foot - SH + bob - my * 2);

        ctx.fillStyle = 'rgba(240,230,190,0.06)';
        ctx.beginPath(); ctx.ellipse(cx, py + SH - 1, 16, 3, 0, 0, 6.3); ctx.fill();

        ctx.globalAlpha = 0.6 + 0.4 * clamp((b.foot - minY) / (maxY - minY), 0, 1);
        if (b.dir < 0) {
          ctx.save();
          ctx.translate(px + SW, py);
          ctx.scale(-1, 1);
          ctx.drawImage(sp.c, 0, 0);
          ctx.restore();
        } else {
          ctx.drawImage(sp.c, px, py);
        }
        ctx.globalAlpha = 1;

        // 角尖的闪光
        if (Math.sin(t * 1.1 + b.phase * 2) > 0.93 || !moving) {
          const tx = b.dir < 0 ? px + SW - 1 - sp.tip[0] : px + sp.tip[0];
          const ty = py + sp.tip[1];
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillRect(tx, ty - 1, 1, 3);
          ctx.fillRect(tx - 1, ty, 3, 1);
        }
      }
    },
  };
}
