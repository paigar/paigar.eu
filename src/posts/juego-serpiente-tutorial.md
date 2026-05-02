---
title: "Cómo programar el juego de la serpiente desde cero"
date: 2026-03-10
excerpt: "Un tutorial paso a paso para construir el clásico Snake en una sola página web, sin frameworks, sin dependencias y sin más de doscientas líneas de código. Al final del artículo te dejo el prototipo funcional para que juegues."
tags: [apuntes, juegos, javascript, canvas]
image: "/img/juego-serpiente.png"
image_alt: "Pantalla de un viejo monitor mostrando una versión sencilla del juego de la serpiente con una serpiente verde sobre fondo oscuro y una manzana roja en una esquina"
---

El juego de la serpiente es uno de los proyectos clásicos para aprender a programar. Cabe en menos de doscientas líneas de código, no necesita librerías externas ni herramientas complicadas, y en el camino te obliga a tocar prácticamente todos los conceptos importantes de un programa interactivo: bucle de juego, gestión de estado, captura de eventos de teclado, detección de colisiones, dibujo en pantalla y puntuación. Es ese tipo de proyecto pequeño que enseña mucho, y que además da satisfacción inmediata porque al terminarlo tienes algo que se puede jugar de verdad.

En este artículo voy a explicar cómo construirlo paso a paso en HTML, CSS y JavaScript, sin frameworks de ningún tipo, sin compiladores, sin servidores. Solo un archivo `.html` que abres en tu navegador y ya está. Al final del artículo dejo el prototipo entero funcionando para que puedas jugarlo y, si te apetece, ver el código fuente y trastear con él.

## La idea general antes de tocar código

Antes de escribir una sola línea conviene tener claro qué es lo que vamos a construir. Un juego de la serpiente, en su esencia, consiste en una cuadrícula sobre la que se mueve una serpiente formada por segmentos cuadrados. La serpiente avanza automáticamente en una dirección, y el jugador puede cambiar esa dirección con las flechas del teclado. En la cuadrícula aparece una manzana en una posición aleatoria. Cuando la cabeza de la serpiente llega a la casilla donde está la manzana, esta desaparece, aparece otra en una nueva posición aleatoria y la serpiente crece un segmento. El juego termina si la serpiente choca contra los bordes del tablero o si se muerde a sí misma.

Conceptualmente, todo el juego se reduce a repetir el mismo paso una y otra vez, varias veces por segundo. Ese paso consiste en mover la serpiente una casilla en la dirección actual, comprobar si ha chocado contra algo, comprobar si ha comido la manzana y dibujar el resultado en pantalla. Esto se llama el _bucle de juego_, y es la pieza central de cualquier videojuego, desde el más sencillo hasta el más complejo. Si entiendes el bucle, entiendes la estructura. Lo demás son detalles.

## El esqueleto HTML y CSS

Empezamos por la página web que va a contener el juego. Es lo más sencillo de todo: un archivo HTML con un elemento `<canvas>` donde vamos a dibujar, un par de elementos para mostrar la puntuación y un poco de CSS para que tenga un aspecto decente. El `<canvas>` es un elemento del HTML pensado precisamente para dibujar gráficos mediante JavaScript, y es la herramienta natural para hacer este tipo de juegos.

```html
<!DOCTYPE html>
<html lang="es">
	<head>
		<meta charset="UTF-8" />
		<title>Snake</title>
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
		<h1>Snake</h1>
		<div>Puntuación: <span id="puntuacion">0</span></div>
		<canvas id="lienzo" width="400" height="400"></canvas>
		<script>
			// aquí irá todo el código del juego
		</script>
	</body>
</html>
```

Con esto ya tenemos un canvas negro de 400 por 400 píxeles centrado en la pantalla. Vamos a dibujar dentro de él una cuadrícula imaginaria de 20 por 20 casillas, cada una de 20 píxeles. Esa cuadrícula no la vamos a dibujar realmente, pero sí la vamos a usar mentalmente como sistema de coordenadas para colocar la serpiente y la manzana.

## El estado del juego

Lo siguiente es decidir qué información necesitamos guardar en cada momento para que el juego funcione. Esto se llama _estado del juego_, y para Snake es bastante sencillo. Necesitamos saber dónde está cada segmento de la serpiente, en qué dirección se mueve, dónde está la manzana, cuál es la puntuación y si la partida ha terminado. Lo representamos así:

