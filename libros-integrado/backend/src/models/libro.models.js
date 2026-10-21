/* ==========================================================================
   libro.models.js - Modelo de Libros · Grupo 6
   Catálogo, categorías, ejemplares (stock) y baja / reactivación de títulos.
   Un "ejemplar" es cada copia física: disponible, prestado, en_reparacion, extraviado o baja.
   ========================================================================== */

import connection from "../database/db.js";

// Un libro con su stock (vista_stock_libros)
export const getLibroPorId = async (id) => {
    const sql = `SELECT libro_id, isbn, titulo, categoria, autores, ejemplares_totales,
                        ejemplares_disponibles, cantidad_reservada, stock_reservable, estado_visual
                 FROM vista_stock_libros WHERE libro_id = ?`;
    const [rows] = await connection.query(sql, [id]);
    return rows[0];
};


/* --------------------------------------------------------------------------
   CONSULTAS
   -------------------------------------------------------------------------- */

// Todo el catálogo (títulos activos y de baja) con su stock.
//   en circulación = ejemplares disponibles o prestados
//   fuera          = ejemplares dados de baja, extraviados o en reparación
export const listarLibros = async () => {
    const sql = `SELECT l.id, l.isbn, l.titulo, l.anio_publicacion, l.portada_url, l.activo,
                        l.categoria_id, c.nombre AS categoria, ed.nombre AS editorial,
                        (SELECT GROUP_CONCAT(a.nombre_completo ORDER BY a.nombre_completo SEPARATOR ', ')
                           FROM libros_autores la JOIN autores a ON a.id = la.autor_id
                          WHERE la.libro_id = l.id) AS autores,
                        COUNT(CASE WHEN e.estado IN ('disponible', 'prestado') THEN 1 END) AS ejemplares_totales,
                        COUNT(CASE WHEN e.estado = 'disponible' THEN 1 END) AS ejemplares_disponibles,
                        COUNT(CASE WHEN e.estado IN ('baja', 'extraviado', 'en_reparacion') THEN 1 END) AS ejemplares_fuera
                 FROM libros l
                 JOIN categorias c ON c.id = l.categoria_id
                 LEFT JOIN editoriales ed ON ed.id = l.editorial_id
                 LEFT JOIN ejemplares e ON e.libro_id = l.id
                 GROUP BY l.id, c.nombre, ed.nombre
                 ORDER BY l.titulo`;
    const [rows] = await connection.query(sql);
    return rows;
};

// Categorías para los <select> de la página
export const getCategorias = async () => {
    const [rows] = await connection.query("SELECT id, nombre FROM categorias ORDER BY nombre");
    return rows;
};

export const getCategoriaPorId = async (id) => {
    const [rows] = await connection.query("SELECT id, nombre FROM categorias WHERE id = ?", [id]);
    return rows[0];
};

export const existeLibro = async (id) => {
    const [rows] = await connection.query("SELECT id FROM libros WHERE id = ?", [id]);
    return rows.length > 0;
};

// ¿Otro libro ya tiene ese ISBN? (idPropio = 0 en el alta)
export const buscarIsbnRepetido = async (isbn, idPropio) => {
    const [rows] = await connection.query("SELECT id, titulo FROM libros WHERE isbn = ? AND id <> ?", [isbn, idPropio]);
    return rows[0];
};

// Lo que hace falta saber de un libro antes de tocar su stock o darlo de baja
//   libres = disponibles que no están reservados por un pedido pendiente
export const getStockDelLibro = async (id) => {
    const sql = `SELECT l.id, l.titulo, l.activo,
                        COUNT(CASE WHEN e.estado = 'disponible' THEN 1 END) AS disponibles,
                        COUNT(CASE WHEN e.estado = 'prestado' THEN 1 END) AS prestados,
                        (SELECT COALESCE(SUM(p.cantidad), 0) FROM pedidos p
                          WHERE p.libro_id = l.id AND p.estado = 'pendiente') AS reservados
                 FROM libros l
                 LEFT JOIN ejemplares e ON e.libro_id = l.id
                 WHERE l.id = ?
                 GROUP BY l.id, l.titulo, l.activo`;
    const [rows] = await connection.query(sql, [id]);
    return rows[0];
};


/* --------------------------------------------------------------------------
   AUTORES Y EDITORIALES (se buscan por nombre; si no existen, se crean)
   -------------------------------------------------------------------------- */

