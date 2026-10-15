
/* ==========================================================================
   MÓDULO: fecha-hora.js
   Actualiza la fecha y la hora del encabezado superior.
   Se comparte entre index.html y usuarios.html.
   ========================================================================== */

import { fechaDeHoy } from "./fechas.js";

function actualizarFechaHora() {
    const ahora = new Date();

    const elementoFecha = document.querySelector("[data-fecha-hoy]");
    const elementoReloj = document.querySelector("#reloj-actual");

    if (elementoFecha) {
        elementoFecha.textContent = fechaDeHoy();
    }

    if (elementoReloj) {
        elementoReloj.textContent = ahora.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}

actualizarFechaHora();
setInterval(actualizarFechaHora, 30000);
