---
title: "Imágenes Open Graph automáticas con Lume"
date: 2026-03-03
excerpt: "Cuando compartes un enlace en redes sociales, lo primero que ves es una imagen. Crear esas imágenes a mano para cada post es tedioso, y conectar un servicio externo es sobredimensionar el problema. La solución está en el propio build: un generador TypeScript produce un SVG por post, y resvg-wasm los convierte a PNG durante la compilación. Sin servicios externos, sin imágenes que mantener a mano."
tags: [lume, técnicas]
image: /img/imagenes-og-lume.png
image_alt: "Mesa de trabajo con tarjetas de vista previa de redes sociales dispersas, portátil al fondo mostrando código."
---

Cuando compartes un enlace en redes sociales, lo primero que ves es una imagen. Si no la tienes, tu enlace aparece como un rectángulo gris con texto plano. No es el fin del mundo, pero es una oportunidad perdida.

Crear esas imágenes a mano para cada post es tedioso. Y conectar un servicio externo para algo tan simple es sobredimensionar el problema. La solución está en el propio build: generar las imágenes durante la compilación, sin servicios externos.

La idea original la encontré en el artículo de Bernard Nijenhuis para Eleventy, y la he adaptado a Lume con las herramientas que Deno ofrece.

## La estrategia

El truco es usar SVG como plantilla intermedia. SVG es código, así que puedes generarlo programáticamente. Después, una librería WASM convierte ese SVG a PNG durante el build.

El flujo completo:

1. Un generador TypeScript (`og-images.page.ts`) produce un archivo SVG por cada post
2. El SVG contiene el título del post, la sección y el branding del sitio
3. Después del build, un evento `afterBuild` en `_config.ts` convierte todos los SVG a PNG con resvg
4. Las meta tags `og:image` apuntan a las imágenes PNG generadas

Todo ocurre en el build. No hay servicios externos, no hay APIs, no hay imágenes que mantener a mano.

## El generador: og-images.page.ts

En Lume, los archivos `.page.ts` son generadores: exportan una función que puede producir múltiples páginas. Cada `yield` genera un archivo. Es el equivalente a la paginación de otros SSG, pero con TypeScript puro.

El generador empieza recopilando todos los posts de ambas secciones con `search.pages()`:

```typescript
export default function* ({ search }: Lume.Data) {
	const posts = [...search.pages("bitacora"), ...search.pages("reflexiones")];

	for (const post of posts) {
		const title = post.title as string;
		const tags = (post.tags || []) as string[];
		// ...
	}
}
```

Para cada post hay que resolver tres cosas: partir el título en líneas, determinar la sección, y extraer el slug para el nombre de archivo.

### Partir el título en líneas

SVG no sabe partir texto automáticamente. Si el título tiene 80 caracteres, se sale del canvas. La solución es dividir el texto en líneas de máximo 36 caracteres, cortando siempre por espacios:

```typescript
const parts = title.split(" ");
const titleLines: string[] = parts.reduce((prev: string[], current: string) => {
	if (!prev.length) return [current];
	const lastLine = prev[prev.length - 1];
	if (lastLine.length + 1 + current.length > 36) {
		return [...prev, current];
	}
	prev[prev.length - 1] = lastLine + " " + current;
	return prev;
}, []);
```

El 36 depende del tamaño de fuente y del ancho del canvas. Con `font-size="48"` y un canvas de 1200 px, 36 caracteres encajan bien.

### Posición vertical del título

La posición Y del título se ajusta según el número de líneas, para que quede centrado visualmente en la imagen:

```typescript
const lineCount = titleLines.length;
let titleY: number;
if (lineCount === 1) titleY = 310;
else if (lineCount === 2) titleY = 280;
else if (lineCount === 3) titleY = 240;
else titleY = 200;
```

### Sección y slug

La sección se determina a partir de los tags del post. El slug se extrae de la URL — es el último segmento:

```typescript
const seccion = tags.includes("bitacora") ? "BITACORA" : "REFLEXIONES";

const urlParts = (post.url as string).split("/").filter(Boolean);
const slug = urlParts[urlParts.length - 1];
```

### El SVG

Con todos los datos preparados, se construye el SVG como un template literal. Las líneas del título se generan como `<tspan>` con la coordenada Y incrementada en 62 px por línea. El texto se escapa con una función auxiliar `escapeXml` para evitar que caracteres como `&` o `<` rompan el XML:

