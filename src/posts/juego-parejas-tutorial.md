---
title: "Cómo programar el juego de parejas desde cero"
date: 2026-02-18
excerpt: "Un tutorial paso a paso para construir el clásico juego de parejas de cartas en una sola página web. Sin canvas, sin frameworks, solo HTML, CSS y un poco de JavaScript bien organizado. Probablemente el proyecto más sencillo de toda la serie."
tags: [apuntes, juegos, javascript]
image: "/img/juego-parejas.png"
image_alt: "Vista cenital de una mesa de madera con varias cartas cuadradas boca abajo dispuestas en una rejilla regular y un par de ellas levantadas mostrando dibujos infantiles de animales"
---

El juego de parejas, también conocido como Memory o emparejamiento, es probablemente el videojuego más sencillo de toda esta serie. No tiene física, no tiene movimiento continuo, no tiene matrices que se transforman, no tiene rebotes ni colisiones. Tiene un puñado de cartas boca abajo, las giras de dos en dos buscando parejas, y cuando aciertas se quedan visibles. Cuando aciertas todas, has ganado. Eso es todo. Y precisamente por ser tan sencillo es un proyecto perfecto para alguien que está empezando, porque te permite concentrarte en cómo se organiza un juego sin que la mecánica te pida un esfuerzo intelectual grande.

En este tutorial vamos a construirlo en HTML, CSS y JavaScript, sin frameworks ni dependencias. La gran diferencia respecto a Snake, 2048 o Pong es que aquí no usamos `<canvas>` para nada. Todo el juego se construye con elementos HTML normales y se anima con transiciones de CSS, lo cual lo hace mucho más cercano al desarrollo web cotidiano que a la programación de videojuegos clásica. Si lo tuyo es maquetar páginas, este tutorial te va a parecer especialmente familiar.

## La idea general antes de tocar código

El juego de parejas consiste en una rejilla de cartas, normalmente entre 12 y 24, donde cada carta tiene una pareja idéntica. Las cartas empiezan boca abajo, mostrando un reverso uniforme. El jugador hace click en una carta para girarla y verla. Después hace click en otra. Si las dos cartas son iguales, se quedan boca arriba. Si no lo son, después de un breve momento para que el jugador memorice las posiciones, se vuelven a girar boca abajo. El juego termina cuando todas las parejas están descubiertas.

La parte interesante de programarlo no está en el juego en sí, sino en cómo gestionar el estado entre clicks: hay que distinguir entre la primera carta seleccionada, la segunda carta seleccionada, los momentos donde el jugador no debería poder hacer click (mientras se están comparando dos cartas, por ejemplo) y las cartas que ya están emparejadas y deben quedar bloqueadas. Todo eso son cuatro o cinco estados sencillos pero hay que tenerlos claros desde el principio para que el código no se enrede.

## El esqueleto HTML y CSS

A diferencia de los tutoriales anteriores, aquí no hay canvas. Cada carta es un `<div>` con dos caras, anverso y reverso, que se gira con una transformación CSS de tres dimensiones. Ese efecto del giro es uno de los detalles que más bonito quedan en este tipo de juegos y, sorprendentemente, no requiere prácticamente JavaScript: se hace casi todo con CSS.

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<title>Parejas</title>
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
				gap: 10px;
			}
			.carta {
				width: 80px;
				height: 80px;
				perspective: 600px;
				cursor: pointer;
			}
			.carta-interior {
				position: relative;
				width: 100%;
				height: 100%;
				transition: transform 0.5s;
				transform-style: preserve-3d;
			}
			.carta.girada .carta-interior {
				transform: rotateY(180deg);
			}
			.cara {
				position: absolute;
				width: 100%;
				height: 100%;
				backface-visibility: hidden;
				border-radius: 6px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 2rem;
			}
			.reverso {
				background: #bbada0;
			}
			.anverso {
				background: #fff;
				transform: rotateY(180deg);
			}
		</style>
	</head>
	<body>
		<h1>Parejas</h1>
		<div>Movimientos: <span id="movimientos">0</span></div>
		<div class="tablero" id="tablero"></div>
		<script>
			// aquí irá todo el código del juego
		</script>
	</body>
