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
| **La araña** | El pensamiento más oscuro: te envuelve, te aísla y quiere quedarse contigo. |
| **Los capullos** | Los que no pudieron salir de sus pensamientos. Cuelgan por todo el bosque de la araña. |
| **La niebla** | Los recuerdos más duros: no se ve casi nada, solo lo que alumbra lo que él te dejó. |
| **Las raíces** | Lo que te agarra por debajo cuando avanzas sin mirar. |
| **El ciclo y la muralla** | Pensar en círculo. La muralla la levanta uno mismo, y solo cae cuando dejas de huir. |
| **La sombra** | Los pensamientos oscuros. No desaparecen: cuando la dejas alcanzarte, se vuelve tu sombra. Te acompaña, pero no eres tú. |
| **La luz del final** | Despertar. Volver a la habitación. |

## 2. Estructura

### Acto 0 · La habitación (nuevo)
- Empieza de noche. El niño está sentado en la cama. **Suena el soundtrack** y un reloj marca los segundos.
- **Monólogo interno** ✅ *implementado* (`MONOLOGUE` en `game.js`; una tecla adelanta cada línea):
  > *Otra noche más mirando el mismo techo.*
  > *Todo sigue en su sitio. Yo no.*
  > *¿Debería redecorar mi habitación?* — guiño al título de la canción
  > *…o quizá el problema no es la habitación.*
- Se tumba y piensa una última cosa: *Hace mucho que no salgo a caminar.* El reloj se va parando.
- En una esquina, el palo del abuelo brilla muy débilmente y parpadea. Sobre la cama hay una foto: el abuelo con su palo y el niño con su palito, de la mano.
- El niño se tumba. Las paredes se oscurecen, la cama se hunde, el suelo se vuelve hierba, los muebles se estiran hasta ser árboles.
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
  | Entrada al bosque de la araña (oscuro) | No todos pudieron salir de aquí. / Algunos se quedaron envueltos en sus propios pensamientos. |
  | Después de la araña | Los caminos se hicieron largos. / Las visitas, cortas. |
  | Niebla (borroso) | Hay cosas que ya no recuerdo bien. / Su voz. El camino de vuelta. |
  | Niebla (borroso) | Un día, el camino lo recorrió solo. |
  | Niebla (borroso, oscuro) | Nadie me dijo que sería la última vez. |
  | Después de romper el ciclo | Me preguntó cuándo volveríamos. / Le dije que pronto. |
  | Pantalla blanca, antes de los créditos | Lo que queda de alguien / a veces cabe en una mano. |

- Ideas pendientes para el palo:
  - Los **puntos de control** son lugares donde el niño clava el palo (un recuerdo del abuelo). Ahí la música suena **apagada, como si viniera de otra habitación**, durante unos segundos.
  - Al morir, la pantalla no muestra violencia: el niño se desploma y **la luz del palo lo levanta** en el último punto de control.
  - **El capullo**: al forcejear, el palo brilla cada vez más hasta romper la seda.

### Acto II · La niebla ✅ *implementado* (x 8 700 – 10 950)
- La niebla se cierra y todo queda a oscuras. **Solo se ve el círculo de luz del palo**, que brilla más que nunca.
- Dentro hay trampas para osos, dos fosos con estacas y una trampa nueva, las **raíces con espinas**: al acercarse, la tierra cruje y asoman las puntas; medio segundo después brotan de golpe. Hay que pararse y esperar a que se retiren, o saltarlas en el momento justo.
- Los recuerdos de aquí son los más duros y aparecen como **humo claro** sobre la oscuridad: se deshacen de lejos y se enfocan cuando el niño se acerca.

### Acto III · El ciclo ✅ *implementado* (x 11 000 – 11 900)
Inspirado en el tema de *City Walls* (Twenty One Pilots): unas murallas que uno mismo levanta y un ciclo del que cuesta salir. No usa letra de la canción.
- El camino termina en una **muralla de espinas**. Al llegar, un parpadeo y el niño vuelve al principio del mismo tramo. Cada vuelta todo está más oscuro y la música más lejos.
- Desde la primera vuelta lo sigue **una sombra con su misma forma**, más alta, con un borde de luz y pies de humo. Cada vuelta está más cerca.
- Lo que piensa en cada vuelta (`LOOP_TEXTS`), como humo claro:
  *Otra vez aquí.* → *Camino y camino, y siempre vuelvo al mismo lugar.* → *Estas paredes no son de piedra. Las levanté yo.* → *Algo me sigue. Siempre ha estado ahí.* → *Ya no quiero huir. Quizá solo tengo que dejar que me alcance.*
