/* ==========================================================================
   MÓDULO: usuarios.js - Pantalla "Gestión de usuarios" (usuarios.html) · Grupo 5
   - Alta y modificación ............ POST / PUT  /api/usuarios
   - Búsqueda avanzada + filtros .... GET          /api/usuarios?nombre=&dni=&curso=&filtro=
   - Ficha e historial activo ....... GET          /api/usuarios/:id/historial
   - Suspender / habilitar / baja ... PATCH        /api/usuarios/:id/estado  ·  DELETE /api/usuarios/:id
   Accesos directos desde el Inicio:
   - usuarios.html#nuevo-usuario     → abre el formulario de alta
   - usuarios.html?filtro=morosos    → arranca con ese filtro
   ========================================================================== */
import {
    listarUsuarios,
    obtenerUsuario,
    obtenerHistorialUsuario,
    registrarUsuario,
    modificarUsuario,
    cambiarEstadoUsuario,
    darDeBajaUsuario,
    obtenerCursos
} from "./api.js";
import { fechaCorta } from "./fechas.js";
// =====================================================
// ELEMENTOS DEL HTML
// =====================================================

const formularioBusqueda = document.querySelector("#formularioBusqueda");
const buscarNombre = document.querySelector("#buscarNombre");
const buscarDni = document.querySelector("#buscarDni");
const buscarCurso = document.querySelector("#buscarCurso");
const botonLimpiar = document.querySelector("#botonLimpiar");

const chipsFiltro = document.querySelector("#chipsFiltro");
const cuerpoUsuarios = document.querySelector("#cuerpoUsuarios");
const cantidadUsuarios = document.querySelector("#cantidadUsuarios");
const textoPaginacion = document.querySelector("#textoPaginacion");
const paginacion = document.querySelector("#paginacion");

const modalUsuario = document.querySelector("#modal-usuario");
const formularioUsuario = document.querySelector("#formularioUsuario");
const botonNuevoUsuario = document.querySelector("#boton-nuevo-usuario");
const botonGuardar = document.querySelector("#botonGuardar");

const campoNombre = document.querySelector("#campoNombre");
const campoDni = document.querySelector("#campoDni");
const campoRol = document.querySelector("#campoRol");
const campoCurso = document.querySelector("#campoCurso");
const campoCorreo = document.querySelector("#campoCorreo");
const campoTelefono = document.querySelector("#campoTelefono");
const campoDireccion = document.querySelector("#campoDireccion");
const campoClave = document.querySelector("#campoClave");

const tituloFormulario = document.querySelector("#tituloFormulario");
const subtituloFormulario = document.querySelector("#subtituloFormulario");
const marcaEdicion = document.querySelector("#marcaEdicion");
const etiquetaClave = document.querySelector("#etiquetaClave");
const botonVerClave = document.querySelector("#botonVerClave");

const alertaFormulario = document.querySelector("#alertaFormulario");
const textoAlertaFormulario = document.querySelector("#textoAlertaFormulario");
const avisoUsuarios = document.querySelector("#aviso-usuarios");
const avisoFlotante = document.querySelector("#avisoFlotante");
const avisoTexto = document.querySelector("#avisoTexto");

const dialogoFicha = document.querySelector("#dialogoFicha");
const fichaIniciales = document.querySelector("#fichaIniciales");
const fichaNombre = document.querySelector("#fichaNombre");
const fichaSubtitulo = document.querySelector("#fichaSubtitulo");
const fichaCuerpo = document.querySelector("#fichaCuerpo");
const fichaAcciones = document.querySelector("#fichaAcciones");

const dialogoSuspender = document.querySelector("#dialogoSuspender");
const formularioSuspender = document.querySelector("#formularioSuspender");
const tituloSuspender = document.querySelector("#tituloSuspender");
const campoMotivo = document.querySelector("#campoMotivo");
const botonSuspender = document.querySelector("#botonSuspender");

const dialogoBaja = document.querySelector("#dialogoBaja");
const tituloBaja = document.querySelector("#tituloBaja");
const textoBaja = document.querySelector("#textoBaja");
const botonConfirmarBaja = document.querySelector("#botonConfirmarBaja");

const totalUsuarios = document.querySelector("#total-usuarios");
const totalActivos = document.querySelector("#total-activos");
const totalInactivos = document.querySelector("#total-inactivos");

const menuAcciones = document.querySelector("#menuAccionesUsuario");

// =====================================================
// ESTADO DE LA PÁGINA
// =====================================================

let paginaActual = 1;
let filtroActual = "todos";
let usuarioEnEdicion = null;
let usuarioSeleccionado = null;
let usuariosActuales = [];
let avisoTemporizador;

