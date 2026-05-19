---
title: "Lo que aprendí construyendo un plugin de accesibilidad para Divi"
date: 2026-01-25
excerpt: "Crónica honesta de cómo monté flavor-a11y para parchear lo que Divi no quiere arreglar en los sitios de marca blanca que llevo para terceros, con las trampas, los aciertos y todo lo que la WCAG no te cuenta hasta que tienes ochenta dominios en producción."
tags: [ideas, desarrollo-web]
image: flavor-a11y-divi.jpg
image_alt: "Mesa de taller con calibres, escuadras y herramientas de precisión junto a un portátil con código, iluminación cálida de ventana"
---

## El día que la accesibilidad dejó de ser opcional

El 28 de junio de 2025 cambió silenciosamente el calendario de muchos despachos como el mío. Ese día entró en vigor en España la trasposición de la European Accessibility Act, y de un momento a otro la accesibilidad dejó de ser una buena práctica recomendable para convertirse en una obligación legal con consecuencias para una buena parte de los clientes con los que trabajo. Hasta entonces se podía vivir con cierta hipocresía cómoda: se prometía un sitio "accesible", se ponía un widget de barra de herramientas con un icono de silla de ruedas, se cobraba la factura y se pasaba al siguiente proyecto. A partir de aquella fecha la cosa se puso seria.

El problema, en mi caso particular, es que aunque mi apuesta personal y la de mi agencia hace tiempo que está en los generadores de sitios estáticos, arrastro una cartera importante de trabajo de marca blanca para otras agencias en la que WordPress con Divi es una imposición del cliente final, no una elección mía. Hablamos de algo más de ochenta dominios en producción, todos con el mismo stack y con la misma fragilidad estructural. Y Divi, por su propia naturaleza de constructor visual orientado a personas que no escriben código, genera un HTML que dista bastante de ser modélico desde el punto de vista de la WCAG 2.1. No por mala fe del equipo de Elegant Themes, sino porque el constructor visual prioriza la libertad creativa del usuario por encima de la corrección semántica del documento que produce. Así que tocaba arremangarse y construir algo que pudiese aplicar a escala, sin tener que tocar uno por uno cada módulo de cada página de cada sitio. De ahí nació flavor-a11y.

## Por qué Divi es un caso especial

Antes de entrar en materia conviene entender por qué un constructor visual como Divi tiene una relación complicada con la accesibilidad. Cuando un cliente arrastra un módulo "botón" a una sección, el constructor le da varias opciones de estilo, color, tamaño y comportamiento, pero rara vez le pregunta si ese botón es realmente un enlace, si tiene un destino, o si su contraste con el fondo cumple los 4.5:1 que exige el nivel AA. Multiplica eso por veinte módulos disponibles y por la cantidad de combinaciones que un cliente con buen ojo puede inventarse, y entiendes por qué validar manualmente sitio por sitio era una pelea perdida de antemano.

A eso se suma que Divi, históricamente, ha tenido sus propios pecados estructurales. Anidaciones excesivas de divs, botones que en realidad son enlaces estilizados como botones, animaciones que se disparan al hacer scroll sin respetar `prefers-reduced-motion`, sliders sin controles de pausa accesibles, e iconos de Font Awesome insertados como elementos decorativos que los lectores de pantalla anuncian con nombres crípticos como "f0c9". El equipo del tema ha ido mejorando estas cosas con los años, especialmente desde la salida de Divi 5, pero la realidad es que los sitios en producción suelen tener tres, cuatro o seis años a sus espaldas, y lo que se aprobó entonces sigue ahí.

## Lo primero que ataqué fue lo barato

Cuando empiezas un proyecto de este tipo la tentación es la de ir a por el problema más vistoso, pero en accesibilidad la lección es justo la contraria: lo primero que tienes que arreglar es lo que afecta a más usuarios con menos esfuerzo de implementación. Y eso, casi siempre, son los contrastes y los enlaces de salto al contenido principal.

El skip link fue lo más sencillo. Una línea de HTML al inicio del body, escondida visualmente pero accesible al primer tabulador, que permite a alguien que navega con teclado saltarse el menú de cabecera y aterrizar directamente en el contenido. Divi no lo trae por defecto, así que el plugin lo inyecta por filtro de WordPress. Lo que aprendí de paso es que el skip link tiene que aparecer visualmente cuando recibe el foco, porque si no nadie sabe que existe; un skip link invisible que se activa con una tecla que no ves es como una rampa para sillas de ruedas escondida detrás de un seto.

Los contrastes fueron más interesantes porque me obligaron a auditar los temas hijos de los clientes con un enfoque distinto. Empecé a usar Pa11y y Lighthouse de forma sistemática, generando informes por dominio, y descubrí que los problemas de contraste se concentraban casi siempre en los mismos sitios: textos sobre imágenes de fondo, botones secundarios, breadcrumbs y, sobre todo, los famosos placeholders de los formularios. Aquí flavor-a11y no resuelve mágicamente nada, porque cambiar un color es una decisión de diseño que el cliente tiene que validar, pero sí inyecta unos cuantos overrides de CSS opinables que el cliente puede activar o desactivar desde su panel de administración.

## Las trampas que no me esperaba

