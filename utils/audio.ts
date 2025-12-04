class AudioManager {
  private sounds: Record<string, HTMLAudioElement> = {};
  private muted: boolean = false;
  private bgmPlaying: boolean = false;

  constructor() {
    this.loadSounds();
  }

  private loadSounds() {
    // Using reliable CDN links for sound effects
    this.sounds['pop'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3'); // Soft pop
    this.sounds['clink'] = new Audio('https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3'); // Glass clink
    this.sounds['merge'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3'); // Water splash/pour
    this.sounds['coin'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'); // Arcade coin
    this.sounds['shoot'] = new Audio('https://assets.mixkit.co/active_storage/sfx/2043/2043-preview.mp3'); // Whoosh
    
    // Background Music (Bossa Nova / Jazz vibe)
    this.sounds['bgm'] = new Audio('https://cdn.pixabay.com/audio/2022/11/02/audio_822f3e843e.mp3');
    this.sounds['bgm'].loop = true;
    this.sounds['bgm'].volume = 0.3;

    // Preload
    Object.values(this.sounds).forEach(s => s.load());
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.sounds['bgm'].pause();
    } else if (this.bgmPlaying) {
      this.sounds['bgm'].play().catch(e => console.log("Audio play failed", e));
    }
    return this.muted;
  }

  playBGM() {
    this.bgmPlaying = true;
    if (!this.muted) {
      this.sounds['bgm'].play().catch(e => console.log("BGM play failed (needs interaction)", e));
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    this.sounds['bgm'].pause();
    this.sounds['bgm'].currentTime = 0;
  }

  play(key: string, volume = 1.0) {
    if (this.muted || !this.sounds[key]) return;
    
    // Clone node to allow overlapping sounds of same type
    const sound = this.sounds[key].cloneNode() as HTMLAudioElement;
    sound.volume = volume;
    sound.play().catch(() => {});
  }
}

export const audioManager = new AudioManager();