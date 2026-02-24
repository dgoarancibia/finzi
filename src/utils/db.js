// Configuración de IndexedDB con Dexie.js
window.db = new Dexie('GastosTCDatabase');

// Definir el esquema de la base de datos
db.version(13).stores({
    // Meses cargados: registra cada mes con transacciones por perfil
    // perfilId: permite que Diego y Marcela carguen el mismo mes por separado
    mesesCarga: '++id, mesAnio, perfilId, fechaCarga',

    // Transacciones: todas las compras del CSV
    // Campos adicionales: esCompartido, porcentajePerfil, perfilCompartidoId
    // Campos de reembolso: esReembolsable, reembolsoId
    // Campos v3.4 (Entrada Rápida): origen ('manual'|'csv'), estado ('provisional'|'confirmado'), textoOriginal, transaccionRelacionadaId
    transacciones: '++id, mesAnioId, perfilId, fecha, categoria, comercio, esCompartido, esReembolsable, reembolsoId, origen, estado',

    // Presupuestos: límites por categoría por mes
    // esPlantilla: true para la plantilla base, false para meses específicos
    presupuestos: '++id, mesAnioId, categoria, monto, esPlantilla',

    // Recurrentes: transacciones recurrentes con frecuencias variables
    // frecuencia: 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual', 'personalizado'
    // fechaProximoPago: próxima fecha de cobro (YYYY-MM-DD)
    // monto: monto del pago (no mensual estimado, sino el monto real del pago)
    recurrentes: '++id, nombre, categoria, perfilId, monto, frecuencia, fechaProximoPago, activa',

    // Historial de recurrentes: registro de montos reales por mes
    historialRecurrentes: '++id, recurrenteId, mesAnio, monto, fecha',

    // Compras planeadas: para proyección futura
    comprasPlaneadas: '++id, nombre, monto, cuotas, categoria, perfilId, fechaCreacion',

    // Liquidaciones: registro de pagos entre perfiles para saldar cuentas
    liquidaciones: '++id, mesAnioId, mesAnio, deudorId, acreedorId, monto, fecha, gastosIncluidos',

    // Ingresos: registro de ingresos mensuales por perfil
    ingresos: '++id, mesAnio, perfilId, monto, descripcion, fecha, esRecurrente',

    // Reembolsos: seguimiento de gastos a reembolsar
    // estado: 'pendiente', 'solicitado', 'pagado'
    // tipoCompra: 'spot' o 'cuotas'
    // Si es cuotas: transaccionOrigenId apunta a la primera cuota, cuotasTotal indica el total
    reembolsos: '++id, transaccionOrigenId, nombreDeudor, estado, tipoCompra, cuotasTotal, fechaCreacion, fechaSolicitud, fechaPago'
}).upgrade(tx => {
    // Migración de versión 9 a 10: actualizar recurrentes con nuevos campos
    return tx.table('recurrentes').toCollection().modify(recurrente => {
        // Si no tiene frecuencia, asignar 'mensual' por defecto
        if (!recurrente.frecuencia) {
            recurrente.frecuencia = 'mensual';
        }
        // Si no tiene fechaProximoPago, calcular del primer día del próximo mes
        if (!recurrente.fechaProximoPago) {
            const hoy = new Date();
            const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
            recurrente.fechaProximoPago = proximoMes.toISOString().split('T')[0];
        }
        // Migrar montoEstimado a monto si existe
        if (recurrente.montoEstimado !== undefined && !recurrente.monto) {
            recurrente.monto = recurrente.montoEstimado;
        }
    });
});

// Migración de versión 10 a 11: agregar campos de entrada rápida
db.version(11).upgrade(tx => {
    return tx.table('transacciones').toCollection().modify(transaccion => {
        // Transacciones existentes del CSV se marcan como confirmadas
        if (!transaccion.origen) {
            transaccion.origen = 'csv';
        }
        if (!transaccion.estado) {
            transaccion.estado = 'confirmado';
        }
        if (!transaccion.textoOriginal) {
            transaccion.textoOriginal = null;
        }
        if (!transaccion.transaccionRelacionadaId) {
            transaccion.transaccionRelacionadaId = null;
        }
    });
});