// Ancla del acceso rápido "Añadir usuario" del Inicio
const ANCLA_NUEVO_USUARIO = "#nuevo-usuario";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Algunas funciones de api.js pueden devolver directamente
// los datos o un objeto que contiene la propiedad "payload".
function extraerDatos(respuesta) {
    return respuesta?.payload ?? respuesta;
}

function mostrarAviso(mensaje, esError = false) {
    avisoUsuarios.textContent = mensaje;
    avisoUsuarios.classList.toggle("error", esError);
    avisoUsuarios.classList.add("visible");

    avisoFlotante.hidden = false;
    avisoTexto.textContent = mensaje;
    avisoFlotante.classList.toggle("error", esError);

    clearTimeout(avisoTemporizador);

    avisoTemporizador = setTimeout(() => {
        avisoFlotante.hidden = true;
        avisoUsuarios.classList.remove("visible");
    }, 4000);
}

function mostrarErrorFormulario(mensaje) {
    textoAlertaFormulario.textContent = mensaje;
    alertaFormulario.hidden = false;
}

function limpiarErrorFormulario() {
    textoAlertaFormulario.textContent = "";
    alertaFormulario.hidden = true;

    formularioUsuario
        .querySelectorAll("[data-pista]")
        .forEach((elemento) => {
            elemento.textContent = "";
        });
}

function normalizarTexto(valor) {
    return String(valor ?? "").trim();
}

function obtenerNombre(usuario) {
    return usuario.nombre_completo
        ?? usuario.nombre
        ?? "Sin nombre";
}

function obtenerRol(usuario) {
    return usuario.rol
        ?? usuario.nombre_rol
        ?? "Sin rol";
}

function obtenerEstado(usuario) {
    return String(usuario.estado ?? "habilitado").toLowerCase();
}

function esBaja(usuario) {
    return obtenerEstado(usuario) === "baja";
}

// Suspendido a mano o con una sanción en vigor (la "condición" la calcula el backend)
function esSuspendido(usuario) {
    return (usuario.condicion ?? obtenerEstado(usuario)) === "suspendido";
}

function crearCelda(valor) {
    const celda = document.createElement("td");
    celda.textContent = normalizarTexto(valor) || "—";
    return celda;
}

function crearBotonAccion(texto, accion, id, clase = "boton-secundario") {
    const boton = document.createElement("button");

    boton.type = "button";
    boton.textContent = texto;
    boton.dataset.accion = accion;
    boton.dataset.id = id;
    boton.className = clase;

    return boton;
}

// "Martina González" → "MG"
function iniciales(nombre) {
    return nombre.split(" ").filter(Boolean).slice(0, 2).map((parte) => parte[0]).join("");
}

// Condición que calcula el backend (habilitado / atraso / suspendido / baja) → etiqueta
const ETIQUETAS_CONDICION = {
    habilitado: { texto: "Habilitado", clase: "activo" },
    atraso:     { texto: "Con atraso", clase: "inactivo" },
    suspendido: { texto: "Suspendido", clase: "inactivo" },
    baja:       { texto: "De baja",    clase: "inactivo" }
};

function crearCeldaCondicion(usuario) {
    const condicion = usuario.condicion ?? obtenerEstado(usuario);
    const { texto, clase } = ETIQUETAS_CONDICION[condicion] ?? ETIQUETAS_CONDICION.habilitado;

    const etiqueta = document.createElement("span");
    etiqueta.className = `estado-usuario ${clase}`;
    etiqueta.textContent = texto;

    const celda = document.createElement("td");
    celda.append(etiqueta);
    return celda;
}

// =====================================================
// MENÚ DESPLEGABLE DE ACCIONES DE CADA FILA
// Es UN solo menú (en el <body>) que se llena con las opciones del
// usuario elegido y se ubica debajo de su botón. Así no queda cortado
// por el scroll horizontal de la tabla.
// =====================================================

let botonMenuAbierto = null;

// Opciones según el estado del usuario
function opcionesDeAcciones(usuario) {
    const opciones = [
        ["Ver ficha", "ver"],
        ["Editar", "editar"]
    ];

    if (esBaja(usuario)) {
        // Ya está dado de baja: se reactiva desde la ficha o con "Reactivar"
        opciones.push(["Reactivar", "reactivar"]);
    } else if (esSuspendido(usuario)) {
        opciones.push(["Reactivar", "reactivar"], ["Dar de baja", "baja", "peligro"]);
    } else {
        opciones.push(["Suspender", "suspender"], ["Dar de baja", "baja", "peligro"]);
    }

    return opciones;
}

