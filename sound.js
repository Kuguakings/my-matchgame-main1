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
        if (this.bgmOscillators.length > 0) {
            this.bgmOscillators.forEach(osc => {
                try { osc.stop(); } catch(e) {}
            });
            this.bgmOscillators = [];
        }
        if (this.bgmGain) {
            try { this.bgmGain.disconnect(); } catch(e) {}
            this.bgmGain = null;
        }
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
        const playChord = () => {
            frequencies.forEach((freq, i) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.value = freq;
                
                const t = this.ctx.currentTime;
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(volume, t + 0.1);
                gain.gain.exponentialRampToValueAtTime(volume * 0.3, t + duration * 0.8);
                gain.gain.linearRampToValueAtTime(0, t + duration);
                
                osc.connect(gain);
                gain.connect(this.bgmGain);
                
                osc.start(t);
                osc.stop(t + duration);
                
                this.bgmOscillators.push(osc);
            });
            
            // 循环播放
            setTimeout(() => {
                if (this.bgmOscillators.length === 0) return; // 如果已停止，不再循环
                playChord();
            }, duration * 1000);
        };
        
        playChord();
    }

    // 播放方块消除音效（根据颜色）
    playBlockDestroy(color) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        switch(color) {
            case 'red':
                // 红色：火焰爆裂声
                this.playTone(150, 'sawtooth', 0.15, 0.15, 80);
                this.playTone(200, 'square', 0.1, 0.12, 100);
                break;
            case 'blue':
                // 蓝色：水波/冰晶破碎
                this.playTone(600, 'triangle', 0.12, 0.15, 300);
                this.playTone(900, 'sine', 0.08, 0.1, 500);
                break;
            case 'green':
                // 绿色：自然/植物声音
                this.playTone(350, 'sine', 0.1, 0.12, 200);
                this.playTone(450, 'triangle', 0.08, 0.1, 300);
                break;
            case 'purple':
                // 紫色：魔法/神秘音效
                this.playTone(400, 'sine', 0.2, 0.15, 200);
                this.playTone(300, 'sine', 0.15, 0.12, 150);
                break;
            case 'white':
                // 白色：玻璃/冰晶
                this.playTone(1200, 'triangle', 0.1, 0.12, 800);
                this.playTone(1500, 'sine', 0.08, 0.1, 1000);
                break;
            case 'orange':
                // 橙色：酸性/腐蚀
                this.playTone(500, 'square', 0.1, 0.12, 300);
                this.playTone(600, 'square', 0.08, 0.1, 400);
                break;
            case 'yellow':
                // 黄色：电击/能量
                this.playTone(800, 'sawtooth', 0.1, 0.15, 400);
                this.playTone(1000, 'sawtooth', 0.08, 0.12, 600);
                break;
            default:
                // 默认：通用消除音
                this.playTone(400, 'sine', 0.12, 0.1, 200);
        }
    }
}

const audio = new SoundManager();
