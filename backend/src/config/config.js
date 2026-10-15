/* ==========================================================================
   config.js - Ajustes y lectura de variables de entorno (.env)
   ========================================================================== */

import dotenv from "dotenv";

// 1. Carga las variables del archivo .env en process.env
dotenv.config({ quiet: true });

// 2. Servidor y sesión
export const PORT = process.env.PORT || 3000;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_DURACION = "8h";

// 3. Base de datos (Aiven exige SSL: solo se apaga con DB_SSL=false para un MySQL local)
export const DB = {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "defaultdb",
    ssl: process.env.DB_SSL !== "false",
    caPath: process.env.DB_CA_PATH || "",
    zonaHoraria: process.env.DB_ZONA_HORARIA || "-03:00"
};

// 4. Reglas del negocio
export const ROLES = ["alumno", "docente", "administrador"];
export const ESTADOS = ["habilitado", "suspendido", "baja"];
export const FILTROS = ["todos", "alumnos", "docentes", "administradores", "morosos", "suspendidos", "bajas"];
export const USUARIOS_POR_PAGINA = 10;