function abrirMenuAcciones(boton) {
    const id = boton.dataset.abrirAcciones;
    const usuario = usuariosActuales.find((elemento) => String(elemento.id) === String(id));

    if (!usuario) return;

    cerrarMenuAcciones();

    const items = opcionesDeAcciones(usuario).map(([texto, accion, tipo]) => {
        const opcion = crearBotonAccion(texto, accion, id, `menu-acciones-opcion ${tipo ?? ""}`.trim());
        opcion.setAttribute("role", "menuitem");
        return opcion;
    });

    menuAcciones.replaceChildren(...items);
    menuAcciones.hidden = false;

    boton.setAttribute("aria-expanded", "true");
    botonMenuAbierto = boton;

    ubicarMenuAcciones();

    items[0]?.focus();
}

// Debajo del botón, alineado a su borde derecho (o arriba si abajo no entra)
function ubicarMenuAcciones() {
    if (!botonMenuAbierto) return;

    const caja = botonMenuAbierto.getBoundingClientRect();

    // Si el botón ya no se ve (se scrolleó la página), se cierra
    if (caja.bottom < 0 || caja.top > window.innerHeight) {
        cerrarMenuAcciones();
        return;
    }

    const alto = menuAcciones.offsetHeight;
    const ancho = menuAcciones.offsetWidth;
    const entraAbajo = caja.bottom + 6 + alto <= window.innerHeight;

    menuAcciones.style.top = `${entraAbajo ? caja.bottom + 6 : Math.max(8, caja.top - 6 - alto)}px`;
    menuAcciones.style.left = `${Math.max(8, caja.right - ancho)}px`;
}

function cerrarMenuAcciones({ devolverFoco = false } = {}) {
    if (menuAcciones.hidden) return;

    menuAcciones.hidden = true;
    botonMenuAbierto?.setAttribute("aria-expanded", "false");

    if (devolverFoco) botonMenuAbierto?.focus();

    botonMenuAbierto = null;
}

document.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-abrir-acciones]");

    // Clic en "Acciones": abre (o cierra si ya estaba abierto)
    if (boton) {
        const yaAbierto = botonMenuAbierto === boton;
        yaAbierto ? cerrarMenuAcciones() : abrirMenuAcciones(boton);
        return;
    }

    // Clic en una opción o afuera: se cierra (la opción la ejecuta manejarAccion)
    cerrarMenuAcciones();
});

// Teclado: flechas para moverse, Escape para cerrar
menuAcciones.addEventListener("keydown", (evento) => {
    const opciones = [...menuAcciones.querySelectorAll("[role='menuitem']")];
    const actual = opciones.indexOf(document.activeElement);

    if (evento.key === "ArrowDown" || evento.key === "ArrowUp") {
        evento.preventDefault();
        const paso = evento.key === "ArrowDown" ? 1 : -1;
        opciones[(actual + paso + opciones.length) % opciones.length]?.focus();
    }

    if (evento.key === "Escape" || evento.key === "Tab") {
        cerrarMenuAcciones({ devolverFoco: evento.key === "Escape" });
    }
});

// Si se mueve la página o la tabla, el menú acompaña a su botón
window.addEventListener("resize", ubicarMenuAcciones);
document.addEventListener("scroll", ubicarMenuAcciones, true);

// =====================================================
// CARGA DE USUARIOS DESDE EL BACKEND
// =====================================================

async function cargarUsuarios() {
    cuerpoUsuarios.innerHTML = "";

    const filaCarga = document.createElement("tr");
    const celdaCarga = document.createElement("td");

    celdaCarga.colSpan = 7;
    celdaCarga.className = "celda-mensaje";
    celdaCarga.textContent = "Cargando usuarios...";

    filaCarga.append(celdaCarga);
    cuerpoUsuarios.append(filaCarga);

    try {
        const respuesta = await listarUsuarios({
            nombre: normalizarTexto(buscarNombre.value),
            dni: normalizarTexto(buscarDni.value),
            curso: normalizarTexto(buscarCurso.value),
            filtro: filtroActual,
            pagina: paginaActual
        });

        const datos = extraerDatos(respuesta);

        // El backend puede devolver los resultados dentro
        // de "usuarios", junto con los datos de paginación.
        usuariosActuales = Array.isArray(datos?.usuarios)
            ? datos.usuarios
            : [];

        dibujarTabla(usuariosActuales);
        dibujarPaginacion(datos);
        actualizarContadores(datos);

    } catch (error) {
        console.error("Error al cargar usuarios:", error);

        mostrarAviso(
            error.message || "No se pudieron cargar los usuarios.",
            true
        );

        mostrarMensajeTabla("No se pudieron cargar los usuarios.");
    }
}

