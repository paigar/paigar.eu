---
title: "Cómo programar el juego 2048 desde cero"
date: 2025-12-01
excerpt: "Un tutorial paso a paso para construir el clásico 2048 en una sola página web, sin frameworks ni dependencias. La gracia del proyecto está en una operación matemáticamente elegante que se aplica cuatro veces y resuelve todo el juego."
tags: [apuntes, juegos, javascript]
image: juego-2048.png
image_alt: "Cuadrícula de cuatro por cuatro casillas con números potencia de dos en tonos cálidos sobre fondo claro, vista cenital ligeramente inclinada con efecto de profundidad"
prototype: 2048
---

2048 es uno de esos juegos que parecen sencillos hasta que te pones a programarlos y descubres que tienen una elegancia matemática bastante bonita. La mecánica básica es conocida: una cuadrícula de cuatro por cuatro casillas, números que son potencias de dos, y un movimiento que desplaza todas las fichas en una dirección haciendo que las iguales adyacentes se fusionen en una sola que vale el doble. Empiezas con dos fichas de valor dos y el objetivo, en teoría, es llegar a una ficha con el número 2048. En la práctica, cuando llegas a 2048 sigues jugando porque ya estás enganchado.

En este artículo voy a explicar cómo construirlo paso a paso en HTML, CSS y JavaScript, sin frameworks ni dependencias externas. Como pasaba con el tutorial de Snake del otro día, todo cabe en un único archivo y al final del artículo dejo el prototipo entero funcionando. La diferencia respecto a Snake es que aquí no hay bucle de juego en tiempo real ni animaciones constantes. El juego solo reacciona cuando el jugador pulsa una tecla, y todo el trabajo interesante ocurre dentro de esa reacción.

## La idea general antes de tocar código

Antes de programar nada conviene tener claro qué hace exactamente el juego cuando el jugador pulsa una flecha. Imagina que pulsas la flecha izquierda. Todas las fichas se desplazan hacia la izquierda hasta chocar con el borde o con otra ficha. Si en el camino una ficha encuentra otra del mismo valor, se fusionan en una sola que vale el doble, y la nueva ficha sigue desplazándose si todavía hay sitio. Después del movimiento aparece una nueva ficha (de valor dos casi siempre, ocasionalmente de valor cuatro) en una casilla vacía elegida al azar. Y se vuelve a esperar a la siguiente pulsación.

La gracia matemática de 2048 está en darse cuenta de que las cuatro direcciones posibles son en realidad la misma operación. Mover hacia la derecha es lo mismo que mover hacia la izquierda si antes inviertes cada fila. Mover hacia arriba es lo mismo que mover hacia la izquierda si antes transpones la matriz (cambias filas por columnas). Y mover hacia abajo combina las dos transformaciones anteriores. Esto significa que solo necesitamos programar bien el movimiento hacia la izquierda. Los otros tres se resuelven aplicándolo después de transformar la matriz, y deshaciendo la transformación al final. Es uno de esos diseños que cuando los entiendes te dan un pequeño placer.

## El esqueleto HTML y CSS

Empezamos por la estructura de la página. A diferencia de Snake, aquí no vamos a usar `<canvas>` para dibujar. El tablero de 2048 son dieciséis cuadrados con números, y eso se hace mucho más limpio con HTML normal y CSS. Cada casilla será un `<div>` y la cuadrícula entera la organizamos con CSS Grid.

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<title>2048</title>
		<style>
			body {
				display: flex;
				flex-direction: column;
				align-items: center;
				background: #faf8ef;
				font-family: system-ui, sans-serif;
			}
			.tablero {
				display: grid;
				grid-template-columns: repeat(4, 80px);
				grid-template-rows: repeat(4, 80px);
				gap: 10px;
				padding: 10px;
				background: #bbada0;
				border-radius: 6px;
			}
			.casilla {
				background: #cdc1b4;
				border-radius: 4px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 2rem;
				font-weight: bold;
				color: #776e65;
			}
		</style>
	</head>
	<body>
		<h1>2048</h1>
		<div>Puntuación: <span id="puntuacion">0</span></div>
		<div class="tablero" id="tablero"></div>
		<script>
			// aquí irá todo el código del juego
		</script>
	</body>
