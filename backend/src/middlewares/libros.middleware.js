/* ==========================================================================
   libros.middleware.js - Validaciones de los formularios de libros · Grupo 6
   Alta / modificación del libro, baja o reactivación y movimientos de stock.
   Si hay errores responde 400 con { error, campos }; si no, deja los datos limpios en req.body.
   ========================================================================== */

import { limpiar, rechazar } from "./validaciones.middleware.js";

// Reglas del catálogo
const ESTADOS_LIBRO = ["activo", "baja"];
const MOVIMIENTOS_STOCK = ["compra", "donacion", "extraviado", "baja", "en_reparacion"];   // 2 de ingreso + 3 de retiro

const esEntero = (numero) => !isNaN(numero) && parseInt(numero) === numero;   // 5 sí, 5.5 no, "abc" no


/* --- Alta y modificación de libros: { titulo, autor, editorial, isbn, categoria_id, anio_publicacion, portada_url, cantidad } ---
   La cantidad de ejemplares se pide solo en el alta (después se maneja desde el stock). */
export const validarLibro = (req, res, next) => {
    const body = req.body ?? {};
    const datos = {
        titulo: limpiar(body.titulo),
        autor: limpiar(body.autor),
        editorial: limpiar(body.editorial),
        isbn: limpiar(body.isbn),
        categoria_id: Number(body.categoria_id),
        anio_publicacion: limpiar(body.anio_publicacion),
        portada_url: limpiar(body.portada_url),
        cantidad: Number(body.cantidad)
    };
    const anioMaximo = 2100;
    const campos = {};

    if (datos.titulo.length < 1 || datos.titulo.length > 200) campos.titulo = "Escribí el título (hasta 200 caracteres).";
    if (datos.autor.length < 2 || datos.autor.length > 120) campos.autor = "Escribí el autor (hasta 120 caracteres).";
    if (datos.editorial.length > 100) campos.editorial = "La editorial puede tener hasta 100 caracteres.";
    if (datos.isbn.length > 20) campos.isbn = "El ISBN puede tener hasta 20 caracteres.";
    if (!esEntero(datos.categoria_id) || datos.categoria_id < 1) campos.categoria_id = "Elegí una categoría.";
    if (datos.portada_url.length > 255) campos.portada_url = "La portada puede tener hasta 255 caracteres.";

    // El año es opcional
    if (datos.anio_publicacion) {
        const anio = Number(datos.anio_publicacion);
        if (!esEntero(anio) || anio < 1000 || anio > anioMaximo) campos.anio_publicacion = `El año tiene que estar entre 1000 y ${anioMaximo}.`;
        datos.anio_publicacion = anio;
    }

    // Los ejemplares se cargan solo en el alta
    if (req.method === "POST" && (!esEntero(datos.cantidad) || datos.cantidad < 1 || datos.cantidad > 500)) {
        campos.cantidad = "La cantidad tiene que ser un número entero entre 1 y 500.";
    }

    if (Object.keys(campos).length > 0) return rechazar(res, campos);

    // Lo opcional vacío se guarda como NULL
    req.body = {
        ...datos,
        editorial: datos.editorial || null,
        isbn: datos.isbn || null,
        anio_publicacion: datos.anio_publicacion || null,
        portada_url: datos.portada_url || null
    };
    next();
};


/* --- Baja o reactivación de un libro: { estado: "activo" | "baja" } --- */
export const validarEstadoLibro = (req, res, next) => {
    const estado = String(req.body?.estado ?? "");

    if (!ESTADOS_LIBRO.includes(estado)) {
        return res.status(400).json({ error: "El estado tiene que ser activo o baja." });
    }

    req.body = { estado };
    next();
};

/* --- Movimiento de stock de un libro: { movimiento, cantidad } --- */
export const validarStock = (req, res, next) => {
    const movimiento = String(req.body?.movimiento ?? "");
    const cantidad = Number(req.body?.cantidad);
    const campos = {};

    if (!MOVIMIENTOS_STOCK.includes(movimiento)) campos.movimiento = "Elegí qué querés hacer con el stock.";
    if (!esEntero(cantidad) || cantidad < 1 || cantidad > 500) campos.cantidad = "La cantidad tiene que ser un número entero entre 1 y 500.";

    if (Object.keys(campos).length > 0) return rechazar(res, campos);

    req.body = { movimiento, cantidad };
    next();
};
