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

            // Bus con "reverb" barata (delays realimentados) para dar espacio de bosque
            this.wet = ctx.createGain(); this.wet.gain.value = 0.28;
            const d1 = ctx.createDelay(1); d1.delayTime.value = 0.13;
            const d2 = ctx.createDelay(1); d2.delayTime.value = 0.29;
            const fb = ctx.createGain(); fb.gain.value = 0.42;
            const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1800;
            this.wet.connect(d1); d1.connect(d2); d2.connect(lp); lp.connect(fb); fb.connect(d1);
            lp.connect(this.master);

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

        _out(gainNode, wet = 0) {
            gainNode.connect(this.master);
            if (wet > 0) { const w = this.ctx.createGain(); w.gain.value = wet; gainNode.connect(w); w.connect(this.wet); }
        },

        /** Ráfaga de ruido filtrado: base de pasos, golpes, salpicaduras... */
        _noise({ dur = 0.1, type = 'bandpass', freq = 1000, q = 1, gain = 0.3, attack = 0.002, sweepTo = null, wet = 0.2, brown = false, when = 0 }) {
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
            src.connect(f).connect(g); this._out(g, wet);
            src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
        },

        _tone({ freq = 220, to = null, dur = 0.3, type = 'sine', gain = 0.2, attack = 0.005, wet = 0.3, when = 0, detune = 0 }) {
            if (!this.ctx || this.muted) return;
            const ctx = this.ctx, t = ctx.currentTime + when;
            const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t); o.detune.value = detune;
            if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(gain, t + attack);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            o.connect(g); this._out(g, wet);
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
            wind.connect(wf).connect(wg).connect(this.master);
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
            dl.connect(dg); this._out(dg, 0.5);
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

        _creak() {
            const f = 70 + Math.random() * 60;
            this._tone({ freq: f, to: f * 1.6, dur: 1.4, type: 'sawtooth', gain: 0.012, attack: 0.4, wet: 0.9 });
        },
        _distantBird() {
            const base = 1400 + Math.random() * 600;
            for (let i = 0; i < 2 + (Math.random() * 2 | 0); i++)
                this._tone({ freq: base, to: base * 0.7, dur: 0.18, type: 'sine', gain: 0.01, when: i * 0.32, wet: 1 });
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

        /** Acorde final que crece lentamente. */
        ending() {
            const chord = [220, 277.2, 329.6, 440, 554.4];
            chord.forEach((f, i) => {
                this._tone({ freq: f, dur: 9, gain: 0.03, attack: 3 + i * 0.4, wet: 1, detune: -6 });
                this._tone({ freq: f, dur: 9, gain: 0.03, attack: 3 + i * 0.4, wet: 1, detune: 6 });
            });
            if (this.ambGain) this.ambGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 2);
        },
        resetAmbience() {
            if (this.ambGain) this.ambGain.gain.setTargetAtTime(0.32, this.ctx.currentTime, 1);
        },

        toggleMute() {
            this.muted = !this.muted;
            if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.1);
            return this.muted;
        }
    };

    window.SFX = SFX;
})();
