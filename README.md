# 📚 Biblioteca Invaluable · Panel de Administración (Grupo 5)

Login del panel con arquitectura **MVC**:

- **Frontend:** HTML + CSS (carpeta `css/`) + JS con ES Modules.
- **Backend:** Node.js + Express, como en la clase 06.
- **Base de datos:** la consultan archivos **PHP** con PDO, conectados a MySQL en Aiven.

```text
[ Frontend ]  fetch()  ─►  [ Express: Router ➔ Controller ➔ Model ]  ─►  [ PHP (PDO) ]  ─►  [ MySQL Aiven ]
 localhost:3000 / Live Server        backend/ (puerto 3000)              backend/php (puerto 8000)
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
│       ├── api.js            fetch al backend (login, perfil)
│       ├── storage.js        guarda la sesión en localStorage
│       ├── login.js          lógica de login.html
│       └── sesion.js         protege las páginas, muestra el nombre y "Salir"
│
└── backend/
    ├── index.js              servidor Express (cors, express.json, rutas)
    ├── package.json          "type": "module"
    ├── .env.example          plantilla (el .env real NO se sube)
    ├── src/
    │   ├── config/config.js                  variables del .env
    │   ├── database/php.js                   "conexión": le habla a PHP con fetch
    │   ├── models/usuario.models.js          MODEL: pide los datos del usuario
    │   ├── controllers/auth.controllers.js   CONTROLLER: login y perfil
    │   ├── routes/auth.routes.js             ROUTER: /api/auth/login y /api/auth/perfil
    │   └── middlewares/                      token, validaciones, límite de intentos
    ├── php/
    │   ├── conexion.php      PDO → MySQL Aiven (con SSL)
    │   ├── usuarios.php      consultas SQL de la tabla usuarios
    │   ├── estado.php        chequeo de que PHP y la base respondan
    │   ├── api.php, env.php  funciones comunes (JSON, clave, leer .env)
    └── scripts/generar-hash.js
```

### Endpoints

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/auth/login` | Body `{ "dni", "clave" }` → `{ payload: { token, usuario } }` |
| `GET` | `/api/auth/perfil` | Header `Authorization: Bearer <token>` → `{ payload: { id, nombre, rol } }` |

Solo pueden entrar usuarios con rol **administrador** y estado **habilitado**.

---

## 🚀 Cómo levantarlo

> En PowerShell usá `npm.cmd` en vez de `npm` (o cambiá la terminal a **Command Prompt**).

### 1. Instalar dependencias (una sola vez)
```
cd backend
npm.cmd install
```

### 2. Crear `backend/.env`
```
copy .env.example .env
```
Completá los datos de Aiven y guardá el `ca.pem` de Aiven dentro de `backend/`. Inventá un texto largo para `PHP_API_KEY` y otro para `JWT_SECRET`.

### 3. Terminal 1 — PHP (base de datos)
```
cd backend
npm.cmd run php
```
Deja PHP escuchando en `http://localhost:8000`.

### 4. Terminal 2 — Node (API)
```
cd backend
npm.cmd run dev
```
Tiene que decir:
```
🚀 Servidor activo en http://localhost:3000
✅ PHP 8.x conectado a la base "defaultdb"
```

### 5. Abrir el panel
**http://localhost:3000**. También funciona con **Live Server** abriendo `frontend/login.html`.

Usuario de ejemplo del SQL: DNI `30111222`, contraseña `gaby1234`.

---

## 🐘 PHP en Windows

`npm run php` busca PHP solo: primero en el PATH, después en `C:\xampp\php\php.exe` y en `C:\php\php.exe`. Si lo tenés en otro lado, agregá `PHP_PATH=C:\ruta\php.exe` en `backend/.env`.

- **Con XAMPP (recomendado):** instalalo desde https://www.apachefriends.org con las opciones por defecto. Ya trae `pdo_mysql` y `openssl` activados, y no hace falta prender Apache ni MySQL desde el panel de XAMPP.
- **PHP suelto (zip de windows.php.net):** copiá `php.ini-development` como `php.ini` y sacale el `;` a `extension_dir = "ext"`, `extension=openssl` y `extension=pdo_mysql`.

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
| `⚠️ PHP / base de datos: no responde en http://localhost:8000` | Falta la terminal con `npm.cmd run php`. |
| `PHP no tiene activada la extensión pdo_mysql` | Activá `extension=pdo_mysql` en `php.ini` (ver arriba). |
| `Access denied for user` | Revisá `DB_USER` / `DB_PASSWORD` en `backend/.env`. |
| `Faltan JWT_SECRET o PHP_API_KEY` | Agregalas en `backend/.env`. |
| En la página: "No hay conexión con el servidor" | Falta la terminal con `npm.cmd run dev`. |
