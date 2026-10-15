/* ==========================================================================
   MÓDULO: panel.js - Página principal del panel (index.html)
   - Contador de "Atrasos pendientes" (usuarios morosos)
   - Carga la tabla "Últimos préstamos" desde la base (GET /api/prestamos)
   (La fecha, la hora y el menú del perfil los carga js/sesion.js)
   ========================================================================== */

import { obtenerUltimosPrestamos, listarUsuarios } from "./api.js";
import { fechaCorta } from "./fechas.js";


// ==========================================================================
// 🎯 1. Nodos del DOM
// ==========================================================================

const cuerpoTabla      = document.querySelector("#cuerpoPrestamos");
const contadorAtrasos  = document.querySelector("#contador-atrasos");



// ==========================================================================
// 🎨 2. Funciones de UI
// ==========================================================================

/* --- Estado del préstamo → texto y clase CSS de la etiqueta --- */
function etiquetaEstado(prestamo) {

    if (prestamo.estado === "devuelto") {
        return { texto: "Devuelto", clase: "devuelto" };
    }

    if (prestamo.estado === "vencido" || prestamo.dias_atraso > 0) {
        return { texto: "Atrasado", clase: "atrasado" };
    }

    return { texto: "En curso", clase: "en-curso" };
}



/* --- Crea una celda <td> con texto (textContent: nunca se interpreta como HTML) --- */
function crearCelda(texto) {
    const celda = document.createElement("td");
    celda.textContent = texto;
    return celda;
}


/* --- Una fila ocupando toda la tabla (cargando, vacío o error) --- */
function mostrarMensaje(texto) {

    const fila  = document.createElement("tr");
    const celda = crearCelda(texto);

    celda.colSpan = 5;
    celda.className = "celda-mensaje";

    fila.append(celda);
    cuerpoTabla.replaceChildren(fila);
}


/* --- Dibuja las filas de la tabla --- */
function mostrarPrestamos(prestamos) {

    if (prestamos.length === 0) {
        mostrarMensaje("Todavía no hay préstamos registrados.");
        return;
    }

    const filas = prestamos.map((prestamo) => {

        const fila = document.createElement("tr");
        const { texto, clase } = etiquetaEstado(prestamo);

        const etiqueta = document.createElement("span");
        etiqueta.className = `estado ${clase}`;
        etiqueta.textContent = texto;

        const celdaEstado = document.createElement("td");
        celdaEstado.append(etiqueta);

        fila.append(
            crearCelda(prestamo.nombre_completo),
            crearCelda(prestamo.titulo),
            crearCelda(fechaCorta(prestamo.fecha_prestamo)),
            // Si ya lo devolvió, la fecha real; si no, la fecha en que tiene que devolverlo
            crearCelda(fechaCorta(prestamo.fecha_devolucion_real || prestamo.fecha_devolucion_estimada)),
            celdaEstado
        );

        return fila;
    });

    cuerpoTabla.replaceChildren(...filas);
}


// ==========================================================================
// 🌐 3. Cargar los préstamos desde el backend
// ==========================================================================
async function cargarPrestamos() {

    mostrarMensaje("Cargando préstamos...");

    try {
        const prestamos = await obtenerUltimosPrestamos(5);
        mostrarPrestamos(prestamos);

    } catch (error) {
        mostrarMensaje(error.status ? error.message : "No hay conexión con el servidor.");
    }
}


// ==========================================================================
// ⚠️ 4. Atrasos pendientes: cuántos usuarios tienen un préstamo atrasado
//    (una sola consulta: el listado ya trae los contadores de cada filtro)
// ==========================================================================
async function cargarAtrasos() {

    try {
        const { contadores } = await listarUsuarios({ filtro: "morosos" });
        contadorAtrasos.textContent = contadores?.morosos ?? 0;

    } catch (error) {
        contadorAtrasos.textContent = "--";
    }
}


// ==========================================================================
// 🚀 5. Inicialización
// ==========================================================================
cargarAtrasos();
cargarPrestamos();
