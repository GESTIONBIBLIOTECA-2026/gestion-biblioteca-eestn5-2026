/* ==========================================================================
   usuario.models.js - Modelo de Usuarios (Acceso a Datos) · Grupo 5
   No conoce Express (no usa req ni res): solo consulta la base y devuelve datos.

   Tablas: usuarios, roles, cursos, sanciones, pedidos (vista_historial_usuario)
   ========================================================================== */

import connection from "../database/db.js";
import { obtenerOCrearCurso } from "./curso.models.js";


/**
 * Error de regla de negocio (DNI repetido, no se puede dar de baja, etc.).
 * El controlador lo convierte en una respuesta con ese código HTTP.
 * "campos" marca qué campo del formulario está mal: { dni: "Ya existe..." }
 */
export class ErrorUsuario extends Error {
    constructor(codigoOStatus, mensaje, campos = null) {
        super(mensaje);
        this.codigo = typeof codigoOStatus === "string" ? codigoOStatus : null;
        this.status = typeof codigoOStatus === "number" ? codigoOStatus : (codigoOStatus === "NOT_FOUND" ? 404 : codigoOStatus === "CONFLICT" ? 409 : 400);
        this.campos = campos;
    }
}


/* ==========================================================================
   Pedazos de SQL que se repiten.
   Son texto FIJO escrito acá: nunca llevan datos que mande el usuario
   (esos van siempre con el comodín "?").
   ========================================================================== */

// Préstamo atrasado = vencido, o prestado con la fecha de devolución ya pasada
const SQL_PRESTAMO_ATRASADO = `(p.estado = 'vencido'
             OR (p.estado = 'prestado' AND p.fecha_devolucion_estimada < CURRENT_DATE))`;

// Sanción en vigor = activa y sin fecha de fin (o con fecha de fin que todavía no llegó)
const SQL_SANCION_EN_VIGOR = `s.activa = TRUE AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)`;

// Datos públicos de un usuario (NUNCA el password_hash) + contadores para su estado
const SQL_COLUMNAS_USUARIO = `
    u.id, u.dni, u.nombre_completo, u.curso_id, c.nombre AS curso,
    u.correo, u.telefono, u.direccion, r.nombre AS rol, u.estado, u.fecha_alta,
    (SELECT COUNT(*) FROM sanciones s
      WHERE s.usuario_id = u.id AND ${SQL_SANCION_EN_VIGOR}) AS sanciones_activas,
    (SELECT COUNT(*) FROM pedidos p
      WHERE p.usuario_id = u.id AND ${SQL_PRESTAMO_ATRASADO}) AS prestamos_atrasados,
    (SELECT COUNT(*) FROM pedidos p
      WHERE p.usuario_id = u.id AND p.estado IN ('prestado', 'vencido')) AS prestamos_en_curso`;

const SQL_DESDE_USUARIOS = `
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN cursos c ON c.id = u.curso_id`;

// ¿Tiene un préstamo atrasado? / ¿Tiene una sanción en vigor?
const SQL_TIENE_ATRASO = `EXISTS (SELECT 1 FROM pedidos p
                                  WHERE p.usuario_id = u.id AND ${SQL_PRESTAMO_ATRASADO})`;

const SQL_TIENE_SANCION = `EXISTS (SELECT 1 FROM sanciones s
                                   WHERE s.usuario_id = u.id AND ${SQL_SANCION_EN_VIGOR})`;

// Filtros rápidos del buscador (chips). La clave llega validada por el middleware.
//   morosos     → tienen un préstamo atrasado
//   suspendidos → no pueden pedir libros: suspendidos a mano, con sanción o con atraso
const FILTROS_SQL = {
    todos:           "u.estado <> 'baja'",
    alumnos:         "u.estado <> 'baja' AND r.nombre = 'alumno'",
    docentes:        "u.estado <> 'baja' AND r.nombre = 'docente'",
    administradores: "u.estado <> 'baja' AND r.nombre = 'administrador'",
    morosos:         `u.estado <> 'baja' AND ${SQL_TIENE_ATRASO}`,
    suspendidos:     `u.estado <> 'baja' AND (u.estado = 'suspendido' OR ${SQL_TIENE_SANCION} OR ${SQL_TIENE_ATRASO})`,
    bajas:           "u.estado = 'baja'"
};


