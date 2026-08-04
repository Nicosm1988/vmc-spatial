# Checklist de captura de fotos y medidas

Este procedimiento sirve para transformar evidencia autorizada en parámetros trazables. No concede permiso para entrar, fotografiar, medir, almacenar, procesar ni publicar. La autorización y las reglas del lugar prevalecen siempre.

> En el corte inicial del proyecto no se proporcionaron ni usaron fotos, planos o mediciones internas. Toda la escena es DEMO / NO VERIFICADA.

## 1. Aprobación antes de la visita

- [ ] Definir el objetivo: qué sala/elementos se modelarán y para qué audiencia.
- [ ] Obtener autorización escrita del propietario del espacio y de seguridad/privacidad.
- [ ] Registrar si se permite: observar, medir, fotografiar, filmar, escanear y/o usar fotogrametría.
- [ ] Separar permiso de procesamiento interno de permiso de publicación externa.
- [ ] Listar explícitamente zonas y elementos prohibidos.
- [ ] Confirmar horario, acompañante autorizado y reglas de ingreso.
- [ ] Definir repositorio seguro, usuarios con acceso y período de retención.
- [ ] Definir si algún proveedor/herramienta externa está aprobado; por defecto, ninguno.
- [ ] Preparar consentimiento o exclusión de personas; preferir la sala vacía.
- [ ] Asignar IDs neutros al proyecto, sala, paredes y objetos, sin nombres personales.
- [ ] Acordar tolerancia objetivo por categoría y quién validará el resultado.

No comenzar si un permiso o alcance está implícito, verbalmente ambiguo o vencido.

## 2. Preparación y equipo

- [ ] Cinta o distanciómetro calibrado y permitido en el sitio.
- [ ] Regla/escala visible solo cuando esté autorizada.
- [ ] Nivel o inclinómetro si la tolerancia lo requiere.
- [ ] Cámara/dispositivo autorizado, con GPS/backup automático desactivados si corresponde.
- [ ] Baterías, memoria cifrada/aprobada y hoja de captura offline.
- [ ] Elemento de calibración con dimensión conocida para validar escala en fotos.
- [ ] Convención de nombres preparada, por ejemplo `ROOM-WALL-SEQ`, sin ubicación sensible.
- [ ] Relojes sincronizados para vincular fotos, medidas y notas.
- [ ] Prueba de que las capturas no se sincronizan a una nube personal.

Registrar equipo, modelo, fecha de calibración y precisión nominal; no asumir que más decimales implican mayor exactitud.

## 3. Sistema de coordenadas

- [ ] Elegir un origen físico estable y aprobado.
- [ ] Marcar ejes `+x` y `+y` del plano en el croquis de trabajo.
- [ ] Registrar altura `z` desde piso terminado.
- [ ] Confirmar orientación/norte solo si puede publicarse; si no, usar orientación local.
- [ ] Capturar al menos dos puntos de control independientes.
- [ ] Registrar desniveles, pendientes o cambios de piso.
- [ ] Documentar la transformación al dominio: plano `x/y` en milímetros enteros.
- [ ] No incluir coordenadas geográficas precisas si no están aprobadas.

## 4. Medición de la envolvente

Medir primero el marco general y después el detalle. Repetir diagonales para detectar errores.

- [ ] largo y ancho máximos de la sala/planta incluida;
- [ ] altura libre piso terminado → cielorraso visible;
- [ ] espesor/posición de segmentos de pared relevantes;
- [ ] quiebres, curvas y radios con puntos de control suficientes;
- [ ] columnas y elementos estructurales solo si su registro/publicación está autorizado;
- [ ] puertas: ancho/alto y posición, omitiendo herrajes/control de acceso sensibles;
- [ ] ventanas: ancho/alto, antepecho y modulación visible;
- [ ] diagonales de control y cierre del perímetro;
- [ ] tolerancia e incertidumbre de cada serie;
- [ ] segunda medición independiente de dimensiones críticas.

No registrar rutas, accesos o infraestructura que seguridad haya excluido, aunque mejoren el realismo.

## 5. Captura fotográfica segura

### Cobertura geométrica

- [ ] vista general desde esquinas permitidas, con solape suficiente;
- [ ] cada pared de frente y en oblicuo, manteniendo una secuencia consistente;
- [ ] uniones piso/pared y pared/cielorraso para comprender límites;
- [ ] aberturas y objetos con referencia de escala autorizada;
- [ ] materiales con una toma general y otra de detalle, con luz neutra si es posible;
- [ ] objetos repetidos: una referencia completa y variaciones realmente distintas;
- [ ] anotar lente/zoom cuando cambie, evitando zoom digital innecesario;
- [ ] repetir tomas borrosas o sobreexpuestas antes de abandonar el lugar.

### Privacidad y seguridad en cada cuadro

