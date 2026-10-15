/* ==========================================================================
   perfil.routes.js - Rutas de "Mi perfil" (pantalla Configuración)
   Montadas en index.js bajo el prefijo /api/perfil
   ========================================================================== */

import express from "express";
import { getMiPerfil, putMiPerfil, putMiClave } from "../controllers/perfil.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";
import { validarPerfil, validarCambioClave } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

// Todas piden sesión de administrador
router.use(verificarToken, soloAdministrador);

// GET  /api/perfil        → mis datos
router.get("/", getMiPerfil);

// PUT  /api/perfil        → cambiar nombre, correo, teléfono y dirección
router.put("/", validarPerfil, putMiPerfil);

// PUT  /api/perfil/clave  → cambiar la contraseña (pide la actual)
router.put("/clave", validarCambioClave, putMiClave);

export default router;
