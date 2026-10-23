import { apiAlumno, leerSesionAlumno, guardarSesionAlumno } from "./api.js";
const form = document.querySelector("#formLoginAlumno");
const mensaje = document.querySelector("#mensajeLogin");
const boton = document.querySelector("#btnLoginAlumno");
function mostrarError(texto) { mensaje.innerHTML = `<div class="message error">${escapar(texto)}</div>`; }
function escapar(texto) { return String(texto ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;"); }

if (leerSesionAlumno()?.token) {
  try { await apiAlumno("/mis-pedidos/perfil"); window.location.replace("crear-pedido.html"); } catch { localStorage.removeItem("biblioteca_sesion_alumno_v1"); }
}
form.addEventListener("submit", async (event) => {
  event.preventDefault(); mensaje.innerHTML = "";
  const dni = form.elements.dni.value.trim();
  const clave = form.elements.clave.value;
  if (!/^\d{7,8}$/.test(dni) || !clave) return mostrarError("Ingresá tu DNI y contraseña correctamente.");
  boton.disabled = true; boton.textContent = "Ingresando…";
  try {
    const { payload } = await apiAlumno("/auth/login-alumno", "POST", { dni, clave }, false);
    guardarSesionAlumno(payload);
    window.location.replace("crear-pedido.html");
  } catch (error) { mostrarError(error.message); }
  finally { boton.disabled = false; boton.textContent = "Ingresar"; }
});
