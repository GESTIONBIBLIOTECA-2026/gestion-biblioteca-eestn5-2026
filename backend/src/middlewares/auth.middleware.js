/* ==========================================================================
   auth.middleware.js - "Molinete" de las rutas protegidas
   - verificarSesion: cualquier usuario con sesión (alumno, docente o admin)
   - verificarAdmin:  solo el administrador (panel de gestión)
   Si el token no es válido o el usuario ya no puede entrar, la petición se
   rebota y nunca llega al controlador.
   ========================================================================== */

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/config.js";
import { getSesion } from "../models/usuario.models.js";

// Regla de acceso (la usa también el login): nadie de baja entra, y el
// administrador además tiene que estar habilitado. Un alumno o docente
// suspendido SÍ entra: tiene que poder ver por qué está suspendido.
export const puedeEntrar = ({ rol, estado }) =>
    estado !== "baja" && (rol !== "administrador" || estado === "habilitado");


// Fábrica de middlewares: soloAdmin = true deja pasar únicamente al administrador
const verificar = (soloAdmin) => async (req, res, next) => {

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

        // 4. Sesión válida, pero la sección es solo para la bibliotecaria
        if (soloAdmin && usuario.rol !== "administrador") {
            return res.status(403).json({ error: "Esta sección es solo para el administrador de la biblioteca." });
        }

        req.usuario = { id: usuario.id, nombre: usuario.nombre_completo, rol: usuario.rol };
        next();

    } catch (error) {
        return res.status(401).json({ error: "La sesión venció. Iniciá sesión de nuevo." });
    }
};

export const verificarSesion = verificar(false);
export const verificarAdmin = verificar(true);