function mostrarMensajeTabla(mensaje) {
    cuerpoUsuarios.replaceChildren();

    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 7;
    celda.className = "celda-mensaje";
    celda.textContent = mensaje;

    fila.append(celda);
    cuerpoUsuarios.append(fila);
}

// =====================================================
// DIBUJAR TABLA
// =====================================================

function dibujarTabla(usuarios) {
    cuerpoUsuarios.replaceChildren();

    if (usuarios.length === 0) {
        mostrarMensajeTabla("No se encontraron usuarios.");
        cantidadUsuarios.textContent = "No hay resultados";
        return;
    }

    usuarios.forEach((usuario) => {
        const fila = document.createElement("tr");
        const id = usuario.id;

        // Avatar con iniciales + nombre y correo
        const celdaUsuario = document.createElement("td");
        const identidad = document.createElement("div");
        const avatar = document.createElement("span");
        const textos = document.createElement("div");
        const nombre = document.createElement("strong");

        identidad.className = "usuario-identidad";
        avatar.className = "usuario-avatar";
        avatar.textContent = iniciales(obtenerNombre(usuario));
        nombre.textContent = obtenerNombre(usuario);
        textos.append(nombre);

        if (usuario.correo) {
            const correo = document.createElement("small");
            correo.textContent = usuario.correo;
            textos.append(correo);
        }

        identidad.append(avatar, textos);
        celdaUsuario.append(identidad);

        fila.append(
            celdaUsuario,
            crearCelda(usuario.dni),
            crearCelda(usuario.curso),
            crearCelda(usuario.telefono || usuario.correo),
            crearCelda(obtenerRol(usuario)),
            crearCeldaCondicion(usuario)
        );

        // Un solo botón "Acciones" que abre el menú desplegable de esa fila
        const celdaAcciones = document.createElement("td");
        const botonAcciones = document.createElement("button");

        botonAcciones.type = "button";
        botonAcciones.className = "boton-acciones";
        botonAcciones.textContent = "Acciones";
        botonAcciones.dataset.abrirAcciones = id;
        botonAcciones.setAttribute("aria-haspopup", "menu");
        botonAcciones.setAttribute("aria-expanded", "false");
        botonAcciones.setAttribute("aria-controls", "menuAccionesUsuario");
        botonAcciones.setAttribute("aria-label", `Acciones de ${obtenerNombre(usuario)}`);

        celdaAcciones.append(botonAcciones);

        fila.append(celdaAcciones);
        cuerpoUsuarios.append(fila);
    });

    cantidadUsuarios.textContent =
        `${usuarios.length} usuario(s) en esta página`;
}

// =====================================================
// CONTADORES
// =====================================================

function actualizarContadores(datos) {
    const contadores = datos?.contadores ?? {};

    totalUsuarios.textContent =
        contadores.todos ?? datos?.total ?? "—";

    const suspendidos = Number(contadores.suspendidos ?? 0);
    const bajas = Number(contadores.bajas ?? 0);

    // "todos" no incluye las bajas y "suspendidos" incluye sanciones y atrasos:
    // los habilitados son los que quedan
    totalActivos.textContent =
        contadores.todos != null ? Number(contadores.todos) - suspendidos : "—";

    totalInactivos.textContent =
        suspendidos + bajas;

    document.querySelectorAll("[data-cantidad]").forEach((elemento) => {
        const clave = elemento.dataset.cantidad;
        elemento.textContent = contadores[clave] ?? 0;
    });
}

// =====================================================
// PAGINACIÓN
// =====================================================

function dibujarPaginacion(datos) {
    paginacion.replaceChildren();

    const pagina = Number(datos?.pagina ?? paginaActual);
    const totalPaginas = Number(datos?.total_paginas ?? 1);
    const total = Number(datos?.total ?? usuariosActuales.length);
    const porPagina = Number(datos?.por_pagina ?? usuariosActuales.length);

    paginaActual = pagina;

    textoPaginacion.textContent =
        `Página ${pagina} de ${Math.max(totalPaginas, 1)}`;

    if (totalPaginas <= 1) return;

    const botonAnterior = crearBotonAccion("Anterior", "pagina-anterior", "");
    botonAnterior.disabled = pagina <= 1;
    paginacion.append(botonAnterior);

    const botonSiguiente = crearBotonAccion("Siguiente", "pagina-siguiente", "");
    botonSiguiente.disabled = pagina >= totalPaginas;
    paginacion.append(botonSiguiente);

    // Estos datos quedan disponibles para mostrar información
    // adicional si después queremos mejorar el pie de la tabla.
    paginacion.dataset.total = String(total);
    paginacion.dataset.porPagina = String(porPagina);
}

