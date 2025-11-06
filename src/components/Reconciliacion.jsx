// Panel de Reconciliación Inteligente - Finzi v3.4

const Reconciliacion = ({ resultado, onConfirmar, onCancelar }) => {
    const [decisiones, setDecisiones] = useState({
        autoMatches: {}, // { manualId: 'accept' | 'reject' }
        suggestedMatches: {}, // { manualId: csvId | 'none' }
        noMatches: {} // { manualId: 'keep' | 'delete' }
    });

    // Inicializar decisiones con valores por defecto
    useEffect(() => {
        const defaultDecisiones = {
            autoMatches: {},
            suggestedMatches: {},
            noMatches: {}
        };

        // Auto-matches: aceptar por defecto
        resultado.autoMatches.forEach(match => {
            defaultDecisiones.autoMatches[match.manual.id] = 'accept';
        });

        // Suggested matches: aceptar sugerencia por defecto
        resultado.suggestedMatches.forEach(match => {
            defaultDecisiones.suggestedMatches[match.manual.id] = match.csv.id;
        });

        // No matches: mantener por defecto
        resultado.noMatches.forEach(item => {
            defaultDecisiones.noMatches[item.manual.id] = 'keep';
        });

        setDecisiones(defaultDecisiones);
    }, [resultado]);

    const handleConfirmar = async () => {
        // Procesar todas las decisiones
        const resultadoFinal = {
            fusionados: [],
            mantenidos: [],
            eliminados: []
        };

        try {
            // 1. Procesar auto-matches
            for (const match of resultado.autoMatches) {
                const decision = decisiones.autoMatches[match.manual.id];
                if (decision === 'accept') {
                    await window.fusionarTransacciones(match.manual, match.csv);
                    resultadoFinal.fusionados.push(match.manual.id);
                }
            }

            // 2. Procesar suggested matches
            for (const match of resultado.suggestedMatches) {
                const csvId = decisiones.suggestedMatches[match.manual.id];
                if (csvId && csvId !== 'none') {
                    // Buscar el CSV correspondiente
                    const csvMatch = csvId === match.csv.id ? match.csv : null;
                    if (csvMatch) {
                        await window.fusionarTransacciones(match.manual, csvMatch);
                        resultadoFinal.fusionados.push(match.manual.id);
                    }
                }
            }

            // 3. Procesar no-matches
            for (const item of resultado.noMatches) {
                const decision = decisiones.noMatches[item.manual.id];
                if (decision === 'keep') {
                    await window.marcarSinEmparejar(item.manual, 'Pago no incluido en TC');
                    resultadoFinal.mantenidos.push(item.manual.id);
                } else if (decision === 'delete') {
                    await db.transacciones.delete(item.manual.id);
                    resultadoFinal.eliminados.push(item.manual.id);
                }
            }

            onConfirmar(resultadoFinal);
        } catch (error) {
            console.error('Error en reconciliación:', error);
            alert('Error al procesar la reconciliación');
        }
    };

    const totalProcesar = resultado.autoMatches.length + resultado.suggestedMatches.length + resultado.noMatches.length;

    return (
        <Modal title="🔗 Reconciliación de Transacciones" onClose={onCancelar} size="xl">
            <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                        📊 Encontramos <span className="font-bold">{totalProcesar} transacciones manuales</span> del mes.
                        Revisa los emparejamientos sugeridos antes de confirmar.
                    </p>
                </div>

                {/* Sección 1: Emparejados automáticamente */}
                {resultado.autoMatches.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="text-2xl mr-2">✅</span>
                            Emparejados automáticamente ({resultado.autoMatches.length})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Match mayor al 85%. Se fusionarán automáticamente.
                        </p>
                        <div className="space-y-3">
                            {resultado.autoMatches.map(match => (
                                <div
                                    key={match.manual.id}
                                    className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Transacción manual */}
                                            <div className="mb-2">
                                                <span className="inline-block px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-semibold rounded mr-2">
                                                    🟠 Manual
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {match.manual.comercio}
                                                </span>
                                                <span className="ml-2 text-gray-700 dark:text-gray-300">
                                                    ${match.manual.monto.toLocaleString('es-CL')}
                                                </span>
                                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(match.manual.fecha).toLocaleDateString('es-CL')}
                                                </span>
                                            </div>

                                            {/* Flecha */}
                                            <div className="flex items-center my-1">
                                                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                </svg>
                                                <span className="ml-2 text-xs font-semibold text-green-700 dark:text-green-400">
                                                    Match {match.score}%
                                                </span>
                                            </div>

                                            {/* Transacción CSV */}
                                            <div>
                                                <span className="inline-block px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 text-xs font-semibold rounded mr-2">
                                                    ✅ CSV
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {match.csv.comercio}
                                                </span>
                                                <span className="ml-2 text-gray-700 dark:text-gray-300">
                                                    ${match.csv.monto.toLocaleString('es-CL')}
                                                </span>
                                                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(match.csv.fecha).toLocaleDateString('es-CL')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Toggle para rechazar */}
                                        <button
                                            onClick={() => {
                                                const newDecision = decisiones.autoMatches[match.manual.id] === 'accept' ? 'reject' : 'accept';
                                                setDecisiones({
                                                    ...decisiones,
                                                    autoMatches: {
                                                        ...decisiones.autoMatches,
                                                        [match.manual.id]: newDecision
                                                    }
                                                });
                                            }}
                                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                                decisiones.autoMatches[match.manual.id] === 'accept'
                                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                                    : 'bg-red-600 text-white hover:bg-red-700'
                                            }`}
                                        >
                                            {decisiones.autoMatches[match.manual.id] === 'accept' ? '✓ Aceptar' : '✗ Rechazar'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sección 2: Requieren revisión */}
                {resultado.suggestedMatches.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="text-2xl mr-2">⚠️</span>
                            Requieren revisión ({resultado.suggestedMatches.length})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Match entre 70-85%. Revisa si son el mismo gasto.
                        </p>
                        <div className="space-y-3">
                            {resultado.suggestedMatches.map(match => (
                                <div
                                    key={match.manual.id}
                                    className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
                                >
                                    {/* Transacción manual */}
                                    <div className="mb-2">
                                        <span className="inline-block px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-semibold rounded mr-2">
                                            🟠 Manual
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            {match.manual.comercio}
                                        </span>
                                        <span className="ml-2 text-gray-700 dark:text-gray-300">
                                            ${match.manual.monto.toLocaleString('es-CL')}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(match.manual.fecha).toLocaleDateString('es-CL')}
                                        </span>
                                    </div>

                                    {/* Opciones de emparejamiento */}
                                    <div className="mt-3 space-y-2">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            ¿Emparejar con?
                                        </p>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name={`match-${match.manual.id}`}
                                                checked={decisiones.suggestedMatches[match.manual.id] === match.csv.id}
                                                onChange={() => {
                                                    setDecisiones({
                                                        ...decisiones,
                                                        suggestedMatches: {
                                                            ...decisiones.suggestedMatches,
                                                            [match.manual.id]: match.csv.id
                                                        }
                                                    });
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-semibold">{match.csv.comercio}</span> - ${match.csv.monto.toLocaleString('es-CL')} ({new Date(match.csv.fecha).toLocaleDateString('es-CL')})
                                                <span className="ml-2 text-yellow-600 dark:text-yellow-400 font-medium">
                                                    {match.score}% match
                                                </span>
                                            </span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                name={`match-${match.manual.id}`}
                                                checked={decisiones.suggestedMatches[match.manual.id] === 'none'}
                                                onChange={() => {
                                                    setDecisiones({
                                                        ...decisiones,
                                                        suggestedMatches: {
                                                            ...decisiones.suggestedMatches,
                                                            [match.manual.id]: 'none'
                                                        }
                                                    });
                                                }}
                                                className="w-4 h-4"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                No emparejar (mantener separado)
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sección 3: Sin emparejar */}
                {resultado.noMatches.length > 0 && (
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                            <span className="text-2xl mr-2">❓</span>
                            Sin emparejar ({resultado.noMatches.length})
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            No se encontró match en el CSV. Probablemente pagos en efectivo o compras no facturadas.
                        </p>
                        <div className="space-y-3">
                            {resultado.noMatches.map(item => (
                                <div
                                    key={item.manual.id}
                                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-xs font-semibold rounded mr-2">
                                                🟠 Manual
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {item.manual.comercio}
                                            </span>
                                            <span className="ml-2 text-gray-700 dark:text-gray-300">
                                                ${item.manual.monto.toLocaleString('es-CL')}
                                            </span>
                                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(item.manual.fecha).toLocaleDateString('es-CL')}
                                            </span>
                                        </div>

                                        <select
                                            value={decisiones.noMatches[item.manual.id]}
                                            onChange={(e) => {
                                                setDecisiones({
                                                    ...decisiones,
                                                    noMatches: {
                                                        ...decisiones.noMatches,
                                                        [item.manual.id]: e.target.value
                                                    }
                                                });
                                            }}
                                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="keep">Mantener (no facturado)</option>
                                            <option value="delete">Eliminar (error)</option>
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button
                        onClick={onCancelar}
                        className="flex-1 px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-semibold"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirmar}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                    >
                        Confirmar Reconciliación
                    </button>
                </div>
            </div>
        </Modal>
    );
};
