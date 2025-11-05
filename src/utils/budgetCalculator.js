// Calculadora de presupuestos y análisis de gastos

/**
 * Calcula el gasto por categoría para un conjunto de transacciones
 * @param {Array} transacciones - Array de transacciones
 * @returns {Object} Diccionario { categoriaId: montoTotal }
 */
window.calcularGastosPorCategoria = function(transacciones) {
    const gastos = {};

    for (const t of transacciones) {
        const categoria = t.categoria || 'otros';
        gastos[categoria] = (gastos[categoria] || 0) + t.monto;
    }

    return gastos;
}

/**
 * Calcula el estado del presupuesto por categoría
 * @param {Array} transacciones - Array de transacciones del mes
 * @param {Array} presupuestos - Array de presupuestos { categoria, monto }
 * @returns {Array} Array de { categoria, gastado, presupuesto, porcentaje, estado }
 */
window.calcularEstadoPresupuestos = function(transacciones, presupuestos) {
    const gastosPorCategoria = calcularGastosPorCategoria(transacciones);
    const estados = [];

    for (const presupuesto of presupuestos) {
        const gastado = gastosPorCategoria[presupuesto.categoria] || 0;
        const porcentaje = calcularPorcentaje(gastado, presupuesto.monto);
        const estado = getEstadoPresupuesto(porcentaje);

        estados.push({
            categoria: presupuesto.categoria,
            gastado,
            presupuesto: presupuesto.monto,
            disponible: presupuesto.monto - gastado,
            porcentaje,
            estado
        });
    }

    return estados;
}

/**
 * Determina el estado de un presupuesto según el porcentaje
 * @param {number} porcentaje - Porcentaje de uso
 * @returns {string} "ok", "alerta", "critico"
 */
window.getEstadoPresupuesto = function(porcentaje) {
    if (porcentaje < 70) return 'ok';
    if (porcentaje < 90) return 'alerta';
    return 'critico';
}

/**
 * Obtiene las categorías en riesgo (>70% del presupuesto)
 * @param {Array} estadosPresupuestos - Array de estados de presupuestos
 * @returns {Array} Array de categorías en riesgo
 */
window.getCategoriasEnRiesgo = function(estadosPresupuestos) {
    return estadosPresupuestos
        .filter(e => e.estado === 'alerta' || e.estado === 'critico')
        .sort((a, b) => b.porcentaje - a.porcentaje);
}

/**
 * Calcula la salud financiera general del mes
 * @param {Array} estadosPresupuestos - Array de estados de presupuestos
 * @returns {Object} { puntuacion, nivel, mensaje }
 */
window.calcularSaludFinanciera = function(estadosPresupuestos) {
    if (estadosPresupuestos.length === 0) {
        return {
            puntuacion: 100,
            nivel: 'excelente',
            mensaje: 'No hay datos suficientes para evaluar'
        };
    }

    // Calcular puntuación basada en estados
    let puntos = 0;
    let total = estadosPresupuestos.length;

    for (const estado of estadosPresupuestos) {
        if (estado.estado === 'ok') puntos += 100;
        else if (estado.estado === 'alerta') puntos += 50;
        else puntos += 0; // crítico
    }

    const puntuacion = Math.round(puntos / total);

    // Determinar nivel
    let nivel, mensaje;
    if (puntuacion >= 80) {
        nivel = 'excelente';
        mensaje = '¡Excelente control de gastos!';
    } else if (puntuacion >= 60) {
        nivel = 'bueno';
        mensaje = 'Buen manejo, pero hay margen de mejora';
    } else if (puntuacion >= 40) {
        nivel = 'regular';
        mensaje = 'Atención: varias categorías cerca del límite';
    } else {
        nivel = 'critico';
        mensaje = '¡Alerta! Múltiples presupuestos superados';
    }

    return { puntuacion, nivel, mensaje };
}

