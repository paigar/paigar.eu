---
title: "Cómo programar el juego de ladrillos desde cero"
date: 2026-04-18
excerpt: "Un tutorial paso a paso para construir un clásico juego de ladrillos —de la familia de Breakout y Arkanoid— en una sola página web. Es el juego más completo de la serie hasta ahora: combina la física de Pong con la gestión de muchos objetos a la vez y una lógica de niveles que da mucho juego."
tags: [apuntes, juegos, javascript, canvas]
image: juego-ladrillos.png
image_alt: "Pantalla de juego retro mostrando una pared de ladrillos de colores en la parte superior, una paleta horizontal en la parte inferior y una pelota cuadrada en mitad de la pantalla, todo con estética arcade ochentera"
prototype: ladrillos
---

El juego de ladrillos es uno de los géneros arcade más influyentes de la historia. La versión original, llamada Breakout, salió de Atari en 1976 y la diseñaron, entre otros, Steve Jobs y Steve Wozniak antes de fundar Apple. Once años después, Taito lanzó Arkanoid, que era básicamente el mismo juego con mejor presentación, niveles diseñados, ladrillos especiales y power-ups. Las dos versiones comparten el mismo núcleo: una paleta abajo, una pelota que rebota, una pared de ladrillos arriba, y el objetivo de romper todos los ladrillos sin que la pelota se te escape por debajo.

Lo bonito de este juego como proyecto educativo es que junta en una sola pieza los conceptos de varios tutoriales anteriores. La física de la pelota es prácticamente la misma que en Pong. La detección de colisiones es la misma que con la paleta, pero ahora aplicada a docenas de objetos a la vez. Y aparece por primera vez en la serie un concepto nuevo: la gestión de muchos objetos del mismo tipo (los ladrillos) y la lógica de eliminarlos cuando son golpeados. Si has seguido los tutoriales anteriores, este se va a sentir como una continuación natural y bastante satisfactoria.

## La idea general antes de tocar código

El juego funciona así. La pantalla está dividida en tres zonas: una paleta horizontal en la parte inferior que el jugador mueve a izquierda y derecha, una pelota que se mueve con velocidad continua y rebota contra los bordes, la paleta y los ladrillos, y una rejilla de ladrillos en la parte superior que hay que destruir. La pelota empieza pegada a la paleta y se lanza con un click o una tecla. Cuando rebota contra un ladrillo, el ladrillo se rompe y desaparece, y la pelota cambia de dirección. Si la pelota se sale por debajo de la paleta, el jugador pierde una vida. Si se rompen todos los ladrillos, ha terminado el nivel.

A diferencia de Pong, que es un duelo entre dos jugadores, este es un juego solitario contra el escenario. La estrategia no consiste en ganarle a nadie sino en controlar la trayectoria de la pelota para llegar a los ladrillos más difíciles antes de que la pelota se descontrole y termine cayéndose. Por eso, igual que en Pong, conviene que el ángulo de rebote dependa del punto donde la pelota toca la paleta. Eso es lo que separa una versión sin gracia de una realmente jugable.

## El esqueleto HTML y CSS

Vamos con canvas, igual que con Snake o Pong, porque tenemos movimiento continuo y muchos objetos que pintar.

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<title>Ladrillos</title>
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
				background: #0f1115;
				border: 1px solid #2a2e36;
			}
		</style>
	</head>
	<body>
		<h1>Ladrillos</h1>
		<div>
			Puntos: <span id="puntos">0</span> · Vidas: <span id="vidas">3</span>
		</div>
		<canvas id="lienzo" width="480" height="600"></canvas>
		<script>
			// aquí irá todo el código del juego
		</script>
	</body>
</html>
```

He elegido un canvas vertical de 480 por 600 píxeles porque para este tipo de juego es la proporción más natural. Necesitas espacio vertical para que la pelota tenga recorrido entre la pared de ladrillos y la paleta. Las proporciones horizontales típicas de un Snake o un Pong harían que la pelota cruce la pantalla demasiado deprisa.

## El estado del juego

El estado tiene cuatro piezas: la pelota con su posición y velocidad, la paleta con su posición horizontal, un array de ladrillos con su posición y un flag de si están vivos, y los marcadores de puntos y vidas.

```javascript
const ANCHO = 480;
const ALTO = 600;
const ANCHO_PALETA = 80;
const ALTO_PALETA = 12;
const TAMANO_PELOTA = 10;
const FILAS_LADRILLOS = 5;
const COLUMNAS_LADRILLOS = 8;
const ANCHO_LADRILLO = 54;
const ALTO_LADRILLO = 18;
const MARGEN_LADRILLOS = 6;

