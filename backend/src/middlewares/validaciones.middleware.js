/* ==========================================================================
   validaciones.middleware.js - Validación de datos de entrada
   Frena los datos mal cargados ANTES de molestar a la base de datos.
   ========================================================================== */


// El DNI se guarda sin puntos ni espacios: "30.111.222" → "30111222"
const limpiarDni = (dni) => String(dni ?? "").replace(/[.\s]/g, "");
const DNI_VALIDO = /^\d{6,10}$/;
const ID_VALIDO = /^[1-9]\d{0,9}$/;


/* --- Valida el body del login: { dni, clave } --- */
export const validarLogin = (req, res, next) => {

    const { dni, clave } = req.body || {};
    const dniLimpio = limpiarDni(dni);

    if (!dniLimpio || !clave) {
        return res.status(400).json({ error: "Completá el DNI y la contraseña." });
    }

    if (!DNI_VALIDO.test(dniLimpio)) {
        return res.status(400).json({ error: "El DNI solo puede tener números." });
    }

    // Datos limpios para el controlador
    req.credenciales = { dni: dniLimpio, clave: String(clave) };
    next();
};


/* --- Valida el DNI de la URL: /api/usuarios/dni/:dni --- */
export const validarDniParam = (req, res, next) => {

    const dniLimpio = limpiarDni(req.params.dni);

    if (!DNI_VALIDO.test(dniLimpio)) {
        return res.status(400).json({ error: "El DNI tiene que tener entre 6 y 10 números." });
    }

    req.params.dni = dniLimpio;
    next();
};


/* --- Valida el ID de la URL: /api/libros/:id --- */
export const validarIdParam = (req, res, next) => {

    if (!ID_VALIDO.test(String(req.params.id))) {
        return res.status(400).json({ error: "El ID tiene que ser un número entero positivo." });
    }

    next();
};


/* --- Valida el body del préstamo: { dni, libroId } --- */
export const validarPrestamo = (req, res, next) => {

    const { dni, libroId } = req.body || {};
    const dniLimpio = limpiarDni(dni);
    const idLimpio = String(libroId ?? "").trim();

    if (!dniLimpio || !idLimpio) {
        return res.status(400).json({ error: "Completá el DNI del usuario y el ID del libro." });
    }

    if (!DNI_VALIDO.test(dniLimpio)) {
        return res.status(400).json({ error: "El DNI tiene que tener entre 6 y 10 números." });
    }

    if (!ID_VALIDO.test(idLimpio)) {
        return res.status(400).json({ error: "El ID del libro tiene que ser un número." });
    }

    req.prestamo = { dni: dniLimpio, libroId: Number(idLimpio) };
    next();
};


/* --- Valida ?limite= en la URL (entre 1 y 50, por defecto 5) --- */
export const validarLimite = (req, res, next) => {

    const limite = Number(req.query.limite ?? 5);

    if (!Number.isInteger(limite) || limite < 1 || limite > 50) {
        return res.status(400).json({ error: "El límite tiene que ser un número entre 1 y 50." });
    }

    req.limite = limite;
    next();
};
