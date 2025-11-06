// Página de Cuotas Futuras - Proyección de pagos en cuotas

const CuotasFuturas = () => {
    const { selectedMonth, categorias, perfiles, mesesCargados } = useApp();
    const [transacciones, setTransacciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mesesProyeccion, setMesesProyeccion] = useState(12);

    // Cargar todas las transacciones históricas para calcular cuotas
    useEffect(() => {
        cargarTodasLasTransacciones();
    }, [mesesCargados]);

    const cargarTodasLasTransacciones = async () => {
        setLoading(true);
        try {
            const todasTransacciones = [];
            for (const mes of mesesCargados) {
                const trans = await getTransaccionesByMes(mes.id);
                todasTransacciones.push(...trans);
            }
            setTransacciones(todasTransacciones);
        } catch (error) {
            console.error('Error al cargar transacciones:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calcular cuotas activas
    const cuotasActivas = useMemo(() => {
        if (!selectedMonth || transacciones.length === 0) return [];
        return calcularCuotasActivas(transacciones, selectedMonth.mesAnio);
    }, [transacciones, selectedMonth]);

    // Proyectar cuotas para los próximos meses
    const proyeccionMensual = useMemo(() => {
        if (cuotasActivas.length === 0 || !selectedMonth) return [];

        const proyecciones = [];
        const mesActualDate = new Date(selectedMonth.mesAnio + '-01');
        // Comenzar desde el mes siguiente al mes cargado
        mesActualDate.setMonth(mesActualDate.getMonth() + 1);

        for (let i = 0; i < mesesProyeccion; i++) {
            const fechaMes = new Date(mesActualDate);
            fechaMes.setMonth(fechaMes.getMonth() + i);

            const mesAnio = `${fechaMes.getFullYear()}-${String(fechaMes.getMonth() + 1).padStart(2, '0')}`;

            let totalMes = 0;
            const cuotasDelMes = [];

            for (const cuota of cuotasActivas) {
                // Si esta cuota aún tiene cuotas restantes para este mes
                if (i < cuota.cuotasRestantes) {
                    totalMes += cuota.montoCuota;
                    cuotasDelMes.push({
                        ...cuota,
                        numeroCuota: cuota.cuotaActual + i + 1 // Cuota que se pagará este mes
                    });
                }
            }

            proyecciones.push({
                mesAnio,
                mesNombre: getNombreMes(mesAnio),
                total: totalMes,
                cuotas: cuotasDelMes,
                cantidadCuotas: cuotasDelMes.length
            });
        }

        return proyecciones;
    }, [cuotasActivas, selectedMonth, mesesProyeccion]);

    // Calcular totales
    const totalProyectado = useMemo(() => {
        return proyeccionMensual.reduce((sum, p) => sum + p.total, 0);
    }, [proyeccionMensual]);

    if (!selectedMonth) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📅"
                    title="Selecciona un mes"
                    description="Para ver las cuotas futuras, primero debes tener un mes cargado."
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-900 text-xl font-semibold">Cargando cuotas...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">💳 Cuotas Futuras</h1>
                    <p className="text-gray-600">Proyección de pagos en cuotas para los próximos meses</p>
                </div>
                <div className="flex items-center space-x-3">
                    <select
                        value={mesesProyeccion}
                        onChange={(e) => setMesesProyeccion(parseInt(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                        <option value={6}>6 meses</option>
                        <option value={12}>12 meses</option>
                        <option value={18}>18 meses</option>
                        <option value={24}>24 meses</option>
                    </select>
                </div>
            </div>

            {cuotasActivas.length === 0 ? (
                <EmptyState
                    icon="✅"
                    title="No tienes cuotas activas"
                    description="No hay compras en cuotas pendientes. ¡Todas tus compras están al día!"
                />
            ) : (
                <>
                    {/* Resumen General */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CardStat
                            label="Compras en Cuotas"
                            value={cuotasActivas.length}
                            icon="🛒"
                            color="indigo"
                        />
                        <CardStat
                            label="Total Proyectado"
                            value={formatearMonto(totalProyectado)}
                            icon="💰"
                            color="purple"
                        />
                        <CardStat
                            label="Promedio Mensual"
                            value={formatearMonto(totalProyectado / mesesProyeccion)}
                            icon="📊"
                            color="blue"
                        />
                    </div>

                    {/* Compras Activas */}
                    <Card title="Compras en Cuotas Activas" icon="🛍️">
                        <div className="space-y-3">
                            {cuotasActivas.map((cuota, index) => {
                                const categoria = categorias.find(c => c.id === cuota.categoria);
                                const perfil = perfiles.find(p => p.id === cuota.perfilId);
                                const porcentajeCompletado = ((cuota.cuotaActual / cuota.cuotasTotal) * 100).toFixed(0);

                                return (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start space-x-4 flex-1">
                                                {/* Icono */}
                                                <div className="text-3xl">{categoria?.icono || '📦'}</div>

                                                {/* Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h4 className="font-semibold text-gray-800 text-lg">{cuota.comercio}</h4>
                                                        {perfil && (
                                                            <Badge color="gray" size="sm">
                                                                {perfil.nombre}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <p className="text-sm text-gray-600 mb-3">{truncarTexto(cuota.descripcion, 60)}</p>

                                                    {/* Barra de progreso */}
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                                            <span>Cuota {cuota.cuotaActual} de {cuota.cuotasTotal}</span>
                                                            <span>{porcentajeCompletado}% completado</span>
                                                        </div>
                                                        <ProgressBar
                                                            current={cuota.cuotaActual}
                                                            max={cuota.cuotasTotal}
                                                            height={8}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Montos */}
                                            <div className="text-right ml-4">
                                                <p className="text-2xl font-bold text-indigo-600">{formatearMonto(cuota.montoCuota)}</p>
                                                <p className="text-xs text-gray-600">por mes</p>
                                                <p className="text-sm text-gray-700 mt-2">
                                                    {cuota.cuotasRestantes} cuotas restantes
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Total: {formatearMonto(cuota.montoTotal)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Proyección Mensual */}
                    <Card title="Proyección Mensual" icon="📅">
                        <div className="space-y-3">
                            {proyeccionMensual.map((mes, index) => {
                                const esProximoMes = index === 0;
                                const tieneGastos = mes.total > 0;

                                return (
                                    <div
                                        key={mes.mesAnio}
                                        className={`border-l-4 rounded-lg p-4 transition-all ${
                                            esProximoMes
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : tieneGastos
                                                ? 'border-gray-300 bg-gray-50'
                                                : 'border-gray-200 bg-gray-50 opacity-60'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h4 className={`font-semibold ${esProximoMes ? 'text-indigo-900' : 'text-gray-800'}`}>
                                                        {mes.mesNombre}
                                                    </h4>
                                                    {esProximoMes && (
                                                        <Badge color="indigo" size="sm">Próximo mes</Badge>
                                                    )}
                                                </div>

                                                {tieneGastos ? (
                                                    <p className="text-sm text-gray-600">
                                                        {mes.cantidadCuotas} cuota{mes.cantidadCuotas !== 1 ? 's' : ''} a pagar
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-500">Sin cuotas este mes</p>
                                                )}
                                            </div>

                                            <div className="text-right">
                                                <p className={`text-2xl font-bold ${
                                                    esProximoMes ? 'text-indigo-600' : 'text-gray-800'
                                                }`}>
                                                    {formatearMonto(mes.total)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Detalle de cuotas del mes (colapsable) */}
                                        {tieneGastos && mes.cuotas.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {mes.cuotas.map((cuota, idx) => (
                                                        <div key={idx} className="text-xs text-gray-600 flex items-center justify-between">
                                                            <span className="truncate">
                                                                {truncarTexto(cuota.comercio, 25)} ({cuota.numeroCuota}/{cuota.cuotasTotal})
                                                            </span>
                                                            <span className="font-semibold ml-2">{formatearMonto(cuota.montoCuota)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    {/* Gráfico de Barras de Proyección */}
                    <Card title="Visualización Gráfica" icon="📊">
                        <GraficoProyeccionCuotas proyeccion={proyeccionMensual} />
                    </Card>
                </>
            )}
        </div>
    );
};

// Componente de gráfico de proyección
const GraficoProyeccionCuotas = memo(({ proyeccion }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || proyeccion.length === 0) return;

        // Preparar datos
        const labels = proyeccion.map(p => p.mesNombre);
        const data = proyeccion.map(p => p.total);

        // Destruir gráfico anterior
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Crear gráfico
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Monto en Cuotas',
                    data,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Total: ${window.formatearMonto(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value === 0) return String.fromCharCode(36) + '0';
                                return String.fromCharCode(36) + Math.round(value).toLocaleString('es-CL');
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
    }, [proyeccion]);

    if (proyeccion.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No hay datos para mostrar
            </div>
        );
    }

    const containerStyle = { position: 'relative', height: '400px' };

    return (
        <div style={containerStyle}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
});
