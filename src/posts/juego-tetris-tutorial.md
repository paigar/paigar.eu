---
title: "Cómo programar el juego de Tetris desde cero"
date: 2026-05-04
excerpt: "Un tutorial paso a paso para construir el clásico Tetris en una sola página web. Es la pieza más completa de la serie hasta ahora: rotación de matrices, gravedad por turnos, y la lógica de eliminación de líneas, que es el corazón del juego y sigue siendo, cuarenta años después, una de las invenciones más limpias de la historia de los videojuegos."
tags: [apuntes, juegos, javascript, canvas]
image: juego-tetromino.png
image_alt: "Pantalla vertical de juego retro con bloques de colores apilados en la parte inferior, una pieza descendiendo hacia ellos en la parte superior, sobre fondo oscuro y rejilla de cuadrícula tenue al fondo"
prototype: tetromino
---

Tetris lo escribió Alekséi Pájitnov en 1984, en un Electronika 60 ruso que ni siquiera tenía gráficos: las piezas se dibujaban con caracteres de texto. El nombre viene del prefijo griego *tetra* (cuatro, por las cuatro celdas que tiene cada pieza) y el deporte favorito de Pájitnov, el tenis. La historia de cómo el juego se filtró fuera del bloque soviético en plena Guerra Fría, pasó por Hungría, llegó a una empresa británica, terminó en Atari y Nintendo, y desató una guerra de licencias que duró años, es uno de los grandes culebrones de la industria del software. Pero la idea, la mecánica nuclear del juego, es de las cosas más limpias que ha producido el medio: siete piezas, diez columnas, gravedad constante, líneas que desaparecen cuando se completan. Cuarenta años después sigue siendo el ejemplo canónico de "diseño de juego perfecto".

Como tutorial, además, es ideal. Mete sobre la mesa cosas que los seis juegos anteriores de esta serie no han tocado: la representación de las piezas como **matrices que se rotan**, la **gestión del tiempo** para una caída acompasada que se acelera con los niveles, y sobre todo la lógica de **detección y eliminación de líneas**, que es deceptivamente simple. Si has seguido los anteriores, este se va a sentir como un salto natural; si llegas nuevo, también funciona porque es un sistema autocontenido.

## La idea general antes de tocar código

Hay un tablero rectangular de **10 columnas por 20 filas**. Por arriba van apareciendo, una a una, **piezas de cuatro celdas** —los siete tetrominos clásicos— que caen automáticamente hacia abajo. El jugador puede moverlas a izquierda y derecha, rotarlas en su sitio, acelerar la caída o soltarlas de golpe. Cuando una pieza no puede bajar más porque hay suelo o porque se apoya en bloques ya fijados, se queda donde está y se convierte en parte del tablero. Aparece una nueva pieza arriba.

Cuando una **fila se completa entera** —diez bloques de la columna 0 a la 9—, esa fila se elimina y todo lo que había encima cae una posición. Cuanto más alto se acumulan los bloques, menos sitio queda para meter las nuevas piezas; el juego termina cuando una pieza nueva ya no cabe al aparecer. Eso es todo. La gracia está en que el ritmo de caída se va acelerando a medida que limpias líneas, así que el juego se va volviendo más exigente sin necesidad de cambiar las reglas.

## La cuadrícula como matriz 2D

La estructura central de todo el juego es un **array de arrays** que representa el tablero. Diez columnas, veinte filas. Cada celda guarda o bien `null` (vacía) o bien el color del bloque que la ocupa. Lo organizamos como `tablero[fila][columna]`, no al revés, porque así dibujar el tablero es un doble bucle natural por filas.

```js
const COLUMNAS = 10;
const FILAS = 20;
const TAMANO = 30;            // píxeles por celda

const ANCHO = COLUMNAS * TAMANO;  // 300
const ALTO = FILAS * TAMANO;      // 600

let tablero = Array.from({ length: FILAS }, () => Array(COLUMNAS).fill(null));
```

Ese `Array.from({length: N}, () => Array(M).fill(null))` es la forma idiomática en JS para crear una matriz 2D **sin compartir referencias** entre filas. Si lo hicieras con `Array(FILAS).fill(Array(COLUMNAS).fill(null))` —que parece lo mismo—, todas las filas serían el mismo array y modificar una modificaría todas. Es uno de los gotchas clásicos.

## Las siete piezas como matrices

