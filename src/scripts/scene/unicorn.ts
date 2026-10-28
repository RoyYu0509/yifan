import { POSES, PAL, SW, SH } from './unicorn-data';
import { layer, type Layer } from './common';

// 独角兽的行为：走 → (吃草 | 发呆 | 卧下休息) → 走 ……
// 每个姿势的像素数据在 unicorn-data.ts；这里负责状态机和绘制。
type State = 'walk' | 'idle' | 'grazeDown' | 'graze' | 'grazeUp' | 'lieDown' | 'lie' | 'lieUp';

interface Beast {
  x: number;
  foot: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  depth: number; // 0 远 .. 1 近
  state: State;
  until: number; // 当前状态持续到什么时候 (模拟时间)
  since: number;
  sleepy: boolean; // 这次卧下会不会闭眼睡着
}

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

export function createHerd(rnd: () => number, W: number, horizon: number, count = 5) {
  const sprites = bake();
  const between = (a: number, b: number) => a + rnd() * (b - a);

  const beasts: Beast[] = Array.from({ length: count }, (_, i) => {
    const depth = i / (count - 1);
    return {
      x: 20 + rnd() * (W - 40),
      foot: horizon + 26 + depth * 32,
      dir: rnd() > 0.5 ? 1 : -1,
      speed: 1.5 + rnd() * 2,
      phase: rnd() * 10,
      depth,
      state: 'walk' as State,
      until: between(1, 5),
      since: 0,
      sleepy: false,
    };
  });

  function enter(b: Beast, st: State, t: number, dur: number) {
    b.state = st;
    b.since = t;
    b.until = t + dur;
  }

  function advance(b: Beast, t: number) {
    if (t < b.until) return;
    switch (b.state) {
      case 'walk': {
        const r = rnd();
        if (r < 0.45) enter(b, 'grazeDown', t, 0.5);
        else if (r < 0.65) enter(b, 'idle', t, between(1.5, 3.5));
        else { b.sleepy = rnd() > 0.5; enter(b, 'lieDown', t, 0.9); }
        break;
      }
      case 'idle':
        if (rnd() > 0.7) b.dir = (b.dir * -1) as 1 | -1;
        enter(b, 'walk', t, between(4, 9));
        break;
      case 'grazeDown': enter(b, 'graze', t, between(5, 9)); break;
      case 'graze': enter(b, 'grazeUp', t, 0.5); break;
      case 'grazeUp': enter(b, 'walk', t, between(4, 9)); break;
      case 'lieDown': enter(b, 'lie', t, between(7, 14)); break;
      case 'lie': enter(b, 'lieUp', t, 0.9); break;
      case 'lieUp': enter(b, 'walk', t, between(4, 9)); break;
    }
  }

  function frame(b: Beast, t: number): { key: string; bob: number } {
    const age = t - b.since;
    switch (b.state) {
      case 'walk': return { key: ((t * 2 + b.phase) | 0) % 2 ? 'stand1' : 'stand0', bob: Math.round(Math.sin(t * 4 + b.phase) * 0.5) };
      case 'idle': return { key: 'stand0', bob: 0 };
      case 'grazeDown':
      case 'grazeUp': return { key: 'grazeMid', bob: 0 };
      case 'graze': return { key: 'graze', bob: ((t * 1.6 + b.phase) | 0) % 2 ? 0 : 1 }; // 咀嚼时轻轻点头
      case 'lieDown': return { key: age < 0.45 ? 'down2' : 'down3', bob: 0 };
      case 'lieUp': return { key: age < 0.45 ? 'down3' : 'down2', bob: 0 };
      case 'lie': {
        const asleep = b.sleepy && age > 3;
        return { key: asleep ? 'lieSleep' : 'lie', bob: ((t * 0.8 + b.phase) | 0) % 2 ? 0 : 1 }; // 呼吸
      }
    }
  }

  return {
    // 最近一个“正在被鼠标悬停”之类的交互暂不需要，保持纯动画
    draw(ctx: CanvasRenderingContext2D, t: number, dt: number, mx: number, my: number, moving: boolean) {
      const sorted = [...beasts].sort((a, b) => a.foot - b.foot);
      for (const b of sorted) {
        if (moving) {
          advance(b, t);
          if (b.state === 'walk') {
            b.x += b.dir * b.speed * dt;
            if (b.x > W + 36) b.x = -36;
            if (b.x < -36) b.x = W + 36;
          }
        }
        const { key, bob } = frame(b, t);
        const sp = sprites[key];
        const px = Math.round(b.x - mx * (6 + b.depth * 10));
        const py = Math.round(b.foot - SH + bob - my * 2);

        // 地面的淡光
        ctx.fillStyle = `rgba(240,230,190,${0.05 + b.depth * 0.04})`;
        ctx.beginPath(); ctx.ellipse(px + 13, py + SH - 1, 16, 3, 0, 0, 6.3); ctx.fill();

        ctx.globalAlpha = 0.6 + 0.4 * b.depth;
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
        const g = Math.sin(t * 1.1 + b.phase * 2);
        if (g > 0.93 || !moving) {
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
