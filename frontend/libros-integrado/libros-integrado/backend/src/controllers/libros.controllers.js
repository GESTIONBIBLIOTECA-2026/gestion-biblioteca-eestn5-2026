/* ==========================================================================
   libros.controllers.js - Controlador de Libros · Grupo 6
   Recibe la petición (req), llama al Modelo, aplica las reglas de negocio
   y arma la respuesta (res) con su código HTTP.
   ========================================================================== */

import {
    getLibroPorId, listarLibros, getCategorias, getCategoriaPorId, buscarIsbnRepetido,
    getStockDelLibro, existeLibro, crearLibro, actualizarLibro, cambiarActivoLibro, agregarEjemplares, retirarEjemplares
} from "../models/libro.models.js";
import { error500 } from "./usuarios.controllers.js";

// Si el ISBN o la categoría no sirven → { isbn: "...", categoria_id: "..." }
const camposInvalidos = async ({ isbn, categoria_id }, idPropio) => {
    const campos = {};

    if (isbn) {
        const otro = await buscarIsbnRepetido(isbn, idPropio);
        if (otro) campos.isbn = `Ese ISBN ya es de "${otro.titulo}".`;
    }

    if (!await getCategoriaPorId(categoria_id)) campos.categoria_id = "Esa categoría no existe.";

    return campos;
};

/* --- GET /api/libros/:id --- */
export const getLibro = async (req, res) => {
    try {
        const libro = await getLibroPorId(req.id);
        if (!libro) return res.status(404).json({ error: "No hay ningún libro con ese ID." });
        return res.json({ payload: libro });
    } catch (error) {
        return error500(res, error, "No se pudo consultar la base de datos.");
    }
};

/* --- GET /api/libros   (catálogo completo con su stock) --- */
export const getLibros = async (req, res) => {
    try {
        return res.json({ payload: await listarLibros() });
    } catch (error) {
        return error500(res, error, "No se pudo leer el catálogo");
    }
};

/* --- GET /api/libros/categorias --- */
export const getCategoriasLibros = async (req, res) => {
    try {
        return res.json({ payload: await getCategorias() });
    } catch (error) {
        return error500(res, error, "No se pudieron leer las categorías");
    }
};

/* --- POST /api/libros   Body: { titulo, autor, editorial, isbn, categoria_id, anio_publicacion, portada_url, cantidad } --- */
export const postLibro = async (req, res) => {
    try {
        const campos = await camposInvalidos(req.body, 0);
        if (Object.keys(campos).length > 0) {
            return res.status(409).json({ error: Object.values(campos)[0], campos });
        }

        const id = await crearLibro(req.body);
        const { titulo, cantidad } = req.body;

        return res.status(201).json({ mensaje: `Se registró "${titulo}" con ${cantidad} ejemplar(es).`, payload: { id } });
    } catch (error) {
        return error500(res, error, "No se pudo guardar el libro");
    }
};

/* --- PUT /api/libros/:id   Body: igual que el alta (sin cantidad) --- */
export const putLibro = async (req, res) => {
    try {
        if (!await existeLibro(req.id)) return res.status(404).json({ error: "No hay ningún libro con ese ID." });

        const campos = await camposInvalidos(req.body, req.id);
        if (Object.keys(campos).length > 0) {
            return res.status(409).json({ error: Object.values(campos)[0], campos });
        }

        await actualizarLibro(req.id, req.body);

        return res.json({ mensaje: `Se guardaron los cambios de "${req.body.titulo}".` });
    } catch (error) {
        return error500(res, error, "No se pudo modificar el libro");
    }
};

/* --- PATCH /api/libros/:id/estado   Body: { estado: "activo" | "baja" } --- */
export const patchEstadoLibro = async (req, res) => {
    try {
        const libro = await getStockDelLibro(req.id);
        if (!libro) return res.status(404).json({ error: "No hay ningún libro con ese ID." });

        // No se puede dar de baja un título con ejemplares afuera o reservas pendientes
        if (req.body.estado === "baja" && (libro.prestados > 0 || libro.reservados > 0)) {
            return res.status(409).json({
                error: `No se puede dar de baja "${libro.titulo}": tiene ${libro.prestados} ejemplar(es) prestado(s) y ${libro.reservados} reserva(s) pendiente(s).`
            });
        }

        await cambiarActivoLibro(req.id, req.body.estado === "activo");

        const mensaje = req.body.estado === "baja" ? `Se dio de baja "${libro.titulo}".` : `Se reactivó "${libro.titulo}".`;
        return res.json({ mensaje });
    } catch (error) {
        return error500(res, error, "No se pudo cambiar el estado del libro");
    }
};

/* --- POST /api/libros/:id/stock   Body: { movimiento, cantidad }
       compra / donacion  → agrega ejemplares nuevos
       extraviado / baja / en_reparacion → saca ejemplares disponibles de circulación --- */
export const postStock = async (req, res) => {
    try {
        const { movimiento, cantidad } = req.body;

        const libro = await getStockDelLibro(req.id);
        if (!libro) return res.status(404).json({ error: "No hay ningún libro con ese ID." });

        if (!libro.activo) {
            return res.status(409).json({ error: `"${libro.titulo}" está de baja. Reactivalo antes de cambiar su stock.` });
        }

        if (movimiento === "compra" || movimiento === "donacion") {
            await agregarEjemplares(req.id, cantidad, movimiento);
            return res.json({ mensaje: `Se agregaron ${cantidad} ejemplar(es) a "${libro.titulo}".` });
        }

        // Solo se pueden retirar los que están disponibles y sin reserva pendiente
        const libres = libro.disponibles - libro.reservados;
        if (cantidad > libres) {
            const mensaje = `Solo hay ${libres < 0 ? 0 : libres} ejemplar(es) libre(s) para retirar (los demás están prestados o reservados).`;
            return res.status(409).json({ error: mensaje, campos: { cantidad: mensaje } });
        }

        await retirarEjemplares(req.id, cantidad, movimiento);
        return res.json({ mensaje: `Se retiraron ${cantidad} ejemplar(es) de "${libro.titulo}".` });
    } catch (error) {
        return error500(res, error, "No se pudo actualizar el stock");
    }
};
