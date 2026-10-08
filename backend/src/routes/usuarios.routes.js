/* ==========================================================================
   usuarios.routes.js - Rutas de usuarios · Grupo 5
   Montadas en index.js bajo el prefijo /api/usuarios
   ========================================================================== */

import express from "express";
import {
    getUsuarioPorDni, getUsuarios, getUsuario, getHistorial,
    postUsuario, putUsuario, patchEstado, deleteUsuario
} from "../controllers/usuarios.controllers.js";
import { verificarToken, soloAdministrador } from "../middlewares/auth.middleware.js";
import {
    validarDniParam, validarIdParam, validarFiltrosUsuarios, validarUsuario, validarCambioEstado
} from "../middlewares/validaciones.middleware.js";

const router = express.Router();

// Todas las rutas de usuarios piden sesión de administrador
router.use(verificarToken, soloAdministrador);

// GET    /api/usuarios?nombre=&dni=&curso=&filtro=&pagina=  → búsqueda avanzada + listado
router.get("/", validarFiltrosUsuarios, getUsuarios);

// GET    /api/usuarios/dni/:dni  → ficha rápida (la usa "Nuevo préstamo")
router.get("/dni/:dni", validarDniParam, getUsuarioPorDni);

// POST   /api/usuarios  → alta
router.post("/", validarUsuario, postUsuario);

// GET    /api/usuarios/:id  → datos de un usuario
router.get("/:id", validarIdParam, getUsuario);

// GET    /api/usuarios/:id/historial  → historial activo (entregas, devoluciones, atrasos, sanciones)
router.get("/:id/historial", validarIdParam, getHistorial);

// PUT    /api/usuarios/:id  → modificación
router.put("/:id", validarIdParam, validarUsuario, putUsuario);

// PATCH  /api/usuarios/:id/estado  → suspender / habilitar / dar de baja
router.patch("/:id/estado", validarIdParam, validarCambioEstado, patchEstado);

// DELETE /api/usuarios/:id  → baja (lógica)
router.delete("/:id", validarIdParam, deleteUsuario);

export default router;
