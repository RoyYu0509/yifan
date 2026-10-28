export const W = 320;
export const H = 180;

export interface Layer { c: HTMLCanvasElement; x: CanvasRenderingContext2D }

export interface SceneOpts {
  reduce: boolean; // prefers-reduced-motion：完全静止
  calm: boolean; // 安静模式：只压低亮度 / 光晕，动画完整保留
  hot: boolean; // 鼠标正悬停在“入口”上 (或键盘聚焦)，场景给出微弱反馈
}

export interface Scene {
  draw(ctx: CanvasRenderingContext2D, t: number, dt: number, mx: number, my: number, o: SceneOpts): void;
}

export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function hex(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a: string, b: string, t: number) {
  const A = hex(a), B = hex(b);
  return `rgb(${(A[0] + (B[0] - A[0]) * t) | 0},${(A[1] + (B[1] - A[1]) * t) | 0},${(A[2] + (B[2] - A[2]) * t) | 0})`;
}

export function layer(w = W, h = H): Layer {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  return { c, x };
}

// 用 Bayer dither 画分段渐变天空；stops 的位置是 0..1，作用在 0..height 上
export function ditherSky(x: CanvasRenderingContext2D, stops: [number, string][], height: number, width = W, steps = 7) {
  for (let y = 0; y < height; y++) {
    const t = y / height;
    for (let px = 0; px < width; px++) {
      const th = (BAYER[(y & 3) * 4 + (px & 3)] + 0.5) / 16;
      const q = clamp(Math.floor(t * steps + th * 0.999), 0, steps) / steps;
      let i = 0;
      while (i < stops.length - 2 && q > stops[i + 1][0]) i++;
      const [p0, c0] = stops[i];
      const [p1, c1] = stops[i + 1];
      x.fillStyle = mix(c0, c1, clamp((q - p0) / (p1 - p0), 0, 1));
      x.fillRect(px, y, 1, 1);
    }
  }
}
