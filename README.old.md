# 💳 Analizador de Gastos TC v3.2

Una Single Page Application (SPA) completa para analizar y gestionar gastos de tarjeta de crédito, con capacidades avanzadas de categorización, presupuestos, proyecciones y simulación de compras.

## ✨ Características Principales

### 🎯 US-001: Sistema de Perfiles Multiusuario
- Hasta 5 perfiles personalizables con nombres y colores
- Cada transacción se asigna a un perfil específico
- CRUD completo de perfiles

### 📊 US-002: Carga de CSV con Categorización Inteligente
- Parser de archivos CSV con formato: `Fecha;Descripción;Monto;Cuotas`
- Categorización automática basada en patrones
- Sistema de aprendizaje de categorías
- Normalización de nombres de comercios
- Detección automática de cuotas (formato "1/12")

### 💾 US-003: Persistencia con IndexedDB
- Hasta 24 meses de historial
- Base de datos local con Dexie.js
- 6 stores: mesesCarga, transacciones, presupuestos, recurrentes, historialRecurrentes, comprasPlaneadas
- Carga acumulativa de múltiples CSV al mismo mes

### 💰 US-004: Sistema de Presupuestos
- Plantilla base de presupuestos
- Presupuestos específicos por mes
- Herencia automática de plantilla
- Override y restauración por mes

### 🚦 US-005: Barras de Progreso con Alertas
- Sistema de semáforo: Verde (<70%), Amarillo (70-90%), Rojo (>90%)
- Notificaciones de categorías en riesgo
- Indicador de salud financiera global

### 📈 US-006: Vista de Compromisos Mensuales
- Lista de cuotas activas con proyección
- Gráfico de proyección de 12 meses
- Desglose: Spot, Cuotas Mes, Cuotas Anteriores

### 🔄 US-007: Sistema de Recurrentes
- Gestión de transacciones recurrentes (Netflix, Luz, etc.)
- Registro de montos mensuales
- Historial de 6 meses
- Notificaciones de pendientes
- Integración en proyección total

### 📅 US-008: Selector de Mes/Año al Cargar CSV
- Selector visual de año (últimos 2 años)
- Grilla de 12 meses con indicador de datos existentes
- Proceso guiado: Mes → Archivo → Perfil → Preview
- Opción de reemplazar o agregar transacciones

### 🧮 Simulador de Compras
- Input: monto total y cantidad de cuotas
- Análisis de impacto en proyección de 12 meses
- Recomendación: Viable, Riesgoso, No Recomendado
- Gráfico comparativo con/sin compra
- Opción de agregar a "compras planeadas"

## 🛠️ Stack Tecnológico

- **Frontend**: HTML5 + React 18 (CDN)
- **Estilos**: TailwindCSS (CDN)
- **Gráficos**: Chart.js
- **CSV**: PapaParse
- **Base de Datos**: Dexie.js (IndexedDB)
- **Todo en un único archivo HTML** (170 KB)

## 📁 Estructura del Proyecto

```
App Gastos/
├── index.html                  # Archivo compilado final
├── package.json                # Scripts de build
├── README.md                   # Este archivo
├── src/
│   ├── app.html               # Template base HTML
│   ├── components/
│   │   ├── Home.jsx           # Dashboard principal
│   │   ├── HistorialMeses.jsx # Gestión de meses
│   │   ├── Perfiles.jsx       # CRUD perfiles
│   │   ├── Categorias.jsx     # CRUD categorías
│   │   ├── Presupuestos.jsx   # Configuración límites
│   │   ├── Recurrentes.jsx    # Transacciones mensuales
│   │   ├── Simulador.jsx      # Análisis compras
│   │   ├── Sidebar.jsx        # Menú lateral
│   │   └── shared/            # Componentes compartidos
│   │       ├── Modal.jsx
│   │       ├── Card.jsx
│   │       ├── ProgressBar.jsx
│   │       └── AlertBadge.jsx
│   ├── utils/
│   │   ├── db.js              # Configuración Dexie.js
│   │   ├── categorizer.js     # Lógica categorización
│   │   ├── csvParser.js       # Parser CSV
│   │   ├── budgetCalculator.js # Cálculos presupuestos
│   │   ├── projections.js     # Proyecciones cuotas
│   │   └── formatters.js      # Formato números/fechas
│   └── constants/
│       ├── categories.js      # Categorías predefinidas
│       └── patterns.js        # Patrones comercios
├── ejemplos/
│   └── plantilla.csv          # CSV de ejemplo
└── scripts/
    └── build.js               # Script compilación
```

## 🚀 Instalación y Uso

### Opción 1: Usar el archivo compilado (Recomendado)

1. Abre `index.html` directamente en tu navegador
2. ¡Listo! La aplicación funciona sin servidor

### Opción 2: Desarrollo con build

1. **Instalar Node.js** (opcional, solo para desarrollo)

2. **Compilar el proyecto:**
   ```bash
   npm run build
   ```

3. **Abrir el archivo generado:**
   ```bash
   open index.html
   # o en Windows:
   start index.html
   ```

## 📝 Formato del CSV

El archivo CSV debe tener el siguiente formato con punto y coma como delimitador:

```csv
Fecha;Descripción;Monto;Cuotas
01/10/2025;Jumbo Providencia;45000;
05/10/2025;Netflix Premium 1/12;8990;1/12
10/10/2025;Falabella 3/6;12500;3/6
```

