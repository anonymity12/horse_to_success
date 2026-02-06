import Phaser from 'phaser';
import ScoreManager from '../utils/ScoreManager.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xff4757, 0xff4757, 0xff6b9d, 0xff6b9d, 1);
    bg.fillRect(0, 0, width, height);

    // 背景装饰
    this.createLanterns();

    // 游戏标题
    const title = this.add.text(width / 2, height * 0.22, '🐴 马到成功', {
      fontSize: '42px',
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
    this.add.text(width / 2, height * 0.32, '新春跑酷大冒险', {
      fontSize: '20px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    // 开始按钮
    const startButton = this.add.text(width / 2, height * 0.46, '🎮 选择关卡', {
      fontSize: '28px',
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
      this.scene.start('LevelSelectScene');
    });

    // 联机按钮
    const multiplayerButton = this.add.text(width / 2, height * 0.56, '🌐 多人联机', {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#2e86de',
      padding: { x: 26, y: 12 },
      borderRadius: 10
    }).setOrigin(0.5).setInteractive();

    multiplayerButton.on('pointerover', () => {
      multiplayerButton.setScale(1.08);
    });

    multiplayerButton.on('pointerout', () => {
      multiplayerButton.setScale(1);
    });

    multiplayerButton.on('pointerdown', () => {
      this.scene.start('MultiplayerLobbyScene');
    });

    // 最高分显示（使用 ScoreManager 统一 key）
    const scoreManager = new ScoreManager();
    const highScore = scoreManager.getHighScore();
    this.add.text(width / 2, height * 0.66, `🏆 最高分: ${highScore}`, {
      fontSize: '18px',
      fill: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // 控制说明
    this.add.text(width / 2, height * 0.72, '⬅️ ⬆️ 或左右滑动控制', {
      fontSize: '14px',
      fill: '#ffffff',
      alpha: 0.8
    }).setOrigin(0.5);

    // 操作提示
    this.add.text(width / 2, height * 0.77, '躲避障碍物  ·  收集红包金币', {
      fontSize: '13px',
      fill: '#ffffff',
      alpha: 0.6
    }).setOrigin(0.5);

    // 底部装饰
    this.add.text(width / 2, height - 30, '🎊 新年快乐 🎊', {
      fontSize: '16px',
      fill: '#ffd93d'
    }).setOrigin(0.5);
  }


  createLanterns() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 创建装饰灯笼
    const positions = [
      { x: 40, y: 30 }, { x: width / 2, y: 50 }, { x: width - 40, y: 30 },
      { x: 60, y: height - 60 }, { x: width - 60, y: height - 60 }
    ];

    positions.forEach((pos, i) => {
      const lantern = this.add.text(pos.x, pos.y, '🏮', {
        fontSize: '36px'
      }).setOrigin(0.5);

      this.tweens.add({
        targets: lantern,
        y: pos.y + 15,
        duration: 2000 + i * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }
}
