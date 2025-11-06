#!/usr/bin/env node

/**
 * Script de Build para Analizador de Gastos TC v3.2
 * Combina todos los archivos modulares en un único index.html
 */

const fs = require('fs');
const path = require('path');

// Rutas
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUTPUT = path.join(ROOT, 'index.html');

console.log('🚀 Iniciando build de Analizador de Gastos TC v3.2...\n');

// Leer template HTML base
console.log('📄 Leyendo template base...');
let html = fs.readFileSync(path.join(SRC, 'app.html'), 'utf8');

// Archivos a inyectar en orden
const archivos = [
    // Constants
    { path: 'constants/categories.js', marker: '/* INJECT:constants/categories.js */' },
    { path: 'constants/patterns.js', marker: '/* INJECT:constants/patterns.js */' },

    // Utils
    { path: 'utils/db.js', marker: '/* INJECT:utils/db.js */' },
    { path: 'utils/formatters.js', marker: '/* INJECT:utils/formatters.js */' },
    { path: 'utils/csvParser.js', marker: '/* INJECT:utils/csvParser.js */' },
    { path: 'utils/categorizer.js', marker: '/* INJECT:utils/categorizer.js */' },
    { path: 'utils/budgetCalculator.js', marker: '/* INJECT:utils/budgetCalculator.js */' },
    { path: 'utils/projections.js', marker: '/* INJECT:utils/projections.js */' },

    // Firebase (v3.3)
    { path: 'utils/firebase-config.js', marker: '/* INJECT:utils/firebase-config.js */' },
    { path: 'utils/firebase.js', marker: '/* INJECT:utils/firebase.js */' },
    { path: 'utils/dataLayer.js', marker: '/* INJECT:utils/dataLayer.js */' },

    // Shared Components
    { path: 'components/shared/Modal.jsx', marker: '/* INJECT:components/shared/Modal.jsx */' },
    { path: 'components/shared/Card.jsx', marker: '/* INJECT:components/shared/Card.jsx */' },
    { path: 'components/shared/ProgressBar.jsx', marker: '/* INJECT:components/shared/ProgressBar.jsx */' },
    { path: 'components/shared/AlertBadge.jsx', marker: '/* INJECT:components/shared/AlertBadge.jsx */' },
    { path: 'components/shared/CollapsibleSection.jsx', marker: '/* INJECT:components/shared/CollapsibleSection.jsx */' },

    // Main Components
    { path: 'components/Login.jsx', marker: '/* INJECT:components/Login.jsx */' },
    { path: 'components/Sidebar.jsx', marker: '/* INJECT:components/Sidebar.jsx */' },
    { path: 'components/Home.jsx', marker: '/* INJECT:components/Home.jsx */' },
    { path: 'components/AnalisisCierre.jsx', marker: '/* INJECT:components/AnalisisCierre.jsx */' },
    { path: 'components/HistorialMeses.jsx', marker: '/* INJECT:components/HistorialMeses.jsx */' },
    { path: 'components/Balance.jsx', marker: '/* INJECT:components/Balance.jsx */' },
    { path: 'components/Perfiles.jsx', marker: '/* INJECT:components/Perfiles.jsx */' },
    { path: 'components/Categorias.jsx', marker: '/* INJECT:components/Categorias.jsx */' },
    { path: 'components/Presupuestos.jsx', marker: '/* INJECT:components/Presupuestos.jsx */' },
    { path: 'components/CuotasFuturas.jsx', marker: '/* INJECT:components/CuotasFuturas.jsx */' },
    { path: 'components/Recurrentes.jsx', marker: '/* INJECT:components/Recurrentes.jsx */' },
    { path: 'components/Simulador.jsx', marker: '/* INJECT:components/Simulador.jsx */' },
    { path: 'components/Ingresos.jsx', marker: '/* INJECT:components/Ingresos.jsx */' },
    { path: 'components/Reembolsos.jsx', marker: '/* INJECT:components/Reembolsos.jsx */' },
    { path: 'components/Proyecciones.jsx', marker: '/* INJECT:components/Proyecciones.jsx */' },
    { path: 'components/TourGuide.jsx', marker: '/* INJECT:components/TourGuide.jsx */' }
];

// Inyectar archivos
console.log('📦 Inyectando componentes y utilidades...\n');

let archivosProcesados = 0;
for (const archivo of archivos) {
    const filePath = path.join(SRC, archivo.path);

    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`⚠️  Archivo no encontrado: ${archivo.path}`);
            continue;
        }

        const contenido = fs.readFileSync(filePath, 'utf8');

        if (!html.includes(archivo.marker)) {
            console.warn(`⚠️  Marker no encontrado para: ${archivo.path}`);
            continue;
        }

        html = html.replace(archivo.marker, contenido);
        archivosProcesados++;
        console.log(`✅ ${archivo.path}`);
    } catch (error) {
        console.error(`❌ Error al procesar ${archivo.path}:`, error.message);
    }
}

console.log(`\n📊 Archivos procesados: ${archivosProcesados}/${archivos.length}`);

// Escribir archivo final
console.log(`\n💾 Escribiendo ${OUTPUT}...`);
fs.writeFileSync(OUTPUT, html);

// Obtener tamaño del archivo
const stats = fs.statSync(OUTPUT);
const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

console.log(`\n✨ Build completado exitosamente!`);
console.log(`📦 Archivo generado: index.html (${sizeMB} MB)`);
console.log(`\n🎉 ¡Listo para usar! Abre index.html en tu navegador.`);
