/* ==========================================================================
   limiteIntentos.middleware.js - Freno contra adivinar contraseñas
   Después de 5 intentos fallidos, bloquea esa IP por 5 minutos.
   ========================================================================== */

const MAX_INTENTOS = 5;
const BLOQUEO_MS = 5 * 60 * 1000;

// ip → { cantidad, hasta }
const intentos = new Map();


export const limitarIntentos = (req, res, next) => {

    const ip = req.ip;
    const registro = intentos.get(ip);

    // ¿Está bloqueada?
    if (registro?.hasta > Date.now()) {
        return res.status(429).json({ error: "Demasiados intentos fallidos. Esperá unos minutos y probá de nuevo." });
    }

    // Cuando termine la respuesta, mirar cómo salió el login
    res.on("finish", () => {

        if (res.statusCode === 401) {
            const actual = intentos.get(ip);
            const bloqueoTerminado = actual?.hasta && actual.hasta <= Date.now();
            const cantidad = !actual || bloqueoTerminado ? 1 : actual.cantidad + 1;

            intentos.set(ip, {
                cantidad,
                hasta: cantidad >= MAX_INTENTOS ? Date.now() + BLOQUEO_MS : null
            });
        }

        if (res.statusCode === 200) {
            intentos.delete(ip);
        }
    });

    next();
};
