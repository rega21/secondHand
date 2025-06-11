// Ejemplo básico de lógica para login y registro

document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'https://683db271199a0039e9e68933.mockapi.io/api-secondhand/registroLogin';

    // Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const mail = loginForm.elements['mail'].value.trim();
            const password = loginForm.elements['password'].value.trim();

            fetch(`${API_URL}?mail=${encodeURIComponent(mail)}&password=${encodeURIComponent(password)}`)
                .then(res => res.json())
                .then(users => {
                    if (Array.isArray(users) && users.length > 0 && users[0].id) {
                        localStorage.setItem('usuario', JSON.stringify(users[0]));
                        const carritoLocal = JSON.parse(localStorage.getItem('carrito')) || {};
                        obtenerCarritoDeUsuario(users[0].id).then(carritos => {
                            let carritoAPI = {};
                            if (Array.isArray(carritos) && carritos.length > 0 && carritos[0].items) {
                                carritos[0].items.forEach(item => {
                                    carritoAPI[item.productoId] = item.cantidad;
                                });
                            }
                            // Unir ambos carritos (sumar cantidades si hay repetidos)
                            const carritoUnido = { ...carritoAPI };
                            for (const [productoId, cantidad] of Object.entries(carritoLocal)) {
                                carritoUnido[productoId] = (carritoUnido[productoId] || 0) + cantidad;
                            }
                            // Guardar el carrito unido en localStorage
                            localStorage.setItem('carrito', JSON.stringify(carritoUnido));
                            // Sincronizar el carrito unido en la API
                            const items = Object.entries(carritoUnido).map(([productoId, cantidad]) => ({
                                productoId,
                                cantidad
                            }));
                            if (carritos.length > 0) {
                                actualizarCarrito(carritos[0].id, users[0].id, items);
                            } else {
                                crearCarrito(users[0].id, items);
                            }
                            document.getElementById('loginSuccess').classList.remove('d-none');
                            setTimeout(() => {
                                location.reload();
                            }, 1000);
                        });
                    } else {
                        alert('Mail o contraseña incorrectos');
                    }
                })
                .catch(() => alert('Error en el login'));
        });
    }

    // Registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = registerForm.querySelector('input[name="name"]').value.trim();
            const mail = registerForm.querySelector('input[name="mail"]').value.trim();
            const password = registerForm.querySelector('input[name="password"]').value.trim();

            if (!name || !mail || !password) {
                alert('Por favor, completa todos los campos.');
                return;
            }

            // Crear usuario en MockAPI
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, mail, password })
            })
                .then(res => res.json())
                .then(() => {
                    document.getElementById('registerSuccess').classList.remove('d-none');
                    registerForm.reset();
                    // alert('Registro exitoso');
                })
                .catch(() => alert('Error en el registro'));
        });
    }

    // Alternar entre login y registro en el modal
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const modalTitle = document.querySelector('.modal-title');

    if (showRegister && showLogin && loginForm && registerForm && modalTitle) {
        showRegister.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.add('d-none');
            registerForm.classList.remove('d-none');
            modalTitle.textContent = 'REGISTRO';
            // Limpiar ambos formularios y mensajes
            loginForm.reset();
            registerForm.reset();
            document.getElementById('loginSuccess').classList.add('d-none');
            document.getElementById('registerSuccess').classList.add('d-none');
        });
        showLogin.addEventListener('click', function(e) {
            e.preventDefault();
            registerForm.classList.add('d-none');
            loginForm.classList.remove('d-none');
            modalTitle.textContent = 'Iniciar sesión';
            // Limpiar ambos formularios y mensajes
            loginForm.reset();
            registerForm.reset();
            document.getElementById('loginSuccess').classList.add('d-none');
            document.getElementById('registerSuccess').classList.add('d-none');
        });
    }

    function mostrarEstadoUsuario() {
        const usuario = JSON.parse(localStorage.getItem('usuario'));
        const bienvenida = document.getElementById('bienvenidaUsuario');
        const iconoSesion = document.getElementById('iconoUsuario');
        if (usuario && bienvenida && iconoSesion) {
            bienvenida.textContent = `Bienvenida: ${usuario.name || 'usuario'}`;
            bienvenida.classList.remove('d-none');
            iconoSesion.classList.remove('bi-person-circle');
            iconoSesion.classList.add('bi-person-fill-check');
            iconoSesion.style.color = "#198754";
            iconoSesion.title = `¡Hola, ${usuario.name || 'usuario'}!`;
        } else if (bienvenida && iconoSesion) {
            bienvenida.classList.add('d-none');
            bienvenida.textContent = '';
            iconoSesion.classList.remove('bi-person-fill-check');
            iconoSesion.classList.add('bi-person-circle');
            iconoSesion.style.color = "";
            iconoSesion.title = "Login/Registro";
        }
    }

    // Llama a la función al cargar la página
    mostrarEstadoUsuario(); // Llama aquí la función, NO uses otro addEventListener

    // Limpiar formularios y mensajes al cerrar el modal
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('hidden.bs.modal', function () {
            // Limpiar formularios
            const loginForm = document.getElementById('loginForm');
            const registerForm = document.getElementById('registerForm');
            if (loginForm) loginForm.reset();
            if (registerForm) registerForm.reset();

            // Ocultar mensajes de éxito
            const loginSuccess = document.getElementById('loginSuccess');
            const registerSuccess = document.getElementById('registerSuccess');
            if (loginSuccess) loginSuccess.classList.add('d-none');
            if (registerSuccess) registerSuccess.classList.add('d-none');

            // Mostrar solo el login por defecto
            if (loginForm) loginForm.classList.remove('d-none');
            if (registerForm) registerForm.classList.add('d-none');
        });
    }

    const iconoUsuarioLink = document.getElementById('iconoUsuarioLink');
    if (iconoUsuarioLink) {
        iconoUsuarioLink.addEventListener('click', function(e) {
            e.preventDefault();
            const usuario = JSON.parse(localStorage.getItem('usuario'));
            if (usuario) {
                // Si está logueado, preguntar si quiere cerrar sesión
                if (confirm('¿Cerrar sesión?')) {
                    // Preguntar si también quiere borrar el carrito
                    if (confirm('¿Quieres borrar el carrito del navegador?')) {
                        localStorage.removeItem('carrito');
                        actualizarIconoCarrito(); // <-- Actualiza el número del carrito
                    }
                    localStorage.removeItem('usuario');
                    mostrarEstadoUsuario();
                    desmarcarFavoritosAlCerrarSesion();
                }
            } else {
                // Si NO está logueado, abrir el modal de login
                const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModal'));
                modal.show();
            }
        });
    }

    // Supón que tienes el usuario logueado y el carrito local
    const usuario = JSON.parse(localStorage.getItem('usuario')) || null;
    if (!usuario || !usuario.id) return;
    const carritoLocal = JSON.parse(localStorage.getItem('carrito')) || {};

    const items = Object.entries(carritoLocal).map(([productoId, cantidad]) => ({
      productoId,
      cantidad
    }));

    // Solo sincroniza si hay usuario logueado
    if (usuario) {
        obtenerCarritoDeUsuario(usuario.id).then(carritos => {
            if (Array.isArray(carritos) && carritos.length > 0 && carritos[0].id) {
                actualizarCarrito(carritos[0].id, usuario.id, items)
                    .then(data => console.log('Carrito actualizado en API:', data));
            } else {
                crearCarrito(usuario.id, items)
                    .then(data => console.log('Carrito creado en API:', data));
            }
        });
    }

    function desmarcarFavoritosAlCerrarSesion() {
        document.querySelectorAll('.btn-favorito').forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = 'bi bi-heart fs-4';
            }
        });
    }
});