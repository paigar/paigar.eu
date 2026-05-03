---
title: "Cómo programar Pong desde cero"
date: 2026-01-06
excerpt: "Un tutorial paso a paso para construir el clásico Pong en una sola página web. Es probablemente el videojuego más sencillo jamás concebido y, precisamente por eso, una de las mejores formas de entender cómo funciona la física de los juegos."
tags: [apuntes, juegos, javascript, canvas]
image: juego-pong.png
image_alt: "Pantalla negra mostrando una versión minimalista del Pong original con dos paletas blancas a los lados y una pelota cuadrada en el centro, junto a una línea de puntos vertical que divide el campo"
prototype: pong
---

Pong es, casi con seguridad, el videojuego más sencillo que se haya programado jamás. Salió en 1972 de la mano de Atari, fue el primer videojuego comercialmente exitoso de la historia, y su mecánica entera cabe en una sola frase: dos paletas, una pelota, gana el primero que llegue a una puntuación acordada. No tiene niveles, no tiene power-ups, no tiene jefes finales. Tiene física, tiene reflejos y tiene la satisfacción inexplicable de oír el sonido de la pelota chocando contra la paleta. Y por todo eso es uno de los mejores proyectos para aprender cómo funciona un videojuego con movimiento continuo, que es algo que en Snake o 2048 no aparecía.

En este tutorial vamos a construir Pong en HTML, CSS y JavaScript, sin frameworks ni dependencias. Como con los anteriores, todo cabe en un único archivo y al final del artículo dejo el prototipo embebido para que puedas jugarlo. La diferencia conceptual respecto a Snake y 2048 es que aquí los objetos no se mueven por casillas discretas: se mueven con velocidad real, en píxeles por fotograma, y eso introduce el concepto de física básica de juego. No te asustes, que es física de la fácil.

## La idea general antes de tocar código

Pong consiste en una pelota que rebota indefinidamente entre dos paletas, una a la izquierda y otra a la derecha. La pelota tiene una velocidad horizontal y una velocidad vertical, y en cada fotograma del juego se desplaza exactamente esos píxeles. Cuando la pelota toca el borde superior o el inferior, su velocidad vertical se invierte (rebota). Cuando toca una paleta, su velocidad horizontal se invierte (rebota hacia el otro lado). Si la pelota sale del campo por uno de los laterales sin que la paleta correspondiente la haya tocado, el otro jugador gana un punto y la pelota vuelve al centro.

Las dos paletas se mueven solo en vertical. La del jugador humano responde a las teclas, y la del rival —que en nuestra versión va a ser una IA muy básica— intenta seguir la posición vertical de la pelota con un poco de retraso para que no sea invencible. Esto es todo. Si entiendes estos cuatro o cinco conceptos, has entendido Pong entero.

## El esqueleto HTML y CSS

Empezamos por la página. Vamos a usar un `<canvas>` para dibujar, igual que en Snake, porque la pelota se va a mover en píxeles y el canvas es la herramienta natural para eso. Las paletas las podríamos hacer con divs absolutos pero es más limpio dibujarlas también en el canvas, así todo el juego está contenido en un solo elemento.

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<title>Pong</title>
		<style>
			body {
				display: flex;
				flex-direction: column;
				align-items: center;
				background: #1a1d24;
				color: #e8e8e8;
				font-family: system-ui, sans-serif;
			}
			canvas {
				background: #000;
				border: 1px solid #2a2e36;
			}
		</style>
	</head>
	<body>
		<h1>Pong</h1>
		<div>
			Tú: <span id="puntos-jugador">0</span> · Rival:
			<span id="puntos-rival">0</span>
		</div>
		<canvas id="lienzo" width="600" height="400"></canvas>
		<script>
			// aquí irá todo el código del juego
		</script>
	</body>
</html>
```

El canvas mide 600 por 400, una proporción 3:2 que para Pong funciona bien. Suficiente espacio horizontal para que la pelota tarde algo en cruzar de un lado a otro y suficiente espacio vertical para que las paletas tengan recorrido.

## El estado del juego

Pong necesita guardar la posición y velocidad de la pelota, la posición vertical de cada paleta y la puntuación de cada jugador. Todo eso se representa con variables sencillas.

```javascript
const ANCHO = 600;
const ALTO = 400;
const ANCHO_PALETA = 10;
const ALTO_PALETA = 80;
const TAMANO_PELOTA = 10;

let pelota = {
	x: ANCHO / 2,
	y: ALTO / 2,
	vx: 4,
	vy: 3,
};

