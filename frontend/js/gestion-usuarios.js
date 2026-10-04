/* ==========================================================================
   MÓDULO: gestion-usuarios.js - Pantalla "Gestión de Usuarios" (Grupo 5)
   - Alta y modificación ............ POST / PUT  /api/usuarios
   - Búsqueda avanzada + filtros .... GET          /api/usuarios?nombre=&dni=&curso=&filtro=
   - Ficha e historial activo ....... GET          /api/usuarios/:id/historial
   - Suspender / habilitar / baja ... PATCH        /api/usuarios/:id/estado  ·  DELETE /api/usuarios/:id
   ========================================================================== */

import {
    listarUsuarios, obtenerUsuario, obtenerHistorialUsuario, registrarUsuario,
    modificarUsuario, cambiarEstadoUsuario, darDeBajaUsuario, obtenerCursos
} from "./api.js";
import { obtenerSesion, borrarSesion } from "./storage.js";
import {
    crearFilaUsuario, crearFilaMensaje, crearPaginacion, dibujarFicha,
    dibujarFichaMensaje, crearIcono, refrescarIconos
} from "./usuarios-ui.js";


// ==========================================================================
// 🎯 1. Nodos del DOM
// ==========================================================================

// --- Formulario de alta / modificación ---
const tarjetaFormulario   = document.querySelector("#alta");
const formulario          = document.querySelector("#formularioUsuario");
const tituloFormulario    = document.querySelector("#tituloFormulario");
const subtituloFormulario = document.querySelector("#subtituloFormulario");
const marcaEdicion        = document.querySelector("#marcaEdicion");
const alertaFormulario    = document.querySelector("#alertaFormulario");
const textoAlerta         = document.querySelector("#textoAlertaFormulario");
const campoNombre         = document.querySelector("#campoNombre");
const campoRol            = document.querySelector("#campoRol");
const campoCurso          = document.querySelector("#campoCurso");
const campoClave          = document.querySelector("#campoClave");
const etiquetaClave       = document.querySelector("#etiquetaClave");
const pistaClave          = document.querySelector('[data-pista="clave"]');
const botonVerClave       = document.querySelector("#botonVerClave");
const botonCancelar       = document.querySelector("#botonCancelar");
const botonGuardar        = document.querySelector("#botonGuardar");

// --- Búsqueda y filtros ---
const formularioBusqueda  = document.querySelector("#formularioBusqueda");
const buscarNombre        = document.querySelector("#buscarNombre");
const buscarDni           = document.querySelector("#buscarDni");
const buscarCurso         = document.querySelector("#buscarCurso");
const botonLimpiar        = document.querySelector("#botonLimpiar");
const chipsFiltro         = document.querySelector("#chipsFiltro");
const listaCursos         = document.querySelector("#listaCursos");

// --- Listado ---
const cuerpoTabla         = document.querySelector("#cuerpoUsuarios");
const descripcionListado  = document.querySelector("#descripcionListado");
const cantidadUsuarios    = document.querySelector("#cantidadUsuarios");
const textoPaginacion     = document.querySelector("#textoPaginacion");
const paginacion          = document.querySelector("#paginacion");

// --- Ficha del usuario ---
const dialogoFicha        = document.querySelector("#dialogoFicha");
const nodosFicha = {
    iniciales: document.querySelector("#fichaIniciales"),
    nombre:    document.querySelector("#fichaNombre"),
    subtitulo: document.querySelector("#fichaSubtitulo"),
    cuerpo:    document.querySelector("#fichaCuerpo"),
    acciones:  document.querySelector("#fichaAcciones")
};

// --- Suspender y dar de baja ---
const dialogoSuspender    = document.querySelector("#dialogoSuspender");
const formularioSuspender = document.querySelector("#formularioSuspender");
const tituloSuspender     = document.querySelector("#tituloSuspender");
const campoMotivo         = document.querySelector("#campoMotivo");
const botonSuspender      = document.querySelector("#botonSuspender");
const dialogoBaja         = document.querySelector("#dialogoBaja");
const tituloBaja          = document.querySelector("#tituloBaja");
const textoBaja           = document.querySelector("#textoBaja");
const botonConfirmarBaja  = document.querySelector("#botonConfirmarBaja");