```javascript
const TAMANO_CASILLA = 20;
const COLUMNAS = 20;
const FILAS = 20;

let serpiente = [
	{ x: 10, y: 10 },
	{ x: 9, y: 10 },
	{ x: 8, y: 10 },
];
let direccion = { x: 1, y: 0 };
let manzana = { x: 5, y: 5 };
let puntuacion = 0;
let terminado = false;
```

La serpiente es un array de objetos donde cada objeto representa un segmento con sus coordenadas en la cuadrícula. El primer elemento del array es siempre la cabeza, y los siguientes el cuerpo. La dirección la representamos como un vector con valores `x` e `y` que pueden ser uno, menos uno o cero. Por ejemplo, `{ x: 1, y: 0 }` significa que la serpiente se mueve hacia la derecha. Esto es muy cómodo porque permite calcular la siguiente posición de la cabeza simplemente sumando la dirección a la posición actual.

## Mover la serpiente

Mover la serpiente es probablemente lo más bonito conceptualmente del juego, y lo más sencillo si lo piensas bien. La idea es la siguiente: en cada paso del juego, calculamos dónde estaría la nueva cabeza, la añadimos al principio del array, y quitamos el último elemento. Así la serpiente se desplaza una casilla sin tener que mover todos los segmentos uno a uno. Cuando la serpiente come una manzana, hacemos lo mismo pero sin quitar el último elemento, y así crece.

```javascript
function paso() {
	if (terminado) return;

	const cabeza = serpiente[0];
	const nuevaCabeza = {
		x: cabeza.x + direccion.x,
		y: cabeza.y + direccion.y,
	};

	serpiente.unshift(nuevaCabeza);

	if (nuevaCabeza.x === manzana.x && nuevaCabeza.y === manzana.y) {
		puntuacion += 10;
		colocarManzana();
	} else {
		serpiente.pop();
	}
}
```

El método `unshift` añade un elemento al principio del array, y `pop` elimina el último. Ese pequeño truco evita tener que recorrer todos los segmentos en cada iteración, lo cual sería ineficiente si la serpiente fuera muy larga.

## Detectar colisiones

Una serpiente que se mueve sin parar pero nunca pierde no es un juego. Necesitamos comprobar dos tipos de colisiones: contra los bordes del tablero y contra el propio cuerpo de la serpiente. Las dos comprobaciones se hacen justo antes de añadir la nueva cabeza al array.

```javascript
const fueraDeLimites =
	nuevaCabeza.x < 0 ||
	nuevaCabeza.x >= COLUMNAS ||
	nuevaCabeza.y < 0 ||
	nuevaCabeza.y >= FILAS;

const seMuerde = serpiente.some(
	(s) => s.x === nuevaCabeza.x && s.y === nuevaCabeza.y,
);

if (fueraDeLimites || seMuerde) {
	terminado = true;
	return;
}
```

El método `some` recorre el array y devuelve `true` si encuentra al menos un elemento que cumpla la condición. En este caso, comprobamos si hay algún segmento de la serpiente cuya posición coincida con la nueva cabeza. Si lo hay, es que la serpiente se ha mordido a sí misma, y el juego termina.

## Colocar la manzana

La manzana tiene que aparecer en una posición aleatoria del tablero, pero hay que tener cuidado: no puede aparecer encima de la serpiente, porque si lo hace el jugador la comería sin querer en cuanto se moviera. La forma más sencilla y robusta de evitarlo es generar posiciones aleatorias hasta dar con una que no esté ocupada.

```javascript
function colocarManzana() {
	while (true) {
		const candidata = {
			x: Math.floor(Math.random() * COLUMNAS),
			y: Math.floor(Math.random() * FILAS),
		};
		const colisiona = serpiente.some(
			(s) => s.x === candidata.x && s.y === candidata.y,
		);
		if (!colisiona) {
			manzana = candidata;
			return;
		}
	}
}
```

Para una serpiente de tamaño normal este bucle termina prácticamente al primer intento, así que la ineficiencia teórica de tener un bucle infinito hipotético no es un problema real. Solo se notaría si la serpiente llegase a ocupar casi todo el tablero, en cuyo caso el jugador estaría a punto de ganar de todas formas.

## Capturar el teclado

El jugador necesita poder cambiar la dirección de la serpiente. Esto se hace escuchando el evento `keydown` del documento y traduciendo cada tecla a un nuevo vector de dirección. Hay un detalle importante: no podemos permitir que la serpiente gire ciento ochenta grados de golpe, porque eso haría que la cabeza chocara inmediatamente con el segundo segmento del cuerpo. Así que filtramos las teclas que invierten exactamente la dirección actual.

