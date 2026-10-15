/* ==========================================================================
   MÓDULO: menu-perfil.js - Menú desplegable del perfil (encabezado superior)
   Al hacer clic en la foto o el nombre se abre con:
     - Ajustes del perfil  → configuracion.html
     - Apariencia (switch luna / sol) → lo maneja js/tema.js
     - Cerrar sesión       → lo maneja js/sesion.js ([data-cerrar-sesion])
   ========================================================================== */

const botonPerfil = document.querySelector("[data-abrir-menu-perfil]");
const listaMenu   = document.querySelector("#menuPerfil");


// ==========================================================================
// 🎨 1. Abrir y cerrar
// ==========================================================================
function abrirMenu() {
    listaMenu.hidden = false;
    botonPerfil.setAttribute("aria-expanded", "true");
}

function cerrarMenu({ devolverFoco = false } = {}) {
    listaMenu.hidden = true;
    botonPerfil.setAttribute("aria-expanded", "false");

    if (devolverFoco) botonPerfil.focus();
}

function opcionesDelMenu() {
    return [...listaMenu.querySelectorAll("[role^='menuitem']")];
}


// ==========================================================================
// 🖱️ 2. Eventos
// ==========================================================================
if (botonPerfil && listaMenu) {

    botonPerfil.addEventListener("click", () => {
        listaMenu.hidden ? abrirMenu() : cerrarMenu();
    });

    // Flecha abajo sobre el botón: abre y va a la primera opción
    botonPerfil.addEventListener("keydown", (evento) => {
        if (evento.key === "ArrowDown") {
            evento.preventDefault();
            abrirMenu();
            opcionesDelMenu()[0]?.focus();
        }
    });

    // Navegar las opciones con las flechas, cerrar con Escape
    listaMenu.addEventListener("keydown", (evento) => {

        const opciones = opcionesDelMenu();
        const actual = opciones.indexOf(document.activeElement);

        if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
            evento.preventDefault();
            const paso = evento.key === "ArrowDown" ? 1 : -1;
            opciones[(actual + paso + opciones.length) % opciones.length]?.focus();
        }

        if (evento.key === "Escape") {
            cerrarMenu({ devolverFoco: true });
        }
    });

    // Clic afuera → se cierra
    document.addEventListener("click", (evento) => {
        if (!listaMenu.hidden && !evento.target.closest("[data-menu-perfil]")) {
            cerrarMenu();
        }
    });

    // Tab fuera del menú → se cierra
    listaMenu.addEventListener("focusout", (evento) => {
        if (!evento.relatedTarget?.closest?.("[data-menu-perfil]")) {
            cerrarMenu();
        }
    });
}