### Campos:
- **Fecha**: DD/MM/YYYY o YYYY-MM-DD
- **Descripción**: Nombre del comercio o descripción de la compra
- **Monto**: Número sin separador de miles (puede tener puntos o comas)
- **Cuotas**: Formato "actual/total" (ej: "1/12") o vacío para compras spot

### Detección Automática de Cuotas:
Si el campo "Cuotas" está vacío, el sistema también detecta cuotas desde la descripción con estos formatos:
- "1/12"
- "1 de 12"
- "Cuota 1/12"
- "Cta 1/12"

## 🎨 Páginas de la Aplicación

### 1. 🏠 Home - Dashboard Principal
- Selector de mes activo
- 4 tarjetas de estadísticas (Total, Spot, Cuotas Mes, Cuotas Anteriores)
- Alertas compactas (Categorías en riesgo, Top 3 gastos)
- Indicador de Salud Financiera
- Gráfico Doughnut de distribución por categorías
- Tabs de vista (Todas | Spot | Cuotas Mes | Cuotas Anteriores)
- Filtros avanzados (Perfil, Categoría, Búsqueda)
- Lista de transacciones con CRUD
- Botón "Cargar CSV"

### 2. 📅 Historial de Meses
- Vista de todos los meses cargados
- Estadísticas por mes (total de transacciones y gasto)
- Acciones: Ver detalles, Eliminar mes

### 3. 👥 Gestionar Perfiles
- Crear, editar y eliminar perfiles (máximo 5)
- Selector de color personalizado
- Vista previa del perfil

### 4. 🏷️ Gestionar Categorías
- Agregar categorías personalizadas
- Selección de icono y color
- Editar y eliminar categorías

### 5. 💰 Presupuestos
- Toggle: Plantilla Base / Mes Específico
- Configurar límites por categoría
- Restaurar plantilla para un mes específico
- Total del presupuesto

### 6. 🔄 Recurrentes
- Agregar gastos mensuales recurrentes
- Activar/Desactivar recurrentes
- Monto estimado mensual

### 7. 🧮 Simulador
- Input: Monto y Cuotas
- Recomendación visual (Viable/Riesgoso/No Recomendado)
- Gráfico comparativo de proyección
- Estadísticas: Cuota mensual, Meses excedidos, Mayor excedente
- Opción de agregar a compras planeadas

## 💡 Funcionalidades Avanzadas

### Categorización Inteligente
- **Patrones Predefinidos**: Comercios chilenos comunes (Jumbo, Lider, Unimarc, etc.)
- **Aprendizaje**: El sistema aprende de tus correcciones manuales
- **localStorage**: Guarda comercios aprendidos localmente

### Sistema de Alertas
- **Verde**: Menos del 70% del presupuesto usado
- **Amarillo**: Entre 70% y 90% usado
- **Rojo**: Más del 90% usado o presupuesto excedido

### Proyección de Cuotas
- Detecta automáticamente cuotas activas de meses anteriores
- Calcula el impacto de cada cuota en los próximos 12 meses
- Incluye recurrentes y compras planeadas en la proyección

### Salud Financiera
- Puntuación de 0-100 basada en el estado de los presupuestos
- Niveles: Excelente (80+), Bueno (60-79), Regular (40-59), Crítico (<40)

## 🎯 Casos de Uso

### 1. Cargar un nuevo mes de gastos
1. Ir a Home
2. Click en "Cargar CSV"
3. Seleccionar año y mes
4. Subir archivo CSV
5. Asignar perfil
6. Revisar preview
7. Guardar

### 2. Configurar presupuestos
1. Ir a Presupuestos
2. Seleccionar "Plantilla Base"
3. Configurar monto para cada categoría
4. Guardar

### 3. Simular una compra en cuotas
1. Ir a Simulador
2. Ingresar monto total
3. Seleccionar cantidad de cuotas
4. Click en "Simular"
5. Revisar recomendación y gráfico
6. (Opcional) Agregar a compras planeadas

### 4. Gestionar gastos recurrentes
1. Ir a Recurrentes
2. Click en "Nueva Recurrente"
3. Completar: Nombre, Categoría, Perfil, Monto Estimado
4. Guardar
5. La recurrente se incluirá automáticamente en proyecciones

## 🔒 Privacidad y Seguridad

- **100% Local**: Todos los datos se almacenan localmente en tu navegador
- **Sin servidor**: No se envían datos a ningún servidor externo
- **Sin internet requerido**: Funciona completamente offline después de la primera carga
- **IndexedDB**: Base de datos local cifrada del navegador

## 🐛 Problemas Conocidos

- Los datos se almacenan por dominio del navegador. Si abres el archivo desde diferentes rutas (file://), tendrás bases de datos separadas.
- Recomendado: Servir desde localhost o usar siempre la misma ruta de archivo.

## 📈 Roadmap Futuro

- [ ] Exportar datos a Excel/CSV
- [ ] Importar/Exportar backup completo
- [ ] Gráficos de tendencias históricas
- [ ] Comparación entre perfiles
- [ ] Modo oscuro
- [ ] PWA con soporte offline
- [ ] Sincronización en la nube (opcional)

## 🤝 Contribuciones

Este es un proyecto personal, pero las sugerencias son bienvenidas. Puedes:
- Reportar bugs
- Sugerir nuevas funcionalidades
- Enviar pull requests

## 📄 Licencia

MIT License - Uso libre con atribución

## 👨‍💻 Autor

**Diego Arancibia**

---

**Versión**: 3.2.0
**Última actualización**: Octubre 2025
**Estado**: ✅ Funcional y listo para producción

¿Necesitas ayuda? Abre un issue en el repositorio o consulta la documentación en el código fuente.