let paletaJugador = { y: ALTO / 2 - ALTO_PALETA / 2 };
let paletaRival = { y: ALTO / 2 - ALTO_PALETA / 2 };

let puntosJugador = 0;
let puntosRival = 0;
```

La pelota tiene posición `x`, `y` y velocidad `vx`, `vy`. Que la velocidad inicial sea 4 horizontal y 3 vertical no es casualidad: si fuera puramente horizontal o puramente vertical el juego sería aburrido, y los valores 4 y 3 dan una trayectoria diagonal con un ángulo razonable. Las paletas solo necesitan su posición vertical porque la horizontal es fija (siempre están pegadas al borde correspondiente).

## Mover la pelota y rebotes en bordes

El movimiento de la pelota es la operación más sencilla del mundo: en cada fotograma, sumamos la velocidad a la posición. Si la pelota toca el borde superior o el inferior, invertimos la velocidad vertical. Eso es todo.

```javascript
function actualizarPelota() {
	pelota.x += pelota.vx;
	pelota.y += pelota.vy;

	if (pelota.y < 0) {
		pelota.y = 0;
		pelota.vy = -pelota.vy;
	}
	if (pelota.y + TAMANO_PELOTA > ALTO) {
		pelota.y = ALTO - TAMANO_PELOTA;
		pelota.vy = -pelota.vy;
	}
}
```

Hay un detalle importante en cómo manejamos el rebote. Cuando la pelota se sale por arriba, no nos limitamos a invertir la velocidad: también la "encajamos" de vuelta dentro del campo poniendo `y = 0`. Sin esto, si la pelota se ha pasado del borde por dos píxeles, en el siguiente fotograma rebota pero todavía está fuera, y al siguiente vuelve a estar fuera, y entra en un bucle visual desagradable de temblequeo. Con la corrección, el rebote es siempre limpio.

## Detectar colisión con las paletas

La parte más delicada de Pong es detectar cuándo la pelota toca una paleta. La forma estándar es comprobar si dos rectángulos se solapan: el rectángulo de la pelota y el rectángulo de la paleta. Dos rectángulos se solapan si y solo si se solapan en el eje X y también en el eje Y. Si en cualquiera de los dos ejes están separados, no hay colisión.

```javascript
function chocaConPaleta(paletaX, paletaY) {
	return (
		pelota.x < paletaX + ANCHO_PALETA &&
		pelota.x + TAMANO_PELOTA > paletaX &&
		pelota.y < paletaY + ALTO_PALETA &&
		pelota.y + TAMANO_PELOTA > paletaY
	);
}
```

Esta función comprueba las cuatro condiciones de solapamiento entre el rectángulo de la pelota y el rectángulo de la paleta. Si las cuatro se cumplen a la vez, los rectángulos se están tocando. La aplicamos a la paleta del jugador (que está pegada al borde izquierdo, `x = 0`) y a la paleta del rival (que está pegada al borde derecho, `x = ANCHO - ANCHO_PALETA`):

```javascript
function comprobarColisiones() {
	if (chocaConPaleta(0, paletaJugador.y) && pelota.vx < 0) {
		pelota.vx = -pelota.vx;
		const centroPaleta = paletaJugador.y + ALTO_PALETA / 2;
		const centroPelota = pelota.y + TAMANO_PELOTA / 2;
		pelota.vy = (centroPelota - centroPaleta) * 0.15;
	}
	if (chocaConPaleta(ANCHO - ANCHO_PALETA, paletaRival.y) && pelota.vx > 0) {
		pelota.vx = -pelota.vx;
		const centroPaleta = paletaRival.y + ALTO_PALETA / 2;
		const centroPelota = pelota.y + TAMANO_PELOTA / 2;
		pelota.vy = (centroPelota - centroPaleta) * 0.15;
	}
}
```

Aquí hay dos detalles importantes. El primero es la condición `pelota.vx < 0` (o `> 0` en el caso del rival). Sin ella, una pelota que ya rebotó pero todavía está dentro del rectángulo de la paleta volvería a invertir su velocidad en el siguiente fotograma y se quedaría pegada. Con esta condición, solo invertimos la velocidad si la pelota se está acercando a la paleta, no si ya se está alejando.

El segundo detalle es más bonito y es lo que separa un Pong jugable de un Pong soso. Cuando la pelota golpea la paleta, no se limita a rebotar: cambiamos también su velocidad vertical en función de qué parte de la paleta ha tocado. Si la pelota golpea cerca del centro, sale casi horizontal. Si golpea cerca del extremo superior, sale hacia arriba. Si golpea cerca del extremo inferior, sale hacia abajo. Esto le da al jugador control real sobre la trayectoria de la pelota, y convierte el juego en algo estratégico en lugar de en una sucesión de rebotes aburridos. La constante 0.15 controla cuánto influye el punto de impacto: con valores más altos la pelota gira mucho, con valores más bajos casi nada.

## Detectar puntos y reiniciar pelota

Si la pelota se sale por la izquierda, el rival ha marcado un punto. Si se sale por la derecha, el punto es para el jugador. En ambos casos sumamos el punto correspondiente y devolvemos la pelota al centro con una velocidad inicial.

```javascript
function comprobarPuntos() {
	if (pelota.x + TAMANO_PELOTA < 0) {
		puntosRival++;
		reiniciarPelota(1);
	} else if (pelota.x > ANCHO) {
		puntosJugador++;
		reiniciarPelota(-1);
	}
}

