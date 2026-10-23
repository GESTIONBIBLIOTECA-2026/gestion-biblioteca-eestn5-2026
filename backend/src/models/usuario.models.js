/* ==========================================================================
   usuario.models.js - Modelo de Usuarios (acceso a datos) · Grupo 5
   Solo consulta la base con comodines "?" y devuelve datos puros.
   ========================================================================== */

import connection from "../database/db.js";
import { COLUMNAS, DESDE } from "./usuario.sql.js";


// Usuario para el login (con el hash de la contraseña)
export const getUsuarioLogin = async (dni) => {
    const sql = `SELECT u.id, u.nombre_completo, u.password_hash, u.estado, r.nombre AS rol
                 FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.dni = ?`;
    const [rows] = await connection.query(sql, [dni]);
    return rows[0];
};

// Rol y estado ACTUALES de quien tiene la sesión (lo usa el middleware)
export const getSesion = async (id) => {
    const sql = `SELECT u.id, u.nombre_completo, u.estado, r.nombre AS rol
                 FROM usuarios u JOIN roles r ON r.id = u.rol_id WHERE u.id = ?`;
    const [rows] = await connection.query(sql, [id]);
    return rows[0];
};

export const getUsuarioPorId = async (id) => {
    const [rows] = await connection.query(`SELECT ${COLUMNAS} ${DESDE} WHERE u.id = ?`, [id]);
    return rows[0];
};

// Otro usuario que ya usa ese correo (Mi perfil)
export const buscarCorreoRepetido = async (correo, idPropio) => {
    const sql = "SELECT nombre_completo FROM usuarios WHERE correo = ? AND id <> ?";
    const [rows] = await connection.query(sql, [correo, idPropio]);
    return rows;
};
