---
title: "Cómo construir una herramienta de armonías de color con JavaScript"
date: 2026-04-03
excerpt: "El círculo cromático lleva siglos explicando por qué ciertos colores funcionan juntos. Te cuento cómo convertir esa teoría en una pequeña utilidad web que calcule paletas armónicas a partir de cualquier color."
tags: [javascript, técnicas]
image: color-harmony-tool.png
image_alt: "Rueda de colores espectrales iluminada sobre fondo oscuro, con rayos de luz que forman un círculo cromático"
prototype: color-harmony
---

Hace unas semanas necesitaba generar una paleta de colores para un proyecto y me encontré abriendo por décima vez la misma página de Adobe Color, haciendo clic en el complementario, copiando el hex, pegándolo en el CSS... una cadencia absurda para algo que en el fondo es pura matemática. Así que decidí construir mi propia herramienta. El resultado es una página HTML bastante sencilla que, dado un color de entrada, calcula y muestra sus distintas armonías cromáticas. Este artículo explica cómo funciona por dentro.

## El círculo cromático, o por qué algunos colores se llevan bien

La teoría del color lleva siglos siendo estudiada, desde los primeros trabajos de Newton descomponiendo la luz blanca hasta el círculo de Itten que se enseña en cualquier escuela de diseño. La idea central es siempre la misma: los colores no son entidades aisladas, sino que existen en relación unos con otros, y esas relaciones tienen una geometría.

El círculo cromático organiza los colores por su tono —lo que en inglés se llama _hue_— en un espacio circular de 360 grados. Los colores primarios de la luz (rojo, verde, azul) están separados a 120 grados entre sí. Entre ellos se distribuyen los intermedios: amarillos, cians, magentas, naranjas. La clave es que cuando hablamos de armonía cromática, estamos hablando de ángulos: qué ocurre si tomamos el color opuesto, o los que están a un tercio del círculo, o los vecinos inmediatos.

Esta geometría es lo que convierte un problema de "¿qué color combina con este?" en algo calculable con una suma simple. Si tu color está en la posición 30 grados del círculo, su complementario está exactamente en 30 + 180 = 210 grados. Su triádico, a 30 + 120 = 150 y a 30 + 240 = 270. No hay magia, solo rotación.

## Los cinco tipos de armonía que vale la pena conocer

La armonía **complementaria** es la más elemental: el color opuesto en el círculo, a 180 grados. Produce el contraste más fuerte posible y es lo que hace que un cartel naranja sobre azul resulte tan llamativo. Úsala cuando quieras impacto; evítala cuando quieras sutileza.

El **complementario dividido** es una versión más refinada: en lugar de ir directamente al opuesto, tomas los dos colores que flanquean ese opuesto, a ±150 grados del original. El resultado es casi igual de llamativo pero bastante menos agresivo, y tienes tres colores en lugar de dos.

La armonía **triádica** coloca tres colores a 120 grados entre sí, formando un triángulo equilátero dentro del círculo. Es vibrante y equilibrada. Es la favorita de muchos diseñadores de interfaces porque ninguno de los tres colores domina demasiado sobre los otros.

La armonía **análoga** toma los vecinos inmediatos del color base, normalmente a ±30 grados. El resultado es la más tranquila y natural de todas —piensa en los degradados de una puesta de sol, o en los verdes de un bosque. Los colores análogos son siempre seguros y agradables, pero pueden volverse aburridos si no hay suficiente variación de luminosidad o saturación.

Por último, la **tetrádica** —también llamada cuadrada— coloca cuatro colores a 90 grados entre sí. Es la más compleja de manejar porque da mucho color, pero en manos de alguien que sabe lo que hace produce resultados muy ricos.

## HSL: el espacio de color que hace todo esto natural

Para implementar estas armonías en código, lo primero es elegir el sistema de representación del color adecuado. El formato hexadecimal que usamos en CSS (`#3B82F6`) es cómodo para escribir pero inútil para calcular. El RGB tampoco ayuda mucho. Lo que necesitamos es el sistema **HSL**: Hue (tono), Saturation (saturación), Lightness (luminosidad).

En HSL, el tono es exactamente el ángulo en el círculo cromático, un valor entre 0 y 360. La saturación va de 0% (gris neutro) a 100% (color puro). La luminosidad va de 0% (negro) a 100% (blanco), con el 50% como punto donde el color es más vívido. Esto significa que calcular el complementario de un color HSL es tan directo como sumar 180 al valor H:

