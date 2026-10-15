/* ==========================================================================
   validaciones.middleware.js - Validación de datos de entrada
   Frena los datos mal cargados ANTES de molestar a la base de datos.
   ========================================================================== */


import { ROLES_USUARIOS, ESTADOS_USUARIOS, FILTROS_USUARIOS, USUARIOS_POR_PAGINA } from "../config/config.js";

// El DNI se guarda sin puntos ni espacios: "30.111.222" → "30111222"
const limpiarDni = (dni) => String(dni ?? "").replace(/[.\s]/g, "");

// Funciones predicado (helpers de validación semántica)
const esDniValido = (dni) => /^\d{7,8}$/.test(String(dni ?? ""));
const esIdValido = (id) => /^[1-9]\d{0,9}$/.test(String(id ?? ""));
const esNombreValido = (nombre) => /^\p{L}[\p{L} .'-]*$/u.test(String(nombre ?? ""));
const esCorreoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(correo ?? ""));
const esTelefonoValido = (telefono) => /^[\d\s()+-]+$/.test(String(telefono ?? ""));


/* --- Valida el body del login: { dni, clave } --- */
export const validarLogin = (req, res, next) => {

    const { dni, clave } = req.body || {};
    const dniLimpio = limpiarDni(dni);

    if (!dniLimpio || !clave) {
        return res.status(400).json({ error: "Completá el DNI y la contraseña." });
    }

    if (!esDniValido(dniLimpio)) {
        return res.status(400).json({ error: "El DNI tiene que tener entre 7 y 8 números." });
    }

    // Datos limpios para el controlador
    req.credenciales = { dni: dniLimpio, clave: String(clave) };
    next();
};


/* --- Valida el DNI de la URL: /api/usuarios/dni/:dni --- */
export const validarDniParam = (req, res, next) => {

    const dniLimpio = limpiarDni(req.params.dni);

    if (!esDniValido(dniLimpio)) {
        return res.status(400).json({ error: "El DNI tiene que tener entre 7 y 8 números." });
    }

    req.params.dni = dniLimpio;
    next();
};


