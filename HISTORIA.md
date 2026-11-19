# UMBRAL — Documento de historia

> Un niño se encierra en su habitación y se hunde en sus pensamientos.
> El bosque es su mente. La vara brillante de su abuelo es el camino de vuelta.

Inspiración temática: *Redecorate* y *Guns for Hands* (Twenty One Pilots). El juego toma el **tema** —los pensamientos oscuros como un lugar del que hay que salir, y la decisión de volver— pero **no usa letras** de las canciones.

---

## 1. Símbolos

| En el juego | Qué significa |
|---|---|
| **La habitación** | La realidad. Lo único con algo de calidez en un mundo gris. Aquí suena la música. |
| **El bosque** | La mente del niño. Todo lo que hay en él es un pensamiento. |
| **La vara brillante** | El bastón del abuelo fallecido. Es lo único que brilla en el bosque: el recuerdo de alguien que lo quería. Lo devuelve a la realidad. |
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
- En una esquina, el bastón del abuelo brilla muy débilmente.
- El niño se tumba. Las paredes se oscurecen, la cama se hunde, el suelo se vuelve hierba, los muebles se estiran hasta ser árboles. **La música se apaga** a medida que se hunde.
- Despierta tumbado en el bosque (la intro actual del juego).
- **El niño no se lleva el bastón.** Lo encuentra más adelante, clavado en el suelo, brillando: *no lo trajo, estaba ahí esperándolo.*

### Acto I · El bosque (el nivel actual)
- Se mantiene casi igual; ahora cada peligro tiene significado.
- **Encontrar la vara** poco después del primer foso. Desde ese momento:
  - Los **puntos de control** son lugares donde el niño clava la vara (un recuerdo del abuelo). Ahí la música suena **apagada, como si viniera de otra habitación**, durante unos segundos.
  - Al morir, la pantalla no muestra violencia: el niño se desploma y **la luz de la vara lo levanta** en el último punto de control.
  - **Zonas oscuras**: hay tramos donde la niebla se cierra y solo el círculo de luz de la vara deja ver las trampas.
  - **El capullo**: al forcejear, la vara brilla cada vez más hasta romper la seda.

### Acto II · (por definir) Lo que se repite
Un tramo que vuelve sobre sí mismo (el mismo trozo de bosque, cada vez más oscuro) hasta que el jugador hace algo distinto. Representa los pensamientos en bucle.

### Acto final · El umbral
- El camino se divide:
  - **Hacia abajo**: fácil, silencioso, sin trampas, cada vez más oscuro. **No es un final**: el bosque se repite, todo se apaga y la vara tira del niño de vuelta a la bifurcación. Nunca se muestra nada explícito.
  - **Hacia arriba, hacia la luz**: difícil. A medida que se sube, la música vuelve: primero apagada y luego cada vez más clara.
- No hay un "final malo" que se pueda ganar. La única salida es volver.

### Epílogo · Redecorar
- El niño despierta en su cama. Es de día. **Suena el soundtrack completo, en bucle.**
- El jugador puede cambiar algo de la habitación: empujar un mueble (reutiliza la mecánica de la caja), abrir la cortina para que entre luz, apoyar el bastón junto a la puerta.
- Sale de la habitación → créditos.
- Al final de los créditos, una línea breve: *si alguna vez te sientes así, habla con alguien.* (Añadir un teléfono de ayuda local verificado.)

## 3. Recuerdos del abuelo (coleccionables)
Destellos escondidos en el bosque. Cada uno muestra una frase corta del abuelo o sobre él. **Las frases las escribe el autor**: es la parte más personal del juego. En los créditos se ve cuántos encontraste.

## 4. Música (`musica/umbral.mp3`)
Una sola pista, usada en momentos concretos y siempre **en bucle** si se termina:

| Momento | Cómo suena |
|---|---|
| Habitación / pantalla de título | Completa |
| Hundirse en el bosque | Se apaga a medida que el niño se adentra |
| Puntos de control con la vara y recuerdos | Apagada y lejana, unos segundos |
| Subida del umbral | De apagada a clara, según el progreso |
| Regreso a la habitación y créditos | Completa, en bucle |

`audio.js` expone `SFX.playMusic({ volume, fade, muffled, restart })`, `SFX.setMusicVolume(v)` y `SFX.stopMusic(fade)`.

## 5. Cuidado con el tema
- Nunca mostrar un método ni el acto; lo oscuro se representa con el entorno.
- No premiar el camino oscuro; la decisión que el juego celebra es volver.
- Terminar con esperanza y con un mensaje de ayuda.
