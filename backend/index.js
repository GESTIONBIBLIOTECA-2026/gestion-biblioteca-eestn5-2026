/* ==========================================================================
   index.js - Servidor Express · Biblioteca Invaluable (Grupo 5)
   Circuito:  index.js ➔ Router ➔ Controller ➔ Model ➔ MySQL
   ========================================================================== */

// 1. Frameworks, configuración y rutas
import express from "express";
import cors from "cors";
import { PORT, JWT_SECRET } from "./src/config/config.js";
import connection from "./src/database/db.js";
import authRoutes from "./src/routes/auth.routes.js";
import perfilRoutes from "./src/routes/perfil.routes.js";
import usuariosRoutes from "./src/routes/usuarios.routes.js";
import cursosRoutes from "./src/routes/cursos.routes.js";
import prestamosRoutes from "./src/routes/prestamos.routes.js";
import librosRoutes from "./src/routes/libros.routes.js";

if (!JWT_SECRET) {
    console.error("❌ Falta JWT_SECRET en backend/.env (mirá .env.example)");
    process.exit(1);
}

// 2. Aplicación y middlewares globales
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("../frontend"));   // el panel también se abre en http://localhost:3000

// 3. Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/perfil", perfilRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/prestamos", prestamosRoutes);
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
    try {
        await connection.query("SELECT 1");
        console.log("✅ Base de datos conectada");
    } catch (error) {
        console.error("⚠️  No se pudo conectar a la base de datos:", error.message);
    }
});
