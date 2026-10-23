/* ==========================================================================
   MÓDULO: libros.js - Gestión de catálogo (libros.html) · Grupo 6
   Resumen + alta de libros + buscador con filtros + tabla del catálogo.
   Cada fila tiene 3 acciones: modificar, actualizar stock y dar de baja / reactivar.
   Plantillas HTML: libros-ui.js
   ========================================================================== */

import { listarLibros, obtenerCategorias, registrarLibro, modificarLibro, cambiarEstadoLibro, modificarStock } from "./api.js";
import { crearFilaMensajeHTML, mostrarAviso, marcarCampos } from "./ui.js";
import { estadoDelLibro, crearOpcionesCategoriaHTML, crearFilaLibroHTML, crearFilaEdicionHTML, crearFilaStockHTML } from "./libros-ui.js";

// 🎯 1. Nodos del DOM
const formularioLibro      = document.querySelector("#formularioLibro");
const categoriaLibro       = document.querySelector("#categoriaLibro");
const formularioFiltros    = document.querySelector("#formularioFiltros");
const campoBusqueda        = document.querySelector("#campoBusqueda");
const filtroCategoria      = document.querySelector("#filtroCategoria");
const filtroDisponibilidad = document.querySelector("#filtroDisponibilidad");
const cuerpoLibros         = document.querySelector("#cuerpoLibros");

// 🧠 2. Estado
const CAMPOS_LIBRO = ["titulo", "autor", "editorial", "isbn", "categoria_id", "anio_publicacion", "portada_url"];
let libros = [];
let categorias = [];
let accionAbierta = null;   // fila desplegable abierta: { id, tipo: "editar" | "stock" }


// 🎨 3. Funciones de UI

// Lee los campos de un formulario por su atributo name → { titulo: "...", autor: "..." }
function leerCampos(formulario, nombres) {
    const datos = {};
    nombres.forEach((nombre) => { datos[nombre] = formulario.querySelector(`[name="${nombre}"]`).value; });
    return datos;
}

function vaciarCampos(formulario) {
    formulario.querySelectorAll("input, select").forEach((campo) => { campo.value = ""; });
}

// Los 4 números de arriba. Los ejemplares de un título dado de baja cuentan como "de baja".
function mostrarResumen() {
    const activos = libros.filter((libro) => libro.activo);
    const dadosDeBaja = libros.filter((libro) => !libro.activo);
    const sumar = (lista, campo) => lista.reduce((suma, libro) => suma + libro[campo], 0);

    document.querySelector("#totalTitulos").textContent = activos.length;
    document.querySelector("#totalEjemplares").textContent = sumar(activos, "ejemplares_totales");
    document.querySelector("#totalDisponibles").textContent = sumar(activos, "ejemplares_disponibles");
    document.querySelector("#totalFuera").textContent = sumar(libros, "ejemplares_fuera") + sumar(dadosDeBaja, "ejemplares_totales");
}

// Filtros combinados: texto (título o autor) + categoría + disponibilidad
function filtrarLibros() {
    const texto = campoBusqueda.value.trim().toLowerCase();

    return libros.filter((libro) => {
        const textoDelLibro = `${libro.titulo} ${libro.autores ?? ""}`.toLowerCase();
        const coincideTexto = textoDelLibro.includes(texto);
        const coincideCategoria = filtroCategoria.value === "" || String(libro.categoria_id) === filtroCategoria.value;
        const coincideEstado = filtroDisponibilidad.value === "" || estadoDelLibro(libro)[1] === filtroDisponibilidad.value;

        return coincideTexto && coincideCategoria && coincideEstado;
    });
}

// Dibuja la tabla: cada libro y, debajo del elegido, su fila desplegable
function mostrarTabla() {
    const lista = filtrarLibros();

    if (lista.length === 0) {
        cuerpoLibros.innerHTML = crearFilaMensajeHTML("No se encontraron libros.", 7);
        return;
    }

    cuerpoLibros.innerHTML = lista.map((libro) => {
        let detalle = "";

        if (accionAbierta?.id === libro.id) {
            detalle = accionAbierta.tipo === "editar" ? crearFilaEdicionHTML(libro, categorias) : crearFilaStockHTML(libro);
        }

        return crearFilaLibroHTML(libro) + detalle;
    }).join("");

    window.lucide?.createIcons();   // dibuja los íconos de las filas nuevas
}