// =====================================================
// FILTROS Y BÚSQUEDA
// =====================================================

formularioBusqueda.addEventListener("submit", (evento) => {
    evento.preventDefault();
    paginaActual = 1;
    cargarUsuarios();
});

botonLimpiar.addEventListener("click", () => {
    formularioBusqueda.reset();
    paginaActual = 1;
    filtroActual = "todos";

    actualizarChipActivo();
    cargarUsuarios();
});

chipsFiltro.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-filtro]");

    if (!boton) return;

    filtroActual = boton.dataset.filtro;
    paginaActual = 1;

    actualizarChipActivo();
    cargarUsuarios();
});

function actualizarChipActivo() {
    chipsFiltro.querySelectorAll("[data-filtro]").forEach((boton) => {
        const activo = boton.dataset.filtro === filtroActual;

        boton.classList.toggle("activo", activo);
        boton.setAttribute("aria-pressed", String(activo));
    });
}

paginacion.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");

    if (!boton || boton.disabled) return;

    if (boton.dataset.accion === "pagina-anterior") {
        paginaActual = Math.max(1, paginaActual - 1);
    }

    if (boton.dataset.accion === "pagina-siguiente") {
        paginaActual += 1;
    }

    cargarUsuarios();
});

// =====================================================
// ABRIR Y CERRAR EL FORMULARIO
// =====================================================

function abrirModal() {
    modalUsuario.classList.add("abierto");
    modalUsuario.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-abierto");
    campoNombre.focus();
}

function cerrarModal() {
    // Si se abrió con usuarios.html#nuevo-usuario, se saca el #
    // (así al recargar la página no se vuelve a abrir)
    if (location.hash === ANCLA_NUEVO_USUARIO) {
        history.replaceState(null, "", location.pathname + location.search);
    }

    modalUsuario.classList.remove("abierto");
    modalUsuario.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-abierto");

    formularioUsuario.reset();
    usuarioEnEdicion = null;
    limpiarErrorFormulario();
}

function prepararAlta() {
    usuarioEnEdicion = null;

    formularioUsuario.reset();
    limpiarErrorFormulario();

    tituloFormulario.textContent = "Registrar usuario";
    subtituloFormulario.textContent =
        "Completá los datos para dar de alta un usuario nuevo.";

    marcaEdicion.hidden = true;
    etiquetaClave.textContent = "Contraseña inicial *";
    campoClave.required = true;

    botonGuardar.textContent = "Registrar usuario";

    abrirModal();
}

botonNuevoUsuario.addEventListener("click", prepararAlta);

document.querySelector("#cerrar-modal-usuario")
    .addEventListener("click", cerrarModal);

document.querySelector("#botonCancelar")
    .addEventListener("click", cerrarModal);

modalUsuario.addEventListener("click", (evento) => {
    if (evento.target === modalUsuario) cerrarModal();
});

document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape" && modalUsuario.classList.contains("abierto")) {
        cerrarModal();
    }
});

// Mostrar u ocultar la contraseña.
botonVerClave.addEventListener("click", () => {
    const mostrar = campoClave.type === "password";

    campoClave.type = mostrar ? "text" : "password";
    botonVerClave.setAttribute(
        "aria-label",
        mostrar ? "Ocultar contraseña" : "Mostrar contraseña"
    );
});

// =====================================================
// CURSOS
// =====================================================

async function cargarCursos() {
    try {
        const respuesta = await obtenerCursos();
        const datos = extraerDatos(respuesta);

        const cursos = Array.isArray(datos)
            ? datos
            : Array.isArray(datos?.cursos)
                ? datos.cursos
                : [];

        const lista = document.querySelector("#listaCursos");
        lista.replaceChildren();

        cursos.forEach((curso) => {
            const opcion = document.createElement("option");

            opcion.value = typeof curso === "string"
                ? curso
                : curso.nombre ?? curso.nombre_curso ?? curso.curso ?? "";

            if (opcion.value) lista.append(opcion);
        });

    } catch (error) {
        console.error("No se pudieron cargar los cursos:", error);
    }
}

// =====================================================
// REGISTRAR Y MODIFICAR USUARIOS
// =====================================================