```typescript
const tspans = titleLines
	.map(
		(line: string, i: number) =>
			`    <tspan x="80" y="${titleY + i * 62}">${escapeXml(line)}</tspan>`,
	)
	.join("\n");
```

El diseño es intencionalmente sencillo: fondo oscuro (`#111118`), una barra naranja lateral (`#f86624`) como marca visual, el nombre de la sección en naranja, el título en claro, y el branding del sitio abajo. Todo con `<rect>`, `<text>`, `<line>` y `<circle>`.

Finalmente, el generador produce el archivo:

```typescript
yield {
  url: `/og-images/${slug}.svg`,
  content: svg,
};
```

## Por qué PNG y no JPEG o WebP

La elección del formato no es casual. Estas imágenes son texto sobre fondos planos, sin fotografías ni degradados complejos. PNG comprime ese tipo de contenido muy bien y mantiene los bordes del texto nítidos. JPEG introduciría artefactos de compresión visibles en las letras y líneas rectas — necesitarías calidad alta para disimularlos, y el archivo acabaría pesando lo mismo o más.

WebP sería ideal por tamaño, pero los crawlers de redes sociales (Facebook, LinkedIn, WhatsApp) históricamente han tenido problemas con WebP en `og:image`. Facebook recomienda oficialmente PNG o JPEG.

En la práctica, las imágenes generadas pesan entre 22 y 38 KB. No merece la pena buscar más optimización.

## La conversión: SVG a PNG con resvg-wasm

Los SVG no sirven directamente como imágenes Open Graph — los crawlers de redes sociales esperan formatos rasterizados. Aquí es donde la migración a Lume trajo un reto interesante.

En Eleventy, la conversión era trivial: `@11ty/eleventy-img` usa Sharp, que es una librería nativa de Node.js con bindings precompilados. En Deno, Sharp no funciona directamente. Y la mayoría de paquetes npm de conversión SVG→PNG están o deprecados, o usan binarios nativos incompatibles con Deno, o tienen APIs inestables.

La solución fue resvg-wasm, una versión compilada a WebAssembly del renderizador SVG de Mozilla. Funciona en cualquier plataforma sin binarios nativos.

La conversión se ejecuta en un evento `afterBuild` de Lume, cuando los SVG ya están generados en `_site/og-images/`:

```typescript
import { render as renderSvgToPng } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";

site.addEventListener("afterBuild", async () => {
	const ogDir = site.dest() + "/og-images";

	try {
		const entries = [...Deno.readDirSync(ogDir)];
		const svgFiles = entries.filter((e) => e.name.endsWith(".svg"));

		if (svgFiles.length === 0) return;

		let converted = 0;
		for (const entry of svgFiles) {
			const svgPath = `${ogDir}/${entry.name}`;
			const pngPath = svgPath.replace(".svg", ".png");
			const svgContent = await Deno.readTextFile(svgPath);

			const pngBuffer = await renderSvgToPng(svgContent);
			await Deno.writeFile(pngPath, pngBuffer);
			await Deno.remove(svgPath);
			converted++;
		}

		console.log(`[og-images] ${converted} SVG convertidos a PNG`);
	} catch (err) {
		if (!(err instanceof Deno.errors.NotFound)) {
			console.error("[og-images] Error:", err);
		}
	}
});
```

La API es mínima — una sola función `render()` que recibe SVG como string y devuelve PNG como `Uint8Array`. Por cada SVG, genera el PNG y elimina el original.

## Las meta tags

Solo queda apuntar las meta tags a las imágenes generadas. En el layout base:

```html
{{ if tags && (tags.includes("bitacora") || tags.includes("reflexiones")) }}
<meta
	property="og:image"
	content="{{ metadata.url }}/og-images/{{ page.src.slug }}.png" />
{{ else }}
<meta property="og:image" content="{{ metadata.url }}/og-images/default.png" />
{{ /if }}
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
```

Los posts obtienen su imagen específica. El resto de páginas usan una imagen genérica con el nombre y la descripción del sitio. El valor `summary_large_image` en `twitter:card` hace que la imagen se muestre en grande al compartir en X.

## Sobre las fuentes