- [ ] no aparecen personas, badges, nombres ni datos personales;
- [ ] monitores apagados o con contenido demo aprobado;
- [ ] pizarras, papeles, calendarios y pantallas están fuera de cuadro/cubiertos;
- [ ] no aparecen cámaras, controles de acceso, alarmas ni detalles prohibidos;
- [ ] revisar reflejos en vidrio, metal y monitores;
- [ ] no capturar redes, etiquetas de equipos, QR, seriales o puertos;
- [ ] revisar fondos y espacios conectados antes de disparar;
- [ ] eliminar EXIF/GPS antes de generar cualquier derivado compartible.

No confiar en un blur tardío como autorización para capturar contenido prohibido.

## 6. Inventario de objetos

Asignar un ID estable por objeto o grupo repetido y registrar:

- [ ] `id` neutro y tipo normalizado;
- [ ] nombre descriptivo sin personas/áreas sensibles;
- [ ] centro o punto de inserción `x/y` en mm;
- [ ] rotación respecto del eje acordado;
- [ ] ancho, profundidad y altura en mm;
- [ ] cantidad de instancias y diferencias entre variantes;
- [ ] material/color observables, sin afirmar especificación no medida;
- [ ] movilidad: fijo, móvil o desconocido;
- [ ] foto/medida de referencia por ID, almacenada fuera del repo;
- [ ] precisión, oclusiones y campos desconocidos;
- [ ] permiso de publicación del objeto y sus parámetros.

Para mesas/puestos:

- [ ] dimensiones de tapa y altura;
- [ ] cantidad/espaciado de puestos;
- [ ] sillas por lado y radio libre aproximado;
- [ ] monitores por puesto, orientación y tamaño, sin registrar contenido.

Para videowalls:

- [ ] extremos del segmento y altura aprobada;
- [ ] cantidad total, filas/columnas y gaps;
- [ ] orientación del frente;
- [ ] tamaño visible de panel, sin números de serie ni red/conectividad.

## 7. Registro mínimo por medición

Usar una tabla controlada fuera del repositorio de evidencia:

| Campo                  | Ejemplo no real                       |
| ---------------------- | ------------------------------------- |
| ID                     | `DEMO-WALL-01-LENGTH`                 |
| Valor original         | `4.002 m`                             |
| Valor de dominio       | `4002 mm`                             |
| Método/equipo          | distanciómetro aprobado               |
| Precisión nominal      | `±3 mm`                               |
| Repeticiones           | `4001`, `4003` mm                     |
| Incertidumbre adoptada | `±5 mm`                               |
| Fecha/operador         | rol + fecha, según política           |
| Evidencia              | referencia segura, no archivo público |
| Estado                 | restringido / interno / publicable    |
| Observaciones          | obstáculos, acabado, punto medido     |

La conversión a mm entero debe conservar la incertidumbre aparte; no fabricar precisión al redondear.

## 8. Transferencia y sanitización

- [ ] verificar conteo y checksums antes de borrar la tarjeta/dispositivo;
- [ ] transferir solo al repositorio autorizado;
- [ ] confirmar que no hubo sync personal o upload automático;
- [ ] separar originales restringidos de derivados sanitizados;
- [ ] remover EXIF/GPS de derivados;
- [ ] revisar visualmente reflejos, fondos y contenido sensible;
- [ ] conservar mapa de IDs sin incorporar nombres innecesarios;
- [ ] registrar quién accedió/procesó según la política aplicable;
- [ ] eliminar temporales al terminar el período acordado;
- [ ] no copiar evidencia al repo Git, PRs, issues, CI ni herramientas externas no aprobadas.

## 9. Reconstrucción y validación iterativa

1. Modelar primero perímetro, origen y altura; bloquear mobiliario.
2. Comparar puntos de control y diagonales; registrar error máximo/medio.
3. Incorporar aberturas autorizadas y validar alineaciones.
4. Incorporar objetos grandes; después repetidos y detalles.
5. Generar vistas desde poses equivalentes a las referencias sin publicar originales.
6. Realizar revisión ciega de escala/orientación con responsable autorizado.
7. Registrar correcciones como datos, no offsets ocultos en componentes 3D.
8. Verificar que 2D, 3D y JSON muestran el mismo resultado.
9. Clasificar cada elemento como demo, restringido, interno o publicable.
10. Actualizar `docs/ASSUMPTIONS_AND_FACTS.md` sin adjuntar evidencia.

## 10. Cierre y aprobación

- [ ] perímetro cierra dentro de la tolerancia acordada;
- [ ] puntos de control y orientación fueron verificados;
- [ ] unidades son mm enteros en dominio y metros solo en render;
- [ ] objetos desconocidos permanecen explícitamente desconocidos/demo;
- [ ] no se modelaron elementos prohibidos;
- [ ] diferencias conocidas e incertidumbres están registradas;
- [ ] responsable técnico validó geometría;
- [ ] seguridad/privacidad validó el contenido visible;
- [ ] legal/comunicación validó licencias y marca cuando aplica;
- [ ] propietario de información aprobó el alcance de publicación;
- [ ] evidencia temporal se retuvo/eliminó según lo acordado.

Solo después de completar la trazabilidad un elemento puede cambiar de “DEMO / NO VERIFICADO” al estado aprobado correspondiente.