let pelota = { x: 0, y: 0, vx: 0, vy: 0 };
let paleta = { x: ANCHO / 2 - ANCHO_PALETA / 2 };
let ladrillos = [];
let puntos = 0;
let vidas = 3;
let pegada = true;
```

Aquí hay una variable que conviene explicar: `pegada`. Es un booleano que indica si la pelota está pegada a la paleta esperando a ser lanzada, o si ya está en movimiento. Al inicio de cada vida la pelota empieza pegada a la paleta y se mueve con ella. Cuando el jugador pulsa espacio o hace click, se despega y empieza el juego. Es una mecánica clásica del Breakout y Arkanoid originales que conviene respetar.

## Generar los ladrillos

Los ladrillos son una rejilla regular en la parte superior de la pantalla. Para crearlos basta con dos bucles anidados que generen una entrada en el array por cada combinación de fila y columna.

```javascript
function generarLadrillos() {
	ladrillos = [];
	const colores = ["#e74c3c", "#e67e22", "#f1c40f", "#27ae60", "#3498db"];
	const offsetX =
		(ANCHO -
			(COLUMNAS_LADRILLOS * (ANCHO_LADRILLO + MARGEN_LADRILLOS) -
				MARGEN_LADRILLOS)) /
		2;
	const offsetY = 60;

	for (let f = 0; f < FILAS_LADRILLOS; f++) {
		for (let c = 0; c < COLUMNAS_LADRILLOS; c++) {
			ladrillos.push({
				x: offsetX + c * (ANCHO_LADRILLO + MARGEN_LADRILLOS),
				y: offsetY + f * (ALTO_LADRILLO + MARGEN_LADRILLOS),
				color: colores[f],
				puntos: (FILAS_LADRILLOS - f) * 10,
				vivo: true,
			});
		}
	}
}
```

Cada ladrillo tiene su posición, su color, una puntuación que da al ser destruido y un flag `vivo` que dice si todavía está en pantalla. He hecho que las filas superiores valgan más puntos que las inferiores, que es la convención clásica del juego: los ladrillos más difíciles de alcanzar (los que están arriba, escondidos detrás de los demás) recompensan más al jugador. El cálculo de `offsetX` puede parecer farragoso pero solo está centrando la rejilla horizontalmente: calcula el ancho total que ocuparán todas las columnas con sus márgenes y reparte el espacio sobrante a izquierda y derecha por igual.

## Mover la pelota y rebotes en bordes

El movimiento de la pelota es esencialmente igual que en Pong. La diferencia es que ahora rebota contra tres lados (izquierdo, derecho y superior) y por el cuarto (inferior) la pelota se sale y el jugador pierde una vida.

```javascript
function actualizarPelota() {
	if (pegada) {
		pelota.x = paleta.x + ANCHO_PALETA / 2 - TAMANO_PELOTA / 2;
		pelota.y = ALTO - ALTO_PALETA - TAMANO_PELOTA - 5;
		return;
	}

	pelota.x += pelota.vx;
	pelota.y += pelota.vy;

	if (pelota.x < 0) {
		pelota.x = 0;
		pelota.vx = -pelota.vx;
	}
	if (pelota.x + TAMANO_PELOTA > ANCHO) {
		pelota.x = ANCHO - TAMANO_PELOTA;
		pelota.vx = -pelota.vx;
	}
	if (pelota.y < 0) {
		pelota.y = 0;
		pelota.vy = -pelota.vy;
	}
	if (pelota.y > ALTO) {
		perderVida();
	}
}
```

Si la pelota está pegada, no se mueve por su cuenta sino que se ancla a la posición de la paleta. Esto es lo que hace que la pelota acompañe a la paleta cuando el jugador la mueve antes de lanzar. En el momento en que el jugador lanza, `pegada` se vuelve `false` y la pelota empieza a moverse con su propia velocidad.

## Colisión con la paleta

La colisión con la paleta funciona exactamente igual que en Pong. La única diferencia es que la paleta está abajo y solo nos importa el rebote desde arriba, no desde los lados.

```javascript
function comprobarColisionPaleta() {
	const paletaY = ALTO - ALTO_PALETA - 10;
	if (
		pelota.x < paleta.x + ANCHO_PALETA &&
		pelota.x + TAMANO_PELOTA > paleta.x &&
		pelota.y + TAMANO_PELOTA > paletaY &&
		pelota.y < paletaY + ALTO_PALETA &&
		pelota.vy > 0
	) {
		pelota.y = paletaY - TAMANO_PELOTA;
		const centroPaleta = paleta.x + ANCHO_PALETA / 2;
		const centroPelota = pelota.x + TAMANO_PELOTA / 2;
		const offset = (centroPelota - centroPaleta) / (ANCHO_PALETA / 2);
		const velocidad = Math.sqrt(pelota.vx ** 2 + pelota.vy ** 2);
		const angulo = offset * (Math.PI / 3);
		pelota.vx = velocidad * Math.sin(angulo);
		pelota.vy = -velocidad * Math.cos(angulo);
	}
}
```

Aquí hago algo más sofisticado que en Pong. En lugar de cambiar `vy` simplemente, recalculo la dirección entera de la pelota usando trigonometría. La idea es que el ángulo de salida dependa de en qué punto de la paleta golpeó la pelota: si golpea en el centro, sale recta hacia arriba; si golpea en el extremo izquierdo, sale con un ángulo de hasta sesenta grados hacia la izquierda; si golpea en el extremo derecho, sale con sesenta grados hacia la derecha.

La constante `Math.PI / 3` es sesenta grados expresados en radianes. Si quieres que el rango de ángulos sea más estrecho (rebotes más predecibles), reduce ese valor. Si lo quieres más amplio (rebotes más extremos), súbelo. He puesto sesenta grados porque es el clásico de los juegos arcade de la época y da control suficiente al jugador sin que la pelota pueda salir casi horizontal y volverse incontrolable.

## Colisión con los ladrillos

Aquí está el corazón nuevo del juego respecto a Pong. La pelota tiene que colisionar contra todos los ladrillos vivos, y cuando golpea uno, hay que destruirlo y rebotar.

```javascript
function comprobarColisionLadrillos() {
	for (const l of ladrillos) {
		if (!l.vivo) continue;
		if (
			pelota.x < l.x + ANCHO_LADRILLO &&
			pelota.x + TAMANO_PELOTA > l.x &&
			pelota.y < l.y + ALTO_LADRILLO &&
			pelota.y + TAMANO_PELOTA > l.y
		) {
			l.vivo = false;
			puntos += l.puntos;

			const centroPelota = {
				x: pelota.x + TAMANO_PELOTA / 2,
				y: pelota.y + TAMANO_PELOTA / 2,
			};
			const centroLadrillo = {
				x: l.x + ANCHO_LADRILLO / 2,
				y: l.y + ALTO_LADRILLO / 2,
			};
			const dx =
				Math.abs(centroPelota.x - centroLadrillo.x) - ANCHO_LADRILLO / 2;
			const dy =
				Math.abs(centroPelota.y - centroLadrillo.y) - ALTO_LADRILLO / 2;

			if (dx > dy) {
				pelota.vx = -pelota.vx;
			} else {
				pelota.vy = -pelota.vy;
			}
			return;
		}
	}
}
```

Lo bonito aquí es decidir si la pelota rebotó en un lateral o en la parte superior/inferior del ladrillo. Sin esa distinción, una pelota que viene en diagonal podría hacer rebotes raros que no se corresponden con la geometría real. La técnica que uso es comparar las distancias del centro de la pelota a los bordes del ladrillo en cada eje. Si la diferencia horizontal es mayor que la vertical, la pelota golpeó por el lateral (rebote horizontal). Si es al revés, golpeó por arriba o por abajo (rebote vertical). Es una heurística sencilla que funciona muy bien en la práctica para rectángulos de proporción razonable.

El `return` al final del bloque es importante: solo procesamos un ladrillo por fotograma. Sin él, una pelota muy rápida podría golpear dos ladrillos al mismo tiempo y rebotar dos veces, anulando el rebote y atravesando la pared. Con el `return`, garantizamos que el rebote es siempre limpio.

## Mover la paleta

La paleta se controla con las flechas izquierda y derecha o con A y D. Misma lógica que en Pong, pero horizontal en lugar de vertical.

```javascript
const teclas = { izquierda: false, derecha: false };

