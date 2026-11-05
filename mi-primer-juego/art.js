/* =========================================================================
 *  UMBRAL — art.js
 *  Todo el arte se genera por código con Canvas 2D al arrancar:
 *  cielo, capas de bosque en parallax, niebla, rayos de luz, suelo,
 *  utilería (caja, trampa, maza, roca) y el grano de película.
 * ========================================================================= */
(function () {
    'use strict';

    /* ---------- utilidades ---------- */
    function rng(seed) {                         // mulberry32: aleatorio determinista
        let a = seed >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function canvas(w, h) {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        return [c, c.getContext('2d')];
    }
    const blurOK = (() => { const [, g] = canvas(1, 1); g.filter = 'blur(2px)'; return g.filter === 'blur(2px)'; })();
    function withBlur(src, px) {
        if (!px || !blurOK) return src;
        const [c, g] = canvas(src.width, src.height);
        g.filter = `blur(${px}px)`; g.drawImage(src, 0, 0);
        return c;
    }
    const lerpN = (a, b, t) => a + (b - a) * t;
    function gray(v, a = 1) { return `rgba(${v},${v},${v},${a})`; }

    /* ---------- cielo ---------- */
    function sky(w, h) {
        const [c, g] = canvas(w, h);
        const lg = g.createLinearGradient(0, 0, 0, h);
        lg.addColorStop(0, gray(78)); lg.addColorStop(0.35, gray(150));
        lg.addColorStop(0.62, gray(168)); lg.addColorStop(1, gray(70));
        g.fillStyle = lg; g.fillRect(0, 0, w, h);
        const rg = g.createRadialGradient(w * 0.62, h * 0.32, 10, w * 0.62, h * 0.32, w * 0.55);
        rg.addColorStop(0, gray(255, 0.32)); rg.addColorStop(1, gray(255, 0));
        g.fillStyle = rg; g.fillRect(0, 0, w, h);
        return c;
    }

    /* ---------- tronco con ramas (silueta) ---------- */
    function trunk(g, r, x, baseY, topY, width, branchy) {
        const lean = (r() - 0.5) * 0.08;
        const segs = 24, left = [], right = [];
        for (let i = 0; i <= segs; i++) {
            const t = i / segs, y = baseY + (topY - baseY) * t;
            const wob = Math.sin(t * 9 + x) * width * 0.06;
            const ww = width * (1 - t * 0.35) * (i === 0 ? 1.6 : 1);
            const cx = x + (baseY - y) * lean + wob;
            left.push([cx - ww / 2, y]); right.push([cx + ww / 2, y]);
        }
        g.beginPath();
        // raíces
        g.moveTo(x - width * 1.4, baseY + 6);
        g.quadraticCurveTo(x - width * 0.6, baseY - 4, left[1][0], left[1][1]);
        left.slice(1).forEach(p => g.lineTo(p[0], p[1]));
        right.slice(1).reverse().forEach(p => g.lineTo(p[0], p[1]));
        g.quadraticCurveTo(x + width * 0.6, baseY - 4, x + width * 1.4, baseY + 6);
        g.closePath(); g.fill();

        // ramas
        const nb = branchy ? 3 + (r() * 5 | 0) : (r() * 2 | 0);
        g.lineCap = 'round';
        for (let b = 0; b < nb; b++) {
            const t = 0.25 + r() * 0.7;
            const p = left[Math.floor(t * segs)];
            const dir = r() < 0.5 ? -1 : 1;
            const sx = dir < 0 ? p[0] : right[Math.floor(t * segs)][0];
            branch(g, r, sx, p[1], dir, width * (0.18 + r() * 0.2), 40 + r() * 140, 3);
        }
    }
    function branch(g, r, x, y, dir, w, len, depth) {
        if (depth <= 0 || w < 0.6) return;
        const ang = -Math.PI / 2 + dir * (0.5 + r() * 0.8);
        const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len * 0.8;
        const mx = (x + ex) / 2 + (r() - 0.5) * len * 0.3, my = (y + ey) / 2 + (r() - 0.5) * len * 0.2;
        g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
        const kids = 1 + (r() * 2 | 0);
        for (let k = 0; k < kids; k++)
            branch(g, r, ex, ey, r() < 0.6 ? dir : -dir, w * 0.55, len * (0.4 + r() * 0.3), depth - 1);
    }

    /* ---------- capa de bosque que se repite horizontalmente ---------- */
    function forestLayer({ w = 2048, h = 720, shade, count, minW, maxW, groundY, blur = 0, seed, branchy = true, grass = true }) {
        const r = rng(seed);
        const [c, g] = canvas(w, h);
        g.fillStyle = shade; g.strokeStyle = shade;
        for (let i = 0; i < count; i++) {
            const x = (i + r() * 0.8) * (w / count);
            const tw = minW + r() * (maxW - minW);
            [x - w, x, x + w].forEach(xx => trunk(g, r, xx, groundY, -40, tw, branchy));
        }
        // suelo con hierba
        g.beginPath(); g.moveTo(0, h);
        for (let x = 0; x <= w; x += 6) {
            const y = groundY + Math.sin(x / w * Math.PI * 2 * 3) * 10 + Math.sin(x / w * Math.PI * 2 * 7) * 4;
            g.lineTo(x, y);
        }
        g.lineTo(w, h); g.closePath(); g.fill();
        if (grass) for (let x = 0; x < w; x += 3) {
            const y = groundY + Math.sin(x / w * Math.PI * 2 * 3) * 10 + Math.sin(x / w * Math.PI * 2 * 7) * 4;
            const bh = 4 + r() * 12;
            g.beginPath(); g.moveTo(x - 1.5, y + 2); g.lineTo(x + (r() - 0.5) * 6, y - bh); g.lineTo(x + 1.5, y + 2); g.fill();
        }
        return withBlur(c, blur);
    }

    /* ---------- niebla ---------- */
    function fog(w, h, seed, alpha) {
        const r = rng(seed);
        const [c, g] = canvas(w, h);
        for (let i = 0; i < 60; i++) {
            const x = r() * w, y = h * (0.3 + r() * 0.5), rx = 120 + r() * 320, ry = 30 + r() * 70;
            [x - w, x, x + w].forEach(xx => {
                g.save(); g.translate(xx, y); g.scale(1, ry / rx);
                const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx);
                rg.addColorStop(0, gray(235, alpha)); rg.addColorStop(1, gray(235, 0));
                g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore();
            });
        }
        return c;
    }

    /* ---------- rayo de luz ---------- */
    function lightRay(w, h) {
        const [c, g] = canvas(w, h);
        const lg = g.createLinearGradient(0, 0, 0, h);
        lg.addColorStop(0, gray(255, 0.55)); lg.addColorStop(1, gray(255, 0));
        g.fillStyle = lg;
        g.beginPath(); g.moveTo(w * 0.42, 0); g.lineTo(w * 0.58, 0); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
        return withBlur(c, 14);
    }

    /* ---------- resplandor radial ---------- */
    function glow(size, a = 1) {
        const [c, g] = canvas(size, size);
        const rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        rg.addColorStop(0, gray(255, a)); rg.addColorStop(0.35, gray(255, a * 0.35)); rg.addColorStop(1, gray(255, 0));
        g.fillStyle = rg; g.fillRect(0, 0, size, size);
        return c;
    }

    /* ---------- grano de película ---------- */
    function grain(size) {
        const [c, g] = canvas(size, size);
        const img = g.createImageData(size, size), d = img.data;
        for (let i = 0; i < d.length; i += 4) {
            const v = Math.random() < 0.5 ? 0 : 255;
            d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.random() * 255;
        }
        g.putImageData(img, 0, 0);
        // rayas y polvo de proyector
        g.strokeStyle = gray(255, 0.5);
        for (let i = 0; i < 3; i++) { g.lineWidth = 1; const x = Math.random() * size; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 2, size); g.stroke(); }
        return c;
    }

    /* ---------- primer plano desenfocado ---------- */
    function foreground(w, h, seed) {
        const r = rng(seed);
        const [c, g] = canvas(w, h);
        g.fillStyle = '#000'; g.strokeStyle = '#000';
        for (let i = 0; i < 5; i++) {
            const x = r() * w;
            // matas de hierba alta
            for (let k = 0; k < 40; k++) {
                const bx = x + (r() - 0.5) * 220, bh = 60 + r() * 160;
                [bx - w, bx, bx + w].forEach(xx => {
                    g.beginPath(); g.moveTo(xx - 6, h); g.quadraticCurveTo(xx + (r() - 0.5) * 30, h - bh * 0.6, xx + (r() - 0.5) * 70, h - bh);
                    g.lineTo(xx + 6, h); g.fill();
                });
            }
        }
        return withBlur(c, 7);
    }

    /* ---------- viñeta (oscurece bordes, deja el centro limpio) ---------- */
    function vignette(w, h) {
        const [c, g] = canvas(w, h);
        g.translate(w / 2, h * 0.47); g.scale(1, h / w * 1.25);
        const R = w * 0.62;
        const rg = g.createRadialGradient(0, 0, R * 0.38, 0, 0, R);
        rg.addColorStop(0, 'rgba(0,0,0,0)');
        rg.addColorStop(0.55, 'rgba(0,0,0,0.38)');
        rg.addColorStop(1, 'rgba(0,0,0,0.92)');
        g.fillStyle = rg; g.fillRect(-w, -h * 2, w * 2, h * 4);
        return c;
    }

    /* ---------- utilería ---------- */
    function crate() {
        const [c, g] = canvas(80, 80);
        g.fillStyle = '#050505'; g.fillRect(0, 0, 80, 80);
        g.strokeStyle = '#1e1e1e'; g.lineWidth = 2;
        for (let y = 20; y < 80; y += 20) { g.beginPath(); g.moveTo(3, y); g.lineTo(77, y); g.stroke(); }
        g.lineWidth = 5; g.strokeStyle = '#141414';
        g.beginPath(); g.moveTo(6, 6); g.lineTo(74, 74); g.stroke();
        g.lineWidth = 3; g.strokeRect(4, 4, 72, 72);
        return c;
    }
    function trap(closed) {
        const [c, g] = canvas(84, 44);
        g.fillStyle = '#030303'; g.strokeStyle = '#030303';
        g.fillRect(8, 38, 68, 6);                           // base
        g.lineWidth = 3;
        if (!closed) {
            // mandíbulas abiertas, planas a los lados con dientes hacia arriba
            [[4, 1], [80, -1]].forEach(([x0, d]) => {
                g.beginPath(); g.moveTo(42, 40); g.quadraticCurveTo(42 - 20 * d, 44, x0, 36); g.stroke();
                for (let i = 0; i < 4; i++) {
                    const tx = 42 - d * (8 + i * 8);
                    g.beginPath(); g.moveTo(tx - 3, 40); g.lineTo(tx, 30); g.lineTo(tx + 3, 40); g.fill();
                }
            });
            g.fillRect(36, 34, 12, 6);                       // plato
        } else {
            // mandíbulas cerradas, arco vertical con dientes entrelazados
            g.beginPath(); g.arc(42, 40, 22, Math.PI, 0); g.stroke();
            for (let i = 0; i < 5; i++) {
                const tx = 28 + i * 7;
                g.beginPath(); g.moveTo(tx - 3, 18 + (i % 2) * 2); g.lineTo(tx, 30); g.lineTo(tx + 3, 18 + (i % 2) * 2); g.fill();
            }
        }
        return c;
    }
    function mace() {
        const [c, g] = canvas(110, 110);
        g.fillStyle = '#030303';
        g.translate(55, 55);
        for (let i = 0; i < 14; i++) {
            g.save(); g.rotate(i / 14 * Math.PI * 2);
            g.beginPath(); g.moveTo(-6, -26); g.lineTo(0, -52); g.lineTo(6, -26); g.fill(); g.restore();
        }
        g.beginPath(); g.arc(0, 0, 32, 0, Math.PI * 2); g.fill();
        g.strokeStyle = '#1b1b1b'; g.lineWidth = 2; g.beginPath(); g.arc(-4, -4, 24, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
        return c;
    }
    function boulder(rad) {
        const s = rad * 2 + 8, [c, g] = canvas(s, s), r = rng(77);
        g.translate(s / 2, s / 2);
        g.fillStyle = '#040404';
        g.beginPath();
        for (let i = 0; i <= 40; i++) {
            const a = i / 40 * Math.PI * 2, rr = rad * (0.95 + Math.sin(a * 3 + 1) * 0.025 + r() * 0.025);
            i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        g.closePath(); g.fill();
        g.strokeStyle = '#1c1c1c'; g.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
            const a = r() * Math.PI * 2, l = rad * (0.3 + r() * 0.5);
            g.beginPath(); g.moveTo(Math.cos(a) * rad * 0.2, Math.sin(a) * rad * 0.2);
            g.lineTo(Math.cos(a + 0.3) * l, Math.sin(a + 0.3) * l); g.stroke();
        }
        return c;
    }
    function dot(size, v) {
        const [c, g] = canvas(size, size);
        const rg = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        rg.addColorStop(0, gray(v, 1)); rg.addColorStop(1, gray(v, 0));
        g.fillStyle = rg; g.fillRect(0, 0, size, size);
        return c;
    }
    function shard() {
        const [c, g] = canvas(10, 10);
        g.fillStyle = '#000'; g.beginPath(); g.moveTo(1, 3); g.lineTo(8, 0); g.lineTo(10, 7); g.lineTo(3, 10); g.fill();
        return c;
    }

    /* ---------- nivel: siluetas del suelo, estacas y árboles cercanos ---------- */
    function levelChunks(level, chunkW) {
        const r = rng(1234);
        const W = level.width, H = level.height;
        // Pre-calcula los contornos para que todos los trozos coincidan
        const shapes = level.solids.filter(s => !s.invisible).map(s => {
            const top = [];
            for (let x = s.x; x <= s.x + s.w; x += 7) {
                const e = Math.min(x - s.x, s.x + s.w - x);              // hombros redondeados
                const round = e < 16 ? Math.pow(1 - e / 16, 2) * 9 : 0;
                top.push([x, s.y + (r() - 0.5) * 3 - 1 + round]);
            }
            top.push([s.x + s.w, s.y]);
            const blades = [];
            for (let x = s.x + 2; x < s.x + s.w - 2; x += 2.5)
                blades.push([x, s.y, 3 + r() * (s.wood ? 0 : 13), (r() - 0.5) * 8]);
            const lEdge = [], rEdge = [];
            for (let y = s.y + 8; y <= s.y + s.h + 20; y += 12) {
                const k = Math.sin((y - s.y) * 0.05) * 4;
                lEdge.push([s.x + (r() - 0.5) * 7 + k, y]); rEdge.push([s.x + s.w + (r() - 0.5) * 7 - k, y]);
            }
            return { s, top, blades, lEdge, rEdge };
        });
        const trees = level.bgTrees.map(t => ({ ...t, seed: (r() * 1e9) | 0 }));

        const chunks = [];
        for (let cx = 0; cx < W; cx += chunkW) {
            const [c, g] = canvas(Math.min(chunkW, W - cx), H);
            g.translate(-cx, 0);
            g.fillStyle = '#040404'; g.strokeStyle = '#040404';

            // árboles negros del plano de juego (detrás del personaje)
            trees.forEach(t => {
                if (t.x + 300 < cx || t.x - 300 > cx + chunkW) return;
                trunk(g, rng(t.seed), t.x, t.y, -60, t.w, true);
            });
            // enredaderas colgando
            level.vines.forEach(v => {
                if (v.x + 50 < cx || v.x - 50 > cx + chunkW) return;
                g.lineWidth = 2; g.beginPath(); g.moveTo(v.x, 0);
                g.quadraticCurveTo(v.x + 12, v.len * 0.5, v.x - 4, v.len); g.stroke();
                g.beginPath(); g.ellipse(v.x - 4, v.len, 4, 9, 0, 0, Math.PI * 2); g.fill();
            });

            // vigas / ramas horizontales de las que cuelgan los péndulos
            (level.beams || []).forEach(bm => {
                if (bm.x2 < cx || bm.x1 > cx + chunkW) return;
                const rr = rng(bm.x1);
                g.beginPath(); g.moveTo(bm.x1, bm.y1 - bm.w / 2);
                for (let t = 0; t <= 1.0001; t += 0.05) g.lineTo(lerpN(bm.x1, bm.x2, t), lerpN(bm.y1, bm.y2, t) - bm.w / 2 * (1 - t * 0.4) + Math.sin(t * 17) * 2);
                for (let t = 1; t >= -0.0001; t -= 0.05) g.lineTo(lerpN(bm.x1, bm.x2, t), lerpN(bm.y1, bm.y2, t) + bm.w / 2 * (1 - t * 0.4) + Math.sin(t * 13) * 2);
                g.closePath(); g.fill();
                g.strokeStyle = '#040404';
                for (let k = 0; k < 5; k++) branch(g, rr, lerpN(bm.x1, bm.x2, 0.1 + k * 0.2), lerpN(bm.y1, bm.y2, 0.1 + k * 0.2), k % 2 ? 1 : -1, 4, 50 + rr() * 50, 2);
            });

            // estacas en los fosos
            level.spikes.forEach(sp => {
                if (sp.x + sp.w < cx || sp.x > cx + chunkW) return;
                const rr = rng(sp.x);
                for (let x = sp.x + 6; x < sp.x + sp.w; x += 13) {
                    const h = 34 + rr() * 26, lean = (rr() - 0.5) * 14;
                    g.beginPath(); g.moveTo(x - 5, sp.y + 30); g.lineTo(x + lean, sp.y - h + 30); g.lineTo(x + 5, sp.y + 30); g.fill();
                }
            });

            // suelos
            shapes.forEach(({ s, top, blades, lEdge, rEdge }) => {
                if (s.x + s.w + 20 < cx || s.x - 20 > cx + chunkW) return;
                g.beginPath();
                g.moveTo(lEdge[lEdge.length - 1][0], H + 20);
                for (let i = lEdge.length - 1; i >= 0; i--) g.lineTo(lEdge[i][0], lEdge[i][1]);
                top.forEach(p => g.lineTo(p[0], p[1]));
                rEdge.forEach(p => g.lineTo(p[0], p[1]));
                g.lineTo(rEdge[rEdge.length - 1][0], H + 20);
                g.closePath(); g.fill();
                blades.forEach(([x, y, h, l]) => {
                    g.beginPath(); g.moveTo(x - 1.4, y + 2); g.lineTo(x + l, y - h); g.lineTo(x + 1.4, y + 2); g.fill();
                });
            });
            chunks.push({ x: cx, canvas: c });
        }
        return chunks;
    }

    window.ART = { rng, sky, forestLayer, fog, lightRay, glow, grain, foreground, vignette, crate, trap, mace, boulder, dot, shard, levelChunks };
})();
