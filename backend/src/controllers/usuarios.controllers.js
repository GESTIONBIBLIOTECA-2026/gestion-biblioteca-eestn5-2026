/* ==========================================================================
   usuarios.controllers.js - Controlador de Usuarios · Grupo 5
   Recibe la petición (req), usa el Modelo y arma la respuesta (res).
   ========================================================================== */

import bcrypt from "bcryptjs";
import {
    getFichaUsuarioPorDni, buscarUsuarios, getUsuarioPorId, getHistorialUsuario,
    crearUsuario, actualizarUsuario, cambiarEstadoUsuario, ErrorUsuario
} from "../models/usuario.models.js";


// "1 préstamo atrasado" / "2 préstamos atrasados"
const plural = (cantidad, singular, varios) => `${cantidad} ${cantidad === 1 ? singular : varios}`;


/* --------------------------------------------------------------------------
   Respuesta de error común:
   - Regla de negocio (ErrorUsuario) → su código (400, 404, 409) y el mensaje tal cual
   - Cualquier otra cosa (la base no responde, etc.) → 500
   -------------------------------------------------------------------------- */
function responderError(res, error, mensaje500) {

    if (error instanceof ErrorUsuario) {
        return res.status(error.status).json({
            error: error.message,
            ...(error.campos && { campos: error.campos })
        });
    }

    console.error(`${mensaje500}:`, error.message);
    return res.status(500).json({ error: mensaje500 });
}


/* --------------------------------------------------------------------------
   GET /api/usuarios/dni/:dni   (requiere token)
   Lo usa "Nuevo préstamo" para completar el nombre y avisar si puede llevarse libros.
   -------------------------------------------------------------------------- */
export const getUsuarioPorDni = async (req, res) => {
    try {
        const usuario = await getFichaUsuarioPorDni(req.params.dni);

        if (!usuario) {
            return res.status(404).json({ error: "No hay ningún usuario con ese DNI." });
        }

        return res.json({ payload: usuario });

    } catch (error) {
        console.error("Error al buscar usuario:", error.message);
        return res.status(500).json({ error: "No se pudo consultar la base de datos." });
    }
};


/* --------------------------------------------------------------------------
   GET /api/usuarios?nombre=&dni=&curso=&filtro=todos&pagina=1
   Búsqueda avanzada (filtros combinados) + listado paginado.
   req.filtros lo arma el middleware validarFiltrosUsuarios.
   -------------------------------------------------------------------------- */
export const getUsuarios = async (req, res) => {
    try {
        const resultado = await buscarUsuarios(req.filtros);
        return res.json({ payload: resultado });

    } catch (error) {
        return responderError(res, error, "No se pudo consultar la base de datos.");
    }
};


/* --------------------------------------------------------------------------
   GET /api/usuarios/:id
   Datos completos de un usuario (para cargarlo en el formulario y editarlo).
   -------------------------------------------------------------------------- */
export const getUsuario = async (req, res) => {
    try {
        const usuario = await getUsuarioPorId(Number(req.params.id));

        if (!usuario) {
            return res.status(404).json({ error: "No hay ningún usuario con ese ID." });
        }

        return res.json({ payload: usuario });

    } catch (error) {
        return responderError(res, error, "No se pudo consultar la base de datos.");
    }
};


/* --------------------------------------------------------------------------
   GET /api/usuarios/:id/historial
   Historial activo: entregas, devoluciones, atrasos y sanciones.
   -------------------------------------------------------------------------- */
export const getHistorial = async (req, res) => {
    try {
        const historial = await getHistorialUsuario(Number(req.params.id));

        if (!historial) {
            return res.status(404).json({ error: "No hay ningún usuario con ese ID." });
        }

        return res.json({ payload: historial });

    } catch (error) {
        return responderError(res, error, "No se pudo cargar el historial.");
    }
};


/* --------------------------------------------------------------------------
   POST /api/usuarios
   Body: { nombre_completo, dni, rol, curso, correo, telefono, direccion, clave }
   -------------------------------------------------------------------------- */
