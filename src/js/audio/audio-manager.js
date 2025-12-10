/**
 * ==========================================
 * 高级音频管理系统 (Advanced Audio Manager)
 * 支持自定义优先，默认兜底的机制
 * ==========================================
 */

// 默认主题背景音乐配置映射表
const DefaultThemeMusicConfig = {
  // 主游戏主题
  plain: "music/themes/plain.mp3",
  forest: "music/themes/forest.mp3",
  cave: "music/themes/cave.mp3",
  storm: "music/themes/storm.mp3",
  lab: "music/themes/lab.mp3",
  ice: "music/themes/ice.mp3",
  core: "music/themes/core.mp3",
  voltage: "music/themes/voltage.mp3",
  mystic: "music/themes/mystic.mp3",
  ruins: "music/themes/ruins.mp3",
  reactor: "music/themes/reactor.mp3",
  void: "music/themes/void.mp3",

  // 特殊场景
  "main-menu": "music/themes/main-menu.mp3",
  idle: "music/themes/idle.mp3",
};

/**
 * 高级音频管理器类
 * 特性：
 * - 自定义音乐优先级机制
 * - 平滑的淡入淡出切换
 * - 浏览器自动播放策略处理
 * - 支持多种音频格式
 */
class AudioManager {
  constructor() {
    // Web Audio API 上下文
    this.audioContext = null;
    this.masterGain = null;

    // 背景音乐相关
    this.bgmAudioElement = null;
    this.bgmFadeInTimer = null;
    this.bgmFadeOutTimer = null;
    this.currentBgmPath = null;
    this.isBgmPlaying = false;
    this.bgmVolume = 0.7;

    // SFX（音效）相关 - 使用Web Audio API的合成声音
    this.synthOscillators = [];
    this.sfxVolume = 0.5;

    // 自动播放状态
    this.autoplayUnlocked = false;

    // 初始化
    this._initAudioContext();
    this._initBgmElement();
  }

