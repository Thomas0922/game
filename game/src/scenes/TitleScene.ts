import Phaser from 'phaser';
import { ensureMonTexture } from '../data/sprites';

const FONT = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    // 開發用：網址加 ?town 直接進萌芽村，加 ?route1 直接到 1 號道路南口
    const q = new URLSearchParams(location.search);
    if (import.meta.env.DEV && q.has('town')) { this.scene.start('World'); return; }
    if (import.meta.env.DEV && q.has('route1')) { this.scene.start('World', { map: 'route1', x: 14, y: 95, facing: 'up' }); return; }
    const { width, height } = this.scale;

    this.add.text(width / 2, 58, '契靈物語', { fontFamily: FONT, fontSize: '40px', color: '#fff3c4', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add.text(width / 2, 92, 'P A C T L I N G S', { fontFamily: FONT, fontSize: '10px', color: '#f2b04b' })
      .setOrigin(0.5);

    // 御三家：芽芽鹿、炭炭鼴、泡泡鯨，原圖 16×16 放大 3 倍，輪流跳一下
    [1, 4, 7].forEach((id, i) => {
      const mon = this.add.image(width / 2 + (i - 1) * 72, 150, ensureMonTexture(this, id)).setScale(3);
      this.tweens.add({ targets: mon, y: 146, duration: 300, yoyo: true, repeat: -1, repeatDelay: 600, delay: i * 300, ease: 'Stepped' });
    });

    const prompt = this.add.text(width / 2, 214, '按 Enter 開始', { fontFamily: FONT, fontSize: '14px', color: '#e7e9f5' })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, yoyo: true, repeat: -1, ease: 'Stepped' });

    this.add.text(width - 6, height - 6, 'v0.3 1 號道路', { fontFamily: FONT, fontSize: '8px', color: '#6b7090' })
      .setOrigin(1, 1);

    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('World'));
  }
}
