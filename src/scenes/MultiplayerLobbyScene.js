import Phaser from 'phaser';
import MultiplayerManager from '../net/MultiplayerManager.js';

export default class MultiplayerLobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerLobbyScene' });
  }

  init() {
    this.manager = new MultiplayerManager();
    this.statusText = null;
    this.roomText = null;
    this.playersText = null;
    this.isConnecting = false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1e3c72, 0x1e3c72, 0x2a5298, 0x2a5298, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 80, '🌐 多人联机大厅', {
      fontSize: '30px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(width / 2, 125, '最多 4 人 · 10 秒自动开局', {
      fontSize: '16px',
      fill: '#f1f2f6',
      alpha: 0.9
    }).setOrigin(0.5);

    const matchBtn = this.add.text(width / 2, height * 0.35, '⚡ 随机匹配', {
      fontSize: '24px',
      fill: '#ffffff',
      backgroundColor: '#ff6348',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive();

    const roomBtn = this.add.text(width / 2, height * 0.45, '🔑 输入房间码', {
      fontSize: '22px',
      fill: '#ffffff',
      backgroundColor: '#2ed573',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive();

    const backBtn = this.add.text(width / 2, height * 0.80, '⬅️ 返回菜单', {
      fontSize: '18px',
      fill: '#ffffff',
      backgroundColor: '#57606f',
      padding: { x: 16, y: 10 }
    }).setOrigin(0.5).setInteractive();

    matchBtn.on('pointerdown', () => this.startConnect());
    roomBtn.on('pointerdown', () => this.startConnect(true));
    backBtn.on('pointerdown', () => {
      this.cleanup();
      this.scene.start('MenuScene');
    });

    this.statusText = this.add.text(width / 2, height * 0.58, '尚未连接服务器', {
      fontSize: '16px',
      fill: '#ffffff'
    }).setOrigin(0.5);

    this.roomText = this.add.text(width / 2, height * 0.63, '', {
      fontSize: '16px',
      fill: '#ffd93d'
    }).setOrigin(0.5);

    this.playersText = this.add.text(width / 2, height * 0.70, '玩家列表: -', {
      fontSize: '14px',
      fill: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.manager.onRoomJoined((payload) => {
      this.roomText.setText(`房间号: ${payload.roomId}`);
      this.updatePlayers(payload.players || []);
      this.statusText.setText('等待其他玩家加入...');
    });

    this.manager.onPlayersState((payload) => {
      this.updatePlayers(payload.players || []);
    });

    this.manager.onGameStart((payload) => {
      const levelConfig = payload.levelConfig || { name: '联机对战', targetDistance: Infinity };
      this.registry.set('multiplayerManager', this.manager);
      this.scene.start('GameScene', {
        multiplayer: true,
        level: levelConfig,
        playerId: this.manager.playerId,
        playerName: this.manager.playerName,
        roomId: this.manager.roomId
      });
    });

    this.manager.onError((err) => {
      this.statusText.setText('连接失败，请稍后重试');
      this.isConnecting = false;
    });

    this.events.once('shutdown', () => {
      this.cleanup();
    });
  }

  async startConnect(needsRoomCode = false) {
    if (this.isConnecting) return;
    this.isConnecting = true;

    const nameKey = 'horse_player_name';
    const defaultName = window.localStorage.getItem(nameKey) || '玩家';
    const playerName = window.prompt('请输入你的昵称', defaultName) || defaultName;
    window.localStorage.setItem(nameKey, playerName);

    let roomCode = null;
    if (needsRoomCode) {
      roomCode = window.prompt('请输入房间码') || null;
      if (!roomCode) {
        this.isConnecting = false;
        return;
      }
    }

    this.statusText.setText('正在连接服务器...');

    try {
      const serverUrl = window.gameConfig?.multiplayerServerUrl || 'ws://localhost:8080';
      await this.manager.connect(serverUrl);
      this.statusText.setText('已连接，加入房间中...');
      this.manager.joinRoom(playerName, roomCode);
    } catch (err) {
      this.statusText.setText('连接失败，请检查服务器');
      this.isConnecting = false;
    }
  }

  updatePlayers(players) {
    const names = players.map((player) => player.name).join('\n');
    this.playersText.setText(`玩家列表:\n${names || '-'}`);
  }

  cleanup() {
    this.manager.disconnect();
    this.registry.remove('multiplayerManager');
  }
}
