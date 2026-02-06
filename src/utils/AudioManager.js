export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.sounds = {};
    this.musicEnabled = true;
    this.sfxEnabled = true;
  }

  // 预留音频接口，后期可添加实际音频文件
  playMusic(key) {
    if (!this.musicEnabled) return;
    console.log(`Playing music: ${key}`);
    // this.scene.sound.play(key, { loop: true });
  }

  playSound(key) {
    if (!this.sfxEnabled) return;
    console.log(`Playing sound: ${key}`);
    // this.scene.sound.play(key);
  }

  stopMusic() {
    // this.scene.sound.stopAll();
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
  }
}
