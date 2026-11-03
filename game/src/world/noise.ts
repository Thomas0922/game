// 固定種子的雜訊：同樣的座標永遠得到同樣的值，地圖每次產生都一樣

export function hash2(x: number, y: number, s = 0): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s + 1, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, s: number): number {
  return valueNoise(x / 9, y / 9, s) * .6 + valueNoise(x / 4, y / 4, s + 7) * .3 + valueNoise(x / 2, y / 2, s + 13) * .1;
}