// Migración de versión 11 a 12: forzar recreación de índices
db.version(12).upgrade(tx => {
    // Los índices se recrean automáticamente cuando se incrementa la versión
    // Solo aseguramos que los campos existen
    return tx.table('transacciones').toCollection().modify(transaccion => {
        if (!transaccion.origen) {
            transaccion.origen = 'csv';
        }
        if (!transaccion.estado) {
            transaccion.estado = 'confirmado';
        }
    });
});

// Funciones auxiliares para trabajar con la DB

/**
 * Obtiene o crea un mes de carga para un perfil específico
 * @param {string} mesAnio - Formato "YYYY-MM"
 * @param {number} perfilId - ID del perfil (1=Diego, 2=Marcela, etc.)
 * @returns {Promise<number>} ID del mes
 */
window.getOrCreateMesAnio = async function(mesAnio, perfilId) {
    // Buscar en la fuente de datos correcta (Firebase o IndexedDB)
    const mesesExistentes = await window.getMesesCarga();

    // Buscar por mesAnio + perfilId para permitir que ambos perfiles carguen el mismo mes
    const mesExistente = mesesExistentes.find(m => m.mesAnio === mesAnio && m.perfilId === perfilId);

    if (mesExistente) {
        console.log(`✓ Mes ${mesAnio} (perfil ${perfilId}) ya existe con ID: ${mesExistente.id}`);
        return mesExistente.id;
    }

    // Crear nuevo mes usando dataLayer (guarda en Firebase si está activo)
    const id = await window.addMesCarga({
        mesAnio: mesAnio,
        perfilId: perfilId,
        fechaCarga: new Date().toISOString()
    });

    console.log(`✅ Mes ${mesAnio} (perfil ${perfilId}) creado con ID: ${id}`);
    return id;
}

/**
 * Obtiene todas las transacciones de un mes específico
 * @param {number} mesAnioId - ID del mes
 * @returns {Promise<Array>} Array de transacciones
 */
window.getTransaccionesByMes = async function(mesAnioId) {
    console.log(`🔍 getTransaccionesByMes llamado con mesAnioId:`, mesAnioId);

    // WORKAROUND: El índice de Dexie está roto en DBs antiguas
    // Usar .filter() manual en lugar de .where().equals()
    const todas = await db.transacciones.toArray();
    const result = todas.filter(t => t.mesAnioId === mesAnioId);

    console.log(`🔍 Total en DB: ${todas.length}, Filtradas: ${result.length}`);

    return result;
}

/**
 * Obtiene transacciones filtradas
 * @param {number} mesAnioId - ID del mes
 * @param {Object} filtros - { perfilId, categoria, tipo }
 * @returns {Promise<Array>} Array de transacciones filtradas
 */
window.getTransaccionesFiltradas = async function(mesAnioId, filtros = {}) {
    // WORKAROUND: Usar .filter() manual en lugar de índice
    const todas = await db.transacciones.toArray();
    const transacciones = todas.filter(t => t.mesAnioId === mesAnioId);

    // Aplicar filtros en memoria
    return transacciones.filter(t => {
        if (filtros.perfilId && t.perfilId !== filtros.perfilId) return false;
        if (filtros.categoria && t.categoria !== filtros.categoria) return false;
        if (filtros.tipo) {
            // Spot: sin cuotas O pago del mes 1/1
            if (filtros.tipo === 'spot' && t.cuotaActual && !(t.cuotaActual === 1 && t.cuotasTotal === 1)) return false;
            // Cuotas del mes: primera cuota de compra en cuotas (1/2, 1/3, etc.)
            if (filtros.tipo === 'cuotasMes' && (!t.cuotaActual || t.cuotaActual !== 1 || t.cuotasTotal === 1)) return false;
            // Cuotas anteriores: cuotas 2/12, 3/12, etc.
            if (filtros.tipo === 'cuotasAnteriores' && (!t.cuotaActual || t.cuotaActual === 1)) return false;
        }
        return true;
    });
}

