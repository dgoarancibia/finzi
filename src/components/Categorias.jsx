// Página Categorías - CRUD de categorías

const Categorias = () => {
    const { categorias, updateCategorias } = useApp();
    const [showModal, setShowModal] = useState(false);
    const [categoriaEditar, setCategoriaEditar] = useState(null);
    const [showToast, setShowToast] = useState(null);

    const iconosDisponibles = ['🍔', '🚗', '💡', '⚕️', '🎬', '📚', '🏠', '💻', '👕', '💅', '🐾', '✈️', '🛡️', '💰', '📈', '❤️', '📦', '🎯', '🎨', '⚽'];

    const handleGuardar = (categoria) => {
        let nuevasCategorias;

        if (categoriaEditar) {
            nuevasCategorias = categorias.map(c => c.id === categoriaEditar.id ? { ...c, ...categoria } : c);
            setShowToast({ message: 'Categoría actualizada', type: 'success' });
        } else {
            const nuevoId = `cat_${Date.now()}`;
            nuevasCategorias = [...categorias, { ...categoria, id: nuevoId }];
            setShowToast({ message: 'Categoría creada', type: 'success' });
        }

        updateCategorias(nuevasCategorias);
        setShowModal(false);
    };

    const handleEliminar = (categoriaId) => {
        if (!confirm('¿Eliminar esta categoría? Las transacciones asociadas se moverán a "Otros".')) return;
        const nuevasCategorias = categorias.filter(c => c.id !== categoriaId);
        updateCategorias(nuevasCategorias);
        setShowToast({ message: 'Categoría eliminada', type: 'success' });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Categorías</h1>
                    <p className="text-gray-600">Personaliza las categorías de gastos</p>
                </div>
                <button onClick={() => { setCategoriaEditar(null); setShowModal(true); }} className="px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-colors shadow-lg">
                    + Nueva Categoría
                </button>
            </div>

            <Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorias.map(cat => (
                        <div key={cat.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl">{cat.icono}</span>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{cat.nombre}</h3>
                                        <div className="w-16 h-2 rounded-full mt-1" style={{ backgroundColor: cat.color }} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2 mt-3">
                                <button onClick={() => { setCategoriaEditar(cat); setShowModal(true); }} className="flex-1 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-100 rounded">Editar</button>
                                <button onClick={() => handleEliminar(cat.id)} className="flex-1 px-3 py-1 text-sm text-red-600 hover:bg-red-100 rounded">Eliminar</button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {showModal && <ModalCategoria categoria={categoriaEditar} iconos={iconosDisponibles} onClose={() => setShowModal(false)} onGuardar={handleGuardar} />}
            {showToast && <Toast message={showToast.message} type={showToast.type} onClose={() => setShowToast(null)} />}
        </div>
    );
};

const ModalCategoria = ({ categoria, iconos, onClose, onGuardar }) => {
    const [form, setForm] = useState({
        nombre: categoria?.nombre || '',
        icono: categoria?.icono || iconos[0],
        color: categoria?.color || '#6366f1'
    });

    return (
        <Modal isOpen={true} onClose={onClose} title={categoria ? 'Editar Categoría' : 'Nueva Categoría'} size="md">
            <form onSubmit={(e) => { e.preventDefault(); onGuardar(form); }} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required maxLength={20} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icono</label>
                    <div className="grid grid-cols-10 gap-2">
                        {iconos.map(icono => (
                            <button key={icono} type="button" onClick={() => setForm({ ...form, icono })} className={`text-2xl p-2 rounded hover:bg-gray-100 ${form.icono === icono ? 'bg-indigo-100 ring-2 ring-indigo-500' : ''}`}>{icono}</button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-12 rounded-lg cursor-pointer" />
                </div>
                <div className="flex space-x-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{categoria ? 'Actualizar' : 'Crear'}</button>
                </div>
            </form>
        </Modal>
    );
};
