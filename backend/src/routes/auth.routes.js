/* ==========================================================================
   auth.routes.js - Rutas de autenticación
   Montadas en index.js bajo el prefijo /api/auth
   ========================================================================== */

import express from "express";
import { postLogin, getPerfil } from "../controllers/auth.controllers.js";
import { verificarToken } from "../middlewares/auth.middleware.js";
import { validarLogin } from "../middlewares/validaciones.middleware.js";
import { limitarIntentos } from "../middlewares/limiteIntentos.middleware.js";

const router = express.Router();

// POST /api/auth/login  → límite de intentos → validar body → controlador
router.post("/login", limitarIntentos, validarLogin, postLogin);

// GET /api/auth/perfil  → verificar token → controlador
router.get("/perfil", verificarToken, getPerfil);

export default router;