/* --- Valida el ID de la URL: /api/libros/:id, /api/usuarios/:id --- */
export const validarIdParam = (req, res, next) => {

    if (!esIdValido(req.params.id)) {
        return res.status(400).json({ error: "El ID tiene que ser un número entero positivo." });
    }

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


/* --- Reglas que comparten el alta/modificación de usuarios y "Mi perfil" ---
   Cada una agrega en "campos" el mensaje del campo que esté mal.            */

function revisarNombre(nombre, campos) {
    if (nombre.length < 3) {
        campos.nombre_completo = "Escribí el nombre y apellido.";
    } else if (nombre.length > 120) {
        campos.nombre_completo = "El nombre puede tener hasta 120 caracteres.";
    } else if (!esNombreValido(nombre)) {
        campos.nombre_completo = "El nombre solo puede tener letras y espacios.";
    }
}

function revisarContacto({ correo, telefono, direccion }, campos) {

    // Correo
    if (!esCorreoValido(correo) || correo.length > 120) {
        campos.correo = "El correo electrónico no es válido.";
    }

    // Teléfono: números, espacios, paréntesis, + y -. Al menos 6 números.
    const numerosTelefono = telefono.replace(/\D/g, "").length;

    if (!esTelefonoValido(telefono) || numerosTelefono < 6 || telefono.length > 30) {
        campos.telefono = "Escribí un teléfono válido (ej: 11 4444-5678).";
    }

    // Dirección
    if (direccion.length < 3) {
        campos.direccion = "Escribí la dirección.";
    } else if (direccion.length > 150) {
        campos.direccion = "La dirección puede tener hasta 150 caracteres.";
    }
}

// Devuelve el mensaje de error de la contraseña, o null si está bien
function revisarClave(clave) {
    if (clave.length < 6) return "La contraseña tiene que tener al menos 6 caracteres.";
    if (clave.length > 72) return "La contraseña puede tener hasta 72 caracteres.";
    return null;
}

// Responde 400 con { error, campos } si hay campos mal cargados. Devuelve true si respondió.
function responderCampos(res, campos) {

    const errores = Object.values(campos);

    if (errores.length === 0) return false;

    res.status(400).json({
        error: errores.length === 1 ? errores[0] : `Revisá los ${errores.length} campos marcados.`,
        campos
    });

    return true;
}


/* --- Valida los 6 atributos del usuario + tipo y contraseña (alta y modificación) ---
   Body: { nombre_completo, dni, rol, curso, correo, telefono, direccion, clave }
   Si algo está mal responde 400 con { error, campos: { campo: "mensaje" } }          */
export const validarUsuario = (req, res, next) => {

    const body = req.body || {};
    const esAlta = req.method === "POST";

    const datos = {
        nombre_completo: limpiarTexto(body.nombre_completo),
        dni: limpiarDni(body.dni),
        rol: limpiarTexto(body.rol).toLowerCase(),
        curso: limpiarTexto(body.curso),
        correo: limpiarTexto(body.correo).toLowerCase(),
        telefono: limpiarTexto(body.telefono),
        direccion: limpiarTexto(body.direccion),
        clave: String(body.clave ?? "")
    };

    const campos = {};

    revisarNombre(datos.nombre_completo, campos);

    // DNI
    if (!esDniValido(datos.dni)) {
        campos.dni = "El DNI tiene que tener entre 7 y 8 números.";
    }

    // Tipo de usuario
    if (!ROLES_USUARIOS.includes(datos.rol)) {
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

    revisarContacto(datos, campos);

    // Contraseña: obligatoria en el alta; en la modificación solo si se quiere cambiar
    if (esAlta || datos.clave) {
        const errorClave = revisarClave(datos.clave);
        if (errorClave) campos.clave = errorClave;
    }

    if (responderCampos(res, campos)) return;

    // Datos limpios para el controlador
    req.datosUsuario = datos;
    next();
};


/* --- Valida la búsqueda avanzada: ?nombre=&dni=&curso=&filtro=&pagina= --- */
export const validarFiltrosUsuarios = (req, res, next) => {

    const nombre = limpiarTexto(req.query.nombre).slice(0, 120);
    const dni = limpiarDni(req.query.dni);
    const curso = limpiarTexto(req.query.curso).slice(0, 30);
    const filtro = String(req.query.filtro || "todos");
    const pagina = Number(req.query.pagina || 1);

    if (dni && !/^\d{1,10}$/.test(dni)) {
        return res.status(400).json({ error: "En el DNI escribí solo números." });
    }

    if (!FILTROS_USUARIOS.includes(filtro)) {
        return res.status(400).json({ error: `El filtro tiene que ser uno de estos: ${FILTROS_USUARIOS.join(", ")}.` });
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

    if (!ESTADOS_USUARIOS.includes(estado)) {
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


/* ==========================================================================
   MI PERFIL (pantalla Configuración)
   ========================================================================== */

/* --- Valida los datos propios: { nombre_completo, correo, telefono, direccion }
   El DNI y el rol no se cambian desde acá (el DNI es el usuario del login).     */
export const validarPerfil = (req, res, next) => {

    const body = req.body || {};

    const datos = {
        nombre_completo: limpiarTexto(body.nombre_completo),
        correo: limpiarTexto(body.correo).toLowerCase(),
        telefono: limpiarTexto(body.telefono),
        direccion: limpiarTexto(body.direccion)
    };

    const campos = {};

    revisarNombre(datos.nombre_completo, campos);
    revisarContacto(datos, campos);

    if (responderCampos(res, campos)) return;

    req.datosPerfil = datos;
    next();
};


/* --- Valida el cambio de contraseña: { clave_actual, clave_nueva, confirmacion } --- */
export const validarCambioClave = (req, res, next) => {

    const body = req.body || {};

    const claveActual = String(body.clave_actual ?? "");
    const claveNueva = String(body.clave_nueva ?? "");
    const confirmacion = String(body.confirmacion ?? "");

    const campos = {};

    if (!claveActual) {
        campos.clave_actual = "Escribí tu contraseña actual.";
    }

    const errorClave = revisarClave(claveNueva);

    if (errorClave) {
        campos.clave_nueva = errorClave;
    } else if (claveNueva === claveActual) {
        campos.clave_nueva = "La contraseña nueva tiene que ser distinta de la actual.";
    }

    if (confirmacion !== claveNueva) {
        campos.confirmacion = "Las contraseñas no coinciden.";
    }

    if (responderCampos(res, campos)) return;

    req.cambioClave = { claveActual, claveNueva };
    next();
};
