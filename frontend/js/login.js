/* ==========================================================================
   MÓDULO: login.js - Pantalla de Inicio de Sesión
   ========================================================================== */

import { iniciarSesion, obtenerPerfil } from "./api.js";
import { guardarSesion, obtenerToken } from "./storage.js";


// ==========================================================================
// 🎯 1. Nodos del DOM
// ==========================================================================
const formulario    = document.querySelector("#formularioLogin");
const campoDni      = document.querySelector("#dni");
const campoClave    = document.querySelector("#clave");
const botonLogin    = document.querySelector("#botonLogin");
const botonVerClave = document.querySelector("#botonVerClave");
const alerta        = document.querySelector("#alertaLogin");
const textoAlerta   = document.querySelector("#textoAlerta");


// ==========================================================================
// 🎨 2. Funciones de UI
// ==========================================================================
function mostrarError(mensaje) {
    textoAlerta.textContent = mensaje;
    alerta.hidden = false;
}

function ocultarError() {
    alerta.hidden = true;
}

function ponerCargando(cargando) {
    botonLogin.disabled = cargando;
    botonLogin.classList.toggle("cargando", cargando);
}


// ==========================================================================
// 🌐 3. Si ya hay una sesión válida, ir directo al panel
// ==========================================================================
async function revisarSesionExistente() {

    if (!obtenerToken()) return;

    try {
        await obtenerPerfil();
        window.location.replace("index.html");
    } catch (error) {
        // Token vencido o servidor apagado: se queda en el login
    }
}


// ==========================================================================
// 🖱️ 4. Eventos
// ==========================================================================

// 👁️ Mostrar / ocultar contraseña
botonVerClave.addEventListener("click", () => {

    const oculta = campoClave.type === "password";

    campoClave.type = oculta ? "text" : "password";
    botonVerClave.setAttribute("aria-label", oculta ? "Ocultar contraseña" : "Mostrar contraseña");
    botonVerClave.innerHTML = `<i data-lucide="${oculta ? "eye-off" : "eye"}"></i>`;

    lucide.createIcons();
});


// 🔑 Enviar el formulario
formulario.addEventListener("submit", async (evento) => {

    evento.preventDefault();
    ocultarError();

    const dni   = campoDni.value.trim();
    const clave = campoClave.value;

    if (!dni || !clave) {
        mostrarError("Completá el DNI y la contraseña.");
        return;
    }

    ponerCargando(true);

    try {
        // POST /api/auth/login
        const { token, usuario } = await iniciarSesion(dni, clave);

        guardarSesion({ token, usuario });
        window.location.href = "index.html";

    } catch (error) {

        // Sin status = error de red (el backend está apagado)
        mostrarError(error.status ? error.message : "No hay conexión con el servidor. Probá de nuevo.");

        campoClave.value = "";
        campoClave.focus();

    } finally {
        ponerCargando(false);
    }
});


// ==========================================================================
// 🚀 5. Inicialización
// ==========================================================================
revisarSesionExistente();
