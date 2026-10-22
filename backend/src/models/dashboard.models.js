/* ==========================================================================
   dashboard.models.js - Métricas del Inicio del administrador · Grupo 5
   Solo lectura: cuenta filas de libros (G6), pedidos (G4) y usuarios (G5).
   ========================================================================== */

import connection from "../database/db.js";
import { ATRASO } from "./usuario.sql.js";

// Los 3 totales en UNA consulta (cada subconsulta devuelve un número)
export const getMetricas = async () => {
    const sql = `SELECT
            (SELECT COUNT(*) FROM libros WHERE activo = TRUE) AS libros_total,
            (SELECT COUNT(*) FROM pedidos WHERE estado IN ('prestado', 'vencido')) AS prestamos_activos,
            (SELECT COUNT(*) FROM usuarios u WHERE u.estado <> 'baja' AND ${ATRASO}) AS alumnos_morosos`;
    const [rows] = await connection.query(sql);
    return rows[0];
};
