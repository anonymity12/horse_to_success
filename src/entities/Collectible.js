import Phaser from 'phaser';

export default class Collectible extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    const isCoin = Math.random() < 0.5;
    const type = isCoin ? 'coin' : 'redpack';

    super(scene, x, y, type, 0);

    scene.add.existing(this);
    this.setOrigin(0.5);
    this.setDisplaySize(48, 48);

    /** @type {'coin'|'redpack'} */
    this.type = type;

    // 播放对应动画
    if (type === 'coin') {
      this.play('coin-spin');
    } else {
      this.play('redpack-idle');
    }

    // 缩放弹跳效果
    scene.tweens.add({
      targets: this,
      scaleX: this.scaleX * 1.15,
      scaleY: this.scaleY * 1.15,
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
    const s = this.displayWidth * 0.38;
    return new Phaser.Geom.Rectangle(
      this.x - s,
      this.y - s,
      s * 2,
      s * 2
    );
  }
}
