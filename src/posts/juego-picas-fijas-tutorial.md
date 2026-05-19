---
title: "Cómo programar el juego Picas y Fijas desde cero"
date: 2026-05-18
excerpt: "Un tutorial paso a paso para construir el clásico juego de descifrar números en HTML, CSS y JavaScript. La parte interesante está en una función de evaluación que parece simple pero se complica en cuanto las cifras se repiten."
tags: [apuntes, juegos, javascript]
image: picas-fijas-md.png
image_alt: "Panel horizontal con cinco cifras iluminadas y puntos de colores debajo indicando aciertos, estilo pantalla de código retro sobre fondo oscuro"
prototype: picas-fijas
---

Picas y Fijas es uno de esos juegos de toda la vida que se explican en dos frases pero que esconden un pequeño problema algorítmico cuando te pones a programarlos. La mecánica: hay un número secreto de cinco cifras, el jugador propone números y el juego responde cuántas cifras están en su posición exacta (fijas) y cuántas están en el número pero en otra posición (picas). Sin más información que esa, el jugador va acotando las posibilidades hasta adivinarlo. En este tutorial voy a construirlo desde cero en HTML, CSS y JavaScript, sin frameworks ni dependencias externas.

La versión clásica no permite cifras repetidas, pero aquí voy a permitirlas porque añade dificultad y hace más interesante la función de evaluación, que es la parte que merece atención.

## La idea antes de tocar código

El juego tiene tres piezas: generar un número secreto, evaluar cada intento y mostrar el historial de intentos. Las dos primeras son lógica pura en JavaScript. La tercera es construir filas de celdas coloreadas, como un Wordle de números.

La evaluación es el núcleo. Dado un intento y el secreto, necesito saber, cifra a cifra, si cada una es fija, pica o fallo. Con cifras sin repetición esto es sencillo, pero en cuanto el secreto puede ser `11223` y el intento `12345`, hay que tener cuidado de no contar la misma cifra del secreto dos veces. La solución es un algoritmo de dos pasadas que veremos en detalle más adelante.

## El esqueleto HTML

La estructura es minimalista: un tablero donde van apareciendo las filas con los intentos, un campo de texto para escribir el número, un botón para enviarlo y otro para empezar de nuevo.

```html
<div id="pf-prototipo">
  <h3 class="pf-titulo">Picas y Fijas</h3>

  <div class="pf-marcadores">
    <div class="pf-marcador">
      <div class="pf-etiqueta">Intentos</div>
      <div class="pf-valor" id="pf-intentos">0 / 10</div>
    </div>
    <div class="pf-marcador">
      <div class="pf-etiqueta">Récord</div>
      <div class="pf-valor" id="pf-record">—</div>
    </div>
  </div>

  <div id="pf-tablero" class="pf-tablero"></div>

  <div class="pf-zona-entrada">
    <input type="text" id="pf-input" maxlength="5" inputmode="numeric" placeholder="_ _ _ _ _" />
    <button id="pf-enviar">Probar</button>
  </div>

  <p id="pf-mensaje" class="pf-mensaje"></p>

  <button id="pf-nuevo">Nueva partida</button>
</div>
```

El tablero empieza vacío y se llena por JavaScript cada vez que el jugador envía un intento. El atributo `inputmode="numeric"` en el input hace que en móvil aparezca directamente el teclado numérico.

## El CSS: celdas de colores

Cada fila del tablero es un flex con cinco celdas. El color de cada celda depende del resultado: verde para fija, amarillo para pica, gris oscuro para fallo.

```css
.pf-tablero {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.pf-fila {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.35rem;
}

.pf-celda {
  width: 46px;
  height: 46px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  color: #fff;
}

.pf-celda.fija { background: #538d4e; }
.pf-celda.pica { background: #b59f3b; }
.pf-celda.miss { background: #3a3a4a; }
```

La clase que determina el color (`fija`, `pica` o `miss`) se la asigna JavaScript cuando construye cada celda, según lo que devuelva la función de evaluación.

## La función clave: evaluar un intento

Esta es la parte que merece explicarse con cuidado. La función recibe el intento del jugador y el número secreto (ambos como cadenas de texto) y devuelve un array de cinco estados: `'fija'`, `'pica'` o `'miss'`.

La trampa está en las cifras repetidas. Imagina que el secreto es `11234` y el jugador escribe `11111`. Solo las dos primeras posiciones son fijas, las otras tres no. Pero si recorremos el intento posición a posición y buscamos cada `1` en el secreto, podemos acabar contando hasta cuatro picas donde no las hay. Hay que controlar cuántas veces puede "consumirse" cada cifra del secreto.

La solución es un algoritmo de dos pasadas:

