---
title: "Cómo construir un conversor de Markdown a HTML que funcione en el navegador"
date: 2026-05-14
excerpt: "Markdown es el formato de escritura más útil que existe, pero convertirlo a HTML sin depender de un servidor ni de servicios externos tiene su miga. Aquí va cómo funciona la herramienta y por qué la hice."
tags: [apuntes, javascript, desarrollo-web]
image: conversor-markdown-html.png
image_alt: "Cuaderno de notas abierto junto a un teclado mecánico, con código HTML visible en la pantalla al fondo, luz natural de escritorio"
prototype: markdown-html
---

Markdown es una de esas convenciones que, una vez que las adoptas, no puedes vivir sin ellas. Es legible en crudo, es fácil de escribir, y casi cualquier sistema moderno lo entiende. El problema aparece cuando necesitas entregarlo en HTML —para pegar en un CMS antiguo, para incrustar en un correo con formato, para montar una página rápida sin entorno de compilación— y la única opción disponible es pegar el texto en algún servicio online que no sabes muy bien dónde guarda lo que escribes.

De ahí viene esta herramienta: un conversor que funciona íntegramente en el navegador. Sin servidores, sin API keys, sin que el texto que escribas salga de tu pantalla.

## La librería: marked.js

La conversión de Markdown a HTML es un problema resuelto. No tiene ningún sentido reinventar el parser cuando existe [marked.js](https://marked.js.org), una librería de menos de 50 KB que lleva más de una década siendo el estándar de facto para esto en JavaScript. Soporta la especificación CommonMark, GitHub Flavored Markdown, bloques de código con fence, tablas, definiciones de enlace, listas de tareas y una lista larga de extensiones opcionales.

La configuración mínima para que funcione bien:

```javascript
marked.setOptions({
  breaks: true,  // salto de línea simple → <br>
  gfm: true,     // GitHub Flavored Markdown
});

const html = marked.parse(markdownText);
```

Con `gfm: true` se activan las extensiones de GitHub: tachado con `~~texto~~`, tablas, listas de tareas con `- [x]`. Con `breaks: true`, cada salto de línea simple en el Markdown se convierte en un `<br>` en el HTML, que es el comportamiento que la mayoría de la gente espera cuando escribe en una interfaz de texto.

## Carga dinámica: la librería llega cuando hace falta

En lugar de incluir marked.js como un `<script>` bloqueante en el `<head>`, la herramienta lo carga de forma dinámica justo cuando se necesita. El patrón es sencillo:

```javascript
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked@12/marked.min.js';
script.onload = function () { init(); };
script.onerror = function () { mostrarError(); };
document.head.appendChild(script);
```

Esto tiene dos ventajas. La primera es que no bloquea el renderizado inicial de la página: el HTML y el CSS se procesan de inmediato, la interfaz aparece completa, y la librería llega en segundo plano. La segunda es que el manejo de errores es explícito: si el CDN no responde —sin conexión, CDN caído, red corporativa restrictiva— el `onerror` permite mostrar un mensaje útil en lugar de un error silencioso de `marked is not defined`.

La versión está fijada con `@12` para evitar roturas por cambios de API en actualizaciones mayores futuras. No exactamente `@12.0.0` sino el rango mayor, lo que da acceso a parches y correcciones de seguridad sin riesgo de cambios de comportamiento.

## Conversión en tiempo real

El corazón de la herramienta es un único event listener:

```javascript
input.addEventListener('input', function () {
  const html = marked.parse(input.value);
  codeEl.textContent = html;    // vista HTML: escapa los tags
  previewEl.innerHTML = html;   // vista previa: renderiza el HTML
});
```

La distinción entre `textContent` y `innerHTML` es la que hace que los dos modos funcionen correctamente. En la pestaña HTML, usar `textContent` convierte los caracteres `<` y `>` en entidades HTML automáticamente, así que `<h1>Título</h1>` aparece como texto plano legible en lugar de renderizarse como un encabezado. En la vista previa, `innerHTML` hace exactamente lo contrario: interpreta el HTML generado y lo muestra como si fuera una página normal.

## La pestaña de vista previa

El mecanismo de tabs es puro CSS y un poco de JS sin librerías. Hay dos elementos: el `<pre>` con el código HTML y un `<div>` con la vista renderizada. Uno o el otro tiene el atributo `hidden` en cualquier momento:

```javascript
function switchTab(tab) {
  if (tab === 'html') {
    outputEl.style.display = '';
    previewEl.hidden = true;
  } else {
    outputEl.style.display = 'none';
    previewEl.hidden = false;
  }
}
```

La vista previa tiene sus propios estilos tipográficos dentro del scope del componente: encabezados en DM Serif Display, código en DM Mono, blockquotes con la línea roja de acento. No es para imitar el resultado final del sitio destino —eso depende de cada CSS— sino para que el contenido sea legible mientras escribes.

## Copiar al portapapeles

La Clipboard API moderna hace que esto sea trivial:

```javascript
navigator.clipboard.writeText(currentHtml).then(function () {
  copyBtn.textContent = '¡Copiado!';
  setTimeout(function () {
    copyBtn.textContent = 'Copiar';
  }, 2000);
});
```

El botón da feedback visual durante dos segundos y vuelve a su estado original. Sin librerías de toast, sin `execCommand('copy')` que llevan deprecadas años, sin nada raro.

## Las estadísticas de texto

La barra de estado muestra caracteres, palabras y líneas en tiempo real. El conteo de palabras usa la expresión más simple posible:

```javascript
const words = text.trim() ? text.trim().split(/\s+/).length : 0;
```

El `trim()` antes de hacer split evita que una cadena vacía o con solo espacios cuente como una palabra. El regex `/\s+/` agrupa cualquier secuencia de espacios, tabuladores y saltos de línea como un único separador, que es el comportamiento correcto para texto en prosa.

No es un contador de palabras perfectamente preciso para todos los idiomas —el japonés y el chino, sin espacios, necesitarían un enfoque diferente— pero para texto en español o inglés funciona bien.

## Lo que no hace esta herramienta

marked.js no sanitiza el HTML que genera. Si el Markdown de entrada contiene HTML crudo —que Markdown permite—, ese HTML pasa al resultado tal cual. Para un uso personal, donde el autor controla el input, esto no es un problema. Para casos donde el Markdown viene de usuarios externos y el resultado se va a insertar en una página, habría que pasar el output por un sanitizador como [DOMPurify](https://github.com/cure53/DOMPurify) antes de usarlo.

La herramienta tampoco produce HTML con clases, IDs ni atributos de accesibilidad generados automáticamente. Lo que sale es HTML semántico estándar: `<h1>`, `<p>`, `<strong>`, `<code>`, `<blockquote>`. Limpio y listo para estilizar.
