const base = (() => {
  const host = window.location.hostname;
  const port = window.location.port;
  if ((host === "localhost" || host === "127.0.0.1") && port && port !== "3000") return "http://localhost:3000/api";
  return `${window.location.origin}/api`;
})();
const STORAGE_KEY = "biblioteca_sesion_alumno_v1";
export function leerSesionAlumno() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
export function guardarSesionAlumno(sesion) { localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion)); }
export function cerrarSesionAlumno() { localStorage.removeItem(STORAGE_KEY); }
export async function apiAlumno(ruta, metodo = "GET", datos = null, usarToken = true) {
  const sesion = leerSesionAlumno();
  const headers = { "Content-Type": "application/json" };
  if (usarToken && sesion?.token) headers.Authorization = `Bearer ${sesion.token}`;
  let response;
  try {
    response = await fetch(`${base}${ruta}`, { method: metodo, headers, body: datos ? JSON.stringify(datos) : null, signal: AbortSignal.timeout(12000) });
  } catch {
    throw new Error("No hay conexión con la biblioteca. Revisá que el servidor esté encendido.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Ocurrió un error (${response.status}).`);
    error.status = response.status;
    throw error;
  }
  return data;
}