/* ==========================================================================
   Estado que ve el bibliotecario ("condición")
   Junta el estado guardado en la tabla + sanciones + atrasos:
     'baja'        → dado de baja (no se borra: queda su historial)
     'suspendido'  → suspendido a mano o con una sanción en vigor
     'atraso'      → suspendido automáticamente: tiene un préstamo atrasado sin devolver
     'habilitado'  → puede pedir libros
   ========================================================================== */
export const calcularCondicion = (usuario) => {

    if (usuario.estado === "baja") return "baja";

    if (usuario.estado === "suspendido" || usuario.sanciones_activas > 0) return "suspendido";

    if (usuario.prestamos_atrasados > 0) return "atraso";

    return "habilitado";
};

// Agrega "condicion" y "puede_pedir" a un usuario leído de la base
const conCondicion = (usuario) => {

    if (!usuario) return null;

    const condicion = calcularCondicion(usuario);

    return { ...usuario, condicion, puede_pedir: condicion === "habilitado" };
};


/* ==========================================================================
   LOGIN Y PRÉSTAMOS (ya existían)
   ========================================================================== */

/**
 * Busca un usuario por DNI para el login (incluye el hash de la contraseña).
 * Devuelve { id, nombre_completo, password_hash, estado, rol } o null si no existe.
 */
export const getUsuarioPorDni = async (dni) => {

    // Comodín "?" → el DNI se trata siempre como dato, nunca como SQL
    const sql = `SELECT u.id, u.nombre_completo, u.password_hash, u.estado, r.nombre AS rol
                 FROM usuarios u
                 JOIN roles r ON r.id = u.rol_id
                 WHERE u.dni = ?
                 LIMIT 1`;

    const [filas] = await connection.query(sql, [dni]);
    const user = filas[0];

    if (!user) return null;

    // Payload del usuario retornado explícitamente
    return {
        id: user.id,
        nombre_completo: user.nombre_completo,
        password_hash: user.password_hash,
        estado: user.estado,
        rol: user.rol
    };
};


/**
 * Rol y estado ACTUALES de quien tiene la sesión (lo usa el middleware soloAdministrador).
 * Devuelve { id, nombre_completo, rol, estado } o null si el usuario ya no existe.
 */
export const getSesionUsuario = async (id) => {

    const sql = `SELECT u.id, u.nombre_completo, r.nombre AS rol, u.estado
                 FROM usuarios u
                 JOIN roles r ON r.id = u.rol_id
                 WHERE u.id = ?
                 LIMIT 1`;

    const [filas] = await connection.query(sql, [id]);

    return filas[0] ?? null;
};


/**
 * Datos públicos de un usuario (sin contraseña) + si puede llevarse libros.
 * Lo usa "Nuevo préstamo". Devuelve null si el DNI no existe.
 */
export const getFichaUsuarioPorDni = async (dni) => {

    const sql = `SELECT u.id, u.dni, u.nombre_completo, c.nombre AS curso, u.estado, r.nombre AS rol,
                        (SELECT COUNT(*) FROM sanciones s
                          WHERE s.usuario_id = u.id AND s.activa = TRUE
                            AND (s.fecha_fin IS NULL OR s.fecha_fin >= CURRENT_DATE)) AS sanciones_activas,
                        (SELECT COUNT(*) FROM pedidos p
                          WHERE p.usuario_id = u.id
                            AND (p.estado = 'vencido'
                                 OR (p.estado = 'prestado' AND p.fecha_devolucion_estimada < CURRENT_DATE))) AS prestamos_atrasados
                 FROM usuarios u
                 JOIN roles r ON r.id = u.rol_id
                 LEFT JOIN cursos c ON c.id = u.curso_id
                 WHERE u.dni = ?
                 LIMIT 1`;

    const [filas] = await connection.query(sql, [dni]);

    return conCondicion(filas[0]);
};


/**
 * Valida y obtiene un usuario para registrar un préstamo (dentro de una transacción).
 * Bloquea la fila con FOR SHARE y reutiliza las reglas de sanciones y deudas.
 */
