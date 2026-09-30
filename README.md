# 📚 Biblioteca Invaluable · Panel de Administración (Grupo 5)

Panel del bibliotecario con arquitectura **MVC**, todo en **JavaScript** (sin PHP):

- **Frontend:** HTML + CSS (carpeta `css/`) + JS con ES Modules.
- **Backend:** Node.js + Express, como en la clase 06.
- **Base de datos:** MySQL en Aiven, conectada desde Node con **`mysql2`** (pool de conexiones + SSL).

```text
[ Frontend ]  fetch()  ─►  [ Express: Router ➔ Controller ➔ Model ]  ─►  mysql2  ─►  [ MySQL Aiven ]
 localhost:3000 / Live Server        backend/ (puerto 3000)              src/database/db.js
```

---

## 📂 Estructura

```text
Andrada/
├── frontend/
│   ├── login.html, index.html, nuevo-prestamo.html
│   ├── css/                  estilo-general.css, index.css, login.css, nuevo-prestamo.css
│   └── js/
│       ├── config.js         URL del backend
│       ├── api.js            fetch al backend (login, perfil, préstamos, usuarios, libros)
│       ├── storage.js        guarda la sesión en localStorage
│       ├── fechas.js         formato de fechas ("30 sep 2026")
│       ├── login.js          lógica de login.html
│       ├── sesion.js         protege las páginas, muestra el nombre y "Salir"
│       ├── panel.js          index.html: fecha de hoy y "Últimos préstamos"
│       └── nuevo-prestamo.js nuevo-prestamo.html: autocompleta y registra el préstamo
│
└── backend/
    ├── index.js              servidor Express (cors, express.json, rutas)
    ├── package.json          "type": "module"
    ├── .env.example          plantilla (el .env real NO se sube)
    ├── ca.pem                certificado de Aiven (NO se sube)
    ├── src/
    │   ├── config/config.js                     variables del .env
    │   ├── database/db.js                       CONEXIÓN: pool de mysql2 → MySQL Aiven (SSL)
    │   ├── models/                              MODEL: consultas SQL con comodines "?"
    │   │   ├── usuario.models.js
    │   │   ├── libro.models.js
    │   │   └── prestamo.models.js               (préstamo = transacción)
    │   ├── controllers/                         CONTROLLER: arma la respuesta
    │   │   ├── auth.controllers.js, usuarios.controllers.js,
    │   │   └── libros.controllers.js, prestamos.controllers.js
    │   ├── routes/                              ROUTER: URLs de la API
    │   │   ├── auth.routes.js, usuarios.routes.js,
    │   │   └── libros.routes.js, prestamos.routes.js
    │   └── middlewares/                         token, validaciones, límite de intentos
    └── scripts/generar-hash.js
```

### Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | Body `{ "dni", "clave" }` → `{ payload: { token, usuario } }` |
| `GET` | `/api/auth/perfil` | Quién está logueado → `{ payload: { id, nombre, rol } }` |
| `GET` | `/api/prestamos?limite=5` | Últimos préstamos (en curso, atrasados y devueltos) |
| `POST` | `/api/prestamos` | Body `{ "dni", "libroId" }` → registra el préstamo |
| `GET` | `/api/usuarios/dni/:dni` | Nombre, curso y si el usuario puede llevarse libros |
| `GET` | `/api/libros/:id` | Título, autores y stock del libro |

Todas menos el login piden el header `Authorization: Bearer <token>`.
Solo pueden entrar usuarios con rol **administrador** y estado **habilitado**.

### Qué controla un préstamo nuevo

`POST /api/prestamos` hace todo en una **transacción** (o se guarda todo, o nada):

1. El usuario existe, está **habilitado**, no tiene **sanciones activas** ni **préstamos atrasados**.
2. El libro existe y tiene un ejemplar **disponible** que no esté reservado por un pedido pendiente.
3. Crea el pedido en estado `prestado` (devolución en 7 días), le asigna el ejemplar y lo marca `prestado`.
4. Deja el registro en `pedido_historial` con el administrador que lo hizo.

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
