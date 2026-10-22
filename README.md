# 📚 Biblioteca Invaluable · Panel de Administración (Grupo 5)

Panel del bibliotecario con arquitectura **MVC**, todo en **JavaScript** (sin PHP):

- **Frontend:** HTML + CSS (carpeta `css/`) + JS con ES Modules.
- **Backend:** Node.js + Express, como en la clase 06.
- **Base de datos:** MySQL en Aiven, conectada desde Node con **`mysql2`** (pool de conexiones + SSL).

```text
[ Frontend ]  fetch()  ─►  [ Express: Router ➔ Controller ➔ Model ]  ─►  mysql2  ─►  [ MySQL Aiven ]
 localhost:3000 / Live Server        backend/ (puerto 3000)              src/database/db.js
```

> 🧠 **Guía de Razonamiento y Arquitectura MVC (Obligatoria para G4, G5 y G6):**  
> Consultá [docs/roadmap-implementacion-mvc.md](docs/roadmap-implementacion-mvc.md) para entender el flujo mental en 4 pasos (Model ➔ Controller ➔ Router ➔ View) y el orden de dependencias entre los 3 grupos.

---

## 📂 Estructura

```text
.
├── frontend/
│   ├── login.html, index.html, usuarios.html, configuracion.html
│   ├── css/                      estilo-general.css (temas, menú lateral, encabezado, botones),
│   │                             index.css, login.css, usuarios.css, configuracion.css
│   └── js/                       ES Modules (import / export), cada archivo ~100 líneas o menos
│       ├── config.js             URL del backend
│       ├── api.js                fetch al backend (async/await, response.ok, AbortSignal)
│       ├── storage.js            sesión en localStorage (JSON)
│       ├── ui.js                 fechas, aviso flotante, errores de formularios y plantillas generales
│       ├── tema.js               modo claro / oscuro con classList (script común en el <head>)
│       ├── sesion.js             protege las páginas + encabezado (nombre, reloj, menú del perfil)
│       ├── login.js              login.html
│       ├── inicio.js             index.html: atrasos pendientes y últimos préstamos
│       ├── usuarios.js           usuarios.html: búsqueda, chips y paginación
│       ├── usuarios-ui.js        plantillas HTML de usuarios (fila, opciones, ficha)
│       ├── usuarios-dialogos.js  alta / modificación y ficha con historial activo
│       ├── usuarios-estado.js    suspender, dar de baja y reactivar
│       ├── menu-acciones.js      menú desplegable "Acciones" de la tabla
│       └── configuracion.js      configuracion.html: mis datos y contraseña
│
└── backend/                      MVC: index.js ➔ Router ➔ Controller ➔ Model ➔ MySQL
    ├── index.js                  servidor Express (cors, express.json, rutas)
    ├── .env.example              plantilla (el .env real NO se sube)
    ├── src/
    │   ├── config/config.js      variables del .env y reglas del negocio
    │   ├── database/db.js        pool de mysql2 → MySQL Aiven (SSL)
    │   ├── models/               MODEL: solo SQL con comodines "?", devuelve datos
    │   │   ├── usuario.models.js, busqueda.models.js, sancion.models.js, perfil.models.js
    │   │   └── curso.models.js, prestamo.models.js, libro.models.js
    │   ├── controllers/          CONTROLLER: reglas de negocio y respuesta HTTP
    │   │   ├── auth, perfil, usuarios, sanciones
    │   │   └── cursos, prestamos, libros
    │   ├── routes/               ROUTER: URL + verbo HTTP → controlador
    │   └── middlewares/          auth (token), validaciones (URL), formularios (body), límite de intentos
    └── scripts/                  schema.sql, datos-prueba-grupo5.sql, crear-admin-inicial.js
```

### Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | Body `{ "dni", "clave" }` → `{ payload: { token, usuario } }` |
| `GET` | `/api/auth/perfil` | Quién está logueado → `{ payload: { id, nombre, rol } }` |
| `GET` | `/api/perfil` | Mis datos completos (pantalla Configuración) |
| `PUT` | `/api/perfil` | Body `{ nombre_completo, correo, telefono, direccion }` (el DNI y el rol no se cambian desde acá) |
| `PUT` | `/api/perfil/clave` | Body `{ clave_actual, clave_nueva, confirmacion }` |
| `GET` | `/api/prestamos?limite=5` | Últimos préstamos (en curso, atrasados y devueltos) |
| `GET` | `/api/libros/:id` | Título, autores y stock del libro |
| **Grupo 5** | | |
| `GET` | `/api/usuarios?nombre=&dni=&curso=&filtro=&pagina=` | Búsqueda avanzada + listado (10 por página) y cantidad por filtro |
| `GET` | `/api/usuarios/dni/:dni` | Nombre, curso y si el usuario puede llevarse libros (para validar al usuario antes de un préstamo — Grupo 4) |
| `GET` | `/api/usuarios/:id` | Los 6 datos del usuario, tipo y estado |
| `GET` | `/api/usuarios/:id/historial` | Historial activo: entregas, devoluciones, atrasos y sanciones |
| `POST` | `/api/usuarios` | Alta. Body `{ nombre_completo, dni, rol, curso, correo, telefono, direccion, clave }` |
| `PUT` | `/api/usuarios/:id` | Modificación (mismo body; `clave` vacía = no se cambia) |
| `PATCH` | `/api/usuarios/:id/estado` | Body `{ "estado": "suspendido" \| "habilitado" \| "baja", "motivo" }` |
| `GET` | `/api/cursos` | Cursos para autocompletar |

`filtro` puede ser `todos`, `alumnos`, `docentes`, `administradores`, `morosos`, `suspendidos` o `bajas`.
Si un dato está mal, la API responde `400` con `{ error, campos: { dni: "..." } }` y la pantalla marca ese campo.

Todas menos el login piden el header `Authorization: Bearer <token>`.
Solo pueden entrar usuarios con rol **administrador** y estado **habilitado**.

### Preparar la base de datos por primera vez

Configurá `backend/.env` y el certificado de Aiven según `backend/.env.example`. Desde la carpeta
`backend/`, ejecutá `npm.cmd run db:init` en PowerShell (o `npm run db:init` en otra terminal) para crear el esquema y los datos de referencia (roles y
categorías). El comando es idempotente y no borra filas existentes.

En una instalación sin administradores, ejecutá `npm.cmd run db:admin` desde una terminal interactiva de PowerShell
(o `npm run db:admin` en otra terminal).
Solicita los datos del primer administrador y una contraseña que no se muestra al escribir; no hay
credenciales predeterminadas. Las cuentas posteriores se gestionan desde la plataforma.

Para iniciar el backend, ejecutá `npm.cmd start` en PowerShell (o `npm start` en otra terminal) desde `backend/`
y abrí `http://localhost:3000`.

### Préstamos y devoluciones (Grupo 4)

Registrar préstamos y devoluciones **no es de este módulo** (es del Grupo 4). El panel solo:

- Muestra los **últimos préstamos** en el Inicio (`GET /api/prestamos`, solo lectura).
- Deja los accesos (menú *Préstamos* y *Registrar devolución*) apuntando a páginas que todavía no existen.
- Ofrece `GET /api/usuarios/dni/:dni` para que el Grupo 4 sepa si el usuario puede llevarse libros.

### Gestión de usuarios (Grupo 5)

Pantalla `usuarios.html` (desde el inicio: **Añadir usuario** abre `usuarios.html#nuevo-usuario` y **Ver detalles** de atrasos abre `usuarios.html?filtro=morosos`):

- **Alta y modificación** con los 6 atributos obligatorios (nombre completo, DNI, curso, correo, teléfono y dirección)
  + tipo de usuario y contraseña. El curso es obligatorio para alumnos; si es nuevo, se crea solo en la tabla `cursos`.
- **Búsqueda avanzada**: nombre, DNI y curso combinados, con filtros rápidos: alumnos, docentes, administradores,
  *morosos* (con un préstamo atrasado), *suspendidos* (todos los que no pueden pedir libros) y *dados de baja*.
