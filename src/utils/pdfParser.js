// Parser de PDF para Estados de Cuenta - Finzi v3.5
// Extrae texto de PDFs y parsea transacciones por banco

/**
 * Extrae todo el texto de un archivo PDF
 * @param {File} file - Archivo PDF
 * @returns {Promise<string>} - Texto completo del PDF
 */
window.extractTextFromPDF = async function(file) {
    console.log('📖 [extractTextFromPDF] Iniciando extracción...');
    console.log('📁 Archivo:', file.name, file.type, file.size, 'bytes');

    try {
        // Convertir archivo a ArrayBuffer
        console.log('🔄 [extractTextFromPDF] Convirtiendo a ArrayBuffer...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('✅ ArrayBuffer creado:', arrayBuffer.byteLength, 'bytes');

        // Cargar el PDF con PDF.js
        console.log('📚 [extractTextFromPDF] Cargando PDF con PDF.js...');
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        console.log('✅ PDF cargado. Páginas:', pdf.numPages);

        let fullText = '';

        // Iterar por todas las páginas
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            console.log(`📄 [extractTextFromPDF] Procesando página ${pageNum}/${pdf.numPages}...`);
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extraer texto preservando saltos de línea
            // Detectar cambios en posición Y para insertar saltos de línea
            let lastY = null;
            let pageText = '';

            for (const item of textContent.items) {
                const currentY = item.transform[5]; // Posición Y del item

                // Si cambió la posición Y significativamente, es una nueva línea
                if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                    pageText += '\n';
                }

                pageText += item.str + ' ';
                lastY = currentY;
            }

            fullText += pageText + '\n';
            console.log(`✅ Página ${pageNum}: ${pageText.length} caracteres`);
        }

        const numLineas = fullText.split('\n').length;
        console.log('✅ [extractTextFromPDF] Extracción completa. Total:', fullText.length, 'caracteres,', numLineas, 'líneas');
        return fullText;
    } catch (error) {
        console.error('❌ [extractTextFromPDF] Error:', error);
        console.error('Stack:', error.stack);
        throw new Error('No se pudo leer el PDF. Asegúrate de que sea un PDF válido con texto seleccionable.');
    }
};

/**
 * Detecta automáticamente el banco basado en el contenido del PDF
 * @param {string} texto - Texto completo del PDF
 * @returns {string|null} - ID del banco detectado o null
 */
window.detectarBanco = function(texto) {
    console.log('🏦 Detectando banco automáticamente...');
    console.log(`📄 Primeros 500 caracteres del PDF:`);
    console.log(texto.substring(0, 500));

    const textoLower = texto.toLowerCase();

    // Patrones de detección por banco
    const patrones = {
        'santander': ['banco santander', 'santander chile', 'www.santander.cl'],
        'bci': ['banco bci', 'bci.cl', 'banco de crédito'],
        'chile': ['banco de chile', 'bancochile.cl', 'banco chile', 'edwards', 'banco edwards', 'bancoedwards'],
        'estado': ['bancoestado', 'banco estado', 'estado.cl'],
        'scotiabank': ['scotiabank', 'scotia', 'scotiabank.cl'],
        'itau': ['itaú', 'itau', 'banco itaú'],
        'security': ['banco security', 'security.cl'],
        'falabella': ['banco falabella', 'cmr falabella', 'falabella.com'],
        'ripley': ['banco ripley', 'tarjeta ripley', 'ripley.cl']
    };

    for (const [banco, keywords] of Object.entries(patrones)) {
        for (const keyword of keywords) {
            if (textoLower.includes(keyword)) {
                console.log(`✅ Banco detectado: ${banco} (palabra clave: "${keyword}")`);
                return banco;
            }
        }
    }

    console.log('⚠️ No se pudo detectar el banco automáticamente');
    return null;
};

/**
 * Normaliza un monto de texto a número
 * Maneja formatos: $1.234.567, 1234567, $1,234,567
 * @param {string} montoStr - Monto como string
 * @returns {number} - Monto como número
 */
function normalizarMonto(montoStr) {
    if (!montoStr) return 0;

    // Eliminar símbolos de moneda y espacios
    let cleaned = montoStr.replace(/[$\s]/g, '');

    // Detectar si usa punto o coma como separador decimal
    // En Chile normalmente es: 1.234.567 (punto para miles)
    // Eliminar puntos de miles
    cleaned = cleaned.replace(/\./g, '');

    // Si tiene coma, es el decimal (reemplazar por punto)
    cleaned = cleaned.replace(/,/g, '.');

    const numero = parseFloat(cleaned);
    return isNaN(numero) ? 0 : Math.abs(numero);
}