const idEditorial = async (nombre) => {
    if (!nombre) return null;

    await connection.query("INSERT IGNORE INTO editoriales (nombre) VALUES (?)", [nombre]);
    const [rows] = await connection.query("SELECT id FROM editoriales WHERE nombre = ?", [nombre]);
    return rows[0].id;
};

const idAutor = async (nombre) => {
    const [existentes] = await connection.query("SELECT id FROM autores WHERE nombre_completo = ?", [nombre]);
    if (existentes.length > 0) return existentes[0].id;

    const [resultado] = await connection.query("INSERT INTO autores (nombre_completo) VALUES (?)", [nombre]);
    return resultado.insertId;
};


/* --------------------------------------------------------------------------
   EJEMPLARES
   -------------------------------------------------------------------------- */

// Agrega "cantidad" ejemplares nuevos disponibles (origen: compra o donacion)
export const agregarEjemplares = async (libroId, cantidad, origen) => {
    const [filas] = await connection.query("SELECT COUNT(*) AS total FROM ejemplares WHERE libro_id = ?", [libroId]);
    const yaCargados = filas[0].total;

    for (let numero = 1; numero <= cantidad; numero++) {
        const codigo = `LIB-${libroId}-${yaCargados + numero}`;
        await connection.query(
            "INSERT INTO ejemplares (libro_id, codigo_inventario, origen) VALUES (?, ?, ?)",
            [libroId, codigo, origen]
        );
    }
};

// Saca de circulación "cantidad" ejemplares disponibles (estado: extraviado, baja o en_reparacion)
export const retirarEjemplares = async (libroId, cantidad, estado) => {
    const sql = `UPDATE ejemplares SET estado = ?
                 WHERE libro_id = ? AND estado = 'disponible'
                 ORDER BY id DESC LIMIT ?`;
    await connection.query(sql, [estado, libroId, cantidad]);
};


/* --------------------------------------------------------------------------
   ALTA, MODIFICACIÓN Y BAJA DEL TÍTULO
   -------------------------------------------------------------------------- */

// Alta: el libro, su autor y sus ejemplares. Devuelve el id nuevo.
export const crearLibro = async (datos) => {
    const editorialId = await idEditorial(datos.editorial);
    const autorId = await idAutor(datos.autor);

    const sql = `INSERT INTO libros (isbn, titulo, categoria_id, editorial_id, anio_publicacion, portada_url)
                 VALUES (?, ?, ?, ?, ?, ?)`;
    const [resultado] = await connection.query(sql, [
        datos.isbn, datos.titulo, datos.categoria_id, editorialId, datos.anio_publicacion, datos.portada_url
    ]);
    const id = resultado.insertId;

    await connection.query("INSERT INTO libros_autores (libro_id, autor_id) VALUES (?, ?)", [id, autorId]);
    await agregarEjemplares(id, datos.cantidad, "compra");

    return id;
};

// Modificación del título (el libro tiene que existir).
// El autor solo se cambia si el texto es distinto al actual (así no se pierden los libros con varios autores).
export const actualizarLibro = async (id, datos) => {
    const [libros] = await connection.query(
        `SELECT l.id,
                (SELECT GROUP_CONCAT(a.nombre_completo ORDER BY a.nombre_completo SEPARATOR ', ')
                   FROM libros_autores la JOIN autores a ON a.id = la.autor_id
                  WHERE la.libro_id = l.id) AS autores
         FROM libros l WHERE l.id = ?`,
        [id]
    );

    const editorialId = await idEditorial(datos.editorial);

    const sql = `UPDATE libros
                 SET isbn = ?, titulo = ?, categoria_id = ?, editorial_id = ?, anio_publicacion = ?, portada_url = ?
                 WHERE id = ?`;
    await connection.query(sql, [
        datos.isbn, datos.titulo, datos.categoria_id, editorialId, datos.anio_publicacion, datos.portada_url, id
    ]);

    if (libros[0].autores !== datos.autor) {
        const autorId = await idAutor(datos.autor);
        await connection.query("DELETE FROM libros_autores WHERE libro_id = ?", [id]);
        await connection.query("INSERT INTO libros_autores (libro_id, autor_id) VALUES (?, ?)", [id, autorId]);
    }
};

// Baja (activo = false) o reactivación (activo = true) del título
export const cambiarActivoLibro = async (id, activo) => {
    await connection.query("UPDATE libros SET activo = ? WHERE id = ?", [activo, id]);
};