Un detalle importante: el renderizador SVG usa las fuentes del sistema donde se ejecuta el build. Si usas una tipografía personalizada que no está instalada en la máquina, el resultado será diferente. En mi caso uso Arial como fuente para las imágenes OG, que está disponible en prácticamente cualquier sistema.

## El archivo completo

Para referencia, este es el `og-images.page.ts` completo tal como funciona en producción:

```typescript
export default function* ({ search }: Lume.Data) {
	const posts = [...search.pages("bitacora"), ...search.pages("reflexiones")];

	for (const post of posts) {
		const title = post.title as string;
		const tags = (post.tags || []) as string[];

		const parts = title.split(" ");
		const titleLines: string[] = parts.reduce(
			(prev: string[], current: string) => {
				if (!prev.length) return [current];
				const lastLine = prev[prev.length - 1];
				if (lastLine.length + 1 + current.length > 36) {
					return [...prev, current];
				}
				prev[prev.length - 1] = lastLine + " " + current;
				return prev;
			},
			[],
		);

		const lineCount = titleLines.length;
		let titleY: number;
		if (lineCount === 1) titleY = 310;
		else if (lineCount === 2) titleY = 280;
		else if (lineCount === 3) titleY = 240;
		else titleY = 200;

		const seccion = tags.includes("bitacora") ? "BITACORA" : "REFLEXIONES";

		const urlParts = (post.url as string).split("/").filter(Boolean);
		const slug = urlParts[urlParts.length - 1];

		const tspans = titleLines
			.map(
				(line: string, i: number) =>
					`    <tspan x="80" y="${titleY + i * 62}">${escapeXml(line)}</tspan>`,
			)
			.join("\n");

		const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">

  <!-- Fondo -->
  <rect width="1200" height="630" fill="#111118"/>

  <!-- Barra naranja lateral -->
  <rect x="0" y="0" width="8" height="630" fill="#f86624"/>

  <!-- Seccion -->
  <text x="80" y="${titleY - 60}" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#f86624" letter-spacing="3">${seccion}</text>

  <!-- Titulo -->
  <text font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="bold" fill="#dcdcd4">
${tspans}
  </text>

  <!-- Linea separadora -->
  <line x1="80" y1="530" x2="1120" y2="530" stroke="#2a2a3a" stroke-width="1"/>

  <!-- Branding -->
  <text x="80" y="575" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#8e8e86">paigar.es</text>

  <!-- Punto naranja -->
  <circle cx="1120" cy="568" r="6" fill="#f86624"/>

</svg>`;

		yield {
			url: `/og-images/${slug}.svg`,
			content: svg,
		};
	}
}

function escapeXml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}
```

## La alternativa oficial: el plugin og_images

Lume tiene un plugin oficial de imágenes Open Graph que resuelve el mismo problema. Usa Satori (de Vercel) para convertir componentes JSX en SVG, y Sharp para rasterizar a PNG. Los layouts se definen como funciones JSX con estilos inline, y se asignan desde el frontmatter con `openGraphLayout`.

Es una opción válida si prefieres un enfoque más integrado con el ecosistema de Lume. En mi caso elegí la implementación manual por varias razones:

- **Control total del SVG** — puedo usar cualquier elemento SVG (`<line>`, `<circle>`, `<tspan>`) sin las limitaciones de Satori, que solo soporta un subconjunto de CSS basado en flexbox.
- **Sin Sharp** — Sharp es una librería nativa de Node.js que no funciona directamente en Deno. Con resvg-wasm no hay binarios nativos ni dependencias de plataforma.
- **Menos dependencias** — el generador es un único archivo TypeScript de 89 líneas, sin configuración JSX ni paquetes adicionales.

El plugin oficial es más cómodo si no necesitas un diseño muy específico o si ya usas JSX en tu proyecto. Pero para un sitio que busca minimizar dependencias, la solución manual encaja mejor.

## El resultado

Con esta solución, cada vez que hago build se generan automáticamente las imágenes de vista previa para todos los posts. Sin intervención manual, sin servicios externos, sin imágenes que versionar en el repositorio. Solo código que genera código que genera imágenes.

La técnica original es para Eleventy con Sharp. Mi adaptación a Lume usa generadores `.page.ts` para la creación de SVGs y resvg-wasm para la conversión a PNG, eliminando la dependencia de Node.js.
