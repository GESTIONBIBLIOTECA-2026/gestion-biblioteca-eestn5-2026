/* ==========================================================================
   MÓDULO: usuarios-ui.js - Dibujo de la pantalla "Gestión de Usuarios"
   Funciones que reciben datos y devuelven elementos del DOM.
   Todo el texto que viene de la base se pone con textContent:
   nunca se interpreta como HTML (así nadie puede inyectar código).
   ========================================================================== */

import { fechaCorta } from "./fechas.js";


// ==========================================================================
// 📚 1. Textos de cada estado
// ==========================================================================

// Condición del usuario (la calcula el backend) → texto y clase CSS de la etiqueta
export const CONDICIONES = {
    habilitado: { texto: "Habilitado",            clase: "habilitado" },
    atraso:     { texto: "Suspendido por atraso", clase: "atraso" },
    suspendido: { texto: "Suspendido",            clase: "suspendido" },
    baja:       { texto: "Dado de baja",          clase: "baja" }
};

export const ROLES = {
    alumno: "Alumno",
    docente: "Docente",
    administrador: "Administrador"
};

const COLUMNAS_TABLA = 8;


// ==========================================================================
// 🧩 2. Ayudantes
// ==========================================================================

/* --- Crea un elemento con clase y texto --- */
export function crearElemento(etiqueta, clase = "", texto = "") {

    const elemento = document.createElement(etiqueta);

    if (clase) elemento.className = clase;
    if (texto !== "") elemento.textContent = texto;

    return elemento;
}


/* --- Ícono de Lucide (se dibuja al llamar a refrescarIconos) --- */
export function crearIcono(nombre) {

    const icono = document.createElement("i");
    icono.dataset.lucide = nombre;

    return icono;
}


/* --- Convierte los <i data-lucide> nuevos en íconos --- */
export function refrescarIconos() {
    window.lucide?.createIcons();
}


/* --- "45123456" → "45.123.456" --- */
export function formatearDni(dni) {
    return String(dni).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


/* --- "Juan Pérez" → "JP" --- */
export function iniciales(nombre) {
    return nombre
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0].toUpperCase())
        .join("");
}


/* --- 1 → "1 día", 3 → "3 días" --- */
const dias = (cantidad) => (cantidad === 1 ? "1 día" : `${cantidad} días`);


/* --- Etiqueta de color con texto (guía de estilos: nunca solo color) --- */
export function crearEtiqueta(texto, clase) {
    return crearElemento("span", `etiqueta ${clase}`, texto);
}

export function crearEtiquetaCondicion(condicion) {
    const { texto, clase } = CONDICIONES[condicion] ?? CONDICIONES.habilitado;
    return crearEtiqueta(texto, clase);
}


// ==========================================================================
// 🖱️ 3. Botones de acción (tabla y ficha)
// ==========================================================================

/**
 * Qué se puede hacer con un usuario según su condición.
 * El administrador logueado no puede suspenderse ni darse de baja a sí mismo.
 */
function accionesDe(usuario, esPropio) {

    const acciones = [
        { accion: "ver",    icono: "eye",    texto: "Ver ficha", clase: "boton-ver" },
        { accion: "editar", icono: "pencil", texto: "Editar",    clase: "boton-editar" }
    ];

    if (usuario.condicion === "baja") {
        acciones.push({ accion: "habilitar", icono: "rotate-ccw", texto: "Reactivar", clase: "boton-habilitar" });
        return acciones;
    }

    if (usuario.condicion === "suspendido") {
        acciones.push({ accion: "habilitar", icono: "circle-check", texto: "Habilitar", clase: "boton-habilitar" });
    } else {
        acciones.push({ accion: "suspender", icono: "ban", texto: "Suspender", clase: "boton-suspender", bloqueado: esPropio });
    }

    acciones.push({ accion: "baja", icono: "trash-2", texto: "Dar de baja", clase: "boton-eliminar", bloqueado: esPropio });

    return acciones;
}


/* --- Botones solo con ícono (fila de la tabla) --- */
function crearBotonesTabla(usuario, esPropio) {

    const contenedor = crearElemento("div", "acciones-tabla");

    accionesDe(usuario, esPropio).forEach(({ accion, icono, texto, clase, bloqueado }) => {

        const boton = crearElemento("button", `boton-icono ${clase}`);
        boton.type = "button";
        boton.dataset.accion = accion;
        boton.dataset.id = usuario.id;
        boton.title = bloqueado ? "No podés hacerlo con tu propio usuario" : texto;
        boton.setAttribute("aria-label", `${texto}: ${usuario.nombre_completo}`);
        boton.disabled = Boolean(bloqueado);
        boton.append(crearIcono(icono));

        contenedor.append(boton);
    });

    return contenedor;
}


