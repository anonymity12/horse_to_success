import Phaser from 'phaser';

export default class Obstacle extends Phaser.GameObjects.Text {
  constructor(scene, x, y) {
    const types = ['🦁', '🏺', '🗿', '🧱'];
    const emoji = Phaser.Utils.Array.GetRandom(types);
    
    super(scene, x, y, emoji, {
      fontSize: '48px'
    });
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    
    // 添加旋转动画
    scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 2000,
      repeat: -1
    });
  }

  update(speed, delta) {
    this.y += speed * delta / 1000;
  }

  getBounds() {
    return new Phaser.Geom.Rectangle(
      this.x - 20,
      this.y - 20,
      40,
      40
    );
  }
}
