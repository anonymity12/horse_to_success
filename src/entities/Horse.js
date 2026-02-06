import Phaser from 'phaser';

export default class Horse extends Phaser.GameObjects.Text {\n  constructor(scene, x, y) {\n    super(scene, x, y, '🐴', {\n      fontSize: '64px'\n    });\n    \n    scene.add.existing(this);\n    this.setOrigin(0.5);\n    \n    this.currentLane = 1; // 0:左, 1:中, 2:右\n    \n    // 添加轻微的上下跳动动画\n    scene.tweens.add({\n      targets: this,\n      y: y - 10,\n      duration: 300,\n      yoyo: true,\n      repeat: -1,\n      ease: 'Sine.easeInOut'\n    });\n  }\n
  moveLeft(lanePositions) {\n    if (this.currentLane > 0) {\n      this.currentLane--;\n      this.moveTo(lanePositions[this.currentLane]);\n    }\n  }\n
  moveRight(lanePositions) {\n    if (this.currentLane < lanePositions.length - 1) {\n      this.currentLane++;\n      this.moveTo(lanePositions[this.currentLane]);\n    }\n  }\n
  moveTo(targetX) {\n    this.scene.tweens.add({\n      targets: this,\n      x: targetX,\n      duration: 150,\n      ease: 'Power2'\n    });\n  }\n
  getBounds() {\n    return new Phaser.Geom.Rectangle(\n      this.x - 25,\n      this.y - 25,\n      50,\n      50\n    );\n  }\n}