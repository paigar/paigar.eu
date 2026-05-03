---
title: "Un sistema de layout con CSS Grid y columnas nombradas"
date: 2026-02-16
excerpt: "El problema clásico: el texto va a 65 caracteres, pero las imágenes quieren ancho completo y las citas se quedan más estrechas. La solución habitual acumula divs wrapper sin semántica. Con un grid de columnas nombradas basta con una clase en el elemento hijo para que decida su propio ancho — sin wrappers, sin media queries, sin max-width repetidos por todo el CSS."
tags: [css, layout, técnicas]
image: /img/css-grid-columnas-nombradas.png
image_alt: "Mesa de trabajo con papel cuadriculado, guías de layout dibujadas a mano y una regla metálica cruzando el encuadre."
---

Uno de los patrones que más uso en mis webs es un sistema de grid con columnas nombradas. Lo llamo "límites" y permite que cualquier elemento hijo defina su propio ancho sin necesidad de clases wrapper adicionales. Lo uso en este sitio, en Bilbonauta, y en casi todos los proyectos de Idenautas.

## El problema

En la mayoría de webs, el contenido tiene diferentes anchos. El texto principal suele estar a 65-70 caracteres para una lectura cómoda, pero a veces quieres que una imagen ocupe todo el viewport, que una cita sea más estrecha, o que una sección de tarjetas sea más ancha que el texto.

La solución habitual es anidar divs con `max-width` y `margin: 0 auto`:

```html
<!-- El markup típico -->
<div class="wrapper">
  <div class="narrow-wrapper">
    <p>Texto estrecho...</p>
  </div>
</div>
<div class="full-width">
  <img src="hero.jpg" alt="">
</div>
<div class="wrapper">
  <p>Texto normal...</p>
</div>
```

Esto funciona, pero ensucia el HTML con contenedores que no aportan semántica. Y empeora cuando tienes cinco o seis anchos diferentes.

## La solución: columnas nombradas

La idea es definir un único grid con columnas nombradas que representan los diferentes anchos:

```css
.limites {
  display: grid;
  grid-template-columns:
    [total-start] minmax(1rem, 1fr)
    [ancho-start] minmax(0, calc((var(--anchura-ancho) - var(--anchura-normal)) / 2))
    [normal-start] minmax(0, calc((var(--anchura-normal) - var(--anchura-estrecho)) / 2))
    [estrecho-start] min(var(--anchura-estrecho), 100% - 2rem)
    [estrecho-end] minmax(0, calc((var(--anchura-normal) - var(--anchura-estrecho)) / 2))
    [normal-end] minmax(0, calc((var(--anchura-ancho) - var(--anchura-normal)) / 2))
    [ancho-end] minmax(1rem, 1fr)
    [total-end];
}
```

Parece intimidante al principio, pero la lógica es sencilla: estás definiendo columnas simétricas que actúan como márgenes entre cada nivel de ancho. La columna central (`estrecho`) tiene el contenido más estrecho, y las columnas a los lados se expanden progresivamente hasta `total`, que ocupa todo el viewport.

## Cómo se usa

Cada hijo del grid elige su ancho con una simple clase:

```css
.limites > * { grid-column: normal; }
.limites > .ancho { grid-column: ancho; }
.limites > .estrecho { grid-column: estrecho; }
.limites > .total { grid-column: total; }
```

Y en el HTML:

```html
<main class="limites">
  <p>Este párrafo ocupa el ancho normal (65ch).</p>
  <section class="ancho">Esto es más ancho (55rem).</section>
  <blockquote class="estrecho">Esto es más estrecho.</blockquote>
  <img class="total" src="panoramica.jpg" alt="">
</main>
```

Sin wrappers, sin media queries para los anchos, sin `max-width` repetidos. El grid se encarga de todo.

## Por qué funciona

El truco está en las líneas nombradas de CSS Grid. Cuando defines `[nombre-start]` y `[nombre-end]`, puedes usar `grid-column: nombre` como shorthand. El navegador entiende que `nombre` se refiere al rango entre `nombre-start` y `nombre-end`.

Los `minmax()` hacen que sea responsive por naturaleza. Cuando el viewport se estrecha, las columnas exteriores colapsan a su mínimo (1rem de padding lateral) y las columnas intermedias llegan a 0. El resultado: en móvil, `normal`, `ancho` y `estrecho` convergen al mismo ancho, que es el viewport menos 2rem de margen.

## Las custom properties

Los anchos están definidos como variables CSS en los tokens del sitio:

```css
:root {
  --anchura-ancho: 55rem;
  --anchura-normal: 65ch;
  --anchura-estrecho: 50ch;
}
```

Esto permite ajustar los anchos en un solo lugar. Y como son custom properties, podrías cambiarlos por sección si alguna página necesita un layout diferente.

Un detalle importante: `--anchura-normal` usa `ch` (el ancho del carácter "0") en lugar de `rem` o `px`. Es deliberado — quiero que la anchura del texto dependa del tamaño de la fuente, no de un número arbitrario de píxeles. Si cambio la fuente o el tamaño, la anchura óptima de lectura se ajusta sola.

## Lo que no encontrarás en un framework

Este patrón no viene en Bootstrap, no está en Tailwind, no lo genera ningún plugin. Es el tipo de solución que aparece después de años trabajando con CSS, entendiendo las especificaciones y pensando en el problema real en vez de buscar la clase preconstruida.

No digo que los frameworks no tengan su lugar. Pero para un sistema de layout, cuatro líneas de CSS Grid y tres custom properties hacen más que cientos de clases de utilidad.
