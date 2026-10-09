import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import connection from "../src/database/db.js";

const rutaEsquema = fileURLToPath(new URL("./schema.sql", import.meta.url));

try {
    const esquema = await readFile(rutaEsquema, "utf8");
    const sentencias = esquema
        .replace(/^\s*--.*$/gm, "")
        .split(";")
        .map((sentencia) => sentencia.trim())
        .filter(Boolean);

    for (const sentencia of sentencias) {
        await connection.query(sentencia);
    }

    console.log(`Base "${process.env.DB_NAME || "defaultdb"}" inicializada correctamente (${sentencias.length} sentencias).`);
} finally {
    await connection.end();
}
