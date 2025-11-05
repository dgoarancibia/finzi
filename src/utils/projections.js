// Proyecciones de cuotas futuras y simulación de compras

/**
 * Calcula las cuotas activas que seguirán pagándose en el futuro
 * @param {Array} transacciones - Todas las transacciones históricas
 * @param {string} mesActual - Mes actual en formato YYYY-MM
 * @returns {Array} Array de cuotas activas con proyección
 */
window.calcularCuotasActivas = function(transacciones, mesActual) {
    const cuotasActivas = [];

    // Filtrar transacciones con cuotas
    const transaccionesConCuotas = transacciones.filter(t =>
        t.cuotaActual && t.cuotasTotal && t.cuotaActual <= t.cuotasTotal
    );

    // Agrupar por comercio + descripción + monto (para identificar la misma compra)
    const comprasAgrupadas = {};

    for (const t of transaccionesConCuotas) {
        const key = `${t.comercio}-${t.monto}-${t.cuotasTotal}`;

        if (!comprasAgrupadas[key]) {
            comprasAgrupadas[key] = {
                comercio: t.comercio,
                descripcion: t.descripcion,
                montoCuota: t.monto,
                montoTotal: t.monto * t.cuotasTotal,
                cuotaActual: t.cuotaActual,
                cuotasTotal: t.cuotasTotal,
                cuotasRestantes: t.cuotasTotal - t.cuotaActual,
                fechaPrimeraCuota: t.fecha,
                categoria: t.categoria,
                perfilId: t.perfilId
            };
        } else {
            // Si encontramos otra cuota de la misma compra, actualizar info
            if (t.cuotaActual > comprasAgrupadas[key].cuotaActual) {
                comprasAgrupadas[key].cuotaActual = t.cuotaActual;
                comprasAgrupadas[key].cuotasRestantes = t.cuotasTotal - t.cuotaActual;
            }
        }
    }

    // Convertir a array y filtrar las que aún tienen cuotas pendientes
    for (const compra of Object.values(comprasAgrupadas)) {
        if (compra.cuotasRestantes > 0) {
            cuotasActivas.push(compra);
        }
    }

    return cuotasActivas.sort((a, b) => b.montoCuota - a.montoCuota);
}

/**
 * Proyecta los gastos de los próximos N meses
 * @param {Array} cuotasActivas - Array de cuotas activas
 * @param {Array} recurrentes - Array de transacciones recurrentes
 * @param {Array} comprasPlaneadas - Array de compras planeadas
 * @param {string} mesInicio - Mes de inicio en formato YYYY-MM
 * @param {number} meses - Cantidad de meses a proyectar
 * @returns {Array} Array de proyecciones por mes
 */
async function proyectarGastosFuturos(cuotasActivas, recurrentes, comprasPlaneadas, mesInicio, meses = 12) {
    const proyecciones = [];
    const mesesArray = generarMesesAdelante(meses, mesInicio);

    for (let i = 0; i < meses; i++) {
        const mes = mesesArray[i];
        let totalCuotas = 0;
        let totalRecurrentes = 0;
        let totalComprasPlaneadas = 0;

        // Calcular cuotas activas para este mes
        for (const cuota of cuotasActivas) {
            if (i < cuota.cuotasRestantes) {
                totalCuotas += cuota.montoCuota;
            }
        }

        // Calcular recurrentes
        for (const rec of recurrentes) {
            if (rec.activa) {
                // Usar el monto estimado o el promedio del historial
                const historial = await getHistorialRecurrente(rec.id, 6);
                const monto = historial.length > 0
                    ? historial.reduce((sum, h) => sum + h.monto, 0) / historial.length
                    : rec.montoEstimado;

                totalRecurrentes += monto;
            }
        }

        // Calcular compras planeadas (solo para meses donde apliquen)
        for (const compra of comprasPlaneadas) {
            if (i === 0) {
                // En el primer mes, agregar todas las cuotas planeadas
                totalComprasPlaneadas += compra.monto / compra.cuotas;
            } else if (i < compra.cuotas) {
                totalComprasPlaneadas += compra.monto / compra.cuotas;
            }
        }

        proyecciones.push({
            mes,
            mesNombre: getNombreMes(mes),
            cuotas: totalCuotas,
            recurrentes: totalRecurrentes,
            comprasPlaneadas: totalComprasPlaneadas,
            total: totalCuotas + totalRecurrentes + totalComprasPlaneadas
        });
    }

    return proyecciones;
}

