import Phaser from 'phaser';
import { TILE } from './tiles';
import { PLAYER_FRAMES } from '../data/characters';
import { makeSheet } from '../data/sprites';

export type Dir = 'down' | 'up' | 'left' | 'right';
export const DIR_DELTA: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

// 每個方向在動畫貼圖裡的第一格（站立），後面兩格是左腳、右腳；朝右借用朝左再翻轉
const BASE_FRAME: Record<Dir, number> = { down: 0, up: 3, left: 6, right: 6 };

/** 走一格要多久（毫秒）：走路每秒 4 格、跑步每秒 8 格 */
const WALK_MS = 250, RUN_MS = 125;

/** 以「格」為單位移動的主角 */
export class Player {
  readonly sprite: Phaser.GameObjects.Sprite;
  tx: number;
  ty: number;
  facing: Dir = 'down';
  moving = false;
  private stepFoot = false;

  constructor(private scene: Phaser.Scene, tx: number, ty: number) {
    this.tx = tx;
    this.ty = ty;
    const key = makeSheet(scene, 'player', PLAYER_FRAMES);
    this.sprite = scene.add.sprite(tx * TILE, ty * TILE, key, 0).setOrigin(0, 0).setDepth(10);
  }

  face(dir: Dir) {
    this.facing = dir;
    this.sprite.setFrame(BASE_FRAME[dir]).setFlipX(dir === 'right');
  }

  /**
   * 往 dir 走一格。blocked 判斷目的地能不能走；走不過去時只轉向。
   * 回傳是否真的開始移動。
   */
  step(dir: Dir, run: boolean, blocked: (x: number, y: number) => boolean, onArrive?: () => void): boolean {
    if (this.moving) return false;
    this.face(dir);
    const [dx, dy] = DIR_DELTA[dir];
    const nx = this.tx + dx, ny = this.ty + dy;
    if (blocked(nx, ny)) return false;

    this.moving = true;
    this.stepFoot = !this.stepFoot;
    const ms = run ? RUN_MS : WALK_MS;
    this.sprite.setFrame(BASE_FRAME[dir] + (this.stepFoot ? 1 : 2));
    this.scene.time.delayedCall(ms / 2, () => this.sprite.setFrame(BASE_FRAME[dir]));
    return this.moveTo(nx, ny, ms, onArrive);
  }

  /** 從小崖往 dir 跳兩格（中間那格是崖邊），跳的時候會往上彈一下 */
  hop(dir: Dir, onLand?: () => void) {
    if (this.moving) return;
    this.face(dir);
    const [dx, dy] = DIR_DELTA[dir];
    this.moving = true;
    this.scene.tweens.add({ targets: this.sprite, y: this.sprite.y - 6, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
    this.moveTo(this.tx + dx * 2, this.ty + dy * 2, 300, onLand);
  }

  private moveTo(nx: number, ny: number, ms: number, onArrive?: () => void): boolean {
    this.moving = true;
    this.scene.tweens.add({
      targets: this.sprite, x: nx * TILE, duration: ms,
    });
    if (ny !== this.ty) this.scene.tweens.add({ targets: this.sprite, y: ny * TILE, duration: ms });
    this.scene.time.delayedCall(ms, () => { this.tx = nx; this.ty = ny; this.moving = false; onArrive?.(); });
    return true;
  }
}
