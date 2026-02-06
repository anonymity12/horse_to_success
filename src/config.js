import Phaser from 'phaser';

export default {
  type: Phaser.AUTO,
  width: 420,
  height: 750,
  parent: 'game-container',
  backgroundColor: '#ff4757',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: []  // 场景将在 main.js 中添加
};
