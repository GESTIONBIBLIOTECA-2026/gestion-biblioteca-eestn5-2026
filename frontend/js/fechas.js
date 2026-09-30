/* ==========================================================================
   MÓDULO: fechas.js - Formato de fechas para mostrar en pantalla
   El backend manda las fechas como texto: "2026-09-30" o "2026-09-30 18:40:00"
   ========================================================================== */

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];


/* --- "2026-09-30 18:40:00" → "30 sep 2026"  (null → "-") --- */
export function fechaCorta(texto) {

    if (!texto) return "-";

    const [anio, mes, dia] = texto.slice(0, 10).split("-").map(Number);

    return `${dia} ${MESES[mes - 1]} ${anio}`;
}


/* --- Hoy en texto largo: "Miércoles, 30 de septiembre de 2026" --- */
export function fechaDeHoy() {

    const texto = new Date().toLocaleDateString("es-AR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    // Primera letra en mayúscula
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}