Cada pieza la representamos también como una pequeña matriz: 1 = bloque, 0 = hueco. La I es de 1×4, la O de 2×2, las demás de 2×3. Los colores los fijo siguiendo la paleta canónica de Tetris (cyan para la I, amarillo para la O, etcétera).

```js
const PIEZAS = {
  I: [[1, 1, 1, 1]],
  O: [[1, 1], [1, 1]],
  T: [[0, 1, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  Z: [[1, 1, 0], [0, 1, 1]],
};
const COLORES = {
  I: '#00d4d4', O: '#d4d400', T: '#a040c0',
  L: '#d48028', J: '#3050d0', S: '#40c440', Z: '#d44040',
};
```

Cuando aparece una pieza nueva, elegimos un tipo al azar y guardamos una **copia** de su matriz —no el original—, porque la pieza activa va a mutar (rotar) y no queremos contaminar la plantilla de su tipo:

```js
function clonarMatriz(m) {
  return m.map((fila) => [...fila]);
}

function nuevaPieza() {
  const TIPOS = Object.keys(PIEZAS);
  const tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];
  pieza = { tipo, forma: clonarMatriz(PIEZAS[tipo]), color: COLORES[tipo] };
  x = Math.floor((COLUMNAS - pieza.forma[0].length) / 2);
  y = 0;
}
```

La pieza activa la guardamos como un objeto con `tipo`, `forma` y `color`, más dos variables `x` e `y` que indican la **posición de su esquina superior izquierda dentro del tablero**. Ese par `(x, y)` es lo único que cambia cuando la pieza se mueve.

## La función `colisiona`: el corazón de todo

Antes de mover, rotar o fijar una pieza, hay que saber si el movimiento sería válido. Toda esa lógica vive en una sola función que centraliza la pregunta "¿cabe esta forma en esta posición?":

```js
function colisiona(forma, px, py) {
  for (let f = 0; f < forma.length; f++) {
    for (let c = 0; c < forma[f].length; c++) {
      if (!forma[f][c]) continue;          // celda vacía de la pieza, ignorar
      const tx = px + c;
      const ty = py + f;
      if (tx < 0 || tx >= COLUMNAS) return true;   // fuera por los lados
      if (ty >= FILAS) return true;                 // fuera por abajo
      if (ty >= 0 && tablero[ty][tx]) return true;  // pisa un bloque fijo
    }
  }
  return false;
}
```

Recibe la `forma` (no la pieza completa, solo su matriz) y una posición tentativa `(px, py)`. Recorre cada celda de la forma; si la celda es 1, comprueba si su posición proyectada en el tablero saldría de los límites o pisaría un bloque ya fijado. Devuelve `true` en cuanto encuentra un problema.

Este detalle de no recibir `pieza` sino `forma` es importante: nos permite reutilizar la función para preguntar "¿cabría la pieza si la moviéramos un paso a la derecha?" o "¿cabría si la rotáramos?". Pasamos una posición o forma hipotética y obtenemos la respuesta sin tocar el estado real del juego.

## Movimiento y caída

Con `colisiona` definida, mover lateralmente es trivial:

```js
function moverHorizontal(dx) {
  if (!colisiona(pieza.forma, x + dx, y)) x += dx;
}
```

Si el movimiento no causaría colisión, lo aplicamos. Si causaría colisión, no hacemos nada y la pieza se queda donde estaba. Lo mismo para la caída paso a paso, con un matiz importante:

```js
function moverAbajo() {
  if (!colisiona(pieza.forma, x, y + 1)) {
    y++;
    return true;
  }
  fijarPieza();
  return false;
}
```

Si la pieza puede bajar, baja. Si no, **se fija al tablero**. Es decir: el momento exacto en que una pieza colisionaría al bajar es el momento en que deja de ser pieza activa y pasa a ser parte permanente del tablero. Esa transición —de pieza-en-movimiento a bloques-fijos— es el latido del juego.

## La rotación como transformación de matriz

La parte más bonita del tutorial. Rotar una pieza 90 grados en sentido horario es exactamente lo mismo que rotar su matriz: la columna 0 de la matriz original pasa a ser la última fila de la rotada (en orden inverso), la columna 1 pasa a ser la penúltima, y así. La fórmula es:

```
rotada[c][N - 1 - f] = original[f][c]
```

donde `N` es el número de filas de la matriz original. Implementado en código:

