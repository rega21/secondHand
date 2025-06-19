document.addEventListener('DOMContentLoaded', function() {
    // Leer el parámetro de categoría de la URL
    const params = new URLSearchParams(window.location.search);
    const categoriaURL = params.get('categoria');
    if (categoriaURL) {
        // Asigna el filtro de categoría y renderiza filtrado
        filtroCategoria = categoriaURL;
    }

    const contenedor = document.querySelector('#productos .row.g-4');
    const filtroPrecio = document.getElementById('filtroPrecio');
    const checksTalle = document.querySelectorAll('input[type="checkbox"][id^="talle"]');
    const checksgenero = document.querySelectorAll('input[type="checkbox"][id^="genero"]');
    const precioMinInput = document.getElementById('precioMinInput');
    const precioMaxInput = document.getElementById('precioMaxInput');

    let filtroCategoria = null;
    let precioActual = filtroPrecio ? filtroPrecio.value : 5000;
    let tallesSeleccionados = [];
    let generosSeleccionados = [];
    let productos = [];

    // Cargar productos desde MockAPI
    fetch('https://683db271199a0039e9e68933.mockapi.io/api-secondhand/productos')
        .then(response => response.json())
        .then(data => {
            productos = data;
            window.productos = productos; // <-- Esto es clave
            renderProductos(productos);
            activarFiltroSale();
        })
        .catch(error => {
            console.error('Error al cargar productos:', error);
        });

    // Reemplaza los inputs de precio por el slider
    const slider = document.getElementById('slider-precio');
    const precioMinLabel = document.getElementById('precioMinLabel');
    const precioMaxLabel = document.getElementById('precioMaxLabel');
    let precioMin = 400;
    let precioMax = 5000;

    noUiSlider.create(slider, {
        start: [precioMin, precioMax],
        connect: true,
        range: {
            'min': precioMin,
            'max': precioMax
        },
        step: 100,
        tooltips: [true, true],
        format: {
            to: value => Math.round(value),
            from: value => Number(value)
        }
    });

    slider.noUiSlider.on('update', function(values) {
        precioMinLabel.textContent = `$${values[0]}`;
        precioMaxLabel.textContent = `$${values[1]}`;
        // Actualiza los valores para el filtro
        renderProductos(productos, Number(values[0]), Number(values[1]));
    });

    function renderProductos(productosARenderizar = productos, min = precioMin, max = precioMax) {
        const productosFiltrados = productosARenderizar.filter(prod => {
            // Filtro por categoría
            const categoriaOk = !filtroCategoria || (filtroCategoria === 'sale' ? prod.badge && prod.badge.trim().toLowerCase() === 'sale' : prod.categoria === filtroCategoria);
            // Filtro por precio
            const precioOk = prod.precio >= min && prod.precio <= max;
            // Filtro por talle
            const talleOk = tallesSeleccionados.length === 0 || tallesSeleccionados.includes(prod.talle);
            // Filtro por genero
            const generoOk = generosSeleccionados.length === 0 || generosSeleccionados.includes(prod.genero);
            return categoriaOk && precioOk && talleOk && generoOk;
        });

        if (productosFiltrados.length === 0) {
            contenedor.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted fs-4">No hay productos para mostrar.</p>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = productosFiltrados.map(prod => `
            <div class="col-md-4 producto" data-categoria="${prod.categoria}">
                <div class="card card-producto position-relative">
                    ${prod.badge && prod.badge.trim().toLowerCase() === 'sale' ? `
                        <span class="badge bg-danger position-absolute top-0 start-0 m-2 fs-6" style="z-index:2;">SALE</span>
                    ` : ''}
                    <img src="${prod.imagen}" class="card-img-top" alt="${prod.titulo}">
                    <button class="btn btn-link p-0 btn-favorito ms-2" data-id="${prod.id}" title="Agregar a favoritos">
                        <i class="bi bi-heart fs-4"></i>
                    </button>
                    <div class="card-body">
                        <h5 class="card-title">${prod.titulo}</h5>
                        <p class="card-text">${prod.descripcion}</p>
                        <p class="card-text"><strong>Precio:</strong> $${prod.precio}</p>
                        <p class="card-text"><span class="badge">${prod.badge || ''}</span></p>
                        <button class="btn btn-primary btn-agregar-carrito" data-id="${prod.id}">Agregar</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Marcar favoritos del usuario desde localStorage
        const favoritosLS = JSON.parse(localStorage.getItem('favoritos')) || [];
        favoritosLS.forEach(productoId => {
            const btn = document.querySelector(`.btn-favorito[data-id="${productoId}"]`);
            if (btn) actualizarIconoFavorito(btn, true);
        });

        // ASIGNAR EVENTOS A LOS CORAZONES (esto es CLAVE)
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
                const esFavoritoActual = btn.querySelector('i').classList.contains('bi-heart-fill');
                actualizarIconoFavorito(btn, !esFavoritoActual);
                toggleFavorito(productoId, btn)
                    .catch(() => {
                        actualizarIconoFavorito(btn, esFavoritoActual);
                    });
            });
        });
    }

    // Función para resaltar la categoría activa en el dropdown Shop
    function resaltarCategoriaActiva() {
        document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(link => {
            link.classList.remove('active');
        });
        if (filtroCategoria) {
            const linkActivo = document.querySelector(`.dropdown-menu .dropdown-item[data-categoria="${filtroCategoria}"]`);
            if (linkActivo) linkActivo.classList.add('active');
        }
    }

    // Al cargar la página, si hay categoría en la URL, resalta
    if (categoriaURL) {
        filtroCategoria = categoriaURL;
        resaltarCategoriaActiva();
    }

    // Filtro por categoría (botones y dropdown)
    document.querySelectorAll('[data-categoria]').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            filtroCategoria = el.getAttribute('data-categoria');
            renderProductos();
            resaltarCategoriaActiva(); // Resalta la categoría seleccionada
        });
    });

    // Filtro por precio (range)
    if (filtroPrecio) {
        filtroPrecio.addEventListener('input', function() {
            precioActual = Number(filtroPrecio.value);
            if (precioMax) precioMax.textContent = `$${precioActual}`;
            renderProductos();
        });
    }

    // Filtro por talle (checkboxes)
    checksTalle.forEach(check => {
        check.addEventListener('change', function() {
            tallesSeleccionados = Array.from(checksTalle)
                .filter(c => c.checked)
                .map(c => c.value);
            renderProductos();
        });
    });

    // Filtro por genero (checkboxes)
    checksgenero.forEach(check => {
        check.addEventListener('change', function() {
            generosSeleccionados = Array.from(checksgenero)
                .filter(c => c.checked)
                .map(c => c.value);
            renderProductos();
        });
    });

    // Inicializar valores de precio
    if (filtroPrecio && precioMax) {
        filtroPrecio.value = 5000;
        precioMax.textContent = "$5000";
    }

    // Render inicial
    renderProductos();

    // Actualizar filtros de precio
    if (precioMinInput && precioMaxInput) {
        precioMinInput.addEventListener('input', () => renderProductos());
        precioMaxInput.addEventListener('input', () => renderProductos());
    }

    function activarFiltroSale() {
        const saleLink = document.querySelector('[data-categoria="sale"]');
        if (saleLink) {
            saleLink.addEventListener('click', function(e) {
                e.preventDefault();
                filtroCategoria = 'sale';
                renderProductos();
                resaltarCategoriaActiva && resaltarCategoriaActiva();
                document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            });
        }
    }

    window.productos = productos; // Así carrito.js puede acceder a los datos

    // Cambia 'contacto' por la sección actual
    let seccionActual = '';
    if (location.pathname.includes('contacto')) seccionActual = 'contacto';
    else if (location.pathname.includes('productos')) seccionActual = 'productos';
    else seccionActual = 'inicio';

    document.querySelectorAll('.btn-principal').forEach(btn => {
      if (btn.dataset.section === seccionActual) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
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
            // Si falla la API, revierte el cambio visual
            actualizarIconoFavorito(btn, esFavoritoActual);
          });
      });
    });

    // Renderizar productos al cargar la página con el filtro de categoría en la URL
    renderProductos();

    // Función para resaltar la categoría activa en el dropdown Shop
    function resaltarCategoriaActiva() {
        document.querySelectorAll('.dropdown-menu .dropdown-item').forEach(link => {
            link.classList.remove('active');
        });
        if (filtroCategoria) {
            const linkActivo = document.querySelector(`.dropdown-menu .dropdown-item[data-categoria="${filtroCategoria}"]`);
            if (linkActivo) linkActivo.classList.add('active');
        }
    }

    function toggleFavorito(productoId, btn) {
      const usuario = JSON.parse(localStorage.getItem('usuario'));
      if (!usuario) {
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal'));
        modal.show();
        return Promise.resolve(); // Permite usar .catch() sin error
      }

      return fetch(`https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos?usuarioId=${usuario.id}`)
        .then(res => res.json())
        .then(favs => {
          if (!Array.isArray(favs)) favs = [];
          const fav = favs.find(f => String(f.productoId) === String(productoId));
          if (fav) {
            // Eliminar favorito
            return fetch(`https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos/${fav.id}`, {
              method: 'DELETE'
            }).then(() => {
              actualizarIconoFavorito(btn, false);
              // Actualiza localStorage
              let favoritosLS = JSON.parse(localStorage.getItem('favoritos')) || [];
              favoritosLS = favoritosLS.filter(id => id !== productoId);
              localStorage.setItem('favoritos', JSON.stringify(favoritosLS));
            });
          } else {
            // Agregar favorito
            return fetch('https://683db271199a0039e9e68933.mockapi.io/api-secondhand/favoritos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ usuarioId: usuario.id, productoId: String(productoId) })
            }).then(() => {
              actualizarIconoFavorito(btn, true);
              // Actualiza localStorage
              let favoritosLS = JSON.parse(localStorage.getItem('favoritos')) || [];
              if (!favoritosLS.includes(productoId)) {
                favoritosLS.push(productoId);
                localStorage.setItem('favoritos', JSON.stringify(favoritosLS));
              }
            });
          }
        });
    }
});