/**
 * Normaliza una fecha de texto a formato YYYY-MM-DD
 * Maneja formatos: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 * @param {string} fechaStr - Fecha como string
 * @param {number} anio - Año por defecto si no viene en la fecha
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
function normalizarFecha(fechaStr, anio = new Date().getFullYear()) {
    if (!fechaStr) return new Date().toISOString().split('T')[0];

    // Patrones de fecha: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, DD/MM
    const patterns = [
        /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,  // DD/MM/YYYY
        /(\d{1,2})[\/\-\.](\d{1,2})$/                 // DD/MM
    ];

    for (const pattern of patterns) {
        const match = fechaStr.match(pattern);
        if (match) {
            const dia = match[1].padStart(2, '0');
            const mes = match[2].padStart(2, '0');
            const year = match[3] || anio;
            return `${year}-${mes}-${dia}`;
        }
    }

    return new Date().toISOString().split('T')[0];
}

// =============================================================================
// PARSERS ESPECÍFICOS POR BANCO
// =============================================================================

/**
 * Parser genérico - intenta detectar patrones comunes
 * Formato esperado: FECHA DESCRIPCION MONTO
 */
window.parsearBancoGenerico = function(texto, mesAnio) {
    console.log('🔍 Parser Genérico - Iniciando...');
    console.log(`📄 Longitud del texto: ${texto.length} caracteres`);
    console.log(`📅 Mes/Año objetivo: ${mesAnio}`);

    const transacciones = [];

    // Separar por líneas
    const lineas = texto.split('\n');
    console.log(`📊 Total líneas a procesar: ${lineas.length}`);

    // Patrón genérico: buscar líneas con fecha y monto
    // Ejemplo: "05/11/2024 MERCADONA CHILE $45.000"
    const patron = /(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{4})?)\s+(.+?)\s+([\$\d\.,]+)/g;

    let lineasProcesadas = 0;
    let matchesEncontrados = 0;

    for (const linea of lineas) {
        lineasProcesadas++;

        // Mostrar primeras 5 líneas para debug
        if (lineasProcesadas <= 5) {
            console.log(`📝 Línea ${lineasProcesadas}: ${linea.substring(0, 100)}...`);
        }

        const matches = [...linea.matchAll(patron)];
        matchesEncontrados += matches.length;

        if (matches.length > 0 && lineasProcesadas <= 5) {
            console.log(`✅ Match genérico encontrado en línea ${lineasProcesadas}`);
        }

        for (const match of matches) {
            const fecha = normalizarFecha(match[1], parseInt(mesAnio.split('-')[0]));
            const descripcion = match[2].trim();
            const monto = normalizarMonto(match[3]);

            if (monto > 0 && descripcion.length > 2) {
                transacciones.push({
                    fecha: fecha,
                    descripcion: descripcion,
                    comercio: descripcion.substring(0, 50), // Tomar primeros 50 chars como comercio
                    monto: monto
                });
            }
        }
    }

    console.log(`📊 Resumen parser genérico:`);
    console.log(`   - Líneas procesadas: ${lineasProcesadas}`);
    console.log(`   - Matches del patrón: ${matchesEncontrados}`);
    console.log(`   - Transacciones válidas: ${transacciones.length}`);

    return transacciones;
};

/**
 * Parser para Banco Santander
 * Personaliza según el formato específico del PDF de Santander
 */
window.parsearBancoSantander = function(texto, mesAnio) {
    console.log('Usando parser de Santander');
    // Por ahora usa el genérico, se personalizará cuando tengamos un ejemplo real
    return window.parsearBancoGenerico(texto, mesAnio);
};

/**
 * Parser para Banco BCI
 * Formato: LUGAR FECHA CODIGO1 CODIGO2 DESCRIPCION TASA INT. X% $TOTAL $TOTAL CUOTA $MONTO
 * Ejemplo: SANTIAGO 31/03/25 1010 10390130 MUNICIPALIDAD LAS C TASA INT. 0,00% $332.085 $332.085 06/06 $55.350
 */