export const obtenerUsuarioParaPrestamo = async (conexion, dni) => {
    const [usuarios] = await conexion.query(
        `SELECT u.id, u.nombre_completo, u.estado,
                (SELECT COUNT(*) FROM sanciones s
                  WHERE s.usuario_id = u.id AND ${SQL_SANCION_EN_VIGOR}) AS sanciones_activas,
                (SELECT COUNT(*) FROM pedidos p
                  WHERE p.usuario_id = u.id AND ${SQL_PRESTAMO_ATRASADO}) AS prestamos_atrasados
         FROM usuarios u
         WHERE u.dni = ?
         LIMIT 1
         FOR SHARE`,
        [dni]
    );

    const usuario = usuarios[0];

    if (!usuario) {
        throw new ErrorUsuario("NOT_FOUND", "No hay ningún usuario con ese DNI.");
    }
    if (usuario.estado !== "habilitado") {
        throw new ErrorUsuario("CONFLICT", usuario.estado === "baja"
            ? "El usuario está dado de baja."
            : "El usuario está suspendido y no puede llevarse libros.");
    }
    if (usuario.sanciones_activas > 0) {
        throw new ErrorUsuario("CONFLICT", "El usuario tiene una sanción activa.");
    }
    if (usuario.prestamos_atrasados > 0) {
        throw new ErrorUsuario("CONFLICT", "El usuario tiene un préstamo atrasado sin devolver.");
    }

    return usuario;
};


/* ==========================================================================
   BÚSQUEDA AVANZADA (nombre, DNI y curso combinados + filtro rápido)
   ========================================================================== */

// Los comodines del LIKE (% y _) se escapan para buscarlos como texto común
const escaparLike = (texto) => texto.replace(/[\\%_]/g, "\\$&");


/**
 * Arma el WHERE de los campos de texto. Devuelve { sql, valores } para usar con "?".
 */
function condicionesDeBusqueda({ nombre, dni, curso }) {

    const condiciones = [];
    const valores = [];

    // Nombre: cada palabra tiene que aparecer, en cualquier orden ("perez juan" → "Juan Pérez")
    nombre.split(" ").filter(Boolean).forEach((palabra) => {
        condiciones.push("u.nombre_completo LIKE ?");
        valores.push(`%${escaparLike(palabra)}%`);
    });

    // DNI: que empiece con lo escrito ("4512" → "45123456")
    if (dni) {
        condiciones.push("u.dni LIKE ?");
        valores.push(`${escaparLike(dni)}%`);
    }

    // Curso: que contenga lo escrito ("7mo" → "7mo 4ta" y "7mo 5ta")
    if (curso) {
        condiciones.push("c.nombre LIKE ?");
        valores.push(`%${escaparLike(curso)}%`);
    }

    return {
        sql: condiciones.length > 0 ? condiciones.join(" AND ") : "TRUE",
        valores
    };
}


/**
 * Listado paginado de usuarios con filtros combinados.
 * filtros = { nombre, dni, curso, filtro, pagina, porPagina }
 * Devuelve { usuarios, total, pagina, por_pagina, total_paginas, contadores }
 *   contadores = cuántos usuarios hay en cada filtro rápido con la búsqueda actual
 */
export const buscarUsuarios = async ({ nombre = "", dni = "", curso = "", filtro = "todos", pagina = 1, porPagina = 10 }) => {

    const busqueda = condicionesDeBusqueda({ nombre, dni, curso });

    // 1. Contadores de cada chip en UNA consulta: SUM(condición) cuenta las filas que la cumplen
    const columnasContadores = Object.entries(FILTROS_SQL)
        .map(([clave, condicion]) => `COALESCE(SUM(${condicion}), 0) AS ${clave}`)
        .join(",\n");

    const [[contadores]] = await connection.query(
        `SELECT ${columnasContadores}
         ${SQL_DESDE_USUARIOS}
         WHERE ${busqueda.sql}`,
        busqueda.valores
    );

    // 2. Página pedida (si piden una página que ya no existe, se muestra la última)
    const total = contadores[filtro];
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const paginaReal = Math.min(pagina, totalPaginas);

    const [usuarios] = await connection.query(
        `SELECT ${SQL_COLUMNAS_USUARIO}
         ${SQL_DESDE_USUARIOS}
         WHERE ${busqueda.sql} AND ${FILTROS_SQL[filtro]}
         ORDER BY u.nombre_completo, u.id
         LIMIT ? OFFSET ?`,
        [...busqueda.valores, porPagina, (paginaReal - 1) * porPagina]
    );

    return {
        usuarios: usuarios.map(conCondicion),
        total,
        pagina: paginaReal,
        por_pagina: porPagina,
        total_paginas: totalPaginas,
        contadores
    };
};


