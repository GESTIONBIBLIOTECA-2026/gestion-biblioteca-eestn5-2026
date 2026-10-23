/* ==========================================================================
   MÓDULO: menu-acciones.js - Menú desplegable "Acciones" de la tabla de usuarios
   Es UN solo menú para toda la tabla: se llena con las opciones del usuario
   elegido y se ubica junto a su botón (así no lo corta el scroll de la tabla).
   ========================================================================== */

import { crearOpcionesAccionesHTML } from "./usuarios-ui.js";

const menu = document.querySelector("#menuAcciones");

const cerrar = () => { menu.hidden = true; };

function abrir(boton, usuario) {
    const caja = boton.getBoundingClientRect();
    menu.innerHTML = crearOpcionesAccionesHTML(usuario);
    menu.hidden = false;

    // Debajo del botón, alineado a su derecha (si abajo no entra, abre hacia arriba)
    const arriba = caja.bottom + menu.offsetHeight > window.innerHeight;
    menu.style.top = `${arriba ? caja.top - menu.offsetHeight - 6 : caja.bottom + 6}px`;
    menu.style.left = `${caja.right - menu.offsetWidth}px`;
}

/**
 * Activa el menú. Recibe:
 *  - buscarUsuario(id): devuelve el usuario de la tabla con ese id
 *  - acciones: { ver, editar, ... } funciones que reciben al usuario elegido
 */
export function activarMenuAcciones(buscarUsuario, acciones) {

    // Delegación: un solo listener para todos los botones y opciones
    document.addEventListener("click", (evento) => {
        const boton = evento.target.closest("[data-abrir-acciones]");
        const opcion = evento.target.closest("[data-accion]");
        const yaAbierto = boton && !menu.hidden && menu.querySelector(`[data-id="${boton.dataset.abrirAcciones}"]`);

        if (boton && !yaAbierto) return abrir(boton, buscarUsuario(Number(boton.dataset.abrirAcciones)));
        cerrar();
        if (opcion) acciones[opcion.dataset.accion](buscarUsuario(Number(opcion.dataset.id)));
    });

    // Si se mueve la página, el menú quedaría flotando en otro lado
    window.addEventListener("scroll", cerrar, true);
    window.addEventListener("resize", cerrar);
}