formularioUsuario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarErrorFormulario();

    const datos = {
        nombre_completo: normalizarTexto(campoNombre.value),
        dni: normalizarTexto(campoDni.value),
        rol: campoRol.value,
        curso: normalizarTexto(campoCurso.value),
        correo: normalizarTexto(campoCorreo.value),
        telefono: normalizarTexto(campoTelefono.value),
        direccion: normalizarTexto(campoDireccion.value)
    };

    const clave = campoClave.value.trim();

    if (!usuarioEnEdicion && !clave) {
        mostrarErrorFormulario("La contraseña inicial es obligatoria.");
        campoClave.focus();
        return;
    }

    // En edición, una contraseña vacía significa conservar la actual.
    if (clave) {
        datos.clave = clave;
    }

    botonGuardar.disabled = true;
    botonGuardar.textContent = "Guardando...";

    try {
        if (usuarioEnEdicion) {
            await modificarUsuario(usuarioEnEdicion, datos);
            mostrarAviso("Usuario modificado correctamente.");
        } else {
            await registrarUsuario(datos);
            mostrarAviso("Usuario registrado correctamente.");
        }

        cerrarModal();
        await cargarUsuarios();

    } catch (error) {
        console.error("Error al guardar el usuario:", error);
        mostrarErrorFormulario(
            error.message || "No se pudo guardar el usuario."
        );
    } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = usuarioEnEdicion
            ? "Guardar cambios"
            : "Registrar usuario";
    }
});

async function editarUsuario(id) {
    try {
        const respuesta = await obtenerUsuario(id);
        const usuario = extraerDatos(respuesta);

        usuarioEnEdicion = id;

        campoNombre.value = usuario.nombre_completo ?? usuario.nombre ?? "";
        campoDni.value = usuario.dni ?? "";
        campoRol.value = usuario.rol ?? "alumno";
        campoCurso.value = usuario.curso ?? "";
        campoCorreo.value = usuario.correo ?? "";
        campoTelefono.value = usuario.telefono ?? "";
        campoDireccion.value = usuario.direccion ?? "";
        campoClave.value = "";

        tituloFormulario.textContent = "Modificar usuario";
        subtituloFormulario.textContent =
            "Actualizá los datos del usuario seleccionado.";

        marcaEdicion.hidden = false;
        etiquetaClave.textContent = "Nueva contraseña (opcional)";
        campoClave.required = false;

        botonGuardar.textContent = "Guardar cambios";

        limpiarErrorFormulario();
        abrirModal();

    } catch (error) {
        console.error("Error al consultar el usuario:", error);
        mostrarAviso(error.message || "No se pudo abrir el usuario.", true);
    }
}

// =====================================================
// FICHA E HISTORIAL
// =====================================================

// --- Ficha: datos del usuario (acá se ve la dirección, que no está en la tabla) ---
function crearDatosFicha(usuario) {
    const { texto: condicion } = ETIQUETAS_CONDICION[usuario.condicion] ?? { texto: usuario.estado };

    const datos = [
        ["Correo", usuario.correo],
        ["Teléfono", usuario.telefono],
        ["Curso", usuario.curso],
        ["Condición", condicion],
        ["Dirección", usuario.direccion, "completo"],
        ["Fecha de alta", fechaCorta(usuario.fecha_alta)]
    ];

    const lista = document.createElement("dl");
    lista.className = "ficha-datos";

    datos.forEach(([etiqueta, valor, ancho]) => {
        const item = document.createElement("div");
        const termino = document.createElement("dt");
        const dato = document.createElement("dd");

        if (ancho) item.className = ancho;
        termino.textContent = etiqueta;
        dato.textContent = normalizarTexto(valor) || "—";

        item.append(termino, dato);
        lista.append(item);
    });

    return lista;
}

// Estado de un préstamo del historial → texto y clase
function estadoPrestamo(prestamo) {
    if (prestamo.estado === "devuelto") {
        return prestamo.dias_atraso > 0
            ? { texto: `Devuelto con ${prestamo.dias_atraso} día(s) de atraso`, clase: "atraso" }
            : { texto: "Devuelto", clase: "ok" };
    }

    if (prestamo.dias_atraso > 0) {
        return { texto: `Atrasado ${prestamo.dias_atraso} día(s)`, clase: "atraso" };
    }

    if (prestamo.estado === "pendiente") return { texto: "Reserva pendiente", clase: "neutro" };
    if (prestamo.estado === "cancelado") return { texto: "Cancelado", clase: "neutro" };

    return { texto: "En curso", clase: "curso" };
}

