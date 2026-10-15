/* ==========================================================================
   MÓDULO: tema.js - Tema claro / oscuro
   Se carga en el <head> como script COMÚN (no module), antes de los estilos,
   para que la página aparezca directamente con el tema elegido (sin parpadeo).

   Guarda la elección en localStorage y la aplica en <html data-tema="...">.
   También maneja TODOS los switches de "Apariencia" ([data-cambiar-tema]):
   menú del perfil, login y Configuración.
   ========================================================================== */

(function () {

    const CLAVE_TEMA = "biblioteca_tema";
    const TEMAS = ["oscuro", "claro"];
    const TEMA_POR_DEFECTO = "oscuro";

    function leerTema() {
        try {
            const guardado = localStorage.getItem(CLAVE_TEMA);
            return TEMAS.includes(guardado) ? guardado : TEMA_POR_DEFECTO;
        } catch (error) {
            return TEMA_POR_DEFECTO;
        }
    }

    function aplicarTema(tema, { animar = false } = {}) {

        const raiz = document.documentElement;
        const temaFinal = TEMAS.includes(tema) ? tema : TEMA_POR_DEFECTO;

        // Transición suave solo cuando el usuario lo cambia (no al cargar)
        if (animar) {
            raiz.classList.add("cambiando-tema");
            setTimeout(() => raiz.classList.remove("cambiando-tema"), 300);
        }

        raiz.dataset.tema = temaFinal;

        try {
            localStorage.setItem(CLAVE_TEMA, temaFinal);
        } catch (error) {
            // Sin localStorage (modo privado): el tema dura hasta recargar
        }

        // Aviso para los botones / opciones que muestran el tema actual
        document.dispatchEvent(new CustomEvent("tema-cambiado", { detail: { tema: temaFinal } }));
    }

    function alternarTema() {
        aplicarTema(leerTema() === "claro" ? "oscuro" : "claro", { animar: true });
    }

    // Los switches dicen si está activado el modo claro (para lectores de pantalla)
    function actualizarSwitches() {
        const esClaro = leerTema() === "claro";

        document.querySelectorAll("[data-cambiar-tema]").forEach((boton) => {
            boton.setAttribute("aria-checked", String(esClaro));
        });
    }

    // Aplicar ya mismo el tema guardado
    document.documentElement.dataset.tema = leerTema();

    // Clic en cualquier switch de Apariencia → cambia el tema
    document.addEventListener("click", (evento) => {
        if (evento.target.closest("[data-cambiar-tema]")) {
            alternarTema();
        }
    });

    document.addEventListener("tema-cambiado", actualizarSwitches);
    document.addEventListener("DOMContentLoaded", actualizarSwitches);

    // Disponible para los módulos: window.temaBiblioteca.alternar()
    window.temaBiblioteca = {
        obtener: leerTema,
        aplicar: (tema) => aplicarTema(tema, { animar: true }),
        alternar: alternarTema
    };
})();
