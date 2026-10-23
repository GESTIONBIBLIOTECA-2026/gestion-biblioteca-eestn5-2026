/* ==========================================================================
   MÓDULO: libros-ui.js - Plantillas HTML de la gestión de libros · Grupo 6
   Fila de la tabla, opciones de categoría y formularios de la fila desplegable
   (modificar libro y actualizar stock).
   ========================================================================== */

import { escapar } from "./ui.js";

// Estado del libro → [texto, clase CSS de la etiqueta]
export function estadoDelLibro({ activo, ejemplares_totales, ejemplares_disponibles }) {
    if (!activo) return ["De baja", "baja"];
    if (ejemplares_totales === 0) return ["Sin stock", "baja"];
    if (ejemplares_disponibles > 0) return ["Disponible", "disponible"];
    return ["Prestado", "prestado"];
}


// Las <option> de un <select> de categorías (la primera es el texto inicial)
export const crearOpcionesCategoriaHTML = (categorias, textoInicial, idElegido = "") => `
    <option value="">${textoInicial}</option>
    ${categorias.map(({ id, nombre }) => `<option value="${id}"${String(id) === String(idElegido) ? " selected" : ""}>${escapar(nombre)}</option>`).join("")}`;


// Fila de la tabla del catálogo
export function crearFilaLibroHTML(libro) {
    const { id, titulo, autores, isbn, categoria, anio_publicacion, ejemplares_disponibles, ejemplares_totales, activo } = libro;
    const [texto, clase] = estadoDelLibro(libro);

    // El tercer botón da de baja el título o, si ya está de baja, lo reactiva
    const botonEstado = activo
        ? `<button type="button" class="boton-icono peligro" data-accion="baja" data-id="${id}" title="Dar de baja" aria-label="Dar de baja"><i data-lucide="trash-2"></i></button>`
        : `<button type="button" class="boton-icono" data-accion="reactivar" data-id="${id}" title="Reactivar libro" aria-label="Reactivar libro"><i data-lucide="rotate-ccw"></i></button>`;

    return `
        <tr>
            <td>
                <div class="libro-identidad">
                    <div class="libro-portada"><i data-lucide="book"></i></div>
                    <div>
                        <strong>${escapar(titulo)}</strong>
                        <small>${escapar(autores ?? "Sin autor")}</small>
                    </div>
                </div>
            </td>
            <td>${escapar(isbn ?? "—")}</td>
            <td>${escapar(categoria)}</td>
            <td>${anio_publicacion ?? "—"}</td>
            <td>${ejemplares_disponibles} / ${ejemplares_totales}</td>
            <td><span class="estado-libro ${clase}">${texto}</span></td>
            <td>
                <div class="acciones-libro">
                    <button type="button" class="boton-icono" data-accion="editar" data-id="${id}" title="Editar libro" aria-label="Editar libro"><i data-lucide="pencil"></i></button>
                    <button type="button" class="boton-icono" data-accion="stock" data-id="${id}" title="Actualizar stock" aria-label="Actualizar stock"><i data-lucide="layers"></i></button>
                    ${botonEstado}
                </div>
            </td>
        </tr>`;
}


// Fila desplegable que se abre debajo del libro elegido
const crearFilaDetalleHTML = (formulario) => `
    <tr class="fila-detalle">
        <td colspan="7">${formulario}</td>
    </tr>`;

// Un campo de texto con su ícono y el lugar para el mensaje de error
const crearCampoHTML = (etiqueta, nombre, icono, valor, placeholder) => `
    <div class="campo-libro">
        <label>${etiqueta}</label>
        <div class="entrada-con-icono">
            <i data-lucide="${icono}"></i>
            <input type="text" name="${nombre}" value="${escapar(valor)}" placeholder="${placeholder}">
        </div>
        <span class="pista" data-pista="${nombre}"></span>
    </div>`;


// Formulario para modificar los datos del libro (la cantidad de ejemplares se maneja desde el stock)
export function crearFilaEdicionHTML(libro, categorias) {
    const { id, titulo, autores, editorial, isbn, categoria_id, anio_publicacion, portada_url } = libro;

    return crearFilaDetalleHTML(`
        <form class="formulario-fila" data-formulario="editar" data-id="${id}" novalidate>
            <h3>Modificar "${escapar(titulo)}"</h3>
            <div class="campos-formulario-libro">
                ${crearCampoHTML("Título del libro", "titulo", "book-open", titulo, "Ej: El hobbit")}
                ${crearCampoHTML("Autor", "autor", "pen-line", autores ?? "", "Ej: J.R.R. Tolkien")}
                ${crearCampoHTML("Editorial", "editorial", "building-2", editorial ?? "", "Ej: Minotauro")}
                ${crearCampoHTML("ISBN", "isbn", "barcode", isbn ?? "", "Ej: 978-950-490-000-1")}
                <div class="campo-libro">
                    <label>Categoría</label>
                    <div class="entrada-con-icono">
                        <i data-lucide="tag"></i>
                        <select name="categoria_id">${crearOpcionesCategoriaHTML(categorias, "Seleccionar categoría", categoria_id)}</select>
                    </div>
                    <span class="pista" data-pista="categoria_id"></span>
                </div>
                ${crearCampoHTML("Año de edición", "anio_publicacion", "calendar", anio_publicacion ?? "", "Ej: 2019")}
                ${crearCampoHTML("Portada (dirección de la imagen)", "portada_url", "image", portada_url ?? "", "Opcional")}
            </div>
            <div class="acciones-formulario-libro">
                <button type="button" class="boton-secundario" data-accion="cancelar"><i data-lucide="x"></i> Cancelar</button>
                <button type="submit" class="boton-principal"><i data-lucide="save"></i> Guardar cambios</button>
            </div>
        </form>`);
}


// Formulario para agregar ejemplares (compra o donación) o retirarlos de circulación
export function crearFilaStockHTML(libro) {
    const { id, titulo, ejemplares_disponibles, ejemplares_totales, ejemplares_fuera } = libro;

    return crearFilaDetalleHTML(`
        <form class="formulario-fila" data-formulario="stock" data-id="${id}" novalidate>
            <h3>Actualizar stock de "${escapar(titulo)}"</h3>
            <p class="pista">Ahora hay ${ejemplares_disponibles} disponible(s) de ${ejemplares_totales} en circulación y ${ejemplares_fuera} fuera de circulación.</p>
            <div class="campos-formulario-libro">
                <div class="campo-libro">
                    <label>Qué querés hacer</label>
                    <div class="entrada-con-icono">
                        <i data-lucide="layers"></i>
                        <select name="movimiento">
                            <option value="compra">Agregar ejemplares (compra)</option>
                            <option value="donacion">Agregar ejemplares (donación)</option>
                            <option value="extraviado">Retirar: extraviados</option>
                            <option value="baja">Retirar: dañados (baja)</option>
                            <option value="en_reparacion">Retirar: en restauración</option>
                        </select>
                    </div>
                    <span class="pista" data-pista="movimiento"></span>
                </div>
                ${crearCampoHTML("Cantidad de ejemplares", "cantidad", "hash", "1", "Ej: 2")}
            </div>
            <div class="acciones-formulario-libro">
                <button type="button" class="boton-secundario" data-accion="cancelar"><i data-lucide="x"></i> Cancelar</button>
                <button type="submit" class="boton-principal"><i data-lucide="save"></i> Aplicar</button>
            </div>
        </form>`);
}
