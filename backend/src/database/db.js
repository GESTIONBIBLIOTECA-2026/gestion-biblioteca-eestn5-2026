/* ==========================================================================
   db.js - Pool de conexiones a MySQL (Aiven) con mysql2
   Los Models importan "connection" y hacen connection.query(sql, [valores])
   ========================================================================== */

import mysql from "mysql2/promise";
import { readFileSync, existsSync } from "fs";
import { DB } from "../config/config.js";

// 1. SSL: con el ca.pem de Aiven se valida el servidor; sin él, va cifrado igual
const ssl = !DB.ssl ? undefined
    : existsSync(DB.caPath) ? { ca: readFileSync(DB.caPath, "utf8") }
    : { rejectUnauthorized: false };

// 2. Pool: conexiones abiertas y reutilizables (los datos salen SOLO del .env)
const connection = mysql.createPool({
    host: DB.host,
    port: DB.port,
    user: DB.user,
    password: DB.password,
    database: DB.database,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,      // fechas como texto ("2026-10-15"): no se corren de día
    decimalNumbers: true    // SUM() y COUNT() llegan como número
});

// 3. Cada conexión nueva usa la hora de Argentina (NOW(), CURRENT_DATE)
connection.pool.on("connection", (conexion) => {
    conexion.query("SET time_zone = ?", [DB.zonaHoraria]);
});

// 4. Transacción: varias consultas que se guardan TODAS juntas o NINGUNA (préstamos, stock).
//    El trabajo recibe "conexion" y la usa en vez del pool, así todo va por la misma conexión.
export const conTransaccion = async (trabajo) => {
    const conexion = await connection.getConnection();
    try {
        await conexion.beginTransaction();
        const resultado = await trabajo(conexion);
        await conexion.commit();
        return resultado;
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
};

export default connection;
