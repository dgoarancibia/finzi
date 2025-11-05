// Componente Balance - Cálculo de neto de deudas entre perfiles

const Balance = () => {
    const { selectedMonth, perfiles } = useApp();
    const [transacciones, setTransacciones] = useState([]);
    const [liquidaciones, setLiquidaciones] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarModalLiquidar, setMostrarModalLiquidar] = useState(false);
    const [showToast, setShowToast] = useState(null);

    // Función para mostrar toast
    const mostrarToast = (message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    useEffect(() => {
        if (selectedMonth) {
            cargarDatos();
        }
    }, [selectedMonth]);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const trans = await getTransaccionesByMes(selectedMonth.id);
            setTransacciones(trans);

            const liq = await getLiquidaciones(selectedMonth.id);
            setLiquidaciones(liq);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calcular balance entre perfiles
    const balance = useMemo(() => {
        if (!selectedMonth || transacciones.length === 0 || perfiles.length < 2) {
            return null;
        }

        // Filtrar solo gastos compartidos
        const gastosCompartidos = transacciones.filter(t => t.esCompartido);

        if (gastosCompartidos.length === 0) {
            return null;
        }

        // Calcular por cada perfil
        const balancePorPerfil = {};

        perfiles.forEach(perfil => {
            balancePorPerfil[perfil.id] = {
                perfil: perfil,
                pagado: 0,
                debeRecuperar: 0,
                gastos: []
            };
        });

        // Procesar cada gasto compartido
        gastosCompartidos.forEach(t => {
            const perfilPago = t.perfilId;
            const perfilCompartido = t.perfilCompartidoId;
            const porcentajePerfil = t.porcentajePerfil || 50;
            const porcentajeCompartido = 100 - porcentajePerfil;

            // El que pagó
            if (balancePorPerfil[perfilPago]) {
                balancePorPerfil[perfilPago].pagado += t.monto;
                balancePorPerfil[perfilPago].debeRecuperar += (t.monto * porcentajeCompartido / 100);
                balancePorPerfil[perfilPago].gastos.push({
                    ...t,
                    montoPagado: t.monto,
                    montoRecuperar: (t.monto * porcentajeCompartido / 100)
                });
            }

            // El que compartió
            if (balancePorPerfil[perfilCompartido]) {
                // Este perfil debe pagar su parte
                balancePorPerfil[perfilCompartido].debeRecuperar -= (t.monto * porcentajeCompartido / 100);
            }
        });

        // Calcular neto entre perfiles (asumiendo 2 perfiles)
        const perfilesArray = Object.values(balancePorPerfil);
        if (perfilesArray.length !== 2) {
            return balancePorPerfil;
        }

        const [perfil1, perfil2] = perfilesArray;

        // Neto: quién le debe a quién
        let deudor = null;
        let acreedor = null;
        let montoNeto = 0;

        if (perfil1.debeRecuperar > perfil2.debeRecuperar) {
            acreedor = perfil1.perfil;
            deudor = perfil2.perfil;
            montoNeto = perfil1.debeRecuperar - perfil2.debeRecuperar;
        } else if (perfil2.debeRecuperar > perfil1.debeRecuperar) {
            acreedor = perfil2.perfil;
            deudor = perfil1.perfil;
            montoNeto = perfil2.debeRecuperar - perfil1.debeRecuperar;
        }

        return {
            balancePorPerfil,
            deudor,
            acreedor,
            montoNeto,
            totalGastosCompartidos: gastosCompartidos.reduce((sum, t) => sum + t.monto, 0),
            cantidadGastos: gastosCompartidos.length
        };
    }, [transacciones, perfiles, selectedMonth]);

    const handleLiquidar = async () => {
        if (!balance || balance.montoNeto === 0) return;

        try {
            const liquidacion = {
                mesAnioId: selectedMonth.id,
                mesAnio: selectedMonth.mesAnio,
                deudorId: balance.deudor.id,
                deudorNombre: balance.deudor.nombre,
                acreedorId: balance.acreedor.id,
                acreedorNombre: balance.acreedor.nombre,
                monto: balance.montoNeto,
                fecha: new Date().toISOString(),
                gastosIncluidos: balance.cantidadGastos
            };

            await addLiquidacion(liquidacion);
            await cargarDatos();
            setMostrarModalLiquidar(false);
            mostrarToast('Liquidación registrada exitosamente', 'success');
        } catch (error) {
            console.error('Error al liquidar:', error);
            mostrarToast('Error al registrar liquidación', 'error');
        }
    };

    if (!selectedMonth) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">💰 Balance del Mes</h1>
                    <p className="text-gray-600">Liquidación de gastos compartidos</p>
                </div>
                <EmptyState
                    icon="📅"
                    title="Selecciona un mes"
                    description="Para ver el balance, primero debes tener un mes cargado."
                />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">💰 Balance del Mes</h1>
                    <p className="text-gray-600">Liquidación de gastos compartidos</p>
                </div>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                        <p className="text-gray-900 text-xl font-semibold">Cargando balance...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">💰 Balance del Mes</h1>
                <p className="text-gray-600">
                    {selectedMonth ? `${selectedMonth.mesAnio}` : 'Liquidación de gastos compartidos'}
                </p>
            </div>

            {/* Resumen del Balance */}
            {!balance ? (
                <Card title="Sin gastos compartidos" icon="💰">
                    <div className="text-center py-8">
                        <p className="text-6xl mb-4">💑</p>
                        <p className="text-gray-700 font-medium mb-2">
                            No hay gastos compartidos en este mes
                        </p>
                        <p className="text-sm text-gray-500">
                            Marca algunas transacciones como compartidas en la página Home para ver el balance
                        </p>
                    </div>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CardStat
                            label="Total Gastos Compartidos"
                            value={formatearMonto(balance.totalGastosCompartidos)}
                            icon="🤝"
                            color="blue"
                        />
                        <CardStat
                            label="Cantidad de Gastos"
                            value={balance.cantidadGastos}
                            icon="📊"
                            color="purple"
                        />
                        <CardStat
                            label="Neto a Pagar"
                            value={balance.montoNeto > 0 ? formatearMonto(balance.montoNeto) : '$0'}
                            icon="💸"
                            color={balance.montoNeto > 0 ? 'green' : 'gray'}
                        />
                    </div>

                    {/* Balance por Perfil */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.values(balance.balancePorPerfil).map(datos => (
                            <Card key={datos.perfil.id} title={datos.perfil.nombre} icon="👤">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Total pagado</span>
                                        <span className="text-lg font-bold text-blue-600">{formatearMonto(datos.pagado)}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <span className="text-sm font-medium text-gray-700">Debe recuperar</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatearMonto(Math.abs(datos.debeRecuperar))}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {datos.gastos.length} gasto{datos.gastos.length !== 1 ? 's' : ''} compartido{datos.gastos.length !== 1 ? 's' : ''}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Resultado Final */}
                    {balance.montoNeto > 0 && (
                        <Card title="Resultado Final" icon="🎯">
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-2">Para equilibrar las cuentas:</p>
                                        <p className="text-2xl font-bold text-gray-800 mb-1">
                                            <span style={{ color: balance.deudor.color }}>{balance.deudor.nombre}</span>
                                            {' debe pagar '}
                                            <span className="text-green-600">{formatearMonto(balance.montoNeto)}</span>
                                            {' a '}
                                            <span style={{ color: balance.acreedor.color }}>{balance.acreedor.nombre}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Así ambos habrán pagado exactamente la mitad de los gastos compartidos
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setMostrarModalLiquidar(true)}
                                    className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                                >
                                    ✅ Marcar como Liquidado
                                </button>
                            </div>
                        </Card>
                    )}

                    {balance.montoNeto === 0 && (
                        <Card title="Resultado Final" icon="✅">
                            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200 text-center">
                                <p className="text-xl font-bold text-green-800">¡Las cuentas están equilibradas!</p>
                                <p className="text-sm text-green-600 mt-2">No hay deudas pendientes entre perfiles</p>
                            </div>
                        </Card>
                    )}

                    {/* Detalle de Gastos Compartidos */}
                    <Card title="Detalle de Gastos Compartidos" icon="📋">
                        <div className="space-y-2">
                            {Object.values(balance.balancePorPerfil).map(datos => (
                                datos.gastos.length > 0 && (
                                    <div key={datos.perfil.id} className="mb-6">
                                        <h4 className="font-semibold text-gray-700 mb-3">
                                            Pagados por {datos.perfil.nombre}:
                                        </h4>
                                        {datos.gastos.map((gasto, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-800">{gasto.comercio}</p>
                                                    <p className="text-xs text-gray-500">{formatearFecha(gasto.fecha)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-800">{formatearMonto(gasto.montoPagado)}</p>
                                                    <p className="text-xs text-green-600">
                                                        Recupera: {formatearMonto(gasto.montoRecuperar)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ))}
                        </div>
                    </Card>

                    {/* Historial de Liquidaciones */}
                    {liquidaciones.length > 0 && (
                        <Card title="Historial de Liquidaciones" icon="📜">
                            <div className="space-y-3">
                                {liquidaciones.map((liq, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-green-500">
                                        <div>
                                            <p className="font-medium text-gray-800">
                                                {liq.deudorNombre} pagó {formatearMonto(liq.monto)} a {liq.acreedorNombre}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatearFecha(liq.fecha)} • {liq.gastosIncluidos} gasto{liq.gastosIncluidos !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="text-green-600 text-2xl">✅</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </>
            )}

            {/* Modal Confirmar Liquidación */}
            {mostrarModalLiquidar && balance && (
                <Modal
                    isOpen={mostrarModalLiquidar}
                    onClose={() => setMostrarModalLiquidar(false)}
                    title="Confirmar Liquidación"
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-gray-700">
                            ¿Confirmas que <strong>{balance.deudor.nombre}</strong> ha pagado{' '}
                            <strong className="text-green-600">{formatearMonto(balance.montoNeto)}</strong> a{' '}
                            <strong>{balance.acreedor.nombre}</strong>?
                        </p>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            <p className="font-semibold mb-1">Esta acción registrará:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Fecha de liquidación: {formatearFecha(new Date())}</li>
                                <li>Monto: {formatearMonto(balance.montoNeto)}</li>
                                <li>Gastos incluidos: {balance.cantidadGastos}</li>
                            </ul>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setMostrarModalLiquidar(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleLiquidar}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </Modal>
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
