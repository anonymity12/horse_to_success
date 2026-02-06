import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {\n  constructor() {\n    super({ key: 'BootScene' });\n  }\n
  preload() {\n    // 创建加载进度条\n    const width = this.cameras.main.width;\n    const height = this.cameras.main.height;\n    
    const progressBar = this.add.graphics();\n    const progressBox = this.add.graphics();\n    progressBox.fillStyle(0x222222, 0.8);\n    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);\n    
    const loadingText = this.add.text(width / 2, height / 2 - 50, '加载中...', {\n      fontSize: '20px',\n      fill: '#ffffff'\n    }).setOrigin(0.5);\n
    this.load.on('progress', (value) => {\n      progressBar.clear();\n      progressBar.fillStyle(0xffd93d, 1);\n      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);\n    });\n
    this.load.on('complete', () => {\n      progressBar.destroy();\n      progressBox.destroy();\n      loadingText.destroy();\n    });\n
    // 这里可以预加载资源，目前使用代码生成图形\n  }\n

  create() {\n    this.scene.start('MenuScene');\n  }\n}