/**
 * Agrega múltiples transacciones
 * NOTA: Esta función ahora está en dataLayer.js para soportar Firebase
 * @param {Array} transacciones - Array de transacciones
 * @returns {Promise<void>}
 */
// window.addTransacciones - ahora manejado por dataLayer.js

/**
 * Actualiza una transacción existente
 * @param {number} id - ID de la transacción
 * @param {Object} cambios - Campos a actualizar
 * @returns {Promise<number>}
 */
window.updateTransaccion = async function(id, cambios) {
    return await db.transacciones.update(id, cambios);
}

/**
 * Elimina una transacción
 * @param {number} id - ID de la transacción
 * @returns {Promise<void>}
 */
window.deleteTransaccion = async function(id) {
    return await db.transacciones.delete(id);
}

/**
 * Obtiene presupuestos de un mes (o plantilla)
 * @param {number|null} mesAnioId - ID del mes, o null para plantilla
 * @returns {Promise<Array>} Array de presupuestos
 */
window.getPresupuestos = async function(mesAnioId = null) {
    if (mesAnioId === null) {
        // Obtener plantilla base
        return await db.presupuestos
            .where('esPlantilla')
            .equals(1)
            .toArray();
    }

    // Buscar presupuestos específicos del mes
    const presupuestosMes = await db.presupuestos
        .where('mesAnioId')
        .equals(mesAnioId)
        .toArray();

    // Si no hay presupuestos para el mes, usar plantilla
    if (presupuestosMes.length === 0) {
        return await db.presupuestos
            .where('esPlantilla')
            .equals(1)
            .toArray();
    }

    return presupuestosMes;
}

/**
 * Guarda o actualiza presupuestos
 * @param {Array} presupuestos - Array de presupuestos
 * @param {number|null} mesAnioId - ID del mes, o null para plantilla
 * @returns {Promise<void>}
 */
window.savePresupuestos = async function(presupuestos, mesAnioId = null) {
    const esPlantilla = mesAnioId === null ? 1 : 0;

    // Eliminar presupuestos anteriores
    if (mesAnioId === null) {
        await db.presupuestos.where('esPlantilla').equals(1).delete();
    } else {
        await db.presupuestos.where('mesAnioId').equals(mesAnioId).delete();
    }

    // Agregar nuevos presupuestos
    const items = presupuestos.map(p => ({
        mesAnioId: mesAnioId,
        categoria: p.categoria,
        monto: p.monto,
        esPlantilla: esPlantilla
    }));

    await db.presupuestos.bulkAdd(items);
}

/**
 * Elimina todas las transacciones de un mes
 * @param {number} mesAnioId - ID del mes
 * @returns {Promise<void>}
 */
window.deleteAllTransaccionesByMes = async function(mesAnioId) {
    await db.transacciones.where('mesAnioId').equals(mesAnioId).delete();
}

/**
 * Elimina un mes completo y todas sus transacciones
 * @param {string} mesAnioId - ID del mes (Firebase ID)
 * @returns {Promise<void>}
 */
window.deleteMesCompleto = async function(mesAnioId) {
    // Usar deleteMesCarga de dataLayer que maneja Firebase
    await window.deleteMesCarga(mesAnioId);
}

/**
 * Obtiene recurrentes activas
 * @returns {Promise<Array>} Array de recurrentes
 */
window.getRecurrentesActivas = async function() {
    return await db.recurrentes
        .where('activa')
        .equals(1)
        .toArray();
}

