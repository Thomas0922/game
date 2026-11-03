import Phaser from 'phaser';
import { makeTileset, SOLID, TILE } from '../world/tiles';
import { buildSproutVillage, SPROUT_EXIT_X, SPROUT_H, SPROUT_START, SPROUT_W } from '../world/maps/sproutVillage';
import { Player, type Dir } from '../world/Player';

const FONT = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';

export class TownScene extends Phaser.Scene {
  private grid!: number[][];
  private player!: Player;
  private keys!: Record<Dir | 'run', Phaser.Input.Keyboard.Key[]>;
  private toast?: Phaser.GameObjects.Container;

  constructor() {
    super('Town');
  }

  create() {
    this.grid = buildSproutVillage();
    const map = this.make.tilemap({ data: this.grid, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', makeTileset(this), TILE, TILE, 0, 0);
    if (!tileset) throw new Error('圖塊貼圖載入失敗');
    map.createLayer(0, tileset, 0, 0);

    this.player = new Player(this, SPROUT_START.x, SPROUT_START.y);
    this.player.face('down');

    const cam = this.cameras.main;
    cam.setBounds(0, 0, SPROUT_W * TILE, SPROUT_H * TILE);
    cam.startFollow(this.player.sprite, true);
    cam.setRoundPixels(true);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const k = (...codes: number[]) => codes.map(c => kb.addKey(c));
    this.keys = {
      up: k(K.UP, K.W), down: k(K.DOWN, K.S), left: k(K.LEFT, K.A), right: k(K.RIGHT, K.D), run: k(K.SHIFT),
    };

    this.showBanner('萌芽村');
  }

  update() {
    if (this.player.moving) return;
    const held = (list: Phaser.Input.Keyboard.Key[]) => list.some(key => key.isDown);
    const dir = (['up', 'down', 'left', 'right'] as Dir[]).find(d => held(this.keys[d]));
    if (!dir) return;
    this.player.step(dir, held(this.keys.run), (x, y) => this.blocked(x, y));
  }

  /** 目的地走不走得過去；走到北邊出口時先提示下一步才開放 */
  private blocked(x: number, y: number): boolean {
    if (y < 0 && SPROUT_EXIT_X.includes(x)) {
      this.showToast('往 1 號道路（下一步才開放）');
      return true;
    }
    if (x < 0 || y < 0 || x >= SPROUT_W || y >= SPROUT_H) return true;
    return SOLID.has(this.grid[y][x]);
  }

  /** 進入地點時左上角的地名牌，2 秒後淡出 */
  private showBanner(name: string) {
    const text = this.add.text(14, 10, name, { fontFamily: FONT, fontSize: '14px', color: '#1a1f36' });
    const bg = this.add.rectangle(8, 6, text.width + 12, text.height + 8, 0xfffdf6).setOrigin(0, 0).setStrokeStyle(2, 0x1a1f36);
    const banner = this.add.container(0, 0, [bg, text]).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: banner, alpha: 0, delay: 2000, duration: 400, onComplete: () => banner.destroy() });
  }

  /** 畫面下方的提示框，1.5 秒後消失 */
  private showToast(msg: string) {
    if (this.toast) return;
    const { width, height } = this.scale;
    const text = this.add.text(width / 2, height - 22, msg, { fontFamily: FONT, fontSize: '12px', color: '#1a1f36' }).setOrigin(0.5);
    const bg = this.add.rectangle(width / 2, height - 22, text.width + 20, text.height + 10, 0xfffdf6).setStrokeStyle(2, 0x1a1f36);
    this.toast = this.add.container(0, 0, [bg, text]).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(1500, () => { this.toast?.destroy(); this.toast = undefined; });
  }
}
