/* ==========================================================================
   curso.models.js - Modelo de Cursos (Acceso a Datos) · Grupo 5
   Tabla "cursos" (ej: '7mo 5ta'). Los alumnos tienen curso;
   docentes y administradores no (curso_id = NULL).
   ========================================================================== */

import connection from "../database/db.js";


/**
 * Todos los cursos ordenados por nombre, con cuántos alumnos activos tiene cada uno.
 * Devuelve [ { id, nombre, alumnos } ]
 */
export const getCursos = async () => {

    const sql = `SELECT c.id, c.nombre, COUNT(u.id) AS alumnos
                 FROM cursos c
                 LEFT JOIN usuarios u ON u.curso_id = c.id AND u.estado <> 'baja'
                 GROUP BY c.id, c.nombre
                 ORDER BY c.nombre`;

    const [filas] = await connection.query(sql);

    return filas;
};


/**
 * Devuelve el ID del curso con ese nombre. Si todavía no existe, lo crea.
 * Recibe la conexión de la transacción del alta/modificación del usuario,
 * así el curso nuevo y el usuario se guardan juntos (o no se guarda nada).
 */
export const obtenerOCrearCurso = async (conexion, nombre) => {

    // 1. ¿Ya existe? La comparación no distingue mayúsculas: "7MO 5TA" es el mismo curso que "7mo 5ta".
    const [existentes] = await conexion.query("SELECT id FROM cursos WHERE nombre = ? LIMIT 1", [nombre]);

    if (existentes[0]) return existentes[0].id;

    // 2. No existe: se crea. INSERT IGNORE no falla si otro usuario lo creó justo al mismo tiempo.
    await conexion.query("INSERT IGNORE INTO cursos (nombre) VALUES (?)", [nombre]);

    // 3. FOR SHARE lee la última versión guardada (también lo ve si lo creó otra petición)
    const [filas] = await conexion.query("SELECT id FROM cursos WHERE nombre = ? LIMIT 1 FOR SHARE", [nombre]);

    return filas[0].id;
};
