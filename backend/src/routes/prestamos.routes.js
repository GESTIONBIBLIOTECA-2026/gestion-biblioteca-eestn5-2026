/* ==========================================================================
   prestamos.routes.js - Rutas de préstamos  (/api/prestamos) · solo lectura
   ========================================================================== */

import express from "express";
import { getPrestamos } from "../controllers/prestamos.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";
import { validarLimite } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

router.get("/", verificarAdmin, validarLimite, getPrestamos);   // GET /api/prestamos?limite=5

export default router;
