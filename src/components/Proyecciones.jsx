// Página Proyecciones - Planificación financiera a futuro

const Proyecciones = () => {
    const { selectedMonth, mesesCargados } = useApp();
    const [loading, setLoading] = useState(false);
    const [proyeccion, setProyeccion] = useState(null);
    const [metas, setMetas] = useState([
        { id: 1, nombre: 'Departamento más grande', monto: 15000000, activa: false },
        { id: 2, nombre: 'Viaje familiar', monto: 3000000, activa: false },
        { id: 3, nombre: 'Fondo emergencia', monto: 2000000, activa: false }
    ]);
    const [metaPersonalizada, setMetaPersonalizada] = useState({ nombre: '', monto: 0 });
    const [showModalMeta, setShowModalMeta] = useState(false);

    useEffect(() => {
        if (selectedMonth) {
            calcularProyeccion();
        }
    }, [selectedMonth]);

    const calcularProyeccion = async () => {
        if (!selectedMonth) return;

        setLoading(true);
        try {
            // Obtener datos históricos de los últimos 3 meses
            const ultimosMeses = mesesCargados
                .sort((a, b) => b.mesAnio.localeCompare(a.mesAnio))
                .slice(0, 3);

            const datosHistoricos = [];

            for (const mes of ultimosMeses) {
                const transacciones = await getTransaccionesByMes(mes.id);
                const ingresos = await getIngresos(mes.mesAnio);

                const totalGastos = transacciones.reduce((sum, t) => sum + t.monto, 0);
                const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);

                datosHistoricos.push({
                    mes: mes.mesAnio,
                    mesNombre: getNombreMes(mes.mesAnio),
                    gastos: totalGastos,
                    ingresos: totalIngresos,
                    balance: totalIngresos - totalGastos
                });
            }

            // Calcular promedios
            const promedioGastos = datosHistoricos.reduce((sum, d) => sum + d.gastos, 0) / datosHistoricos.length;
            const promedioIngresos = datosHistoricos.reduce((sum, d) => sum + d.ingresos, 0) / datosHistoricos.length;
            const promedioBalance = promedioIngresos - promedioGastos;

            // Obtener cuotas activas para proyectar compromisos futuros
            const todasTransacciones = await db.transacciones.toArray();
            const cuotasActivas = calcularCuotasActivas(todasTransacciones, selectedMonth.mesAnio);
            const totalCuotasMensuales = cuotasActivas.reduce((sum, c) => sum + c.montoCuota, 0);

            // Proyectar próximos 12 meses
            const proyeccionMensual = [];
            const mesActualDate = new Date(selectedMonth.mesAnio + '-01');

            for (let i = 1; i <= 12; i++) {
                const fechaMes = new Date(mesActualDate);
                fechaMes.setMonth(fechaMes.getMonth() + i);
                const mesAnio = `${fechaMes.getFullYear()}-${String(fechaMes.getMonth() + 1).padStart(2, '0')}`;

                // Calcular cuotas que se pagarían ese mes
                let cuotasMes = 0;
                for (const cuota of cuotasActivas) {
                    if (i <= cuota.cuotasRestantes) {
                        cuotasMes += cuota.montoCuota;
                    }
                }

                const gastosProyectados = promedioGastos + cuotasMes;
                const balanceProyectado = promedioIngresos - gastosProyectados;

                proyeccionMensual.push({
                    mes: i,
                    mesAnio,
                    mesNombre: getNombreMes(mesAnio),
                    ingresos: promedioIngresos,
                    gastos: gastosProyectados,
                    balance: balanceProyectado,
                    cuotas: cuotasMes
                });
            }

            // Calcular ahorro acumulado
            let ahorroAcumulado = 0;
            proyeccionMensual.forEach(p => {
                ahorroAcumulado += p.balance;
                p.ahorroAcumulado = ahorroAcumulado;
            });

            setProyeccion({
                datosHistoricos,
                promedioGastos,
                promedioIngresos,
                promedioBalance,
                proyeccionMensual,
                totalCuotasMensuales
            });

        } catch (error) {
            console.error('Error al calcular proyección:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMeta = (metaId) => {
        setMetas(prev => prev.map(m =>
            m.id === metaId ? { ...m, activa: !m.activa } : m
        ));
    };

    const agregarMetaPersonalizada = () => {
        if (!metaPersonalizada.nombre || metaPersonalizada.monto <= 0) return;

        const nuevaMeta = {
            id: Date.now(),
            nombre: metaPersonalizada.nombre,
            monto: metaPersonalizada.monto,
            activa: true
        };

        setMetas([...metas, nuevaMeta]);
        setMetaPersonalizada({ nombre: '', monto: 0 });
        setShowModalMeta(false);
    };

    const calcularMesesParaMeta = (montoMeta) => {
        if (!proyeccion || proyeccion.promedioBalance <= 0) return null;
        return Math.ceil(montoMeta / proyeccion.promedioBalance);
    };

    if (!selectedMonth) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📊"
                    title="Selecciona un mes"
                    description="Para ver proyecciones, primero debes tener un mes cargado."
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
                        <p className="text-gray-900 text-xl font-semibold">Calculando proyecciones...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!proyeccion) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📊"
                    title="No hay datos suficientes"
                    description="Necesitas al menos un mes con transacciones e ingresos para calcular proyecciones."
                />
            </div>
        );
    }

    const metasActivas = metas.filter(m => m.activa);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proyecciones Financieras</h1>
                    <p className="text-gray-600">Planifica tu futuro y alcanza tus metas</p>
                </div>
                <button
                    onClick={() => setShowModalMeta(true)}
                    className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                >
                    + Agregar Meta
                </button>
            </div>

            {/* Resumen Financiero Actual */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <CardStat
                    label="Ingreso Promedio"
                    value={formatearMonto(proyeccion.promedioIngresos)}
                    icon="💰"
                    color="green"
                    subtitle="Últimos 3 meses"
                />
                <CardStat
                    label="Gasto Promedio"
                    value={formatearMonto(proyeccion.promedioGastos)}
                    icon="💳"
                    color="red"
                    subtitle="Últimos 3 meses"
                />
                <CardStat
                    label="Balance Mensual"
                    value={formatearMonto(proyeccion.promedioBalance)}
                    icon={proyeccion.promedioBalance > 0 ? "✅" : "⚠️"}
                    color={proyeccion.promedioBalance > 0 ? "green" : "red"}
                    subtitle={proyeccion.promedioBalance > 0 ? "Superávit" : "Déficit"}
                />
                <CardStat
                    label="Cuotas Activas"
                    value={formatearMonto(proyeccion.totalCuotasMensuales)}
                    icon="📊"
                    color="purple"
                    subtitle="Compromisos mensuales"
                />
            </div>

            {/* Metas Financieras */}
            <Card title="Tus Metas Financieras" icon="🎯">
                <div className="space-y-4">
                    {metas.map(meta => {
                        const mesesNecesarios = calcularMesesParaMeta(meta.monto);
                        const ahorroAcumulado12Meses = proyeccion.proyeccionMensual[11]?.ahorroAcumulado || 0;
                        const alcanzableEn12Meses = ahorroAcumulado12Meses >= meta.monto;

                        return (
                            <div
                                key={meta.id}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    meta.activa
                                        ? 'border-indigo-300 bg-indigo-50'
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <input
                                            type="checkbox"
                                            checked={meta.activa}
                                            onChange={() => toggleMeta(meta.id)}
                                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                        />
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800">{meta.nombre}</h3>
                                            <p className="text-sm text-gray-600">Monto objetivo: {formatearMonto(meta.monto)}</p>
                                        </div>
                                    </div>
                                    {meta.activa && mesesNecesarios && (
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${alcanzableEn12Meses ? 'text-green-600' : 'text-orange-600'}`}>
                                                {mesesNecesarios} meses
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {alcanzableEn12Meses ? '✅ Alcanzable en 1 año' : '⏰ Requiere más tiempo'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            {/* Gráfico de Proyección */}
            {metasActivas.length > 0 && (
                <Card title="Proyección de Ahorro vs Metas (12 meses)" icon="📈">
                    <GraficoProyeccionAhorro
                        proyeccion={proyeccion.proyeccionMensual}
                        metas={metasActivas}
                    />
                </Card>
            )}

            {/* Tabla de Proyección Mensual */}
            <Card title="Proyección Mensual Detallada" icon="📋">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ingresos</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gastos</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cuotas</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {proyeccion.proyeccionMensual.map((p, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.mesNombre}</td>
                                    <td className="px-4 py-3 text-sm text-right text-green-600">{formatearMonto(p.ingresos)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-red-600">{formatearMonto(p.gastos)}</td>
                                    <td className="px-4 py-3 text-sm text-right text-purple-600">{formatearMonto(p.cuotas)}</td>
                                    <td className={`px-4 py-3 text-sm text-right font-semibold ${p.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatearMonto(p.balance)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-bold text-indigo-600">
                                        {formatearMonto(p.ahorroAcumulado)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal para meta personalizada */}
            {showModalMeta && (
                <Modal isOpen={true} onClose={() => setShowModalMeta(false)} title="Agregar Meta Personalizada" size="md">
                    <form onSubmit={(e) => { e.preventDefault(); agregarMetaPersonalizada(); }} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Meta</label>
                            <input
                                type="text"
                                value={metaPersonalizada.nombre}
                                onChange={(e) => setMetaPersonalizada({ ...metaPersonalizada, nombre: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ej: Auto nuevo, Renovación casa"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Monto Objetivo</label>
                            <input
                                type="number"
                                value={metaPersonalizada.monto}
                                onChange={(e) => setMetaPersonalizada({ ...metaPersonalizada, monto: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                required
                                min="0"
                                step="100000"
                            />
                        </div>
                        <div className="flex space-x-3 pt-4">
                            <button type="button" onClick={() => setShowModalMeta(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cancelar
                            </button>
                            <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Agregar
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// Componente de gráfico de proyección de ahorro
const GraficoProyeccionAhorro = memo(({ proyeccion, metas }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || proyeccion.length === 0) return;

        // Destruir gráfico anterior
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');

        // Dataset principal: ahorro acumulado
        const datasets = [
            {
                label: 'Ahorro Acumulado',
                data: proyeccion.map(p => p.ahorroAcumulado),
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }
        ];

        // Agregar líneas horizontales para cada meta
        const colors = ['rgba(34, 197, 94, 1)', 'rgba(249, 115, 22, 1)', 'rgba(168, 85, 247, 1)'];
        metas.forEach((meta, index) => {
            datasets.push({
                label: meta.nombre,
                data: proyeccion.map(() => meta.monto),
                borderColor: colors[index % colors.length],
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            });
        });

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: proyeccion.map(p => p.mesNombre),
                datasets
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
    }, [proyeccion, metas]);

    const containerStyle = { position: 'relative', height: '400px' };

    return (
        <div style={containerStyle}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
});
