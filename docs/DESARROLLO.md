# 👨‍💻 Guía de Desarrollo - Finzi v3.2

Guía completa para desarrolladores que quieran contribuir o extender Finzi.

---

## 📑 Índice

- [Setup del Entorno](#setup-del-entorno)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Agregar Nueva Funcionalidad](#agregar-nueva-funcionalidad)
- [Testing](#testing)
- [Debugging](#debugging)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 🛠️ Setup del Entorno

### Requisitos

```bash
# Node.js (solo para build)
node --version  # v14+

# Editor recomendado
Visual Studio Code
```

### Extensiones VS Code Recomendadas

```json
{
    "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "dsznajder.es7-react-js-snippets"
    ]
}
```

### Clonar y Configurar

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/finzi-app.git
cd finzi-app

# 2. No requiere npm install
# Todo se carga desde CDN

# 3. Abrir en editor
code .

# 4. Servidor local (opcional)
# Python
python -m http.server 8000

# PHP
php -S localhost:8000

# Node (http-server)
npx http-server -p 8000

# Acceder a http://localhost:8000
```

---

## 📁 Estructura del Proyecto

### Arquitectura de Carpetas

```
finzi-app/
├── src/                    # Código fuente (modular)
│   ├── app.html           # Template principal
│   ├── assets/            # Recursos estáticos
│   ├── constants/         # Configuración
│   ├── utils/             # Lógica de negocio
│   └── components/        # Componentes React
│       ├── shared/        # Reutilizables
│       └── [páginas]/     # Vistas específicas
├── scripts/
│   └── build.js           # Script de compilación
├── deploy/                # Versión producción
├── docs/                  # Documentación
├── index.html             # Build generado
└── README.md
```

### Convenciones de Nombres

```
Archivos:
- Componentes: PascalCase.jsx (Home.jsx)
- Utils: camelCase.js (csvParser.js)
- Constantes: camelCase.js (categories.js)

Variables:
- Componentes: PascalCase (Modal, Card)
- Funciones: camelCase (procesarCSV, formatearMonto)
- Constantes: UPPER_SNAKE_CASE (DEFAULT_CATEGORIES)

Funciones globales:
- window.nombreFuncion (expuestas globalmente)
```

---

## 🔄 Flujo de Trabajo

### Desarrollo Normal

```bash
# 1. Crear rama
git checkout -b feature/nueva-funcionalidad

# 2. Editar archivos en src/
# Por ejemplo: src/components/MiComponente.jsx

# 3. Recompilar (genera index.html)
node scripts/build.js

# 4. Probar en navegador
open index.html

# 5. Iterar (editar → recompilar → probar)

# 6. Commit
git add .
git commit -m "feat: agregar nueva funcionalidad"

# 7. Push
git push origin feature/nueva-funcionalidad
```

### Hot Reload (Opcional)

**No hay hot reload nativo**, pero puedes usar:

```bash
# Opción 1: Live Server (VS Code)
# Instalar extensión "Live Server"
# Click derecho en index.html → "Open with Live Server"

# Opción 2: Browser Sync
npx browser-sync start --server --files "src/**/*" --watch

# Opción 3: Nodemon + build
npx nodemon --watch src --exec "node scripts/build.js"
```

---

## ➕ Agregar Nueva Funcionalidad

### Ejemplo: Agregar Nueva Página

#### 1. Crear Componente

```javascript
// src/components/MiNuevaPagina.jsx

const MiNuevaPagina = () => {
    const { perfiles, categorias } = useApp();
    const [datos, setDatos] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        // Lógica de carga
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">Mi Nueva Página</h1>
            {/* Contenido */}
        </div>
    );
};
```

#### 2. Agregar a build.js

```javascript
// scripts/build.js

const archivos = [
    // ... archivos existentes
    { path: 'components/MiNuevaPagina.jsx', marker: '/* INJECT:components/MiNuevaPagina.jsx */' }
];
```

#### 3. Agregar marker en app.html

```html
<!-- src/app.html -->

<script type="text/babel">
    /* INJECT:components/MiNuevaPagina.jsx */
</script>
```

#### 4. Agregar ruta en Sidebar.jsx

```javascript
// src/components/Sidebar.jsx

const menuItems = [
    // ... items existentes
    {
        id: 'miNuevaPagina',
        icon: '🆕',
        label: 'Mi Página',
        description: 'Nueva funcionalidad'
    }
];
```

#### 5. Agregar en App.jsx

```html
<!-- src/app.html (dentro del componente App) -->

{currentPage === 'miNuevaPagina' && <MiNuevaPagina />}
```

#### 6. Compilar y Probar

```bash
node scripts/build.js
open index.html
```

---

### Ejemplo: Agregar Nueva Utilidad

#### 1. Crear archivo

```javascript
// src/utils/miUtilidad.js

/**
 * Descripción de la utilidad
 * @param {Object} datos - Parámetros
 * @returns {Array} Resultado
 */
window.miNuevaFuncion = function(datos) {
    // Lógica
    return resultado;
};
```

#### 2. Agregar a build.js

```javascript
const archivos = [
    // ...
    { path: 'utils/miUtilidad.js', marker: '/* INJECT:utils/miUtilidad.js */' }
];
```

#### 3. Agregar marker en app.html

```html
<script>
    /* INJECT:utils/miUtilidad.js */
</script>
```

#### 4. Usar en componentes

```javascript
// Cualquier componente
const resultado = window.miNuevaFuncion(datos);
```

---

### Ejemplo: Agregar Campo a Base de Datos

#### 1. Actualizar versión en db.js

```javascript
// src/utils/db.js

// Incrementar versión
db.version(10).stores({
    transacciones: '++id, mesAnioId, perfilId, fecha, categoria, comercio, esCompartido, esReembolsable, reembolsoId, nuevoNuevoCampo'
    // ... resto igual
}).upgrade(tx => {
    // Migración: agregar campo a registros existentes
    return tx.table('transacciones').toCollection().modify(transaccion => {
        if (transaccion.nuevoCampo === undefined) {
            transaccion.nuevoCampo = valorPorDefecto;
        }
    });
});
```

#### 2. Actualizar reset-completo.html

```javascript
// reset-completo.html

db.version(10).stores({
    // ... mismo schema
});
```

#### 3. Actualizar funciones CRUD

```javascript
// src/utils/db.js

window.addTransaccion = async function(transaccion) {
    return await db.transacciones.add({
        ...transaccion,
        nuevoCampo: transaccion.nuevoCampo || valorPorDefecto
    });
};
```

---

## 🧪 Testing

### Testing Manual

```bash
# Checklist de funcionalidades

✅ Importar CSV
    - CSV válido
    - CSV con errores
    - CSV duplicado
    - CSV con cuotas 0/X

✅ Editar transacción
    - Cambiar categoría
    - Cambiar comercio (verificar aprendizaje)
    - Cambiar descripción en cuotas (verificar aprendizaje)
    - Cambiar monto

✅ Presupuestos
    - Crear presupuesto
    - Editar presupuesto
    - Eliminar presupuesto
    - Verificar alertas (verde/amarillo/rojo)

✅ Reembolsos
    - Crear reembolso spot
    - Crear reembolso con cuotas
    - Cambiar estado (pendiente → solicitado → pagado)
    - Verificar cálculo de monto total

✅ Dark Mode
    - Toggle modo oscuro
    - Persistencia al recargar
    - Todos los componentes adaptan

✅ PWA
    - Instalar app
    - Funcionar offline
    - Service Worker cachea correctamente
```

### Testing con Datos de Prueba

```javascript
// Crear archivo: test-data.js

// CSV de prueba
const csvPrueba = `fecha;descripcion;monto;cuotas
15/10/2024;UBER EATS;15000;
20/10/2024;AMAZON CUOTA 3/12;8500;3/12
22/10/2024;NETFLIX;12990;
25/10/2024;SUPERMERCADO;45000;`;

// Ejecutar en consola
console.log('Probando importación...');
window.procesarCSV(new File([csvPrueba], 'test.csv'));
```

### Debugging con Chrome DevTools

```javascript
// Inspeccionar IndexedDB
// Chrome DevTools → Application → Storage → IndexedDB

// Ver localStorage
console.log('Perfiles:', JSON.parse(localStorage.getItem('perfiles')));
console.log('Patrones:', JSON.parse(localStorage.getItem('patronesAprendidos')));

// Ver Service Worker
// Chrome DevTools → Application → Service Workers

// Performance
// Chrome DevTools → Performance → Record
```

---

## 🐛 Debugging

### Errores Comunes

#### 1. "db is not defined"

**Causa**: El archivo db.js no se cargó antes que otros archivos.

**Solución**: Verificar orden en build.js

```javascript
// db.js debe estar ANTES de archivos que lo usan
const archivos = [
    { path: 'utils/db.js', ... },         // ✅ Primero
    { path: 'utils/csvParser.js', ... },  // ✅ Después (usa db)
];
```

#### 2. Componente no se renderiza

**Debugging**:

```javascript
// Agregar logs
const MiComponente = () => {
    console.log('MiComponente renderizado');

    useEffect(() => {
        console.log('MiComponente montado');
    }, []);

    // ...
};
```

#### 3. IndexedDB bloqueada

**Causa**: Otra pestaña tiene la DB abierta con versión antigua.

**Solución**:

```bash
# Cerrar todas las pestañas de la app
# O forzar actualización:
# Chrome DevTools → Application → Clear storage → Clear site data
```

#### 4. Service Worker desactualizado

**Síntoma**: Cambios no se reflejan después de actualizar.

**Solución**:

```bash
# Chrome DevTools → Application → Service Workers
# Click en "Unregister"
# Recargar página (Cmd+Shift+R / Ctrl+Shift+R)
```

---

## 📝 Best Practices

### Código

```javascript
// ✅ BUENO: Función pura
const calcularTotal = (transacciones) => {
    return transacciones.reduce((sum, t) => sum + t.monto, 0);
};

// ❌ MALO: Mutación directa
const agregarTransaccion = (lista, nueva) => {
    lista.push(nueva);  // Mutación
    return lista;
};

// ✅ BUENO: Inmutabilidad
const agregarTransaccion = (lista, nueva) => {
    return [...lista, nueva];
};
```

### React

```javascript
// ✅ BUENO: Dependencias correctas
useEffect(() => {
    cargarDatos(mesId);
}, [mesId]);  // Re-ejecuta si mesId cambia

// ❌ MALO: Dependencias faltantes
useEffect(() => {
    cargarDatos(mesId);
}, []);  // mesId no está en dependencias

// ✅ BUENO: Cleanup
useEffect(() => {
    const timer = setInterval(() => { ... }, 1000);
    return () => clearInterval(timer);  // Limpieza
}, []);
```

### Base de Datos

```javascript
// ✅ BUENO: Transacción atómica
await db.transaction('rw', db.transacciones, db.reembolsos, async () => {
    await db.transacciones.update(id, { esReembolsable: true });
    await db.reembolsos.add({ transaccionOrigenId: id });
});

// ❌ MALO: Operaciones separadas (pueden fallar inconsistentemente)
await db.transacciones.update(id, { esReembolsable: true });
await db.reembolsos.add({ transaccionOrigenId: id });
```

### Performance

```javascript
// ✅ BUENO: Memo para cálculos costosos
const transaccionesFiltradas = useMemo(() => {
    return transacciones.filter(t => t.categoria === cat);
}, [transacciones, cat]);

// ❌ MALO: Recalcula en cada render
const transaccionesFiltradas = transacciones.filter(t => t.categoria === cat);
```

---

## 🎨 Estilo y Diseño

### TailwindCSS

```javascript
// Clases comunes

// Cards
className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg"

// Botones
className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"

// Input
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"

// Grid responsivo
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
```

### Dark Mode

```javascript
// Siempre agregar variant dark:
className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white"

// Probar ambos modos
// Toggle en sidebar
```

---

## 🚀 Build y Deploy

### Build Local

```bash
# Desarrollo
node scripts/build.js

# Verificar tamaño
ls -lh index.html

# Verificar que todo compile
echo $?  # Debe ser 0
```

### Deploy

```bash
# 1. Build
node scripts/build.js

# 2. Copiar a deploy
cp index.html deploy/

# 3. Actualizar versión en service-worker.js
# deploy/service-worker.js
# const CACHE_NAME = 'gastos-tc-v3.2.1';  # Incrementar

# 4. Commit y push
cd deploy
git add .
git commit -m "Update v3.2.1"
git push
```

---

## 🆘 Troubleshooting

### Problema: Build falla

```bash
# Verificar Node.js
node --version

# Verificar que todos los archivos existan
ls -la src/components/
ls -la src/utils/

# Ver errores detallados
node scripts/build.js 2>&1 | tee build.log
```

### Problema: Transacciones no se guardan

```javascript
// Verificar schema de DB
console.log(db.tables.map(t => t.name));

// Verificar que addTransaccion existe
console.log(typeof window.addTransaccion);

// Probar manualmente
window.addTransaccion({
    mesAnioId: 1,
    perfilId: 1,
    fecha: '2024-10-15',
    descripcion: 'Test',
    comercio: 'Test',
    categoria: 'Otros',
    monto: 1000,
    esCompartido: false,
    esReembolsable: false
}).then(id => console.log('ID creado:', id));
```

### Problema: PWA no instala

```bash
# Verificar requisitos
1. ¿Servido en HTTPS o localhost?
2. ¿Existe manifest.json?
3. ¿Service Worker registrado?

# Chrome DevTools → Lighthouse
# Run "PWA" audit
# Revisar errores
```

---

## 📚 Recursos

### Documentación

- [React Hooks](https://react.dev/reference/react)
- [Dexie.js API](https://dexie.org/docs/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Chart.js Guide](https://www.chartjs.org/docs/)

### Herramientas

- [React DevTools](https://chrome.google.com/webstore/detail/react-developer-tools)
- [Redux DevTools](https://chrome.google.com/webstore/detail/redux-devtools) (para Context debugging)
- [Dexie Cloud Studio](https://dexie.org/cloud/studio) (para inspeccionar DB)

---

## 🤝 Contribuir

### Proceso

1. Fork del repositorio
2. Crear rama (`git checkout -b feature/amazing`)
3. Desarrollar y testear
4. Commit (`git commit -m 'feat: add amazing'`)
5. Push (`git push origin feature/amazing`)
6. Abrir Pull Request

### Commit Messages

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: formato (no afecta código)
refactor: refactorización
test: agregar tests
chore: tareas de mantenimiento
```

---

*Guía actualizada: Noviembre 2025*
*Versión: 3.2*
