/* ==========================================================================
   auth.middleware.js - "Molinete" de las rutas protegidas
   - verificarSesion: alumno o docente con sesión válida
   Si el token no es válido o el usuario ya no puede entrar, la petición se
   rebota y nunca llega al controlador.
   ========================================================================== */

import jwt from "jsonwebtoken";
import { JWT_SECRET, ROLES_APP } from "../config/config.js";
import { getSesion } from "../models/usuario.models.js";

// Regla de acceso (la usa también el login): solo alumnos y docentes, y nadie
// de baja. Un alumno o docente suspendido SÍ entra: tiene que poder ver por
// qué está suspendido.
export const puedeEntrar = ({ rol, estado }) => ROLES_APP.includes(rol) && estado !== "baja";


export const verificarSesion = async (req, res, next) => {

    // 1. El frontend manda el header  Authorization: Bearer <token>
    const [tipo, token] = (req.headers.authorization || "").split(" ");

    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({ error: "Tenés que iniciar sesión." });
    }

    try {
        // 2. El token dice QUIÉN es...
        const { id } = jwt.verify(token, JWT_SECRET);

        // 3. ...y la base dice si TODAVÍA puede entrar (si le dan de baja, pierde el acceso al instante)
        const usuario = await getSesion(id);

        if (!usuario || !puedeEntrar(usuario)) {
            return res.status(401).json({ error: "Tu usuario ya no tiene acceso. Iniciá sesión de nuevo." });
        }

        req.usuario = { id: usuario.id, nombre: usuario.nombre_completo, rol: usuario.rol };
        next();

    } catch (error) {
        return res.status(401).json({ error: "La sesión venció. Iniciá sesión de nuevo." });
    }
};
