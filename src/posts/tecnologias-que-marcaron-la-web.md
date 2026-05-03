---
title: "Las tecnologías que marcaron la web (vistas desde dentro)"
date: 2026-01-12
excerpt: "Llevo en internet desde antes de que internet tuviera imágenes. Desde Lynx hasta CSS Grid, pasando por las guerras de navegadores, Flash, Geocities y jQuery. No es una lista histórica — es un recorrido por lo que viví, con la perspectiva de alguien que estuvo ahí cuando cada una de estas cosas era el futuro inevitable de la web."
tags: [oficio, opinión]
image: tecnologias-que-marcaron-la-web.png
image_alt: "Monitor CRT antiguo encendido en una habitación oscura, con el cursor parpadeante en pantalla."
---

Llevo en internet desde antes de que internet tuviera imágenes. No es una exageración: mis primeras sesiones fueron con Lynx sobre Linux, un navegador de texto puro donde la web era párrafos, enlaces subrayados y poco más. No había colores, no había layout, no había nada que se pareciera a lo que hoy entendemos por "página web". Y sin embargo, la sensación de acceder a información de un servidor al otro lado del mundo a través de una terminal ya era extraordinaria.

Desde ahí hasta hoy he visto pasar tecnologías que en su momento parecían definitivas y que desaparecieron sin dejar rastro. Este es un recorrido por las que más me marcaron, no como lista histórica, sino como experiencia vivida.

## Lynx y la web antes de la web

Antes de que los navegadores gráficos llegaran a los escritorios, la web se navegaba en modo texto. Lynx renderizaba HTML como texto plano con enlaces numerados. No había CSS. No había JavaScript. No había imágenes inline. Solo contenido.

Es fácil idealizar esa época desde la nostalgia, pero la realidad es que era limitada. Lo importante es lo que demuestra: que la web nació como un sistema de documentos enlazados, no como una plataforma de aplicaciones. Ese origen importa, porque muchos de los problemas que tenemos hoy vienen de forzar la web a ser algo que no fue diseñada para ser.

## Netscape: cuando la web se hizo visual

La aparición de Netscape Navigator lo cambió todo. De repente había imágenes, había color, había la posibilidad de que una página tuviera personalidad visual. Recuerdo la primera vez que vi una web con fondo de color y texto formateado — después de meses con Lynx, era como pasar del blanco y negro al color.

Netscape no solo fue un navegador. Fue el catalizador que convirtió la web en un medio de masas. Antes de Netscape, internet era de universidades y técnicos. Después de Netscape, era de todos. También nos trajo JavaScript — un lenguaje que Marc Andreessen encargó crear en diez días y que hoy domina el ecosistema entero. Nadie habría apostado por eso en 1995.

Y nos trajo la etiqueta `<blink>`. Esa sí que nadie la echa de menos.

## Las guerras de los navegadores

Netscape contra Internet Explorer. La primera gran guerra del software. Microsoft empezó a incluir IE gratis con Windows y en pocos años Netscape pasó de dominar el mercado a desaparecer. Para los desarrolladores fue un desastre: cada navegador implementaba HTML y CSS a su manera, y escribir código que funcionara en ambos era un ejercicio de paciencia y hacks.

Recuerdo los conditional comments de IE, los underscore hacks, el `* html`. Recuerdo tener que probar cada página en cuatro navegadores diferentes. Recuerdo la frustración de que algo perfecto en Netscape se rompiera en IE, y viceversa.

Los que empiezan ahora a desarrollar no saben la suerte que tienen con la compatibilidad actual entre navegadores. Que Firefox, Chrome, Safari y Edge rendericen prácticamente igual el mismo código es un lujo que se construyó sobre años de frustración colectiva y esfuerzos de estandarización.

## La tiranía de Internet Explorer 6

IE6 merece su propia sección. Fue el navegador más odiado de la historia del desarrollo web, y al mismo tiempo el más longevo. Cuando Microsoft ganó la guerra de los navegadores, dejó de actualizar IE durante años. IE6 se quedó congelado en 2001 mientras la web avanzaba a su alrededor.

El problema no era solo que IE6 fuera malo. El problema es que millones de personas seguían usándolo — algunas hasta bien entrado 2010 — y los clientes te decían "tiene que funcionar en IE6". Eso significaba renunciar a casi todo lo que CSS podía hacer y vivir en un mundo de floats, clearfix y `zoom: 1`.

El día que los grandes sitios dejaron de dar soporte a IE6 fue un día de celebración real en la comunidad web. No exagero. Hubo contadores de cuenta atrás y campañas enteras dedicadas a enterrarlo.

## Geocities: la web personal en estado puro

Entre todas las tecnologías y plataformas que he visto, Geocities ocupa un lugar especial. No porque fuera bueno — técnicamente era horrible. Fondos de estrellas, textos parpadeantes, GIFs animados de obras en construcción, contadores de visitas que nunca llegaban a tres cifras.

