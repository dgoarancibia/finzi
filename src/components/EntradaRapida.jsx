// Componente de Entrada Rápida con Parser de Texto Natural - Finzi v3.4

const EntradaRapida = ({ onClose, onSuccess }) => {
    const { perfiles, categorias } = useApp();
    const [textoLibre, setTextoLibre] = useState('');
    const [form, setForm] = useState({
        comercio: '',
        monto: '',
        cuotas: 1,
        montoCuota: '',
        categoria: '',
        perfilId: perfiles[0]?.id || '',
        fecha: new Date().toISOString().split('T')[0]
    });
    const [parsed, setParsed] = useState({
        comercio: false,
        monto: false,
        cuotas: false
    });
    const [comerciosSugeridos, setComerciosSugeridos] = useState([]);

    // Parser de texto natural
    const parsearTexto = useCallback(async (texto) => {
        if (!texto.trim()) {
            setParsed({ comercio: false, monto: false, cuotas: false });
            return;
        }

        const textoLower = texto.toLowerCase().trim();
        let updates = {};
        let parsedFlags = { comercio: false, monto: false, cuotas: false };

        // 1. Extraer MONTO
        // Patrones: "150.000", "150000", "150 mil", "150k", "$150.000"
        const regexMonto = /\$?\s*(\d{1,3})[\s.]?(\d{3})(?:\s*(mil|k))?|\$?\s*(\d+)\s*(mil|k)/gi;
        const matchMonto = regexMonto.exec(textoLower);

        if (matchMonto) {
            let monto = 0;
            if (matchMonto[1] && matchMonto[2]) {
                // Formato: "150.000" o "150 000"
                monto = parseInt(matchMonto[1] + matchMonto[2]);
            } else if (matchMonto[4]) {
                // Formato: "150 mil" o "150k"
                monto = parseInt(matchMonto[4]) * 1000;
            }

            if (monto > 0) {
                updates.monto = monto;
                parsedFlags.monto = true;
            }
        }

        // 2. Extraer CUOTAS
        // Patrones: "en 3 cuotas", "3 cuotas", "3x", "cuotas 3"
        const regexCuotas = /(?:en\s+)?(\d+)\s*(?:cuotas?|x)|cuotas?\s+(\d+)/i;
        const matchCuotas = regexCuotas.exec(textoLower);

        if (matchCuotas) {
            const numCuotas = parseInt(matchCuotas[1] || matchCuotas[2]);
            if (numCuotas > 1 && numCuotas <= 48) {
                updates.cuotas = numCuotas;
                parsedFlags.cuotas = true;

                // Calcular monto de cada cuota si ya tenemos el monto total
                if (updates.monto) {
                    updates.montoCuota = Math.round(updates.monto / numCuotas);
                }
            }
        } else {
            updates.cuotas = 1;
            updates.montoCuota = updates.monto || '';
        }

        // 3. Extraer COMERCIO
        // Buscar en historial de comercios existentes
        const transacciones = await db.transacciones.toArray();
        const comerciosUnicos = [...new Set(transacciones.map(t => t.comercio))];

        // Buscar coincidencias en el texto
        let mejorMatch = null;
        let mejorScore = 0;

        for (const comercio of comerciosUnicos) {
            const comercioLower = comercio.toLowerCase();
            // Match exacto o contenido
            if (textoLower.includes(comercioLower)) {
                const score = comercioLower.length; // Priorizar matches más largos
                if (score > mejorScore) {
                    mejorMatch = comercio;
                    mejorScore = score;
                }
            }
        }

        if (mejorMatch) {
            updates.comercio = mejorMatch;
            parsedFlags.comercio = true;
        } else {
            // Si no hay match, extraer palabras clave comunes
            const palabrasClave = [
                'uber', 'mercadona', 'falabella', 'ripley', 'paris', 'lider', 'jumbo',
                'copec', 'shell', 'esso', 'petrobras', 'terpel',
                'netflix', 'spotify', 'disney', 'amazon', 'apple',
                'restaurant', 'cafe', 'bar', 'almuerzo', 'cena'
            ];

            for (const palabra of palabrasClave) {
                if (textoLower.includes(palabra)) {
                    // Capitalizar primera letra
                    updates.comercio = palabra.charAt(0).toUpperCase() + palabra.slice(1);
                    parsedFlags.comercio = true;
                    break;
                }
            }

            // Si aún no hay comercio, extraer después de "en" o "de"
            if (!updates.comercio) {
                const regexComercio = /(?:en|de)\s+([a-záéíóúñ]+)/i;
                const matchComercio = regexComercio.exec(texto);
                if (matchComercio) {
                    updates.comercio = matchComercio[1].charAt(0).toUpperCase() + matchComercio[1].slice(1);
                    parsedFlags.comercio = true;
                }
            }
        }

        // 4. Sugerir CATEGORÍA basada en palabras clave o comercio
        if (updates.comercio) {
            const categoriasSugeridas = await sugerirCategoria(updates.comercio, textoLower);
            if (categoriasSugeridas && categoriasSugeridas.length > 0) {
                updates.categoria = categoriasSugeridas[0];
            }
        }

        // Actualizar estado
        setForm(prev => ({ ...prev, ...updates }));
        setParsed(parsedFlags);

    }, []);

    // Sugerir categoría basada en comercio o palabras clave
    const sugerirCategoria = async (comercio, textoCompleto) => {
        // 1. Buscar en historial si este comercio ya tiene una categoría frecuente
        const transacciones = await db.transacciones
            .where('comercio')
            .equals(comercio)
            .toArray();

        if (transacciones.length > 0) {
            // Contar frecuencia de categorías
            const frecuencias = {};
            transacciones.forEach(t => {
                frecuencias[t.categoria] = (frecuencias[t.categoria] || 0) + 1;
            });

            // Retornar la más frecuente
            const masFrecuente = Object.entries(frecuencias)
                .sort((a, b) => b[1] - a[1])[0][0];

            return [masFrecuente];
        }

        // 2. Si no hay historial, usar palabras clave
        const palabrasClave = {
            'supermercado': ['mercadona', 'lider', 'jumbo', 'tottus', 'santa isabel', 'super', 'supermercado'],
            'transporte': ['uber', 'cabify', 'didi', 'bencina', 'copec', 'shell', 'esso', 'metro', 'bus', 'taxi'],
            'alimentacion': ['restaurant', 'cafe', 'bar', 'almuerzo', 'cena', 'comida', 'pizza', 'sushi'],
            'vestuario': ['falabella', 'ripley', 'paris', 'zapatillas', 'zapatos', 'ropa', 'polera', 'pantalon', 'vestido'],
            'salud': ['farmacia', 'cruz verde', 'salcobrand', 'ahumada', 'doctor', 'clinica', 'hospital'],
            'entretenimiento': ['cine', 'netflix', 'spotify', 'disney', 'hbo', 'prime', 'concierto', 'teatro'],
            'hogar': ['homecenter', 'sodimac', 'easy', 'ikea', 'mueble', 'deco', 'construccion'],
            'servicios': ['luz', 'agua', 'gas', 'internet', 'telefono', 'seguros']
        };

        const textoLower = (comercio + ' ' + textoCompleto).toLowerCase();

        for (const [categoria, palabras] of Object.entries(palabrasClave)) {
            for (const palabra of palabras) {
                if (textoLower.includes(palabra)) {
                    return [categoria];
                }
            }
        }

        return []; // Sin sugerencia
    };

    // Cargar sugerencias de comercios para autocompletado
    useEffect(() => {
        const cargarComerciosSugeridos = async () => {
            const transacciones = await db.transacciones.toArray();
            const comercios = [...new Set(transacciones.map(t => t.comercio))];
            setComerciosSugeridos(comercios.sort());
        };
        cargarComerciosSugeridos();
    }, []);

    // Parsear cuando cambia el texto
    useEffect(() => {
        const timer = setTimeout(() => {
            parsearTexto(textoLibre);
        }, 500); // Debounce de 500ms

        return () => clearTimeout(timer);
    }, [textoLibre, parsearTexto]);

    // Actualizar montoCuota cuando cambia monto o cuotas
    useEffect(() => {
        if (form.monto && form.cuotas > 0) {
            setForm(prev => ({
                ...prev,
                montoCuota: Math.round(prev.monto / prev.cuotas)
            }));
        }
    }, [form.monto, form.cuotas]);

    const handleSubmit = async (e, continuar = false) => {
        e.preventDefault();

        if (!form.comercio || !form.monto || !form.categoria || !form.perfilId) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        try {
            // Preparar transacción con campos nuevos
            const transaccionBase = {
                comercio: form.comercio,
                monto: form.cuotas > 1 ? form.montoCuota : form.monto,
                montoOriginal: form.monto,
                categoria: form.categoria,
                perfilId: form.perfilId,
                fecha: form.fecha,
                descripcion: form.cuotas > 1 ? `Cuota de ${form.comercio}` : form.comercio,

                // Nuevos campos v3.4
                origen: 'manual',
                estado: 'provisional',
                textoOriginal: textoLibre,
                transaccionRelacionadaId: null,

                // Campos de cuotas
                cuotaActual: form.cuotas > 1 ? 1 : null,
                cuotasTotal: form.cuotas > 1 ? form.cuotas : null,

                // Campos de reembolso
                esReembolsable: false,
                reembolsoId: null
            };

            if (form.cuotas > 1) {
                // Crear múltiples transacciones para las cuotas
                const primeraTransaccionId = await db.transacciones.add(transaccionBase);

                // Crear las cuotas restantes
                for (let i = 2; i <= form.cuotas; i++) {
                    const fechaCuota = new Date(form.fecha);
                    fechaCuota.setMonth(fechaCuota.getMonth() + (i - 1));

                    await db.transacciones.add({
                        ...transaccionBase,
                        cuotaActual: i,
                        fecha: fechaCuota.toISOString().split('T')[0],
                        transaccionOrigenId: primeraTransaccionId
                    });
                }
            } else {
                // Transacción simple
                await db.transacciones.add(transaccionBase);
            }

            if (continuar) {
                // Limpiar formulario pero mantener perfil
                setTextoLibre('');
                setForm({
                    comercio: '',
                    monto: '',
                    cuotas: 1,
                    montoCuota: '',
                    categoria: '',
                    perfilId: form.perfilId,
                    fecha: new Date().toISOString().split('T')[0]
                });
                setParsed({ comercio: false, monto: false, cuotas: false });
            } else {
                onSuccess?.();
                onClose();
            }

        } catch (error) {
            console.error('Error al guardar transacción:', error);
            alert('Error al guardar la transacción');
        }
    };

    return (
        <Modal title="✍️ Entrada Rápida" onClose={onClose} size="md">
            <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
                {/* Campo de texto libre */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        💬 Describe tu gasto
                    </label>
                    <textarea
                        value={textoLibre}
                        onChange={(e) => setTextoLibre(e.target.value)}
                        placeholder='Ej: "compré zapatillas en falabella por 60.000" o "uber 8500"'
                        className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white resize-none"
                        rows="3"
                        autoFocus
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        💡 Escribe de forma natural, el sistema reconocerá automáticamente el comercio, monto y cuotas
                    </p>
                </div>

                {/* Separador visual */}
                {textoLibre && (
                    <div className="border-t border-gray-200 dark:border-slate-700 my-4" />
                )}

                {/* Comercio */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🏪 Comercio {parsed.comercio && <span className="text-green-600 dark:text-green-400 text-xs">✓ Detectado</span>}
                    </label>
                    <input
                        type="text"
                        list="comercios-sugeridos"
                        value={form.comercio}
                        onChange={(e) => setForm({ ...form, comercio: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                    />
                    <datalist id="comercios-sugeridos">
                        {comerciosSugeridos.map((comercio, idx) => (
                            <option key={idx} value={comercio} />
                        ))}
                    </datalist>
                </div>

                {/* Monto y Cuotas */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            💰 Monto {form.cuotas > 1 ? 'Total' : ''} {parsed.monto && <span className="text-green-600 dark:text-green-400 text-xs">✓</span>}
                        </label>
                        <input
                            type="number"
                            value={form.monto}
                            onChange={(e) => setForm({ ...form, monto: parseInt(e.target.value) || '' })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            💳 Cuotas {parsed.cuotas && <span className="text-green-600 dark:text-green-400 text-xs">✓</span>}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="48"
                            value={form.cuotas}
                            onChange={(e) => setForm({ ...form, cuotas: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Mostrar monto de cuota si hay cuotas */}
                {form.cuotas > 1 && form.montoCuota && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            💵 Cada cuota: <span className="font-bold">${form.montoCuota.toLocaleString('es-CL')}</span>
                        </p>
                    </div>
                )}

                {/* Categoría */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        🏷️ Categoría
                    </label>
                    <select
                        value={form.categoria}
                        onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                    >
                        <option value="">Seleccionar categoría</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.emoji} {cat.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Perfil */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        👤 Perfil
                    </label>
                    <select
                        value={form.perfilId}
                        onChange={(e) => setForm({ ...form, perfilId: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                    >
                        {perfiles.map(perfil => (
                            <option key={perfil.id} value={perfil.id}>
                                {perfil.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Fecha */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📅 Fecha
                    </label>
                    <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        required
                    />
                </div>

                {/* Badge de estado */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                        🟠 Se guardará como <span className="font-bold">"Provisional"</span> hasta que cargues el CSV del mes
                    </p>
                </div>

                {/* Botones de acción */}
                <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Guardar y + Otro
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
                    >
                        Guardar
                    </button>
                </div>
            </form>
        </Modal>
    );
};
