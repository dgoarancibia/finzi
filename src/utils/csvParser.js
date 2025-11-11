// Parser de archivos CSV con PapaParse

/**
 * Parsea un archivo CSV y retorna las transacciones
 * @param {File} file - Archivo CSV
 * @returns {Promise<Array>} Array de transacciones parseadas
 */
window.parsearCSV = async function(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            delimiter: ';',
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => {
                // Normalizar nombres de columnas
                const normalizado = header.trim().toLowerCase();
                const mapeo = {
                    'fecha': 'fecha',
                    'date': 'fecha',
                    'descripcion': 'descripcion',
                    'descripción': 'descripcion',
                    'description': 'descripcion',
                    'comercio': 'descripcion',
                    'monto': 'monto',
                    'amount': 'monto',
                    'valor': 'monto',
                    'cuotas': 'cuotas',
                    'cuota': 'cuotas',
                    'installments': 'cuotas'
                };
                return mapeo[normalizado] || normalizado;
            },
            complete: (results) => {
                try {
                    const transacciones = procesarResultadosCSV(results.data);
                    resolve(transacciones);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            }
        });
    });
}

/**
 * Procesa los resultados del parser CSV
 * @param {Array} data - Datos parseados por PapaParse
 * @returns {Array} Array de transacciones normalizadas
 */
window.procesarResultadosCSV = function(data) {
    const transacciones = [];
    let filasDescartadas = 0;
    let totalMontosOriginales = 0;

    console.log(`📊 Procesando ${data.length} filas del CSV...`);

    for (const row of data) {
        // Validar que tenga los campos mínimos
        if (!row.fecha || !row.descripcion || !row.monto) {
            console.warn('Fila inválida (campos faltantes):', row);
            filasDescartadas++;
            continue;
        }

        // Normalizar fecha
        const fechaNormalizada = normalizarFecha(row.fecha);
        if (!fechaNormalizada) {
            console.warn('Fecha inválida:', row.fecha, row);
            filasDescartadas++;
            continue;
        }

        // Parsear monto
        let monto = parsearMonto(row.monto);

        // Detectar devoluciones/reembolsos y convertir a monto negativo
        const esDevolucion = detectarDevolucion(row.descripcion);
        if (esDevolucion) {
            monto = -Math.abs(monto);
            console.log(`💳 Devolución detectada: "${row.descripcion}" → monto: ${monto}`);
        }

        totalMontosOriginales += Math.abs(monto);

        if (monto === 0 || isNaN(monto)) {
            console.warn('Monto inválido:', row.monto, '-> parseado como:', monto);
            filasDescartadas++;
            continue;
        }

        // Detectar información de cuotas
        const infoCuotas = detectarCuotas(row.descripcion, row.cuotas);

        // Si infoCuotas es null, significa que es una cuota 0/X y debe excluirse
        if (infoCuotas === null) {
            console.log('⚠️  Transacción excluida (cuota 0/X):', row.descripcion);
            filasDescartadas++;
            continue;
        }

        // Normalizar nombre del comercio
        const comercioNormalizado = normalizarComercio(row.descripcion);

        // Aplicar descripción aprendida si es una compra con cuotas
        let descripcionFinal = row.descripcion.trim();
        if (infoCuotas.cuotasTotal && infoCuotas.cuotasTotal > 1) {
            const claveCompra = `${comercioNormalizado}_${infoCuotas.cuotasTotal}cuotas`.toLowerCase();
            const descripcionesAprendidas = obtenerDescripcionesAprendidas();
            if (descripcionesAprendidas[claveCompra]) {
                descripcionFinal = descripcionesAprendidas[claveCompra];
                console.log(`🎯 Aplicando descripción aprendida: "${claveCompra}" → "${descripcionFinal}"`);
            }
        }

        // Crear transacción
        const transaccion = {
            fecha: fechaNormalizada,
            descripcion: descripcionFinal,
            comercio: comercioNormalizado,
            monto: monto,
            ...infoCuotas
        };

        transacciones.push(transaccion);
    }

    // Mostrar resumen de procesamiento
    const totalProcesado = transacciones.reduce((sum, t) => sum + Math.abs(t.monto), 0);
    console.log(`✅ Procesamiento completado:`);
    console.log(`   - Total filas leídas: ${data.length}`);
    console.log(`   - Transacciones válidas: ${transacciones.length}`);
    console.log(`   - Filas descartadas: ${filasDescartadas}`);
    console.log(`   - Total montos originales: $${totalMontosOriginales.toLocaleString('es-CL')}`);
    console.log(`   - Total transacciones procesadas: $${Math.round(totalProcesado).toLocaleString('es-CL')}`);

    return transacciones;
}