/**
 * Un usuario por ID (6 atributos + rol + curso + estado y contadores).
 * Se le puede pasar la conexión de una transacción. Devuelve null si no existe.
 */
export const getUsuarioPorId = async (id, conexion = connection) => {

    const [filas] = await conexion.query(
        `SELECT ${SQL_COLUMNAS_USUARIO}
         ${SQL_DESDE_USUARIOS}
         WHERE u.id = ?
         LIMIT 1`,
        [id]
    );

    return conCondicion(filas[0]);
};


/* ==========================================================================
   HISTORIAL ACTIVO: entregas, devoluciones, atrasos y sanciones
   ========================================================================== */

/**
 * Devuelve { usuario, resumen, prestamos, sanciones } o null si el usuario no existe.
 */
export const getHistorialUsuario = async (id) => {

    const usuario = await getUsuarioPorId(id);

    if (!usuario) return null;

    // Préstamos y reservas (la vista calcula los días de atraso)
    const [prestamos] = await connection.query(
        `SELECT pedido_id, titulo, cantidad, fecha_pedido, fecha_entrega,
                fecha_devolucion_estimada, fecha_devolucion_real, estado, dias_atraso
         FROM vista_historial_usuario
         WHERE usuario_id = ?
         ORDER BY fecha_pedido DESC, pedido_id DESC`,
        [id]
    );

    // Sanciones: primero las que están en vigor
    const [filasSanciones] = await connection.query(
        `SELECT s.id, s.tipo, s.motivo, s.fecha_inicio, s.fecha_fin, s.pedido_id,
                (${SQL_SANCION_EN_VIGOR}) AS en_vigor,
                a.nombre_completo AS aplicada_por
         FROM sanciones s
         LEFT JOIN usuarios a ON a.id = s.aplicada_por
         WHERE s.usuario_id = ?
         ORDER BY en_vigor DESC, s.fecha_inicio DESC, s.id DESC`,
        [id]
    );

    const sanciones = filasSanciones.map((sancion) => ({ ...sancion, en_vigor: sancion.en_vigor === 1 }));

    // Resumen del historial activo (con filter y reduce)
    const fueEntregado = (p) => Boolean(p.fecha_entrega) || ["prestado", "devuelto", "vencido"].includes(p.estado);

    const resumen = {
        entregas:     prestamos.filter(fueEntregado).length,
        devoluciones: prestamos.filter((p) => p.estado === "devuelto").length,
        atrasos:      prestamos.filter((p) => p.dias_atraso > 0).length,
        en_curso:     prestamos.filter((p) => p.estado === "prestado" || p.estado === "vencido").length,
        reservas:     prestamos.filter((p) => p.estado === "pendiente").length,
        dias_atraso:  prestamos.reduce((total, p) => total + p.dias_atraso, 0)
    };

    return { usuario, resumen, prestamos, sanciones };
};


/* ==========================================================================
   ALTA Y MODIFICACIÓN
   ========================================================================== */

// ID del rol ('alumno' | 'docente' | 'administrador') en la tabla roles
async function obtenerRolId(conexion, rol) {

    const [filas] = await conexion.query("SELECT id FROM roles WHERE nombre = ? LIMIT 1", [rol]);

    if (!filas[0]) {
        throw new ErrorUsuario(400, `No existe el rol "${rol}" en la base.`, { rol: "Elegí un tipo de usuario válido." });
    }

    return filas[0].id;
}


// Avisa con nombre y apellido si el DNI o el correo ya son de otro usuario
async function revisarRepetidos(conexion, { dni, correo }, idPropio = 0) {

    const [filas] = await conexion.query(
        `SELECT id, dni, correo, nombre_completo, estado
         FROM usuarios
         WHERE (dni = ? OR correo = ?) AND id <> ?`,
        [dni, correo, idPropio]
    );

    const campos = {};

    filas.forEach((otro) => {
        const deBaja = otro.estado === "baja" ? " (dado de baja: podés reactivarlo)" : "";

        if (otro.dni === dni) {
            campos.dni = `Ese DNI ya es de ${otro.nombre_completo}${deBaja}.`;
        }

        if (otro.correo.toLowerCase() === correo.toLowerCase()) {
            campos.correo = `Ese correo ya es de ${otro.nombre_completo}${deBaja}.`;
        }
    });

    if (Object.keys(campos).length > 0) {
        throw new ErrorUsuario(409, campos.dni || campos.correo, campos);
    }
}