/**
 * Obtiene historial de una recurrente
 * @param {number} recurrenteId - ID de la recurrente
 * @param {number} meses - Cantidad de meses hacia atrás
 * @returns {Promise<Array>} Array de historial
 */
window.getHistorialRecurrente = async function(recurrenteId, meses = 6) {
    return await db.historialRecurrentes
        .where('recurrenteId')
        .equals(recurrenteId)
        .reverse()
        .limit(meses)
        .toArray();
}

/**
 * Registra un pago de recurrente
 * @param {number} recurrenteId - ID de la recurrente
 * @param {string} mesAnio - Formato "YYYY-MM"
 * @param {number} monto - Monto pagado
 * @returns {Promise<number>} ID del registro
 */
window.registrarPagoRecurrente = async function(recurrenteId, mesAnio, monto) {
    return await db.historialRecurrentes.add({
        recurrenteId,
        mesAnio,
        monto,
        fecha: new Date().toISOString()
    });
}

/**
 * Obtiene compras planeadas
 * @returns {Promise<Array>} Array de compras planeadas
 */
window.getComprasPlaneadas = async function() {
    return await db.comprasPlaneadas.toArray();
}

/**
 * Agrega una compra planeada
 * @param {Object} compra - Datos de la compra
 * @returns {Promise<number>} ID de la compra
 */
window.addCompraPlaneada = async function(compra) {
    return await db.comprasPlaneadas.add({
        ...compra,
        fechaCreacion: new Date().toISOString()
    });
}

/**
 * Elimina una compra planeada
 * @param {number} id - ID de la compra
 * @returns {Promise<void>}
 */
window.deleteCompraPlaneada = async function(id) {
    return await db.comprasPlaneadas.delete(id);
}

// ============================================
// FUNCIONES PARA LIQUIDACIONES
// ============================================

/**
 * Agrega una nueva liquidación
 * @param {Object} liquidacion - Datos de la liquidación
 * @returns {Promise<number>} ID de la liquidación creada
 */
window.addLiquidacion = async function(liquidacion) {
    return await db.liquidaciones.add(liquidacion);
}

/**
 * Obtiene las liquidaciones de un mes específico
 * @param {number} mesAnioId - ID del mes
 * @returns {Promise<Array>} Array de liquidaciones
 */
window.getLiquidaciones = async function(mesAnioId) {
    return await db.liquidaciones
        .where('mesAnioId')
        .equals(mesAnioId)
        .reverse()
        .sortBy('fecha');
}

/**
 * Obtiene todas las liquidaciones
 * @returns {Promise<Array>} Array de todas las liquidaciones
 */
window.getAllLiquidaciones = async function() {
    return await db.liquidaciones.reverse().sortBy('fecha');
}

/**
 * Elimina una liquidación
 * @param {number} id - ID de la liquidación
 * @returns {Promise<void>}
 */
window.deleteLiquidacion = async function(id) {
    return await db.liquidaciones.delete(id);
}

// ============================================
// FUNCIONES PARA INGRESOS
// ============================================

/**
 * Obtiene los ingresos de un mes específico
 * @param {string} mesAnio - Formato "YYYY-MM"
 * @returns {Promise<Array>} Array de ingresos
 */
window.getIngresos = async function(mesAnio) {
    return await db.ingresos
        .where('mesAnio')
        .equals(mesAnio)
        .toArray();
}

/**
 * Agrega un nuevo ingreso
 * @param {Object} ingreso - Datos del ingreso
 * @returns {Promise<number>} ID del ingreso creado
 */
window.addIngreso = async function(ingreso) {
    return await db.ingresos.add({
        ...ingreso,
        fecha: ingreso.fecha || new Date().toISOString()
    });
}

/**
 * Actualiza un ingreso existente
 * @param {number} id - ID del ingreso
 * @param {Object} cambios - Campos a actualizar
 * @returns {Promise<number>}
 */
