export default class MultiplayerManager {
  constructor() {
    this.ws = null;
    this.roomId = null;
    this.playerId = null;
    this.playerName = null;
    this.lastStateSentAt = 0;

    this.handlers = {
      room_joined: [],
      players_state: [],
      game_start: [],
      game_end: [],
      error: []
    };
  }

  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(serverUrl);
      } catch (err) {
        reject(err);
        return;
      }

      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => {
        this.emit('error', err);
        reject(err);
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        this.emit('error', new Error('连接已断开'));
      };
    });
  }

  joinRoom(playerName, roomCode) {
    this.playerName = playerName;
    this.send({
      type: 'join',
      playerName,
      roomCode: roomCode || undefined
    });
  }

  sendState(state) {
    const now = Date.now();
    if (now - this.lastStateSentAt < 200) return;
    this.lastStateSentAt = now;

    this.send({
      type: 'state_update',
      ...state
    });
  }

  sendBoostUsed() {
    this.send({ type: 'boost_used' });
  }

  sendFinished(finalDistance) {
    this.send({ type: 'player_finished', finalDistance });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onRoomJoined(callback) {
    this.handlers.room_joined.push(callback);
  }

  onPlayersState(callback) {
    this.handlers.players_state.push(callback);
  }

  onGameStart(callback) {
    this.handlers.game_start.push(callback);
  }

  onGameEnd(callback) {
    this.handlers.game_end.push(callback);
  }

  onError(callback) {
    this.handlers.error.push(callback);
  }

  handleMessage(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (e) {
      return;
    }

    if (message.type === 'room_joined') {
      this.roomId = message.roomId;
      this.playerId = message.playerId;
    }

    this.emit(message.type, message);
  }

  emit(type, payload) {
    const list = this.handlers[type] || [];
    list.forEach((handler) => handler(payload));
  }

  send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(payload));
  }
}
