---
layout: layouts/base.vto
templateEngine: vto
extraStyles: ["pages.css"]
title: Qué es esto
url: /que-es-esto/
type: page
section_mark: PAIGAR
subtitle: "Un cajón desastre. Escribo sobre lo que me apetece cuando me apetece: desarrollo web, ilustración, videojuegos, ciencia ficción, herramientas pequeñas, cosas que me han llamado la atención. Sin línea editorial, sin métricas, sin red de seguridad"
description: Quién escribe paigar.eu, qué es este sitio y cómo ponerse en contacto.
image: que-es-esto.png
image_alt: "Retrato ilustrado de perfil sobre fondo oscuro con textura de cuaderno, líneas de código y elementos de diseño retrofuturista"
---

<article class="page">

  <div class="container">
    <header class="page-header">
      <div class="page-eyebrow">{{ section_mark }}</div>
      <h1 class="page-title">{{ title }}</h1>
      <p class="page-subtitle">{{ subtitle }}</p>
    </header>
  </div>

  <div class="container">
    {{ set esenciales = esencial.map(url => search.page("url=" + url)).filter(p => p) }}
    {{ set esencialesGrid = esenciales.slice(0, -1) }}
    {{ set esencialesFeatured = esenciales[esenciales.length - 1] }}
    <ol class="home-grid-cards minimal" style="padding: 0; margin-block: 80px;">
      {{ for post of esencialesGrid }}
        <li>{{ include "partials/post-card.vto" { post } }}</li>
      {{ /for }}
    </ol>
  </div>

  <div class="container">
  {{ if esencialesFeatured }}
    {{ include "partials/feature-split.vto" { post: esencialesFeatured } }}
  {{ /if }}
  </div>

  <div class="container" style="margin-block: 80px;">
    <aside class="archive-banner" aria-label="Blog">
      <div class="archive-banner-text">
        <span class="archive-banner-eyebrow">El blog</span>
        <h2 class="archive-banner-title">Artículos, notas y experimentos.</h2>
        <p class="archive-banner-sub">Tecnología, diseño y ciencia ficción.</p>
      </div>
      <a href="/" class="archive-banner-link">
        Ir al blog
        <span class="arrow">→</span>
      </a>
    </aside>
  </div>

</article>