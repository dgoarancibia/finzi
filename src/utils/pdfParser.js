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
    const textoLower = texto.toLowerCase();

    // Patrones de detección por banco
    const patrones = {
        'santander': ['banco santander', 'santander chile', 'www.santander.cl'],
        'bci': ['banco bci', 'bci.cl', 'banco de crédito'],
        'chile': ['banco de chile', 'bancochile.cl', 'banco chile'],
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
                return banco;
            }
        }
    }

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
    const transacciones = [];

    // Separar por líneas
    const lineas = texto.split('\n');

    // Patrón genérico: buscar líneas con fecha y monto
    // Ejemplo: "05/11/2024 MERCADONA CHILE $45.000"
    const patron = /(\d{1,2}[\/\-\.]\d{1,2}(?:[\/\-\.]\d{4})?)\s+(.+?)\s+([\$\d\.,]+)/g;

    for (const linea of lineas) {
        const matches = [...linea.matchAll(patron)];

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
 * Personaliza según el formato específico del PDF de BCI
 */
window.parsearBancoBCI = function(texto, mesAnio) {
    console.log('Usando parser de BCI');
    // Por ahora usa el genérico, se personalizará cuando tengamos un ejemplo real
    return window.parsearBancoGenerico(texto, mesAnio);
};

/**
 * Parser para Banco de Chile
 * Personaliza según el formato específico del PDF de Banco de Chile
 */
window.parsearBancoChile = function(texto, mesAnio) {
    console.log('Usando parser de Banco de Chile');
    return window.parsearBancoGenerico(texto, mesAnio);
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
