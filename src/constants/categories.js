// Categorías predefinidas del sistema
window.DEFAULT_CATEGORIES = [
    { id: 'alimentacion', nombre: 'Alimentación', icono: '🍔', color: '#10b981' },
    { id: 'transporte', nombre: 'Transporte', icono: '🚗', color: '#3b82f6' },
    { id: 'servicios', nombre: 'Servicios', icono: '💡', color: '#f59e0b' },
    { id: 'salud', nombre: 'Salud', icono: '⚕️', color: '#ef4444' },
    { id: 'entretenimiento', nombre: 'Entretenimiento', icono: '🎬', color: '#8b5cf6' },
    { id: 'educacion', nombre: 'Educación', icono: '📚', color: '#6366f1' },
    { id: 'hogar', nombre: 'Hogar', icono: '🏠', color: '#ec4899' },
    { id: 'tecnologia', nombre: 'Tecnología', icono: '💻', color: '#06b6d4' },
    { id: 'ropa', nombre: 'Ropa', icono: '👕', color: '#a855f7' },
    { id: 'belleza', nombre: 'Belleza', icono: '💅', color: '#f97316' },
    { id: 'mascotas', nombre: 'Mascotas', icono: '🐾', color: '#84cc16' },
    { id: 'viajes', nombre: 'Viajes', icono: '✈️', color: '#0ea5e9' },
    { id: 'seguros', nombre: 'Seguros', icono: '🛡️', color: '#64748b' },
    { id: 'prestamos', nombre: 'Préstamos', icono: '💰', color: '#dc2626' },
    { id: 'ahorro', nombre: 'Ahorro/Inversión', icono: '📈', color: '#059669' },
    { id: 'donaciones', nombre: 'Donaciones', icono: '❤️', color: '#be123c' },
    { id: 'otros', nombre: 'Otros', icono: '📦', color: '#6b7280' }
];

// Perfiles por defecto
window.getDefaultPerfiles = function() {
    return [
        { id: 1, nombre: 'Diego', color: '#6366f1', activo: true },
        { id: 2, nombre: 'Marcela', color: '#ec4899', activo: true }
    ];
}
