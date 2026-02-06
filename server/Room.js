import { MESSAGE_TYPES } from './protocol.js';

export default class Room {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.maxPlayers = 4;
    this.started = false;
    this.countdownTimer = null;
    this.broadcastTimer = null;
    this.gameTimer = null;
    this.seed = null;
    this.levelConfig = null;
    this.startedAt = null;
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    this.startBroadcastLoop();

    if (this.started && this.seed !== null && this.levelConfig) {
      this.sendGameStartTo(player);
      return;
    }

    if (!this.started) {
      if (!this.countdownTimer) {
        this.countdownTimer = setTimeout(() => this.startGame(), 10000);
      }
      if (this.players.size >= this.maxPlayers) {
        this.startGame();
      }
    }
  }

  removePlayer(playerId) {
    this.players.delete(playerId);
    if (this.players.size === 0) {
      this.cleanup();
    }
  }

  updatePlayerState(playerId, payload) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.updateState(payload);
  }

  markPlayerFinished(playerId, finalDistance) {
    const player = this.players.get(playerId);
    if (!player) return;
    player.markFinished(finalDistance);
    if (this.shouldEndGame()) {
      this.endGame();
    }
  }

  shouldEndGame() {
    if (!this.started) return false;
    const allFinished = [...this.players.values()].every((p) => p.finished);
    return allFinished;
  }

  startGame() {
    if (this.started) return;
    this.started = true;
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }

    const levelConfig = {
      name: '联机对战',
      targetDistance: null,
      baseSpeed: 300,
      speedIncrease: 5,
      spawnInterval: 1400
    };

    this.levelConfig = levelConfig;
    this.seed = Math.floor(Math.random() * 1000000);
    this.startedAt = Date.now();

    this.broadcast(this.getGameStartPayload());

    this.gameTimer = setTimeout(() => this.endGame(), 120000);
  }

  startBroadcastLoop() {
    if (this.broadcastTimer) return;
    this.broadcastTimer = setInterval(() => {
      this.broadcast({
        type: MESSAGE_TYPES.PLAYERS_STATE,
        players: this.getPlayersState()
      });
    }, 200);
  }

  endGame() {
    if (!this.started) return;
    this.started = false;
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }

    const rankings = this.getPlayersState()
      .sort((a, b) => (b.finalDistance || b.distance) - (a.finalDistance || a.distance))
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    this.broadcast({
      type: MESSAGE_TYPES.GAME_END,
      rankings
    });
  }

  broadcast(payload) {
    const message = JSON.stringify(payload);
    this.players.forEach((player) => {
      if (player.ws.readyState === 1) {
        player.ws.send(message);
      }
    });
  }

  getGameStartPayload() {
    return {
      type: MESSAGE_TYPES.GAME_START,
      seed: this.seed,
      levelConfig: this.levelConfig,
      startedAt: this.startedAt
    };
  }

  sendGameStartTo(player) {
    if (player.ws.readyState !== 1) return;
    player.ws.send(JSON.stringify(this.getGameStartPayload()));
  }

  getPlayersState() {
    return [...this.players.values()].map((player) => player.getPublicState());
  }

  cleanup() {
    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = null;
    }
    if (this.gameTimer) {
      clearTimeout(this.gameTimer);
      this.gameTimer = null;
    }
  }
}