window.parsearBancoBCI = function(texto, mesAnio) {
    console.log('🔍 Parser BCI - Iniciando...');
    console.log(`📄 Longitud del texto: ${texto.length} caracteres`);

    const transacciones = [];
    const lineas = texto.split('\n');
    console.log(`📊 Total líneas a procesar: ${lineas.length}`);

    // =======================================================================
    // PASO 1: EXTRAER TOTALES RESUMEN
    // =======================================================================
    console.log('\n📊 === EXTRAYENDO TOTALES RESUMEN ===');

    const patronTotalCuotas = /TOTAL\s+COMPRAS\s+EN\s+CUOTAS\s+A\s+LA\s+CUENTA\s+\$\s*([\d\.,]+)/i;
    const patronTotalComisiones = /CARGOS?,?\s+COMISIONES?,?\s+IMPUESTOS\s+Y\s+ABONOS.*?\$\s*([\d\.,]+)/i;

    let totalCuotasEncontrado = null;
    let totalComisionesEncontrado = null;

    for (const linea of lineas) {
        const matchCuotas = linea.match(patronTotalCuotas);
        if (matchCuotas && !totalCuotasEncontrado) {
            totalCuotasEncontrado = normalizarMonto(matchCuotas[1]);
            console.log(`✅ Total Cuotas encontrado: $${totalCuotasEncontrado}`);
        }

        const matchComisiones = linea.match(patronTotalComisiones);
        if (matchComisiones && !totalComisionesEncontrado) {
            totalComisionesEncontrado = normalizarMonto(matchComisiones[1]);
            console.log(`✅ Total Comisiones encontrado: $${totalComisionesEncontrado}`);
        }
    }

    // =======================================================================
    // PASO 2: EXTRAER TRANSACCIONES DETALLADAS
    // =======================================================================
    console.log('\n💳 === EXTRAYENDO TRANSACCIONES DETALLADAS ===');

    // Patrón BCI: LUGAR FECHA CODIGO DESCRIPCION LUGAR $MONTO $MONTO CUOTA $MONTO
    // Ejemplo: "SANTIAGO   17/09/25   2209 14634522   PAYU   *UBER EATS   SANTIAGO   $33.944   $33.944   01/01   $33.944"
    const patron = /(\d{2}\/\d{2}\/\d{2})\s+\d+\s+\d+\s+(.+?)\s+\$\s*[\d\.,]+\s+\$\s*[\d\.,]+\s+(\d{2})\/(\d{2})\s+\$\s*([\d\.,]+)/i;

    let totalSpot = 0;
    let totalCuotasDetalle = 0;
    let totalComisionesDetalle = 0;

    let lineaNumero = 0;
    let lineasConFecha = 0;
    for (const linea of lineas) {
        lineaNumero++;

        // Saltar encabezados y totales
        const lineaLower = linea.toLowerCase();
        if (lineaLower.includes('fecha operación') || lineaLower.includes('total ') || lineaLower.includes('cargo')) {
            continue;
        }

        // Debug: mostrar TODAS las líneas que contienen fechas (formato DD/MM/YY)
        if (/\d{2}\/\d{2}\/\d{2}/.test(linea)) {
            lineasConFecha++;
            if (lineasConFecha <= 20) { // Mostrar las primeras 20
                console.log(`🔍 Línea ${lineaNumero}: "${linea}"`);
            }
        }

        const match = patron.exec(linea);
        if (!match) {
            // Intentar detectar comisiones (líneas especiales sin el formato estándar)
            if (lineaLower.includes('cobro') && lineaLower.includes('mensual')) {
                // Buscar: "COBRO ADM MENSUAL" o similar con monto
                const matchComision = /cobro\s+adm\s+mensual.*?\$\s*([\d\.,]+)/i.exec(linea);
                if (matchComision) {
                    const monto = normalizarMonto(matchComision[1]);

                    transacciones.push({
                        fecha: `${mesAnio}-01`,
                        descripcion: 'COBRO ADM MENSUAL',
                        comercio: 'COBRO ADM MENSUAL',
                        monto: monto,
                        cuotaActual: 1,
                        cuotasTotal: 1,
                        categoria: 'Comisiones y Seguros'
                    });

                    totalComisionesDetalle += monto;
                    console.log(`✅ Comisión: COBRO ADM MENSUAL - $${monto}`);
                }
            }
            continue;
        }

        let fechaStr = match[1];
        let descripcion = match[2] ? match[2].trim() : '';
        const cuotaActual = parseInt(match[3]);
        const cuotasTotal = parseInt(match[4]);
        let monto = normalizarMonto(match[5]);

        // Detectar si es un abono/pago (monto negativo en el PDF)
        if (linea.includes('MONTO CANCELADO') || linea.includes('$-')) {
            console.log(`⚠️ Saltando abono/pago: ${descripcion} - $${monto}`);
            continue; // Saltar abonos
        }

        // Convertir fecha DD/MM/YY a DD/MM/YYYY
        const partes = fechaStr.split('/');
        const anio = parseInt(partes[2]);
        const anioCompleto = anio >= 0 && anio <= 50 ? 2000 + anio : 1900 + anio;
        fechaStr = `${partes[0]}/${partes[1]}/${anioCompleto}`;
        const fecha = normalizarFecha(fechaStr, parseInt(mesAnio.split('-')[0]));

        // Limpiar descripción: quitar el LUGAR que aparece al final
        descripcion = descripcion.replace(/\s+(SANTIAGO|LAS CONDES|LA SERENA|PROVIDENCIA|VITACURA|LAS CONDES)$/i, '');
        descripcion = descripcion.trim();

        console.log(`✅ Transacción: ${descripcion} - $${monto} (${cuotaActual}/${cuotasTotal})`);

        if (monto > 0 && descripcion.length > 2) {
            // Detectar si es comisión por descripción
            const esComision = /cobro.*mensual|comision|seguro/i.test(descripcion);

            transacciones.push({
                fecha: fecha,
                descripcion: descripcion,
                comercio: descripcion.substring(0, 50),
                monto: monto,
                cuotaActual: cuotaActual,
                cuotasTotal: cuotasTotal,
                categoria: esComision ? 'Comisiones y Seguros' : null
            });

            if (esComision) {
                totalComisionesDetalle += monto;
            } else if (cuotasTotal === 1) {
                totalSpot += monto;
            } else {
                totalCuotasDetalle += monto;
            }
        }
    }

    // =======================================================================
    // PASO 3: AGREGAR TRANSACCIONES VIRTUALES POR DIFERENCIAS
    // =======================================================================
    console.log('\n🔄 === RECONCILIANDO TOTALES ===');
    console.log(`📊 Total Spot (detalle): $${totalSpot}`);
    console.log(`📊 Total Cuotas (detalle): $${totalCuotasDetalle}`);
    console.log(`📊 Total Comisiones (detalle): $${totalComisionesDetalle}`);
    console.log(`📊 Total Cuotas (resumen): $${totalCuotasEncontrado || 0}`);
    console.log(`📊 Total Comisiones (resumen): $${totalComisionesEncontrado || 0}`);

    // Si hay total de comisiones en resumen pero no se capturaron en detalle,
    // agregar toda la comisión como una sola transacción
    if (totalComisionesEncontrado > 0 && totalComisionesDetalle === 0) {
        console.log(`💡 Agregando comisión completa del resumen: $${totalComisionesEncontrado}`);
        transacciones.push({
            fecha: `${mesAnio}-01`,
            descripcion: 'COBRO ADM MENSUAL',
            comercio: 'COBRO ADM MENSUAL',
            monto: totalComisionesEncontrado,
            cuotaActual: 1,
            cuotasTotal: 1,
            categoria: 'Comisiones y Seguros'
        });
        totalComisionesDetalle = totalComisionesEncontrado;
    }

    const diferenciaCuotas = (totalCuotasEncontrado || 0) - totalCuotasDetalle;
    const diferenciaComisiones = (totalComisionesEncontrado || 0) - totalComisionesDetalle;

    console.log(`💡 Diferencia Cuotas: $${diferenciaCuotas}`);
    console.log(`💡 Diferencia Comisiones: $${diferenciaComisiones}`);

    if (diferenciaCuotas > 100) {
        console.log(`✅ Agregando transacción virtual por cuotas de meses anteriores: $${diferenciaCuotas}`);
        transacciones.push({
            fecha: `${mesAnio}-01`,
            descripcion: '💳 Cuotas de meses anteriores (no detalladas en PDF)',
            comercio: 'Cuotas de meses anteriores',
            monto: diferenciaCuotas,
            cuotaActual: 0,
            cuotasTotal: 0,
            categoria: null,
            esVirtual: true
        });
    }

    if (diferenciaComisiones > 10) {
        console.log(`✅ Agregando transacción virtual por comisiones adicionales: $${diferenciaComisiones}`);
        transacciones.push({
            fecha: `${mesAnio}-01`,
            descripcion: '📋 Comisiones adicionales (no detalladas en PDF)',
            comercio: 'Comisiones adicionales',
            monto: diferenciaComisiones,
            cuotaActual: 1,
            cuotasTotal: 1,
            categoria: 'Comisiones y Seguros',
            esVirtual: true
        });
    }

    console.log(`\n📊 Resumen parser BCI:`);
    console.log(`   - Transacciones detalladas: ${transacciones.filter(t => !t.esVirtual).length}`);
    console.log(`   - Transacciones virtuales: ${transacciones.filter(t => t.esVirtual).length}`);
    console.log(`   - TOTAL TRANSACCIONES: ${transacciones.length}`);
    console.log(`   - TOTAL MONTO: $${transacciones.reduce((sum, t) => sum + t.monto, 0)}`);

    if (transacciones.length === 0) {
        console.log('⚠️ Parser específico de BCI no encontró transacciones, usando genérico');
        return window.parsearBancoGenerico(texto, mesAnio);
    }

    return transacciones;
};