window.updateIngreso = async function(id, cambios) {
    return await db.ingresos.update(id, cambios);
}

/**
 * Elimina un ingreso
 * @param {number} id - ID del ingreso
 * @returns {Promise<void>}
 */
window.deleteIngreso = async function(id) {
    return await db.ingresos.delete(id);
}

/**
 * Obtiene el total de ingresos de un mes por perfil
 * @param {string} mesAnio - Formato "YYYY-MM"
 * @param {number} perfilId - ID del perfil (opcional)
 * @returns {Promise<number>} Total de ingresos
 */
window.getTotalIngresosMes = async function(mesAnio, perfilId = null) {
    let query = db.ingresos.where('mesAnio').equals(mesAnio);
    const ingresos = await query.toArray();

    return ingresos
        .filter(i => !perfilId || i.perfilId === perfilId)
        .reduce((sum, i) => sum + i.monto, 0);
}

// ============================================
// FUNCIONES PARA REEMBOLSOS
// ============================================

/**
 * Crea un nuevo reembolso
 * @param {Object} reembolso - Datos del reembolso
 * @returns {Promise<number>} ID del reembolso creado
 */
window.addReembolso = async function(reembolso) {
    const id = await db.reembolsos.add({
        ...reembolso,
        fechaCreacion: new Date().toISOString()
    });

    // Marcar la transacción origen como reembolsable
    await db.transacciones.update(reembolso.transaccionOrigenId, {
        esReembolsable: true,
        reembolsoId: id
    });

    return id;
}

/**
 * Obtiene todos los reembolsos
 * @param {string} estado - Filtrar por estado ('pendiente', 'solicitado', 'pagado', o null para todos)
 * @returns {Promise<Array>} Array de reembolsos
 */
window.getReembolsos = async function(estado = null) {
    if (estado) {
        return await db.reembolsos
            .where('estado')
            .equals(estado)
            .reverse()
            .sortBy('fechaCreacion');
    }
    return await db.reembolsos.reverse().sortBy('fechaCreacion');
}

/**
 * Obtiene un reembolso por ID
 * @param {number} id - ID del reembolso
 * @returns {Promise<Object>} Reembolso
 */
window.getReembolsoById = async function(id) {
    return await db.reembolsos.get(id);
}

/**
 * Actualiza el estado de un reembolso
 * @param {number} id - ID del reembolso
 * @param {string} nuevoEstado - Nuevo estado ('pendiente', 'solicitado', 'pagado')
 * @returns {Promise<number>}
 */
window.updateEstadoReembolso = async function(id, nuevoEstado) {
    const cambios = { estado: nuevoEstado };

    if (nuevoEstado === 'solicitado') {
        cambios.fechaSolicitud = new Date().toISOString();
    } else if (nuevoEstado === 'pagado') {
        cambios.fechaPago = new Date().toISOString();
    }

    return await db.reembolsos.update(id, cambios);
}

/**
 * Elimina un reembolso
 * @param {number} id - ID del reembolso
 * @returns {Promise<void>}
 */
window.deleteReembolso = async function(id) {
    const reembolso = await db.reembolsos.get(id);
    if (reembolso) {
        // Desmarcar la transacción origen
        await db.transacciones.update(reembolso.transaccionOrigenId, {
            esReembolsable: false,
            reembolsoId: null
        });
    }
    return await db.reembolsos.delete(id);
}

/**
 * Obtiene reembolsos con información de transacciones asociadas
 * @param {string} estado - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Array de reembolsos con datos de transacciones
 */
window.getReembolsosConTransacciones = async function(estado = null) {
    const reembolsos = await getReembolsos(estado);
    const result = [];

    for (const reembolso of reembolsos) {
        const transaccion = await db.transacciones.get(reembolso.transaccionOrigenId);
        result.push({
            ...reembolso,
            transaccion
        });
    }

    return result;
}
