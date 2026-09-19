# 🚀 Guía de Inicio y Flujo de Pantallas — GRUPO 4
## Módulo: Gestión de Pedidos, Reservas y Mesa de Entrada

> **Integrantes:** Tiziano Latorre, Ivan Masalis, Leonel Mirez, Alex Gauto, Mateo Grajales.  
> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Repositorio:** [gestion-biblioteca-eestn5-2026](https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026)  
> **Rama de Trabajo:** `g4` | **Ramas Individuales:** `g4-latorre`, `g4-masalis`, `g4-mierez`, `g4-gauto`, `g4-grajales`

---

## 📱 1. Flujo del Usuario en la App Móvil PWA (Experiencia en el Celular)

### 📌 Paso A: Solicitud de Reserva desde el Celular
1. **Inicio de Reserva:** Cuando un alumno encuentra un libro 🟢 **Disponible** en el catálogo (Grupo 6) y presiona **"Reservar Libro"**, se activa la pantalla de confirmación de reserva.
2. **Confirmación:** La app le muestra un resumen del libro seleccionado y le pide seleccionar la fecha estimada en la que se presentará en la biblioteca a buscarlo.
3. **Validaciones Automáticas:** Al tocar *"Confirmar Reserva"*, la app verifica automáticamente dos condiciones:
   - Que el alumno esté **Habilitado** (sin suspensiones ni atrasos pendientes del Grupo 5).
   - Que el libro tenga **Stock disponible** (del Grupo 6).
4. **Generación del Pedido:** Si las validaciones son correctas, el pedido se registra con el estado **🟡 Pendiente de Retiro** y se le avisa al alumno con un mensaje en pantalla: *"¡Reserva creada! Tenés 48hs para retirar el libro por la biblioteca"*.

### 📋 Paso B: Sección "Mis Pedidos" (Seguimiento del Alumno)
1. **Acceso:** El alumno cuenta con una pestaña llamada **"Mis Pedidos"** para consultar sus solicitudes.
2. **Estados Visibles:** Cada tarjeta de pedido le informa claramente la situación actual de su libro:
   * 🟡 **Pendiente de Retiro:** La reserva fue aceptada; el alumno debe ir a buscar el libro al mostrador.
   * 🔵 **En Préstamo:** El alumno ya retiró el libro y lo tiene en su poder (muestra la fecha límite de devolución).
   * 🟢 **Devuelto:** El libro fue entregado correctamente en la biblioteca y el préstamo se cerró.
   * 🔴 **Vencido:** La fecha límite pasó y el alumno debe devolver el libro de inmediato.

---

## 💻 2. Flujo en la Plataforma Web (Mesa de Entrada / Mostrador)

Esta interfaz está diseñada para que la utilice el bibliotecario cuando atiende a los alumnos en el mostrador:

1. **Panel de Recepción de Solicitudes:** El bibliotecario ve una lista en tiempo real de los alumnos que reservaron libros desde su celular.
2. **Confirmación de Entrega:** Cuando el alumno se presenta físicamente en el mostrador, el bibliotecario busca la solicitud y presiona **"Confirmar Entrega"**. En ese instante:
   - El estado del pedido pasa a 🔵 **En Préstamo**.
   - El stock del libro se descuenta automáticamente en el catálogo.
3. **Registro de Devolución:** Cuando el alumno trae el libro de regreso, el bibliotecario busca el préstamo activo y presiona **"Registrar Devolución"**. El préstamo pasa a 🟢 **Devuelto** y el libro vuelve a estar disponible para otros alumnos.

---

## 🎯 Resumen: ¿Qué pantallas tiene que diseñar tu grupo?

* **En la App Móvil (PWA Celular):**
  - `confirmar-reserva.html`: Venta modal/pantalla para confirmar la solicitud con la fecha de retiro.
  - `mis-pedidos.html`: Pantalla de seguimiento personal de solicitudes con badges de estado (Pendiente, En Préstamo, Devuelto, Vencido).
* **En la Plataforma Web (Escritorio):**
  - `mesa-entrada.html`: Panel del bibliotecario para confirmar entregas físicas y registrar devoluciones de libros.

---

📌 *Guía de Flujo Funcional Grupo 4 — E.E.S.T. N° 5 (2026)*