// --- Aviso flotante y anuncios para lectores de pantalla ---
const avisoFlotante       = document.querySelector("#avisoFlotante");
const avisoIcono          = document.querySelector("#avisoIcono");
const avisoTexto          = document.querySelector("#avisoTexto");
const anuncio             = document.querySelector("#anuncio");
const anuncioFicha        = document.querySelector("#anuncioFicha");


// ==========================================================================
// 🧠 2. Estado en memoria
// ==========================================================================
const estado = {
    filtro: "todos",
    pagina: 1,
    usuarios: [],         // usuarios de la página que se está viendo
    editandoId: null,     // null = alta · número = se está modificando ese usuario
    fichaUsuario: null,   // usuario abierto en la ficha
    accionUsuario: null   // usuario que se va a suspender o dar de baja
};

// ID del administrador logueado (no puede suspenderse ni darse de baja a sí mismo)
const idPropio = obtenerSesion()?.usuario?.id ?? null;

const FILTROS = {
    todos:           "Todos los usuarios activos, ordenados por nombre.",
    alumnos:         "Alumnos activos.",
    docentes:        "Docentes activos.",
    administradores: "Administradores (bibliotecarios).",
    morosos:         "Usuarios con un préstamo atrasado sin devolver.",
    suspendidos:     "Usuarios que no pueden pedir libros: suspendidos, con una sanción en vigor o con un préstamo atrasado.",
    bajas:           "Usuarios dados de baja: su historial se conserva y se pueden reactivar."
};

// Números de pedido: si llegan respuestas viejas (clics o teclas rápidas), se ignoran
let numeroConsulta = 0;        // listado
let numeroFicha = 0;           // ficha
let numeroEdicion = 0;         // usuario a editar

let cambiandoEstado = false;   // evita mandar dos veces "Habilitar" con un doble clic
let esperaBusqueda = null;     // temporizador de la búsqueda mientras se escribe
let esperaAviso = null;        // temporizador del aviso flotante


// ==========================================================================
// 🎨 3. Funciones de UI
// ==========================================================================

/* --- Resultado de una acción (tipo: "exito" | "error" | "info")
       - Con la ficha abierta: mensaje arriba de la ficha (lo de afuera queda tapado por la ventana)
       - Si no: aviso flotante abajo a la derecha que se va solo --- */
function mostrarAviso(texto, tipo = "exito") {

    const iconos = { exito: "circle-check", error: "circle-alert", info: "info" };

    anunciar(texto);

    if (dialogoFicha.open) {
        const colores = { exito: "exito", error: "peligro", info: "aviso" };
        const alerta = document.createElement("div");

        alerta.className = `alerta ${colores[tipo]} alerta-resultado`;
        alerta.append(crearIcono(iconos[tipo]), document.createTextNode(texto));

        nodosFicha.cuerpo.querySelector(".alerta-resultado")?.remove();
        nodosFicha.cuerpo.prepend(alerta);
        nodosFicha.cuerpo.scrollTop = 0;

        refrescarIconos();
        return;
    }

    avisoFlotante.className = `aviso-flotante ${tipo}`;
    avisoIcono.replaceChildren(crearIcono(iconos[tipo]));
    avisoTexto.textContent = texto;
    avisoFlotante.hidden = false;
    refrescarIconos();

    clearTimeout(esperaAviso);
    esperaAviso = setTimeout(() => { avisoFlotante.hidden = true; }, 7000);
}


/* --- Lectores de pantalla: la región tiene que existir ANTES de cambiarle el texto para que lo lean.
       Con la ficha abierta, lo de afuera queda bloqueado: se usa la región de adentro de la ficha. --- */
function anunciar(texto) {

    const region = dialogoFicha.open ? anuncioFicha : anuncio;

    region.textContent = "";
    setTimeout(() => { region.textContent = texto; }, 100);
}


