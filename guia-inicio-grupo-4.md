# 🚀 Guía de Inicio a la Programación — GRUPO 4
## Módulo: Gestión de Pedidos, Reservas y Mesa de Entrada

> **Integrantes:** Tiziano Latorre, Ivan Masalis, Leonel Mirez, Alex Gauto, Mateo Grajales.  
> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Repositorio:** [gestion-biblioteca-eestn5-2026](https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026)  
> **Rama de Trabajo:** `g4` | **Ramas Individuales:** `g4-latorre`, `g4-masalis`, `g4-mierez`, `g4-gauto`, `g4-grajales`

---

## 🎬 1. El Hilo Conductor: Tu Rol en la Película del Proyecto

Tu grupo es el **orquestador de las transacciones y préstamos**:

1. **Cuando el alumno toca "Reservar" en la PWA:** Tu módulo toma el ID del alumno y del libro, consulta que el usuario esté habilitado (vía Grupo 5) y que haya stock (vía Grupo 6), y genera la solicitud en estado `Pendiente de Retiro`.
2. **Cuando el alumno va a la Biblioteca:** El bibliotecario entra a la pantalla de la Web (Mesa de Entrada), busca la solicitud de retiro y presiona **"Confirmar Entrega"**. El pedido pasa a `En Préstamo` y se descuenta el stock.
3. **Cuando el alumno devuelve el libro:** El bibliotecario registra la devolución en tu pantalla Web, el estado pasa a `Devuelto` y el stock vuelve a sumarse.

---

## 🛠️ 2. Guía Paso a Paso para Empezar a Programar

### 📌 PASO 1: Creación de la Tabla en Base de Datos
Verifiquen que en MySQL exista la tabla `pedidos` (creada en equipo con el Grupo 5):

```sql
CREATE TABLE IF NOT EXISTS pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_libro INT NOT NULL,
    cantidad INT DEFAULT 1,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_estimada DATE NOT NULL,
    fecha_devolucion_real DATETIME NULL,
    estado ENUM('pendiente', 'aprobado', 'prestado', 'devuelto', 'vencido', 'cancelado') DEFAULT 'pendiente',
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_libro) REFERENCES libros(id_libro) ON DELETE CASCADE
);
```

---

### 📌 PASO 2: Maquetación de Pantallas (HTML + CSS)

Creen dentro de su módulo:

#### A) `frontend/pwa/mis-pedidos.html` (App Móvil PWA - Celular del Alumno)
* Pantalla de seguimiento personal de solicitudes.
* Listado de tarjetas de pedidos con fecha y estado: 
  * 🟡 **Pendiente de Retiro** (esperando que vaya a la biblioteca)
  * 🔵 **En Préstamo** (libro en mano del alumno)
  * 🟢 **Devuelto**
  * 🔴 **Vencido** (alerta de fecha límite superada)

#### B) `frontend/web/mesa-entrada.html` (Plataforma Web - Escritorio del Bibliotecario)
* Listado general de solicitudes del día.
* Filtros por estado (*Pendientes de Entrega / En Préstamo*).
* Botones de acción rápida: **"Confirmar Entrega de Libro"** y **"Registrar Devolución"**.

---

### 📌 PASO 3: Lógica JavaScript y Peticiones API (`fetch`)

Creen el archivo `js/pedidos.js`:

#### Ejemplo de Petición Fetch para crear una reserva desde la PWA:
```javascript
// Enviar solicitud de reserva desde el celular del alumno
async function crearReserva(idUsuario, idLibro) {
    try {
        // 1. Validaciones previas
        const respUsuario = await fetch(`http://localhost:3000/api/usuarios/${idUsuario}`);
        const usuario = await respUsuario.json();
        if (usuario.estado !== 'habilitado') {
            alert('No podés reservar libros porque tu cuenta está suspendida por mora.');
            return;
        }

        // 2. Enviar pedido de reserva
        const respuesta = await fetch('http://localhost:3000/api/pedidos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: idUsuario,
                id_libro: idLibro,
                fecha_devolucion_estimada: '2026-10-01'
            })
        });

        const resultado = await respuesta.json();
        alert('¡Reserva creada con éxito! Pasá por la biblioteca a retirar tu libro.');
        window.location.href = 'mis-pedidos.html';
    } catch (error) {
        console.error('Error al realizar reserva:', error);
    }
}
```

---

## 📡 Endpoints JSON que maneja tu módulo

| Método | Ruta API | Descripción | Respuesta JSON Ejemplo |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/pedidos` | Crea una nueva solicitud de reserva | `{"mensaje": "Reserva creada con éxito", "id_pedido": 101}` |
| **GET** | `/api/pedidos/usuario/:id` | Obtené las reservas de un alumno (PWA) | `[{"id_pedido": 101, "titulo": "Física I", "estado": "pendiente"}]` |
| **PUT** | `/api/pedidos/:id/estado` | Cambia estado (ej: `prestado` o `devuelto`) | `{"mensaje": "Estado de pedido actualizado"}` |

---

📌 *Guía de Inicio Grupo 4 — E.E.S.T. N° 5 (2026)*
