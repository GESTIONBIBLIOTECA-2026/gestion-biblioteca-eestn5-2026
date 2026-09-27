/* ==========================================================================
   MÓDULO: storage.js - Persistencia Local de la Sesión (LocalStorage & JSON)
   Guarda el token que devuelve el backend para no perderlo al recargar.
   ========================================================================== */

const SESION_KEY = "biblioteca_sesion_v1";


/* --- Guarda { token, usuario } --- */
export function guardarSesion(sesion) {
    localStorage.setItem(SESION_KEY, JSON.stringify(sesion));
}


/* --- Devuelve { token, usuario } o null --- */
export function obtenerSesion() {
    try {
        return JSON.parse(localStorage.getItem(SESION_KEY)) ?? null;
    } catch (error) {
        return null;
    }
}


/* --- Devuelve solo el token o null --- */
export function obtenerToken() {
    return obtenerSesion()?.token ?? null;
}


/* --- Cierra la sesión en este navegador --- */
export function borrarSesion() {
    localStorage.removeItem(SESION_KEY);
}
