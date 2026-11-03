import Phaser from 'phaser';

// 和設計頁 design/sprites-*.js 同一種格式：
// [模式, 主色 b, 副色 a(空白=依屬性), 圖, 畫布大小]；m=左右對稱只寫左半邊，f=整行照畫；'/' 分行
// 字母：b/a 主副色（自動上明暗）、l/d 主色亮暗、j/c 副色亮暗、v 光暈，其餘是固定色；外框由程式自動加
export type SpriteDef = [mode: 'm' | 'f', main: string, accent: string, rows: string, size?: number];

// 目前先放御三家，M1 再把其餘契靈搬過來
export const SPRITES: Record<number, SpriteDef> = {
  1: ['m', '#d9a066', '#5cc24a', '...a.a./....a../..bbbbb/bbbbbbb/.bbbbbb/..bkbbb/..rbbss/...bssk/....bwb/....bbb/....dd.'],
  4: ['m', '#5b5361', '#ff6a3d', '....bbb/..bbbbb/.bbbbbb/.bbkbbb/.bbbbfa/sbbbbbb/ssbbbbb/.bbbbbb/..dd...'],
  7: ['f', '#5aa0e8', '#e8f4ff', '.......i..../......i.i.../.......i..../b...bbbbbb../bb.bbbbbbbb./.bbbbbbbbkbb/.bbbbbbbbbrb/..bssssssssb/...d.d..d.d.'],
};

const FIXED: Record<string, string> = {
  k: '#1c1a2b', w: '#ffffff', r: '#f27a93', x: '#c8323f', y: '#ffd23f', f: '#ff8a2a', g: '#5cc24a', G: '#2f7d3a',
  n: '#9a6236', N: '#5e3a20', s: '#f3e2bd', i: '#d4f0ff', u: '#3f7ee0', m: '#b3bccb', M: '#6b7385', p: '#8b62c9',
  P: '#d4c2f5', q: '#5bd6c4', h: '#fff3b0',
};

function mix(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const t = f < 0 ? 0 : 255, a = Math.abs(f);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (t - v) * a));
  return '#' + ((1 << 24) | (c[0] << 16) | (c[1] << 8) | c[2]).toString(16).slice(1);
}

/** 把一張手繪圖轉成像素顏色表（null = 透明） */
export function spritePixels(def: SpriteDef): (string | null)[][] {
  const [mode, b, a, src, Z = 16] = def;
  let rows = src.split('/');
  if (mode === 'm') {
    const hw = Math.max(...rows.map(r => r.length));
    rows = rows.map(r => { r = r.padStart(hw, '.'); return r + [...r].reverse().join(''); });
  }
  const W = Math.max(...rows.map(r => r.length)), H = rows.length;
  rows = rows.map(r => r.padEnd(W, '.'));
  const ox = Math.floor((Z - W) / 2), oy = Math.max(1, Z - 1 - H);
  const pal: Record<string, string> = { ...FIXED, b, l: mix(b, .32), d: mix(b, -.25), a, j: mix(a, .32), c: mix(a, -.25) };
  const on = (x: number, y: number) => y >= 0 && y < H && rows[y][x] !== '.' && rows[y][x] !== 'v';
  const px: (string | null)[][] = Array.from({ length: Z }, () => Array(Z).fill(null));
  const solid: boolean[][] = Array.from({ length: Z }, () => Array(Z).fill(false));
  const aura = mix(a, .5);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = rows[y][x];
    if (ch === '.') continue;
    // v 是光暈：半透明、不描邊
    if (ch === 'v') { px[oy + y][ox + x] = aura + '80'; continue; }
    let c = pal[ch] ?? b;
    // 主色、副色自動上明暗：上緣亮、下緣暗
    if (ch === 'b' || ch === 'a') c = !on(x, y - 1) ? pal[ch === 'b' ? 'l' : 'j'] : !on(x, y + 1) ? pal[ch === 'b' ? 'd' : 'c'] : c;
    px[oy + y][ox + x] = c;
    solid[oy + y][ox + x] = true;
  }
  const out = mix(b, -.62), res = px.map(r => r.slice());
  const S = (x: number, y: number) => y >= 0 && y < Z && x >= 0 && x < Z && solid[y][x];
  for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++) {
    if (!solid[y][x] && (S(x, y - 1) || S(x, y + 1) || S(x - 1, y) || S(x + 1, y))) res[y][x] = out;
  }
  return res;
}

/** 把像素顏色表畫到 canvas 的 (ox, oy) */
export function paintPixels(ctx: CanvasRenderingContext2D, p: (string | null)[][], ox = 0, oy = 0) {
  p.forEach((row, y) => row.forEach((c, x) => { if (c) { ctx.fillStyle = c; ctx.fillRect(ox + x, oy + y, 1, 1); } }));
}

/** 把一組 16×16 的圖排成一張橫向的動畫貼圖，每一格是一個 frame（編號 0, 1, 2…） */
export function makeSheet(scene: Phaser.Scene, key: string, frames: SpriteDef[]): string {
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, frames.length * 16, 16);
  if (!tex) throw new Error(`無法建立貼圖 ${key}`);
  frames.forEach((f, i) => { paintPixels(tex.getContext(), spritePixels(f), i * 16, 0); tex.add(i, 0, i * 16, 0, 16, 16); });
  tex.refresh();
  return key;
}

/** 契靈貼圖的 key，例如 mon-1 */
export const monKey = (id: number) => `mon-${id}`;

/** 把手繪圖做成 Phaser 貼圖；已經做過的會跳過 */
export function ensureMonTexture(scene: Phaser.Scene, id: number): string {
  const key = monKey(id);
  if (scene.textures.exists(key)) return key;
  const p = spritePixels(SPRITES[id]);
  const tex = scene.textures.createCanvas(key, p.length, p.length);
  if (!tex) throw new Error(`無法建立貼圖 ${key}`);
  paintPixels(tex.getContext(), p);
  tex.refresh();
  return key;
}
