import { apiAlumno, leerSesionAlumno, cerrarSesionAlumno } from "./api.js";
const sesion = leerSesionAlumno();
if (!sesion?.token) window.location.replace("login.html");
else {
  try {
    const { payload } = await apiAlumno("/mis-pedidos/perfil");
    document.querySelectorAll("[data-nombre-alumno]").forEach(el => el.textContent = payload.nombre || sesion.usuario?.nombre || "Alumno");
    document.documentElement.classList.remove("verificando");
  } catch {
    cerrarSesionAlumno();
    window.location.replace("login.html");
  }
}
document.querySelectorAll("[data-cerrar-sesion-alumno]").forEach(boton => boton.addEventListener("click", () => { cerrarSesionAlumno(); window.location.replace("login.html"); }));
