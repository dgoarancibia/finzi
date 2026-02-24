# Changelog - Finzi

Todos los cambios importantes del proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [3.5.0] - 2025-11-12

### ✨ Añadido
- **Balance compartido de período completo**: Cuando seleccionas SOLO tu mes (ej: octubre Diego), el sistema ahora busca automáticamente TODOS los gastos compartidos de ese mismo período (octubre Diego + octubre Marcela) para calcular el balance correcto.
  - Si Diego tiene un gasto compartido de $1,000 y Marcela tiene otro de $1,000 en el mismo mes, el balance muestra correctamente "Saldado"
  - Permite a cada perfil cargar su propio mes y ver el balance real sin necesidad de seleccionar ambos meses

### 🔧 Mejorado
- **Cálculo de balance compartido**: Ahora considera gastos de todos los perfiles del mismo período (mesAnio)
- **Logs mejorados**: Muestra en consola cuántos meses y gastos compartidos encuentra en el período

### 📝 Notas de uso
- **Flujo recomendado para parejas**:
  1. Diego carga su PDF de octubre → marca gastos compartidos
  2. Marcela carga su PDF de octubre → marca gastos compartidos
  3. Cada uno puede seleccionar SOLO su mes y verá el balance correcto considerando los gastos del otro
  4. El sistema busca automáticamente en ambos meses del mismo período (2025-10)

---

## [3.4.0] - 2025-11-12

### 🔧 ARQUITECTURA CRÍTICA - Firebase como única fuente de verdad

**BREAKING CHANGE**: Eliminada arquitectura dual de almacenamiento (Firebase + IndexedDB). Ahora todo se guarda y lee SOLO desde Firebase.

### 🗑️ Eliminado
- **IndexedDB como almacenamiento primario**: Ahora solo Firebase es la fuente de verdad
- **Sincronización bidireccional**: Eliminados todos los códigos de sync entre Firebase ↔ IndexedDB
- **Cache local en IndexedDB**: Removida lógica que duplicaba datos en IndexedDB

### 🔧 Modificado
- **dataLayer.js**:
  - `getMesesCargaFirebase()` ahora retorna directamente desde Firebase sin sync a IndexedDB
  - `addMesCargaFirebase()` ahora retorna Firebase ID (string) en lugar de IndexedDB ID (number)
  - `addTransaccionesFirebase()` ahora solo guarda en Firebase, sin copia local
- **Home.jsx**:
  - `cargarDatosDeMeses()` ahora lee transacciones directamente desde Firebase vía `window.getTransaccionesByMes()`
  - Eliminadas llamadas a `db.transacciones.toArray()` y `db.presupuestos.toArray()`

### ⚠️ Impacto para usuarios
- **Datos existentes solo en IndexedDB se perderán**: Si tenías datos cargados antes de v3.4.0 que NO se sincronizaron a Firebase, deberás recargarlos.
- **Rendimiento inicial puede ser más lento**: Al leer desde Firebase en lugar de IndexedDB local, puede haber latencia en la primera carga.
- **Ventaja**: No más problemas de sincronización entre Firebase e IndexedDB. Un solo origen de verdad.

### 📝 Notas técnicas
- IndexedDB aún existe en el código (db.js) pero ya no se usa como almacenamiento primario
- Todos los nuevos datos (meses, transacciones, presupuestos) se guardan SOLO en Firebase
- IDs de meses ahora son strings de Firebase (ej: "abc123xyz") en lugar de números de IndexedDB (ej: 1, 2, 3)

---

## [3.3.9] - 2025-11-12

### ✨ Añadido
- **Parser Banco BCI completamente funcional**: Ahora soporta PDFs de Banco BCI con extracción completa de transacciones.
  - Detecta automáticamente transacciones spot (01/01) vs cuotas (06/06, etc.)
  - Extrae totales resumen de cuotas y comisiones
  - Identifica comisiones por descripción ("COBRO ADM MENSUAL")
  - Total parseado coincide exactamente con monto facturado (ej: $2,020,987)

