/* ==========================================================================
   MÓDULO: sesion.js - Protección de las páginas del panel
   - Sin sesión válida → vuelve a login.html
   - Muestra el nombre del administrador en el encabezado
   - "Cerrar sesión" del menú del perfil
   - Carga lo común del encabezado: fecha/hora y menú del perfil
   Se incluye en cada página protegida:
     <script type="module" src="js/sesion.js"></script>
   ========================================================================== */

import { obtenerPerfil } from "./api.js";
import { obtenerToken, borrarSesion } from "./storage.js";
import "./fecha-hora.js";
import "./menu-perfil.js";


// ==========================================================================
// 🎨 1. Funciones
// ==========================================================================
function irAlLogin() {
    window.location.replace("login.html");
}

// "administrador" → "Administrador"
const conMayuscula = (texto = "") => texto.charAt(0).toUpperCase() + texto.slice(1);

/* --- Nombre y rol en el encabezado (también lo usa Configuración al guardar) --- */
export function mostrarNombre(nombre, rol) {

    document.querySelectorAll("[data-nombre-admin]").forEach((elemento) => {
        elemento.textContent = nombre;
    });

    if (rol) {
        document.querySelectorAll("[data-rol-admin]").forEach((elemento) => {
            elemento.textContent = conMayuscula(rol);
        });
    }
}

function mostrarUsuario({ nombre, rol }) {

    mostrarNombre(nombre, rol);

    // Recién ahora se muestra la página
    document.documentElement.classList.remove("verificando-sesion");

    // Aviso para las páginas que necesitan hacer algo cuando ya se ven (ej: poner el cursor en un campo)
    document.dispatchEvent(new CustomEvent("sesion-verificada"));
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
