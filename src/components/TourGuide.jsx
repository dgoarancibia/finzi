// Tour Guiado de Bienvenida - Finzi v3.3

const TourGuide = () => {
    const { setCurrentPage } = useApp();
    const [showTour, setShowTour] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        // Verificar si el usuario ya vio el tour
        const tourCompleted = localStorage.getItem('tourCompleted');
        if (!tourCompleted) {
            // Esperar un momento antes de mostrar el tour
            setTimeout(() => setShowTour(true), 1000);
        }
    }, []);

    // Navegación con teclado
    useEffect(() => {
        if (!showTour) return;

        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrev();
            } else if (e.key === 'Escape') {
                handleSkip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showTour, currentStep]);

    const steps = [
        {
            title: "¡Bienvenido a Finzi! 🎉",
            content: "Tu analizador inteligente de gastos de tarjeta de crédito. Te guiaré por las funcionalidades principales en unos segundos.",
            target: null,
            action: null
        },
        {
            title: "Dashboard Principal 🏠",
            content: "Aquí verás el resumen de tus gastos del mes: transacciones, presupuestos, balance y estadísticas clave.",
            target: "home",
            action: () => setCurrentPage('home')
        },
        {
            title: "Cargar CSV 📄",
            content: "El primer paso es cargar el CSV de tu tarjeta. Puedes seleccionar mes/año, asignar perfil y elegir entre categorización automática o manual.",
            target: "home",
            action: null
        },
        {
            title: "Transacciones 💰",
            content: "Gestiona tus ingresos mensuales, gastos a reembolsar y gastos recurrentes (Netflix, seguros anuales, etc.).",
            target: "transacciones",
            action: null
        },
        {
            title: "Análisis 📊",
            content: "Visualiza análisis detallados, historial de meses, balance entre perfiles y proyecciones de ahorro.",
            target: "analisis",
            action: null
        },
        {
            title: "Configuración ⚙️",
            content: "Configura perfiles (quién usa cada tarjeta), categorías personalizadas y presupuestos mensuales por categoría.",
            target: "configuracion",
            action: null
        },
        {
            title: "Herramientas Avanzadas 📈",
            content: "Proyecta cuotas futuras y simula el impacto de compras grandes en tu presupuesto antes de hacerlas.",
            target: "herramientas",
            action: null
        },
        {
            title: "Sincronización Firebase ☁️",
            content: "Tus datos se sincronizan automáticamente con Firebase. Accede desde cualquier dispositivo con tu cuenta de Google.",
            target: null,
            action: null
        },
        {
            title: "¡Listo para empezar! 🚀",
            content: "Ya conoces lo básico. Empieza cargando tu primer CSV o explora las configuraciones. ¡Que tengas un excelente control de tus finanzas!",
            target: null,
            action: null
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            const step = steps[nextStep];
            if (step.action) step.action();
            setCurrentStep(nextStep);
        } else {
            completeTour();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            const step = steps[prevStep];
            if (step.action) step.action();
            setCurrentStep(prevStep);
        }
    };

    const handleSkip = () => {
        completeTour();
    };

    const completeTour = () => {
        localStorage.setItem('tourCompleted', 'true');
        setShowTour(false);
    };

    if (!showTour) return null;

    const step = steps[currentStep];
    const isFirst = currentStep === 0;
    const isLast = currentStep === steps.length - 1;

    return (
        <>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-[60] animate-fadeIn" />

            {/* Modal del tour */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 pointer-events-auto animate-slideIn border-2 border-indigo-500">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-xl">
                                    {isFirst ? '👋' : isLast ? '🎉' : '💡'}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {step.title}
                                </h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Paso {currentStep + 1} de {steps.length}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2"
                            aria-label="Saltar tour"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {step.content}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleSkip}
                            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Saltar tour
                        </button>
                        <div className="flex space-x-2">
                            {!isFirst && (
                                <button
                                    onClick={handlePrev}
                                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    Anterior
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                            >
                                {isLast ? '¡Empezar!' : 'Siguiente'}
                            </button>
                        </div>
                    </div>

                    {/* Indicador de teclas */}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                            💡 Tip: Usa las flechas ← → del teclado para navegar
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