### 🔧 Mejorado
- **Meses por perfil**: Ahora cada perfil (Diego/Marcela) puede cargar el mismo mes independientemente.
  - IndexedDB schema actualizado a v13 con campo `perfilId` en `mesesCarga`
  - Validación de duplicados por `mesAnio + perfilId`
  - Permite que ambos perfiles carguen "Octubre 2025" sin conflictos
- **Modal PDF mejorado**: Agregado selector de perfil (¿De quién es este PDF?)
- **Validación de duplicados**: Previene crear meses duplicados para el mismo perfil

### 🐛 Corregido
- **Bug duplicados vacíos**: Eliminada lógica que creaba meses duplicados sin transacciones
- **Parser BCI**: Corregido regex para detectar formato BCI (LUGAR FECHA CODIGO DESCRIPCION)
- **Comisiones BCI**: Ahora detecta y suma correctamente las comisiones al total

## [3.4.0] - 2025-11-12

### ✨ Añadido (IMPORTANTE)
- **Parser Edwards ahora captura cuotas de meses anteriores**: El parser ahora extrae los totales resumen del PDF ("TOTAL TRANSACCIONES EN CUOTAS") para capturar pagos de cuotas de meses anteriores que no aparecen en el detalle de transacciones.
  - **Problema**: Los PDFs de Edwards muestran las cuotas de meses anteriores (ej: cuota 10/10 de una compra de enero) solo en la sección de totales, no en el detalle de transacciones. Esto causaba que el parser omitiera cientos de miles de pesos.
  - **Solución**: Parser ahora hace 3 pasos:
    1. Extrae totales resumen ("TOTAL TRANSACCIONES EN CUOTAS E $832.670")
    2. Extrae transacciones detalladas del mes actual
    3. Reconcilia y agrega "transacciones virtuales" por las diferencias
  - **Transacciones virtuales**: Cuando hay diferencia significativa (>$100), se crea una transacción virtual descriptiva:
    - "💳 Cuotas de meses anteriores (no detalladas en PDF)" - Para diferencias en cuotas
    - "📋 Comisiones adicionales (no detalladas en PDF)" - Para diferencias en comisiones
  - **Impacto**: Ahora el total parseado coincide exactamente con el total del banco (ej: $3.071.369)

### 🔧 Mejorado
- **Logging mejorado en parser Edwards**: Ahora muestra en consola:
  - Paso 1: Totales resumen encontrados (cuotas, comisiones)
  - Paso 2: Transacciones detalladas extraídas
  - Paso 3: Reconciliación de totales y diferencias
  - Total de transacciones detalladas vs virtuales
  - Monto total final

### 📝 Notas técnicas
- Las transacciones virtuales tienen el flag `esVirtual: true` para identificarlas
- Las transacciones virtuales usan `cuotaActual: 0, cuotasTotal: 0` como marcador especial
- La diferencia mínima para crear una transacción virtual de cuotas es $100
- La diferencia mínima para crear una transacción virtual de comisiones es $10

---

## [3.3.6] - 2025-11-11

### 🐛 Corregido (CRÍTICO)
- **Parser Edwards no capturaba todas las transacciones**: Corregido problema donde el parser solo sumaba transacciones PAT + SPOT, omitiendo cuotas y comisiones.
  - **Problema**: Parser descartaba transacciones en cuotas y comisiones/intereses, causando diferencias significativas con el monto total del banco.
  - **Solución**:
    - Agregada detección de patrón de cuotas `XX/YY` (ej: "01/12", "02/12")
    - Extraída información de `cuotaActual` y `cuotasTotal` de las transacciones
    - Removidos filtros que descartaban comisiones e intereses
    - Comisiones e intereses ahora se categorizan automáticamente como "Comisiones y Seguros"
  - **Impacto**: Diferencias de más de $900.000 entre lo parseado y el total del banco

### ✨ Mejorado
- **Resumen del modal PDF con desglose**: Ahora muestra desglose de:
  - Total general (para validar con el banco)
  - Spot (transacciones en una sola cuota)
  - Cuotas (transacciones en múltiples cuotas)
  - Comisiones (comisiones e intereses)
- Mejor visibilidad para validar que el total coincida con el estado de cuenta del banco

---

## [3.3.5] - 2025-11-11

