// Página Recurrentes - Gestión de gastos mensuales recurrentes

const Recurrentes = () => {
    const { perfiles, categorias } = useApp();
    const [recurrentes, setRecurrentes] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [recurrenteEditar, setRecurrenteEditar] = useState(null);
    const [showToast, setShowToast] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        cargarRecurrentes();
    }, []);

    const cargarRecurrentes = async () => {
        setLoading(true);
        try {
            const recs = await db.recurrentes.toArray();
            setRecurrentes(recs);
        } catch (error) {
            console.error('Error al cargar recurrentes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async (recurrente) => {
        try {
            if (recurrenteEditar) {
                await db.recurrentes.update(recurrenteEditar.id, recurrente);
                setShowToast({ message: 'Recurrente actualizada', type: 'success' });
            } else {
                await db.recurrentes.add({ ...recurrente, activa: 1 });
                setShowToast({ message: 'Recurrente creada', type: 'success' });
            }
            cargarRecurrentes();
            setShowModal(false);
        } catch (error) {
            console.error('Error:', error);
            setShowToast({ message: 'Error al guardar', type: 'error' });
        }
    };

    const handleEliminar = async (id) => {
        if (!confirm('¿Eliminar esta recurrente?')) return;
        try {
            await db.recurrentes.delete(id);
            setShowToast({ message: 'Recurrente eliminada', type: 'success' });
            cargarRecurrentes();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleToggleActiva = async (rec) => {
        try {
            await db.recurrentes.update(rec.id, { activa: rec.activa ? 0 : 1 });
            cargarRecurrentes();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gastos Recurrentes</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gestiona gastos mensuales, anuales, semestrales y más</p>
                </div>
                <button onClick={() => { setRecurrenteEditar(null); setShowModal(true); }} className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg">
                    + Nueva Recurrente
                </button>
            </div>

            <Card>
                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                ) : recurrentes.length === 0 ? (
                    <EmptyState icon="🔄" title="No hay recurrentes" description="Agrega gastos que se repiten cada mes como Netflix, servicios, etc." />
                ) : (
                    <div className="space-y-3">
                        {recurrentes.map(rec => {
                            const categoria = categorias.find(c => c.id === rec.categoria);
                            const perfil = perfiles.find(p => p.id === rec.perfilId);

                            // Calcular info de próximo pago
                            const fechaPago = new Date(rec.fechaProximoPago + 'T00:00:00');
                            const hoy = new Date();
                            const diasHasta = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24));

                            const getFrecuenciaLabel = (frec) => {
                                const labels = {
                                    'mensual': 'Mensual',
                                    'bimestral': 'Bimestral',
                                    'trimestral': 'Trimestral',
                                    'semestral': 'Semestral',
                                    'anual': 'Anual'
                                };
                                return labels[frec] || frec;
                            };

                            const getMesesFrecuencia = (frec) => {
                                const meses = {
                                    'mensual': 1,
                                    'bimestral': 2,
                                    'trimestral': 3,
                                    'semestral': 6,
                                    'anual': 12
                                };
                                return meses[frec] || 1;
                            };

                            const montoMensual = rec.monto / getMesesFrecuencia(rec.frecuencia || 'mensual');
                            const urgencia = diasHasta <= 7 ? 'urgent' : diasHasta <= 30 ? 'soon' : 'later';

                            return (
                                <div key={rec.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <span className="text-3xl">{categoria?.icono || '🔄'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 flex-wrap">
                                                <h3 className="font-semibold text-gray-800 dark:text-white">{rec.nombre}</h3>
                                                {!rec.activa && <Badge color="gray" size="sm">Inactiva</Badge>}
                                                <Badge color={urgencia === 'urgent' ? 'red' : urgencia === 'soon' ? 'yellow' : 'blue'} size="sm">
                                                    {getFrecuenciaLabel(rec.frecuencia)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{categoria?.nombre} • {perfil?.nombre}</p>
                                            <p className={`text-xs font-medium mt-1 ${
                                                urgencia === 'urgent' ? 'text-red-600 dark:text-red-400' :
                                                urgencia === 'soon' ? 'text-yellow-600 dark:text-yellow-400' :
                                                'text-blue-600 dark:text-blue-400'
                                            }`}>
                                                {diasHasta < 0 ? `Vencido hace ${Math.abs(diasHasta)} días` :
                                                 diasHasta === 0 ? 'Vence hoy' :
                                                 diasHasta === 1 ? 'Vence mañana' :
                                                 `Próximo pago: ${fechaPago.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}`}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-bold text-gray-800 dark:text-white">{formatearMonto(rec.monto)}</p>
                                            {rec.frecuencia !== 'mensual' && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">≈ {formatearMonto(montoMensual)}/mes</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button onClick={() => handleToggleActiva(rec)} className={`px-3 py-1 rounded text-sm font-medium ${rec.activa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {rec.activa ? '✓ Activa' : 'Inactiva'}
                                        </button>
                                        <button onClick={() => { setRecurrenteEditar(rec); setShowModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button onClick={() => handleEliminar(rec.id)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {showModal && <ModalRecurrente recurrente={recurrenteEditar} perfiles={perfiles} categorias={categorias} onClose={() => setShowModal(false)} onGuardar={handleGuardar} />}
            {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
        </div>
    );
};

const ModalRecurrente = ({ recurrente, perfiles, categorias, onClose, onGuardar }) => {
    const [form, setForm] = useState({
        nombre: recurrente?.nombre || '',
        categoria: recurrente?.categoria || categorias[0]?.id,
        perfilId: recurrente?.perfilId || perfiles[0]?.id,
        monto: recurrente?.monto || recurrente?.montoEstimado || 0,
        frecuencia: recurrente?.frecuencia || 'mensual',
        fechaProximoPago: recurrente?.fechaProximoPago || new Date().toISOString().split('T')[0]
    });

    const frecuencias = [
        { value: 'mensual', label: 'Mensual', meses: 1 },
        { value: 'bimestral', label: 'Bimestral (cada 2 meses)', meses: 2 },
        { value: 'trimestral', label: 'Trimestral (cada 3 meses)', meses: 3 },
        { value: 'semestral', label: 'Semestral (cada 6 meses)', meses: 6 },
        { value: 'anual', label: 'Anual (cada 12 meses)', meses: 12 }
    ];

    const getMesesFrecuencia = (frec) => {
        const f = frecuencias.find(f => f.value === frec);
        return f ? f.meses : 1;
    };

    const calcularMontoMensual = () => {
        const meses = getMesesFrecuencia(form.frecuencia);
        return meses > 0 ? (form.monto / meses).toFixed(0) : 0;
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={recurrente ? 'Editar Recurrente' : 'Nueva Recurrente'} size="md">
            <form onSubmit={(e) => { e.preventDefault(); onGuardar(form); }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                    <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Netflix, Seguro Auto, Spotify"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                        <select
                            value={form.categoria}
                            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Perfil</label>
                        <select
                            value={form.perfilId}
                            onChange={(e) => setForm({ ...form, perfilId: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            {perfiles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frecuencia de pago</label>
                    <select
                        value={form.frecuencia}
                        onChange={(e) => setForm({ ...form, frecuencia: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    >
                        {frecuencias.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto del pago</label>
                        <input
                            type="number"
                            value={form.monto}
                            onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                            min="0"
                            step="100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Próximo pago</label>
                        <input
                            type="date"
                            value={form.fechaProximoPago}
                            onChange={(e) => setForm({ ...form, fechaProximoPago: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                </div>

                {form.frecuencia !== 'mensual' && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            💡 Impacto mensual promedio: <span className="font-bold">{formatearMonto(calcularMontoMensual())}</span>
                        </p>
                    </div>
                )}

                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                        {recurrente ? 'Actualizar' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
