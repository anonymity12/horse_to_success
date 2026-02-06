import Phaser from 'phaser';

export default class Horse extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'horse', 0);
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    // Increase player horse size for better visibility on mobile/vertical layout
    this.setDisplaySize(160, 160);
    
    this.currentLane = 1; // 0:左, 1:中, 2:右
    this.invincible = false; // 无敌帧状态

    // 默认播放跑步动画
    this.play('horse-run');
  }

  moveLeft(lanePositions) {
    if (this.currentLane > 0) {
      this.currentLane--;
      this.moveTo(lanePositions[this.currentLane]);
    }
  }

  moveRight(lanePositions) {
    if (this.currentLane < lanePositions.length - 1) {
      this.currentLane++;
      this.moveTo(lanePositions[this.currentLane]);
    }
  }

  moveTo(targetX) {
    this.scene.tweens.add({
      targets: this,
      x: targetX,
      duration: 150,
      ease: 'Power2'
    });
  }

  /** 受击 — 切换到受击帧 */
  playHit() {
    this.setFrame(6);
  }

  /** 恢复跑步动画 */
  playRun() {
    this.play('horse-run');
  }

  getBounds() {
    // 缩小碰撞盒，给玩家一点容错空间
    // use a slightly smaller factor because the sprite is larger now
    const s = this.displayWidth * 0.2;
    return new Phaser.Geom.Rectangle(
      this.x - s,
      this.y - s,
      s * 2,
      s * 2
    );
  }
}
