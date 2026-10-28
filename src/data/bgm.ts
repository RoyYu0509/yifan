// 把 mp3 放进 public/bgm/，然后在这里按世界登记。
// 某个世界的 tracks 为空时，播放器会退回到 WebAudio 即时合成的 ambient (占位用)。
import type { WorldId } from './worlds';

export interface Track {
  title: string;
  src: string; // 相对 public/，例如 'bgm/work-01.mp3'
}

export const tracks: Record<WorldId, Track[]> = {
  work: [
    // { title: 'Night Shift', src: 'bgm/work-01.mp3' },
  ],
  off: [
    // { title: 'Golden Field', src: 'bgm/off-01.mp3' },
  ],
};
