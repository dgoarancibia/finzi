# Changelog - Finzi

Todos los cambios importantes del proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
