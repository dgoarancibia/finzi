// Página Análisis Multi-Mes - Comparación de múltiples meses, trimestres y año completo

const AnalisisMultiMes = () => {
    const { mesesCargados, categorias, perfiles } = useApp();
    const [vistaActual, setVistaActual] = useState('anual'); // anual, trimestre, personalizado
    const [trimestreSeleccionado, setTrimestreSeleccionado] = useState('Q4'); // Cambiado a Q4 porque octubre está en Q4
    const [mesesSeleccionados, setMesesSeleccionados] = useState([]);
    const [datosConsolidados, setDatosConsolidados] = useState(null);
    const [loading, setLoading] = useState(false);
    const [anoSeleccionado, setAnoSeleccionado] = useState(null);

    // Obtener años disponibles
    const anosDisponibles = useMemo(() => {
        if (mesesCargados.length === 0) return [];
        const anos = [...new Set(mesesCargados.map(m => parseInt(m.mesAnio.split('-')[0])))];
        return anos.sort((a, b) => b - a);
    }, [mesesCargados]);

    // Inicializar año seleccionado cuando se carguen los años
    useEffect(() => {
        if (anosDisponibles.length > 0 && anoSeleccionado === null) {
            setAnoSeleccionado(anosDisponibles[0]);
        }
    }, [anosDisponibles]);

    // Si solo hay un mes disponible y estamos en personalizado, seleccionarlo automáticamente
    useEffect(() => {
        if (vistaActual === 'personalizado' && mesesCargados.length === 1 && mesesSeleccionados.length === 0) {
            setMesesSeleccionados([mesesCargados[0].id]);
        }
    }, [vistaActual, mesesCargados]);

    // Obtener meses por trimestre
    const getMesesTrimestre = (ano, trimestre) => {
        const trimestres = {
            'Q1': ['01', '02', '03'], // Enero, Febrero, Marzo
            'Q2': ['04', '05', '06'], // Abril, Mayo, Junio
            'Q3': ['07', '08', '09'], // Julio, Agosto, Septiembre
            'Q4': ['10', '11', '12']  // Octubre, Noviembre, Diciembre
        };
        return trimestres[trimestre].map(mes => `${ano}-${mes}`);
    };

    useEffect(() => {
        calcularDatosConsolidados();
    }, [vistaActual, anoSeleccionado, trimestreSeleccionado, mesesSeleccionados, mesesCargados]);

    const calcularDatosConsolidados = async () => {
        // Si el año no está inicializado, esperar
        if ((vistaActual === 'anual' || vistaActual === 'trimestre') && anoSeleccionado === null) {
            setDatosConsolidados(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let mesesAAnalizar = [];

            // Determinar qué meses analizar según la vista
            if (vistaActual === 'anual') {
                mesesAAnalizar = mesesCargados.filter(m =>
                    m.mesAnio.startsWith(`${anoSeleccionado}-`)
                );
                console.log('Vista anual:', anoSeleccionado, 'Meses encontrados:', mesesAAnalizar.length);
            } else if (vistaActual === 'trimestre') {
                const mesesTrimestre = getMesesTrimestre(anoSeleccionado, trimestreSeleccionado);
                mesesAAnalizar = mesesCargados.filter(m =>
                    mesesTrimestre.includes(m.mesAnio)
                );
                console.log('Vista trimestre:', trimestreSeleccionado, anoSeleccionado, 'Meses encontrados:', mesesAAnalizar.length);
            } else if (vistaActual === 'personalizado') {
                mesesAAnalizar = mesesCargados.filter(m =>
                    mesesSeleccionados.includes(m.id)
                );
                console.log('Vista personalizada: Meses seleccionados:', mesesSeleccionados.length, 'Meses encontrados:', mesesAAnalizar.length);
            }

            console.log('Meses cargados disponibles:', mesesCargados.map(m => m.mesAnio));
            console.log('Meses a analizar:', mesesAAnalizar.map(m => m.mesAnio));

            if (mesesAAnalizar.length === 0) {
                setDatosConsolidados(null);
                setLoading(false);
                return;
            }

            // Recopilar datos de todos los meses
            const datosPorMes = [];
            for (const mes of mesesAAnalizar) {
                const transacciones = await getTransaccionesByMes(mes.id);
                const ingresos = await getIngresos(mes.mesAnio);
                const presupuestos = await getPresupuestos(mes.id);

                const desglose = calcularDesglose(transacciones);
                const gastosPorCategoria = calcularGastosPorCategoria(transacciones);
                const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);

                datosPorMes.push({
                    mes: mes.mesAnio,
                    mesNombre: getNombreMes(mes.mesAnio),
                    transacciones,
                    ingresos,
                    totalGastos: desglose.total,
                    totalIngresos,
                    balance: totalIngresos - desglose.total,
                    desglose,
                    gastosPorCategoria,
                    cantidadTransacciones: transacciones.length
                });
            }

            // Calcular totales consolidados
            const totales = {
                totalGastos: datosPorMes.reduce((sum, d) => sum + d.totalGastos, 0),
                totalIngresos: datosPorMes.reduce((sum, d) => sum + d.totalIngresos, 0),
                totalTransacciones: datosPorMes.reduce((sum, d) => sum + d.cantidadTransacciones, 0),
                cantidadMeses: datosPorMes.length,
                promedioGastosMensual: 0,
                promedioIngresosMensual: 0,
                promedioBalanceMensual: 0
            };

            totales.promedioGastosMensual = totales.totalGastos / totales.cantidadMeses;
            totales.promedioIngresosMensual = totales.totalIngresos / totales.cantidadMeses;
            totales.promedioBalanceMensual = totales.promedioIngresosMensual - totales.promedioGastosMensual;
            totales.balanceTotal = totales.totalIngresos - totales.totalGastos;

            // Gastos por categoría consolidados
            const gastosCategoriasConsolidados = {};
            datosPorMes.forEach(mes => {
                mes.gastosPorCategoria.forEach(cat => {
                    if (!gastosCategoriasConsolidados[cat.categoria]) {
                        gastosCategoriasConsolidados[cat.categoria] = {
                            categoria: cat.categoria,
                            total: 0,
                            porcentaje: 0
                        };
                    }
                    gastosCategoriasConsolidados[cat.categoria].total += cat.total;
                });
            });

            // Calcular porcentajes
            Object.values(gastosCategoriasConsolidados).forEach(cat => {
                cat.porcentaje = (cat.total / totales.totalGastos) * 100;
            });

            // Top categorías
            const topCategorias = Object.values(gastosCategoriasConsolidados)
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            // Gastos por perfil
            const gastosPorPerfil = {};
            perfiles.forEach(p => {
                gastosPorPerfil[p.id] = {
                    perfil: p,
                    total: 0
                };
            });

            datosPorMes.forEach(mes => {
                mes.transacciones.forEach(t => {
                    if (gastosPorPerfil[t.perfilId]) {
                        gastosPorPerfil[t.perfilId].total += t.monto;
                    }
                });
            });

            // Mes con mayor y menor gasto
            const mesMayorGasto = datosPorMes.reduce((max, mes) =>
                mes.totalGastos > max.totalGastos ? mes : max
            , datosPorMes[0]);

            const mesMenorGasto = datosPorMes.reduce((min, mes) =>
                mes.totalGastos < min.totalGastos ? mes : min
            , datosPorMes[0]);

            setDatosConsolidados({
                datosPorMes,
                totales,
                topCategorias,
                gastosPorPerfil: Object.values(gastosPorPerfil),
                gastosCategoriasConsolidados: Object.values(gastosCategoriasConsolidados),
                mesMayorGasto,
                mesMenorGasto
            });

        } catch (error) {
            console.error('Error al calcular datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMesSeleccionado = (mesId) => {
        setMesesSeleccionados(prev =>
            prev.includes(mesId)
                ? prev.filter(id => id !== mesId)
                : [...prev, mesId]
        );
    };

    const getNombreVista = () => {
        if (vistaActual === 'anual') return `Año ${anoSeleccionado}`;
        if (vistaActual === 'trimestre') return `${trimestreSeleccionado} ${anoSeleccionado}`;
        return `${mesesSeleccionados.length} meses seleccionados`;
    };

    if (mesesCargados.length === 0) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📅"
                    title="No hay meses cargados"
                    description="Carga al menos un mes para ver análisis consolidados."
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Análisis Multi-Mes</h1>
                <p className="text-gray-600">Compara múltiples meses, trimestres o año completo</p>
            </div>

            {/* Selector de Vista */}
            <Card>
                <div className="space-y-4">
                    {/* Tabs de vista */}
                    <div className="flex space-x-2 border-b border-gray-200">
                        <button
                            onClick={() => setVistaActual('anual')}
                            className={`px-6 py-3 font-semibold transition-colors ${
                                vistaActual === 'anual'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            📅 Año Completo
                        </button>
                        <button
                            onClick={() => setVistaActual('trimestre')}
                            className={`px-6 py-3 font-semibold transition-colors ${
                                vistaActual === 'trimestre'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            📊 Trimestre
                        </button>
                        <button
                            onClick={() => setVistaActual('personalizado')}
                            className={`px-6 py-3 font-semibold transition-colors ${
                                vistaActual === 'personalizado'
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            🎯 Personalizado
                        </button>
                    </div>

                    {/* Controles según vista */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vistaActual === 'anual' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                <select
                                    value={anoSeleccionado}
                                    onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    {anosDisponibles.map(ano => (
                                        <option key={ano} value={ano}>{ano}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {vistaActual === 'trimestre' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                    <select
                                        value={anoSeleccionado}
                                        onChange={(e) => setAnoSeleccionado(parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {anosDisponibles.map(ano => (
                                            <option key={ano} value={ano}>{ano}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Trimestre</label>
                                    <select
                                        value={trimestreSeleccionado}
                                        onChange={(e) => setTrimestreSeleccionado(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Q1">Q1 - Ene, Feb, Mar</option>
                                        <option value="Q2">Q2 - Abr, May, Jun</option>
                                        <option value="Q3">Q3 - Jul, Ago, Sep</option>
                                        <option value="Q4">Q4 - Oct, Nov, Dic</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {vistaActual === 'personalizado' && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selecciona Meses (Haz clic para seleccionar/deseleccionar)
                                </label>
                                {mesesSeleccionados.length === 0 && (
                                    <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                        ⚠️ Haz clic en los meses que quieras analizar
                                    </div>
                                )}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {mesesCargados.map(mes => (
                                        <button
                                            key={mes.id}
                                            onClick={() => toggleMesSeleccionado(mes.id)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                mesesSeleccionados.includes(mes.id)
                                                    ? 'bg-indigo-600 text-white shadow-lg'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            {getNombreMes(mes.mesAnio)}
                                            {mesesSeleccionados.includes(mes.id) && ' ✓'}
                                        </button>
                                    ))}
                                </div>
                                {mesesSeleccionados.length > 0 && (
                                    <div className="mt-2 text-sm text-indigo-600">
                                        ✓ {mesesSeleccionados.length} mes(es) seleccionado(s)
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Calculando datos consolidados...</p>
                </div>
            ) : !datosConsolidados ? (
                <Card>
                    <div className="text-center py-12">
                        <p className="text-6xl mb-4">📊</p>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No hay datos para mostrar</h3>
                        <p className="text-gray-600 mb-4">
                            {vistaActual === 'anual' && `No hay meses cargados para el año ${anoSeleccionado}`}
                            {vistaActual === 'trimestre' && `No hay meses cargados para ${trimestreSeleccionado} ${anoSeleccionado}`}
                            {vistaActual === 'personalizado' && mesesSeleccionados.length === 0 && 'Selecciona al menos un mes'}
                            {vistaActual === 'personalizado' && mesesSeleccionados.length > 0 && 'Los meses seleccionados no tienen datos'}
                        </p>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg inline-block">
                            <p className="text-sm text-blue-800">
                                <strong>Meses disponibles:</strong> {mesesCargados.map(m => getNombreMes(m.mesAnio)).join(', ') || 'Ninguno'}
                            </p>
                            <p className="text-sm text-blue-800 mt-2">
                                <strong>Años disponibles:</strong> {anosDisponibles.join(', ') || 'Ninguno'}
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    {/* Header con nombre de vista */}
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                        <h2 className="text-2xl font-bold text-indigo-900">
                            {getNombreVista()}
                        </h2>
                        <p className="text-indigo-700">
                            {datosConsolidados.totales.cantidadMeses} mes(es) • {datosConsolidados.totales.totalTransacciones} transacciones
                        </p>
                    </div>

                    {/* Resumen Principal */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <CardStat
                            label="Total Gastos"
                            value={formatearMonto(datosConsolidados.totales.totalGastos)}
                            icon="💳"
                            color="red"
                            subtitle={`Promedio: ${formatearMonto(datosConsolidados.totales.promedioGastosMensual)}/mes`}
                        />
                        <CardStat
                            label="Total Ingresos"
                            value={formatearMonto(datosConsolidados.totales.totalIngresos)}
                            icon="💰"
                            color="green"
                            subtitle={`Promedio: ${formatearMonto(datosConsolidados.totales.promedioIngresosMensual)}/mes`}
                        />
                        <CardStat
                            label={datosConsolidados.totales.balanceTotal >= 0 ? "Total Ahorrado" : "Déficit Total"}
                            value={formatearMonto(Math.abs(datosConsolidados.totales.balanceTotal))}
                            icon={datosConsolidados.totales.balanceTotal >= 0 ? "✅" : "⚠️"}
                            color={datosConsolidados.totales.balanceTotal >= 0 ? "green" : "red"}
                            subtitle={`Promedio: ${formatearMonto(Math.abs(datosConsolidados.totales.promedioBalanceMensual))}/mes`}
                        />
                        <CardStat
                            label="Transacciones"
                            value={datosConsolidados.totales.totalTransacciones}
                            icon="📝"
                            color="indigo"
                            subtitle={`${Math.round(datosConsolidados.totales.totalTransacciones / datosConsolidados.totales.cantidadMeses)}/mes`}
                        />
                    </div>

                    {/* Extremos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card title="Mes con Mayor Gasto" icon="📈">
                            <div className="text-center py-4">
                                <p className="text-3xl font-bold text-red-600">{datosConsolidados.mesMayorGasto.mesNombre}</p>
                                <p className="text-2xl font-semibold text-gray-800 mt-2">
                                    {formatearMonto(datosConsolidados.mesMayorGasto.totalGastos)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {datosConsolidados.mesMayorGasto.cantidadTransacciones} transacciones
                                </p>
                            </div>
                        </Card>
                        <Card title="Mes con Menor Gasto" icon="📉">
                            <div className="text-center py-4">
                                <p className="text-3xl font-bold text-green-600">{datosConsolidados.mesMenorGasto.mesNombre}</p>
                                <p className="text-2xl font-semibold text-gray-800 mt-2">
                                    {formatearMonto(datosConsolidados.mesMenorGasto.totalGastos)}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    {datosConsolidados.mesMenorGasto.cantidadTransacciones} transacciones
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Gráfico comparativo por mes */}
                    <Card title="Comparación Mes a Mes" icon="📊">
                        <GraficoComparativoMeses datos={datosConsolidados.datosPorMes} />
                    </Card>

                    {/* Top Categorías */}
                    <Card title="Top 5 Categorías" icon="🏆">
                        <div className="space-y-3">
                            {datosConsolidados.topCategorias.map((cat, index) => {
                                const categoria = categorias.find(c => c.id === cat.categoria);
                                return (
                                    <div key={cat.categoria} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                                            <span className="text-2xl">{categoria?.icono || '📦'}</span>
                                            <div>
                                                <p className="font-semibold text-gray-800">{categoria?.nombre || 'Sin categoría'}</p>
                                                <p className="text-sm text-gray-600">{cat.porcentaje.toFixed(1)}% del total</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-gray-800">{formatearMonto(cat.total)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Distribución por Perfil */}
                    {datosConsolidados.gastosPorPerfil.length > 1 && (
                        <Card title="Gastos por Perfil" icon="👥">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {datosConsolidados.gastosPorPerfil.map(gp => (
                                    <div key={gp.perfil.id} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                                style={{ backgroundColor: gp.perfil.color }}
                                            >
                                                {gp.perfil.nombre.charAt(0).toUpperCase()}
                                            </div>
                                            <p className="font-semibold text-gray-800">{gp.perfil.nombre}</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{formatearMonto(gp.total)}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {((gp.total / datosConsolidados.totales.totalGastos) * 100).toFixed(1)}% del total
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Tabla Detallada */}
                    <Card title="Detalle por Mes" icon="📋">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gastos</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Trans.</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {datosConsolidados.datosPorMes.map((mes, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{mes.mesNombre}</td>
                                            <td className="px-4 py-3 text-sm text-right text-green-600">{formatearMonto(mes.totalIngresos)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600">{formatearMonto(mes.totalGastos)}</td>
                                            <td className={`px-4 py-3 text-sm text-right font-semibold ${mes.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatearMonto(Math.abs(mes.balance))}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-600">{mes.cantidadTransacciones}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-indigo-50 font-bold">
                                        <td className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                                        <td className="px-4 py-3 text-sm text-right text-green-700">{formatearMonto(datosConsolidados.totales.totalIngresos)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-red-700">{formatearMonto(datosConsolidados.totales.totalGastos)}</td>
                                        <td className={`px-4 py-3 text-sm text-right ${datosConsolidados.totales.balanceTotal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                            {formatearMonto(Math.abs(datosConsolidados.totales.balanceTotal))}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">{datosConsolidados.totales.totalTransacciones}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

// Componente de gráfico comparativo
const GraficoComparativoMeses = memo(({ datos }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || datos.length === 0) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: datos.map(d => d.mesNombre),
                datasets: [
                    {
                        label: 'Ingresos',
                        data: datos.map(d => d.totalIngresos),
                        backgroundColor: 'rgba(34, 197, 94, 0.6)',
                        borderColor: 'rgba(34, 197, 94, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Gastos',
                        data: datos.map(d => d.totalGastos),
                        backgroundColor: 'rgba(239, 68, 68, 0.6)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'Balance',
                        data: datos.map(d => d.balance),
                        type: 'line',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${window.formatearMonto(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return String.fromCharCode(36) + Math.round(value / 1000) + 'k';
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, [datos]);

    const containerStyle = { position: 'relative', height: '400px' };

    return (
        <div style={containerStyle}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
});
