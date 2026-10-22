/* ==========================================================================
   usuarios.controllers.js - Controlador de Usuarios · Grupo 5
   Recibe la petición (req), aplica las reglas de negocio, le pide los datos
   al Modelo y arma la respuesta (res) con su código HTTP.
   ========================================================================== */

import bcrypt from "bcryptjs";
import { getUsuarioPorId, getEstadoPorDni, buscarRepetidos, crearUsuario, actualizarUsuario } from "../models/usuario.models.js";
import { buscarUsuarios } from "../models/busqueda.models.js";
import { error500, responder409 } from "./respuestas.js";

// Si el DNI o el correo ya son de otro usuario → { dni: "...", correo: "..." }
const camposRepetidos = async ({ dni, correo }, idPropio) => {
    const campos = {};
    (await buscarRepetidos(dni, correo, idPropio)).forEach((otro) => {
        if (otro.dni === dni) campos.dni = `Ese DNI ya es de ${otro.nombre_completo}.`;
        if (otro.correo === correo) campos.correo = `Ese correo ya es de ${otro.nombre_completo}.`;
    });
    return campos;
};

/* --- GET /api/usuarios?nombre=&dni=&curso=&filtro=&pagina= --- */
export const getUsuarios = async (req, res) => {
    try {
        return res.json({ payload: await buscarUsuarios(req.filtros) });
    } catch (error) {
        return error500(res, error, "No se pudieron buscar los usuarios");
    }
};

/* --- GET /api/usuarios/:id --- */
export const getUsuario = async (req, res) => {
    try {
        const usuario = await getUsuarioPorId(req.id);
        if (!usuario) return res.status(404).json({ error: "No hay ningún usuario con ese ID." });
        return res.json({ payload: usuario });
    } catch (error) {
        return error500(res, error, "No se pudo leer el usuario");
    }
};

/* --- GET /api/usuarios/dni/:dni → { id, nombre_completo, curso, rol, estado, puede_pedir } (lo consume el Grupo 4) ---
   estado: "habilitado" | "suspendido" | "moroso" (préstamo vencido) | "baja" */
export const getUsuarioDni = async (req, res) => {
    try {
        const usuario = await getEstadoPorDni(req.dni);
        if (!usuario) return res.status(404).json({ error: "No hay ningún usuario con ese DNI." });

        const { condicion, ...datos } = usuario;
        const estado = condicion === "atraso" ? "moroso" : condicion;
        return res.json({ payload: { ...datos, estado, puede_pedir: estado === "habilitado" } });
    } catch (error) {
        return error500(res, error, "No se pudo leer el usuario");
    }
};

/* --- POST /api/usuarios   Body: { nombre_completo, dni, rol, curso, correo, telefono, direccion, clave } --- */
export const postUsuario = async (req, res) => {
    try {
        const { clave, ...datos } = req.body;

        // 1. El DNI y el correo no pueden estar repetidos
        const campos = await camposRepetidos(datos);
        if (Object.keys(campos).length > 0) return responder409(res, campos);

        // 2. Se guarda con la contraseña como hash bcrypt
        const id = await crearUsuario({ ...datos, password_hash: await bcrypt.hash(clave, 10) });
        return res.status(201).json({ mensaje: `Se registró a ${datos.nombre_completo}.`, payload: { id } });
    } catch (error) {
        return error500(res, error, "No se pudo guardar el usuario");
    }
};

/* --- PUT /api/usuarios/:id   (la clave es opcional: vacía = no se cambia) --- */
export const putUsuario = async (req, res) => {
    try {
        const { clave, ...datos } = req.body;

        // 1. Un administrador no puede sacarse el rol a sí mismo (se quedaría afuera del panel)
        if (req.id === req.usuario.id && datos.rol !== "administrador") {
            return responder409(res, { rol: "No podés quitarte el rol de administrador a vos mismo." });
        }

        // 2. DNI y correo repetidos
        const campos = await camposRepetidos(datos, req.id);
        if (Object.keys(campos).length > 0) return responder409(res, campos);

        // 3. Guardar (si no existe, no se modificó ninguna fila → 404)
        const hash = clave ? await bcrypt.hash(clave, 10) : null;
        const modificados = await actualizarUsuario(req.id, { ...datos, password_hash: hash });
        if (modificados === 0) return res.status(404).json({ error: "No hay ningún usuario con ese ID." });

        return res.json({ mensaje: `Se guardaron los cambios de ${datos.nombre_completo}.` });
    } catch (error) {
        return error500(res, error, "No se pudieron guardar los cambios");
    }
};
