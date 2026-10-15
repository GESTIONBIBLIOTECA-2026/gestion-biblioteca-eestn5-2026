/* ==========================================================================
   prestamos.routes.js - Rutas de préstamos (solo lectura: el Inicio muestra los últimos)
   Registrar préstamos y devoluciones es del Grupo 4.
   Montadas en index.js bajo el prefijo /api/prestamos
   ========================================================================== */

import express from "express";
import { getPrestamos } from "../controllers/prestamos.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";
import { validarLimite } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

// Todas las rutas de préstamos piden sesión de administrador
router.use(verificarToken, soloAdministrador);

// GET /api/prestamos?limite=5  → últimos préstamos
router.get("/", validarLimite, getPrestamos);

export default router;
