/* ==========================================================================
   cursos.routes.js - Rutas de cursos · Grupo 5
   Montadas en index.js bajo el prefijo /api/cursos
   ========================================================================== */

import express from "express";
import { getListaCursos } from "../controllers/cursos.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/cursos  → token → admin → controlador
router.get("/", verificarToken, soloAdministrador, getListaCursos);

export default router;
