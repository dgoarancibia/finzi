// Componente ProgressBar con sistema de semáforo - Diseño Minimalista

const ProgressBar = memo(({
    label,
    current,
    max,
    showValues = true,
    showPercentage = true,
    size = 'md',
    animated = true
}) => {
    const porcentaje = calcularPorcentaje(current, max);
    const colores = getColorSemaforo(porcentaje);

    const sizeClasses = {
        sm: 'h-3',
        md: 'h-5',
        lg: 'h-7'
    };

    const disponible = Math.max(max - current, 0);
    const excedido = current > max;

    return (
        <div className="space-y-2">
            {/* Label y valores */}
            {label && (
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800 dark:text-white">{label}</span>
                    {showValues && (
                        <div className="flex items-center space-x-2">
                            <span className={`text-sm font-black ${colores.textColor} px-2 py-1 rounded-lg`}
                                style={{
                                    background: `${colores.color}15`,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                            >
                                {formatearMonto(current)}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                                de {formatearMonto(max)}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Barra de progreso minimalista */}
            <div className="relative">
                <div className={`w-full ${sizeClasses[size]} bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden`}>
                    <div
                        className={`${sizeClasses[size]} rounded-full transition-all duration-500 ease-out ${animated ? 'animate-pulse-soft' : ''}`}
                        style={{
                            width: `${Math.min(porcentaje, 100)}%`,
                            backgroundColor: colores.color
                        }}
                    />
                </div>

                {/* Indicador de excedido */}
                {excedido && (
                    <div className="absolute top-0 right-0 -mt-1 -mr-1">
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    </div>
                )}
            </div>

            {/* Información adicional */}
            <div className="flex items-center justify-between text-xs">
                {showPercentage && (
                    <span className={`font-semibold ${colores.textColor}`}>
                        {porcentaje}%
                    </span>
                )}
                {!excedido && (
                    <span className="text-gray-500 dark:text-gray-400">
                        Disponible: {formatearMonto(disponible)}
                    </span>
                )}
                {excedido && (
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                        ¡Excedido por {formatearMonto(current - max)}!
                    </span>
                )}
            </div>
        </div>
    );
});

// Componente ProgressBarSimple para uso en listas - Diseño Minimalista
const ProgressBarSimple = memo(({ current, max, height = 'h-2' }) => {
    const porcentaje = calcularPorcentaje(current, max);
    const colores = getColorSemaforo(porcentaje);

    return (
        <div className="flex-1">
            <div className={`w-full ${height} bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden`}>
                <div
                    className={`${height} rounded-full transition-all duration-500`}
                    style={{
                        width: `${Math.min(porcentaje, 100)}%`,
                        backgroundColor: colores.color
                    }}
                />
            </div>
        </div>
    );
});

// Componente ProgressCircular para indicadores circulares - Diseño Minimalista
const ProgressCircular = memo(({ current, max, size = 80, strokeWidth = 8 }) => {
    const porcentaje = calcularPorcentaje(current, max);
    const colores = getColorSemaforo(porcentaje);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (porcentaje / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Círculo de fondo */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb"
                    className="dark:stroke-slate-700"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Círculo de progreso */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={colores.color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-sm font-bold ${colores.textColor}`}>
                    {porcentaje}%
                </span>
            </div>
        </div>
    );
});