```javascript
document.addEventListener("keydown", (e) => {
	const teclas = {
		ArrowUp: { x: 0, y: -1 },
		ArrowDown: { x: 0, y: 1 },
		ArrowLeft: { x: -1, y: 0 },
		ArrowRight: { x: 1, y: 0 },
	};
	if (teclas[e.key]) {
		const nueva = teclas[e.key];
		if (nueva.x === -direccion.x && nueva.y === -direccion.y) return;
		direccion = nueva;
	}
});
```

En el prototipo final del artículo añado también las teclas WASD como alternativa a las flechas, una pausa con la barra espaciadora y soporte táctil con botones para que el juego funcione en móvil. Pero la lógica es exactamente la misma.

## Dibujar en el canvas

Dibujar es la parte más visual y, por suerte, una de las más fáciles. El canvas tiene un objeto llamado _contexto_ que ofrece métodos para dibujar rectángulos, líneas, texto y formas. Para Snake nos basta con dibujar rectángulos de colores. En cada iteración del juego limpiamos todo el canvas pintándolo del color de fondo y luego dibujamos la manzana y los segmentos de la serpiente en sus posiciones actuales.

```javascript
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

function dibujar() {
	ctx.fillStyle = "#0f1115";
	ctx.fillRect(0, 0, lienzo.width, lienzo.height);

	ctx.fillStyle = "#e74c3c";
	ctx.fillRect(
		manzana.x * TAMANO_CASILLA,
		manzana.y * TAMANO_CASILLA,
		TAMANO_CASILLA,
		TAMANO_CASILLA,
	);

	ctx.fillStyle = "#3ecf8e";
	serpiente.forEach((segmento) => {
		ctx.fillRect(
			segmento.x * TAMANO_CASILLA,
			segmento.y * TAMANO_CASILLA,
			TAMANO_CASILLA,
			TAMANO_CASILLA,
		);
	});
}
```

Las coordenadas de la serpiente y la manzana están en casillas, así que para convertirlas a píxeles basta con multiplicar por el tamaño de casilla. Si en algún momento quieres hacer la cuadrícula más grande o más pequeña, solo tienes que cambiar las constantes y el resto del código sigue funcionando sin tocar nada.

## El bucle principal

Lo último que falta es repetir todo esto varias veces por segundo. La forma más sencilla es usar `setInterval`, que ejecuta una función cada cierto número de milisegundos. Para Snake, un intervalo de unos cien o ciento veinte milisegundos da una velocidad razonable. Más rápido se vuelve frustrante, más lento se vuelve aburrido.

```javascript
function bucle() {
	paso();
	dibujar();
}

setInterval(bucle, 110);
```

Y con esto, el juego ya funciona. Tienes una serpiente que se mueve por el tablero, responde a las flechas del teclado, come manzanas y crece, choca con los bordes y consigo misma, y muestra una puntuación que va subiendo. Todo en menos de cien líneas de JavaScript si lo escribes apretado, y bastante por debajo de doscientas si lo organizas con calma como en el prototipo final.

## Cosas que se pueden añadir si te apetece seguir

A partir de aquí, las posibilidades son enormes. Puedes añadir niveles que aumenten la velocidad cada cierta puntuación. Puedes añadir manzanas especiales que valgan más puntos pero aparezcan solo durante unos segundos. Puedes hacer que el tablero tenga obstáculos fijos. Puedes guardar el récord en `localStorage` para que persista entre sesiones. Puedes añadir sonidos. Puedes hacer que la serpiente atraviese los bordes y aparezca por el lado contrario, en lugar de morir. Puedes meter dos jugadores en el mismo tablero. Cualquier idea que se te ocurra cabe en este esqueleto.

Pero el verdadero valor de programar Snake no está en lo que se le añada después, sino en lo que se aprende construyéndolo. Cuando entiendes este código, entiendes la estructura básica de prácticamente cualquier juego clásico. El bucle, el estado, los eventos, el dibujado, las colisiones. Cambia los detalles y tienes un Tetris. Cambia otros y tienes un Pong. Cambia más cosas y tienes un Pac-Man. Todos comparten el mismo esqueleto que acabamos de construir aquí.

## El prototipo funcional

Aquí abajo dejo el juego completo y funcionando. Es exactamente el mismo código que hemos ido viendo a lo largo del artículo, organizado un poco más limpio, con soporte para WASD y flechas, pausa con la barra espaciadora, controles táctiles para móvil, un récord que se mantiene durante la sesión y una pantalla de fin de partida con instrucciones para reiniciar.

