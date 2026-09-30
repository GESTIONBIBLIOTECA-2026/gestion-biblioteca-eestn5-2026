/* ==========================================================================
   db.js - Conexión a MySQL (Aiven) con mysql2
   Es la ÚNICA parte del proyecto que habla directo con la base de datos.
   Los Models importan "connection" y hacen connection.query(sql, [valores]).

   [ Model (Node) ] ──mysql2 (pool + SSL)──► [ MySQL Aiven ]
   ========================================================================== */

import mysql from "mysql2/promise";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
    DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
    DB_SSL, DB_CA_PATH, DB_ZONA_HORARIA
} from "../config/config.js";

// Carpeta backend/ (para encontrar el ca.pem)
const CARPETA_BACKEND = fileURLToPath(new URL("../../", import.meta.url));


/* --------------------------------------------------------------------------
   SSL: Aiven exige conexión cifrada.
   - Con ca.pem: se valida que el servidor sea de verdad el de Aiven.
   - Sin ca.pem: la conexión va cifrada igual, pero sin validar el certificado.
   -------------------------------------------------------------------------- */
function opcionesSSL() {

    if (!DB_SSL) return undefined;

    if (DB_CA_PATH) {
        const rutaCa = path.resolve(CARPETA_BACKEND, DB_CA_PATH);

        if (existsSync(rutaCa)) {
            return { ca: readFileSync(rutaCa, "utf8") };
        }

        console.warn(`⚠️  No encontré el certificado ${rutaCa}: se conecta con SSL pero sin validar el servidor.`);
    }

    return { rejectUnauthorized: false };
}


/* --------------------------------------------------------------------------
   Pool de conexiones: una "flota" de conexiones abiertas y reutilizables
   -------------------------------------------------------------------------- */
const connection = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    ssl: opcionesSSL(),

    // Si la piscina está llena, las nuevas peticiones esperan a que se libere una conexión
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    // Máximo 10 segundos para conectarse (Aiven a veces tarda si el servicio estaba dormido)
    connectTimeout: 10000,

    // Las fechas llegan como texto "2026-09-30" / "2026-09-30 18:40:00",
    // así no se corren de día por la diferencia horaria al pasarlas a JSON
    dateStrings: true,

    // Los SUM() y DECIMAL llegan como número y no como texto
    decimalNumbers: true
});


// Cada conexión nueva arranca con la hora de Argentina (NOW(), CURRENT_DATE)
connection.pool.on("connection", (conexionNueva) => {
    conexionNueva.query("SET time_zone = ?", [DB_ZONA_HORARIA], (error) => {
        if (error) console.warn(`⚠️  No se pudo poner la zona horaria ${DB_ZONA_HORARIA}: ${error.message}`);
    });
});

export default connection;


/* --------------------------------------------------------------------------
   Chequeo al arrancar: avisa por consola si la base responde
   -------------------------------------------------------------------------- */
const PISTAS = {
    ER_ACCESS_DENIED_ERROR: "revisá DB_USER y DB_PASSWORD en backend/.env",
    ER_BAD_DB_ERROR: "revisá DB_NAME en backend/.env",
    ENOTFOUND: "revisá DB_HOST en backend/.env",
    ECONNREFUSED: "revisá DB_HOST y DB_PORT en backend/.env",
    ETIMEDOUT: "revisá DB_HOST / DB_PORT y que el servicio de Aiven esté en Running",
    HANDSHAKE_SSL_ERROR: "revisá el ca.pem de Aiven (o DB_SSL en backend/.env)"
};

export const comprobarConexion = async () => {

    try {
        const [filas] = await connection.query("SELECT DATABASE() AS base, VERSION() AS version");
        console.log(`✅ MySQL ${filas[0].version} conectado a la base "${filas[0].base}"`);

    } catch (error) {
        const pista = PISTAS[error.code] || (/ssl|certificate/i.test(error.message) ? PISTAS.HANDSHAKE_SSL_ERROR : "");
        console.warn(`⚠️  Base de datos: ${error.message}${pista ? `  →  ${pista}` : ""}`);
    }
};