</html>
```

Con esto ya tenemos la base visual. Falta rellenar la cuadrícula con dieciséis casillas y darle a cada número un color distinto, pero eso lo haremos en el código JavaScript de manera dinámica para que cada movimiento actualice el tablero entero sin tener que escribir cada casilla a mano.

## El estado del juego

El estado de 2048 es muy simple: una matriz de cuatro filas por cuatro columnas, donde cada celda tiene un número o un cero (que representa una casilla vacía). Y la puntuación.

```javascript
let tablero = [
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
];
let puntuacion = 0;
```

Para empezar la partida hay que colocar dos fichas iniciales en posiciones aleatorias del tablero. Como la operación de añadir una ficha la vamos a usar también después de cada movimiento, conviene tenerla como función desde el principio.

```javascript
function añadirFicha() {
	const vacias = [];
	for (let f = 0; f < 4; f++) {
		for (let c = 0; c < 4; c++) {
			if (tablero[f][c] === 0) vacias.push({ f, c });
		}
	}
	if (vacias.length === 0) return;
	const elegida = vacias[Math.floor(Math.random() * vacias.length)];
	tablero[elegida.f][elegida.c] = Math.random() < 0.9 ? 2 : 4;
}
```

La función recorre todas las casillas, recopila las que están vacías, elige una al azar y le pone un dos (con un noventa por ciento de probabilidad) o un cuatro (con un diez por ciento). Esa proporción es la que usa el juego original y le da al juego su ritmo característico: la mayor parte del tiempo aparecen doses, y de vez en cuando un cuatro inesperado.

## La operación clave: mover una fila hacia la izquierda

Aquí está el corazón del juego. La operación que transforma una sola fila cuando se desplaza hacia la izquierda. Una fila es un array de cuatro números, y queremos convertir, por ejemplo, `[2, 0, 2, 4]` en `[4, 4, 0, 0]`. Vamos por partes.

Primero, eliminamos los ceros para juntar todas las fichas. Eso convierte `[2, 0, 2, 4]` en `[2, 2, 4]`. Después recorremos el array fusionando las casillas iguales que sean consecutivas. Cuando encontramos dos números iguales seguidos, los reemplazamos por su suma y saltamos al siguiente. Eso convierte `[2, 2, 4]` en `[4, 4]`. Finalmente rellenamos con ceros hasta tener cuatro elementos. Resultado: `[4, 4, 0, 0]`.

```javascript
function moverFilaIzquierda(fila) {
	let sinCeros = fila.filter((n) => n !== 0);
	for (let i = 0; i < sinCeros.length - 1; i++) {
		if (sinCeros[i] === sinCeros[i + 1]) {
			sinCeros[i] *= 2;
			puntuacion += sinCeros[i];
			sinCeros.splice(i + 1, 1);
		}
	}
	while (sinCeros.length < 4) sinCeros.push(0);
	return sinCeros;
}
```

Detalle importante: cada vez que fusionamos dos fichas, sumamos el valor de la nueva ficha a la puntuación. Si fusionas dos cuatros, ganas ocho puntos, igual que el valor de la ficha resultante. Esa es la regla original del juego, y es lo que hace que ir consiguiendo fichas grandes valga la pena en términos de puntuación.

Otro detalle: dentro del bucle solo fusionamos cada par una vez. Después de fusionar las posiciones `i` e `i+1`, hacemos `splice` para eliminar la segunda y seguimos. Esto evita que tres números iguales seguidos como `[2, 2, 2]` se conviertan en `[8]`, que sería incorrecto. El comportamiento esperado es que solo se fusionen los dos primeros, y el tercero se quede como está. El resultado correcto es `[4, 2]`.

## Las cuatro direcciones a partir de una sola

Ahora viene la parte elegante. Como decía al principio, las cuatro direcciones son la misma operación con transformaciones antes y después.

```javascript
function moverIzquierda() {
	for (let f = 0; f < 4; f++) {
		tablero[f] = moverFilaIzquierda(tablero[f]);
	}
}

function moverDerecha() {
	for (let f = 0; f < 4; f++) {
		tablero[f] = moverFilaIzquierda(tablero[f].reverse()).reverse();
	}
}

function transponer() {
	const nuevo = [
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];
	for (let f = 0; f < 4; f++) {
		for (let c = 0; c < 4; c++) {
			nuevo[c][f] = tablero[f][c];
		}
	}
	tablero = nuevo;
}

function moverArriba() {
	transponer();
	moverIzquierda();
	transponer();
}

