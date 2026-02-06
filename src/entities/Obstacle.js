import Phaser from 'phaser';

// 障碍物类型与 spritesheet 名称映射
const OBSTACLE_TYPES = [
  { key: 'lion',  displaySize: 56, dangerous: true },
  { key: 'vase',  displaySize: 48, dangerous: false },
  { key: 'stone', displaySize: 48, dangerous: false },
  { key: 'brick', displaySize: 48, dangerous: false }
];

export default class Obstacle extends Phaser.GameObjects.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {string} [forceType] - 强制指定类型 key（可选）
   */
  constructor(scene, x, y, forceType) {
    const typeInfo = forceType
      ? OBSTACLE_TYPES.find(t => t.key === forceType) || Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES)
      : Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);

    super(scene, x, y, typeInfo.key, 0);

    scene.add.existing(this);
    this.setOrigin(0.5);
    this.setDisplaySize(typeInfo.displaySize, typeInfo.displaySize);

    /** @type {string} 'lion' | 'vase' | 'stone' | 'brick' */
    this.obstacleType = typeInfo.key;
    /** @type {boolean} 是否为危险障碍（狮子） */
    this.dangerous = typeInfo.dangerous;

    // 狮子播放攻击动画，其他物体做缓慢旋转
    if (this.obstacleType === 'lion') {
      this.play('lion-attack');
    } else {
      scene.tweens.add({
        targets: this,
        angle: 360,
        duration: 3000,
        repeat: -1
      });
    }
  }

  update(speed, delta) {
    this.y += speed * delta / 1000;
  }

  getBounds() {
    const s = this.displayWidth * 0.4;
    return new Phaser.Geom.Rectangle(
      this.x - s,
      this.y - s,
      s * 2,
      s * 2
    );
  }
}
