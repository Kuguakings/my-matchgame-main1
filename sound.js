class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        // C Major Scale frequencies (C4 to C6)
        this.scale = [
            261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, // C4 - B4
            523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, // C5 - B5
            1046.50 // C6
        ];
        // 背景音乐相关
        this.bgmOscillators = [];
        this.currentTheme = null;
        this.bgmGain = null;
    }

    playTone(freq, type, duration, vol = 0.1, slideTo = null) {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }
        
        // ADSR-ish envelope
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02); // Attack
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); // Decay

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playPianoNote(freq, duration = 0.5) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const t = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const osc3 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Piano-like synthesis: Triangle + Sine with slight detune
        osc1.type = 'triangle';
        osc1.frequency.value = freq;
        
        osc2.type = 'sine';
        osc2.frequency.value = freq;
        
        osc3.type = 'sine';
        osc3.frequency.value = freq * 2; // Octave overtone
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.02); // Fast attack
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration); // Long decay

        osc1.connect(gain);
        osc2.connect(gain);
        osc3.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start();
        osc2.start();
        osc3.start();
        osc1.stop(t + duration);
        osc2.stop(t + duration);
        osc3.stop(t + duration);
    }

    playSelect() {
        this.playTone(880, 'sine', 0.1, 0.1);
    }

    playSwap() {
        this.playTone(400, 'sine', 0.2, 0.1, 600);
    }

    playMatch(combo = 1) {
        // Map combo to scale index. Clamp to scale length.
        // Combo starts at 1.
        let index = (combo - 1) % this.scale.length;
        let freq = this.scale[index];
        this.playPianoNote(freq, 0.6);
    }

    playCreateSpecial() {
        // Magical chime
        this.playTone(1000, 'sine', 0.3, 0.1, 1500);
        setTimeout(() => this.playTone(1500, 'sine', 0.3, 0.1, 2000), 100);
    }

    playZap() {
        this.playTone(200, 'sawtooth', 0.2, 0.2, 800);
        setTimeout(() => this.playTone(800, 'sawtooth', 0.1, 0.1, 200), 100);
    }

    playExplosion(type = 'generic') {
        if (type === 'red') {
            // Fire: Low rumble + crackle
            this.playTone(100, 'sawtooth', 0.4, 0.5, 50);
            this.playTone(150, 'square', 0.3, 0.4, 40);
            for(let i=0; i<5; i++) this.playTone(50 + Math.random()*100, 'sawtooth', 0.2, 0.2);
        } else if (type === 'blue' || type === 'ice') {
            // Ice/Water: High pitch shatter
             this.playTone(800, 'triangle', 0.2, 0.3, 400);
             this.playTone(1200, 'sine', 0.1, 0.2, 600);
             setTimeout(()=>this.playTone(2000, 'sine', 0.1, 0.1), 50);
        } else if (type === 'green') {
            // Nature: Snap / Crunch
            this.playTone(300, 'square', 0.1, 0.3, 100);
            this.playTone(200, 'sawtooth', 0.1, 0.2, 50);
        } else if (type === 'yellow' || type === 'electric') {
             // Electric
             this.playZap();
             this.playTone(100, 'sawtooth', 0.3, 0.3, 50);
        } else if (type === 'purple' || type === 'void') {
            // Void: Deep sweep
            this.playTone(300, 'sine', 0.5, 0.4, 50);
            this.playTone(50, 'sine', 0.5, 0.4, 200); // Sub bass
        } else if (type === 'orange' || type === 'acid') {
            this.playFizz();
        } else if (type === 'white') {
             // Glass
             for(let i=0; i<3; i++) setTimeout(()=>this.playTone(1500 + Math.random()*500, 'triangle', 0.1, 0.1), i*20);
        } else {
            // Generic
            this.playTone(100, 'sawtooth', 0.4, 0.3, 50);
            this.playTone(150, 'square', 0.3, 0.2, 80);
        }
    }

    playWhirlwind() {
        // Whoosh effect
        const count = 10;
        for(let i=0; i<count; i++) {
             setTimeout(() => {
                 this.playTone(200 + i*100, 'sine', 0.1, 0.1, 800 + i*100);
             }, i * 50);
        }
    }

    playFizz() {
        // Acid Fizz: High pitch noise/random
        for(let i=0; i<10; i++) {
            setTimeout(() => this.playTone(400 + Math.random()*400, 'square', 0.05, 0.2), i*30);
        }
    }

    playSiren() {
        // Biohazard Siren
        this.playTone(800, 'square', 0.4, 0.3);
        setTimeout(() => this.playTone(600, 'square', 0.4, 0.3), 400);
        setTimeout(() => this.playTone(800, 'square', 0.4, 0.3), 800);
    }

    playInvalid() {
        this.playTone(150, 'sawtooth', 0.1, 0.1, 140);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.1, 0.1, 150), 100);
    }

    playLevelUp() {
        const now = this.ctx.currentTime;
        // C Major Chord Arpeggio
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            setTimeout(() => this.playPianoNote(freq, 0.5), i * 100);
        });
        // Final chord
        setTimeout(() => {
             this.playPianoNote(523.25, 1.0);
             this.playPianoNote(659.25, 1.0);
             this.playPianoNote(783.99, 1.0);
        }, 400);
    }

    // 停止当前背景音乐
    stopBGM() {
        // 先清空oscillators数组，防止循环继续
        const oscillators = [...this.bgmOscillators];
        this.bgmOscillators = [];
        
        // 停止所有oscillators
        oscillators.forEach(osc => {
            try { 
                osc.stop(); 
                osc.disconnect();
            } catch(e) {
                // 忽略已停止的oscillator错误
            }
        });
        
        // 断开并清空gain
        if (this.bgmGain) {
            try { 
                this.bgmGain.disconnect(); 
            } catch(e) {
                // 忽略已断开的错误
            }
            this.bgmGain = null;
        }
        
        this.currentTheme = null;
    }

    // 播放主题背景音乐
    playThemeBGM(theme = 'plain') {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        // 如果主题相同，不重复播放
        if (this.currentTheme === theme && this.bgmOscillators.length > 0) {
            return;
        }
        
        // 停止之前的音乐
        this.stopBGM();
        this.currentTheme = theme;
        
        // 创建主音量控制
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.08; // 背景音乐音量较低
        this.bgmGain.connect(this.ctx.destination);
        
        const t = this.ctx.currentTime;
        
        // 根据主题生成不同的背景音乐
        switch(theme) {
            case 'forest':
                // 森林：自然、平和的音调
                this.playBGMChord([261.63, 329.63, 392.00], 0.15, 2.0);
                break;
            case 'cave':
                // 洞穴：低沉、神秘
                this.playBGMChord([130.81, 164.81, 196.00], 0.12, 2.5);
                break;
            case 'storm':
                // 风暴：动态、紧张
                this.playBGMChord([293.66, 369.99, 440.00], 0.1, 1.5);
                break;
            case 'lab':
                // 实验室：科技感、电子音
                this.playBGMChord([523.25, 659.25, 783.99], 0.1, 1.8);
                break;
            case 'ice':
                // 冰霜：清脆、高音
                this.playBGMChord([523.25, 659.25, 783.99], 0.12, 2.2);
                break;
            case 'core':
                // 核心：炽热、强烈
                this.playBGMChord([196.00, 246.94, 293.66], 0.15, 1.6);
                break;
            case 'voltage':
                // 电压：电音、脉冲
                this.playBGMChord([440.00, 554.37, 659.25], 0.1, 1.4);
                break;
            case 'mystic':
                // 神秘：空灵、神秘
                this.playBGMChord([329.63, 415.30, 493.88], 0.12, 2.3);
                break;
            case 'ruins':
                // 废墟：古老、沉重
                this.playBGMChord([174.61, 220.00, 261.63], 0.13, 2.4);
                break;
            case 'reactor':
                // 反应堆：能量、持续
                this.playBGMChord([392.00, 493.88, 587.33], 0.11, 1.7);
                break;
            case 'void':
                // 虚空：深邃、低音
                this.playBGMChord([98.00, 123.47, 146.83], 0.14, 2.6);
                break;
            default: // plain
                // 普通：简单、轻快
                this.playBGMChord([261.63, 329.63, 392.00], 0.1, 2.0);
        }
    }

    // 播放背景音乐和弦（循环）
    playBGMChord(frequencies, volume, duration) {
        // 检查bgmGain是否存在
        if (!this.bgmGain) return;
        
        const playChord = () => {
            // 再次检查，防止在循环过程中被停止
            if (!this.bgmGain) return;
            
            frequencies.forEach((freq, i) => {
                try {
                    // 使用多个振荡器创建更丰富的音色
                    const osc1 = this.ctx.createOscillator();
                    const osc2 = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    
                    // 主音：三角波（柔和）
                    osc1.type = 'triangle';
                    osc1.frequency.value = freq;
                    
                    // 和声：正弦波（八度音）
                    osc2.type = 'sine';
                    osc2.frequency.value = freq * 2;
                    
                    const t = this.ctx.currentTime;
                    const delay = i * 0.05; // 轻微延迟创造层次感
                    
                    // 更平滑的包络
                    gain.gain.setValueAtTime(0, t + delay);
                    gain.gain.linearRampToValueAtTime(volume * 0.6, t + delay + 0.15);
                    gain.gain.exponentialRampToValueAtTime(volume * 0.4, t + delay + duration * 0.6);
                    gain.gain.exponentialRampToValueAtTime(volume * 0.2, t + delay + duration * 0.9);
                    gain.gain.linearRampToValueAtTime(0, t + delay + duration);
                    
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(this.bgmGain);
                    
                    osc1.start(t + delay);
                    osc2.start(t + delay);
                    osc1.stop(t + delay + duration);
                    osc2.stop(t + delay + duration);
                    
                    this.bgmOscillators.push(osc1);
                    this.bgmOscillators.push(osc2);
                } catch(e) {
                    console.warn("BGM播放错误:", e);
                }
            });
            
            // 循环播放
            setTimeout(() => {
                // 检查bgmGain和oscillators状态
                if (!this.bgmGain || this.bgmOscillators.length === 0) return;
                playChord();
            }, duration * 1000);
        };
        
        playChord();
    }

    // 播放方块消除音效（根据颜色）- 改进版，更丰富好听
    playBlockDestroy(color) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const t = this.ctx.currentTime;
        
        switch(color) {
            case 'red':
                // 红色：火焰爆裂声 - 多层次爆裂效果
                this.playTone(120, 'sawtooth', 0.2, 0.2, 60);
                setTimeout(() => this.playTone(180, 'square', 0.15, 0.18, 90), 30);
                setTimeout(() => this.playTone(250, 'sawtooth', 0.1, 0.15, 120), 60);
                // 添加火花声
                for(let i = 0; i < 3; i++) {
                    setTimeout(() => this.playTone(300 + Math.random() * 200, 'square', 0.05, 0.1), 80 + i * 20);
                }
                break;
            case 'blue':
                // 蓝色：水波/冰晶破碎 - 清脆的破碎声
                this.playTone(800, 'triangle', 0.15, 0.2, 400);
                setTimeout(() => this.playTone(1200, 'sine', 0.12, 0.18, 600), 40);
                setTimeout(() => this.playTone(1600, 'triangle', 0.08, 0.15, 800), 80);
                // 添加回响
                setTimeout(() => this.playTone(600, 'sine', 0.1, 0.12, 300), 120);
                break;
            case 'green':
                // 绿色：自然/植物声音 - 柔和的自然音
                this.playTone(400, 'sine', 0.18, 0.2, 250);
                setTimeout(() => this.playTone(500, 'triangle', 0.15, 0.18, 350), 50);
                setTimeout(() => this.playTone(600, 'sine', 0.12, 0.15, 450), 100);
                break;
            case 'purple':
                // 紫色：魔法/神秘音效 - 神秘的和弦
                this.playTone(350, 'sine', 0.25, 0.2, 200);
                setTimeout(() => this.playTone(440, 'sine', 0.2, 0.18, 250), 60);
                setTimeout(() => this.playTone(523, 'sine', 0.15, 0.15, 300), 120);
                // 添加低音共鸣
                setTimeout(() => this.playTone(220, 'sine', 0.2, 0.15, 150), 100);
                break;
            case 'white':
                // 白色：玻璃/冰晶 - 高音清脆
                this.playTone(1400, 'triangle', 0.15, 0.2, 900);
                setTimeout(() => this.playTone(1800, 'sine', 0.12, 0.18, 1100), 40);
                setTimeout(() => this.playTone(2200, 'triangle', 0.1, 0.15, 1300), 80);
                // 添加清脆的尾音
                setTimeout(() => this.playTone(1600, 'sine', 0.08, 0.12, 1000), 120);
                break;
            case 'orange':
                // 橙色：酸性/腐蚀 - 嘶嘶声
                this.playTone(450, 'square', 0.15, 0.2, 250);
                setTimeout(() => this.playTone(550, 'square', 0.12, 0.18, 350), 40);
                // 添加腐蚀声
                for(let i = 0; i < 4; i++) {
                    setTimeout(() => this.playTone(400 + Math.random() * 200, 'square', 0.06, 0.1), 60 + i * 25);
                }
                break;
            case 'yellow':
                // 黄色：电击/能量 - 电火花声
                this.playTone(700, 'sawtooth', 0.15, 0.2, 350);
                setTimeout(() => this.playTone(900, 'sawtooth', 0.12, 0.18, 500), 30);
                setTimeout(() => this.playTone(1100, 'sawtooth', 0.1, 0.15, 650), 60);
                // 添加电火花
                for(let i = 0; i < 3; i++) {
                    setTimeout(() => this.playTone(800 + Math.random() * 400, 'sawtooth', 0.05, 0.12), 80 + i * 30);
                }
                break;
            default:
                // 默认：通用消除音 - 更悦耳
                this.playTone(450, 'sine', 0.15, 0.15, 250);
                setTimeout(() => this.playTone(550, 'triangle', 0.12, 0.12, 350), 50);
        }
    }
}

const audio = new SoundManager();
