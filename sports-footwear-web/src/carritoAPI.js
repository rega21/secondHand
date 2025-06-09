const API_URL = 'https://683db271199a0039e9e68933.mockapi.io/api-secondhand/carrito';

// Buscar el carrito del usuario
function obtenerCarritoDeUsuario(usuarioId) {
    return fetch(`${API_URL}?usuarioId=${usuarioId}`)
        .then(res => res.json());
}

// Crear un carrito nuevo
function crearCarrito(usuarioId, items) {
    return fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, items })
    }).then(res => res.json());
}

// Actualizar un carrito existente
function actualizarCarrito(carritoId, usuarioId, items) {
    return fetch(`${API_URL}/${carritoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId, items })
    }).then(res => res.json());
}

