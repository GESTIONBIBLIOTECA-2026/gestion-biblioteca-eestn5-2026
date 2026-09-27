/* ==========================================================================
   MÓDULO: sesion.js - Protección de las páginas del panel
   - Sin sesión válida → vuelve a login.html
   - Muestra el nombre del administrador
   - Botón "Salir"
   Se incluye en cada página protegida:
     <script type="module" src="js/sesion.js"></script>
   ========================================================================== */

import { obtenerPerfil } from "./api.js";
import { obtenerToken, borrarSesion } from "./storage.js";


// ==========================================================================
// 🎨 1. Funciones
// ==========================================================================
function irAlLogin() {
    window.location.replace("login.html");
}

function mostrarUsuario({ nombre }) {

    // Nombre completo en el encabezado
    document.querySelectorAll("[data-nombre-admin]").forEach((elemento) => {
        elemento.textContent = nombre;
    });

    // Solo el primer nombre en la bienvenida
    document.querySelectorAll("[data-primer-nombre]").forEach((elemento) => {
        elemento.textContent = nombre.split(" ")[0];
    });

    // Recién ahora se muestra la página
    document.documentElement.classList.remove("verificando-sesion");
}


// ==========================================================================
// 🌐 2. Verificar la sesión con el backend (GET /api/auth/perfil)
// ==========================================================================
async function verificarSesion() {

    if (!obtenerToken()) {
        irAlLogin();
        return;
    }

    try {
        const usuario = await obtenerPerfil();
        mostrarUsuario(usuario);

    } catch (error) {

        // 401 = token vencido o inválido → se borra
        if (error.status === 401) {
            borrarSesion();
        }

        irAlLogin();
    }
}


// ==========================================================================
// 🖱️ 3. Cerrar sesión (delegación de eventos)
// ==========================================================================
document.addEventListener("click", (evento) => {

    const boton = evento.target.closest("[data-cerrar-sesion]");

    if (!boton) return;

    borrarSesion();
    irAlLogin();
});


// ==========================================================================
// 🚀 4. Inicialización
// ==========================================================================
verificarSesion();
