document.addEventListener('DOMContentLoaded', function() {
    // Escuchar clicks en los botones "Agregar al carrito"
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-agregar-carrito')) {
            const id = String(e.target.getAttribute('data-id'));
            let carrito = JSON.parse(localStorage.getItem('carrito')) || {};
            carrito[id] = (carrito[id] || 0) + 1; // Suma cantidad
            localStorage.setItem('carrito', JSON.stringify(carrito));
            actualizarIconoCarrito();
            mostrarListaCarrito();

            // Después de agregar al carrito...
            const toast = new bootstrap.Toast(document.getElementById('toastCarrito'));
            toast.show();

            sincronizarCarritoConAPI();
        }
    });

    function actualizarIconoCarrito() {
        const carrito = JSON.parse(localStorage.getItem('carrito')) || {};
        const cantidad = Object.values(carrito).reduce((a, b) => a + b, 0);
        const icono = document.querySelector('.bi-bag');
        if (icono) {
            let badge = icono.nextElementSibling;
            if (!badge || !badge.classList.contains('carrito-badge')) {
                badge = document.createElement('span');
                badge.className = 'carrito-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
                icono.parentNode.appendChild(badge);
            }
            badge.textContent = cantidad;
            badge.style.fontSize = '0.8rem';
        }
    }
    window.actualizarIconoCarrito = actualizarIconoCarrito; // <-- Esto lo hace global

    // Mostrar lista de productos y total
    function mostrarListaCarrito() {
        let div = document.getElementById('carritoLista');
        if (!div) {
            div = document.createElement('div');
            div.id = 'carritoLista';
            document.body.appendChild(div);
        }

        if (!window.productos || !window.productos.length) {
            div.innerHTML = '<div class="text-center py-5"><div class="spinner-border"></div><p class="mt-3">Cargando productos...</p></div>';
            return;
        }
        const carrito = JSON.parse(localStorage.getItem('carrito')) || {};
        let html = `
      <div class="carrito-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">
        <button class="btn btn-sm btn-close" id="cerrarCarrito" aria-label="Cerrar"></button>
      </div>
      <ul style="list-style:none;padding:0;margin:0;">
    `;
        let total = 0;
        Object.entries(carrito).forEach(([id, cantidad]) => {
            const prod = window.productos.find(p => String(p.id) === String(id));
            if (prod) {
                html += `
      <li class="d-flex align-items-center mb-2">
        <img src="${prod.imagen}" alt="${prod.titulo}" style="width:40px;height:40px;object-fit:cover;margin-right:8px;">
        <div>
          <strong>${prod.titulo}</strong><br>
          <small>$${prod.precio} c/u</small>
          <div class="d-flex align-items-center mt-1">
            <button class="btn btn-sm btn-outline-secondary btn-restar ms-0" data-id="${prod.id}">-</button>
            <span class="mx-2">${cantidad}</span>
            <button class="btn btn-sm btn-outline-secondary btn-sumar" data-id="${prod.id}">+</button>
            <span class="ms-3">= <strong>$${prod.precio * cantidad}</strong></span>
          </div>
        </div>
        <button class="btn btn-sm btn-danger ms-2 btn-quitar-carrito" data-id="${prod.id}">&times;</button>
      </li>
    `;
                total += prod.precio * cantidad;
            }
        });
        html += `</ul><hr><div class="carrito-total" style="text-align:right;font-size:1.1rem;font-weight:700;color:#007bff;">Total: $${total}</div>
        <button class="btn btn-success w-100 mt-3" id="btnComprarCarrito">Comprar</button>`;

        div.innerHTML = html;

        // ...luego de renderizar el HTML, agrega el listener:
        const btnComprar = div.querySelector('#btnComprarCarrito');
        if (btnComprar) {
            btnComprar.addEventListener('click', function() {
                const usuario = JSON.parse(localStorage.getItem('usuario'));
                if (!usuario) {
                    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
                    loginModal.show();
                } else {
                    alert(`¡Gracias por tu compra, te enviaremos un recibo a tu dirección de correo ${usuario.mail}!`);
                    // Limpiar carrito
                    localStorage.removeItem('carrito');
                    actualizarIconoCarrito();
                    mostrarListaCarrito();
                }
            });
        }

        // Flechita decorativa
        div.style.position = 'absolute';
        div.style.background = '#fff';
        div.style.border = '1px solid rgb(129, 8, 120)';
        div.style.borderRadius = '1rem';
        div.style.padding = '1.2rem 1rem 1rem 1rem';
        div.style.zIndex = 2000;
        div.style.minWidth = '320px';
        div.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
        div.style.maxHeight = '60vh';
        div.style.overflowY = 'auto';
        div.style.animation = 'fadeInDown 0.3s';
        div.style.fontSize = '1rem';
        div.style.setProperty('margin-top', '8px');
        div.classList.add('carrito-popup-flecha');

        // Posicionar debajo del icono
        const icono = document.querySelector('.bi-bag');
        if (icono) {
            const rect = icono.getBoundingClientRect();
            div.style.top = `${rect.bottom + window.scrollY + 8}px`;
            div.style.right = '32px';
            div.style.left = 'auto';
        }

        // Botón cerrar
        const btnCerrar = div.querySelector('#cerrarCarrito');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', (e) => {
                e.stopPropagation();
                div.style.display = 'none';
            });
        }

        // Sumar/restar/quitar cantidad
        div.querySelectorAll('.btn-sumar').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                let carrito = JSON.parse(localStorage.getItem('carrito')) || {};
                carrito[id] = (carrito[id] || 0) + 1;
                localStorage.setItem('carrito', JSON.stringify(carrito));
                actualizarIconoCarrito();
                mostrarListaCarrito();
                sincronizarCarritoConAPI(); // sincroniza aquí
            });
        });
        div.querySelectorAll('.btn-restar').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                let carrito = JSON.parse(localStorage.getItem('carrito')) || {};
                if (carrito[id] > 1) {
                    carrito[id] -= 1;
                } else {
                    delete carrito[id];
                }
                localStorage.setItem('carrito', JSON.stringify(carrito));
                actualizarIconoCarrito();
                mostrarListaCarrito();
                sincronizarCarritoConAPI(); // sincroniza aquí
            });
        });
        div.querySelectorAll('.btn-quitar-carrito').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                let carrito = JSON.parse(localStorage.getItem('carrito')) || {};
                delete carrito[id];
                localStorage.setItem('carrito', JSON.stringify(carrito));
                actualizarIconoCarrito();
                mostrarListaCarrito();
                sincronizarCarritoConAPI(); // sincroniza aquí
            });
        });
    }

    // Escuchar click en el ícono del carrito
    const iconoCarrito = document.querySelector('.bi-bag');
    if (iconoCarrito) {
        iconoCarrito.addEventListener('click', function(e) {
            e.preventDefault();
            let div = document.getElementById('carritoLista');
            if (div && div.style.display !== 'none') {
                div.style.display = 'none';
            } else {
                mostrarListaCarrito();
                div = document.getElementById('carritoLista');
                if (div) div.style.display = 'block';
            }
        });
    }

    // Listener global SOLO UNA VEZ
    document.addEventListener('click', function(e) {
        const div = document.getElementById('carritoLista');
        const icono = document.querySelector('.bi-bag');
        if (
            div &&
            div.style.display !== 'none' &&
            !div.contains(e.target) &&
            e.target !== icono &&
            !e.target.classList.contains('btn-agregar-carrito')
        ) {
            div.style.display = 'none';
        }
    });

    const icono = document.querySelector('.bi-bag');
    const div = document.getElementById('carritoLista');
    if (icono && div) {
        const rect = icono.getBoundingClientRect();
        div.style.top = `${rect.bottom + window.scrollY + 8}px`;
        div.style.right = '32px';
        div.style.left = 'auto';
    }

    if (typeof actualizarIconoCarrito === "function") {
        actualizarIconoCarrito();
    }

    // --- FUNCIÓN DE SINCRONIZACIÓN ---
    function sincronizarCarritoConAPI() {
        const usuario = JSON.parse(localStorage.getItem('usuario')) || null;
        if (usuario) {
            const carrito = JSON.parse(localStorage.getItem('carrito')) || {};
            const items = Object.entries(carrito).map(([productoId, cantidad]) => ({
                productoId,
                cantidad
            }));
            obtenerCarritoDeUsuario(usuario.id).then(carritos => {
                if (Array.isArray(carritos) && carritos.length > 0 && carritos[0].id) {
                    // Actualiza solo si existe un carrito para ese usuario
                    actualizarCarrito(carritos[0].id, usuario.id, items);
                } else {
                    // Si no existe, crea uno nuevo
                    crearCarrito(usuario.id, items);
                }
            });
        }
    }

});