function moverAbajo() {
	transponer();
	moverDerecha();
	transponer();
}
```

Mover a la derecha es invertir cada fila, mover a la izquierda y volver a invertir. Mover arriba es transponer la matriz, mover a la izquierda y volver a transponer. Mover abajo es transponer, mover a la derecha y volver a transponer. Cuatro direcciones, una sola operación real, tres transformaciones reversibles. Es el tipo de código que parece magia hasta que lo entiendes y a partir de ahí parece obvio.

## Detectar movimientos válidos y fin de partida

Hay un detalle que conviene cuidar: si el jugador pulsa una flecha en una dirección donde nada se puede mover, no debería aparecer una ficha nueva. Por ejemplo, si todas las casillas de la columna izquierda están ocupadas y todas las fichas ya están pegadas a ese lado sin posibilidad de fusión, pulsar izquierda no debería penalizar al jugador metiéndole una ficha aleatoria que igual le complica la vida.

Para detectarlo, comparamos el tablero antes y después del movimiento. Si son idénticos, el movimiento no era válido y no añadimos ficha nueva.

```javascript
function tablerosIguales(a, b) {
	for (let f = 0; f < 4; f++) {
		for (let c = 0; c < 4; c++) {
			if (a[f][c] !== b[f][c]) return false;
		}
	}
	return true;
}
```

Y para saber cuándo se acaba la partida: cuando no queda ninguna casilla vacía y ningún par de casillas adyacentes con el mismo valor. Es decir, cuando ningún movimiento posible cambiaría el estado del tablero. La forma más limpia de comprobarlo es probar mentalmente las cuatro direcciones sobre una copia del tablero y ver si alguna lo modifica.

```javascript
function partidaTerminada() {
	for (let f = 0; f < 4; f++) {
		for (let c = 0; c < 4; c++) {
			if (tablero[f][c] === 0) return false;
			if (c < 3 && tablero[f][c] === tablero[f][c + 1]) return false;
			if (f < 3 && tablero[f][c] === tablero[f + 1][c]) return false;
		}
	}
	return true;
}
```

Esta función comprueba directamente las dos condiciones: que haya casillas vacías o que haya pares iguales adyacentes en horizontal o vertical. Si no se cumple ninguna de las dos, la partida ha terminado.

## Capturar el teclado y unir todo

Ya tenemos todas las piezas. Falta conectarlas con un manejador de teclado y una función que pinte el tablero después de cada movimiento.

```javascript
document.addEventListener("keydown", (e) => {
	const antes = JSON.parse(JSON.stringify(tablero));
	if (e.key === "ArrowLeft") moverIzquierda();
	else if (e.key === "ArrowRight") moverDerecha();
	else if (e.key === "ArrowUp") moverArriba();
	else if (e.key === "ArrowDown") moverAbajo();
	else return;
	e.preventDefault();
	if (!tablerosIguales(antes, tablero)) {
		añadirFicha();
		pintar();
		if (partidaTerminada()) {
			// mostrar pantalla de fin de partida
		}
	}
});
```

El truco de `JSON.parse(JSON.stringify(...))` hace una copia profunda del tablero antes de moverlo, para poder compararlo después. No es la forma más eficiente del mundo, pero para una matriz de cuatro por cuatro es perfectamente razonable y se lee con claridad.

## Dibujar el tablero

Lo último es la función que pinta. Genera dieciséis divs dentro del contenedor del tablero, cada uno con su número (o vacío si la casilla es cero) y con un color de fondo distinto según el valor.

```javascript
function pintar() {
	const contenedor = document.getElementById("tablero");
	contenedor.innerHTML = "";
	const colores = {
		2: "#eee4da",
		4: "#ede0c8",
		8: "#f2b179",
		16: "#f59563",
		32: "#f67c5f",
		64: "#f65e3b",
		128: "#edcf72",
		256: "#edcc61",
		512: "#edc850",
		1024: "#edc53f",
		2048: "#edc22e",
	};
	for (let f = 0; f < 4; f++) {
		for (let c = 0; c < 4; c++) {
			const div = document.createElement("div");
			div.className = "casilla";
			const valor = tablero[f][c];
			if (valor !== 0) {
				div.textContent = valor;
				div.style.background = colores[valor] || "#3c3a32";
				if (valor > 4) div.style.color = "#f9f6f2";
			}
			contenedor.appendChild(div);
		}
	}
	document.getElementById("puntuacion").textContent = puntuacion;
}
```

Los colores son los del juego original. Las fichas pequeñas (dos y cuatro) van en tonos crema con texto oscuro, las medianas (de ocho a sesenta y cuatro) en tonos naranjas, las grandes (de ciento veintiocho en adelante) en tonos amarillos vivos, y todo lo que pase de cuatro lleva texto blanco para mantener la legibilidad. Es uno de esos detalles pequeños que separan un prototipo funcional de algo que da gusto mirar.

## Cosas que se pueden añadir

A partir del esqueleto que hemos construido se pueden añadir muchas mejoras. Animaciones de deslizamiento de las fichas usando transiciones CSS, que es lo que en el original le da ese tacto satisfactorio. Un botón de reiniciar partida. Soporte táctil para móviles, detectando gestos de deslizamiento en lugar de teclas. Guardar el récord en `localStorage` para que persista entre sesiones. Un modo de juego con cuadrícula más grande (cinco por cinco, seis por seis) para variar la dificultad. Un sistema de deshacer último movimiento, que requiere guardar el estado anterior antes de cada jugada.

Lo que no se puede ni se debe hacer es complicar el núcleo. La belleza de 2048 está exactamente en su simplicidad: cuatro flechas, una operación, una matriz de dieciséis casillas. Si añades demasiada cosa terminas teniendo otro juego que ya no es 2048. Lo que tiene es lo que tiene, y lo que tiene es justo lo necesario.

## El prototipo funcional

Aquí abajo dejo el juego completo y funcionando, con animaciones suaves de aparición de fichas, soporte para flechas y WASD, controles táctiles por gestos para móvil y un récord que se mantiene durante la sesión. Está todo aislado bajo un id propio para que no afecte al resto del blog.

**Otros tutoriales de la serie**: [Pong](/juego-pong-tutorial/) · [Serpiente](/juego-serpiente-tutorial/) · [Parejas](/juego-parejas-tutorial/) · [Ladrillos](/juego-ladrillos-tutorial/).