```javascript
function complementario(h, s, l) {
	return [(h + 180) % 360, s, l];
}
```

Y el triádico, añadir 120 y 240:

```javascript
function triadica(h, s, l) {
	return [
		[h, s, l],
		[(h + 120) % 360, s, l],
		[(h + 240) % 360, s, l],
	];
}
```

El operador `% 360` asegura que si el ángulo supera 360, vuelve a empezar desde cero. En JavaScript, hay que tener cuidado con los negativos —si sumamos -30 a un hue de 10, obtenemos -20, que no tiene sentido en el círculo— así que conviene usar `((h + offset) % 360 + 360) % 360` para estar seguros.

## Convertir entre formatos: de hex a HSL y vuelta

El problema práctico es que los usuarios (y los selectores de color del navegador) trabajan con hexadecimal, pero nuestros cálculos necesitan HSL. Así que la herramienta necesita dos conversiones: `hexToHsl` y `hslToHex`.

La conversión de hex a HSL funciona así: primero extraemos los canales R, G y B del string hexadecimal, los normalizamos a un rango de 0 a 1, y luego calculamos el tono, la saturación y la luminosidad con unas pocas operaciones aritméticas. El tono depende de cuál de los tres canales es el máximo, y se expresa como un ángulo en el círculo.

```javascript
function hexToHsl(hex) {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	let h = 0,
		s = 0;

	if (max !== min) {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
		else if (max === g) h = ((b - r) / d + 2) / 6;
		else h = ((r - g) / d + 4) / 6;
	}

	return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
```

La conversión inversa, de HSL a hex, es algo más compleja matemáticamente pero sigue el mismo principio. Se reconstruyen los canales RGB a partir del tono, la saturación y la luminosidad, y luego se convierten a hexadecimal:

```javascript
function hslToHex(h, s, l) {
	h = ((h % 360) + 360) % 360;
	s /= 100;
	l /= 100;
	const a = s * Math.min(l, 1 - l);
	const f = (n) => {
		const k = (n + h / 30) % 12;
		const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
		return Math.round(255 * c)
			.toString(16)
			.padStart(2, "0");
	};
	return "#" + f(0) + f(8) + f(4);
}
```

Con estas dos funciones, el flujo completo es: recibir un color en hex → convertir a HSL → aplicar los offsets angulares → convertir cada resultado de vuelta a hex → mostrar en pantalla.

## La interfaz: selector de color, swatches y rueda visual

La parte visual de la herramienta se construye con HTML y CSS estándar, sin frameworks ni librerías externas. El selector de color usa el elemento nativo `<input type="color">`, que en los navegadores modernos abre un selector completo con soporte para cualquier color del espacio sRGB. Complementamos esto con un campo de texto donde el usuario puede escribir directamente el código hex, validando en tiempo real que tenga el formato correcto (`#` seguido de seis caracteres hexadecimales).

La rueda de color que aparece en la interfaz es un `<canvas>` de HTML5. Se dibuja recorriendo los 360 grados y pintando para cada ángulo un arco con un degradado radial que va del blanco en el centro al color puro del borde. El resultado es una representación visual del espacio HSL con saturación y luminosidad fijas. Sobre esta rueda se colocan puntos que marcan la posición del color base y su complementario.

Los swatches de cada armonía son simples `<div>` con su `background-color` calculado. Al hacer clic sobre cualquiera de ellos, se copia el hex al portapapeles usando la API `navigator.clipboard.writeText()`. Una pequeña notificación emergente confirma la acción.

## Lo que me llevé de todo esto

Construir esta herramienta me recordó que detrás de muchas decisiones de diseño que parecen intuitivas hay estructuras matemáticas bastante elegantes. El círculo cromático no es una metáfora bonita: es un espacio vectorial donde la armonía es literalmente una cuestión de geometría. Puedes intuir que el naranja y el azul combinan bien, o puedes saber que están a 180 grados entre sí en un espacio de 360, y que eso maximiza el contraste perceptivo entre dos tonos.

El código completo de la herramienta está disponible en esta misma página para que puedas usarla directamente, o coger las funciones de conversión y adaptarlas a tus propios proyectos. No hay dependencias, no hay build step, no hay nada que instalar. Un archivo HTML y ya está.