/**
 * Simula el impacto de una nueva compra en cuotas
 * @param {number} montoTotal - Monto total de la compra
 * @param {number} cuotas - Cantidad de cuotas
 * @param {Array} proyeccionActual - Proyección sin la nueva compra
 * @param {number} presupuestoMensual - Presupuesto mensual promedio
 * @returns {Object} Análisis de la simulación
 */
window.simularNuevaCompra = function(montoTotal, cuotas, proyeccionActual, presupuestoMensual) {
    const montoCuota = montoTotal / cuotas;

    // Crear nueva proyección con la compra
    const proyeccionConCompra = proyeccionActual.map((mes, i) => {
        if (i < cuotas) {
            return {
                ...mes,
                total: mes.total + montoCuota,
                nuevaCompra: montoCuota
            };
        }
        return {
            ...mes,
            nuevaCompra: 0
        };
    });

    // Análisis de impacto
    const mesesExcedidos = proyeccionConCompra.filter(m => m.total > presupuestoMensual).length;
    const excedenteMayor = Math.max(...proyeccionConCompra.map(m =>
        m.total > presupuestoMensual ? m.total - presupuestoMensual : 0
    ));

    // Recomendación
    let recomendacion, nivelRiesgo;

    if (mesesExcedidos === 0) {
        recomendacion = 'Compra viable. No supera el presupuesto mensual.';
        nivelRiesgo = 'bajo';
    } else if (mesesExcedidos <= cuotas / 3) {
        recomendacion = 'Compra riesgosa. Algunos meses superarán el presupuesto.';
        nivelRiesgo = 'medio';
    } else {
        recomendacion = 'Compra no recomendada. Supera el presupuesto en la mayoría de meses.';
        nivelRiesgo = 'alto';
    }

    return {
        proyeccionConCompra,
        montoCuota,
        mesesExcedidos,
        excedenteMayor,
        recomendacion,
        nivelRiesgo
    };
}

/**
 * Calcula el impacto de recurrentes pendientes
 * @param {Array} recurrentes - Array de recurrentes activas
 * @param {string} mesActual - Mes actual en formato YYYY-MM
 * @returns {Array} Array de recurrentes pendientes de pago
 */
async function calcularRecurrentesPendientes(recurrentes, mesActual) {
    const pendientes = [];

    for (const rec of recurrentes) {
        if (!rec.activa) continue;

        // Verificar si ya se pagó este mes
        const historial = await db.historialRecurrentes
            .where('recurrenteId')
            .equals(rec.id)
            .toArray();

        const yaRegistrado = historial.some(h => h.mesAnio === mesActual);

        if (!yaRegistrado) {
            pendientes.push({
                ...rec,
                montoEstimado: rec.montoEstimado
            });
        }
    }

    return pendientes;
}

/**
 * Calcula tendencia histórica de gastos
 * @param {Array} mesesCargados - Array de meses con datos
 * @param {number} cantidadMeses - Cantidad de meses a analizar
 * @returns {Promise<Array>} Array de { mes, total, spot, cuotas, recurrentes }
 */
