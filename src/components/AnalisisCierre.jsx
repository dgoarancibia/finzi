// Componente Análisis de Cierre - Proyección, Comparativa e Insights

const AnalisisCierre = () => {
    const { selectedMonth, mesesCargados, categorias } = useApp();
    const [transaccionesActuales, setTransaccionesActuales] = useState([]);
    const [transaccionesAnteriores, setTransaccionesAnteriores] = useState([]);
    const [recurrentes, setRecurrentes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedMonth) {
            cargarDatos();
        }
    }, [selectedMonth]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            // Cargar transacciones del mes actual
            const transActuales = await getTransaccionesByMes(selectedMonth.id);
            setTransaccionesActuales(transActuales);

            // Cargar transacciones del mes anterior
            const mesAnterior = obtenerMesAnterior(selectedMonth.mesAnio);
            const mesAnteriorObj = mesesCargados.find(m => m.mesAnio === mesAnterior);
            if (mesAnteriorObj) {
                const transAnteriores = await getTransaccionesByMes(mesAnteriorObj.id);
                setTransaccionesAnteriores(transAnteriores);
            } else {
                setTransaccionesAnteriores([]);
            }

            // Cargar recurrentes
            const rec = await getRecurrentes();
            setRecurrentes(rec);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Obtener mes anterior en formato YYYY-MM
    const obtenerMesAnterior = (mesAnio) => {
        const [year, month] = mesAnio.split('-').map(Number);
        const fecha = new Date(year, month - 1, 1);
        fecha.setMonth(fecha.getMonth() - 1);
        const nuevoYear = fecha.getFullYear();
        const nuevoMes = String(fecha.getMonth() + 1).padStart(2, '0');
        return `${nuevoYear}-${nuevoMes}`;
    };

    // Obtener mes siguiente
    const obtenerMesSiguiente = (mesAnio) => {
        const [year, month] = mesAnio.split('-').map(Number);
        const fecha = new Date(year, month - 1, 1);
        fecha.setMonth(fecha.getMonth() + 1);
        const nuevoYear = fecha.getFullYear();
        const nuevoMes = String(fecha.getMonth() + 1).padStart(2, '0');
        return `${nuevoYear}-${nuevoMes}`;
    };

    if (!selectedMonth) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📊 Análisis de Cierre</h1>
                    <p className="text-gray-600">Proyecciones e insights de tus gastos</p>
                </div>
                <EmptyState
                    icon="📅"
                    title="Selecciona un mes"
                    description="Para ver el análisis de cierre, primero debes tener un mes cargado."
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">📊 Análisis de Cierre</h1>
                    <p className="text-gray-600">Proyecciones e insights de tus gastos</p>
                </div>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-900 text-xl font-semibold">Cargando análisis...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">📊 Análisis de Cierre</h1>
                <p className="text-gray-600">
                    {selectedMonth ? `Análisis de ${getNombreMes(selectedMonth.mesAnio)}` : 'Proyecciones e insights'}
                </p>
            </div>

            {/* C. Proyección Próximo Mes */}
            <ProyeccionProximoMes
                mesActual={selectedMonth.mesAnio}
                transaccionesActuales={transaccionesActuales}
                recurrentes={recurrentes}
                categorias={categorias}
            />

            {/* A. Comparativa Mensual */}
            {transaccionesAnteriores.length > 0 && (
                <ComparativaMensual
                    transaccionesActuales={transaccionesActuales}
                    transaccionesAnteriores={transaccionesAnteriores}
                    mesActual={selectedMonth.mesAnio}
                    categorias={categorias}
                />
            )}

            {/* D. Top Insights */}
            <TopInsights
                transacciones={transaccionesActuales}
                transaccionesAnteriores={transaccionesAnteriores}
                categorias={categorias}
            />
        </div>
    );
};

