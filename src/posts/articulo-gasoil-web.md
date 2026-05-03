---
title: "Volver a programar el juego que programé a los dieciséis"
date: 2025-11-17
excerpt: "Después de recuperar el listado de mi juego de 1989, una pregunta loca: ¿se podría hacer correr en un navegador? Con los píxeles originales, sin emulador. Spoiler: sí, juega bastante decente y al final está aquí abajo para que lo pruebes."
tags: [artilugios, retrofuturismo, msx, javascript, canvas, juegos]
image: /img/gasoil-web-header.png
image_alt: "Pantalla de un ordenador moderno mostrando un juego de píxeles retro con tres niveles de plataformas, sprites blancos y rojos sobre fondo negro y un marco amarillo punteado, fotografía con luz natural"
prototype: gasoil
---

Hace una semana terminé de transcribir el listado de mi juego **Gasoil** desde la revista MSX-Club número 64, conseguí ejecutarlo en un emulador del navegador y dejé escrito por aquí [un post bastante sentimental sobre todo el proceso](/articulo-gasoil/). Era un buen final. Tenía cierre, tenía moraleja, tenía hasta una frase seca de despedida. Pero la cabeza no se quedó tranquila. La cabeza siguió dándole vueltas a una pregunta tonta: ¿y si en lugar de pasarlo por un emulador del MSX, lo programara otra vez **desde cero** en HTML y JavaScript? Sin BASIC, sin VPOKE, sin chip de sonido PSG. En el navegador, con canvas, en un solo archivo. Pero usando los gráficos exactos del original. Los píxeles que yo dibujé en cuadrícula de papel milimetrado a los dieciséis años, renderizados otra vez treinta y cinco años después.

Es lo que se llama una idea inútil, en el mejor sentido de la expresión. No tiene utilidad práctica, no la va a jugar nadie, no me va a generar tráfico, no resuelve ningún problema del mundo real. Pero me apetecía. Y resulta que dos tardes después tengo el juego corriendo al final de este post, así que algo se ha hecho.

## el dilema de los gráficos

La primera decisión técnica era la única que importaba. Cuando reprogramas algo viejo tienes dos caminos. El primero es **rehacerlo bonito**: aprovechas que ahora tienes 16 millones de colores, sprites de 256×256 píxeles, animaciones suaves, y construyes una versión moderna del juego que mantiene el espíritu pero se ve actual. El segundo es **respetar lo que había**: mantener los píxeles originales, los colores limitados de la paleta MSX, la baja resolución, y que el resultado sea reconociblemente el mismo juego que el de 1989.

Elegí el segundo camino sin dudar. La gracia no era tener un juego de plataformas más, hay miles. La gracia era que el héroe en pantalla fuera **literalmente** el héroe que dibujé en mi cuaderno hace treinta y cinco años. Que cada píxel del pez, del gusano, de los contenedores de gasolina, fuera exactamente el que está codificado en las líneas DATA del listado de la revista. Sin retoques, sin upgrades, sin reinterpretación. Lo que vieras en el navegador tenía que ser una continuación pura del original, no un homenaje.

## cómo se renderiza un sprite del MSX en 2026

Aquí llega la parte mecánica y deliciosa del proyecto. Un sprite del MSX1 es una matriz de 16×16 píxeles monocromos, codificada en 32 bytes. Los primeros 16 bytes son las 16 filas del cuadrante izquierdo (cada byte = una fila de 8 píxeles, bit más significativo a la izquierda). Los siguientes 16 bytes son las 16 filas del cuadrante derecho. Esto era estándar en 1989 y por supuesto sigue siendo estándar en 2026, porque el formato no caduca, no necesita actualizaciones de seguridad, no depende de ningún framework. Es solo una forma de organizar bytes.

En el listado original de Gasoil hay dieciséis sprites así, ocupando dieciséis líneas de DATA del 1040 al 1190. Cada línea de DATA es un sprite. Los identifiqué uno a uno mirando las llamadas `PUT SPRITE` del código: el sprite 0 es el héroe parado, los sprites 5 y 6 son los dos cuadros de animación de andar a la izquierda, los 8 y 9 son los de andar a la derecha, el 10 es el héroe saltando con los brazos arriba. Hay también dos cuadros de animación del pez, dos del gusano, los contenedores de gasolina cerrados y abiertos, las gotas de gasoil cayendo y el icono de vida.

