export default class ScoreManager {\n  constructor() {\n    this.currentScore = 0;\n    this.highScore = this.loadHighScore();\n  }\n
  addScore(points) {\n    this.currentScore += points;\n    if (this.currentScore > this.highScore) {\n      this.highScore = this.currentScore;\n      this.saveHighScore();\n    }\n  }\n
  reset() {\n    this.currentScore = 0;\n  }\n
  loadHighScore() {\n    return parseInt(localStorage.getItem('ma-dao-cheng-gong-highscore') || '0');\n  }\n
  saveHighScore() {\n    localStorage.setItem('ma-dao-cheng-gong-highscore', this.highScore.toString());\n  }\n
  getCurrentScore() {\n    return this.currentScore;\n  }\n
  getHighScore() {\n    return this.highScore;\n  }\n}