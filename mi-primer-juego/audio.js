/* =========================================================================
 *  UMBRAL — audio.js
 *  Todo el sonido se sintetiza en tiempo real con Web Audio API.
 *  No hay archivos de audio: viento, pasos, trampas, agua, roca, música.
 * ========================================================================= */
(function () {
    'use strict';

    const SFX = {
        ctx: null,
        master: null,
        muted: false,
        loops: {},

        /* Tres canales con su propio volumen (0..1), guardados en el navegador.
         * La música va siempre por delante: el ambiente y los efectos están más bajos por defecto. */
        vol: (() => {
            const def = { music: 1, amb: 0.45, sfx: 0.7 };
            try { return Object.assign(def, JSON.parse(localStorage.getItem('umbral-volumen') || '{}')); }
            catch (e) { return def; }
        })(),
        buses: {},
        setVolume(kind, v) {
            this.vol[kind] = Math.max(0, Math.min(1, v));
            try { localStorage.setItem('umbral-volumen', JSON.stringify(this.vol)); } catch (e) {}
            const b = this.buses[kind];
            if (b && this.ctx) b.gain.setTargetAtTime(this.vol[kind], this.ctx.currentTime, 0.05);
            if (kind === 'music' && this.music && !this.music.g) this.music.el.volume = Math.min(1, this.music.vol * this.vol.music);
        },

        /** Debe llamarse tras un gesto del usuario (tecla / toque). */
        init() {
            if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            const ctx = this.ctx = new AC();

            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -18; comp.ratio.value = 4;
            this.master = ctx.createGain();
            this.master.gain.value = 0.9;
            this.master.connect(comp).connect(ctx.destination);
            ['music', 'amb', 'sfx'].forEach(k => {
                const g = this.buses[k] = ctx.createGain();
                g.gain.value = this.vol[k]; g.connect(this.master);
            });

            // Bus con "reverb" barata (delays realimentados) para dar espacio de bosque
            this.wet = ctx.createGain(); this.wet.gain.value = 0.28;
            const d1 = ctx.createDelay(1); d1.delayTime.value = 0.13;
            const d2 = ctx.createDelay(1); d2.delayTime.value = 0.29;
            const fb = ctx.createGain(); fb.gain.value = 0.42;
            const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
            this.wet.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1);
            lp.connect(this.buses.sfx);

            this.noiseBuf = this._makeNoise(2, 'white');
            this.brownBuf = this._makeNoise(4, 'brown');
            this._ambience();
        },

        _makeNoise(seconds, type) {
            const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
            const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
            let last = 0;
            for (let i = 0; i < len; i++) {
                const w = Math.random() * 2 - 1;
                if (type === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
                else d[i] = w;
            }
            return buf;
        },

        _out(gainNode, wet = 0, bus = 'sfx') {
            gainNode.connect(this.buses[bus]);
            if (wet > 0) { const w = this.ctx.createGain(); w.gain.value = wet; gainNode.connect(w); w.connect(this.wet); }
        },

        /** Ráfaga de ruido filtrado: base de pasos, golpes, salpicaduras... */
        _noise({ dur = 0.1, type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.002, sweepTo = null, wet = 0.2, brown = false, when = 0, bus = 'sfx' }) {
            if (!this.ctx || this.muted) return;
            const ctx = this.ctx, t = ctx.currentTime + when;
            const src = ctx.createBufferSource();
            src.buffer = brown ? this.brownBuf : this.noiseBuf;
            src.playbackRate.value = 0.8 + Math.random() * 0.4;
            const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
            if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(gain, t + attack);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            src.connect(f).connect(g); this._out(g, wet, bus);
            src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
        },

        _tone({ freq = 220, to = null, dur = 0.3, type = 'sine', gain = 0.2, attack = 0.005, wet = 0.3, when = 0, detune = 0, bus = 'sfx' }) {
            if (!this.ctx || this.muted) return;
            const ctx = this.ctx, t = ctx.currentTime + when;
            const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
            if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(gain, t + attack);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); this._out(g, wet, bus);
            o.start(t); o.stop(t + dur + 0.05);
        },

        /** Fondo: viento con ráfagas + un dron grave casi imperceptible. */
        _ambience() {
            const ctx = this.ctx;
            // Viento
            const wind = ctx.createBufferSource(); wind.buffer = this.brownBuf; wind.loop = true;
            const wf = ctx.createBiquadFilter(); wf.type = 'lowpass'; wf.frequency.value = 380; wf.Q.value = 3;
            const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
            const lfoG = ctx.createGain(); lfoG.gain.value = 220;
            lfo.connect(lfoG).connect(wf.frequency);
            const wg = ctx.createGain(); wg.gain.value = 0;
            wg.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 4);
            wind.connect(wf).connect(wg).connect(this.buses.amb);
            wind.start(); lfo.start();

            // Dron
            const dg = ctx.createGain(); dg.gain.value = 0;
            dg.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 8);
            const dl = ctx.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 300;
            [55, 82.4, 110.3].forEach((f, i) => {
                const o = ctx.createOscillator(); o.type = i === 2 ? 'sine' : 'triangle';
                o.frequency.value = f; o.detune.value = (Math.random() - 0.5) * 12;
                o.connect(dl); o.start();
            });
            dl.connect(dg); this._out(dg, 0.5, 'amb');
            this.ambGain = wg; this.droneGain = dg;

            // Crujidos / pájaros lejanos al azar
            const later = () => {
                if (!this.ctx) return;
                if (!this.muted) {
                    if (Math.random() < 0.55) this._creak(); else this._distantBird();
                }
                setTimeout(later, 7000 + Math.random() * 11000);
            };
            setTimeout(later, 6000);
        },

        creak() { this._creak(); },
        _creak() {
            const f = 70 + Math.random() * 60;
            this._tone({ freq: f, to: f * 1.6, dur: 1.4, type: 'sawtooth', gain: 0.012, attack: 0.4, wet: 0.9, bus: 'amb' });
        },
        _distantBird() {
            const base = 1400 + Math.random() * 600;
            for (let i = 0; i < 2 + (Math.random() * 2 | 0); i++)
                this._tone({ freq: base, to: base * 0.7, dur: 0.18, type: 'sine', gain: 0.01, when: i * 0.32, wet: 1, bus: 'amb' });
        },

        /* --------------------------- efectos ---------------------------- */
        step(surface = 'grass') {
            if (surface === 'wood')
                this._noise({ dur: 0.07, freq: 500, q: 2, gain: 0.12, wet: 0.15 });
            else
                this._noise({ dur: 0.09, freq: 1300 + Math.random() * 900, q: 0.8, gain: 0.07, wet: 0.1 });
            this._tone({ freq: 90, to: 50, dur: 0.07, gain: 0.05, wet: 0 });
        },
        jump() { this._noise({ dur: 0.16, freq: 700, q: 1.2, gain: 0.05, attack: 0.03, wet: 0.2 }); },
        land(force = 1) {
            this._tone({ freq: 110, to: 38, dur: 0.18, gain: 0.18 * force, wet: 0.1 });
            this._noise({ dur: 0.14, freq: 900, q: 0.7, gain: 0.12 * force, wet: 0.2 });
        },
        trapSnap() {
            [2400, 3100, 3900, 5200].forEach((f, i) =>
                this._tone({ freq: f, to: f * 0.96, dur: 0.5 - i * 0.07, type: 'square', gain: 0.03, wet: 0.6 }));
            this._noise({ dur: 0.08, type: 'highpass', freq: 2500, q: 0.5, gain: 0.5, wet: 0.4 });
            this._tone({ freq: 160, to: 50, dur: 0.25, gain: 0.25 });
        },
        death() {
            this._tone({ freq: 70, to: 28, dur: 1.8, gain: 0.35, wet: 0.6 });
            this._noise({ dur: 0.35, type: 'lowpass', freq: 1200, sweepTo: 150, gain: 0.3, wet: 0.5 });
            this.muffle(true);
        },
        splash(big = false) {
            this._noise({ dur: big ? 0.9 : 0.4, type: 'lowpass', freq: 3000, sweepTo: 300, gain: big ? 0.35 : 0.15, wet: 0.5 });
            for (let i = 0; i < 6; i++)
                this._tone({ freq: 600 + Math.random() * 900, to: 1500 + Math.random() * 800, dur: 0.06, gain: 0.02, when: 0.1 + Math.random() * 0.6 });
        },
        bubbles() {
            for (let i = 0; i < 4; i++)
                this._tone({ freq: 300 + Math.random() * 300, to: 900, dur: 0.05, gain: 0.03, when: Math.random() * 0.4, wet: 0.5 });
        },
        thud() {
            this._tone({ freq: 60, to: 25, dur: 1.2, gain: 0.5, wet: 0.7 });
            this._noise({ dur: 0.6, type: 'lowpass', freq: 600, sweepTo: 80, gain: 0.4, brown: true, wet: 0.6 });
        },
        crash() {
            this.thud();
            this._noise({ dur: 1.2, type: 'lowpass', freq: 2000, sweepTo: 100, gain: 0.35, wet: 0.8 });
        },
        checkpoint() {
            this._tone({ freq: 392, dur: 2.5, gain: 0.02, attack: 0.8, wet: 1 });
            this._tone({ freq: 587, dur: 2.5, gain: 0.012, attack: 1, wet: 1 });
        },

        /* ---- araña ---- */
        stab() {
            this._noise({ dur: 0.12, type: 'highpass', freq: 1800, gain: 0.25, wet: 0.4 });
            this._tone({ freq: 140, to: 45, dur: 0.3, gain: 0.3, wet: 0.3 });
        },
        /**
         * La araña: nada de pitidos. Un gruñido grave y áspero que cae,
         * un siseo largo que se apaga y el chasquido de las mandíbulas.
         */
        screech() {
            if (!this.ctx || this.muted) return;
            const ctx = this.ctx, t = ctx.currentTime;
            // gruñido: dos dientes de sierra desafinados, filtrados para que no suenen a "chip"
            const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 6;
            lp.frequency.setValueAtTime(520, t); lp.frequency.exponentialRampToValueAtTime(140, t + 1.6);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.16, t + 0.18);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
            // temblor lento en el volumen: respiración entrecortada
            const tg = ctx.createGain(); tg.gain.value = 1;
            const trem = ctx.createOscillator(), tremG = ctx.createGain();
            trem.frequency.value = 11; tremG.gain.value = 0.35; trem.connect(tremG).connect(tg.gain);
            [-9, 9].forEach(det => {
                const o = ctx.createOscillator(); o.type = 'sawtooth';
                o.frequency.setValueAtTime(78, t); o.frequency.exponentialRampToValueAtTime(41, t + 1.7);
                o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + 1.9);
            });
            lp.connect(g).connect(tg); this._out(tg, 0.7);
            trem.start(t); trem.stop(t + 1.9);
            // siseo que se aleja
            this._noise({ dur: 1.5, type: 'bandpass', freq: 2200, q: 1.4, gain: 0.07, attack: 0.25, sweepTo: 700, wet: 0.9 });
            // mandíbulas
            for (let i = 0; i < 7; i++)
                this._noise({ dur: 0.03, type: 'bandpass', freq: 1300 + Math.random() * 700, q: 6, gain: 0.06, when: 0.1 + i * 0.09 + Math.random() * 0.04, wet: 0.4 });
        },
        /* ---- la niebla y el ciclo ---- */
        /** Raíces a punto de brotar: la tierra cruje por debajo. */
        rootWarn() {
            this._noise({ dur: 0.6, type: 'lowpass', freq: 260, gain: 0.22, attack: 0.1, brown: true, wet: 0.3 });
            for (let i = 0; i < 6; i++)
                this._noise({ dur: 0.04, type: 'bandpass', freq: 500 + Math.random() * 500, q: 4, gain: 0.07, when: i * 0.08 + Math.random() * 0.03, wet: 0.3 });
        },
        /** Las raíces salen de golpe. */
        rootBurst() {
            this._noise({ dur: 0.5, type: 'lowpass', freq: 1100, sweepTo: 160, gain: 0.32, wet: 0.5 });
            this._tone({ freq: 85, to: 34, dur: 0.45, gain: 0.25, wet: 0.3 });
            for (let i = 0; i < 5; i++)
                this._noise({ dur: 0.05, type: 'highpass', freq: 1800, gain: 0.05, when: 0.04 + i * 0.05, wet: 0.4 });
        },
        /** El parpadeo del ciclo: vuelves al mismo lugar. */
        blink() {
            this._noise({ dur: 0.45, type: 'bandpass', freq: 2600, q: 0.8, sweepTo: 280, gain: 0.07, attack: 0.15, wet: 0.9 });
            this._tone({ freq: 196, to: 185, dur: 0.9, type: 'sine', gain: 0.03, attack: 0.1, wet: 1 });
        },
        /** El ciclo se rompe: la muralla cae y algo se abre. */
        breakFree() {
            this._noise({ dur: 1.4, type: 'lowpass', freq: 1500, sweepTo: 120, gain: 0.3, brown: true, wet: 0.7 });
            this._tone({ freq: 70, to: 30, dur: 1.4, gain: 0.3, wet: 0.6 });
            [220, 277.2, 329.6, 440].forEach((f, i) =>
                this._tone({ freq: f, dur: 4.5, gain: 0.025, attack: 1.2 + i * 0.25, wet: 1, when: 0.3 }));
        },

        /* ---- epílogo ---- */
        /** Llaman a la puerta. */
        knock() {
            [0, 0.22, 0.42].forEach(w => {
                this._tone({ freq: 140, to: 70, dur: 0.12, gain: 0.22, wet: 0.3, when: w });
                this._noise({ dur: 0.05, type: 'lowpass', freq: 900, gain: 0.18, wet: 0.3, when: w });
            });
        },
        /** La puerta se abre despacio. */
        doorOpen() {
            this._tone({ freq: 210, to: 330, dur: 1.1, type: 'sawtooth', gain: 0.012, attack: 0.3, wet: 0.6 });
            this._noise({ dur: 0.9, type: 'bandpass', freq: 700, q: 2, sweepTo: 1100, gain: 0.05, attack: 0.25, wet: 0.5 });
        },

        /** Reloj de la habitación (tic / tac). */
        clock(tock = false) {
            this._noise({ dur: 0.035, type: 'bandpass', freq: tock ? 1700 : 2300, q: 5, gain: 0.07, wet: 0.5 });
            this._tone({ freq: tock ? 900 : 1150, dur: 0.05, gain: 0.008, wet: 0.4 });
        },
        tick() { this._noise({ dur: 0.025, type: 'highpass', freq: 3500, gain: 0.05, wet: 0.3 }); },
        web() { this._noise({ dur: 0.22, type: 'bandpass', freq: 2400, q: 2, gain: 0.07, attack: 0.04, sweepTo: 1200, wet: 0.4 }); },
        effort() { this._noise({ dur: 0.25, type: 'bandpass', freq: 500, q: 1.5, gain: 0.04, attack: 0.05, wet: 0.2 }); },
        tear() {
            this._noise({ dur: 0.5, type: 'highpass', freq: 4000, sweepTo: 800, gain: 0.25, wet: 0.5 });
            for (let i = 0; i < 8; i++) this._noise({ dur: 0.03, type: 'highpass', freq: 2500, gain: 0.12, when: Math.random() * 0.4 });
        },
        struggle() { this._noise({ dur: 0.15, type: 'bandpass', freq: 1600, q: 1.2, gain: 0.08, wet: 0.2 }); },

        /** Bucles con intensidad controlable (péndulo, roca, caja). */
        loop(name, { freq = 400, q = 1, type = 'bandpass', brown = false }) {
            if (!this.ctx) return null;
            if (this.loops[name]) return this.loops[name];
            const ctx = this.ctx;
            const src = ctx.createBufferSource(); src.buffer = brown ? this.brownBuf : this.noiseBuf; src.loop = true;
            const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
            const g = ctx.createGain(); g.gain.value = 0;
            src.connect(f).connect(g); this._out(g, 0.3); src.start();
            return (this.loops[name] = { g, f });
        },
        setLoop(name, level, freq) {
            const l = this.loops[name]; if (!l || !this.ctx) return;
            const t = this.ctx.currentTime;
            l.g.gain.setTargetAtTime(this.muted ? 0 : level, t, 0.05);
            if (freq) l.f.frequency.setTargetAtTime(freq, t, 0.05);
        },

        /** Efecto "oído tapado" al morir. */
        muffle(on) {
            if (!this.ctx || this.muted) return;
            const t = this.ctx.currentTime;
            this.master.gain.setTargetAtTime(on ? 0.35 : 0.9, t, on ? 0.2 : 0.8);
        },

        /* ------------------------- música (MP3) -------------------------
         * Una sola pista (musica/umbral.mp3) usada en momentos concretos.
         * Siempre en bucle. Con `muffled` suena apagada, "desde otra habitación".
         * En file:// el navegador no deja pasar el audio por Web Audio, así que
         * ahí se controla solo el volumen del elemento (sin efecto apagado).
         */
        music: null,
        _musicSetup() {
            if (this.music) return this.music;
            const el = new Audio('musica/umbral.mp3?v=1');
            el.loop = true; el.preload = 'auto';
            const m = this.music = { el, g: null, lp: null, vol: 0, cut: 20000, failed: false, timer: null };
            el.addEventListener('error', () => { m.failed = true; });
            if (this.ctx && location.protocol !== 'file:') {
                const src = this.ctx.createMediaElementSource(el);
                m.lp = this.ctx.createBiquadFilter(); m.lp.type = 'lowpass'; m.lp.frequency.value = 20000; m.lp.Q.value = 0.5;
                m.g = this.ctx.createGain(); m.g.gain.value = 0;
                src.connect(m.lp).connect(m.g).connect(this.buses.music);
            } else el.volume = 0;
            return m;
        },
        /** Lleva el volumen de la música a `v` en `secs` segundos. */
        _musicRamp(v, secs) {
            const m = this.music; if (!m) return;
            m.vol = v;
            if (m.g) {
                const t = this.ctx.currentTime, gn = m.g.gain;
                gn.cancelScheduledValues(t); gn.setValueAtTime(gn.value, t);
                gn.linearRampToValueAtTime(v, t + Math.max(0.02, secs));
            } else {
                clearInterval(m.timer);
                const to = v * this.vol.music, from = m.el.volume, steps = Math.max(1, Math.round(secs * 20)); let i = 0;
                m.timer = setInterval(() => {
                    i++; m.el.volume = Math.min(1, Math.max(0, from + (to - from) * i / steps));
                    if (i >= steps) clearInterval(m.timer);
                }, 50);
            }
        },
        playMusic({ volume = 0.7, fade = 2, muffled = false, restart = false } = {}) {
            if (!this.ctx) return;
            const m = this._musicSetup();
            clearTimeout(m.stopT);
            if (restart) { try { m.el.currentTime = 0; } catch (e) {} }
            if (m.el.paused) m.el.play().catch(() => { m.failed = true; });
            m.el.muted = this.muted && !m.g;
            this._musicRamp(volume, fade);
            m.cut = muffled ? 650 : 20000;
            if (m.lp) { m.lp.frequency.cancelScheduledValues(this.ctx.currentTime); m.lp.frequency.setTargetAtTime(m.cut, this.ctx.currentTime, Math.max(0.05, fade / 3)); }
        },
        /** Ajuste continuo (p. ej. según la distancia del personaje). */
        setMusicVolume(v, secs = 0.25) {
            const m = this.music; if (!m || m.el.paused) return;
            if (Math.abs(v - m.vol) > 0.005) this._musicRamp(v, secs);
        },
        /** Lleva la música suavemente a un volumen y un "lugar" (filtro). Se puede llamar cada fotograma. */
        setMusic(volume, cutoff = 20000, smooth = 0.6) {
            const m = this.music; if (!m || m.el.paused || !this.ctx) return;
            const t = this.ctx.currentTime;
            if (Math.abs(volume - m.vol) > 0.004) {
                m.vol = volume;
                if (m.g) { m.g.gain.cancelScheduledValues(t); m.g.gain.setTargetAtTime(volume, t, smooth); }
                else m.el.volume = Math.min(1, Math.max(0, volume * this.vol.music));
            }
            if (m.lp && Math.abs(cutoff - (m.cut || 0)) > m.cut * 0.02) {
                m.cut = cutoff;
                m.lp.frequency.cancelScheduledValues(t); m.lp.frequency.setTargetAtTime(cutoff, t, smooth);
            }
        },
        stopMusic(fade = 2) {
            const m = this.music; if (!m || m.el.paused) return;
            this._musicRamp(0, fade);
            clearTimeout(m.stopT);
            m.stopT = setTimeout(() => m.el.pause(), fade * 1000 + 100);
        },
        musicPlaying() { return !!(this.music && !this.music.el.paused && !this.music.failed); },

        /** Final: vuelve el soundtrack completo. Si el MP3 no carga, suena el acorde sintetizado. */
        ending() {
            this.playMusic({ volume: 0.95, fade: 5, restart: true });
            if (!this.music || this.music.failed) {
                const chord = [220, 277.2, 329.6, 440, 554.4];
                chord.forEach((f, i) => {
                    this._tone({ freq: f, dur: 9, gain: 0.03, attack: 3 + i * 0.4, wet: 1, detune: -6 });
                    this._tone({ freq: f, dur: 9, gain: 0.03, attack: 3 + i * 0.4, wet: 1, detune: 6 });
                });
            }
            if (this.ambGain) this.ambGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 2);
        },
        resetAmbience() {
            if (this.ambGain) this.ambGain.gain.setTargetAtTime(0.32, this.ctx.currentTime, 1);
        },

        toggleMute() {
            this.muted = !this.muted;
            if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.1);
            if (this.music && !this.music.g) this.music.el.muted = this.muted;
            return this.muted;
        }
    };

    window.SFX = SFX;
})();
