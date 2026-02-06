import Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {\n  constructor() {\n    super({ key: 'GameOverScene' });\n  }\n
  init(data) {\n    this.finalScore = data.score || 0;\n  }\n
  create() {\n    const width = this.cameras.main.width;\n    const height = this.cameras.main.height;\n
    // 背景\n    const graphics = this.add.graphics();\n    graphics.fillGradientStyle(0xff6b9d, 0xff6b9d, 0xffa06b, 0xffa06b, 1);\n    graphics.fillRect(0, 0, 800, 600);\n
    // 烟花效果\n    this.createFireworks();\n
    // 游戏结束标题\n    this.add.text(width / 2, height / 3 - 50, '🎊 游戏结束', {\n      fontSize: '48px',\n      fill: '#ffd93d',\n      fontStyle: 'bold',\n      stroke: '#ff4757',\n      strokeThickness: 6\n    }).setOrigin(0.5);\n
    // 得分\n    this.add.text(width / 2, height / 2 - 20, `本次得分: ${this.finalScore}`, {\n      fontSize: '32px',\n      fill: '#ffffff',\n      fontStyle: 'bold'\n    }).setOrigin(0.5);\n
    // 最高分\n    const highScore = localStorage.getItem('highScore') || 0;\n    const isNewRecord = this.finalScore >= highScore;\n    
    this.add.text(width / 2, height / 2 + 30, `最高分: ${highScore}`, {\n      fontSize: '24px',\n      fill: isNewRecord ? '#ffd93d' : '#ffffff'\n    }).setOrigin(0.5);\n
    if (isNewRecord && this.finalScore > 0) {\n      this.add.text(width / 2, height / 2 + 65, '🏆 新纪录！', {\n        fontSize: '20px',\n        fill: '#ffd93d',\n        fontStyle: 'bold'\n      }).setOrigin(0.5);\n    }\n
    // 重新开始按钮\n    const restartButton = this.add.text(width / 2, height / 2 + 120, '🔄 再来一次', {\n      fontSize: '28px',\n      fill: '#ffffff',\n      backgroundColor: '#ff6348',\n      padding: { x: 25, y: 12 }\n    }).setOrigin(0.5).setInteractive();\n
    restartButton.on('pointerover', () => restartButton.setScale(1.1));\n    restartButton.on('pointerout', () => restartButton.setScale(1));\n    restartButton.on('pointerdown', () => {\n      this.scene.start('GameScene');\n    });\n
    // 返回菜单按钮\n    const menuButton = this.add.text(width / 2, height / 2 + 180, '🏠 返回菜单', {\n      fontSize: '24px',\n      fill: '#ffffff',\n      backgroundColor: '#2e86de',\n      padding: { x: 20, y: 10 }\n    }).setOrigin(0.5).setInteractive();\n
    menuButton.on('pointerover', () => menuButton.setScale(1.1));\n    menuButton.on('pointerout', () => menuButton.setScale(1));\n    menuButton.on('pointerdown', () => {\n      this.scene.start('MenuScene');\n    });\n  }\n
  createFireworks() {\n    // 简单的烟花文字效果\n    for (let i = 0; i < 3; i++) {\n      this.time.delayedCall(i * 500, () => {\n        const x = Phaser.Math.Between(100, 700);\n        const y = Phaser.Math.Between(100, 300);\n        const firework = this.add.text(x, y, '✨', {\n          fontSize: '48px'\n        }).setAlpha(0);\n
        this.tweens.add({\n          targets: firework,\n          alpha: 1,\n          scale: 2,\n          duration: 500,\n          yoyo: true,\n          onComplete: () => firework.destroy()\n        });\n      });\n    }\n  }\n}