- **Ficha del usuario** con el **historial activo**: entregas, devoluciones, atrasos (días) y sanciones.
- **Sanciones**: *Suspender* pide un motivo y lo guarda en `sanciones` (si tiene un préstamo atrasado, queda asociada a ese pedido).
  *Habilitar* la levanta (queda en el historial con fecha de fin).
- **Baja lógica**: el usuario pasa a `estado = 'baja'` y se conserva su historial. No se puede si tiene libros sin devolver;
  sus reservas pendientes se cancelan. Se reactiva desde el filtro *Dados de baja*.

Estado que se muestra (lo calcula `usuario.models.js`):

| Estado | Cuándo |
|---|---|
| 🟢 Habilitado | Puede pedir libros |
| 🔴 Suspendido | Lo suspendió un administrador o tiene una sanción en vigor |
| 🔴 Suspendido por atraso | Automático: tiene un préstamo vencido o pasado de fecha. Se habilita solo cuando lo devuelve |
| ⚪ Dado de baja | Baja lógica |

Un administrador no puede suspenderse, darse de baja ni sacarse el rol a sí mismo. El rol y el estado se vuelven
a leer de la base en cada petición: si a un administrador lo suspenden o le sacan el rol, pierde el acceso al instante.

**Datos de prueba (opcional):** `backend/scripts/datos-prueba-grupo5.sql` carga usuarios de ejemplo (DNI 99000001 a 99000006,
clave `prueba123`) con préstamos al día, devueltos, atrasados y sanciones. Al final del archivo está cómo borrarlos.

---

## 🚀 Cómo levantarlo

> En PowerShell usá `npm.cmd` en vez de `npm` (o cambiá la terminal a **Command Prompt**).

### 1. Instalar dependencias (una sola vez, y cada vez que cambie `package.json`)
```
cd backend
npm.cmd install
```

### 2. Crear `backend/.env`
```
copy .env.example .env
```
Completá los datos de Aiven, guardá el `ca.pem` de Aiven dentro de `backend/` e inventá un texto largo para `JWT_SECRET`.

### 3. Encender el servidor (una sola terminal)
```
cd backend
npm.cmd run dev
```
Tiene que decir:
```
🚀 Servidor activo en http://localhost:3000
✅ MySQL 8.0.x conectado a la base "defaultdb"
```

### 4. Abrir el panel
**http://localhost:3000**. También funciona con **Live Server** abriendo `frontend/login.html`.

Usuario de ejemplo del SQL: DNI `30111222`, contraseña `gaby1234`.

---

## 🕒 Zona horaria

Cada conexión arranca con `SET time_zone = '-03:00'`, así `NOW()` y `CURRENT_DATE` dan la hora de Argentina
(fecha del préstamo, vencimiento y días de atraso). Se cambia con `DB_ZONA_HORARIA` en `backend/.env`.

---

## 👤 Crear otro administrador
```
npm.cmd run hash -- claveNueva123
```
```sql
INSERT INTO usuarios (dni, nombre_completo, curso_id, correo, telefono, direccion, password_hash, rol_id)
VALUES ('12345678', 'Nombre Apellido', NULL, 'mail@eest5.edu.ar', '11 0000-0000', 'Dirección', '<hash>', 3);
```

---

## 🧯 Problemas comunes

| Mensaje | Solución |
|---|---|
| `Cannot find package 'mysql2'` | Falta `npm.cmd install` dentro de `backend/`. |
| `Access denied for user` | Revisá `DB_USER` / `DB_PASSWORD` en `backend/.env`. |
| `ETIMEDOUT` / `ENOTFOUND` | Revisá `DB_HOST` / `DB_PORT` y que el servicio de Aiven esté en **Running**. |
| `self-signed certificate` / error de SSL | Revisá que `ca.pem` sea el de Aiven y esté en `backend/`. |
| `Falta JWT_SECRET` | Agregalo en `backend/.env`. |
| En la página: "No hay conexión con el servidor" | Falta la terminal con `npm.cmd run dev`. |
