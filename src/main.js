import Phaser from 'phaser';
import config from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import LevelSelectScene from './scenes/LevelSelectScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// 添加所有场景
config.scene = [BootScene, MenuScene, LevelSelectScene, GameScene, GameOverScene];

// 创建游戏实例
const game = new Phaser.Game(config);

// 全局游戏配置
window.gameConfig = {
  lanes: 3,           // 泳道数量
  laneWidth: 120,     // 泳道宽度
  baseSpeed: 300,     // 基础速度
  speedIncrease: 5,   // 速度增长
  spawnInterval: 1500 // 生成间隔(ms)
};
