import Phaser from 'phaser';

/** 地圖格大小（像素） */
export const TILE = 16;

/** 圖塊編號，對應 tileset 貼圖由左到右的順序 */
export const T = {
  GRASS: 0, GRASS2: 1, FLOWER: 2, PATH: 3, TREE: 4, WATER: 5, FENCE: 6,
  ROOF_R: 7, EAVE_R: 8, ROOF_B: 9, EAVE_B: 10, ROOF_L: 11, EAVE_L: 12,
  WALL: 13, WINDOW: 14, DOOR: 15, SIGN: 16, TALL: 17, LEDGE: 18,
} as const;
const COUNT = 19;

/** 走不過去的圖塊。門目前也擋住，等有室內地圖再打開；小崖只能往右跳下（由場景處理） */
export const SOLID = new Set<number>([
  T.TREE, T.WATER, T.FENCE, T.ROOF_R, T.EAVE_R, T.ROOF_B, T.EAVE_B, T.ROOF_L, T.EAVE_L,
  T.WALL, T.WINDOW, T.DOOR, T.SIGN, T.LEDGE,
]);

type Ctx = CanvasRenderingContext2D;
const rect = (g: Ctx, x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
const dots = (g: Ctx, ox: number, pts: number[][], c: string) => pts.forEach(([x, y]) => rect(g, ox + x, y, 1, 1, c));

const GRASS = '#74c25a';

function grass(g: Ctx, o: number, alt = false) {
  rect(g, o, 0, 16, 16, GRASS);
  const blades = alt ? [[3, 4], [11, 2], [7, 10], [13, 12], [1, 13]] : [[2, 2], [9, 5], [5, 11], [12, 9], [14, 14]];
  blades.forEach(([x, y]) => { rect(g, o + x, y, 1, 2, '#5fae4a'); rect(g, o + x + 1, y + 1, 1, 1, '#5fae4a'); });
  if (alt) dots(g, o, [[6, 3], [10, 13], [2, 8]], '#88d06a');
}

function roof(g: Ctx, o: number, c: string, eave: boolean) {
  const dark = shade(c, -.22), light = shade(c, .25);
  rect(g, o, 0, 16, 16, c);
  for (let y = 3; y < 16; y += 4) rect(g, o, y, 16, 1, dark);
  for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) rect(g, o + x, y, 1, 3, dark);
  rect(g, o, 0, 16, 1, light);
  if (eave) { rect(g, o, 11, 16, 3, dark); rect(g, o, 14, 16, 2, shade(c, -.45)); }
}

