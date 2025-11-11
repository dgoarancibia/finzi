// Modal para Cargar PDF del Estado de Cuenta - Finzi v3.5

const ModalCargarPDF = ({ onClose, onSuccess }) => {
    const { perfiles } = useApp();
    const [paso, setPaso] = useState(1); // 1: Mes/año + Banco, 2: Subir PDF, 3: Preview, 4: Confirmar
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [bancoSeleccionado, setBancoSeleccionado] = useState('');
    const [perfilSeleccionado, setPerfilSeleccionado] = useState(perfiles[0]?.id || 1);
    const [transaccionesParsed, setTransaccionesParsed] = useState([]);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);

    const aniosDisponibles = [new Date().getFullYear(), new Date().getFullYear() - 1];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Lista de bancos disponibles
    const bancos = [
        { id: 'santander', nombre: 'Banco Santander', icon: '🏦' },
        { id: 'bci', nombre: 'Banco BCI', icon: '🏦' },
        { id: 'chile', nombre: 'Banco de Chile / Edwards', icon: '🏦' },
        { id: 'estado', nombre: 'BancoEstado', icon: '🏦' },
        { id: 'scotiabank', nombre: 'Scotiabank', icon: '🏦' },
        { id: 'falabella', nombre: 'Banco Falabella (CMR)', icon: '💳' },
        { id: 'ripley', nombre: 'Banco Ripley', icon: '💳' },
        { id: 'itau', nombre: 'Itaú', icon: '🏦' },
        { id: 'generico', nombre: 'Otro / No sé', icon: '📄' }
    ];

    const handleArchivoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setProcesando(true);

        try {
            // Validar PDF
            const validacion = await validarPDF(file);
            if (!validacion.valido) {
                setError(validacion.error);
                setProcesando(false);
                return;
            }

            setArchivo(file);
            setProcesando(false);
            setPaso(3); // Ir a preview

            // Parsear automáticamente - PASAR EL FILE DIRECTAMENTE
            await parsearPDF(file);

        } catch (err) {
            setError(err.message || 'Error al procesar el archivo');
            setProcesando(false);
        }
    };

    const parsearPDF = async (fileParam = null) => {
        // Usar el parámetro si se proporciona, sino el estado
        const archivoAParsear = fileParam || archivo;

        console.log('🚀 [ModalPDF] parsearPDF iniciado');
        console.log('📁 Archivo:', archivoAParsear?.name, archivoAParsear?.size, 'bytes');
        console.log('📅 Mes seleccionado:', mesSeleccionado);
        console.log('🏦 Banco seleccionado:', bancoSeleccionado);

        if (!archivoAParsear || mesSeleccionado === null) {
            console.warn('⚠️ [ModalPDF] No hay archivo o mes seleccionado');
            return;
        }

        setProcesando(true);
        setError(null);

        try {
            const mesAnio = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;
            console.log('🗓️ [ModalPDF] Mes/Año:', mesAnio);
            console.log('🔧 [ModalPDF] Llamando a window.parsearPDF...');

            // Parsear PDF con el banco seleccionado - USAR archivoAParsear
            const resultado = await window.parsearPDF(archivoAParsear, bancoSeleccionado === 'generico' ? null : bancoSeleccionado, mesAnio);

            console.log('✅ [ModalPDF] parsearPDF completado. Transacciones:', resultado.transacciones?.length);

            // Categorizar automáticamente las transacciones
            const transaccionesCategorizadas = resultado.transacciones.map(t => {
                const categoriaSugerida = categorizarAutomatico(t.descripcion);

                return {
                    ...t,
                    categoria: categoriaSugerida,
                    perfilId: perfilSeleccionado,
                    esCompartido: false,
                    esReembolsable: false,
                    reembolsoId: null
                };
            });

            setTransaccionesParsed(transaccionesCategorizadas);
            setProcesando(false);

            // Mostrar info del banco detectado
            if (resultado.bancoDetectado && bancoSeleccionado === 'generico') {
                const bancoInfo = bancos.find(b => b.id === resultado.bancoDetectado);
                if (bancoInfo) {
                    setError(`✓ Banco detectado automáticamente: ${bancoInfo.nombre}`);
                }
            }

        } catch (err) {
            console.error('Error al parsear PDF:', err);
            setError(err.message || 'No se pudieron extraer las transacciones del PDF');
            setProcesando(false);
        }
    };

    const handleGuardar = async () => {
        setProcesando(true);
        try {
            const mesAnio = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;

            // Obtener o crear mes
            const mesAnioId = await getOrCreateMesAnio(mesAnio);

            // Agregar transacciones (marcadas como 'csv' y 'confirmado')
            const transaccionesParaGuardar = transaccionesParsed.map(t => ({
                ...t,
                mesAnioId,
                origen: 'csv',
                estado: 'confirmado',
                textoOriginal: null,
                transaccionRelacionadaId: null
            }));

            await addTransacciones(transaccionesParaGuardar);

            // Crear presupuestos base si no existen
            const presupuestosExistentes = await getPresupuestos(mesAnioId);
            if (presupuestosExistentes.length === 0) {
                const plantilla = await getPresupuestos(null);
                if (plantilla.length > 0) {
                    await savePresupuestos(plantilla.map(p => ({
                        categoria: p.categoria,
                        monto: p.monto
                    })), mesAnioId);
                }
            }

            // RECONCILIACIÓN: Buscar transacciones manuales provisionales de este mes
            const resultado = await window.ejecutarReconciliacion(mesAnio);

            setProcesando(false);

            // Si hay transacciones para reconciliar, cerrar este modal y mostrar reconciliación
            if (resultado.totalManuales > 0) {
                // TODO: Mostrar modal de reconciliación
                onSuccess(mesAnioId);
                onClose();
            } else {
                onSuccess(mesAnioId);
                onClose();
            }

        } catch (err) {
            console.error('Error al guardar:', err);
            setError('Error al guardar las transacciones');
            setProcesando(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Cargar PDF"
            size="md"
        >
            <div className="space-y-4">
                {/* Indicador de pasos */}
                <div className="flex items-center justify-between">
                    {[1, 2, 3].map(num => (
                        <div key={num} className="flex items-center flex-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                paso >= num ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {num}
                            </div>
                            {num < 3 && (
                                <div className={`flex-1 h-1 mx-2 ${
                                    paso > num ? 'bg-indigo-600' : 'bg-gray-200'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <div className={`p-3 rounded-lg ${
                        error.startsWith('✓')
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                        <p className={`text-sm ${
                            error.startsWith('✓')
                                ? 'text-green-800 dark:text-green-300'
                                : 'text-red-800 dark:text-red-300'
                        }`}>
                            {error}
                        </p>
                    </div>
                )}

                {/* Paso 1: Seleccionar Mes/Año y Banco */}
                {paso === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Selecciona el mes del estado de cuenta
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {meses.map((mes, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setMesSeleccionado(index)}
                                        className={`py-2 px-2 rounded-lg font-semibold text-sm transition-colors ${
                                            mesSeleccionado === index
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {mes}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Año
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {aniosDisponibles.map(anio => (
                                    <button
                                        key={anio}
                                        onClick={() => setAnioSeleccionado(anio)}
                                        className={`py-3 px-4 rounded-lg font-semibold transition-colors ${
                                            anioSeleccionado === anio
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {anio}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Selecciona tu banco
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                {bancos.map(banco => (
                                    <button
                                        key={banco.id}
                                        onClick={() => setBancoSeleccionado(banco.id)}
                                        className={`py-3 px-3 rounded-lg font-semibold text-sm transition-colors text-left flex items-center space-x-2 ${
                                            bancoSeleccionado === banco.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        <span className="text-xl">{banco.icon}</span>
                                        <span className="flex-1">{banco.nombre}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setPaso(2)}
                            disabled={mesSeleccionado === null || !bancoSeleccionado}
                            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* Paso 2: Subir PDF */}
                {paso === 2 && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Sube el PDF del estado de cuenta de <span className="font-bold">{meses[mesSeleccionado]} {anioSeleccionado}</span>
                            </p>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleArchivoChange}
                                className="hidden"
                                id="pdf-upload"
                            />
                            <label
                                htmlFor="pdf-upload"
                                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer font-semibold"
                            >
                                📑 Seleccionar PDF
                            </label>
                        </div>

                        <button
                            onClick={() => setPaso(1)}
                            className="w-full px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                        >
                            Volver
                        </button>
                    </div>
                )}

                {/* Paso 3: Preview */}
                {paso === 3 && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                Transacciones encontradas: {transaccionesParsed.length}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Revisa que las transacciones se hayan extraído correctamente
                            </p>
                        </div>

                        {/* Lista de transacciones */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {transaccionesParsed.slice(0, 10).map((t, index) => (
                                <div key={index} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                                {t.comercio}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {t.fecha} • {t.categoria}
                                            </p>
                                        </div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {formatearMonto(t.monto)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {transaccionesParsed.length > 10 && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                    ... y {transaccionesParsed.length - 10} más
                                </p>
                            )}
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setPaso(2);
                                    setArchivo(null);
                                    setTransaccionesParsed([]);
                                }}
                                className="flex-1 px-6 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                            >
                                Cambiar PDF
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={procesando || transaccionesParsed.length === 0}
                                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
                            >
                                {procesando ? 'Guardando...' : `Guardar ${transaccionesParsed.length} Transacciones`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