document.addEventListener("keydown", (e) => {
	if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
		teclas.izquierda = true;
	if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
		teclas.derecha = true;
	if (e.key === " " && pegada) lanzarPelota();
});

document.addEventListener("keyup", (e) => {
	if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A")
		teclas.izquierda = false;
	if (e.key === "ArrowRight" || e.key === "d" || e.key === "D")
		teclas.derecha = false;
});

function moverPaleta() {
	const VELOCIDAD = 7;
	if (teclas.izquierda) paleta.x -= VELOCIDAD;
	if (teclas.derecha) paleta.x += VELOCIDAD;
	paleta.x = Math.max(0, Math.min(ANCHO - ANCHO_PALETA, paleta.x));
}

function lanzarPelota() {
	pegada = false;
	pelota.vx = (Math.random() - 0.5) * 4;
	pelota.vy = -5;
}
```

La función `lanzarPelota` despega la pelota de la paleta y le da una velocidad inicial. La velocidad horizontal es ligeramente aleatoria para que cada saque sea distinto, y la velocidad vertical es siempre hacia arriba.

## Perder y reiniciar

Cuando la pelota se sale por debajo, el jugador pierde una vida. Si todavía le quedan vidas, la pelota vuelve a pegarse a la paleta para empezar de nuevo. Si no, fin del juego.

```javascript
function perderVida() {
	vidas--;
	pegada = true;
	pelota.vx = 0;
	pelota.vy = 0;
	if (vidas <= 0) {
		setTimeout(() => alert(`Fin del juego. Puntos: ${puntos}`), 100);
		reiniciarJuego();
	}
}