/* --- Botones con texto (pie de la ficha) --- */
export function crearBotonesFicha(usuario, esPropio) {

    const estilos = {
        editar:    "boton boton-secundario",
        suspender: "boton boton-secundario",
        habilitar: "boton boton-exito",
        baja:      "boton boton-peligro"
    };

    return accionesDe(usuario, esPropio)
        .filter(({ accion, bloqueado }) => accion !== "ver" && !bloqueado)
        .map(({ accion, icono, texto }) => {

            const boton = crearElemento("button", estilos[accion]);
            boton.type = "button";
            boton.dataset.accion = accion;
            boton.dataset.id = usuario.id;
            boton.append(crearIcono(icono), crearElemento("span", "", texto));

            return boton;
        });
}


// ==========================================================================
// 📋 4. Tabla de usuarios
// ==========================================================================

/* --- Celda con una línea principal y (opcional) una segunda línea más chica --- */
function crearCelda(principal, secundario = "", claseSecundario = "") {

    const celda = document.createElement("td");
    celda.append(document.createTextNode(principal));

    if (secundario) {
        celda.append(crearElemento("span", `texto-secundario ${claseSecundario}`, secundario));
    }

    return celda;
}


/* --- Una fila de la tabla por usuario --- */
export function crearFilaUsuario(usuario, esPropio = false) {

    const fila = document.createElement("tr");
    fila.dataset.id = usuario.id;

    if (usuario.condicion === "baja") fila.classList.add("fila-baja");

    // Estado + aviso de atraso (si el estado principal no lo dice ya)
    const celdaEstado = document.createElement("td");
    celdaEstado.append(crearEtiquetaCondicion(usuario.condicion));

    if (usuario.prestamos_atrasados > 0 && usuario.condicion !== "atraso") {
        const atrasos = usuario.prestamos_atrasados === 1 ? "1 préstamo atrasado" : `${usuario.prestamos_atrasados} préstamos atrasados`;
        celdaEstado.append(crearElemento("span", "texto-secundario rojo", atrasos));
    }

    const celdaAcciones = document.createElement("td");
    celdaAcciones.append(crearBotonesTabla(usuario, esPropio));

    const celdaDni = crearCelda(formatearDni(usuario.dni));
    celdaDni.className = "celda-dni";

    fila.append(
        crearCelda(usuario.nombre_completo, esPropio ? "Vos" : ""),
        celdaDni,
        crearCelda(usuario.curso ?? "—"),
        crearCelda(usuario.correo, usuario.telefono),
        crearCelda(usuario.direccion),
        crearCelda(ROLES[usuario.rol] ?? usuario.rol),
        celdaEstado,
        celdaAcciones
    );

    return fila;
}


/* --- Fila que ocupa toda la tabla (cargando, sin resultados, error) --- */
export function crearFilaMensaje(texto) {

    const fila = document.createElement("tr");
    const celda = crearElemento("td", "celda-mensaje", texto);

    celda.colSpan = COLUMNAS_TABLA;
    fila.append(celda);

    return fila;
}


/* --- Botones de paginación: « 1 2 3 » (como mucho 5 números) --- */
export function crearPaginacion(pagina, totalPaginas) {

    if (totalPaginas <= 1) return [];

    const botones = [];

    const crearBoton = (contenido, destino, { activa = false, deshabilitado = false, etiqueta = "" } = {}) => {

        const boton = crearElemento("button", `boton-paginacion${activa ? " pagina-activa" : ""}`);
        boton.type = "button";
        boton.dataset.pagina = destino;
        boton.disabled = deshabilitado;

        if (etiqueta) boton.setAttribute("aria-label", etiqueta);
        if (activa) boton.setAttribute("aria-current", "page");

        boton.append(contenido);
        return boton;
    };

    // Ventana de 5 páginas alrededor de la actual
    const desde = Math.max(1, Math.min(pagina - 2, totalPaginas - 4));
    const hasta = Math.min(totalPaginas, desde + 4);

    botones.push(crearBoton(crearIcono("chevron-left"), pagina - 1, { deshabilitado: pagina === 1, etiqueta: "Página anterior" }));

    for (let numero = desde; numero <= hasta; numero++) {
        botones.push(crearBoton(String(numero), numero, { activa: numero === pagina, etiqueta: `Página ${numero}` }));
    }

    botones.push(crearBoton(crearIcono("chevron-right"), pagina + 1, { deshabilitado: pagina === totalPaginas, etiqueta: "Página siguiente" }));

    return botones;
}


// ==========================================================================
// 🪪 5. Ficha del usuario + historial activo
// ==========================================================================

