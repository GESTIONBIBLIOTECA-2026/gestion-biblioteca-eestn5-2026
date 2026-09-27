/* ==========================================================================
   usuario.models.js - Modelo de Usuarios (Acceso a Datos)
   No conoce Express (no usa req ni res): solo pide datos y los devuelve.
   La consulta SQL real está en backend/php/usuarios.php
   ========================================================================== */

import { consultarPHP } from "../database/php.js";


/**
 * Busca un usuario por DNI.
 * Devuelve { id, nombre_completo, password_hash, estado, rol } o null si no existe.
 */
export const getUsuarioPorDni = async (dni) => {
    return await consultarPHP("usuarios.php", { accion: "buscarPorDni", dni });
};
