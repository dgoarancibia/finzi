/**
 * Configuración de Firebase para Finzi v3.3
 *
 * INSTRUCCIONES:
 * 1. Ve a Firebase Console: https://console.firebase.google.com/
 * 2. Selecciona tu proyecto
 * 3. Ve a Configuración del proyecto (ícono engranaje)
 * 4. Scroll down hasta "Tus apps" → selecciona la app web
 * 5. Copia el objeto firebaseConfig
 * 6. Reemplaza los valores abajo con los tuyos
 */

// ⚠️ CONFIGURACIÓN REAL - Tus credenciales de Firebase
window.FIREBASE_CONFIG = {
    apiKey: "AIzaSyBFzZleam4NK9XqQQ8rYS4Sb8Nhxa9xhFo",
    authDomain: "finzi-bbdbc.firebaseapp.com",
    projectId: "finzi-bbdbc",
    storageBucket: "finzi-bbdbc.firebasestorage.app",
    messagingSenderId: "1068955823447",
    appId: "1:1068955823447:web:16968a73375fbf027fa212"
};

// ⚠️ USUARIOS AUTORIZADOS - Agrega los emails que pueden acceder
window.AUTHORIZED_EMAILS = [
    "diegoarancibiamaturana@gmail.com",        // ← CAMBIAR por tu email
    "marcelaayestas@gmail.com"     // ← CAMBIAR por email de tu esposa
];

// Flag para habilitar/deshabilitar Firebase
// true = usar Firebase (sincronización en la nube)
// false = usar IndexedDB local (como antes)
window.USE_FIREBASE = true;

/**
 * Configuración de Firestore
 */
window.FIRESTORE_SETTINGS = {
    // Habilitar persistencia offline
    enablePersistence: true,

    // Sincronización en tiempo real
    realtime: true,

    // Logs de debug (solo desarrollo)
    debug: false
};