/**
 * Detecta si una transacción es una devolución/reembolso
 * @param {string} descripcion - Descripción de la transacción
 * @returns {boolean} True si es una devolución
 */
window.detectarDevolucion = function(descripcion) {
    if (!descripcion) return false;

    const textoLower = descripcion.toLowerCase();

    // Palabras clave que indican devolución/reembolso
    const palabrasClave = [
        'devol',
        'devolución',
        'devolucion',
        'reembolso',
        'reverso',
        'anulacion',
        'anulación',
        'abono',
        'credito',
        'crédito',
        'nota de credito',
        'nota credito',
        'nc',
        'refund',
        'reversal',
        'chargeback'
    ];

    return palabrasClave.some(palabra => textoLower.includes(palabra));
};

/**
 * Detecta información de cuotas en la descripción o campo cuotas
 * Formatos soportados: "1/12", "2 de 6", "Cuota 3/10", etc.
 * IMPORTANTE: Si detecta "0/X", retorna null para indicar que debe excluirse
 * @param {string} descripcion - Descripción de la transacción
 * @param {string} campoCuotas - Campo cuotas del CSV (opcional)
 * @returns {Object|null} { cuotaActual, cuotasTotal, esCuotaMes } o null si es cuota 0
 */
window.detectarCuotas = function(descripcion, campoCuotas = '') {
    const texto = `${descripcion} ${campoCuotas}`.toLowerCase();

    // Patrones para detectar cuotas
    const patrones = [
        /(\d+)\s*\/\s*(\d+)/,           // 1/12
        /(\d+)\s+de\s+(\d+)/,            // 1 de 12
        /cuota\s+(\d+)\s*\/\s*(\d+)/,   // Cuota 1/12
        /cuota\s+(\d+)\s+de\s+(\d+)/,   // Cuota 1 de 12
        /cta\s+(\d+)\s*\/\s*(\d+)/,     // Cta 1/12
        /(\d+)-(\d+)/                    // 1-12
    ];

    for (const patron of patrones) {
        const match = texto.match(patron);
        if (match) {
            const cuotaActual = parseInt(match[1]);
            const cuotasTotal = parseInt(match[2]);

            // Si la cuota actual es 0, retornar null para excluir esta transacción
            if (cuotaActual === 0) {
                return null;
            }

            // Validar que sean números razonables
            if (cuotaActual > 0 && cuotasTotal > 0 && cuotaActual <= cuotasTotal && cuotasTotal <= 60) {
                return {
                    cuotaActual,
                    cuotasTotal,
                    esCuotaMes: cuotaActual === 1
                };
            }
        }
    }

    // No se detectaron cuotas - es una compra spot
    return {
        cuotaActual: null,
        cuotasTotal: null,
        esCuotaMes: false
    };
}

/**
 * Normaliza el nombre del comercio usando patrones conocidos
 * @param {string} descripcion - Descripción original
 * @returns {string} Nombre normalizado del comercio
 */
