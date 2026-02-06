import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 创建加载进度条
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffd93d, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    // 加载 AI 生成的 spritesheet
    const sprites = ['horse', 'lion', 'vase', 'stone', 'brick', 'coin', 'redpack'];
    for (const name of sprites) {
      this.load.spritesheet(name, `assets/sprites/${name}.png`, {
        frameWidth: 128,
        frameHeight: 128
      });
    }
  }

  create() {
    // 创建动画
    this.createAnimations();
    this.scene.start('MenuScene');
  }

  createAnimations() {
    // 🐴 马的动画
    this.anims.create({
      key: 'horse-run',
      frames: this.anims.generateFrameNumbers('horse', { frames: [0, 1, 2, 3] }),
      frameRate: 10,
      repeat: -1
    });
    this.anims.create({
      key: 'horse-idle',
      frames: this.anims.generateFrameNumbers('horse', { frames: [4] }),
      frameRate: 1,
      repeat: -1
    });
    // 跳跃 frame index 5, 受击 frame index 6 — 单帧，直接 setFrame 即可

    // 🦁 狮子动画
    this.anims.create({
      key: 'lion-idle',
      frames: this.anims.generateFrameNumbers('lion', { frames: [0] }),
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'lion-attack',
      frames: this.anims.generateFrameNumbers('lion', { frames: [1, 2] }),
      frameRate: 8,
      repeat: -1
    });

    // 🪙 金币旋转
    this.anims.create({
      key: 'coin-spin',
      frames: this.anims.generateFrameNumbers('coin', { frames: [0, 1, 2, 3] }),
      frameRate: 8,
      repeat: -1
    });

    // 🧧 红包
    this.anims.create({
      key: 'redpack-idle',
      frames: this.anims.generateFrameNumbers('redpack', { frames: [0] }),
      frameRate: 1,
      repeat: -1
    });
    this.anims.create({
      key: 'redpack-open',
      frames: this.anims.generateFrameNumbers('redpack', { frames: [0, 1, 2] }),
      frameRate: 6,
      repeat: 0
    });
  }
}
