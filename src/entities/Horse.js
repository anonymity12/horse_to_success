import Phaser from 'phaser';

export default class Horse extends Phaser.GameObjects.Text {
  constructor(scene, x, y) {
    super(scene, x, y, '🐴', {
      fontSize: '64px'
    });
    
    scene.add.existing(this);
    this.setOrigin(0.5);
    
    this.currentLane = 1; // 0:左, 1:中, 2:右
    this.invincible = false; // 无敌帧状态
    
    // 添加轻微的上下跳动动画
    scene.tweens.add({
      targets: this,
      y: y - 10,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
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

  getBounds() {
    return new Phaser.Geom.Rectangle(
      this.x - 25,
      this.y - 25,
      50,
      50
    );
  }
}
