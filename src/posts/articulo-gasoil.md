---
title: "Mi primer juego, treinta y cinco años después"
date: 2025-11-10
excerpt: "En 1989 mandé un programa en BASIC al concurso de MSX-Club. Tenía dieciséis años. Lo publicaron. Esta semana lo he vuelto a ver correr en pantalla."
tags: [retrofuturismo, javascript]
image: gasoil-header.png
image_alt: "Plano cenital de un Toshiba MSX antiguo sobre una mesa de madera, con una cinta cassette etiquetada a mano, fotografía iluminada con luz cálida de tarde a través de una ventana"
---

En 1989 yo tenía dieciséis años, un Toshiba MSX y una idea fija: que mi nombre saliera impreso en una revista de verdad, de las que se compraban en el quiosco con dinero de la propina. La revista era MSX-Club, la editaba Manhattan Transfer desde Barcelona, y todos los meses dedicaba una sección llamada "Mi Programa" a publicar el código fuente de un juego enviado por algún lector. Si te lo aceptaban te pagaban un premio: en metálico o en software, según preferencias.

Lo que mandé al concurso fue un juego llamado **Gasoil**, en BASIC, programado a base de tardes encerrado en mi habitación con el manual del MSX sobre las rodillas. Era un juego de plataformas con pez salta-charcos, contenedores que goteaban gasolina, un depósito al que llevarla antes de que se agotara del todo y un héroe pixelado al que recuerdo dibujando byte a byte en cuadrícula sobre papel milimetrado, traduciendo después cada fila de ocho píxeles a un número decimal entre 0 y 255 que iba a parar a una línea `DATA`. Así se hacían los gráficos entonces.

## el sobre y el cromo

El concurso lo gané. Bueno, "ganar" es una palabra grande para lo que era en realidad: aceptaron mi programa y lo publicaron en el número 64 de junio de 1990 con mi nombre y mi ciudad debajo del título —_Por... Juanjo Marcos · Bilbao · 1989_—. Lo más curioso es que me enteré al comprar la revista, sin más. Nadie me avisó de que el programa había sido elegido, ni con una carta, ni con una llamada, ni con la nota a pie de página que se gastaban entonces para confirmar este tipo de cosas. Ocho meses después de mandar el sobre fui al quiosco como cualquier otro mes, abrí el ejemplar, pasé las páginas, y allí estaba mi listado. Como premio me correspondía por bases una cinta cassette con un juego del catálogo de la propia revista —Manhattan Transfer reciclando su propio software como moneda de cambio, claro—, pero tuve que llamar un par de veces a Barcelona para que se acordaran de enviármela. A los dieciséis años qué más daba. Lo importante era abrir el sobre, ver tu listado en papel cuché y saber que había gente, en otras casas de España, que aquella tarde estaba tecleando línea por línea el código que tú habías escrito en tu cuarto.

