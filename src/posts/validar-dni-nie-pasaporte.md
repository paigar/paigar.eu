---
title: "Cómo validar un DNI, NIE o Pasaporte en un formulario web"
date: 2026-03-10
excerpt: "Antes de rechazar a un usuario con un mensaje de error críptico, al menos asegúrate de que el rechazo está justificado. Aquí te explico cómo validar documentos de identidad españoles con JavaScript."
tags: [apuntes, javascript, desarrollo web]
image: "/img/validar-dni-nie-pasaporte.png"
image_alt: "Mano tecleando en un teclado con pantalla de formulario digital en segundo plano, luz cálida de oficina"
prototype: dni
---

Hay pocos momentos más frustrantes en el uso de un formulario web que introducir tu número de documento con toda la tranquilidad del mundo y recibir a cambio un aviso de error que dice, simplemente, «documento inválido». Sin más. Sin pistas. Sin misericordia. Como si el formulario supiera algo de ti que tú no sabes.

El problema, muchas veces, no está en quien rellena el campo. Está en quien lo programó. Porque validar un DNI, un NIE o un pasaporte no es algo especialmente complicado, pero tampoco es tan trivial como aplicar una expresión regular y dar el asunto por zanjado.

## La anatomía del DNI español

El Documento Nacional de Identidad español tiene una estructura muy concreta: ocho dígitos numéricos seguidos de una letra. Esa letra no es decorativa ni aleatoria —es una letra de control calculada a partir de los ocho dígitos, y ahí está la clave de la validación.

El algoritmo es sencillo: se toma el número formado por los ocho dígitos, se divide entre 23, y el resto de esa división se usa como índice para localizar la letra correspondiente en una cadena de 23 caracteres: `TRWAGMYFPDXBNJZSQVHLCKE`. Si la letra que aparece en el documento coincide con la que devuelve el algoritmo, el DNI es válido. Si no coincide, algo va mal —ya sea un error tipográfico o un intento de colar un número inventado.

```javascript
const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";

function validarDNI(dni) {
	const match = dni.toUpperCase().match(/^(\d{8})([A-Z])$/);
	if (!match) return false;
	const numero = parseInt(match[1], 10);
	const letra = match[2];
	return LETRAS[numero % 23] === letra;
}
```

Vale la pena destacar que las letras `I`, `O`, `U` y `Ñ` no aparecen en esa cadena, precisamente para evitar confusiones tipográficas con el `1`, el `0`, o simplemente por convención histórica. Nuestros antepasados burócratas tenían su lógica.

## El NIE, primo hermano con letra por delante

El Número de Identificación de Extranjero sigue la misma lógica de validación que el DNI, pero con una diferencia estructural: empieza por una de estas tres letras —`X`, `Y` o `Z`— seguida de siete dígitos y la letra de control al final.

Para aplicar el mismo algoritmo, hay que sustituir esa letra inicial por su equivalente numérico: `X` se convierte en `0`, `Y` en `1` y `Z` en `2`. Con ese número reconstruido, el cálculo es idéntico al del DNI.

```javascript
function validarNIE(nie) {
	const match = nie.toUpperCase().match(/^([XYZ])(\d{7})([A-Z])$/);
	if (!match) return false;
	const prefijo = { X: "0", Y: "1", Z: "2" };
	const numero = parseInt(prefijo[match[1]] + match[2], 10);
	const letra = match[3];
	return LETRAS[numero % 23] === letra;
}
```

Un detalle que merece atención: el NIE con prefijo `Z` es relativamente reciente. Si tu base de usuarios es antigua y no lo contemplas, podrías estar dejando fuera a un buen número de personas. La burocracia evoluciona, los formularios también deberían.

## El pasaporte, el pariente sin algoritmo público

Aquí las cosas se complican levemente, porque no existe un algoritmo público de validación de dígito de control para los pasaportes españoles. Lo que sí podemos hacer es validar el formato: los pasaportes españoles actuales siguen una estructura de dos o tres letras seguidas de cinco o seis dígitos numéricos.

No es una validación matemáticamente infalible —alguien con imaginación podría inventar un `AAA123456` perfectamente formateado pero inexistente—, pero sirve para descartar entradas claramente incorrectas y guiar al usuario hacia el formato esperado.

```javascript
function validarPasaporte(pasaporte) {
	return /^[A-Z]{2,3}\d{5,6}$/i.test(pasaporte);
}
```