function reiniciarPelota(direccion) {
	pelota.x = ANCHO / 2;
	pelota.y = ALTO / 2;
	pelota.vx = 4 * direccion;
	pelota.vy = (Math.random() - 0.5) * 6;
}
```

El parámetro `direccion` controla hacia qué lado sale la pelota tras cada punto. La idea es que la pelota salga hacia el jugador que acaba de recibir el punto, dándole una pequeña ventaja para reaccionar. La velocidad vertical inicial es aleatoria pero con un rango limitado, para que cada saque sea ligeramente distinto y el juego no se vuelva monótono.

## La paleta del jugador

El jugador controla su paleta con las flechas arriba y abajo. La forma más sencilla es escuchar los eventos de teclado y guardar qué teclas están actualmente pulsadas, para luego mover la paleta en consecuencia en cada fotograma.

```javascript
const teclas = { arriba: false, abajo: false };

document.addEventListener("keydown", (e) => {
	if (e.key === "ArrowUp" || e.key === "w" || e.key === "W")
		teclas.arriba = true;
	if (e.key === "ArrowDown" || e.key === "s" || e.key === "S")
		teclas.abajo = true;
});

document.addEventListener("keyup", (e) => {
	if (e.key === "ArrowUp" || e.key === "w" || e.key === "W")
		teclas.arriba = false;
	if (e.key === "ArrowDown" || e.key === "s" || e.key === "S")
		teclas.abajo = false;
});

function moverJugador() {
	const VELOCIDAD = 6;
	if (teclas.arriba) paletaJugador.y -= VELOCIDAD;
	if (teclas.abajo) paletaJugador.y += VELOCIDAD;
	paletaJugador.y = Math.max(0, Math.min(ALTO - ALTO_PALETA, paletaJugador.y));
}
```

Este patrón de escuchar `keydown` y `keyup` para mantener un estado del teclado es la forma estándar de gestionar movimiento continuo en juegos. Si en lugar de eso movieras la paleta solo dentro del manejador de `keydown`, el navegador te daría un primer movimiento, una pausa de medio segundo y luego empezaría a repetir, que es como funcionan los teclados cuando escribes texto. Para un juego eso es horrible. Con el patrón de arriba, en cada fotograma comprobamos si la tecla está pulsada y movemos en consecuencia, dando una respuesta inmediata y constante.

La última línea del bloque encaja la posición de la paleta dentro de los límites del canvas. Sin esa línea, el jugador podría sacar su paleta fuera de la pantalla, lo cual no tiene sentido.

## La paleta del rival: una IA muy básica

El rival necesita moverse solo. Hay muchas formas de programar una IA para Pong, desde la más sencilla (seguir la pelota verticalmente) hasta sistemas que predicen dónde va a llegar la pelota teniendo en cuenta los rebotes futuros. Para este tutorial vamos a hacer la versión sencilla, pero con un par de detalles que la hacen jugable.

```javascript
function moverRival() {
	const VELOCIDAD = 4.5;
	const centroPaleta = paletaRival.y + ALTO_PALETA / 2;
	const objetivo = pelota.y + TAMANO_PELOTA / 2;
	if (Math.abs(centroPaleta - objetivo) > 10) {
		if (centroPaleta < objetivo) paletaRival.y += VELOCIDAD;
		else paletaRival.y -= VELOCIDAD;
	}
	paletaRival.y = Math.max(0, Math.min(ALTO - ALTO_PALETA, paletaRival.y));
}
```

La paleta del rival intenta alinear su centro con la altura de la pelota. La velocidad es ligeramente menor que la del jugador (4.5 frente a 6), para que el rival no sea perfecto y el jugador pueda ganarle si es lo suficientemente hábil. Y solo se mueve si la diferencia entre el centro de la paleta y la pelota es mayor que diez píxeles. Esto evita que la paleta vibre constantemente cuando la pelota está casi alineada con su centro, que sería antiestético y haría a la IA fácil de leer.

Si quieres un rival más difícil, sube la velocidad. Si quieres uno más fácil, bájala o reduce la zona muerta de diez píxeles. Si quieres uno realmente espectacular, tendrías que predecir la trayectoria de la pelota teniendo en cuenta los rebotes futuros contra los bordes, pero eso ya es harina de otro tutorial.

## Dibujar todo

La función de dibujado limpia el canvas y vuelve a pintar los tres elementos del juego: la línea central, las dos paletas y la pelota.

```javascript
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

