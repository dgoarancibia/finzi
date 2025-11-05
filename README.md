# 💳 Finzi - Analizador de Gastos de Tarjeta de Crédito

![Version](https://img.shields.io/badge/version-3.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18-61dafb)
![PWA](https://img.shields.io/badge/PWA-Ready-purple)

**Finzi** es una aplicación web progresiva (PWA) diseñada para analizar, categorizar y gestionar gastos de tarjetas de crédito de forma inteligente, con soporte para múltiples perfiles, presupuestos dinámicos, proyecciones financieras y sistema de reembolsos.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Demo y Capturas](#-demo-y-capturas)
- [Tecnologías](#-tecnologías)
- [Instalación y Uso](#-instalación-y-uso)
- [Arquitectura del Proyecto](#-arquitectura-del-proyecto)
- [Funcionalidades Detalladas](#-funcionalidades-detalladas)
- [Base de Datos](#-base-de-datos)
- [Sistema de Build](#-sistema-de-build)
- [Deploy](#-deploy)
- [Roadmap](#-roadmap)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características Principales

### 🎯 Core Features

- **📊 Análisis de Gastos**: Importa archivos CSV de tu tarjeta de crédito y obtén análisis detallados automáticamente
- **🤖 Categorización Inteligente**: Sistema de aprendizaje automático que recuerda tus preferencias
- **👥 Múltiples Perfiles**: Gestiona gastos de diferentes personas (pareja, familia, roommates)
- **💰 Gestión de Presupuestos**: Define presupuestos por categoría con alertas inteligentes
- **📈 Proyecciones Financieras**: Visualiza tendencias y proyecta gastos futuros
- **💸 Sistema de Reembolsos**: Rastrea gastos a reembolsar con soporte para cuotas
- **🔄 Gastos Recurrentes**: Identifica y gestiona suscripciones y gastos mensuales
- **⚖️ Balance y Liquidación**: Calcula automáticamente quién debe a quién en gastos compartidos

### 🎨 Experiencia de Usuario

- **🌓 Modo Oscuro/Claro**: Interfaz adaptable con persistencia de preferencias
- **📱 PWA (Progressive Web App)**: Instálala como app nativa en cualquier dispositivo
- **⚡ Funciona Offline**: Service Worker para funcionamiento sin conexión
- **🎨 Diseño Minimalista**: Interfaz limpia y moderna con TailwindCSS
- **📊 Visualizaciones Interactivas**: Gráficos dinámicos con Chart.js

### 🧠 Inteligencia Artificial

- **🏪 Aprendizaje de Comercios**: Normaliza nombres de comercios automáticamente
- **📝 Aprendizaje de Descripciones**: Recuerda descripciones personalizadas para compras en cuotas
- **🔍 Detección de Patrones**: Identifica cuotas, gastos compartidos y reembolsables
- **⚠️ Filtrado Inteligente**: Excluye automáticamente cuotas 0/X que no se cobran

---

## 🖼️ Demo y Capturas

### Vista Principal (Dashboard)
```
┌─────────────────────────────────────────────────┐
│  🏠 Home                                         │
│  ┌──────────────┬──────────────┬─────────────┐ │
│  │ Total Gastos │ Presupuesto  │ Balance     │ │
│  │  $450.000   │   $500.000   │  +$50.000   │ │
│  └──────────────┴──────────────┴─────────────┘ │
│                                                  │
│  📊 Gráfico de Gastos por Categoría             │
│  🍔 Alimentación  ████████░░  80%               │
│  🚗 Transporte    ███████░░░  70%               │
│  🎬 Entretención  ████░░░░░░  40%               │
└─────────────────────────────────────────────────┘
```

### Modo Oscuro
```
🌙 Modo Oscuro Activado
- Fondo: #0f172a
- Sidebar: #1e293b
- Cards: #334155
- Texto: #f1f5f9
```

---

## 🛠️ Tecnologías

### Frontend
- **React 18** - Framework UI con Hooks
- **TailwindCSS 3** - Framework CSS utility-first
- **Chart.js 4** - Visualización de datos
- **Babel Standalone** - Transpilación JSX en el navegador

### Base de Datos
- **Dexie.js 3.2.4** - Wrapper de IndexedDB (v9)
- **LocalStorage** - Persistencia de preferencias y aprendizaje

### Procesamiento de Datos
- **PapaParse 5.4.1** - Parser de archivos CSV

### PWA
- **Service Worker** - Cache y funcionamiento offline
- **Web App Manifest** - Instalación como app nativa

### Build System
- **Node.js** - Script de compilación personalizado
- **Single File Architecture** - Todo en un único index.html

---

## 🚀 Instalación y Uso

### Requisitos Previos
- Node.js 14+ (solo para desarrollo)
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Instalación para Desarrollo

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/finzi-app.git
cd finzi-app

# No requiere npm install (sin dependencias)
# Todo se carga desde CDN

# Abrir en modo desarrollo
open index.html
# O usar un servidor local
python -m http.server 8000
```

### Build para Producción

```bash
# Compilar la aplicación
node scripts/build.js

# El archivo index.html será generado en la raíz
# Listo para desplegar
```

### Uso Básico

1. **Importar CSV**:
   - Ve a "Home"
   - Click en "Cargar CSV"
   - Selecciona el archivo de tu banco
   - La app categorizará automáticamente

2. **Configurar Perfiles**:
   - Ve a "Perfiles"
   - Agrega personas (Ej: Diego, Esposa)
   - Asigna colores para identificación visual

3. **Definir Presupuestos**:
   - Ve a "Presupuestos"
   - Define montos por categoría
   - Los presupuestos se guardan como plantilla

4. **Analizar Gastos**:
   - Ve a "Análisis Cierre"
   - Revisa proyecciones y tendencias
   - Identifica gastos inusuales

---

## 📁 Arquitectura del Proyecto

### Estructura de Carpetas

```
finzi-app/
├── src/                          # Código fuente modular
│   ├── app.html                 # Template base HTML
│   ├── assets/                  # Recursos estáticos
│   │   ├── logo.svg            # Logo Finzi completo
│   │   ├── icon-192.svg        # Icono PWA 192x192
│   │   └── icon-512.svg        # Icono PWA 512x512
│   ├── constants/              # Constantes y configuración
│   │   ├── categories.js       # Categorías por defecto
│   │   └── patterns.js         # Patrones de detección
│   ├── utils/                  # Utilidades y helpers
│   │   ├── db.js              # Configuración Dexie/IndexedDB
│   │   ├── formatters.js      # Formateo de montos/fechas
│   │   ├── csvParser.js       # Parser CSV inteligente
│   │   ├── categorizer.js     # Motor de categorización
│   │   ├── budgetCalculator.js # Cálculo de presupuestos
│   │   └── projections.js     # Proyecciones financieras
│   └── components/             # Componentes React
│       ├── shared/            # Componentes reutilizables
│       │   ├── Modal.jsx
│       │   ├── Card.jsx
│       │   ├── ProgressBar.jsx
│       │   ├── AlertBadge.jsx
│       │   └── CollapsibleSection.jsx
│       ├── Sidebar.jsx        # Navegación principal
│       ├── Home.jsx           # Dashboard principal
│       ├── AnalisisCierre.jsx # Análisis y proyecciones
│       ├── HistorialMeses.jsx # Gestión de meses
│       ├── Balance.jsx        # Liquidación de deudas
│       ├── Perfiles.jsx       # Gestión de usuarios
│       ├── Categorias.jsx     # Gestión de categorías
│       ├── Presupuestos.jsx   # Configuración de presupuestos
│       ├── CuotasFuturas.jsx  # Proyección de cuotas
│       ├── Recurrentes.jsx    # Gastos recurrentes
│       ├── Simulador.jsx      # Simulador de compras
│       ├── Ingresos.jsx       # Registro de ingresos
│       ├── Reembolsos.jsx     # Sistema de reembolsos
│       └── Proyecciones.jsx   # Metas de ahorro
├── scripts/
│   └── build.js               # Script de compilación
├── deploy/                     # Versión para producción
│   ├── index.html             # App compilada
│   ├── manifest.json          # PWA manifest
│   ├── service-worker.js      # Service Worker
│   ├── reset-completo.html    # Utilidad de reset
│   └── README.md              # Guía de deploy
├── index.html                  # Build generado (root)
├── reset-completo.html         # Utilidad de limpieza
└── README.md                   # Este archivo
```

### Flujo de Datos

```
CSV File
   ↓
PapaParse
   ↓
csvParser.js (Normalización + Detección)
   ↓
categorizer.js (Categorización Inteligente)
   ↓
Dexie.js → IndexedDB
   ↓
React Components (Visualización)
   ↓
Chart.js (Gráficos)
```

### Arquitectura de Componentes

```
App (Context Provider)
├── Sidebar (Navegación)
└── Main Content
    ├── Home (Dashboard)
    │   ├── MonthSelector
    │   ├── StatsCards
    │   ├── CategoryBreakdown
    │   └── TransactionList
    ├── AnalisisCierre (Proyecciones)
    ├── HistorialMeses (CRUD Meses)
    ├── Balance (Liquidaciones)
    ├── Perfiles (CRUD Perfiles)
    ├── Categorias (CRUD Categorías)
    ├── Presupuestos (Configuración)
    ├── CuotasFuturas (Calendario)
    ├── Recurrentes (Gestión)
    ├── Simulador (Calculadora)
    ├── Ingresos (Registro)
    ├── Reembolsos (Tracking)
    └── Proyecciones (Metas)
```

---

## 🎯 Funcionalidades Detalladas

### 1. Sistema de Importación CSV

**Formato soportado**:
```csv
fecha;descripcion;monto;cuotas
15/10/2024;UBER EATS;15000;
20/10/2024;COMPRA AMAZON CUOTA 3/12;8500;3/12
```

**Procesamiento**:
1. **Detección de cuotas**: Identifica patrones como "3/12", "CUOTA 3 DE 12"
2. **Filtrado inteligente**: Excluye cuotas 0/X automáticamente
3. **Normalización de comercios**: Limpia nombres (ej: "UBER * EATS" → "Uber Eats")
4. **Categorización automática**: Asigna categoría según patrones aprendidos
5. **Detección de duplicados**: Evita importar el mismo mes dos veces

### 2. Sistema de Aprendizaje Automático

#### Aprendizaje de Comercios
```javascript
// Ejemplo de aprendizaje
CSV dice: "UBER * EATS CHILE"
Usuario edita a: "Uber Eats"
↓
Próxima importación:
"UBER * EATS CHILE" → "Uber Eats" ✅ (aplica automáticamente)
```

**Almacenamiento**: `localStorage.patronesAprendidos.comercios`

#### Aprendizaje de Descripciones (Solo para cuotas)
```javascript
// Ejemplo de aprendizaje
Comercio: "Amazon"
Cuotas: 12
Descripción original: "COMPRA AMAZON"
Usuario edita a: "Notebook Dell XPS"
↓
Próximas cuotas de la misma compra:
"Amazon + 12 cuotas" → "Notebook Dell XPS" ✅
Otras compras Amazon → NO aplica ❌ (solo misma serie de cuotas)
```

**Clave única**: `${comercio}_${totalCuotas}cuotas`

### 3. Gestión de Presupuestos

**Tipos de presupuesto**:
- **Por mes**: Presupuesto específico para un mes
- **Plantilla**: Se aplica automáticamente a meses nuevos

**Cálculo de alertas**:
```javascript
Gasto actual: $450.000
Presupuesto: $500.000
Utilización: 90%
↓
🟢 Verde: 0-70%
🟡 Amarillo: 70-90%
🔴 Rojo: 90-100%
⚫ Sobrepasado: >100%
```

### 4. Sistema de Reembolsos

**Estados del reembolso**:
1. **Pendiente** (🟡): Creado, no solicitado
2. **Solicitado** (🔵): Ya pediste el reembolso
3. **Pagado** (🟢): Reembolso recibido

**Tipos de compra**:
- **Spot**: Compra única (monto completo)
- **Cuotas**: Compra en cuotas (monto × cuotas)

**Cálculo inteligente**:
```javascript
// Spot
Transacción: $50.000
Total a reembolsar: $50.000

// Cuotas
Transacción: $10.000 (cuota 3/12)
Total a reembolsar: $10.000 × 12 = $120.000
```

### 5. Balance y Liquidación

**Algoritmo de liquidación**:
```
1. Calcular gastos compartidos por persona
2. Determinar gasto promedio
3. Calcular diferencias
4. Generar liquidaciones optimizadas
```

**Ejemplo**:
```
Diego gastó: $300.000 (compartidos)
Esposa gastó: $200.000 (compartidos)
Total compartido: $500.000
Promedio por persona: $250.000
↓
Esposa debe a Diego: $50.000
```

### 6. Proyecciones Financieras

**Metas de ahorro**:
- Define monto objetivo y plazo
- Calcula cuánto ahorrar mensualmente
- Proyecta fecha de cumplimiento
- Visualiza progreso con gráficos

**Tipos de metas**:
- Ahorro (ej: Fondo de emergencia)
- Compra específica (ej: Viaje, Auto)
- Pago de deuda

### 7. Gastos Recurrentes

**Detección automática**:
- Identifica gastos que se repiten mensualmente
- Sugiere crear recurrente
- Proyecta en meses futuros

**Ejemplos típicos**:
- Netflix, Spotify, gimnasio
- Cuenta de luz, agua, gas
- Arriendo, condominio

---

## 🗄️ Base de Datos

### Esquema IndexedDB (Dexie v9)

```javascript
db.version(9).stores({
    // Meses cargados
    mesesCarga: '++id, mesAnio, fechaCarga',

    // Transacciones
    transacciones: '++id, mesAnioId, perfilId, fecha, categoria, comercio, esCompartido, esReembolsable, reembolsoId',

    // Presupuestos
    presupuestos: '++id, mesAnioId, categoria, monto, esPlantilla',

    // Gastos recurrentes
    recurrentes: '++id, nombre, categoria, perfilId, montoEstimado, activa, ultimoMes',

    // Historial de recurrentes
    historialRecurrentes: '++id, recurrenteId, mesAnio, monto, fecha',

    // Compras planeadas
    comprasPlaneadas: '++id, nombre, monto, cuotas, categoria, perfilId, fechaCreacion',

    // Liquidaciones
    liquidaciones: '++id, mesAnioId, mesAnio, deudorId, acreedorId, monto, fecha, gastosIncluidos',

    // Ingresos
    ingresos: '++id, mesAnio, perfilId, monto, descripcion, fecha, esRecurrente',

    // Reembolsos
    reembolsos: '++id, transaccionOrigenId, nombreDeudor, estado, tipoCompra, cuotasTotal, fechaCreacion, fechaSolicitud, fechaPago'
});
```

### Modelo de Datos Detallado

#### Transacción
```typescript
interface Transaccion {
    id: number;                    // Auto-incremental
    mesAnioId: number;            // FK a mesesCarga
    perfilId: number;             // ID del perfil
    fecha: string;                // ISO 8601
    descripcion: string;          // Descripción del gasto
    comercio: string;             // Nombre del comercio normalizado
    categoria: string;            // Categoría asignada
    monto: number;                // Monto en pesos
    cuotaActual?: number;         // Cuota actual (ej: 3)
    cuotasTotal?: number;         // Total de cuotas (ej: 12)
    esCompartido: boolean;        // ¿Gasto compartido?
    esReembolsable: boolean;      // ¿Será reembolsado?
    reembolsoId?: number;         // FK a reembolsos
}
```

#### Mes Carga
```typescript
interface MesCarga {
    id: number;
    mesAnio: string;              // Formato: "YYYY-MM"
    fechaCarga: string;           // ISO 8601
    archivoNombre: string;        // Nombre del CSV
    totalTransacciones: number;   // Cantidad de transacciones
}
```

#### Reembolso
```typescript
interface Reembolso {
    id: number;
    transaccionOrigenId: number;  // FK a transacciones
    nombreDeudor: string;         // Quién debe reembolsar
    estado: 'pendiente' | 'solicitado' | 'pagado';
    tipoCompra: 'spot' | 'cuotas';
    cuotasTotal?: number;         // Si es cuotas
    fechaCreacion: string;        // ISO 8601
    fechaSolicitud?: string;      // ISO 8601
    fechaPago?: string;           // ISO 8601
    notas?: string;               // Notas adicionales
}
```

### LocalStorage

```javascript
{
    "perfiles": [
        {
            "id": 1,
            "nombre": "Diego",
            "color": "#6366f1",
            "activo": true
        }
    ],
    "categorias": [
        {
            "nombre": "Alimentación",
            "emoji": "🍔",
            "color": "#ef4444"
        }
    ],
    "patronesAprendidos": {
        "comercios": {
            "uber * eats": "Uber Eats",
            "mercado libre": "MercadoLibre"
        },
        "descripciones": {
            "amazon_12cuotas": "Notebook Dell XPS",
            "falabella_6cuotas": "Colchón King"
        }
    },
    "darkMode": "true"
}
```

---

## ⚙️ Sistema de Build

### Script de Compilación

El proyecto usa un sistema de build personalizado que:

1. **Lee el template** base (`src/app.html`)
2. **Inyecta archivos** modulares en markers específicos
3. **Genera un único** `index.html` listo para producción

**Ejemplo de marker**:
```html
<!-- src/app.html -->
<script>
    /* INJECT:utils/db.js */
</script>

<!-- Se reemplaza con el contenido de src/utils/db.js -->
<script>
    window.db = new Dexie('GastosTCDatabase');
    // ... código completo
</script>
```

### Ventajas del Single-File

- ✅ **No requiere bundler** (Webpack, Vite, etc.)
- ✅ **Fácil de desplegar** (solo un archivo)
- ✅ **Funciona en cualquier hosting** estático
- ✅ **No requiere npm install** para usuarios finales

### Ejecutar Build

```bash
# Desde la raíz del proyecto
node scripts/build.js

# Output
✨ Build completado exitosamente!
📦 Archivo generado: index.html (0.39 MB)
```

---

## 🚀 Deploy

### GitHub Pages (Recomendado)

```bash
# 1. Crear repositorio en GitHub
# 2. Ir a la carpeta deploy
cd deploy

# 3. Inicializar git
git init
git add .
git commit -m "Deploy inicial Finzi v3.2"

# 4. Conectar con GitHub
git branch -M main
git remote add origin https://github.com/TU-USUARIO/finzi-app.git
git push -u origin main

# 5. Activar GitHub Pages
# Ir a Settings → Pages
# Source: main branch / root
```

Tu app estará disponible en:
`https://TU-USUARIO.github.io/finzi-app`

### Netlify (Drag & Drop)

1. Ve a https://app.netlify.com/drop
2. Arrastra la carpeta `deploy`
3. ¡Listo! URL: `https://random-name.netlify.app`

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd deploy
vercel

# Producción
vercel --prod
```

### Actualizar Versión Desplegada

```bash
# 1. Hacer cambios en src/
# 2. Recompilar
node scripts/build.js

# 3. Copiar a deploy
cp index.html deploy/

# 4. Subir cambios
cd deploy
git add .
git commit -m "Update v3.2.1"
git push
```

---

## 🗺️ Roadmap

### v3.3 (Próxima versión)
- [ ] Sincronización con Firebase/Supabase
- [ ] Multi-dispositivo en tiempo real
- [ ] Autenticación con Google Sign-In
- [ ] Export/Import de datos (JSON backup)

### v3.4
- [ ] Reportes PDF
- [ ] Comparación año vs año
- [ ] Notificaciones push (vencimientos)
- [ ] Widget de resumen mensual

### v3.5
- [ ] Integración con APIs bancarias
- [ ] Importación automática de movimientos
- [ ] OCR para tickets/boletas
- [ ] Análisis predictivo con ML

### Futuro
- [ ] App nativa (React Native)
- [ ] Dashboard colaborativo
- [ ] Asesor financiero IA
- [ ] Marketplace de plantillas

---

## 🤝 Contribuir

¿Quieres mejorar Finzi? ¡Genial!

### Cómo contribuir

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. **Desarrolla** tu mejora
4. **Prueba** que todo funciona
5. **Commit** tus cambios (`git commit -m 'Add amazing feature'`)
6. **Push** a la rama (`git push origin feature/amazing-feature`)
7. **Abre** un Pull Request

### Guías de estilo

- **JavaScript**: ES6+, usar funciones arrow
- **React**: Hooks, functional components
- **CSS**: TailwindCSS utility classes
- **Commits**: Conventional Commits (feat, fix, docs, etc.)

### Testing

```bash
# Abrir en navegador
open index.html

# Probar funcionalidades:
# 1. Importar CSV de prueba
# 2. Crear perfiles
# 3. Configurar presupuestos
# 4. Verificar cálculos
# 5. Probar dark mode
# 6. Validar PWA (offline)
```

---

## 📄 Licencia

MIT License

Copyright (c) 2025 Finzi App

---

## 👨‍💻 Autor

**Diego Arancibia**

---

## 🙏 Agradecimientos

- **React Team** por React 18
- **TailwindCSS** por el framework CSS
- **Dexie.js** por el wrapper de IndexedDB
- **Chart.js** por las visualizaciones
- **PapaParse** por el parser CSV
- **Anthropic Claude** por asistencia en desarrollo

---

## 📞 Soporte

¿Tienes problemas o preguntas?

1. Revisa la documentación técnica en `/docs`
2. Consulta el README de deploy en `/deploy/README.md`
3. Abre un issue para reportar bugs o sugerir mejoras

---

## 🔗 Links Útiles

- [Guía de Deploy](./deploy/README.md)
- [Arquitectura Técnica](./docs/ARQUITECTURA.md)
- [Base de Datos](./docs/DATABASE.md)

---

**⭐ Si te gusta el proyecto, comparte con otros!**

---

*Última actualización: Noviembre 2025*
*Versión: 3.2 - Minimalista*
