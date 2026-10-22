/* ==========================================================================
   MÓDULO: navegacion.js - Menú y acceso según el rol
   - Administrador ...... ve el panel completo (el menú que ya trae cada página)
   - Alumno / docente ... menú reducido: Inicio · Catálogo · Configuración
   Cada página dice quién puede verla en <html data-acceso="...">:
     "admin" = solo administrador · "usuario" = solo alumno/docente · sin atributo = todos
   ========================================================================== */

// Página de inicio de cada rol (la usan el login y las redirecciones)
export const inicioSegunRol = (rol) => (rol === "administrador" ? "index.html" : "inicio-usuario.html");

// [página, ícono Lucide, texto] del menú de alumnos y docentes
const MENU_USUARIO = [
    ["inicio-usuario.html", "house", "Inicio"],
    ["catalogo.html", "book", "Catálogo"],
    ["configuracion.html", "settings", "Configuración"]
];


// 🎨 Plantilla de un ítem del menú (marca la página actual)
function crearItemMenuHTML([pagina, icono, texto]) {
    const actual = location.pathname.endsWith(pagina);

    return `
        <a href="${pagina}" class="nav-item${actual ? " activo" : ""}" ${actual ? 'aria-current="page"' : ""} title="${texto}">
            <i data-lucide="${icono}"></i>
            <span>${texto}</span>
        </a>`;
}


/**
 * Adapta la página al rol de quien inició sesión.
 * Devuelve false si esa persona no puede estar acá (y la manda a su inicio).
 */
export function adaptarAlRol(rol) {
    const esAdmin = rol === "administrador";
    const acceso = document.documentElement.dataset.acceso;

    // 1. Página de otro rol → a su inicio
    if ((acceso === "admin" && !esAdmin) || (acceso === "usuario" && esAdmin)) {
        window.location.replace(inicioSegunRol(rol));
        return false;
    }

    if (esAdmin) return true;

    // 2. Alumno o docente: menú reducido, logo a su inicio y título del encabezado
    document.querySelector(".sidebar-nav").innerHTML = MENU_USUARIO.map(crearItemMenuHTML).join("");
    document.querySelector(".sidebar-logo").href = inicioSegunRol(rol);
    document.querySelector(".titulo-encabezado").textContent = "Mi biblioteca";
    window.lucide?.createIcons();

    return true;
}