/**
 * Calcula el desglose de gastos: spot, cuotas mes, cuotas anteriores
 * @param {Array} transacciones - Array de transacciones
 * @returns {Object} { spot, cuotasMes, cuotasAnteriores, total }
 *
 * Definición de gastos spot:
 * - Sin cuotas (cuotaActual = null)
 * - O pago del mes 1/1 (cuotaActual = 1 y cuotasTotal = 1)
 */
window.calcularDesglose = function(transacciones) {
    let spot = 0;
    let cuotasMes = 0;
    let cuotasAnteriores = 0;

    for (const t of transacciones) {
        if (!t.cuotaActual || (t.cuotaActual === 1 && t.cuotasTotal === 1)) {
            // Compra spot: sin cuotas O pago del mes (1/1)
            spot += t.monto;
        } else if (t.cuotaActual === 1) {
            // Primera cuota de una compra en cuotas (1/2, 1/3, etc.)
            cuotasMes += t.monto;
        } else {
            // Cuota de compra anterior (2/12, 3/12, etc.)
            cuotasAnteriores += t.monto;
        }
    }

    return {
        spot,
        cuotasMes,
        cuotasAnteriores,
        total: spot + cuotasMes + cuotasAnteriores
    };
}

/**
 * Obtiene el top N de gastos
 * @param {Array} transacciones - Array de transacciones
 * @param {number} limite - Cantidad máxima de resultados
 * @returns {Array} Array de transacciones ordenadas por monto
 */
window.getTopGastos = function(transacciones, limite = 5) {
    return [...transacciones]
        .sort((a, b) => b.monto - a.monto)
        .slice(0, limite);
}

/**
 * Calcula estadísticas del mes
 * @param {Array} transacciones - Array de transacciones
 * @returns {Object} Estadísticas variadas
 */
window.calcularEstadisticasMes = function(transacciones) {
    if (transacciones.length === 0) {
        return {
            total: 0,
            promedio: 0,
            mediana: 0,
            minimo: 0,
            maximo: 0,
            cantidadTransacciones: 0
        };
    }

    const montos = transacciones.map(t => t.monto).sort((a, b) => a - b);
    const total = montos.reduce((sum, m) => sum + m, 0);

    return {
        total,
        promedio: total / montos.length,
        mediana: montos[Math.floor(montos.length / 2)],
        minimo: montos[0],
        maximo: montos[montos.length - 1],
        cantidadTransacciones: transacciones.length
    };
}

/**
 * Compara el mes actual con el promedio de meses anteriores
 * @param {number} totalMesActual - Total del mes actual
 * @param {Array} totalesMesesAnteriores - Array de totales de meses anteriores
 * @returns {Object} { promedioAnterior, diferencia, porcentajeDiferencia, mejor }
 */
window.compararConPromedio = function(totalMesActual, totalesMesesAnteriores) {
    if (totalesMesesAnteriores.length === 0) {
        return {
            promedioAnterior: 0,
            diferencia: 0,
            porcentajeDiferencia: 0,
            mejor: false
        };
    }

    const promedioAnterior = totalesMesesAnteriores.reduce((sum, t) => sum + t, 0) / totalesMesesAnteriores.length;
    const diferencia = totalMesActual - promedioAnterior;
    const porcentajeDiferencia = promedioAnterior > 0
        ? Math.round((diferencia / promedioAnterior) * 100)
        : 0;

    return {
        promedioAnterior,
        diferencia,
        porcentajeDiferencia,
        mejor: diferencia < 0 // Gastar menos es mejor
    };
}

/**
 * Calcula gastos por perfil
 * @param {Array} transacciones - Array de transacciones
 * @returns {Object} Diccionario { perfilId: monto }
 */
window.calcularGastosPorPerfil = function(transacciones) {
    const gastos = {};

    for (const t of transacciones) {
        const perfilId = t.perfilId || 1;
        gastos[perfilId] = (gastos[perfilId] || 0) + t.monto;
    }

    return gastos;
}

/**
 * Calcula gastos por día del mes
 * @param {Array} transacciones - Array de transacciones
 * @returns {Object} Diccionario { dia: monto }
 */