// --- Ficha: historial activo (entregas, devoluciones, atrasos y sanciones) ---
function crearHistorialFicha(historial) {
    const seccion = document.createElement("section");
    seccion.className = "ficha-historial";

    const titulo = document.createElement("h3");
    titulo.textContent = "Historial activo";
    seccion.append(titulo);

    // Resumen en números
    const resumen = historial?.resumen ?? {};
    const tarjetas = document.createElement("div");
    tarjetas.className = "ficha-resumen";

    [
        ["Entregas", resumen.entregas],
        ["Devoluciones", resumen.devoluciones],
        ["Atrasos", resumen.atrasos],
        ["En curso", resumen.en_curso]
    ].forEach(([etiqueta, cantidad]) => {
        const tarjeta = document.createElement("div");
        const numero = document.createElement("strong");
        const texto = document.createElement("span");

        numero.textContent = cantidad ?? 0;
        texto.textContent = etiqueta;
        tarjeta.append(numero, texto);
        tarjetas.append(tarjeta);
    });

    seccion.append(tarjetas);

    // Movimientos (préstamos y reservas)
    const prestamos = historial?.prestamos ?? [];

    if (prestamos.length === 0) {
        const vacio = document.createElement("p");
        vacio.className = "historial-vacio";
        vacio.textContent = "Todavía no tiene préstamos registrados.";
        seccion.append(vacio);
    } else {
        const lista = document.createElement("ul");
        lista.className = "ficha-movimientos";

        prestamos.forEach((prestamo) => {
            const item = document.createElement("li");
            const textos = document.createElement("div");
            const libro = document.createElement("strong");
            const fechas = document.createElement("span");
            const { texto, clase } = estadoPrestamo(prestamo);
            const etiqueta = document.createElement("em");

            libro.textContent = prestamo.titulo;

            const entregado = prestamo.fecha_entrega ?? prestamo.fecha_pedido;
            const devolucion = prestamo.fecha_devolucion_real
                ? `devuelto el ${fechaCorta(prestamo.fecha_devolucion_real)}`
                : `vence el ${fechaCorta(prestamo.fecha_devolucion_estimada)}`;

            fechas.textContent = `${fechaCorta(entregado)} · ${devolucion}`;
            etiqueta.className = `etiqueta-movimiento ${clase}`;
            etiqueta.textContent = texto;

            textos.append(libro, fechas);
            item.append(textos, etiqueta);
            lista.append(item);
        });

        seccion.append(lista);
    }

    // Sanciones
    const sanciones = historial?.sanciones ?? [];

    if (sanciones.length > 0) {
        const tituloSanciones = document.createElement("h3");
        tituloSanciones.textContent = "Sanciones";

        const lista = document.createElement("ul");
        lista.className = "ficha-movimientos";

        sanciones.forEach((sancion) => {
            const item = document.createElement("li");
            const textos = document.createElement("div");
            const motivo = document.createElement("strong");
            const fechas = document.createElement("span");
            const etiqueta = document.createElement("em");

            motivo.textContent = sancion.motivo || sancion.tipo;
            fechas.textContent = `Desde ${fechaCorta(sancion.fecha_inicio)}`
                + (sancion.fecha_fin ? ` hasta ${fechaCorta(sancion.fecha_fin)}` : "")
                + (sancion.aplicada_por ? ` · ${sancion.aplicada_por}` : "");

            etiqueta.className = `etiqueta-movimiento ${sancion.en_vigor ? "atraso" : "neutro"}`;
            etiqueta.textContent = sancion.en_vigor ? "En vigor" : "Levantada";

            textos.append(motivo, fechas);
            item.append(textos, etiqueta);
            lista.append(item);
        });

        seccion.append(tituloSanciones, lista);
    }

    return seccion;
}

async function verFicha(id) {
    try {
        const [respuestaUsuario, respuestaHistorial] = await Promise.all([
            obtenerUsuario(id),
            obtenerHistorialUsuario(id)
        ]);

        const usuario = extraerDatos(respuestaUsuario);
        const historial = extraerDatos(respuestaHistorial);

        fichaNombre.textContent = obtenerNombre(usuario);
        fichaSubtitulo.textContent =
            `DNI: ${usuario.dni ?? "—"} · ${obtenerRol(usuario)}`;

        fichaIniciales.textContent = obtenerNombre(usuario)
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((parte) => parte[0].toUpperCase())
            .join("");

        fichaCuerpo.replaceChildren(
            crearDatosFicha(usuario),
            crearHistorialFicha(historial)
        );

        fichaAcciones.replaceChildren(
            crearBotonAccion("Editar usuario", "editar", id)
        );

        dialogoFicha.showModal();

    } catch (error) {
        console.error("Error al consultar la ficha:", error);
        mostrarAviso(error.message || "No se pudo cargar la ficha.", true);
    }
}

// =====================================================
// SUSPENDER, REACTIVAR Y DAR DE BAJA
// =====================================================

function abrirSuspension(id, usuario) {
    usuarioSeleccionado = id;

    tituloSuspender.textContent =
        `Suspender a ${obtenerNombre(usuario)}`;

    campoMotivo.value = "";
    dialogoSuspender.showModal();
}

