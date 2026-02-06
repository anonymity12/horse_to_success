import Phaser from 'phaser';

export default class Collectible extends Phaser.GameObjects.Text {
  constructor(scene, x, y) {
    const random = Math.random();
    const emoji = random > 0.5 ? '🧧' : '🪙';
    const type = random > 0.5 ? 'redpack' : 'coin';
    
    super(scene, x, y, emoji, {
      fontSize: '40px'
    });
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    this.type = type;
    
    // 添加闪烁动画
    scene.tweens.add({
      targets: this,
      scale: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  update(speed, delta) {
    this.y += speed * delta / 1000;
  }

  getBounds() {
    return new Phaser.Geom.Rectangle(
      this.x - 15,
      this.y - 15,
      30,
      30
    );
  }
}