window.calcularGastosPorDia = function(transacciones) {
    const gastos = {};

    for (const t of transacciones) {
        const dia = new Date(t.fecha).getDate();
        gastos[dia] = (gastos[dia] || 0) + t.monto;
    }

    return gastos;
}

/**
 * Detecta patrones de gasto (días de más consumo, comercios frecuentes, etc.)
 * @param {Array} transacciones - Array de transacciones
 * @returns {Object} Patrones detectados
 */
window.detectarPatrones = function(transacciones) {
    // Comercios más frecuentes
    const comerciosFrecuencia = {};
    for (const t of transacciones) {
        comerciosFrecuencia[t.comercio] = (comerciosFrecuencia[t.comercio] || 0) + 1;
    }
    const topComerciosFrecuentes = Object.entries(comerciosFrecuencia)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([comercio, cantidad]) => ({ comercio, cantidad }));

    // Día de la semana con más gastos
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const gastosPorDiaSemana = {};
    for (const t of transacciones) {
        const diaSemana = new Date(t.fecha).getDay();
        gastosPorDiaSemana[diasSemana[diaSemana]] = (gastosPorDiaSemana[diasSemana[diaSemana]] || 0) + t.monto;
    }
    const diaMasGasto = Object.entries(gastosPorDiaSemana)
        .sort((a, b) => b[1] - a[1])[0];

    return {
        topComerciosFrecuentes,
        diaMasGasto: diaMasGasto ? { dia: diaMasGasto[0], monto: diaMasGasto[1] } : null
    };
}

/**
 * Calcula el disponible para gastar considerando presupuesto, gastos y cuotas futuras
 * @param {Array} transacciones - Array de transacciones del mes
 * @param {Array} presupuestos - Array de presupuestos
 * @param {Array} cuotasActivas - Array de cuotas activas que seguirán pagándose
 * @returns {Object} { disponibleTotal, disponiblePorCategoria, presupuestoTotal, gastadoTotal, cuotasProyectadas }
 */
window.calcularDisponible = function(transacciones, presupuestos, cuotasActivas = []) {
    // Calcular presupuesto total
    const presupuestoTotal = presupuestos.reduce((sum, p) => sum + p.monto, 0);

    // Calcular gastado total
    const gastadoTotal = transacciones.reduce((sum, t) => sum + t.monto, 0);

    // Calcular cuotas proyectadas (cuotas activas que seguirán pagándose este mes)
    // Solo contamos las cuotas que aún no han sido pagadas
    const cuotasProyectadas = cuotasActivas.reduce((sum, c) => {
        // Solo contar si hay cuotas restantes
        return sum + (c.cuotasRestantes > 0 ? c.montoCuota : 0);
    }, 0);

    // Calcular disponible total
    const disponibleTotal = presupuestoTotal - gastadoTotal - cuotasProyectadas;

    // Calcular disponible por categoría
    const gastosPorCategoria = calcularGastosPorCategoria(transacciones);
    const cuotasPorCategoria = {};

    // Agrupar cuotas por categoría
    for (const cuota of cuotasActivas) {
        if (cuota.cuotasRestantes > 0) {
            const categoria = cuota.categoria || 'otros';
            cuotasPorCategoria[categoria] = (cuotasPorCategoria[categoria] || 0) + cuota.montoCuota;
        }
    }

    const disponiblePorCategoria = [];

    for (const presupuesto of presupuestos) {
        const gastado = gastosPorCategoria[presupuesto.categoria] || 0;
        const cuotasProyectadasCat = cuotasPorCategoria[presupuesto.categoria] || 0;
        const disponible = presupuesto.monto - gastado - cuotasProyectadasCat;

        disponiblePorCategoria.push({
            categoria: presupuesto.categoria,
            presupuesto: presupuesto.monto,
            gastado,
            cuotasProyectadas: cuotasProyectadasCat,
            disponible,
            porcentajeUsado: calcularPorcentaje(gastado + cuotasProyectadasCat, presupuesto.monto)
        });
    }

    return {
        disponibleTotal,
        presupuestoTotal,
        gastadoTotal,
        cuotasProyectadas,
        disponiblePorCategoria: disponiblePorCategoria.sort((a, b) => b.disponible - a.disponible)
    };
}

