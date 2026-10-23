import { listarPedidos, actualizarEstadoPedido, actualizarPedidosVencidos } from "./api.js";
import { escapar, fechaCorta, crearFilaMensajeHTML, mostrarAviso } from "./ui.js";

const cuerpo = document.querySelector("#cuerpoPedidos");
const formularioFiltros = document.querySelector("#filtrosPedidos");
const campoBusqueda = document.querySelector("#buscarPedido");
const campoEstado = document.querySelector("#filtroEstado");
let pedidosActuales = [];

const etiquetas = {
  pendiente: "Pendiente", prestado: "Prestado", devuelto: "Devuelto",
  vencido: "Vencido", cancelado: "Cancelado"
};

function accionesHTML(pedido) {
  if (pedido.estado === "pendiente") return `
    <button class="g4-btn small primary" data-accion="prestado" data-id="${pedido.id}">Registrar entrega</button>
    <button class="g4-btn small danger" data-accion="cancelado" data-id="${pedido.id}">Cancelar</button>`;
  if (pedido.estado === "prestado" || pedido.estado === "vencido") return `
    <button class="g4-btn small primary" data-accion="devuelto" data-id="${pedido.id}">Registrar devolución</button>`;
  return '<span class="g4-secondary">Sin acciones pendientes</span>';
}

function filaHTML(p) {
  const fechaPedido = fechaCorta(p.fecha_pedido);
  const fechaDevolucion = fechaCorta(p.fecha_devolucion_estimada);
  return `<tr>
    <td><span class="g4-primary-cell">${escapar(p.nombre_completo)}</span><span class="g4-secondary">DNI ${escapar(p.dni)}</span><span class="g4-secondary">Pedido #${escapar(p.id)}</span></td>
    <td><span class="g4-primary-cell">${escapar(p.titulo)}</span></td>
    <td>${escapar(p.cantidad)}</td><td>${escapar(fechaPedido)}</td><td>${escapar(fechaDevolucion)}</td>
    <td><span class="g4-badge ${escapar(p.estado)}">${etiquetas[p.estado] || escapar(p.estado)}</span></td>
    <td><div class="g4-row-actions">${accionesHTML(p)}</div></td>
  </tr>`;
}

function dibujar(pedidos) {
  pedidosActuales = pedidos;
  document.querySelector("#statTotal").textContent = pedidos.length;
  document.querySelector("#statPendientes").textContent = pedidos.filter(p => p.estado === "pendiente").length;
  document.querySelector("#statPrestados").textContent = pedidos.filter(p => p.estado === "prestado").length;
  document.querySelector("#statVencidos").textContent = pedidos.filter(p => p.estado === "vencido").length;
  cuerpo.innerHTML = pedidos.length ? pedidos.map(filaHTML).join("") : crearFilaMensajeHTML("No hay pedidos que coincidan con la búsqueda.", 7);
  window.lucide?.createIcons();
}

async function cargar() {
  cuerpo.innerHTML = crearFilaMensajeHTML("Cargando pedidos…", 7);
  try {
    const filtros = {};
    if (campoBusqueda.value.trim()) filtros.q = campoBusqueda.value.trim();
    if (campoEstado.value) filtros.estado = campoEstado.value;
    const { payload } = await listarPedidos(filtros);
    dibujar(payload || []);
  } catch (error) {
    cuerpo.innerHTML = crearFilaMensajeHTML(error.message || "No se pudieron cargar los pedidos.", 7);
    mostrarAviso(error.message || "No se pudieron cargar los pedidos.", true);
  }
}

formularioFiltros.addEventListener("submit", (evento) => { evento.preventDefault(); cargar(); });
document.querySelector("#btnLimpiar").addEventListener("click", () => {
  campoBusqueda.value = ""; campoEstado.value = ""; cargar();
});
document.querySelector("#btnActualizarVencidos").addEventListener("click", async (evento) => {
  const boton = evento.currentTarget;
  boton.disabled = true;
  try {
    const { payload } = await actualizarPedidosVencidos();
    mostrarAviso(`Control realizado. Pedidos marcados como vencidos: ${payload?.actualizados ?? 0}.`);
    await cargar();
  } catch (error) { mostrarAviso(error.message || "No se pudieron actualizar los vencimientos.", true); }
  finally { boton.disabled = false; }
});

cuerpo.addEventListener("click", async (evento) => {
  const boton = evento.target.closest("button[data-accion]");
  if (!boton) return;
  const { accion, id } = boton.dataset;
  const pedido = pedidosActuales.find(p => String(p.id) === String(id));
  const textos = { prestado: "registrar la entrega del libro", devuelto: "registrar la devolución del libro", cancelado: "cancelar este pedido" };
  if (!pedido || !confirm(`¿Querés ${textos[accion]} para ${pedido.nombre_completo} — ${pedido.titulo}?`)) return;
  boton.disabled = true;
  try {
    const { mensaje } = await actualizarEstadoPedido(id, accion);
    mostrarAviso(mensaje || "Estado actualizado correctamente.");
    await cargar();
  } catch (error) { mostrarAviso(error.message || "No se pudo actualizar el pedido.", true); boton.disabled = false; }
});

// Actualiza los vencimientos a la entrada para que la tabla muestre los estados vigentes.
(async () => {
  try { await actualizarPedidosVencidos(); } catch { /* La carga de la tabla mostrará el error si corresponde. */ }
  await cargar();
})();
