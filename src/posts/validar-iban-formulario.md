---
title: "Cómo validar un código IBAN en un formulario web"
date: 2026-04-14
excerpt: "El IBAN tiene un algoritmo de validación elegante, una longitud que varía según el país y un problema con números enormes que tiene solución. Aquí va todo lo que necesitas para no rechazar cuentas bancarias válidas."
tags: [apuntes, javascript, desarrollo-web]
image: validar-iban-formulario.png
image_alt: "Teclado numérico bancario en primer plano con pantalla de formulario digital desenfocada al fondo, iluminación de oficina neutral"
prototype: iban
---

Pedir un número de cuenta bancaria en un formulario es uno de esos momentos en los que el margen de error duele especialmente. No como un campo de nombre, donde un typo es molesto pero recuperable. Aquí, un carácter de más, uno de menos, o una letra en el sitio equivocado puede significar una transferencia que no llega, un cobro que falla o un usuario que abandona el proceso pensando que el problema es suyo.

El IBAN —International Bank Account Number— es el estándar europeo (y de bastantes países más) para identificar cuentas bancarias de forma inequívoca. Y lo interesante es que tiene un mecanismo de validación matemática incorporado, lo que significa que podemos saber, con certeza, si un IBAN dado es formalmente correcto antes de enviar nada a ningún servidor. No si la cuenta existe, ojo, pero sí si el número tiene sentido.

## La estructura del IBAN

Un IBAN tiene siempre la misma anatomía. Empieza con dos letras que identifican el país según la norma ISO 3166-1, seguidas de dos dígitos de control —el corazón del mecanismo de validación— y a continuación el BBAN (Basic Bank Account Number), que es el número de cuenta propio del sistema bancario nacional y cuya estructura varía según el país.

El IBAN español, por ejemplo, tiene 24 caracteres en total: `ES` + 2 dígitos de control + 4 dígitos de código de banco + 4 de código de sucursal + 2 dígitos de control interno + 10 dígitos de número de cuenta. Alemania usa 22 caracteres, Francia 27, Malta 31. No hay una longitud universal, y eso importa a la hora de validar.

## El algoritmo: mover, convertir, dividir

El método de validación es elegante en su sencillez. Se llama MOD-97-10 y funciona en tres pasos.

Primero, se mueven los cuatro primeros caracteres del IBAN al final. Si tenemos `ES9121000418450200051332`, lo transformamos en `21000418450200051332ES91`. Segundo, cada letra se sustituye por su valor numérico según el estándar: `A` = 10, `B` = 11, y así hasta `Z` = 35. Con esa sustitución, el IBAN completo se convierte en una cadena de dígitos, potencialmente muy larga. Tercero, se calcula el resto de dividir ese número entre 97. Si el resultado es 1, el IBAN es válido.

```javascript
function mod97(numStr) {
	let resto = 0;
	for (const digito of numStr) {
		resto = (resto * 10 + parseInt(digito)) % 97;
	}
	return resto;
}

function validarIBAN(raw) {
	const iban = raw
		.trim()
		.toUpperCase()
		.replace(/[\s\-]/g, "");

	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(iban)) {
		return { valido: false, error: "formato" };
	}

	const reordenado = iban.substring(4) + iban.substring(0, 4);
	const numerico = reordenado.replace(/[A-Z]/g, (c) =>
		(c.charCodeAt(0) - 55).toString(),
	);

	return { valido: mod97(numerico) === 1, pais: iban.substring(0, 2) };
}
```

## El problema de los números enormes

Un IBAN puede convertirse en una cadena de hasta 34 dígitos. Eso es un número que desborda con holgura la precisión de un `Number` estándar en JavaScript, que empieza a perder exactitud con enteros por encima de `Number.MAX_SAFE_INTEGER` (2^53 − 1). Si intentáramos hacer `parseInt(numerico) % 97` directamente con un número tan grande, el resultado sería incorrecto.

Hay dos soluciones. La primera es la función `mod97` que aparece en el código anterior: procesa la cadena dígito a dígito, acumulando el resto parcial en cada paso. Es la opción más compatible, funciona en cualquier entorno y no requiere nada especial. La segunda es usar `BigInt`, disponible en todos los navegadores modernos desde hace años:

```javascript
const valido = BigInt(numerico) % 97n === 1n;
```

Ambas opciones son correctas. La primera es más pedagógica y compatible; la segunda es más compacta. Quédate con la que mejor encaje en tu contexto.

## Validar la longitud según el país

El formato mínimo descrito hasta aquí detecta IBANs con letras donde no toca o con una estructura radicalmente incorrecta, pero no avisa si alguien introduce un IBAN español de 22 caracteres cuando debería tener 24. Para eso, conviene incluir una tabla de longitudes por país.

