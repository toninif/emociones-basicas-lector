# Observación facial

Herramienta de demostración para una clase sobre expresiones faciales y Ekman. Muestra el rostro en vivo, puntos de referencia y seis puntuaciones de clasificación: alegría, tristeza, enojo, miedo, asco y sorpresa. El video se analiza en el navegador; la aplicación no lo graba ni lo envía a un servidor.

## Entrar a la herramienta

**Online:** [Abrir Observación facial](https://fernandotonini.com.ar/emociones-basicas-lector/). Usá Edge o Chrome y permití el acceso a la cámara cuando el navegador lo solicite. Necesitás internet para cargar la página y los modelos; después, el análisis de cada fotograma ocurre en tu dispositivo. La primera vez que elegís MediaPipe se descargan unos 16 MB adicionales. Los archivos pueden quedar en la caché del navegador, pero no conviene depender de ella para una clase sin conexión.

**Sin internet:** copiá esta carpeta completa a la computadora que usarás en clase. Con Python 3 instalado, hacé doble clic en `iniciar.cmd`, dejá abierta esa ventana y entrá a <http://localhost:8765> en Edge o Chrome. No abras `index.html` con doble clic: los modelos necesitan servirse desde `localhost`. Esta modalidad incluye todos los archivos, incluido MediaPipe.

## Propuesta de uso en clase

1. Conectá la webcam, abrí la herramienta y pulsá **Activar cámara**. Si hay varias cámaras, elegí la correcta en **Cámara**. Trabajá de a una persona por vez, de frente y con luz uniforme.
2. En **Seguimiento**, alterná entre **Clásico · 68 puntos** y **MediaPipe · 478 puntos**. Activá o desactivá **Puntos faciales** para comparar el video con la superposición. MediaPipe puede ir más lento en computadoras modestas.
3. En **Actividad guiada**, elegí la expresión que la persona intentará representar. Pulsá **Ocultar para predecir**, pedí al grupo que anticipe la clasificación y seleccioná su respuesta. **Revelar y pausar** congela el fotograma y muestra intención, predicción y resultado.
4. Con la imagen pausada, elegí una región y marcá cejas, ojos, nariz, mejillas o boca haciendo clic sobre el rostro. También podés enfocar la imagen con Tab, mover el cursor con las flechas y marcar con Enter. **Deshacer** y **Borrar marcas** limpian la discusión; las marcas no se guardan.
5. Abrí **Guía de movimientos** para relacionar las regiones observadas con ejemplos de unidades de acción facial (AU). **Modo proyector** agranda la lectura principal; **Pantalla completa** puede combinarse con él. **Apagar** libera la cámara al terminar.

Preguntas útiles: ¿coinciden intención, predicción del grupo y modelo? ¿Confunde miedo con sorpresa? ¿Qué cambia al posar una sonrisa? Los desaciertos sirven para discutir el papel del contexto.

## Qué representan los resultados

Los puntos ubican partes del rostro. **No son unidades de acción FACS**: una AU describe un movimiento, no la posición de un punto. La guía de AU presenta ejemplos didácticos y la aplicación no mide esas unidades.

Las seis barras usan el mismo clasificador de `face-api.js` en ambos modos de seguimiento. MediaPipe cambia la malla de puntos; no reemplaza la clasificación de expresiones. El clasificador también calcula «neutral», que no se muestra como séptima barra. Por eso las seis puntuaciones pueden sumar menos de 100 %. No son medidas de intensidad emocional ni probabilidades calibradas de lo que siente la persona. La etiqueta «Sin expresión clara» usa umbrales de presentación, no un diagnóstico. La herramienta tampoco detecta microexpresiones.

## Antes de la clase

Probá en la computadora y el proyector reales: permiso de cámara, distancia, iluminación, cambio entre seguimientos, pausa y revelado. Si vas a trabajar sin internet, comprobá ambos modos tras desconectar la red. Para cambiar de webcam, apagá la cámara en la aplicación, elegí otra y volvé a activarla.

Si aparece **Failed to fetch** en la versión local, comprobá que la dirección empiece con `http://localhost:8765` y que la ventana de `iniciar.cmd` siga abierta. En la versión online, recargá la página y revisá la conexión. Si el navegador bloquea la cámara, habilitá el permiso desde el icono junto a la dirección.

## Publicación y mantenimiento

El repositorio se publica con GitHub Pages desde la rama `main`, carpeta `/ (root)`. Al subir cambios, Pages actualiza la web. HTTPS permite que el navegador solicite permiso para la webcam. Para ejecutar una comprobación local con Edge y una cámara simulada, iniciá el servidor y corré `node verify.cjs`; esa prueba no evalúa precisión emocional ni sustituye una prueba con la webcam real.

## Créditos

- [face-api.js 0.22.2](https://github.com/justadudewhohacks/face-api.js), licencia MIT en `vendor/LICENSE.face-api.txt`.
- [MediaPipe Face Landmarker](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/web_js), licencia Apache 2.0 en `vendor/mediapipe/LICENSE.txt`.
- [Facial Action Coding System, Paul Ekman Group](https://www.paulekman.com/facial-action-coding-system/).
- [Barrett y colaboradores (2019), *Emotional Expressions Reconsidered*](https://doi.org/10.1177/1529100619832930).