  /**
   * 初始化 Web Audio API 上下文
   */
  _initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn("Web Audio API 初始化失败:", e);
    }
  }

  /**
   * 初始化背景音乐的 HTML Audio 元素
   */
  _initBgmElement() {
    if (!this.bgmAudioElement) {
      this.bgmAudioElement = new Audio();
      this.bgmAudioElement.loop = true;
      this.bgmAudioElement.volume = 0;
      this.bgmAudioElement.crossOrigin = "anonymous";

      // 监听音频事件
      this.bgmAudioElement.addEventListener("play", () => {
        this.isBgmPlaying = true;
      });

      this.bgmAudioElement.addEventListener("pause", () => {
        this.isBgmPlaying = false;
      });

      this.bgmAudioElement.addEventListener("error", (e) => {
        console.warn("背景音乐加载失败:", e);
      });
    }
  }

  /**
   * 解锁自动播放（处理浏览器限制）
   * 需要在用户交互事件（click/touch）中调用
   */
  unlockAutoplay() {
    if (this.autoplayUnlocked) return;

    try {
      // 恢复 AudioContext
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume().then(() => {
          console.log("AudioContext 已解锁");
        });
      }

      // 播放无声音频以解锁 HTMLAudioElement
      if (this.bgmAudioElement) {
        const silentPlay = this.bgmAudioElement.play();
        if (silentPlay && silentPlay.catch) {
          silentPlay.catch(() => {
            console.log("自动播放解锁完成");
          });
        }
        this.bgmAudioElement.pause();
        this.bgmAudioElement.currentTime = 0;
      }

      this.autoplayUnlocked = true;
    } catch (e) {
      console.warn("自动播放解锁失败:", e);
    }
  }

  /**
   * 播放关卡背景音乐（核心方法）
   * @param {string} themeKey - 主题标识（如 "forest", "cave"）
   * @param {string} [customMusicPath] - 可选的自定义音乐路径
   * @returns {Promise<void>}
   */
  async playLevelMusic(themeKey, customMusicPath = null) {
    try {
      // 第一优先级：自定义音乐路径
      let musicPath = null;

      if (
        customMusicPath &&
        typeof customMusicPath === "string" &&
        customMusicPath.trim()
      ) {
        // 验证自定义路径有效性
        if (this._isValidMusicPath(customMusicPath)) {
          musicPath = customMusicPath;
          console.log(`[音乐] 使用自定义音乐: ${musicPath}`);
        } else {
          console.warn(`[音乐] 自定义路径无效: ${customMusicPath}，回退到默认`);
        }
      }

      // 第二优先级：默认主题映射
      if (!musicPath) {
        if (DefaultThemeMusicConfig[themeKey]) {
          musicPath = DefaultThemeMusicConfig[themeKey];
          console.log(`[音乐] 使用默认主题音乐: ${themeKey} -> ${musicPath}`);
        } else {
          console.warn(`[音乐] 未知主题: ${themeKey}，使用 plain 作为回退`);
          musicPath = DefaultThemeMusicConfig["plain"];
        }
      }

      // 如果与当前播放的相同，则不切换
      if (musicPath === this.currentBgmPath && this.isBgmPlaying) {
        console.log(`[音乐] 音乐已在播放，跳过重复加载`);
        return;
      }

      // 执行淡出 -> 切换 -> 淡入
      await this._switchMusicWithCrossfade(musicPath);
    } catch (e) {
      console.error("[音乐] 播放失败:", e);
    }
  }

  /**
   * 带淡入淡出的音乐切换
   * @private
   * @param {string} newMusicPath - 新音乐路径
   */
  async _switchMusicWithCrossfade(newMusicPath) {
    // 如果有旧音乐播放中，先淡出
    if (this.isBgmPlaying && this.bgmAudioElement.src) {
      await this._fadeOut(0.5); // 0.5 秒淡出
    }

    // 切换音乐源
    this.bgmAudioElement.src = newMusicPath;
    this.currentBgmPath = newMusicPath;

    // 准备播放并淡入
    try {
      const playPromise = this.bgmAudioElement.play();
      if (playPromise && playPromise.catch) {
        await playPromise.catch((e) => {
          console.warn("[音乐] 播放失败，可能需要用户交互:", e);
          this.autoplayUnlocked = false;
        });
      }

      // 淡入
      await this._fadeIn(0.8); // 0.8 秒淡入
    } catch (e) {
      console.error("[音乐] 切换失败:", e);
    }
  }

  /**
   * 淡出效果
   * @private
   * @param {number} duration - 淡出时长（秒）
   */
  _fadeOut(duration = 0.5) {
    return new Promise((resolve) => {
      if (this.bgmFadeOutTimer) {
        clearInterval(this.bgmFadeOutTimer);
      }

      const steps = Math.ceil(duration * 60); // 60 FPS
      const volumeStep = this.bgmAudioElement.volume / steps;
      let currentStep = 0;

      this.bgmFadeOutTimer = setInterval(() => {
        currentStep++;
        this.bgmAudioElement.volume = Math.max(
          0,
          this.bgmAudioElement.volume - volumeStep
        );

        if (currentStep >= steps) {
          clearInterval(this.bgmFadeOutTimer);
          this.bgmAudioElement.volume = 0;
          this.bgmAudioElement.pause();
          resolve();
        }
      }, 1000 / 60);
    });
  }

  /**
   * 淡入效果
   * @private
   * @param {number} duration - 淡入时长（秒）
   */
  _fadeIn(duration = 0.8) {
    return new Promise((resolve) => {
      if (this.bgmFadeInTimer) {
        clearInterval(this.bgmFadeInTimer);
      }

      this.bgmAudioElement.volume = 0;
      const steps = Math.ceil(duration * 60); // 60 FPS
      const volumeStep = this.bgmVolume / steps;
      let currentStep = 0;

      this.bgmFadeInTimer = setInterval(() => {
        currentStep++;
        this.bgmAudioElement.volume = Math.min(
          this.bgmVolume,
          this.bgmAudioElement.volume + volumeStep
        );

        if (currentStep >= steps) {
          clearInterval(this.bgmFadeInTimer);
          this.bgmAudioElement.volume = this.bgmVolume;
          resolve();
        }
      }, 1000 / 60);
    });
  }

  /**
   * 验证音乐路径有效性
   * @private
   * @param {string} path - 文件路径
   * @returns {boolean}
   */
  _isValidMusicPath(path) {
    if (!path) return false;

    // 检查文件扩展名
    const validExtensions = [".mp3", ".wav", ".ogg", ".m4a", ".webm"];
    const pathLower = path.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => pathLower.endsWith(ext));

    // 检查路径格式（相对路径或绝对URL）
    const isValidFormat = /^(https?:\/\/|\.\/|\/|[^\/])/.test(path);

    return hasValidExt && isValidFormat;
  }

  /**
   * 停止背景音乐
   */
  stopBgm() {
    if (this.bgmAudioElement) {
      this.bgmAudioElement.pause();
      this.bgmAudioElement.currentTime = 0;
      this.isBgmPlaying = false;
      this.currentBgmPath = null;
    }
  }

  /**
   * 暂停背景音乐
   */
  pauseBgm() {
    if (this.bgmAudioElement && this.isBgmPlaying) {
      this.bgmAudioElement.pause();
    }
  }

  /**
   * 恢复背景音乐
   */
  resumeBgm() {
    if (this.bgmAudioElement && !this.isBgmPlaying && this.currentBgmPath) {
      this.bgmAudioElement.play().catch((e) => {
        console.warn("[音乐] 恢复播放失败:", e);
      });
    }
  }

  /**
   * 设置背景音乐音量（0-1）
   */
  setBgmVolume(volume) {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    if (this.bgmAudioElement) {
      this.bgmAudioElement.volume = this.bgmVolume;
    }
  }

  /**
   * 设置音效音量（0-1）
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.sfxVolume;
    }
  }

  /**
   * 播放音效：选择
   */
  playSelect() {
    this._playTone(880, "sine", 0.1, 0.1);
  }

  /**
   * 播放音效：交换
   */
  playSwap() {
    this._playTone(400, "sine", 0.2, 0.1, 600);
  }

  /**
   * 播放音效：无效操作
   */
  playInvalid() {
    this._playTone(200, "sine", 0.15, 0.08);
  }

  /**
   * 播放音效：匹配
   */
  playMatch(combo = 1) {
    const scale = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88];
    let index = (combo - 1) % scale.length;
    let freq = scale[index];
    this._playTone(freq, "sine", 0.6, 0.1);
  }

  /**
   * 播放音效：爆炸
   */
  playExplosion(color = "red") {
    const colorFreqs = {
      red: 200,
      blue: 600,
      green: 400,
      yellow: 800,
    };
    const freq = colorFreqs[color] || 300;
    this._playTone(freq, "sawtooth", 0.3, 0.15, freq * 2);
  }

  /**
   * 播放音效：创建特殊方块
   */
  playCreateSpecial() {
    this._playTone(1000, "sine", 0.3, 0.1, 1500);
    setTimeout(() => this._playTone(1500, "sine", 0.3, 0.1, 2000), 100);
  }

  /**
   * 播放音效：旋风
   */
  playWhirlwind() {
    this._playTone(600, "triangle", 0.4, 0.15, 1200);
  }

  /**
   * 播放音效：关卡完成
   */
  playLevelUp() {
    this._playTone(523.25, "sine", 0.2, 0.15);
    setTimeout(() => this._playTone(659.25, "sine", 0.2, 0.15), 100);
    setTimeout(() => this._playTone(783.99, "sine", 0.3, 0.15), 200);
  }

  /**
   * 核心音调生成函数
   * @private
   */
  _playTone(freq, type, duration, vol = 0.1, slideTo = null) {
    if (!this.audioContext || this.audioContext.state === "suspended") return;

    try {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(
          slideTo,
          this.audioContext.currentTime + duration
        );
      }

      gain.gain.setValueAtTime(0, this.audioContext.currentTime);
      gain.gain.linearRampToValueAtTime(
        vol * this.sfxVolume,
        this.audioContext.currentTime + 0.02
      );
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + duration
      );

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn("音效播放失败:", e);
    }
  }
}

// 创建全局实例
const audioManager = new AudioManager();

// 在用户首次交互时解锁自动播放
document.addEventListener(
  "click",
  () => {
    audioManager.unlockAutoplay();
  },
  { once: true }
);

document.addEventListener(
  "touchstart",
  () => {
    audioManager.unlockAutoplay();
  },
  { once: true }
);