/* --- Error de red (sin status) → mensaje genérico. 401 → la sesión venció. --- */
function mensajeDeError(error) {

    if (error.status === 401) {
        borrarSesion();
        window.location.replace("login.html");
    }

    return error.status ? error.message : "No hay conexión con el servidor. Probá de nuevo.";
}


/* --- Errores de validación: borde rojo + mensaje debajo de cada campo --- */
function limpiarErrores(formularioActual) {

    formularioActual.querySelectorAll(".campo.error").forEach((campo) => campo.classList.remove("error"));
    formularioActual.querySelectorAll("[aria-invalid]").forEach((entrada) => entrada.removeAttribute("aria-invalid"));
    formularioActual.querySelectorAll(".pista").forEach((pista) => { pista.textContent = pista.dataset.ayuda ?? ""; });
}

function marcarErrores(formularioActual, campos) {

    Object.entries(campos).forEach(([nombre, mensaje]) => {

        const entrada = formularioActual.elements[nombre];
        const campo = entrada?.closest(".campo");

        if (!campo) return;

        campo.classList.add("error");
        campo.querySelector(".pista").textContent = mensaje;

        // El lector de pantalla avisa que el campo está mal y lee el mensaje (aria-describedby)
        entrada.setAttribute("aria-invalid", "true");
    });

    // Llevar el foco al primer campo con error
    formularioActual.querySelector(".campo.error input, .campo.error select, .campo.error textarea")?.focus();
}


function mostrarAlertaFormulario(texto) {
    textoAlerta.textContent = texto;
    alertaFormulario.hidden = false;
}


/* --- El curso solo se carga para los alumnos --- */
function actualizarCampoCurso() {

    const esAlumno = campoRol.value === "alumno";

    campoCurso.disabled = !esAlumno;
    campoCurso.placeholder = esAlumno ? "Ej: 7mo 5ta" : "Solo para alumnos";

    if (!esAlumno) campoCurso.value = "";
}


/* --- Texto e ícono del botón principal del formulario --- */
function textoBotonGuardar(texto, icono) {
    botonGuardar.replaceChildren(crearIcono(icono), document.createTextNode(` ${texto}`));
    refrescarIconos();
}


/* --- Formulario en modo ALTA --- */
function modoAlta() {

    estado.editandoId = null;
    numeroEdicion++;     // si se estaba cargando un usuario para editar, se descarta

    formulario.reset();
    limpiarErrores(formulario);
    alertaFormulario.hidden = true;

    tituloFormulario.textContent = "Registrar usuario";
    subtituloFormulario.textContent = "Completá los datos para dar de alta un usuario nuevo.";
    marcaEdicion.hidden = true;
    tarjetaFormulario.classList.remove("editando");

    etiquetaClave.textContent = "Contraseña inicial";
    pistaClave.dataset.ayuda = "Con esta clave el usuario entra a la app.";
    pistaClave.textContent = pistaClave.dataset.ayuda;

    // La contraseña vuelve a quedar oculta
    campoClave.type = "password";
    botonVerClave.setAttribute("aria-label", "Mostrar contraseña");
    botonVerClave.replaceChildren(crearIcono("eye"));

    textoBotonGuardar("Registrar usuario", "user-plus");
    actualizarCampoCurso();
}


/* --- Formulario en modo MODIFICACIÓN con los datos del usuario --- */
function modoEdicion(usuario) {

    modoAlta();
    estado.editandoId = usuario.id;

    formulario.elements.nombre_completo.value = usuario.nombre_completo;
    formulario.elements.dni.value = usuario.dni;
    formulario.elements.rol.value = usuario.rol;
    formulario.elements.correo.value = usuario.correo;
    formulario.elements.telefono.value = usuario.telefono;
    formulario.elements.direccion.value = usuario.direccion;

    actualizarCampoCurso();
    campoCurso.value = usuario.curso ?? "";

    tituloFormulario.textContent = "Modificar usuario";
    subtituloFormulario.textContent = `Estás editando los datos de ${usuario.nombre_completo}.`;
    marcaEdicion.hidden = false;
    tarjetaFormulario.classList.add("editando");

    etiquetaClave.textContent = "Nueva contraseña (opcional)";
    pistaClave.dataset.ayuda = "Dejala vacía para no cambiarla.";
    pistaClave.textContent = pistaClave.dataset.ayuda;

    textoBotonGuardar("Guardar cambios", "save");

    tarjetaFormulario.scrollIntoView({ behavior: "smooth", block: "start" });
    campoNombre.focus({ preventScroll: true });
}


