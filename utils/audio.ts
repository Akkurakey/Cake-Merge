class AudioManager {
  private audioCtx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private bgm: HTMLAudioElement | null = null;
  private bgmNode: MediaElementAudioSourceNode | null = null;
  private muted: boolean = false;
  private bgmPlaying: boolean = false;
  private hasUnlocked: boolean = false;

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
    const soundUrls: Record<string, string> = {
      'pop': 'https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3',
      'clink': 'https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3',
      'merge': 'https://assets.mixkit.co/active_storage/sfx/2044/2044-preview.mp3',
      'coin': 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
      'shoot': 'https://assets.mixkit.co/active_storage/sfx/2043/2043-preview.mp3'
    };

    // Initialize BGM
    // We create it but don't play it yet.
    // Setting crossOrigin is crucial for connecting to Web Audio API later without CORS issues.
    this.bgm = new Audio();
    this.bgm.crossOrigin = "anonymous"; 
    this.bgm.src = 'https://cdn.pixabay.com/audio/2022/11/02/audio_822f3e843e.mp3';
    this.bgm.loop = true;
    this.bgm.volume = 0.3;

    if (!this.audioCtx) return;

    // Load SFX Buffers
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

  // Critical for iOS: Unlocks the audio engine on the first user interaction
  private unlockAudio() {
    if (this.hasUnlocked || !this.audioCtx) return;

    // 1. Resume the context if it's suspended (Safari default)
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    // 2. Play a silent buffer to "warm up" the iOS audio engine
    const buffer = this.audioCtx.createBuffer(1, 1, 22050);
    const source = this.audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioCtx.destination);
    source.start(0);

    // 3. Connect BGM to Web Audio Graph
    // This allows BGM to play through the Media channel (like games) 
    // instead of the Ringer channel (which might be muted by the physical switch).
    if (this.bgm && !this.bgmNode) {
        try {
            this.bgmNode = this.audioCtx.createMediaElementSource(this.bgm);
            this.bgmNode.connect(this.audioCtx.destination);
        } catch(e) {
            console.warn("Could not route BGM to Web Audio (CORS or state issue), falling back to HTML5 Audio", e);
        }
    }

    this.hasUnlocked = true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.bgm?.pause();
    } else if (this.bgmPlaying) {
      this.unlockAudio(); // Retry unlock just in case
      this.bgm?.play().catch(e => console.log("Audio play failed", e));
    }
    return this.muted;
  }

  playBGM() {
    this.bgmPlaying = true;
    
    // Attempt unlock immediately - this is usually called from a click handler (Start Game)
    this.unlockAudio();

    if (!this.muted && this.bgm) {
      const p = this.bgm.play();
      if (p !== undefined) {
          p.catch(e => console.warn("BGM auto-play blocked", e));
      }
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
    
    // Ensure context is running (sometimes it suspends in background)
    if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
    }

    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.buffers[key];
      
      const gainNode = this.audioCtx.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioCtx.destination);
      
      source.start(0);
    } catch(e) {
      // Ignore playback errors
    }
  }
}

export const audioManager = new AudioManager();
