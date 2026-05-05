---
title: "Cómo validar un NIF español en un formulario web (con CIF incluido)"
date: 2026-04-27
excerpt: "El NIF no es solo el DNI con otro nombre. Cuando tu formulario tiene que aceptar tanto personas físicas como empresas, el algoritmo del CIF añade una capa de complejidad que merece su propio artículo."
tags: [apuntes, javascript, desarrollo web]
image: validar-nif-cif-formulario.png
image_alt: "Sello oficial en documento administrativo español, luz difusa de ventana, profundidad de campo corta, textura de papel"
prototype: nif
---

Si tu formulario solo necesita identificar personas físicas, el [artículo sobre validación de documentos de identidad](/validar-dni-nie-pasaporte/) cubre ese escenario por completo: DNI, NIE y pasaporte, con toda la lógica de letra de control. Este artículo es para cuando el mismo campo «NIF» también puede recibir el identificador de una empresa, una asociación o un organismo público.

Conviene aclarar un matiz desde el principio: el autónomo persona física tributa con su DNI como NIF fiscal, así que en ese caso el documento de la persona y el del contribuyente son el mismo. Pero en cuanto hay una sociedad de por medio —una limitada, una cooperativa, una fundación—, aparece el CIF, y con él un algoritmo de validación completamente distinto que merece su propio tratamiento.

El NIF —Número de Identificación Fiscal— es el identificador fiscal único en España. Para las personas físicas españolas equivale al DNI; para los extranjeros residentes es el NIE; para las personas jurídicas (empresas, asociaciones, organismos públicos...) es lo que durante décadas se llamó CIF y que desde 2008 se denomina oficialmente NIF de persona jurídica, aunque en la práctica todo el mundo sigue llamándolo CIF. Los tres conviven en el mismo campo.

## DNI y NIE: terreno conocido

El DNI y el NIE son los mismos que ya conocemos. Ocho dígitos más una letra de control para el DNI; la letra inicial `X`, `Y` o `Z` seguida de siete dígitos y una letra de control para el NIE. En ambos casos la letra se calcula con el mismo algoritmo: módulo 23 del número sobre la cadena `TRWAGMYFPDXBNJZSQVHLCKE`.

No voy a repetir aquí los detalles porque los tienes explicados con calma en el artículo sobre documentos de identidad. Lo que sí importa para el validador de NIF es tener claro que estos dos formatos hay que detectarlos primero, antes de intentar interpretar lo que queda como un CIF.

## El CIF: una letra de tipo y un carácter de control que puede ser letra o dígito

El CIF tiene una estructura diferente: una letra que identifica el tipo de entidad, seguida de siete dígitos, y un carácter final de control que —y aquí viene el primer matiz— puede ser tanto una letra como un dígito, dependiendo del tipo de entidad.

La letra inicial indica la naturaleza jurídica: `A` para sociedades anónimas, `B` para limitadas, `F` para cooperativas, `G` para asociaciones y fundaciones, `Q` para organismos públicos, y así hasta una veintena de opciones. Esa letra no es solo cosmética: condiciona qué tipo de carácter de control es válido al final.

```
[Letra de tipo] + [7 dígitos] + [Letra o dígito de control]

Ejemplo: A  1 2 3 4 5 6 7  4
         ^  ───────────── ^
    tipo S.A.   dígitos   control
```

La regla para el carácter de control es esta: los tipos `P`, `Q`, `S` y `W` (corporaciones locales, organismos públicos, órganos de la Administración y establecimientos permanentes de entidades no residentes) deben terminar siempre con una letra. El resto de tipos aceptan indistintamente letra o dígito —ambos son representaciones válidas del mismo valor.

## El algoritmo del CIF, paso a paso

El cálculo del carácter de control opera sobre los siete dígitos centrales y sigue este proceso:

Se recorre cada dígito teniendo en cuenta su posición. Los que ocupan posiciones impares (primera, tercera, quinta y séptima) se multiplican por dos; si el resultado supera nueve, se suman sus dos cifras —igual que en otros algoritmos de Luhn. Los que ocupan posiciones pares se usan directamente sin transformación. Se suman todos los valores resultantes.

Con esa suma, el índice de control es `(10 − (suma % 10)) % 10`. Ese índice sirve para dos cosas: como dígito de control directamente, y como posición en la cadena `JABCDEFGHI` para obtener la letra de control equivalente.

