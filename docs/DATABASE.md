# 🗄️ Estructura de Base de Datos - Finzi v3.2

Documentación completa del esquema de base de datos, relaciones y queries comunes.

---

## 📑 Índice

- [Visión General](#visión-general)
- [Tecnología](#tecnología)
- [Esquema Completo](#esquema-completo)
- [Tablas Detalladas](#tablas-detalladas)
- [Relaciones](#relaciones)
- [Índices](#índices)
- [Queries Comunes](#queries-comunes)
- [Migraciones](#migraciones)
- [Backup y Restore](#backup-y-restore)

---

## 🎯 Visión General

Finzi utiliza **IndexedDB** (vía Dexie.js) para almacenar datos transaccionales y **LocalStorage** para preferencias y aprendizaje.

### División de Responsabilidades

```
┌──────────────────────────────────────┐
│         IndexedDB (Dexie)            │
│  - Transacciones                     │
│  - Meses cargados                    │
│  - Presupuestos                      │
│  - Recurrentes                       │
│  - Liquidaciones                     │
│  - Ingresos                          │
│  - Reembolsos                        │
│  - Compras planeadas                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│         LocalStorage                 │
│  - Perfiles                          │
│  - Categorías                        │
│  - Patrones aprendidos               │
│  - Dark mode                         │
└──────────────────────────────────────┘
```

---

## 🛠️ Tecnología

### Dexie.js 3.2.4

**¿Por qué Dexie?**
- ✅ Abstracción simple de IndexedDB
- ✅ Promises nativas
- ✅ Queries tipo SQL
- ✅ Migraciones automáticas
- ✅ Transacciones ACID

**Inicialización**:

```javascript
const db = new Dexie('GastosTCDatabase');

db.version(9).stores({
    // ... definición de tablas
});
```

---

## 📊 Esquema Completo

### Versión 9 (Actual)

```javascript
db.version(9).stores({
    // 1. Meses cargados
    mesesCarga: '++id, mesAnio, fechaCarga',

    // 2. Transacciones (núcleo)
    transacciones: '++id, mesAnioId, perfilId, fecha, categoria, comercio, esCompartido, esReembolsable, reembolsoId',

    // 3. Presupuestos
    presupuestos: '++id, mesAnioId, categoria, monto, esPlantilla',

    // 4. Gastos recurrentes
    recurrentes: '++id, nombre, categoria, perfilId, montoEstimado, activa, ultimoMes',

    // 5. Historial de recurrentes
    historialRecurrentes: '++id, recurrenteId, mesAnio, monto, fecha',

    // 6. Compras planeadas (simulador)
    comprasPlaneadas: '++id, nombre, monto, cuotas, categoria, perfilId, fechaCreacion',

    // 7. Liquidaciones (balance)
    liquidaciones: '++id, mesAnioId, mesAnio, deudorId, acreedorId, monto, fecha, gastosIncluidos',

    // 8. Ingresos
    ingresos: '++id, mesAnio, perfilId, monto, descripcion, fecha, esRecurrente',

    // 9. Reembolsos
    reembolsos: '++id, transaccionOrigenId, nombreDeudor, estado, tipoCompra, cuotasTotal, fechaCreacion, fechaSolicitud, fechaPago'
});
```

---

## 📋 Tablas Detalladas

### 1. mesesCarga

**Propósito**: Registro de meses importados desde CSV

**Schema**:

```typescript
interface MesCarga {
    id: number;               // PK auto-incremental
    mesAnio: string;          // YYYY-MM (ej: "2024-10")
    fechaCarga: string;       // ISO 8601 (ej: "2024-10-15T10:30:00Z")
    archivoNombre?: string;   // Nombre del CSV
    totalTransacciones?: number;  // Cantidad importada
}
```

**Índices**:
- `++id`: Primary Key
- `mesAnio`: Búsqueda por mes (índice único implícito)
- `fechaCarga`: Ordenar por fecha de importación

**Ejemplo**:

```javascript
{
    id: 1,
    mesAnio: "2024-10",
    fechaCarga: "2024-11-05T14:30:00Z",
    archivoNombre: "tc-octubre-2024.csv",
    totalTransacciones: 156
}
```

**Queries comunes**:

```javascript
// Obtener todos los meses
const meses = await db.mesesCarga.toArray();

// Buscar mes específico
const octubre = await db.mesesCarga
    .where('mesAnio')
    .equals('2024-10')
    .first();

// Meses ordenados por fecha (más reciente primero)
const recientes = await db.mesesCarga
    .orderBy('fechaCarga')
    .reverse()
    .toArray();
```

---

### 2. transacciones

**Propósito**: Registro de todas las transacciones/gastos

**Schema**:

```typescript
interface Transaccion {
    id: number;                   // PK auto-incremental
    mesAnioId: number;            // FK → mesesCarga.id
    perfilId: number;             // ID del perfil
    fecha: string;                // ISO 8601
    descripcion: string;          // Descripción del gasto
    comercio: string;             // Nombre del comercio normalizado
    categoria: string;            // Categoría asignada
    monto: number;                // Monto en pesos (positivo)
    cuotaActual?: number;         // Cuota actual (ej: 3)
    cuotasTotal?: number;         // Total cuotas (ej: 12)
    esCompartido: boolean;        // ¿Gasto compartido?
    esReembolsable: boolean;      // ¿Será reembolsado? (v9+)
    reembolsoId?: number;         // FK → reembolsos.id (v9+)
}
```

**Índices**:
- `++id`: Primary Key
- `mesAnioId`: FK para joins rápidos
- `perfilId`: Filtrar por persona
- `fecha`: Ordenar cronológicamente
- `categoria`: Agrupar por categoría
- `comercio`: Buscar por comercio
- `esCompartido`: Filtrar compartidos
- `esReembolsable`: Filtrar reembolsables
- `reembolsoId`: Relación con reembolsos

**Ejemplo**:

```javascript
{
    id: 42,
    mesAnioId: 1,
    perfilId: 1,
    fecha: "2024-10-15",
    descripcion: "Notebook Dell XPS",
    comercio: "Amazon",
    categoria: "Tecnología",
    monto: 125000,
    cuotaActual: 3,
    cuotasTotal: 12,
    esCompartido: false,
    esReembolsable: true,
    reembolsoId: 5
}
```

**Queries comunes**:

```javascript
// Transacciones de un mes
const trans = await db.transacciones
    .where('mesAnioId')
    .equals(mesId)
    .toArray();

// Transacciones de un perfil en un mes
const misTrans = await db.transacciones
    .where('[mesAnioId+perfilId]')
    .equals([mesId, perfilId])
    .toArray();

// Gastos compartidos de un mes
const compartidos = await db.transacciones
    .where(['mesAnioId', 'esCompartido'])
    .equals([mesId, true])
    .toArray();

// Transacciones con cuotas
const conCuotas = await db.transacciones
    .where('mesAnioId')
    .equals(mesId)
    .filter(t => t.cuotasTotal && t.cuotasTotal > 1)
    .toArray();

// Total gastado en una categoría
const total = await db.transacciones
    .where(['mesAnioId', 'categoria'])
    .equals([mesId, 'Alimentación'])
    .toArray()
    .then(trans => trans.reduce((sum, t) => sum + t.monto, 0));
```

---

### 3. presupuestos

**Propósito**: Límites de gasto por categoría

**Schema**:

```typescript
interface Presupuesto {
    id: number;                // PK auto-incremental
    mesAnioId?: number;        // FK → mesesCarga.id (null si plantilla)
    categoria: string;         // Nombre de la categoría
    monto: number;             // Presupuesto en pesos
    esPlantilla: boolean;      // ¿Es plantilla o específico de mes?
}
```

**Índices**:
- `++id`: Primary Key
- `mesAnioId`: FK para presupuestos específicos de mes
- `categoria`: Buscar por categoría
- `esPlantilla`: Filtrar plantillas

**Ejemplo**:

```javascript
// Plantilla (se aplica a todos los meses)
{
    id: 1,
    mesAnioId: null,
    categoria: "Alimentación",
    monto: 200000,
    esPlantilla: true
}

// Presupuesto específico de un mes
{
    id: 2,
    mesAnioId: 1,
    categoria: "Alimentación",
    monto: 250000,
    esPlantilla: false
}
```

**Queries comunes**:

```javascript
// Presupuestos de un mes
const presups = await db.presupuestos
    .where('mesAnioId')
    .equals(mesId)
    .toArray();

// Plantillas (se aplican por defecto)
const plantillas = await db.presupuestos
    .where('esPlantilla')
    .equals(true)
    .toArray();

// Presupuesto de una categoría en un mes
const presup = await db.presupuestos
    .where(['mesAnioId', 'categoria'])
    .equals([mesId, 'Alimentación'])
    .first();
```

---

### 4. recurrentes

**Propósito**: Gastos mensuales predecibles

**Schema**:

```typescript
interface Recurrente {
    id: number;                // PK auto-incremental
    nombre: string;            // Nombre descriptivo
    categoria: string;         // Categoría
    perfilId: number;          // Quién paga
    montoEstimado: number;     // Monto aproximado mensual
    activa: boolean;           // ¿Está activa?
    ultimoMes?: string;        // Último mes procesado (YYYY-MM)
}
```

**Índices**:
- `++id`: Primary Key
- `categoria`: Agrupar por categoría
- `perfilId`: Filtrar por persona
- `activa`: Filtrar activas/inactivas
- `ultimoMes`: Control de procesamiento

**Ejemplo**:

```javascript
{
    id: 1,
    nombre: "Netflix Premium",
    categoria: "Entretención",
    perfilId: 1,
    montoEstimado: 14990,
    activa: true,
    ultimoMes: "2024-10"
}
```

**Queries comunes**:

```javascript
// Recurrentes activos
const activos = await db.recurrentes
    .where('activa')
    .equals(true)
    .toArray();

// Recurrentes de un perfil
const mis = await db.recurrentes
    .where(['perfilId', 'activa'])
    .equals([perfilId, true])
    .toArray();
```

---

### 5. historialRecurrentes

**Propósito**: Histórico de gastos recurrentes procesados

**Schema**:

```typescript
interface HistorialRecurrente {
    id: number;                // PK auto-incremental
    recurrenteId: number;      // FK → recurrentes.id
    mesAnio: string;           // YYYY-MM
    monto: number;             // Monto real cargado
    fecha: string;             // ISO 8601
}
```

**Queries comunes**:

```javascript
// Historial de un recurrente
const historial = await db.historialRecurrentes
    .where('recurrenteId')
    .equals(recurrenteId)
    .toArray();

// Recurrentes de un mes
const delMes = await db.historialRecurrentes
    .where('mesAnio')
    .equals('2024-10')
    .toArray();
```

---

### 6. comprasPlaneadas

**Propósito**: Simulador de compras futuras

**Schema**:

```typescript
interface CompraPlaneada {
    id: number;                // PK auto-incremental
    nombre: string;            // Descripción
    monto: number;             // Monto total
    cuotas: number;            // Cantidad de cuotas
    categoria: string;         // Categoría
    perfilId: number;          // Quién comprará
    fechaCreacion: string;     // ISO 8601
}
```

**Ejemplo**:

```javascript
{
    id: 1,
    nombre: "Notebook",
    monto: 1500000,
    cuotas: 12,
    categoria: "Tecnología",
    perfilId: 1,
    fechaCreacion: "2024-11-05T10:00:00Z"
}
```

---

### 7. liquidaciones

**Propósito**: Registro de pagos de balances

**Schema**:

```typescript
interface Liquidacion {
    id: number;                    // PK auto-incremental
    mesAnioId: number;             // FK → mesesCarga.id
    mesAnio: string;               // YYYY-MM (redundante para queries)
    deudorId: number;              // Quién debe
    acreedorId: number;            // A quién debe
    monto: number;                 // Monto a pagar
    fecha: string;                 // ISO 8601
    gastosIncluidos?: string;      // JSON con IDs de gastos
}
```

**Queries comunes**:

```javascript
// Liquidaciones de un mes
const liq = await db.liquidaciones
    .where('mesAnio')
    .equals('2024-10')
    .toArray();

// Deudas pendientes de una persona
const mis = await db.liquidaciones
    .where('deudorId')
    .equals(perfilId)
    .toArray();
```

---

### 8. ingresos

**Propósito**: Registro de ingresos mensuales

**Schema**:

```typescript
interface Ingreso {
    id: number;                // PK auto-incremental
    mesAnio: string;           // YYYY-MM
    perfilId: number;          // Quién recibió
    monto: number;             // Monto ingresado
    descripcion: string;       // Concepto
    fecha: string;             // ISO 8601
    esRecurrente: boolean;     // ¿Es ingreso fijo?
}
```

**Ejemplo**:

```javascript
{
    id: 1,
    mesAnio: "2024-10",
    perfilId: 1,
    monto: 1500000,
    descripcion: "Sueldo",
    fecha: "2024-10-05",
    esRecurrente: true
}
```

**Queries comunes**:

```javascript
// Ingresos de un mes
const ingresos = await db.ingresos
    .where('mesAnio')
    .equals('2024-10')
    .toArray();

// Total ingresado por un perfil en un mes
const total = await db.ingresos
    .where(['mesAnio', 'perfilId'])
    .equals(['2024-10', perfilId])
    .toArray()
    .then(ing => ing.reduce((sum, i) => sum + i.monto, 0));
```

---

### 9. reembolsos

**Propósito**: Seguimiento de gastos a reembolsar

**Schema**:

```typescript
interface Reembolso {
    id: number;                          // PK auto-incremental
    transaccionOrigenId: number;         // FK → transacciones.id
    nombreDeudor: string;                // Quién debe reembolsar
    estado: 'pendiente' | 'solicitado' | 'pagado';  // Estado
    tipoCompra: 'spot' | 'cuotas';       // Tipo de compra
    cuotasTotal?: number;                // Total de cuotas (si aplica)
    fechaCreacion: string;               // ISO 8601
    fechaSolicitud?: string;             // ISO 8601
    fechaPago?: string;                  // ISO 8601
    notas?: string;                      // Observaciones
}
```

**Estados**:
1. **pendiente**: Creado, no solicitado
2. **solicitado**: Reembolso pedido
3. **pagado**: Reembolso recibido

**Ejemplo**:

```javascript
{
    id: 5,
    transaccionOrigenId: 42,
    nombreDeudor: "Juan Pérez",
    estado: "solicitado",
    tipoCompra: "cuotas",
    cuotasTotal: 12,
    fechaCreacion: "2024-10-15T14:00:00Z",
    fechaSolicitud: "2024-10-20T10:00:00Z",
    fechaPago: null,
    notas: "Compra compartida notebook trabajo"
}
```

**Queries comunes**:

```javascript
// Todos los reembolsos
const todos = await db.reembolsos.toArray();

// Reembolsos pendientes
const pendientes = await db.reembolsos
    .where('estado')
    .equals('pendiente')
    .toArray();

// Reembolsos de un deudor
const deudor = await db.reembolsos
    .where('nombreDeudor')
    .equals('Juan Pérez')
    .toArray();

// Obtener transacción relacionada
const reembolso = await db.reembolsos.get(id);
const transaccion = await db.transacciones.get(reembolso.transaccionOrigenId);
```

---

## 🔗 Relaciones

### Diagrama ER

```
mesesCarga (1) ──────┬──────────> (*) transacciones
                     │
                     └──────────> (*) presupuestos
                     │
                     └──────────> (*) liquidaciones

transacciones (1) ──────────────> (0..1) reembolsos

recurrentes (1) ────────────────> (*) historialRecurrentes
```

### Joins Comunes

```javascript
// Transacciones de un mes con datos del mes
const transConMes = await db.transacciones
    .where('mesAnioId')
    .equals(mesId)
    .toArray();

const mes = await db.mesesCarga.get(mesId);

const resultado = transConMes.map(t => ({
    ...t,
    mesAnio: mes.mesAnio,
    fechaCargaMes: mes.fechaCarga
}));

// Reembolsos con transacción origen
const reembolsosCompletos = await db.reembolsos.toArray();

for (let reembolso of reembolsosCompletos) {
    reembolso.transaccion = await db.transacciones.get(
        reembolso.transaccionOrigenId
    );
}
```

---

## 📈 Índices

### ¿Por qué indexar?

```
Sin índice:
db.transacciones.where('categoria').equals('Alimentación')
→ O(n) - Escanea todas las transacciones

Con índice:
db.transacciones.where('categoria').equals('Alimentación')
→ O(log n) - Búsqueda binaria en índice
```

### Índices Compuestos

```javascript
// Índice compuesto: [mesAnioId+perfilId]
// Permite búsquedas eficientes de:
// - Transacciones de un mes y perfil específico

const trans = await db.transacciones
    .where('[mesAnioId+perfilId]')
    .equals([1, 2])
    .toArray();
```

---

## 🔧 Queries Comunes

### Dashboard Principal

```javascript
// Total gastado en el mes
const totalGastado = await db.transacciones
    .where('mesAnioId')
    .equals(mesId)
    .toArray()
    .then(trans => trans.reduce((sum, t) => sum + t.monto, 0));

// Gastos por categoría
const porCategoria = await db.transacciones
    .where('mesAnioId')
    .equals(mesId)
    .toArray()
    .then(trans => {
        const agrupado = {};
        trans.forEach(t => {
            agrupado[t.categoria] = (agrupado[t.categoria] || 0) + t.monto;
        });
        return agrupado;
    });

// Presupuestos vs Gastos
const presupuestos = await db.presupuestos
    .where('mesAnioId')
    .equals(mesId)
    .toArray();

const comparacion = presupuestos.map(p => ({
    categoria: p.categoria,
    presupuesto: p.monto,
    gastado: porCategoria[p.categoria] || 0,
    porcentaje: ((porCategoria[p.categoria] || 0) / p.monto * 100).toFixed(1)
}));
```

### Balance de Gastos Compartidos

```javascript
// Gastos compartidos por persona
const compartidos = await db.transacciones
    .where(['mesAnioId', 'esCompartido'])
    .equals([mesId, true])
    .toArray();

const porPersona = compartidos.reduce((acc, t) => {
    acc[t.perfilId] = (acc[t.perfilId] || 0) + t.monto;
    return acc;
}, {});

// Calcular balance
const total = Object.values(porPersona).reduce((sum, val) => sum + val, 0);
const promedio = total / Object.keys(porPersona).length;

const balances = Object.keys(porPersona).map(perfilId => ({
    perfilId,
    gastado: porPersona[perfilId],
    debe: promedio - porPersona[perfilId]
}));
```

### Proyección de Cuotas Futuras

```javascript
// Transacciones con cuotas pendientes
const conCuotas = await db.transacciones
    .where('mesAnioId')
    .equals(mesId)
    .filter(t => t.cuotasTotal && t.cuotaActual < t.cuotasTotal)
    .toArray();

// Proyectar meses futuros
const proyeccion = conCuotas.map(t => {
    const cuotasPendientes = t.cuotasTotal - t.cuotaActual;
    return {
        descripcion: t.descripcion,
        montoCuota: t.monto,
        cuotasPendientes,
        totalPendiente: t.monto * cuotasPendientes
    };
});
```

---

## 🔄 Migraciones

### Historial de Versiones

```javascript
// v1-v8: Desarrollo inicial
// v9: Agregar reembolsos

db.version(9).stores({
    // ... schemas
}).upgrade(tx => {
    // Agregar campos a transacciones existentes
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

### Crear Nueva Migración

```javascript
// Ejemplo: v10 - Agregar tags a transacciones

db.version(10).stores({
    transacciones: '++id, mesAnioId, perfilId, fecha, categoria, comercio, esCompartido, esReembolsable, reembolsoId, tags',
    // ... resto igual
}).upgrade(tx => {
    return tx.table('transacciones').toCollection().modify(transaccion => {
        if (transaccion.tags === undefined) {
            transaccion.tags = [];
        }
    });
});
```

---

## 💾 Backup y Restore

### Export

```javascript
// Exportar toda la DB a JSON
async function exportarDB() {
    const backup = {
        version: db.verno,
        mesesCarga: await db.mesesCarga.toArray(),
        transacciones: await db.transacciones.toArray(),
        presupuestos: await db.presupuestos.toArray(),
        recurrentes: await db.recurrentes.toArray(),
        historialRecurrentes: await db.historialRecurrentes.toArray(),
        comprasPlaneadas: await db.comprasPlaneadas.toArray(),
        liquidaciones: await db.liquidaciones.toArray(),
        ingresos: await db.ingresos.toArray(),
        reembolsos: await db.reembolsos.toArray()
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `finzi-backup-${new Date().toISOString()}.json`;
    a.click();
}
```

### Import

```javascript
// Importar desde JSON
async function importarDB(file) {
    const text = await file.text();
    const backup = JSON.parse(text);

    // Limpiar DB actual
    await db.delete();
    await db.open();

    // Restaurar datos
    await db.mesesCarga.bulkAdd(backup.mesesCarga);
    await db.transacciones.bulkAdd(backup.transacciones);
    await db.presupuestos.bulkAdd(backup.presupuestos);
    await db.recurrentes.bulkAdd(backup.recurrentes);
    await db.historialRecurrentes.bulkAdd(backup.historialRecurrentes);
    await db.comprasPlaneadas.bulkAdd(backup.comprasPlaneadas);
    await db.liquidaciones.bulkAdd(backup.liquidaciones);
    await db.ingresos.bulkAdd(backup.ingresos);
    await db.reembolsos.bulkAdd(backup.reembolsos);

    console.log('✅ Base de datos restaurada');
}
```

---

## 🧹 Mantenimiento

### Limpiar Datos Antiguos

```javascript
// Eliminar meses más antiguos que X meses
async function limpiarMesesAntiguos(mesesAMantener = 12) {
    const meses = await db.mesesCarga
        .orderBy('fechaCarga')
        .reverse()
        .toArray();

    const aEliminar = meses.slice(mesesAMantener);

    for (const mes of aEliminar) {
        // Eliminar transacciones
        await db.transacciones.where('mesAnioId').equals(mes.id).delete();

        // Eliminar presupuestos
        await db.presupuestos.where('mesAnioId').equals(mes.id).delete();

        // Eliminar mes
        await db.mesesCarga.delete(mes.id);
    }

    console.log(`🗑️ ${aEliminar.length} meses eliminados`);
}
```

### Verificar Integridad

```javascript
// Verificar que todas las transacciones tienen un mes válido
async function verificarIntegridad() {
    const transacciones = await db.transacciones.toArray();
    const mesesIds = new Set(
        (await db.mesesCarga.toArray()).map(m => m.id)
    );

    const huerfanas = transacciones.filter(t => !mesesIds.has(t.mesAnioId));

    if (huerfanas.length > 0) {
        console.warn(`⚠️ ${huerfanas.length} transacciones sin mes asociado`);
        return false;
    }

    console.log('✅ Integridad verificada');
    return true;
}
```

---

*Documento actualizado: Noviembre 2025*
*Versión DB: 9*
