/* ==========================================================================
   usuarios.routes.js - Rutas de usuarios
   Montadas en index.js bajo el prefijo /api/usuarios
   ========================================================================== */

import express from "express";
import { getUsuarioPorDni } from "../controllers/usuarios.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";
import { validarDniParam } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

// GET /api/usuarios/dni/:dni  → token → admin → validar DNI → controlador
router.get("/dni/:dni", verificarToken, soloAdministrador, validarDniParam, getUsuarioPorDni);

export default router;