/* --- Chips: marca el filtro activo --- */
function marcarFiltro(filtro) {

    chipsFiltro.querySelectorAll(".chip").forEach((chip) => {
        const activo = chip.dataset.filtro === filtro;
        chip.classList.toggle("activo", activo);
        chip.setAttribute("aria-pressed", String(activo));
    });

    descripcionListado.textContent = FILTROS[filtro];
}


/* --- Cantidades de cada chip (vienen del backend) --- */
function mostrarContadores(contadores) {

    Object.entries(contadores).forEach(([filtro, cantidad]) => {
        const span = chipsFiltro.querySelector(`[data-cantidad="${filtro}"]`);
        if (span) span.textContent = cantidad;
    });
}


/* --- Tabla, contador y paginación --- */
function mostrarListado({ usuarios, total, pagina, por_pagina: porPagina, total_paginas: totalPaginas, contadores }) {

    estado.usuarios = usuarios;
    estado.pagina = pagina;

    mostrarContadores(contadores);
    cantidadUsuarios.textContent = total === 1 ? "1 usuario" : `${total} usuarios`;

    if (usuarios.length === 0) {
        const hayBusqueda = buscarNombre.value || buscarDni.value || buscarCurso.value;
        cuerpoTabla.replaceChildren(crearFilaMensaje(
            hayBusqueda ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios en este filtro."
        ));
        textoPaginacion.textContent = "";
        paginacion.replaceChildren();
        return;
    }

    cuerpoTabla.replaceChildren(...usuarios.map((usuario) => crearFilaUsuario(usuario, usuario.id === idPropio)));

    const desde = (pagina - 1) * porPagina + 1;
    const hasta = desde + usuarios.length - 1;
    textoPaginacion.textContent = `Mostrando ${desde}–${hasta} de ${total}`;

    paginacion.replaceChildren(...crearPaginacion(pagina, totalPaginas));

    refrescarIconos();
}


/* --- Cursos de la base en el autocompletado --- */
function mostrarCursos(cursos) {

    const opciones = cursos.map(({ nombre }) => {
        const opcion = document.createElement("option");
        opcion.value = nombre;
        return opcion;
    });

    listaCursos.replaceChildren(...opciones);
}


/* --- Busca un usuario ya cargado (en la tabla o en la ficha) --- */
function usuarioEnMemoria(id) {
    return estado.usuarios.find((usuario) => usuario.id === id)
        ?? (estado.fichaUsuario?.id === id ? estado.fichaUsuario : null);
}


// ==========================================================================
// 🌐 4. Conexión con el backend
// ==========================================================================

/* --- Listado con la búsqueda y el filtro actuales --- */
async function cargarUsuarios() {

    const numero = ++numeroConsulta;

    try {
        const resultado = await listarUsuarios({
            nombre: buscarNombre.value.trim(),
            dni: buscarDni.value.replace(/[.\s]/g, ""),
            curso: buscarCurso.value.trim(),
            filtro: estado.filtro,
            pagina: estado.pagina
        });

        // Si mientras tanto se pidió otra búsqueda, esta respuesta ya no sirve
        if (numero !== numeroConsulta) return;

        mostrarListado(resultado);

    } catch (error) {
        if (numero !== numeroConsulta) return;

        cuerpoTabla.replaceChildren(crearFilaMensaje(mensajeDeError(error)));
        cantidadUsuarios.textContent = "-";
        textoPaginacion.textContent = "";
        paginacion.replaceChildren();
    }
}


