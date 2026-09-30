/* ==========================================================================
   MÓDULO: nuevo-prestamo.js - Formulario "Nuevo préstamo"
   - Con el DNI trae el nombre del usuario y avisa si puede llevarse libros
   - Con el ID trae el nombre del libro y su stock
   - Al enviar registra el préstamo en la base (POST /api/prestamos)
   ========================================================================== */

import { buscarUsuarioPorDni, buscarLibroPorId, registrarPrestamo } from "./api.js";
import { borrarSesion } from "./storage.js";
import { fechaCorta } from "./fechas.js";


// ==========================================================================
// 🎯 1. Nodos del DOM
// ==========================================================================
const formulario    = document.querySelector("#formularioPrestamo");
const campoDni      = document.querySelector("#dniUsuario");
const campoNombre   = document.querySelector("#nombreUsuario");
const ayudaUsuario  = document.querySelector("#ayudaUsuario");
const campoIdLibro  = document.querySelector("#idLibro");
const campoTitulo   = document.querySelector("#nombreLibro");
const ayudaLibro    = document.querySelector("#ayudaLibro");
const boton         = document.querySelector("#botonPrestamo");
const aviso         = document.querySelector("#avisoPrestamo");
const textoAviso    = document.querySelector("#textoAviso");


// ==========================================================================
// 🎨 2. Funciones de UI
// ==========================================================================
function mostrarAyuda(elemento, texto, tipo = "") {
    elemento.textContent = texto;
    elemento.className = `ayuda-campo ${tipo}`;
}

function mostrarAviso(texto, exito = false) {
    textoAviso.textContent = texto;
    aviso.classList.toggle("exito", exito);
    aviso.hidden = false;
}

function ocultarAviso() {
    aviso.hidden = true;
}

function ponerCargando(cargando) {
    boton.disabled = cargando;
}

// "42.345.678" → "42345678"
const limpiarDni = (texto) => texto.replace(/[.\s]/g, "");

// Error de red (sin status) → mensaje genérico. 401 → la sesión venció.
function mensajeDeError(error) {

    if (error.status === 401) {
        borrarSesion();
        window.location.replace("login.html");
    }

    return error.status ? error.message : "No hay conexión con el servidor. Probá de nuevo.";
}


// ==========================================================================
// 🌐 3. Autocompletar usuario y libro
// ==========================================================================

// Para ignorar respuestas viejas si el usuario escribe rápido
let consultaUsuario = 0;
let consultaLibro = 0;


async function completarUsuario() {

    const dni = limpiarDni(campoDni.value);
    const numero = ++consultaUsuario;

    campoNombre.value = "";

    if (!dni) {
        mostrarAyuda(ayudaUsuario, "");
        return;
    }

    if (!/^\d{6,10}$/.test(dni)) {
        mostrarAyuda(ayudaUsuario, "El DNI tiene que tener entre 6 y 10 números.", "error");
        return;
    }

    mostrarAyuda(ayudaUsuario, "Buscando usuario...");

    try {
        const usuario = await buscarUsuarioPorDni(dni);
        if (numero !== consultaUsuario) return;

        campoNombre.value = usuario.nombre_completo;

        const curso = usuario.curso ? ` · ${usuario.curso}` : "";

        if (usuario.puede_pedir) {
            mostrarAyuda(ayudaUsuario, `Habilitado${curso}`, "ok");
        } else if (usuario.estado !== "habilitado") {
            mostrarAyuda(ayudaUsuario, `Usuario ${usuario.estado === "baja" ? "dado de baja" : "suspendido"}${curso}`, "error");
        } else if (usuario.sanciones_activas > 0) {
            mostrarAyuda(ayudaUsuario, `Tiene una sanción activa${curso}`, "error");
        } else {
            mostrarAyuda(ayudaUsuario, `Tiene un préstamo atrasado sin devolver${curso}`, "error");
        }

    } catch (error) {
        if (numero !== consultaUsuario) return;
        mostrarAyuda(ayudaUsuario, mensajeDeError(error), "error");
    }
}


async function completarLibro() {

    const id = campoIdLibro.value.trim();
    const numero = ++consultaLibro;

    campoTitulo.value = "";

    if (!id) {
        mostrarAyuda(ayudaLibro, "");
        return;
    }

    if (!/^[1-9]\d*$/.test(id)) {
        mostrarAyuda(ayudaLibro, "El ID del libro tiene que ser un número.", "error");
        return;
    }

    mostrarAyuda(ayudaLibro, "Buscando libro...");

    try {
        const libro = await buscarLibroPorId(id);
        if (numero !== consultaLibro) return;

        campoTitulo.value = libro.titulo;

        const autores = libro.autores ? ` · ${libro.autores}` : "";

        if (libro.stock_reservable > 0) {
            const plural = libro.stock_reservable === 1 ? "ejemplar disponible" : "ejemplares disponibles";
            mostrarAyuda(ayudaLibro, `${libro.stock_reservable} ${plural}${autores}`, "ok");
        } else {
            mostrarAyuda(ayudaLibro, `Sin ejemplares disponibles${autores}`, "error");
        }

    } catch (error) {
        if (numero !== consultaLibro) return;
        mostrarAyuda(ayudaLibro, mensajeDeError(error), "error");
    }
}


// ==========================================================================
// 🖱️ 4. Eventos
// ==========================================================================

// Al salir del campo (o al apretar Enter) se busca en la base
campoDni.addEventListener("change", completarUsuario);
campoIdLibro.addEventListener("change", completarLibro);


// 💾 Registrar el préstamo
formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();
    ocultarAviso();

    const dni = limpiarDni(campoDni.value);
    const libroId = campoIdLibro.value.trim();

    if (!dni || !libroId) {
        mostrarAviso("Completá el DNI del usuario y el ID del libro.");
        return;
    }

    ponerCargando(true);

    try {
        // POST /api/prestamos
        const prestamo = await registrarPrestamo(dni, libroId);

        mostrarAviso(
            `Préstamo registrado: "${prestamo.titulo}" (ejemplar ${prestamo.codigo_inventario}) para ` +
            `${prestamo.nombre_completo}. Tiene que devolverlo hasta el ${fechaCorta(prestamo.fecha_devolucion_estimada)}.`,
            true
        );

        // Formulario limpio para el próximo préstamo
        formulario.reset();
        mostrarAyuda(ayudaUsuario, "");
        mostrarAyuda(ayudaLibro, "");
        campoDni.focus();

    } catch (error) {
        mostrarAviso(mensajeDeError(error));

    } finally {
        ponerCargando(false);
    }
});
