/* ==========================================================================
   usuario.models.js - Modelo de Usuarios (Acceso a Datos)
   No conoce Express (no usa req ni res): solo consulta la base y devuelve datos.
   ========================================================================== */

import connection from "../database/db.js";


/**
 * Busca un usuario por DNI para el login (incluye el hash de la contraseña).
 * Devuelve { id, nombre_completo, password_hash, estado, rol } o null si no existe.
 */
export const getUsuarioPorDni = async (dni) => {

    // Comodín "?" → el DNI se trata siempre como dato, nunca como SQL
    const sql = `SELECT u.id, u.nombre_completo, u.password_hash, u.estado, r.nombre AS rol
                 FROM usuarios u
                 JOIN roles r ON r.id = u.rol_id
                 WHERE u.dni = ?
                 LIMIT 1`;

    const [filas] = await connection.query(sql, [dni]);

    return filas[0] ?? null;
};


/**
 * Datos públicos de un usuario (sin contraseña) + si puede llevarse libros.
 * Devuelve null si el DNI no existe.
 */
export const getFichaUsuarioPorDni = async (dni) => {

    const sql = `SELECT u.id, u.dni, u.nombre_completo, c.nombre AS curso, u.estado, r.nombre AS rol,
                        (SELECT COUNT(*) FROM sanciones s
                          WHERE s.usuario_id = u.id AND s.activa = TRUE
                            AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)) AS sanciones_activas,
                        (SELECT COUNT(*) FROM pedidos p
                          WHERE p.usuario_id = u.id
                            AND (p.estado = 'vencido'
                                 OR (p.estado = 'prestado' AND p.fecha_devolucion_estimada < CURRENT_DATE))) AS prestamos_atrasados
                 FROM usuarios u
                 JOIN roles r ON r.id = u.rol_id
                 LEFT JOIN cursos c ON c.id = u.curso_id
                 WHERE u.dni = ?
                 LIMIT 1`;

    const [filas] = await connection.query(sql, [dni]);

    return filas[0] ?? null;
};
