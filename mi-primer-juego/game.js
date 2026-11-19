/* =========================================================================
 *  UMBRAL — game.js
 *  Plataformero atmosférico en blanco y negro hecho con Phaser 4.
 *  Autor: Isaac Proaño · Aplicaciones / Desarrollo de Juegos · 2026
 *
 *  Estructura:
 *    1. Configuración y datos del nivel
 *    2. Escena principal (preload / create / update)
 *    3. Personaje: física, animación procedural y bufanda
 *    4. Peligros: trampas, estacas, péndulos, agua y la roca
 *    5. Muerte, puntos de control y final
 *  Parámetros de prueba en la URL:  ?debug  ·  ?x=4000 (empezar en esa x)
 * ========================================================================= */
(function () {
    'use strict';

    /* =====================================================================
     * 1. CONFIGURACIÓN Y NIVEL
     * ===================================================================== */
    const VIEW_W = 1280, VIEW_H = 720, CAM_OY = 150;
    const params = new URLSearchParams(location.search);
    const DEBUG = params.has('debug');
    const START_X = params.has('x') ? Number(params.get('x')) : null;

    const P = {               // física del personaje
        speed: 270, accelGround: 2400, accelAir: 1500,
        jump: 640, gravity: 1500, coyote: 0.1, buffer: 0.13,
        pushSpeed: 135
    };

    const LEVEL = {
        width: 12900, height: 820,
        solids: [
            { x: -100, y: -400, w: 100, h: 1300, invisible: true },          // muro izquierdo
            { x: 0,    y: 560, w: 1480, h: 300 },                            // A: claro inicial
            { x: 1480, y: 520, w: 720,  h: 340 },                            // B: escalón
            { x: 2200, y: 800, w: 170,  h: 60, invisible: true },            //   fondo del foso 1
            { x: 2370, y: 540, w: 1030, h: 320 },                            // C: zona de la caja
            { x: 3400, y: 360, w: 1000, h: 500 },                            // D: muro alto + péndulos
            { x: 4400, y: 560, w: 320,  h: 300 },                            // E: antes del agua
            { x: 4720, y: 740, w: 400,  h: 120 },                            //   fondo del estanque
            { x: 4880, y: 545, w: 90,   h: 320 },                            //   roca en el agua
            { x: 5120, y: 560, w: 900,  h: 300 },                            // F: carrera
            { x: 6020, y: 800, w: 140,  h: 60, invisible: true },            //   fondo del foso 2
            { x: 6160, y: 560, w: 2990, h: 300 },                            // G: bosque de la araña
            { x: 9150, y: 800, w: 160,  h: 60, invisible: true },            //   fondo del foso 3 (niebla)
            { x: 9310, y: 560, w: 740,  h: 300 },                            // H: niebla
            { x: 10050, y: 800, w: 150, h: 60, invisible: true },            //   fondo del foso 4 (niebla)
            { x: 10200, y: 560, w: 2700, h: 300 },                           // I: final de la niebla, el ciclo y la luz
            { x: 12900, y: -400, w: 100, h: 1300, invisible: true }          // muro derecho
        ],
        spikes:  [{ x: 2200, y: 760, w: 170 }, { x: 6020, y: 760, w: 140 }, { x: 9150, y: 760, w: 160 }, { x: 10050, y: 760, w: 150 }],
        pits:    [{ x: 2200, y: 735, w: 170, h: 120 }, { x: 6020, y: 735, w: 140, h: 120, boulderPit: true },
                  { x: 9150, y: 735, w: 160, h: 120 }, { x: 10050, y: 735, w: 150, h: 120 }],
        traps:   [{ x: 1150, y: 560 }, { x: 1830, y: 520 }, { x: 5720, y: 560 }, { x: 7290, y: 560, spider: true },
                  { x: 8980, y: 560 }, { x: 9760, y: 560 }, { x: 10520, y: 560 }],
        // Raíces con espinas que brotan al acercarse (niebla). Se oyen y asoman antes de salir.
        roots:   [{ x: 9470, y: 560, w: 70 }, { x: 10740, y: 560, w: 80 }],
        // La niebla: solo se ve lo que alumbra el palo
        fog:     { from: 8700, to: 10950 },
        // El ciclo: al llegar a b vuelves a a. Solo se rompe quedándose quieto en la luz (spot) `needed` segundos
        loop:    { a: 11000, b: 11900, spot: 11450, wallX: 11960, needed: 2.6 },
        pendulums: [
            { x: 3760, py: 40, len: 260, amp: 1.2, speed: 1.9, phase: 0 },
            { x: 4150, py: 40, len: 260, amp: 1.2, speed: 1.9, phase: 1.3 }
        ],
        beams: [{ x1: 3480, y1: 22, x2: 4420, y2: 48, w: 18 }],
        water: { x: 4720, y: 592, w: 400, bottom: 740 },
        box: { x: 2880, y: 540 },
        boulder: { trigger: 5340, startX: 5020, groundY: 560, r: 90, stopPitX: 6090 },
        checkpoints: [
            { x: 520,  y: 560 }, { x: 2470, y: 540 }, { x: 3470, y: 360 },
            { x: 4470, y: 560 }, { x: 5190, y: 560 }, { x: 6720, y: 560 },
            { x: 7700, y: 560, requires: 'spiderWounded' },
            { x: 8700, y: 560 }, { x: 9330, y: 560 }, { x: 10230, y: 560 }, { x: 11010, y: 560 }
        ],
        // La araña: patas que apuñalan (fase 1) y la emboscada con telaraña (fase 2)
        spider: {
            bodyX: 7760, bodyY: 34, groundY: 560,
            huntFrom: 6960, barrierX: 7520,
            plantedLegs: [7505, 7590, 7700, 7830, 7930, 8040],
            cocoonTrigger: 8060, freeHits: 8
        },
        ending: { x: 12600, y: 360, trigger: 12450 },
        bgTrees: [
            { x: 380, y: 560, w: 58 }, { x: 1330, y: 560, w: 36 }, { x: 1980, y: 520, w: 84 },
            { x: 2560, y: 540, w: 30 }, { x: 3130, y: 540, w: 62 }, { x: 3950, y: 360, w: 44 },
            { x: 4560, y: 560, w: 52 }, { x: 5420, y: 560, w: 92 }, { x: 6400, y: 560, w: 48 },
            { x: 6780, y: 560, w: 30 }, { x: 7120, y: 560, w: 70 }, { x: 7420, y: 560, w: 46 },
            { x: 8180, y: 560, w: 80 }, { x: 8520, y: 560, w: 40 }, { x: 8900, y: 560, w: 34 },
            { x: 9060, y: 560, w: 44 }, { x: 9400, y: 560, w: 60 }, { x: 9660, y: 560, w: 30 }, { x: 9990, y: 560, w: 52 },
            { x: 10380, y: 560, w: 36 }, { x: 10860, y: 560, w: 70 },
            { x: 11120, y: 560, w: 64 }, { x: 11330, y: 560, w: 40 }, { x: 11590, y: 560, w: 82 }, { x: 11800, y: 560, w: 48 },
            { x: 12180, y: 560, w: 40 }, { x: 12360, y: 560, w: 30 }
        ],
        webs: [
            { x1: 7120, x2: 7420, y: 120, r: 120 }, { x1: 6780, x2: 7120, y: 300, r: 90 },
            { x1: 8180, x2: 8520, y: 160, r: 130 }, { x1: 8520, x2: 8900, y: 330, r: 80 }
        ],
        // capullos: los que no pudieron salir de sus pensamientos (s = tamaño)
        cocoons: [
            { x: 6640, len: 260, s: 0.8 }, { x: 6760, len: 140 }, { x: 6905, len: 320, s: 1.1 }, { x: 7020, len: 190 },
            { x: 7160, len: 90, s: 0.7 }, { x: 7270, len: 240 }, { x: 7365, len: 330, s: 0.9 }, { x: 7470, len: 160, s: 1.15 },
            { x: 7600, len: 120 }, { x: 7690, len: 290, s: 0.75 }, { x: 7810, len: 200, s: 1.05 }, { x: 7905, len: 100, s: 0.8 },
            { x: 8010, len: 270 }, { x: 8150, len: 170, s: 0.9 }, { x: 8330, len: 230 }, { x: 8440, len: 110, s: 0.7 },
            { x: 8700, len: 150 }, { x: 8790, len: 300, s: 0.85 }
        ],
        vines: [
            { x: 760, len: 170 }, { x: 812, len: 120 }, { x: 2700, len: 230 }, { x: 3580, len: 140 },
            { x: 4300, len: 120 }, { x: 5000, len: 200 }, { x: 5940, len: 160 },
            { x: 9240, len: 210 }, { x: 10120, len: 180 }, { x: 11230, len: 150 }, { x: 11700, len: 240 }
        ],
        hints: [
            { x: 720,  y: 455, text: '←   →' },
            { x: 960,  y: 455, text: '↑  /  espacio' },
            { x: 2790, y: 420, text: 'empuja' }
        ],
        // El palo del abuelo: aparece clavado en el bosque, poco después de despertar
        stick: { x: 650, y: 560 },
        // Recuerdos: aparecen cuando el niño ya lleva el palo y pasa cerca.
        // bush: 'small' | 'big' (zarza con moras) · music: el soundtrack suena apagado un momento
        memories: [
            { x: 650,  y: 560, stick: true, text: 'Siempre había un palo esperando en el camino.\nAlguien me enseñó a encontrarlo.' },
            { x: 2560, y: 540, bush: 'small', text: 'Cada hoja tenía un nombre.\nYa no recuerdo la mitad.' },
            { x: 4540, y: 560, bush: 'small', text: 'A veces el bosque estaba lleno de voces.\nA veces, solo de dos pasos.' },
            { x: 5190, y: 560, text: 'Hubo un día en que corrimos\nsin saber de qué.' },
            { x: 6330, y: 560, bush: 'big', music: true, text: 'Caer también puede sonar a risa.\nY al levantarse, siempre había algo dulce.' },
            { x: 6800, y: 560, dark: true, text: 'No todos pudieron salir de aquí.\nAlgunos se quedaron envueltos en sus propios pensamientos.' },
            { x: 8560, y: 560, text: 'Los caminos se hicieron largos.\nLas visitas, cortas.' },
            // en la niebla: recuerdos borrosos, que se enfocan al acercarse
            { x: 8850, y: 560, blur: true, text: 'Hay cosas que ya no recuerdo bien.\nSu voz. El camino de vuelta.' },
            { x: 9600, y: 560, blur: true, text: 'Un día, el camino lo recorrió solo.' },
            { x: 10350, y: 560, blur: true, dark: true, text: 'Nadie me dijo que sería la última vez.' },
            // después de romper el ciclo
            { x: 12150, y: 560, music: true, text: 'Me preguntó cuándo volveríamos.\nLe dije que pronto.' }
        ],
        // Epílogo: la habitación de día se monta aquí, a la derecha del nivel
        epilogue: { x: 14000 },
        // Última línea, sobre la pantalla blanca del final, antes de los créditos
        epitaph: 'Lo que queda de alguien\na veces cabe en una mano.'
    };

    // Soundtrack (musica/umbral.mp3): suena siempre, pero cambia según dónde está el niño.
    //   cutoff = frecuencia del filtro: bajo = apagado, "desde otra habitación"; 20000 = claro
    const MUSIC = {
        room:   { vol: 0.9,  cutoff: 20000 },      // la habitación: la realidad
        forest: { vol: 0.55, cutoff: 1100 },       // el bosque, ya con el palo: lejana, pero siempre presente
        memory: { vol: 0.72, cutoff: 3200 },       // junto a un recuerdo: se abre un poco
        big:    { vol: 0.85, cutoff: 8000 },       // el árbol de moras
        dread:  { vol: 0.16, cutoff: 420 },        // la araña: los pensamientos oscuros la tapan
        fog:    { vol: 0.5,  cutoff: 1500 },       // la niebla: lejana, pero se oye
        loop:   { vol: 0.48, cutoff: 1100 }        // el ciclo (cada vuelta un poco más lejos)
    };

    // El ciclo: lo que piensa cada vez que vuelve al mismo lugar, y al romperlo
    const LOOP_TEXTS = [
        '',
        'Otra vez aquí.',
        'Camino y camino,\ny siempre vuelvo al mismo lugar.',
        'Estas paredes no son de piedra.\nLas levanté yo.',
        'Algo me sigue.\nSiempre ha estado ahí.',
        'Ya no quiero huir.\nQuizá solo tengo que dejar que me alcance.'
    ];
    const LOOP_BREAK = 'No se va a ir del todo.\nPero es mi sombra. No soy yo.';

    // Monólogo interno en la habitación (cada línea se puede adelantar con una tecla)
    const MONOLOGUE = [
        'Otra noche más mirando el mismo techo.',
        'Todo sigue en su sitio. Yo no.',
        '¿Debería redecorar mi habitación?',
        '…o quizá el problema no es la habitación.'
    ];
    const MONO_SINK = 'Hace mucho que no salgo a caminar.';

    // Habitación: zoom inicial y las dos poses del niño (coordenadas locales, cama en y = 0)
    const ROOM_ZOOM = 1.8;
    const ROOM_SIT = {
        hip: [6, -4], neck: [2, -23], head: [-6, -31],
        elbow: [-4, -12], hand: [-10, -6], elbow2: [-1, -13], hand2: [-7, -7],
        knee: [-9, -4], foot: [-12, 10], knee2: [-6, -5], foot2: [-8, 10]
    };
    const ROOM_LIE = {
        hip: [50, -9], neck: [68, -12], head: [80, -19],
        elbow: [60, -6], hand: [70, -10], elbow2: [62, -8], hand2: [72, -12],
        knee: [37, -15], foot: [24, -8], knee2: [39, -13], foot2: [26, -7]
    };

    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const lerp = (a, b, t) => a + (b - a) * t;

    /* =====================================================================
     * 2. ESCENA PRINCIPAL
     * ===================================================================== */
    class Umbral extends Phaser.Scene {
        constructor() { super('Umbral'); }

        init(data) { this.skipTitle = !!(data && data.skipTitle) || START_X !== null; }

        /** Genera todas las texturas a partir de art.js (solo la primera vez). */
        preload() {
            const T = this.textures;
            if (T.exists('sky')) return;
            const add = (k, c) => T.addCanvas(k, c);
            add('sky', ART.sky(VIEW_W, VIEW_H));
            add('forest1', ART.forestLayer({ shade: 'rgb(172,172,168)', count: 16, minW: 5, maxW: 13, groundY: 520, blur: 3, seed: 11 }));
            add('forest2', ART.forestLayer({ shade: 'rgb(138,138,134)', count: 11, minW: 10, maxW: 22, groundY: 560, blur: 2, seed: 22 }));
            add('forest3', ART.forestLayer({ shade: 'rgb(98,98,95)',    count: 8,  minW: 16, maxW: 32, groundY: 610, blur: 1.2, seed: 33 }));
            add('forest4', ART.forestLayer({ shade: 'rgb(52,52,50)',    count: 6,  minW: 24, maxW: 46, groundY: 665, blur: 0.6, seed: 44 }));
            add('fog1', ART.fog(2048, VIEW_H, 5, 0.3));
            add('fog2', ART.fog(2048, VIEW_H, 6, 0.24));
            add('fog3', ART.fog(2048, VIEW_H, 7, 0.18));
            add('ray', ART.lightRay(420, 900));
            add('glow', ART.glow(256));
            add('grain', ART.grain(256));
            add('fg', ART.foreground(2048, 420, 99));
            add('vignette', ART.vignette(VIEW_W, VIEW_H));
            add('crate', ART.crate());
            add('trapOpen', ART.trap(false));
            add('trapShut', ART.trap(true));
            add('mace', ART.mace());
            add('boulder', ART.boulder(LEVEL.boulder.r));
            add('mote', ART.dot(8, 255));
            add('dust', ART.dot(16, 40));
            add('shard', ART.shard());
            add('roomBg', ART.roomBg());
            add('roomDay', ART.roomBg(true));
            add('curtain', ART.curtainPanel());
            add('mother', ART.mother());
            add('roomBed', ART.roomBed());
            add('cane', ART.cane(true));
            add('caneDark', ART.cane(false));
            add('bramble', ART.bramble(130, 70, 5, 10));
            add('brambleBig', ART.bramble(300, 150, 9, 40));
            add('darkness', ART.darkness(1280, 720, 150));
            add('shadeBlob', ART.shade(128));
            add('shadowKid', ART.shadowKid());
            ART.levelChunks(LEVEL, 1024).forEach((ch, i) => add('chunk' + i, ch.canvas));
        }

        create() {
            const L = LEVEL;
            this.t = 0;
            this.state = 'title';
            this.roomActive = false;
            this.physics.world.gravity.y = P.gravity;
            this.physics.world.setBounds(0, -400, L.width, L.height + 400);

            /* ---- fondo en capas (parallax manual) ---- */
            this.add.image(0, 0, 'sky').setOrigin(0).setScrollFactor(0).setDepth(0);
            this.sun = this.add.image(VIEW_W * 0.62, VIEW_H * 0.3, 'glow').setScrollFactor(0).setScale(5).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(0.5);
            const layer = (key, f, depth, alpha = 1, drift = 0) => {
                const ts = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, key).setOrigin(0).setScrollFactor(0).setDepth(depth).setAlpha(alpha);
                ts.f = f; ts.drift = drift; return ts;
            };
            this.layers = [
                layer('forest1', 0.12, 1),
                layer('fog1', 0.18, 1.5, 0.9, 6),
                layer('forest2', 0.28, 2),
                layer('fog2', 0.4, 2.5, 0.9, 10),
                layer('forest3', 0.52, 3),
                layer('fog3', 0.66, 3.5, 0.8, 14),
                layer('forest4', 0.78, 4)
            ];
            // rayos de luz entre los árboles
            this.rays = [];
            [[900, 0.28], [2300, 0.2], [3900, 0.24], [5400, 0.18], [6900, 0.3]].forEach(([x, a], i) => {
                const r = this.add.image(x, -40, 'ray').setOrigin(0.5, 0).setScrollFactor(0.85, 0.85)
                    .setBlendMode(Phaser.BlendModes.ADD).setAlpha(a).setDepth(4.5).setAngle(-14 + i * 3).setScale(1.2, 1);
                r.baseA = a; r.seed = i * 1.7; this.rays.push(r);
            });

            /* ---- mundo jugable ---- */
            let ci = 0;
            for (let x = 0; x < L.width; x += 1024) this.add.image(x, 0, 'chunk' + ci++).setOrigin(0).setDepth(10);

            this.solids = L.solids.map(s => {
                const z = this.add.zone(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h);
                this.physics.add.existing(z, true);
                return z;
            });

            // textos de ayuda, oscuros, escritos "en el mundo"
            this.hints = L.hints.map(h => this.add.text(h.x, h.y, h.text, {
                fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '30px', color: '#151515'
            }).setOrigin(0.5).setDepth(9).setAlpha(0));

            this.createPlayer();
            this.createHazards();
            this.createStory();
            this.createNight();
            this.createAtmosphere();
            this.createInput();
            this.createUI();
            this.createPanel();

            /* ---- cámara y post-procesado (filtros de Phaser 4) ---- */
            const cam = this.cameras.main;
            cam.setZoom(1);
            cam.setBounds(0, 0, L.width, L.height);
            cam.startFollow(this.player, true, 0.075, 0.075, 0, CAM_OY);
            cam.setDeadzone(80, 60);
            cam.setBackgroundColor('#000000');
            if (!params.has('nofx')) try { this.grade = cam.filters.internal.addColorMatrix(); }       // gradación de color (filtro de Phaser 4)
            catch (e) { console.warn('Filtros no disponibles', e); }

            if (DEBUG) this.physics.world.createDebugGraphic();

            if (this.skipTitle) this.beginPlay(true);
            else { this.createRoom(); this.showTitle(); }
            cam.fadeIn(1800, 0, 0, 0);
            window.__umbral = this;      // útil para pruebas automáticas
        }

        /* ------------------------------------------------------------ */
        createAtmosphere() {
            // partículas de polvo flotando en la luz
            this.motes = [];
            for (let i = 0; i < 55; i++) {
                const m = this.add.image(0, 0, 'mote').setBlendMode(Phaser.BlendModes.ADD).setDepth(15)
                    .setScale(0.3 + Math.random() * 0.6);
                m.ox = Math.random() * (VIEW_W + 200); m.oy = Math.random() * VIEW_H;
                m.sf = 0.85 + Math.random() * 0.4; m.seed = Math.random() * 100; m.baseA = 0.15 + Math.random() * 0.35;
                m.setScrollFactor(0); this.motes.push(m);
            }
            // primer plano desenfocado (más rápido que la cámara)
            this.fg = this.add.tileSprite(0, VIEW_H - 420, VIEW_W, 420, 'fg').setOrigin(0).setScrollFactor(0).setDepth(16).setAlpha(0.95);
            this.fogFront = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'fog3').setOrigin(0).setScrollFactor(0).setDepth(14).setAlpha(0.18);

            // grano de película y parpadeo de proyector
            this.grain = this.add.tileSprite(0, 0, VIEW_W, VIEW_H, 'grain').setOrigin(0).setScrollFactor(0).setDepth(40).setAlpha(0.07);
            this.add.image(0, 0, 'vignette').setOrigin(0).setScrollFactor(0).setDepth(39);
            this.flicker = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(41).setAlpha(0);

            // luz final
            const E = LEVEL.ending;
            this.endGlow = this.add.image(E.x, E.y, 'glow').setScale(7).setBlendMode(Phaser.BlendModes.ADD).setDepth(13).setAlpha(0.2);
            this.whiteout = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0xffffff).setOrigin(0).setScrollFactor(0).setDepth(45).setAlpha(0);

            // emisores de partículas
            this.dustFx = this.add.particles(0, 0, 'dust', {
                emitting: false, lifespan: 700, speed: { min: 15, max: 70 }, angle: { min: 190, max: 350 },
                scale: { start: 0.6, end: 2.2 }, alpha: { start: 0.45, end: 0 }, gravityY: -20
            }).setDepth(12);
            this.shardFx = this.add.particles(0, 0, 'shard', {
                emitting: false, lifespan: 1800, speed: { min: 90, max: 380 }, angle: { min: 200, max: 340 },
                scale: { min: 0.5, max: 1.6 }, rotate: { min: 0, max: 360 }, gravityY: 1100
            }).setDepth(12);
            this.bubbleFx = this.add.particles(0, 0, 'mote', {
                emitting: false, lifespan: 900, speed: { min: 20, max: 60 }, angle: { min: 250, max: 290 },
                scale: { start: 0.5, end: 0.1 }, alpha: { start: 0.6, end: 0 }, gravityY: -120
            }).setDepth(13);
            this.splashFx = this.add.particles(0, 0, 'mote', {
                emitting: false, lifespan: 700, speed: { min: 80, max: 260 }, angle: { min: 230, max: 310 },
                scale: { start: 0.7, end: 0.2 }, alpha: { start: 0.5, end: 0 }, gravityY: 900
            }).setDepth(13);
        }

        createInput() {
            const kb = this.input.keyboard;
            this.keys = kb.addKeys({
                left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', space: 'SPACE',
                a: 'A', d: 'D', w: 'W', r: 'R', m: 'M', esc: 'ESC'
            });
            kb.on('keydown-M', () => this.toast(SFX.toggleMute() ? 'sonido apagado' : 'sonido encendido'));
            kb.on('keydown-R', () => { if (this.state === 'play' && !this.panelOpen) this.kill('restart'); });
            kb.on('keydown', e => { if (this.panelOpen || e.code === 'KeyV' || e.code === 'Escape') return; this.anyInput(); });
            // un toque sobre un botón de la interfaz (p. ej. el icono de volumen) no cuenta como "empezar"
            this.input.on('pointerdown', (p, over) => { if (this.panelOpen || (over && over.length)) return; this.anyInput(); });
            kb.on('keydown-V', () => this.togglePanel());
            kb.on('keydown-ESC', () => { if (this.panelOpen) this.togglePanel(); });
            kb.on('keydown-UP', () => this.panelKey(0, -1));
            kb.on('keydown-W', () => this.panelKey(0, -1));
            kb.on('keydown-DOWN', () => this.panelKey(0, 1));
            kb.on('keydown-S', () => this.panelKey(0, 1));
            kb.on('keydown-LEFT', () => this.panelKey(-1, 0));
            kb.on('keydown-A', () => this.panelKey(-1, 0));
            kb.on('keydown-RIGHT', () => this.panelKey(1, 0));
            kb.on('keydown-D', () => this.panelKey(1, 0));
            this.input.addPointer(2);

            // controles táctiles
            this.touch = { left: false, right: false, jump: false };
            this.isTouch = this.sys.game.device.input.touch;
            this.touchUI = [];
            if (this.isTouch) {
                const mk = (x, y, label) => {
                    const c = this.add.circle(x, y, 58, 0xffffff, 0.08).setScrollFactor(0).setDepth(50).setStrokeStyle(2, 0xffffff, 0.25);
                    const t = this.add.text(x, y, label, { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#ffffff' })
                        .setOrigin(0.5).setAlpha(0.4).setScrollFactor(0).setDepth(51);
                    this.touchUI.push(c, t);
                };
                mk(110, VIEW_H - 100, '←'); mk(250, VIEW_H - 100, '→'); mk(VIEW_W - 120, VIEW_H - 100, '↑');
                this.touchUI.forEach(o => o.setVisible(false));
            }
        }

        readTouch() {
            const t = { left: false, right: false, jump: false };
            if (!this.isTouch) return t;
            this.input.manager.pointers.forEach(p => {
                if (!p.isDown) return;
                const x = p.x, y = p.y;                     // coordenadas de pantalla del juego
                if (y < VIEW_H * 0.45) return;
                if (x < 180) t.left = true;
                else if (x < 360) t.right = true;
                else if (x > VIEW_W - 300) t.jump = true;
            });
            return t;
        }

        createUI() {
            const serif = '"Cormorant Garamond", Georgia, serif';
            this.title = this.add.text(VIEW_W / 2, VIEW_H * 0.3, 'UMBRAL', {
                fontFamily: serif, fontSize: '132px', fontStyle: '300', color: '#d4d4d4'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setLetterSpacing(38).setAlpha(0);
            this.subtitle = this.add.text(VIEW_W / 2, VIEW_H * 0.3 + 92, this.isTouch ? 'toca para empezar' : 'pulsa cualquier tecla', {
                fontFamily: serif, fontSize: '26px', fontStyle: 'italic', color: '#b8b8b8'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);
            this.credits = this.add.text(VIEW_W - 28, VIEW_H - 24, 'M  silencio     V  volumen     R  reintentar', {
                fontFamily: serif, fontSize: '18px', color: '#8a8a8a'
            }).setOrigin(1, 1).setScrollFactor(0).setDepth(30).setAlpha(0);
            this.toastText = this.add.text(28, VIEW_H - 24, '', {
                fontFamily: serif, fontSize: '20px', fontStyle: 'italic', color: '#ddd'
            }).setOrigin(0, 1).setScrollFactor(0).setDepth(52).setAlpha(0);
        }

        toast(msg) {
            this.toastText.setText(msg).setAlpha(1);
            this.tweens.killTweensOf(this.toastText);
            this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1200, duration: 800 });
        }

        showTitle() {
            this.wake = 0;                              // 0 = tumbado, 1 = de pie
            this.tweens.add({ targets: this.title, alpha: 0.9, duration: 3000, delay: 1200 });
            this.tweens.add({ targets: this.subtitle, alpha: 0.75, duration: 2000, delay: 3200 });
            this.tweens.add({ targets: this.credits, alpha: 0.6, duration: 2000, delay: 3600 });
            this.cameras.main.setFollowOffset(-260, CAM_OY);
        }

        anyInput() {
            SFX.init();
            // si se entró sin pasar por la habitación (p. ej. con ?x=), la música arranca con la primera tecla
            if (!SFX.musicPlaying() && ['play', 'waking', 'dead', 'cocoon', 'grabbed'].includes(this.state))
                SFX.playMusic({ volume: MUSIC.forest.vol, fade: 2, restart: true });
            if (this.state === 'title' && this.t > 0.6) {
                // el soundtrack es "la realidad": suena en la habitación y se apaga al adentrarse en el bosque
                SFX.playMusic({ volume: MUSIC.room.vol, fade: 1.5, restart: true });
                this.startRoomIntro();
            } else if (this.state === 'intro' && this.monoIdx < MONOLOGUE.length && this.t - this.monoShownAt > 0.7) {
                this.nextMono();                                    // adelantar el monólogo
            } else if (this.state === 'credits' && this.creditsReady) {
                this.state = 'leaving';
                SFX.stopMusic(1.2);
                SFX.resetAmbience();
                this.cameras.main.fadeOut(1200, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ skipTitle: false }));
            }
        }

        beginPlay(instant) {
            this.state = 'waking';
            this.tweens.killTweensOf([this.title, this.subtitle, this.credits]);
            this.tweens.add({ targets: [this.title, this.subtitle, this.credits], alpha: 0, duration: instant ? 1 : 1400 });
            this.tweens.add({
                targets: this, wake: 1, duration: instant ? 1 : 1700, delay: instant ? 0 : 500, ease: 'Sine.easeInOut',
                onComplete: () => { this.state = 'play'; this.touchUI.forEach(o => o.setVisible(true)); }
            });
            this.tweens.add({ targets: this.cameras.main.followOffset, x: 0, y: CAM_OY, duration: 3000, ease: 'Sine.easeInOut' });
            if (instant) this.wake = 1;
        }

        /* =================================================================
         * 2b. LA HABITACIÓN
         *   El juego empieza de noche en el cuarto del niño, con el soundtrack.
         *   Al pulsar una tecla se tumba y "se hunde": las paredes se estiran
         *   como troncos, todo se oscurece, la niebla sube y aparece tumbado
         *   en el bosque. El bastón del abuelo brilla en la esquina, pero el
         *   niño no se lo lleva.
         * ================================================================= */
        createRoom() {
            const A = ART, R = A.ROOM, B = A.BED, C = A.CANE;
            const room = this.room = this.add.container(VIEW_W * 0.42, VIEW_H * 0.7)
                .setScrollFactor(0).setDepth(25).setScale(ROOM_ZOOM);
            const bg = this.add.image(0, R.floor, 'roomBg').setScale(0.5)
                .setOrigin(R.ox / R.w, (R.oy + R.floor) / R.h);              // origen en el suelo: al estirarse crece hacia arriba
            const winGlow = this.add.image(-200, -160, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(1.7).setAlpha(0.22);
            const bed = this.add.image(0, 0, 'roomBed').setScale(0.5).setOrigin(B.ox / B.w, B.oy / B.h);
            const kid = this.add.graphics();
            // el palo del abuelo apoyado en la esquina: versión apagada debajo y encendida encima
            const caneOff = this.add.image(178, R.floor, 'caneDark').setScale(0.5).setOrigin(C.ox / C.w, C.oy / C.h).setRotation(-0.12);
            const cane = this.add.image(178, R.floor, 'cane').setScale(0.5).setOrigin(C.ox / C.w, C.oy / C.h).setRotation(-0.12);
            const caneGlow = this.add.image(173, -18, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0);
            const fog = this.add.image(0, 160, 'fog2').setScale(0.5).setAlpha(0);
            const dark = this.add.rectangle(-3000, -2000, 6000, 4000, 0x000000).setOrigin(0).setAlpha(0);
            room.add([bg, winGlow, bed, kid, caneOff, cane, caneGlow, fog, dark]);
            this.roomParts = { bg, winGlow, bed, kid, cane, caneGlow, fog, dark };
            this.roomPose = 0;                  // 0 = sentado, 1 = tumbado
            this.roomCaneGlow = 1;              // 1 = su brillo débil normal, 0 = apagado
            this.caneFlick = 1; this.caneDying = false;
            this.roomActive = true;
        }

        startRoomIntro() {
            this.state = 'intro';
            this.tweens.killTweensOf([this.title, this.subtitle, this.credits]);
            this.tweens.add({ targets: [this.title, this.subtitle, this.credits], alpha: 0, duration: 1400 });

            // el reloj marca el tiempo mientras piensa
            this.clockN = 0;
            this.clockEv = this.time.addEvent({ delay: 1000, loop: true, callback: () => SFX.clock(this.clockN++ % 2 === 1) });

            this.monoText = this.add.text(VIEW_W / 2, VIEW_H * 0.27, '', {
                fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '32px', color: '#d2d2d2', align: 'center'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(30).setAlpha(0);
            this.monoIdx = -1;
            this.time.delayedCall(1300, () => this.nextMono());
        }

        /** Muestra la siguiente línea del monólogo; al terminar, el niño se tumba y se hunde. */
        nextMono() {
            if (this.monoTimer) this.monoTimer.remove();
            this.monoIdx++;
            const t = this.monoText;
            this.tweens.killTweensOf(t);
            if (this.monoIdx >= MONOLOGUE.length) {
                this.tweens.add({ targets: t, alpha: 0, duration: 600 });
                this.startSink();
                return;
            }
            const show = () => {
                t.setText(MONOLOGUE[this.monoIdx]);
                this.monoShownAt = this.t;
                this.tweens.add({ targets: t, alpha: 0.9, duration: 900 });
            };
            if (t.alpha > 0.05) this.tweens.add({ targets: t, alpha: 0, duration: 450, onComplete: show });
            else show();
            const len = MONOLOGUE[this.monoIdx].length;
            this.monoTimer = this.time.delayedCall(2600 + len * 45, () => this.nextMono());
        }

        startSink() {
            const P = this.roomParts, room = this.room, tw = (cfg) => this.tweens.add(cfg);
            this.monoIdx = MONOLOGUE.length;

            // el reloj se va quedando sin cuerda
            if (this.clockEv) this.clockEv.remove();
            [0.4, 1.5, 2.8, 4.4].forEach((s, i) => this.time.delayedCall(s * 1000, () => SFX.clock(i % 2 === 1)));

            // se tumba en la cama, y piensa una última cosa
            tw({ targets: this, roomPose: 1, duration: 1900, delay: 300, ease: 'Sine.easeInOut' });
            this.time.delayedCall(900, () => {
                const t = this.monoText;
                t.setText(MONO_SINK);
                tw({ targets: t, alpha: 0.75, duration: 1200, onComplete: () => tw({ targets: t, alpha: 0, duration: 1600, delay: 1500 }) });
            });

            // mientras se tumba, la luz del palo empieza a fallar… y se apaga. Se queda en la habitación.
            this.time.delayedCall(1300, () => {
                this.caneDying = true;
                tw({ targets: this, roomCaneGlow: 0, duration: 2600, ease: 'Cubic.easeIn' });
            });

            // se hunde
            this.time.delayedCall(3200, () => {
                const cam = this.cameras.main, b = this.player.body;
                // posición en pantalla del niño tumbado en el bosque, para que la habitación "caiga" justo ahí
                const tx = b.center.x - cam.scrollX - 33, ty = b.bottom - cam.scrollY - 10;
                tw({ targets: room, scale: 1, x: tx, y: ty, duration: 4600, ease: 'Sine.easeInOut' });
                tw({ targets: P.bg, scaleY: 0.85, duration: 4600, ease: 'Sine.easeIn' });   // las paredes se estiran como troncos
                tw({ targets: [P.bed, P.kid], y: 18, duration: 3600, ease: 'Sine.easeIn' });
                tw({ targets: P.dark, alpha: 0.6, duration: 3800 });
                tw({ targets: P.fog, alpha: 0.65, y: -40, duration: 4200, ease: 'Sine.easeOut' });
                tw({ targets: P.winGlow, alpha: 0.03, duration: 3000 });
            });
            this.time.delayedCall(5500, () => {
                tw({ targets: room, alpha: 0, duration: 2600, ease: 'Sine.easeIn', onComplete: () => {
                    room.destroy(); this.room = null; this.roomActive = false;
                    if (this.monoText) { this.monoText.destroy(); this.monoText = null; }
                    this.beginPlay(false);
                } });
            });
        }

        updateRoom(dt) {
            const P = this.roomParts;
            // parpadeo: casi siempre encendido y débil, con caídas cortas al azar (más seguidas cuando se está apagando)
            const dipChance = this.caneDying ? 0.16 : 0.025;
            const target = Math.random() < dipChance ? Math.random() * 0.25 : 0.8 + 0.2 * Math.sin(this.t * 2.3);
            this.caneFlick = lerp(this.caneFlick, target, target < this.caneFlick ? 0.6 : 0.12);
            const k = this.roomCaneGlow * this.caneFlick;
            P.caneGlow.setAlpha(0.13 * k);
            P.cane.setAlpha(clamp(0.25 + 0.6 * k, 0, 1) * (this.roomCaneGlow > 0.02 ? 1 : 0));
            this.drawRoomKid(P.kid, this.roomPose);
        }

        /** El niño en la habitación: sentado al borde de la cama, cabizbajo → tumbado y encogido. */
        drawRoomKid(g, k) {
            g.clear();
            const e = k, br = Math.sin(this.t * 1.7) * 0.7 * (1 - k * 0.6);          // respiración
            const J = {};
            Object.keys(ROOM_SIT).forEach(n => {
                const a = ROOM_SIT[n], b = ROOM_LIE[n];
                J[n] = [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
            });
            ['neck', 'head', 'elbow', 'hand', 'elbow2', 'hand2'].forEach(n => { J[n][1] += br; });
            const th = lerp(-0.45, 1.5, e);                    // giro de la cabeza
            const cs = Math.cos(th), sn = Math.sin(th);
            const H = (x, y) => [J.head[0] + (-x) * cs - y * sn, J.head[1] + (-x) * sn + y * cs];   // mira a la izquierda
            const C = 0x020202;
            const limb = (a, b, w) => { g.lineStyle(w, C, 1); g.lineBetween(a[0], a[1], b[0], b[1]); g.fillStyle(C, 1); g.fillCircle(b[0], b[1], w / 2); };

            // pierna y brazo de atrás
            limb(J.hip, J.knee2, 5.5); limb(J.knee2, J.foot2, 5);
            limb(J.neck, J.elbow2, 4); limb(J.elbow2, J.hand2, 3.6);
            // bufanda
            const s1 = [J.neck[0] + 7, J.neck[1] + 5 + Math.sin(this.t * 1.3)], s2 = [s1[0] + 6, s1[1] + 8 - e * 6];
            limb(J.neck, s1, 4.5); limb(s1, s2, 3);
            // torso
            const dx = J.neck[0] - J.hip[0], dy = J.neck[1] - J.hip[1], d = Math.hypot(dx, dy) || 1;
            const nx = -dy / d, ny = dx / d;
            g.fillStyle(C, 1);
            g.fillPoints([
                { x: J.hip[0] + nx * 7, y: J.hip[1] + ny * 7 }, { x: J.neck[0] + nx * 4.5, y: J.neck[1] + ny * 4.5 },
                { x: J.neck[0] - nx * 4.5, y: J.neck[1] - ny * 4.5 }, { x: J.hip[0] - nx * 6.5, y: J.hip[1] - ny * 6.5 }
            ], true);
            // cabeza con capucha
            g.fillCircle(J.head[0], J.head[1], 10.5);
            const h1 = H(-5, -9), h2 = H(-19, 4), h3 = H(-3, 9), nose = H(10.5, 1);
            g.fillTriangle(h1[0], h1[1], h2[0], h2[1], h3[0], h3[1]);
            g.fillCircle(nose[0], nose[1], 2);
            // pierna y brazo de delante
            limb(J.hip, J.knee, 5.5); limb(J.knee, J.foot, 5);
            limb(J.neck, J.elbow, 4); limb(J.elbow, J.hand, 3.6);
        }

        /* =================================================================
         * 2c. LA HISTORIA: el palo del abuelo y los recuerdos
         * ================================================================= */
        createStory() {
            const L = LEVEL, St = L.stick, C = ART.CANE;
            const serif = '"Cormorant Garamond", Georgia, serif';
            this.hasStick = START_X !== null && START_X > St.x;
            this.stickGlow = this.add.image(0, 0, 'glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(12.2).setScale(0.35).setAlpha(0).setVisible(false);

            // el palo clavado en el suelo, brillando
            this.stickGround = this.add.image(St.x, St.y + 8, 'cane').setOrigin(C.ox / C.w, C.oy / C.h)
                .setScale(0.42).setRotation(0.16).setDepth(11).setVisible(!this.hasStick);
            this.stickGroundGlow = this.add.image(St.x + 5, St.y - 40, 'glow').setBlendMode(Phaser.BlendModes.ADD)
                .setDepth(11.5).setScale(0.9).setAlpha(0).setVisible(!this.hasStick);

            // recuerdos
            this.memories = L.memories.map(m => {
                const o = { ...m, seen: false };
                if (m.bush) {
                    const big = m.bush === 'big';
                    o.bushImg = this.add.image(m.x, m.y + 6, big ? 'brambleBig' : 'bramble').setOrigin(0.5, 1).setDepth(9.5);
                    o.bushGlow = this.add.image(m.x, m.y - (big ? 70 : 32), 'glow').setBlendMode(Phaser.BlendModes.ADD)
                        .setDepth(9.6).setScale(big ? 2.2 : 1.1).setAlpha(0);
                }
                o.txt = this.add.text(m.x, m.y - 190, m.text, {
                    fontFamily: serif, fontStyle: 'italic', fontSize: '27px', color: '#101010', align: 'center', lineSpacing: 6
                }).setOrigin(0.5).setDepth(13.6).setAlpha(0);
                // parche de niebla clara detrás del texto: se lee también sobre los troncos
                o.halo = this.add.image(m.x, m.y - 190, 'glow').setScale(o.txt.width / 70, 1.5).setDepth(13.5).setAlpha(0);
                o.vis = 0;
                if (m.blur) {
                    // en la niebla: humo claro por encima de la oscuridad, en lugar de texto oscuro
                    o.txt.setVisible(false); o.halo.setVisible(false);
                    o.smoke = this.makeSmoke(m.x, m.y - 190, m.text, 27);
                }
                return o;
            });
            this.musicSwell = 0;
        }

        /**
         * La música no se apaga nunca en el bosque: cambia de "lugar".
         * Lejana y apagada en el bosque, se abre junto a los recuerdos,
         * casi desaparece cerca de la araña y vuelve completa en el final.
         */
        updateMusic(dt) {
            if (!['waking', 'play', 'grabbed', 'cocoon', 'dead'].includes(this.state)) return;
            if (this.state === 'dead') return;                      // al morir ya se oye "tapada" (SFX.muffle)
            const M = MUSIC, px = this.player.body.center.x, S = LEVEL.spider;
            const mixT = (A, B, k) => ({ vol: lerp(A.vol, B.vol, k), cutoff: A.cutoff * Math.pow(B.cutoff / A.cutoff, k) });

            // antes de encontrar el palo: la habitación se va quedando lejos a medida que se adentra
            let cur = this.hasStick ? M.forest : mixT(M.room, M.forest, clamp((px - 520) / 500, 0, 0.8));

            // junto a un recuerdo ya visto, la música se abre (o se cierra, si el recuerdo es oscuro)
            let best = null, bestK = 0;
            this.memories.forEach(m => {
                if (!m.seen) return;
                const k = clamp(1 - (Math.abs(px - m.x) - 120) / 220, 0, 1);
                if (k > bestK) { bestK = k; best = m; }
            });
            if (best) cur = mixT(cur, best.dark ? M.dread : best.music ? M.big : M.memory, bestK * (best.dark ? 0.6 : 1));

            // al recoger el palo, un momento en que suena más cerca
            this.musicSwell = Math.max(0, this.musicSwell - dt / 9);
            if (this.musicSwell > 0) cur = mixT(cur, M.big, this.musicSwell);

            // la araña: los pensamientos más oscuros la tapan casi del todo
            const sp = this.sp, spiderNear = sp && sp.mode !== 'gone' && px > S.huntFrom - 250 && px < S.cocoonTrigger + 300;
            this.dread = lerp(this.dread || 0, spiderNear || this.state === 'cocoon' || this.state === 'grabbed' ? 1 : 0, Math.min(1, dt * 1.5));
            if (this.dread > 0.01) cur = mixT(cur, M.dread, this.dread);

            // la niebla y el ciclo: cada vuelta suena más lejos; en la luz, vuelve
            if (this.fogK > 0.01) cur = mixT(cur, M.fog, this.fogK * 0.85);
            if (this.loopK > 0.01) {
                const L = this.loopBroken ? M.memory : { vol: Math.max(0.3, M.loop.vol - 0.03 * this.loopN), cutoff: Math.max(700, M.loop.cutoff - 60 * this.loopN) };
                cur = mixT(cur, L, this.loopK);
            }
            if (this.loopProgress > 0.01) cur = mixT(cur, M.big, this.loopProgress);

            SFX.setMusic(cur.vol, cur.cutoff);
        }

        updateStory(dt) {
            const b = this.player.body, px = b.center.x, St = LEVEL.stick;
            const alive = this.state === 'play' || this.state === 'ending';

            // el palo esperando en el suelo
            if (!this.hasStick) {
                const pulse = 0.85 + 0.15 * Math.sin(this.t * 2.2) - (Math.random() < 0.02 ? 0.3 : 0);
                this.stickGroundGlow.setAlpha(0.32 * pulse);
                if (this.state === 'play' && this.onGround && Math.abs(px - St.x) < 26) this.pickStick();
            }

            // recuerdos: solo se muestra uno a la vez (el más cercano), para que los textos nunca se monten
            let active = null, activeD = 270;
            this.memories.forEach(m => {
                const d = Math.abs(px - m.x);
                if (m.seen && d < activeD) { active = m; activeD = d; }
            });
            const othersVisible = this.memories.some(m => m !== active && m.vis > 0.12);
            this.memories.forEach(m => {
                const d = Math.abs(px - m.x);
                if (!m.seen && alive && this.hasStick && d < 150) {
                    m.seen = true;
                    if (m.bushGlow) {
                        this.tweens.add({ targets: m.bushGlow, alpha: 0.45, duration: 900, yoyo: true, hold: 600,
                            onComplete: () => this.tweens.add({ targets: m.bushGlow, alpha: 0.12, duration: 1200 }) });
                    }
                    if (m.dark) SFX.creak(); else if (!m.stick) SFX.checkpoint();
                }
                const show = m === active && !othersVisible && this.state !== 'credits';
                m.vis = lerp(m.vis, show ? 0.85 : 0, show ? 0.03 : 0.08);
                m.halo.setAlpha(m.vis * 0.6);
                // en la niebla: humo que se deshace lejos y se enfoca al acercarse
                if (m.smoke) this.drawSmoke(m.smoke, m.vis, clamp((d - 40) / 210, 0, 1));
                else m.txt.setAlpha(m.vis);
            });
        }

        pickStick() {
            this.hasStick = true;
            const St = LEVEL.stick;
            this.stickGround.setVisible(false);
            this.tweens.add({ targets: this.stickGroundGlow, alpha: 0.9, scale: 2.4, duration: 450, yoyo: true,
                onComplete: () => this.stickGroundGlow.setVisible(false) });
            this.dustFx.explode(6, St.x, St.y);
            this.cameras.main.flash(500, 40, 40, 40);
            SFX.checkpoint();
            this.musicSwell = 1;
        }

        /* =================================================================
         * 2d. LA NIEBLA Y EL CICLO
         *   Niebla: todo se oscurece; solo la luz del palo deja ver las
         *   trampas, los fosos y las raíces. Los recuerdos llegan como humo.
         *   Ciclo: el camino se repite detrás de una muralla de espinas, y
         *   una sombra con su forma lo sigue cada vez más cerca. Cuando ya
         *   lo ha pensado todo (LOOP_TEXTS), el palo parpadea en la luz:
         *   si se queda quieto, la sombra lo alcanza y se vuelve su sombra
         *   en el suelo. No desaparece, pero ya no lo define. La muralla cae.
         * ================================================================= */

        /** Texto de humo: claro, con dos copias que se deshacen alrededor y una sombra suave detrás. */
        makeSmoke(x, y, text, size = 28) {
            const style = {
                fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic',
                fontSize: size + 'px', color: '#ececec', align: 'center', lineSpacing: 6
            };
            const o = { x, y, vis: 0 };
            o.blob = this.add.image(x, y, 'shadeBlob').setDepth(14.65).setAlpha(0);
            o.ghosts = [0, 1].map(() => this.add.text(x, y, text, style).setOrigin(0.5).setDepth(14.68).setAlpha(0));
            o.main = this.add.text(x, y, text, style).setOrigin(0.5).setDepth(14.7).setAlpha(0);
            this.setSmokeText(o, text);
            return o;
        }
        setSmokeText(o, text, x = o.x, y = o.y) {
            o.x = x; o.y = y;
            [o.main, ...o.ghosts].forEach(t => t.setText(text));
            o.blob.setScale(Math.max(1, o.main.width / 85 + 0.8), Math.max(1, o.main.height / 55 + 0.9));
        }
        /** blurK: 0 = nítido, 1 = deshecho en humo. */
        drawSmoke(o, vis, blurK = 0.2) {
            const t = this.t;
            o.main.setPosition(o.x, o.y + Math.sin(t * 0.9 + o.x) * 1.5).setAlpha(vis * (1 - 0.5 * blurK));
            o.ghosts.forEach((g, i) => {
                const s = i ? 1 : -1;
                g.setPosition(o.x + s * (3 + 16 * blurK) + Math.sin(t * 1.1 + i * 2) * 3,
                              o.y - 4 - 7 * Math.abs(Math.sin(t * 0.6 + i * 1.7)) + s * 2 * blurK)
                 .setAlpha(vis * 0.32 * (0.45 + blurK));
            });
            o.blob.setPosition(o.x, o.y).setAlpha(vis * 0.6);
        }

        createNight() {
            const LP = LEVEL.loop;
            this.darkImg = this.add.image(0, 0, 'darkness').setScrollFactor(0).setDepth(14.5).setAlpha(0);
            this.darkA = 0; this.fogK = 0; this.loopK = 0;

            // raíces
            this.rootG = this.add.graphics().setDepth(11.2);
            this.roots = LEVEL.roots.map(r => ({ ...r, phase: 'idle', t: 0, h: 0 }));

            // el ciclo
            this.loopN = 0; this.loopBroken = false; this.stillT = 0; this.loopProgress = 0; this.loopFade = 1;
            this.loopRay = this.add.image(LP.spot, -80, 'ray').setOrigin(0.5, 0).setScale(0.5, 0.8)
                .setBlendMode(Phaser.BlendModes.ADD).setDepth(14.6).setAlpha(0);
            this.loopWalls = [
                this.add.image(LP.wallX, 568, 'brambleBig').setOrigin(0.5, 1).setScale(1.1, 3.4).setDepth(11),
                this.add.image(LP.wallX + 70, 568, 'brambleBig').setOrigin(0.5, 1).setScale(0.9, 2.7).setDepth(11).setFlipX(true)
            ];
            const wz = this.add.zone(LP.wallX + 20, 260, 70, 600);
            this.physics.add.existing(wz, true);
            this.loopWallCol = this.physics.add.collider(this.player, wz);
            this.loopSmoke = this.makeSmoke(LP.a + 330, 360, '');

            // la sombra: tiene su forma, lo sigue y deja un rastro de humo
            this.shade = { x: LP.a - 500, active: false, merged: false, a: 0 };
            this.shadeImg = this.add.image(0, 0, 'shadowKid').setOrigin(0.5, 1).setDepth(14.8).setAlpha(0);
            this.shadeFx = this.add.particles(0, 0, 'shadeBlob', {
                emitting: false, lifespan: 1400, speedY: { min: -40, max: -15 }, speedX: { min: -12, max: 12 },
                scale: { start: 0.25, end: 0.7 }, alpha: { start: 0.35, end: 0 }, frequency: 90
            }).setDepth(14.75);
            this.groundShade = this.add.image(0, 0, 'shadeBlob').setDepth(11.9).setAlpha(0);   // su sombra en el suelo, al final
        }

        resetRoots() { this.roots.forEach(r => { r.phase = 'idle'; r.t = 0; r.h = 0; }); }

        updateNight(dt) {
            const b = this.player.body, px = b.center.x, F = LEVEL.fog, LP = LEVEL.loop;
            const alive = this.state === 'play';
            const ramp = (x, a, c) => clamp((x - a) / (c - a), 0, 1);

            /* ---- oscuridad: solo se ve lo que alumbra el palo ---- */
            this.fogK = ramp(px, F.from, F.from + 260) * (1 - ramp(px, F.to - 220, F.to));
            this.loopK = ramp(px, LP.a - 160, LP.a) * (1 - ramp(px, LP.wallX + 40, LP.wallX + 260));
            const loopLevel = Math.min(0.88, 0.55 + 0.07 * this.loopN) * this.loopFade;
            const target = Math.max(this.fogK * 0.95, this.loopK * loopLevel);
            this.darkA = lerp(this.darkA, target, Math.min(1, dt * 3));
            const cam = this.cameras.main;
            const flick = 1 + Math.sin(this.t * 2.3) * 0.04 + (Math.random() < 0.03 ? -0.12 : 0);
            const radius = lerp(230, 320, this.loopK) * flick * (1 + this.loopProgress * 0.6);
            this.darkImg.setPosition(b.center.x - cam.scrollX, b.center.y - 12 - cam.scrollY)
                .setScale(radius / 150).setAlpha(this.darkA).setVisible(this.darkA > 0.01);

            /* ---- raíces que brotan del suelo ---- */
            const g = this.rootG; g.clear();
            this.roots.forEach(r => {
                r.t += dt;
                if (r.phase === 'idle') {
                    if (alive && px > r.x - 160 && px < r.x + r.w / 2 + 10) { r.phase = 'warn'; r.t = 0; SFX.rootWarn(); }
                } else if (r.phase === 'warn') {
                    if (Math.random() < 0.3) this.dustFx.explode(1, r.x + (Math.random() - 0.5) * r.w, r.y);
                    if (r.t > 0.55) {
                        r.phase = 'up'; r.t = 0; SFX.rootBurst();
                        this.cameras.main.shake(160, 0.006);
                        this.dustFx.explode(14, r.x, r.y);
                    }
                } else if (r.phase === 'up') {
                    r.h = Math.min(100, r.h + dt * 1500);
                    if (r.t > 1.1) { r.phase = 'down'; r.t = 0; }
                } else if (r.phase === 'down') {
                    r.h = Math.max(0, r.h - dt * 190);
                    if (r.h <= 0) { r.phase = 'rest'; r.t = 0; }
                } else if (r.phase === 'rest' && r.t > 0.9) r.phase = 'idle';

                if (alive && r.h > 25 && Math.abs(px - r.x) < r.w / 2 + 6 && b.bottom > r.y - r.h + 8) this.kill('roots');
                this.drawRoot(g, r);
            });

            /* ---- el ciclo ---- */
            const gateOpen = this.loopN >= LOOP_TEXTS.length - 1;          // ya lo pensó todo
            const nearLight = Math.abs(px - LP.spot) < 60;
            this.stickBlink = !this.loopBroken && gateOpen && nearLight && this.loopK > 0.5;
            if (!this.loopBroken && !this.merging) {
                if (alive && px > LP.b && !this.blinking) this.loopTeleport();
                const still = alive && gateOpen && this.onGround && nearLight && Math.abs(b.velocity.x) < 15;
                this.stillT = still ? this.stillT + dt : Math.max(0, this.stillT - dt * 1.5);
                this.loopProgress = clamp(this.stillT / LP.needed, 0, 1);
                if (still && this.stillT > 0.15 && !this.lightHum) { this.lightHum = true; SFX.checkpoint(); }
                if (!still && this.stillT <= 0) this.lightHum = false;
                if (this.loopProgress >= 1) this.mergeShade();
            } else if (this.loopBroken) this.loopProgress = Math.max(0, this.loopProgress - dt * 0.4);
            this.stickBoost = Math.max(this.fogK * 0.5, this.loopProgress, this.stickBlink ? 0.35 : 0);

            const base = gateOpen ? 0.55 : Math.max(0.16, 0.42 - 0.06 * this.loopN);
            const rayA = this.loopBroken ? 0 : (base + this.loopProgress * 0.4) * (0.85 + 0.15 * Math.sin(this.t * 1.7));
            this.loopRay.setAlpha(lerp(this.loopRay.alpha, rayA * clamp(this.loopK * 1.5, 0, 1), 0.08));

            /* ---- la sombra ---- */
            this.updateShade(dt, px, gateOpen);

            /* ---- lo que piensa en el ciclo ---- */
            const o = this.loopSmoke;
            const showLoop = this.loopBroken ? Math.abs(px - o.x) < 420 : this.loopN > 0 && px > LP.a - 50 && px < LP.b + 50;
            o.vis = lerp(o.vis, showLoop && o.main.text ? 0.9 : 0, 0.04);
            this.drawSmoke(o, o.vis, this.loopBroken ? 0.1 : 0.3);
        }

        updateShade(dt, px, gateOpen) {
            const S = this.shade, LP = LEVEL.loop, img = this.shadeImg;
            if (S.merged) {
                // ya es su sombra: alargada en el suelo, a sus pies, desvaneciéndose poco a poco
                this.groundShade.setPosition(px - 26, 562).setAlpha(Math.max(0, this.groundShade.alpha - dt * 0.05));
                img.setAlpha(0); this.shadeFx.stop();
                return;
            }
            S.active = this.loopN > 0 && this.loopK > 0.3 && !this.loopBroken;
            // cada vuelta más cerca; cuando se queda quieto en la luz, llega hasta él
            const D = Math.max(120, 420 - 75 * (this.loopN - 1)) * (1 - this.loopProgress);
            const tx = px - D - 8;
            if (this.merging) S.x = lerp(S.x, px - 4, Math.min(1, dt * 3));
            else S.x = lerp(S.x, tx, Math.min(1, dt * (S.x < tx - 400 ? 6 : 1.6)));
            S.a = lerp(S.a, S.active || this.merging ? 0.95 : 0, Math.min(1, dt * 2));
            const bob = Math.sin(this.t * 2.1) * 2;
            img.setPosition(S.x, 562 + bob).setAlpha(S.a).setFlipX(false).setScale(1, 1 + Math.sin(this.t * 1.3) * 0.02);
            this.shadeFx.setPosition(S.x, 500);
            if (S.a > 0.3 && !this.shadeFx.emitting) this.shadeFx.start();
            if (S.a <= 0.3 && this.shadeFx.emitting) this.shadeFx.stop();
        }

        /** La sombra lo alcanza… y se vuelve su sombra en el suelo. Entonces el ciclo se rompe. */
        mergeShade() {
            if (this.merging) return;
            this.merging = true;
            SFX.blink();
            this.time.delayedCall(1300, () => {
                const S = this.shade;
                S.merged = true;
                const px = this.player.body.center.x;
                this.groundShade.setPosition(px - 26, 562).setScale(2.6, 0.32).setAlpha(0.7);
                this.shadeFx.explode(18, px, 520);
                this.merging = false;
                this.breakLoop();
            });
        }

        drawRoot(g, r) {
            const cam = this.cameras.main;
            if (r.x < cam.scrollX - 200 || r.x > cam.scrollX + VIEW_W + 200) return;
            const C = 0x030303, n = 5;
            if (r.phase === 'warn') {
                // la tierra se agrieta y asoman las puntas
                for (let i = 0; i < n; i++) {
                    const x = r.x - r.w / 2 + (i + 0.5) * r.w / n, tip = 5 + Math.abs(Math.sin(this.t * 38 + i)) * 5;
                    g.fillStyle(C, 1); g.fillTriangle(x - 3, r.y + 1, x + 3, r.y + 1, x + Math.sin(i) * 2, r.y - tip);
                }
            }
            if (r.h <= 0) return;
            for (let i = 0; i < n; i++) {
                const x0 = r.x - r.w / 2 + (i + 0.5) * r.w / n;
                const hh = r.h * (0.6 + 0.4 * Math.abs(Math.sin(i * 2.7 + r.x)));
                const lean = Math.sin(i * 1.9 + r.x) * 16;
                const x1 = x0 + lean, y1 = r.y - hh;
                this.taper(g, x0, r.y + 4, x1, y1, 9, 1.2, C);
                for (let k = 1; k < 4; k++) {                      // espinas
                    const t = k / 4, x = lerp(x0, x1, t), y = lerp(r.y, y1, t), s = k % 2 ? 1 : -1;
                    g.fillStyle(C, 1); g.fillTriangle(x - 2, y, x + 2, y, x + s * 8, y - 5);
                }
            }
        }

        /** El camino se repite: un parpadeo y vuelves al principio del tramo. */
        loopTeleport() {
            const LP = LEVEL.loop, D = LP.b - LP.a, cam = this.cameras.main;
            this.blinking = true;
            SFX.blink();
            cam.fadeOut(170, 0, 0, 0);
            cam.once('camerafadeoutcomplete', () => {
                const b = this.player.body, vx = b.velocity.x, vy = b.velocity.y;
                b.reset(b.center.x - D, b.center.y);
                b.setVelocity(vx, vy);
                cam.scrollX -= D;
                this.scarf.forEach(s => { s.x -= D; s.px -= D; });
                this.shade.x -= D;
                this.loopN++;
                this.setSmokeText(this.loopSmoke, LOOP_TEXTS[Math.min(this.loopN, LOOP_TEXTS.length - 1)], LP.a + 330, 360);
                this.loopSmoke.vis = 0;
                cam.fadeIn(360, 0, 0, 0);
                this.blinking = false;
            });
        }

        /** El ciclo se rompe: la muralla cae. La oscuridad se aclara, pero no del todo. */
        breakLoop() {
            const LP = LEVEL.loop;
            this.loopBroken = true;
            this.loopWallCol.active = false;
            this.loopWalls.forEach((w, i) => this.tweens.add({
                targets: w, alpha: 0, scaleY: w.scaleY * 0.25, duration: 1600, delay: i * 200, ease: 'Quad.easeIn'
            }));
            this.shardFx.explode(30, LP.wallX, 470);
            this.dustFx.explode(30, LP.wallX, 560);
            SFX.breakFree();
            this.cameras.main.flash(1000, 200, 200, 200);
            this.cameras.main.shake(500, 0.006);
            this.tweens.add({ targets: this, loopFade: 0.45, duration: 2600, ease: 'Sine.easeInOut' });
            this.musicSwell = 1;
            this.setSmokeText(this.loopSmoke, LOOP_BREAK, this.player.body.center.x + 40, 350);
            this.loopSmoke.vis = 0;
        }

        /* =================================================================
         * 3. PERSONAJE
         * ================================================================= */
        createPlayer() {
            const cp = START_X !== null
                ? { x: START_X, y: this.groundAt(START_X) }
                : LEVEL.checkpoints[0];
            this.checkpoint = LEVEL.checkpoints.reduce((best, c) => (c.x <= cp.x + 1 ? c : best), LEVEL.checkpoints[0]);
            if (START_X !== null) this.checkpoint = { x: cp.x, y: cp.y };

            const p = this.player = this.add.zone(cp.x, cp.y - 30, 24, 60);
            this.physics.add.existing(p);
            p.body.setMaxVelocity(900, 1100);
            p.body.setSize(24, 60);
            this.physics.add.collider(p, this.solids);

            this.pg = this.add.graphics().setDepth(12);         // dibujo del personaje
            this.facing = 1;
            this.phase = 0;
            this.wake = 1;
            this.lastGround = -1; this.lastJumpPress = -1;
            this.wasOnGround = true; this.prevVy = 0;
            this.pushing = false;
            this.scarf = [];
            for (let i = 0; i < 9; i++) this.scarf.push({ x: cp.x, y: cp.y - 48, px: cp.x, py: cp.y - 48 });
        }

        groundAt(x) {
            let best = LEVEL.height;
            LEVEL.solids.forEach(s => { if (!s.invisible && x >= s.x && x <= s.x + s.w && s.y < best) best = s.y; });
            return best;
        }

        updatePlayer(dt) {
            const b = this.player.body, k = this.keys;
            const tch = this.readTouch();
            if (this.state === 'grabbed' || this.state === 'cocoon') {
                this.onGround = b.blocked.down || b.touching.down;
                this.pushing = false; this.pushBlend = 0;
                if (this.state === 'cocoon') this.updateCocoon(dt, tch);
                else b.setVelocityX(0);
                return;
            }
            const canMove = this.state === 'play' || this.state === 'epilogue';
            const left = canMove && (k.left.isDown || k.a.isDown || tch.left);
            const right = canMove && (k.right.isDown || k.d.isDown || tch.right);
            const jumpHeld = canMove && (k.up.isDown || k.w.isDown || k.space.isDown || tch.jump);
            const jumpPressed = jumpHeld && !this.jumpHeldPrev;
            this.jumpHeldPrev = jumpHeld;

            const onGround = b.blocked.down || b.touching.down;
            if (onGround) this.lastGround = this.t;
            if (jumpPressed) this.lastJumpPress = this.t;

            let dir = (right ? 1 : 0) - (left ? 1 : 0);
            if (this.state === 'ending' || this.state === 'outro') dir = this.endWalk || 0;
            if (dir) this.facing = dir;

            // caja: empujar
            const box = this.box;
            const nearBox = box && Math.abs(b.bottom - box.body.bottom) < 6 &&
                Math.abs((b.center.x + dir * 13) - box.x) < 40 + 2 && Math.sign(box.x - b.center.x) === dir;
            const contact = dir > 0 ? b.touching.right || b.blocked.right : b.touching.left || b.blocked.left;
            if (contact && nearBox) this.pushGrace = 0.18; else this.pushGrace = (this.pushGrace || 0) - dt;
            this.pushing = onGround && dir !== 0 && nearBox && (contact || this.pushGrace > 0);
            const maxSpeed = this.pushing ? P.pushSpeed : (this.state === 'ending' || this.state === 'outro' ? 110 : P.speed);

            const target = dir * maxSpeed;
            const acc = onGround ? P.accelGround : P.accelAir;
            const vx = b.velocity.x;
            b.setVelocityX(vx < target ? Math.min(vx + acc * dt, target) : Math.max(vx - acc * dt, target));

            if (box) {
                const boxBlocked = this.pushing && (dir > 0 ? box.body.blocked.right : box.body.blocked.left);
                this.boxBlocked = boxBlocked;
                if (this.pushing && !boxBlocked) {
                    // empuje con ritmo: la caja avanza a tirones, siguiendo cada paso
                    const effort = 0.45 + 0.95 * Math.max(0, Math.sin(this.phase * 2));
                    const v = dir * P.pushSpeed * effort * clamp(this.pushBlend * 1.5, 0, 1);
                    box.body.setVelocityX(v);
                    b.setVelocityX(v);
                    this.boxDust = (this.boxDust || 0) + dt * effort;
                    if (this.boxDust > 0.12) {
                        this.boxDust = 0;
                        this.dustFx.explode(1, box.x - dir * 38, box.body.bottom - 2);
                    }
                } else box.body.setVelocityX(0);
                const moving = Math.abs(box.body.velocity.x) > 5 && box.body.blocked.down;
                SFX.loop('scrape', { freq: 260, q: 1.5, brown: true });
                SFX.setLoop('scrape', moving ? 0.25 + Math.abs(box.body.velocity.x) / P.pushSpeed * 0.6 : 0, 180 + Math.abs(box.body.velocity.x));
                if (this.pushing) {
                    this.effortT = (this.effortT || 0) + dt;
                    if (this.effortT > (boxBlocked ? 1.3 : 1.8)) { this.effortT = 0; SFX.effort(); }
                }
            }
            this.pushBlend = lerp(this.pushBlend || 0, this.pushing ? 1 : 0, Math.min(1, dt * 10));

            // salto con "coyote time" y "jump buffer"
            if (canMove && !this.noJump && this.t - this.lastJumpPress < P.buffer && this.t - this.lastGround < P.coyote && b.velocity.y >= -10) {
                b.setVelocityY(-P.jump);
                this.lastJumpPress = -1; this.lastGround = -1;
                SFX.jump();
                this.dustFx.explode(5, b.center.x, b.bottom);
            }
            if (!jumpHeld && b.velocity.y < -200) b.setVelocityY(b.velocity.y * 0.86);   // salto variable

            // aterrizaje
            if (onGround && !this.wasOnGround && this.prevVy > 300) {
                const f = clamp(this.prevVy / 950, 0.2, 1);
                SFX.land(f);
                this.dustFx.explode(4 + (f * 8 | 0), b.center.x, b.bottom);
                if (this.prevVy > 850) this.cameras.main.shake(140, 0.004);
                this.landSquash = f;
            }
            this.wasOnGround = onGround;
            this.prevVy = b.velocity.y;
            this.onGround = onGround;

            // fase de la animación de caminar + pasos
            const spd = Math.abs(b.velocity.x);
            if (onGround && (spd > 30 || (this.pushing && !this.boxBlocked))) {
                const before = Math.floor(this.phase / Math.PI);
                this.phase += dt * Math.max(spd, this.pushing ? 60 : 0) * (this.pushing ? 0.05 : 0.042);
                if (Math.floor(this.phase / Math.PI) !== before) SFX.step(this.standingOnBox() ? 'wood' : 'grass');
            } else if (onGround) {
                this.phase = Math.round(this.phase / Math.PI) * Math.PI + (this.phase % Math.PI) * 0.8;
            }
            this.landSquash = Math.max(0, (this.landSquash || 0) - dt * 4);
        }

        standingOnBox() {
            const b = this.player.body, box = this.box;
            return box && Math.abs(b.bottom - box.body.top) < 3 && Math.abs(b.center.x - box.x) < 52;
        }

        /** Bufanda: cadena de puntos con integración Verlet. */
        updateScarf(dt, anchorX, anchorY) {
            const s = this.scarf, n = s.length, seg = 5.2;
            const wind = Math.sin(this.t * 1.3) * 0.25 + Math.sin(this.t * 3.7) * 0.1 - 0.05;
            s[0].x = anchorX; s[0].y = anchorY;
            const k = dt * 60;
            for (let i = 1; i < n; i++) {
                const p = s[i];
                const vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9;
                p.px = p.x; p.py = p.y;
                p.x += vx + wind * 0.4 * k; p.y += vy + 0.32 * k;
            }
            for (let it = 0; it < 5; it++) {
                for (let i = 1; i < n; i++) {
                    const a = s[i - 1], b = s[i];
                    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.001;
                    const diff = (d - seg) / d;
                    if (i === 1) { b.x -= dx * diff; b.y -= dy * diff; }
                    else { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
                }
                s[0].x = anchorX; s[0].y = anchorY;
            }
        }

        /** Dibuja al personaje con animación procedural (sin sprites). */
        drawPlayer(dt) {
            const g = this.pg; g.clear();
            if (this.hidePlayer) return;
            const b = this.player.body;
            const f = this.facing;
            const px = b.center.x, py = b.bottom;
            const spd = Math.abs(b.velocity.x);
            const run = this.onGround ? clamp(spd / P.speed, 0, 1) : 0;
            const ph = this.phase;
            const air = !this.onGround && this.state !== 'dead';
            const rising = air && b.velocity.y < 0;

            // rotación global (tumbado al inicio, o desplomado al morir)
            let rot = 0, offY = 0;
            if (this.wake < 1) { const w = 1 - this.wake; rot = f * (Math.PI / 2) * w; offY = -5 * w; }
            if (this.state === 'dead' && this.deathPose) { rot = this.deathPose.rot; offY = this.deathPose.offY; }
            const cr = Math.cos(rot), sr = Math.sin(rot);
            const T = (x, y) => [px + (x * f) * cr - y * sr, py + offY + (x * f) * sr + y * cr];

            const squash = (this.landSquash || 0) * 4;
            const bob = this.onGround ? -Math.abs(Math.sin(ph)) * 2.5 * run + Math.sin(this.t * 2.2) * 0.6 * (1 - run) : 0;
            const pb = this.cocooned ? 0 : (this.pushBlend || 0);          // 0 = normal, 1 = empujando
            const strain = this.boxBlocked && this.pushing;
            const tremble = strain ? Math.sin(this.t * 47) * 0.6 : 0;
            const shift = -9 * pb;                                          // se aparta un poco para apoyar las manos
            const hip = [shift + tremble * 0.3, -28 + bob * (1 - pb) + squash + 4 * pb];

            // inclinación del torso
            let lean = 0.1 * run;
            if (air) lean = rising ? -0.04 : 0.06;
            lean = lerp(lean, 0.5 + (strain ? 0.06 : 0), pb);
            const neck = [hip[0] + Math.sin(lean) * 19, hip[1] - Math.cos(lean) * 19];
            const headDrop = pb * 2;
            const head = [neck[0] + Math.sin(lean) * lerp(10, 6.5, pb) + 1 - pb, neck[1] - Math.cos(lean) * 10 + headDrop];

            const fk = (base, th, bend) => {
                const knee = [base[0] + Math.sin(th) * 14, base[1] + Math.cos(th) * 14];
                return { knee, foot: [knee[0] + Math.sin(th - bend) * 14.5, knee[1] + Math.cos(th - bend) * 14.5] };
            };
            const mix = (A, B, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t)];

            // piernas
            const legs = [0, 1].map(k => {
                let th, bend;
                if (this.cocooned) { th = k ? 0.04 : -0.04; bend = 0.05; }
                else if (air) {
                    if (rising) { th = k ? -0.25 : 0.75; bend = k ? 0.5 : 1.5; }
                    else { th = (k ? -0.15 : 0.3) + Math.sin(this.t * 9 + k * 2) * 0.12; bend = 0.35 + k * 0.2; }
                } else {
                    const a = ph + k * Math.PI;
                    th = Math.sin(a) * 0.72 * run + (k ? -0.04 : 0.04) * (1 - run);
                    bend = (Math.cos(a) > 0 ? Math.cos(a) * 1.15 : 0.12) * run + 0.04;
                }
                const normal = fk(hip, th, bend);
                if (pb < 0.01) return normal;
                // pose de empuje: una pierna estirada atrás clavada en el suelo, la otra adelantada y flexionada
                let u, lift;
                if (strain) { u = k ? 0.05 : 0.85; lift = 0; }
                else { const a = ph * 2 + k * Math.PI; u = (Math.sin(a) + 1) / 2; lift = Math.max(0, Math.cos(a)) * 0.55; }
                const push = fk(hip, -0.62 + 1.08 * u + tremble * 0.01, u * 0.95 + lift);
                return { knee: mix(normal.knee, push.knee, pb), foot: mix(normal.foot, push.foot, pb) };
            });

            // brazos
            const sh = [neck[0] - Math.sin(lean) * 2, neck[1] + 2];
            const ik = (base, tgt, l1, l2) => {                              // IK de dos huesos, codo hacia abajo
                const dx = tgt[0] - base[0], dy = tgt[1] - base[1];
                const d = clamp(Math.hypot(dx, dy), 1, l1 + l2 - 0.01);
                const a = Math.atan2(dy, dx);
                const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
                const ea = a + Math.acos(c);
                const el = [base[0] + Math.cos(ea) * l1, base[1] + Math.sin(ea) * l1];
                return { el, hand: [base[0] + Math.cos(a) * d, base[1] + Math.sin(a) * d] };
            };
            const box = this.box;
            const faceX = box ? (f > 0 ? box.body.left - px : px - box.body.right) : 12;
            const arms = [0, 1].map(k => {
                let a1, a2;
                if (this.cocooned) { a1 = 0.08; a2 = 0.05; }
                else if (air) { a1 = rising ? (k ? -0.6 : 0.9) : (k ? 1.6 : -1.1) + Math.sin(this.t * 8 + k) * 0.2; a2 = 0.5; }
                else { a1 = -Math.sin(ph + k * Math.PI) * 0.75 * run + 0.06 + Math.sin(this.t * 2.2 + k) * 0.03; a2 = 0.35 + 0.4 * run; }
                const el = [sh[0] + Math.sin(a1) * 11, sh[1] + Math.cos(a1) * 11];
                const hand = [el[0] + Math.sin(a1 + a2) * 10, el[1] + Math.cos(a1 + a2) * 10];
                if (pb < 0.01) return { el, hand };
                // manos apoyadas en la cara de la caja (a dos alturas)
                const tgt = [Math.min(faceX, 22) - 0.5, sh[1] + (k ? -1 : 6) + tremble * 0.4];
                const p2 = ik(sh, tgt, 11, 10);
                return { el: mix(el, p2.el, pb), hand: mix(hand, p2.hand, pb) };
            });

            const C = 0x020202;
            const limb = (a, b2, w) => {
                const A = T(a[0], a[1]), B = T(b2[0], b2[1]);
                g.lineStyle(w, C, 1); g.lineBetween(A[0], A[1], B[0], B[1]);
                g.fillStyle(C, 1); g.fillCircle(B[0], B[1], w / 2);
            };

            // bufanda (detrás)
            const nW = T(neck[0], neck[1] + 2);
            this.updateScarf(dt, nW[0], nW[1]);
            for (let i = 1; i < this.scarf.length; i++) {
                const a = this.scarf[i - 1], c = this.scarf[i];
                const w = lerp(5, 1.6, i / this.scarf.length);
                g.lineStyle(w, C, 1); g.lineBetween(a.x, a.y, c.x, c.y);
                g.fillStyle(C, 1); g.fillCircle(c.x, c.y, w / 2);
            }

            // pierna y brazo de atrás
            limb(hip, legs[1].knee, 5.5); limb(legs[1].knee, legs[1].foot, 5);
            limb(sh, arms[1].el, 4); limb(arms[1].el, arms[1].hand, 3.6);

            // torso (abrigo un poco acampanado)
            const torso = [[-6.5, 2], [7, 2], [4.5, -19], [-4.5, -19]].map(([x, y]) => {
                const yy = hip[1] + y, xx = hip[0] + x + Math.sin(lean) * (-y);
                return T(xx, yy);
            });
            g.fillStyle(C, 1);
            g.fillPoints(torso.map(([x, y]) => ({ x, y })), true);

            // cabeza con capucha (cabeza grande, de niño)
            const H = T(head[0], head[1]);
            g.fillCircle(H[0], H[1], 10.5);
            const hood = [T(head[0] - 5, head[1] - 9), T(head[0] - 19, head[1] + 4), T(head[0] - 3, head[1] + 9)];
            g.fillTriangle(hood[0][0], hood[0][1], hood[1][0], hood[1][1], hood[2][0], hood[2][1]);
            const nose = T(head[0] + 10.5, head[1] + 1);
            g.fillCircle(nose[0], nose[1], 2);

            // pierna y brazo de delante
            limb(hip, legs[0].knee, 5.5); limb(legs[0].knee, legs[0].foot, 5);
            limb(sh, arms[0].el, 4); limb(arms[0].el, arms[0].hand, 3.6);

            // el palo del abuelo en la mano: se apoya en el suelo al caminar, cuelga en el aire
            const showStick = this.hasStick && !this.cocooned;
            if (showStick) {
                const hd = arms[0].hand;
                const plant = this.onGround && pb < 0.5 && this.state !== 'dead';
                this.stickPlant = lerp(this.stickPlant || 0, plant ? 1 : 0, Math.min(1, dt * 10));
                const bG = [hd[0] + 9 + Math.sin(ph) * 5 * run, -1], bA = [hd[0] + 5, hd[1] + 30];
                const bot = mix(bA, bG, this.stickPlant);
                const dx = hd[0] - bot[0], dy = hd[1] - bot[1], dd = Math.hypot(dx, dy) || 1;
                const top = [hd[0] + dx / dd * 24, hd[1] + dy / dd * 24];
                const A = T(bot[0], bot[1]), B = T(top[0], top[1]);
                g.lineStyle(4.2, C, 1); g.lineBetween(A[0], A[1], B[0], B[1]);
                g.lineStyle(1.6, 0xe6e6e6, 0.95); g.lineBetween(A[0], A[1], B[0], B[1]);
                const M = T(hd[0], hd[1] + 4);
                const boost = this.stickBoost || 0;
                const blink = this.stickBlink ? (Math.sin(this.t * 7) > 0 ? 1.6 : 0.35) : 1;
                this.stickGlow.setPosition(M[0], M[1]).setScale(0.35 * (1 + 1.6 * boost) * (this.stickBlink ? 1.4 : 1))
                    .setAlpha(0.2 * (1 + 2.2 * boost) * blink * (0.85 + 0.15 * Math.sin(this.t * 2.3)));
            }
            if (this.stickGlow) this.stickGlow.setVisible(showStick);

            this.drawCocoon(g);
        }

        /* =================================================================
         * 4. PELIGROS
         * ================================================================= */
        createHazards() {
            const L = LEVEL;
            this.traps = L.traps.map(t => {
                const img = this.add.image(t.x, t.y + 6, 'trapOpen').setOrigin(0.5, 1).setDepth(11);
                return { ...t, img, shut: false };
            });

            // caja empujable
            const box = this.box = this.physics.add.image(L.box.x, L.box.y - 40, 'crate').setDepth(11);
            box.body.pushable = false;
            box.body.setDragX(0);
            box.body.setMaxVelocity(300, 1100);
            this.physics.add.collider(box, this.solids);
            this.physics.add.collider(this.player, box);

            // péndulos con maza
            this.ropeG = this.add.graphics().setDepth(11);
            this.pends = L.pendulums.map(pd => ({ ...pd, img: this.add.image(pd.x, 0, 'mace').setDepth(11), ang: 0, w: 0 }));

            // agua
            this.waterG = this.add.graphics().setDepth(13);
            this.inWater = false;

            // roca
            const B = L.boulder;
            this.boulder = { state: 'idle', x: B.startX, y: -200, vx: 0, vy: 0, rot: 0 };
            this.boulderImg = this.add.image(B.startX, -300, 'boulder').setDepth(11);
            this.boulderBridge = null;

            // destello metálico ocasional en las trampas abiertas
            this.traps.forEach(t => {
                t.glint = this.add.image(t.x - 14, t.y - 26, 'mote').setBlendMode(Phaser.BlendModes.ADD).setDepth(11.5).setScale(0.9).setAlpha(0);
                t.glintT = Math.random() * 3;
            });

            this.createSpider();
        }

        resetHazards(cp) {
            this.traps.forEach(t => { if (t.keep) return; t.shut = false; t.img.setTexture('trapOpen').setPosition(t.x, t.y + 6).setRotation(0); });
            this.resetSpider();
            if (this.roots) this.resetRoots();
            if (cp.x < LEVEL.box.x + 200) {
                this.box.setPosition(LEVEL.box.x, LEVEL.box.y - 40);
                this.box.body.reset(LEVEL.box.x, LEVEL.box.y - 40);
            }
            const bo = this.boulder;
            if (bo.state !== 'wedged') {
                bo.state = 'idle'; bo.x = LEVEL.boulder.startX; bo.y = -200; bo.vx = 0; bo.vy = 0;
                this.boulderImg.setPosition(bo.x, -300);
            }
            this.inWater = false;
        }

        updateHazards(dt) {
            const b = this.player.body;
            const pl = { x: b.left, y: b.top, w: b.width, h: b.height };
            const alive = this.state === 'play' || this.state === 'ending';

            // trampas para osos
            this.traps.forEach(t => {
                t.glintT -= dt;
                if (t.glintT < 0) { t.glintT = 2 + Math.random() * 3; if (!t.shut) this.tweens.add({ targets: t.glint, alpha: { from: 0, to: 0.9 }, scale: { from: 0.4, to: 1.3 }, duration: 260, yoyo: true }); }
                if (t.shut || !alive) return;
                if (Math.abs(b.center.x - t.x) < 20 && b.bottom >= t.y - 6 && b.bottom <= t.y + 4) {
                    t.shut = true; t.img.setTexture('trapShut');
                    SFX.trapSnap();
                    this.cameras.main.shake(180, 0.008);
                    this.kill('trap');
                }
            });

            // fosos con estacas
            LEVEL.pits.forEach(p => {
                if (!alive) return;
                if (p.boulderPit && this.boulder.state === 'wedged') return;
                if (b.center.x > p.x && b.center.x < p.x + p.w && b.bottom > p.y) this.kill('spikes');
            });
            if (alive && b.top > LEVEL.height) this.kill('spikes');

            // péndulos
            this.ropeG.clear();
            let swingLevel = 0;
            this.pends.forEach(pd => {
                const ang = pd.amp * Math.sin(this.t * pd.speed + pd.phase);
                const w = pd.amp * pd.speed * Math.cos(this.t * pd.speed + pd.phase);
                const mx = pd.x + Math.sin(ang) * pd.len, my = pd.py + Math.cos(ang) * pd.len;
                pd.img.setPosition(mx, my).setRotation(-ang * 1.6 + this.t * 0.3);
                // cuerda: pequeña curva para que se vea más orgánica
                this.ropeG.lineStyle(3, 0x030303, 1);
                const mxm = (pd.x + mx) / 2 - w * 6, mym = (pd.py + my) / 2;
                this.ropeG.beginPath(); this.ropeG.moveTo(pd.x, pd.py);
                for (let i = 1; i <= 12; i++) {
                    const t = i / 12, it = 1 - t;
                    this.ropeG.lineTo(it * it * pd.x + 2 * it * t * mxm + t * t * mx, it * it * pd.py + 2 * it * t * mym + t * t * my);
                }
                this.ropeG.strokePath();

                const dist = Math.abs(mx - b.center.x);
                swingLevel += Math.abs(w) / (pd.amp * pd.speed) * clamp(1 - dist / 700, 0, 1);
                if (alive && this.circleRect(mx, my, 38, pl)) {
                    this.player.body.setVelocity(Math.sign(w || 1) * 500, -300);
                    this.kill('mace');
                }
            });
            SFX.loop('swing', { freq: 700, q: 0.8 });
            SFX.setLoop('swing', swingLevel * 0.22, 500 + swingLevel * 500);

            // agua
            const W = LEVEL.water;
            const inPool = b.center.x > W.x && b.center.x < W.x + W.w && b.bottom > W.y + 4;
            if (inPool && !this.inWater) {
                this.inWater = true;
                SFX.splash(this.prevVy > 300);
                this.splashFx.explode(18, b.center.x, W.y);
                this.ripple = 1;
            }
            if (this.inWater && alive) {
                b.setVelocityY(Math.min(b.velocity.y, 70));
                b.setVelocityX(b.velocity.x * 0.9);
                if (b.top > W.y + 6) this.kill('drown');
            }
            this.drawWater();

            // roca rodante
            this.updateBoulder(dt, pl, alive);

            // la araña
            this.updateSpider(dt, pl);
        }

        drawWater() {
            const W = LEVEL.water, g = this.waterG;
            g.clear();
            const cam = this.cameras.main;
            if (W.x > cam.scrollX + VIEW_W + 50 || W.x + W.w < cam.scrollX - 50) return;
            this.ripple = Math.max(0, (this.ripple || 0) - 0.01);
            const pts = [];
            const px = this.player.body.center.x;
            for (let x = W.x; x <= W.x + W.w; x += 8) {
                const r = this.ripple * Math.sin((x - px) * 0.08 - this.t * 10) * 5 * Math.exp(-Math.abs(x - px) / 120);
                pts.push({ x, y: W.y + Math.sin(x * 0.03 + this.t * 1.6) * 1.6 + Math.sin(x * 0.07 - this.t * 2.3) * 1 + r });
            }
            g.fillStyle(0x0d0d0d, 0.78);
            g.fillPoints([...pts, { x: W.x + W.w, y: W.bottom + 20 }, { x: W.x, y: W.bottom + 20 }], true);
            g.lineStyle(1.5, 0xbdbdbd, 0.45);
            g.strokePoints(pts);
        }

        circleRect(cx, cy, r, R) {
            const nx = clamp(cx, R.x, R.x + R.w), ny = clamp(cy, R.y, R.y + R.h);
            return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
        }

        updateBoulder(dt, pl, alive) {
            const B = LEVEL.boulder, bo = this.boulder, img = this.boulderImg;
            const px = this.player.body.center.x;
            if (bo.state === 'idle' && alive && this.state === 'play' && px > B.trigger && px < B.trigger + 400) {
                bo.state = 'falling'; bo.x = B.startX; bo.y = -220; bo.vy = 0;
            }
            if (bo.state === 'falling') {
                bo.vy += 1800 * dt; bo.y += bo.vy * dt;
                if (bo.y >= B.groundY - B.r) {
                    bo.y = B.groundY - B.r; bo.state = 'rolling'; bo.vx = 60;
                    SFX.thud(); this.cameras.main.shake(380, 0.012);
                    this.dustFx.explode(30, bo.x, B.groundY);
                }
            }
            if (bo.state === 'rolling') {
                bo.vx = Math.min(bo.vx + 160 * dt, 252);
                bo.x += bo.vx * dt;
                bo.rot += bo.vx * dt / B.r;
                if (bo.x >= B.stopPitX) {
                    bo.state = 'dropping'; bo.vy = 0;
                }
            }
            if (bo.state === 'dropping') {
                bo.vy += 1800 * dt; bo.y += bo.vy * dt;
                bo.x = Math.min(bo.x + 60 * dt, B.stopPitX + 6);
                if (bo.y >= 618) {
                    bo.y = 618; bo.state = 'wedged';
                    SFX.crash(); this.cameras.main.shake(500, 0.016);
                    this.dustFx.explode(40, bo.x, 560);
                    // la roca se queda encajada y sirve de puente
                    const z = this.add.zone(6090, 552 + 30, 140, 60);
                    this.physics.add.existing(z, true);
                    this.physics.add.collider(this.player, z);
                    this.boulderBridge = z;
                }
            }
            if (bo.state !== 'idle') img.setPosition(bo.x, bo.y).setRotation(bo.rot);

            // ruido de la roca
            const near = clamp(1 - Math.abs(bo.x - px) / 900, 0, 1);
            SFX.loop('rumble', { freq: 140, q: 0.7, type: 'lowpass', brown: true });
            SFX.setLoop('rumble', bo.state === 'rolling' ? (0.4 + bo.vx / 252) * near * 1.4 : 0);
            if (bo.state === 'rolling') this.cameras.main.shake(60, 0.0015 * near);

            if (alive && (bo.state === 'rolling' || bo.state === 'falling') && this.circleRect(bo.x, bo.y, B.r * 0.93, pl))
                this.kill('boulder');
        }


        /* =================================================================
         * 4b. LA ARAÑA
         *   Fase 1: desde la copa de los árboles apuñala con una pata donde
         *           estás parado. Hay que atraer el golpe hacia la trampa.
         *   Fase 2: herida, más adelante cae sobre ti y te envuelve en
         *           telaraña. Hay que forcejear (saltar) antes de que vuelva.
         * ================================================================= */
        createSpider() {
            const S = LEVEL.spider;
            this.spG = this.add.graphics().setDepth(12.5);
            this.spiderWounded = false;
            this.stabDeaths = 0;
            // pruebas con ?x= más allá de la araña: se da por superada
            this.spiderSkipped = START_X !== null && START_X > S.cocoonTrigger;
            if (this.spiderSkipped) this.spiderWounded = true;
            const bar = this.add.zone(S.barrierX + 15, 280, 30, 560);
            this.physics.add.existing(bar, true);
            this.barrierCollider = this.physics.add.collider(this.player, bar);
            this.legPieces = [];
            const serif = '"Cormorant Garamond", Georgia, serif';
            this.cocoonHint = this.add.text(0, 0, this.isTouch ? 'toca ↑ para liberarte' : 'salta para liberarte', {
                fontFamily: serif, fontStyle: 'italic', fontSize: '26px', color: '#cfcfcf'
            }).setOrigin(0.5).setDepth(13).setAlpha(0);
            const trap = this.traps.find(t => t.spider);
            this.spiderHint = this.add.text(trap.x, 470, 'la trampa…', {
                fontFamily: serif, fontStyle: 'italic', fontSize: '26px', color: '#151515'
            }).setOrigin(0.5).setDepth(9).setAlpha(0);
            this.resetSpider();
        }

        resetSpider() {
            const S = LEVEL.spider, G = S.groundY;
            const legs = [];
            const bases = [[-78, 20], [-70, 26], [-58, 30], [-44, 32], [-30, 32], [-18, 30], [-6, 26], [4, 20]];
            for (let i = 0; i < 8; i++) {
                const tip = i === 0 ? [S.bodyX - 260, 250]
                    : i === 1 ? [S.bodyX - 200, 330]
                    : [S.plantedLegs[i - 2], G + 4];
                const long = i < 2;
                legs.push({ base: bases[i], tip: tip.slice(), home: tip.slice(), l1: long ? 360 : 280, l2: long ? 430 : 330, lost: false });
            }
            if (this.spiderWounded) legs[0].lost = true;
            this.sp = {
                mode: this.spiderSkipped ? 'gone' : this.spiderWounded ? 'away' : 'hunt',
                bx: S.bodyX, by: this.spiderWounded ? -500 : S.bodyY,
                legs, phase: 'rest', pt: 0, tx: 0, aimFrom: null, mt: 0
            };
            this.barrierCollider.active = !this.spiderWounded;
            this.cocoonWrap = 0; this.cocooned = false; this.cocoonHits = 0; this.cocoonShake = 0;
        }

        /** IK de dos segmentos para una pata (rodilla hacia arriba, como un arácnido). */
        legKnee(B, T, l1, l2, up = true) {
            const dx = T[0] - B[0], dy = T[1] - B[1];
            const d = clamp(Math.hypot(dx, dy), 10, l1 + l2 - 0.5);
            const a = Math.atan2(dy, dx);
            const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
            const k1 = a + Math.acos(c), k2 = a - Math.acos(c);
            const K1 = [B[0] + Math.cos(k1) * l1, B[1] + Math.sin(k1) * l1];
            const K2 = [B[0] + Math.cos(k2) * l1, B[1] + Math.sin(k2) * l1];
            return (K1[1] < K2[1]) === up ? K1 : K2;
        }

        updateSpider(dt, pl) {
            const S = LEVEL.spider, G = S.groundY, sp = this.sp, b = this.player.body;
            const px = b.center.x, alive = this.state === 'play';
            sp.mt += dt;
            const legs = sp.legs, stab = legs[0];
            const restTip = [sp.bx - 250 + Math.sin(this.t * 1.3) * 25, 240 + Math.sin(this.t * 2.1) * 20];

            // pata "en el aire" que se mueve inquieta
            if (sp.mode === 'hunt' || sp.mode === 'caught') {
                legs[1].tip[0] = lerp(legs[1].tip[0], sp.bx - 190 + Math.sin(this.t * 1.7) * 40, dt * 3);
                legs[1].tip[1] = lerp(legs[1].tip[1], 320 + Math.sin(this.t * 2.6) * 30, dt * 3);
                for (let i = 2; i < 8; i++) legs[i].tip[1] = G + 4 - Math.max(0, Math.sin(this.t * 2 + i)) * 3;
                sp.by = S.bodyY + Math.sin(this.t * 1.6) * 6;
            }

            if (sp.mode === 'hunt') {
                const active = px > S.huntFrom && alive;
                sp.pt += dt;
                const aimTime = px > S.barrierX - 110 ? 0.42 : 0.9;
                if (sp.phase === 'rest') {
                    stab.tip[0] = lerp(stab.tip[0], restTip[0], dt * 4); stab.tip[1] = lerp(stab.tip[1], restTip[1], dt * 4);
                    if (active && sp.pt > 0.55) {
                        sp.phase = 'aim'; sp.pt = 0; sp.tx = px;
                        SFX.tick(); this.time.delayedCall(90, () => SFX.tick()); this.time.delayedCall(170, () => SFX.tick());
                    }
                } else if (sp.phase === 'aim') {
                    if (sp.pt < aimTime * 0.62) sp.tx = lerp(sp.tx, px, Math.min(1, dt * 9));   // sigue y luego se fija
                    const shake = Math.sin(this.t * 40) * 3;
                    stab.tip[0] = lerp(stab.tip[0], sp.tx + 26 + shake, dt * 9);
                    stab.tip[1] = lerp(stab.tip[1], G - 270, dt * 9);
                    if (sp.pt > aimTime) { sp.phase = 'strike'; sp.pt = 0; sp.aimFrom = stab.tip.slice(); }
                } else if (sp.phase === 'strike') {
                    const k = Math.min(1, sp.pt / 0.085);
                    stab.tip[0] = lerp(sp.aimFrom[0], sp.tx, k * k);
                    stab.tip[1] = lerp(sp.aimFrom[1], G + 6, k * k);
                    if (k >= 1) {
                        sp.phase = 'stuck'; sp.pt = 0;
                        SFX.stab(); this.cameras.main.shake(120, 0.006);
                        this.dustFx.explode(7, sp.tx, G);
                        const trap = this.traps.find(t => t.spider);
                        if (!trap.shut && Math.abs(trap.x - sp.tx) < 44) {
                            // ¡la pata cae en la trampa!
                            trap.shut = true; trap.keep = true; trap.img.setTexture('trapShut');
                            SFX.trapSnap(); SFX.screech();
                            this.cameras.main.shake(500, 0.012);
                            sp.mode = 'caught'; sp.mt = 0;
                        } else if (alive && Math.abs(px - sp.tx) < 24 && b.bottom > G - 80) {
                            this.stabDeaths++;
                            this.kill('stab');
                        }
                    }
                } else if (sp.phase === 'stuck') {
                    if (sp.pt > 0.45) { sp.phase = 'pull'; sp.pt = 0; }
                } else if (sp.phase === 'pull') {
                    stab.tip[0] = lerp(stab.tip[0], restTip[0], dt * 6); stab.tip[1] = lerp(stab.tip[1], restTip[1], dt * 6);
                    if (sp.pt > 0.4) { sp.phase = 'rest'; sp.pt = 0; }
                }
            } else if (sp.mode === 'caught') {
                // forcejea con la trampa: la pata se sacude hasta arrancarse
                const trap = this.traps.find(t => t.spider);
                const k = sp.mt;
                stab.tip[0] = sp.tx + Math.sin(k * 31) * 9;
                stab.tip[1] = G + 4 - Math.abs(Math.sin(k * 8)) * 70 * Math.min(1, k * 2);
                trap.img.setPosition(stab.tip[0], stab.tip[1] + 30).setRotation(Math.sin(k * 31) * 0.25);
                sp.by = S.bodyY + Math.sin(k * 23) * 8;
                if (k > 1.5) {
                    // se arranca: el trozo de pata cae con la trampa
                    const knee = this.legKnee([sp.bx + stab.base[0], sp.by + stab.base[1]], stab.tip, stab.l1, stab.l2);
                    this.legPieces.push({ x1: knee[0], y1: knee[1], x2: stab.tip[0], y2: stab.tip[1], vy: -100, vx: -40, rot: 0, vr: -1.5 });
                    this.tweens.add({ targets: trap.img, y: G + 6, rotation: 0.4, duration: 700, ease: 'Bounce.easeOut' });
                    stab.lost = true;
                    SFX.screech();
                    this.cameras.main.shake(300, 0.01);
                    sp.mode = 'retreat'; sp.mt = 0;
                    this.spiderWounded = true;
                    this.barrierCollider.active = false;
                    this.spiderHint.setAlpha(0);
                }
            } else if (sp.mode === 'retreat') {
                const k = Math.min(1, sp.mt / 2.2), e = k * k;
                sp.bx = lerp(S.bodyX, S.bodyX + 500, e);
                sp.by = lerp(S.bodyY, -520, e);
                legs.forEach((l, i) => { if (i) { l.tip[0] = lerp(l.tip[0], sp.bx + l.base[0] * 2, dt * 2.5); l.tip[1] = lerp(l.tip[1], sp.by + 200, dt * 2.5); } });
                if (k >= 1) sp.mode = 'away';
            } else if (sp.mode === 'away') {
                if (alive && px > S.cocoonTrigger) {
                    // emboscada: cae del árbol justo delante
                    sp.mode = 'drop'; sp.mt = 0; sp.bx = px + 75; sp.by = -420;
                    legs.forEach((l, i) => { l.tip = [sp.bx + (i - 4) * 30, sp.by + 240]; l.l1 = 150; l.l2 = 185; });
                    this.state = 'grabbed';
                    b.setVelocity(0, b.velocity.y);
                }
            } else if (sp.mode === 'drop') {
                const k = Math.min(1, sp.mt / 0.4);
                sp.by = lerp(-420, G - 150, k * k);
                legs.forEach((l, i) => {
                    if (i === 0) return;
                    const spread = [0, -1, -0.6, 1.2, 1.7, 2.3, 2.8, 3.2][i];
                    l.tip[0] = lerp(l.tip[0], px + 40 + spread * 75, dt * 10);
                    l.tip[1] = lerp(l.tip[1], i < 3 ? G - 40 : G + 4, dt * 10);
                });
                if (k >= 1) {
                    sp.mode = 'wrap'; sp.mt = 0;
                    SFX.thud(); SFX.screech(); this.cameras.main.shake(400, 0.012);
                    this.dustFx.explode(25, px + 60, G);
                    this.cocooned = true;
                }
            } else if (sp.mode === 'wrap') {
                // la araña envuelve al personaje dando vueltas con dos patas
                sp.by = G - 150 + Math.sin(sp.mt * 14) * 4;
                sp.bx = lerp(sp.bx, px + 70, dt * 4);
                [1, 2].forEach((i, j) => {
                    const a = sp.mt * 13 + j * Math.PI;
                    legs[i].tip = [px + Math.cos(a) * 20, b.bottom - 32 + Math.sin(a) * 26];
                });
                this.cocoonWrap = Math.min(1, sp.mt / 1.7);
                if (Math.floor(sp.mt / 0.22) !== Math.floor((sp.mt - dt) / 0.22)) SFX.web();
                if (sp.mt > 1.9) { sp.mode = 'climb'; sp.mt = 0; }
            } else if (sp.mode === 'climb') {
                const k = Math.min(1, sp.mt / 0.9);
                sp.by = lerp(G - 150, 60, 1 - (1 - k) * (1 - k));
                legs.forEach((l, i) => { if (i) { l.tip[0] = lerp(l.tip[0], sp.bx + (i - 4) * 40, dt * 5); l.tip[1] = lerp(l.tip[1], sp.by + 190 + (i % 2) * 30, dt * 5); } });
                if (k >= 1) {
                    sp.mode = 'lurk'; sp.mt = 0;
                    this.state = 'cocoon';
                    this.cocoonHits = 0;
                }
            } else if (sp.mode === 'lurk') {
                // baja despacio sobre el capullo: hay que liberarse antes
                sp.bx = lerp(sp.bx, px + 30, dt * 0.8);
                sp.by += (48 + sp.mt * 4) * dt;
                legs.forEach((l, i) => {
                    if (!i) return;
                    const a = this.t * 3 + i;
                    l.tip[0] = lerp(l.tip[0], sp.bx + (i - 4) * 38 + Math.sin(a) * 10, dt * 4);
                    l.tip[1] = lerp(l.tip[1], sp.by + 200 + Math.cos(a) * 15, dt * 4);
                });
                if (Math.floor(sp.mt * 3) !== Math.floor((sp.mt - dt) * 3)) SFX.tick();
                if (sp.by + 175 > b.top) this.kill('spider');
            } else if (sp.mode === 'feed') {
                sp.by -= 380 * dt;
            } else if (sp.mode === 'flee') {
                sp.by -= (300 + sp.mt * 900) * dt;
                legs.forEach((l, i) => { if (i) { l.tip[0] = lerp(l.tip[0], sp.bx + (i - 4) * 30, dt * 6); l.tip[1] = lerp(l.tip[1], sp.by + 150, dt * 6); } });
                if (sp.by < -700) sp.mode = 'gone';
            }

            // trozos de pata cayendo
            this.legPieces.forEach(pc => {
                if (pc.rest) return;
                pc.vy += 1400 * dt; const dy = pc.vy * dt, dx = pc.vx * dt;
                pc.x1 += dx; pc.x2 += dx; pc.y1 += dy; pc.y2 += dy;
                const low = Math.max(pc.y1, pc.y2);
                if (low > G + 2) { const fix = low - (G + 2); pc.y1 -= fix; pc.y2 -= fix; pc.y1 = lerp(pc.y1, G - 4, 0.5); pc.rest = true; }
            });

            // pista si muere varias veces
            const trap = this.traps.find(t => t.spider);
            const showHint = this.stabDeaths >= 2 && !this.spiderWounded && Math.abs(px - trap.x) < 300 && alive;
            this.spiderHint.setAlpha(lerp(this.spiderHint.alpha, showHint ? 0.65 : 0, 0.04));
            const showC = this.state === 'cocoon';
            this.cocoonHint.setPosition(px, b.bottom + 45).setAlpha(lerp(this.cocoonHint.alpha, showC ? 0.75 : 0, 0.08));

            this.cocoonShake = Math.max(0, this.cocoonShake - dt * 5);
            this.drawSpider();
        }

        updateCocoon(dt, tch) {
            const b = this.player.body, k = this.keys;
            const left = k.left.isDown || k.a.isDown || tch.left;
            const right = k.right.isDown || k.d.isDown || tch.right;
            const jumpHeld = k.up.isDown || k.w.isDown || k.space.isDown || tch.jump;
            const jumpPressed = jumpHeld && !this.jumpHeldPrev;
            this.jumpHeldPrev = jumpHeld;
            const dir = (right ? 1 : 0) - (left ? 1 : 0);
            const onG = this.onGround;
            if (onG) b.setVelocityX(b.velocity.x * 0.7);
            this.hopCd = Math.max(0, (this.hopCd || 0) - dt);
            if (dir && onG && this.hopCd <= 0) {                 // saltitos dentro del capullo
                this.facing = dir;
                b.setVelocity(dir * 95, -220);
                this.hopCd = 0.35; this.cocoonHits += 0.4; this.cocoonShake = 0.6;
                SFX.struggle();
            }
            if (jumpPressed) {                                    // forcejear
                this.cocoonHits += 1; this.cocoonShake = 1;
                if (onG) b.setVelocityY(-130);
                SFX.struggle();
                this.splashFx.explode(3, b.center.x, b.center.y);
            }
            if (this.cocoonHits >= LEVEL.spider.freeHits) {
                // ¡libre!
                this.cocoonWrap = 0; this.cocooned = false;
                this.state = 'play';
                this.splashFx.explode(30, b.center.x, b.center.y);
                this.shardFx.explode(8, b.center.x, b.center.y);
                SFX.tear(); SFX.screech();
                this.cameras.main.shake(250, 0.008);
                this.sp.mode = 'flee'; this.sp.mt = 0;
            }
        }

        drawSpider() {
            const g = this.spG, sp = this.sp, C = 0x030303;
            g.clear();
            this.legPieces.forEach(pc => this.taper(g, pc.x1, pc.y1, pc.x2, pc.y2, 7, 2, C));
            if (sp.mode === 'gone' || sp.mode === 'away') return;
            const cam = this.cameras.main;
            if (sp.bx < cam.scrollX - 900 || sp.bx > cam.scrollX + VIEW_W + 900) return;
            const bx = sp.bx, by = sp.by;

            // hilo de seda del que cuelga
            if (['drop', 'wrap', 'climb', 'lurk', 'feed', 'flee'].includes(sp.mode)) {
                g.lineStyle(1.5, 0xc8c8c8, 0.55); g.lineBetween(bx + 10, by - 40, bx + 14, by - 900);
            }
            // hilos hacia el capullo
            if (this.cocoonWrap > 0 && (sp.mode === 'climb' || sp.mode === 'lurk' || sp.mode === 'wrap')) {
                const b = this.player.body;
                g.lineStyle(1, 0xd0d0d0, 0.45);
                g.lineBetween(bx - 30, by + 30, b.center.x, b.top + 8);
                g.lineBetween(bx - 10, by + 34, b.center.x + 6, b.top + 12);
            }

            // patas
            sp.legs.forEach((l, i) => {
                const B = [bx + l.base[0], by + l.base[1]];
                const K = this.legKnee(B, l.tip, l.l1, l.l2);
                this.taper(g, B[0], B[1], K[0], K[1], 11, 8, C);
                g.fillStyle(C, 1); g.fillCircle(K[0], K[1], 4.5);
                if (l.lost) {                                       // muñón
                    const dx = l.tip[0] - K[0], dy = l.tip[1] - K[1], d = Math.hypot(dx, dy) || 1;
                    this.taper(g, K[0], K[1], K[0] + dx / d * 40, K[1] + dy / d * 40, 8, 5, C);
                    return;
                }
                this.taper(g, K[0], K[1], l.tip[0], l.tip[1], 8, 1.6, C);
                // pelillos
                for (let h = 1; h < 4; h++) {
                    const t = h / 4, x = lerp(K[0], l.tip[0], t), y = lerp(K[1], l.tip[1], t);
                    g.lineStyle(1.2, C, 1); g.lineBetween(x, y, x + 6, y - 5);
                }
            });

            // cuerpo: cefalotórax + abdomen grande, todo en silueta
            const breathe = 1 + Math.sin(this.t * 3) * 0.03;
            g.fillStyle(C, 1);
            g.fillEllipse(bx - 40, by + 18, 76, 52);
            const ab = [];
            for (let i = 0; i < 28; i++) {
                const a = i / 28 * Math.PI * 2;
                let rx = 72 * breathe, ry = 56 * breathe;
                if (Math.cos(a) > 0.6) rx *= 1.08;               // abdomen un poco apuntado
                const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
                const r = -0.25;
                ab.push({ x: bx + 55 + x * Math.cos(r) - y * Math.sin(r), y: by - 6 + x * Math.sin(r) + y * Math.cos(r) });
            }
            g.fillPoints(ab, true);
            g.lineStyle(1.3, C, 1);
            ab.forEach((p, i) => { if (i % 2) g.lineBetween(p.x, p.y, p.x + (p.x - bx - 55) * 0.12, p.y + (p.y - by + 6) * 0.12); });
            // quelíceros
            g.fillTriangle(bx - 74, by + 24, bx - 98, by + 46, bx - 70, by + 36);
            g.fillTriangle(bx - 64, by + 30, bx - 82, by + 54, bx - 58, by + 40);
            // un brillo húmedo en los ojos (solo un destello gris, nada luminoso)
            g.fillStyle(0x6a6a6a, 0.7); g.fillCircle(bx - 66, by + 10, 2); g.fillCircle(bx - 59, by + 7, 1.6);
        }

        /** Segmento con grosor decreciente (patas). */
        taper(g, x1, y1, x2, y2, w1, w2, color) {
            const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1;
            const nx = -dy / d, ny = dx / d;
            g.fillStyle(color, 1);
            g.fillPoints([
                { x: x1 + nx * w1 / 2, y: y1 + ny * w1 / 2 }, { x: x2 + nx * w2 / 2, y: y2 + ny * w2 / 2 },
                { x: x2 - nx * w2 / 2, y: y2 - ny * w2 / 2 }, { x: x1 - nx * w1 / 2, y: y1 - ny * w1 / 2 }
            ], true);
        }

        /** Capullo de seda sobre el personaje. */
        drawCocoon(g) {
            const w = this.cocoonWrap; if (w <= 0) return;
            const b = this.player.body;
            const sx = Math.sin(this.t * 55) * 2.5 * this.cocoonShake;
            const cx = b.center.x + sx, bottom = b.bottom + 2, h = 52 * w;
            const pts = [];
            for (let i = 0; i <= 24; i++) {
                const a = i / 24 * Math.PI * 2;
                pts.push({ x: cx + Math.cos(a) * 14.5, y: bottom - h / 2 + Math.sin(a) * h / 2 });
            }
            g.fillStyle(0xb9b9b9, 0.97); g.fillPoints(pts, true);
            g.lineStyle(1.2, 0x6c6c6c, 0.9);
            for (let i = 0; i < Math.floor(11 * w); i++) {
                const y = bottom - 4 - i * 4.6, d = (i % 2 ? 1 : -1);
                g.lineBetween(cx - 13, y + d * 3, cx + 13, y - d * 3);
            }
            g.lineStyle(1, 0x8a8a8a, 1); g.strokePoints(pts, true);
            // hilos sueltos
            g.lineStyle(1, 0xcfcfcf, 0.6);
            g.lineBetween(cx + 10, bottom - h + 6, cx + 22 + Math.sin(this.t * 3) * 4, bottom - h - 6);
            g.lineBetween(cx - 12, bottom - h * 0.4, cx - 22, bottom - h * 0.4 + 9);
        }

        /* =================================================================
         * 5. MUERTE, CHECKPOINTS Y FINAL
         * ================================================================= */
        kill(cause) {
            if (!['play', 'ending', 'cocoon', 'grabbed'].includes(this.state)) return;
            this.state = 'dead';
            this.lastDeath = cause;
            const b = this.player.body;
            const cam = this.cameras.main;
            cam.stopFollow();
            this.deathPose = { rot: 0, offY: 0 };

            if (cause === 'restart') {
                this.respawnSoon(80);
                return;
            }
            SFX.death();
            if (cause === 'spider') {
                // la araña se lleva el capullo hacia arriba
                b.setAllowGravity(false); b.setVelocity(0, -380);
                this.sp.mode = 'feed'; SFX.screech();
                this.respawnSoon(1100);
                return;
            }
            if (cause === 'drown') {
                b.setVelocity(0, 25); b.setAllowGravity(false);
                this.bubbleFx.explode(10, b.center.x, b.top);
                SFX.bubbles();
                this.time.delayedCall(400, () => { this.bubbleFx.explode(6, b.center.x, b.top); SFX.bubbles(); });
            } else {
                if (cause !== 'mace') b.setVelocity(0, 0);
                if (cause === 'boulder' || cause === 'mace') {
                    this.shardFx.explode(cause === 'boulder' ? 28 : 18, b.center.x, b.center.y);
                    this.hidePlayer = cause === 'boulder';
                    cam.shake(250, 0.01);
                } else this.shardFx.explode(10, b.center.x, b.bottom - 10);
                this.tweens.add({
                    targets: this.deathPose, rot: this.facing * (cause === 'trap' ? 1.35 : -1.45), offY: -6,
                    duration: cause === 'mace' ? 250 : 420, ease: 'Quad.easeIn'
                });
            }
            this.respawnSoon(cause === 'drown' ? 1300 : 950);
        }

        respawnSoon(delay) {
            const cam = this.cameras.main;
            this.time.delayedCall(delay, () => {
                cam.fadeOut(650, 0, 0, 0);
                cam.once('camerafadeoutcomplete', () => this.respawn());
            });
        }

        respawn() {
            const cp = this.checkpoint, b = this.player.body;
            this.resetHazards(cp);
            b.reset(cp.x, cp.y - 30);
            b.setAllowGravity(true);
            b.setVelocity(0, 0);
            this.scarf.forEach(s => { s.x = s.px = cp.x; s.y = s.py = cp.y - 48; });
            this.hidePlayer = false;
            this.deathPose = null;
            this.cocooned = false; this.cocoonWrap = 0;
            this.state = 'play';
            this.cameras.main.startFollow(this.player, true, 0.075, 0.075, 0, CAM_OY);
            this.cameras.main.fadeIn(900, 0, 0, 0);
            SFX.muffle(false);
        }

        updateCheckpoints() {
            const x = this.player.body.center.x, onG = this.onGround;
            LEVEL.checkpoints.forEach(c => {
                if (c.requires && !this[c.requires]) return;
                if (onG && x > c.x && c.x > this.checkpoint.x && Math.abs(this.player.body.bottom - c.y) < 8) this.checkpoint = c;
            });
        }

        updateEnding(dt) {
            const E = LEVEL.ending, x = this.player.body.center.x;
            const k = clamp((x - (E.x - 880)) / 880, 0, 1);
            this.endGlow.setAlpha(0.2 + k * 0.6).setScale(7 + k * 4 + Math.sin(this.t * 1.5) * 0.3);
            if (this.state === 'play') this.whiteout.setAlpha(k * 0.22);

            if (this.state === 'play' && x > E.trigger) {
                this.state = 'ending';
                this.endWalk = 1;
                this.touchUI.forEach(o => o.setVisible(false));
                SFX.ending();
                this.tweens.add({
                    targets: this.whiteout, alpha: 1, duration: 4200, ease: 'Sine.easeIn',
                    onComplete: () => this.showEpitaph()
                });
            }
        }

        /** Sobre el blanco: la última línea, en silencio, y luego los créditos. */
        showEpitaph() {
            const t = this.add.text(VIEW_W / 2, VIEW_H / 2, LEVEL.epitaph, {
                fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '34px',
                color: '#1a1a1a', align: 'center', lineSpacing: 10
            }).setOrigin(0.5).setScrollFactor(0).setDepth(46.5).setAlpha(0);
            this.tweens.add({ targets: t, alpha: 0.9, duration: 2200, delay: 600 });
            this.tweens.add({ targets: t, alpha: 0, duration: 1800, delay: 6800, onComplete: () => {
                t.destroy(); this.startEpilogue();
            } });
        }

        showCredits() {
            this.state = 'credits';
            this.endWalk = 0;
            const serif = '"Cormorant Garamond", Georgia, serif';
            const cx = VIEW_W / 2, cy = VIEW_H / 2;
            const lines = [
                [cy - 80, 'UMBRAL', 84, '300', 30],
                [cy + 10, 'un juego de Isaac Proaño', 28, 'italic', 2],
                [cy + 50, 'hecho con Phaser 4  ·  2026', 20, 'normal', 4],
                [cy + 88, 'música: «Redecorate» (Stems Shutter) — Twenty One Pilots', 18, 'italic', 1],
                [cy + 112, 'versión hecha con los stems por Nic Stonewood', 16, 'italic', 1],
                [cy + 150, 'para mi abuelo', 22, 'italic', 3],
                [cy + 186, 'si alguna vez te sientes así, habla con alguien', 17, 'italic', 1],
                [cy + 232, 'Stay Alive', 24, '300', 6],
                [cy + 300, this.isTouch ? 'toca para volver a empezar' : 'pulsa cualquier tecla para volver a empezar', 16, 'italic', 1]
            ];
            const lastLine = lines.length - 1;
            const black = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000).setOrigin(0).setScrollFactor(0).setDepth(46).setAlpha(0);
            this.tweens.add({ targets: black, alpha: 1, duration: 3500, delay: 800 });
            lines.forEach(([y, s, size, style, ls], i) => {
                const t = this.add.text(cx, y, s, { fontFamily: serif, fontSize: size + 'px', fontStyle: style, color: '#d8d8d8' })
                    .setOrigin(0.5).setScrollFactor(0).setDepth(47).setLetterSpacing(ls).setAlpha(0);
                this.tweens.add({ targets: t, alpha: i === lastLine ? 0.55 : 0.92, duration: 2500, delay: 4200 + i * 1100 });
            });
            this.time.delayedCall(7500, () => { this.creditsReady = true; });
        }

        /* =================================================================
         * 6. EPÍLOGO · REDECORAR
         *   La luz blanca del final se disuelve en la habitación, de día.
         *   La mamá lo llama a comer. Puede abrir las cortinas (redecorar),
         *   tomar el palo, que vuelve a brillar, y salir por la puerta, donde
         *   ella lo espera. Hay gente que lo quiere. Luego, los créditos.
         *   La habitación se monta en el mundo, a la derecha del nivel, para
         *   que el niño se mueva con su física y su animación de siempre.
         * ================================================================= */
        startEpilogue() {
            const E = LEVEL.epilogue, RX = E.x, OY = 560 - ART.ROOM.floor, A = ART;
            const R = A.ROOM, B = A.BED, C = A.CANE, cam = this.cameras.main, b = this.player.body;
            const serif = '"Cormorant Garamond", Georgia, serif';
            this.state = 'epiWake';
            this.epi = { curtain: false, stick: false, door: false, calls: 0, idleT: 0, saidMissing: false };

            // fuera el bosque
            [...this.layers, this.sun, this.fg, this.fogFront, this.darkImg, ...this.rays, ...this.motes]
                .forEach(o => o && o.setVisible(false));

            // la habitación por la mañana
            const add = (o, d) => o.setDepth(d);
            add(this.add.image(RX, 560, 'roomDay').setScale(0.5).setOrigin(R.ox / R.w, (R.oy + R.floor) / R.h), 10);
            this.epiSun = add(this.add.image(RX - 200, OY - 160, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(2).setAlpha(0.18), 10.2);
            add(this.add.image(RX, OY, 'roomBed').setScale(0.5).setOrigin(B.ox / B.w, B.oy / B.h), 10.5);
            this.epiCane = add(this.add.image(RX + 178, 560, 'cane').setScale(0.5).setOrigin(C.ox / C.w, C.oy / C.h).setRotation(-0.12), 10.6);
            this.epiCaneGlow = add(this.add.image(RX + 173, OY - 18, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.6).setAlpha(0.35), 10.7);
            const CU = A.CURTAIN;
            this.epiCurtains = [
                add(this.add.image(RX - 230, OY - 244, 'curtain').setScale(0.5).setOrigin(0.5, 0), 10.6),
                add(this.add.image(RX - 170, OY - 244, 'curtain').setScale(0.5).setOrigin(0.5, 0).setFlipX(true), 10.6)
            ];
            this.epiDim = add(this.add.rectangle(RX - 470, OY - 380, 1060, 600, 0x000000).setOrigin(0).setAlpha(0.32), 11.8);
            this.epiBeam = add(this.add.image(RX - 205, OY - 236, 'ray').setOrigin(0.5, 0).setScale(0.32, 0.36).setAngle(-30)
                .setBlendMode(Phaser.BlendModes.ADD).setAlpha(0), 11.9);
            // la puerta: detrás, la luz del pasillo y la mamá
            this.epiHall = add(this.add.rectangle(RX + 298, OY - 174, 76, 202, 0xf2f2f2).setOrigin(0).setAlpha(0), 10.8);
            this.epiMom = add(this.add.image(RX + 345, 562, 'mother').setScale(0.5).setOrigin(0.5, 1).setAlpha(0), 10.9);
            this.epiDoor = add(this.add.rectangle(RX + 298, OY - 174, 76, 202, 0x070707).setOrigin(0), 10.95);
            this.epiUnderDoor = add(this.add.image(RX + 336, 560, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.9, 0.12).setAlpha(0.2), 11);

            // textos: lo que piensa (cursiva) y la voz de su mamá (desde la puerta)
            this.epiText = add(this.add.text(RX + 30, OY - 205, '', {
                fontFamily: serif, fontStyle: 'italic', fontSize: '19px', color: '#141414', align: 'center', lineSpacing: 4
            }).setOrigin(0.5).setAlpha(0), 13);
            this.epiVoice = add(this.add.text(RX + 300, OY - 215, '', {
                fontFamily: serif, fontSize: '19px', color: '#0e0e0e', align: 'center'
            }).setOrigin(0.5).setAlpha(0), 13);
            this.epiPrompt = add(this.add.text(0, 0, '', {
                fontFamily: serif, fontStyle: 'italic', fontSize: '14px', color: '#1c1c1c'
            }).setOrigin(0.5).setAlpha(0), 13);

            // física de la habitación: suelo, paredes y la cama
            const solid = (x, y, w, h) => {
                const z = this.add.zone(x + w / 2, y + h / 2, w, h); this.physics.add.existing(z, true);
                this.physics.add.collider(this.player, z); return z;
            };
            solid(RX - 470, 560, 1060, 80);
            solid(RX - 330, 0, 30, 560);
            solid(RX + 400, 0, 30, 560);
            solid(RX - 10, OY, 114, 10);
            this.physics.world.setBounds(RX - 470, -400, 1060, 1300);

            // el niño, dormido en la cama; el palo vuelve a la esquina
            b.reset(RX + 40, OY - 30); b.setVelocity(0, 0); b.setAllowGravity(true);
            this.scarf.forEach(s => { s.x = s.px = RX + 40; s.y = s.py = OY - 48; });
            this.hasStick = false; this.facing = 1; this.wake = 0;
            this.hidePlayer = false; this.deathPose = null; this.cocooned = false;

            // la cámara se acerca, como al principio
            cam.stopFollow();
            cam.setBounds(RX - 340, 225, 800, 455);
            cam.setZoom(ROOM_ZOOM);
            cam.centerOn(RX + 40, OY - 40);
            cam.startFollow(this.player, true, 0.08, 0.08, 0, 20);
            this.zoomUI(ROOM_ZOOM);

            SFX.playMusic({ volume: 0.9, fade: 3 });
            if (SFX.ambGain) SFX.ambGain.gain.setTargetAtTime(0.1, SFX.ctx.currentTime, 2);

            // despertar: el blanco se disuelve en la mañana
            this.tweens.add({ targets: this.whiteout, alpha: 0, duration: 3200, ease: 'Sine.easeOut' });
            this.time.delayedCall(1800, () => this.epiSay('Ya es de día.'));
            this.time.delayedCall(4200, () => this.tweens.add({
                targets: this, wake: 1, duration: 1700, ease: 'Sine.easeInOut',
                onComplete: () => { this.state = 'epilogue'; this.touchUI.forEach(o => o.setVisible(true)); }
            }));
            this.time.delayedCall(7600, () => this.momCall());
        }

        /** Los objetos de pantalla fija también se ven afectados por el zoom: se compensan. */
        zoomUI(z) {
            const cx = VIEW_W / 2, cy = VIEW_H / 2;
            [...this.touchUI, this.volIcon].forEach(o => {
                if (!o) return;
                if (o.baseX === undefined) { o.baseX = o.x; o.baseY = o.y; o.baseS = o.scaleX; }
                o.setPosition(cx + (o.baseX - cx) / z, cy + (o.baseY - cy) / z).setScale(o.baseS / z);
            });
        }

        epiSay(text, hold = 3200) {
            const t = this.epiText;
            this.tweens.killTweensOf(t);
            t.setText(text).setAlpha(0);
            this.tweens.add({ targets: t, alpha: 0.9, duration: 900 });
            this.tweens.add({ targets: t, alpha: 0, duration: 900, delay: 900 + hold });
        }

        /** La mamá llama desde el otro lado de la puerta. */
        momCall() {
            if (!this.epi || this.epi.door) return;
            const lines = ['—¡Hijo, a comer!', '—¿Hijo? Te estamos esperando.'];
            const t = this.epiVoice;
            SFX.knock();
            this.tweens.add({ targets: this.epiUnderDoor, alpha: 0.45, duration: 600, yoyo: true, hold: 1800 });
            this.tweens.killTweensOf(t);
            t.setText(lines[Math.min(this.epi.calls, lines.length - 1)]).setAlpha(0);
            this.tweens.add({ targets: t, alpha: 0.95, duration: 700, delay: 500 });
            this.tweens.add({ targets: t, alpha: 0, duration: 900, delay: 4200 });
            this.epi.calls++;
            this.epi.idleT = 0;
        }

        updateEpilogue(dt) {
            if (!this.epi || (this.state !== 'epilogue' && this.state !== 'outro')) return;
            const RX = LEVEL.epilogue.x, OY = 560 - ART.ROOM.floor, px = this.player.body.center.x, ep = this.epi;
            this.epiCaneGlow.setAlpha(ep.stick ? 0 : 0.3 + 0.1 * Math.sin(this.t * 2.2));

            // si tarda, lo vuelven a llamar
            ep.idleT += dt;
            if (!ep.door && ep.idleT > 16) this.momCall();

            const things = [
                { key: 'curtain', x: RX - 200, label: 'abrir', done: ep.curtain },
                { key: 'stick', x: RX + 178, label: 'tomar', done: ep.stick },
                { key: 'door', x: RX + 336, label: 'salir', done: ep.door }
            ];
            let near = null;
            if (this.state === 'epilogue') things.forEach(o => { if (!o.done && Math.abs(px - o.x) < 42 && this.onGround) near = o; });
            this.noJump = !!near;
            const p = this.epiPrompt;
            if (near) p.setText('↑  ' + near.label).setPosition(near.x, OY - 92);
            p.setAlpha(lerp(p.alpha, near ? 0.75 : 0, 0.15));

            // la acción usa la tecla de saltar
            const k = this.keys, JD = Phaser.Input.Keyboard.JustDown;
            const tj = this.readTouch().jump, touchPress = tj && !this.epiTouchPrev; this.epiTouchPrev = tj;
            const pressed = JD(k.up) || JD(k.w) || JD(k.space) || touchPress;
            if (!near || !pressed) return;

            if (near.key === 'curtain') {
                ep.curtain = true;
                this.tweens.add({ targets: this.epiCurtains[0], x: RX - 278, duration: 1400, ease: 'Sine.easeInOut' });
                this.tweens.add({ targets: this.epiCurtains[1], x: RX - 122, duration: 1400, ease: 'Sine.easeInOut' });
                this.tweens.add({ targets: this.epiDim, alpha: 0, duration: 2200 });
                this.tweens.add({ targets: this.epiBeam, alpha: 0.42, duration: 2200 });
                this.tweens.add({ targets: this.epiSun, alpha: 0.45, duration: 2200 });
                SFX.web();
                this.epiSay('Un poco de luz también\ncambia una habitación.');
            } else if (near.key === 'stick') {
                ep.stick = true;
                this.epiCane.setVisible(false);
                this.hasStick = true;
                this.cameras.main.flash(400, 60, 60, 60);
                SFX.checkpoint();
                this.epiSay('Sigue aquí.\nTodavía brilla.');
            } else if (near.key === 'door') {
                if (!ep.stick) {
                    this.epiSay('Me falta algo.', 1800);
                    return;
                }
                ep.door = true;
                this.openDoor();
            }
        }

        /** La puerta se abre: luz, y ella esperándolo. Él sale con su palo. */
        openDoor() {
            const RX = LEVEL.epilogue.x;
            this.state = 'outro';
            this.touchUI.forEach(o => o.setVisible(false));
            SFX.doorOpen();
            this.tweens.add({ targets: this.epiDoor, scaleX: 0.12, duration: 1300, ease: 'Sine.easeOut' });
            this.tweens.add({ targets: this.epiHall, alpha: 1, duration: 1300 });
            this.tweens.add({ targets: this.epiMom, alpha: 1, duration: 1500, delay: 500 });
            this.tweens.add({ targets: this.epiUnderDoor, alpha: 0.6, scaleY: 0.3, duration: 1300 });
            this.time.delayedCall(1400, () => {
                const v = this.epiVoice;
                this.tweens.killTweensOf(v);
                v.setText('—¡Ya voy!').setPosition(this.player.body.center.x, 560 - ART.ROOM.floor - 120).setAlpha(0);
                this.tweens.add({ targets: v, alpha: 0.95, duration: 500 });
                this.tweens.add({ targets: v, alpha: 0, duration: 800, delay: 2000 });
            });
            this.time.delayedCall(3200, () => this.epiSay('Hay gente que todavía me espera.', 3000));
            this.time.delayedCall(4600, () => { this.endWalk = 1; });
            this.time.delayedCall(6400, () => this.tweens.add({
                targets: this.whiteout, alpha: 1, duration: 2600, ease: 'Sine.easeIn',
                onComplete: () => {
                    this.cameras.main.setZoom(1);
                    this.zoomUI(1);
                    this.showCredits();
                }
            }));
        }

        /* =================================================================
         * PANEL DE VOLUMEN  (tecla V o el icono ♪)
         *   Tres canales: música, ambiente (viento, dron, crujidos) y efectos.
         *   Los niveles se guardan en el navegador. Los cambios de la música
         *   según la zona se mantienen: el panel solo cambia su volumen general.
         * ================================================================= */
        createPanel() {
            const serif = '"Cormorant Garamond", Georgia, serif';
            const cx = VIEW_W / 2, cy = VIEW_H / 2, W = 520, H = 310;
            const fix = o => o.setScrollFactor(0).setDepth(60);
            this.panelOpen = false;
            this.panelSel = 0;

            this.volIcon = fix(this.add.text(VIEW_W - 34, 30, '♪', { fontFamily: serif, fontSize: '34px', color: '#d0d0d0' }))
                .setOrigin(0.5).setAlpha(0.45).setDepth(55).setInteractive({ useHandCursor: true });
            this.volIcon.on('pointerdown', () => this.togglePanel());

            const items = [];
            const bg = fix(this.add.rectangle(cx, cy, W, H, 0x000000, 0.85).setStrokeStyle(1, 0xffffff, 0.18));
            bg.setInteractive();                                   // los toques dentro del panel no lo cierran
            const shade = fix(this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x000000, 0.35).setOrigin(0)).setDepth(59).setInteractive();
            shade.on('pointerdown', () => this.togglePanel());     // tocar fuera lo cierra
            items.push(shade, bg);
            items.push(fix(this.add.text(cx, cy - H / 2 + 42, 'Volumen', { fontFamily: serif, fontStyle: 'italic', fontSize: '36px', color: '#e0e0e0' }).setOrigin(0.5)));

            const rows = [['music', 'Música'], ['amb', 'Ambiente'], ['sfx', 'Efectos']];
            const barX = cx - 40, barW = 230;
            this.panelRows = rows.map(([key, label], i) => {
                const y = cy - 40 + i * 62;
                const lab = fix(this.add.text(cx - 200, y, label, { fontFamily: serif, fontSize: '26px', color: '#e0e0e0' }).setOrigin(0, 0.5));
                const track = fix(this.add.rectangle(barX, y, barW, 4, 0xffffff, 0.2).setOrigin(0, 0.5));
                const fill = fix(this.add.rectangle(barX, y, barW, 4, 0xe0e0e0, 0.9).setOrigin(0, 0.5));
                const knob = fix(this.add.circle(barX, y, 9, 0xe6e6e6));
                const val = fix(this.add.text(barX + barW + 22, y, '', { fontFamily: serif, fontSize: '22px', color: '#bdbdbd' }).setOrigin(0, 0.5));
                const hit = fix(this.add.zone(barX + barW / 2, y, barW + 40, 40).setInteractive({ useHandCursor: true }));
                const setFromX = x => { this.panelSel = i; SFX.setVolume(key, clamp((x - barX) / barW, 0, 1)); this.refreshPanel(); };
                hit.on('pointerdown', p => { this.panelDrag = setFromX; setFromX(p.x); });
                items.push(lab, track, fill, knob, val, hit);
                return { key, lab, fill, knob, val, barX, barW };
            });
            this.input.on('pointermove', p => { if (this.panelDrag && p.isDown) this.panelDrag(p.x); });
            this.input.on('pointerup', () => { this.panelDrag = null; });

            items.push(fix(this.add.text(cx, cy + H / 2 - 34, this.isTouch ? 'toca fuera para cerrar' : '↑ ↓ elegir     ← → ajustar     V cerrar', {
                fontFamily: serif, fontStyle: 'italic', fontSize: '19px', color: '#9a9a9a'
            }).setOrigin(0.5)));
            this.panelItems = items;
            items.forEach(o => o.setVisible(false));
            this.refreshPanel();
        }

        refreshPanel() {
            this.panelRows.forEach((r, i) => {
                const v = SFX.vol[r.key];
                r.fill.width = Math.max(0.001, r.barW * v);
                r.knob.x = r.barX + r.barW * v;
                r.val.setText(Math.round(v * 100) + '%');
                r.lab.setAlpha(i === this.panelSel ? 1 : 0.55);
                r.knob.setScale(i === this.panelSel ? 1.15 : 0.85);
            });
        }

        togglePanel() {
            SFX.init();
            this.panelOpen = !this.panelOpen;
            this.panelDrag = null;
            this.panelItems.forEach(o => o.setVisible(this.panelOpen));
            if (this.panelOpen) {
                this.physics.pause(); this.tweens.pauseAll(); this.time.paused = true;
                this.refreshPanel();
            } else {
                this.physics.resume(); this.tweens.resumeAll(); this.time.paused = false;
            }
        }

        panelKey(dx, dy) {
            if (!this.panelOpen) return;
            if (dy) this.panelSel = (this.panelSel + dy + 3) % 3;
            if (dx) { const r = this.panelRows[this.panelSel]; SFX.setVolume(r.key, Math.round((SFX.vol[r.key] + dx * 0.1) * 10) / 10); }
            this.refreshPanel();
        }

        /* =================================================================
         * BUCLE PRINCIPAL
         * ================================================================= */
        update(time, delta) {
            const dt = Math.min(delta / 1000, 1 / 30);
            if (this.panelOpen) {                                   // juego en pausa mientras se ajusta el volumen
                this.grain.tilePositionX = Math.random() * 256;
                return;
            }
            this.t += dt;
            const cam = this.cameras.main;

            if (this.roomActive) this.updateRoom(dt);
            this.updateEpilogue(dt);
            if (this.state !== 'dead') this.updatePlayer(dt);
            else this.player.body.setVelocityX(this.player.body.velocity.x * 0.92);
            this.updateHazards(dt);
            this.updateStory(dt);
            this.updateNight(dt);
            this.updateCheckpoints();
            this.updateEnding(dt);
            this.drawPlayer(dt);

            /* ---- parallax y atmósfera ---- */
            const sx = cam.scrollX, sy = cam.scrollY;
            this.layers.forEach(l => {
                l.tilePositionX = sx * l.f + this.t * l.drift;
                l.y = -(sy - 50) * l.f * 0.6;
            });
            this.sun.x = VIEW_W * 0.62 - sx * 0.02;
            this.fg.tilePositionX = sx * 1.35;
            this.fg.y = VIEW_H - 400 - (sy - 50) * 1.3 + 60;
            this.fogFront.tilePositionX = sx * 1.15 + this.t * 20;
            this.rays.forEach(r => r.setAlpha(r.baseA * (0.75 + 0.25 * Math.sin(this.t * 0.6 + r.seed))));
            this.motes.forEach(m => {
                const x = ((m.ox - sx * m.sf + Math.sin(this.t * 0.3 + m.seed) * 30) % (VIEW_W + 200) + VIEW_W + 200) % (VIEW_W + 200) - 100;
                const y = ((m.oy - sy * m.sf - this.t * 6 + Math.sin(this.t * 0.5 + m.seed) * 20) % VIEW_H + VIEW_H) % VIEW_H;
                m.setPosition(x, y).setAlpha(m.baseA * (0.6 + 0.4 * Math.sin(this.t * 1.3 + m.seed)));
            });

            const px = this.player.body.center.x;

            this.updateMusic(dt);

            // textos de ayuda: aparecen al acercarse
            this.hints.forEach((h, i) => {
                const d = Math.abs(h.x - px);
                const target = this.state === 'play' ? clamp(1 - (d - 120) / 260, 0, 0.7) : 0;
                h.setAlpha(lerp(h.alpha, target, 0.05));
            });

            // grano + parpadeo de proyector antiguo
            this.grain.tilePositionX = Math.random() * 256;
            this.grain.tilePositionY = Math.random() * 256;
            this.flicker.setAlpha(Math.random() < 0.06 ? Math.random() * 0.05 : this.flicker.alpha * 0.8);
            if (this.grade) {
                const cm = this.grade.colorMatrix;
                cm.reset();
                cm.grayscale(1);
                cm.contrast(0.1, true);
                cm.brightness(0.97 + Math.sin(this.t * 23) * 0.006 + (Math.random() - 0.5) * 0.012, true);
            }
        }
    }

    /* =====================================================================
     * ARRANQUE
     * ===================================================================== */
    function start() {
        const loading = document.getElementById('cargando');
        if (loading) { loading.style.opacity = 0; setTimeout(() => loading.remove(), 1000); }
        window.game = new Phaser.Game({
            type: Phaser.WEBGL,
            parent: 'juego',
            width: VIEW_W, height: VIEW_H,
            backgroundColor: '#000000',
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            physics: { default: 'arcade', arcade: { gravity: { y: P.gravity }, debug: DEBUG, tileBias: 32 } },
            audio: { noAudio: true },           // usamos nuestro propio sintetizador (audio.js)
            input: { activePointers: 3 },
            fps: { target: 60 },
            scene: [Umbral]
        });
    }

    // Espera a la fuente del título (máx. 2.5 s) para que no aparezca con la de respaldo
    const fontReady = document.fonts && document.fonts.load
        ? Promise.race([document.fonts.load('300 120px "Cormorant Garamond"'), new Promise(r => setTimeout(r, 2500))])
        : Promise.resolve();
    fontReady.catch(() => {}).then(start);
})();
