/* ==========================================================================
   MÓDULO: configuracion.js - Pantalla "Configuración" (configuracion.html)
   - Datos del perfil ....... GET / PUT  /api/perfil
   - Cambiar contraseña ..... PUT        /api/perfil/clave
   - Apariencia ............. el switch luna / sol lo maneja js/tema.js
   ========================================================================== */

import { obtenerMiPerfil, guardarMiPerfil, cambiarMiClave } from "./api.js";
import { borrarSesion } from "./storage.js";
import { mostrarNombre } from "./sesion.js";


// ==========================================================================
// 🎯 1. Nodos del DOM
// ==========================================================================
const formularioPerfil   = document.querySelector("#formularioPerfil");
const avisoPerfil        = document.querySelector("#avisoPerfil");
const botonGuardarPerfil = document.querySelector("#botonGuardarPerfil");
const botonDeshacer      = document.querySelector("#botonDeshacerPerfil");
const campoDni           = document.querySelector("#perfilDni");
const campoRol           = document.querySelector("#perfilRol");
const campoDniOculto     = document.querySelector("[data-dni-oculto]");

const formularioClave    = document.querySelector("#formularioClave");
const avisoClave         = document.querySelector("#avisoClave");
const botonCambiarClave  = document.querySelector("#botonCambiarClave");

const avisoFlotante      = document.querySelector("#avisoFlotante");
const avisoTexto         = document.querySelector("#avisoTexto");

// Campos editables del perfil (el name coincide con lo que espera el backend)
const CAMPOS_PERFIL = ["nombre_completo", "correo", "telefono", "direccion"];

// Últimos datos guardados (para "Deshacer cambios")
let perfilGuardado = null;
let temporizadorAviso;


// ==========================================================================
// 🎨 2. Funciones de UI
// ==========================================================================
const conMayuscula = (texto = "") => texto.charAt(0).toUpperCase() + texto.slice(1);

function mostrarAvisoEn(aviso, texto, exito = false) {
    aviso.textContent = texto;
    aviso.classList.toggle("exito", exito);
    aviso.hidden = false;
}

function mostrarAvisoFlotante(texto) {
    avisoTexto.textContent = texto;
    avisoFlotante.className = "aviso-flotante exito";
    avisoFlotante.hidden = false;

    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => { avisoFlotante.hidden = true; }, 3500);
}

/* --- Marca los campos mal cargados que manda el backend: { campo: "mensaje" } --- */
function marcarCampos(formulario, campos = {}) {

    formulario.querySelectorAll("[data-pista]").forEach((pista) => {
        const nombre = pista.dataset.pista;
        const mensaje = campos?.[nombre] ?? "";
        const campo = formulario.elements[nombre];

        pista.textContent = mensaje;
        pista.classList.toggle("error", Boolean(mensaje));
        campo?.setAttribute("aria-invalid", String(Boolean(mensaje)));
    });

    // El cursor va al primer campo con error
    const primero = Object.keys(campos ?? {})[0];
    formulario.elements[primero]?.focus();
}

function limpiarErrores(formulario, aviso) {
    marcarCampos(formulario, {});
    aviso.hidden = true;
}

/* --- Error de red o del backend → aviso. 401 = la sesión venció --- */
function mostrarError(aviso, formulario, error) {

    if (error.status === 401) {
        borrarSesion();
        window.location.replace("login.html");
        return;
    }

    mostrarAvisoEn(aviso, error.status ? error.message : "No hay conexión con el servidor.");

    if (error.campos) marcarCampos(formulario, error.campos);
}

/* --- Completa el formulario con los datos del perfil --- */
function completarPerfil(usuario) {

    perfilGuardado = usuario;

    CAMPOS_PERFIL.forEach((nombre) => {
        formularioPerfil.elements[nombre].value = usuario[nombre] ?? "";
    });

    campoDni.value = usuario.dni ?? "";
    campoRol.value = conMayuscula(usuario.rol);
    campoDniOculto.value = usuario.dni ?? "";

    formularioPerfil.elements.nombre_completo.placeholder = "Ej.: Martina González";
}


// ==========================================================================
// 🌐 3. Datos del perfil
// ==========================================================================
async function cargarPerfil() {

    try {
        completarPerfil(await obtenerMiPerfil());

    } catch (error) {
        mostrarError(avisoPerfil, formularioPerfil, error);
    }
}

formularioPerfil.addEventListener("submit", async (evento) => {

    evento.preventDefault();
    limpiarErrores(formularioPerfil, avisoPerfil);

    const datos = Object.fromEntries(CAMPOS_PERFIL.map((nombre) => [
        nombre, formularioPerfil.elements[nombre].value.trim()
    ]));

    botonGuardarPerfil.disabled = true;

    try {
        const { mensaje, payload } = await guardarMiPerfil(datos);

        completarPerfil(payload);

        // El nombre nuevo también se ve en el encabezado
        mostrarNombre(payload.nombre_completo, payload.rol);

        mostrarAvisoFlotante(mensaje);

    } catch (error) {
        mostrarError(avisoPerfil, formularioPerfil, error);

    } finally {
        botonGuardarPerfil.disabled = false;
    }
});

botonDeshacer.addEventListener("click", () => {
    if (!perfilGuardado) return;

    limpiarErrores(formularioPerfil, avisoPerfil);
    completarPerfil(perfilGuardado);
});


// ==========================================================================
// 🔑 4. Cambiar contraseña
// ==========================================================================
formularioClave.addEventListener("submit", async (evento) => {

    evento.preventDefault();
    limpiarErrores(formularioClave, avisoClave);

    const datos = {
        clave_actual: formularioClave.elements.clave_actual.value,
        clave_nueva: formularioClave.elements.clave_nueva.value,
        confirmacion: formularioClave.elements.confirmacion.value
    };

    // Chequeo rápido antes de ir al servidor (el backend vuelve a validar todo)
    if (datos.clave_nueva !== datos.confirmacion) {
        marcarCampos(formularioClave, { confirmacion: "Las contraseñas no coinciden." });
        return;
    }

    botonCambiarClave.disabled = true;

    try {
        const { mensaje } = await cambiarMiClave(datos);

        formularioClave.reset();
        campoDniOculto.value = campoDni.value;
        mostrarAvisoEn(avisoClave, mensaje, true);

    } catch (error) {
        mostrarError(avisoClave, formularioClave, error);

    } finally {
        botonCambiarClave.disabled = false;
    }
});

// Botones del ojito: mostrar / ocultar cada contraseña
document.querySelectorAll("[data-ver-clave]").forEach((boton) => {

    boton.addEventListener("click", () => {
        const campo = document.getElementById(boton.dataset.verClave);
        const mostrar = campo.type === "password";

        campo.type = mostrar ? "text" : "password";
        boton.setAttribute("aria-label", mostrar ? "Ocultar contraseña" : "Mostrar contraseña");
        boton.title = boton.getAttribute("aria-label");
    });
});


// ==========================================================================
// 🚀 5. Inicialización
// ==========================================================================
cargarPerfil();
