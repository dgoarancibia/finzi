// Página Ingresos - Gestión de ingresos mensuales

const Ingresos = () => {
    const { selectedMonth, perfiles } = useApp();
    const [ingresos, setIngresos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [ingresoEditar, setIngresoEditar] = useState(null);
    const [showToast, setShowToast] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (selectedMonth) {
            cargarIngresos();
        }
    }, [selectedMonth]);

    const cargarIngresos = async () => {
        if (!selectedMonth) return;

        setLoading(true);
        try {
            const ings = await getIngresos(selectedMonth.mesAnio);
            setIngresos(ings);
        } catch (error) {
            console.error('Error al cargar ingresos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async (ingreso) => {
        try {
            if (ingresoEditar) {
                await updateIngreso(ingresoEditar.id, ingreso);
                setShowToast({ message: 'Ingreso actualizado', type: 'success' });
            } else {
                await addIngreso({ ...ingreso, mesAnio: selectedMonth.mesAnio });
                setShowToast({ message: 'Ingreso agregado', type: 'success' });
            }
            cargarIngresos();
            setShowModal(false);
            setIngresoEditar(null);
        } catch (error) {
            console.error('Error:', error);
            setShowToast({ message: 'Error al guardar', type: 'error' });
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar este ingreso?')) return;
        try {
            await deleteIngreso(id);
            setShowToast({ message: 'Ingreso eliminado', type: 'success' });
            cargarIngresos();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Calcular totales
    const totalesPorPerfil = useMemo(() => {
        const totales = {};
        perfiles.forEach(p => {
            totales[p.id] = ingresos
                .filter(i => i.perfilId === p.id)
                .reduce((sum, i) => sum + i.monto, 0);
        });
        return totales;
    }, [ingresos, perfiles]);

    const totalGeneral = Object.values(totalesPorPerfil).reduce((sum, val) => sum + val, 0);

    if (!selectedMonth) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📅"
                    title="Selecciona un mes"
                    description="Para gestionar ingresos, primero debes tener un mes cargado."
                />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ingresos del Mes</h1>
                    <p className="text-gray-600">{getNombreMes(selectedMonth.mesAnio)}</p>
                </div>
                <button
                    onClick={() => { setIngresoEditar(null); setShowModal(true); }}
                    className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                >
                    + Agregar Ingreso
                </button>
            </div>

            {/* Totales por perfil */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {perfiles.map(perfil => (
                    <CardStat
                        key={perfil.id}
                        label={`Ingresos ${perfil.nombre}`}
                        value={formatearMonto(totalesPorPerfil[perfil.id] || 0)}
                        icon="💰"
                        color={perfil.id === 1 ? 'green' : 'blue'}
                    />
                ))}
                <CardStat
                    label="Total Familiar"
                    value={formatearMonto(totalGeneral)}
                    icon="💵"
                    color="indigo"
                />
            </div>

            {/* Lista de ingresos */}
            <Card>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : ingresos.length === 0 ? (
                    <EmptyState
                        icon="💰"
                        title="No hay ingresos registrados"
                        description="Agrega los ingresos mensuales tuyos y de tu esposa para hacer seguimiento del balance."
                    />
                ) : (
                    <div className="space-y-3">
                        {ingresos.map(ingreso => {
                            const perfil = perfiles.find(p => p.id === ingreso.perfilId);

                            return (
                                <div
                                    key={ingreso.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                            style={{ backgroundColor: perfil?.color || '#6366f1' }}
                                        >
                                            {perfil?.nombre.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{ingreso.descripcion}</h3>
                                            <p className="text-sm text-gray-600">
                                                {perfil?.nombre}
                                                {ingreso.esRecurrente && <Badge color="green" size="sm" className="ml-2">Recurrente</Badge>}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">{formatearMonto(ingreso.monto)}</p>
                                            <p className="text-xs text-gray-500">{formatearFecha(ingreso.fecha)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => { setIngresoEditar(ingreso); setShowModal(true); }}
                                            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(ingreso.id)}
                                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {showModal && (
                <ModalIngreso
                    ingreso={ingresoEditar}
                    perfiles={perfiles}
                    onClose={() => { setShowModal(false); setIngresoEditar(null); }}
                    onGuardar={handleGuardar}
                />
            )}

            {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
        </div>
    );
};

const ModalIngreso = ({ ingreso, perfiles, onClose, onGuardar }) => {
    const [form, setForm] = useState({
        descripcion: ingreso?.descripcion || '',
        perfilId: ingreso?.perfilId || perfiles[0]?.id,
        monto: ingreso?.monto || 0,
        esRecurrente: ingreso?.esRecurrente || false
    });

    return (
        <Modal isOpen={true} onClose={onClose} title={ingreso ? 'Editar Ingreso' : 'Nuevo Ingreso'} size="md">
            <form onSubmit={(e) => { e.preventDefault(); onGuardar(form); }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input
                        type="text"
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Sueldo, Bono, Freelance"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                    <select
                        value={form.perfilId}
                        onChange={(e) => setForm({ ...form, perfilId: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    >
                        {perfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                    <input
                        type="number"
                        value={form.monto}
                        onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                        min="0"
                        step="1000"
                    />
                </div>
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        id="esRecurrente"
                        checked={form.esRecurrente}
                        onChange={(e) => setForm({ ...form, esRecurrente: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="esRecurrente" className="ml-2 text-sm text-gray-700">
                        Ingreso recurrente mensual
                    </label>
                </div>
                <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        Cancelar
                    </button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        {ingreso ? 'Actualizar' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
