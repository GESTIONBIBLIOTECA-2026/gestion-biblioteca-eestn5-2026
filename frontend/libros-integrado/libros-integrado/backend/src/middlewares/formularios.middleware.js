/* ==========================================================================
   formularios.middleware.js - Validación de los formularios
   Alta / modificación de usuarios, "Mi perfil" y cambio de contraseña.
   Si hay errores responde 400 con { error, campos: { campo: "mensaje" } }.
   ========================================================================== */

import { ROLES } from "../config/config.js";
import { limpiar, limpiarDni, DNI, rechazar, esEntero } from "./validaciones.middleware.js";

const NOMBRE = /^\p{L}[\p{L} .'-]*$/u;
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO = /^[\d\s()+-]{6,30}$/;

const claveInvalida = (clave) => clave.length < 6 || clave.length > 72;

// Nombre, correo, teléfono y dirección (los comparten el ABM y "Mi perfil")
function revisarContacto(datos, campos) {
    if (datos.nombre_completo.length < 3 || datos.nombre_completo.length > 120 || !NOMBRE.test(datos.nombre_completo)) {
        campos.nombre_completo = "Escribí el nombre y apellido (solo letras).";
    }
    if (!CORREO.test(datos.correo) || datos.correo.length > 120) campos.correo = "El correo electrónico no es válido.";
    if (!TELEFONO.test(datos.telefono)) campos.telefono = "Escribí un teléfono válido (ej: 11 4444-5678).";
    if (datos.direccion.length < 3 || datos.direccion.length > 150) campos.direccion = "Escribí la dirección (hasta 150 caracteres).";
}


/* --- Alta y modificación: { nombre_completo, dni, rol, curso, correo, telefono, direccion, clave } --- */
export const validarUsuario = (req, res, next) => {
    const body = req.body ?? {};
    const datos = {
        nombre_completo: limpiar(body.nombre_completo),
        dni: limpiarDni(body.dni),
        rol: limpiar(body.rol).toLowerCase(),
        curso: limpiar(body.curso),
        correo: limpiar(body.correo).toLowerCase(),
        telefono: limpiar(body.telefono),
        direccion: limpiar(body.direccion),
        clave: String(body.clave ?? "")
    };
    const campos = {};

    revisarContacto(datos, campos);

    if (!DNI.test(datos.dni)) campos.dni = "El DNI tiene que tener entre 7 y 8 números.";
    if (!ROLES.includes(datos.rol)) campos.rol = "Elegí el tipo de usuario.";

    // El curso es obligatorio solo para alumnos
    if (datos.rol !== "alumno") datos.curso = null;
    else if (!datos.curso || datos.curso.length > 30) campos.curso = "El curso es obligatorio para los alumnos.";

    // Contraseña: obligatoria en el alta; en la modificación solo si se quiere cambiar
    if ((req.method === "POST" || datos.clave) && claveInvalida(datos.clave)) {
        campos.clave = "La contraseña tiene que tener entre 6 y 72 caracteres.";
    }

    if (Object.keys(campos).length > 0) return rechazar(res, campos);

    req.body = datos;
    next();
};


/* --- Mi perfil: { nombre_completo, correo, telefono, direccion } --- */
export const validarPerfil = (req, res, next) => {
    const body = req.body ?? {};
    const datos = {
        nombre_completo: limpiar(body.nombre_completo),
        correo: limpiar(body.correo).toLowerCase(),
        telefono: limpiar(body.telefono),
        direccion: limpiar(body.direccion)
    };
    const campos = {};

    revisarContacto(datos, campos);

    if (Object.keys(campos).length > 0) return rechazar(res, campos);

    req.body = datos;
    next();
};


/* --- Cambio de contraseña: { clave_actual, clave_nueva, confirmacion } --- */
export const validarClave = (req, res, next) => {
    const { clave_actual = "", clave_nueva = "", confirmacion = "" } = req.body ?? {};
    const campos = {};

    if (!clave_actual) campos.clave_actual = "Escribí tu contraseña actual.";

    if (claveInvalida(clave_nueva)) campos.clave_nueva = "La contraseña tiene que tener entre 6 y 72 caracteres.";
    else if (clave_nueva === clave_actual) campos.clave_nueva = "La contraseña nueva tiene que ser distinta de la actual.";

    if (confirmacion !== clave_nueva) campos.confirmacion = "Las contraseñas no coinciden.";

    if (Object.keys(campos).length > 0) return rechazar(res, campos);

    next();
};


/* --- Alta y modificación de libros: { titulo, autor, editorial, isbn, categoria_id, anio_publicacion, portada_url, cantidad } ---
   La cantidad de ejemplares se pide solo en el alta (después se maneja desde el stock). */
export const validarLibro = (req, res, next) => {
    const body = req.body ?? {};
    const datos = {
        titulo: limpiar(body.titulo),
        autor: limpiar(body.autor),
        editorial: limpiar(body.editorial),
        isbn: limpiar(body.isbn),
        categoria_id: Number(body.categoria_id),
        anio_publicacion: limpiar(body.anio_publicacion),
        portada_url: limpiar(body.portada_url),
        cantidad: Number(body.cantidad)
    };
    const anioMaximo = new Date().getFullYear() + 1;
    const campos = {};

    if (datos.titulo.length < 1 || datos.titulo.length > 200) campos.titulo = "Escribí el título (hasta 200 caracteres).";
    if (datos.autor.length < 2 || datos.autor.length > 120) campos.autor = "Escribí el autor (hasta 120 caracteres).";
    if (datos.editorial.length > 100) campos.editorial = "La editorial puede tener hasta 100 caracteres.";
    if (datos.isbn.length > 20) campos.isbn = "El ISBN puede tener hasta 20 caracteres.";
    if (!esEntero(datos.categoria_id) || datos.categoria_id < 1) campos.categoria_id = "Elegí una categoría.";
    if (datos.portada_url.length > 255) campos.portada_url = "La portada puede tener hasta 255 caracteres.";

    // El año es opcional
    if (datos.anio_publicacion) {
        const anio = Number(datos.anio_publicacion);
        if (!esEntero(anio) || anio < 1000 || anio > anioMaximo) campos.anio_publicacion = `El año tiene que estar entre 1000 y ${anioMaximo}.`;
        datos.anio_publicacion = anio;
    }

    // Los ejemplares se cargan solo en el alta
    if (req.method === "POST" && (!esEntero(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > 500)) {
        campos.cantidad = "La cantidad tiene que ser un número entero entre 1 y 500.";
    }

    if (Object.keys(campos).length > 0) return rechazar(res, campos);

    // Lo opcional vacío se guarda como NULL
    req.body = {
        ...datos,
        editorial: datos.editorial || null,
        isbn: datos.isbn || null,
        anio_publicacion: datos.anio_publicacion || null,
        portada_url: datos.portada_url || null
    };
    next();
};