/**
 * Parser para Banco de Chile / Edwards
 * Formato estado de cuenta: LUGAR DD/MM/YY CODIGO DESCRIPCION LUGAR $ MONTO...
 * Ejemplo: SANTIAGO 21/09/25 220910338388 COPEC APP SANTIAGO $ 50.308 $ 50.308 01/01 $ 50.308
 *
 * NOTA: Este parser extrae TANTO las transacciones detalladas COMO los totales resumen.
 * Los totales resumen incluyen cuotas de meses anteriores que no aparecen en el detalle.
 */
window.parsearBancoChile = function(texto, mesAnio) {
    console.log('🔍 Parser Banco Chile/Edwards - Iniciando...');
    console.log(`📄 Longitud del texto: ${texto.length} caracteres`);

    const transacciones = [];
    const lineas = texto.split('\n');
    console.log(`📊 Total líneas a procesar: ${lineas.length}`);

    // =======================================================================
    // PASO 1: EXTRAER TOTALES RESUMEN (para capturar cuotas de meses anteriores)
    // =======================================================================
    console.log('\n📊 === EXTRAYENDO TOTALES RESUMEN ===');

    // Debug: Mostrar TODAS las líneas que contienen "TOTAL"
    console.log('\n🔍 Líneas con "TOTAL":');
    for (let i = 0; i < lineas.length; i++) {
        if (lineas[i].toUpperCase().includes('TOTAL')) {
            console.log(`   [${i}] ${lineas[i]}`);
        }
    }

    // Patrones para los totales resumen de Edwards
    // IMPORTANTE: Distinguir "EN CUOTAS" (plural) de "EN UNA CUOTA" (singular)
    const patronTotalCuotas = /TOTAL\s+TRANSACCIONES\s+EN\s+CUOTAS\s/i;  // Plural: varias cuotas
    const patronTotalComisiones = /TOTAL\s+CARGOS?,?\s+COMISIONES?/i;

    let totalCuotasEncontrado = null;
    let totalComisionesEncontrado = null;

    for (const linea of lineas) {
        const lineaUpper = linea.toUpperCase();

        // Buscar "TOTAL TRANSACCIONES EN CUOTAS" (plural) - NO "EN UNA CUOTA"
        if (patronTotalCuotas.test(lineaUpper) && !totalCuotasEncontrado && !lineaUpper.includes('EN UNA CUOTA')) {
            // Extraer el último monto de la línea
            const montos = [...linea.matchAll(/\$?\s*([\d\.,]+)/g)];
            if (montos.length > 0) {
                const ultimoMonto = montos[montos.length - 1][1];
                totalCuotasEncontrado = normalizarMonto(ultimoMonto);
                console.log(`✅ Total Cuotas encontrado: $${totalCuotasEncontrado}`);
                console.log(`   Línea: "${linea.trim()}"`);
            }
        }

        // Buscar total de comisiones
        if (patronTotalComisiones.test(lineaUpper) && !totalComisionesEncontrado) {
            const montos = [...linea.matchAll(/\$?\s*([\d\.,]+)/g)];
            if (montos.length > 0) {
                const ultimoMonto = montos[montos.length - 1][1];
                totalComisionesEncontrado = normalizarMonto(ultimoMonto);
                console.log(`✅ Total Comisiones encontrado: $${totalComisionesEncontrado}`);
                console.log(`   Línea: "${linea.trim()}"`);
            }
        }
    }

    // =======================================================================
    // PASO 2: EXTRAER TRANSACCIONES DETALLADAS
    // =======================================================================
    console.log('\n💳 === EXTRAYENDO TRANSACCIONES DETALLADAS ===');

    // Patrón base: FECHA CODIGO DESCRIPCION
    const patron = /(\d{2}\/\d{2}\/\d{2})\s+(\d+)\s+(.+)/;

    let lineasProcesadas = 0;
    let matchesEncontrados = 0;
    let totalSpot = 0;
    let totalCuotasDetalle = 0;
    let totalComisionesDetalle = 0;

    for (const linea of lineas) {
        lineasProcesadas++;

        // Mostrar primeras 20 líneas para debug
        if (lineasProcesadas <= 20) {
            console.log(`📝 Línea ${lineasProcesadas}: ${linea.substring(0, 100)}...`);
        }

        // Saltar líneas de encabezado, totales y secciones especiales
        const lineaLower = linea.toLowerCase();
        if (lineaLower.includes('fecha') ||
            lineaLower.includes('total ') ||
            lineaLower.includes('subtotal') ||
            lineaLower.includes('saldo ') ||
            lineaLower.includes('cupo ') ||
            lineaLower.includes('período') ||
            lineaLower.includes('monto facturado') ||
            lineaLower.includes('operación') ||
            lineaLower.includes('pagar hasta') ||
            lineaLower.includes('traspaso deuda') ||
            lineaLower.includes('pago pesos') ||
            lineaLower.includes('pago pap') ||
            lineaLower.includes('tasa int')) {
            continue;
        }

        const match = linea.match(patron);
        if (!match) continue;

        matchesEncontrados++;

        let fechaStr = match[1];
        const codigo = match[2];
        let descripcion = match[3].trim();

        // Convertir fecha DD/MM/YY a DD/MM/YYYY
        if (fechaStr.length === 8) {
            const partes = fechaStr.split('/');
            const anio = parseInt(partes[2]);
            const anioCompleto = anio >= 0 && anio <= 50 ? 2000 + anio : 1900 + anio;
            fechaStr = `${partes[0]}/${partes[1]}/${anioCompleto}`;
        }

        const fecha = normalizarFecha(fechaStr, parseInt(mesAnio.split('-')[0]));

        // Detectar cuotas y capturar el ÚLTIMO monto (monto de la cuota del mes)
        let cuotaActual = 1;
        let cuotasTotal = 1;
        let monto = 0;

        // Buscar TODOS los matches del patrón XX/YY $ MONTO y tomar el ÚLTIMO
        const allMatchesCuotas = [...linea.matchAll(/(\d{2})\/(\d{2})\s*\$\s*([\d\.,]+)/g)];

        // Debug: mostrar TODAS las transacciones
        console.log(`🔍 [${matchesEncontrados}] ${linea.substring(0, 120)}`);
        console.log(`   📦 Matches: ${allMatchesCuotas.length} | ${allMatchesCuotas.map(m => `${m[1]}/${m[2]}`).join(', ')}`);
        if (allMatchesCuotas.length > 1) {
            console.log(`   ⚠️ MÚLTIPLES MATCHES! Tomando último: ${allMatchesCuotas[allMatchesCuotas.length-1][1]}/${allMatchesCuotas[allMatchesCuotas.length-1][2]} $ ${allMatchesCuotas[allMatchesCuotas.length-1][3]}`);
        }

        if (allMatchesCuotas.length > 0) {
            // Tomar el último match (el que tiene el monto de la cuota del mes)
            const lastMatch = allMatchesCuotas[allMatchesCuotas.length - 1];
            cuotaActual = parseInt(lastMatch[1]);
            cuotasTotal = parseInt(lastMatch[2]);
            monto = normalizarMonto(lastMatch[3]);
            console.log(`📦 Cuota detectada: ${cuotaActual}/${cuotasTotal} - Monto: $${monto}`);
        } else {
            // Si no hay patrón de cuotas, buscar el primer monto en la línea
            const matchMonto = descripcion.match(/\$\s*([\d\.,]+)/);
            if (matchMonto) {
                monto = normalizarMonto(matchMonto[1]);
            }
        }

        if (monto === 0) continue;

        // Limpiar descripción: remover ubicación y montos
        descripcion = descripcion.replace(/\s+(SANTIAGO|LAS CONDES|LA SERENA|PROVIDENCIA|VITACURA|LA REINA|QUINTERO|UOA)\s/gi, ' ');
        descripcion = descripcion.replace(/\s*\$\s*[\d\.,]+/g, '');
        descripcion = descripcion.replace(/\s*\d{2}\/\d{2}\s*$/, '');
        descripcion = descripcion.replace(/TASA INT\.\s*[\d,]+%/gi, '');
        descripcion = descripcion.trim();

        // Detectar tipo de transacción
        const esDevolucion = lineaLower.includes('devol');
        const esComision = lineaLower.includes('comision') || lineaLower.includes('comisión');
        const esInteres = lineaLower.includes('interes') || lineaLower.includes('interés') || lineaLower.includes('mora');
        const esImpuesto = lineaLower.includes('impuesto');

        // Si es devolución, el monto debe ser negativo
        if (esDevolucion) {
            monto = -Math.abs(monto);
            descripcion = 'DEVOLUCIÓN - ' + descripcion;
        }

        // Categorizar automáticamente
        let categoria = null;
        if (esComision || esInteres || esImpuesto) {
            categoria = 'Comisiones y Seguros';
            if (esComision) descripcion = 'Comisión Mensual';
            else if (esInteres) descripcion = descripcion.includes('MORA') ? 'Intereses de Mora' : 'Intereses Rotativos';
            else if (esImpuesto) descripcion = 'Impuesto Decreto Ley 3475';
            totalComisionesDetalle += monto;
            console.log(`✅ Comisión detectada: ${descripcion} - $${monto} - categoria: "${categoria}"`);
        } else if (cuotasTotal > 1) {
            totalCuotasDetalle += monto;
        } else {
            totalSpot += monto;
        }

        // Filtrar: descripciones válidas y montos significativos
        if (descripcion.length > 2 && !descripcion.match(/^[\d\s]+$/)) {
            transacciones.push({
                fecha: fecha,
                descripcion: descripcion.trim(),
                comercio: descripcion.substring(0, 50).trim(),
                monto: monto,
                cuotaActual: cuotaActual,
                cuotasTotal: cuotasTotal,
                categoria: categoria
            });

            if (transacciones.length <= 5) {
                console.log(`💳 Transacción ${transacciones.length}: ${fecha} - ${descripcion} - $${monto} [${cuotaActual}/${cuotasTotal}]`);
            }
        }
    }

    // =======================================================================
    // PASO 3: AGREGAR TRANSACCIONES VIRTUALES POR DIFERENCIAS EN TOTALES
    // =======================================================================
    console.log('\n🔄 === RECONCILIANDO TOTALES ===');
    console.log(`📊 Total Spot (detalle): $${totalSpot}`);
    console.log(`📊 Total Cuotas (detalle): $${totalCuotasDetalle}`);
    console.log(`📊 Total Comisiones (detalle): $${totalComisionesDetalle}`);
    console.log(`📊 Total Cuotas (resumen): $${totalCuotasEncontrado || 0}`);
    console.log(`📊 Total Comisiones (resumen): $${totalComisionesEncontrado || 0}`);

    // Calcular diferencias
    const diferenciaCuotas = (totalCuotasEncontrado || 0) - totalCuotasDetalle;
    const diferenciaComisiones = (totalComisionesEncontrado || 0) - totalComisionesDetalle;

    console.log(`\n💡 Diferencia Cuotas: $${diferenciaCuotas}`);
    console.log(`💡 Diferencia Comisiones: $${diferenciaComisiones}`);

    // Agregar transacción virtual por cuotas de meses anteriores (si hay diferencia)
    if (diferenciaCuotas > 100) { // Solo si la diferencia es significativa (>$100)
        console.log(`✅ Agregando transacción virtual por cuotas de meses anteriores: $${diferenciaCuotas}`);
        transacciones.push({
            fecha: `${mesAnio}-01`, // Primer día del mes
            descripcion: '💳 Cuotas de meses anteriores (no detalladas en PDF)',
            comercio: 'Cuotas de meses anteriores',
            monto: diferenciaCuotas,
            cuotaActual: 0, // Marcar como "varias cuotas"
            cuotasTotal: 0,
            categoria: null,
            esVirtual: true // Flag para identificarla
        });
    }

    // Agregar transacción virtual por comisiones adicionales (si hay diferencia)
    if (diferenciaComisiones > 10) {
        console.log(`✅ Agregando transacción virtual por comisiones adicionales: $${diferenciaComisiones}`);
        transacciones.push({
            fecha: `${mesAnio}-01`,
            descripcion: '📋 Comisiones adicionales (no detalladas en PDF)',
            comercio: 'Comisiones adicionales',
            monto: diferenciaComisiones,
            cuotaActual: 1,
            cuotasTotal: 1,
            categoria: 'Comisiones y Seguros',
            esVirtual: true
        });
    }

    console.log(`\n📊 Resumen parser Edwards:`);
    console.log(`   - Líneas procesadas: ${lineasProcesadas}`);
    console.log(`   - Matches del patrón: ${matchesEncontrados}`);
    console.log(`   - Transacciones detalladas: ${transacciones.filter(t => !t.esVirtual).length}`);
    console.log(`   - Transacciones virtuales: ${transacciones.filter(t => t.esVirtual).length}`);
    console.log(`   - TOTAL TRANSACCIONES: ${transacciones.length}`);
    console.log(`   - TOTAL MONTO: $${transacciones.reduce((sum, t) => sum + t.monto, 0)}`);

    if (transacciones.length === 0) {
        console.log('⚠️ Parser específico de Edwards no encontró transacciones, usando genérico');
        return window.parsearBancoGenerico(texto, mesAnio);
    }

    return transacciones;
};