window.normalizarComercio = function(descripcion) {
    if (!descripcion) return 'Sin descripción';

    const descripcionOriginal = descripcion.trim();
    let comercio = descripcionOriginal;

    // PRIMERO: Buscar en comercios aprendidos usando descripción ORIGINAL (antes de limpiar)
    const comerciosAprendidos = obtenerComerciosAprendidos();

    // Probar con la descripción original en minúsculas
    const descripcionOriginalLower = descripcionOriginal.toLowerCase();
    if (comerciosAprendidos[descripcionOriginalLower]) {
        console.log(`🎯 Aplicando comercio aprendido: "${descripcionOriginal}" → "${comerciosAprendidos[descripcionOriginalLower]}"`);
        return comerciosAprendidos[descripcionOriginalLower];
    }

    // Remover información de cuotas del nombre
    comercio = comercio.replace(/\s*\d+\s*\/\s*\d+\s*$/i, '');
    comercio = comercio.replace(/\s*\d+\s+de\s+\d+\s*$/i, '');
    comercio = comercio.replace(/\s*cuota\s+\d+.*$/i, '');

    // Convertir a minúsculas para comparación
    const comercioLower = comercio.toLowerCase();

    // También probar con la descripción limpia (sin cuotas)
    if (comerciosAprendidos[comercioLower]) {
        console.log(`🎯 Aplicando comercio aprendido (limpio): "${comercio}" → "${comerciosAprendidos[comercioLower]}"`);
        return comerciosAprendidos[comercioLower];
    }

    // Buscar en normalizaciones conocidas
    for (const [patron, nombreEstandar] of Object.entries(COMMERCE_NORMALIZATIONS)) {
        if (comercioLower.includes(patron.toLowerCase())) {
            return nombreEstandar;
        }
    }

    // Capitalizar primera letra de cada palabra
    return comercio
        .split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Obtiene el diccionario de comercios aprendidos desde localStorage
 * @returns {Object} Diccionario { comercioOriginal: comercioNormalizado }
 */
window.obtenerComerciosAprendidos = function() {
    const stored = localStorage.getItem('comerciosAprendidos');
    return stored ? JSON.parse(stored) : {};
}

/**
 * Guarda un comercio aprendido
 * @param {string} comercioOriginal - Nombre original del comercio (descripción del CSV)
 * @param {string} comercioNormalizado - Nombre normalizado/editado
 */
window.guardarComercioAprendido = function(comercioOriginal, comercioNormalizado) {
    const comercios = obtenerComerciosAprendidos();
    const clave = comercioOriginal.toLowerCase().trim();
    comercios[clave] = comercioNormalizado;
    localStorage.setItem('comerciosAprendidos', JSON.stringify(comercios));
    console.log(`💾 Comercio guardado para aprendizaje: "${clave}" → "${comercioNormalizado}"`);
}

/**
 * Guarda una descripción aprendida para cuotas
 * @param {string} claveCompra - Clave única de la compra (comercio + total cuotas)
 * @param {string} descripcionPersonalizada - Descripción personalizada
 */
window.guardarDescripcionAprendida = function(claveCompra, descripcionPersonalizada) {
    const descripciones = obtenerDescripcionesAprendidas();
    const clave = claveCompra.toLowerCase().trim();
    descripciones[clave] = descripcionPersonalizada;
    localStorage.setItem('descripcionesAprendidas', JSON.stringify(descripciones));
    console.log(`💾 Descripción guardada para aprendizaje: "${clave}" → "${descripcionPersonalizada}"`);
}

/**
 * Obtiene el diccionario de descripciones aprendidas desde localStorage
 * @returns {Object} Diccionario { claveCompra: descripcionPersonalizada }
 */
window.obtenerDescripcionesAprendidas = function() {
    const stored = localStorage.getItem('descripcionesAprendidas');
    return stored ? JSON.parse(stored) : {};
}

/**
 * Valida el formato del CSV antes de procesar
 * @param {File} file - Archivo CSV
 * @returns {Promise<Object>} { valido, error, preview }
 */
window.validarCSV = async function(file) {
    return new Promise((resolve) => {
        Papa.parse(file, {
            delimiter: ';',
            header: true,
            preview: 5, // Solo las primeras 5 filas
            skipEmptyLines: true,
            complete: (results) => {
                const headers = results.meta.fields || [];
                const data = results.data;

                // Verificar que tenga headers
                if (headers.length === 0) {
                    resolve({
                        valido: false,
                        error: 'El archivo no tiene encabezados válidos',
                        preview: null
                    });
                    return;
                }

                // Verificar que tenga al menos 3 columnas (fecha, descripción, monto)
                if (headers.length < 3) {
                    resolve({
                        valido: false,
                        error: 'El archivo debe tener al menos 3 columnas: Fecha, Descripción y Monto',
                        preview: null
                    });
                    return;
                }

                // Verificar que tenga datos
                if (data.length === 0) {
                    resolve({
                        valido: false,
                        error: 'El archivo no contiene datos',
                        preview: null
                    });
                    return;
                }

                resolve({
                    valido: true,
                    error: null,
                    preview: data
                });
            },
            error: (error) => {
                resolve({
                    valido: false,
                    error: `Error al leer el archivo: ${error.message}`,
                    preview: null
                });
            }
        });
    });
}