```js
function rotar() {
  if (pieza.tipo === 'O') return;   // El cuadrado no cambia al rotar
  const N = pieza.forma.length;
  const M = pieza.forma[0].length;
  const nueva = Array.from({ length: M }, () => Array(N).fill(0));
  for (let f = 0; f < N; f++) {
    for (let c = 0; c < M; c++) {
      nueva[c][N - 1 - f] = pieza.forma[f][c];
    }
  }
  if (!colisiona(nueva, x, y)) pieza.forma = nueva;
}
```

Tres detalles de los que merece la pena hablar:

**Primero**, la pieza O es un cuadrado simétrico, así que rotarla no cambia nada visualmente. Saltamos esa rotación al inicio para no gastar trabajo. No es estrictamente necesario —la rotación del 2×2 da el mismo 2×2 y sería equivalente— pero es buena práctica.

**Segundo**, la matriz nueva tiene dimensiones invertidas: si la original era `N×M`, la rotada es `M×N`. Por eso la I, que era `1×4` (una fila de cuatro celdas), después de rotar es `4×1` (una columna de cuatro celdas). Si dibujáramos antes y después no veríamos un cuadrado raro, sino la barra vertical clásica.

**Tercero**, antes de aceptar la rotación verificamos que la nueva forma cabría en la posición actual. Si rotar la pieza la haría chocar con una pared o con bloques ya fijados, **simplemente no rotamos**. En implementaciones más sofisticadas existe el concepto de *wall kick* —si la rotación choca contra la pared, se intenta desplazar uno o dos espacios para que entre—, pero para una versión de tutorial limpia, no rotar es la decisión correcta.

## Fijar la pieza al tablero

Cuando `moverAbajo()` falla, llamamos a `fijarPieza`. Esta función "imprime" la pieza activa en el tablero y luego intenta una nueva pieza:

```js
function fijarPieza() {
  for (let f = 0; f < pieza.forma.length; f++) {
    for (let c = 0; c < pieza.forma[f].length; c++) {
      if (pieza.forma[f][c]) {
        if (y + f < 0) continue;   // fuera del tablero por arriba: ignorar
        tablero[y + f][x + c] = pieza.color;
      }
    }
  }
  eliminarLineas();
  nuevaPieza();
}
```

El `if (y + f < 0)` evita escribir fuera del tablero cuando una pieza alta queda parcialmente arriba del techo —improbable pero defensivo—. Tras fijar, comprobamos si se han completado líneas y generamos una nueva pieza. Si la nueva pieza no cabe al aparecer, el juego ha terminado.

## La eliminación de líneas

El núcleo conceptual del juego. Recorremos el tablero **de abajo arriba**, y cuando encontramos una fila donde todas las celdas tienen color (es decir, no hay ningún `null`), la quitamos del array y añadimos una nueva fila vacía por arriba:

```js
function eliminarLineas() {
  let eliminadas = 0;
  for (let f = FILAS - 1; f >= 0; f--) {
    if (tablero[f].every((c) => c)) {
      tablero.splice(f, 1);
      tablero.unshift(Array(COLUMNAS).fill(null));
      eliminadas++;
      f++;   // el splice ha desplazado todo hacia abajo, hay que re-mirar esta f
    }
  }
  if (eliminadas > 0) {
    const puntosPorN = [0, 100, 300, 500, 800];
    puntos += puntosPorN[eliminadas] * nivel;
    lineas += eliminadas;
    nivel = Math.floor(lineas / 10) + 1;
    intervaloCaida = Math.max(80, 800 - (nivel - 1) * 60);
  }
}
```

El detalle del `f++` después de un `splice` merece comentario. Cuando eliminamos la fila `f`, todas las filas que estaban encima bajan una posición; la fila que **ahora** ocupa el índice `f` no la hemos comprobado. Si la dejamos pasar, podríamos saltarnos una línea completa que acaba de bajar. Por eso incrementamos `f` para compensar el `f--` del bucle, manteniendo el índice. Es uno de esos pequeños bailes de índices que cuestan veinte minutos la primera vez que los escribes y cinco segundos cada vez después.

La puntuación sigue la tabla canónica de Tetris: 100 puntos por una línea, 300 por dos, 500 por tres y 800 por cuatro (el famoso *Tetris*, una sola jugada de 4 líneas a la vez). Multiplicado por el nivel actual, así que ir más rápido vale más. El nivel sube cada 10 líneas y la velocidad de caída baja con él, hasta un mínimo de 80ms por paso.

## El bucle del juego con tiempo real

