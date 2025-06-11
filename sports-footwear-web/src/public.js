document.addEventListener('DOMContentLoaded', function() {
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
            const categoriaOk = !filtroCategoria || prod.categoria === filtroCategoria;
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
                <div class="card card-producto">
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
    }

    // Filtro por categoría (botones y dropdown)
    document.querySelectorAll('[data-categoria]').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            filtroCategoria = el.getAttribute('data-categoria');
            renderProductos();
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
                const productosSale = productos.filter(prod =>
                    prod.badge && prod.badge.toLowerCase() === "sale"
                );
                if (productosSale.length === 0) {
                    document.querySelector('#productos .row.g-4').innerHTML = `
                        <div class="col-12 text-center py-5">
                            <p class="text-muted fs-4">No hay productos en oferta actualmente.</p>
                        </div>
                    `;
                } else {
                    renderProductos(productosSale);
                }
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
});