/* --- Mensaje arriba de la ficha según el estado --- */
function crearAlertaCondicion(usuario, sanciones) {

    const sancionVigente = sanciones.find((sancion) => sancion.en_vigor);
    const atrasos = usuario.prestamos_atrasados;
    const textoAtrasos = atrasos === 1 ? "1 préstamo atrasado sin devolver" : `${atrasos} préstamos atrasados sin devolver`;

    let tipo = "exito";
    let icono = "circle-check";
    let texto = "Habilitado: puede pedir libros.";

    if (usuario.condicion === "baja") {
        tipo = "gris";
        icono = "user-x";
        texto = "Dado de baja. Su historial se conserva y podés reactivarlo cuando quieras.";
    }

    if (usuario.condicion === "suspendido") {
        tipo = "peligro";
        icono = "ban";
        texto = sancionVigente
            ? `Suspendido desde el ${fechaCorta(sancionVigente.fecha_inicio)}: ${sancionVigente.motivo ?? "sin motivo"}.`
            : "Suspendido: no puede pedir libros hasta que lo habilites.";

        if (atrasos > 0) texto += ` Además tiene ${textoAtrasos}.`;
    }

    if (usuario.condicion === "atraso") {
        tipo = "peligro";
        icono = "clock-3";
        texto = `Suspendido por atraso: tiene ${textoAtrasos}. Vuelve a estar habilitado cuando lo devuelva.`;
    }

    const alerta = crearElemento("div", `alerta ${tipo}`);
    alerta.append(crearIcono(icono), crearElemento("span", "", texto));

    return alerta;
}


/* --- Credencial: los 6 atributos + tipo y fecha de alta --- */
function crearCredencial(usuario) {

    const datos = [
        ["DNI", formatearDni(usuario.dni)],
        ["Curso", usuario.curso ?? "No corresponde"],
        ["Tipo de usuario", ROLES[usuario.rol] ?? usuario.rol],
        ["Fecha de alta", fechaCorta(usuario.fecha_alta)],
        ["Correo electrónico", usuario.correo],
        ["Teléfono", usuario.telefono],
        ["Dirección", usuario.direccion, "ancho"]
    ];

    const lista = crearElemento("dl", "credencial");

    datos.forEach(([titulo, valor, clase = ""]) => {
        const dato = crearElemento("div", `dato-credencial ${clase}`);
        dato.append(crearElemento("dt", "", titulo), crearElemento("dd", "", valor));
        lista.append(dato);
    });

    return lista;
}


/* --- Subtítulo con ícono dentro de la ficha --- */
function crearSubtitulo(icono, texto) {

    const titulo = document.createElement("h4");
    titulo.append(crearIcono(icono), document.createTextNode(texto));

    return titulo;
}


/* --- Números del historial: entregas, devoluciones, atrasos y en préstamo --- */
function crearNumeros(resumen) {

    const numeros = [
        { titulo: "Entregas", valor: resumen.entregas, detalle: "libros retirados" },
        { titulo: "Devoluciones", valor: resumen.devoluciones, detalle: "libros devueltos" },
        { titulo: "Atrasos", valor: resumen.atrasos, detalle: `${dias(resumen.dias_atraso)} en total`, rojo: resumen.atrasos > 0 },
        { titulo: "En préstamo", valor: resumen.en_curso, detalle: resumen.reservas > 0 ? `+ ${resumen.reservas} por retirar` : "sin devolver todavía" }
    ];

    const contenedor = crearElemento("div", "numeros-historial");

    numeros.forEach(({ titulo, valor, detalle, rojo }) => {
        const tarjeta = crearElemento("div", `numero-historial${rojo ? " rojo" : ""}`);
        tarjeta.append(
            crearElemento("small", "", titulo),
            crearElemento("strong", "", String(valor)),
            crearElemento("span", "", detalle)
        );
        contenedor.append(tarjeta);
    });

    return contenedor;
}


/* --- Estado de un pedido para el historial --- */
function estadoPrestamo(prestamo) {

    const { estado, dias_atraso: atraso } = prestamo;

    if (estado === "pendiente") return { texto: "Pendiente de retiro", clase: "pendiente" };
    if (estado === "cancelado") return { texto: "Cancelado", clase: "baja" };

    if (estado === "devuelto") {
        return atraso > 0
            ? { texto: `Devuelto con ${dias(atraso)} de atraso`, clase: "tarde" }
            : { texto: "Devuelto a tiempo", clase: "habilitado" };
    }

    if (estado === "vencido" || atraso > 0) {
        return { texto: atraso > 0 ? `Atrasado ${dias(atraso)}` : "Vencido", clase: "atraso" };
    }

    return { texto: "En préstamo", clase: "en-curso" };
}


