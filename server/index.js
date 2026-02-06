import http from 'http';
import { WebSocketServer } from 'ws';
import Player from './Player.js';
import Room from './Room.js';
import { MESSAGE_TYPES } from './protocol.js';

const PORT = process.env.PORT || 8080;
const rooms = new Map();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Horse multiplayer server running');
});

const wss = new WebSocketServer({ server });

function createRoomId() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function findAvailableRoom() {
  for (const room of rooms.values()) {
    if (!room.started && room.players.size < room.maxPlayers) {
      return room;
    }
  }
  return null;
}

function getOrCreateRoom(roomCode) {
  if (roomCode && rooms.has(roomCode)) return rooms.get(roomCode);

  if (!roomCode) {
    const available = findAvailableRoom();
    if (available) return available;
  }

  let id = roomCode || createRoomId();
  while (rooms.has(id)) {
    id = createRoomId();
  }
  const room = new Room(id);
  rooms.set(id, room);
  return room;
}

wss.on('connection', (ws) => {
  let player = null;
  let room = null;

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch (err) {
      return;
    }

    if (message.type === MESSAGE_TYPES.JOIN) {
      player = new Player(message.playerName || '玩家', ws);
      room = getOrCreateRoom(message.roomCode);
      room.addPlayer(player);

      ws.send(JSON.stringify({
        type: MESSAGE_TYPES.ROOM_JOINED,
        roomId: room.id,
        playerId: player.id,
        players: room.getPlayersState()
      }));

      return;
    }

    if (!room || !player) return;

    switch (message.type) {
      case MESSAGE_TYPES.STATE_UPDATE:
        room.updatePlayerState(player.id, message);
        break;
      case MESSAGE_TYPES.BOOST_USED:
        player.setBoostActive();
        break;
      case MESSAGE_TYPES.PLAYER_FINISHED:
        room.markPlayerFinished(player.id, message.finalDistance);
        break;
      default:
        break;
    }
  });

  ws.on('close', () => {
    if (room && player) {
      room.removePlayer(player.id);
      if (room.players.size === 0) {
        rooms.delete(room.id);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Multiplayer server listening on :${PORT}`);
});