- **Hasta completar esos pensamientos no hay salida.** En la última vuelta, al entrar en el rayo de luz, **el palo empieza a parpadear**.
- **La única forma de romper el ciclo:** quedarse quieto en la luz y dejar que la sombra lo alcance (`LEVEL.loop.needed`, unos 2,6 s). No le hace daño: se funde con él y queda como **su sombra en el suelo**. *No se va a ir del todo. / Pero es mi sombra. No soy yo.* La muralla cae.
- La metáfora: no se trata de vencer los pensamientos oscuros ni de huir de ellos, sino de aceptar que existen sin dejar que nos definan.

### Acto final · La luz
- Pasada la muralla, el último recuerdo (*Me preguntó cuándo volveríamos. / Le dije que pronto.*) y la luz que lleva a la pantalla blanca y los créditos.

### Epílogo · Redecorar ✅ *implementado*
- Tras la última línea (*Lo que queda de alguien / a veces cabe en una mano.*), el blanco se disuelve en **la habitación, de día**, con las cortinas cerradas. El niño despierta en la cama: *Ya es de día.* Suena el soundtrack completo.
- **Su mamá lo llama** desde el otro lado de la puerta (llaman, se ve luz por debajo): *—¡Hijo, a comer!* Si tarda: *—¿Hijo? Te estamos esperando.*
- Con ↑ junto a cada cosa:
  - **La ventana**: se abren las cortinas y entra el sol. *Un poco de luz también cambia una habitación.* (redecorar)
  - **El palo**, de nuevo en la esquina y brillando: *Sigue aquí. Todavía brilla.*
  - **La puerta**: sin el palo, *Me falta algo.* Con él, la puerta se abre y en la luz del pasillo está **ella**, tendiéndole la mano. *—¡Ya voy!* · *Hay gente que todavía me espera.* Sale con su palo y todo se funde a blanco.
- Créditos: … *para mi abuelo* · *si alguna vez te sientes así, habla con alguien* · **Stay Alive**.
- Pendiente: añadir un teléfono de ayuda local verificado bajo la línea de ayuda.

## 3. Recuerdos del abuelo
Zarzas con moras y momentos del camino que evocan la historia real en frases cortas, sin contarla de forma literal (ver la tabla del Acto I). Los textos están en `LEVEL.memories` y se pueden reescribir libremente. Idea pendiente: contar en los créditos cuántos recuerdos encontraste.

## 4. Música (`musica/umbral.mp3`)
La pista **suena todo el tiempo y en bucle**, pero cambia de "lugar" según dónde está el niño: un filtro la hace sonar lejana, como desde otra habitación, o la abre. Así el bosque nunca queda vacío, y la música funciona como el hilo con la realidad. Los valores están en `MUSIC` (`game.js`).

| Momento | Cómo suena |
|---|---|
| Habitación y monólogo | Completa y clara |
| Primeros pasos en el bosque | Se va alejando a medida que el niño se adentra |
| Al recoger el palo | Se acerca un momento y vuelve a alejarse |
| Bosque, con el palo | Baja y lejana |
| Junto a un recuerdo | Se abre un poco; en el árbol de moras, casi clara |
| Zona de la araña y capullos | Casi desaparece: los pensamientos oscuros la tapan |
| Niebla | Lejana y apagada |
| El ciclo | Cada vuelta más lejos; quieto en la luz, vuelve y se aclara |
| Al morir | Amortiguada |
| Final (la luz) y créditos | Vuelve completa desde el principio, en bucle |

El sonido va por **tres canales** (música, ambiente y efectos) con un panel de volumen (tecla **V** o el icono ♪). Por defecto la música va por delante: ambiente al 45 % y efectos al 70 %. Los niveles se guardan en el navegador, y los cambios de la música según la zona se mantienen siempre.

`audio.js` expone `SFX.playMusic({ volume, fade, muffled, restart })`, `SFX.setMusic(volume, cutoff)` (para llamarlo cada fotograma) y `SFX.stopMusic(fade)`.

## 5. Cuidado con el tema
- Nunca mostrar un método ni el acto; lo oscuro se representa con el entorno.
- No premiar el camino oscuro; la decisión que el juego celebra es volver.
- Terminar con esperanza y con un mensaje de ayuda.
