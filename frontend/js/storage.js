/* ==========================================================================
   MÓDULO: storage.js - Persistencia Local de la Sesión (localStorage & JSON)
   ========================================================================== */

const SESION_KEY = "biblioteca_sesion_v1";

// Guarda { token, usuario } como texto JSON
export function guardarSesion(sesion) {
    localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}

// Devuelve solo el token (o null si no hay sesión)
export function obtenerToken() {
    try {
        return JSON.parse(localStorage.getItem(SESION_KEY))?.token ?? null;
    } catch (error) {
        return null;
    }
}

// Cierra la sesión en este navegador
export function borrarSesion() {
    localStorage.removeItem(SESION_KEY);
}