formularioSuspender.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!usuarioSeleccionado) return;

    const motivo = normalizarTexto(campoMotivo.value);

    if (!motivo) {
        campoMotivo.focus();
        return;
    }

    botonSuspender.disabled = true;

    try {
        await cambiarEstadoUsuario(usuarioSeleccionado, "suspendido", motivo);

        dialogoSuspender.close();
        mostrarAviso("Usuario suspendido correctamente.");
        usuarioSeleccionado = null;

        await cargarUsuarios();

    } catch (error) {
        console.error("Error al suspender usuario:", error);
        mostrarAviso(error.message || "No se pudo suspender el usuario.", true);
    } finally {
        botonSuspender.disabled = false;
    }
});

async function reactivarUsuario(id) {
    const confirmar = window.confirm(
        "¿Querés reactivar este usuario?"
    );

    if (!confirmar) return;

    try {
        await cambiarEstadoUsuario(id, "habilitado");
        mostrarAviso("Usuario reactivado correctamente.");
        await cargarUsuarios();

    } catch (error) {
        console.error("Error al reactivar usuario:", error);
        mostrarAviso(error.message || "No se pudo reactivar el usuario.", true);
    }
}

function abrirBaja(id, usuario) {
    usuarioSeleccionado = id;

    tituloBaja.textContent = `Dar de baja a ${obtenerNombre(usuario)}`;
    textoBaja.textContent =
        "El usuario dejará de estar habilitado. Su historial se conservará.";

    dialogoBaja.showModal();
}

botonConfirmarBaja.addEventListener("click", async () => {
    if (!usuarioSeleccionado) return;

    botonConfirmarBaja.disabled = true;

    try {
        await darDeBajaUsuario(usuarioSeleccionado);

        dialogoBaja.close();
        mostrarAviso("Usuario dado de baja correctamente.");
        usuarioSeleccionado = null;

        await cargarUsuarios();

    } catch (error) {
        console.error("Error al dar de baja:", error);
        mostrarAviso(error.message || "No se pudo dar de baja al usuario.", true);
    } finally {
        botonConfirmarBaja.disabled = false;
    }
});

// =====================================================
// ACCIONES DE LA TABLA Y LA FICHA
// =====================================================

async function manejarAccion(accion, id) {
    const usuario = usuariosActuales.find(
        (elemento) => String(elemento.id) === String(id)
    );

    switch (accion) {
        case "ver":
            await verFicha(id);
            break;

        case "editar":
            await editarUsuario(id);
            break;

        case "suspender":
            if (usuario) abrirSuspension(id, usuario);
            break;

        case "reactivar":
            await reactivarUsuario(id);
            break;

        case "baja":
            if (usuario) abrirBaja(id, usuario);
            break;
    }
}

document.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");

    if (!boton) return;

    const { accion, id } = boton.dataset;

    if (accion === "pagina-anterior" || accion === "pagina-siguiente") {
        return;
    }

    if (accion && id) {
        manejarAccion(accion, id);
    }
});

// Cerrar diálogos mediante los botones correspondientes.
document.querySelectorAll("[data-cerrar-dialogo]").forEach((boton) => {
    boton.addEventListener("click", () => {
        const dialogo = boton.closest("dialog");

        if (dialogo?.open) dialogo.close();
    });
});

// =====================================================
// ACCESOS DIRECTOS DESDE EL INICIO
// =====================================================

// ?filtro=morosos → arranca con ese chip activo
function aplicarFiltroDeLaUrl() {
    const filtro = new URLSearchParams(location.search).get("filtro");
    const existe = chipsFiltro.querySelector(`[data-filtro="${CSS.escape(filtro ?? "")}"]`);

    if (filtro && existe) {
        filtroActual = filtro;
        actualizarChipActivo();
    }
}

// #nuevo-usuario → abre el formulario de alta
function abrirAltaSiCorresponde() {
    if (location.hash !== ANCLA_NUEVO_USUARIO) return;

    prepararAlta();

    // La página se muestra recién cuando se verifica la sesión: ahí va el cursor al nombre
    document.addEventListener("sesion-verificada", () => campoNombre.focus(), { once: true });
}

// También si ya estás en Usuarios y cambia el # (ej: atrás / adelante)
window.addEventListener("hashchange", abrirAltaSiCorresponde);


// =====================================================
// INICIO
// =====================================================

aplicarFiltroDeLaUrl();
abrirAltaSiCorresponde();

if (window.lucide) {
    window.lucide.createIcons();
}

await cargarCursos();
await cargarUsuarios();
