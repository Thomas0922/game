import { T } from '../tiles';
import type { MapDef } from './types';

/** 萌芽村：40×32 格。北邊出口通往 1 號道路 */
const SPROUT_W = 40;
const SPROUT_H = 32;
/** 新遊戲的起點：主角家門口 */
export const SPROUT_START = { x: 10, y: 22 };

const hash = (x: number, y: number) => {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** 房子：屋頂 2 列 + 屋簷 1 列 + 牆；門與窗的位置用相對座標 */
function house(m: number[][], x: number, y: number, w: number, wallRows: number, roof: number, eave: number,
  doors: number[], windows: [number, number][]) {
  for (let i = 0; i < w; i++) {
    m[y][x + i] = roof; m[y + 1][x + i] = roof; m[y + 2][x + i] = eave;
    for (let r = 0; r < wallRows; r++) m[y + 3 + r][x + i] = T.WALL;
  }
  windows.forEach(([dx, dr]) => { m[y + 3 + dr][x + dx] = T.WINDOW; });
  doors.forEach(dx => { m[y + 2 + wallRows][x + dx] = T.DOOR; });
}

function line(m: number[][], x0: number, y0: number, x1: number, y1: number, t: number) {
  for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) m[y][x] = t;
}

export const SPROUT: MapDef = {
  id: 'sprout',
  name: '萌芽村',
  w: SPROUT_W,
  h: SPROUT_H,
  grid: buildSproutVillage(),
  // 北邊出口 x=31、32 對到 1 號道路底部 x=14、15
  onExit: (x, y) => (y < 0 && (x === 31 || x === 32) ? { map: 'route1', x: x - 17, y: 95, facing: 'up' } : null),
};

function buildSproutVillage(): number[][] {
  const W = SPROUT_W, H = SPROUT_H;
  const m: number[][] = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x): number => {
    if (x < 2 || x >= W - 2 || y < 2 || y >= H - 2) return T.TREE;
    const r = hash(x, y);
    return r < .06 ? T.FLOWER : r < .4 ? T.GRASS2 : T.GRASS;
  }));

  // 道路：北邊出口 → 主街 → 研究所、兩間房子、池塘邊
  line(m, 31, 0, 32, 13, T.PATH);
  line(m, 10, 12, 32, 13, T.PATH);
  line(m, 13, 9, 14, 12, T.PATH);
  line(m, 20, 13, 21, 24, T.PATH);
  line(m, 10, 22, 10, 24, T.PATH);
  line(m, 29, 22, 29, 24, T.PATH);
  line(m, 10, 24, 29, 24, T.PATH);

  // 白樺研究所（藍灰屋頂、雙門）與前面的柵欄
  house(m, 8, 4, 12, 2, T.ROOF_L, T.EAVE_L, [5, 6], [[1, 0], [3, 0], [8, 0], [10, 0]]);
  line(m, 7, 10, 12, 10, T.FENCE);
  line(m, 15, 10, 20, 10, T.FENCE);
  // 主角家（紅屋頂）、阿澈家（藍屋頂）
  house(m, 7, 17, 6, 2, T.ROOF_R, T.EAVE_R, [3], [[1, 0], [4, 0]]);
  house(m, 26, 17, 6, 2, T.ROOF_B, T.EAVE_B, [3], [[1, 0], [4, 0]]);

  // 池塘
  for (let y = 25; y <= 28; y++) for (let x = 15; x <= 27; x++)
    if (((x - 21) / 4.6) ** 2 + ((y - 26.8) / 1.9) ** 2 < 1) m[y][x] = T.WATER;

  // 告示牌：村口、研究所前
  m[11][30] = T.SIGN;
  m[9][16] = T.SIGN;

  // 村裡零星的樹
  [[4, 7], [5, 14], [3, 22], [35, 6], [36, 16], [34, 26], [24, 6], [23, 16], [16, 15], [5, 27]]
    .forEach(([x, y]) => { m[y][x] = T.TREE; });
  return m;
}
