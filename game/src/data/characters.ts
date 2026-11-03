import type { SpriteDef } from './sprites';

// 主角像素圖（側面只畫朝左，朝右用水平翻轉）。N 頭髮、s 皮膚、k 眼睛鞋子、x 上衣、u 褲子
const head = ['..NNNNNN..', '.NNNNNNNN.', 'NNNNNNNNNN'];
const front = [...head, 'NNssssssNN', 'NskssssksN', '.ssssssss.', '..xxxxxx..', '.sxxxxxxs.', '.sxxxxxxs.', '..uuuuuu..'];
const back = [...head, 'NNNNNNNNNN', 'NNNNNNNNNN', '.NNNNNNNN.', '..xxxxxx..', '.sxxxxxxs.', '.sxxxxxxs.', '..uuuuuu..'];
const side = ['...NNNNN..', '..NNNNNNN.', '.NNNNNNNNN', '.sssNNNNNN', 'sksssNNNN.', '.ssssNNN..', '..xxxxx...', '..xsxxx...', '..xsxxx...', '..uuuuu...'];

const legs = {
  idle: ['..uu..uu..', '..kk..kk..'],
  a: ['..uu..uu..', '..kk......'],
  b: ['..uu..uu..', '......kk..'],
};
const sideLegs = {
  idle: ['..uu.uu...', '..kk.kk...'],
  a: ['...uuu....', '...kkk....'],
  b: ['.uu...uu..', '.kk...kk..'],
};

const def = (rows: string[]): SpriteDef => ['f', '#5e3a20', '#d94a3a', rows.join('/')];

/** 主角的 9 格動畫：0–2 朝下、3–5 朝上、6–8 朝左（每組：站立、左腳、右腳） */
export const PLAYER_FRAMES: SpriteDef[] = [
  def([...front, ...legs.idle]), def([...front, ...legs.a]), def([...front, ...legs.b]),
  def([...back, ...legs.idle]), def([...back, ...legs.a]), def([...back, ...legs.b]),
  def([...side, ...sideLegs.idle]), def([...side, ...sideLegs.a]), def([...side, ...sideLegs.b]),
];
