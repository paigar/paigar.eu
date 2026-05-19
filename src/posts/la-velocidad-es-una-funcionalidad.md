---
title: "La velocidad es una funcionalidad"
date: 2025-06-18
excerpt: "Hay una tendencia a tratar el rendimiento como algo que se optimiza al final del proyecto. Primero construyes la web, luego la haces rápida. Como si la velocidad fuera una capa de pintura sobre una estructura terminada. Eso no funciona — es el resultado de cientos de decisiones que se tomaron sin pensar en el rendimiento."
tags: [ideas, desarrollo-web]
image: la-velocidad-es-una-funcionalidad.png
image_alt: "Fotografía de larga exposición de una autopista vacía de noche, con rastros de luz de un vehículo cruzando el encuadre."
---

Hay una tendencia en el desarrollo web a tratar el rendimiento como algo que se "optimiza" al final del proyecto. Primero construyes la web, luego la haces rápida. Como si la velocidad fuera una capa de pintura que aplicas sobre una estructura terminada.

Eso no funciona. Una web lenta es el resultado de cientos de decisiones que se tomaron sin pensar en el rendimiento. Y arreglarlas después es siempre más caro, más difícil y menos efectivo que haberlas tomado bien desde el principio.

## Lo que pierde una web lenta

Amazon calculó que 100 milisegundos de latencia adicional les costaba un 1% de ventas. Google descubrió que medio segundo de retraso en los resultados de búsqueda reducía el tráfico un 20%. Estos son datos de empresas con recursos ilimitados para optimización. Para una web pequeña, el impacto relativo es aún mayor.

Pero no hace falta hablar de conversiones. Hablemos de respeto. Cuando alguien visita tu web, está invirtiendo su tiempo. Hacerle esperar 5 segundos mirando una pantalla en blanco mientras se cargan 3 MB de JavaScript, 2 MB de imágenes sin optimizar y 500 KB de fuentes es una falta de respeto a ese tiempo.

La velocidad no es un lujo para webs de alto tráfico. Es una cortesía básica para cualquier visitante.

## La velocidad como decisión de diseño

Las webs rápidas no son rápidas por accidente. Son rápidas porque alguien decidió, conscientemente, que la velocidad importaba. Y esa decisión se refleja en cada elección:

- ¿Necesitamos realmente un carrusel con imágenes de 2000 px?
- ¿Este framework JavaScript aporta algo que no podamos hacer con CSS?
- ¿Cinco tipografías diferentes son necesarias o podemos reducir a dos?
- ¿Este script de analytics justifica los 100 KB que añade?
- ¿Necesitamos cargar todo el contenido en la primera visita?

Cada vez que la respuesta es "no", la web es más rápida. No porque hayas optimizado nada, sino porque has decidido no cargar lo innecesario.

## El presupuesto de rendimiento

Una técnica que funciona es definir un "presupuesto de rendimiento" al inicio del proyecto: un límite máximo de peso para la página, un tiempo máximo de carga, un número máximo de peticiones HTTP.

Por ejemplo:

- La página completa no superará los 500 KB transferidos
- El tiempo hasta el primer contenido visible será menor de 1,5 segundos en 3G
- No más de 15 peticiones HTTP en la carga inicial

Con estos límites, cada decisión tiene un coste visible. "Quiero añadir esta librería de animación" — vale, pesa 45 KB, ¿de dónde los sacamos? ¿Quitamos una fuente? ¿Reducimos las imágenes? El presupuesto obliga a priorizar.

## Lo que me enseñaron los sitios estáticos

Cuando empecé a construir con generadores estáticos, el rendimiento dejó de ser un problema que resolver y se convirtió en un punto de partida. Sin servidor dinámico, sin base de datos, sin framework JavaScript, una web estática parte de una base tan ligera que hay que esforzarse para hacerla lenta.

Este sitio carga en menos de un segundo en cualquier conexión decente. No porque haya aplicado técnicas de optimización avanzadas, sino porque no he añadido nada que lo frene. El HTML llega con el CSS inline, el JavaScript es mínimo y diferido, las fuentes son del sistema. No hay nada que optimizar porque no hay nada que sobre.

Eso es lo que significa tratar la velocidad como una funcionalidad: no es lo que haces al final, es lo que decides al principio.

## La web rápida como acto político

Suena grandilocuente, pero hay un componente de justicia en hacer webs rápidas. Internet no es igual para todos. Hay quien navega con fibra de 600 Mbps y hay quien navega con 3G inestable. Hay quien tiene un iPhone de última generación y hay quien tiene un Android de hace cinco años.

Una web pesada funciona para el primero y es inutilizable para el segundo. Una web ligera funciona para los dos. Hacer webs rápidas es hacer webs para más gente. Y eso debería importarnos a todos los que construimos para la web.
