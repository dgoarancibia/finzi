// Página HistorialMeses - Gestión de meses cargados

const HistorialMeses = () => {
    const { mesesCargados, refreshMesesCargados, setSelectedMonth, setCurrentPage } = useApp();
    const [showToast, setShowToast] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const handleEliminarMes = async (mes) => {
        if (!confirm(`¿Estás seguro de eliminar todos los datos de ${getNombreMes(mes.mesAnio)}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            setDeleting(true);
            await deleteMesCompleto(mes.id);
            await refreshMesesCargados();
            setShowToast({ message: 'Mes eliminado exitosamente', type: 'success' });
        } catch (error) {
            console.error('Error al eliminar mes:', error);
            setShowToast({ message: 'Error al eliminar el mes', type: 'error' });
        } finally {
            setDeleting(false);
        }
    };

    const handleVerMes = (mes) => {
        setSelectedMonth(mes);
        setCurrentPage('home');
    };

    const getEstadisticasMes = async (mes) => {
        const transacciones = await getTransaccionesByMes(mes.id);
        const desglose = calcularDesglose(transacciones);
        return {
            totalTransacciones: transacciones.length,
            totalGasto: desglose.total
        };
    };

    if (mesesCargados.length === 0 && !deleting) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📅"
                    title="No hay meses cargados"
                    description="Carga tu primer archivo CSV desde la página Home para comenzar."
                    action={
                        <button
                            onClick={() => setCurrentPage('home')}
                            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg"
                        >
                            Ir a Home
                        </button>
                    }
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Historial de Meses</h1>
                <p className="text-gray-600">Gestiona los meses con datos cargados</p>
            </div>

            <Card>
                <div className="space-y-4">
                    {mesesCargados
                        .sort((a, b) => b.mesAnio.localeCompare(a.mesAnio))
                        .map(mes => (
                            <MesCard
                                key={mes.id}
                                mes={mes}
                                onVer={() => handleVerMes(mes)}
                                onEliminar={() => handleEliminarMes(mes)}
                            />
                        ))}
                </div>
            </Card>

            {showToast && (
                <Toast
                    message={showToast.message}
                    type={showToast.type}
                    onClose={() => setShowToast(null)}
                />
            )}
        </div>
    );
};

const MesCard = memo(({ mes, onVer, onEliminar }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const cargarStats = async () => {
            try {
                const transacciones = await getTransaccionesByMes(mes.id);
                const desglose = calcularDesglose(transacciones);
                setStats({
                    totalTransacciones: transacciones.length,
                    totalGasto: desglose.total
                });
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            } finally {
                setLoading(false);
            }
        };

        cargarStats();
    }, [mes.id]);

    return (
        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-slate-700 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
            <div className="flex items-center space-x-6 flex-1">
                <div className="text-4xl">
                    📅
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {getNombreMes(mes.mesAnio)}
                        </h3>
                        {mes.perfilId && (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                mes.perfilId === 1
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
                            }`}>
                                {mes.perfilId === 1 ? '👤 Diego' : '👤 Marcela'}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Cargado el {formatearFecha(mes.fechaCarga, 'largo')}
                    </p>
                    {!loading && stats && (
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                            <span className="text-gray-600 dark:text-gray-300">
                                {stats.totalTransacciones} transacciones
                            </span>
                            <span className="text-gray-400 dark:text-gray-500">•</span>
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                {formatearMonto(stats.totalGasto)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <button
                    onClick={onVer}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Ver Detalles
                </button>
                <button
                    onClick={onEliminar}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Eliminar
                </button>
            </div>
        </div>
    );
});