async function calcularTendenciaHistorica(mesesCargados, cantidadMeses = 6) {
    const tendencia = [];

    // Ordenar meses de más reciente a más antiguo
    const mesesOrdenados = [...mesesCargados]
        .sort((a, b) => b.mesAnio.localeCompare(a.mesAnio))
        .slice(0, cantidadMeses);

    for (const mes of mesesOrdenados) {
        const transacciones = await getTransaccionesByMes(mes.id);
        const desglose = calcularDesglose(transacciones);

        // Calcular recurrentes registradas para ese mes
        const historialRec = await db.historialRecurrentes
            .where('mesAnio')
            .equals(mes.mesAnio)
            .toArray();

        const totalRecurrentes = historialRec.reduce((sum, h) => sum + h.monto, 0);

        tendencia.push({
            mes: mes.mesAnio,
            mesNombre: getNombreMes(mes.mesAnio),
            total: desglose.total,
            spot: desglose.spot,
            cuotas: desglose.cuotasMes + desglose.cuotasAnteriores,
            recurrentes: totalRecurrentes
        });
    }

    // Invertir para mostrar de más antiguo a más reciente
    return tendencia.reverse();
}

/**
 * Predice gastos del próximo mes basándose en historial
 * @param {Array} tendenciaHistorica - Array de tendencia histórica
 * @returns {Object} { prediccion, confianza, rango }
 */
window.predecirGastoProximoMes = function(tendenciaHistorica) {
    if (tendenciaHistorica.length === 0) {
        return {
            prediccion: 0,
            confianza: 0,
            rango: { min: 0, max: 0 }
        };
    }

    // Calcular promedio simple
    const totales = tendenciaHistorica.map(t => t.total);
    const promedio = totales.reduce((sum, t) => sum + t, 0) / totales.length;

    // Calcular desviación estándar
    const varianza = totales.reduce((sum, t) => sum + Math.pow(t - promedio, 2), 0) / totales.length;
    const desviacion = Math.sqrt(varianza);

    // Confianza: mayor con más datos y menor desviación
    const confianza = Math.min(
        (tendenciaHistorica.length / 6) * 100 * (1 - Math.min(desviacion / promedio, 1)),
        100
    );

    return {
        prediccion: Math.round(promedio),
        confianza: Math.round(confianza),
        rango: {
            min: Math.round(promedio - desviacion),
            max: Math.round(promedio + desviacion)
        }
    };
}

/**
 * Calcula el "costo de oportunidad" de una compra en cuotas vs ahorro
 * @param {number} montoTotal - Monto total de la compra
 * @param {number} cuotas - Cantidad de cuotas
 * @param {number} tasaInteres - Tasa de interés anual del crédito (%)
 * @param {number} tasaAhorro - Tasa de interés anual de ahorro (%)
 * @returns {Object} Análisis del costo de oportunidad
 */
window.calcularCostoOportunidad = function(montoTotal, cuotas, tasaInteres = 0, tasaAhorro = 5) {
    const tasaMensualCredito = tasaInteres / 12 / 100;
    const tasaMensualAhorro = tasaAhorro / 12 / 100;

    // Calcular cuota con interés (si aplica)
    let montoCuota;
    let totalPagado;

    if (tasaInteres > 0) {
        // Fórmula de cuota con interés
        montoCuota = montoTotal * (tasaMensualCredito * Math.pow(1 + tasaMensualCredito, cuotas)) /
            (Math.pow(1 + tasaMensualCredito, cuotas) - 1);
        totalPagado = montoCuota * cuotas;
    } else {
        // Sin interés
        montoCuota = montoTotal / cuotas;
        totalPagado = montoTotal;
    }

    // Calcular valor futuro si se ahorrara el dinero
    let valorFuturoAhorro = 0;
    for (let i = 0; i < cuotas; i++) {
        valorFuturoAhorro += montoCuota * Math.pow(1 + tasaMensualAhorro, cuotas - i);
    }

    const costoOportunidad = valorFuturoAhorro - totalPagado;

    return {
        montoCuota: Math.round(montoCuota),
        totalPagado: Math.round(totalPagado),
        interesesPagados: Math.round(totalPagado - montoTotal),
        valorFuturoAhorro: Math.round(valorFuturoAhorro),
        costoOportunidad: Math.round(costoOportunidad)
    };
}
