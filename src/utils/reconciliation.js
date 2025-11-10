// Sistema de Reconciliación Inteligente - Finzi v3.4
// Empareja transacciones manuales (provisionales) con transacciones del CSV

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * Mide cuántos cambios (inserción, eliminación, sustitución) se necesitan
 * @param {string} a - Primer string
 * @param {string} b - Segundo string
 * @returns {number} - Distancia de Levenshtein
 */
function levenshteinDistance(a, b) {
    const matrix = [];

    // Normalizar strings: minúsculas y sin espacios extras
    const strA = a.toLowerCase().trim();
    const strB = b.toLowerCase().trim();

    // Inicializar primera columna
    for (let i = 0; i <= strB.length; i++) {
        matrix[i] = [i];
    }

    // Inicializar primera fila
    for (let j = 0; j <= strA.length; j++) {
        matrix[0][j] = j;
    }

    // Llenar la matriz
    for (let i = 1; i <= strB.length; i++) {
        for (let j = 1; j <= strA.length; j++) {
            if (strB.charAt(i - 1) === strA.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // sustitución
                    matrix[i][j - 1] + 1,     // inserción
                    matrix[i - 1][j] + 1      // eliminación
                );
            }
        }
    }

    return matrix[strB.length][strA.length];
}

/**
 * Calcula la similitud entre dos strings (0-1)
 * @param {string} a - Primer string
 * @param {string} b - Segundo string
 * @returns {number} - Similitud de 0 a 1 (1 = idéntico)
 */
function similaridadStrings(a, b) {
    if (!a || !b) return 0;

    const distance = levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);

    if (maxLength === 0) return 1;

    return 1 - (distance / maxLength);
}

/**
 * Normaliza un nombre de comercio para comparación
 * Elimina sufijos comunes, normaliza espacios, etc.
 * @param {string} comercio - Nombre del comercio
 * @returns {string} - Comercio normalizado
 */
function normalizarComercio(comercio) {
    if (!comercio) return '';

    let normalizado = comercio.toLowerCase().trim();

    // Eliminar sufijos comunes de bancos
    const sufijos = [
        ' s.a.', ' sa', ' ltda', ' spa', ' chile',
        ' inc', ' corp', ' corporation', ' company',
        ' co.', ' co', ' store', ' tienda'
    ];

    for (const sufijo of sufijos) {
        if (normalizado.endsWith(sufijo)) {
            normalizado = normalizado.slice(0, -sufijo.length).trim();
        }
    }

    // Eliminar caracteres especiales excepto espacios
    normalizado = normalizado.replace(/[^a-z0-9\s]/g, '');

    // Normalizar espacios múltiples
    normalizado = normalizado.replace(/\s+/g, ' ');

    return normalizado;
}

/**
 * Calcula la diferencia de días entre dos fechas
 * @param {string} fecha1 - Fecha en formato YYYY-MM-DD
 * @param {string} fecha2 - Fecha en formato YYYY-MM-DD
 * @returns {number} - Días de diferencia (absoluto)
 */
