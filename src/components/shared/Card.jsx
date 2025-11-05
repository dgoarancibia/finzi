// Componente Card reutilizable - Diseño Minimalista

const Card = memo(({ title, subtitle, icon, children, className = '', actions = null, variant = 'default' }) => {
    const variantClasses = {
        default: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700',
        primary: 'bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900',
        success: 'bg-white dark:bg-slate-800 border border-green-200 dark:border-green-900',
        warning: 'bg-white dark:bg-slate-800 border border-yellow-200 dark:border-yellow-900',
        danger: 'bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900'
    };

    return (
        <div className={`rounded-xl shadow-minimal-md ${variantClasses[variant]} ${className} animate-slideIn hover-lift transition-all duration-300`}>
            {(title || subtitle || icon || actions) && (
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {icon && (
                                <div className="text-3xl">
                                    {icon}
                                </div>
                            )}
                            <div>
                                {title && (
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {title}
                                    </h3>
                                )}
                                {subtitle && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        {actions && (
                            <div className="flex items-center space-x-2">
                                {actions}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="p-6">
                {children}
            </div>
        </div>
    );
});

// Componente CardStat para estadísticas numéricas - Diseño Minimalista
const CardStat = memo(({ label, value, icon, color = 'indigo', trend = null, subtitle = null }) => {
    const colorConfigs = {
        indigo: {
            bg: 'bg-indigo-50 dark:bg-slate-700',
            text: 'text-indigo-600 dark:text-indigo-400',
            iconBg: 'bg-indigo-100 dark:bg-slate-600',
            iconText: 'text-indigo-600 dark:text-indigo-400'
        },
        green: {
            bg: 'bg-green-50 dark:bg-slate-700',
            text: 'text-green-600 dark:text-green-400',
            iconBg: 'bg-green-100 dark:bg-slate-600',
            iconText: 'text-green-600 dark:text-green-400'
        },
        yellow: {
            bg: 'bg-yellow-50 dark:bg-slate-700',
            text: 'text-yellow-600 dark:text-yellow-400',
            iconBg: 'bg-yellow-100 dark:bg-slate-600',
            iconText: 'text-yellow-600 dark:text-yellow-400'
        },
        red: {
            bg: 'bg-red-50 dark:bg-slate-700',
            text: 'text-red-600 dark:text-red-400',
            iconBg: 'bg-red-100 dark:bg-slate-600',
            iconText: 'text-red-600 dark:text-red-400'
        },
        blue: {
            bg: 'bg-blue-50 dark:bg-slate-700',
            text: 'text-blue-600 dark:text-blue-400',
            iconBg: 'bg-blue-100 dark:bg-slate-600',
            iconText: 'text-blue-600 dark:text-blue-400'
        },
        purple: {
            bg: 'bg-purple-50 dark:bg-slate-700',
            text: 'text-purple-600 dark:text-purple-400',
            iconBg: 'bg-purple-100 dark:bg-slate-600',
            iconText: 'text-purple-600 dark:text-purple-400'
        }
    };

    // Usar config con fallback a indigo si el color no existe
    const config = colorConfigs[color] || colorConfigs['indigo'];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-minimal-md p-6 border border-gray-200 dark:border-slate-700 animate-slideIn hover-lift transition-all duration-300">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{label}</p>
                    <p className={`text-3xl font-black ${config.text}`}>{value}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
                    )}
                </div>
                {icon && (
                    <div className={`p-3 rounded-xl ${config.iconBg} ${config.iconText}`}>
                        <span className="text-2xl">{icon}</span>
                    </div>
                )}
            </div>

            {trend && (
                <div className="mt-4 flex items-center">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        trend.positive
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                            : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}>
                        {trend.positive ? '↑' : '↓'} {trend.value}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{trend.label}</span>
                </div>
            )}
        </div>
    );
});
