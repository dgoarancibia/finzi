/**
 * Configuración de Firebase para Finzi v3.3
 *
 * AMBIENTES:
 * - DEV:  datos en colección "gastos-dev" (datos de prueba, no afecta producción)
 * - PROD: datos en colección "gastos"     (datos reales de Diego y Marcela)
 *
 * El ambiente se define en build.js via window.APP_ENV = 'dev' | 'prod'
 */

// Firebase credentials (mismo proyecto para dev y prod)
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyBFzZleam4NK9XqQQ8rYS4Sb8Nhxa9xhFo",
    authDomain: "finzi-bbdbc.firebaseapp.com",
    projectId: "finzi-bbdbc",
    storageBucket: "finzi-bbdbc.firebasestorage.app",
    messagingSenderId: "1068955823447",
    appId: "1:1068955823447:web:16968a73375fbf027fa212"
};

// ⚠️ USUARIOS AUTORIZADOS
window.AUTHORIZED_EMAILS = [
    "diegoarancibiamaturana@gmail.com",
    "marcelaayestas@gmail.com"
];

// Flag para habilitar/deshabilitar Firebase
window.USE_FIREBASE = true;

// Ambiente: 'dev' o 'prod' — inyectado por build.js como window.APP_ENV
// En dev: los datos van a "gastos-dev/{userId}/..." (aislado de producción)
// En prod: los datos van a "gastos/{userId}/..."
// Fallback seguro: si no fue inyectado, usar prod
window.APP_ENV = window.APP_ENV || 'prod';

window.FIREBASE_COLLECTION_ROOT = window.APP_ENV === 'dev' ? 'gastos-dev' : 'gastos';

console.log(`🌍 Ambiente: ${window.APP_ENV.toUpperCase()} | Colección root: ${window.FIREBASE_COLLECTION_ROOT}`);

/**
 * Configuración de Firestore
 */
window.FIRESTORE_SETTINGS = {
    enablePersistence: true,
    realtime: true,
    debug: window.APP_ENV === 'dev'
};