<div id="snake-prototipo">
  <h3 class="snake-titulo">Snake</h3>
  <div class="snake-marcador">Puntuación: <span id="snake-puntuacion">0</span> · Récord: <span id="snake-record">0</span></div>
  <canvas id="snake-lienzo" width="400" height="400"></canvas>
  <p class="snake-ayuda">Flechas o WASD para moverse. Espacio para pausar. Cualquier tecla para reiniciar tras perder.</p>
  <div class="snake-controles-tactiles" aria-label="Controles táctiles">
    <button class="snake-arriba" data-direccion="arriba" aria-label="Arriba">↑</button>
    <button class="snake-izquierda" data-direccion="izquierda" aria-label="Izquierda">←</button>
    <button class="snake-derecha" data-direccion="derecha" aria-label="Derecha">→</button>
    <button class="snake-abajo" data-direccion="abajo" aria-label="Abajo">↓</button>
  </div>
</div>

<style>
#snake-prototipo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  margin: 2rem 0;
  background: #1a1d24;
  border-radius: 8px;
  color: #e8e8e8;
  font-family: system-ui, -apple-system, sans-serif;
}
#snake-prototipo .snake-titulo {
  margin: 0;
  font-weight: 500;
  font-size: 1.2rem;
  letter-spacing: 0.02em;
  color: #e8e8e8;
}
#snake-prototipo .snake-marcador {
  font-variant-numeric: tabular-nums;
  color: #9aa0a6;
  font-size: 0.95rem;
}
#snake-prototipo canvas {
  background: #0f1115;
  border: 1px solid #2a2e36;
  border-radius: 4px;
  max-width: 100%;
  height: auto;
  touch-action: none;
}
#snake-prototipo .snake-ayuda {
  color: #6b7280;
  font-size: 0.85rem;
  text-align: center;
  max-width: 400px;
  line-height: 1.5;
  margin: 0;
}
#snake-prototipo .snake-controles-tactiles {
  display: none;
  grid-template-columns: repeat(3, 60px);
  grid-template-rows: repeat(3, 60px);
  gap: 4px;
}
#snake-prototipo .snake-controles-tactiles button {
  background: #2a2e36;
  color: #e8e8e8;
  border: 1px solid #3a3e46;
  border-radius: 4px;
  font-size: 1.5rem;
  cursor: pointer;
  user-select: none;
  font-family: inherit;
}
#snake-prototipo .snake-controles-tactiles button:active {
  background: #3a3e46;
}
#snake-prototipo .snake-arriba { grid-column: 2; grid-row: 1; }
#snake-prototipo .snake-izquierda { grid-column: 1; grid-row: 2; }
#snake-prototipo .snake-derecha { grid-column: 3; grid-row: 2; }
#snake-prototipo .snake-abajo { grid-column: 2; grid-row: 3; }
@media (hover: none) and (pointer: coarse) {
  #snake-prototipo .snake-controles-tactiles { display: grid; }
}
</style>

