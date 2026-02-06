export default class AudioManager {\n  constructor(scene) {\n    this.scene = scene;\n    this.sounds = {};\n    this.musicEnabled = true;\n    this.sfxEnabled = true;\n  }\n
  // 预留音频接口，后期可添加实际音频文件\n  playMusic(key) {\n    if (!this.musicEnabled) return;\n    console.log(`Playing music: ${key}`);\n    // this.scene.sound.play(key, { loop: true });\n  }\n
  playSound(key) {\n    if (!this.sfxEnabled) return;\n    console.log(`Playing sound: ${key}`);\n    // this.scene.sound.play(key);\n  }\n
  stopMusic() {\n    // this.scene.sound.stopAll();\n  }\n
  toggleMusic() {\n    this.musicEnabled = !this.musicEnabled;\n    if (!this.musicEnabled) {\n      this.stopMusic();\n    }\n  }\n
  toggleSFX() {\n    this.sfxEnabled = !this.sfxEnabled;\n  }\n}