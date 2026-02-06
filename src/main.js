import Phaser from 'phaser';
import config from './config.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';

// 添加所有场景
config.scene = [BootScene, MenuScene, GameScene, GameOverScene];

// 创建游戏实例
const game = new Phaser.Game(config);

// 全局游戏配置
window.gameConfig = {\n  lanes: 3,           // 泳道数量\n  laneWidth: 150,     // 泳道宽度\n  baseSpeed: 300,     // 基础速度\n  speedIncrease: 5,   // 速度增长\n  spawnInterval: 1500 // 生成间隔(ms)\n};