<script>
(() => {
  const lienzo = document.getElementById('snake-lienzo');
  if (!lienzo) return;
  const ctx = lienzo.getContext('2d');
  const elemPuntuacion = document.getElementById('snake-puntuacion');
  const elemRecord = document.getElementById('snake-record');
  const contenedor = document.getElementById('snake-prototipo');

  const TAMANO_CASILLA = 20;
  const COLUMNAS = lienzo.width / TAMANO_CASILLA;
  const FILAS = lienzo.height / TAMANO_CASILLA;
  const VELOCIDAD_MS = 110;

  let serpiente, direccion, siguienteDireccion, manzana, puntuacion, terminado, pausado;
  let recordHistorico = 0;
  let activo = false;

  function reiniciar() {
    serpiente = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direccion = { x: 1, y: 0 };
    siguienteDireccion = { x: 1, y: 0 };
    puntuacion = 0;
    terminado = false;
    pausado = false;
    colocarManzana();
    actualizarMarcador();
  }

  function colocarManzana() {
    while (true) {
      const candidata = {
        x: Math.floor(Math.random() * COLUMNAS),
        y: Math.floor(Math.random() * FILAS)
      };
      const colisiona = serpiente.some(s => s.x === candidata.x && s.y === candidata.y);
      if (!colisiona) {
        manzana = candidata;
        return;
      }
    }
  }

  function actualizarMarcador() {
    elemPuntuacion.textContent = puntuacion;
    if (puntuacion > recordHistorico) recordHistorico = puntuacion;
    elemRecord.textContent = recordHistorico;
  }

  function paso() {
    if (terminado || pausado) return;
    direccion = siguienteDireccion;
    const cabeza = serpiente[0];
    const nuevaCabeza = {
      x: cabeza.x + direccion.x,
      y: cabeza.y + direccion.y
    };
    const fueraDeLimites =
      nuevaCabeza.x < 0 || nuevaCabeza.x >= COLUMNAS ||
      nuevaCabeza.y < 0 || nuevaCabeza.y >= FILAS;
    const seMuerde = serpiente.some(s => s.x === nuevaCabeza.x && s.y === nuevaCabeza.y);
    if (fueraDeLimites || seMuerde) {
      terminado = true;
      return;
    }
    serpiente.unshift(nuevaCabeza);
    if (nuevaCabeza.x === manzana.x && nuevaCabeza.y === manzana.y) {
      puntuacion += 10;
      actualizarMarcador();
      colocarManzana();
    } else {
      serpiente.pop();
    }
  }

  function dibujar() {
    ctx.fillStyle = '#0f1115';
    ctx.fillRect(0, 0, lienzo.width, lienzo.height);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(
      manzana.x * TAMANO_CASILLA + 2,
      manzana.y * TAMANO_CASILLA + 2,
      TAMANO_CASILLA - 4,
      TAMANO_CASILLA - 4
    );
    serpiente.forEach((segmento, indice) => {
      ctx.fillStyle = indice === 0 ? '#3ecf8e' : '#2eb87a';
      ctx.fillRect(
        segmento.x * TAMANO_CASILLA + 1,
        segmento.y * TAMANO_CASILLA + 1,
        TAMANO_CASILLA - 2,
        TAMANO_CASILLA - 2
      );
    });
    if (terminado) {
      ctx.fillStyle = 'rgba(15, 17, 21, 0.85)';
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.fillStyle = '#e8e8e8';
      ctx.textAlign = 'center';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText('Has perdido', lienzo.width / 2, lienzo.height / 2 - 10);
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#9aa0a6';
      ctx.fillText('Pulsa cualquier tecla o toca el tablero para reiniciar', lienzo.width / 2, lienzo.height / 2 + 20);
    } else if (pausado) {
      ctx.fillStyle = 'rgba(15, 17, 21, 0.7)';
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.fillStyle = '#e8e8e8';
      ctx.textAlign = 'center';
      ctx.font = '20px system-ui, sans-serif';
      ctx.fillText('Pausa', lienzo.width / 2, lienzo.height / 2);
    } else if (!activo) {
      ctx.fillStyle = 'rgba(15, 17, 21, 0.7)';
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.fillStyle = '#e8e8e8';
      ctx.textAlign = 'center';
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('Pulsa una flecha o toca un control', lienzo.width / 2, lienzo.height / 2 - 10);
      ctx.font = '14px system-ui, sans-serif';
      ctx.fillStyle = '#9aa0a6';
      ctx.fillText('para empezar', lienzo.width / 2, lienzo.height / 2 + 15);
    }
  }

  function bucle() {
    if (activo) paso();
    dibujar();
  }

  function cambiarDireccion(nueva) {
    if (terminado) {
      reiniciar();
      activo = true;
      return;
    }
    if (!activo) activo = true;
    if (nueva.x === -direccion.x && nueva.y === -direccion.y) return;
    siguienteDireccion = nueva;
  }

  document.addEventListener('keydown', (e) => {
    const enZonaJuego = contenedor.matches(':hover') ||
                        document.activeElement === document.body ||
                        contenedor.contains(document.activeElement);
    const teclas = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
    };
    if (teclas[e.key] && enZonaJuego) {
      e.preventDefault();
      cambiarDireccion(teclas[e.key]);
    } else if (e.key === ' ' && enZonaJuego && activo) {
      e.preventDefault();
      pausado = !pausado;
    }
  });

  contenedor.querySelectorAll('.snake-controles-tactiles button').forEach(boton => {
    boton.addEventListener('click', () => {
      const direcciones = {
        arriba: { x: 0, y: -1 },
        abajo: { x: 0, y: 1 },
        izquierda: { x: -1, y: 0 },
        derecha: { x: 1, y: 0 }
      };
      cambiarDireccion(direcciones[boton.dataset.direccion]);
    });
  });

  lienzo.addEventListener('click', () => {
    if (terminado) {
      reiniciar();
      activo = true;
    }
  });

  reiniciar();
  setInterval(bucle, VELOCIDAD_MS);
})();
</script>

**Otros tutoriales de la serie**: [2048](/juego-2048-tutorial/) · [Pong](/juego-pong-tutorial/) · [Parejas](/juego-parejas-tutorial/) · [Ladrillos](/juego-ladrillos-tutorial/).
