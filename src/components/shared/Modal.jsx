// Componente Modal reutilizable - Diseño Minimalista

const Modal = memo(({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }) => {
    useEffect(() => {
        // Manejar tecla ESC para cerrar
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // Prevenir scroll del body
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-[95vw] sm:max-w-md',
        md: 'max-w-[95vw] sm:max-w-2xl',
        lg: 'max-w-[95vw] sm:max-w-4xl',
        xl: 'max-w-[95vw] sm:max-w-6xl',
        full: 'max-w-full mx-2 sm:mx-4'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 animate-slideIn bg-black bg-opacity-50 dark:bg-opacity-70">
            <div
                className={`bg-white dark:bg-slate-800 rounded-lg sm:rounded-2xl ${sizeClasses[size]} w-full max-h-[98vh] sm:max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700 shadow-minimal-lg`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header minimalista - responsive */}
                <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-base sm:text-2xl font-bold text-gray-900 dark:text-white truncate pr-2">
                        {title}
                    </h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg flex-shrink-0"
                            aria-label="Cerrar modal"
                        >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Content - responsive padding */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6">
                    {children}
                </div>
            </div>
        </div>
    );
});