/* --- Tabla del historial activo --- */
function crearTablaHistorial(prestamos) {

    if (prestamos.length === 0) {
        return crearElemento("p", "historial-vacio", "Todavía no pidió ningún libro.");
    }

    const tabla = crearElemento("table", "tabla-historial");
    const encabezado = document.createElement("thead");
    const filaTitulos = document.createElement("tr");

    ["Libro", "Pedido", "Entregado", "Devolver hasta", "Devuelto", "Estado"].forEach((titulo) => {
        filaTitulos.append(crearElemento("th", "", titulo));
    });

    encabezado.append(filaTitulos);

    const cuerpo = document.createElement("tbody");

    prestamos.forEach((prestamo) => {

        const { texto, clase } = estadoPrestamo(prestamo);
        const celdaEstado = document.createElement("td");
        celdaEstado.append(crearEtiqueta(texto, clase));

        const fila = document.createElement("tr");
        const titulo = prestamo.cantidad > 1 ? `${prestamo.titulo} (x${prestamo.cantidad})` : prestamo.titulo;

        fila.append(
            crearElemento("td", "", titulo),
            crearElemento("td", "", fechaCorta(prestamo.fecha_pedido)),
            crearElemento("td", "", fechaCorta(prestamo.fecha_entrega)),
            crearElemento("td", "", fechaCorta(prestamo.fecha_devolucion_estimada)),
            crearElemento("td", "", fechaCorta(prestamo.fecha_devolucion_real)),
            celdaEstado
        );

        cuerpo.append(fila);
    });

    tabla.append(encabezado, cuerpo);

    const marco = crearElemento("div", "marco-tabla");
    marco.append(tabla);

    return marco;
}


/* --- Lista de sanciones (en vigor y levantadas) --- */
function crearListaSanciones(sanciones) {

    if (sanciones.length === 0) {
        return crearElemento("p", "historial-vacio", "No tiene sanciones registradas.");
    }

    const lista = crearElemento("ul", "lista-sanciones");

    sanciones.forEach((sancion) => {

        const item = crearElemento("li", `sancion${sancion.en_vigor ? " en-vigor" : ""}`);

        const motivo = crearElemento("div", "sancion-motivo");
        motivo.append(
            crearElemento("span", "", sancion.motivo ?? "Sin motivo"),
            sancion.en_vigor ? crearEtiqueta("En vigor", "suspendido") : crearEtiqueta("Levantada", "baja")
        );

        const periodo = sancion.fecha_fin
            ? `del ${fechaCorta(sancion.fecha_inicio)} al ${fechaCorta(sancion.fecha_fin)}`
            : `desde el ${fechaCorta(sancion.fecha_inicio)}, sin fecha de fin`;

        const detalle = [
            sancion.tipo === "atraso" ? "Por atraso" : "Manual",
            periodo,
            `aplicada por ${sancion.aplicada_por ?? "el sistema"}`
        ].join(" · ");

        item.append(motivo, crearElemento("div", "sancion-detalle", detalle));
        lista.append(item);
    });

    return lista;
}


/**
 * Dibuja la ficha completa con lo que devuelve GET /api/usuarios/:id/historial.
 * nodos = { iniciales, nombre, subtitulo, cuerpo, acciones }
 */
export function dibujarFicha(nodos, { usuario, resumen, prestamos, sanciones }, esPropio = false) {

    // Cabecera
    nodos.iniciales.textContent = iniciales(usuario.nombre_completo);
    nodos.nombre.textContent = usuario.nombre_completo;
    nodos.subtitulo.replaceChildren(
        crearElemento("span", "", [ROLES[usuario.rol], usuario.curso].filter(Boolean).join(" · ")),
        crearEtiquetaCondicion(usuario.condicion)
    );

    // Cuerpo
    nodos.cuerpo.replaceChildren(
        crearAlertaCondicion(usuario, sanciones),
        crearCredencial(usuario),
        crearSubtitulo("history", "Historial activo"),
        crearNumeros(resumen),
        crearSubtitulo("book-open", "Entregas, devoluciones y atrasos"),
        crearTablaHistorial(prestamos),
        crearSubtitulo("shield-alert", "Sanciones"),
        crearListaSanciones(sanciones)
    );

    // Botones
    nodos.acciones.replaceChildren(...crearBotonesFicha(usuario, esPropio));

    refrescarIconos();
}


/* --- Ficha mientras carga o si hubo un error --- */
export function dibujarFichaMensaje(nodos, texto) {

    nodos.iniciales.textContent = "";
    nodos.nombre.textContent = "Ficha del usuario";
    nodos.subtitulo.replaceChildren();
    nodos.cuerpo.replaceChildren(crearElemento("p", "historial-vacio", texto));
    nodos.acciones.replaceChildren();
}
