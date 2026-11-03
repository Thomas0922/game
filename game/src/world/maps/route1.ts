import { T } from '../tiles';
import { fbm } from '../noise';
import type { MapDef } from './types';

/**
 * 1 號道路：30×96 格，南邊接萌芽村、北邊接麥穗鎮、東邊岔路往雙子祭壇。
 * 地形照設計頁的實際尺寸示意圖（那張是橫的 96×30），這裡轉成直的。
 */
const W = 30, H = 96;

/** 在橫向座標（設計頁那張）上畫，最後再轉成直的：橫向 (x, y) → 直向 (y, 95 - x) */
function buildWide(): number[][] {
  const OW = 96, OH = 30;
  const t: number[][] = Array.from({ length: OH }, () => Array(OW).fill(T.GRASS));
  const set = (x: number, y: number, v: number) => { if (x >= 0 && y >= 0 && x < OW && y < OH) t[y][x] = v; };
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < OW && y < OH ? t[y][x] : T.TREE);

  // 兩側樹林邊界、中間幾叢樹、池塘
  for (let x = 0; x < OW; x++) {
    const top = 2 + Math.round(fbm(x, 0, 21) * 3), bot = OH - 3 - Math.round(fbm(x, 9, 22) * 3);
    for (let y = 0; y < OH; y++) if (y < top || y > bot) t[y][x] = T.TREE;
  }
  for (const [cx, cy, r] of [[8, 23, 3], [36, 3, 2], [61, 25, 2], [90, 7, 3], [20, 19, 2], [46, 15, 1]])
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++)
      if (Math.hypot(x - cx, y - cy) <= r + .3) set(x, y, T.TREE);
  for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++)
    if (((x - 41) / 6) ** 2 + ((y - 6.5) / 3) ** 2 < 1) set(x, y, T.WATER);

  // 草叢（會遇到野生契靈）
  for (const [x0, y0, w, h] of [[14, 3, 13, 8], [30, 16, 17, 9], [54, 3, 12, 8], [71, 9, 15, 8]])
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++)
      if (at(x, y) === T.GRASS && fbm(x * 2, y * 2, 23) > .28) set(x, y, T.TALL);

  // 主路（兩格寬）與往雙子祭壇的岔路
  const road = (pts: number[][]) => {
    for (let k = 1; k < pts.length; k++) {
      let [x, y] = pts[k - 1];
      const [x2, y2] = pts[k];
      for (;;) {
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) set(x + i, y + j, T.PATH);
        if (x === x2 && y === y2) break;
        x += Math.sign(x2 - x); y += Math.sign(y2 - y);
      }
    }
  };
  road([[0, 14], [12, 14], [12, 10], [27, 10], [27, 21], [50, 21], [50, 12], [68, 12], [68, 18], [95, 18]]);
  road([[84, 18], [84, 29]]);

  // 單向小崖：轉成直向後只能往右跳下（捷徑）
  for (let x = 53; x <= 66; x++) if (at(x, 16) !== T.PATH) set(x, 16, T.LEDGE);
  return t;
}

function build(): number[][] {
  const wide = buildWide();
  return Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => wide[x][H - 1 - y]));
}

export const ROUTE1: MapDef = {
  id: 'route1',
  name: '1 號道路',
  w: W,
  h: H,
  grid: build(),
  onExit(x, y) {
    if (y >= H) return { map: 'sprout', x: x + 17, y: 0, facing: 'down' };
    if (y < 0) return { message: '前面是麥穗鎮（第 5 步才開放）' };
    if (x >= W) return { message: '往雙子祭壇的小路（之後才開放）' };
    return null;
  },
  encounters: {
    // 啾啾雀、囤囤鼠、葉捲蟲、麥芒犬、瓢瓢蟲、毛線貓、土撥丸、牧場牛、啄啄雞
    table: [[10, 25], [13, 20], [15, 15], [18, 10], [98, 10], [101, 8], [103, 5], [149, 4], [151, 3]],
    levels: [2, 5],
  },
};