function wall(g: Ctx, o: number) {
  rect(g, o, 0, 16, 16, '#f4efe3');
  rect(g, o, 14, 16, 2, '#d8cfbe');
  rect(g, o, 0, 16, 1, '#e4dccb');
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16), t = f < 0 ? 0 : 255, a = Math.abs(f);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (t - v) * a));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const DRAW: ((g: Ctx, o: number) => void)[] = [];
DRAW[T.GRASS] = (g, o) => grass(g, o);
DRAW[T.GRASS2] = (g, o) => grass(g, o, true);
DRAW[T.FLOWER] = (g, o) => {
  grass(g, o, true);
  [[3, 4, '#f27a93'], [10, 3, '#ffd23f'], [6, 10, '#ffffff'], [12, 11, '#f27a93']].forEach(([x, y, c]) => {
    const X = o + (x as number), Y = y as number;
    rect(g, X - 1, Y, 3, 1, c as string); rect(g, X, Y - 1, 1, 3, c as string); rect(g, X, Y, 1, 1, '#ffbe3d');
  });
};
DRAW[T.PATH] = (g, o) => {
  rect(g, o, 0, 16, 16, '#dcc08f');
  dots(g, o, [[3, 3], [11, 6], [6, 12], [13, 13], [1, 9]], '#c4a46e');
  dots(g, o, [[8, 2], [4, 7], [12, 10]], '#e9d3a8');
};
DRAW[T.TREE] = (g, o) => {
  rect(g, o, 0, 16, 16, '#5aa548');
  rect(g, o + 7, 11, 2, 5, '#7a4f2a');
  for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 6.5);
    if (d > 7) continue;
    const c = d > 6 ? '#1f6029' : (x + y < 9 ? '#5dbb52' : x + y > 17 ? '#24702f' : '#2f8a3a');
    rect(g, o + x, y, 1, 1, c);
  }
};
DRAW[T.WATER] = (g, o) => {
  rect(g, o, 0, 16, 16, '#3d78cf');
  [[2, 3], [9, 7], [4, 12]].forEach(([x, y]) => rect(g, o + x, y, 4, 1, '#74a8ea'));
};
DRAW[T.FENCE] = (g, o) => {
  grass(g, o);
  rect(g, o, 5, 16, 2, '#c89a5a'); rect(g, o, 10, 16, 2, '#c89a5a');
  rect(g, o, 7, 16, 1, '#7a4f2a'); rect(g, o, 12, 16, 1, '#7a4f2a');
  [2, 12].forEach(x => { rect(g, o + x, 3, 2, 12, '#d8aa6a'); rect(g, o + x + 2, 3, 1, 12, '#7a4f2a'); });
};
DRAW[T.ROOF_R] = (g, o) => roof(g, o, '#d9483b', false);
DRAW[T.EAVE_R] = (g, o) => roof(g, o, '#d9483b', true);
DRAW[T.ROOF_B] = (g, o) => roof(g, o, '#3d6fd1', false);
DRAW[T.EAVE_B] = (g, o) => roof(g, o, '#3d6fd1', true);
DRAW[T.ROOF_L] = (g, o) => roof(g, o, '#b8c4d4', false);
DRAW[T.EAVE_L] = (g, o) => roof(g, o, '#b8c4d4', true);
DRAW[T.WALL] = (g, o) => wall(g, o);
DRAW[T.WINDOW] = (g, o) => {
  wall(g, o);
  rect(g, o + 3, 3, 10, 9, '#6b4a2e'); rect(g, o + 4, 4, 8, 7, '#7fb3e0');
  rect(g, o + 7, 4, 2, 7, '#6b4a2e'); rect(g, o + 4, 7, 8, 1, '#6b4a2e'); rect(g, o + 4, 4, 3, 1, '#cfe4fb');
};
DRAW[T.DOOR] = (g, o) => {
  wall(g, o);
  rect(g, o + 3, 2, 10, 14, '#5e3a20'); rect(g, o + 4, 3, 8, 13, '#8a5a32');
  rect(g, o + 4, 8, 8, 1, '#6b4a2e'); rect(g, o + 10, 10, 1, 2, '#ffd23f');
};
DRAW[T.SIGN] = (g, o) => {
  grass(g, o);
  rect(g, o + 7, 9, 2, 6, '#7a4f2a');
  rect(g, o + 2, 2, 12, 8, '#7a4f2a'); rect(g, o + 3, 3, 10, 6, '#d8aa6a');
  rect(g, o + 4, 5, 8, 1, '#a07040'); rect(g, o + 4, 7, 6, 1, '#a07040');
};
DRAW[T.TALL] = (g, o) => {
  rect(g, o, 0, 16, 16, '#4aa347');
  [[1, 2], [6, 1], [11, 3], [3, 8], [9, 7], [14, 9], [1, 13], [7, 12], [12, 14]].forEach(([x, y]) => {
    rect(g, o + x, y, 1, 1, '#8bd66b'); rect(g, o + x, y + 1, 1, 2, '#2e7a34'); rect(g, o + x + 1, y + 2, 1, 1, '#2e7a34');
  });
};

DRAW[T.LEDGE] = (g, o) => {
  grass(g, o);
  rect(g, o + 11, 0, 3, 16, '#9a6236');
  rect(g, o + 14, 0, 2, 16, '#5e3a20');
  rect(g, o + 10, 0, 1, 16, '#5fae4a');
};

/** 把所有圖塊畫進一張貼圖，回傳貼圖 key */
export function makeTileset(scene: Phaser.Scene): string {
  const key = 'tiles';
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, COUNT * TILE, TILE);
  if (!tex) throw new Error('無法建立圖塊貼圖');
  const g = tex.getContext();
  DRAW.forEach((draw, i) => draw(g, i * TILE));
  tex.refresh();
  return key;
}