/* --- Busca desde la página 1 (al escribir, cambiar de filtro o limpiar) --- */
function buscarDesdeElPrincipio() {
    clearTimeout(esperaBusqueda);
    estado.pagina = 1;
    cargarUsuarios();
}


async function cargarCursos() {
    try {
        mostrarCursos(await obtenerCursos());
    } catch (error) {
        // Sin cursos igual se puede escribir el curso a mano
        mensajeDeError(error);
    }
}


/* --- Alta o modificación --- */
async function guardarUsuario() {

    limpiarErrores(formulario);
    alertaFormulario.hidden = true;

    // FormData toma los campos por su "name" (los deshabilitados, como el curso de un docente, no van)
    const datos = Object.fromEntries(new FormData(formulario));
    const editando = estado.editandoId;

    botonGuardar.disabled = true;

    try {
        const respuesta = editando
            ? await modificarUsuario(editando, datos)
            : await registrarUsuario(datos);

        mostrarAviso(respuesta.mensaje);
        modoAlta();

        await Promise.all([cargarUsuarios(), cargarCursos()]);

        // Si la ficha de ese usuario estaba abierta, se actualiza
        if (dialogoFicha.open && estado.fichaUsuario?.id === respuesta.payload.id) {
            abrirFicha(respuesta.payload.id);
        }

    } catch (error) {
        mostrarAlertaFormulario(mensajeDeError(error));

        if (error.campos) marcarErrores(formulario, error.campos);

    } finally {
        botonGuardar.disabled = false;
    }
}


/* --- Carga un usuario en el formulario para modificarlo --- */
async function editarUsuario(id) {

    const numero = ++numeroEdicion;

    try {
        // Se piden los datos frescos a la base (pudieron cambiar desde que se cargó la tabla)
        const usuario = await obtenerUsuario(id);

        if (numero !== numeroEdicion) return;     // mientras tanto se eligió otro usuario o se canceló

        modoEdicion(usuario);

    } catch (error) {
        if (numero !== numeroEdicion) return;

        mostrarAviso(mensajeDeError(error), "error");
    }
}


/* --- Ficha con el historial activo --- */
async function abrirFicha(id) {

    const numero = ++numeroFicha;

    if (!dialogoFicha.open) {
        dibujarFichaMensaje(nodosFicha, "Cargando historial...");
        dialogoFicha.showModal();
    }

    try {
        const historial = await obtenerHistorialUsuario(id);

        if (numero !== numeroFicha) return;       // se cerró o se abrió la de otro usuario

        estado.fichaUsuario = historial.usuario;
        dibujarFicha(nodosFicha, historial, historial.usuario.id === idPropio);

    } catch (error) {
        if (numero !== numeroFicha) return;

        dibujarFichaMensaje(nodosFicha, mensajeDeError(error));
    }
}


/* --- Después de suspender / habilitar / dar de baja: refrescar + aviso --- */
async function despuesDeCambiarEstado(respuesta) {

    const usuario = respuesta.payload;
    const tipoAviso = usuario.condicion === "habilitado" || usuario.condicion === "baja" ? "exito" : "info";

    await cargarUsuarios();

    // Si la acción se hizo desde la ficha, se vuelve a dibujar con los datos nuevos
    if (dialogoFicha.open && estado.fichaUsuario?.id === usuario.id) {
        await abrirFicha(usuario.id);
    }

    mostrarAviso(respuesta.mensaje, tipoAviso);
}


/* --- Suspender: primero se pide el motivo --- */
function pedirSuspension(usuario) {

    estado.accionUsuario = usuario;

    limpiarErrores(formularioSuspender);
    tituloSuspender.textContent = `Suspender a ${usuario.nombre_completo}`;
    campoMotivo.value = usuario.prestamos_atrasados > 0 ? "Tiene un préstamo atrasado sin devolver." : "";

    dialogoSuspender.showModal();
    campoMotivo.focus();
}

