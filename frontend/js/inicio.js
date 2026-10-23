/* ==========================================================================
   MÓDULO: inicio.js - Panel de inicio (index.html)
   - Contador de "Atrasos pendientes" (usuarios morosos)
   - Tabla "Últimos préstamos" (solo lectura)
   ========================================================================== */

import { obtenerUltimosPrestamos, listarUsuarios } from "./api.js";
import { crearFilaPrestamoHTML, crearFilaMensajeHTML } from "./ui.js";


// 🎯 1. Nodos del DOM
const cuerpoPrestamos = document.querySelector("#cuerpoPrestamos");
const contadorAtrasos = document.querySelector("#contador-atrasos");


// 🌐 2. Carga de datos (Loading → Éxito → Error)
async function cargarPrestamos() {
    cuerpoPrestamos.innerHTML = crearFilaMensajeHTML("Cargando préstamos...", 5);

    try {
        const { payload: prestamos } = await obtenerUltimosPrestamos(5);

        cuerpoPrestamos.innerHTML = prestamos.length === 0
            ? crearFilaMensajeHTML("Todavía no hay préstamos registrados.", 5)
            : prestamos.map(crearFilaPrestamoHTML).join("");

    } catch (error) {
        cuerpoPrestamos.innerHTML = crearFilaMensajeHTML(error.status ? error.message : "No hay conexión con el servidor.", 5);
    }
}

// El listado de usuarios ya trae cuántos hay en cada filtro: uno de ellos es "morosos"
async function cargarAtrasos() {
    try {
        const { payload } = await listarUsuarios({ filtro: "morosos" });
        contadorAtrasos.textContent = payload.contadores.morosos;
    } catch (error) {
        contadorAtrasos.textContent = "--";
    }
}


// 🚀 3. Inicialización (las dos consultas viajan en paralelo)
Promise.all([cargarAtrasos(), cargarPrestamos()]);
