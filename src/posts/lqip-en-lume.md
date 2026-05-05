---
title: "LQIP en Lume: placeholders inline generados en build"
date: 2026-04-23
excerpt: "LQIP llena el hueco que deja una imagen mientras descarga: una versión diminuta y borrosa que se sustituye con un cross-fade cuando la real entra. Aquí cuento cómo lo implementé en Idenautas con un script Deno de cien líneas que genera los placeholders en build y los incrusta inline en el HTML, sin un solo byte de JavaScript de cliente más allá del onload del propio img."
tags: [apuntes, desarrollo web, lume]
image: lqip-en-lume.png
image_alt: "Portátil en un escritorio"
templateEngine: md
---

Cuando una imagen tarda en descargarse del CDN, el navegador deja un hueco. La página da un saltito cuando la imagen finalmente entra. Si he reservado el espacio con `width` y `height` no hay layout shift, pero el hueco vacío sigue ahí. Y si la conexión es lenta, el hueco dura más de lo razonable.

LQIP — _Low Quality Image Placeholder_ — es la técnica que llena ese hueco: durante la espera muestro una versión diminuta y borrosa de la imagen, y cuando la real termina de descargar, sustituyo una por la otra con un cross-fade. Es lo que hace Medium desde hace años, y antes lo hizo Pinterest.

