// Parser de PDF para Estados de Cuenta - Finzi v3.5
// Extrae texto de PDFs y parsea transacciones por banco

/**
 * Extrae todo el texto de un archivo PDF
 * @param {File} file - Archivo PDF
 * @returns {Promise<string>} - Texto completo del PDF
 */
window.extractTextFromPDF = async function(file) {
    try {
        // Convertir archivo a ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();

        // Cargar el PDF con PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        // Iterar por todas las páginas
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Extraer texto de cada item
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');

            fullText += pageText + '\n';
        }

        return fullText;
    } catch (error) {
        console.error('Error al extraer texto del PDF:', error);
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
 * Formato tabular: LUGAR FECHA CODIGO DESCRIPCION LUGAR $ MONTO $ MONTO CUOTA $ MONTO
 * Ejemplo: SANTIAGO 17/09/25 2209 14634522 PAYU *UBER EATS SANTIAGO $33.944 $33.944 01/01 $33.944
 */
window.parsearBancoBCI = function(texto, mesAnio) {
    console.log('🔍 Parser BCI - Iniciando...');
    console.log(`📄 Longitud del texto: ${texto.length} caracteres`);
    console.log(`📅 Mes/Año objetivo: ${mesAnio}`);

    const transacciones = [];
    const lineas = texto.split('\n');
    console.log(`📊 Total líneas a procesar: ${lineas.length}`);

    // Patrón para BCI: fecha DD/MM/YY, dos códigos, descripción completa hasta el primer $
    // Ejemplo: SANTIAGO 17/09/25 2209 14634522 PAYU *UBER EATS SANTIAGO $33.944 $33.944 01/01 $33.944
    const patron = /(\d{2}\/\d{2}\/\d{2,4})\s+\d+\s+\d+\s+(.+?)\s+\$\s*([\d\.]+)/gi;

    let lineasProcesadas = 0;
    let lineasDescartadas = 0;
    let matchesEncontrados = 0;

    for (const linea of lineas) {
        lineasProcesadas++;

        // Mostrar primeras 5 líneas para debug
        if (lineasProcesadas <= 5) {
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
            lineaLower.includes('monto cancelado') ||
            lineaLower.includes('tasa int')) {
            lineasDescartadas++;
            continue;
        }

        const matches = [...linea.matchAll(patron)];
        matchesEncontrados += matches.length;

        if (matches.length > 0 && lineasProcesadas <= 5) {
            console.log(`✅ Match encontrado en línea ${lineasProcesadas}`);
        }

        for (const match of matches) {
            let fechaStr = match[1];
            let descripcion = match[2].trim();
            const monto = normalizarMonto(match[3]);

            // Convertir fecha DD/MM/YY a DD/MM/YYYY
            if (fechaStr.length === 8) { // DD/MM/YY
                const partes = fechaStr.split('/');
                const anio = parseInt(partes[2]);
                const anioCompleto = anio >= 0 && anio <= 50 ? 2000 + anio : 1900 + anio;
                fechaStr = `${partes[0]}/${partes[1]}/${anioCompleto}`;
            }

            const fecha = normalizarFecha(fechaStr, parseInt(mesAnio.split('-')[0]));

            // Limpiar descripción: puede tener ubicación al final
            descripcion = descripcion.replace(/\s+(SANTIAGO|LAS CONDES|LA SERENA|PROVIDENCIA|CHILE|VITACURA|LA REINA)$/i, '');

            // Filtrar transacciones que no son gastos (solo montos positivos)
            if (monto > 0 && descripcion.length > 3 && !descripcion.match(/^[\d\s]+$/)) {
                transacciones.push({
                    fecha: fecha,
                    descripcion: descripcion,
                    comercio: descripcion.substring(0, 50),
                    monto: monto
                });
            }
        }
    }

    console.log(`📊 Resumen parser BCI:`);
    console.log(`   - Líneas procesadas: ${lineasProcesadas}`);
    console.log(`   - Líneas descartadas: ${lineasDescartadas}`);
    console.log(`   - Matches del patrón: ${matchesEncontrados}`);
    console.log(`   - Transacciones válidas: ${transacciones.length}`);

    // Si no encontró nada con el patrón específico, usar genérico como fallback
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
 */
window.parsearBancoChile = function(texto, mesAnio) {
    console.log('🔍 Parser Banco Chile/Edwards - Iniciando...');
    console.log(`📄 Longitud del texto: ${texto.length} caracteres`);

    const transacciones = [];
    const lineas = texto.split('\n');
    console.log(`📊 Total líneas a procesar: ${lineas.length}`);

    // Patrón mejorado para Edwards estado de cuenta
    // Captura: LUGAR (opcional) FECHA CODIGO DESCRIPCION ... $ MONTO
    const patron = /(?:^|\s)(\d{2}\/\d{2}\/\d{2})\s+(\d+)\s+(.+?)\s+\$\s*([\d\.,]+)/g;

    let lineasProcesadas = 0;
    let matchesEncontrados = 0;

    for (const linea of lineas) {
        lineasProcesadas++;

        // Mostrar primeras 10 líneas para debug
        if (lineasProcesadas <= 10) {
            console.log(`📝 Línea ${lineasProcesadas}: ${linea.substring(0, 120)}...`);
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
            lineaLower.includes('impuesto decreto') ||
            lineaLower.includes('comision mensual') ||
            lineaLower.includes('intereses rotativo') ||
            lineaLower.includes('intereses de mora') ||
            lineaLower.includes('traspaso deuda') ||
            lineaLower.includes('devol. pago') ||
            lineaLower.includes('pago pesos') ||
            lineaLower.includes('pago pap') ||
            lineaLower.includes('tasa int')) {
            continue;
        }

        const matches = [...linea.matchAll(patron)];
        matchesEncontrados += matches.length;

        if (matches.length > 0 && lineasProcesadas <= 10) {
            console.log(`✅ Match encontrado en línea ${lineasProcesadas}: ${matches.length} coincidencias`);
        }

        for (const match of matches) {
            let fechaStr = match[1];
            const codigo = match[2];
            let descripcion = match[3].trim();
            const monto = normalizarMonto(match[4]);

            // Convertir fecha DD/MM/YY a DD/MM/YYYY
            if (fechaStr.length === 8) { // DD/MM/YY
                const partes = fechaStr.split('/');
                const anio = parseInt(partes[2]);
                const anioCompleto = anio >= 0 && anio <= 50 ? 2000 + anio : 1900 + anio;
                fechaStr = `${partes[0]}/${partes[1]}/${anioCompleto}`;
            }

            const fecha = normalizarFecha(fechaStr, parseInt(mesAnio.split('-')[0]));

            // Limpiar descripción: remover ubicación repetida al final
            descripcion = descripcion.replace(/\s+(SANTIAGO|LAS CONDES|LA SERENA|PROVIDENCIA|VITACURA|LA REINA|QUINTERO|UOA)\s*$/i, '');

            // Remover montos duplicados y cuotas que aparezcan en la descripción
            descripcion = descripcion.replace(/\s+\$\s*[\d\.,]+.*$/g, '');

            // Filtrar: solo montos positivos mayores a 100 (para evitar impuestos pequeños)
            // y descripciones válidas (no solo números)
            if (monto > 100 && descripcion.length > 3 && !descripcion.match(/^[\d\s]+$/)) {
                transacciones.push({
                    fecha: fecha,
                    descripcion: descripcion.trim(),
                    comercio: descripcion.substring(0, 50).trim(),
                    monto: monto
                });

                if (transacciones.length <= 5) {
                    console.log(`💳 Transacción ${transacciones.length}: ${fecha} - ${descripcion} - $${monto}`);
                }
            }
        }
    }

    console.log(`📊 Resumen parser Edwards:`);
    console.log(`   - Líneas procesadas: ${lineasProcesadas}`);
    console.log(`   - Matches del patrón: ${matchesEncontrados}`);
    console.log(`   - Transacciones válidas: ${transacciones.length}`);

    // Si no encontró nada con el patrón específico, usar genérico como fallback
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
    try {
        // 1. Extraer texto del PDF
        const texto = await window.extractTextFromPDF(file);

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
