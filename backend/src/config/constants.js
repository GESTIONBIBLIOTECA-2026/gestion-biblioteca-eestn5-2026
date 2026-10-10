/* ==========================================================================
   constants.js - Constantes del Dominio y Reglas del Negocio (Biblioteca)
   ========================================================================== */

// Primero se carga el .env (así process.env ya tiene los valores)
import "./env.js";

// Roles (tabla roles) que pueden entrar al panel de administración
export const ROLES_PANEL = ["administrador"];

// Días que dura un préstamo registrado en el mostrador
export const DIAS_PRESTAMO = Number(process.env.DIAS_PRESTAMO) || 7;

// --- Reglas de Dominio y Constantes de Usuarios ---
export const ROLES_USUARIOS = ["alumno", "docente", "administrador"];
export const ESTADOS_USUARIOS = ["habilitado", "suspendido", "baja"];
export const FILTROS_USUARIOS = ["todos", "alumnos", "docentes", "administradores", "morosos", "suspendidos", "bajas"];
export const USUARIOS_POR_PAGINA = 10;
