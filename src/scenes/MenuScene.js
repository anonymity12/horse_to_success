import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景装饰
    this.createLanterns();

    // 游戏标题
    const title = this.add.text(width / 2, height / 3, '🐴 马到成功', {
      fontSize: '64px',
      fill: '#ffd93d',
      fontStyle: 'bold',
      stroke: '#ff4757',
      strokeThickness: 6
    }).setOrigin(0.5);

    // 添加标题动画
    this.tweens.add({
      targets: title,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 副标题
    this.add.text(width / 2, height / 2, '新春跑酷大冒险', {
      fontSize: '24px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(width / 2, height / 2 + 80, '🎮 开始游戏', {
      fontSize: '32px',
      fill: '#ffffff',
      backgroundColor: '#ff6348',
      padding: { x: 30, y: 15 },
      borderRadius: 10
    }).setOrigin(0.5).setInteractive();

    startButton.on('pointerover', () => {
      startButton.setScale(1.1);
    });

    startButton.on('pointerout', () => {
      startButton.setScale(1);
    });

    startButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // 最高分显示
    const highScore = localStorage.getItem('highScore') || 0;
    this.add.text(width / 2, height - 50, `最高分: ${highScore}`, {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 控制说明
    this.add.text(width / 2, height - 100, '使用 ← → 或 A/D 键控制', {
      fontSize: '16px',
      fill: '#ffffff',
      alpha: 0.8
    }).setOrigin(0.5);
  }


  createLanterns() {
    // 创建装饰灯笼
    for (let i = 0; i < 6; i++) {
      const x = (i % 3) * 300 + 100;
      const y = Math.floor(i / 3) * 500 + 50;
      const lantern = this.add.text(x, y, '🏮', {
        fontSize: '48px'
      });

      this.tweens.add({
        targets: lantern,
        y: y + 20,
        duration: 2000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }
}
