import Phaser from 'phaser';

export const FONT = '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif';
const INK = 0x1a1f36, PAPER = 0xfffdf6;

/** 畫面下方的對話框；按 Enter、空白鍵或 Z 關閉 */
export class MessageBox {
  private box?: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {}

  get open() {
    return !!this.box;
  }

  /** 顯示一段訊息，可附一張貼圖（例如野生契靈）；關閉時 resolve */
  show(text: string, imageKey?: string): Promise<void> {
    this.box?.destroy();
    const { width, height } = this.scene.scale;
    const h = 64, y = height - h - 6;
    const parts: Phaser.GameObjects.GameObject[] = [
      this.scene.add.rectangle(6, y, width - 12, h, PAPER).setOrigin(0, 0).setStrokeStyle(3, INK),
      this.scene.add.rectangle(10, y + 4, width - 20, h - 8).setOrigin(0, 0).setStrokeStyle(1, INK),
    ];
    let textX = 20;
    if (imageKey) {
      parts.push(this.scene.add.image(20, y + h / 2, imageKey).setOrigin(0, 0.5).setScale(3));
      textX = 78;
    }
    parts.push(this.scene.add.text(textX, y + 14, text, {
      fontFamily: FONT, fontSize: '14px', color: '#1a1f36', wordWrap: { width: width - textX - 24, useAdvancedWrap: true },
    }));
    const arrow = this.scene.add.text(width - 22, y + h - 18, '▼', { fontFamily: FONT, fontSize: '10px', color: '#1a1f36' });
    parts.push(arrow);
    this.scene.tweens.add({ targets: arrow, alpha: 0, duration: 400, yoyo: true, repeat: -1, ease: 'Stepped' });
    this.box = this.scene.add.container(0, 0, parts).setScrollFactor(0).setDepth(200);

    return new Promise(resolve => {
      const kb = this.scene.input.keyboard!;
      const close = () => {
        kb.off('keydown-ENTER', close); kb.off('keydown-SPACE', close); kb.off('keydown-Z', close);
        this.box?.destroy();
        this.box = undefined;
        resolve();
      };
      // 晚一拍才開始聽按鍵，避免觸發對話框的那一下就把它關掉
      this.scene.time.delayedCall(150, () => {
        kb.on('keydown-ENTER', close); kb.on('keydown-SPACE', close); kb.on('keydown-Z', close);
      });
    });
  }
}
