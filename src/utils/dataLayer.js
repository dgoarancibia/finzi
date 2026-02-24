/**
 * Capa de Abstracción de Datos - Finzi v3.3
 *
 * Permite usar IndexedDB (local) o Firebase (nube) de forma transparente
 * Cambiando window.USE_FIREBASE puedes alternar entre ambos
 */

/**
 * TRANSACCIONES
 */

// Agregar transacción
window.addTransaccion = async function(transaccion) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await addTransaccionFirebase(transaccion);
    } else {
        return await addTransaccionIndexedDB(transaccion);
    }
};

async function addTransaccionIndexedDB(transaccion) {
    return await db.transacciones.add(transaccion);
}

async function addTransaccionFirebase(transaccion) {
    const col = window.getUserCollection('transacciones');
    const docRef = await col.add({
        ...transaccion,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
}

// Agregar múltiples transacciones (bulk)
window.addTransacciones = async function(transacciones) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await addTransaccionesFirebase(transacciones);
    } else {
        return await addTransaccionesIndexedDB(transacciones);
    }
};

async function addTransaccionesIndexedDB(transacciones) {
    return await db.transacciones.bulkAdd(transacciones);
}

async function addTransaccionesFirebase(transacciones) {
    const col = window.getUserCollection('transacciones');
    const batch = firebase.firestore().batch();

    // Agregar todas las transacciones en un batch
    transacciones.forEach(transaccion => {
        const docRef = col.doc(); // Crear referencia con ID auto-generado
        batch.set(docRef, {
            ...transaccion,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    });

    // Ejecutar batch en Firebase
    await batch.commit();
    console.log(`✅ ${transacciones.length} transacciones guardadas en Firebase`);
}

// Obtener transacciones por mes
window.getTransaccionesByMes = async function(mesAnioId) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await getTransaccionesByMesFirebase(mesAnioId);
    } else {
        return await getTransaccionesByMesIndexedDB(mesAnioId);
    }
};

async function getTransaccionesByMesIndexedDB(mesAnioId) {
    // WORKAROUND: Usar .filter() manual en lugar de índice
    const todas = await db.transacciones.toArray();
    return todas.filter(t => t.mesAnioId === mesAnioId);
}

async function getTransaccionesByMesFirebase(mesAnioId) {
    const col = window.getUserCollection('transacciones');
    const snapshot = await col
        .where('mesAnioId', '==', mesAnioId)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Actualizar transacción
window.updateTransaccion = async function(id, cambios) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await updateTransaccionFirebase(id, cambios);
    } else {
        return await updateTransaccionIndexedDB(id, cambios);
    }
};

async function updateTransaccionIndexedDB(id, cambios) {
    return await db.transacciones.update(id, cambios);
}

async function updateTransaccionFirebase(id, cambios) {
    const col = window.getUserCollection('transacciones');
    await col.doc(id).update({
        ...cambios,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return 1; // Número de registros actualizados
}

// Eliminar transacción
window.deleteTransaccion = async function(id) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await deleteTransaccionFirebase(id);
    } else {
        return await deleteTransaccionIndexedDB(id);
    }
};

async function deleteTransaccionIndexedDB(id) {
    return await db.transacciones.delete(id);
}

async function deleteTransaccionFirebase(id) {
    const col = window.getUserCollection('transacciones');
    await col.doc(id).delete();
}

/**
 * MESES CARGA
 */

// Agregar mes
window.addMesCarga = async function(mes) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await addMesCargaFirebase(mes);
    } else {
        return await addMesCargaIndexedDB(mes);
    }
};

async function addMesCargaIndexedDB(mes) {
    return await db.mesesCarga.add(mes);
}

