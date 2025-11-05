// Componente Reembolsos - Sistema completo de seguimiento de reembolsos

const Reembolsos = () => {
    const { perfiles, mesesCargados } = useApp();
    const [reembolsos, setReembolsos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstado, setFiltroEstado] = useState('todos'); // todos, pendiente, solicitado, pagado
    const [showModalNuevo, setShowModalNuevo] = useState(false);
    const [showToast, setShowToast] = useState(null);

    useEffect(() => {
        cargarReembolsos();
    }, [filtroEstado]);

    const cargarReembolsos = async () => {
        setLoading(true);
        try {
            const estado = filtroEstado === 'todos' ? null : filtroEstado;
            const data = await getReembolsosConTransacciones(estado);
            setReembolsos(data);
        } catch (error) {
            console.error('Error al cargar reembolsos:', error);
            mostrarToast('Error al cargar reembolsos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const mostrarToast = (message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    const handleCambiarEstado = async (reembolsoId, nuevoEstado) => {
        try {
            await updateEstadoReembolso(reembolsoId, nuevoEstado);
            await cargarReembolsos();
            mostrarToast(`Estado actualizado a: ${nuevoEstado}`, 'success');
        } catch (error) {
            console.error('Error:', error);
            mostrarToast('Error al actualizar estado', 'error');
        }
    };

    const handleEliminar = async (reembolsoId) => {
        if (!confirm('¿Estás seguro de eliminar este reembolso?')) return;

        try {
            await deleteReembolso(reembolsoId);
            await cargarReembolsos();
            mostrarToast('Reembolso eliminado', 'success');
        } catch (error) {
            console.error('Error:', error);
            mostrarToast('Error al eliminar', 'error');
        }
    };

    // Calcular totales
    const totales = useMemo(() => {
        const pendientes = reembolsos.filter(r => r.estado === 'pendiente');
        const solicitados = reembolsos.filter(r => r.estado === 'solicitado');
        const pagados = reembolsos.filter(r => r.estado === 'pagado');

        return {
            pendiente: pendientes.reduce((sum, r) => sum + calcularMontoTotal(r), 0),
            solicitado: solicitados.reduce((sum, r) => sum + calcularMontoTotal(r), 0),
            pagado: pagados.reduce((sum, r) => sum + calcularMontoTotal(r), 0),
            total: reembolsos.reduce((sum, r) => sum + calcularMontoTotal(r), 0)
        };
    }, [reembolsos]);

    const calcularMontoTotal = (reembolso) => {
        if (reembolso.tipoCompra === 'spot') {
            return reembolso.transaccion?.monto || 0;
        } else {
            // Para cuotas: monto de la cuota * total de cuotas
            const montoCuota = reembolso.transaccion?.monto || 0;
            return montoCuota * reembolso.cuotasTotal;
        }
    };

    const getColorEstado = (estado) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
            case 'solicitado': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            case 'pagado': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
            default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Cargando reembolsos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reembolsos</h1>
                    <p className="text-gray-600 dark:text-gray-400">Gestiona gastos a reembolsar y devoluciones</p>
                </div>
                <button
                    onClick={() => setShowModalNuevo(true)}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center space-x-2"
                >
                    <span>+</span>
                    <span>Nuevo Reembolso</span>
                </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <CardStat
                    label="Pendientes"
                    value={formatearMonto(totales.pendiente)}
                    icon="⏳"
                    color="yellow"
                    subtitle={`${reembolsos.filter(r => r.estado === 'pendiente').length} reembolsos`}
                />
                <CardStat
                    label="Solicitados"
                    value={formatearMonto(totales.solicitado)}
                    icon="📤"
                    color="blue"
                    subtitle={`${reembolsos.filter(r => r.estado === 'solicitado').length} reembolsos`}
                />
                <CardStat
                    label="Pagados"
                    value={formatearMonto(totales.pagado)}
                    icon="✅"
                    color="green"
                    subtitle={`${reembolsos.filter(r => r.estado === 'pagado').length} reembolsos`}
                />
                <CardStat
                    label="Total"
                    value={formatearMonto(totales.total)}
                    icon="💰"
                    color="indigo"
                    subtitle={`${reembolsos.length} reembolsos`}
                />
            </div>

            {/* Filtros */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtrar por estado:</span>
                    {['todos', 'pendiente', 'solicitado', 'pagado'].map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                filtroEstado === estado
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Reembolsos */}
            {reembolsos.length === 0 ? (
                <EmptyState
                    icon="💸"
                    title="No hay reembolsos"
                    description="Crea un nuevo reembolso para comenzar el seguimiento"
                    action={
                        <button
                            onClick={() => setShowModalNuevo(true)}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                        >
                            Crear Reembolso
                        </button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {reembolsos.map(reembolso => (
                        <ReembolsoCard
                            key={reembolso.id}
                            reembolso={reembolso}
                            perfiles={perfiles}
                            onCambiarEstado={handleCambiarEstado}
                            onEliminar={handleEliminar}
                            getColorEstado={getColorEstado}
                            calcularMontoTotal={calcularMontoTotal}
                        />
                    ))}
                </div>
            )}

            {/* Modales */}
            {showModalNuevo && (
                <ModalNuevoReembolso
                    onClose={() => setShowModalNuevo(false)}
                    onSuccess={() => {
                        cargarReembolsos();
                        setShowModalNuevo(false);
                        mostrarToast('Reembolso creado exitosamente', 'success');
                    }}
                    mesesCargados={mesesCargados}
                    perfiles={perfiles}
                />
            )}

            {/* Toast */}
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

// Componente Card para cada reembolso
const ReembolsoCard = memo(({ reembolso, perfiles, onCambiarEstado, onEliminar, getColorEstado, calcularMontoTotal }) => {
    const [mostrarDetalle, setMostrarDetalle] = useState(false);
    const transaccion = reembolso.transaccion;
    const perfil = perfiles.find(p => p.id === transaccion?.perfilId);

    const montoTotal = calcularMontoTotal(reembolso);

    return (
        <Card className="hover-lift">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getColorEstado(reembolso.estado)}`}>
                            {reembolso.estado.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {reembolso.tipoCompra === 'cuotas' ? '📅 Compra en cuotas' : '⚡ Compra spot'}
                        </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {transaccion?.comercio || 'Comercio desconocido'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {transaccion?.descripcion || 'Sin descripción'}
                    </p>

                    <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            👤 <strong>Deudor:</strong> {reembolso.nombreDeudor}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                            💰 <strong>Total:</strong> {formatearMonto(montoTotal)}
                        </span>
                        {reembolso.tipoCompra === 'cuotas' && (
                            <span className="text-gray-600 dark:text-gray-400">
                                📊 <strong>Cuotas:</strong> {reembolso.cuotasTotal}x {formatearMonto(transaccion?.monto || 0)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={() => setMostrarDetalle(!mostrarDetalle)}
                        className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                        {mostrarDetalle ? '▲ Ocultar detalle' : '▼ Ver detalle'}
                    </button>

                    {mostrarDetalle && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-sm space-y-1">
                            <p><strong>Fecha creación:</strong> {formatearFecha(reembolso.fechaCreacion)}</p>
                            {reembolso.fechaSolicitud && (
                                <p><strong>Fecha solicitud:</strong> {formatearFecha(reembolso.fechaSolicitud)}</p>
                            )}
                            {reembolso.fechaPago && (
                                <p><strong>Fecha pago:</strong> {formatearFecha(reembolso.fechaPago)}</p>
                            )}
                            <p><strong>Perfil:</strong> {perfil?.nombre || 'Desconocido'}</p>
                            <p><strong>Categoría:</strong> {transaccion?.categoria || 'Sin categoría'}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                    {reembolso.estado === 'pendiente' && (
                        <button
                            onClick={() => onCambiarEstado(reembolso.id, 'solicitado')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            Marcar Solicitado
                        </button>
                    )}
                    {reembolso.estado === 'solicitado' && (
                        <button
                            onClick={() => onCambiarEstado(reembolso.id, 'pagado')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            Marcar Pagado
                        </button>
                    )}
                    <button
                        onClick={() => onEliminar(reembolso.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </Card>
    );
});

// Modal para crear nuevo reembolso
const ModalNuevoReembolso = ({ onClose, onSuccess, mesesCargados, perfiles }) => {
    const [paso, setPaso] = useState(1); // 1: Seleccionar transacción, 2: Confirmar datos
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [transacciones, setTransacciones] = useState([]);
    const [transaccionSeleccionada, setTransaccionSeleccionada] = useState(null);
    const [nombreDeudor, setNombreDeudor] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (mesesCargados.length > 0 && !mesSeleccionado) {
            const mesReciente = mesesCargados.sort((a, b) =>
                new Date(b.mesAnio) - new Date(a.mesAnio)
            )[0];
            setMesSeleccionado(mesReciente);
        }
    }, [mesesCargados]);

    useEffect(() => {
        if (mesSeleccionado) {
            cargarTransacciones();
        }
    }, [mesSeleccionado]);

    const cargarTransacciones = async () => {
        try {
            const trans = await getTransaccionesByMes(mesSeleccionado.id);
            // Filtrar solo las que NO son reembolsables aún
            const disponibles = trans.filter(t => !t.esReembolsable);
            setTransacciones(disponibles);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleSeleccionarTransaccion = (transaccion) => {
        setTransaccionSeleccionada(transaccion);
        setPaso(2);
    };

    const handleCrear = async () => {
        if (!nombreDeudor.trim()) {
            alert('Debes ingresar el nombre del deudor');
            return;
        }

        setGuardando(true);
        try {
            const tipoCompra = transaccionSeleccionada.cuotasTotal > 1 ? 'cuotas' : 'spot';

            await addReembolso({
                transaccionOrigenId: transaccionSeleccionada.id,
                nombreDeudor: nombreDeudor.trim(),
                estado: 'pendiente',
                tipoCompra,
                cuotasTotal: transaccionSeleccionada.cuotasTotal || 1
            });

            onSuccess();
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear reembolso');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={paso === 1 ? 'Seleccionar Transacción' : 'Confirmar Reembolso'}
            size="lg"
        >
            {paso === 1 ? (
                <div className="space-y-4">
                    {/* Selector de mes */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Mes
                        </label>
                        <select
                            value={mesSeleccionado?.id || ''}
                            onChange={(e) => {
                                const mes = mesesCargados.find(m => m.id === parseInt(e.target.value));
                                setMesSeleccionado(mes);
                            }}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            {mesesCargados.map(mes => (
                                <option key={mes.id} value={mes.id}>
                                    {getNombreMes(mes.mesAnio)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Lista de transacciones */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Selecciona una transacción ({transacciones.length} disponibles)
                        </label>
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {transacciones.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No hay transacciones disponibles en este mes
                                </p>
                            ) : (
                                transacciones.map(trans => {
                                    const perfil = perfiles.find(p => p.id === trans.perfilId);
                                    return (
                                        <button
                                            key={trans.id}
                                            onClick={() => handleSeleccionarTransaccion(trans)}
                                            className="w-full p-3 border-2 border-gray-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-lg text-left transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 dark:text-white">{trans.comercio}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{trans.descripcion}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                        {perfil?.nombre} • {formatearFecha(trans.fecha)}
                                                        {trans.cuotasTotal > 1 && ` • ${trans.cuotaActual}/${trans.cuotasTotal}`}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                                        {formatearMonto(trans.monto)}
                                                    </p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Resumen de transacción */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-2">Transacción seleccionada:</h3>
                        <p><strong>Comercio:</strong> {transaccionSeleccionada.comercio}</p>
                        <p><strong>Descripción:</strong> {transaccionSeleccionada.descripcion}</p>
                        <p><strong>Monto:</strong> {formatearMonto(transaccionSeleccionada.monto)}</p>
                        {transaccionSeleccionada.cuotasTotal > 1 && (
                            <p><strong>Cuotas:</strong> {transaccionSeleccionada.cuotaActual}/{transaccionSeleccionada.cuotasTotal}</p>
                        )}
                    </div>

                    {/* Nombre del deudor */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            ¿Quién debe reembolsar este gasto? *
                        </label>
                        <input
                            type="text"
                            value={nombreDeudor}
                            onChange={(e) => setNombreDeudor(e.target.value)}
                            placeholder="Ej: Juan Pérez, Empresa ABC, etc."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    {/* Información adicional */}
                    {transaccionSeleccionada.cuotasTotal > 1 && (
                        <AlertBadge type="info">
                            <strong>Compra en cuotas detectada:</strong> Se creará un seguimiento para solicitar el reembolso mes a mes (cada cuota).
                        </AlertBadge>
                    )}

                    {/* Botones */}
                    <div className="flex space-x-3">
                        <button
                            onClick={() => setPaso(1)}
                            className="flex-1 px-6 py-3 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Atrás
                        </button>
                        <button
                            onClick={handleCrear}
                            disabled={guardando || !nombreDeudor.trim()}
                            className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {guardando ? 'Creando...' : 'Crear Reembolso'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