```javascript
function evaluar(intento, secreto) {
  const resultado = Array(5).fill('miss');
  const sobrantes = [];

  // Pasada 1: marcar fijas y recopilar lo que sobra en el secreto
  for (let i = 0; i < 5; i++) {
    if (intento[i] === secreto[i]) {
      resultado[i] = 'fija';
    } else {
      sobrantes.push(secreto[i]);
    }
  }

  // Pasada 2: buscar picas entre las posiciones no fijas
  for (let i = 0; i < 5; i++) {
    if (resultado[i] === 'fija') continue;
    const idx = sobrantes.indexOf(intento[i]);
    if (idx !== -1) {
      resultado[i] = 'pica';
      sobrantes.splice(idx, 1); // consumir esa cifra del secreto
    }
  }

  return resultado;
}
```

En la primera pasada recorremos todas las posiciones. Si la cifra del intento coincide exactamente con la del secreto en esa posición, es fija. Si no, apuntamos la cifra del secreto en el array `sobrantes`: es el "presupuesto" de cifras disponibles para marcar picas.

En la segunda pasada miramos las posiciones que no son fijas. Si la cifra del intento aparece en `sobrantes`, es una pica, y eliminamos esa cifra de `sobrantes` con `splice` para que no pueda volver a usarse. Así, si el secreto tiene un solo `3` y el intento tiene tres `3`s en posiciones incorrectas, solo uno de ellos será pica.

## Mostrar el historial

Cada vez que el jugador envía un intento, construimos una fila y la añadimos al tablero. Las celdas se crean dinámicamente con `document.createElement`, aplicándoles la clase que devuelve `evaluar`. También añadimos un pequeño texto de resumen a la derecha de la fila (`2F 1P`, por ejemplo) que es útil para analizar los intentos anteriores sin tener que recontar a ojo.

```javascript
function renderFila(intento, resultado) {
  const fijas = resultado.filter(r => r === 'fija').length;
  const picas = resultado.filter(r => r === 'pica').length;

  const fila = document.createElement('div');
  fila.className = 'pf-fila';

  for (let i = 0; i < 5; i++) {
    const celda = document.createElement('div');
    celda.className = `pf-celda ${resultado[i]}`;
    celda.textContent = intento[i];
    fila.appendChild(celda);
  }

  const resumen = document.createElement('div');
  resumen.className = 'pf-resumen';
  resumen.textContent = `${fijas}F ${picas}P`;
  fila.appendChild(resumen);

  tablero.appendChild(fila);
}
```

## Generar el número secreto

El secreto es una cadena de cinco cifras aleatorias entre 0 y 9, con repetición permitida:

```javascript
function generarSecreto() {
  let s = '';
  for (let i = 0; i < 5; i++) s += Math.floor(Math.random() * 10);
  return s;
}
```

Tratamos todo como cadenas desde el principio, no como números enteros. Así comparamos `intento[i] === secreto[i]` carácter a carácter sin necesidad de conversiones, y la cifra `0` en primera posición no causa sorpresas.

## Unir todo con los eventos

El bucle del juego es sencillo: validar el input, llamar a `evaluar`, pintar la fila, comprobar si ganó o agotó los intentos.

```javascript
function jugar() {
  if (terminado) return;

  const valor = inputEl.value.trim();
  if (!/^\d{5}$/.test(valor)) {
    mensajeEl.textContent = 'Escribe exactamente 5 cifras.';
    return;
  }

  intentos++;
  const resultado = evaluar(valor, secreto);
  renderFila(valor, resultado);

  const fijas = resultado.filter(r => r === 'fija').length;

  if (fijas === 5) {
    mensajeEl.textContent = `¡Resuelto en ${intentos} intento${intentos !== 1 ? 's' : ''}!`;
    terminado = true;
    inputEl.disabled = true;
    enviarBtn.disabled = true;
  } else if (intentos >= MAX) {
    mensajeEl.textContent = `Agotados los intentos. El número era ${secreto}.`;
    terminado = true;
    inputEl.disabled = true;
    enviarBtn.disabled = true;
  } else {
    inputEl.value = '';
    inputEl.focus();
  }
}

enviarBtn.addEventListener('click', jugar);
inputEl.addEventListener('keydown', e => { if (e.key === 'Enter') jugar(); });
inputEl.addEventListener('input', () => {
  inputEl.value = inputEl.value.replace(/\D/g, '');
});
```

El regex `/\D/g` en el listener del input elimina cualquier carácter que no sea dígito en tiempo real, así el jugador no puede escribir letras ni símbolos aunque lo intente.

## Cosas que se pueden añadir

Con esta base hay varios caminos naturales: limitar el juego a cifras sin repetición (generarSecreto con un shuffle), añadir una dificultad de cuatro cifras para partidas más rápidas, guardar el récord en `localStorage` para que persista entre sesiones, o animar la aparición de cada celda con una pequeña transición CSS escalonada por índice.

## El prototipo funcional

El juego completo está disponible en la sección de juegos. Si quieres ver otros proyectos similares, también hay tutoriales de [Snake](/juego-serpiente-tutorial/), [Breakout](/juego-ladrillos-tutorial/), [Pong](/juego-pong-tutorial/) y [2048](/juego-2048-tutorial/).
