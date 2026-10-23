/* ==========================================================================
   libros.routes.js - Rutas de libros  (/api/libros) · Grupo 6
   ========================================================================== */

import express from "express";
import {
    getLibro, getLibros, getCategoriasLibros, postLibro, putLibro, patchEstadoLibro, postStock
} from "../controllers/libros.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";
import { validarID, validarEstadoLibro, validarStock } from "../middlewares/validaciones.middleware.js";
import { validarLibro } from "../middlewares/formularios.middleware.js";

const router = express.Router();

router.use(verificarAdmin);                                                  // todas piden sesión de administrador

router.get("/", getLibros);                                                  // catálogo completo con su stock
router.get("/categorias", getCategoriasLibros);                              // categorías (va antes de "/:id")
router.get("/:id", validarID, getLibro);                                     // un libro con su stock (Grupo 4)
router.post("/", validarLibro, postLibro);                                   // alta de un libro nuevo
router.put("/:id", validarID, validarLibro, putLibro);                       // modificación
router.patch("/:id/estado", validarID, validarEstadoLibro, patchEstadoLibro);   // baja / reactivación
router.post("/:id/stock", validarID, validarStock, postStock);               // ingreso o retiro de ejemplares

export default router;
