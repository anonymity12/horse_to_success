import { v4 as uuidv4 } from 'uuid';

export default class Player {
  constructor(name, ws) {
    this.id = uuidv4();
    this.name = name;
    this.ws = ws;
    this.state = {
      distance: 0,
      coins: 0,
      speed: 0,
      city: '起点',
      boostActive: false
    };
    this.finished = false;
    this.finalDistance = 0;
    this.boostTimer = null;
  }

  updateState(payload) {
    this.state = {
      ...this.state,
      distance: payload.distance ?? this.state.distance,
      coins: payload.coins ?? this.state.coins,
      speed: payload.speed ?? this.state.speed,
      city: payload.city ?? this.state.city,
      boostActive: payload.boostActive ?? this.state.boostActive
    };
  }

  setBoostActive(duration = 3000) {
    this.state.boostActive = true;
    if (this.boostTimer) {
      clearTimeout(this.boostTimer);
    }
    this.boostTimer = setTimeout(() => {
      this.state.boostActive = false;
    }, duration);
  }

  markFinished(finalDistance) {
    this.finished = true;
    this.finalDistance = finalDistance ?? this.state.distance;
  }

  getPublicState() {
    return {
      id: this.id,
      name: this.name,
      distance: this.state.distance,
      coins: this.state.coins,
      speed: this.state.speed,
      city: this.state.city,
      boostActive: this.state.boostActive,
      finished: this.finished,
      finalDistance: this.finalDistance
    };
  }
}
