import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {\n  constructor() {\n    super({ key: 'MenuScene' });\n  }\n
  create() {\n    const width = this.cameras.main.width;\n    const height = this.cameras.main.height;\n
    // 背景装饰\n    this.createLanterns();\n
    // 游戏标题\n    const title = this.add.text(width / 2, height / 3, '🐴 马到成功', {\n      fontSize: '64px',\n      fill: '#ffd93d',\n      fontStyle: 'bold',\n      stroke: '#ff4757',\n      strokeThickness: 6\n    }).setOrigin(0.5);\n
    // 添加标题动画\n    this.tweens.add({\n      targets: title,\n      scaleX: 1.1,\n      scaleY: 1.1,\n      duration: 1000,\n      yoyo: true,\n      repeat: -1,\n      ease: 'Sine.easeInOut'\n    });\n
    // 副标题\n    this.add.text(width / 2, height / 2, '新春跑酷大冒险', {\n      fontSize: '24px',\n      fill: '#ffffff'\n    }).setOrigin(0.5);\n
    // 开始按钮\n    const startButton = this.add.text(width / 2, height / 2 + 80, '🎮 开始游戏', {\n      fontSize: '32px',\n      fill: '#ffffff',\n      backgroundColor: '#ff6348',\n      padding: { x: 30, y: 15 },\n      borderRadius: 10\n    }).setOrigin(0.5).setInteractive();\n
    startButton.on('pointerover', () => {\n      startButton.setScale(1.1);\n    });\n
    startButton.on('pointerout', () => {\n      startButton.setScale(1);\n    });\n
    startButton.on('pointerdown', () => {\n      this.scene.start('GameScene');\n    });\n
    // 最高分显示\n    const highScore = localStorage.getItem('highScore') || 0;\n    this.add.text(width / 2, height - 50, `最高分: ${highScore}`, {\n      fontSize: '20px',\n      fill: '#ffffff'\n    }).setOrigin(0.5);\n
    // 控制说明\n    this.add.text(width / 2, height - 100, '使用 ← → 或 A/D 键控制', {\n      fontSize: '16px',\n      fill: '#ffffff',\n      alpha: 0.8\n    }).setOrigin(0.5);\n  }\n

  createLanterns() {\n    // 创建装饰灯笼\n    for (let i = 0; i < 6; i++) {\n      const x = (i % 3) * 300 + 100;\n      const y = Math.floor(i / 3) * 500 + 50;\n      const lantern = this.add.text(x, y, '🏮', {\n        fontSize: '48px'\n      });\n
      this.tweens.add({\n        targets: lantern,\n        y: y + 20,\n        duration: 2000 + i * 200,\n        yoyo: true,\n        repeat: -1,\n        ease: 'Sine.easeInOut'\n      });\n    }\n  }\n}