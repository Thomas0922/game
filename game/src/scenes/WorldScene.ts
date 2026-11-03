import Phaser from 'phaser';
import { makeTileset, SOLID, T, TILE } from '../world/tiles';
import { MAPS } from '../world/maps';
import type { MapDef } from '../world/maps/types';
import { SPROUT_START } from '../world/maps/sproutVillage';
import { Player, DIR_DELTA, type Dir } from '../world/Player';
import { SPECIES } from '../data/species';
import { ensureMonTexture } from '../data/sprites';
import { FONT, MessageBox } from '../ui/MessageBox';

/** 進入場景時要放在哪張地圖的哪一格 */
export interface WorldEntry {
  map: string;
  x: number;
  y: number;
  facing: Dir;
}

/** 每走一步在草叢裡遇敵的機率，以及兩次遇敵之間至少要走幾步 */
const ENCOUNTER_RATE = 0.1;
const MIN_STEPS_BETWEEN = 3;

/** 所有戶外地圖共用的場景：載入地圖、走路、換地圖、草叢遇敵 */
export class WorldScene extends Phaser.Scene {
  private def!: MapDef;
  private player!: Player;
  private keys!: Record<Dir | 'run', Phaser.Input.Keyboard.Key[]>;
  private msg!: MessageBox;
  private toast?: Phaser.GameObjects.Container;
  private busy = false;
  private stepsSinceEncounter = 0;

  constructor() {
    super('World');
  }

  create(entry?: WorldEntry) {
    const at = entry?.map ? entry : { map: 'sprout', ...SPROUT_START, facing: 'down' as Dir };
    this.def = MAPS[at.map];
    this.busy = false;
    this.stepsSinceEncounter = 0;

    const map = this.make.tilemap({ data: this.def.grid, tileWidth: TILE, tileHeight: TILE });
    const tileset = map.addTilesetImage('tiles', makeTileset(this), TILE, TILE, 0, 0);
    if (!tileset) throw new Error('圖塊貼圖載入失敗');
    map.createLayer(0, tileset, 0, 0);

    this.player = new Player(this, at.x, at.y);
    this.player.face(at.facing);
    this.msg = new MessageBox(this);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.def.w * TILE, this.def.h * TILE);
    cam.startFollow(this.player.sprite, true);
    cam.setRoundPixels(true);
    cam.fadeIn(200, 0, 0, 0);

    const kb = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const k = (...codes: number[]) => codes.map(c => kb.addKey(c));
    this.keys = { up: k(K.UP, K.W), down: k(K.DOWN, K.S), left: k(K.LEFT, K.A), right: k(K.RIGHT, K.D), run: k(K.SHIFT) };

    this.showBanner(this.def.name);
  }

  update() {
    if (this.busy || this.player.moving || this.msg.open) return;
    const held = (list: Phaser.Input.Keyboard.Key[]) => list.some(key => key.isDown);
    const dir = (['up', 'down', 'left', 'right'] as Dir[]).find(d => held(this.keys[d]));
    if (!dir) return;

    const [dx, dy] = DIR_DELTA[dir];
    const nx = this.player.tx + dx, ny = this.player.ty + dy;

    if (nx < 0 || ny < 0 || nx >= this.def.w || ny >= this.def.h) { this.leaveMap(dir, nx, ny); return; }
    // 小崖只能往右跳下
    if (this.def.grid[ny][nx] === T.LEDGE && dir === 'right') { this.player.hop(dir); return; }
    this.player.step(dir, held(this.keys.run), (x, y) => SOLID.has(this.def.grid[y][x]), () => this.arrived());
  }

  /** 走到地圖外：換地圖，或只顯示提示 */
  private leaveMap(dir: Dir, x: number, y: number) {
    this.player.face(dir);
    const r = this.def.onExit(x, y);
    if (!r) return;
    if ('message' in r) { this.showToast(r.message); return; }
    this.busy = true;
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart(r));
  }

  /** 每走完一格檢查：踩在草叢裡就擲骰看會不會遇敵 */
  private arrived() {
    this.stepsSinceEncounter++;
    const enc = this.def.encounters;
    if (!enc || this.def.grid[this.player.ty][this.player.tx] !== T.TALL) return;
    if (this.stepsSinceEncounter < MIN_STEPS_BETWEEN || Math.random() >= ENCOUNTER_RATE) return;
    this.stepsSinceEncounter = 0;
    this.encounter(enc.table, enc.levels);
  }

  private async encounter(table: [number, number][], [lo, hi]: [number, number]) {
    const total = table.reduce((s, [, w]) => s + w, 0);
    let roll = Math.random() * total;
    const id = (table.find(([, w]) => (roll -= w) < 0) ?? table[0])[0];
    const level = lo + Math.floor(Math.random() * (hi - lo + 1));
    this.busy = true;
    this.cameras.main.flash(250, 255, 255, 255);
    await this.msg.show(`野生的 ${SPECIES[id].name}（Lv${level}）出現了！\n（戰鬥在下一步才做，先按 Enter 關掉）`, ensureMonTexture(this, id));
    this.busy = false;
  }

  /** 進入地點時左上角的地名牌，2 秒後淡出 */
  private showBanner(name: string) {
    const text = this.add.text(14, 10, name, { fontFamily: FONT, fontSize: '14px', color: '#1a1f36' });
    const bg = this.add.rectangle(8, 6, text.width + 12, text.height + 8, 0xfffdf6).setOrigin(0, 0).setStrokeStyle(2, 0x1a1f36);
    const banner = this.add.container(0, 0, [bg, text]).setScrollFactor(0).setDepth(100);
    this.tweens.add({ targets: banner, alpha: 0, delay: 2000, duration: 400, onComplete: () => banner.destroy() });
  }

  /** 畫面下方的短提示，1.5 秒後消失 */
  private showToast(text: string) {
    if (this.toast) return;
    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height - 22, text, { fontFamily: FONT, fontSize: '12px', color: '#1a1f36' }).setOrigin(0.5);
    const bg = this.add.rectangle(width / 2, height - 22, t.width + 20, t.height + 10, 0xfffdf6).setStrokeStyle(2, 0x1a1f36);
    this.toast = this.add.container(0, 0, [bg, t]).setScrollFactor(0).setDepth(100);
    this.time.delayedCall(1500, () => { this.toast?.destroy(); this.toast = undefined; });
  }
}
