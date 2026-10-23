import { verificarAlumnoPorDni, listarLibros, crearPedido } from "./api.js";
import { escapar, fechaCorta, mostrarAviso } from "./ui.js";

const form = document.querySelector("#formCrearPedido");
const dni = document.querySelector("#dniAlumno");
const botonVerificar = document.querySelector("#validarAlumno");
const resultadoAlumno = document.querySelector("#resultadoAlumno");
const selectLibro = document.querySelector("#libroId");
const campoCantidad = document.querySelector("#cantidad");
const fechaDevolucion = document.querySelector("#fechaDevolucion");
const stockCantidad = document.querySelector("#stockCantidad");
const stockLibro = document.querySelector("#stockLibro");
const resumen = document.querySelector("#resumenPedido");
const mensajeFormulario = document.querySelector("#mensajeFormulario");
const botonGuardar = document.querySelector("#guardarPedido");
let alumnoVerificado = null;
let libros = [];

function fechaLocalISO(fecha = new Date()) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, "0");
  const day = String(fecha.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function avisar(texto, error = false) {
  mensajeFormulario.innerHTML = texto ? `<div class="g4-notice ${error ? "error" : "success"}">${escapar(texto)}</div>` : "";
}
function libroSeleccionado() {
  return libros.find(libro => String(libro.libro_id) === selectLibro.value) || null;
}
function actualizarResumenStock() {
  const libro = libroSeleccionado();
  if (!libro) {
    stockCantidad.textContent = "—"; campoCantidad.max = ""; campoCantidad.disabled = false;
    resumen.textContent = alumnoVerificado ? `Alumno verificado: ${alumnoVerificado.nombre_completo}. Seleccioná un título disponible.` : "Primero verificá el DNI del alumno y seleccioná un libro disponible.";
    return;
  }
  const disponible = Number(libro.stock_reservable) || 0;
  stockCantidad.textContent = disponible;
  campoCantidad.max = Math.max(disponible, 1);
  campoCantidad.disabled = disponible < 1;
  if (disponible < 1) campoCantidad.value = 1;
  if (Number(campoCantidad.value) > disponible && disponible > 0) campoCantidad.value = disponible;
  const autor = libro.autores ? ` · ${libro.autores}` : "";
  resumen.innerHTML = `<div><strong>${escapar(libro.titulo)}</strong><p style="margin-top:6px">${escapar(libro.categoria || "Sin categoría")}${escapar(autor)}</p><p style="margin-top:8px">Reservables: <strong>${disponible}</strong> · Ejemplares físicos disponibles: ${Number(libro.ejemplares_disponibles) || 0}</p></div>`;
  stockLibro.style.borderColor = disponible > 0 ? "var(--verde-borde)" : "var(--bordo-borde)";
}

async function cargarCatalogo() {
  try {
    const { payload } = await listarLibros();
    libros = payload || [];
    selectLibro.innerHTML = '<option value="">Seleccioná un libro</option>' + libros.map(l => {
      const libres = Number(l.stock_reservable) || 0;
      return `<option value="${escapar(l.libro_id)}" ${libres < 1 ? "disabled" : ""}>${escapar(l.titulo)}${l.autores ? ` — ${escapar(l.autores)}` : ""} (${libres} reservables)</option>`;
    }).join("");
    if (!libros.length) selectLibro.innerHTML = '<option value="">No hay libros cargados en el catálogo</option>';
    actualizarResumenStock();
  } catch (error) {
    selectLibro.innerHTML = '<option value="">No se pudo cargar el catálogo</option>';
    avisar(error.message || "No se pudo cargar el catálogo. Revisá que el módulo del Grupo 6 esté inicializado.", true);
  }
}

async function validarAlumno() {
  const documento = dni.value.trim();
  alumnoVerificado = null;
  resultadoAlumno.innerHTML = "";
  if (!/^\d{7,8}$/.test(documento)) {
    resultadoAlumno.innerHTML = '<div class="g4-notice error">Ingresá un DNI válido de 7 u 8 números.</div>';
    actualizarResumenStock(); return;
  }
  botonVerificar.disabled = true;
  botonVerificar.textContent = "Verificando…";
  try {
    const { payload } = await verificarAlumnoPorDni(documento);
    alumnoVerificado = payload;
    const habilitado = Boolean(payload.puede_pedir);
    resultadoAlumno.innerHTML = `<div class="g4-user-result ${habilitado ? "ok" : "no"}"><strong>${escapar(payload.nombre_completo)}</strong><p>DNI: ${escapar(payload.dni)} · Curso: ${escapar(payload.curso || "No informado")}</p><p>Estado: <strong>${escapar(payload.condicion || payload.estado)}</strong></p><p>${habilitado ? "El usuario está habilitado para solicitar libros." : "El usuario no puede solicitar libros mientras esta condición siga vigente."}</p></div>`;
    if (!habilitado) mostrarAviso("El alumno no está habilitado para solicitar libros.", true);
    actualizarResumenStock();
  } catch (error) {
    alumnoVerificado = null;
    resultadoAlumno.innerHTML = `<div class="g4-notice error">${escapar(error.message || "No se encontró al alumno.")}</div>`;
    actualizarResumenStock();
  } finally {
    botonVerificar.disabled = false; botonVerificar.textContent = "Verificar";
  }
}

botonVerificar.addEventListener("click", validarAlumno);
dni.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); validarAlumno(); } });
dni.addEventListener("input", () => {
  alumnoVerificado = null; resultadoAlumno.innerHTML = ""; actualizarResumenStock();
});
selectLibro.addEventListener("change", actualizarResumenStock);
campoCantidad.addEventListener("input", () => {
  const libro = libroSeleccionado();
  const max = Number(libro?.stock_reservable || 0);
  if (max > 0 && Number(campoCantidad.value) > max) campoCantidad.value = max;
});

