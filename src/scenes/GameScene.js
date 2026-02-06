import Phaser from 'phaser';
import Horse from '../entities/Horse.js';
import Obstacle from '../entities/Obstacle.js';
import Collectible from '../entities/Collectible.js';

export default class GameScene extends Phaser.Scene {\n  constructor() {\n    super({ key: 'GameScene' });\n  }\n
  create() {\n    this.gameSpeed = window.gameConfig.baseSpeed;\n    this.score = 0;\n    this.distance = 0;\n    this.isGameOver = false;\n
    // 创建背景\n    this.createBackground();\n
    // 创建泳道\n    this.createLanes();\n
    // 创建马\n    this.horse = new Horse(this, 400, 450);\n
    // 创建对象池\n    this.obstacles = this.add.group();\n    this.collectibles = this.add.group();\n
    // UI\n    this.createUI();\n
    // 键盘控制\n    this.cursors = this.input.keyboard.createCursorKeys();\n    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);\n    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);\n
    // 生成定时器\n    this.spawnTimer = this.time.addEvent({\n      delay: window.gameConfig.spawnInterval,\n      callback: this.spawnObjects,\n      callbackScope: this,\n      loop: true\n    });\n
    // 速度增加定时器\n    this.time.addEvent({\n      delay: 5000,\n      callback: () => {\n        if (!this.isGameOver) {\n          this.gameSpeed += window.gameConfig.speedIncrease;\n        }\n      },\n      loop: true\n    });\n  }\n
  createBackground() {\n    // 创建渐变背景\n    const graphics = this.add.graphics();\n    graphics.fillGradientStyle(0xff6b9d, 0xff6b9d, 0xffa06b, 0xffa06b, 1);\n    graphics.fillRect(0, 0, 800, 600);\n
    // 添加装饰云朵\n    for (let i = 0; i < 5; i++) {\n      const cloud = this.add.text(\n        Phaser.Math.Between(0, 800),\n        Phaser.Math.Between(50, 200),\n        '☁️',\n        { fontSize: '40px' }\n      );\n      \n      this.tweens.add({\n        targets: cloud,\n        x: -100,\n        duration: Phaser.Math.Between(15000, 25000),\n        repeat: -1,\n        onRepeat: () => {\n          cloud.x = 900;\n          cloud.y = Phaser.Math.Between(50, 200);\n        }\n      });\n    }\n  }\n
  createLanes() {\n    const laneY = 400;\n    const laneWidth = window.gameConfig.laneWidth;\n    const startX = (800 - laneWidth * 3) / 2;\n
    // 绘制泳道线\n    const graphics = this.add.graphics();\n    graphics.lineStyle(2, 0xffffff, 0.5);\n
    for (let i = 0; i <= 3; i++) {\n      const x = startX + i * laneWidth;\n      graphics.lineBetween(x, laneY - 100, x, 600);\n    }\n
    // 存储泳道中心X坐标\n    this.lanePositions = [\n      startX + laneWidth * 0.5,\n      startX + laneWidth * 1.5,\n      startX + laneWidth * 2.5\n    ];\n  }\n
  createUI() {\n    // 分数显示\n    this.scoreText = this.add.text(20, 20, '分数: 0', {\n      fontSize: '24px',\n      fill: '#ffffff',\n      fontStyle: 'bold',\n      stroke: '#000000',\n      strokeThickness: 4\n    });\n
    // 距离显示\n    this.distanceText = this.add.text(20, 55, '距离: 0m', {\n      fontSize: '20px',\n      fill: '#ffffff',\n      stroke: '#000000',\n      strokeThickness: 3\n    });\n
    // 速度显示\n    this.speedText = this.add.text(650, 20, '速度: 1x', {\n      fontSize: '20px',\n      fill: '#ffd93d',\n      stroke: '#000000',\n      strokeThickness: 3\n    });\n  }\n
  spawnObjects() {\n    if (this.isGameOver) return;\n
    const lane = Phaser.Math.Between(0, 2);\n    const x = this.lanePositions[lane];\n    const y = -50;\n
    // 70% 概率生成障碍物，30% 生成收集物\n    if (Math.random() < 0.7) {\n      const obstacle = new Obstacle(this, x, y);\n      this.obstacles.add(obstacle);\n    } else {\n      const collectible = new Collectible(this, x, y);\n      this.collectibles.add(collectible);\n    }\n  }\n
  update(time, delta) {\n    if (this.isGameOver) return;\n
    // 更新距离和分数\n    this.distance += this.gameSpeed * delta / 1000 / 100;\n    this.score = Math.floor(this.distance);\n
    // 更新UI\n    this.scoreText.setText(`分数: ${this.score}`);\n    this.distanceText.setText(`距离: ${Math.floor(this.distance)}m`);\n    this.speedText.setText(`速度: ${(this.gameSpeed / window.gameConfig.baseSpeed).toFixed(1)}x`);\n
    // 马的控制\n    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) ||  \n        Phaser.Input.Keyboard.JustDown(this.keyA)) {\n      this.horse.moveLeft(this.lanePositions);\n    }\n    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) ||  \n        Phaser.Input.Keyboard.JustDown(this.keyD)) {\n      this.horse.moveRight(this.lanePositions);\n    }\n
    // 更新障碍物\n    this.obstacles.children.entries.forEach(obstacle => {\n      obstacle.update(this.gameSpeed, delta);\n      \n      // 碰撞检测\n      if (this.checkCollision(this.horse, obstacle)) {\n        this.hitObstacle();\n        obstacle.destroy();\n      }\n
      // 清理屏幕外的对象\n      if (obstacle.y > 650) {\n        obstacle.destroy();\n      }\n    });\n
    // 更新收集物\n    this.collectibles.children.entries.forEach(collectible => {\n      collectible.update(this.gameSpeed, delta);\n      \n      // 碰撞检测\n      if (this.checkCollision(this.horse, collectible)) {\n        this.collectItem(collectible);\n        collectible.destroy();\n      }\n
      // 清理屏幕外的对象\n      if (collectible.y > 650) {\n        collectible.destroy();\n      }\n    });\n  }\n
  checkCollision(obj1, obj2) {\n    const bounds1 = obj1.getBounds();\n    const bounds2 = obj2.getBounds();\n    return Phaser.Geom.Intersects.RectangleToRectangle(bounds1, bounds2);\n  }\n
  hitObstacle() {\n    // 减速惩罚\n    this.gameSpeed = Math.max(window.gameConfig.baseSpeed, this.gameSpeed - 50);\n    \n    // 闪烁效果\n    this.horse.setTint(0xff0000);\n    this.time.delayedCall(200, () => {\n      this.horse.clearTint();\n    });\n
    // 震动效果\n    this.cameras.main.shake(200, 0.01);\n  }\n
  collectItem(collectible) {\n    // 增加分数\n    const points = collectible.type === 'redpack' ? 10 : 5;\n    this.score += points;\n    \n    // 显示得分提示\n    const scorePopup = this.add.text(collectible.x, collectible.y, `+${points}`, {\n      fontSize: '24px',\n      fill: '#ffd93d',\n      fontStyle: 'bold'\n    }).setOrigin(0.5);\n
    this.tweens.add({\n      targets: scorePopup,\n      y: scorePopup.y - 50,\n      alpha: 0,\n      duration: 1000,\n      onComplete: () => scorePopup.destroy()\n    });\n  }\n
  gameOver() {\n    this.isGameOver = true;\n    \n    // 保存最高分\n    const highScore = localStorage.getItem('highScore') || 0;\n    if (this.score > highScore) {\n      localStorage.setItem('highScore', this.score);\n    }\n
    // 延迟跳转到游戏结束场景\n    this.time.delayedCall(1000, () => {\n      this.scene.start('GameOverScene', { score: this.score });\n    });\n  }\n}