async function addMesCargaFirebase(mes) {
    const col = window.getUserCollection('mesesCarga');
    const docRef = await col.add({
        ...mes,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log(`🔥 Mes guardado en Firebase con ID: ${docRef.id}`);

    // Retornar el ID de Firebase (string)
    return docRef.id;
}

// Obtener todos los meses
window.getMesesCarga = async function() {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await getMesesCargaFirebase();
    } else {
        return await getMesesCargaIndexedDB();
    }
};

async function getMesesCargaIndexedDB() {
    return await db.mesesCarga.toArray();
}

async function getMesesCargaFirebase() {
    const col = window.getUserCollection('mesesCarga');

    // FORZAR consulta desde servidor (no caché)
    const snapshot = await col
        .orderBy('fechaCarga', 'desc')
        .get({ source: 'server' });

    console.log(`🔍 Snapshot metadata:`, {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        size: snapshot.size
    });

    const mesesFirebase = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    console.log(`📦 Retornando ${mesesFirebase.length} meses desde Firebase (SERVIDOR, no caché)`);

    if (mesesFirebase.length > 0) {
        console.log('📋 Meses encontrados:', mesesFirebase.map(m => ({
            id: m.id,
            mesAnio: m.mesAnio,
            perfilId: m.perfilId
        })));
    }

    return mesesFirebase;
}

// Eliminar mes
window.deleteMesCarga = async function(id) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await deleteMesCargaFirebase(id);
    } else {
        return await deleteMesCargaIndexedDB(id);
    }
};

async function deleteMesCargaIndexedDB(id) {
    // WORKAROUND: Usar .filter() manual para encontrar y eliminar
    const transacciones = await db.transacciones.toArray();
    const idsTransacciones = transacciones.filter(t => t.mesAnioId === id).map(t => t.id);
    await db.transacciones.bulkDelete(idsTransacciones);

    const presupuestos = await db.presupuestos.toArray();
    const idsPresupuestos = presupuestos.filter(p => p.mesAnioId === id).map(p => p.id);
    await db.presupuestos.bulkDelete(idsPresupuestos);

    // Eliminar el mes
    return await db.mesesCarga.delete(id);
}

async function deleteMesCargaFirebase(id) {
    console.log(`🗑️ Eliminando mes ${id} de Firebase...`);

    // Firebase: eliminar transacciones asociadas
    const transCol = window.getUserCollection('transacciones');
    const transSnapshot = await transCol.where('mesAnioId', '==', id).get();
    console.log(`  📊 Encontradas ${transSnapshot.size} transacciones para eliminar`);

    const batch = window.firestore.batch();
    transSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Eliminar presupuestos asociados
    const presupCol = window.getUserCollection('presupuestos');
    const presupSnapshot = await presupCol.where('mesAnioId', '==', id).get();
    console.log(`  💰 Encontrados ${presupSnapshot.size} presupuestos para eliminar`);
    presupSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    // Eliminar el mes
    const mesDoc = window.getUserCollection('mesesCarga').doc(id);
    batch.delete(mesDoc);
    console.log(`  📅 Eliminando mes con ID: ${id}`);

    await batch.commit();
    console.log(`✅ Mes ${id} eliminado completamente de Firebase`);
}

/**
 * PRESUPUESTOS
 */

// Agregar presupuesto
window.addPresupuesto = async function(presupuesto) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await addPresupuestoFirebase(presupuesto);
    } else {
        return await addPresupuestoIndexedDB(presupuesto);
    }
};

async function addPresupuestoIndexedDB(presupuesto) {
    return await db.presupuestos.add(presupuesto);
}

async function addPresupuestoFirebase(presupuesto) {
    const col = window.getUserCollection('presupuestos');
    const docRef = await col.add({
        ...presupuesto,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
}

// Obtener presupuestos de un mes
window.getPresupuestosByMes = async function(mesAnioId) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await getPresupuestosByMesFirebase(mesAnioId);
    } else {
        return await getPresupuestosByMesIndexedDB(mesAnioId);
    }
};

async function getPresupuestosByMesIndexedDB(mesAnioId) {
    // WORKAROUND: Usar .filter() manual en lugar de índice
    const todos = await db.presupuestos.toArray();
    return todos.filter(p => p.mesAnioId === mesAnioId);
}

async function getPresupuestosByMesFirebase(mesAnioId) {
    const col = window.getUserCollection('presupuestos');
    const snapshot = await col
        .where('mesAnioId', '==', mesAnioId)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Obtener plantillas de presupuesto
window.getPresupuestosPlantilla = async function() {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await getPresupuestosPlantillaFirebase();
    } else {
        return await getPresupuestosPlantillaIndexedDB();
    }
};

async function getPresupuestosPlantillaIndexedDB() {
    return await db.presupuestos
        .where('esPlantilla')
        .equals(true)
        .toArray();
}

async function getPresupuestosPlantillaFirebase() {
    const col = window.getUserCollection('presupuestos');
    const snapshot = await col
        .where('esPlantilla', '==', true)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Actualizar presupuesto
window.updatePresupuesto = async function(id, cambios) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await updatePresupuestoFirebase(id, cambios);
    } else {
        return await updatePresupuestoIndexedDB(id, cambios);
    }
};

