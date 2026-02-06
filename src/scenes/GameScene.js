import Phaser from 'phaser';
import Horse from '../entities/Horse.js';
import Obstacle from '../entities/Obstacle.js';
import Collectible from '../entities/Collectible.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.gameSpeed = window.gameConfig.baseSpeed;
    this.score = 0;
    this.distance = 0;
    this.isGameOver = false;

    // 创建背景
    this.createBackground();

    // 创建泳道
    this.createLanes();

    // 创建马
    this.horse = new Horse(this, 400, 450);

    // 创建对象池
    this.obstacles = this.add.group();
    this.collectibles = this.add.group();

    // UI
    this.createUI();

    // 键盘控制
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

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

  createBackground() {
    // 创建渐变背景
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0xff6b9d, 0xff6b9d, 0xffa06b, 0xffa06b, 1);
    graphics.fillRect(0, 0, 800, 600);

    // 添加装饰云朵
    for (let i = 0; i < 5; i++) {
      const cloud = this.add.text(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(50, 200),
        '☁️',
        { fontSize: '40px' }
      );
      
      this.tweens.add({
        targets: cloud,
        x: -100,
        duration: Phaser.Math.Between(15000, 25000),
        repeat: -1,
        onRepeat: () => {
          cloud.x = 900;
          cloud.y = Phaser.Math.Between(50, 200);
        }
      });
    }
  }

  createLanes() {
    const laneY = 400;
    const laneWidth = window.gameConfig.laneWidth;
    const startX = (800 - laneWidth * 3) / 2;

    // 绘制泳道线
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffffff, 0.5);

    for (let i = 0; i <= 3; i++) {
      const x = startX + i * laneWidth;
      graphics.lineBetween(x, laneY - 100, x, 600);
    }

    // 存储泳道中心X坐标
    this.lanePositions = [
      startX + laneWidth * 0.5,
      startX + laneWidth * 1.5,
      startX + laneWidth * 2.5
    ];
  }

  createUI() {
    // 分数显示
    this.scoreText = this.add.text(20, 20, '分数: 0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    });

    // 距离显示
    this.distanceText = this.add.text(20, 55, '距离: 0m', {
      fontSize: '20px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    });

    // 速度显示
    this.speedText = this.add.text(650, 20, '速度: 1x', {
      fontSize: '20px',
      fill: '#ffd93d',
      stroke: '#000000',
      strokeThickness: 3
    });
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

    // 更新障碍物
    this.obstacles.children.entries.forEach(obstacle => {
      obstacle.update(this.gameSpeed, delta);
      
      // 碰撞检测
      if (this.checkCollision(this.horse, obstacle)) {
        this.hitObstacle();
        obstacle.destroy();
      }

      // 清理屏幕外的对象
      if (obstacle.y > 650) {
        obstacle.destroy();
      }
    });

    // 更新收集物
    this.collectibles.children.entries.forEach(collectible => {
      collectible.update(this.gameSpeed, delta);
      
      // 碰撞检测
      if (this.checkCollision(this.horse, collectible)) {
        this.collectItem(collectible);
        collectible.destroy();
      }

      // 清理屏幕外的对象
      if (collectible.y > 650) {
        collectible.destroy();
      }
    });
  }

  checkCollision(obj1, obj2) {
    const bounds1 = obj1.getBounds();
    const bounds2 = obj2.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);
  }

  hitObstacle() {
    // 减速惩罚
    this.gameSpeed = Math.max(window.gameConfig.baseSpeed, this.gameSpeed - 50);
    
    // 闪烁效果
    this.horse.setTint(0xff0000);
    this.time.delayedCall(200, () => {
      this.horse.clearTint();
    });

    // 震动效果
    this.cameras.main.shake(200, 0.01);
  }

  collectItem(collectible) {
    // 增加分数
    const points = collectible.type === 'redpack' ? 10 : 5;
    this.score += points;
    
    // 显示得分提示
    const scorePopup = this.add.text(collectible.x, collectible.y, `+${points}`, {
      fontSize: '24px',
      fill: '#ffd93d',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: scorePopup,
      y: scorePopup.y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => scorePopup.destroy()
    });
  }

  gameOver() {
    this.isGameOver = true;
    
    // 保存最高分
    const highScore = localStorage.getItem('highScore') || 0;
    if (this.score > highScore) {
      localStorage.setItem('highScore', this.score);
    }

    // 延迟跳转到游戏结束场景
    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }
}
