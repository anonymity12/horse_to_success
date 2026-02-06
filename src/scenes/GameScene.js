import Phaser from 'phaser';
import Horse from '../entities/Horse.js';
import Obstacle from '../entities/Obstacle.js';
import Collectible from '../entities/Collectible.js';
import AudioManager from '../utils/AudioManager.js';
import ScoreManager from '../utils/ScoreManager.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.gameSpeed = window.gameConfig.baseSpeed;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.health = 3;
    this.isGameOver = false;

    // 管理器
    this.audioManager = new AudioManager(this);
    this.scoreManager = new ScoreManager();

    // 创建背景
    this.createBackground();

    // 创建泳道
    this.createLanes();

    // 创建马
    this.horse = new Horse(this, this.lanePositions[1], height * 0.77);

    // 创建对象池
    this.obstacles = this.add.group();
    this.collectibles = this.add.group();

    // UI
    this.createUI();

    // 键盘控制
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // 触摸控制
    this.setupTouchControls();

    // 生成定时器
    this.spawnTimer = this.time.addEvent({
      delay: window.gameConfig.spawnInterval,
      callback: this.spawnObjects,
      callbackScope: this,
      loop: true
    });

    // 速度增加定时器
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        if (!this.isGameOver) {
          this.gameSpeed += window.gameConfig.speedIncrease;
        }
      },
      loop: true
    });
  }

  setupTouchControls() {
    this.touchStartX = 0;
    this.touchStartY = 0;

    this.input.on('pointerdown', (pointer) => {
      this.touchStartX = pointer.x;
      this.touchStartY = pointer.y;
    });

    this.input.on('pointerup', (pointer) => {
      const deltaX = pointer.x - this.touchStartX;
      const deltaY = pointer.y - this.touchStartY;

      // 只在水平滑动距离足够大且大于垂直滑动时触发
      if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          this.horse.moveLeft(this.lanePositions);
        } else {
          this.horse.moveRight(this.lanePositions);
        }
      }
    });
  }

  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 创建渐变背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xff6b9d, 0xff6b9d, 0xffa06b, 0xffa06b, 1);
    graphics.fillRect(0, 0, width, height);

    // 添加装饰云朵
    for (let i = 0; i < 4; i++) {
      const cloud = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(30, 150),
        '☁️',
        { fontSize: '32px' }
      );
      
      this.tweens.add({
        targets: cloud,
        x: -80,
        duration: Phaser.Math.Between(15000, 25000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = width + 80;
          cloud.y = Phaser.Math.Between(30, 150);
        }
      });
    }
  }

  createLanes() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const laneWidth = window.gameConfig.laneWidth;
    const startX = (width - laneWidth * 3) / 2;

    // 绘制泳道线
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff, 0.3);

    for (let i = 0; i <= 3; i++) {
      const x = startX + i * laneWidth;
      graphics.lineBetween(x, 180, x, height);
    }

    // 存储泳道中心X坐标
    this.lanePositions = [
      startX + laneWidth * 0.5,
      startX + laneWidth * 1.5,
      startX + laneWidth * 2.5
    ];
  }

  createUI() {
    const width = this.cameras.main.width;

    // 生命值显示
    this.healthText = this.add.text(20, 16, '❤️❤️❤️', {
      fontSize: '20px'
    }).setDepth(10);

    // 分数显示
    this.scoreText = this.add.text(20, 46, '分数: 0', {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(10);

    // 金币显示
    this.coinsText = this.add.text(20, 72, '🪙 0', {
      fontSize: '18px',
      fill: '#ffd93d',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(10);

    // 距离显示
    this.distanceText = this.add.text(20, 98, '距离: 0m', {
      fontSize: '16px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(10);

    // 速度显示
    this.speedText = this.add.text(width - 20, 16, '速度: 1x', {
      fontSize: '16px',
      fill: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0).setDepth(10);
  }

  spawnObjects() {
    if (this.isGameOver) return;

    const lane = Phaser.Math.Between(0, 2);
    const x = this.lanePositions[lane];
    const y = -50;

    // 70% 概率生成障碍物，30% 生成收集物
    if (Math.random() < 0.7) {
      const obstacle = new Obstacle(this, x, y);
      this.obstacles.add(obstacle);

      // 如果是狮子，播放警告音效 + 显示警告标志
      if (obstacle.obstacleType === 'lion') {
        this.audioManager.playWarningBeep();
        const warning = this.add.text(x, y + 40, '⚠️', {
          fontSize: '24px'
        }).setOrigin(0.5).setDepth(5);
        this.tweens.add({
          targets: warning,
          alpha: 0,
          y: y + 80,
          duration: 1000,
          onComplete: () => warning.destroy()
        });
      }
    } else {
      const collectible = new Collectible(this, x, y);
      this.collectibles.add(collectible);
    }
  }

  update(time, delta) {
    if (this.isGameOver) return;

    // 更新距离和分数
    this.distance += this.gameSpeed * delta / 1000 / 100;
    this.score = Math.floor(this.distance);

    // 更新UI
    this.scoreText.setText(`分数: ${this.score}`);
    this.coinsText.setText(`🪙 ${this.coins}`);
    this.distanceText.setText(`距离: ${Math.floor(this.distance)}m`);
    this.speedText.setText(`速度: ${(this.gameSpeed / window.gameConfig.baseSpeed).toFixed(1)}x`);

    // 马的控制
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) ||  
        Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.horse.moveLeft(this.lanePositions);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) ||  
        Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.horse.moveRight(this.lanePositions);
    }

    // 更新障碍物（安全迭代）
    const obstacles = this.obstacles.getChildren().slice();
    for (const obstacle of obstacles) {
      obstacle.update(this.gameSpeed, delta);
      
      // 碰撞检测（无敌帧内跳过）
      if (!this.horse.invincible && this.checkCollision(this.horse, obstacle)) {
        this.hitObstacle();
        obstacle.destroy();
        continue;
      }

      // 清理屏幕外的对象
      if (obstacle.y > 800) {
        obstacle.destroy();
      }
    }

    // 更新收集物（安全迭代）
    const collectibles = this.collectibles.getChildren().slice();
    for (const collectible of collectibles) {
      collectible.update(this.gameSpeed, delta);
      
      // 碰撞检测
      if (this.checkCollision(this.horse, collectible)) {
        this.collectItem(collectible);
        collectible.destroy();
        continue;
      }

      // 清理屏幕外的对象
      if (collectible.y > 800) {
        collectible.destroy();
      }
    }
  }

  checkCollision(obj1, obj2) {
    const bounds1 = obj1.getBounds();
    const bounds2 = obj2.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
  }

  hitObstacle() {
    // 减少生命值
    this.health--;
    this.updateHealthDisplay();

    // 播放碰撞音效
    this.audioManager.playHitSound();

    // 减速惩罚
    this.gameSpeed = Math.max(window.gameConfig.baseSpeed, this.gameSpeed - 50);

    // 无敌帧 + 闪烁效果 + 受击帧
    this.horse.invincible = true;
    this.horse.playHit();
    this.tweens.add({
      targets: this.horse,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        this.horse.alpha = 1;
        this.horse.invincible = false;
        if (!this.isGameOver) {
          this.horse.playRun();
        }
      }
    });

    // 震动效果
    this.cameras.main.shake(200, 0.01);

    // 检查死亡
    if (this.health <= 0) {
      this.gameOver();
    }
  }

  updateHealthDisplay() {
    const hearts = '❤️'.repeat(Math.max(0, this.health)) + '🦤'.repeat(Math.max(0, 3 - this.health));
    this.healthText.setText(hearts);
  }

  collectItem(collectible) {
    // 增加分数
    const points = collectible.type === 'redpack' ? 10 : 5;
    const coinGain = collectible.type === 'redpack' ? 3 : 1;
    this.score += points;
    this.coins += coinGain;
    this.scoreManager.addScore(points);

    // 播放收集音效
    this.audioManager.playCollectSound();
    
    // 显示得分提示
    const scorePopup = this.add.text(collectible.x, collectible.y, `+${points}`, {
      fontSize: '20px',
      fill: '#ffd93d',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);

    this.tweens.add({
      targets: scorePopup,
      y: scorePopup.y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => scorePopup.destroy()
    });

    // 金币汇集动画：从拾取位置飞向金币计数器
    const targetX = this.coinsText.x + 30;
    const targetY = this.coinsText.y + 10;
    const particleCount = collectible.type === 'redpack' ? 6 : 3;

    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.sprite(
        collectible.x + Phaser.Math.Between(-20, 20),
        collectible.y + Phaser.Math.Between(-20, 20),
        'coin', 0
      ).setOrigin(0.5).setDepth(15).setDisplaySize(18, 18);

      const shrinkScale = particle.scaleX * 0.4;
      this.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        scaleX: shrinkScale,
        scaleY: shrinkScale,
        duration: 400 + i * 60,
        ease: 'Power2.easeIn',
        onComplete: () => {
          particle.destroy();
          // 最后一个粒子到达时弹跳计数器
          if (i === particleCount - 1) {
            this.tweens.add({
              targets: this.coinsText,
              scale: 1.4,
              duration: 100,
              yoyo: true
            });
          }
        }
      });
    }
  }

  gameOver() {
    this.isGameOver = true;
    
    // 保存分数（通过 ScoreManager 统一管理）
    this.scoreManager.addScore(this.score);

    // 延迟跳转到游戏结束场景
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        coins: this.coins,
        distance: Math.floor(this.distance)
      });
    });
  }
}
