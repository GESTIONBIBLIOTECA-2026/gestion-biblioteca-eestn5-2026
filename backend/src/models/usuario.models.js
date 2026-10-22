/* ==========================================================================
   usuario.models.js - Modelo de Usuarios (acceso a datos) · Grupo 5
   Solo consulta la base con comodines "?" y devuelve datos puros.
   ========================================================================== */

import connection from "../database/db.js";
import { CONDICION, COLUMNAS, DESDE } from "./usuario.sql.js";


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

// Ficha corta por DNI para que el Grupo 4 valide al usuario antes de prestar
export const getEstadoPorDni = async (dni) => {
    const sql = `SELECT u.id, u.nombre_completo, c.nombre AS curso, r.nombre AS rol, ${CONDICION} AS condicion ${DESDE} WHERE u.dni = ?`;
    const [rows] = await connection.query(sql, [dni]);
    return rows[0];
};

// Otros usuarios que ya usan ese DNI o ese correo
export const buscarRepetidos = async (dni, correo, idPropio = 0) => {
    const sql = "SELECT dni, correo, nombre_completo FROM usuarios WHERE (dni = ? OR correo = ?) AND id <> ?";
    const [rows] = await connection.query(sql, [dni, correo, idPropio]);
    return rows;
};

// ID del curso por nombre. Si no existe, lo crea (INSERT IGNORE no falla si ya está).
const getIdCurso = async (nombre) => {
    if (!nombre) return null;
    await connection.query("INSERT IGNORE INTO cursos (nombre) VALUES (?)", [nombre]);
    const [rows] = await connection.query("SELECT id FROM cursos WHERE nombre = ?", [nombre]);
    return rows[0].id;
};

export const crearUsuario = async ({ dni, nombre_completo, rol, curso, correo, telefono, direccion, password_hash }) => {
    const sql = `INSERT INTO usuarios (dni, nombre_completo, curso_id, correo, telefono, direccion, password_hash, rol_id)
                 VALUES (?, ?, ?, ?, ?, ?, ?, (SELECT id FROM roles WHERE nombre = ?))`;
    const [resultado] = await connection.query(sql,
        [dni, nombre_completo, await getIdCurso(curso), correo, telefono, direccion, password_hash, rol]);
    return resultado.insertId;
};

// La contraseña solo cambia si viene password_hash (COALESCE deja la que estaba)
export const actualizarUsuario = async (id, { dni, nombre_completo, rol, curso, correo, telefono, direccion, password_hash }) => {
    const sql = `UPDATE usuarios SET dni = ?, nombre_completo = ?, curso_id = ?, correo = ?, telefono = ?, direccion = ?,
                 rol_id = (SELECT id FROM roles WHERE nombre = ?), password_hash = COALESCE(?, password_hash)
                 WHERE id = ?`;
    const [resultado] = await connection.query(sql,
        [dni, nombre_completo, await getIdCurso(curso), correo, telefono, direccion, rol, password_hash, id]);
    return resultado.affectedRows;
};

