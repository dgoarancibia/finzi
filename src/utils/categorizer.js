// Sistema de categorización inteligente con aprendizaje

/**
 * Categoriza automáticamente una transacción
 * @param {string} descripcion - Descripción de la transacción
 * @param {string} comercio - Nombre normalizado del comercio
 * @returns {string} ID de la categoría sugerida
 */
window.categorizarTransaccion = function(descripcion, comercio) {
    const texto = `${descripcion} ${comercio}`.toLowerCase();

    // 1. Buscar en categorizaciones aprendidas (match exacto por nombre)
    const categoriasAprendidas = obtenerCategoriasAprendidas();

    if (categoriasAprendidas[comercio]) {
        return categoriasAprendidas[comercio];
    }

    // 2. Buscar en patrones predefinidos
    for (const [categoria, patrones] of Object.entries(CATEGORY_PATTERNS)) {
        for (const patron of patrones) {
            if (texto.includes(patron.toLowerCase())) {
                return categoria;
            }
        }
    }

    // 3. Si no se encuentra, retornar "otros"
    return 'otros';
}

/**
 * Categoriza múltiples transacciones de forma batch
 * @param {Array} transacciones - Array de transacciones sin categoría
 * @returns {Array} Array de transacciones con categoría asignada
 */
window.categorizarLote = function(transacciones) {
    return transacciones.map(t => ({
        ...t,
        categoria: categorizarTransaccion(t.descripcion, t.comercio)
    }));
}

/**
 * Registra una corrección manual de categoría para aprendizaje
 * @param {string} comercio - Nombre exacto del comercio (sin normalización)
 * @param {string} categoriaId - ID de la categoría correcta
 */
window.aprenderCategorizacion = function(comercio, categoriaId) {
    const categorias = obtenerCategoriasAprendidas();
    categorias[comercio] = categoriaId; // Guardar con nombre exacto
    localStorage.setItem('categoriasAprendidas', JSON.stringify(categorias));
    console.log(`✅ Aprendido: "${comercio}" → ${categoriaId}`);
}

/**
 * Obtiene el diccionario de categorías aprendidas
 * @returns {Object} Diccionario { comercio: categoriaId }
 */
window.obtenerCategoriasAprendidas = function() {
    const stored = localStorage.getItem('categoriasAprendidas');
    return stored ? JSON.parse(stored) : {};
}

/**
 * Limpia el caché de categorías aprendidas
 */
window.limpiarCategoriasAprendidas = function() {
    localStorage.removeItem('categoriasAprendidas');
}

/**
 * Obtiene estadísticas de categorización
 * @returns {Object} { totalAprendidas, categoriasMasAprendidas }
 */
window.obtenerEstadisticasCategorizacion = function() {
    const categorias = obtenerCategoriasAprendidas();
    const conteo = {};

    for (const categoriaId of Object.values(categorias)) {
        conteo[categoriaId] = (conteo[categoriaId] || 0) + 1;
    }

    const categoriasMasAprendidas = Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, cantidad]) => ({ id, cantidad }));

    return {
        totalAprendidas: Object.keys(categorias).length,
        categoriasMasAprendidas
    };
}

/**
 * Sugerir categoría basada en coincidencias parciales
 * @param {string} texto - Texto a buscar
 * @param {number} limite - Cantidad máxima de sugerencias
 * @returns {Array} Array de { categoria, confianza }
 */
window.sugerirCategorias = function(texto, limite = 3) {
    const textoLower = texto.toLowerCase();
    const sugerencias = [];

    // Buscar en patrones predefinidos
    for (const [categoria, patrones] of Object.entries(CATEGORY_PATTERNS)) {
        let coincidencias = 0;

        for (const patron of patrones) {
            if (textoLower.includes(patron.toLowerCase())) {
                coincidencias++;
            }
        }

        if (coincidencias > 0) {
            const confianza = Math.min((coincidencias / patrones.length) * 100, 100);
            sugerencias.push({ categoria, confianza });
        }
    }

    // Ordenar por confianza y retornar top N
    return sugerencias
        .sort((a, b) => b.confianza - a.confianza)
        .slice(0, limite);
}

/**
 * Exportar categorías aprendidas como JSON
 * @returns {string} JSON string de las categorías
 */
window.exportarCategoriasAprendidas = function() {
    const categorias = obtenerCategoriasAprendidas();
    return JSON.stringify(categorias, null, 2);
}

/**
 * Importar categorías aprendidas desde JSON
 * @param {string} jsonString - JSON string con categorías
 * @returns {boolean} True si se importó exitosamente
 */
window.importarCategoriasAprendidas = function(jsonString) {
    try {
        const categorias = JSON.parse(jsonString);
        localStorage.setItem('categoriasAprendidas', JSON.stringify(categorias));
        return true;
    } catch (error) {
        console.error('Error al importar categorías:', error);
        return false;
    }
}
