/* ==========================================================================
   prestamos.routes.js - Rutas de préstamos
   Montadas en index.js bajo el prefijo /api/prestamos
   ========================================================================== */

import express from "express";
import { getPrestamos, postPrestamo } from "../controllers/prestamos.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";
import { validarLimite, validarPrestamo } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

// Todas las rutas de préstamos piden sesión de administrador
router.use(verificarToken, soloAdministrador);

// GET /api/prestamos?limite=5  → últimos préstamos
router.get("/", validarLimite, getPrestamos);

// POST /api/prestamos  → registrar un préstamo nuevo
router.post("/", validarPrestamo, postPrestamo);

export default router;