Para llevarlos al navegador hace falta un decodificador trivial: catorce líneas de JavaScript que recorren los 32 bytes y construyen una matriz de unos y ceros. Después, en el bucle de pintado, cada píxel "encendido" del sprite se pinta sobre el canvas con el color que toque. Como el MSX original aplicaba el color al sprite entero, también se hace así en mi versión. El resultado es bonito y honestamente fiel.

Aquí va el corazón del decodificador. No tiene mérito ninguno y precisamente por eso me hace gracia:

```javascript
const SPRITES = SPRITE_DATA.map((bytes32) => {
	const grid = [];
	for (let y = 0; y < 16; y++) {
		const row = new Uint8Array(16);
		const bL = bytes32[y],
			bR = bytes32[y + 16];
		for (let x = 0; x < 8; x++) {
			if (bL & (0x80 >> x)) row[x] = 1;
			if (bR & (0x80 >> x)) row[x + 8] = 1;
		}
		grid.push(row);
	}
	return grid;
});
```

Trece líneas que conectan 1989 con 2026. Los `bytes32` son los `DATA` originales. La salida es una matriz que el canvas sabe pintar. Entre medias no pasa nada que requiera ninguna librería, ningún SDK, ningún build step. Si esto sigue siendo legible para alguien dentro de otros treinta y cinco años, podrá rehacer su versión partiendo del mismo punto.

## la lógica del juego, que es lo que costó

Donde sí me llevé un disgusto al principio fue al diseñar el bucle de juego. Tenía la cabeza acelerada con los sprites, escribí la primera versión en una sentada y monté un mapa de niveles **completamente equivocado**. Recordaba mal el original. Pensé que las plataformas estaban escalonadas en zigzag y que el héroe saltaba de unas a otras como en los plataformas clásicos. Cargué el resultado, le di al `RUN` mental y me bastaron diez segundos para darme cuenta: aquello no era Gasoil. Era _un juego de plataformas_, sin más. Mi juego de plataformas. Pero no el mío.

Volví a abrir el listado y a leerlo de verdad, no por encima. **Gasoil es un juego de cascada de gasoil**, no de saltar plataformas. La estructura real es bastante más bonita: tres niveles horizontales conectados por dos escaleras al centro de la pantalla, dos columnas verticales de tanques en los extremos (una a la izquierda, una a la derecha, con un tanque en cada uno de los tres niveles), y junto a cada tanque su palanca correspondiente. El gasoil entra por el techo y va goteando a los tanques superiores. La misión es ir accionando palancas en cada nivel para que el gasoil fluya hacia abajo en cascada por la misma columna: del tanque superior al del medio, del medio al del fondo, y del fondo desaparece y suma puntos. Como cada tanque solo aguanta tres bloques, el ritmo lo marca la urgencia: si tardas, el de arriba se desborda y pierdes vida.

Mientras tanto, en el nivel medio patrulla un gusano que te quita una vida si te toca, y en el charco central del nivel inferior salta un pez al que también hay que esquivar. Las escaleras conectan los tres niveles pero te dejan expuesto en el medio. La habilidad consiste en mantener el flujo: subir, abrir, bajar, abrir, sin que ningún tanque se sobrecargue, sin morir por el camino y sin que la puntuación llegue a cero por el goteo constante.

Es un diseño bonito, ahora que lo veo desde fuera con ojos de adulto. Tiene tensión por capas, no es solo un juego de plataformas. Y es del todo coherente con lo que se podía hacer en BASIC con los sprites del MSX: tres niveles, dos escaleras, dos columnas, un héroe, dos enemigos. Lo justo. Curioso volver a apreciar a aquel chaval de dieciséis años que diseñó esto sin haber leído ni un manual de game design en su vida, simplemente probando hasta que la mecánica funcionara.

Esa es la estructura que finalmente programé en JavaScript. Las posiciones, las velocidades, los colores, las distancias entre niveles, la capacidad de los tanques, todo está sacado del listado original. Pero la lógica detrás (la máquina de estados del héroe, el sistema de bloques en tránsito con animación de caída, la detección de palancas y enemigos) es nueva. Es una traducción del comportamiento, no una emulación del código.

## las tres pantallas de bienvenida

Lo que sí mantuve casi literal son las **tres pantallas de instrucciones** del original. El BASIC de Gasoil tenía una secuencia de bienvenida bastante elaborada para un juego de aficionado de los noventa: una pantalla con el título, otra explicando el objetivo, otra los mandos, otra los puntos, y solo entonces arrancaba el juego. En 2026 nadie necesita ya esa secuencia. Cualquier juego web te suelta directamente al gameplay, como mucho con un pequeño tutorial flotante. Pero esas tres pantallas eran parte del recuerdo. Cuando uno juega a Gasoil de 1989, se encuentra primero con esos textos. Quitarlas hubiera sido, no sé cómo decirlo, una falta de respeto al original. Las dejé.

