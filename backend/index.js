/* ==========================================================================
   index.js - Servidor Express · Biblioteca Invaluable App (Grupo 5)
   API de la PWA para alumnos y docentes (sin panel de administración)
   Circuito:  index.js ➔ Router ➔ Controller ➔ Model ➔ MySQL
   ========================================================================== */

// 1. Frameworks, configuración y rutas (config.js frena todo si falta algo en el .env)
import express from "express";
import cors from "cors";
import { PORT, CARPETA_BACKEND } from "./src/config/config.js";
import connection, { comprobarConexion } from "./src/database/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import perfilRoutes from "./src/routes/perfil.routes.js";
import librosRoutes from "./src/routes/libros.routes.js";

// 2. Aplicación y middlewares globales
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(`${CARPETA_BACKEND}../frontend`));   // la app se abre en http://localhost:3000

// 3. Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/libros", librosRoutes);

// 4. Ruta de la API que no existe → 404
app.use("/api", (req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// 5. Middleware de errores (4 parámetros): JSON mal armado u errores no previstos
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
    }
    console.error("Error no controlado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// 6. Encender el servidor y probar la base de datos
app.listen(PORT, async () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
    await comprobarConexion();
});
