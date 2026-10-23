/* ==========================================================================
   auth.routes.js - Rutas de autenticación  (/api/auth)
   ========================================================================== */

import express from "express";
import { postLogin, postLoginAlumno, getPerfil } from "../controllers/auth.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";
import { validarLogin } from "../middlewares/validaciones.middleware.js";
import { limitarIntentos } from "../middlewares/limiteIntentos.middleware.js";

const router = express.Router();

router.post("/login", limitarIntentos, validarLogin, postLogin);
router.post("/login-alumno", limitarIntentos, validarLogin, postLoginAlumno); // Acceso móvil exclusivo para alumnos
router.get("/perfil", verificarAdmin, getPerfil);                   // GET  /api/auth/perfil

export default router;
