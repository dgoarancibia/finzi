// Patrones predefinidos para categorización automática
// Palabras clave que identifican comercios chilenos comunes
window.CATEGORY_PATTERNS = {
    alimentacion: [
        'lider', 'jumbo', 'unimarc', 'santa isabel', 'tottus', 'ekono',
        'mercado', 'supermercado', 'almacen', 'verduleria', 'panaderia',
        'restaurant', 'resto', 'cafe', 'coffee', 'starbucks', 'juan valdez',
        'mcdonalds', 'burger king', 'kfc', 'subway', 'dominos', 'pizza',
        'sushi', 'comida', 'delivery', 'rappi', 'uber eats', 'pedidos ya',
        'copec', 'shell', 'esso', 'petrobras', 'enex', // Bencineras con tiendas
        'ok market', 'pronto', 'big john', 'spacio1'
    ],
    transporte: [
        'uber', 'cabify', 'didi', 'beat', 'taxi', 'transvip',
        'bip', 'metro', 'transantiago', 'red bus',
        'copec', 'shell', 'esso', 'petrobras', 'enex', 'bencinera',
        'combustible', 'peaje', 'autopista', 'tag', 'estacionamiento',
        'parking', 'tren', 'efe', 'turbus', 'pullman', 'buses'
    ],
    servicios: [
        'enel', 'cge', 'chilquinta', 'saesa', 'frontel', // Electricidad
        'esval', 'aguas andinas', 'nuevo sur', 'smapa', // Agua
        'metrogas', 'gasco', 'lipigas', 'abastible', // Gas
        'movistar', 'entel', 'claro', 'wom', 'vtr', 'mundo', 'virgin', // Telefonía
        'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'apple',
        'youtube', 'google', 'microsoft', 'adobe', 'dropbox', 'icloud'
    ],
    salud: [
        'farmacia', 'cruz verde', 'salcobrand', 'ahumada',
        'clinica', 'hospital', 'consulta', 'medico', 'doctor',
        'dental', 'dentista', 'odontologo', 'laboratorio',
        'isapre', 'fonasa', 'consalud', 'banmedica', 'cruz blanca',
        'optica', 'gimnasio', 'gym', 'smartfit', 'sportlife'
    ],
    entretenimiento: [
        'cine', 'cinemark', 'hoyts', 'cineplanet', 'cinepolis',
        'teatro', 'concierto', 'ticketmaster', 'puntoticket',
        'bar', 'pub', 'disco', 'club', 'bowling',
        'steam', 'playstation', 'xbox', 'nintendo', 'epic games',
        'casino', 'enjoy', 'dreams'
    ],
    educacion: [
        'universidad', 'instituto', 'colegio', 'escuela',
        'libreria', 'antartica', 'feria del libro',
        'curso', 'capacitacion', 'udemy', 'coursera', 'platzi',
        'duolingo', 'babbel'
    ],
    hogar: [
        'sodimac', 'easy', 'homecenter', 'construmart',
        'paris', 'falabella', 'ripley', 'lapolar', 'hites',
        'muebles', 'muebleria', 'deco', 'decoracion',
        'ferreteria', 'pintura', 'construc'
    ],
    tecnologia: [
        'pc factory', 'sp digital', 'abcdin', 'pc express',
        'apple', 'mac', 'iphone', 'samsung', 'xiaomi',
        'mercadolibre', 'aliexpress', 'amazon', 'ebay',
        'store', 'tech', 'digital', 'computacion', 'celular'
    ],
    ropa: [
        'zara', 'h&m', 'gap', 'forever 21', 'c&a', 'basement',
        'adidas', 'nike', 'puma', 'reebok', 'new balance',
        'falabella', 'ripley', 'paris', // También venden ropa
        'ropa', 'zapateria', 'zapatos', 'boutique'
    ],
    belleza: [
        'peluqueria', 'salon', 'spa', 'estetica',
        'perfumeria', 'sephora', 'mac', 'loreal',
        'barberia', 'barber', 'manicure', 'pedicure'
    ],
    mascotas: [
        'veterinaria', 'pet', 'mascota', 'perro', 'gato',
        'puppis', 'super zoo', 'pet food', 'alimento'
    ],
    viajes: [
        'hotel', 'hostal', 'apart', 'airbnb', 'booking',
        'latam', 'jetsmart', 'sky', 'aerol', 'vuelo',
        'turismo', 'tour', 'viaje', 'agencia'
    ],
    seguros: [
        'seguro', 'insurance', 'bci seguros', 'liberty',
        'chilena consolidada', 'hdi', 'sura', 'mapfre'
    ],
    prestamos: [
        'prestamo', 'credito', 'cuota', 'dividendo',
        'banco', 'santander', 'chile', 'bci', 'estado',
        'scotiabank', 'itau', 'security', 'falabella', 'ripley'
    ],
    ahorro: [
        'afp', 'capital', 'cuprum', 'habitat', 'modelo', 'planvital', 'provida',
        'inversion', 'fondo', 'mutuo', 'apv', 'ahorro'
    ]
};

// Normalización de nombres de comercios
// Mapeo de variaciones comunes a nombres estándar
window.COMMERCE_NORMALIZATIONS = {
    'lider express': 'Lider',
    'lider hiper': 'Lider',
    'jumbo mas': 'Jumbo',
    'unimarc express': 'Unimarc',
    'mc donalds': 'McDonalds',
    'mcdonald': 'McDonalds',
    'burger king': 'Burger King',
    'cruz verde': 'Cruz Verde',
    'farmacias cruz verde': 'Cruz Verde',
    'salcobrand': 'Salcobrand',
    'farmacias salcobrand': 'Salcobrand',
    'farmacia ahumada': 'Ahumada',
    'cinemark': 'Cinemark',
    'cine hoyts': 'Hoyts',
    'spotify premium': 'Spotify',
    'netflix': 'Netflix',
    'uber trip': 'Uber',
    'uber eats': 'Uber Eats',
    'rappi': 'Rappi',
    'pedidosya': 'PedidosYa',
    'pedidos ya': 'PedidosYa'
};
