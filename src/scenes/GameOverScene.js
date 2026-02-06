import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xff6b9d, 0xff6b9d, 0xffa06b, 0xffa06b, 1);
    graphics.fillRect(0, 0, 800, 600);

    // 烟花效果
    this.createFireworks();

    // 游戏结束标题
    this.add.text(width / 2, height / 3 - 50, '🎊 游戏结束', {
      fontSize: '48px',
      fill: '#ffd93d',
      fontStyle: 'bold',
      stroke: '#ff4757',
      strokeThickness: 6
    }).setOrigin(0.5);

    // 得分
    this.add.text(width / 2, height / 2 - 20, `本次得分: ${this.finalScore}`, {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // 最高分
    const highScore = localStorage.getItem('highScore') || 0;
    const isNewRecord = this.finalScore >= highScore;
    
    this.add.text(width / 2, height / 2 + 30, `最高分: ${highScore}`, {
      fontSize: '24px',
      fill: isNewRecord ? '#ffd93d' : '#ffffff'
    }).setOrigin(0.5);

    if (isNewRecord && this.finalScore > 0) {
      this.add.text(width / 2, height / 2 + 65, '🏆 新纪录！', {
        fontSize: '20px',
        fill: '#ffd93d',
        fontStyle: 'bold'
      }).setOrigin(0.5);
    }

    // 重新开始按钮
    const restartButton = this.add.text(width / 2, height / 2 + 120, '🔄 再来一次', {
      fontSize: '28px',
      fill: '#ffffff',
      backgroundColor: '#ff6348',
      padding: { x: 25, y: 12 }
    }).setOrigin(0.5).setInteractive();

    restartButton.on('pointerover', () => restartButton.setScale(1.1));
    restartButton.on('pointerout', () => restartButton.setScale(1));
    restartButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // 返回菜单按钮
    const menuButton = this.add.text(width / 2, height / 2 + 180, '🏠 返回菜单', {
      fontSize: '24px',
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

  createFireworks() {
    // 简单的烟花文字效果
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 500, () => {
        const x = Phaser.Math.Between(100, 700);
        const y = Phaser.Math.Between(100, 300);
        const firework = this.add.text(x, y, '✨', {
          fontSize: '48px'
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