form.addEventListener("submit", async event => {
  event.preventDefault(); avisar("");
  const libro = libroSeleccionado();
  if (!alumnoVerificado || alumnoVerificado.dni !== dni.value.trim()) return avisar("Primero verificá un DNI válido.", true);
  if (!alumnoVerificado.puede_pedir) return avisar("Este usuario no está habilitado para pedir libros.", true);
  if (!libro) return avisar("Seleccioná un libro del catálogo.", true);
  const cantidad = Number(campoCantidad.value);
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > Number(libro.stock_reservable)) return avisar("La cantidad debe ser entera y no superar el stock reservable.", true);
  if (!fechaDevolucion.value || fechaDevolucion.value < fechaLocalISO()) return avisar("Elegí una fecha de devolución igual o posterior a hoy.", true);

  botonGuardar.disabled = true; botonGuardar.textContent = "Guardando pedido…";
  try {
    const { mensaje, payload } = await crearPedido({
      usuario_id: alumnoVerificado.id,
      libro_id: Number(libro.libro_id),
      cantidad,
      fecha_devolucion_estimada: fechaDevolucion.value
    });
    avisar(`${mensaje || "Pedido creado correctamente."} Número de pedido: #${payload?.id ?? "—"}.`);
    mostrarAviso(`Pedido #${payload?.id ?? ""} creado en estado pendiente.`);
    form.reset();
    alumnoVerificado = null; resultadoAlumno.innerHTML = "";
    fechaDevolucion.value = fechaLocalISO(new Date(Date.now() + 14 * 86400000));
    await cargarCatalogo();
    actualizarResumenStock();
  } catch (error) {
    avisar(error.message || "No se pudo registrar el pedido.", true);
  } finally {
    botonGuardar.disabled = false; botonGuardar.innerHTML = '<i data-lucide="check-circle-2"></i> Registrar pedido';
    window.lucide?.createIcons();
  }
});

fechaDevolucion.min = fechaLocalISO();
fechaDevolucion.value = fechaLocalISO(new Date(Date.now() + 14 * 86400000));
cargarCatalogo();
