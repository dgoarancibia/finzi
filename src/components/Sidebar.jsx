// Componente Sidebar con navegación - Diseño Minimalista Moderno

const Sidebar = () => {
    const { currentPage, setCurrentPage, isSidebarOpen, setIsSidebarOpen, isDarkMode, setIsDarkMode } = useApp();

    // Logo SVG inline con soporte para modo claro/oscuro
    const LogoFinzi = ({ className = "" }) => (
        <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <linearGradient id="arrow-gradient" x1="30" y1="8" x2="50" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" style={{stopColor: '#7DD3C0', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#A8E063', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#56AB2F', stopOpacity: 1}} />
                </linearGradient>
            </defs>
            <path d="M 30 32 L 50 12 L 60 22" stroke="url(#arrow-gradient)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="currentColor">FINZI</text>
            <rect x="115" y="10" width="4" height="20" rx="2" fill="#7DD3C0"/>
        </svg>
    );

    // Logo compacto (solo icono) para sidebar colapsado
    const LogoFinziCompact = ({ className = "" }) => (
        <svg width="40" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <linearGradient id="arrow-gradient-compact" x1="10" y1="8" x2="30" y2="32" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" style={{stopColor: '#7DD3C0', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#A8E063', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#56AB2F', stopOpacity: 1}} />
                </linearGradient>
            </defs>
            <path d="M 10 32 L 30 12 L 40 22" stroke="url(#arrow-gradient-compact)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <rect x="48" y="10" width="4" height="20" rx="2" fill="#7DD3C0"/>
        </svg>
    );

    const menuItems = [
        { id: 'home', icon: '🏠', label: 'Home', description: 'Dashboard principal' },
        { id: 'ingresos', icon: '💵', label: 'Ingresos', description: 'Registrar ingresos' },
        { id: 'reembolsos', icon: '💸', label: 'Reembolsos', description: 'Gastos a reembolsar' },
        { id: 'proyecciones', icon: '🎯', label: 'Proyecciones', description: 'Metas y ahorro' },
        { id: 'analisis', icon: '📈', label: 'Análisis Cierre', description: 'Proyección e insights' },
        { id: 'historial', icon: '📅', label: 'Historial', description: 'Gestión de meses' },
        { id: 'balance', icon: '💰', label: 'Balance', description: 'Liquidación de deudas' },
        { id: 'perfiles', icon: '👥', label: 'Perfiles', description: 'Gestionar usuarios' },
        { id: 'categorias', icon: '🏷️', label: 'Categorías', description: 'Gestionar categorías' },
        { id: 'presupuestos', icon: '💸', label: 'Presupuestos', description: 'Configurar límites' },
        { id: 'cuotasFuturas', icon: '💳', label: 'Cuotas Futuras', description: 'Proyección de pagos' },
        { id: 'recurrentes', icon: '🔄', label: 'Recurrentes', description: 'Gastos mensuales' },
        { id: 'simulador', icon: '🧮', label: 'Simulador', description: 'Análisis de compras' }
    ];

    return (
        <>
            {/* Botón Hamburguesa para Mobile - Mejorado */}
            {!isSidebarOpen && (
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed top-3 left-3 z-50 lg:hidden p-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg transition-all"
                    aria-label="Abrir menú"
                >
                    <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            )}

            {/* Sidebar - Responsive */}
            <aside
                className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 transition-all duration-300 z-40 flex flex-col border-r border-gray-200 dark:border-slate-700 ${
                    isSidebarOpen ? 'w-64' : 'w-16 -translate-x-full lg:translate-x-0'
                } lg:translate-x-0`}
                style={{
                    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)'
                }}
            >
                {/* Header minimalista - Responsive */}
                <div className={`border-b border-gray-100 dark:border-slate-700 flex-shrink-0 ${isSidebarOpen ? 'p-4 lg:p-6' : 'p-2'}`}>
                    <div className="flex items-center justify-between">
                        {isSidebarOpen ? (
                            <div className="animate-slideIn flex-1">
                                <LogoFinzi className="text-gray-900 dark:text-white mb-1 scale-90 lg:scale-100" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium hidden lg:block">v3.2 - Gastos TC</p>
                            </div>
                        ) : (
                            <div className="mx-auto">
                                <LogoFinziCompact className="text-gray-900 dark:text-white" />
                            </div>
                        )}
                        {isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all ml-2 lg:hidden"
                                aria-label="Cerrar menú"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all mx-auto mt-2 w-full"
                            aria-label="Expandir menú"
                        >
                            <svg
                                className="w-5 h-5 transition-transform duration-300 rotate-180 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Menu Items minimalistas - Mobile optimizado */}
                <nav className={`space-y-1 lg:space-y-2 overflow-y-auto flex-1 ${isSidebarOpen ? 'p-2 lg:p-4' : 'p-1'}`} style={{ maxHeight: 'calc(100vh - 200px)' }}>
                    {menuItems.map((item, index) => {
                        const isActive = currentPage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setCurrentPage(item.id);
                                    // Cerrar sidebar en mobile después de seleccionar
                                    if (window.innerWidth < 1024) {
                                        setIsSidebarOpen(false);
                                    }
                                }}
                                className={`w-full flex items-center rounded-lg lg:rounded-xl transition-all duration-300 group relative ${
                                    isSidebarOpen ? 'space-x-2 lg:space-x-3 px-3 lg:px-4 py-2 lg:py-3' : 'justify-center py-3 px-2'
                                } ${
                                    isActive
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                                }`}
                                title={!isSidebarOpen ? item.label : ''}
                            >
                                {/* Barra lateral para item activo */}
                                {isActive && (
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 lg:h-8 bg-indigo-600 rounded-r-full"
                                    />
                                )}

                                {/* Icono - más pequeño en mobile */}
                                <span
                                    className="text-xl lg:text-2xl flex-shrink-0 transition-transform group-hover:scale-110"
                                >
                                    {item.icon}
                                </span>

                                {isSidebarOpen && (
                                    <div className="flex-1 text-left min-w-0">
                                        <p className={`font-bold text-xs lg:text-sm truncate ${
                                            isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                            {item.label}
                                        </p>
                                        <p className={`text-xs hidden lg:block ${
                                            isActive ? 'text-indigo-400 dark:text-indigo-500' : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {item.description}
                                        </p>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer minimalista */}
                <div className={`border-t border-gray-100 dark:border-slate-700 flex-shrink-0 ${isSidebarOpen ? 'p-4' : 'p-2'}`}>
                    {/* Toggle Dark Mode */}
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-full mb-3 px-3 py-2 text-sm font-semibold rounded-lg transition-all flex items-center ${
                            isSidebarOpen ? 'justify-start space-x-2' : 'justify-center'
                        } ${
                            isDarkMode
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                        }`}
                        title={isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
                    >
                        <span className="text-xl">{isDarkMode ? '☀️' : '🌙'}</span>
                        {isSidebarOpen && (
                            <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
                        )}
                    </button>

                    {isSidebarOpen && (
                        <a
                            href="reset-completo.html"
                            target="_blank"
                            className="block w-full px-3 py-2 mb-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors text-center"
                        >
                            🗑️ Limpiar Caché
                        </a>
                    )}
                    {isSidebarOpen ? (
                        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                            <p className="font-medium">© 2025 Gastos TC</p>
                            <p className="mt-1">v3.2 Minimalista</p>
                        </div>
                    ) : (
                        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
                            <span>©</span>
                        </div>
                    )}
                </div>
            </aside>

            {/* Overlay para mobile - solo visible cuando sidebar está abierto */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </>
    );
};