## sobre el bucle del salto, otra vez

Mencioné en el artículo anterior la rutina del salto del original. Aquí ha pasado algo curioso: al rescatar los sprites uno a uno y ponerlos en pantalla, me he reencontrado con un detalle que tenía completamente olvidado. El sprite del héroe en posición de salto (el patrón número 10, en la línea DATA 1140 del listado) tiene en la parte de abajo del cuerpo una serie de pinceladas curvadas que sugieren claramente una hélice. Mi yo de dieciséis años no lo dibujó como un personaje saltando con los pies estirados, lo dibujó como un personaje **volando con una hélice debajo**. Como si el héroe llevara incorporado un mecanismo propio para cubrir distancia en el aire. Lo había olvidado por completo.

En la primera versión del juego web ignoré ese detalle y monté un salto puramente vertical, corto, prácticamente inútil para esquivar al gusano. Cuando volví a mirar el sprite con calma me di cuenta de que el salto **tenía que ser largo**, con alcance horizontal generoso, porque el propio dibujo del personaje lo está pidiendo. Así que reescribí la trayectoria: ahora el héroe sale despedido en arco hacia delante, en la dirección a la que mira, recorre como un cuarto del ancho de la pantalla por el aire, y aterriza limpiamente al otro lado del enemigo. Es exactamente el comportamiento que el sprite estaba sugiriendo.

Lo divertido del asunto es que el código de la trayectoria no tiene nada de especial: una función `Math.sin(t * Math.PI) * 28` para la altura, una interpolación lineal para la X. Treinta segundos de adulto. La parte interesante no es el código, es la lectura de los píxeles del original. Treinta y cinco años después de dibujar ese sprite, descubro que mi yo adolescente había dejado escondida una pista sobre cómo debía comportarse el personaje, y esa pista solo se puede leer mirando los píxeles uno por uno. El código fuente del juego no la documenta. Está toda en los bytes del sprite.

## qué se ha perdido

Bastantes cosas, para ser honesto. El juego web no tiene scroll de tabla de récords ni rachas tipo arcade. No suena como un MSX porque la Web Audio API genera ondas cuadradas perfectas, no esa textura tan particular del chip PSG. La interfaz no se ve dentro del marco de un televisor de tubo, así que se pierde el efecto cromático tan especial que daba la pantalla rebotada de un Sony Trinitron de la época. La pantalla ocupa 256×192 píxeles, igual que el original, pero escalada sobre un monitor de cuatro mil cosas, lo cual es a la vez nostálgico y un poco surrealista.

Lo que sí queda, lo que sostiene todo el ejercicio, es que cuando le das al botón de empezar el héroe que aparece en pantalla **es el mismo héroe**. No uno parecido, no una versión moderna inspirada en él. Es exactamente él: dieciséis filas por dieciséis columnas, los píxeles que mi yo de dieciséis años decidió que formarían su contorno, codificados en los mismos treinta y dos bytes de la línea 1040 del listado. Eso para mí ya justifica todo el proyecto.

## el juego

Aquí abajo está. Se juega con las flechas del teclado y la barra espaciadora. El objetivo es llevar el gasoil de los tanques superiores hasta el fondo, en cascada por la misma columna: cada palanca que accionas hace caer un bloque del tanque al de inmediatamente abajo, y la palanca del tanque del fondo lo hace desaparecer y suma cincuenta puntos. Las dos escaleras del centro conectan los tres niveles, las flechas arriba y abajo te suben y te bajan por ellas. El espacio sirve para accionar la palanca cuando estás pegado a un tanque, y para saltar largo cuando no, en la dirección a la que mires. Cada cierto tiempo cae una gota desde el techo a uno de los tanques superiores y te quita diez puntos. Si llegas a cero, pierdes la partida. Si un tanque se llena por encima de tres bloques, también.

Las palancas que se pueden accionar brillan en rojo, las que están vacías se ven en gris. Las que tienen "chispas" parpadeando encima son las que te están esperando: el héroe está pegado y solo hace falta pulsar espacio.

No es el juego original. No está depurado al 100%. Pero la ilusión y los pixeles son los mismos que en 1989.