```javascript
const LETRAS_CIF = "JABCDEFGHI";

function calcularControlCIF(tipo, digitos) {
	let suma = 0;
	for (let i = 0; i < 7; i++) {
		let d = parseInt(digitos[i], 10);
		if ((i + 1) % 2 !== 0) {
			// posición impar (base 1)
			d *= 2;
			if (d >= 10) d = Math.floor(d / 10) + (d % 10);
		}
		suma += d;
	}
	const idx = (10 - (suma % 10)) % 10;
	return { digit: String(idx), letter: LETRAS_CIF[idx] };
}
```

Con el índice en mano, la validación es directa: el carácter final del CIF debe coincidir con el dígito calculado o con la letra calculada. Si el tipo de entidad pertenece al grupo `PQSW` y el carácter es un dígito, el CIF no es válido aunque el valor sea matemáticamente correcto.

```javascript
function validateCIF(value) {
	const cif = normalizar(value);
	const match = cif.match(/^([ABCDEFGHJNPQRSTUVW])(\d{7})([0-9A-J])$/);
	if (!match) return { valid: false, type: "CIF", error: "formato_incorrecto" };

	const [, tipo, digitos, control] = match;
	const { digit, letter } = calcularControlCIF(tipo, digitos);

	if ("PQSW".includes(tipo) && /\d/.test(control)) {
		return { valid: false, type: "CIF", error: "control_debe_ser_letra" };
	}

	const ok = control === digit || control === letter;
	return {
		valid: ok,
		type: "CIF",
		value: cif,
		entityType: tipo,
		entityName: TIPOS_CIF[tipo] || null,
		error: ok ? undefined : "caracter_control_incorrecto",
	};
}
```

## Detectar automáticamente qué tipo de NIF es

Con los tres validadores listos, la función principal se limita a mirar el formato y derivar al validador correcto. El orden importa: hay que comprobar primero DNI y NIE —cuya primera posición puede solaparse con letras válidas de CIF— antes de intentar interpretar la cadena como un CIF.

```javascript
function validate(raw) {
	const doc = normalizar(raw);
	if (!doc) return { valid: false, type: null, error: "vacio" };

	if (/^\d{8}[A-Z]$/.test(doc)) return validateDNI(doc);
	if (/^[XYZ]\d{7}[A-Z]$/.test(doc)) return validateNIE(doc);
	if (/^[ABCDEFGHJNPQRSTUVW]\d{7}[0-9A-J]$/.test(doc)) return validateCIF(doc);

	return { valid: false, type: null, value: doc, error: "tipo_no_reconocido" };
}
```

Vale la pena detenerse en el regex del CIF. La clase de caracteres `[ABCDEFGHJNPQRSTUVW]` para la letra inicial excluye explícitamente `I` y `O` por riesgo de confusión visual, y también `X`, `Y` y `Z`, que ya están capturadas por el patrón NIE. Para el carácter final, `[0-9A-J]` cubre tanto los diez posibles dígitos como las diez letras posibles de la tabla `JABCDEFGHI`.

## Un resultado rico: más que un booleano

La ventaja de devolver un objeto estructurado en lugar de un simple `true`/`false` es que el formulario puede reaccionar de manera diferente según el tipo de NIF validado. Si es un CIF, puedes mostrar el tipo de entidad; si es un DNI o NIE inválido, puedes ofrecer un mensaje específico sobre la letra de control; si el formato no es reconocido, puedes sugerir un ejemplo.

```javascript
const resultado = IdeFormsNIF.validate(campo.value);

if (resultado.valid && resultado.type === "CIF") {
	mostrarInfo(`Empresa registrada como: ${resultado.entityName}`);
}

if (!resultado.valid && resultado.error === "caracter_control_incorrecto") {
	mostrarError("La letra o dígito de control no es correcto para este NIF");
}
```

Ese nivel de detalle es lo que marca la diferencia entre un formulario que rechaza sin explicar y uno que ayuda al usuario a corregir el problema.

## Qué cubre esta validación y qué no

El validador confirma que el NIF tiene un formato correcto y que el carácter de control es matemáticamente válido. No verifica que el NIF esté dado de alta en la Agencia Tributaria, que la empresa exista o que el DNI pertenezca a quien lo introduce. Para eso habría que consumir servicios externos —y entrar en territorios de privacidad y normativa que están bastante más allá de un campo de formulario.

Con este validador y los dos anteriores de la serie —[documentos de identidad](/validar-dni-nie-pasaporte/) e [IBAN](/validar-iban-formulario/)—, tienes cubiertos los tres identificadores que aparecen con más frecuencia en formularios de facturación y contratación en España.

A continuación puedes encontrar un validador funcional que cubre los tres casos: detecta automáticamente si el documento es un DNI, un NIE o un CIF, valida el carácter de control y, en el caso del CIF, identifica el tipo de entidad.