Pero Geocities representaba algo que hemos perdido: la web como espacio personal sin pretensiones. La gente hacía páginas porque quería, no porque tuviera que posicionar una marca o monetizar una audiencia. Eran feas, desordenadas, a veces ilegibles. Pero eran honestas. Cada página era alguien diciendo "esto soy yo, esto me gusta, esto quiero compartir".

Cuando Yahoo cerró Geocities en 2009, se llevó millones de páginas personales. Se perdió una parte de la historia de la web que no vamos a recuperar. Y lo que vino después — Facebook, Instagram, Twitter — nos dio alcance a cambio de quitarnos propiedad. Ya no son tus páginas. Son sus plataformas.

## Flash: el rey que se creía inmortal

Si has trabajado en la web entre 2000 y 2010, has sufrido Flash. No como desarrollador — como usuario. Esas intros animadas que tardaban un minuto en cargar antes de dejarte ver el contenido. Esos menús que no respondían al botón derecho. Esas webs enteras donde no podías copiar texto ni usar el botón de atrás.

Como herramienta, Flash era impresionante. Permitía cosas que HTML y CSS no podían ni soñar: animaciones complejas, vídeo integrado, interactividad rica. Hubo una época en que los mejores portfolios y las webs más creativas estaban hechos en Flash, y parecía que ese era el futuro inevitable de la web.

Entonces llegaron los smartphones. Steve Jobs publicó su carta explicando por qué el iPhone no soportaría Flash, y en pocos años el ecosistema entero se desmoronó. Flash pasó de ser imprescindible a ser historia en menos de una década.

La lección es clara: si tu tecnología no es un estándar abierto, por muy dominante que sea, puede desaparecer cuando una empresa decide que ya no le conviene. Es una lección que sigo aplicando hoy cada vez que alguien me sugiere construir sobre la plataforma propietaria del momento.

## Las tablas para layout

Antes de que CSS supiera maquetar — y tardó en aprender —, el layout se hacía con tablas HTML. Tablas anidadas dentro de tablas, con celdas vacías para crear espacios, imágenes cortadas en trozos para simular bordes redondeados, spacer GIFs transparentes de 1×1 píxel.

Era espantoso desde el punto de vista semántico. Pero funcionaba. Y durante años fue la única forma fiable de conseguir un diseño con columnas que se viera igual en todos los navegadores.

La transición a CSS para layout fue lenta y dolorosa. Primero los floats, que nunca fueron diseñados para eso. Luego los frameworks como Blueprint y 960gs. Después Flexbox. Y finalmente CSS Grid, que es lo que las tablas para layout intentaban ser pero bien hecho.

Hoy diseño layouts en minutos que hace veinte años habrían requerido horas de tablas anidadas. Y cada vez que uso `grid-template-columns`, agradezco silenciosamente no tener que volver a escribir `<td width="1" bgcolor="transparent">`.

## jQuery: el gran igualador

Es difícil explicar a alguien que empezó a programar después de 2015 lo que significó jQuery. No fue solo una librería — fue la solución a un problema que hoy ya no existe: la incompatibilidad brutal entre navegadores.

Escribir `$('.menu').slideToggle()` y que funcionara en IE6, Firefox 2 y Safari 3 sin cambiar una línea era revolucionario. jQuery abstraía las diferencias entre navegadores y nos dejaba centrarnos en lo que queríamos hacer en vez de en cómo hacerlo funcionar en cada uno.

Hoy jQuery es innecesario. Los navegadores modernos implementan las mismas APIs, `querySelector` existe de forma nativa, y CSS hace animaciones mejor que JavaScript. Pero durante una década, jQuery fue la diferencia entre poder hacer tu trabajo y querer tirarte por la ventana.

## Lo que se repite

Mirando atrás, lo que más me llama la atención no son las tecnologías en sí, sino cómo se repite el patrón: algo aparece, se vuelve dominante, la gente dice que es el futuro, y cinco o diez años después ha desaparecido o se ha vuelto irrelevante.

Pasó con Netscape. Pasó con IE6. Pasó con Flash. Pasó con jQuery. Pasó con cada framework de CSS que prometía ser el último. Y está pasando ahora mismo con herramientas que hoy parecen imprescindibles.

Lo único que no ha desaparecido en todos estos años es la plataforma web en sí: HTML, CSS y JavaScript. Las tres tecnologías base siguen ahí, mejorando cada año, sin breaking changes, sin versiones incompatibles. Es la constante en un mar de modas.

Después de haber navegado con Lynx, haber sufrido IE6, haber esperado intros de Flash y haber maquetado con tablas, esa constancia es lo que más valoro. Y es lo que elijo como base de mi trabajo: tecnología que no caduca.
