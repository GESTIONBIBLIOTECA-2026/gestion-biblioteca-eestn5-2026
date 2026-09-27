/* ==========================================================================
   validaciones.middleware.js - Validación de datos de entrada
   Frena los datos mal cargados ANTES de molestar a la base de datos.
   ========================================================================== */


/* --- Valida el body del login: { dni, clave } --- */
export const validarLogin = (req, res, next) => {

    const { dni, clave } = req.body || {};

    // El DNI se guarda sin puntos ni espacios: "30.111.222" → "30111222"
    const dniLimpio = String(dni ?? "").replace(/[.\s]/g, "");

    if (!dniLimpio || !clave) {
        return res.status(400).json({ error: "Completá el DNI y la contraseña." });
    }

    if (!/^\d{6,10}$/.test(dniLimpio)) {
        return res.status(400).json({ error: "El DNI solo puede tener números." });
    }

    // Datos limpios para el controlador
    req.credenciales = { dni: dniLimpio, clave: String(clave) };
    next();
};
