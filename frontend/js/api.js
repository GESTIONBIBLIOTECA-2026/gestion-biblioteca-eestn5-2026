/* ==========================================================================
   MÓDULO: api.js - Consumo del Backend (Fetch & Async/Await)
   Todas las peticiones al servidor Express pasan por acá.
   ========================================================================== */

import { API_URL } from "./config.js";
import { obtenerToken } from "./storage.js";


/**
 * Hace la petición al backend y devuelve el JSON completo: { mensaje, payload }.
 * Si el servidor responde con error (400, 401, 500...) lanza un Error
 * con el mensaje que mandó el backend, el código en error.status
 * y, si vienen, los campos mal cargados en error.campos.
 */
async function llamarAlBackend(ruta, opciones = {}) {

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
        error.campos = data.campos || null;
        throw error;
    }

    return data;
}


/**
 * Igual que llamarAlBackend, pero devuelve solo data.payload (lo que usan las consultas).
 */
async function pedirAlBackend(ruta, opciones = {}) {
    const data = await llamarAlBackend(ruta, opciones);
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


/* ==========================================================================
   GRUPO 5 — GESTIÓN DE USUARIOS
   ========================================================================== */

/* --- GET /api/usuarios?nombre=&dni=&curso=&filtro=&pagina=
       → { usuarios, total, pagina, total_paginas, contadores } --- */
export async function listarUsuarios({ nombre = "", dni = "", curso = "", filtro = "todos", pagina = 1 } = {}) {

    // URLSearchParams arma la parte "?nombre=...&dni=..." y codifica los caracteres raros
    const parametros = new URLSearchParams({ filtro, pagina });

    if (nombre) parametros.set("nombre", nombre);
    if (dni) parametros.set("dni", dni);
    if (curso) parametros.set("curso", curso);

    return pedirAlBackend(`/usuarios?${parametros}`);
}


/* --- GET /api/usuarios/:id → usuario con sus 6 atributos, rol y estado --- */
export async function obtenerUsuario(id) {
    return pedirAlBackend(`/usuarios/${encodeURIComponent(id)}`);
}


/* --- GET /api/usuarios/:id/historial → { usuario, resumen, prestamos, sanciones } --- */
export async function obtenerHistorialUsuario(id) {
    return pedirAlBackend(`/usuarios/${encodeURIComponent(id)}/historial`);
}


/* --- POST /api/usuarios → { mensaje, payload: usuario creado } --- */
export async function registrarUsuario(datos) {
    return llamarAlBackend("/usuarios", {
        method: "POST",
        body: JSON.stringify(datos)
    });
}


/* --- PUT /api/usuarios/:id → { mensaje, payload: usuario actualizado } --- */
export async function modificarUsuario(id, datos) {
    return llamarAlBackend(`/usuarios/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(datos)
    });
}


/* --- PATCH /api/usuarios/:id/estado → { mensaje, payload } ('suspendido' | 'habilitado' | 'baja') --- */
export async function cambiarEstadoUsuario(id, estado, motivo = "") {
    return llamarAlBackend(`/usuarios/${encodeURIComponent(id)}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ estado, motivo })
    });
}


/* --- DELETE /api/usuarios/:id → { mensaje, payload } (baja lógica) --- */
export async function darDeBajaUsuario(id) {
    return llamarAlBackend(`/usuarios/${encodeURIComponent(id)}`, {
        method: "DELETE"
    });
}


/* --- GET /api/cursos → [ { id, nombre, alumnos } ] --- */
export async function obtenerCursos() {
    return pedirAlBackend("/cursos");
}
