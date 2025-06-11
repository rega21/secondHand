let todosLosProductos = []; // Guardamos todos los productos para restaurar la grilla
let filtroFavoritosActivo = false;

document.addEventListener('DOMContentLoaded', () => {
  // Leer el parámetro de categoría de la URL
  const params = new URLSearchParams(window.location.search);
  const categoriaURL = params.get('categoria');

  fetch('https://683db271199a0039e9e68933.mockapi.io/api-secondhand/productos')
    .then(response => response.json())
    .then(productos => {
      todosLosProductos = productos;

      // Si hay categoría en la URL, filtra antes de renderizar
      if (categoriaURL) {
        if (categoriaURL === 'sale') {
          const productosSale = productos.filter(
            p => p.badge && p.badge.trim().toLowerCase() === 'sale'
          );
          renderizarProductos(productosSale);
        } else {
          const productosFiltrados = productos.filter(p => p.categoria === categoriaURL);
          renderizarProductos(productosFiltrados);
        }
      } else {
        renderizarProductos(productos);
      }

      // Filtro Sale (por si el usuario hace click en el menú)
      const saleLink = document.querySelector('[data-categoria="sale"]');
      if (saleLink) {
        saleLink.addEventListener('click', function(e) {
          e.preventDefault();
          const productosSale = productos.filter(
            p => p.badge && p.badge.trim().toLowerCase() === 'sale'
          );
          renderizarProductos(productosSale);
        });
      }
    })
    .catch(error => {
      console.error('Error al cargar productos:', error);
    });

  // Filtro de favoritos desde el navbar
  const favNavbar = document.getElementById('navbarFavoritos');
  if (favNavbar) {
    favNavbar.addEventListener('click', async function(e) {
      e.preventDefault();
      filtroFavoritosActivo = !filtroFavoritosActivo;
      const icon = favNavbar.querySelector('i');
      if (filtroFavoritosActivo) {
        icon.classList.add('text-danger');
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario) {
          alert('Debes iniciar sesión para ver tus favoritos.');
          filtroFavoritosActivo = false;
          icon.classList.remove('text-danger');
          return;
        }
        let favoritos = [];
        try {
          const res = await fetch(`https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos?usuarioId=${usuario.id}`);
          if (res.ok) {
            favoritos = await res.json();
          }
        } catch (err) {
          favoritos = [];
        }
        if (!Array.isArray(favoritos)) favoritos = [];
        const favoritosIds = favoritos.length ? favoritos.map(f => String(f.productoId)) : [];
        const productosFavoritos = todosLosProductos.filter(p => favoritosIds.includes(String(p.id)));
        if (productosFavoritos.length === 0) {
          document.querySelector('#productos .row').innerHTML = `
            <div class="col-12 text-center py-5">
              <p class="text-muted fs-4">No tienes productos favoritos aún.</p>
            </div>
          `;
        } else {
          renderizarProductos(productosFavoritos);
        }
      } else {
        icon.classList.remove('text-danger');
        renderizarProductos(todosLosProductos);
      }
    });
  }
});

function renderizarProductos(productos) {
  const contenedor = document.querySelector('#productos .row');
  contenedor.innerHTML = '';
  productos.forEach(producto => {
    contenedor.innerHTML += `
      <div class="col-md-4 producto" data-categoria="${producto.categoria}">
        <div class="card card-producto">
          <img src="${producto.imagen}" class="card-img-top" alt="${producto.titulo}">
          <button class="btn btn-link p-0 btn-favorito ms-2" data-id="${producto.id}" title="Agregar a favoritos">
            <i class="bi bi-heart fs-4"></i>
          </button>
          <div class="card-body">
            <h5 class="card-title">${producto.titulo}</h5>
            <p class="card-text">${producto.descripcion}</p>
            <p class="card-text"><strong>Precio:</strong> $${producto.precio}</p>
            <p class="card-text"><span class="badge">${producto.badge || ''}</span></p>
            <button class="btn btn-primary btn-agregar-carrito" data-id="${producto.id}">Agregar</button>
          </div>
        </div>
      </div>
    `;
  });
  // Asignar eventos a los botones de favorito
  document.querySelectorAll('.btn-favorito').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const productoId = btn.getAttribute('data-id');
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        if (!usuario) {
            const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
            loginModal.show();
            return;
        }
        // Detecta si ya es favorito
        const esFavoritoActual = btn.querySelector('i').classList.contains('bi-heart-fill');
        // Cambia el ícono inmediatamente (optimista)
        actualizarIconoFavorito(btn, !esFavoritoActual);
        toggleFavorito(productoId, btn)
            .catch(() => {
                // Si falla la API, revierte el cambio
                actualizarIconoFavorito(btn, esFavoritoActual);
            });
    });
});

  // Marcar favoritos del usuario
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (usuario) {
    fetch(`https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos?usuarioId=${usuario.id}`)
      .then(res => res.json())
      .then(favoritos => {
        if (!Array.isArray(favoritos)) favoritos = [];
        favoritos.forEach(fav => {
          const btn = document.querySelector(`.btn-favorito[data-id="${fav.productoId}"]`);
          if (btn) actualizarIconoFavorito(btn, true);
        });
      });
  }
}

function toggleFavorito(productoId, btn) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  if (!usuario) {
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal'));
    modal.show();
    return;
  }

  // Trae todos los favoritos del usuario y busca el producto en JS
  fetch(`https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos?usuarioId=${usuario.id}`)
    .then(res => res.json())
    .then(favs => {
      if (!Array.isArray(favs)) favs = [];
      const fav = favs.find(f => String(f.productoId) === String(productoId));
      if (fav) {
        // Eliminar favorito
        fetch(`https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos/${fav.id}`, {
          method: 'DELETE'
        }).then(() => {
          actualizarIconoFavorito(btn, false);
        });
      } else {
        // Agregar favorito
        fetch('https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usuarioId: usuario.id, productoId: String(productoId) })
        }).then(() => {
          actualizarIconoFavorito(btn, true);
        });
      }
    });
}

function actualizarIconoFavorito(btn, esFavorito) {
  const icon = btn.querySelector('i');
  if (icon) {
    icon.className = esFavorito ? 'bi bi-heart-fill fs-4 text-danger' : 'bi bi-heart fs-4';
  }
}