// Componentes de alertas y badges

const AlertBadge = memo(({ type = 'info', children, icon = null, onClose = null, className = '' }) => {
    const typeClasses = {
        success: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
        warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
        error: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
        info: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700'
    };

    const defaultIcons = {
        success: '✓',
        warning: '⚠',
        error: '✕',
        info: 'ℹ'
    };

    return (
        <div className={`flex items-center space-x-2 px-4 py-3 rounded-lg border ${typeClasses[type]} ${className} animate-slideIn`}>
            {(icon || defaultIcons[type]) && (
                <span className="text-lg font-bold">
                    {icon || defaultIcons[type]}
                </span>
            )}
            <div className="flex-1 text-sm font-medium">
                {children}
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="text-current opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Cerrar alerta"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            )}
        </div>
    );
});

// Badge simple para etiquetas
const Badge = memo(({ children, color = 'gray', size = 'md', className = '' }) => {
    const colorClasses = {
        gray: 'bg-gray-100 dark:bg-slate-600 text-gray-800 dark:text-gray-200',
        indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200',
        green: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
        yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
        red: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
        blue: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
        purple: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
        pink: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200'
    };

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    return (
        <span className={`inline-flex items-center font-semibold rounded-full ${colorClasses[color]} ${sizeClasses[size]} ${className}`}>
            {children}
        </span>
    );
});

// Notificación toast (para mostrar temporalmente)
const Toast = memo(({ message, type = 'info', duration = 3000, onClose }) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const typeClasses = {
        success: 'bg-green-500 dark:bg-green-600 text-white',
        warning: 'bg-yellow-500 dark:bg-yellow-600 text-white',
        error: 'bg-red-500 dark:bg-red-600 text-white',
        info: 'bg-blue-500 dark:bg-blue-600 text-white'
    };

    return (
        <div className={`fixed bottom-4 right-4 px-6 py-4 rounded-lg shadow-xl ${typeClasses[type]} animate-slideIn z-50`}>
            <div className="flex items-center space-x-2">
                <span className="font-medium">{message}</span>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-white hover:text-gray-200 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
});

// AlertCompact para alertas compactas en dashboard
const AlertCompact = memo(({ title, description, icon, color = 'indigo', onClick = null }) => {
    const colorClasses = {
        indigo: 'bg-indigo-50 dark:bg-indigo-900 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200',
        green: 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200',
        yellow: 'bg-yellow-50 dark:bg-yellow-900 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200',
        red: 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
    };

    return (
        <div
            className={`flex items-start space-x-3 p-4 rounded-lg border ${colorClasses[color]} ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-all`}
            onClick={onClick}
        >
            {icon && (
                <div className="text-2xl mt-0.5">
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{title}</p>
                {description && (
                    <p className="text-xs mt-1 opacity-80">{description}</p>
                )}
            </div>
            {onClick && (
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            )}
        </div>
    );
});

// EmptyState para cuando no hay datos
const EmptyState = memo(({ icon = '📭', title, description, action = null }) => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-6xl mb-4 opacity-50">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                    {description}
                </p>
            )}
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
});