// 🌐 4. Carga de datos (Loading → Éxito → Error)
async function cargarCategorias() {
    try {
        const respuesta = await obtenerCategorias();
        categorias = respuesta.payload;

        categoriaLibro.innerHTML = crearOpcionesCategoriaHTML(categorias, "Seleccionar categoría");
        filtroCategoria.innerHTML = crearOpcionesCategoriaHTML(categorias, "Categoría");

    } catch (error) {
        mostrarAviso(error.status ? error.message : "No se pudieron cargar las categorías.", true);
    }
}

async function cargarLibros() {
    cuerpoLibros.innerHTML = crearFilaMensajeHTML("Cargando catálogo...", 7);

    try {
        const respuesta = await listarLibros();
        libros = respuesta.payload;

        mostrarResumen();
        mostrarTabla();

    } catch (error) {
        cuerpoLibros.innerHTML = crearFilaMensajeHTML(error.status ? error.message : "No hay conexión con el servidor.", 7);
    }
}

// Cierra la fila desplegable, avisa y vuelve a pedir el catálogo
function terminarAccion(mensaje) {
    accionAbierta = null;
    mostrarAviso(mensaje);
    cargarLibros();
}


// 🖱️ 5. Eventos

// Registrar libro nuevo
formularioLibro.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    marcarCampos(formularioLibro);

    try {
        const respuesta = await registrarLibro(leerCampos(formularioLibro, [...CAMPOS_LIBRO, "cantidad"]));

        vaciarCampos(formularioLibro);
        terminarAccion(respuesta.mensaje);

    } catch (error) {
        marcarCampos(formularioLibro, error.campos);
        mostrarAviso(error.status ? error.message : "No hay conexión con el servidor.", true);
    }
});

formularioLibro.addEventListener("reset", () => marcarCampos(formularioLibro));

// Buscador: al escribir, al cambiar un filtro y con el botón Buscar
formularioFiltros.addEventListener("submit", (evento) => { evento.preventDefault(); mostrarTabla(); });
campoBusqueda.addEventListener("input", mostrarTabla);
filtroCategoria.addEventListener("change", mostrarTabla);
filtroDisponibilidad.addEventListener("change", mostrarTabla);
formularioFiltros.addEventListener("reset", () => setTimeout(mostrarTabla));   // espera a que el navegador vacíe los campos

// Botones de cada fila (delegación: un solo listener para toda la tabla)
cuerpoLibros.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) return;

    const accion = boton.dataset.accion;
    const id = Number(boton.dataset.id);

    // Modificar y stock abren (o cierran) la fila desplegable
    if (accion === "editar" || accion === "stock") {
        const yaAbierta = accionAbierta?.id === id && accionAbierta.tipo === accion;
        accionAbierta = yaAbierta ? null : { id, tipo: accion };
        mostrarTabla();
        return;
    }

    if (accion === "cancelar") {
        accionAbierta = null;
        mostrarTabla();
        return;
    }

    // Dar de baja o reactivar el título
    try {
        const respuesta = await cambiarEstadoLibro(id, accion === "baja" ? "baja" : "activo");
        terminarAccion(respuesta.mensaje);

    } catch (error) {
        mostrarAviso(error.status ? error.message : "No hay conexión con el servidor.", true);
    }
});

// Guardar los cambios de la fila desplegable (modificar libro o actualizar stock)
cuerpoLibros.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const formulario = evento.target;
    const id = Number(formulario.dataset.id);
    marcarCampos(formulario);

    try {
        let respuesta;

        if (formulario.dataset.formulario === "editar") {
            respuesta = await modificarLibro(id, leerCampos(formulario, CAMPOS_LIBRO));
        } else {
            const datos = leerCampos(formulario, ["movimiento", "cantidad"]);
            respuesta = await modificarStock(id, datos.movimiento, datos.cantidad);
        }

        terminarAccion(respuesta.mensaje);

    } catch (error) {
        marcarCampos(formulario, error.campos);
        mostrarAviso(error.status ? error.message : "No hay conexión con el servidor.", true);
    }
});


// 🚀 6. Inicialización
cargarCategorias();
cargarLibros();