```javascript
const LONGITUDES_IBAN = {
	AL: 28,
	AD: 24,
	AT: 20,
	BE: 16,
	BA: 20,
	BR: 29,
	BG: 22,
	HR: 21,
	CY: 28,
	CZ: 24,
	DK: 18,
	EE: 20,
	FI: 18,
	FR: 27,
	DE: 22,
	GI: 23,
	GR: 27,
	HU: 28,
	IS: 26,
	IE: 22,
	IT: 27,
	LV: 21,
	LI: 21,
	LT: 20,
	LU: 20,
	MT: 31,
	MC: 27,
	NL: 18,
	NO: 15,
	PL: 28,
	PT: 25,
	RO: 24,
	SM: 27,
	SK: 24,
	SI: 19,
	ES: 24,
	SE: 24,
	CH: 21,
	GB: 22,
};
```

Con esta tabla, la función de validación puede ofrecer mensajes de error mucho más útiles: no solo «IBAN incorrecto», sino «este IBAN tiene 22 caracteres y los IBANs españoles tienen 24». Esa diferencia entre el error genérico y el error específico puede ahorrar al usuario varios intentos de frustración.

## La función completa, con mensajes detallados

Juntando todo —limpieza de entrada, validación de formato, comprobación de longitud y algoritmo MOD-97— queda algo así:

```javascript
const LONGITUDES_IBAN = {
	ES: 24,
	DE: 22,
	FR: 27,
	GB: 22,
	IT: 27,
	PT: 25,
	NL: 18,
	BE: 16 /* ... */,
};

function mod97(numStr) {
	let resto = 0;
	for (const d of numStr) resto = (resto * 10 + parseInt(d)) % 97;
	return resto;
}

function validarIBAN(raw) {
	const iban = raw
		.trim()
		.toUpperCase()
		.replace(/[\s\-]/g, "");
	const pais = iban.substring(0, 2);

	if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,}$/.test(iban)) {
		return { valido: false, mensaje: "Formato no reconocido" };
	}

	const longEsperada = LONGITUDES_IBAN[pais];
	if (longEsperada && iban.length !== longEsperada) {
		return {
			valido: false,
			mensaje: `El IBAN de ${pais} debe tener ${longEsperada} caracteres (este tiene ${iban.length})`,
		};
	}

	const numerico = (iban.substring(4) + iban.substring(0, 4)).replace(
		/[A-Z]/g,
		(c) => (c.charCodeAt(0) - 55).toString(),
	);

	return {
		valido: mod97(numerico) === 1,
		pais,
		control: iban.substring(2, 4),
		bban: iban.substring(4),
		mensaje:
			mod97(numerico) === 1
				? "IBAN válido"
				: "Los dígitos de control no son correctos",
	};
}
```

El `replace(/[\s\-]/g, '')` al inicio merece una mención: los IBANs se presentan habitualmente agrupados en bloques de cuatro caracteres separados por espacios (`ES91 2100 0418...`), y algunos usuarios los copian así directamente. Limpiar esos espacios antes de procesar evita rechazos innecesarios y mejora la experiencia sin ningún coste.

## Integración en un formulario con feedback en tiempo real

La validación funciona mejor cuando acompaña al usuario mientras escribe, no cuando le sorprende al pulsar «Enviar». Un pequeño listener sobre el campo es suficiente para dar ese feedback progresivo:

```javascript
const campo = document.getElementById("iban");
const aviso = document.getElementById("aviso-iban");

campo.addEventListener("input", () => {
	const valor = campo.value;

	if (!valor.trim()) {
		aviso.textContent = "";
		campo.removeAttribute("aria-invalid");
		return;
	}

	const resultado = validarIBAN(valor);
	aviso.textContent = resultado.mensaje;
	aviso.className = resultado.valido ? "aviso ok" : "aviso error";
	campo.setAttribute("aria-invalid", resultado.valido ? "false" : "true");
});
```

Un detalle que vale la pena añadir: si tu formulario va a recibir IBANs de muchos países, muestra al usuario la longitud esperada o un ejemplo en el campo. Un placeholder como `ES91 2100 0418 4502 0005 1332` ayuda más que un campo vacío con una etiqueta que solo dice «IBAN».

## Lo que esta validación no puede decirte

Conviene ser honesto sobre los límites del algoritmo. Un IBAN puede pasar la validación MOD-97 y aun así no existir como cuenta real —un número inventado que, por azar matemático, cumple el criterio. Esto es estadísticamente poco probable (la probabilidad de que un IBAN aleatorio sea válido es aproximadamente 1 entre 97), pero no imposible.

La validación matemática descarta errores tipográficos, transposiciones de dígitos y formatos incorrectos con gran fiabilidad. Para verificar que una cuenta es real y está activa, habría que recurrir a servicios externos, y eso ya es otro artículo.

A continuación puedes encontrar un validador funcional con todo lo que hemos descrito: detección del país, comprobación de longitud, algoritmo MOD-97 y desglose del resultado.
