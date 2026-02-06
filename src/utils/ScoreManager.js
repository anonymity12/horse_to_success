// 统一使用此 key 管理最高分
const HIGH_SCORE_KEY = 'ma-dao-cheng-gong-highscore';

export default class ScoreManager {
  constructor() {
    this.currentScore = 0;
    this.highScore = this.loadHighScore();
  }

  addScore(points) {
    this.currentScore += points;
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      this.saveHighScore();
    }
  }

  reset() {
    this.currentScore = 0;
  }

  loadHighScore() {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0');
  }

  saveHighScore() {
    localStorage.setItem(HIGH_SCORE_KEY, this.highScore.toString());
  }

  getCurrentScore() {
    return this.currentScore;
  }

  getHighScore() {
    return this.highScore;
  }
}
