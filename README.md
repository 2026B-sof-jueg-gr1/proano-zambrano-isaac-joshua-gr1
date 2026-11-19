# UMBRAL

Plataformero atmosférico en blanco y negro hecho con **Phaser 4**, desarrollado para el *Taller Práctico: Setup, Desarrollo y Despliegue con Phaser* (ISWD823).

**Autor:** Isaac Joshua Proaño Zambrano

**Música:** *Redecorate - Stems Shutter*, versión hecha por **Nic Stonewood** (YouTube) a partir de los stems de *Redecorate* de Twenty One Pilots. Todos los derechos de la canción pertenecen a sus autores; se usa sin fines comerciales en un proyecto académico.

🎮 **Jugar:** https://2026b-sof-jueg-gr1.github.io/proano-zambrano-isaac-joshua-gr1/

---

## El juego

De noche, en su habitación, un niño se hunde en sus pensamientos y despierta en un bosque cubierto de niebla: su propia mente. Para volver tiene que sobrevivir a trampas para osos, fosos con estacas, mazas que se balancean, un estanque, una roca que lo persigue y una araña, hasta llegar a la luz. En la esquina del cuarto brilla el palo de caminar de su abuelo. Al final despierta de día: su mamá lo llama a comer, y sale por la puerta con su palo. La historia completa está en [HISTORIA.md](HISTORIA.md).

El estilo visual está inspirado en los plataformeros de silueta en blanco y negro como *LIMBO* (Playdead). El personaje, el nivel, el arte y el sonido son originales y no usan ningún recurso de ese juego.

### Controles

| Acción | Teclado | Táctil |
|---|---|---|
| Caminar | ← → o A D | botones ← → |
| Saltar | ↑, W o Espacio | botón ↑ |
| Empujar la caja | camina contra ella | — |
| Reintentar desde el último punto de control | R | — |
| Abrir, tomar, salir (en la habitación del final) | ↑, W o Espacio | botón ↑ |
| Silenciar | M | — |
| Volumen (música, ambiente, efectos) | V | icono ♪ |
| Adelantar los pensamientos del inicio | cualquier tecla | toque |

## Aspectos técnicos

- **Phaser 4.2** cargado por CDN (jsDelivr), con una copia local en `lib/` por si el CDN falla.
- **Sin archivos de imagen.** El arte y los efectos de sonido se generan por código al arrancar; la única pista grabada es el soundtrack (`musica/umbral.mp3`):
  - `art.js`: genera con Canvas 2D el cielo, cuatro capas de bosque con desenfoque, la niebla, los rayos de luz, el suelo del nivel, la utilería y el grano de película.
  - `audio.js`: sintetiza con Web Audio API el viento, un dron ambiental, pasos, saltos, trampas, agua y la roca, y controla el soundtrack (suena al empezar, se apaga al adentrarse en el bosque y vuelve en bucle en el final).
- **Personaje con animación procedural**: las piernas, los brazos y la inclinación se calculan con la velocidad, y la bufanda usa física Verlet.
- **Filtros de Phaser 4**: un `ColorMatrix` en la cámara aplica gradación y parpadeo de proyector.
- **Física Arcade** con *coyote time*, *jump buffer*, salto variable y caja empujable.
- Parallax de siete capas, primer plano desenfocado, partículas de polvo y viñeta.

## Estructura

```
├── index.html              → redirige a mi-primer-juego/
├── HISTORIA.md             → documento de historia y diseño narrativo
└── mi-primer-juego/
    ├── index.html          → carga Phaser y los scripts
    ├── game.js             → escena, nivel, personaje, peligros y final
    ├── art.js              → arte procedural (Canvas 2D)
    ├── audio.js            → sonido procedural (Web Audio) y control del soundtrack
    ├── musica/umbral.mp3   → soundtrack
    └── lib/phaser.min.js   → copia local de Phaser 4.2.1
```

## Ejecutar localmente

1. Abre la carpeta en VS Code.
2. Haz clic derecho en `mi-primer-juego/index.html` y elige **Open with Live Server**.

Para pruebas, la URL acepta dos parámetros:
- `?debug` muestra las cajas de colisión.
- `?x=4000` empieza la partida en esa coordenada.
- `?epilogo` empieza directamente en la habitación del final.

## Despliegue

GitHub Pages: **Settings → Pages → Deploy from a branch → `main` / `(root)`**.
