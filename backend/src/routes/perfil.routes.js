/* ==========================================================================
   perfil.routes.js - Rutas de "Mi perfil"  (/api/perfil)
   ========================================================================== */

import express from "express";
import { getMiPerfil, putMiPerfil, putMiClave } from "../controllers/perfil.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";
import { validarPerfil, validarClave } from "../middlewares/formularios.middleware.js";

const router = express.Router();

router.use(verificarAdmin);                           // todas piden sesión de administrador

router.get("/", getMiPerfil);                         // GET /api/perfil
router.put("/", validarPerfil, putMiPerfil);          // PUT /api/perfil
router.put("/clave", validarClave, putMiClave);       // PUT /api/perfil/clave

export default router;
