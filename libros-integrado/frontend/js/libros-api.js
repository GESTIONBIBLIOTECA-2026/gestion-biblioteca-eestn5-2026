/* ==========================================================================
   MÓDULO: libros-api.js - Consumo del backend para la página de libros · Grupo 6
   Misma idea que api.js (fetch + async/await), pero solo con las rutas de /api/libros.
   ========================================================================== */

import { API_URL } from "./config.js";
import { obtenerToken } from "./storage.js";


/**
 * Petición al backend. Devuelve el JSON completo: { payload, mensaje }.
 * Si el servidor responde con error (400, 401, 404, 409, 500...) lanza un Error con:
 *   error.message (lo que mandó el backend), error.status y error.campos
 */
async function pedir(ruta, metodo = "GET", datos = null) {

    // 1. Petición HTTP con el token de la sesión
    const response = await fetch(`${API_URL}${ruta}`, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${obtenerToken()}`
        },
        body: datos ? JSON.stringify(datos) : null
    });

    // 2. Segundo await: el cuerpo JSON a objeto JS
    let data = {};
    try {
        data = await response.json();
    } catch (error) {
        data = {};
    }

    // 3. fetch NO entra al catch con un 400 o un 500: hay que revisar response.ok
    if (!response.ok) {
        const error = new Error(data.error || `Error HTTP: ${response.status}`);
        error.status = response.status;
        error.campos = data.campos;
        throw error;
    }

    return data;
}


export const listarLibros = () => pedir("/libros");
export const obtenerCategorias = () => pedir("/libros/categorias");
export const registrarLibro = (datos) => pedir("/libros", "POST", datos);
export const modificarLibro = (id, datos) => pedir(`/libros/${id}`, "PUT", datos);
export const cambiarEstadoLibro = (id, estado) => pedir(`/libros/${id}/estado`, "PUT", { estado });
export const modificarStock = (id, movimiento, cantidad) => pedir(`/libros/${id}/stock`, "POST", { movimiento, cantidad });
