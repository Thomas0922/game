import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { WorldScene } from './scenes/WorldScene';

// 原生解析度 480×270（16×16 地圖格 → 30×17 格一個畫面），整數放大到視窗大小
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 270,
  backgroundColor: '#0f1229',
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [TitleScene, WorldScene],
});
