# 🚀 Guía de Inicio a la Programación — GRUPO 5
## Módulo: Gestión de Usuarios, Base de Datos y Panel Admin

> **Integrantes:** Franco Barufaldi *(Lead DB)*, Dylan Andrada *(Líder General)*, Francisco Peña, Marcos Palacios, Thiago Gioia.  
> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Repositorio:** [gestion-biblioteca-eestn5-2026](https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026)  
> **Rama de Trabajo:** `g5` | **Ramas Individuales:** `g5-barufaldi`, `g5-andrada`, `g5-pena`, `g5-palacios`, `g5-gioia`

---

## 🎬 1. El Hilo Conductor: Tu Rol en la Película del Proyecto

Tu grupo es el **corazón de datos e identificación del sistema**:

1. **Cuando el alumno abre la PWA en su celular:** Entra a su Credencial Digital. La App le pregunta a tu módulo: *¿Quién es este alumno? ¿Está habilitado o suspendido?*.
2. **Cuando el alumno intenta reservar un libro (Grupo 4):** El módulo de pedidos le consulta a tu módulo: *¿Juan Perez (DNI 45123456) puede llevarse un libro o tiene sanciones/moras?*.
3. **En la Administración Web:** El bibliotecario usa tu pantalla para dar de alta nuevos alumnos, modificar sus datos o aplicar suspensiones si no devolvieron un libro a tiempo.

---

## 🛠️ 2. Guía Paso a Paso para Empezar a Programar

### 📌 PASO 1: Trabajo en Base de Datos (Franco Barufaldi & Equipo)
Desde Visual Studio Code, abran la extensión **Database Client** conectada a **Aiven MySQL** y ejecuten el script de creación de las tablas de usuarios y sanciones:

```sql
-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    curso VARCHAR(50) DEFAULT 'Docente/Personal',
    correo VARCHAR(100),
    telefono VARCHAR(30),
    direccion VARCHAR(150),
    rol ENUM('alumno', 'docente', 'admin') DEFAULT 'alumno',
    estado ENUM('habilitado', 'suspendido') DEFAULT 'habilitado',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Sanciones / Atrasos
CREATE TABLE IF NOT EXISTS sanciones (
    id_sancion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    dias_atraso INT DEFAULT 0,
    observacion TEXT,
    fecha_sancion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE
);
```

---

### 📌 PASO 2: Maquetación de Pantallas (HTML + CSS)

Creen dentro de la estructura de carpetas de su módulo:

#### A) `frontend/web/admin-usuarios.html` (Plataforma Web - Escritorio)
* Un formulario para dar de alta nuevos alumnos (campos: Nombre completo, DNI, Curso, Email, Teléfono, Dirección).
* Una tabla con la lista de usuarios cargados, un `<input type="search">` para buscar por DNI/Nombre, y un botón de acción *"Suspender / Habilitar"*.

#### B) `frontend/pwa/perfil.html` (App Móvil PWA - Celular)
* Una tarjeta estilo **Credencial Digital**: Foto/Avatar, Nombre del Alumno, DNI, Curso.
* Un indicador visual (Badge): 🟢 **Habilitado** o 🔴 **Suspendido por Mora**.
* Sección *"Mis préstamos activos e historial"*.

---

### 📌 PASO 3: Lógica JavaScript y Peticiones API (`fetch`)

Creen el archivo `js/usuarios.js`:

#### Ejemplo de Petición Fetch para consultar un usuario desde el cliente:
```javascript
// Obtener datos del perfil del alumno por DNI
async function cargarPerfilUsuario(dni) {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/usuarios/${dni}`);
        const usuario = await respuesta.json();
        
        // Dibujar en el DOM
        document.getElementById('nombre-alumno').textContent = usuario.nombre_completo;
        document.getElementById('dni-alumno').textContent = usuario.dni;
        document.getElementById('curso-alumno').textContent = usuario.curso;
        
        const badgeEstado = document.getElementById('badge-estado');
        if (usuario.estado === 'habilitado') {
            badgeEstado.className = 'badge badge-exito';
            badgeEstado.textContent = '🟢 Habilitado';
        } else {
            badgeEstado.className = 'badge badge-error';
            badgeEstado.textContent = '🔴 Suspendido';
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}
```

---

## 📡 Endpoints JSON que debe proveer tu módulo

| Método | Ruta API | Descripción | Respuesta JSON Ejemplo |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/usuarios/:dni` | Devuelve datos de un usuario por DNI | `{"id_usuario": 1, "nombre_completo": "Juan Perez", "dni": "45123456", "curso": "7mo 5ta", "estado": "habilitado"}` |
| **POST** | `/api/usuarios` | Alta de nuevo usuario (Web) | `{"mensaje": "Usuario creado con éxito", "id_usuario": 2}` |
| **PUT** | `/api/usuarios/:id/estado` | Cambia estado a suspendido/habilitado | `{"mensaje": "Estado actualizado correctamente"}` |

---

📌 *Guía de Inicio Grupo 5 — E.E.S.T. N° 5 (2026)*