async function confirmarSuspension() {

    const usuario = estado.accionUsuario;

    limpiarErrores(formularioSuspender);
    botonSuspender.disabled = true;

    try {
        const respuesta = await cambiarEstadoUsuario(usuario.id, "suspendido", campoMotivo.value);

        dialogoSuspender.close();
        await despuesDeCambiarEstado(respuesta);

    } catch (error) {
        const mensaje = mensajeDeError(error);

        if (error.campos) {
            marcarErrores(formularioSuspender, error.campos);
        } else {
            dialogoSuspender.close();
            mostrarAviso(mensaje, "error");
        }

    } finally {
        botonSuspender.disabled = false;
    }
}


/* --- Habilitar (levanta la suspensión) o reactivar (después de una baja) --- */
async function habilitarUsuario(usuario) {

    if (cambiandoEstado) return;     // doble clic: el primero ya está en camino

    cambiandoEstado = true;

    try {
        const respuesta = await cambiarEstadoUsuario(usuario.id, "habilitado");
        await despuesDeCambiarEstado(respuesta);

    } catch (error) {
        mostrarAviso(mensajeDeError(error), "error");

    } finally {
        cambiandoEstado = false;
    }
}


/* --- Dar de baja: primero se confirma --- */
function pedirBaja(usuario) {

    estado.accionUsuario = usuario;

    tituloBaja.textContent = `¿Dar de baja a ${usuario.nombre_completo}?`;
    textoBaja.textContent = "No va a poder pedir libros ni entrar a la app. No se borra: su historial "
        + "se conserva y lo podés reactivar desde el filtro «Dados de baja». "
        + "Si tiene reservas sin retirar, se cancelan.";

    dialogoBaja.showModal();
}

async function confirmarBaja() {

    const usuario = estado.accionUsuario;

    botonConfirmarBaja.disabled = true;

    try {
        const respuesta = await darDeBajaUsuario(usuario.id);

        dialogoBaja.close();
        await despuesDeCambiarEstado(respuesta);

    } catch (error) {
        dialogoBaja.close();
        mostrarAviso(mensajeDeError(error), "error");

    } finally {
        botonConfirmarBaja.disabled = false;
    }
}


/* --- Botones de la tabla y de la ficha (data-accion + data-id) --- */
async function ejecutarAccion(accion, id) {

    if (accion === "ver") return abrirFicha(id);

    if (accion === "editar") {
        if (dialogoFicha.open) dialogoFicha.close();
        return editarUsuario(id);
    }

    const usuario = usuarioEnMemoria(id) ?? await obtenerUsuario(id).catch(() => null);

    if (!usuario) {
        mostrarAviso("No se encontró el usuario. Actualizá la página.", "error");
        return;
    }

    if (accion === "suspender") return pedirSuspension(usuario);
    if (accion === "habilitar") return habilitarUsuario(usuario);
    if (accion === "baja") return pedirBaja(usuario);
}


// ==========================================================================
// 🖱️ 5. Eventos
// ==========================================================================

// 💾 Guardar (alta o modificación)
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    guardarUsuario();
});

// ✖️ Cancelar: vuelve al modo alta con el formulario vacío
botonCancelar.addEventListener("click", modoAlta);

// 🎓 El curso se habilita solo para alumnos
campoRol.addEventListener("change", actualizarCampoCurso);

// 👁️ Mostrar / ocultar contraseña
botonVerClave.addEventListener("click", () => {

    const oculta = campoClave.type === "password";

    campoClave.type = oculta ? "text" : "password";
    botonVerClave.setAttribute("aria-label", oculta ? "Ocultar contraseña" : "Mostrar contraseña");
    botonVerClave.replaceChildren(crearIcono(oculta ? "eye-off" : "eye"));

    refrescarIconos();
});

// Al corregir un campo con error, se le saca el rojo
function quitarErrorDelCampo(evento) {

    const campo = evento.target.closest(".campo.error");

    if (!campo) return;

    campo.classList.remove("error");
    evento.target.removeAttribute("aria-invalid");

    const pista = campo.querySelector(".pista");
    pista.textContent = pista.dataset.ayuda ?? "";
}