La técnica en sí está documentada en mil sitios. Lo que cuento aquí es cómo la implementé en [Idenautas](https://idenautas.com), que corre sobre Lume: el script Deno que genera los placeholders en build, cómo los incrusto en el HTML, y cómo encajo todo en `_config.ts` sin meter JavaScript de cliente más allá del `onload` del propio `<img>`.

## La idea

Tres decisiones que conviene fijar antes de escribir nada:

1. **El placeholder se genera en build, no en runtime.** El servidor (o el CDN, en mi caso Bunny) no tiene que hacer nada en cada visita. La consecuencia es que el placeholder viaja inline en el HTML como `data:image/jpeg;base64,...` y aparece sin una sola petición HTTP adicional.
2. **El placeholder es una versión de 16 píxeles de ancho de la propia imagen, en JPG.** A esa resolución el peso ronda los 300-500 bytes. Codificado en base64 son unos ~600 bytes por imagen — irrelevante en el HTML.
3. **El cross-fade lo hace el navegador.** El `<img>` lleva un `onload` que añade la clase `.loaded` a su contenedor, y el CSS hace el resto con `opacity` y `transition`. Cero JavaScript propio, cero IntersectionObserver, cero librerías.

El truco está en que las tres decisiones son interdependientes. Si genero el placeholder en runtime, no puedo incrustarlo. Si no es minúsculo, no puedo permitirme incrustarlo en cada `<img>`. Si no lo incrusto, necesito una segunda petición HTTP solo para el placeholder, y eso elimina la mitad de la ventaja.

## El script: `scripts/lqip.ts`

El script tiene tres responsabilidades: encontrar las imágenes que se usan en el sitio, descargar su versión de 16 píxeles del CDN, y guardar el resultado en un JSON cacheable.

### Descubrir las imágenes referenciadas

No quiero mantener una lista de imágenes a mano. El script camina `src/` con `@std/fs/walk` y busca dos patrones en los archivos `.md`, `.vto`, `.njk` y `.ts`:

- Llamadas a los shortcodes `{{ img("ruta") }}` y `{{ cardPicture("ruta") }}`.
- La clave `heroImage:` en el frontmatter.

```typescript
const SHORTCODE_RE =
	/(?:\{%[-\s]*|\{\{[-\s]*(?:await\s+)?)(?:img|cardPicture)\s*\(?\s*["']([^"']+)["']/g;
const HERO_RE = /^heroImage:\s*(.+)$/m;

async function findImagePaths(): Promise<string[]> {
	const paths = new Set<string>();
	for await (const entry of walk(SRC_DIR, {
		exts: [".md", ".vto", ".njk", ".ts"],
		skip: [/node_modules/, /_data\/lqip\.json$/],
	})) {
		if (!entry.isFile) continue;
		const content = await Deno.readTextFile(entry.path);
		let m: RegExpExecArray | null;
		SHORTCODE_RE.lastIndex = 0;
		while ((m = SHORTCODE_RE.exec(content)) !== null) paths.add(m[1]);
		const hero = content.match(HERO_RE);
		if (hero) paths.add(hero[1].trim().replace(/^["']|["']$/g, ""));
	}
	return [...paths];
}
```

El regex de los shortcodes acepta tanto la sintaxis Nunjucks heredada (`{% img "..." %}`) como la nueva de Vento (`{{ img("...") }}`). Migrar de una a otra es trabajo que hago a fuego lento, así que el script tiene que entender ambas durante el periodo de transición.

Es una solución imperfecta —un parser real entendería el código sin riesgo de falsos positivos—, pero a la práctica el regex acierta en el 100% de los casos del sitio. Si una imagen se referencia desde un layout o un sitio menos estándar, basta con añadir su patrón al regex.

### Descargar los placeholders del CDN

Las imágenes de Idenautas viven en Bunny Storage y el build no las regenera: las versiones a 480 px, 800 px, 1200 px, 1920 px y 16 px (esta última, mi placeholder) ya están subidas con sufijo en el nombre. La ruta de cada placeholder es predecible:

```typescript
function imgBase(imgPath: string): string {
	const i = imgPath.lastIndexOf(".");
	return i >= 0 ? imgPath.slice(0, i) : imgPath;
}

// imgBase("portada.jpg") + "-16.jpg" → "portada-16.jpg"
```

Para cada imagen, descargo `${CDN}${base}-16.jpg` y la convierto a data URI:

```typescript
async function fetchBase64(url: string): Promise<string> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const type = res.headers.get("content-type") ?? "image/jpeg";
	const bytes = new Uint8Array(await res.arrayBuffer());
	return `data:${type};base64,${encodeBase64(bytes)}`;
}
```

`encodeBase64` viene de `jsr:@std/encoding/base64`. Es una primitiva de la librería estándar de Deno; no añado dependencias.

### El cache: `src/_data/lqip.json`

El detalle que marca la diferencia entre un script aceptable y uno usable a diario es el cache. Sin cache, cada `npm run publicar` haría tantas peticiones HTTP como imágenes hay en el sitio. Con cache, solo se descargan las nuevas:

```typescript
let existing: Record<string, string> = {};
try {
	existing = JSON.parse(await Deno.readTextFile(OUTPUT));
} catch {
	// primera ejecución, no hay cache
}

const lqip: Record<string, string> = {};
let downloaded = 0;
for (const img of images) {
	if (existing[img]) {
		lqip[img] = existing[img];
		continue;
	}
	const url = `${CDN}${imgBase(img)}-16.jpg`;
	try {
		lqip[img] = await fetchBase64(url);
		downloaded++;
	} catch (err) {
		console.error(`  [lqip] ✗ ${img}: ${(err as Error).message}`);
	}
}
```

El JSON resultante es un mapa `ruta-original → data URI`. El script lo guarda en `src/_data/lqip.json` solo si el contenido ha cambiado — escribir el archivo en cada build invalidaría el watcher de Lume sin necesidad y dispararía recargas en desarrollo:

```typescript
const prevJson = JSON.stringify(existing, null, 2);
const nextJson = JSON.stringify(lqip, null, 2);
if (prevJson !== nextJson) {
	await Deno.writeTextFile(OUTPUT, nextJson);
}
```

Otra ventaja del JSON cacheado: las imágenes que ya no se referencian desde ningún lado se eliminan del mapa automáticamente, porque el script reconstruye el objeto desde cero a partir del escaneo. No necesita una lógica de garbage collection aparte.

## Integración con Lume

El script expone una función `generateLQIP()` para poder llamarse desde `_config.ts`. La conexión es mínima:

```typescript
import { generateLQIP } from "./scripts/lqip.ts";

let lqipData: Record<string, string> = {};
try {
	lqipData = JSON.parse(await Deno.readTextFile("./src/_data/lqip.json"));
} catch {
	// primer build, todavía no hay cache
}

site.addEventListener("beforeBuild", async () => {
	lqipData = await generateLQIP({ quiet: false });
});
```

Dos detalles aquí:

- **Carga del cache al arrancar.** El `JSON.parse` inicial existe para que los servidores de desarrollo en frío arranquen con el mapa ya rellenado, sin esperar a la primera regeneración.
- **`beforeBuild` y no `beforeUpdate`.** En desarrollo, mientras edito un post, no quiero que cada cambio dispare una conexión al CDN. La regeneración solo ocurre en builds completos.

Con `lqipData` en memoria, los shortcodes que generan el HTML pueden consultarlo:

```typescript
site.data("img", function (imgPath: string, alt: string, ...) {
  const lqip = lqipData[imgPath] || imgUrl(imgPath, 16, "jpg");
  return `<div class="lqip-wrap" style="background-image:url('${lqip}')">
    <picture>...</picture>
  </div>`;
});
```

El fallback `|| imgUrl(imgPath, 16, "jpg")` cubre el caso en el que añado una imagen al post pero todavía no he regenerado el cache. En vez de quedarme sin placeholder, sirvo la URL del placeholder directamente desde el CDN — funciona, solo es marginalmente menos eficiente porque el navegador hace una petición HTTP extra mientras llega la imagen real.

## El HTML resultante

Para cada imagen, el shortcode produce este HTML:

```html
<div
	class="lqip-wrap"
	style="background-image:url('data:image/jpeg;base64,/9j/4AAQ...')">
	<picture>
		<source type="image/avif" srcset="foto-480.avif 480w, ..." sizes="..." />
		<source type="image/webp" srcset="foto-480.webp 480w, ..." sizes="..." />
		<img
			src="foto-1200.jpg"
			srcset="foto-480.jpg 480w, ..."
			sizes="..."
			alt="..."
			loading="lazy"
			width="1200"
			height="800"
			onload="this.parentNode.classList.add('loaded')" />
	</picture>
</div>
```

Tres piezas:

- **El wrapper lleva el placeholder como `background-image`.** Aparece instantáneo: ya viaja en el HTML.
- **El `<picture>` sirve la imagen definitiva** con `srcset` para densidades y formatos modernos. Eso es ortogonal al LQIP — es la técnica de imágenes responsive, aplicada a la imagen real.
- **El `onload` añade `.loaded`** al wrapper cuando el `<img>` termina de descargar, lo que dispara el cross-fade.

## El CSS: cross-fade sin JavaScript

```css
.lqip-wrap {
	position: relative;
	background-size: cover;
	background-position: center;
	background-repeat: no-repeat;
	overflow: hidden;
	width: 100%;
	height: 100%;
}

.lqip-wrap > img {
	display: block;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0;
	transition: opacity 0.4s ease;
}

.lqip-wrap.loaded > img {
	opacity: 1;
}
```

El placeholder es el fondo del wrapper. El `<img>` empieza con `opacity: 0`, ocupando el mismo espacio. Cuando dispara su `onload`, el wrapper recibe `.loaded`, el `<img>` pasa a `opacity: 1`, y la transición de 0,4 s hace el cross-fade.

`object-fit: cover` se asegura de que la imagen real cubra el wrapper sin deformarse, lo que importa porque el `width` y `height` del `<img>` definen la proporción pero el contenedor real lo controla CSS.

## Por qué 16 píxeles y por qué JPG

Probé valores entre 8 y 32 píxeles. Por debajo de 16 el placeholder se nota pixelado en la transición; por encima, el peso crece más rápido que la mejora visual. El JPG a 16 px y calidad por defecto pesa unos 350 bytes — aceptable.

Sobre el formato: aquí JPG gana a WebP y AVIF. A 16 píxeles las cabeceras de WebP/AVIF representan un porcentaje ridículamente alto del archivo, y la ganancia de compresión sobre JPG es marginal. Además, los placeholders viajan en el HTML, donde el ahorro de bytes brutos sí cuenta — y JPG genera buffers pequeños y predecibles. He medido los tres formatos: a 16 px, JPG es el más ligero en mi caso.

## Por qué no BlurHash, Plaiceholder o transform_images

Existen alternativas conocidas:

- **BlurHash** codifica el placeholder como un string ASCII de unos 30 caracteres y lo reconstruye con JavaScript en el cliente. El string es más compacto que una data URI base64, sí — pero requiere ~3 KB de JavaScript en cada página y un canvas para reconstruir el placeholder. Para una web sin frameworks no compensa.
- **Plaiceholder** es una librería de Node.js que genera LQIPs (entre otros formatos: blurhash, color dominante, SVG). En Idenautas no me hace falta el paso de generar la imagen pequeña — Bunny ya tiene la versión de 16 px subida —, y prefiero un script de cien líneas que entiendo entero a una dependencia más.
- **El plugin oficial `transform_images`** procesa imágenes con Sharp dentro del propio build de Lume. No genera placeholders como tales, pero sí puede producir la variante de 16 px y leerla luego para incrustarla en base64 — todo en una sola pasada de Lume, sin un script aparte como el mío. Si dejas que Lume gestione también tus variantes responsive con `transform_images` o el plugin `picture`, esa ruta es más coherente. En Idenautas las variantes están subidas a Bunny Storage por un pipeline anterior a Lume, así que el script de LQIP solo se ocupa del placeholder; si arrancase el proyecto desde cero hoy, probablemente movería todo el flujo de imágenes a `transform_images` y haría el LQIP ahí mismo.

Si fuera un proyecto donde las imágenes solo viven a tamaño completo y necesito regenerarlas, `transform_images` (o `sharp` directamente) sería la opción razonable. Mi pipeline ya produce las variantes responsive con un script aparte, así que añadir `-16.jpg` a esa lista era trivial.

## Lo que cuesta y lo que aporta

El coste, en bytes incrustados, es de unos 600 bytes por imagen en el HTML. En una página con cinco imágenes son 3 KB extra antes de cualquier compresión gzip — y gzip los reduce todavía más, porque las cabeceras JPG son repetitivas entre placeholders. Es un coste muy bajo para evitar huecos vacíos en la primera pintada.

Lo que aporta es perceptual: la página se siente más rápida sin serlo necesariamente. Las imágenes ya están en su sitio cuando entras, solo enfocan. El usuario rara vez identifica conscientemente la técnica, pero nota la diferencia cuando la quitas.

Es una de esas inversiones de unas pocas horas que se quedan trabajando en silencio durante años. Y en Lume, con un script Deno y un evento `beforeBuild`, encaja sin necesidad de plugins ni configuración adicional.
