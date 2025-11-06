// Página Presupuestos - Configuración de límites por categoría

const Presupuestos = () => {
    const { selectedMonth, categorias, mesesCargados } = useApp();
    const [presupuestos, setPresupuestos] = useState([]);
    const [esPlantilla, setEsPlantilla] = useState(true);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [showToast, setShowToast] = useState(null);

    useEffect(() => {
        cargarPresupuestos();
    }, [selectedMonth, esPlantilla]);

    const cargarPresupuestos = async () => {
        setLoading(true);
        try {
            const mesId = esPlantilla ? null : selectedMonth?.id;
            const pres = await getPresupuestos(mesId);

            if (pres.length === 0) {
                // Crear presupuestos iniciales con monto 0
                const presInicial = categorias.map(c => ({
                    categoria: c.id,
                    monto: 0
                }));
                setPresupuestos(presInicial);
            } else {
                setPresupuestos(pres);
            }
        } catch (error) {
            console.error('Error al cargar presupuestos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async () => {
        setGuardando(true);
        try {
            const mesId = esPlantilla ? null : selectedMonth?.id;
            await savePresupuestos(presupuestos, mesId);
            setShowToast({ message: 'Presupuestos guardados', type: 'success' });
        } catch (error) {
            console.error('Error al guardar:', error);
            setShowToast({ message: 'Error al guardar presupuestos', type: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    const handleChangeMonto = (categoriaId, value) => {
        // Remover puntos (separadores de miles) y convertir a número
        const numeroLimpio = value.replace(/\./g, '');
        const monto = Math.max(0, parseInt(numeroLimpio) || 0);

        setPresupuestos(prev => prev.map(p =>
            p.categoria === categoriaId ? { ...p, monto } : p
        ));
    };

    const formatearMontoInput = (monto) => {
        // Formatear con separador de miles
        return monto.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleRestaurarPlantilla = async () => {
        if (!confirm('¿Restaurar los presupuestos de este mes con la plantilla base?')) return;

        try {
            const plantilla = await getPresupuestos(null);
            if (plantilla.length > 0) {
                setPresupuestos(plantilla);
                setShowToast({ message: 'Plantilla restaurada', type: 'success' });
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const totalPresupuesto = presupuestos.reduce((sum, p) => sum + p.monto, 0);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración de Presupuestos</h1>
                <p className="text-gray-600">Define los límites de gasto por categoría</p>
            </div>

            {/* Selector Plantilla/Mes específico */}
            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setEsPlantilla(true)}
                            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${esPlantilla ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            📋 Plantilla Base
                        </button>
                        <button
                            onClick={() => setEsPlantilla(false)}
                            disabled={!selectedMonth}
                            className={`px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${!esPlantilla ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            📅 Mes Específico
                        </button>
                    </div>

                    {!esPlantilla && selectedMonth && (
                        <button
                            onClick={handleRestaurarPlantilla}
                            className="px-4 py-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                            Restaurar Plantilla
                        </button>
                    )}
                </div>

                {!esPlantilla && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-600">
                            {selectedMonth ? `Editando: ${getNombreMes(selectedMonth.mesAnio)}` : 'Selecciona un mes desde Home'}
                        </p>
                    </div>
                )}
            </Card>

            {/* Lista de presupuestos */}
            <Card title="Presupuestos por Categoría" subtitle={`Total: ${formatearMonto(totalPresupuesto)}`}>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {presupuestos.map(pres => {
                            const categoria = categorias.find(c => c.id === pres.categoria);
                            if (!categoria) return null;

                            return (
                                <div key={pres.categoria} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <span className="text-3xl">{categoria.icono}</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{categoria.nombre}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-gray-600">$</span>
                                        <input
                                            type="text"
                                            value={formatearMontoInput(pres.monto)}
                                            onChange={(e) => handleChangeMonto(pres.categoria, e.target.value)}
                                            className="w-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-right font-semibold"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleGuardar}
                        disabled={guardando || loading}
                        className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                        {guardando ? 'Guardando...' : 'Guardar Presupuestos'}
                    </button>
                </div>
            </Card>

            {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
        </div>
    );
};