De aquello hace treinta y cinco años. La cinta del premio se perdió en alguna mudanza, el Toshiba también, los manuales con las esquinas rozadas no sé adónde fueron a parar, y la revista misma desapareció a mediados de los noventa cuando el MSX dejó de tener sentido comercial. Lo único que sobrevive de todo aquel ecosistema son los escaneos en PDF que algunos coleccionistas han ido subiendo a internet, página a página, durante los últimos veinte años. El [número 64](https://media.paigar.eu/media/MSX_Club_64-1.pdf) está entre ellos.

## la idea absurda

Hace unos días me topé con ese PDF y se me ocurrió la idea absurda. ¿Y si pasara el listado a texto otra vez? No para hacer nada con él, ni siquiera para ejecutarlo necesariamente. Solo por verlo otra vez fuera de la página escaneada, en un fichero que pudiera abrir en mi editor actual.

El listado ocupa siete páginas de la revista. Unas 486 líneas de BASIC, con sus `FOR-NEXT`, sus `PUT SPRITE`, sus `ON STICK GOSUB`, sus marcos dibujados con caracteres redefinidos vía `VPOKE`. Pasarlo por OCR de la imagen del PDF da algo aproximadamente parecido al original, pero con fallos que aparecen donde menos te esperas: un `8` que se lee como `B`, un `0` confundido con `O`, un `192` partido en `19` y `2` cuando el número saltaba de línea. Los `DATA` numéricos, sobre todo, son un campo minado.

Lo interesante es que se puede comprobar dónde están esas heridas sin necesidad de tener un MSX delante. Cada sprite del juego ocupa exactamente 32 bytes en el listado: si la línea `DATA 1040` aparece con 30 bytes en lugar de 32, el OCR ha perdido dos por el camino. Lo mismo con los caracteres redefinidos, que son 8 bytes cada uno. Escribí un pequeño script que verifica esas longitudes, comprueba que todos los `GOTO` apuntan a líneas que existen, que las comillas están balanceadas y que no hay números fuera del rango 0-255. Cinco líneas dieron error a la primera. Volví al PDF, las miré con lupa contando dígitos, y las arreglé una a una. Una de ellas, la 1140, había llegado especialmente maltrecha: el número 156 se había leído como 15 más 156, manteniendo los dos, y por el camino se habían evaporado un 249, un 224 y otro número entero. Fascinante el caos que un OCR puede hacer con una página perfectamente legible para un humano.

## lo que vi en pantalla

Una vez el fichero pasó todas las comprobaciones lo metí en un emulador del MSX en el navegador, monté el código como si fuera un disquete virtual y tecleé el `RUN"GASOIL.BAS` de toda la vida. Lo que apareció en pantalla no se parecía gran cosa al juego que recuerdo.

<img src="{{ imgUrl('gasoil.png', 1200, 'jpg') }}" alt="Captura de pantalla del juego Gasoil ejecutándose en el emulador con el escenario completamente desconfigurado, sprites cruzados y marcos rotos" data-bleed="md" loading="lazy">

El decorado salió descuajaringado, los marcos rotos por sitios donde no había marcos, los sprites cruzándose donde no debían, el `SCORE 0 RECORD 0` partido en dos pedazos y el cartel `OIL` aterrizado a saber dónde. Probablemente queden errores de OCR escondidos por el listado —algún byte perdido en los `DATA` de los sprites, algún espacio de más o de menos en los `PRINT` que dibujan el escenario, suficientes para que el resultado en pantalla quede inutilizable aunque el bucle principal del juego corra de principio a fin. El emulador estaba ejecutando el código que yo había recuperado, sí, pero el juego como tal no era jugable.

Tendría arreglo, en teoría: contar los espacios en la página escaneada uno a uno, carácter a carácter, en cada uno de los veintitantos `PRINT` que componen la pantalla del juego, comparar byte a byte cada `DATA` de los sprites, recomponer la pantalla a mano. Un trabajo tedioso pero finito. No lo hice, ni voy a hacerlo. La razón es difícil de explicar sin sonar sentimental, pero lo voy a intentar igualmente.

Lo que tenía delante ya servía para lo que importaba. Reconocí inmediatamente la rutina del salto, esa que tantos quebraderos de cabeza me había dado en su día:

```basic
2150 FOR A=0 TO 24 STEP 1
2160 IF A<22 THEN PLAY"S7M80L64N40"
2170 IF STICK(0)=7 THEN X=X-1:SA=7 ELSE SA=10:X=X+1
2200 PUT SPRITE 2,(X,Y-A),15,SA
```

Un bucle de veinticuatro píxeles de altura, comprueba en cada paso hacia dónde empuja el joystick, dibuja el sprite del héroe en la nueva posición y suena un breve `PLAY` de fondo. Hoy bastaría una función de cualquier motor de física, pero no tendría ni la mitad del encanto de aquel código casero.

Que el juego en pantalla saliera roto era casi anecdótico. El listado había vuelto a la vida en mi editor, sus líneas seguían diciendo lo mismo que había escrito a los dieciséis años, mis sprites seguían codificados con los bytes que calculé en cuadrícula sobre papel milimetrado, mi rutina del salto seguía describiendo la misma parábola en la memoria del intérprete aunque en pantalla no se viera. Por un rato bastó con eso para recordar viejos tiempos.

## sobre lo que sobrevive

Hay una cosa rara en este oficio nuestro, el de programar cosas y subirlas a algún sitio donde se las lleve la corriente. Casi nada de lo que hacemos hoy va a estar disponible dentro de treinta años. Los sitios web caducan, las bases de datos se migran y se pierden trozos, las apps móviles dejan de compilar contra los SDKs nuevos, los servidores se apagan, los formatos se vuelven ilegibles. Pero el listado de aquel juego mío sigue ahí, en una revista escaneada por un coleccionista anónimo, intacto en el sentido de que cualquiera puede teclearlo otra vez si tiene paciencia. La obsolescencia no le ha hecho ni cosquillas porque desde el principio fue texto. Texto en una página de papel, código fuente humanamente legible, número a número, instrucción a instrucción.

Sin teléfonos móviles, sin Stack Overflow, sin tutoriales de YouTube, sin nada salvo el manual del ordenador y los listados del quiosco, un crío en Bilbao podía mandar su programa a Barcelona y verlo publicado ocho meses después con su nombre debajo. Y treinta y cinco años más tarde ese mismo programa, recuperado de un escáner a baja resolución, todavía arranca cuando le das al `RUN`, aunque sea para escupir en pantalla un decorado roto.

A veces basta con eso.
