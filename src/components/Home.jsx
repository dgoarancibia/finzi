// Página Home - Dashboard principal

const Home = () => {
    const { selectedMonth, setSelectedMonth, selectedMonths, setSelectedMonths, perfiles, categorias, mesesCargados, refreshMesesCargados } = useApp();

    const [transacciones, setTransacciones] = useState([]);
    const [presupuestos, setPresupuestos] = useState([]);
    const [ingresos, setIngresos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('todas'); // todas, spot, cuotasMes, cuotasAnteriores
    const [filtros, setFiltros] = useState({ perfilId: null, categoria: null, busqueda: '' });
    const [showModalCargarCSV, setShowModalCargarCSV] = useState(false);
    const [showModalEditarTransaccion, setShowModalEditarTransaccion] = useState(false);
    const [transaccionEditar, setTransaccionEditar] = useState(null);
    const [showToast, setShowToast] = useState(null);
    const [showModalQuickAdd, setShowModalQuickAdd] = useState(false);
    const [showSelectorMeses, setShowSelectorMeses] = useState(false);
    const [showMenuFAB, setShowMenuFAB] = useState(false);
    const [showModalEntradaRapida, setShowModalEntradaRapida] = useState(false);
    const [showModalCargarPDF, setShowModalCargarPDF] = useState(false);

    // Cargar datos cuando cambian los meses seleccionados
    useEffect(() => {
        if (selectedMonths.length > 0) {
            cargarDatosDeMeses();
        }
    }, [selectedMonths]);

    const cargarDatosDeMeses = async () => {
        if (selectedMonths.length === 0) return;

        setLoading(true);
        try {
            // Cargar transacciones de todos los meses seleccionados
            const todasTransacciones = [];
            const todosPresupuestos = [];
            const todosIngresos = [];

            for (const mes of selectedMonths) {
                const trans = await getTransaccionesByMes(mes.id);
                todasTransacciones.push(...trans);

                const pres = await getPresupuestos(mes.id);
                todosPresupuestos.push(...pres);

                const ings = await getIngresos(mes.mesAnio);
                todosIngresos.push(...ings);
            }

            setTransacciones(todasTransacciones);
            setPresupuestos(todosPresupuestos);
            setIngresos(todosIngresos);
        } catch (error) {
            console.error('Error al cargar datos:', error);
            mostrarToast('Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const mostrarToast = (message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    // Función para toggle de selección de mes
    const toggleMesSeleccionado = (mes) => {
        const index = selectedMonths.findIndex(m => m.id === mes.id);
        if (index >= 0) {
            // Si ya está seleccionado, removerlo (pero mantener al menos uno)
            if (selectedMonths.length > 1) {
                const nuevosSeleccionados = selectedMonths.filter(m => m.id !== mes.id);
                setSelectedMonths(nuevosSeleccionados);
                setSelectedMonth(nuevosSeleccionados[0]);
            }
        } else {
            // Si no está seleccionado, agregarlo
            setSelectedMonths([...selectedMonths, mes]);
        }
    };

    // Función para seleccionar todos los meses
    const seleccionarTodosMeses = () => {
        setSelectedMonths(mesesCargados);
        if (mesesCargados.length > 0) {
            setSelectedMonth(mesesCargados[0]);
        }
    };

    // Función para limpiar selección (dejar solo uno)
    const limpiarSeleccion = () => {
        if (selectedMonths.length > 0) {
            setSelectedMonths([selectedMonths[0]]);
            setSelectedMonth(selectedMonths[0]);
        }
    };

    // Calcular estadísticas
    const desglose = useMemo(() => calcularDesglose(transacciones), [transacciones]);
    const gastosPorCategoria = useMemo(() => calcularGastosPorCategoria(transacciones), [transacciones]);
    const estadosPresupuestos = useMemo(() => calcularEstadoPresupuestos(transacciones, presupuestos), [transacciones, presupuestos]);
    const saludFinanciera = useMemo(() => calcularSaludFinanciera(estadosPresupuestos), [estadosPresupuestos]);
    const categoriasEnRiesgo = useMemo(() => getCategoriasEnRiesgo(estadosPresupuestos), [estadosPresupuestos]);
    const topGastos = useMemo(() => getTopGastos(transacciones, 3), [transacciones]);

    // Calcular disponible para gastar (US-008)
    const cuotasActivas = useMemo(() => {
        if (!selectedMonth) return [];
        return calcularCuotasActivas(transacciones, selectedMonth.mesAnio);
    }, [transacciones, selectedMonth]);

    const disponible = useMemo(() => {
        if (presupuestos.length === 0) return null;
        return calcularDisponible(transacciones, presupuestos, cuotasActivas);
    }, [transacciones, presupuestos, cuotasActivas]);

    // Calcular balance ingresos vs gastos
    const balanceIngresos = useMemo(() => {
        const totalIngresos = ingresos.reduce((sum, i) => sum + i.monto, 0);
        const totalGastos = desglose.total;
        const diferencia = totalIngresos - totalGastos;
        const porcentajeGastado = totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;

        return {
            totalIngresos,
            totalGastos,
            diferencia,
            porcentajeGastado
        };
    }, [ingresos, desglose]);

    // Proyectar cuotas para los próximos 12 meses
    const proyeccionCuotasFuturas = useMemo(() => {
        if (cuotasActivas.length === 0 || !selectedMonth) return [];

        const proyecciones = [];
        const mesActualDate = new Date(selectedMonth.mesAnio + '-01');
        // Comenzar desde el mes siguiente al mes cargado
        mesActualDate.setMonth(mesActualDate.getMonth() + 1);

        for (let i = 0; i < 12; i++) {
            const fechaMes = new Date(mesActualDate);
            fechaMes.setMonth(fechaMes.getMonth() + i);

            const mesAnio = `${fechaMes.getFullYear()}-${String(fechaMes.getMonth() + 1).padStart(2, '0')}`;

            let totalMes = 0;
            const cuotasDelMes = [];

            for (const cuota of cuotasActivas) {
                // Si esta cuota aún tiene cuotas restantes para este mes
                if (i < cuota.cuotasRestantes) {
                    totalMes += cuota.montoCuota;
                    cuotasDelMes.push({
                        ...cuota,
                        numeroCuota: cuota.cuotaActual + i + 1
                    });
                }
            }

            proyecciones.push({
                mesAnio,
                mesNombre: getNombreMes(mesAnio),
                total: totalMes,
                cuotas: cuotasDelMes,
                cantidadCuotas: cuotasDelMes.length
            });
        }

        return proyecciones;
    }, [cuotasActivas, selectedMonth]);

    // Calcular balance simple para mostrar en stats
    const balance = useMemo(() => {
        if (transacciones.length === 0 || perfiles.length < 2) return null;

        const gastosCompartidos = transacciones.filter(t => t.esCompartido);
        if (gastosCompartidos.length === 0) return null;

        const balancePorPerfil = {};
        perfiles.forEach(perfil => {
            balancePorPerfil[perfil.id] = { perfil, debeRecuperar: 0 };
        });

        gastosCompartidos.forEach(t => {
            const porcentajeCompartido = 100 - (t.porcentajePerfil || 50);
            if (balancePorPerfil[t.perfilId]) {
                balancePorPerfil[t.perfilId].debeRecuperar += (t.monto * porcentajeCompartido / 100);
            }
            if (balancePorPerfil[t.perfilCompartidoId]) {
                balancePorPerfil[t.perfilCompartidoId].debeRecuperar -= (t.monto * porcentajeCompartido / 100);
            }
        });

        const perfilesArray = Object.values(balancePorPerfil);
        if (perfilesArray.length !== 2) return null;

        const [perfil1, perfil2] = perfilesArray;
        let deudor = null, acreedor = null, montoNeto = 0;

        if (perfil1.debeRecuperar > perfil2.debeRecuperar) {
            acreedor = perfil1.perfil;
            deudor = perfil2.perfil;
            montoNeto = perfil1.debeRecuperar - perfil2.debeRecuperar;
        } else if (perfil2.debeRecuperar > perfil1.debeRecuperar) {
            acreedor = perfil2.perfil;
            deudor = perfil1.perfil;
            montoNeto = perfil2.debeRecuperar - perfil1.debeRecuperar;
        }

        return { deudor, acreedor, montoNeto };
    }, [transacciones, perfiles]);

    // Filtrar transacciones según tab y filtros
    const transaccionesFiltradas = useMemo(() => {
        let filtered = [...transacciones];

        // Filtrar por tab
        if (activeTab === 'spot') {
            // Spot: sin cuotas O pago del mes 1/1
            filtered = filtered.filter(t => !t.cuotaActual || (t.cuotaActual === 1 && t.cuotasTotal === 1));
        } else if (activeTab === 'cuotasMes') {
            // Cuotas del mes: primera cuota de compra en cuotas (1/2, 1/3, etc.)
            filtered = filtered.filter(t => t.cuotaActual === 1 && t.cuotasTotal > 1);
        } else if (activeTab === 'cuotasAnteriores') {
            // Cuotas anteriores: cuotas 2/12, 3/12, etc.
            filtered = filtered.filter(t => t.cuotaActual && t.cuotaActual > 1);
        }

        // Filtrar por perfil
        if (filtros.perfilId) {
            filtered = filtered.filter(t => t.perfilId === filtros.perfilId);
        }

        // Filtrar por categoría
        if (filtros.categoria) {
            filtered = filtered.filter(t => t.categoria === filtros.categoria);
        }

        // Filtrar por búsqueda
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            filtered = filtered.filter(t =>
                t.descripcion.toLowerCase().includes(busqueda) ||
                t.comercio.toLowerCase().includes(busqueda)
            );
        }

        return filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }, [transacciones, activeTab, filtros]);

    // Handlers
    const handleEliminarTransaccion = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;

        try {
            await deleteTransaccion(id);
            setTransacciones(prev => prev.filter(t => t.id !== id));
            mostrarToast('Transacción eliminada', 'success');
        } catch (error) {
            console.error('Error al eliminar:', error);
            mostrarToast('Error al eliminar transacción', 'error');
        }
    };

    const handleEditarTransaccion = (transaccion) => {
        setTransaccionEditar(transaccion);
        setShowModalEditarTransaccion(true);
    };

    const handleGuardarEdicion = async (cambios) => {
        try {
            await updateTransaccion(transaccionEditar.id, cambios);

            // Si cambió la categoría, aprenderla
            if (cambios.categoria && cambios.categoria !== transaccionEditar.categoria) {
                aprenderCategorizacion(transaccionEditar.comercio, cambios.categoria);
            }

            // Si cambió el nombre del comercio, aprenderlo para futuras importaciones
            // El comercio se aprende de forma SIMPLE: descripción original → comercio nuevo
            if (cambios.comercio && cambios.comercio !== transaccionEditar.comercio) {
                guardarComercioAprendido(transaccionEditar.descripcion, cambios.comercio);
                console.log(`✅ Aprendido comercio: "${transaccionEditar.descripcion}" → "${cambios.comercio}"`);
            }

            // Si cambió la descripción Y la transacción tiene cuotas, aprenderlo de forma INTELIGENTE
            // Solo se aplicará a las cuotas de la misma compra (mismo comercio + total de cuotas)
            if (cambios.descripcion && cambios.descripcion !== transaccionEditar.descripcion) {
                if (transaccionEditar.cuotasTotal && transaccionEditar.cuotasTotal > 1) {
                    // Crear una clave única: comercio + total de cuotas
                    const claveCompra = `${transaccionEditar.comercio}_${transaccionEditar.cuotasTotal}cuotas`;
                    guardarDescripcionAprendida(claveCompra, cambios.descripcion);
                    console.log(`✅ Aprendida descripción para cuotas: "${claveCompra}" → "${cambios.descripcion}"`);
                }
            }

            setTransacciones(prev => prev.map(t =>
                t.id === transaccionEditar.id ? { ...t, ...cambios } : t
            ));

            setShowModalEditarTransaccion(false);
            setTransaccionEditar(null);
            mostrarToast('Transacción actualizada', 'success');
        } catch (error) {
            console.error('Error al actualizar:', error);
            mostrarToast('Error al actualizar transacción', 'error');
        }
    };

    // Si no hay meses seleccionados, mostrar estado inicial
    if (selectedMonths.length === 0) {
        return (
            <div className="max-w-7xl mx-auto">
                <EmptyState
                    icon="📊"
                    title="Bienvenido a Analizador de Gastos TC"
                    description="Carga tu estado de cuenta desde PDF o CSV para comenzar a analizar tus gastos."
                    action={
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => setShowModalCargarPDF(true)}
                                className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">📑</span>
                                Cargar PDF
                            </button>
                            <button
                                onClick={() => setShowModalCargarCSV(true)}
                                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                <span className="text-xl">📄</span>
                                Cargar CSV
                            </button>
                        </div>
                    }
                />

                {showModalCargarPDF && (
                    <ModalCargarPDF
                        onClose={() => setShowModalCargarPDF(false)}
                        onSuccess={async (mesAnioId) => {
                            await refreshMesesCargados();
                            const mes = await db.mesesCarga.get(mesAnioId);
                            setSelectedMonth(mes);
                            setSelectedMonths([mes]);
                            setShowModalCargarPDF(false);
                            mostrarToast('PDF cargado exitosamente 📑', 'success');
                        }}
                    />
                )}

                {showModalCargarCSV && (
                    <ModalCargarCSV
                        onClose={() => setShowModalCargarCSV(false)}
                        onSuccess={async (mesAnioId) => {
                            console.log('🎯 onSuccess llamado con mesAnioId:', mesAnioId);

                            console.log('🔄 Refrescando meses cargados...');
                            await refreshMesesCargados();

                            console.log('📅 Obteniendo mes de DB...');
                            const mes = await db.mesesCarga.get(mesAnioId);
                            console.log('✅ Mes obtenido:', mes);

                            setSelectedMonth(mes);
                            setSelectedMonths([mes]);

                            // Cargar transacciones directamente sin esperar a que selectedMonths se actualice
                            console.log('📊 Cargando transacciones del mes...');
                            const trans = await getTransaccionesByMes(mesAnioId);
                            console.log(`✅ Transacciones cargadas: ${trans.length}`);

                            const pres = await getPresupuestos(mesAnioId);
                            console.log(`✅ Presupuestos cargados: ${pres.length}`);

                            const ings = await getIngresos(mes.mesAnio);
                            console.log(`✅ Ingresos cargados: ${ings.length}`);

                            console.log('💾 Actualizando estado de React...');
                            setTransacciones(trans);
                            setPresupuestos(pres);
                            setIngresos(ings);

                            console.log('✅ Estado actualizado, cerrando modal');
                            setShowModalCargarCSV(false);
                            mostrarToast('CSV cargado exitosamente', 'success');
                            console.log('🎉 Proceso completado');
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header con selector de mes y botón cargar */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Gastos</h1>
                    <p className="text-gray-600">Análisis detallado de tus transacciones</p>
                </div>
                <button
                    onClick={() => setShowModalCargarCSV(true)}
                    className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg"
                >
                    + Cargar CSV
                </button>
            </div>

            {/* Selector de Meses Múltiple */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                        <span className="text-2xl">📅</span>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                                {selectedMonths.length === 1
                                    ? getNombreMes(selectedMonths[0].mesAnio)
                                    : `${selectedMonths.length} meses seleccionados`
                                }
                            </p>
                            {selectedMonths.length > 1 && (
                                <div className="flex flex-wrap gap-1">
                                    {selectedMonths.slice(0, 3).map(mes => (
                                        <span
                                            key={mes.id}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                                        >
                                            {getNombreMes(mes.mesAnio)}
                                        </span>
                                    ))}
                                    {selectedMonths.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                                            +{selectedMonths.length - 3} más
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowSelectorMeses(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
                    >
                        <span>Seleccionar meses</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Estadísticas Clave - 4 cards principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <CardStat
                    label="Total del Mes"
                    value={formatearMonto(desglose.total)}
                    icon="💰"
                    color="indigo"
                />
                <CardStat
                    label="Spot"
                    value={formatearMonto(desglose.spot)}
                    icon="⚡"
                    color="blue"
                />
                <CardStat
                    label="Cuotas"
                    value={formatearMonto(desglose.cuotasMes + desglose.cuotasAnteriores)}
                    icon="📊"
                    color="purple"
                    subtitle={`Mes: ${formatearMonto(desglose.cuotasMes)} | Anteriores: ${formatearMonto(desglose.cuotasAnteriores)}`}
                />
                <CardStat
                    label="Compartidos"
                    value={formatearMonto(transacciones.filter(t => t.esCompartido).reduce((sum, t) => sum + t.monto, 0))}
                    icon="💑"
                    color="pink"
                    subtitle={balance && balance.montoNeto > 0 ? `${balance.deudor?.nombre} debe ${formatearMonto(balance.montoNeto)}` : 'Saldado'}
                />
            </div>

            {/* Gráfico Budget vs Real */}
            {presupuestos.length > 0 && (
                <GraficoBudgetVsReal
                    gastosPorCategoria={gastosPorCategoria}
                    presupuestos={presupuestos}
                    categorias={categorias}
                />
            )}

            {/* Resumen de Estados (Provisional vs Confirmado) */}
            <ResumenEstados transacciones={transacciones} />

            {/* Secciones Colapsables */}
            {ingresos.length > 0 && (
                <CollapsibleSection title="Balance Ingresos vs Gastos" icon="💰" defaultOpen={true}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <CardStat
                                label="Ingresos Totales"
                                value={formatearMonto(balanceIngresos.totalIngresos)}
                                icon="💵"
                                color="green"
                            />
                            <CardStat
                                label="Gastos Totales"
                                value={formatearMonto(balanceIngresos.totalGastos)}
                                icon="💳"
                                color="red"
                            />
                            <CardStat
                                label={balanceIngresos.diferencia >= 0 ? "Ahorro del Mes" : "Déficit del Mes"}
                                value={formatearMonto(Math.abs(balanceIngresos.diferencia))}
                                icon={balanceIngresos.diferencia >= 0 ? "✅" : "⚠️"}
                                color={balanceIngresos.diferencia >= 0 ? "green" : "red"}
                                subtitle={`${balanceIngresos.porcentajeGastado.toFixed(1)}% gastado`}
                            />
                        </div>

                        {balanceIngresos.diferencia >= 0 ? (
                            <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                                <p className="text-green-800 font-semibold">
                                    ✅ ¡Excelente! Este mes ahorraste {formatearMonto(balanceIngresos.diferencia)}.
                                    Revisa la sección de Proyecciones para ver cuándo podrías alcanzar tus metas.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
                                <p className="text-red-800 font-semibold">
                                    ⚠️ Este mes gastaste {formatearMonto(Math.abs(balanceIngresos.diferencia))} más de lo que ingresaste.
                                    Revisa tus presupuestos y considera reducir gastos variables.
                                </p>
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            )}

            <CollapsibleSection title="Balance de Gastos Compartidos" icon="💑" defaultOpen={false}>
                <BalanceCompartido transacciones={transacciones} perfiles={perfiles} />
            </CollapsibleSection>

            <CollapsibleSection title="Distribución por Categorías" icon="📊" defaultOpen={false}>
                <GraficoDistribucion gastosPorCategoria={gastosPorCategoria} categorias={categorias} />
            </CollapsibleSection>

            {cuotasActivas.length > 0 && (
                <CollapsibleSection title="Proyección de Cuotas Futuras (12 meses)" icon="📈" defaultOpen={false}>
                    <GraficoProyeccionCuotas proyeccion={proyeccionCuotasFuturas} />
                </CollapsibleSection>
            )}

            {/* Transacciones como sección colapsable */}
            <CollapsibleSection title="Transacciones" icon="💳" defaultOpen={true}>
                {/* Tabs */}
                <div className="flex space-x-2 border-b border-gray-200 mb-4">
                    {[
                        { id: 'todas', label: 'Todas' },
                        { id: 'spot', label: 'Spot' },
                        { id: 'cuotasMes', label: 'Cuotas Mes' },
                        { id: 'cuotasAnteriores', label: 'Cuotas Anteriores' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 font-semibold transition-colors ${
                                activeTab === tab.id
                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-indigo-600'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <select
                        value={filtros.perfilId || ''}
                        onChange={(e) => setFiltros(prev => ({ ...prev, perfilId: e.target.value ? parseInt(e.target.value) : null }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todos los perfiles</option>
                        {perfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>

                    <select
                        value={filtros.categoria || ''}
                        onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value || null }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Todas las categorías</option>
                        {categorias.map(c => (
                            <option key={c.id} value={c.id}>{c.icono} {c.nombre}</option>
                        ))}
                    </select>

                    <input
                        type="text"
                        placeholder="Buscar por descripción..."
                        value={filtros.busqueda}
                        onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Lista de Transacciones */}
                <ListaTransacciones
                    transacciones={transaccionesFiltradas}
                    perfiles={perfiles}
                    categorias={categorias}
                    onEditar={handleEditarTransaccion}
                    onEliminar={handleEliminarTransaccion}
                />
            </CollapsibleSection>

            {/* Modales */}
            {showModalCargarCSV && (
                <ModalCargarCSV
                    onClose={() => setShowModalCargarCSV(false)}
                    onSuccess={async (mesAnioId) => {
                        console.log('🎯 onSuccess llamado con mesAnioId:', mesAnioId);

                        console.log('🔄 Refrescando meses cargados...');
                        await refreshMesesCargados();

                        console.log('📅 Obteniendo mes de DB...');
                        const mes = await db.mesesCarga.get(mesAnioId);
                        console.log('✅ Mes obtenido:', mes);

                        setSelectedMonth(mes);
                        setSelectedMonths([mes]);

                        // Cargar transacciones directamente sin esperar a que selectedMonths se actualice
                        console.log('📊 Cargando transacciones del mes...');
                        const trans = await getTransaccionesByMes(mesAnioId);
                        console.log(`✅ Transacciones cargadas: ${trans.length}`);

                        const pres = await getPresupuestos(mesAnioId);
                        console.log(`✅ Presupuestos cargados: ${pres.length}`);

                        const ings = await getIngresos(mes.mesAnio);
                        console.log(`✅ Ingresos cargados: ${ings.length}`);

                        console.log('💾 Actualizando estado de React...');
                        setTransacciones(trans);
                        setPresupuestos(pres);
                        setIngresos(ings);

                        console.log('✅ Estado actualizado, cerrando modal');
                        setShowModalCargarCSV(false);
                        mostrarToast('CSV cargado exitosamente', 'success');
                        console.log('🎉 Proceso completado');
                    }}
                />
            )}

            {showModalEditarTransaccion && transaccionEditar && (
                <ModalEditarTransaccion
                    transaccion={transaccionEditar}
                    perfiles={perfiles}
                    categorias={categorias}
                    onClose={() => {
                        setShowModalEditarTransaccion(false);
                        setTransaccionEditar(null);
                    }}
                    onGuardar={handleGuardarEdicion}
                />
            )}

            {/* Modal Selector de Meses */}
            {showSelectorMeses && (
                <ModalSelectorMeses
                    mesesCargados={mesesCargados}
                    selectedMonths={selectedMonths}
                    onClose={() => setShowSelectorMeses(false)}
                    onToggleMes={toggleMesSeleccionado}
                    onSeleccionarTodos={seleccionarTodosMeses}
                    onLimpiarSeleccion={limpiarSeleccion}
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

            {/* Botón flotante con menú expandible (FAB) */}
            <div className="fixed bottom-8 right-8 z-50">
                {/* Overlay para cerrar el menú al hacer click fuera */}
                {showMenuFAB && (
                    <div
                        className="fixed inset-0 -z-10"
                        onClick={() => setShowMenuFAB(false)}
                    />
                )}

                {/* Opciones del menú (se expanden hacia arriba) */}
                {showMenuFAB && (
                    <div className="absolute bottom-20 right-0 flex flex-col space-y-3 animate-slideIn">
                        {/* Opción: Entrada Rápida */}
                        <button
                            onClick={() => {
                                setShowModalEntradaRapida(true);
                                setShowMenuFAB(false);
                            }}
                            className="flex items-center space-x-3 bg-white dark:bg-slate-800 text-gray-800 dark:text-white px-5 py-3 rounded-full shadow-xl hover:bg-indigo-50 dark:hover:bg-slate-700 transition-all transform hover:scale-105 whitespace-nowrap border-2 border-indigo-200 dark:border-indigo-800"
                        >
                            <span className="text-2xl">✍️</span>
                            <span className="font-semibold">Entrada Rápida</span>
                        </button>

                        {/* Opción: Cargar PDF */}
                        <button
                            onClick={() => {
                                setShowModalCargarPDF(true);
                                setShowMenuFAB(false);
                            }}
                            className="flex items-center space-x-3 bg-white dark:bg-slate-800 text-gray-800 dark:text-white px-5 py-3 rounded-full shadow-xl hover:bg-purple-50 dark:hover:bg-slate-700 transition-all transform hover:scale-105 whitespace-nowrap border-2 border-purple-200 dark:border-purple-800"
                        >
                            <span className="text-2xl">📑</span>
                            <span className="font-semibold">Cargar PDF</span>
                        </button>

                        {/* Opción: Cargar CSV */}
                        <button
                            onClick={() => {
                                setShowModalCargarCSV(true);
                                setShowMenuFAB(false);
                            }}
                            className="flex items-center space-x-3 bg-white dark:bg-slate-800 text-gray-800 dark:text-white px-5 py-3 rounded-full shadow-xl hover:bg-green-50 dark:hover:bg-slate-700 transition-all transform hover:scale-105 whitespace-nowrap border-2 border-green-200 dark:border-green-800"
                        >
                            <span className="text-2xl">📄</span>
                            <span className="font-semibold">Cargar CSV</span>
                        </button>
                    </div>
                )}

                {/* Botón principal */}
                <button
                    onClick={() => setShowMenuFAB(!showMenuFAB)}
                    className={`w-16 h-16 rounded-full shadow-2xl transition-all transform flex items-center justify-center text-3xl ${
                        showMenuFAB
                            ? 'bg-red-500 hover:bg-red-600 rotate-45'
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-110'
                    } text-white`}
                    title={showMenuFAB ? 'Cerrar menú' : 'Agregar gasto'}
                >
                    +
                </button>
            </div>

            {/* Modal Quick Add */}
            {showModalQuickAdd && (
                <ModalQuickAdd
                    onClose={() => setShowModalQuickAdd(false)}
                    onSuccess={async (nuevaTransaccion) => {
                        await cargarDatosDelMes();
                        setShowModalQuickAdd(false);
                        mostrarToast('Gasto agregado exitosamente', 'success');
                    }}
                />
            )}

            {/* Modal Entrada Rápida */}
            {showModalEntradaRapida && (
                <EntradaRapida
                    onClose={() => setShowModalEntradaRapida(false)}
                    onSuccess={async () => {
                        await cargarDatosDeMeses();
                        setShowModalEntradaRapida(false);
                        mostrarToast('Gasto provisional agregado exitosamente 🟠', 'success');
                    }}
                />
            )}

            {/* Modal Cargar PDF */}
            {showModalCargarPDF && (
                <ModalCargarPDF
                    onClose={() => setShowModalCargarPDF(false)}
                    onSuccess={async () => {
                        await refreshMesesCargados();
                        await cargarDatosDeMeses();
                        setShowModalCargarPDF(false);
                        mostrarToast('Transacciones del PDF cargadas exitosamente 📑', 'success');
                    }}
                />
            )}
        </div>
    );
};

// Componente Budget vs Real
const GraficoBudgetVsReal = memo(({ gastosPorCategoria, presupuestos, categorias }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // Preparar datos para el gráfico
        const labels = [];
        const dataPresupuesto = [];
        const dataGastado = [];
        const backgroundColors = [];
        const gastadoColors = [];

        presupuestos.forEach(pres => {
            if (pres.monto > 0) {
                const categoria = categorias.find(c => c.id === pres.categoria);
                const gastado = gastosPorCategoria[pres.categoria] || 0;

                if (categoria) {
                    labels.push(categoria.nombre);
                    dataPresupuesto.push(pres.monto);
                    dataGastado.push(gastado);
                    backgroundColors.push(categoria.color);

                    // Si gastado > presupuesto, usar rojo, sino el color de la categoría
                    gastadoColors.push(gastado > pres.monto ? '#dc2626' : categoria.color);
                }
            }
        });

        // Destruir gráfico anterior si existe
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Crear nuevo gráfico
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Presupuesto',
                        data: dataPresupuesto,
                        backgroundColor: backgroundColors.map(color => color + '40'),
                        borderColor: backgroundColors,
                        borderWidth: 2
                    },
                    {
                        label: 'Gastado',
                        data: dataGastado,
                        backgroundColor: gastadoColors.map(color => color + 'CC'),
                        borderColor: gastadoColors,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = formatearMonto(context.parsed.y);
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatearMonto(value)
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
    }, [gastosPorCategoria, presupuestos, categorias]);

    if (presupuestos.length === 0) {
        return null;
    }

    return (
        <Card title="Presupuesto vs Gastado por Categoría" icon="📊">
            <div className="chart-container">
                <canvas ref={chartRef}></canvas>
            </div>
        </Card>
    );
});

// Componente auxiliar: Gráfico de distribución con Chart.js
const GraficoDistribucion = memo(({ gastosPorCategoria, categorias }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current) return;

        // Preparar datos para el gráfico
        const labels = [];
        const data = [];
        const backgroundColors = [];

        for (const [categoriaId, monto] of Object.entries(gastosPorCategoria)) {
            const categoria = categorias.find(c => c.id === categoriaId);
            if (categoria && monto > 0) {
                labels.push(categoria.nombre);
                data.push(monto);
                backgroundColors.push(categoria.color);
            }
        }

        // Destruir gráfico anterior si existe
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Crear nuevo gráfico
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: backgroundColors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = formatearMonto(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
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
    }, [gastosPorCategoria, categorias]);

    if (Object.keys(gastosPorCategoria).length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No hay datos para mostrar
            </div>
        );
    }

    return (
        <div className="chart-container">
            <canvas ref={chartRef}></canvas>
        </div>
    );
});

// Componente ListaTransacciones
const ListaTransacciones = memo(({ transacciones, perfiles, categorias, onEditar, onEliminar }) => {
    if (transacciones.length === 0) {
        return (
            <EmptyState
                icon="📭"
                title="No hay transacciones"
                description="No se encontraron transacciones con los filtros seleccionados."
            />
        );
    }

    return (
        <div className="space-y-3">
            {transacciones.map(t => {
                const perfil = perfiles.find(p => p.id === t.perfilId);
                const categoria = categorias.find(c => c.id === t.categoria);

                return (
                    <div
                        key={t.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex items-center space-x-4 flex-1">
                            {/* Icono de categoría */}
                            <div className="text-3xl">{categoria?.icono || '📦'}</div>

                            {/* Información principal */}
                            <div className="flex-1">
                                <div className="flex items-center space-x-2 flex-wrap">
                                    <p className="font-semibold text-gray-800 dark:text-white">{t.comercio}</p>

                                    {/* Badge de estado (provisional/confirmado) */}
                                    {t.estado === 'provisional' && (
                                        <Badge color="orange" size="sm" title="Gasto ingresado manualmente, pendiente de confirmar con CSV">
                                            🟠 Provisional
                                        </Badge>
                                    )}

                                    {t.cuotaActual && (
                                        <Badge color="blue" size="sm">
                                            {t.cuotaActual}/{t.cuotasTotal}
                                        </Badge>
                                    )}
                                    {t.esCompartido && (
                                        <Badge color="pink" size="sm">
                                            💑 50/50
                                        </Badge>
                                    )}
                                    {perfil && (
                                        <Badge color="gray" size="sm">
                                            {perfil.nombre}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">{truncarTexto(t.descripcion, 50)}</p>
                                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                    <span>{formatearFecha(t.fecha)}</span>
                                    <span>•</span>
                                    <span>{categoria?.nombre || 'Sin categoría'}</span>
                                </div>
                            </div>

                            {/* Monto */}
                            <div className="text-right">
                                <p className="text-xl font-bold text-gray-800 dark:text-white">{formatearMonto(t.monto)}</p>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center space-x-2 ml-4">
                            <button
                                onClick={() => onEditar(t)}
                                className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                title="Editar"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => onEliminar(t.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Eliminar"
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
    );
});

// Componente Balance Compartido (US-009)
const BalanceCompartido = memo(({ transacciones, perfiles }) => {
    // Si no hay transacciones compartidas, no mostrar
    const tieneCompartidos = transacciones.some(t => t.esCompartido);
    if (!tieneCompartidos || perfiles.length < 2) return null;

    // Calcular balance entre los dos primeros perfiles
    const perfilId1 = perfiles[0].id;
    const perfilId2 = perfiles[1]?.id;

    const balance = calcularBalanceCompartido(transacciones, perfilId1, perfilId2);

    if (balance.cantidadTransacciones === 0) return null;

    const perfilDeudor = perfiles.find(p => p.id === balance.quienDebe);
    const perfilAcreedor = perfiles.find(p => p.id === balance.quienRecibe);

    return (
        <Card title="Balance de Gastos Compartidos" icon="💑">
            <div className="space-y-4">
                {/* Resumen de transacciones compartidas */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-indigo-600 font-medium mb-1">Transacciones Compartidas</p>
                        <p className="text-2xl font-bold text-indigo-900">{balance.cantidadTransacciones}</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium mb-1">Total Compartido</p>
                        <p className="text-2xl font-bold text-purple-900">
                            {formatearMonto(balance.totalPagadoPerfil1 + balance.totalPagadoPerfil2)}
                        </p>
                    </div>
                </div>

                {/* Balance individual */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: perfiles[0].color }}
                            />
                            <p className="font-semibold text-gray-800 dark:text-white">{perfiles[0].nombre}</p>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Pagó:</span>
                                <span className="font-semibold">{formatearMonto(balance.totalPagadoPerfil1)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Debe pagar:</span>
                                <span className="font-semibold">{formatearMonto(balance.debiaPagarPerfil1)}</span>
                            </div>
                        </div>
                    </div>
                    {perfilId2 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: perfiles[1].color }}
                                />
                                <p className="font-semibold text-gray-800 dark:text-white">{perfiles[1].nombre}</p>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pagó:</span>
                                    <span className="font-semibold">{formatearMonto(balance.totalPagadoPerfil2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Debe pagar:</span>
                                    <span className="font-semibold">{formatearMonto(balance.debiaPagarPerfil2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sugerencia de transferencia */}
                {balance.saldoNeto > 0 && perfilDeudor && perfilAcreedor && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                            <div className="text-3xl">💸</div>
                            <div className="flex-1">
                                <p className="font-semibold text-green-900 mb-1">Sugerencia de Transferencia</p>
                                <p className="text-sm text-green-800">
                                    <span className="font-bold">{perfilDeudor.nombre}</span> debe transferir{' '}
                                    <span className="font-bold text-lg">{formatearMonto(balance.saldoNeto)}</span> a{' '}
                                    <span className="font-bold">{perfilAcreedor.nombre}</span> para saldar las cuentas del mes.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Estado de balance */}
                {balance.saldoNeto === 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="text-green-800 font-semibold">
                            ✅ Las cuentas están saldadas
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
});

// Componente Resumen de Estados (Provisional vs Confirmado) - v3.4
const ResumenEstados = memo(({ transacciones }) => {
    const provisional = transacciones.filter(t => t.estado === 'provisional');
    const confirmado = transacciones.filter(t => t.estado === 'confirmado' || !t.estado);

    const montoProvisional = provisional.reduce((sum, t) => sum + t.monto, 0);
    const montoConfirmado = confirmado.reduce((sum, t) => sum + t.monto, 0);
    const montoTotal = montoProvisional + montoConfirmado;

    const porcentajeProvisional = montoTotal > 0 ? (montoProvisional / montoTotal) * 100 : 0;
    const porcentajeConfirmado = montoTotal > 0 ? (montoConfirmado / montoTotal) * 100 : 0;

    // Solo mostrar si hay transacciones provisionales
    if (provisional.length === 0) {
        return null;
    }

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    📊 Estado de Transacciones
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {transacciones.length} total
                </span>
            </div>

            <div className="space-y-4">
                {/* Provisional */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                                🟠 Provisionales
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({provisional.length} transacciones)
                            </span>
                        </div>
                        <span className="text-sm font-bold text-orange-700 dark:text-orange-400">
                            {formatearMonto(montoProvisional)}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-400 to-orange-600"
                            style={{ width: `${porcentajeProvisional}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {porcentajeProvisional.toFixed(1)}% del total
                    </p>
                </div>

                {/* Confirmado */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                ✅ Confirmados
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({confirmado.length} transacciones)
                            </span>
                        </div>
                        <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            {formatearMonto(montoConfirmado)}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-400 to-green-600"
                            style={{ width: `${porcentajeConfirmado}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {porcentajeConfirmado.toFixed(1)}% del total
                    </p>
                </div>

                {/* Total Proyectado */}
                <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                            Total Proyectado
                        </span>
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                            {formatearMonto(montoTotal)}
                        </span>
                    </div>
                </div>

                {/* Alerta si hay muchos provisionales */}
                {porcentajeProvisional > 30 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <p className="text-xs text-orange-800 dark:text-orange-300">
                            ⚠️ Tienes un alto porcentaje de gastos provisionales. Recuerda cargar el CSV del mes para confirmarlos.
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
});

// Componente Card Disponible para Gastar (US-008)
const CardDisponible = memo(({ disponible, categorias }) => {
    const {
        disponibleTotal,
        presupuestoTotal,
        gastadoTotal,
        cuotasProyectadas,
        disponiblePorCategoria
    } = disponible;

    // Determinar color y estado según disponible
    const getColorDisponible = (disponible, presupuesto) => {
        const porcentaje = (disponible / presupuesto) * 100;
        if (porcentaje >= 50) return { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', icon: '✅' };
        if (porcentaje >= 20) return { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', icon: '⚠️' };
        return { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-900', icon: '🚨' };
    };

    const colorEstado = getColorDisponible(disponibleTotal, presupuestoTotal);

    return (
        <div className={`${colorEstado.bg} border-2 ${colorEstado.border} rounded-xl p-6 shadow-lg animate-slideIn`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl">{colorEstado.icon}</span>
                            <h3 className="text-lg font-bold text-gray-700">Disponible para Gastar</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                            Presupuesto - Gastado - Cuotas Proyectadas
                        </p>
                    </div>
                </div>

                {/* Monto Disponible Destacado */}
                <div className="text-center py-4">
                    <p className="text-sm text-gray-600 mb-1">Te quedan disponibles</p>
                    <p className={`text-5xl font-black ${colorEstado.text}`}>
                        {formatearMonto(disponibleTotal)}
                    </p>
                </div>

                {/* Desglose */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-300">
                    <div className="text-center">
                        <p className="text-xs text-gray-600 mb-1">Presupuesto</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">{formatearMonto(presupuestoTotal)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Gastado</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">-{formatearMonto(gastadoTotal)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cuotas Futuras</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">-{formatearMonto(cuotasProyectadas)}</p>
                    </div>
                </div>

                {/* Disponible por Categoría */}
                {disponiblePorCategoria.length > 0 && (
                    <div className="pt-4 border-t border-gray-300">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Disponible por Categoría:</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {disponiblePorCategoria.slice(0, 8).map(cat => {
                                const categoria = categorias.find(c => c.id === cat.categoria);
                                const isNegative = cat.disponible < 0;

                                return (
                                    <div
                                        key={cat.categoria}
                                        className={`${isNegative ? 'bg-red-100 border-red-200' : 'bg-white border-gray-200'} border rounded-lg p-3 text-center`}
                                    >
                                        <div className="text-2xl mb-1">{categoria?.icono || '📦'}</div>
                                        <p className="text-xs text-gray-600 truncate">{categoria?.nombre || 'Sin nombre'}</p>
                                        <p className={`text-sm font-bold ${isNegative ? 'text-red-700' : 'text-gray-800'}`}>
                                            {formatearMonto(cat.disponible)}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

// Modal Quick Add - Agregar gasto rápido
const ModalQuickAdd = ({ onClose, onSuccess }) => {
    const { selectedMonth, perfiles, categorias } = useApp();
    const [comercio, setComercio] = useState('');
    const [monto, setMonto] = useState('');
    const [categoria, setCategoria] = useState('');
    const [perfilId, setPerfilId] = useState(perfiles[0]?.id || 1);
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [cuotas, setCuotas] = useState('1');
    const [guardando, setGuardando] = useState(false);
    const [sugerenciasComercios, setSugerenciasComercios] = useState([]);
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
    const [esCompartido, setEsCompartido] = useState(false);

    // Cargar histórico de comercios para autocompletado
    useEffect(() => {
        const cargarComercios = async () => {
            const todas = await db.transacciones.toArray();
            const comerciosUnicos = [...new Set(todas.map(t => t.comercio))].sort();
            setSugerenciasComercios(comerciosUnicos);
        };
        cargarComercios();
    }, []);

    // Autocompletar categoría cuando selecciona comercio
    const handleComercioChange = (valor) => {
        setComercio(valor);

        // Intentar categorizar automáticamente
        const categoriaAprendida = categorizarConAprendizaje({ comercio: valor });
        if (categoriaAprendida) {
            setCategoria(categoriaAprendida);
        }
    };

    const handleGuardar = async () => {
        if (!comercio || !monto || !categoria) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        setGuardando(true);
        try {
            const cuotasNum = parseInt(cuotas) || 1;
            const transaccion = {
                mesAnioId: selectedMonth.id,
                mesAnio: selectedMonth.mesAnio,
                fecha,
                descripcion: comercio,
                comercio,
                monto: parseInt(monto),
                categoria,
                perfilId,
                cuotaActual: 1,
                cuotasTotal: cuotasNum,
                esCompartido,
                perfilCompartidoId: esCompartido ? perfiles.find(p => p.id !== perfilId)?.id : null,
                porcentajePerfil: 50
            };

            await addTransaccion(transaccion);

            // Aprender la categorización
            aprenderCategorizacion(comercio, categoria);

            onSuccess(transaccion);
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar el gasto');
        } finally {
            setGuardando(false);
        }
    };

    // Filtrar sugerencias basado en lo que escribe
    const sugerenciasFiltradas = comercio.length >= 2
        ? sugerenciasComercios.filter(c =>
            c.toLowerCase().includes(comercio.toLowerCase())
          ).slice(0, 5)
        : [];

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="⚡ Agregar Gasto Rápido"
            size="md"
        >
            <div className="space-y-4">
                {/* Comercio con autocompletado */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comercio *
                    </label>
                    <input
                        type="text"
                        value={comercio}
                        onChange={(e) => handleComercioChange(e.target.value)}
                        onFocus={() => setMostrarSugerencias(true)}
                        onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
                        placeholder="Ej: Unimarc, Copec, Netflix..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                    />

                    {/* Sugerencias de autocompletado */}
                    {mostrarSugerencias && sugerenciasFiltradas.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                            {sugerenciasFiltradas.map((sugerencia, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        handleComercioChange(sugerencia);
                                        setMostrarSugerencias(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 transition-colors"
                                >
                                    {sugerencia}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Monto */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto *
                    </label>
                    <div className="flex items-center">
                        <span className="text-gray-600 mr-2">$</span>
                        <input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="0"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            min="0"
                        />
                    </div>
                </div>

                {/* Categoría */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría *
                    </label>
                    <select
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Seleccionar...</option>
                        {categorias.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.icono} {c.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Fila: Perfil, Fecha, Cuotas */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Perfil
                        </label>
                        <select
                            value={perfilId}
                            onChange={(e) => setPerfilId(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            {perfiles.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Fecha
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Cuotas
                        </label>
                        <input
                            type="number"
                            value={cuotas}
                            onChange={(e) => setCuotas(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                            min="1"
                        />
                    </div>
                </div>

                {/* Checkbox de gasto compartido 50/50 */}
                {perfiles.length > 1 && (
                    <div className="border-t pt-4">
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="esCompartidoQuick"
                                    checked={esCompartido}
                                    onChange={(e) => setEsCompartido(e.target.checked)}
                                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-0.5 cursor-pointer"
                                />
                                <div className="flex-1">
                                    <label htmlFor="esCompartidoQuick" className="font-medium text-pink-900 cursor-pointer block">
                                        💑 Gasto compartido 50/50
                                    </label>
                                    {esCompartido && monto && (
                                        <p className="text-sm text-pink-700 mt-1">
                                            Este gasto se dividirá en partes iguales: ${Math.round(parseInt(monto) / 2).toLocaleString('es-CL')} cada uno
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones */}
                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardar}
                        disabled={guardando || !comercio || !monto || !categoria}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
                    >
                        {guardando ? 'Guardando...' : '✓ Guardar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Modal para cargar CSV (US-008: con selector de mes/año)
const ModalCargarCSV = ({ onClose, onSuccess }) => {
    const { perfiles, categorias } = useApp();
    const [paso, setPaso] = useState(1); // 1: Mes/año, 2: Subir, 3: Perfil y Modo, 4: Preview/Revisión, 5: Guardar
    const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
    const [mesSeleccionado, setMesSeleccionado] = useState(null);
    const [archivo, setArchivo] = useState(null);
    const [perfilSeleccionado, setPerfilSeleccionado] = useState(perfiles[0]?.id || 1);
    const [transaccionesParsed, setTransaccionesParsed] = useState([]);
    const [procesando, setProcesando] = useState(false);
    const [error, setError] = useState(null);
    const [mesAnioIdGuardado, setMesAnioIdGuardado] = useState(null);

    // Modo de revisión: 'auto' o 'manual'
    const [modoRevision, setModoRevision] = useState('auto');

    // Estados para revisión manual
    const [indiceRevisionActual, setIndiceRevisionActual] = useState(0);
    const [transaccionesRevisadas, setTransaccionesRevisadas] = useState([]);
    const [transaccionActualEdit, setTransaccionActualEdit] = useState(null);

    // Estados para gastos compartidos masivos
    const [todasCompartidas, setTodasCompartidas] = useState(false);
    const [perfilCompartidoMasivo, setPerfilCompartidoMasivo] = useState(null);
    const [porcentajeMasivo, setPorcentajeMasivo] = useState(50);

    // Estados para selección masiva en preview
    const [transaccionesSeleccionadas, setTransaccionesSeleccionadas] = useState([]);
    const [filtroCategoria, setFiltroCategoria] = useState('todas');

    // Estados para reconciliación (v3.4)
    const [mostrarReconciliacion, setMostrarReconciliacion] = useState(false);
    const [resultadoReconciliacion, setResultadoReconciliacion] = useState(null);

    const aniosDisponibles = [new Date().getFullYear(), new Date().getFullYear() - 1];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const handleArchivoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setProcesando(true);

        try {
            // Validar CSV
            const validacion = await validarCSV(file);
            if (!validacion.valido) {
                setError(validacion.error);
                setProcesando(false);
                return;
            }

            setArchivo(file);
            setProcesando(false);
            setPaso(3); // Ir a selección de perfil
        } catch (err) {
            setError('Error al leer el archivo');
            setProcesando(false);
        }
    };

    const handleProcesarCSV = async () => {
        if (!archivo || !mesSeleccionado || !perfilSeleccionado) return;

        setProcesando(true);
        setError(null);

        try {
            // Parsear CSV
            const transacciones = await parsearCSV(archivo);

            // Categorizar automáticamente
            const transaccionesCategorizadas = categorizarLote(transacciones);

            // Asignar perfil, mes y opciones de compartido
            const mesAnio = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;
            const transaccionesConPerfil = transaccionesCategorizadas.map(t => ({
                ...t,
                perfilId: perfilSeleccionado,
                mesAnio,
                esCompartido: todasCompartidas,
                perfilCompartidoId: todasCompartidas ? perfilCompartidoMasivo : null,
                porcentajePerfil: todasCompartidas ? porcentajeMasivo : 50
            }));

            setTransaccionesParsed(transaccionesConPerfil);

            // Si es modo manual, inicializar revisión
            if (modoRevision === 'manual') {
                setIndiceRevisionActual(0);
                setTransaccionesRevisadas([]);
                setTransaccionActualEdit(transaccionesConPerfil[0]);
            }

            setPaso(4); // Mostrar preview o revisión manual
            setProcesando(false);
        } catch (err) {
            console.error('Error al procesar CSV:', err);
            setError('Error al procesar el archivo CSV');
            setProcesando(false);
        }
    };

    // Funciones para revisión manual
    const handleAceptarTransaccion = () => {
        // Guardar la transacción editada
        const transaccionesActualizadas = [...transaccionesParsed];
        transaccionesActualizadas[indiceRevisionActual] = transaccionActualEdit;
        setTransaccionesParsed(transaccionesActualizadas);
        setTransaccionesRevisadas([...transaccionesRevisadas, transaccionActualEdit]);

        // Pasar a la siguiente
        if (indiceRevisionActual < transaccionesParsed.length - 1) {
            setIndiceRevisionActual(indiceRevisionActual + 1);
            setTransaccionActualEdit(transaccionesActualizadas[indiceRevisionActual + 1]);
        } else {
            // Terminamos, ir a paso de guardar
            setPaso(5);
        }
    };

    const handleSaltarTransaccion = () => {
        // Saltamos esta transacción (no la guardamos)
        if (indiceRevisionActual < transaccionesParsed.length - 1) {
            setIndiceRevisionActual(indiceRevisionActual + 1);
            setTransaccionActualEdit(transaccionesParsed[indiceRevisionActual + 1]);
        } else {
            // Terminamos
            setPaso(5);
        }
    };

    const handleEditTransaccionActual = (campo, valor) => {
        setTransaccionActualEdit({
            ...transaccionActualEdit,
            [campo]: valor
        });
    };

    // Funciones para selección masiva
    const toggleSeleccion = (index) => {
        if (transaccionesSeleccionadas.includes(index)) {
            setTransaccionesSeleccionadas(transaccionesSeleccionadas.filter(i => i !== index));
        } else {
            setTransaccionesSeleccionadas([...transaccionesSeleccionadas, index]);
        }
    };

    const toggleSeleccionarTodas = () => {
        const transaccionesFiltradas = getTransaccionesFiltradas();
        const indicesFiltrados = transaccionesFiltradas.map(t => t.indiceOriginal);

        if (transaccionesSeleccionadas.length === indicesFiltrados.length) {
            setTransaccionesSeleccionadas([]);
        } else {
            setTransaccionesSeleccionadas(indicesFiltrados);
        }
    };

    const marcarSeleccionadasComoCompartidas = () => {
        if (perfiles.length < 2) return;

        const otroPerfil = perfiles.find(p => p.id !== perfilSeleccionado);
        if (!otroPerfil) return;

        const nuevasTransacciones = transaccionesParsed.map((t, index) => {
            if (transaccionesSeleccionadas.includes(index)) {
                return {
                    ...t,
                    esCompartido: true,
                    perfilCompartidoId: otroPerfil.id,
                    porcentajePerfil: 50
                };
            }
            return t;
        });

        setTransaccionesParsed(nuevasTransacciones);
        setTransaccionesSeleccionadas([]);
    };

    const desmarcarSeleccionadasComoCompartidas = () => {
        const nuevasTransacciones = transaccionesParsed.map((t, index) => {
            if (transaccionesSeleccionadas.includes(index)) {
                return {
                    ...t,
                    esCompartido: false,
                    perfilCompartidoId: null,
                    porcentajePerfil: 50
                };
            }
            return t;
        });

        setTransaccionesParsed(nuevasTransacciones);
        setTransaccionesSeleccionadas([]);
    };

    const getTransaccionesFiltradas = () => {
        return transaccionesParsed
            .map((t, index) => ({ ...t, indiceOriginal: index }))
            .filter(t => filtroCategoria === 'todas' || t.categoria === filtroCategoria);
    };

    const handleGuardar = async () => {
        console.log('🚀 Iniciando guardado de transacciones...');
        setProcesando(true);
        try {
            const mesAnio = `${anioSeleccionado}-${String(mesSeleccionado + 1).padStart(2, '0')}`;
            console.log('📅 Mes/Año:', mesAnio);

            // Obtener o crear mes
            const mesAnioId = await getOrCreateMesAnio(mesAnio);
            console.log('✅ Mes creado/obtenido ID:', mesAnioId);

            // Si es modo manual, solo guardar las revisadas
            const transaccionesAGuardar = modoRevision === 'manual'
                ? transaccionesRevisadas
                : transaccionesParsed;

            console.log(`📝 Transacciones a guardar: ${transaccionesAGuardar.length}`);

            // Agregar transacciones (marcadas como 'csv' y 'confirmado')
            const transaccionesParaGuardar = transaccionesAGuardar.map(t => ({
                ...t,
                mesAnioId,
                origen: 'csv',
                estado: 'confirmado',
                textoOriginal: null,
                transaccionRelacionadaId: null
            }));

            console.log('💾 Guardando transacciones en DB...');
            console.log('📋 Muestra de transacción a guardar:', transaccionesParaGuardar[0]);

            try {
                const resultado = await addTransacciones(transaccionesParaGuardar);
                console.log('✅ Resultado de bulkAdd:', resultado);
                console.log('✅ Transacciones guardadas exitosamente');

                // Verificar que realmente se guardaron
                const transVerificacion = await getTransaccionesByMes(mesAnioId);
                console.log(`🔍 Verificación inmediata: ${transVerificacion.length} transacciones en DB`);
            } catch (bulkError) {
                console.error('❌ Error en bulkAdd:', bulkError);
                throw bulkError;
            }

            // Crear presupuestos base si no existen
            console.log('📊 Verificando presupuestos...');
            let presupuestosExistentes;
            try {
                presupuestosExistentes = await getPresupuestos(mesAnioId);
                console.log(`✅ Presupuestos existentes: ${presupuestosExistentes.length}`);
            } catch (presError) {
                console.error('❌ Error al obtener presupuestos:', presError);
                presupuestosExistentes = [];
            }
            if (presupuestosExistentes.length === 0) {
                console.log('📋 Copiando plantilla de presupuestos...');
                const plantilla = await getPresupuestos(null);
                if (plantilla.length > 0) {
                    await savePresupuestos(plantilla.map(p => ({
                        categoria: p.categoria,
                        monto: p.monto
                    })), mesAnioId);
                    console.log('✅ Presupuestos creados');
                }
            }

            // RECONCILIACIÓN: Buscar transacciones manuales provisionales de este mes
            console.log('🔄 Iniciando reconciliación...');
            const resultado = await window.ejecutarReconciliacion(mesAnio);
            console.log('✅ Reconciliación completada:', resultado);

            setProcesando(false);

            // Guardar mesAnioId para usarlo después
            setMesAnioIdGuardado(mesAnioId);
            console.log('💾 mesAnioId guardado:', mesAnioId);

            // Si hay transacciones para reconciliar, mostrar panel
            if (resultado.totalManuales > 0) {
                console.log('🔔 Mostrando panel de reconciliación');
                setResultadoReconciliacion(resultado);
                setMostrarReconciliacion(true);
            } else {
                console.log('✅ Sin reconciliación necesaria, llamando onSuccess');
                onSuccess(mesAnioId);
            }
        } catch (err) {
            console.error('Error al guardar:', err);
            setError('Error al guardar las transacciones');
            setProcesando(false);
        }
    };

    return (
        <>
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Cargar CSV"
            size="md"
        >
            <div className="space-y-2.5 sm:space-y-6 max-w-md mx-auto sm:max-w-full">
                {/* Indicador de pasos - Responsive y más compacto */}
                <div className="flex items-center justify-center gap-0.5 sm:gap-0 sm:justify-between overflow-x-auto pb-1">
                    {[1, 2, 3, 4].map(num => (
                        <div key={num} className="flex items-center flex-shrink-0">
                            <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-base ${
                                paso >= num ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {num}
                            </div>
                            {num < 4 && (
                                <div className={`w-4 sm:w-16 h-0.5 sm:h-1 ${paso > num ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Paso 1: Seleccionar mes y año */}
                {paso === 1 && (
                    <div className="space-y-2.5 sm:space-y-4">
                        <h3 className="text-sm sm:text-lg font-semibold">Selecciona el mes y año</h3>

                        {/* Selector de año - Responsive */}
                        <div className="flex gap-2 sm:gap-4">
                            {aniosDisponibles.map(anio => (
                                <button
                                    key={anio}
                                    onClick={() => setAnioSeleccionado(anio)}
                                    className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors ${
                                        anioSeleccionado === anio
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {anio}
                                </button>
                            ))}
                        </div>

                        {/* Grilla de meses - 4 columnas en mobile para que entre todo */}
                        <div className="grid grid-cols-4 sm:grid-cols-3 gap-1.5 sm:gap-3">
                            {meses.map((mes, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setMesSeleccionado(index);
                                        setPaso(2);
                                    }}
                                    className={`py-1.5 sm:py-4 px-0.5 rounded-md sm:rounded-lg font-semibold text-[11px] sm:text-base transition-colors ${
                                        mesSeleccionado === index
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                    }`}
                                >
                                    {mes}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Paso 2: Subir archivo */}
                {paso === 2 && (
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-sm sm:text-lg font-semibold">
                            CSV: {meses[mesSeleccionado]} {anioSeleccionado}
                        </h3>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleArchivoChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                <svg className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400 mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="text-sm sm:text-lg font-semibold text-gray-700">Seleccionar archivo</p>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1">o arrastra aquí</p>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2">CSV: Fecha;Descripción;Monto;Cuotas</p>
                            </label>
                        </div>

                        {error && (
                            <AlertBadge type="error">
                                {error}
                            </AlertBadge>
                        )}

                        <div className="flex space-x-2 sm:space-x-3">
                            <button
                                onClick={() => setPaso(1)}
                                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Atrás
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 3: Seleccionar perfil y modo */}
                {paso === 3 && (
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-sm sm:text-lg font-semibold">Perfil y modo</h3>

                        {/* Selector de Perfil */}
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Perfil:</p>
                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {perfiles.map(perfil => (
                                    <button
                                        key={perfil.id}
                                        onClick={() => setPerfilSeleccionado(perfil.id)}
                                        className={`p-2.5 sm:p-4 rounded-lg border-2 transition-colors ${
                                            perfilSeleccionado === perfil.id
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-2 sm:space-x-3">
                                            <div
                                                className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                                                style={{ backgroundColor: perfil.color }}
                                            />
                                            <span className="font-semibold text-sm sm:text-base">{perfil.nombre}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selector de Modo de Revisión */}
                        <div className="border-t pt-3 sm:pt-4">
                            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Modo:</p>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <button
                                    onClick={() => setModoRevision('auto')}
                                    className={`p-2 sm:p-4 rounded-lg border-2 transition-colors ${
                                        modoRevision === 'auto'
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-200 hover:border-green-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <span className="text-xl sm:text-3xl block mb-1 sm:mb-2">⚡</span>
                                        <p className="font-semibold text-gray-800 dark:text-white text-xs sm:text-base">Auto</p>
                                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">
                                            Carga rápida con categorización automática.
                                        </p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setModoRevision('manual')}
                                    className={`p-2 sm:p-4 rounded-lg border-2 transition-colors ${
                                        modoRevision === 'manual'
                                            ? 'border-blue-600 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="text-center">
                                        <span className="text-xl sm:text-3xl block mb-1 sm:mb-2">👁️</span>
                                        <p className="font-semibold text-gray-800 dark:text-white text-xs sm:text-base">Manual</p>
                                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 sm:mt-1 hidden sm:block">
                                            Revisa cada transacción una por una.
                                        </p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Opción de gastos compartidos masivos */}
                        {perfiles.length > 1 && (
                            <div className="border-t pt-4 mt-4">
                                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                                    <div className="flex items-start space-x-3">
                                        <input
                                            type="checkbox"
                                            id="todasCompartidas"
                                            checked={todasCompartidas}
                                            onChange={(e) => {
                                                setTodasCompartidas(e.target.checked);
                                                if (e.target.checked) {
                                                    // Auto-seleccionar el primer perfil diferente al seleccionado
                                                    const otroPerfil = perfiles.find(p => p.id !== perfilSeleccionado);
                                                    if (otroPerfil) setPerfilCompartidoMasivo(otroPerfil.id);
                                                    setPorcentajeMasivo(50); // Siempre 50/50
                                                }
                                            }}
                                            className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <label htmlFor="todasCompartidas" className="font-medium text-pink-900 cursor-pointer block mb-1">
                                                💑 Marcar todas como gastos compartidos 50/50
                                            </label>
                                            <p className="text-sm text-pink-700">
                                                Todas las transacciones se dividirán en partes iguales entre{' '}
                                                <strong>{perfiles.find(p => p.id === perfilSeleccionado)?.nombre}</strong> y{' '}
                                                <strong>{perfiles.find(p => p.id !== perfilSeleccionado)?.nombre}</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setPaso(2)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleProcesarCSV}
                                disabled={procesando}
                                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {procesando ? 'Procesando...' : 'Continuar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 4: Preview (auto) o Revisión Manual */}
                {paso === 4 && modoRevision === 'manual' && transaccionActualEdit && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">👁️ Revisión Manual</h3>
                            <p className="text-sm text-gray-600">
                                {indiceRevisionActual + 1} de {transaccionesParsed.length}
                            </p>
                        </div>

                        {/* Progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${((indiceRevisionActual + 1) / transaccionesParsed.length) * 100}%` }}
                            ></div>
                        </div>

                        {/* Formulario de edición de transacción */}
                        <div className="bg-white border-2 border-indigo-300 rounded-lg p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Comercio */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Comercio
                                    </label>
                                    <input
                                        type="text"
                                        value={transaccionActualEdit.comercio}
                                        onChange={(e) => handleEditTransaccionActual('comercio', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Monto */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Monto
                                    </label>
                                    <input
                                        type="number"
                                        value={transaccionActualEdit.monto}
                                        onChange={(e) => handleEditTransaccionActual('monto', parseInt(e.target.value))}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Categoría */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoría
                                    </label>
                                    <select
                                        value={transaccionActualEdit.categoria}
                                        onChange={(e) => handleEditTransaccionActual('categoria', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {categorias.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.icono} {c.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Compartido */}
                                {perfiles.length > 1 && (
                                    <div className="col-span-2">
                                        <div className="flex items-center space-x-3 bg-pink-50 border border-pink-200 rounded-lg p-3">
                                            <input
                                                type="checkbox"
                                                id="esCompartidoEdit"
                                                checked={transaccionActualEdit.esCompartido}
                                                onChange={(e) => {
                                                    handleEditTransaccionActual('esCompartido', e.target.checked);
                                                    if (e.target.checked) {
                                                        const otroPerfil = perfiles.find(p => p.id !== perfilSeleccionado);
                                                        handleEditTransaccionActual('perfilCompartidoId', otroPerfil?.id);
                                                        handleEditTransaccionActual('porcentajePerfil', 50);
                                                    }
                                                }}
                                                className="w-5 h-5 text-pink-600"
                                            />
                                            <label htmlFor="esCompartidoEdit" className="flex-1 text-sm font-medium text-pink-900">
                                                💑 Gasto compartido 50/50 con {perfiles.find(p => p.id !== perfilSeleccionado)?.nombre}
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex space-x-3">
                            <button
                                onClick={handleSaltarTransaccion}
                                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
                            >
                                ⏭️ Saltar
                            </button>
                            <button
                                onClick={handleAceptarTransaccion}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                ✓ Aceptar y Siguiente
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 4: Preview automático (modo auto) */}
                {paso === 4 && modoRevision === 'auto' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Revisión de transacciones</h3>
                            <p className="text-sm text-gray-600">
                                {transaccionesParsed.filter(t => t.esCompartido).length} compartidas de {transaccionesParsed.length}
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                                💡 Selecciona las transacciones que quieres marcar como compartidas 50/50
                            </p>
                        </div>

                        {/* Controles de selección masiva */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                <select
                                    value={filtroCategoria}
                                    onChange={(e) => setFiltroCategoria(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.icono} {c.nombre}
                                        </option>
                                    ))}
                                </select>

                                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={transaccionesSeleccionadas.length === getTransaccionesFiltradas().length && getTransaccionesFiltradas().length > 0}
                                        onChange={toggleSeleccionarTodas}
                                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                    />
                                    Seleccionar todas ({getTransaccionesFiltradas().length})
                                </label>
                            </div>

                            {transaccionesSeleccionadas.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={marcarSeleccionadasComoCompartidas}
                                        className="px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium"
                                    >
                                        💑 Marcar como compartidas ({transaccionesSeleccionadas.length})
                                    </button>
                                    <button
                                        onClick={desmarcarSeleccionadasComoCompartidas}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                                    >
                                        Desmarcar ({transaccionesSeleccionadas.length})
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Tabla de transacciones */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left w-10"></th>
                                            <th className="px-3 py-2 text-left">Comercio</th>
                                            <th className="px-3 py-2 text-left">Categoría</th>
                                            <th className="px-3 py-2 text-right">Monto</th>
                                            <th className="px-3 py-2 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getTransaccionesFiltradas().map((t) => {
                                            const categoria = categorias.find(c => c.id === t.categoria);
                                            const isSelected = transaccionesSeleccionadas.includes(t.indiceOriginal);

                                            return (
                                                <tr
                                                    key={t.indiceOriginal}
                                                    className={`border-t border-gray-100 hover:bg-gray-50 ${
                                                        t.esCompartido ? 'bg-pink-50' : ''
                                                    }`}
                                                >
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => toggleSeleccion(t.indiceOriginal)}
                                                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 font-medium text-gray-800">
                                                        {t.comercio}
                                                        {t.cuotaActual && (
                                                            <span className="ml-2 text-xs text-gray-500">
                                                                {t.cuotaActual}/{t.cuotasTotales}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <span className="inline-flex items-center gap-1">
                                                            {categoria?.icono} {categoria?.nombre}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold">
                                                        {formatearMonto(t.monto)}
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        {t.esCompartido && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                                                💑 50/50
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {error && (
                            <AlertBadge type="error">
                                {error}
                            </AlertBadge>
                        )}

                        <div className="flex space-x-3">
                            <button
                                onClick={() => setPaso(3)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={procesando}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                            >
                                {procesando ? 'Guardando...' : `Guardar ${transaccionesParsed.length} Transacciones`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Paso 5: Confirmación final (modo manual) */}
                {paso === 5 && modoRevision === 'manual' && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">✅ Revisión Completada</h3>

                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                            <p className="text-6xl mb-4">🎉</p>
                            <p className="text-xl font-bold text-green-900 mb-2">
                                Has revisado todas las transacciones
                            </p>
                            <p className="text-gray-700">
                                {transaccionesRevisadas.length} transacciones listas para guardar
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                (Saltadas: {transaccionesParsed.length - transaccionesRevisadas.length})
                            </p>
                        </div>

                        {/* Resumen */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Resumen:</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-blue-50 rounded p-3">
                                    <p className="text-blue-600 font-medium">Total a guardar</p>
                                    <p className="text-2xl font-bold text-blue-900">
                                        {transaccionesRevisadas.length}
                                    </p>
                                </div>
                                <div className="bg-pink-50 rounded p-3">
                                    <p className="text-pink-600 font-medium">Compartidas</p>
                                    <p className="text-2xl font-bold text-pink-900">
                                        {transaccionesRevisadas.filter(t => t.esCompartido).length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setPaso(4);
                                    setIndiceRevisionActual(0);
                                    setTransaccionActualEdit(transaccionesParsed[0]);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                ← Revisar de nuevo
                            </button>
                            <button
                                onClick={handleGuardar}
                                disabled={procesando}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-semibold"
                            >
                                {procesando ? 'Guardando...' : `💾 Guardar ${transaccionesRevisadas.length} Transacciones`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>

        {/* Modal de Reconciliación */}
        {mostrarReconciliacion && resultadoReconciliacion && (
            <Reconciliacion
                resultado={resultadoReconciliacion}
                onConfirmar={(resultado) => {
                    setMostrarReconciliacion(false);
                    onSuccess(mesAnioIdGuardado);
                    onClose();
                }}
                onCancelar={() => {
                    setMostrarReconciliacion(false);
                    onSuccess(mesAnioIdGuardado);
                    onClose();
                }}
            />
        )}
    </>
    );
};

// Modal para editar transacción
const ModalEditarTransaccion = ({ transaccion, perfiles, categorias, onClose, onGuardar }) => {
    const [form, setForm] = useState({
        descripcion: transaccion.descripcion,
        comercio: transaccion.comercio,
        monto: transaccion.monto,
        categoria: transaccion.categoria,
        perfilId: transaccion.perfilId,
        fecha: transaccion.fecha,
        esCompartido: transaccion.esCompartido || false,
        perfilCompartidoId: transaccion.perfilCompartidoId || null,
        porcentajePerfil: transaccion.porcentajePerfil || 50
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        // Si la categoría cambió, guardar la asociación para aprendizaje automático
        if (form.categoria !== transaccion.categoria) {
            window.aprenderCategorizacion(form.comercio, form.categoria);
        }

        onGuardar(form);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Editar Transacción"
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comercio
                    </label>
                    <input
                        type="text"
                        value={form.comercio}
                        onChange={(e) => setForm({ ...form, comercio: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                    </label>
                    <input
                        type="text"
                        value={form.descripcion}
                        onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto
                    </label>
                    <input
                        type="number"
                        value={form.monto}
                        onChange={(e) => setForm({ ...form, monto: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                        min="0"
                        step="1"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoría
                    </label>
                    <select
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    >
                        {categorias.map(c => (
                            <option key={c.id} value={c.id}>
                                {c.icono} {c.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Perfil
                    </label>
                    <select
                        value={form.perfilId}
                        onChange={(e) => setForm({ ...form, perfilId: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    >
                        {perfiles.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha
                    </label>
                    <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                {/* Sección de gastos compartidos */}
                {perfiles.length > 1 && (
                    <div className="border-t pt-4 mt-4">
                        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                            <div className="flex items-start space-x-3">
                                <input
                                    type="checkbox"
                                    id="esCompartido"
                                    checked={form.esCompartido}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setForm({
                                            ...form,
                                            esCompartido: checked,
                                            porcentajePerfil: 50, // Siempre 50/50
                                            perfilCompartidoId: checked
                                                ? perfiles.find(p => p.id !== form.perfilId)?.id || null
                                                : null
                                        });
                                    }}
                                    className="w-5 h-5 text-pink-600 border-gray-300 rounded focus:ring-pink-500 mt-0.5"
                                />
                                <div className="flex-1">
                                    <label htmlFor="esCompartido" className="font-medium text-pink-900 cursor-pointer block">
                                        💑 Gasto compartido 50/50
                                    </label>
                                    {form.esCompartido && (
                                        <p className="text-sm text-pink-700 mt-1">
                                            Este gasto se dividirá en partes iguales: {formatearMonto(form.monto / 2)} cada uno
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </Modal>
    );
};

// Componente de gráfico de proyección de cuotas futuras
const GraficoProyeccionCuotas = memo(({ proyeccion }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (!chartRef.current || proyeccion.length === 0) return;

        // Preparar datos
        const labels = proyeccion.map(p => p.mesNombre);
        const data = proyeccion.map(p => p.total);

        // Destruir gráfico anterior
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        // Crear gráfico
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Monto en Cuotas',
                    data,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `Total: ${window.formatearMonto(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value === 0) return String.fromCharCode(36) + '0';
                                return String.fromCharCode(36) + Math.round(value).toLocaleString('es-CL');
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
    }, [proyeccion]);

    if (proyeccion.length === 0) {
        return (
            <div className="text-center text-gray-500 py-8">
                No hay datos para mostrar
            </div>
        );
    }

    const containerStyle = { position: 'relative', height: '400px' };

    return (
        <div style={containerStyle}>
            <canvas ref={chartRef}></canvas>
        </div>
    );
});

// Modal para seleccionar múltiples meses
const ModalSelectorMeses = memo(({ mesesCargados, selectedMonths, onClose, onToggleMes, onSeleccionarTodos, onLimpiarSeleccion }) => {
    // Ordenar meses por fecha (más reciente primero)
    const mesesOrdenados = useMemo(() => {
        return [...mesesCargados].sort((a, b) => {
            return new Date(b.mesAnio) - new Date(a.mesAnio);
        });
    }, [mesesCargados]);

    const isMesSeleccionado = (mes) => {
        return selectedMonths.some(m => m.id === mes.id);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Seleccionar Meses"
            size="md"
        >
            <div className="space-y-4">
                {/* Botones de acción rápida */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedMonths.length} de {mesesCargados.length} meses seleccionados
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={onSeleccionarTodos}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                            Seleccionar todos
                        </button>
                        <button
                            onClick={onLimpiarSeleccion}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>

                {/* Lista de meses con checkboxes */}
                <div className="max-h-96 overflow-y-auto space-y-2">
                    {mesesOrdenados.map(mes => {
                        const isSelected = isMesSeleccionado(mes);
                        return (
                            <label
                                key={mes.id}
                                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                    isSelected
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center space-x-3 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleMes(mes)}
                                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${
                                            isSelected
                                                ? 'text-indigo-700 dark:text-indigo-400'
                                                : 'text-gray-800 dark:text-gray-200'
                                        }`}>
                                            {getNombreMes(mes.mesAnio)}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Cargado el {formatearFecha(mes.fechaCarga)}
                                        </p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <span className="text-indigo-600 dark:text-indigo-400">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </label>
                        );
                    })}
                </div>

                {/* Botón cerrar */}
                <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-slate-700">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </Modal>
    );
});
