/**
 * Inicialización y utilidades de Firebase
 * Finzi v3.3
 */

// Variables globales de Firebase
window.firebaseApp = null;
window.firebaseAuth = null;
window.firestore = null;
window.currentUser = null;

/**
 * Inicializar Firebase
 */
window.initializeFirebase = async function() {
    try {
        console.log('🔥 Inicializando Firebase...');

        // Verificar que Firebase esté cargado
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK no cargado');
        }

        // Verificar configuración
        if (!window.FIREBASE_CONFIG || !window.FIREBASE_CONFIG.apiKey) {
            throw new Error('Configuración de Firebase no encontrada. Edita src/utils/firebase-config.js');
        }

        // Inicializar App
        window.firebaseApp = firebase.initializeApp(window.FIREBASE_CONFIG);
        console.log('✅ Firebase App inicializada');

        // Inicializar Auth con persistencia LOCAL (más compatible con móviles)
        window.firebaseAuth = firebase.auth();

        // Configurar persistencia LOCAL para compatibilidad móvil
        try {
            await window.firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
            console.log('✅ Firebase Auth inicializada con persistencia LOCAL');
        } catch (err) {
            console.warn('⚠️ No se pudo configurar persistencia, usando por defecto:', err);
        }

        // Inicializar Firestore
        window.firestore = firebase.firestore();

        // Habilitar persistencia offline
        if (window.FIRESTORE_SETTINGS.enablePersistence) {
            try {
                await window.firestore.enablePersistence({
                    synchronizeTabs: true
                });
                console.log('✅ Persistencia offline habilitada');
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('⚠️ Persistencia: múltiples pestañas abiertas');
                } else if (err.code === 'unimplemented') {
                    console.warn('⚠️ Persistencia no soportada en este navegador');
                } else {
                    console.warn('⚠️ Error en persistencia:', err);
                }
            }
        }

        console.log('✅ Firestore inicializada');

        // Observer de autenticación
        window.firebaseAuth.onAuthStateChanged((user) => {
            window.currentUser = user;

            if (user) {
                console.log('👤 Usuario autenticado:', user.email);

                // Verificar si está autorizado
                if (!window.isAuthorizedUser(user.email)) {
                    console.error('❌ Usuario no autorizado:', user.email);
                    window.firebaseAuth.signOut();
                    alert('Tu cuenta no está autorizada para usar esta aplicación.');
                    return;
                }

                // Disparar evento personalizado
                console.log('🔔 Disparando evento firebaseUserChanged (autenticado)');
                window.dispatchEvent(new CustomEvent('firebaseUserChanged', {
                    detail: { user, isAuthenticated: true }
                }));
            } else {
                console.log('👤 Usuario no autenticado');
                window.dispatchEvent(new CustomEvent('firebaseUserChanged', {
                    detail: { user: null, isAuthenticated: false }
                }));
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Error al inicializar Firebase:', error);
        throw error;
    }
};

/**
 * Verificar si un email está autorizado
 */
window.isAuthorizedUser = function(email) {
    if (!email) return false;
    return window.AUTHORIZED_EMAILS.includes(email.toLowerCase());
};

/**
 * Login con Google
 */
window.loginWithGoogle = async function() {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({
            prompt: 'select_account'
        });

        const result = await window.firebaseAuth.signInWithPopup(provider);
        const user = result.user;

        console.log('✅ Login exitoso:', user.email);

        // Verificar autorización
        if (!window.isAuthorizedUser(user.email)) {
            await window.firebaseAuth.signOut();
            throw new Error('Usuario no autorizado');
        }

        return user;
    } catch (error) {
        console.error('❌ Error en login:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('Login cancelado');
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('Popup bloqueado. Habilita popups para este sitio.');
        } else {
            throw error;
        }
    }
};

/**
 * Logout
 */
window.logoutFirebase = async function() {
    try {
        await window.firebaseAuth.signOut();
        console.log('✅ Logout exitoso');
        window.currentUser = null;
    } catch (error) {
        console.error('❌ Error en logout:', error);
        throw error;
    }
};

/**
 * Obtener usuario actual
 */
window.getCurrentUser = function() {
    return window.currentUser;
};

/**
 * Verificar si está autenticado
 */
window.isAuthenticated = function() {
    return window.currentUser !== null;
};

/**
 * Esperar a que el usuario esté autenticado
 */
window.waitForAuth = function() {
    return new Promise((resolve) => {
        if (window.currentUser) {
            resolve(window.currentUser);
        } else {
            const unsubscribe = window.firebaseAuth.onAuthStateChanged((user) => {
                unsubscribe();
                resolve(user);
            });
        }
    });
};

/**
 * Helper: obtener referencia a colección de usuario
 * En DEV usa "gastos-dev/{userId}/..." para no tocar datos de producción
 */
window.getUserCollection = function(collectionName) {
    if (!window.currentUser) {
        throw new Error('Usuario no autenticado');
    }

    const root = window.FIREBASE_COLLECTION_ROOT || 'gastos';
    return window.firestore
        .collection(root)
        .doc(window.currentUser.uid)
        .collection(collectionName);
};

/**
 * Helper: obtener documento de usuario
 */
window.getUserDoc = function() {
    if (!window.currentUser) {
        throw new Error('Usuario no autenticado');
    }

    const root = window.FIREBASE_COLLECTION_ROOT || 'gastos';
    return window.firestore
        .collection(`${root}-users`)
        .doc(window.currentUser.uid);
};

console.log('✅ firebase.js cargado');
