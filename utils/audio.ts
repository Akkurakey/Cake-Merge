class AudioManager {
  private audioCtx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private bgm: HTMLAudioElement | null = null;
  private muted: boolean = false;
  private bgmPlaying: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.error("Web Audio API not supported", e);
    }

    this.loadSounds();
  }

  private async loadSounds() {
    // SFX URLs - loading them into memory buffers for low-latency playback
    const soundUrls: Record<string, string> = {
      'pop': 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3',
      'clink': 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
      'merge': 'https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3',
      'coin': 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      'shoot': 'https://assets.mixkit.co/active_storage/sfx/2043/2043-preview.mp3'
    };

    // Background Music (Keep as HTML5 Audio for streaming/looping efficiency)
    this.bgm = new Audio('https://cdn.pixabay.com/audio/2022/11/02/audio_822f3e843e.mp3');
    this.bgm.loop = true;
    this.bgm.volume = 0.3;

    // Load SFX Buffers
    if (!this.audioCtx) return;

    for (const [key, url] of Object.entries(soundUrls)) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
        this.buffers[key] = audioBuffer;
      } catch (e) {
        console.warn(`Failed to load sound: ${key}`, e);
      }
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.bgm?.pause();
    } else if (this.bgmPlaying) {
      // Resume context if needed when unmuting
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.bgm?.play().catch(e => console.log("Audio play failed", e));
    }
    return this.muted;
  }

  playBGM() {
    this.bgmPlaying = true;
    
    // Attempt to resume context on user interaction (Start Game)
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (!this.muted && this.bgm) {
      this.bgm.play().catch(e => console.log("BGM play failed (needs interaction)", e));
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  play(key: string, volume = 1.0) {
    if (this.muted || !this.audioCtx || !this.buffers[key]) return;
    
    try {
      // Create source
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.buffers[key];
      
      // Create gain for volume
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = volume;
      
      // Connect graph
      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      // Play
      source.start(0);
    } catch(e) {
      // Ignore errors during playback to prevent game crash
    }
  }
}

export const audioManager = new AudioManager();
