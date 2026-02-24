// Página de Diagnóstico - Verificar estado de Firebase

const Diagnostico = () => {
    const { mesesCargados, perfiles } = useApp();
    const [diagnostico, setDiagnostico] = useState(null);
    const [loading, setLoading] = useState(false);

    const ejecutarDiagnostico = async () => {
        setLoading(true);
        try {
            const resultado = {
                fecha: new Date().toLocaleString('es-CL'),
                usuario: window.firebaseAuth?.currentUser?.email || 'No autenticado',
                meses: [],
                totalTransacciones: 0,
                totalPresupuestos: 0
            };

            // Analizar cada mes
            for (const mes of mesesCargados) {
                const trans = await window.getTransaccionesByMes(mes.id);
                const pres = await window.getPresupuestosByMes?.(mes.id) || [];

                const compartidas = trans.filter(t => t.esCompartido);
                const perfilNombre = perfiles.find(p => p.id === mes.perfilId)?.nombre || 'Sin perfil';

                resultado.meses.push({
                    id: mes.id,
                    mesAnio: mes.mesAnio,
                    perfilId: mes.perfilId,
                    perfilNombre,
                    fechaCarga: mes.fechaCarga,
                    transacciones: trans.length,
                    compartidas: compartidas.length,
                    presupuestos: pres.length,
                    totalMonto: trans.reduce((sum, t) => sum + t.monto, 0)
                });

                resultado.totalTransacciones += trans.length;
                resultado.totalPresupuestos += pres.length;
            }

            setDiagnostico(resultado);
        } catch (error) {
            console.error('Error en diagnóstico:', error);
            alert('Error al ejecutar diagnóstico: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mesesCargados.length > 0) {
            ejecutarDiagnostico();
        }
    }, [mesesCargados]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🔍 Diagnóstico del Sistema</h1>
                <p className="text-gray-600 dark:text-gray-400">Verifica el estado de tus datos en Firebase</p>
            </div>

            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Estado de Firebase</h2>
                    <button
                        onClick={ejecutarDiagnostico}
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                    >
                        {loading ? '🔄 Analizando...' : '🔄 Refrescar'}
                    </button>
                </div>

                {!diagnostico && !loading && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        Haz clic en "Refrescar" para ejecutar el diagnóstico
                    </div>
                )}

                {diagnostico && (
                    <div className="space-y-6">
                        {/* Resumen general */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Meses</p>
                                <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{diagnostico.meses.length}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Transacciones</p>
                                <p className="text-3xl font-bold text-green-900 dark:text-green-300">{diagnostico.totalTransacciones}</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                                <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Presupuestos</p>
                                <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{diagnostico.totalPresupuestos}</p>
                            </div>
                        </div>

                        {/* Info del usuario */}
                        <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Usuario:</span> {diagnostico.usuario}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Última actualización:</span> {diagnostico.fecha}
                            </p>
                        </div>

                        {/* Detalle por mes */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detalle por Mes</h3>
                            <div className="space-y-4">
                                {diagnostico.meses
                                    .sort((a, b) => b.mesAnio.localeCompare(a.mesAnio))
                                    .map((mes) => (
                                        <div
                                            key={mes.id}
                                            className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                            {getNombreMes(mes.mesAnio)}
                                                        </h4>
                                                        {mes.perfilId && (
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                                mes.perfilId === 1
                                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                                    : 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300'
                                                            }`}>
                                                                👤 {mes.perfilNombre}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        ID: {mes.id}
                                                    </p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        Cargado: {formatearFecha(mes.fechaCarga)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatearMonto(mes.totalMonto)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Transacciones</p>
                                                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {mes.transacciones}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Compartidas</p>
                                                    <p className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                                                        {mes.compartidas}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Presupuestos</p>
                                                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                                                        {mes.presupuestos}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {diagnostico.meses.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400">No hay meses cargados</p>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </div>
    );
};
