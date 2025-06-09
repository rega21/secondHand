document.addEventListener('DOMContentLoaded', () => {
  fetch('https://683db271199a0039e9e68933.mockapi.io/api-secondhand/productos')
    .then(response => response.json())
    .then(productos => {
      renderizarProductos(productos);

      // Filtro Sale
      const saleLink = document.querySelector('[data-categoria="sale"]');
      if (saleLink) {
        saleLink.addEventListener('click', function(e) {
          e.preventDefault();
          const productosSale = productos.filter(p => p.badge && p.badge.toLowerCase() === 'sale');
          renderizarProductos(productosSale);
        });
      }
    })
    .catch(error => {
      console.error('Error al cargar productos:', error);
    });
});

function renderizarProductos(productos) {
  const contenedor = document.querySelector('#productos .row');
  contenedor.innerHTML = '';
  productos.forEach(producto => {
    contenedor.innerHTML += `
      <div class="col-md-4">
        <div class="card h-100">
          <img src="${producto.imagen}" class="card-img-top" alt="${producto.titulo}">
          <div class="card-body">
            <h5 class="card-title">${producto.titulo}</h5>
            <p class="card-text">${producto.descripcion}</p>
            <p class="card-text fw-bold">$${producto.precio}</p>
            <button class="btn btn-success btn-agregar" data-id="${producto.id}">Agregar al carrito</button>
          </div>
        </div>
      </div>
    `;
  });
  // Aquí puedes volver a asignar eventos a los botones si es necesario
}