/**
 * Parser para Banco Estado
 * Personaliza según el formato específico del PDF de Banco Estado
 */
window.parsearBancoEstado = function(texto, mesAnio) {
    console.log('Usando parser de Banco Estado');
    return window.parsearBancoGenerico(texto, mesAnio);
};

/**
 * Parser para Scotiabank
 */
window.parsearBancoScotiabank = function(texto, mesAnio) {
    console.log('Usando parser de Scotiabank');
    return window.parsearBancoGenerico(texto, mesAnio);
};

/**
 * Parser para Banco Falabella (CMR)
 */
window.parsearBancoFalabella = function(texto, mesAnio) {
    console.log('Usando parser de Falabella');
    return window.parsearBancoGenerico(texto, mesAnio);
};

/**
 * Parser para Banco Ripley
 */
window.parsearBancoRipley = function(texto, mesAnio) {
    console.log('Usando parser de Ripley');
    return window.parsearBancoGenerico(texto, mesAnio);
};

/**
 * Función principal para parsear PDF según el banco
 * @param {File} file - Archivo PDF
 * @param {string} bancoId - ID del banco (o null para auto-detectar)
 * @param {string} mesAnio - Mes en formato YYYY-MM
 * @returns {Promise<Object>} - { transacciones, bancoDetectado }
 */