function reiniciarJuego() {
	puntos = 0;
	vidas = 3;
	pegada = true;
	generarLadrillos();
}
```

También hay que comprobar si el jugador ha ganado, lo que ocurre cuando todos los ladrillos están muertos. Esto se mira en cada fotograma después del bucle de colisiones.

```javascript
function comprobarVictoria() {
	if (ladrillos.every((l) => !l.vivo)) {
		setTimeout(() => alert(`¡Nivel completado! Puntos: ${puntos}`), 100);
		reiniciarJuego();
	}
}
```

## Dibujar todo

La función de dibujado limpia el canvas y pinta la paleta, la pelota y todos los ladrillos vivos.

```javascript
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

function dibujar() {
	ctx.fillStyle = "#0f1115";
	ctx.fillRect(0, 0, ANCHO, ALTO);

	for (const l of ladrillos) {
		if (!l.vivo) continue;
		ctx.fillStyle = l.color;
		ctx.fillRect(l.x, l.y, ANCHO_LADRILLO, ALTO_LADRILLO);
	}

	ctx.fillStyle = "#e8e8e8";
	ctx.fillRect(paleta.x, ALTO - ALTO_PALETA - 10, ANCHO_PALETA, ALTO_PALETA);
	ctx.fillRect(pelota.x, pelota.y, TAMANO_PELOTA, TAMANO_PELOTA);
}
```

## El bucle principal

Igual que en Pong, usamos `requestAnimationFrame` para sincronizar el bucle con la frecuencia de refresco de la pantalla.

```javascript
function bucle() {
	moverPaleta();
	actualizarPelota();
	comprobarColisionPaleta();
	comprobarColisionLadrillos();
	comprobarVictoria();
	dibujar();
	document.getElementById("puntos").textContent = puntos;
	document.getElementById("vidas").textContent = vidas;
	requestAnimationFrame(bucle);
}

generarLadrillos();
bucle();
```

Y con esto el juego ya funciona. Tienes una paleta que se mueve, una pelota que rebota contra los bordes y los ladrillos, una pared que se va destruyendo y un sistema de vidas. Todo en menos de doscientas líneas de código, que es bastante poco para un juego con esta complejidad aparente.

## Cosas que se pueden añadir

Las posibilidades a partir de aquí son enormes. Power-ups que aparecen al destruir ciertos ladrillos: una paleta más grande, una segunda pelota, un láser que dispara desde la paleta. Ladrillos especiales que necesitan dos golpes para romperse. Niveles diseñados a mano con patrones de ladrillos en forma de letra, dibujo o paisaje. Aceleración progresiva de la pelota a medida que se rompen más ladrillos. Sonido al rebotar y al destruir. Una pantalla de inicio. Un sistema de vidas extra cada cierta puntuación. Y, por supuesto, cuando se completa un nivel pasar al siguiente con una pared distinta en lugar de reiniciar.

La mayoría de estas mejoras son fáciles de añadir sobre el esqueleto que tenemos. Los power-ups, por ejemplo, son simplemente otro array de objetos que caen desde los ladrillos destruidos y modifican el estado de la paleta o la pelota cuando son recogidos. Los niveles son matrices que reemplazan la generación uniforme actual. La aceleración progresiva es un multiplicador que se aplica a la velocidad de la pelota cada cierto número de ladrillos destruidos.

## El prototipo funcional

Aquí abajo dejo el juego completo y funcionando, con cinco filas de ladrillos de colores, control con teclado y soporte táctil para móvil (la paleta sigue al dedo deslizado en la mitad inferior de la pantalla), aceleración progresiva, niveles infinitos y una estética cuidada. Está todo aislado bajo un id propio para que no afecte al resto del blog.

**Otros tutoriales de la serie**: [2048](/juego-2048-tutorial/) · [Pong](/juego-pong-tutorial/) · [Serpiente](/juego-serpiente-tutorial/) · [Parejas](/juego-parejas-tutorial/).