/**
 * Calcula el balance de gastos compartidos entre dos perfiles
 * @param {Array} transacciones - Array de transacciones
 * @param {number} perfilId1 - ID del primer perfil
 * @param {number} perfilId2 - ID del segundo perfil (opcional, si null usa el primero encontrado)
 * @returns {Object} Balance compartido con totales y saldo neto
 */
window.calcularBalanceCompartido = function(transacciones, perfilId1, perfilId2 = null) {
    // Filtrar solo transacciones compartidas
    const compartidas = transacciones.filter(t => t.esCompartido);

    if (compartidas.length === 0) {
        return {
            transaccionesCompartidas: [],
            totalPerfil1: 0,
            totalPerfil2: 0,
            saldoNeto: 0,
            quienDebe: null,
            quienRecibe: null,
            cantidadTransacciones: 0
        };
    }

    let totalPerfil1 = 0;
    let totalPerfil2 = 0;
    const transaccionesCompartidas = [];

    for (const t of compartidas) {
        // Calcular cuánto corresponde a cada perfil
        const porcentaje1 = t.porcentajePerfil || 50;
        const porcentaje2 = 100 - porcentaje1;
        
        const montoPerfil1 = (t.monto * porcentaje1) / 100;
        const montoPerfil2 = (t.monto * porcentaje2) / 100;

        // Si la transacción fue pagada por perfil1
        if (t.perfilId === perfilId1) {
            totalPerfil1 += t.monto; // Pagó todo
        } 
        // Si la transacción fue pagada por perfil2
        else if (perfilId2 && t.perfilId === perfilId2) {
            totalPerfil2 += t.monto; // Pagó todo
        }
        // Si es compartida con otro perfil específico
        else if (t.perfilCompartidoId) {
            if (t.perfilCompartidoId === perfilId1) {
                totalPerfil2 += t.monto;
            } else if (perfilId2 && t.perfilCompartidoId === perfilId2) {
                totalPerfil1 += t.monto;
            }
        }

        transaccionesCompartidas.push({
            ...t,
            montoPerfil1,
            montoPerfil2,
            porcentaje1,
            porcentaje2
        });
    }

    // Calcular lo que cada uno debe pagar según porcentajes
    const debiaPagarPerfil1 = transaccionesCompartidas.reduce((sum, t) => sum + t.montoPerfil1, 0);
    const debiaPagarPerfil2 = transaccionesCompartidas.reduce((sum, t) => sum + t.montoPerfil2, 0);

    // Calcular saldo neto
    const saldoNeto = Math.abs(totalPerfil1 - debiaPagarPerfil1 - (totalPerfil2 - debiaPagarPerfil2));
    
    // Determinar quién debe a quién
    let quienDebe = null;
    let quienRecibe = null;
    
    if ((totalPerfil1 - debiaPagarPerfil1) > (totalPerfil2 - debiaPagarPerfil2)) {
        // Perfil 1 pagó más de lo que debía
        quienRecibe = perfilId1;
        quienDebe = perfilId2;
    } else if ((totalPerfil1 - debiaPagarPerfil1) < (totalPerfil2 - debiaPagarPerfil2)) {
        // Perfil 2 pagó más de lo que debía
        quienRecibe = perfilId2;
        quienDebe = perfilId1;
    }

    return {
        transaccionesCompartidas,
        totalPagadoPerfil1: totalPerfil1,
        totalPagadoPerfil2: totalPerfil2,
        debiaPagarPerfil1,
        debiaPagarPerfil2,
        saldoNeto: Math.round(saldoNeto),
        quienDebe,
        quienRecibe,
        cantidadTransacciones: compartidas.length
    };
}