La primera trampa fue la jerarquía de los encabezados. En la WCAG no se exige una jerarquía perfecta, pero los criterios de éxito 1.3.1 y 2.4.6 acaban empujando en esa dirección porque los lectores de pantalla la usan para que el usuario pueda navegar el documento como si fuese un índice. El problema es que en Divi, cuando un cliente quiere que un texto destaque, lo que hace es marcarlo como h2 o h3 sin pensar en su posición lógica. Acabas con páginas que tienen un h1, ningún h2, tres h3 y un h5 huérfano. El plugin no puede corregir esto automáticamente sin romper el diseño visual, así que lo que hace es generar un aviso en el dashboard del administrador con un listado de páginas problemáticas. Es feo, es pesado, pero funciona como recordatorio.

La segunda trampa fueron los formularios. Divi tiene su propio módulo de contacto, pero muchos clientes usan Contact Form 7, Gravity Forms, Fluent Forms o WPForms, cada uno con su propio nivel de compromiso con la accesibilidad. Las labels asociadas, los mensajes de error vinculados con `aria-describedby`, los campos requeridos con `aria-required`, todo eso varía de un plugin a otro. Tuve que escribir adaptadores específicos para los tres más comunes en mis sitios y dejar el resto fuera de cobertura, con un aviso explícito en la documentación. Aprender a decir "esto no lo cubre el plugin" fue parte importante del proceso.

La tercera trampa, y la más sutil, fue el foco visible. Divi modifica los estilos por defecto de los navegadores y, en muchos temas hijos, el outline de los elementos focados desaparece directamente porque se considera "feo". Reactivarlo de forma sistemática con un `:focus-visible` razonable fue probablemente la mejora individual con más impacto real para usuarios que navegan con teclado. La de Tab tiene que dejar huella, siempre, en algo que se vea sin esfuerzo.

## Lo que un plugin no arregla

Después de unos cuantos meses iterando sobre flavor-a11y aprendí algo incómodo: la mayor parte de los problemas de accesibilidad de un sitio web no se arreglan con código, se arreglan con formación. Una imagen sin texto alternativo es un fallo de contenido, no de tema. Un PDF subido al gestor que no es accesible es un problema de origen, no de presentación. Un vídeo sin subtítulos lo es del propietario del vídeo. Un menú con veinte enlaces es un problema de arquitectura de información que ningún `aria-label` salvará.

Por eso terminé acompañando el plugin de un pequeño manual de buenas prácticas para los clientes, escrito en lenguaje no técnico, que envío junto con la factura del mantenimiento anual. No espero que se lo lean entero, pero al menos cuando aparece el problema tengo dónde apuntar. La accesibilidad real es un compromiso continuo, no un interruptor que se activa con una casilla en el panel de WordPress, y aceptar esto fue probablemente el aprendizaje más importante de todo el proceso.

## Lo que la WCAG dice y lo que la WCAG hace

Una cosa que descubrí es que cumplir la WCAG sobre el papel y construir un sitio realmente usable para personas con diversidad funcional son dos cosas que se solapan, pero no se identifican. Puedes tener un sitio que aprueba todos los tests automáticos de Pa11y y aún así ser una pesadilla para alguien que use un lector de pantalla, porque los tests automáticos cubren menos de la mitad de los criterios de éxito y prácticamente ninguno de los relacionados con cognición o concentración.

Esto me obligó a hacer pruebas con NVDA y con VoiceOver de forma regular, navegando los sitios con los ojos cerrados durante diez minutos, y la experiencia fue humillante. Cosas que yo daba por evidentes resultaban incomprensibles cuando se anunciaban en voz alta. Iconos sin texto, enlaces que decían "ver más" sin contexto, modales que atrapaban el foco sin avisar, animaciones que no terminaban nunca. Aprender a auditar con los oídos en vez de con los ojos cambió por completo mi forma de pensar el código del plugin.

## Dónde está ahora flavor-a11y

A día de hoy el plugin se despliega en más de cincuenta sitios, y voy camino de tenerlo en la práctica totalidad de los ochenta y pico que mantengo bajo este modelo. Cubre lo que considero el suelo razonable de cumplimiento: skip links, focus visible coherente, mejoras de contraste opcionales, etiquetado de iconografía decorativa, gestión de `prefers-reduced-motion`, advertencias en el dashboard sobre jerarquías de encabezados problemáticas y adaptadores para los tres plugins de formularios más comunes. No pretende sustituir a soluciones comerciales como UserWay o Accessibe, ni quiero que lo haga, porque desconfío de los widgets que añaden una capa por encima del sitio en lugar de arreglar el sitio en sí.

El próximo paso, que estoy abordando estas semanas, es generar informes mensuales automatizados por dominio que el cliente reciba por correo, con la evolución de los problemas detectados y un pequeño semáforo. Quiero que la accesibilidad deje de ser algo que recordamos cuando llega una queja y empiece a ser algo que se mide, como las copias de seguridad o el uptime. La WCAG 2.2 ya está aprobada y la 3.0 se cocina a fuego lento, así que sé que esto no se acaba aquí. Pero al menos ahora, cuando un cliente me pregunta si su web es accesible, puedo darle una respuesta que no sea la sonrisa nerviosa de hace un par de años.
