/* ==========================================================================
   MÓDULO: api.js - Consumo del Backend (Fetch & Async/Await)
   Todas las peticiones al servidor Express pasan por acá.
   ========================================================================== */

import { API_URL } from "./config.js";
import { obtenerToken } from "./storage.js";


/**
 * Hace la petición al backend y devuelve data.payload.
 * Si el servidor responde con error (400, 401, 500...) lanza un Error
 * con el mensaje que mandó el backend y el código en error.status.
 */
async function pedirAlBackend(ruta, opciones = {}) {

    const token = obtenerToken();

    // 1. Petición HTTP (si hay sesión, se manda el token)
    const response = await fetch(`${API_URL}${ruta}`, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
        },
        signal: AbortSignal.timeout(10000)
    });

    // 2. Segundo await: convertir el cuerpo a objeto JS
    const data = await response.json().catch(() => ({}));

    // 3. fetch NO entra al catch con un 401 o 500: hay que revisar response.ok
    if (!response.ok) {
        const error = new Error(data.error || `Error HTTP: ${response.status}`);
        error.status = response.status;
        throw error;
    }

    return data.payload;
}


/* --- POST /api/auth/login → { token, usuario } --- */
export async function iniciarSesion(dni, clave) {
    return pedirAlBackend("/auth/login", {
        method: "POST",
        body: JSON.stringify({ dni, clave })
    });
}


/* --- GET /api/auth/perfil → { id, nombre, rol } --- */
export async function obtenerPerfil() {
    return pedirAlBackend("/auth/perfil");
}


/* --- GET /api/prestamos?limite=5 → [ { nombre_completo, titulo, fecha_prestamo, ... } ] --- */
export async function obtenerUltimosPrestamos(limite = 5) {
    return pedirAlBackend(`/prestamos?limite=${limite}`);
}


/* --- GET /api/usuarios/dni/:dni → { nombre_completo, curso, estado, puede_pedir, ... } --- */
export async function buscarUsuarioPorDni(dni) {
    return pedirAlBackend(`/usuarios/dni/${encodeURIComponent(dni)}`);
}


/* --- GET /api/libros/:id → { titulo, autores, ejemplares_disponibles, stock_reservable, ... } --- */
export async function buscarLibroPorId(id) {
    return pedirAlBackend(`/libros/${encodeURIComponent(id)}`);
}


/* --- POST /api/prestamos → préstamo creado --- */
export async function registrarPrestamo(dni, libroId) {
    return pedirAlBackend("/prestamos", {
        method: "POST",
        body: JSON.stringify({ dni, libroId })
    });
}