window.parsearPDF = async function(file, bancoId, mesAnio) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 [parsearPDF] INICIO DEL PROCESO');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📁 Archivo:', file.name, '-', file.size, 'bytes');
    console.log('🏦 Banco ID:', bancoId || 'Auto-detectar');
    console.log('📅 Mes/Año:', mesAnio);

    try {
        // 1. Extraer texto del PDF
        console.log('📄 [parsearPDF] Extrayendo texto del PDF...');
        const texto = await window.extractTextFromPDF(file);
        console.log('✅ [parsearPDF] Texto extraído:', texto.length, 'caracteres');

        if (!texto || texto.trim().length < 100) {
            throw new Error('El PDF parece estar vacío o no tiene texto extraíble. Intenta con un PDF diferente o usa el CSV.');
        }

        // 2. Detectar banco si no se especificó
        const bancoDetectado = bancoId || window.detectarBanco(texto);

        if (!bancoDetectado) {
            console.warn('No se pudo detectar el banco automáticamente, usando parser genérico');
        }

        // 3. Seleccionar parser según el banco
        const parsers = {
            'santander': window.parsearBancoSantander,
            'bci': window.parsearBancoBCI,
            'chile': window.parsearBancoChile,
            'estado': window.parsearBancoEstado,
            'scotiabank': window.parsearBancoScotiabank,
            'falabella': window.parsearBancoFalabella,
            'ripley': window.parsearBancoRipley
        };

        const parser = parsers[bancoDetectado] || window.parsearBancoGenerico;

        // 4. Parsear transacciones
        const transacciones = parser(texto, mesAnio);

        if (transacciones.length === 0) {
            throw new Error('No se encontraron transacciones en el PDF. Verifica que el formato sea correcto o usa el CSV.');
        }

        return {
            transacciones: transacciones,
            bancoDetectado: bancoDetectado,
            totalTransacciones: transacciones.length
        };

    } catch (error) {
        console.error('Error al parsear PDF:', error);
        throw error;
    }
};

/**
 * Validar que un archivo sea un PDF válido
 * @param {File} file - Archivo a validar
 * @returns {Promise<Object>} - { valido: boolean, error: string }
 */
window.validarPDF = async function(file) {
    if (!file) {
        return { valido: false, error: 'No se seleccionó ningún archivo' };
    }

    if (file.type !== 'application/pdf') {
        return { valido: false, error: 'El archivo debe ser un PDF' };
    }

    if (file.size > 10 * 1024 * 1024) { // 10 MB
        return { valido: false, error: 'El archivo es demasiado grande (máximo 10 MB)' };
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        if (pdf.numPages === 0) {
            return { valido: false, error: 'El PDF no tiene páginas' };
        }

        return { valido: true };
    } catch (error) {
        return { valido: false, error: 'El archivo PDF está corrupto o no es válido' };
    }
};