</html>
```

El truco visual está en cuatro propiedades CSS combinadas: `perspective` en el contenedor exterior, `transform-style: preserve-3d` en el contenedor interior, `backface-visibility: hidden` en cada cara y un `transform: rotateY(180deg)` que se aplica al contenedor interior cuando la carta tiene la clase `girada`. Lo que ocurre con esto es que el navegador trata la carta como un objeto tridimensional con dos lados, y al girarlo ciento ochenta grados sobre su eje vertical, la cara que estaba escondida pasa al frente y la que estaba al frente se esconde. Si nunca habías hecho esto antes, te recomiendo que lo escribas en una página vacía y juegues con los valores: es uno de esos efectos que parecen complicados y resulta que están a tres líneas de CSS de distancia.

## El estado del juego

El estado del juego es un array de cartas, donde cada carta tiene un símbolo (lo que muestra cuando está girada) y un estado: si está girada o no, y si ya está emparejada. Más una variable para llevar la cuenta de los movimientos del jugador.

```javascript
const SIMBOLOS = ["🐶", "🐱", "🦊", "🐻", "🐼", "🐨", "🦁", "🐸"];

let cartas = [];
let primeraCarta = null;
let segundaCarta = null;
let bloqueado = false;
let movimientos = 0;
```

Las variables `primeraCarta` y `segundaCarta` guardan referencias a las cartas que el jugador acaba de levantar. La variable `bloqueado` evita que el jugador pueda seguir levantando cartas mientras se está comprobando una pareja: durante el segundo de espera entre que levanta dos cartas que no coinciden y vuelven a girarse, no debe poder tocar nada más. Sin esa variable, un jugador rápido podría hacer click en una tercera carta antes de que las dos primeras se hayan resuelto, y el código se confundiría.

## Inicializar el juego

Para empezar una partida necesitamos crear las parejas, mezclarlas y pintarlas en pantalla en orden aleatorio. Es la operación más larga del juego y la única que tiene un poquito de chicha, pero tampoco mucha.

```javascript
function inicializar() {
	cartas = [];
	primeraCarta = null;
	segundaCarta = null;
	bloqueado = false;
	movimientos = 0;

	const parejas = [...SIMBOLOS, ...SIMBOLOS];
	parejas.sort(() => Math.random() - 0.5);

	parejas.forEach((simbolo, indice) => {
		cartas.push({
			indice,
			simbolo,
			girada: false,
			emparejada: false,
		});
	});

	pintar();
	actualizarMarcador();
}
```

La línea `[...SIMBOLOS, ...SIMBOLOS]` duplica el array de símbolos para tener dieciséis cartas (ocho parejas). Después, `sort(() => Math.random() - 0.5)` mezcla el array. Este truco de mezcla no es matemáticamente perfecto —los matemáticos prefieren el algoritmo de Fisher-Yates—, pero para un juego como este es más que suficiente y se escribe en una sola línea. Si te interesa la pureza estadística, busca _Fisher-Yates shuffle_ y lo aplicas en lugar de esta línea. Aquí no notarás la diferencia.

## Pintar el tablero

La función que pinta el tablero recorre el array de cartas y crea un `<div>` para cada una, con su anverso, su reverso y su comportamiento al hacer click.

```javascript
function pintar() {
	const tablero = document.getElementById("tablero");
	tablero.innerHTML = "";

	cartas.forEach((carta) => {
		const div = document.createElement("div");
		div.className = "carta";
		if (carta.girada || carta.emparejada) div.classList.add("girada");
		div.dataset.indice = carta.indice;

		div.innerHTML = `
      <div class="carta-interior">
        <div class="cara reverso">?</div>
        <div class="cara anverso">${carta.simbolo}</div>
      </div>
    `;

		div.addEventListener("click", () => clickCarta(carta));
		tablero.appendChild(div);
	});
}
```

Lo más interesante aquí es la lógica de la clase `girada`. Una carta se muestra girada si su estado lo indica (porque el jugador acaba de hacer click en ella) o si ya está emparejada (porque su pareja ya fue encontrada y queda visible). Esto significa que la misma clase CSS sirve para los dos estados visuales, simplificando el código.

## La lógica del click

Aquí está el núcleo del juego. Cuando el jugador hace click en una carta, hay que decidir qué pasa, y eso depende del estado actual.

```javascript
function clickCarta(carta) {
	if (bloqueado) return;
	if (carta.emparejada) return;
	if (carta === primeraCarta) return;

	carta.girada = true;
	pintar();

	if (!primeraCarta) {
		primeraCarta = carta;
		return;
	}

	segundaCarta = carta;
	bloqueado = true;
	movimientos++;
	actualizarMarcador();

	if (primeraCarta.simbolo === segundaCarta.simbolo) {
		primeraCarta.emparejada = true;
		segundaCarta.emparejada = true;
		resetSeleccion();
		if (cartas.every((c) => c.emparejada)) {
			setTimeout(
				() => alert(`¡Has ganado en ${movimientos} movimientos!`),
				400,
			);
		}
	} else {
		setTimeout(() => {
			primeraCarta.girada = false;
			segundaCarta.girada = false;
			pintar();
			resetSeleccion();
		}, 900);
	}
}