### 🐛 Corregido (CRÍTICO)
- **Bug del signo $ desapareciendo**: Corregido problema crítico donde el signo `$` no aparecía en los montos (ej: "2.159.948" en lugar de "$2.159.948").
  - **Causa**: El método `String.replace()` en JavaScript interpreta `$$` como un patrón especial para "insertar un `$`", causando que template strings como `` `$${variable}` `` perdieran el primer `$`.
  - **Solución**: Escapar todos los `$` en el contenido antes del replace usando `.replace(/\$/g, '$$$$')` en build.js.
  - **Impacto**: Afectaba TODOS los montos en toda la aplicación (dashboard, transacciones, presupuestos, etc).
  - **Síntoma**: Montos se mostraban con formato de miles correcto pero sin símbolo de pesos.

### 🔧 Mejorado
- Build script ahora maneja correctamente caracteres especiales (`$`, `&`, etc.) en el contenido de archivos.

---

## [3.3.4] - 2025-11-11

### 🐛 Corregido (CRÍTICO)
- **Error de índice en reconciliación**: Corregido `SchemaError: KeyPath origen on object store transacciones is not indexed`.
  - **Causa**: El índice `origen` no se creaba correctamente en bases de datos antiguas.
  - **Solución 1**: Incrementada versión de BD a 12 para forzar recreación de índices.
  - **Solución 2**: Código de reconciliación ahora usa `.toArray().filter()` como workaround (más robusto).
  - **Síntoma**: Error al guardar transacciones del PDF cuando intentaba ejecutar reconciliación.

### 🔧 Mejorado
- **Reset-completo mejorado**: Ahora limpia agresivamente:
  - Todo el localStorage (antes solo algunos items)
  - Todo el sessionStorage
  - Cachés del navegador (Cache API)
  - **Elimina completamente** la BD IndexedDB (no solo vacía tablas)
  - Recrea la BD desde cero con la versión correcta (12)
- Versión de BD actualizada a 12 en reset-completo.html

---

## [3.3.3] - 2025-11-11

### 🐛 Corregido (CRÍTICO)
- **Extracción de texto PDF mejorada**: Corregido el problema donde el texto del PDF se juntaba en pocas líneas (solo 5), causando que solo se detectaran 18 transacciones en lugar de ~60-70.
  - **Causa**: PDF.js extraía todo el texto de cada página como una sola línea larga.
  - **Solución**: Ahora detecta cambios en la posición Y del texto para preservar saltos de línea reales del PDF.
  - **Síntoma anterior**: Solo 5 líneas procesadas, 18 transacciones encontradas (cabeceras incorrectas).
  - **Resultado esperado**: ~150+ líneas procesadas, ~60-70 transacciones correctas.

### 🔧 Mejorado
- Logging mejorado: Ahora muestra número de líneas detectadas en el PDF.
- Mostrar primeras 20 líneas en lugar de 10 para mejor debugging.

---

## [3.3.2] - 2025-11-11

### 🐛 Corregido
- **Error de función no definida**: Corregido `categorizarAutomatico is not defined`. La función correcta es `window.categorizarTransaccion(descripcion, comercio)`.
  - **Síntoma**: PDF se parseaba correctamente (18 transacciones) pero fallaba al categorizar.
  - **Causa**: Nombre de función incorrecto.

---

## [3.3.1] - 2025-11-11

### 🐛 Corregido (CRÍTICO)
- **Bug de setState asíncrono en modal PDF**: Corregido el problema donde el archivo PDF era `undefined` al intentar parsearlo. El error ocurría porque `setArchivo(file)` es asíncrono en React, y `parsearPDF()` se ejecutaba antes de que el estado se actualizara.
  - **Solución**: Ahora `parsearPDF()` recibe el archivo como parámetro directo en lugar de depender del estado.
  - **Síntoma**: PDF mostraba "0 transacciones" sin logs en consola.
  - **Causa**: `archivo` era `undefined` cuando se ejecutaba el parser.

### 🔧 Mejorado
- **Logging ultra-detallado**: Agregados logs en cada paso del proceso de carga de PDF:
  - `[ModalPDF]` - Estado del modal y archivo seleccionado
  - `[extractTextFromPDF]` - Extracción página por página
  - `[parsearPDF]` - Proceso completo con bandera separadora
  - Muestra nombre del archivo, tamaño, número de páginas, caracteres extraídos
