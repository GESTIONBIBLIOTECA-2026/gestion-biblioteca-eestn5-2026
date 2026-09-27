/* ==========================================================================
   php.js - Conexión con la base de datos a través de PHP
   Node NO habla directo con MySQL: le manda la consulta a los archivos
   de backend/php/ (que usan PDO) y recibe el resultado en JSON.

   [ Model (Node) ] ──fetch──► [ PHP (localhost:8000) ] ──PDO──► [ MySQL Aiven ]
   ========================================================================== */

import { createHash } from "crypto";
import { PHP_API_URL, PHP_API_KEY } from "../config/config.js";

// La clave viaja como hash SHA-256 (solo letras y números), así funciona
// aunque tenga ñ, acentos o símbolos. PHP hace el mismo cálculo y compara.
const CLAVE_HASH = createHash("sha256").update(PHP_API_KEY || "").digest("hex");


/**
 * Envía una petición a un archivo PHP y devuelve el "payload" de la respuesta.
 * @param {string} archivo - Ej: "usuarios.php"
 * @param {object} datos   - Ej: { accion: "buscarPorDni", dni: "30111222" }
 */
export const consultarPHP = async (archivo, datos = {}) => {

    let response;

    try {
        response = await fetch(`${PHP_API_URL}/${archivo}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Api-Key": CLAVE_HASH               // clave compartida con PHP
            },
            body: JSON.stringify(datos),
            signal: AbortSignal.timeout(10000)      // máximo 10 segundos
        });
    } catch (error) {
        // Error de red: el servidor PHP está apagado o la URL está mal
        throw new Error(`No se pudo conectar con PHP en ${PHP_API_URL} (¿está corriendo "npm run php"?)`);
    }

    const data = await response.json().catch(() => ({}));

    // fetch NO entra al catch ante un 401 / 500: hay que revisar response.ok
    if (!response.ok) {
        throw new Error(data.error || `PHP respondió con error ${response.status}`);
    }

    return data.payload;
};


/**
 * Chequeo al arrancar: avisa por consola si PHP y la base responden.
 */
export const comprobarConexionPHP = async () => {

    try {
        const response = await fetch(`${PHP_API_URL}/estado.php`, {
            headers: { "X-Api-Key": CLAVE_HASH },
            signal: AbortSignal.timeout(10000)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || `Error ${response.status}`);
        }

        console.log(`✅ PHP ${data.payload.php} conectado a la base "${data.payload.base}"`);

    } catch (error) {
        const motivo = error.name === "TypeError"
            ? `no responde en ${PHP_API_URL} (¿corriste "npm run php" en otra terminal?)`
            : error.message;

        console.warn(`⚠️  PHP / base de datos: ${motivo}`);
    }
};
