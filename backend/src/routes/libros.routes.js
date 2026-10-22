/* ==========================================================================
   libros.routes.js - Rutas de libros  (/api/libros)
   ========================================================================== */

import express from "express";
import { getLibro } from "../controllers/libros.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";
import { validarID } from "../middlewares/validaciones.middleware.js";

const router = express.Router();

router.get("/:id", verificarAdmin, validarID, getLibro);   // GET /api/libros/:id

export default router;
