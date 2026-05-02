---
title: Contacto
layout: layouts/page.vto
type: page
section_mark: Contacto
subtitle: Para escribirme sobre cualquier cosa relacionada con paigar.eu — una corrección, una propuesta, una pregunta o simplemente charlar de algo que has leído. Sin promesas de respuesta inmediata, pero sí de respuesta.
description: Página de contacto de paigar.eu — información, mapa y formulario para consultas, propuestas o conversación.
url: /contacto/
---

<dl class="contact-info">
  <div class="contact-info-row">
    <dt>Dirección</dt>
    <dd>Avenida Maurice Ravel 16<br>48007 Bilbao · Bizkaia</dd>
  </div>
  <div class="contact-info-row">
    <dt>Correo</dt>
    <dd><a href="mailto:info@idenautas.com">info@idenautas.com</a></dd>
  </div>
  <div class="contact-info-row">
    <dt>Teléfono</dt>
    <dd><a href="tel:+34944130535">+34 944 130 535</a></dd>
  </div>
  <div class="contact-info-row">
    <dt>WhatsApp</dt>
    <dd><a href="https://wa.me/34605639214" target="_blank" rel="noopener">+34 605 639 214</a></dd>
  </div>
</dl>

<a class="contact-map" href="https://maps.app.goo.gl/LTovhAJUiCW2UwxJA" target="_blank" rel="noopener" aria-label="Abrir ubicación en Google Maps">
  <img
    src="https://imagenes.paigar.es/idenautas-web/mapa-1200.jpg"
    srcset="https://imagenes.paigar.es/idenautas-web/mapa-480.jpg 480w,
            https://imagenes.paigar.es/idenautas-web/mapa-800.jpg 800w,
            https://imagenes.paigar.es/idenautas-web/mapa-1200.jpg 1200w,
            https://imagenes.paigar.es/idenautas-web/mapa-1920.jpg 1920w"
    sizes="(min-width: 720px) 680px, 100vw"
    alt="Ubicación de Idenautas en Bilbao — Avenida Maurice Ravel 16"
    loading="lazy">
  <span class="contact-map-cta">Abrir en Google Maps ↗</span>
</a>

## Escríbeme

<form class="contact-form" action="#" method="post" onsubmit="return false;" novalidate>

  <div class="contact-form-row">
    <label for="contact-name">Nombre</label>
    <input type="text" id="contact-name" name="name" autocomplete="name" required>
  </div>

  <div class="contact-form-row">
    <label for="contact-email">Correo</label>
    <input type="email" id="contact-email" name="email" autocomplete="email" required>
  </div>

  <div class="contact-form-row">
    <label for="contact-subject">Asunto</label>
    <input type="text" id="contact-subject" name="subject">
  </div>

  <div class="contact-form-row">
    <label for="contact-message">Mensaje</label>
    <textarea id="contact-message" name="message" rows="7" required></textarea>
  </div>

  <div class="contact-form-actions">
    <button type="submit" class="contact-form-button">Enviar mensaje</button>
  </div>

</form>
