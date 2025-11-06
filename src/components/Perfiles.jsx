// Página Perfiles - CRUD de perfiles de usuario

const Perfiles = () => {
    const { perfiles, updatePerfiles } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [perfilEditar, setPerfilEditar] = useState(null);
    const [showToast, setShowToast] = useState(null);

    const coloresDisponibles = [
        '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#ec4899', '#f97316', '#84cc16', '#0ea5e9'
    ];

    const handleAgregar = () => {
        setPerfilEditar(null);
        setShowModal(true);
    };

    const handleEditar = (perfil) => {
        setPerfilEditar(perfil);
        setShowModal(true);
    };

    const handleEliminar = (perfilId) => {
        if (perfiles.length === 1) {
            setShowToast({ message: 'Debe existir al menos un perfil', type: 'error' });
            return;
        }

        if (!confirm('¿Estás seguro de eliminar este perfil?')) return;

        const nuevosPerfiles = perfiles.filter(p => p.id !== perfilId);
        updatePerfiles(nuevosPerfiles);
        setShowToast({ message: 'Perfil eliminado', type: 'success' });
    };

    const handleGuardar = (perfil) => {
        let nuevosPerfiles;

        if (perfilEditar) {
            // Editar existente
            nuevosPerfiles = perfiles.map(p => p.id === perfilEditar.id ? { ...p, ...perfil } : p);
            setShowToast({ message: 'Perfil actualizado', type: 'success' });
        } else {
            // Agregar nuevo
            if (perfiles.length >= 5) {
                setShowToast({ message: 'Máximo 5 perfiles permitidos', type: 'error' });
                return;
            }
            const nuevoId = Math.max(...perfiles.map(p => p.id), 0) + 1;
            nuevosPerfiles = [...perfiles, { ...perfil, id: nuevoId, activo: false }];
            setShowToast({ message: 'Perfil creado', type: 'success' });
        }

        updatePerfiles(nuevosPerfiles);
        setShowModal(false);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Perfiles</h1>
                    <p className="text-gray-600">Administra los perfiles de usuario</p>
                </div>
                <button
                    onClick={handleAgregar}
                    disabled={perfiles.length >= 5}
                    className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    + Nuevo Perfil
                </button>
            </div>

            <Card>
                <div className="space-y-3">
                    {perfiles.map(perfil => (
                        <div
                            key={perfil.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center space-x-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: perfil.color }}
                                >
                                    {perfil.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                        {perfil.nombre}
                                    </h3>
                                    {perfil.activo && (
                                        <Badge color="green" size="sm">Activo</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleEditar(perfil)}
                                    className="px-4 py-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleEliminar(perfil.id)}
                                    className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    disabled={perfiles.length === 1}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {perfiles.length >= 5 && (
                    <AlertBadge type="info" className="mt-4">
                        Has alcanzado el límite máximo de 5 perfiles
                    </AlertBadge>
                )}
            </Card>

            {showModal && (
                <ModalPerfil
                    perfil={perfilEditar}
                    colores={coloresDisponibles}
                    onClose={() => setShowModal(false)}
                    onGuardar={handleGuardar}
                />
            )}

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

const ModalPerfil = ({ perfil, colores, onClose, onGuardar }) => {
    const [form, setForm] = useState({
        nombre: perfil?.nombre || '',
        color: perfil?.color || colores[0]
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) return;
        onGuardar(form);
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={perfil ? 'Editar Perfil' : 'Nuevo Perfil'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del Perfil
                    </label>
                    <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ej: Personal, Familia, Trabajo"
                        required
                        maxLength={20}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color del Perfil
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                        {colores.map(color => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setForm({ ...form, color })}
                                className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                                    form.color === color ? 'ring-4 ring-indigo-300 scale-110' : ''
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: form.color }}
                    >
                        {form.nombre.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Vista previa:</p>
                        <p className="font-semibold text-gray-800">
                            {form.nombre || 'Nombre del perfil'}
                        </p>
                    </div>
                </div>

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
                        {perfil ? 'Actualizar' : 'Crear'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