function resetSeleccion() {
	primeraCarta = null;
	segundaCarta = null;
	bloqueado = false;
}
```

La función empieza con tres comprobaciones que cortan el flujo si el click no debería tener efecto. Si el juego está bloqueado (porque hay una comprobación en curso), si la carta ya está emparejada o si es la misma carta que el jugador acaba de levantar, no hacemos nada. Estas tres líneas son fundamentales, porque sin ellas el código se rompe en cuanto el jugador hace clicks rápidos o desordenados.

Después gira la carta y comprueba si es la primera o la segunda del turno. Si es la primera, simplemente la guarda y termina. Si es la segunda, compara los símbolos. Si coinciden, marca ambas como emparejadas. Si no coinciden, espera 900 milisegundos y las vuelve a girar boca abajo, dejando al jugador tiempo suficiente para memorizar dónde estaban.

Cuando las dos cartas coinciden, además, comprobamos si ya están todas emparejadas. Si lo están, mostramos el mensaje de victoria. Esto se hace después de un pequeño retraso para que el jugador tenga tiempo de ver la última pareja girarse antes de que aparezca el mensaje.

## Actualizar el marcador

Esta es la función más sencilla del tutorial entero, pero conviene tenerla aparte para poder llamarla desde varios sitios.

```javascript
function actualizarMarcador() {
	document.getElementById("movimientos").textContent = movimientos;
}

