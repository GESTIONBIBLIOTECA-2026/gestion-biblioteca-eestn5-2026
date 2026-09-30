/* ==========================================================================
   libros.routes.js - Rutas de libros
   Montadas en index.js bajo el prefijo /api/libros
   ========================================================================== */

import express from "express";
import { getLibro } from "../controllers/libros.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";
import { validarIdParam } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

// GET /api/libros/:id  → token → admin → validar ID → controlador
router.get("/:id", verificarToken, soloAdministrador, validarIdParam, getLibro);

export default router;
