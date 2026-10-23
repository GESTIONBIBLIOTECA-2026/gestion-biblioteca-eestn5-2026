/* ==========================================================================
   auth.middleware.js - "Molinete" de las rutas del panel
   Si el token no es válido o el usuario ya no es administrador habilitado,
   la petición se rebota y nunca llega al controlador.
   ========================================================================== */

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config.js";
import { getSesion } from "../models/usuario.models.js";

export const verificarAdmin = async (req, res, next) => {

    // 1. El frontend manda el header  Authorization: Bearer <token>
    const [tipo, token] = (req.headers.authorization || "").split(" ");

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({ error: "Tenés que iniciar sesión." });
    }

    try {
        // 2. El token dice QUIÉN es...
        const { id } = jwt.verify(token, JWT_SECRET);

        // 3. ...y la base dice si TODAVÍA puede entrar (si lo suspenden, pierde el acceso al instante)
        const usuario = await getSesion(id);

        if (!usuario || usuario.estado !== "habilitado" || usuario.rol !== "administrador") {
            return res.status(401).json({ error: "Tu usuario ya no tiene acceso al panel. Iniciá sesión de nuevo." });
        }

        req.usuario = { id: usuario.id, nombre: usuario.nombre_completo, rol: usuario.rol };
        next();

    } catch (error) {
        return res.status(401).json({ error: "La sesión venció. Iniciá sesión de nuevo." });
    }
};


// Protege el área móvil del alumno. Permite consultar el historial aun si está
// suspendido, pero la creación del pedido vuelve a validar la habilitación en el modelo.
export const verificarAlumno = async (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || "").split(" ");
    if (tipo !== "Bearer" || !token) return res.status(401).json({ error: "Iniciá sesión para continuar." });
    try {
        const { id } = jwt.verify(token, JWT_SECRET);
        const usuario = await getSesion(id);
        if (!usuario || usuario.rol !== "alumno" || usuario.estado === "baja") {
            return res.status(401).json({ error: "La cuenta no tiene acceso al área de alumnos. Iniciá sesión nuevamente." });
        }
        req.usuario = { id: usuario.id, nombre: usuario.nombre_completo, rol: usuario.rol, estado: usuario.estado };
        next();
    } catch (error) {
        return res.status(401).json({ error: "La sesión venció o no es válida. Iniciá sesión de nuevo." });
    }
};
