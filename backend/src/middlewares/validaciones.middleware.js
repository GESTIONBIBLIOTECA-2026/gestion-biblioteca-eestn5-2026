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


/* --- Valida el ID de la URL: /api/libros/:id, /api/usuarios/:id --- */
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


/* ==========================================================================
   GRUPO 5 — USUARIOS
   ========================================================================== */

// Texto prolijo: sin espacios al principio/final ni espacios dobles
const limpiarTexto = (valor) => String(valor ?? "").trim().replace(/\s+/g, " ");

const ROLES = ["alumno", "docente", "administrador"];
const ESTADOS = ["habilitado", "suspendido", "baja"];
const FILTROS = ["todos", "alumnos", "docentes", "administradores", "morosos", "suspendidos", "bajas"];
const USUARIOS_POR_PAGINA = 10;

const NOMBRE_VALIDO = /^\p{L}[\p{L} .'-]*$/u;            // letras (con tildes y ñ), espacios, . ' -
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO_VALIDO = /^[\d\s()+-]+$/;


/* --- Valida los 6 atributos del usuario + tipo y contraseña (alta y modificación) ---
   Body: { nombre_completo, dni, rol, curso, correo, telefono, direccion, clave }
   Si algo está mal responde 400 con { error, campos: { campo: "mensaje" } }          */
export const validarUsuario = (req, res, next) => {

    const body = req.body || {};
    const esAlta = req.method === "POST";

    const datos = {
        nombre_completo: limpiarTexto(body.nombre_completo),
        dni:             limpiarDni(body.dni),
        rol:             limpiarTexto(body.rol).toLowerCase(),
        curso:           limpiarTexto(body.curso),
        correo:          limpiarTexto(body.correo).toLowerCase(),
        telefono:        limpiarTexto(body.telefono),
        direccion:       limpiarTexto(body.direccion),
        clave:           String(body.clave ?? "")
    };

    const campos = {};

    // Nombre completo
    if (datos.nombre_completo.length < 3) {
        campos.nombre_completo = "Escribí el nombre y apellido.";
    } else if (datos.nombre_completo.length > 120) {
        campos.nombre_completo = "El nombre puede tener hasta 120 caracteres.";
    } else if (!NOMBRE_VALIDO.test(datos.nombre_completo)) {
        campos.nombre_completo = "El nombre solo puede tener letras y espacios.";
    }

    // DNI
    if (!DNI_VALIDO.test(datos.dni)) {
        campos.dni = "El DNI tiene que tener entre 6 y 10 números.";
    }

    // Tipo de usuario
    if (!ROLES.includes(datos.rol)) {
        campos.rol = "Elegí el tipo de usuario.";
    }

    // Curso: obligatorio para los alumnos. Docentes y administradores no tienen curso.
    if (datos.rol === "alumno") {
        if (!datos.curso) {
            campos.curso = "El curso es obligatorio para los alumnos.";
        } else if (datos.curso.length > 30) {
            campos.curso = "El curso puede tener hasta 30 caracteres.";
        }
    } else {
        datos.curso = null;
    }

    // Correo
    if (!CORREO_VALIDO.test(datos.correo) || datos.correo.length > 120) {
        campos.correo = "El correo electrónico no es válido.";
    }

    // Teléfono: números, espacios, paréntesis, + y -. Al menos 6 números.
    const numerosTelefono = datos.telefono.replace(/\D/g, "").length;

    if (!TELEFONO_VALIDO.test(datos.telefono) || numerosTelefono < 6 || datos.telefono.length > 30) {
        campos.telefono = "Escribí un teléfono válido (ej: 11 4444-5678).";
    }

    // Dirección
    if (datos.direccion.length < 3) {
        campos.direccion = "Escribí la dirección.";
    } else if (datos.direccion.length > 150) {
        campos.direccion = "La dirección puede tener hasta 150 caracteres.";
    }

    // Contraseña: obligatoria en el alta; en la modificación solo si se quiere cambiar
    if (esAlta || datos.clave) {
        if (datos.clave.length < 6) {
            campos.clave = "La contraseña tiene que tener al menos 6 caracteres.";
        } else if (datos.clave.length > 72) {
            campos.clave = "La contraseña puede tener hasta 72 caracteres.";
        }
    }

    const errores = Object.values(campos);

    if (errores.length > 0) {
        return res.status(400).json({
            error: errores.length === 1 ? errores[0] : `Revisá los ${errores.length} campos marcados.`,
            campos
        });
    }

    // Datos limpios para el controlador
    req.datosUsuario = datos;
    next();
};


/* --- Valida la búsqueda avanzada: ?nombre=&dni=&curso=&filtro=&pagina= --- */
export const validarFiltrosUsuarios = (req, res, next) => {

    const nombre = limpiarTexto(req.query.nombre).slice(0, 120);
    const dni    = limpiarDni(req.query.dni);
    const curso  = limpiarTexto(req.query.curso).slice(0, 30);
    const filtro = String(req.query.filtro || "todos");
    const pagina = Number(req.query.pagina || 1);

    if (dni && !/^\d{1,10}$/.test(dni)) {
        return res.status(400).json({ error: "En el DNI escribí solo números." });
    }

    if (!FILTROS.includes(filtro)) {
        return res.status(400).json({ error: `El filtro tiene que ser uno de estos: ${FILTROS.join(", ")}.` });
    }

    if (!Number.isInteger(pagina) || pagina < 1 || pagina > 100000) {
        return res.status(400).json({ error: "La página tiene que ser un número mayor a 0." });
    }

    req.filtros = { nombre, dni, curso, filtro, pagina, porPagina: USUARIOS_POR_PAGINA };
    next();
};


/* --- Valida el cambio de estado: { estado, motivo } (el motivo es obligatorio para suspender) --- */
export const validarCambioEstado = (req, res, next) => {

    const estado = String(req.body?.estado ?? "");
    const motivo = limpiarTexto(req.body?.motivo);

    if (!ESTADOS.includes(estado)) {
        return res.status(400).json({ error: "El estado tiene que ser habilitado, suspendido o baja." });
    }

    if (estado === "suspendido" && motivo.length < 3) {
        return res.status(400).json({
            error: "Escribí el motivo de la suspensión.",
            campos: { motivo: "Escribí el motivo de la suspensión." }
        });
    }

    if (motivo.length > 255) {
        return res.status(400).json({
            error: "El motivo puede tener hasta 255 caracteres.",
            campos: { motivo: "El motivo puede tener hasta 255 caracteres." }
        });
    }

    req.cambioEstado = { estado, motivo: motivo || null };
    next();
};
