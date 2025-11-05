// Página Simulador - Análisis de impacto de nuevas compras

const Simulador = () => {
    const { selectedMonth, categorias } = useApp();
    const [montoCompra, setMontoCompra] = useState('');
    const [cuotas, setCuotas] = useState('1');
    const [simulacionActiva, setSimulacionActiva] = useState(false);
    const [resultadoSimulacion, setResultadoSimulacion] = useState(null);
    const [proyeccionBase, setProyeccionBase] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSimular = async () => {
        if (!montoCompra || !cuotas) return;

        setLoading(true);
        try {
            // Obtener cuotas activas
            const todasTransacciones = await db.transacciones.toArray();
            const cuotasActivas = calcularCuotasActivas(todasTransacciones, selectedMonth?.mesAnio || getMesAnio(new Date()));

            // Obtener recurrentes activas
            const recurrentesActivas = await getRecurrentesActivas();

            // Obtener compras planeadas
            const comprasPlaneadas = await getComprasPlaneadas();

            // Proyectar sin la nueva compra
            const proyeccionSinCompra = await proyectarGastosFuturos(
                cuotasActivas,
                recurrentesActivas,
                comprasPlaneadas,
                selectedMonth?.mesAnio || getMesAnio(new Date()),
                12
            );

            // Calcular presupuesto mensual promedio
            const presupuestoMensual = proyeccionSinCompra.reduce((sum, p) => sum + p.total, 0) / 12;

            // Simular nueva compra
            const resultado = simularNuevaCompra(
                parseFloat(montoCompra),
                parseInt(cuotas),
                proyeccionSinCompra,
                presupuestoMensual * 1.1 // 10% más de margen
            );

            setProyeccionBase(proyeccionSinCompra);
            setResultadoSimulacion(resultado);
            setSimulacionActiva(true);
        } catch (error) {
            console.error('Error en simulación:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLimpiar = () => {
        setMontoCompra('');
        setCuotas('1');
        setSimulacionActiva(false);
        setResultadoSimulacion(null);
    };

    const handleAgregarAPlaneadas = async () => {
        if (!resultadoSimulacion) return;

        try {
            await addCompraPlaneada({
                nombre: 'Compra simulada',
                monto: parseFloat(montoCompra),
                cuotas: parseInt(cuotas),
                categoria: categorias[0].id,
                perfilId: 1
            });
            alert('Compra agregada a planeadas');
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Simulador de Compras</h1>
                <p className="text-gray-600">Analiza el impacto de una nueva compra en tu presupuesto</p>
            </div>

            {/* Formulario de simulación */}
            <Card title="Nueva Compra" icon="🧮">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto Total</label>
                        <input
                            type="number"
                            value={montoCompra}
                            onChange={(e) => setMontoCompra(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ej: 500000"
                            min="0"
                            step="1000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad de Cuotas</label>
                        <select
                            value={cuotas}
                            onChange={(e) => setCuotas(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {[1, 3, 6, 9, 12, 18, 24, 36].map(n => (
                                <option key={n} value={n}>{n} {n === 1 ? 'cuota' : 'cuotas'}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end space-x-2">
                        <button
                            onClick={handleSimular}
                            disabled={!montoCompra || loading}
                            className="flex-1 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Simulando...' : 'Simular'}
                        </button>
                        {simulacionActiva && (
                            <button
                                onClick={handleLimpiar}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {montoCompra && cuotas && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-800">
                            Cuota mensual: <strong>{formatearMonto(parseFloat(montoCompra) / parseInt(cuotas))}</strong> durante {cuotas} meses
                        </p>
                    </div>
                )}
            </Card>

            {/* Resultado de la simulación */}
            {simulacionActiva && resultadoSimulacion && (
                <>
                    {/* Recomendación */}
                    <Card>
                        <div className={`p-6 rounded-lg ${
                            resultadoSimulacion.nivelRiesgo === 'bajo' ? 'bg-green-50 border-2 border-green-300' :
                            resultadoSimulacion.nivelRiesgo === 'medio' ? 'bg-yellow-50 border-2 border-yellow-300' :
                            'bg-red-50 border-2 border-red-300'
                        }`}>
                            <div className="flex items-start space-x-4">
                                <span className="text-4xl">
                                    {resultadoSimulacion.nivelRiesgo === 'bajo' ? '✅' : resultadoSimulacion.nivelRiesgo === 'medio' ? '⚠️' : '❌'}
                                </span>
                                <div className="flex-1">
                                    <h3 className={`text-xl font-bold mb-2 ${
                                        resultadoSimulacion.nivelRiesgo === 'bajo' ? 'text-green-800' :
                                        resultadoSimulacion.nivelRiesgo === 'medio' ? 'text-yellow-800' :
                                        'text-red-800'
                                    }`}>
                                        {resultadoSimulacion.nivelRiesgo === 'bajo' ? 'Compra Viable' :
                                         resultadoSimulacion.nivelRiesgo === 'medio' ? 'Compra Riesgosa' :
                                         'Compra No Recomendada'}
                                    </h3>
                                    <p className="text-gray-700">{resultadoSimulacion.recomendacion}</p>
                                    {resultadoSimulacion.mesesExcedidos > 0 && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {resultadoSimulacion.mesesExcedidos} mes(es) superarían el presupuesto proyectado
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Estadísticas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CardStat
                            label="Cuota Mensual"
                            value={formatearMonto(resultadoSimulacion.montoCuota)}
                            icon="💳"
                            color="indigo"
                        />
                        <CardStat
                            label="Meses con Excedente"
                            value={resultadoSimulacion.mesesExcedidos}
                            icon="⚠️"
                            color={resultadoSimulacion.mesesExcedidos === 0 ? 'green' : 'red'}
                        />
                        <CardStat
                            label="Mayor Excedente"
                            value={formatearMonto(resultadoSimulacion.excedenteMayor)}
                            icon="📊"
                            color="yellow"
                        />
                    </div>

                    {/* Gráfico comparativo */}
                    <Card title="Proyección Comparativa (12 meses)" icon="📈">
                        <GraficoProyeccion
                            proyeccionSinCompra={proyeccionBase}
                            proyeccionConCompra={resultadoSimulacion.proyeccionConCompra}
                        />
                    </Card>

                    {/* Acciones */}
                    <div className="flex justify-center">
                        <button
                            onClick={handleAgregarAPlaneadas}
                            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Agregar a Compras Planeadas
                        </button>
                    </div>
                </>
            )}

            {/* Estado inicial */}
            {!simulacionActiva && !loading && (
                <EmptyState
                    icon="🧮"
                    title="Ingresa los datos de tu compra"
                    description="Simula el impacto de una nueva compra en cuotas y recibe una recomendación basada en tu proyección financiera."
                />
            )}
        </div>
    );
};

// Gráfico de proyección comparativa
const GraficoProyeccion = memo(({ proyeccionSinCompra, proyeccionConCompra }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: proyeccionSinCompra.map(p => p.mesNombre.split(' ')[0]),
                datasets: [
                    {
                        label: 'Sin compra',
                        data: proyeccionSinCompra.map(p => p.total),
                        backgroundColor: '#6366f1',
                        borderColor: '#4f46e5',
                        borderWidth: 1
                    },
                    {
                        label: 'Con compra',
                        data: proyeccionConCompra.map(p => p.total),
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${formatearMonto(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatearMonto(value, false)
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
    }, [proyeccionSinCompra, proyeccionConCompra]);

    return (
        <div className="chart-container">
            <canvas ref={chartRef}></canvas>
        </div>
    );
});