Si tu aplicación necesita verificar que un pasaporte es real y pertenece a quien dice ser, eso ya es otro asunto —y probablemente implica APIs de terceros y consideraciones legales que se escapan del alcance de un campo de formulario.

## Juntarlo todo: detección automática del tipo de documento

Lo ideal, desde el punto de vista de la experiencia de usuario, es no obligar a la persona a indicar si su documento es un DNI, un NIE o un pasaporte. El formato ya lo dice. Podemos detectarlo automáticamente con una función que evalúa la estructura del valor introducido y llama a la función de validación correspondiente.

```javascript
const LETRAS = "TRWAGMYFPDXBNJZSQVHLCKE";

function validarDNI(doc) {
	const m = doc.match(/^(\d{8})([A-Z])$/);
	if (!m) return { valido: false };
	const ok = LETRAS[parseInt(m[1], 10) % 23] === m[2];
	return { tipo: "DNI", valido: ok };
}

function validarNIE(doc) {
	const m = doc.match(/^([XYZ])(\d{7})([A-Z])$/);
	if (!m) return { valido: false };
	const pref = { X: "0", Y: "1", Z: "2" };
	const ok = LETRAS[parseInt(pref[m[1]] + m[2], 10) % 23] === m[3];
	return { tipo: "NIE", valido: ok };
}

function validarPasaporte(doc) {
	const ok = /^[A-Z]{2,3}\d{5,6}$/.test(doc);
	return { tipo: "Pasaporte", valido: ok };
}

function validarDocumento(raw) {
	const doc = raw
		.trim()
		.toUpperCase()
		.replace(/[\s\-\.]/g, "");

	if (/^\d{8}[A-Z]$/.test(doc)) return validarDNI(doc);
	if (/^[XYZ]\d{7}[A-Z]$/.test(doc)) return validarNIE(doc);
	if (/^[A-Z]{2,3}\d{5,6}$/.test(doc)) return validarPasaporte(doc);

	return { tipo: "desconocido", valido: false };
}
```

Fíjate en el `replace(/[\s\-\.]/g, '')` antes de evaluar: es un pequeño gesto de buena fe hacia el usuario que escribe `12.345.678-Z` o `12 345 678 Z`. Limpiar la entrada antes de validarla evita muchos falsos negativos innecesarios.

## Integración en un formulario real

Con la función lista, integrarla en un campo de formulario es cuestión de escuchar el evento `input` y actuar en consecuencia. No hay que esperar a que el usuario pulse «Enviar» para decirle que algo va mal —la validación en tiempo real, con un poco de gracia y sin ponerse histérico con el primer carácter, mejora notablemente la experiencia.

```javascript
const campo = document.getElementById("documento");
const aviso = document.getElementById("aviso-documento");

campo.addEventListener("input", () => {
	const resultado = validarDocumento(campo.value);

	if (!campo.value.trim()) {
		aviso.textContent = "";
		campo.removeAttribute("aria-invalid");
		return;
	}

	if (resultado.valido) {
		aviso.textContent = `${resultado.tipo} válido ✓`;
		aviso.className = "aviso ok";
		campo.setAttribute("aria-invalid", "false");
	} else {
		aviso.textContent =
			resultado.tipo === "desconocido"
				? "Formato no reconocido"
				: `La letra de control no es correcta`;
		aviso.className = "aviso error";
		campo.setAttribute("aria-invalid", "true");
	}
});
```

Un apunte de accesibilidad que conviene no ignorar: usar `aria-invalid` sobre el campo permite que los lectores de pantalla comuniquen el estado del campo a quienes los necesitan. No cuesta nada y marca la diferencia para una parte nada despreciable de los usuarios.

## Una última consideración antes de confiar ciegamente en esto

La validación del lado del cliente es útil para mejorar la experiencia de usuario, pero nunca debe ser la única línea de defensa. Cualquiera puede desactivar JavaScript o manipular las peticiones antes de que lleguen al servidor. Si el número de documento tiene alguna relevancia funcional en tu aplicación —y probablemente la tiene si lo estás pidiendo—, repite siempre la validación en el servidor.

Lo que hemos visto aquí es suficiente para que tus formularios sean más amables, más inteligentes y menos fuente de fricciones innecesarias. Que no es poco.

A continuación puedes encontrar un validador funcional con todo lo que hemos descrito: detección automática del tipo de documento, validación en tiempo real y ejemplos para probar.
