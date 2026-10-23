/* ==========================================================================
   formularios.middleware.js - Validación de los formularios
   "Mi perfil" y cambio de contraseña.
   Si hay errores responde 400 con { error, campos: { campo: "mensaje" } }.
   ========================================================================== */

import { limpiar, rechazar, esNombreValido, esCorreoValido, esTelefonoValido } from "./predicados.js";

const claveInvalida = (clave) => clave.length < 6 || clave.length > 72;

// Nombre, correo, teléfono y dirección ("Mi perfil")
function revisarContacto(datos, campos) {
    if (datos.nombre_completo.length < 3 || datos.nombre_completo.length > 120 || !esNombreValido(datos.nombre_completo)) {
        campos.nombre_completo = "Escribí el nombre y apellido (solo letras).";
    }
    if (!esCorreoValido(datos.correo) || datos.correo.length > 120) campos.correo = "El correo electrónico no es válido.";
    if (!esTelefonoValido(datos.telefono)) campos.telefono = "Escribí un teléfono válido (ej: 11 4444-5678).";
    if (datos.direccion.length < 3 || datos.direccion.length > 150) campos.direccion = "Escribí la dirección (hasta 150 caracteres).";
}


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