formulario.addEventListener("input", quitarErrorDelCampo);


// 🔍 Búsqueda: con Enter / botón "Buscar" al instante; mientras se escribe, con una pausa
formularioBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault();
    buscarDesdeElPrincipio();
});

formularioBusqueda.addEventListener("input", () => {
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(buscarDesdeElPrincipio, 350);
});

botonLimpiar.addEventListener("click", () => {
    formularioBusqueda.reset();
    estado.filtro = "todos";
    marcarFiltro(estado.filtro);
    buscarDesdeElPrincipio();
});


// 🏷️ Filtros rápidos (delegación de eventos)
chipsFiltro.addEventListener("click", (evento) => {

    const chip = evento.target.closest("[data-filtro]");

    if (!chip) return;

    estado.filtro = chip.dataset.filtro;
    marcarFiltro(estado.filtro);
    buscarDesdeElPrincipio();
});


// 📄 Paginación (delegación de eventos)
paginacion.addEventListener("click", (evento) => {

    const boton = evento.target.closest("[data-pagina]");

    if (!boton || boton.disabled) return;

    estado.pagina = Number(boton.dataset.pagina);
    cargarUsuarios();
});


// 🧰 Acciones de la tabla y de la ficha (delegación de eventos)
function alHacerClicEnAccion(evento) {

    const boton = evento.target.closest("[data-accion]");

    if (!boton || boton.disabled) return;

    ejecutarAccion(boton.dataset.accion, Number(boton.dataset.id));
}

cuerpoTabla.addEventListener("click", alHacerClicEnAccion);
nodosFicha.acciones.addEventListener("click", alHacerClicEnAccion);


// 🪟 Ventanas: botones "Cerrar / Cancelar" y clic afuera (en el fondo oscuro)
document.querySelectorAll("dialog").forEach((dialogo) => {

    // Solo cuenta como "clic afuera" si EMPEZÓ afuera: así, seleccionar texto
    // y soltar el mouse sobre el fondo no cierra la ventana (ni se pierde lo escrito)
    let empezoAfuera = false;

    dialogo.addEventListener("pointerdown", (evento) => {
        empezoAfuera = evento.target === dialogo;
    });

    dialogo.addEventListener("click", (evento) => {

        const tocoCerrar = evento.target.closest("[data-cerrar-dialogo]");
        const tocoAfuera = empezoAfuera && evento.target === dialogo;

        if (tocoCerrar || tocoAfuera) dialogo.close();
    });
});

dialogoFicha.addEventListener("close", () => {
    estado.fichaUsuario = null;
    numeroFicha++;      // si todavía se estaba cargando, esa respuesta ya no se dibuja
});

formularioSuspender.addEventListener("submit", (evento) => {
    evento.preventDefault();
    confirmarSuspension();
});

formularioSuspender.addEventListener("input", quitarErrorDelCampo);

botonConfirmarBaja.addEventListener("click", confirmarBaja);


// ==========================================================================
// 🚀 6. Inicialización
// ==========================================================================

// gestion-usuarios.html?filtro=morosos → abre directo con ese filtro (botón "Ver atrasos" del panel)
const filtroDeLaUrl = new URLSearchParams(window.location.search).get("filtro");

if (filtroDeLaUrl && Object.hasOwn(FILTROS, filtroDeLaUrl)) {
    estado.filtro = filtroDeLaUrl;
}

marcarFiltro(estado.filtro);
modoAlta();
cargarCursos();
cargarUsuarios();

// gestion-usuarios.html#alta → cursor en el formulario (botón "Registrar usuario" del panel).
// Un campo invisible no puede recibir el foco: si sesion.js todavía no mostró la página, se espera su aviso.
function ponerCursorEnElFormulario() {
    if (window.location.hash === "#alta") campoNombre.focus();
}

if (document.documentElement.classList.contains("verificando-sesion")) {
    document.addEventListener("sesion-verificada", ponerCursorEnElFormulario, { once: true });
} else {
    ponerCursorEnElFormulario();
}
