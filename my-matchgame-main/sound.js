class SoundManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        // C Major Scale frequencies (C4 to C6)
        this.scale = [
            261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, // C4 - B4
            523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, // C5 - B5
            1046.50 // C6
        ];
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
}

const audio = new SoundManager();
