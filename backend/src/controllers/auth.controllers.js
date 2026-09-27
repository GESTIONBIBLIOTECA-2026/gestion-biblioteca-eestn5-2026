/* ==========================================================================
   auth.controllers.js - Controlador de Autenticación
   Recibe la petición (req), usa el Modelo y arma la respuesta (res).
   ========================================================================== */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUsuarioPorDni } from "../models/usuario.models.js";
import { JWT_SECRET, JWT_DURACION, ROLES_PANEL } from "../config/config.js";


// Hash de relleno: si el DNI no existe igual se compara una clave,
// así la respuesta tarda lo mismo y no se puede adivinar qué DNI existe.
const HASH_FALSO = bcrypt.hashSync("clave-inexistente", 10);


/* --------------------------------------------------------------------------
   POST /api/auth/login
   Body: { "dni": "30111222", "clave": "gaby1234" }
   -------------------------------------------------------------------------- */
export const postLogin = async (req, res) => {
    try {
        // 1. Datos ya validados por el middleware validarLogin
        const { dni, clave } = req.credenciales;

        // 2. Pedirle el usuario al Modelo
        const usuario = await getUsuarioPorDni(dni);

        // 3. Comparar la contraseña con el hash bcrypt guardado en la base
        const claveOk = await bcrypt.compare(clave, usuario?.password_hash || HASH_FALSO);

        if (!usuario || !claveOk) {
            return res.status(401).json({ error: "DNI o contraseña incorrectos." });
        }

        // 4. Reglas de negocio: solo administradores habilitados
        if (!ROLES_PANEL.includes(usuario.rol)) {
            return res.status(403).json({ error: "Tu usuario no tiene permiso para entrar al panel de administración." });
        }

        if (usuario.estado !== "habilitado") {
            const mensaje = usuario.estado === "baja" ? "Tu usuario está dado de baja." : "Tu usuario está suspendido.";
            return res.status(403).json({ error: mensaje });
        }

        // 5. Crear el token de sesión (nunca se manda el password_hash)
        const datosSesion = { id: usuario.id, nombre: usuario.nombre_completo, rol: usuario.rol };
        const token = jwt.sign(datosSesion, JWT_SECRET, { expiresIn: JWT_DURACION });

        // 6. Responder 200 con el token y los datos públicos del usuario
        return res.json({ payload: { token, usuario: datosSesion } });

    } catch (error) {
        console.error("Error en el login:", error.message);
        return res.status(500).json({ error: "No se pudo conectar con la base de datos." });
    }
};


/* --------------------------------------------------------------------------
   GET /api/auth/perfil   (requiere token)
   Devuelve quién está logueado. req.usuario lo carga el middleware verificarToken.
   -------------------------------------------------------------------------- */
export const getPerfil = (req, res) => {
    return res.json({ payload: req.usuario });
};
