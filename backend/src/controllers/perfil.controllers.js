/* ==========================================================================
   perfil.controllers.js - Controlador de "Mi perfil" (pantalla Configuración)
   El administrador logueado consulta y cambia SUS datos y su contraseña.
   Siempre se usa req.usuario.id (sale del token): nunca un ID que mande el navegador.
   ========================================================================== */

import bcrypt from "bcryptjs";
import {
    getUsuarioPorId, getHashClavePorId, actualizarPerfil, actualizarClave, ErrorUsuario
} from "../models/usuario.models.js";


// Regla de negocio → su código y mensaje. Cualquier otra cosa → 500.
function responderError(res, error, mensaje500) {

    if (error instanceof ErrorUsuario) {
        return res.status(error.status).json({
            error: error.message,
            ...(error.campos && { campos: error.campos })
        });
    }

    console.error(`${mensaje500}:`, error.message);
    return res.status(500).json({ error: mensaje500 });
}


/* --------------------------------------------------------------------------
   GET /api/perfil   (requiere token)
   Datos completos del usuario logueado (sin la contraseña).
   -------------------------------------------------------------------------- */
export const getMiPerfil = async (req, res) => {
    try {
        const usuario = await getUsuarioPorId(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({ error: "No se encontró tu usuario." });
        }

        return res.json({ payload: usuario });

    } catch (error) {
        return responderError(res, error, "No se pudieron leer tus datos de la base de datos.");
    }
};


/* --------------------------------------------------------------------------
   PUT /api/perfil
   Body: { nombre_completo, correo, telefono, direccion }
   -------------------------------------------------------------------------- */
export const putMiPerfil = async (req, res) => {
    try {
        const usuario = await actualizarPerfil(req.usuario.id, req.datosPerfil);

        return res.json({
            mensaje: "Se guardaron los cambios de tu perfil.",
            payload: usuario
        });

    } catch (error) {
        return responderError(res, error, "No se pudieron guardar tus datos.");
    }
};


/* --------------------------------------------------------------------------
   PUT /api/perfil/clave
   Body: { clave_actual, clave_nueva, confirmacion }
   -------------------------------------------------------------------------- */
export const putMiClave = async (req, res) => {
    try {
        const { claveActual, claveNueva } = req.cambioClave;

        // 1. Comprobar la contraseña actual contra el hash guardado
        const hashActual = await getHashClavePorId(req.usuario.id);
        const claveOk = hashActual && await bcrypt.compare(claveActual, hashActual);

        if (!claveOk) {
            return res.status(400).json({
                error: "La contraseña actual no es correcta.",
                campos: { clave_actual: "La contraseña actual no es correcta." }
            });
        }

        // 2. Guardar la nueva como hash bcrypt (nunca en texto)
        await actualizarClave(req.usuario.id, await bcrypt.hash(claveNueva, 10));

        return res.json({ mensaje: "Tu contraseña se cambió correctamente." });

    } catch (error) {
        return responderError(res, error, "No se pudo cambiar la contraseña.");
    }
};
