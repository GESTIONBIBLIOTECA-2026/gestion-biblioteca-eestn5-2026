import { apiAlumno } from "./api.js";
const contenedor = document.querySelector("#historialPedidos");
const cantidad = document.querySelector("#cantidadHistorial");
const estados = { pendiente:"Pendiente", prestado:"En préstamo", devuelto:"Devuelto", vencido:"Vencido", cancelado:"Cancelado" };
const escapar = value => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
function fecha(value) {
  if (!value) return "—";
  const raw = String(value).slice(0,10);
  const [y,m,d] = raw.split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y,m-1,d).toLocaleDateString("es-AR",{ day:"2-digit",month:"short",year:"numeric" });
}
async function cargar() {
  try {
    const { payload } = await apiAlumno("/mis-pedidos/historial");
    const pedidos = payload || [];
    cantidad.textContent = `${pedidos.length} registro(s)`;
    contenedor.innerHTML = pedidos.length ? pedidos.map(p => `
      <article class="history-card"><div class="history-head"><div><h3>${escapar(p.titulo)}</h3><div class="order-no">Pedido #${escapar(p.pedido_id)} · ${escapar(p.cantidad)} ejemplar(es)</div></div><span class="status ${escapar(p.estado)}">${estados[p.estado] || escapar(p.estado)}</span></div>
      <div class="history-meta"><div><span>Fecha de solicitud</span>${escapar(fecha(p.fecha_pedido))}</div><div><span>Devolución estimada</span>${escapar(fecha(p.fecha_devolucion_estimada))}</div><div><span>Entrega registrada</span>${escapar(fecha(p.fecha_entrega))}</div><div><span>Devolución real</span>${escapar(fecha(p.fecha_devolucion_real))}</div></div>
      ${Number(p.dias_atraso) > 0 ? `<div class="message error" style="margin-bottom:0">Atraso registrado: ${escapar(p.dias_atraso)} día(s).</div>` : ""}
      ${p.estado === "pendiente" ? '<div class="message info" style="margin-bottom:0">Tu solicitud está pendiente de confirmación en el mostrador.</div>' : ""}
      </article>`).join("") : '<div class="empty-state">Todavía no tenés pedidos.<br>Explorá el catálogo para solicitar tu primer libro.</div>';
  } catch (error) {
    cantidad.textContent = "No disponible";
    contenedor.innerHTML = `<div class="message error">${escapar(error.message || "No se pudo cargar el historial.")}</div>`;
  }
}
cargar();