export const postUsuario = async (req, res) => {
    try {
        // Datos ya validados y limpios (middleware validarUsuario)
        const { clave, ...datos } = req.datosUsuario;

        // La contraseña se guarda como hash bcrypt, nunca en texto
        const usuario = await crearUsuario({ ...datos, password_hash: await bcrypt.hash(clave, 10) });

        return res.status(201).json({
            mensaje: `Se registró a ${usuario.nombre_completo}.`,
            payload: usuario
        });

    } catch (error) {
        return responderError(res, error, "No se pudo guardar el usuario en la base de datos.");
    }
};


/* --------------------------------------------------------------------------
   PUT /api/usuarios/:id
   Body: igual que el alta. "clave" es opcional: si viene vacía no se cambia.
   -------------------------------------------------------------------------- */
export const putUsuario = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { clave, ...datos } = req.datosUsuario;

        // Un administrador no puede sacarse el rol a sí mismo (se quedaría afuera del panel)
        if (id === req.usuario.id && datos.rol !== "administrador") {
            return res.status(409).json({
                error: "No podés quitarte el rol de administrador a vos mismo.",
                campos: { rol: "Tu usuario tiene que seguir siendo administrador." }
            });
        }

        const usuario = await actualizarUsuario(id, {
            ...datos,
            ...(clave && { password_hash: await bcrypt.hash(clave, 10) })
        });

        return res.json({
            mensaje: `Se guardaron los cambios de ${usuario.nombre_completo}.`,
            payload: usuario
        });

    } catch (error) {
        return responderError(res, error, "No se pudieron guardar los cambios en la base de datos.");
    }
};


/* --------------------------------------------------------------------------
   PATCH /api/usuarios/:id/estado
   Body: { "estado": "suspendido" | "habilitado" | "baja", "motivo": "..." }
   Suspender (con motivo), habilitar / reactivar, o dar de baja.
   -------------------------------------------------------------------------- */
export const patchEstado = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { estado, motivo } = req.cambioEstado;

        if (id === req.usuario.id && estado !== "habilitado") {
            return res.status(409).json({ error: "No podés suspender ni dar de baja tu propio usuario." });
        }

        const { usuario, reservas_canceladas } = await cambiarEstadoUsuario({
            id,
            estado,
            motivo,
            adminId: req.usuario.id      // queda guardado quién aplicó la sanción
        });

        return res.json({
            mensaje: mensajeCambioEstado(usuario, estado, reservas_canceladas),
            payload: usuario
        });

    } catch (error) {
        return responderError(res, error, "No se pudo cambiar el estado del usuario.");
    }
};


/* --------------------------------------------------------------------------
   DELETE /api/usuarios/:id
   Baja del ABM. Es una baja lógica (estado = 'baja'): el historial no se pierde.
   -------------------------------------------------------------------------- */
export const deleteUsuario = (req, res) => {
    req.cambioEstado = { estado: "baja", motivo: null };
    return patchEstado(req, res);
};


// Mensaje para el bibliotecario después de cambiar el estado
function mensajeCambioEstado(usuario, estado, reservasCanceladas) {

    const nombre = usuario.nombre_completo;

    if (estado === "suspendido") {
        return `Se suspendió a ${nombre}: no puede pedir libros hasta que lo habilites.`;
    }

    if (estado === "baja") {
        let reservas = "";

        if (reservasCanceladas === 1) reservas = " Se canceló su reserva pendiente.";
        if (reservasCanceladas > 1) reservas = ` Se cancelaron sus ${reservasCanceladas} reservas pendientes.`;

        return `Se dio de baja a ${nombre}.${reservas}`;
    }

    if (usuario.prestamos_atrasados > 0) {
        const atrasos = plural(usuario.prestamos_atrasados, "préstamo atrasado", "préstamos atrasados");
        const devolver = usuario.prestamos_atrasados === 1 ? "devolverlo" : "devolverlos";
        return `Se habilitó a ${nombre}, pero sigue con ${atrasos}: no va a poder pedir libros hasta ${devolver}.`;
    }

    return `Se habilitó a ${nombre}: ya puede pedir libros.`;
}
