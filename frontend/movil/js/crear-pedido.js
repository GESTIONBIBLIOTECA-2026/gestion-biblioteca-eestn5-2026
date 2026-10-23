import { apiAlumno } from "./api.js";
const catalogo = document.querySelector("#catalogoLibros");
const buscar = document.querySelector("#buscarLibro");
const cantidadLibros = document.querySelector("#cantidadLibros");
const panel = document.querySelector("#panelReserva");
const resumenLibro = document.querySelector("#resumenLibro");
const form = document.querySelector("#formReserva");
const selectCantidad = document.querySelector("#cantidad");
const fecha = document.querySelector("#fechaDevolucion");
const mensaje = document.querySelector("#mensajeReserva");
const botonEnviar = document.querySelector("#btnEnviarReserva");
let libros = [];
let seleccionado = null;
let puedePedir = true;
const escapar = value => String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
function hoyISO(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`; }
function mostrarMensaje(texto, tipo = "error") { mensaje.innerHTML = texto ? `<div class="message ${tipo}">${escapar(texto)}</div>` : ""; }

function dibujarCatalogo() {
  const termino = buscar.value.trim().toLocaleLowerCase("es");
  const visibles = libros.filter(l => [l.titulo,l.autores,l.categoria,l.isbn].some(v => String(v || "").toLocaleLowerCase("es").includes(termino)));
  cantidadLibros.textContent = `${visibles.length} título(s)`;
  catalogo.innerHTML = visibles.length ? visibles.map(l => {
    const stock = Number(l.stock_reservable) || 0;
    const habilitado = stock > 0 && puedePedir;
    return `<article class="book-card"><div><h3>${escapar(l.titulo)}</h3><p>${escapar(l.autores || "Autor no informado")} · ${escapar(l.categoria || "Sin categoría")}</p><span class="stock-pill ${stock < 1 || !puedePedir ? "none" : ""}">${!puedePedir ? "Cuenta no habilitada para reservar" : stock > 0 ? `${stock} disponible(s) para reservar` : "Sin stock reservable"}</span></div><div class="book-action"><button class="btn ${habilitado ? "primary" : ""}" type="button" data-seleccionar="${escapar(l.libro_id)}" ${!habilitado ? "disabled" : ""}>${!puedePedir ? "No habilitado" : stock ? "Reservar" : "No disponible"}</button></div></article>`;
  }).join("") : '<div class="empty-state">No encontramos libros para esa búsqueda.</div>';
}
async function cargarCatalogo() {
  try {
    const { payload: perfil } = await apiAlumno("/mis-pedidos/perfil");
    puedePedir = Boolean(perfil.puede_pedir);
    const estadoCuenta = document.querySelector("#estadoCuenta");
    estadoCuenta.innerHTML = puedePedir ? "" : `<div class="message error">Tu cuenta figura como <strong>${escapar(perfil.condicion || perfil.estado)}</strong>. Podés consultar tu historial, pero para generar una nueva reserva necesitás estar habilitado. Consultá con la biblioteca.</div>`;
    const { payload } = await apiAlumno("/mis-pedidos/libros");
    libros = payload || []; dibujarCatalogo();
  } catch (error) { catalogo.innerHTML = `<div class="message error">${escapar(error.message)}</div>`; cantidadLibros.textContent = "Error"; }
}
function seleccionarLibro(id) {
  if (!puedePedir) return;
  botonEnviar.disabled = false; botonEnviar.textContent = "Enviar solicitud";
  seleccionado = libros.find(l => String(l.libro_id) === String(id));
  if (!seleccionado) return;
  const stock = Number(seleccionado.stock_reservable) || 0;
  document.querySelector("#libroId").value = seleccionado.libro_id;
  resumenLibro.textContent = `${seleccionado.titulo} · ${stock} ejemplar(es) reservables`;
  selectCantidad.innerHTML = Array.from({length: Math.min(stock, 255)}, (_,i) => `<option value="${i+1}">${i+1} ${i === 0 ? "ejemplar" : "ejemplares"}</option>`).join("");
  fecha.min = hoyISO();
  fecha.value = hoyISO(new Date(Date.now() + 14 * 86400000));
  mostrarMensaje(""); panel.classList.remove("hidden"); panel.scrollIntoView({ behavior:"smooth", block:"start" });
}

buscar.addEventListener("input", dibujarCatalogo);
catalogo.addEventListener("click", event => { const boton = event.target.closest("button[data-seleccionar]"); if (boton) seleccionarLibro(boton.dataset.seleccionar); });
document.querySelector("#cancelarReserva").addEventListener("click", () => { panel.classList.add("hidden"); seleccionado = null; form.reset(); mostrarMensaje(""); });
form.addEventListener("submit", async event => {
  event.preventDefault(); mostrarMensaje("");
  if (!seleccionado) return mostrarMensaje("Seleccioná un libro del catálogo.");
  const cantidad = Number(selectCantidad.value);
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > Number(seleccionado.stock_reservable)) return mostrarMensaje("La cantidad supera el stock reservable. Actualizá el catálogo e intentá de nuevo.");
  if (!fecha.value || fecha.value < hoyISO()) return mostrarMensaje("La fecha de devolución debe ser hoy o una fecha futura.");
  botonEnviar.disabled = true; botonEnviar.textContent = "Enviando…";
  let pedidoRegistrado = false;
  try {
    const { mensaje: respuesta, payload } = await apiAlumno("/mis-pedidos", "POST", { libro_id: Number(seleccionado.libro_id), cantidad, fecha_devolucion_estimada: fecha.value });
    pedidoRegistrado = true;
    mostrarMensaje(`${respuesta} Número de pedido: #${payload?.id}.`, "success");
    botonEnviar.disabled = true; botonEnviar.textContent = "Pedido registrado";
    await cargarCatalogo();
  } catch (error) { mostrarMensaje(error.message || "No se pudo registrar el pedido."); }
  finally {
    if (!pedidoRegistrado) { botonEnviar.disabled = false; botonEnviar.textContent = "Enviar solicitud"; }
  }
});

cargarCatalogo();
