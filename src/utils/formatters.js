// Utilidades para formateo de números y fechas

/**
 * Formatea un número a formato chileno con punto como separador de miles
 * @param {number} valor - Número a formatear
 * @param {boolean} incluirSigno - Si incluir el signo $ (default: true)
 * @returns {string} Número formateado
 */
window.formatearMonto = function(valor, incluirSigno = true) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return incluirSigno ? '$0' : '0';
    }

    const numero = Math.round(valor);
    const formateado = numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return incluirSigno ? `$${formateado}` : formateado;
}

/**
 * Convierte un string con formato chileno a número
 * @param {string} montoStr - String con formato "$123.456" o "123.456"
 * @returns {number} Número parseado
 */
window.parsearMonto = function(montoStr) {
    if (typeof montoStr === 'number') return montoStr;
    if (!montoStr) return 0;

    // Remover $ y espacios
    let str = montoStr.toString().replace(/\$/g, '').trim();

    // Remover puntos (separadores de miles)
    str = str.replace(/\./g, '');

    // Reemplazar coma por punto (si hay decimales)
    str = str.replace(/,/g, '.');

    return parseFloat(str) || 0;
}

/**
 * Formatea una fecha a formato legible en español
 * @param {string|Date} fecha - Fecha a formatear
 * @param {string} formato - "corto", "largo", "mes" (default: "corto")
 * @returns {string} Fecha formateada
 */
window.formatearFecha = function(fecha, formato = 'corto') {
    if (!fecha) return '';

    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;

    const opciones = {
        corto: { day: '2-digit', month: '2-digit', year: 'numeric' },
        largo: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        mes: { year: 'numeric', month: 'long' }
    };

    return date.toLocaleDateString('es-CL', opciones[formato] || opciones.corto);
}

/**
 * Convierte fecha string a formato YYYY-MM-DD
 * @param {string} fechaStr - Fecha en formato DD/MM/YYYY, DD-MM-YYYY, etc.
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
window.normalizarFecha = function(fechaStr) {
    if (!fechaStr) return null;

    // Si ya está en formato ISO, retornar
    if (/^\d{4}-\d{2}-\d{2}/.test(fechaStr)) {
        return fechaStr.split('T')[0];
    }

    // Intentar parsear formatos comunes
    let match;

    // DD/MM/YYYY o DD-MM-YYYY (año con 4 dígitos)
    match = fechaStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (match) {
        const [, dia, mes, anio] = match;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // DD/MM/YY o DD-MM-YY (año con 2 dígitos)
    match = fechaStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
    if (match) {
        const [, dia, mes, anioCorto] = match;
        // Convertir año de 2 dígitos a 4 dígitos
        // Si es <= 50, asumimos 20XX, si es > 50, asumimos 19XX
        const anio = parseInt(anioCorto) <= 50 ? `20${anioCorto}` : `19${anioCorto}`;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // YYYY/MM/DD o YYYY-MM-DD
    match = fechaStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (match) {
        const [, anio, mes, dia] = match;
        return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Si no se puede parsear, intentar con Date
    try {
        const date = new Date(fechaStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.error('Error al parsear fecha:', fechaStr);
    }

    return null;
}

/**
 * Obtiene el formato YYYY-MM de una fecha
 * @param {string|Date} fecha - Fecha
 * @returns {string} Formato YYYY-MM
 */
window.getMesAnio = function(fecha) {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

/**
 * Obtiene el nombre del mes en español
 * @param {string} mesAnio - Formato YYYY-MM
 * @returns {string} Nombre del mes y año
 */
window.getNombreMes = function(mesAnio) {
    if (!mesAnio) return '';

    const [year, month] = mesAnio.split('-');
    const date = new Date(year, parseInt(month) - 1, 1);

    return date.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
}

/**
 * Calcula el porcentaje de uso de presupuesto
 * @param {number} gastado - Monto gastado
 * @param {number} presupuesto - Presupuesto total
 * @returns {number} Porcentaje (0-100)
 */
window.calcularPorcentaje = function(gastado, presupuesto) {
    if (!presupuesto || presupuesto === 0) return 0;
    return Math.min(Math.round((gastado / presupuesto) * 100), 100);
}

/**
 * Obtiene el color del semáforo según porcentaje
 * @param {number} porcentaje - Porcentaje de uso
 * @returns {Object} { color, bgColor, textColor }
 */
window.getColorSemaforo = function(porcentaje) {
    if (porcentaje < 70) {
        return {
            color: '#10b981',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            borderColor: 'border-green-300'
        };
    } else if (porcentaje < 90) {
        return {
            color: '#f59e0b',
            bgColor: 'bg-yellow-100',
            textColor: 'text-yellow-700',
            borderColor: 'border-yellow-300'
        };
    } else {
        return {
            color: '#ef4444',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
            borderColor: 'border-red-300'
        };
    }
}

/**
 * Genera un array de meses hacia atrás
 * @param {number} cantidad - Cantidad de meses
 * @param {string} desde - Mes inicial en formato YYYY-MM (default: mes actual)
 * @returns {Array} Array de strings YYYY-MM
 */
window.generarMesesAtras = function(cantidad, desde = null) {
    const meses = [];
    const fechaInicio = desde ? new Date(desde + '-01') : new Date();

    for (let i = 0; i < cantidad; i++) {
        const fecha = new Date(fechaInicio);
        fecha.setMonth(fecha.getMonth() - i);
        meses.push(getMesAnio(fecha));
    }

    return meses;
}

/**
 * Genera un array de meses hacia adelante
 * @param {number} cantidad - Cantidad de meses
 * @param {string} desde - Mes inicial en formato YYYY-MM (default: mes actual)
 * @returns {Array} Array de strings YYYY-MM
 */
window.generarMesesAdelante = function(cantidad, desde = null) {
    const meses = [];
    const fechaInicio = desde ? new Date(desde + '-01') : new Date();

    for (let i = 0; i < cantidad; i++) {
        const fecha = new Date(fechaInicio);
        fecha.setMonth(fecha.getMonth() + i);
        meses.push(getMesAnio(fecha));
    }

    return meses;
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} texto - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado con "..."
 */
window.truncarTexto = function(texto, maxLength = 30) {
    if (!texto) return '';
    if (texto.length <= maxLength) return texto;
    return texto.substring(0, maxLength - 3) + '...';
}
