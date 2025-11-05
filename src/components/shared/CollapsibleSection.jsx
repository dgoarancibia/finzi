// Componente de sección colapsable

const CollapsibleSection = memo(({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 animate-slideIn overflow-hidden">
            {/* Header colapsable */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
                <div className="flex items-center space-x-3">
                    {icon && <span className="text-3xl">{icon}</span>}
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
                </div>
                <svg
                    className={`w-6 h-6 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Contenido colapsable */}
            {isOpen && (
                <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-700">
                    <div className="pt-6">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
});
