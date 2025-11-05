# 🏗️ Arquitectura Técnica - Finzi v3.2

Este documento detalla la arquitectura completa del proyecto Finzi, explicando decisiones técnicas, patrones de diseño y flujos de datos.

---

## 📑 Índice

- [Visión General](#visión-general)
- [Decisiones Arquitectónicas](#decisiones-arquitectónicas)
- [Estructura de Capas](#estructura-de-capas)
- [Flujo de Datos](#flujo-de-datos)
- [Gestión de Estado](#gestión-de-estado)
- [Persistencia de Datos](#persistencia-de-datos)
- [Sistema de Build](#sistema-de-build)
- [PWA y Offline-First](#pwa-y-offline-first)
- [Patrones de Diseño](#patrones-de-diseño)
- [Rendimiento](#rendimiento)

---

## 🎯 Visión General

Finzi es una **Single Page Application (SPA)** construida con React 18, utilizando una arquitectura **monolítica modular** que se compila en un único archivo HTML.

### Principios Arquitectónicos

1. **Simplicidad**: Sin frameworks complejos ni configuraciones innecesarias
2. **Zero Dependencies**: No requiere `npm install`, todo desde CDN
3. **Offline-First**: Funciona sin conexión después de la primera carga
4. **Modular pero Cohesivo**: Código modular en desarrollo, compilado en producción
5. **Local-First**: Datos locales con opción a sincronización futura

### Stack Tecnológico

```
┌─────────────────────────────────────────────┐
│           Navegador (Runtime)               │
├─────────────────────────────────────────────┤
│  React 18 (UI) + TailwindCSS (Estilos)     │
│  Chart.js (Gráficos) + PapaParse (CSV)     │
├─────────────────────────────────────────────┤
│        Dexie.js (Abstracción DB)            │
├─────────────────────────────────────────────┤
│         IndexedDB (Persistencia)            │
│       LocalStorage (Preferencias)           │
└─────────────────────────────────────────────┘
```

---

## 🎨 Decisiones Arquitectónicas

### 1. ¿Por qué Single File Architecture?

**Decisión**: Compilar todo en un único `index.html`

**Ventajas**:
- ✅ Deploy extremadamente simple (un solo archivo)
- ✅ Funciona en cualquier hosting estático
- ✅ No requiere bundler (Webpack, Vite, etc.)
- ✅ Fácil de compartir y distribuir
- ✅ Menor latencia (una sola petición HTTP)

**Desventajas**:
- ⚠️ Archivo grande (~400KB)
- ⚠️ No code-splitting automático

**Mitigación**: Service Worker cachea el archivo completo después de la primera carga.

---

### 2. ¿Por qué CDN en lugar de npm?

**Decisión**: Cargar librerías desde CDN

**Ventajas**:
- ✅ Sin `node_modules` (ahorro de espacio)
- ✅ Usuarios finales no necesitan Node.js
- ✅ Actualizaciones fáciles (cambiar URL)
- ✅ Browser caching compartido

**Desventajas**:
- ⚠️ Requiere internet en la primera carga
- ⚠️ Dependencia de servicios externos

**Mitigación**: Service Worker cachea los CDN después de la primera carga.

---

### 3. ¿Por qué IndexedDB en lugar de Firebase directamente?

**Decisión**: Iniciar con IndexedDB local

**Ventajas**:
- ✅ 100% privado y local
- ✅ No requiere cuenta externa
- ✅ Funciona offline desde el inicio
- ✅ Sin límites de cuota (hasta espacio en disco)
- ✅ Preparado para migración futura a Firebase

**Desventajas**:
- ⚠️ No sincroniza entre dispositivos

**Roadmap**: Migrar a Firebase en v3.3 manteniendo compatibilidad.

---

### 4. ¿Por qué React sin JSX build?

**Decisión**: Usar Babel Standalone en el navegador

**Ventajas**:
- ✅ Escribir JSX sin configurar Babel
- ✅ No requiere transpilación previa
- ✅ Desarrollo más rápido

**Desventajas**:
- ⚠️ Transpilación en runtime (más lento)

**Mitigación**: Para producción, todo se cachea con Service Worker.

---

## 📚 Estructura de Capas

### Arquitectura en Capas

```
┌─────────────────────────────────────────────┐
│          PRESENTACIÓN (Components)          │ ← React Components
├─────────────────────────────────────────────┤
│          LÓGICA DE NEGOCIO (Utils)          │ ← Calculators, Parsers
├─────────────────────────────────────────────┤
│        ACCESO A DATOS (DB Layer)            │ ← Dexie.js Wrapper
├─────────────────────────────────────────────┤
│       PERSISTENCIA (IndexedDB/LS)           │ ← Browser Storage
└─────────────────────────────────────────────┘
```

### Capa de Presentación

**Responsabilidad**: Interfaz de usuario y experiencia

**Componentes**:
```
components/
├── shared/              # Componentes reutilizables
│   ├── Modal.jsx
│   ├── Card.jsx
│   ├── ProgressBar.jsx
│   ├── AlertBadge.jsx
│   └── CollapsibleSection.jsx
├── Sidebar.jsx          # Layout y navegación
└── [13 páginas]         # Vistas específicas
```

**Características**:
- Componentes funcionales con Hooks
- React.memo para optimización
- Context API para estado global
- TailwindCSS para estilos

---

### Capa de Lógica de Negocio

**Responsabilidad**: Procesamiento y cálculos

**Módulos**:

#### 1. **csvParser.js**
```javascript
Responsabilidades:
- Parsear CSV con PapaParse
- Normalizar comercios (limpiar nombres)
- Detectar cuotas (múltiples patrones)
- Excluir cuotas 0/X
- Aplicar aprendizaje automático
```

#### 2. **categorizer.js**
```javascript
Responsabilidades:
- Categorizar transacciones automáticamente
- Mantener patrones de categorización
- Aprender de ediciones del usuario
```

#### 3. **budgetCalculator.js**
```javascript
Responsabilidades:
- Calcular presupuestos por categoría
- Determinar alertas (verde/amarillo/rojo)
- Proyectar gastos futuros
```

#### 4. **projections.js**
```javascript
Responsabilidades:
- Calcular metas de ahorro
- Proyectar cumplimiento de objetivos
- Analizar tendencias
```

#### 5. **formatters.js**
```javascript
Responsabilidades:
- Formatear montos ($123.456)
- Formatear fechas (dd/mm/yyyy)
- Parsear fechas desde CSV
```

---

### Capa de Acceso a Datos

**Responsabilidad**: Abstracción de la base de datos

**Archivo**: `utils/db.js`

**Patrón**: Repository Pattern

```javascript
// Funciones CRUD expuestas globalmente
window.addMesCarga(mes)
window.getMesesCarga()
window.deleteMesCarga(id)

window.addTransaccion(transaccion)
window.getTransaccionesByMes(mesId)
window.updateTransaccion(id, cambios)

// ... etc
```

**Ventajas**:
- ✅ Centraliza acceso a datos
- ✅ Fácil de testear
- ✅ Fácil de migrar a otro storage

---

### Capa de Persistencia

**Tecnologías**:

#### IndexedDB (vía Dexie.js)
```
Uso: Datos transaccionales
- Transacciones
- Meses cargados
- Presupuestos
- Recurrentes
- Liquidaciones
- Ingresos
- Reembolsos
```

#### LocalStorage
```
Uso: Preferencias y aprendizaje
- Perfiles
- Categorías
- Patrones aprendidos (comercios/descripciones)
- Dark mode
```

**¿Por qué dos storages?**

| Característica | IndexedDB | LocalStorage |
|----------------|-----------|--------------|
| Capacidad | ~GB | ~5-10MB |
| Queries | ✅ Indexado | ❌ Solo key-value |
| Transacciones | ✅ | ❌ |
| Sincronía | Async | Sync |
| Uso en Finzi | Datos grandes | Configuración |

---

## 🔄 Flujo de Datos

### 1. Importación de CSV

```
Usuario selecciona CSV
        ↓
PapaParse.parse()
        ↓
csvParser.procesarCSV()
    ├─→ detectarCuotas()
    ├─→ normalizarComercio()
    ├─→ aplicarAprendizaje()
    └─→ categorizarAutomaticamente()
        ↓
db.addTransaccion() (×N)
        ↓
IndexedDB
        ↓
React re-render
        ↓
Visualización actualizada
```

### 2. Edición de Transacción

```
Usuario edita transacción
        ↓
handleGuardarEdicion()
    ├─→ Detectar cambio en comercio
    │   └─→ guardarComercioAprendido()
    │       └─→ localStorage
    ├─→ Detectar cambio en descripción
    │   └─→ guardarDescripcionAprendida()
    │       └─→ localStorage (solo si es cuota)
    └─→ db.updateTransaccion()
        └─→ IndexedDB
        ↓
React Context actualiza
        ↓
Componentes re-renderizan
```

### 3. Cálculo de Presupuesto

```
Seleccionar mes
        ↓
getTransaccionesByMes()
        ↓
Agrupar por categoría
        ↓
getPresupuestosByMes()
        ↓
budgetCalculator.calcular()
    ├─→ Gasto actual vs presupuesto
    ├─→ Calcular porcentaje
    └─→ Determinar alerta
        ↓
Renderizar ProgressBar
    ├─→ Verde (0-70%)
    ├─→ Amarillo (70-90%)
    ├─→ Rojo (90-100%)
    └─→ Negro (>100%)
```

### 4. Sistema de Reembolsos

```
Usuario marca gasto como reembolsable
        ↓
Abrir modal de reembolso
        ↓
Seleccionar deudor y tipo
        ↓
db.addReembolso()
    ├─→ Crear reembolso
    └─→ Actualizar transacción
        ↓
IndexedDB (2 tablas)
        ↓
Refrescar componente
        ↓
Mostrar en dashboard de reembolsos
```

---

## 🧠 Gestión de Estado

### Context API

**Contexto Global** (`AppContext`):

```javascript
{
    // Navegación
    currentPage: string,
    setCurrentPage: (page) => void,

    // Selección de meses
    selectedMonth: Object,
    setSelectedMonth: (mes) => void,
    selectedMonths: Array,
    setSelectedMonths: (meses) => void,

    // Configuración
    perfiles: Array,
    updatePerfiles: (perfiles) => void,
    categorias: Array,
    updateCategorias: (categorias) => void,

    // Datos
    mesesCargados: Array,
    refreshMesesCargados: () => Promise,

    // UI
    isSidebarOpen: boolean,
    setIsSidebarOpen: (open) => void,
    isDarkMode: boolean,
    setIsDarkMode: (dark) => void
}
```

### Estado Local

**Cada componente maneja su propio estado**:

```javascript
// Ejemplo: Home.jsx
const [transacciones, setTransacciones] = useState([]);
const [presupuestos, setPresupuestos] = useState([]);
const [loading, setLoading] = useState(true);
const [modalAbierto, setModalAbierto] = useState(false);
```

### Patrón de Actualización

```javascript
// 1. Modificar en DB
await db.updateTransaccion(id, cambios);

// 2. Refrescar datos locales
const transaccionesActualizadas = await getTransaccionesByMes(mesId);
setTransacciones(transaccionesActualizadas);

// 3. React re-renderiza automáticamente
```

---

## 💾 Persistencia de Datos

### Esquema de Base de Datos (v9)

```javascript
db.version(9).stores({
    mesesCarga: '++id, mesAnio, fechaCarga',
    transacciones: '++id, mesAnioId, perfilId, fecha, categoria, comercio, esCompartido, esReembolsable, reembolsoId',
    presupuestos: '++id, mesAnioId, categoria, monto, esPlantilla',
    recurrentes: '++id, nombre, categoria, perfilId, montoEstimado, activa, ultimoMes',
    historialRecurrentes: '++id, recurrenteId, mesAnio, monto, fecha',
    comprasPlaneadas: '++id, nombre, monto, cuotas, categoria, perfilId, fechaCreacion',
    liquidaciones: '++id, mesAnioId, mesAnio, deudorId, acreedorId, monto, fecha, gastosIncluidos',
    ingresos: '++id, mesAnio, perfilId, monto, descripcion, fecha, esRecurrente',
    reembolsos: '++id, transaccionOrigenId, nombreDeudor, estado, tipoCompra, cuotasTotal, fechaCreacion, fechaSolicitud, fechaPago'
});
```

### Migraciones

**Estrategia**: Dexie maneja migraciones automáticamente

```javascript
// Ejemplo de migración de v8 a v9
db.version(9).stores({
    // ... schemas
}).upgrade(tx => {
    // Agregar campos nuevos a registros existentes
    return tx.table('transacciones').toCollection().modify(transaccion => {
        if (transaccion.esReembolsable === undefined) {
            transaccion.esReembolsable = false;
        }
        if (transaccion.reembolsoId === undefined) {
            transaccion.reembolsoId = null;
        }
    });
});
```

### Índices

**Campos indexados**:
- `mesAnio`: Búsqueda rápida por mes
- `perfilId`: Filtrar por usuario
- `categoria`: Agrupar por categoría
- `fecha`: Ordenar cronológicamente
- `comercio`: Búsqueda por comercio
- `esCompartido`: Filtrar compartidos
- `reembolsoId`: Relación con reembolsos

---

## ⚙️ Sistema de Build

### Script de Compilación

**Archivo**: `scripts/build.js`

**Proceso**:

```javascript
1. Leer template base (src/app.html)
2. Buscar markers /* INJECT:path/file.js */
3. Leer archivo correspondiente
4. Reemplazar marker con contenido
5. Repetir para todos los archivos
6. Escribir index.html final
```

**Ejemplo**:

```html
<!-- Template -->
<script>
    /* INJECT:utils/db.js */
</script>

<!-- Resultado -->
<script>
    window.db = new Dexie('GastosTCDatabase');
    // ... código completo de db.js
</script>
```

### Orden de Inyección

**Importante**: El orden importa

```javascript
const archivos = [
    // 1. Constantes (sin dependencias)
    'constants/categories.js',
    'constants/patterns.js',

    // 2. Utils (pueden usar constantes)
    'utils/db.js',
    'utils/formatters.js',
    'utils/csvParser.js',
    'utils/categorizer.js',
    'utils/budgetCalculator.js',
    'utils/projections.js',

    // 3. Shared Components (React)
    'components/shared/*.jsx',

    // 4. Main Components (usan shared)
    'components/*.jsx'
];
```

---

## 📱 PWA y Offline-First

### Service Worker

**Estrategia**: Network First → Cache Fallback

```javascript
// Para CDN (librerías externas)
fetch(request)
    .then(response => {
        cache.put(request, response.clone());
        return response;
    })
    .catch(() => caches.match(request));

// Para archivos locales
caches.match(request)
    .then(cached => cached || fetch(request));
```

### Manifest.json

```json
{
  "name": "Finzi - Analizador de Gastos TC",
  "short_name": "Finzi",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#2D3748",
  "theme_color": "#7DD3C0"
}
```

### Instalación

**Criterios** (automáticos):
- ✅ Servido sobre HTTPS (o localhost)
- ✅ Tiene manifest.json
- ✅ Tiene Service Worker registrado
- ✅ Usuario visita la app 2+ veces

---

## 🎨 Patrones de Diseño

### 1. Repository Pattern

**Uso**: Acceso a datos

```javascript
// Abstracción de la DB
window.getTransaccionesByMes = async (mesId) => {
    return await db.transacciones
        .where('mesAnioId').equals(mesId)
        .toArray();
};
```

### 2. Observer Pattern

**Uso**: React Context + useState

```javascript
// Context notifica a todos los consumidores
const [isDarkMode, setIsDarkMode] = useState(false);

// Los componentes suscritos se re-renderizan
const { isDarkMode } = useApp();
```

### 3. Strategy Pattern

**Uso**: Categorización

```javascript
// Diferentes estrategias de categorización
const estrategias = [
    categorizarPorPalabrasClaves,
    categorizarPorComercio,
    categorizarPorMonto,
    categorizacionPorDefecto
];

// Aplica la primera que coincida
for (const estrategia of estrategias) {
    const categoria = estrategia(transaccion);
    if (categoria) return categoria;
}
```

### 4. Facade Pattern

**Uso**: csvParser.js

```javascript
// Oculta complejidad interna
window.procesarCSV = async (archivo) => {
    // Internamente maneja:
    // - Parsing
    // - Normalización
    // - Detección
    // - Aprendizaje
    // - Persistencia
};
```

---

## ⚡ Rendimiento

### Optimizaciones Implementadas

#### 1. React.memo

```javascript
const Card = memo(({ title, children }) => {
    // Solo re-renderiza si props cambian
});
```

#### 2. useMemo y useCallback

```javascript
const transaccionesFiltradas = useMemo(() => {
    return transacciones.filter(t => t.categoria === categoriaSeleccionada);
}, [transacciones, categoriaSeleccionada]);

const handleEditar = useCallback((id) => {
    // Función memorizada
}, [dependencias]);
```

#### 3. Lazy Loading de Datos

```javascript
// Solo cargar transacciones del mes seleccionado
useEffect(() => {
    if (selectedMonth) {
        cargarTransaccionesMes(selectedMonth.id);
    }
}, [selectedMonth]);
```

#### 4. Debouncing

```javascript
// Búsqueda de transacciones
const buscarDebounced = useMemo(
    () => debounce((texto) => {
        realizarBusqueda(texto);
    }, 300),
    []
);
```

### Métricas Objetivo

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| First Contentful Paint | < 1.5s | ~1.2s |
| Time to Interactive | < 3.0s | ~2.5s |
| Bundle Size | < 500KB | ~400KB |
| Lighthouse Score | > 90 | ~95 |

---

## 🔮 Evolución Futura

### v3.3: Firebase Integration

**Cambios arquitectónicos**:

```
Actual:
App → IndexedDB

Futuro:
App → Firestore (nube)
    ↓
    Cache local (offline)
```

**Estrategia de migración**:
1. Agregar Firebase SDK
2. Crear capa de abstracción
3. Mantener compatibilidad con IndexedDB
4. Migración gradual de usuarios

---

## 📚 Referencias

- [React 18 Documentation](https://react.dev/)
- [Dexie.js Guide](https://dexie.org/)
- [TailwindCSS](https://tailwindcss.com/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)

---

*Documento actualizado: Noviembre 2025*
*Versión de la app: 3.2*