- Mejor diagnóstico de problemas con logs visuales (🚀 📁 📖 📄 ✅ ❌)

---

## [3.3.0] - 2025-11-11

### ✨ Añadido
- **Detección automática de devoluciones en CSV**: Las transacciones con palabras clave como "DEVOL", "REEMBOLSO", "REVERSO", "ANULACIÓN", "ABONO", "CRÉDITO" ahora se convierten automáticamente a monto negativo para que resten del total en lugar de sumar.
- **Parser de PDF mejorado para Banco Edwards**: Implementado parser específico para el formato real del estado de cuenta de Banco Edwards (BANCOEDWARDS).
- **Detección automática de banco en PDF**: Ahora reconoce "BANCOEDWARDS" automáticamente.
- **Sistema de versionado visible**: La versión ahora aparece en el footer del sidebar (v3.3.0 - 11 Nov 2025).
- **CHANGELOG**: Documentación de cambios por versión.

### 🐛 Corregido
- **Parser de PDF Edwards**: Corregido para manejar el formato tabular real del estado de cuenta (formato: `LUGAR DD/MM/YY CODIGO DESCRIPCION $ MONTO`).
- **Filtros de transacciones PDF**: Ahora excluye correctamente:
  - Pagos (Pago Pesos TEF, Pago PAP)
  - Impuestos (Decreto Ley 3475)
  - Comisiones mensuales
  - Intereses rotativos y de mora
  - Traspasos de deuda
  - Devoluciones automáticas
  - Transacciones menores a $100

### 🔧 Mejorado
- **Logging detallado en parser PDF**: Ahora muestra en consola:
  - Primeros 500 caracteres del PDF
  - Banco detectado
  - Total de líneas procesadas
  - Matches encontrados
  - Primeras 5 transacciones parseadas
- **Limpieza de descripciones**: Remueve ubicaciones duplicadas (SANTIAGO, LAS CONDES, etc.) y montos repetidos en las descripciones.

### 📝 Documentación
- Agregado sistema de control de versiones
- Creado CHANGELOG.md para trackear cambios

### 🔍 Ejemplo de uso
**Antes (v3.2.0)**:
- CSV con "DEVOL. PAGO $42.372" sumaba al total → Total: $3.113.741 ❌

**Después (v3.3.0)**:
- CSV con "DEVOL. PAGO $42.372" resta del total → Total: $3.071.369 ✅

---

## [3.2.0] - 2025-11-05 (aproximado)

### ✨ Añadido
- Sistema de detección de meses duplicados en carga de CSV
- Opciones al importar mes existente:
  - Reemplazar todo (eliminar existentes y cargar nuevos)
  - Agregar solo transacciones nuevas
  - Cancelar
- Detección de duplicados por fecha + comercio + monto (±$10 tolerancia)

### 🐛 Corregido
- Problema de índice roto de `mesAnioId` en Dexie
- Workaround con filtrado manual `.toArray().filter()` en lugar de `.where().equals()`
- useEffect que sobrescribía datos cargados (implementado `skipNextLoadRef`)

### 🔧 Mejorado
- Flujo de carga de CSV más robusto
- Prevención de cargas duplicadas

---

## [3.1.0] - Versiones anteriores

Cambios de versiones anteriores no documentados. El changelog comenzó en v3.2.0.

---

## Convenciones de Versionado

**MAJOR.MINOR.PATCH** (Ejemplo: 3.3.0)

- **MAJOR**: Cambios incompatibles con versiones anteriores
- **MINOR**: Nueva funcionalidad compatible con versiones anteriores
- **PATCH**: Corrección de bugs compatible con versiones anteriores

### Tipos de cambios:
- `✨ Añadido`: Nueva funcionalidad
- `🐛 Corregido`: Corrección de bugs
- `🔧 Mejorado`: Mejoras en funcionalidad existente
- `🗑️ Eliminado`: Funcionalidad eliminada
- `⚡ Performance`: Mejoras de rendimiento
- `🔒 Seguridad`: Correcciones de seguridad
- `📝 Documentación`: Cambios en documentación