function diferenciaDias(fecha1, fecha2) {
    const d1 = new Date(fecha1);
    const d2 = new Date(fecha2);
    const diff = Math.abs(d1 - d2);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Calcula un score de matching entre dos transacciones
 * @param {Object} manual - Transacción manual (provisional)
 * @param {Object} csv - Transacción del CSV
 * @returns {Object} - { score: number, detalles: object }
 */
window.calcularScoreMatching = function(manual, csv) {
    const detalles = {
        comercio: 0,
        monto: 0,
        fecha: 0
    };

    // 1. Similitud de COMERCIO (70% del peso)
    const comercioManualNorm = normalizarComercio(manual.comercio);
    const comercioCsvNorm = normalizarComercio(csv.comercio);
    const similitudComercio = similaridadStrings(comercioManualNorm, comercioCsvNorm);
    detalles.comercio = Math.round(similitudComercio * 70);

    // 2. Similitud de MONTO (25% del peso)
    // Consideramos match si la diferencia es menor al 5%
    const montoManual = manual.monto;
    const montoCsv = csv.monto;
    const diferenciaMonto = Math.abs(montoManual - montoCsv);
    const porcentajeDiferencia = (diferenciaMonto / montoManual) * 100;

    if (porcentajeDiferencia === 0) {
        detalles.monto = 25; // Monto exacto
    } else if (porcentajeDiferencia <= 5) {
        detalles.monto = 20; // Diferencia menor al 5%
    } else if (porcentajeDiferencia <= 10) {
        detalles.monto = 10; // Diferencia menor al 10%
    } else {
        detalles.monto = 0; // Diferencia mayor al 10%
    }

    // 3. Similitud de FECHA (5% del peso)
    // Ventana de ±5 días
    const diasDiferencia = diferenciaDias(manual.fecha, csv.fecha);

    if (diasDiferencia === 0) {
        detalles.fecha = 5; // Misma fecha
    } else if (diasDiferencia <= 2) {
        detalles.fecha = 4; // ±2 días
    } else if (diasDiferencia <= 5) {
        detalles.fecha = 2; // ±5 días
    } else {
        detalles.fecha = 0; // Más de 5 días
    }

    // Score total
    const scoreTotal = detalles.comercio + detalles.monto + detalles.fecha;

    return {
        score: scoreTotal,
        detalles: detalles,
        similitudComercio: similitudComercio
    };
};

/**
 * Encuentra matches entre transacciones manuales y del CSV
 * @param {Array} manuales - Transacciones manuales (provisionales)
 * @param {Array} csvs - Transacciones del CSV recién cargado
 * @returns {Object} - { autoMatches, suggestedMatches, noMatches }
 */
window.encontrarMatches = function(manuales, csvs) {
    const autoMatches = []; // Score >= 85
    const suggestedMatches = []; // 70 <= Score < 85
    const noMatches = []; // Score < 70

    // Crear copia de arrays para ir eliminando matches
    const manualesRestantes = [...manuales];
    const csvsRestantes = [...csvs];

    // Para cada transacción manual, buscar el mejor match en CSV
    for (const manual of manualesRestantes) {
        let mejorMatch = null;
        let mejorScore = 0;
        let mejorIndice = -1;

        for (let i = 0; i < csvsRestantes.length; i++) {
            const csv = csvsRestantes[i];
            const resultado = window.calcularScoreMatching(manual, csv);

            if (resultado.score > mejorScore) {
                mejorScore = resultado.score;
                mejorMatch = csv;
                mejorIndice = i;
            }
        }

        // Clasificar según score
        if (mejorScore >= 85) {
            autoMatches.push({
                manual: manual,
                csv: mejorMatch,
                score: mejorScore
            });
            // Eliminar del pool de CSV para evitar matches duplicados
            csvsRestantes.splice(mejorIndice, 1);
        } else if (mejorScore >= 70) {
            suggestedMatches.push({
                manual: manual,
                csv: mejorMatch,
                score: mejorScore
            });
            // No eliminar aún, puede haber otro mejor match
        } else {
            noMatches.push({
                manual: manual,
                score: mejorScore
            });
        }
    }

    return {
        autoMatches: autoMatches,
        suggestedMatches: suggestedMatches,
        noMatches: noMatches,
        csvsSinMatch: csvsRestantes
    };
};

/**
 * Fusiona una transacción manual con una del CSV
 * La transacción del CSV es la "fuente de verdad", pero se preservan metadatos del manual
 * @param {Object} manual - Transacción manual
 * @param {Object} csv - Transacción del CSV
 * @returns {Object} - Transacción fusionada
 */
window.fusionarTransacciones = async function(manual, csv) {
    // La transacción del CSV es la fuente de verdad para datos básicos
    const fusionada = {
        ...csv,
        estado: 'confirmado',
        origen: 'csv',

        // Preservar metadatos del manual si existen
        textoOriginal: manual.textoOriginal || null,
        transaccionRelacionadaId: manual.id, // Referencia al manual original

        // Si el manual tenía categorización manual diferente, preservarla
        categoriaManual: manual.categoria !== csv.categoria ? manual.categoria : null
    };

    // Actualizar la transacción del CSV con los datos fusionados
    await db.transacciones.update(csv.id, fusionada);

    // Eliminar la transacción manual (ya quedó fusionada)
    await db.transacciones.delete(manual.id);

    return fusionada;
};

/**
 * Marca una transacción manual como "sin emparejar" (ej: pago en efectivo)
 * @param {Object} manual - Transacción manual
 * @param {string} motivo - Motivo por el cual no se empareja
 */
window.marcarSinEmparejar = async function(manual, motivo = 'No facturado') {
    await db.transacciones.update(manual.id, {
        estado: 'confirmado', // Ya no es provisional
        origen: 'manual',
        descripcion: manual.descripcion ? `${manual.descripcion} (${motivo})` : motivo
    });
};

/**
 * Ejecuta la reconciliación automática completa
 * @param {string} mesAnio - Mes en formato YYYY-MM
 * @returns {Object} - Resultado de la reconciliación
 */
window.ejecutarReconciliacion = async function(mesAnio) {
    // 1. Obtener transacciones manuales provisionales de este mes
    const todasManuales = await db.transacciones
        .where('origen')
        .equals('manual')
        .and(t => t.estado === 'provisional')
        .toArray();

    // Filtrar por mes
    const manuales = todasManuales.filter(t => {
        const fechaMes = t.fecha.substring(0, 7); // YYYY-MM
        return fechaMes === mesAnio;
    });

    // 2. Obtener transacciones del CSV recién cargado
    const mesAnioObj = await db.mesesCarga.where('mesAnio').equals(mesAnio).first();
    if (!mesAnioObj) {
        return { error: 'Mes no encontrado' };
    }

    // WORKAROUND: Usar .filter() manual en lugar de índice
    const todas = await db.transacciones.toArray();
    const csvs = todas.filter(t => t.mesAnioId === mesAnioObj.id && t.origen === 'csv');

    // 3. Encontrar matches
    const resultado = window.encontrarMatches(manuales, csvs);

    return {
        ...resultado,
        totalManuales: manuales.length,
        totalCsvs: csvs.length
    };
};
