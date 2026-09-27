/* ==========================================================================
   index.js - Punto de entrada del servidor Express
   Biblioteca Invaluable · Panel de Administración (Grupo 5)

   Circuito:  index.js ➔ Router ➔ Controller ➔ Model ➔ PHP ➔ MySQL (Aiven)
   ========================================================================== */

// 1. Importar frameworks y librerías
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";

// 2. Configuración (lee el .env) y routers
import { PORT, JWT_SECRET, PHP_API_KEY } from "./src/config/config.js";
import { comprobarConexionPHP } from "./src/database/php.js";
import authRoutes from "./src/routes/auth.routes.js";

// 3. Chequear que el .env tenga lo obligatorio
if (!JWT_SECRET || !PHP_API_KEY) {
    console.error("❌ Faltan JWT_SECRET o PHP_API_KEY en backend/.env (mirá .env.example)");
    process.exit(1);
}

// 4. Crear la aplicación
const app = express();

// 5. Middlewares globales
app.use(cors());           // permite que el frontend (ej: Live Server) consuma la API
app.use(express.json());   // convierte el body JSON en req.body

// 6. Servir el frontend (así también se puede abrir en http://localhost:3000)
app.use(express.static(fileURLToPath(new URL("../frontend", import.meta.url))));

// 7. Ruta de prueba (Health Check)
app.get("/api", (req, res) => {
    res.json({ status: "OK", mensaje: "Servidor Backend corriendo correctamente" });
});

// 8. Montaje de rutas
app.use("/api/auth", authRoutes);

// 9. Ruta de API inexistente → 404
app.use("/api", (req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
});

// 10. Middleware de manejo de errores (4 parámetros)
app.use((err, req, res, next) => {
    // JSON mal formado en el body
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: "El cuerpo de la petición no es un JSON válido." });
    }

    console.error("Error no controlado:", err);
    res.status(500).json({ error: "Error interno del servidor" });
});

// 11. Encender el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
    comprobarConexionPHP();
});
