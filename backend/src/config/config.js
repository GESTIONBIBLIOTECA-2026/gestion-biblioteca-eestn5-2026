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

// Capa PHP que se conecta a la base de datos
export const PHP_API_URL = process.env.PHP_API_URL || "http://localhost:8000";
export const PHP_API_KEY = process.env.PHP_API_KEY;

// Roles (tabla roles) que pueden entrar al panel de administración
export const ROLES_PANEL = ["administrador"];