inicializar();
```

Con la última línea arrancamos el juego al cargar la página. Y con esto, ya tenemos un juego de parejas funcional. Diecisiete líneas de CSS para el efecto del giro, unas cuarenta de JavaScript para toda la lógica, y una página HTML mínima. Suma todo y no llegas a las cien líneas. Una de las cosas que más me gusta de este proyecto es justamente esa: el cociente entre lo divertido que resulta jugarlo y lo poco que cuesta programarlo es enorme.

## Cosas que se pueden añadir

A partir del esqueleto que hemos construido, hay muchas mejoras posibles. Un cronómetro que mida cuánto tarda el jugador en completar una partida. Un sistema de niveles con tableros más grandes y más parejas. Diferentes conjuntos de símbolos: animales, frutas, banderas, elementos químicos. Un sonido suave cuando se gira una carta y otro distinto cuando se completa una pareja. Un récord de mejor tiempo o menor número de movimientos guardado en `localStorage`. Un modo de dos jugadores donde los jugadores se turnan y el que más parejas encuentra gana. Animaciones más elaboradas: que las cartas emparejadas hagan un pequeño efecto de celebración antes de quedarse fijas.

Todas son mejoras razonables que caben en pocas líneas adicionales. Pero como pasa con todos los juegos de esta serie, lo importante es que lo básico ya funciona. A partir de aquí, lo que añadas o no es decisión tuya según las ganas que tengas y el tiempo que quieras dedicarle.

## El prototipo funcional

Aquí abajo dejo el juego completo y funcionando, con un cronómetro que se inicia automáticamente al primer click, animación de celebración cuando se completa una pareja, un botón para empezar partida nueva y diseño adaptado para que funcione bien en móvil. Está todo aislado bajo un id propio para que no afecte al resto del blog.

<div id="memory-prototipo">
  <h3 class="memory-titulo">Parejas</h3>
  <div class="memory-marcadores">
    <div class="memory-marcador">
      <div class="memory-etiqueta">Tiempo</div>
      <div class="memory-valor" id="memory-tiempo">0:00</div>
    </div>
    <div class="memory-marcador">
      <div class="memory-etiqueta">Movimientos</div>
      <div class="memory-valor" id="memory-movimientos">0</div>
    </div>
    <div class="memory-marcador">
      <div class="memory-etiqueta">Parejas</div>
      <div class="memory-valor"><span id="memory-parejas">0</span>/8</div>
    </div>
  </div>
  <div class="memory-tablero" id="memory-tablero"></div>
  <button class="memory-boton" id="memory-reiniciar">Nueva partida</button>
</div>

<style>
#memory-prototipo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1rem;
  margin: 2rem 0;
  background: #faf8ef;
  border-radius: 8px;
  font-family: system-ui, -apple-system, sans-serif;
  color: #776e65;
}
#memory-prototipo .memory-titulo {
  margin: 0;
  font-weight: 700;
  font-size: 1.5rem;
  color: #776e65;
}
#memory-prototipo .memory-marcadores {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
#memory-prototipo .memory-marcador {
  background: #bbada0;
  color: #f9f6f2;
  border-radius: 4px;
  padding: 0.5rem 0.9rem;
  text-align: center;
  min-width: 70px;
}
#memory-prototipo .memory-etiqueta {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  opacity: 0.85;
}
#memory-prototipo .memory-valor {
  font-size: 1.2rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
#memory-prototipo .memory-tablero {
  display: grid;
  grid-template-columns: repeat(4, 70px);
  gap: 8px;
}
#memory-prototipo .memory-carta {
  width: 70px;
  height: 70px;
  perspective: 600px;
  cursor: pointer;
}
#memory-prototipo .memory-carta-interior {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s;
  transform-style: preserve-3d;
}
#memory-prototipo .memory-carta.girada .memory-carta-interior {
  transform: rotateY(180deg);
}
#memory-prototipo .memory-carta.emparejada .memory-carta-interior {
  animation: memory-celebrar 0.5s ease;
}
@keyframes memory-celebrar {
  0%, 100% { transform: rotateY(180deg) scale(1); }
  50% { transform: rotateY(180deg) scale(1.1); }
}
#memory-prototipo .memory-cara {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  user-select: none;
}
#memory-prototipo .memory-reverso {
  background: #bbada0;
  color: #f9f6f2;
  font-weight: 700;
}
#memory-prototipo .memory-anverso {
  background: #fff;
  transform: rotateY(180deg);
  border: 1px solid #e8dfd5;
}
#memory-prototipo .memory-carta.emparejada .memory-anverso {
  background: #d4e8c4;
  border-color: #a8d088;
}
#memory-prototipo .memory-boton {
  background: #8f7a66;
  color: #f9f6f2;
  border: none;
  border-radius: 4px;
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
#memory-prototipo .memory-boton:hover {
  background: #9f8a76;
}
@media (max-width: 400px) {
  #memory-prototipo .memory-tablero {
    grid-template-columns: repeat(4, 60px);
  }
  #memory-prototipo .memory-carta {
    width: 60px;
    height: 60px;
  }
  #memory-prototipo .memory-cara {
    font-size: 1.6rem;
  }
}
</style>

<script>
(() => {
  const contenedor = document.getElementById('memory-prototipo');
  if (!contenedor) return;
  const tablero = document.getElementById('memory-tablero');
  const elemTiempo = document.getElementById('memory-tiempo');
  const elemMovimientos = document.getElementById('memory-movimientos');
  const elemParejas = document.getElementById('memory-parejas');
  const botonReiniciar = document.getElementById('memory-reiniciar');

  const SIMBOLOS = ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🦁', '🐸'];

  let cartas, primeraCarta, segundaCarta, bloqueado, movimientos, parejasEncontradas;
  let tiempoInicio = null;
  let intervaloTiempo = null;

  function inicializar() {
    cartas = [];
    primeraCarta = null;
    segundaCarta = null;
    bloqueado = false;
    movimientos = 0;
    parejasEncontradas = 0;
    tiempoInicio = null;
    if (intervaloTiempo) {
      clearInterval(intervaloTiempo);
      intervaloTiempo = null;
    }
    elemTiempo.textContent = '0:00';

    const parejas = [...SIMBOLOS, ...SIMBOLOS];
    parejas.sort(() => Math.random() - 0.5);
    parejas.forEach((simbolo, indice) => {
      cartas.push({ indice, simbolo, girada: false, emparejada: false });
    });

    pintar();
    actualizarMarcadores();
  }

  function pintar() {
    tablero.innerHTML = '';
    cartas.forEach(carta => {
      const div = document.createElement('div');
      div.className = 'memory-carta';
      if (carta.girada || carta.emparejada) div.classList.add('girada');
      if (carta.emparejada) div.classList.add('emparejada');
      div.innerHTML = `
        <div class="memory-carta-interior">
          <div class="memory-cara memory-reverso">?</div>
          <div class="memory-cara memory-anverso">${carta.simbolo}</div>
        </div>
      `;
      div.addEventListener('click', () => clickCarta(carta));
      tablero.appendChild(div);
    });
  }

  function clickCarta(carta) {
    if (bloqueado) return;
    if (carta.emparejada) return;
    if (carta === primeraCarta) return;

    if (!tiempoInicio) iniciarCronometro();

    carta.girada = true;
    pintar();

    if (!primeraCarta) {
      primeraCarta = carta;
      return;
    }

    segundaCarta = carta;
    bloqueado = true;
    movimientos++;
    actualizarMarcadores();

    if (primeraCarta.simbolo === segundaCarta.simbolo) {
      primeraCarta.emparejada = true;
      segundaCarta.emparejada = true;
      parejasEncontradas++;
      actualizarMarcadores();
      pintar();
      resetSeleccion();
      if (parejasEncontradas === SIMBOLOS.length) {
        clearInterval(intervaloTiempo);
        setTimeout(() => {
          alert(`¡Completado en ${elemTiempo.textContent} y ${movimientos} movimientos!`);
        }, 600);
      }
    } else {
      setTimeout(() => {
        primeraCarta.girada = false;
        segundaCarta.girada = false;
        pintar();
        resetSeleccion();
      }, 900);
    }
  }

  function resetSeleccion() {
    primeraCarta = null;
    segundaCarta = null;
    bloqueado = false;
  }

  function iniciarCronometro() {
    tiempoInicio = Date.now();
    intervaloTiempo = setInterval(() => {
      const segundos = Math.floor((Date.now() - tiempoInicio) / 1000);
      const minutos = Math.floor(segundos / 60);
      const restantes = segundos % 60;
      elemTiempo.textContent = `${minutos}:${restantes.toString().padStart(2, '0')}`;
    }, 1000);
  }

  function actualizarMarcadores() {
    elemMovimientos.textContent = movimientos;
    elemParejas.textContent = parejasEncontradas;
  }

  botonReiniciar.addEventListener('click', inicializar);
  inicializar();
})();
</script>

**Otros tutoriales de la serie**: [2048](/juego-2048-tutorial/) · [Pong](/juego-pong-tutorial/) · [Serpiente](/juego-serpiente-tutorial/) · [Ladrillos](/juego-ladrillos-tutorial/).
