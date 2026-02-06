import Phaser from 'phaser';
import levels from '../data/levels.js';

export default class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelSelectScene' });
  }

  init() {
    const savedUnlock = window.localStorage.getItem('horse_level_unlocked');
    const parsed = Number.parseInt(savedUnlock, 10);
    this.unlockedIndex = Number.isFinite(parsed) ? parsed : 0;
    // 保底至少解锁第 1 关
    this.unlockedIndex = Math.max(0, Math.min(this.unlockedIndex, levels.length - 1));
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x3494e6, 0x3494e6, 0xec6ead, 0xec6ead, 1);
    graphics.fillRect(0, 0, width, height);

    // 标题
    this.add.text(width / 2, 70, '🏁 城市里程 · 关卡', {
      fontSize: '30px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    const hint = this.add.text(width / 2, 110, '解锁更多城市，距离越远挑战越大', {
      fontSize: '16px',
      fill: '#fefefe',
      alpha: 0.85
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.6,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    this.renderLevelList(width, height);

    // 返回按钮
    const backBtn = this.add.text(width / 2, height - 40, '⬅️ 返回菜单', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#2e86de',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive();

    backBtn.on('pointerover', () => backBtn.setScale(1.08));
    backBtn.on('pointerout', () => backBtn.setScale(1));
    backBtn.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }

  renderLevelList(width, height) {
    const startY = 160;
    const gap = 86;

    levels.forEach((lvl, index) => {
      const isUnlocked = index <= this.unlockedIndex;
      const rowY = startY + index * gap;

      const card = this.add.graphics();
      card.fillStyle(isUnlocked ? 0x0b8457 : 0x5c6272, 0.35);
      card.fillRoundedRect(30, rowY - 32, width - 60, 74, 10);
      card.lineStyle(2, 0xffffff, 0.35);
      card.strokeRoundedRect(30, rowY - 32, width - 60, 74, 10);

      const nameText = this.add.text(50, rowY - 16, `${index + 1}. ${lvl.name}`, {
        fontSize: '20px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 3
      });

      const desc = lvl.description || '尽情奔跑';
      this.add.text(50, rowY + 12, desc, {
        fontSize: '14px',
        fill: '#f1f2f6'
      });

      const target = lvl.targetDistance === null ? '∞' : `${lvl.targetDistance}m`;
      this.add.text(width - 60, rowY - 2, `目标: ${target}`, {
        fontSize: '14px',
        fill: '#ffd93d',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(1, 0.5);

      const btnText = isUnlocked ? '开始' : '未解锁';
      const btn = this.add.text(width - 60, rowY + 24, btnText, {
        fontSize: '16px',
        fill: isUnlocked ? '#ffffff' : '#dfe4ea',
        backgroundColor: isUnlocked ? '#ff6348' : '#57606f',
        padding: { x: 14, y: 6 }
      }).setOrigin(1, 0.5);

      if (isUnlocked) {
        btn.setInteractive();
        btn.on('pointerover', () => btn.setScale(1.06));
        btn.on('pointerout', () => btn.setScale(1));
        btn.on('pointerdown', () => this.startLevel(lvl, index));
      }
    });
  }

  startLevel(level, index) {
    const targetDistance = level.targetDistance === null ? Infinity : level.targetDistance;
    this.scene.start('GameScene', {
      level: {
        ...level,
        targetDistance,
        index
      }
    });
  }
}