Esta es la primera vez en la serie que necesitamos **tiempo real, no por frames**. Si hiciéramos que la pieza bajara una posición cada `requestAnimationFrame`, en pantallas a 60Hz iría a 60 caídas por segundo. Lo que queremos es que baje según un intervalo en milisegundos que vamos ajustando con el nivel. La solución es acumular el delta de tiempo entre frames y avanzar la caída solo cuando hayamos acumulado el suficiente:

```js
let ultimoTiempo = 0;
let contadorCaida = 0;
let intervaloCaida = 800;

function bucle(tiempo) {
  if (!ultimoTiempo) ultimoTiempo = tiempo;
  const delta = tiempo - ultimoTiempo;
  ultimoTiempo = tiempo;

  contadorCaida += delta;
  if (contadorCaida >= intervaloCaida) {
    moverAbajo();
    contadorCaida = 0;
  }

  dibujar();
  requestAnimationFrame(bucle);
}
```

`requestAnimationFrame` pasa al callback un timestamp en milisegundos. Restamos el tiempo del frame anterior para obtener cuánto ha pasado realmente, y vamos sumando ese delta a un contador. Cuando el contador supera el intervalo de caída actual, hacemos bajar la pieza y reseteamos. El resto del frame, dibujamos. Este patrón —acumular delta para acciones discretas— funciona para cualquier mecánica tipo "X cosa cada Y milisegundos" y es muy reutilizable.

## Dibujado

La función de dibujo recorre el tablero pintando los bloques fijos y luego pinta la pieza activa encima. La rejilla tenue de fondo es opcional pero ayuda mucho a la legibilidad de las piezas:

```js
function dibujarCelda(cx, cy, color) {
  ctx.fillStyle = color;
  ctx.fillRect(cx * TAMANO, cy * TAMANO, TAMANO, TAMANO);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(cx * TAMANO, cy * TAMANO, TAMANO, 3);            // brillo arriba
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(cx * TAMANO, cy * TAMANO + TAMANO - 3, TAMANO, 3); // sombra abajo
}
```

Las dos franjas adicionales —una clara arriba, una oscura abajo— dan a cada bloque un pequeño efecto de bisel que evita que el tablero se vea plano. Es el truco más barato para que un puzzle de cuadrículas no parezca una hoja de cálculo.

## Controles

Asignamos las teclas estándar: izquierda/derecha mueven la pieza, arriba la rota, abajo acelera la caída por una celda (soft drop), espacio la suelta de golpe hasta el fondo (hard drop). Cada acción reinicia el contador de caída para evitar comportamientos raros como que pulsar abajo justo antes de un tick automático cuente como dos pasos:

```js
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft')  moverHorizontal(-1);
  if (e.key === 'ArrowRight') moverHorizontal(1);
  if (e.key === 'ArrowUp')    rotar();
  if (e.key === 'ArrowDown') { moverAbajo(); contadorCaida = 0; }
  if (e.key === ' ')          caidaInstantanea();
});
```

`caidaInstantanea` es un loop simple: mientras la pieza pueda bajar, baja; cuando ya no, fijamos:

```js
function caidaInstantanea() {
  while (!colisiona(pieza.forma, x, y + 1)) y++;
  fijarPieza();
}
```

## Cierre

Tetris funcionó en 1984 sobre una máquina sin gráficos y sigue funcionando hoy en una página HTML con menos de trescientas líneas de JavaScript. Los conceptos centrales —matriz 2D para el tablero, formas como matrices pequeñas, una función de colisión unificada, rotación por transposición de matriz, eliminación de líneas con `splice + unshift`, gravedad acompasada por delta time— son patrones que se repiten en muchos otros juegos del mismo género: Columns, Dr. Mario, Puyo Puyo, Lumines. Si has llegado hasta aquí entendiendo cada paso, en realidad has aprendido una familia entera de juegos, no uno solo.

La versión que tienes encima del artículo está embebida en la propia página y funciona con teclado en escritorio y con tap/swipe en móvil. Si quieres trastear con el código, lo tienes todo en una sola IIFE autocontenida; cambiar los colores, las dimensiones del tablero o la curva de velocidad es un par de constantes. Si quieres más profundidad, el siguiente nivel sería implementar el sistema de *wall kicks* (Super Rotation System), añadir un *ghost piece* que muestre dónde caería la pieza si la soltaras, y meter una pieza guardada (*hold*) que se pueda intercambiar con la actual. Son tres mejoras independientes que multiplican el placer del juego sin tocar la mecánica nuclear que acabamos de construir.
