# El rostro en clase

Demo local de expresiones faciales para una clase sobre Ekman. Requiere Python 3 y Edge o Chrome. No requiere instalar paquetes.

## Publicación online

La aplicación es estática: GitHub Pages puede servirla sin servidor propio ni compilación. Subí `index.html`, los archivos CSS y JS, `models/`, `vendor/` y `.nojekyll` a la raíz de un repositorio. En el repositorio, abrí **Settings → Pages → Build and deployment**, elegí **Deploy from a branch**, rama `main` y carpeta `/ (root)`. La URL tendrá la forma `https://USUARIO.github.io/REPOSITORIO/`. GitHub Pages sirve la página con HTTPS, requerido por la cámara fuera de `localhost`. El navegador pedirá permiso de cámara a cada visitante.

Los modelos y la librería se descargan desde el sitio al abrirlo por primera vez; el video se analiza localmente en el navegador y no se envía al servidor. El sitio publicado es público. `iniciar.cmd` sigue siendo la opción para usar la aplicación sin internet. El archivo `verify.cjs` es solo una prueba local y no participa en la web.

## Uso

1. Conectá la webcam y hacé doble clic en `iniciar.cmd`.
2. Abrí **http://localhost:8765** en Edge o Chrome. No abras index.html directamente.
3. Presioná **Activar cámara** y permití el acceso. Para cambiar de cámara, apagá la actual, elegí la webcam en el selector y volvé a activar.
4. Usá **Pantalla completa**, **Nueva consigna** y **Pausar** para la actividad. Pausar congela la imagen y las puntuaciones; **Apagar** libera la cámara.
5. Dejá la terminal abierta. Al terminar, apagá la cámara y cerrá la terminal.

La librería y los tres modelos están incluidos: la aplicación funciona sin internet. El video se procesa en el navegador y no se graba ni se sube. Los enlaces de referencias sí requieren internet. Podés copiar esta carpeta completa a otra computadora con Python 3.

## Para la clase

### Actividades y presentación

- **Intención** selecciona la expresión y actualiza la guía visual. Abrí «Guía visual de la expresión elegida» para ver regiones anatómicas destacadas y ejemplos de AU. Son ejemplos didácticos, no mediciones ni combinaciones exhaustivas. Fuente: [FACS de Paul Ekman](https://www.paulekman.com/facial-action-coding-system/) y [investigación sobre conjuntos de acciones faciales](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2018.02678/full).
- **Ocultar para predecir** oculta la etiqueta y todas las puntuaciones, también para lectores de pantalla. Seleccioná la predicción del grupo y usá **Revelar y pausar** cuando haya un rostro. La imagen se congela y se comparan intención, predicción y clasificación. **Nueva consigna** inicia otra ronda; **Volver a exploración** reanuda el video.
- **Pausar** conserva el último fotograma analizado. Elegí una región y hacé clic sobre la imagen para marcarla. También podés enfocar la imagen con Tab, mover el cursor con las flechas y marcar con Enter. Hay botones para deshacer y borrar. Las marcas se eliminan al continuar; no se guardan.
- **Modo proyector** amplía el contenido principal y oculta opciones secundarias. Es independiente de **Pantalla completa**; ambos se pueden combinar. El botón para salir siempre permanece visible.
- Los puntos tienen suavizado leve, que se reinicia ante movimientos amplios o pérdida del rostro. Los avisos de distancia, borde y orientación usan reglas geométricas aproximadas; no estiman pose con precisión ni garantizan una clasificación correcta.

La superposición muestra 68 referencias anatómicas, no unidades de acción ni actividad muscular. La guía FACS es explicativa, no una salida del detector. El modelo estima alegría, tristeza, enojo, miedo, asco, sorpresa y neutral; mostramos seis barras y conservamos neutral en el cálculo. No se renormalizan las seis categorías.

Las puntuaciones no son intensidad emocional ni probabilidades calibradas de una experiencia interna. Se suavizan entre fotogramas para reducir saltos. La etiqueta requiere puntuación >= 0,50, ventaja >= 0,15 sobre la siguiente emoción y superar neutral: son reglas de presentación, no umbrales validados. No detecta microexpresiones. Trabajar con una persona por vez, rostro frontal e iluminación uniforme. Los resultados pueden variar entre personas y condiciones.

Antes de la clase probá tu webcam real, permiso, iluminación y proyector. Los desaciertos (por ejemplo miedo/sorpresa) son parte de la discusión, no una evaluación de estudiantes.

## Créditos y fuentes

- [face-api.js 0.22.2](https://github.com/justadudewhohacks/face-api.js), licencia MIT en `vendor/LICENSE.face-api.txt`. Tiny Face Detector, Face Landmark 68 y Face Expression Net; pesos distribuidos por el mismo proyecto.
- [FACS — Paul Ekman Group](https://www.paulekman.com/facial-action-coding-system/).
- [Barrett et al. (2019), Emotional Expressions Reconsidered](https://doi.org/10.1177/1529100619832930).

## Verificación técnica

Si aparece «Failed to fetch», revisá la dirección: debe empezar con `http://localhost:8765`, no con `file:///`. Ejecutá `iniciar.cmd` y mantené abierta esa ventana. Los modelos se sirven desde tu propia computadora: no hace falta conexión a internet. La interfaz identifica ahora qué modelo no pudo cargar.

`node --check app.js` comprueba la sintaxis. La verificación con cámara real debe realizarse en la notebook que se llevará a clase.

Con el servidor abierto, `node verify.cjs` ejecuta las pruebas de navegador en Edge con cámara simulada: modelos, ciclo de cámara, ocultamiento/revelado, anotaciones, pérdida de rostro, guías y diseño adaptable. Usa datos sintéticos para verificar la interfaz y no evalúa precisión emocional. Guarda capturas en una carpeta temporal.
