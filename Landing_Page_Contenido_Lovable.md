# Landing Page — Kei Logistics
## Documento de contenido para Lovable

---

## Instrucciones generales de diseño

### Filosofía visual
Esta landing tiene que verse completamente diferente a cualquier landing de logística existente. Evitar a toda costa los patrones genéricos: sin headlines centrados, sin ilustraciones de delivery genéricas, sin grids simétricos de 3 cards iguales, sin el azul corporativo de siempre. El objetivo es que alguien que la vea piense "esto no parece una empresa de logística" — en el buen sentido.

### Paleta de color
- **Color primario de Kei:** Azul índigo profundo y vibrante. Referencia: entre #1A3FD4 y #1740B6. No el azul Tailwind genérico (#3B82F6), no el azul corporativo oscuro (#003087). Un azul con carácter propio, que se sienta moderno y serio al mismo tiempo.
- **Fondo principal:** Blanco puro (#FFFFFF).
- **Fondo alternado:** Azul índigo muy desaturado y claro, casi un tinte (#F0F4FF o similar). No gris — levemente azulado.
- **Texto principal:** Casi negro (#0F0F0F o #111827), nunca negro puro.
- **Texto secundario:** Gris medio (#6B7280).
- **Acento:** El azul índigo primario para números, highlights y botones.

### Tipografía — CLAVE PARA LA DIFERENCIACIÓN
Usar DOS tipografías en contraste deliberado:
- **Display / Headlines:** Una serif editorial con peso y carácter. Opciones: Fraunces, Lora, Playfair Display, o DM Serif Display. Esta elección sola ya diferencia visualmente la landing del 95% de los competidores que usan solo sans-serif.
- **Cuerpo / UI:** Sans-serif limpia y moderna. DM Sans, Inter o Plus Jakarta Sans.
- Los headlines grandes deben sentirse como una portada de revista — peso, presencia, carácter.

### Layout — ROMPER LA SIMETRÍA
- **El Hero NO va centrado.** Todo el contenido del hero va alineado a la izquierda. El lado derecho tiene el elemento visual.
- Evitar grids perfectamente simétricos. Si hay cards, que no sean todas exactamente iguales en tamaño.
- Usar whitespace generoso — las secciones necesitan respirar.
- Las secciones no deben tener todas el mismo padding/altura. Variar el ritmo vertical.

### Elemento visual central — LA RED COLABORATIVA
El concepto visual de Kei es una red de nodos conectados. No camiones, no paquetes, no mapas genéricos.
- Implementar como SVG animado o canvas: puntos/nodos que se conectan con líneas tenues, en movimiento suave y continuo.
- Colores de la red: azul índigo primario para los nodos, líneas con 20-30% de opacidad.
- Aparece en el Hero (lado derecho, grande) y puede aparecer como elemento decorativo de fondo en otras secciones.
- La animación debe ser sutil — no distrae, acompaña.

### Animaciones
- Micro-animaciones de entrada al hacer scroll (fade-in + leve movimiento hacia arriba).
- Los números/estadísticas deben tener animación de conteo (counter animation) al entrar al viewport.
- Hover effects sutiles en cards y botones.
- La red de nodos animada corre de fondo de forma continua y suave.
- Sin animaciones llamativas, sin parallax agresivo.

### Anti-patrones a evitar explícitamente
- ❌ Headline centrado en el Hero
- ❌ Ilustraciones vectoriales genéricas de delivery/logística (personas con cajas, camiones, etc.)
- ❌ Tres stats iguales en una fila de 3 columnas
- ❌ Grid de 4 cards exactamente iguales
- ❌ Logos de clientes en escala de grises sobre fondo gris
- ❌ Solo tipografía sans-serif (Inter/Poppins sin contraste)
- ❌ Gradientes de azul a morado
- ❌ Botones con sombra grande

### Responsive y performance
- Mobile-first. En mobile todo se apila verticalmente con buen espaciado.
- Usar SVG para todos los íconos e ilustraciones. Sin imágenes rasterizadas pesadas.
- La red de nodos animada debe tener fallback estático en mobile para no comprometer performance.
- Lazy loading en todo lo que esté below the fold.

---

## SECCIÓN 1 — Hero

**Fondo:** Blanco puro.

**Layout:** Dos columnas. Columna izquierda (60%): todo el copy. Columna derecha (40%): la red de nodos animada, grande, que ocupa toda la altura del hero. En mobile: copy arriba, visual abajo (más pequeño).

**Alineación del copy:** Izquierda. Nunca centrado.

**Headline (tipografía serif display, muy grande, peso bold):**
> La logística tradicional sirvió 30 años. Es hora de algo mejor.

**Subheadline (sans-serif, tamaño medio, color gris medio):**
> Kei es la red colaborativa que conecta negocios y conductores para hacer envíos más rápidos, más baratos y sin burocracia. Córdoba, Argentina.

**CTA (botón alineado a la izquierda, color azul índigo primario, texto blanco, sin sombra grande):**
> Hablá con nosotros

*Al hacer click abre: https://wa.me/5493513614462*

**Elemento visual (columna derecha):**
Red de nodos animada. SVG o canvas. Nodos en azul índigo primario, líneas tenues. Movimiento suave y continuo. Sin loops bruscos.

---

## SECCIÓN 2 — El problema

**Fondo:** Blanco puro.

**Layout:** DIFERENTE AL ESTÁNDAR. No son 3 columnas iguales. Cada estadística ocupa su propio espacio con mucho protagonismo. Opciones de implementación (elegir la más impactante):

**Opción A — Stats apiladas con separadores:**
Cada stat ocupa el ancho completo de la sección, con un separador horizontal fino entre cada una. El número va muy grande a la izquierda, el texto descriptivo a la derecha en la misma línea.

**Opción B — Stats en scroll horizontal (carrusel en mobile, fila en desktop):**
Cada stat es una "pantalla" dentro de la sección, con el número enorme como protagonista absoluto.

Usar Opción A si Lovable la puede ejecutar con tipografía grande. El número debe ser el elemento más grande de la pantalla cuando está visible.

**Título de sección (pequeño, sans-serif, mayúsculas, color gris, alineado a la izquierda):**
> POR QUÉ EXISTE KEI

**Estadística 1:**
- Número: **55%**  ← tipografía enorme, serif, azul índigo
- Descripción: De los carritos online en Argentina se abandonan en el checkout por el costo del envío.

**Estadística 2:**
- Número: **+80%**  ← mismo tratamiento
- Descripción: Más caro paga una PyME por el mismo envío que una corporación, por no tener volumen mínimo.

**Estadística 3:**
- Número: **2-3 hs**  ← mismo tratamiento
- Descripción: Por día pierde un negocio coordinando envíos de forma manual y artesanal.

**Animación:** Counter animation en cada número al entrar al viewport.

---

## SECCIÓN 3 — Cómo funciona

**Fondo:** Azul índigo muy claro/tinte (#F0F4FF).

**Título de sección (serif display, grande, alineado a la izquierda):**
> Cómo funciona Kei

**Subtítulo (sans-serif, gris):**
> Un modelo colaborativo, coordinado por tecnología.

**Layout de los pasos:** Línea de tiempo horizontal en desktop. Cuatro pasos conectados por una línea con puntos. Cada paso tiene número, ícono lineal simple, título y descripción corta. En mobile: lista vertical con línea a la izquierda.

**Paso 1 — Publicás tu envío**
Cargás origen, destino y descripción del paquete en minutos.

**Paso 2 — La red lo toma**
Un conductor de la red colaborativa acepta el envío y coordina el retiro.

**Paso 3 — Retiro donde estés**
El conductor pasa a buscar el paquete en tu local o domicilio.

**Paso 4 — Entrega con seguimiento**
El destinatario recibe su paquete con trazabilidad en tiempo real.

**Íconos:** Lineales, simples, en azul índigo. Sin relleno. Estilo de trazo fino.

---

## SECCIÓN 4 — Para quién es

**Fondo:** Blanco puro.

**Título de sección (serif display, grande):**
> Para quién es Kei

**Layout:** Dos cards de ancho desigual o con tratamiento visual diferenciado — que no se vean idénticas.

**Card izquierda — Negocios y emprendedores**
- Borde o acento en azul índigo
- Ícono: tienda / caja (lineal)
- Título: **Tenés un negocio y querés enviar**
- Texto: Olvidate de ir al correo, de los contratos y del volumen mínimo. Publicás tu envío, un conductor lo retira en tu local y lo entrega. Así de simple.

**Card derecha — Conductores**
- Borde o acento en un tono secundario (azul más claro o gris azulado)
- Ícono: auto / ruta (lineal)
- Título: **Tenés vehículo y querés ganar**
- Texto: Manejá cuando quieras, aceptá los envíos que te convengan. Sin jefes, sin horarios fijos. Vos controlás tu tiempo.

---

## SECCIÓN 5 — Por qué Kei

**Fondo:** Azul índigo muy claro/tinte (#F0F4FF).

**Título de sección (serif display, grande):**
> Por qué Kei

**Layout:** NO es un grid de 4 cards iguales. Usar un layout asimétrico: dos cards grandes arriba (ancho completo cada una, en fila), dos cards más compactas abajo. O una lista vertical con separadores donde cada ítem tiene más espacio y respiración que una card genérica.

**Diferenciador 1 — Sin mínimos**
Enviás uno o mil paquetes. Sin contratos, sin volumen mínimo requerido.

**Diferenciador 2 — Trazabilidad en tiempo real**
Tu cliente sabe dónde está su paquete en todo momento. Cero consultas de soporte.

**Diferenciador 3 — Onboarding en 3 pasos**
Sin burocracia, sin proceso complejo. Empezás a operar hoy.

**Diferenciador 4 — Retiro en tu local**
Un conductor pasa a buscar el paquete donde vos estés. Sin perder tiempo en sucursales.

---

## SECCIÓN 6 — Prueba social

**Fondo:** Blanco puro.

**Título de sección (sans-serif, pequeño, mayúsculas, gris):**
> YA CONFÍAN EN KEI

**Tratamiento de logos:** NO escala de grises sobre fondo gris. Los logos van en azul índigo primario (monocromático en el color de marca de Kei) sobre fondo blanco. Esto es inusual y hace que la sección se vea parte del sistema de diseño en vez de un bloque genérico.

**Logos de marcas:**
- Deutsch
- Rossetti Deportes
- Amerika SB
- PickWise

**Separador visual sutil.**

**Texto secundario (pequeño, gris):**
> Respaldados por

**Logos de incubadoras (mismo tratamiento):**
- Founder Institute
- Andén

---

## SECCIÓN 7 — CTA Final

**Fondo:** Azul índigo primario (el color más saturado de toda la página). Esta sección es el único momento de alto contraste.

**Layout:** Centrado. Esta es la única sección centrada de toda la página — funciona como punto de cierre y contraste deliberado con el resto.

**Headline (serif display, blanco, grande):**
> La logística para las PyMEs ya no es un problema. Es Kei.

**Botón (blanco, texto en azul índigo, sin sombra):**
> Hablá con nosotros

*Al hacer click abre: https://wa.me/5493513614462*

**Texto pequeño debajo del botón (blanco con 70% opacidad):**
> Sin contratos. Sin compromisos.

---

## Notas técnicas

- Botón WhatsApp abre `https://wa.me/5493513614462` en nueva pestaña.
- Todos los CTAs de la página apuntan al mismo link.
- Sin formularios de captura en esta versión.
- SVG para todos los íconos e ilustraciones — cero imágenes rasterizadas.
- La animación de la red de nodos debe desactivarse o volverse estática en mobile para priorizar performance.
- Lazy loading en todo el contenido below the fold.
- Meta title sugerido: "Kei Logistics — Logística colaborativa en Córdoba"
- Meta description sugerida: "La red colaborativa que conecta negocios y conductores para hacer envíos rápidos, económicos y sin burocracia en Córdoba, Argentina."