async function updatePresupuestoIndexedDB(id, cambios) {
    return await db.presupuestos.update(id, cambios);
}

async function updatePresupuestoFirebase(id, cambios) {
    const col = window.getUserCollection('presupuestos');
    await col.doc(id).update({
        ...cambios,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return 1;
}

// Eliminar presupuesto
window.deletePresupuesto = async function(id) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await deletePresupuestoFirebase(id);
    } else {
        return await deletePresupuestoIndexedDB(id);
    }
};

async function deletePresupuestoIndexedDB(id) {
    return await db.presupuestos.delete(id);
}

async function deletePresupuestoFirebase(id) {
    const col = window.getUserCollection('presupuestos');
    await col.doc(id).delete();
}

/**
 * INGRESOS
 */

// Agregar ingreso
window.addIngreso = async function(ingreso) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await addIngresoFirebase(ingreso);
    } else {
        return await addIngresoIndexedDB(ingreso);
    }
};

async function addIngresoIndexedDB(ingreso) {
    return await db.ingresos.add(ingreso);
}

async function addIngresoFirebase(ingreso) {
    const col = window.getUserCollection('ingresos');
    const docRef = await col.add({
        ...ingreso,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
}

// Obtener ingresos de un mes
window.getIngresosByMes = async function(mesAnio) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await getIngresosByMesFirebase(mesAnio);
    } else {
        return await getIngresosByMesIndexedDB(mesAnio);
    }
};

async function getIngresosByMesIndexedDB(mesAnio) {
    return await db.ingresos
        .where('mesAnio')
        .equals(mesAnio)
        .toArray();
}

async function getIngresosByMesFirebase(mesAnio) {
    const col = window.getUserCollection('ingresos');
    const snapshot = await col
        .where('mesAnio', '==', mesAnio)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Eliminar ingreso
window.deleteIngreso = async function(id) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await deleteIngresoFirebase(id);
    } else {
        return await deleteIngresoIndexedDB(id);
    }
};

async function deleteIngresoIndexedDB(id) {
    return await db.ingresos.delete(id);
}

async function deleteIngresoFirebase(id) {
    const col = window.getUserCollection('ingresos');
    await col.doc(id).delete();
}

/**
 * REEMBOLSOS
 */

// Agregar reembolso
window.addReembolso = async function(reembolso) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await addReembolsoFirebase(reembolso);
    } else {
        return await addReembolsoIndexedDB(reembolso);
    }
};

async function addReembolsoIndexedDB(reembolso) {
    const id = await db.reembolsos.add({
        ...reembolso,
        fechaCreacion: new Date().toISOString()
    });

    await db.transacciones.update(reembolso.transaccionOrigenId, {
        esReembolsable: true,
        reembolsoId: id
    });

    return id;
}

async function addReembolsoFirebase(reembolso) {
    const col = window.getUserCollection('reembolsos');
    const docRef = await col.add({
        ...reembolso,
        fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Actualizar transacción
    const transCol = window.getUserCollection('transacciones');
    await transCol.doc(reembolso.transaccionOrigenId).update({
        esReembolsable: true,
        reembolsoId: docRef.id
    });

    return docRef.id;
}

// Obtener todos los reembolsos
window.getReembolsos = async function() {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await getReembolsosFirebase();
    } else {
        return await getReembolsosIndexedDB();
    }
};

async function getReembolsosIndexedDB() {
    return await db.reembolsos.toArray();
}

async function getReembolsosFirebase() {
    const col = window.getUserCollection('reembolsos');
    const snapshot = await col
        .orderBy('fechaCreacion', 'desc')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Actualizar estado de reembolso
window.updateReembolso = async function(id, cambios) {
    if (window.USE_FIREBASE && window.isAuthenticated()) {
        return await updateReembolsoFirebase(id, cambios);
    } else {
        return await updateReembolsoIndexedDB(id, cambios);
    }
};

async function updateReembolsoIndexedDB(id, cambios) {
    return await db.reembolsos.update(id, cambios);
}

async function updateReembolsoFirebase(id, cambios) {
    const col = window.getUserCollection('reembolsos');
    await col.doc(id).update({
        ...cambios,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return 1;
}

console.log('✅ dataLayer.js cargado');
