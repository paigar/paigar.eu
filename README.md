# paigar.eu

Cuaderno digital personal de Juanjo. Apuntes, ideas, garabatos, artilugios, retrofuturismo.

## Stack

- **[Lume 3](https://lume.land)** sobre [Deno](https://deno.land) — generador de sitios estáticos.
- **[Vento](https://vento.js.org)** — motor de plantillas.
- **CSS plano** sin preprocesadores ni frameworks (custom properties + grid).
- **Fuentes self-hosted** (Major Mono Display, Newsreader VF, DM Mono) — cero peticiones a CDNs externas.
- **Sin JavaScript en cliente** por defecto.

## Desarrollo local

Requiere [Deno](https://deno.land) en el `PATH`.

```bash
# Servidor de desarrollo con live-reload (por defecto en :3000)
deno task serve

# Build estático a _site/
deno task build

# (Opcional) Re-descargar las fuentes y regenerar src/styles/fonts.css.
# Solo necesario si cambias familias o pesos en scripts/fetch-fonts.ts.
deno task fonts
```

## Estructura

```
.
├─ _config.ts              configuración Lume
├─ cli.ts                  entry point
├─ deno.json               tasks y dependencias
├─ scripts/
│  └─ fetch-fonts.ts       descarga fuentes desde Google Fonts
└─ src/
   ├─ _data/               helpers globales (slug, etc.)
   ├─ _includes/
   │  ├─ layouts/          base, post, page, tag
   │  └─ partials/         nameplate, colofón, post-card
   ├─ legal/               aviso legal, privacidad, cookies
   ├─ posts/               entradas (.md con frontmatter)
   ├─ static/              assets copiados a la raíz: img/, fonts/, favicon
   ├─ styles/
   │  ├─ main.css          hoja principal
   │  └─ fonts.css         @font-face self-hosted (generado)
   ├─ index.vto            portada
   ├─ archivo.vto          archivo cronológico por años
   ├─ etiquetas.vto        índice de etiquetas
   └─ etiqueta.page.ts     páginas dinámicas por etiqueta
```

## Cómo añadir una entrada

Crea `src/posts/slug-de-la-entrada.md` con este frontmatter:

```yaml
---
title: "Título de la entrada"
date: 2026-05-02
excerpt: "Resumen breve, una o dos frases. Aparece en cards y meta tags."
tags: [ideas, oficio, desarrollo web]
image: /img/imagen-cabecera.png
image_alt: "Descripción accesible de la imagen"
---
```

Campos opcionales del frontmatter:

- `image_contain: true` — si la cabecera es un logo o ilustración con espacio negativo, aplica `object-fit: contain` en lugar de `cover` (evita recortes feos).

Las imágenes van en `src/static/img/`. Las etiquetas se consolidan automáticamente: variantes con/sin tilde, mayúsculas/minúsculas o singular/plural se unifican por slug en el índice y las páginas de etiqueta.

## Fuentes

Las fuentes se sirven desde el propio dominio en `.woff2`. `scripts/fetch-fonts.ts` pide la CSS de Google Fonts con un User-Agent moderno, filtra los subsets `latin` y `latin-ext`, descarga los `.woff2` a `src/static/fonts/` y regenera `src/styles/fonts.css` con las `@font-face` apuntando a rutas locales.

Los `.woff2` están comiteados al repo como assets del proyecto: garantiza builds reproducibles, independencia de Google y despliegues sin acceso a red. `deno task fonts` solo se vuelve a ejecutar al cambiar familias o pesos.

## Licencia y autoría

Código y contenido © Juanjo. Todos los derechos reservados salvo indicación en contra dentro de cada entrada.