// Por si dos altas iguales llegan al mismo tiempo: MySQL frena el UNIQUE con ER_DUP_ENTRY
function traducirRepetido(error) {

    if (error.code !== "ER_DUP_ENTRY") return error;

    if (error.message.includes("uq_usuarios_dni")) {
        return new ErrorUsuario(409, "Ya existe un usuario con ese DNI.", { dni: "Ya existe un usuario con ese DNI." });
    }

    if (error.message.includes("uq_usuarios_correo")) {
        return new ErrorUsuario(409, "Ya existe un usuario con ese correo.", { correo: "Ya existe un usuario con ese correo." });
    }

    return new ErrorUsuario(409, "Ya existe un registro con esos datos.");
}


/**
 * Alta de usuario (transacción: si el curso es nuevo se crea junto con el usuario).
 * datos = { dni, nombre_completo, rol, curso, correo, telefono, direccion, password_hash }
 * Devuelve el usuario creado.
 */
export const crearUsuario = async (datos) => {

    // La transacción tiene que ir toda por la MISMA conexión del pool
    const conexion = await connection.getConnection();

    try {
        await conexion.beginTransaction();

        await revisarRepetidos(conexion, datos);

        const rolId = await obtenerRolId(conexion, datos.rol);
        const cursoId = datos.curso ? await obtenerOCrearCurso(conexion, datos.curso) : null;

        const [resultado] = await conexion.query(
            `INSERT INTO usuarios (dni, nombre_completo, curso_id, correo, telefono, direccion, password_hash, rol_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [datos.dni, datos.nombre_completo, cursoId, datos.correo, datos.telefono,
             datos.direccion, datos.password_hash, rolId]
        );

        await conexion.commit();

        // Se lee con la MISMA conexión: pedir otra al pool mientras se tiene esta
        // puede trabar el servidor si llegan muchas peticiones juntas
        return await getUsuarioPorId(resultado.insertId, conexion);

    } catch (error) {
        await conexion.rollback();
        throw traducirRepetido(error);

    } finally {
        // Devolver la conexión al pool (si no, el pool se queda sin conexiones)
        conexion.release();
    }
};


/**
 * Modificación de los datos de un usuario. La contraseña solo cambia si viene password_hash.
 * Devuelve el usuario actualizado.
 */
export const actualizarUsuario = async (id, datos) => {

    const conexion = await connection.getConnection();

    try {
        await conexion.beginTransaction();

        // FOR UPDATE: bloquea la fila hasta terminar, así nadie la cambia a la vez
        const [existe] = await conexion.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", [id]);

        if (!existe[0]) {
            throw new ErrorUsuario(404, "No hay ningún usuario con ese ID.");
        }

        await revisarRepetidos(conexion, datos, id);

        const rolId = await obtenerRolId(conexion, datos.rol);
        const cursoId = datos.curso ? await obtenerOCrearCurso(conexion, datos.curso) : null;

        const columnas = ["dni = ?", "nombre_completo = ?", "curso_id = ?", "correo = ?",
                          "telefono = ?", "direccion = ?", "rol_id = ?"];
        const valores = [datos.dni, datos.nombre_completo, cursoId, datos.correo,
                         datos.telefono, datos.direccion, rolId];

        if (datos.password_hash) {
            columnas.push("password_hash = ?");
            valores.push(datos.password_hash);
        }

        await conexion.query(`UPDATE usuarios SET ${columnas.join(", ")} WHERE id = ?`, [...valores, id]);

        await conexion.commit();

        return await getUsuarioPorId(id, conexion);

    } catch (error) {
        await conexion.rollback();
        throw traducirRepetido(error);

    } finally {
        conexion.release();
    }
};


/* ==========================================================================
   SANCIONES Y BAJA: suspender, habilitar (o reactivar) y dar de baja
   ========================================================================== */

/**
 * Cambia el estado de la cuenta, todo en una transacción:
 *   'suspendido' → guarda una sanción con el motivo (si tiene un préstamo atrasado,
 *                  queda como sanción por atraso de ese pedido) y marca al usuario suspendido
 *   'habilitado' → levanta las sanciones en vigor y lo vuelve a habilitar (también reactiva una baja)
 *   'baja'       → baja lógica: no se borra, así queda su historial. No se puede si tiene
 *                  libros sin devolver; sus reservas pendientes se cancelan.
 * Devuelve { usuario, reservas_canceladas }
 */
export const cambiarEstadoUsuario = async ({ id, estado, motivo, adminId }) => {

    const conexion = await connection.getConnection();

    try {
        await conexion.beginTransaction();

        const [existe] = await conexion.query("SELECT id FROM usuarios WHERE id = ? FOR UPDATE", [id]);

        if (!existe[0]) {
            throw new ErrorUsuario(404, "No hay ningún usuario con ese ID.");
        }

        const usuario = await getUsuarioPorId(id, conexion);
        let reservasCanceladas = 0;

        // --- Suspender ---
        if (estado === "suspendido") {

            if (usuario.estado === "baja") {
                throw new ErrorUsuario(409, "El usuario está dado de baja. Reactivalo antes de suspenderlo.");
            }

            if (usuario.condicion === "suspendido") {
                throw new ErrorUsuario(409, "El usuario ya está suspendido.");
            }

            // Si tiene un préstamo atrasado, la sanción queda asociada a ese pedido
            const [atrasados] = await conexion.query(
                `SELECT p.id FROM pedidos p
                 WHERE p.usuario_id = ? AND ${SQL_PRESTAMO_ATRASADO}
                 ORDER BY p.fecha_devolucion_estimada
                 LIMIT 1`,
                [id]
            );

            const pedidoAtrasado = atrasados[0]?.id ?? null;

            await conexion.query(
                `INSERT INTO sanciones (usuario_id, pedido_id, tipo, motivo, fecha_inicio, activa, aplicada_por)
                 VALUES (?, ?, ?, ?, CURRENT_DATE, TRUE, ?)`,
                [id, pedidoAtrasado, pedidoAtrasado ? "atraso" : "manual", motivo, adminId]
            );

            await conexion.query("UPDATE usuarios SET estado = 'suspendido' WHERE id = ?", [id]);
        }

        // --- Habilitar / reactivar ---
        if (estado === "habilitado") {

            if (usuario.estado === "habilitado" && usuario.sanciones_activas === 0) {
                throw new ErrorUsuario(409, "El usuario ya está habilitado.");
            }

            // Las sanciones no se borran: se cierran con fecha de fin = hoy (quedan en el historial)
            await conexion.query(
                `UPDATE sanciones
                 SET activa = FALSE,
                     fecha_fin = CASE WHEN fecha_fin IS NULL OR fecha_fin > CURRENT_DATE
                                      THEN CURRENT_DATE ELSE fecha_fin END
                 WHERE usuario_id = ? AND activa = TRUE`,
                [id]
            );

            await conexion.query("UPDATE usuarios SET estado = 'habilitado' WHERE id = ?", [id]);
        }

        // --- Dar de baja ---
        if (estado === "baja") {

            if (usuario.estado === "baja") {
                throw new ErrorUsuario(409, "El usuario ya está dado de baja.");
            }

            if (usuario.prestamos_en_curso > 0) {
                const libros = usuario.prestamos_en_curso === 1 ? "1 libro" : `${usuario.prestamos_en_curso} libros`;
                throw new ErrorUsuario(409, `No se puede dar de baja: tiene ${libros} sin devolver.`);
            }

            // Las reservas que todavía no retiró se cancelan y queda registrado en el historial
            const [pendientes] = await conexion.query(
                "SELECT id FROM pedidos WHERE usuario_id = ? AND estado = 'pendiente' FOR UPDATE",
                [id]
            );

            for (const pedido of pendientes) {
                await conexion.query("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [pedido.id]);

                await conexion.query(
                    `INSERT INTO pedido_historial (pedido_id, estado_anterior, estado_nuevo, registrado_por, observacion)
                     VALUES (?, 'pendiente', 'cancelado', ?, 'Reserva cancelada por la baja del usuario')`,
                    [pedido.id, adminId]
                );
            }

            reservasCanceladas = pendientes.length;

            await conexion.query("UPDATE usuarios SET estado = 'baja' WHERE id = ?", [id]);
        }

        await conexion.commit();

        return { usuario: await getUsuarioPorId(id, conexion), reservas_canceladas: reservasCanceladas };

    } catch (error) {
        await conexion.rollback();
        throw error;

    } finally {
        conexion.release();
    }
};
