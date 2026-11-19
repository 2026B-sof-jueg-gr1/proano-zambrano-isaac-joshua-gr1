# UMBRAL — Documento de historia

> Un niño se encierra en su habitación y se hunde en sus pensamientos.
> El bosque es su mente. El palo de caminar de su abuelo es el camino de vuelta.

Inspiración temática: *Redecorate* y *Guns for Hands* (Twenty One Pilots). El juego toma el **tema** —los pensamientos oscuros como un lugar del que hay que salir, y la decisión de volver— pero **no usa letras** de las canciones.

---

## 0. De dónde viene

UMBRAL nace de las caminatas por el bosque que el autor hacía de niño con su abuelo, y del palo que él siempre recogía del camino para apoyarse. **Ese palo es el objeto que brilla en el juego.**

---

## 1. Símbolos

| En el juego | Qué significa |
|---|---|
| **La habitación** | La realidad. Lo único con algo de calidez en un mundo gris. Aquí suena la música. |
| **El bosque** | La mente del niño. Todo lo que hay en él es un pensamiento. |
| **El palo brillante** | El palo de caminar del abuelo: no un bastón comprado, sino una rama recogida del camino. Es lo único que brilla en el bosque. Lo devuelve a la realidad. |
| **Las zarzas con moras** | Los recuerdos de las caminatas. Brillan al pasar y cuentan un fragmento de la historia. |
| **Trampas para osos** | Pensamientos que aparecen de golpe y te atrapan cuando no miras. |
| **Fosos con estacas** | Caer más hondo. |
| **Péndulos / mazas** | Pensamientos que van y vuelven, siempre con el mismo ritmo. |
| **El estanque** | Ahogarse en los pensamientos. |
| **La roca** | La ansiedad que te persigue… y que, cuando la esquivas, se convierte en puente. |
| **La araña** | El pensamiento más oscuro: te envuelve, te aísla y quiere quedarse contigo. Los capullos son otros que se quedaron atrapados. |
| **La luz del final** | Despertar. Volver a la habitación. |

## 2. Estructura

### Acto 0 · La habitación (nuevo)
- Empieza de noche. El niño está sentado en la cama. **Suena el soundtrack.**
- En una esquina, el palo del abuelo brilla muy débilmente y parpadea. Sobre la cama hay una foto: el abuelo con su palo y el niño con su palito, de la mano.
- El niño se tumba. Las paredes se oscurecen, la cama se hunde, el suelo se vuelve hierba, los muebles se estiran hasta ser árboles. **La música se apaga** a medida que se hunde.
- Despierta tumbado en el bosque (la intro actual del juego).
- Mientras el niño se tumba, la luz del palo falla y **se apaga**. El niño no se lo lleva.
- Lo encuentra al despertar, unos pasos más adelante, clavado en el suelo y brillando: *no lo trajo, estaba ahí esperándolo.* Al recogerlo, el soundtrack suena apagado, como desde otra habitación, y aparece el primer recuerdo. Desde entonces el niño camina apoyándose en él. ✅ *implementado*

### Acto I · El bosque (el nivel actual)
- Se mantiene casi igual; ahora cada peligro tiene significado.
- **Recuerdos** a lo largo del nivel ✅ *implementado* (se editan en `LEVEL.memories`, en `game.js`):

  Los textos **no cuentan la historia de forma literal**: son pensamientos sueltos, introspectivos, sin nombres. Quien juega pone ahí a su propia persona; la única pista directa es la dedicatoria de los créditos.

  | Lugar | Recuerdo |
  |---|---|
  | Al recoger el palo | Siempre había un palo esperando en el camino. / Alguien me enseñó a encontrarlo. |
  | Zona de la caja (zarza) | Cada hoja tenía un nombre. / Ya no recuerdo la mitad. |
  | Antes del estanque (zarza) | A veces el bosque estaba lleno de voces. / A veces, solo de dos pasos. |
  | Justo antes de la roca | Hubo un día en que corrimos / sin saber de qué. |
  | Después de la roca (zarza grande, suena el soundtrack) | Caer también puede sonar a risa. / Y al levantarse, siempre había algo dulce. |
  | Después de la araña | Los caminos se hicieron largos. / Las visitas, cortas. |
  | | Un día, el camino lo recorrió solo. |
  | Antes de la luz | Me preguntó cuándo volveríamos. / Le dije que pronto. |
  | Pantalla blanca, antes de los créditos | Lo que queda de alguien / a veces cabe en una mano. |

- Ideas pendientes para el palo:
  - Los **puntos de control** son lugares donde el niño clava el palo (un recuerdo del abuelo). Ahí la música suena **apagada, como si viniera de otra habitación**, durante unos segundos.
  - Al morir, la pantalla no muestra violencia: el niño se desploma y **la luz del palo lo levanta** en el último punto de control.
  - **Zonas oscuras**: hay tramos donde la niebla se cierra y solo el círculo de luz del palo deja ver las trampas.
  - **El capullo**: al forcejear, el palo brilla cada vez más hasta romper la seda.

### Acto II · (por definir) Lo que se repite
Un tramo que vuelve sobre sí mismo (el mismo trozo de bosque, cada vez más oscuro) hasta que el jugador hace algo distinto. Representa los pensamientos en bucle.

### Acto final · El umbral
- El camino se divide:
  - **Hacia abajo**: fácil, silencioso, sin trampas, cada vez más oscuro. **No es un final**: el bosque se repite, todo se apaga y el palo tira del niño de vuelta a la bifurcación. Nunca se muestra nada explícito.
  - **Hacia arriba, hacia la luz**: difícil. A medida que se sube, la música vuelve: primero apagada y luego cada vez más clara.
- No hay un "final malo" que se pueda ganar. La única salida es volver.

### Epílogo · Redecorar
- El niño despierta en su cama. Es de día. **Suena el soundtrack completo, en bucle.**
- El jugador puede cambiar algo de la habitación: empujar un mueble (reutiliza la mecánica de la caja), abrir la cortina para que entre luz.
- El palo vuelve a estar en la esquina, brillando de nuevo. El niño lo toma y **sale a caminar**: la respuesta, por fin, a *¿cuándo volvemos a salir?* → créditos ("para mi abuelo").
- Al final de los créditos, una línea breve: *si alguna vez te sientes así, habla con alguien.* (Añadir un teléfono de ayuda local verificado.)

## 3. Recuerdos del abuelo
Zarzas con moras y momentos del camino que evocan la historia real en frases cortas, sin contarla de forma literal (ver la tabla del Acto I). Los textos están en `LEVEL.memories` y se pueden reescribir libremente. Idea pendiente: contar en los créditos cuántos recuerdos encontraste.

## 4. Música (`musica/umbral.mp3`)
Una sola pista, usada en momentos concretos y siempre **en bucle** si se termina:

| Momento | Cómo suena |
|---|---|
| Habitación / pantalla de título | Completa |
| Hundirse en el bosque | Se apaga a medida que el niño se adentra |
| Puntos de control con el palo y recuerdos | Apagada y lejana, unos segundos |
| Subida del umbral | De apagada a clara, según el progreso |
| Regreso a la habitación y créditos | Completa, en bucle |

`audio.js` expone `SFX.playMusic({ volume, fade, muffled, restart })`, `SFX.setMusicVolume(v)` y `SFX.stopMusic(fade)`.

## 5. Cuidado con el tema
- Nunca mostrar un método ni el acto; lo oscuro se representa con el entorno.
- No premiar el camino oscuro; la decisión que el juego celebra es volver.
- Terminar con esperanza y con un mensaje de ayuda.
