import { obtenerHistorialPedidos, actualizarPedidosVencidos } from "./api.js";
import { escapar, fechaCorta, crearFilaMensajeHTML, mostrarAviso } from "./ui.js";

const cuerpo = document.querySelector("#cuerpoHistorial");
const campoBusqueda = document.querySelector("#buscarHistorial");
const campoEstado = document.querySelector("#estadoHistorial");
const textoCantidad = document.querySelector("#textoCantidadHistorial");
let historialCompleto = [];
let historialVisible = [];
const etiquetas = { pendiente:"Pendiente", prestado:"Prestado", devuelto:"Devuelto", vencido:"Vencido", cancelado:"Cancelado" };

function renderizar() {
  const q = campoBusqueda.value.trim().toLocaleLowerCase("es");
  const estado = campoEstado.value;
  historialVisible = historialCompleto.filter(p => {
    const coincideTexto = !q || [p.nombre_completo, p.dni, p.titulo, p.pedido_id].some(v => String(v ?? "").toLocaleLowerCase("es").includes(q));
    return coincideTexto && (!estado || p.estado === estado);
  });
  textoCantidad.textContent = `${historialVisible.length} de ${historialCompleto.length} registros`;
  cuerpo.innerHTML = historialVisible.length ? historialVisible.map(p => `
    <tr><td>#${escapar(p.pedido_id)}</td>
    <td><span class="g4-primary-cell">${escapar(p.nombre_completo)}</span><span class="g4-secondary">DNI ${escapar(p.dni)}</span></td>
    <td>${escapar(p.titulo)}</td><td>${escapar(p.cantidad)}</td>
    <td>${escapar(fechaCorta(p.fecha_pedido))}</td><td>${escapar(fechaCorta(p.fecha_entrega))}</td>
    <td>${escapar(fechaCorta(p.fecha_devolucion_estimada))}</td><td>${escapar(fechaCorta(p.fecha_devolucion_real))}</td>
    <td>${Number(p.dias_atraso) > 0 ? `<span class="g4-badge vencido">${escapar(p.dias_atraso)} día(s)</span>` : "—"}</td>
    <td><span class="g4-badge ${escapar(p.estado)}">${etiquetas[p.estado] || escapar(p.estado)}</span></td></tr>`).join("") : crearFilaMensajeHTML("No hay registros que coincidan con los filtros.", 10);
  window.lucide?.createIcons();
}

async function cargar() {
  cuerpo.innerHTML = crearFilaMensajeHTML("Cargando historial…", 10);
  try {
    await actualizarPedidosVencidos();
    const { payload } = await obtenerHistorialPedidos();
    historialCompleto = payload || [];
    renderizar();
  } catch (error) {
    textoCantidad.textContent = "No se pudo cargar el historial";
    cuerpo.innerHTML = crearFilaMensajeHTML(error.message || "Error al cargar los registros.", 10);
    mostrarAviso(error.message || "No se pudo cargar el historial.", true);
  }
}

document.querySelector("#filtrosHistorial").addEventListener("submit", event => { event.preventDefault(); renderizar(); });
fieldEvents();
function fieldEvents() {
  campoBusqueda.addEventListener("input", renderizar);
  campoEstado.addEventListener("change", renderizar);
}
document.querySelector("#limpiarHistorial").addEventListener("click", () => { campoBusqueda.value = ""; campoEstado.value = ""; renderizar(); });
document.querySelector("#exportarCSV").addEventListener("click", () => {
  if (!historialVisible.length) return mostrarAviso("No hay filas para exportar.", true);
  const columnas = ["Pedido","Alumno","DNI","Libro","Cantidad","Fecha pedido","Fecha entrega","Devolución estimada","Devolución real","Días de atraso","Estado"];
  const filas = historialVisible.map(p => [p.pedido_id,p.nombre_completo,p.dni,p.titulo,p.cantidad,p.fecha_pedido,p.fecha_entrega,p.fecha_devolucion_estimada,p.fecha_devolucion_real,p.dias_atraso,p.estado]);
  const csvCell = value => `"${String(value ?? "").replaceAll('"','""')}"`;
  const csv = "\uFEFF" + [columnas, ...filas].map(row => row.map(csvCell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type:"text/csv;charset=utf-8;" }));
  const a = document.createElement("a"); a.href = url; a.download = `historial-pedidos-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  mostrarAviso("Historial exportado a CSV.");
});

cargar();
