/* ==========================================================================
   dashboard.routes.js - Rutas del Inicio  (/api/dashboard)
   ========================================================================== */

import express from "express";
import { getMetricasDashboard } from "../controllers/dashboard.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", verificarAdmin, getMetricasDashboard);   // GET /api/dashboard

export default router;
