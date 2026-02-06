import Phaser from 'phaser';

export default class Obstacle extends Phaser.GameObjects.Text {\n  constructor(scene, x, y) {\n    const types = ['🦁', '🏺', '🗿', '🧱'];\n    const emoji = Phaser.Utils.Array.GetRandom(types);\n    \n    super(scene, x, y, emoji, {\n      fontSize: '48px'\n    });\n    \n    scene.add.existing(this);\n    this.setOrigin(0.5);\n    \n    // 添加旋转动画\n    scene.tweens.add({\n      targets: this,\n      angle: 360,\n      duration: 2000,\n      repeat: -1\n    });\n  }\n
  update(speed, delta) {\n    this.y += speed * delta / 1000;\n  }\n
  getBounds() {\n    return new Phaser.Geom.Rectangle(\n      this.x - 20,\n      this.y - 20,\n      40,\n      40\n    );\n  }\n}