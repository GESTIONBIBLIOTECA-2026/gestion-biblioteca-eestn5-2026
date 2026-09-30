/* ==========================================================================
   config.js - Lectura de variables de entorno (.env)
   Todas las demás capas importan la configuración desde acá.
   ========================================================================== */

import dotenv from "dotenv";
import { fileURLToPath } from "url";

// Carga backend/.env aunque el servidor se ejecute desde otra carpeta
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)), quiet: true });

// Puerto del servidor Express
export const PORT = process.env.PORT || 3000;

// Clave para firmar los tokens de sesión (acepta el nombre viejo SESSION_SECRET)
export const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
export const JWT_DURACION = "8h";

// --- Base de datos MySQL (Aiven) ---
export const DB_HOST     = process.env.DB_HOST || "localhost";
export const DB_PORT     = Number(process.env.DB_PORT) || 3306;
export const DB_USER     = process.env.DB_USER || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "";
export const DB_NAME     = process.env.DB_NAME || "defaultdb";

// SSL: Aiven lo exige. Solo se apaga con DB_SSL=false (sirve para un MySQL local)
const SSL_APAGADO = ["false", "0", "no", "off", "disabled"];
export const DB_SSL = !SSL_APAGADO.includes(String(process.env.DB_SSL ?? "true").trim().toLowerCase());

// Certificado CA de Aiven (ruta relativa a la carpeta backend/)
export const DB_CA_PATH = process.env.DB_CA_PATH || "";

// Zona horaria de la sesión MySQL: así NOW() y CURRENT_DATE dan la hora de Argentina
export const DB_ZONA_HORARIA = process.env.DB_ZONA_HORARIA || "-03:00";

// Roles (tabla roles) que pueden entrar al panel de administración
export const ROLES_PANEL = ["administrador"];

// Días que dura un préstamo registrado en el mostrador
export const DIAS_PRESTAMO = Number(process.env.DIAS_PRESTAMO) || 7;
