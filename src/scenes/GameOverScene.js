import Phaser from 'phaser';
import ScoreManager from '../utils/ScoreManager.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    this.finalCoins = data.coins || 0;
    this.finalDistance = data.distance || 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xff6b9d, 0xff6b9d, 0xffa06b, 0xffa06b, 1);
    graphics.fillRect(0, 0, width, height);

    // 烟花效果
    this.createFireworks();

    // 游戏结束标题
    this.add.text(width / 2, height * 0.15, '\ud83c\udf8a \u6e38\u620f\u7ed3\u675f', {
      fontSize: '38px',
      fill: '#ffd93d',
      fontStyle: 'bold',
      stroke: '#ff4757',
      strokeThickness: 6
    }).setOrigin(0.5);

    // \u7edf\u8ba1\u9762\u677f
    const panelY = height * 0.30;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.3);
    panelBg.fillRoundedRect(40, panelY - 10, width - 80, 160, 12);

    this.add.text(width / 2, panelY + 15, `\ud83c\udfc3 \u8ddd\u79bb: ${this.finalDistance}m`, {
      fontSize: '20px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 50, `\u2b50 \u5206\u6570: ${this.finalScore}`, {
      fontSize: '22px',
      fill: '#ffd93d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 85, `\ud83e\ude99 \u91d1\u5e01: ${this.finalCoins}`, {
      fontSize: '20px',
      fill: '#ffd93d'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 120, `\u2764\ufe0f \u6700\u9ad8\u5206: ${this.getHighScore()}`, {
      fontSize: '18px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // \u65b0\u7eaa\u5f55
    const scoreManager = new ScoreManager();
    const isNewRecord = this.finalScore > 0 && this.finalScore >= scoreManager.getHighScore();
    if (isNewRecord) {
      const recordText = this.add.text(width / 2, panelY + 155, '\ud83c\udfc6 \u65b0\u7eaa\u5f55\uff01', {
        fontSize: '22px',
        fill: '#ffd93d',
        fontStyle: 'bold'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        scale: 1.2,
        duration: 500,
        yoyo: true,
        repeat: -1
      });
    }

    // \u91cd\u65b0\u5f00\u59cb\u6309\u94ae
    const restartButton = this.add.text(width / 2, height * 0.72, '\ud83d\udd04 \u518d\u6765\u4e00\u6b21', {
      fontSize: '26px',
      fill: '#ffffff',
      backgroundColor: '#ff6348',
      padding: { x: 25, y: 12 }
    }).setOrigin(0.5).setInteractive();

    restartButton.on('pointerover', () => restartButton.setScale(1.1));
    restartButton.on('pointerout', () => restartButton.setScale(1));
    restartButton.on('pointerdown', () => {
      this.scene.start('LevelSelectScene');
    });

    // \u8fd4\u56de\u83dc\u5355\u6309\u94ae
    const menuButton = this.add.text(width / 2, height * 0.82, '\ud83c\udfe0 \u8fd4\u56de\u83dc\u5355', {
      fontSize: '22px',
      fill: '#ffffff',
      backgroundColor: '#2e86de',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive();

    menuButton.on('pointerover', () => menuButton.setScale(1.1));
    menuButton.on('pointerout', () => menuButton.setScale(1));
    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  getHighScore() {
    const scoreManager = new ScoreManager();
    return scoreManager.getHighScore();
  }

  createFireworks() {
    const width = this.cameras.main.width;
    // 简单的烟花文字效果
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 400, () => {
        const x = Phaser.Math.Between(50, width - 50);
        const y = Phaser.Math.Between(60, 250);
        const firework = this.add.text(x, y, '✨', {
          fontSize: '40px'
        }).setAlpha(0);

        this.tweens.add({
          targets: firework,
          alpha: 1,
          scale: 2,
          duration: 500,
          yoyo: true,
          onComplete: () => firework.destroy()
        });
      });
    }
  }
}
