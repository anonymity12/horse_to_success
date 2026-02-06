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
    return parseInt(localStorage.getItem('ma-dao-cheng-gong-highscore') || '0');
  }

  saveHighScore() {
    localStorage.setItem('ma-dao-cheng-gong-highscore', this.highScore.toString());
  }

  getCurrentScore() {
    return this.currentScore;
  }

  getHighScore() {
    return this.highScore;
  }
}