// Componente: Proyección Próximo Mes
const ProyeccionProximoMes = memo(({ mesActual, transaccionesActuales, recurrentes, categorias }) => {
    // Calcular cuotas comprometidas para el próximo mes
    const cuotasProyectadas = useMemo(() => {
        return calcularCuotasActivas(transaccionesActuales, mesActual)
            .reduce((sum, cuota) => sum + cuota.montoCuota, 0);
    }, [transaccionesActuales, mesActual]);

    // Calcular gastos recurrentes
    const gastosRecurrentes = useMemo(() => {
        return recurrentes
            .filter(r => r.activo)
            .reduce((sum, r) => sum + r.monto, 0);
    }, [recurrentes]);

    // Estimar gasto spot basado en promedio de últimos meses
    const estimadoSpot = useMemo(() => {
        const spot = transaccionesActuales.filter(t =>
            !t.cuotaActual || (t.cuotaActual === 1 && t.cuotasTotal === 1)
        );
        return spot.reduce((sum, t) => sum + t.monto, 0);
    }, [transaccionesActuales]);

    const totalProyectado = cuotasProyectadas + gastosRecurrentes + estimadoSpot;

    return (
        <Card title="🔮 Proyección Próximo Mes" icon="🔮">
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
                    <p className="text-sm text-gray-600 mb-2 text-center">Estimación de gasto para próximo mes</p>
                    <p className="text-4xl font-black text-indigo-900 text-center">
                        {formatearMonto(totalProyectado)}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm text-blue-600 font-medium mb-1">💳 Cuotas Comprometidas</p>
                        <p className="text-2xl font-bold text-blue-900">{formatearMonto(cuotasProyectadas)}</p>
                        <p className="text-xs text-blue-600 mt-1">Pagos de compras en cuotas</p>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm text-green-600 font-medium mb-1">🔄 Gastos Recurrentes</p>
                        <p className="text-2xl font-bold text-green-900">{formatearMonto(gastosRecurrentes)}</p>
                        <p className="text-xs text-green-600 mt-1">
                            {recurrentes.filter(r => r.activo).length} servicios mensuales
                        </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <p className="text-sm text-purple-600 font-medium mb-1">⚡ Estimado Spot</p>
                        <p className="text-2xl font-bold text-purple-900">{formatearMonto(estimadoSpot)}</p>
                        <p className="text-xs text-purple-600 mt-1">Basado en promedio actual</p>
                    </div>
                </div>

                {/* Detalle de recurrentes */}
                {recurrentes.filter(r => r.activo).length > 0 && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Detalle de gastos recurrentes:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {recurrentes.filter(r => r.activo).map(r => {
                                const categoria = categorias.find(c => c.id === r.categoria);
                                return (
                                    <div key={r.id} className="text-sm text-gray-600">
                                        <span className="mr-1">{categoria?.icono || '📦'}</span>
                                        {r.nombre}: {formatearMonto(r.monto)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
});

// Componente: Comparativa Mensual
const ComparativaMensual = memo(({ transaccionesActuales, transaccionesAnteriores, mesActual, categorias }) => {
    const desglose = useMemo(() => {
        const actual = calcularDesglose(transaccionesActuales);
        const anterior = calcularDesglose(transaccionesAnteriores);

        const calcularCambio = (actual, anterior) => {
            if (anterior === 0) return { porcentaje: 0, direccion: 'igual' };
            const diff = actual - anterior;
            const porcentaje = Math.round((diff / anterior) * 100);
            const direccion = diff > 0 ? 'arriba' : diff < 0 ? 'abajo' : 'igual';
            return { porcentaje: Math.abs(porcentaje), direccion, diff };
        };

        return {
            total: {
                actual: actual.total,
                anterior: anterior.total,
                cambio: calcularCambio(actual.total, anterior.total)
            },
            spot: {
                actual: actual.spot,
                anterior: anterior.spot,
                cambio: calcularCambio(actual.spot, anterior.spot)
            },
            cuotas: {
                actual: actual.cuotasMes + actual.cuotasAnteriores,
                anterior: anterior.cuotasMes + anterior.cuotasAnteriores,
                cambio: calcularCambio(
                    actual.cuotasMes + actual.cuotasAnteriores,
                    anterior.cuotasMes + anterior.cuotasAnteriores
                )
            }
        };
    }, [transaccionesActuales, transaccionesAnteriores]);

    // Categorías que más crecieron
    const categoriasCrecimiento = useMemo(() => {
        const gastosActuales = calcularGastosPorCategoria(transaccionesActuales);
        const gastosAnteriores = calcularGastosPorCategoria(transaccionesAnteriores);

        const cambios = Object.keys(gastosActuales).map(catId => {
            const actual = gastosActuales[catId] || 0;
            const anterior = gastosAnteriores[catId] || 0;
            const diff = actual - anterior;
            const porcentaje = anterior > 0 ? Math.round((diff / anterior) * 100) : 0;

            return {
                categoria: categorias.find(c => c.id === catId),
                actual,
                anterior,
                diff,
                porcentaje
            };
        });

        return cambios
            .filter(c => c.diff > 0)
            .sort((a, b) => b.diff - a.diff)
            .slice(0, 3);
    }, [transaccionesActuales, transaccionesAnteriores, categorias]);

    const FlechaCambio = ({ cambio }) => {
        if (cambio.direccion === 'arriba') {
            return <span className="text-red-600">↑ +{cambio.porcentaje}%</span>;
        } else if (cambio.direccion === 'abajo') {
            return <span className="text-green-600">↓ -{cambio.porcentaje}%</span>;
        }
        return <span className="text-gray-600">→ 0%</span>;
    };

    return (
        <Card title="📈 Comparativa vs Mes Anterior" icon="📈">
            <div className="space-y-4">
                {/* Comparativa general */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Total del Mes</p>
                        <p className="text-2xl font-bold text-gray-900">{formatearMonto(desglose.total.actual)}</p>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">Anterior: {formatearMonto(desglose.total.anterior)}</p>
                            <FlechaCambio cambio={desglose.total.cambio} />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Spot</p>
                        <p className="text-2xl font-bold text-gray-900">{formatearMonto(desglose.spot.actual)}</p>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">Anterior: {formatearMonto(desglose.spot.anterior)}</p>
                            <FlechaCambio cambio={desglose.spot.cambio} />
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-1">Cuotas</p>
                        <p className="text-2xl font-bold text-gray-900">{formatearMonto(desglose.cuotas.actual)}</p>
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">Anterior: {formatearMonto(desglose.cuotas.anterior)}</p>
                            <FlechaCambio cambio={desglose.cuotas.cambio} />
                        </div>
                    </div>
                </div>

                {/* Categorías que más crecieron */}
                {categoriasCrecimiento.length > 0 && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm font-semibold text-yellow-900 mb-3">
                            📊 Categorías que más crecieron:
                        </p>
                        <div className="space-y-2">
                            {categoriasCrecimiento.map((c, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-2xl">{c.categoria?.icono}</span>
                                        <span className="font-medium text-gray-800">{c.categoria?.nombre}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">+{formatearMonto(c.diff)}</p>
                                        <p className="text-xs text-red-600">(+{c.porcentaje}%)</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
});

// Componente: Top Insights
const TopInsights = memo(({ transacciones, transaccionesAnteriores, categorias }) => {
    const insights = useMemo(() => {
        const resultados = [];

        // 1. Gasto más grande del mes
        if (transacciones.length > 0) {
            const gastoMasGrande = [...transacciones].sort((a, b) => b.monto - a.monto)[0];
            const categoria = categorias.find(c => c.id === gastoMasGrande.categoria);
            resultados.push({
                icono: '💰',
                titulo: 'Gasto más grande del mes',
                descripcion: `${formatearMonto(gastoMasGrande.monto)} en ${gastoMasGrande.comercio}`,
                detalle: `Categoría: ${categoria?.nombre || 'Sin categoría'}`,
                color: 'blue'
            });
        }

        // 2. Comparación fin de semana vs días laborales
        const finDeSemana = transacciones.filter(t => {
            const fecha = new Date(t.fecha);
            const dia = fecha.getDay();
            return dia === 0 || dia === 6; // Domingo o Sábado
        });
        const diasLaborales = transacciones.filter(t => {
            const fecha = new Date(t.fecha);
            const dia = fecha.getDay();
            return dia >= 1 && dia <= 5;
        });

        const totalFinDeSemana = finDeSemana.reduce((sum, t) => sum + t.monto, 0);
        const totalDiasLaborales = diasLaborales.reduce((sum, t) => sum + t.monto, 0);

        const promedioFinDeSemana = finDeSemana.length > 0 ? totalFinDeSemana / (finDeSemana.length / 7 * 2) : 0;
        const promedioDiasLaborales = diasLaborales.length > 0 ? totalDiasLaborales / (diasLaborales.length / 7 * 5) : 0;

        if (promedioFinDeSemana > promedioDiasLaborales * 1.3) {
            const porcentaje = Math.round((promedioFinDeSemana / promedioDiasLaborales - 1) * 100);
            resultados.push({
                icono: '📅',
                titulo: 'Patrón de fin de semana',
                descripcion: `Gastas ${porcentaje}% más los fines de semana`,
                detalle: `Promedio fin de semana: ${formatearMonto(promedioFinDeSemana)} vs días laborales: ${formatearMonto(promedioDiasLaborales)}`,
                color: 'purple'
            });
        }

        // 3. Ahorro o exceso vs mes anterior
        if (transaccionesAnteriores.length > 0) {
            const totalActual = transacciones.reduce((sum, t) => sum + t.monto, 0);
            const totalAnterior = transaccionesAnteriores.reduce((sum, t) => sum + t.monto, 0);
            const diferencia = totalAnterior - totalActual;

            if (Math.abs(diferencia) > 10000) {
                if (diferencia > 0) {
                    resultados.push({
                        icono: '🎉',
                        titulo: 'Ahorraste vs mes anterior',
                        descripcion: `Gastaste ${formatearMonto(Math.abs(diferencia))} menos que el mes pasado`,
                        detalle: 'Buen trabajo controlando tus gastos',
                        color: 'green'
                    });
                } else {
                    resultados.push({
                        icono: '⚠️',
                        titulo: 'Aumento de gastos',
                        descripcion: `Gastaste ${formatearMonto(Math.abs(diferencia))} más que el mes pasado`,
                        detalle: 'Revisa tus gastos para el próximo mes',
                        color: 'red'
                    });
                }
            }
        }

        // 4. Cantidad de transacciones
        const cantidadTransacciones = transacciones.length;
        const promedioTransaccion = cantidadTransacciones > 0
            ? transacciones.reduce((sum, t) => sum + t.monto, 0) / cantidadTransacciones
            : 0;

        resultados.push({
            icono: '📊',
            titulo: 'Análisis de transacciones',
            descripcion: `${cantidadTransacciones} transacciones este mes`,
            detalle: `Promedio por transacción: ${formatearMonto(promedioTransaccion)}`,
            color: 'indigo'
        });

        return resultados;
    }, [transacciones, transaccionesAnteriores, categorias]);

    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200',
        purple: 'bg-purple-50 border-purple-200',
        green: 'bg-green-50 border-green-200',
        red: 'bg-red-50 border-red-200',
        indigo: 'bg-indigo-50 border-indigo-200'
    };

    return (
        <Card title="🔍 Descubrimientos del Mes" icon="🔍">
            <div className="space-y-3">
                {insights.map((insight, idx) => (
                    <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${colorClasses[insight.color]}`}
                    >
                        <div className="flex items-start space-x-3">
                            <span className="text-3xl">{insight.icono}</span>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800 mb-1">{insight.titulo}</p>
                                <p className="text-gray-700">{insight.descripcion}</p>
                                {insight.detalle && (
                                    <p className="text-sm text-gray-600 mt-1">{insight.detalle}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
});
