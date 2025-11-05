// Componente de Login con Firebase - Finzi v3.3

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            await window.loginWithGoogle();
            // El redirect se maneja automáticamente en App.jsx
        } catch (err) {
            console.error('Error en login:', err);
            setError(err.message || 'Error al iniciar sesión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <div className="max-w-md w-full mx-4">
                {/* Card Principal */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 animate-slideIn">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-block">
                            <svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-900 dark:text-white mx-auto">
                                <defs>
                                    <linearGradient id="arrow-gradient-login" x1="30" y1="8" x2="50" y2="32" gradientUnits="userSpaceOnBox">
                                        <stop offset="0%" style={{stopColor: '#7DD3C0', stopOpacity: 1}} />
                                        <stop offset="50%" style={{stopColor: '#A8E063', stopOpacity: 1}} />
                                        <stop offset="100%" style={{stopColor: '#56AB2F', stopOpacity: 1}} />
                                    </linearGradient>
                                </defs>
                                <path d="M 30 32 L 50 12 L 60 22" stroke="url(#arrow-gradient-login)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                <text x="0" y="30" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="currentColor">FINZI</text>
                                <rect x="115" y="10" width="4" height="20" rx="2" fill="#7DD3C0"/>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-4">
                            Bienvenido
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Analizador de Gastos de Tarjeta de Crédito
                        </p>
                    </div>

                    {/* Descripción */}
                    <div className="mb-8">
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-4">
                            <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                                ✨ Características
                            </h2>
                            <ul className="text-sm text-indigo-700 dark:text-indigo-400 space-y-1">
                                <li>📊 Análisis automático de gastos</li>
                                <li>🤖 Categorización inteligente</li>
                                <li>💰 Gestión de presupuestos</li>
                                <li>🔄 Sincronización multi-dispositivo</li>
                            </ul>
                        </div>
                    </div>

                    {/* Botón de Login */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 text-gray-700 dark:text-gray-200 font-semibold py-3 px-4 rounded-xl flex items-center justify-center space-x-3 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                                <span>Iniciando sesión...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                <span>Continuar con Google</span>
                            </>
                        )}
                    </button>

                    {/* Error */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-slideIn">
                            <p className="text-sm text-red-800 dark:text-red-300 flex items-center">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                                </svg>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Solo usuarios autorizados pueden acceder
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        © 2025 Finzi - v3.3
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Sincronización con Firebase
                    </p>
                </div>
            </div>
        </div>
    );
};
