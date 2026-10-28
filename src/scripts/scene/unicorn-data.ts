// 独角兽的像素数据与姿势拼装 (纯数据，不依赖 DOM，方便单独渲染检查)。
// 所有姿势共用同一张 34×18 的画布，脚底在最后一行，所以切换姿势时不会跳位。
export const SW = 34;
export const SH = 18;

// 毛色：原著写的是“金色的野兽”；这里用偏淡的麦秆色，让白色的角最亮。
export const PAL: Record<string, string> = {
  B: '#e9dcb4', // body
  S: '#b8a06a', // shade
  m: '#f6efd8', // mane / tail
  h: '#ffffff', // horn
  H: '#ffffff', // horn tip
  e: '#2a2018', // eye
  x: '#6a5a3a', // hoof
};

const pad = (r: string) => r.padEnd(SW, '.').slice(0, SW);

const HEAD_UP = [
  '.....................H',
  '....................h.',
  '...................h..',
  '..................BBB.',
  '.................BBeBB',
  '................mBBBBBB',
  '...............mBBBBBSS',
  '..............mBBBBBB.',
  '.............mBBBBBB..',
].map(pad);

const TORSO = [
  '..mmBBBBBBBBBBBBBBBB',
  '.mmmBBBBBBBBBBBBBBBB',
  'mmm.BBBBBBBBBBBBBBBS',
  'mm..BBBBBBBBBBBBBSSS',
  'm...SSBBBBBBBBBSSS..',
].map(pad);

const LEGS = [
  ['.....BB.BB....BB.BB....', '.....BB.BB....BB.BB....', '.....BB.BB....BB.BB....', '.....xx.xx....xx.xx....'],
  ['....BB..BB...BB...BB...', '....BB..BB...BB...BB....', '....BB..BB...BB...BB....', '....xx..xx...xx...xx....'],
].map((l) => l.map(pad));

const blank = () => Array.from({ length: SH }, () => '.'.repeat(SW));

function put(rows: string[], r: number, c: number, ch: string) {
  if (r < 0 || r >= SH || c < 0 || c >= SW) return;
  rows[r] = rows[r].slice(0, c) + ch + rows[r].slice(c + 1);
}
function fill(rows: string[], r: number, c1: number, c2: number, ch: string) {
  for (let c = c1; c <= c2; c++) put(rows, r, c, ch);
}

// 站立 / 蹲下：drop 是整体下沉的行数，腿随之变短 (drop=4 即卧下)
export function stand(leg: 0 | 1, drop = 0): string[] {
  const rows = blank();
  [...HEAD_UP, ...TORSO].forEach((r, i) => { if (i + drop < SH) rows[i + drop] = r; });
  const legs = LEGS[leg].slice(0, 4 - drop);
  legs.forEach((r, i) => { rows[14 + drop + i] = r; });
  if (drop >= 4) { // 卧下：蹄子露在身体下面
    fill(rows, 17, 6, 8, 'x');
    fill(rows, 17, 14, 17, 'x');
  }
  return rows;
}

// 低头吃草：粗壮的脖子斜压下去，头贴近地面，角朝前
function grazeRows(): string[] {
  const rows = blank();
  TORSO.forEach((r, i) => { rows[9 + i] = r; });
  LEGS[0].forEach((r, i) => { rows[14 + i] = r; });
  const band: [number, number][] = [[15, 20], [17, 22], [19, 24], [21, 26], [23, 28]];
  band.forEach(([x1, x2], i) => {
    fill(rows, 9 + i, x1, x2, 'B');
    if (i > 0) put(rows, 9 + i, x2, 'm');
  });
  fill(rows, 14, 25, 30, 'B');
  fill(rows, 15, 25, 31, 'B');
  fill(rows, 16, 26, 31, 'B');
  fill(rows, 17, 27, 31, 'B');
  fill(rows, 16, 30, 31, 'S');
  fill(rows, 17, 30, 31, 'S');
  put(rows, 15, 27, 'e');
  put(rows, 13, 31, 'h');
  put(rows, 12, 32, 'h');
  put(rows, 11, 33, 'H');
  return rows;
}

// 抬头 → 低头的中间帧：把头和脖子整体向前下方挪一点，再补上脖子
function grazeMidRows(): string[] {
  const rows = blank();
  const base = stand(0);
  const DX = 3, DY = 3;
  base.forEach((r, i) => { rows[i] = r; });
  // 清掉原来的头颈 (列 >= 13 的前 9 行)
  for (let r = 0; r < 9; r++) rows[r] = rows[r].slice(0, 12) + '.'.repeat(SW - 12);
  // 在新位置重画头颈
  HEAD_UP.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch === '.' || c < 12) return;
      put(rows, r + DY, c + DX, ch);
    });
  });
  // 补脖子：从肩膀到新的头位置
  for (let r = 8; r <= 10; r++) fill(rows, r, 15 + (r - 8), 20 + (r - 8) + 1, 'B');
  fill(rows, 7, 17, 20, 'B');
  return rows;
}

const closeEye = (rows: string[]) => rows.map((r) => r.replace('e', 'S'));

export interface Pose { rows: string[]; tip: [number, number] }

export const POSES: Record<string, Pose> = {
  stand0: { rows: stand(0), tip: [21, 0] },
  stand1: { rows: stand(1), tip: [21, 0] },
  down2: { rows: stand(0, 2), tip: [21, 2] },
  down3: { rows: stand(0, 3), tip: [21, 3] },
  lie: { rows: stand(0, 4), tip: [21, 4] },
  lieSleep: { rows: closeEye(stand(0, 4)), tip: [21, 4] },
  grazeMid: { rows: grazeMidRows(), tip: [24, 3] },
  graze: { rows: grazeRows(), tip: [33, 11] },
};