function dibujar() {
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, ANCHO, ALTO);

	ctx.fillStyle = "#444";
	for (let y = 0; y < ALTO; y += 20) {
		ctx.fillRect(ANCHO / 2 - 1, y, 2, 10);
	}

	ctx.fillStyle = "#fff";
	ctx.fillRect(0, paletaJugador.y, ANCHO_PALETA, ALTO_PALETA);
	ctx.fillRect(ANCHO - ANCHO_PALETA, paletaRival.y, ANCHO_PALETA, ALTO_PALETA);
	ctx.fillRect(pelota.x, pelota.y, TAMANO_PELOTA, TAMANO_PELOTA);
}
```

La línea central es un detalle estético clásico de Pong: una serie de pequeños rectángulos verticales que dividen visualmente el campo en dos mitades. No tiene función jugable, pero sin ella el juego se ve raro. Es uno de esos elementos heredados del original que conviene respetar.

## El bucle principal

A diferencia de Snake o 2048, Pong tiene movimiento continuo, así que el bucle del juego se ejecuta a sesenta fotogramas por segundo. Para esto la mejor herramienta es `requestAnimationFrame`, que sincroniza el bucle con la frecuencia de refresco de la pantalla y se pausa automáticamente si el usuario cambia de pestaña.

```javascript
function bucle() {
	moverJugador();
	moverRival();
	actualizarPelota();
	comprobarColisiones();
	comprobarPuntos();
	dibujar();
	document.getElementById("puntos-jugador").textContent = puntosJugador;
	document.getElementById("puntos-rival").textContent = puntosRival;
	requestAnimationFrame(bucle);
}

bucle();
```

Este patrón —cada fotograma actualiza la lógica y luego dibuja— es la estructura estándar de cualquier juego con movimiento continuo. Dentro del bucle cabe la complejidad que quieras, pero la estructura general no cambia. Si vas a programar más juegos en el futuro, te conviene memorizar esta estructura porque la vas a usar muchas veces.

## Cosas que se pueden añadir

A partir de este esqueleto, las posibilidades son muchas. Un sonido de "pong" cada vez que la pelota golpea una paleta, usando la Web Audio API. Una pantalla de fin de partida cuando alguno llegue a once puntos. Un modo de dos jugadores humanos en el mismo teclado, donde uno controla la paleta izquierda con W y S y el otro la paleta derecha con las flechas. Una IA mejor que prediga dónde va a llegar la pelota. Aceleración progresiva: que la pelota vaya un poquito más rápido después de cada rebote, hasta que el juego se vuelva imposible. Soporte táctil para móvil, donde la paleta del jugador siga el dedo arrastrado por la pantalla.

La gracia de Pong es que sigue siendo divertido incluso en su versión más mínima. Cualquier mejora que le añadas es accesoria. El núcleo del juego —dos paletas, una pelota, rebotes— ya lo hemos terminado, y cabe en menos de cien líneas de código si lo escribes apretado.

## El prototipo funcional

Aquí abajo dejo el juego completo y funcionando. Mismo código del tutorial pero un poco más cuidado, con marcador grande, soporte para WASD además de las flechas, control táctil para móvil (mueve el dedo arriba y abajo en la mitad izquierda del tablero) y una zona de marcadores al estilo retro. Está todo aislado bajo un id propio para que no afecte al resto del blog.

**Otros tutoriales de la serie**: [2048](/juego-2048-tutorial/) · [Serpiente](/juego-serpiente-tutorial/) · [Parejas](/juego-parejas-tutorial/) · [Ladrillos](/juego-ladrillos-tutorial/).
