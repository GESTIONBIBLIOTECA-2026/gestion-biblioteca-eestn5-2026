# 🧭 Guía de Aprendizaje y Hoja de Ruta — Francisco Peña
## De Cero a Pro en MVC: Cómo encarar el Backend del Grupo 5
**Materia:** Desarrollo de Software para Plataformas Móviles (7° 5ta - E.E.S.T. N° 5, 2026)  
**Estudiante:** Francisco Peña *(Rol: Desarrollador Backend / Fullstack)*  
**Rama individual:** `g5-pena` | **Rama integradora común:** `develop`

---

## 💡 Mensaje Inicial para Francisco

> *"Fran, es completamente normal sentirse un poco abrumado o sentir que 'falta reforzar conceptos'. La arquitectura MVC (Modelo-Vista-Controlador) y Express parecen un laberinto cuando ves 20 archivos separados. Pero en realidad siguen una sola regla lógica: **cada archivo tiene un único trabajo bien definido**.  
> Esta guía está pensada para que entiendas exactamente el porqué de cada pieza y puedas programar paso a paso, con total seguridad, lo que le falta a tu grupo."*

---

## 🧩 1. Entendiendo la Arquitectura MVC: La "Analogía del Restaurante"

Imaginate que el backend de nuestra biblioteca es la cocina de un restaurante:

```text
  📱 CELULAR / NAVEGADOR (Cliente hambriento)
         │  Hace un pedido: "Traeme las estadísticas de inicio" (GET /api/dashboard)
         ▼
  🚪 ROUTER (El Menú en la entrada)
         │  Dice: "¿Pidieron /api/dashboard? Eso se lo paso al Mozo del Dashboard."
         ▼
  👮 MIDDLEWARE (El Portero / Molinete)
         │  Verifica: "¿Tenés permiso para pedir esto? ¿Estás logueado?"
         ▼
  🧑‍🍳 CONTROLLER (El Mozo / Chef Coordinador)
         │  Recibe la orden. Le dice a la alacena: "Dame los totales de libros y préstamos".
         │  Arma el plato ({ payload: ... }) y se lo devuelve al cliente con res.json().
         ▼
  📦 MODEL (La Alacena / Depósito de Ingredientes)
         │  Es el ÚNICO que abre los cajones de MySQL con consultas SQL.
         │  Devuelve datos puros (filas, números). No sabe nada de HTTP ni de HTML.
         ▼
  🗄️ BASE DE DATOS (MySQL en Aiven Cloud)
```

### 📌 Las 3 Reglas de Oro que nunca debés olvidar:

1. **El Router solo rutea:**
   - Su único trabajo es decir: *"Si llega el método `GET` a la ruta `/`, llamá a tal función del Controller"*.
   - **Prohibido:** No se hace lógica acá, ni consultas SQL, ni cálculos.

2. **El Controller coordina y responde:**
   - Maneja el objeto de petición (`req`) y de respuesta (`res`).
   - Lee datos que vienen de la URL o del formulario (`req.params`, `req.query`, `req.body`).
   - Llama a las funciones del Model para conseguir los datos.
   - Aplica las reglas de negocio (ej: *"si el alumno está suspendido, no puede pedir libros"*).
   - Responde al cliente: `res.json(...)` o con error `res.status(400).json(...)`.
   - **Prohibido:** En el Controller **no se escribe SQL directo** (`SELECT`, `INSERT`).

3. **El Model es el dueño de la Base de Datos:**
   - Es el único lugar donde importamos `connection` desde `../database/db.js`.
   - Solo hace consultas SQL con `await connection.query(...)` y devuelve los datos limpios.
   - **Prohibido:** En el Model **nunca se usa `res.json()` ni `req`**, porque el Model no sabe qué es internet; solo sabe hablar SQL con la base de datos.

---

## 🛠️ 2. Diccionario Rápido de Supervivencia en Express

Cuando mires código de Express, vas a ver estas palabritas todo el tiempo. Acá tenés qué significan:

| Término | ¿Qué es? | Ejemplo real en nuestro proyecto |
|---|---|---|
| `req` (Petición) | Lo que envía el navegador al servidor. | `req.params.id` (el ID de la URL `/usuarios/:id`) |
| `res` (Respuesta) | Lo que el servidor le responde al navegador. | `res.json({ payload: usuarios })` |
| `next()` | Función para decirle a Express: *"este middleware ya terminó, pasá al siguiente"*. | Si el token es válido, se llama `next()` |
| `async / await` | Permite esperar a que MySQL responda en la nube sin congelar el servidor. | `const [filas] = await connection.query(...)` |
| `try / catch` | Red de seguridad. Si MySQL falla o se corta internet, `catch` lo atrapa y no se cae el servidor. | `try { ... } catch (error) { res.status(500)... }` |

---

## 🎯 3. Guía Práctica de Solución: Paso a Paso de lo que debés programar

Tu grupo tiene **2 grandes problemas de backend** que vos vas a solucionar para destrabar el proyecto.

---

### 🟢 TAREA A: Crear el Endpoint de Estadísticas `GET /api/dashboard`

Hoy, cuando abrís el panel de inicio (`index.html`), las tarjetas de *Total de Libros*, *Préstamos Activos* y *Atrasos* muestran `--` o datos fijos. Vos vas a construir la API que devuelva esos números reales desde Aiven Cloud.

#### Paso 1: Crear el Model (`backend/src/models/dashboard.models.js`)
*Pregunta mental:* **¿Qué datos necesito de la base de datos?**  
Necesitamos 3 números: total de libros cargados, préstamos activos y alumnos con atraso.

👉 **Creá el archivo `backend/src/models/dashboard.models.js`:**
```javascript
/* ==========================================================================
   dashboard.models.js - Métricas globales del sistema · Grupo 5
   ========================================================================== */
import connection from "../database/db.js";

export const getMetricasTotales = async () => {
    // Consultamos la base de datos con consultas SQL simples y rápidas
    const [libros] = await connection.query("SELECT COUNT(*) AS total FROM libros WHERE estado = 'activo'");
    const [prestamos] = await connection.query("SELECT COUNT(*) AS total FROM pedidos WHERE estado IN ('prestado', 'vencido')");
    const [morosos] = await connection.query(
        `SELECT COUNT(DISTINCT usuario_id) AS total 
         FROM pedidos 
         WHERE estado = 'vencido' OR (estado = 'prestado' AND fecha_devolucion_estimada < CURRENT_DATE)`
    );

    // Devolvemos un objeto limpio con los 3 números
    return {
        libros_total: libros[0]?.total || 0,
        prestamos_activos: prestamos[0]?.total || 0,
        alumnos_morosos: morosos[0]?.total || 0
    };
};
```
> **¿Por qué `libros[0]?.total`?**  
> Porque `connection.query()` siempre devuelve una lista de filas. Como pedimos `COUNT(*)`, la fila 0 tiene el resultado `{ total: 42 }`.

---

#### Paso 2: Crear el Controller (`backend/src/controllers/dashboard.controllers.js`)
*Pregunta mental:* **¿Cómo respondo al cliente y qué pasa si algo falla?**  
Llamamos al Model, si todo sale bien devolvemos un JSON con código 200, y si hay error devolvemos código 500 con un mensaje entendible.

👉 **Creá el archivo `backend/src/controllers/dashboard.controllers.js`:**
```javascript
/* ==========================================================================
   dashboard.controllers.js - Controlador del Dashboard · Grupo 5
   ========================================================================== */
import { getMetricasTotales } from "../models/dashboard.models.js";

export const getDashboard = async (req, res) => {
    try {
        // Le pedimos los datos crudos a nuestro modelo
        const metricas = await getMetricasTotales();

        // Respondemos con el formato estándar del proyecto: { payload: { ... } }
        return res.json({ payload: metricas });

    } catch (error) {
        console.error("Error al obtener estadísticas del dashboard:", error.message);
        return res.status(500).json({ error: "No se pudieron cargar las estadísticas." });
    }
};
```

---

#### Paso 3: Crear el Router (`backend/src/routes/dashboard.routes.js`)
*Pregunta mental:* **¿En qué dirección URL y con qué verbo HTTP atiendo este pedido?**  
Queremos atender peticiones `GET /api/dashboard`.

👉 **Creá el archivo `backend/src/routes/dashboard.routes.js`:**
```javascript
/* ==========================================================================
   dashboard.routes.js - Rutas del Dashboard (/api/dashboard) · Grupo 5
   ========================================================================== */
import express from "express";
import { getDashboard } from "../controllers/dashboard.controllers.js";
import { verificarAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// GET /api/dashboard -> solo administradores autorizados
router.get("/", verificarAdmin, getDashboard);

export default router;
```

---

#### Paso 4: Conectar la nueva ruta en el Servidor (`backend/index.js`)
Express no sabe que creaste ese archivo hasta que se lo decís a `index.js`.

👉 **En `backend/index.js`, agregá:**
```javascript
// 1. Al principio, junto a las otras rutas:
import dashboardRoutes from "./src/routes/dashboard.routes.js";

// ...
// 2. En la sección de rutas de la API (alrededor de la línea 30):
app.use("/api/dashboard", dashboardRoutes);
```

---

#### 🧪 ¿Cómo probás que funciona?
1. En tu terminal, dentro de la carpeta `backend`, ejecutá:
   ```bash
   npm run dev
   ```
2. Abrí el navegador o Thunder Client e ingresá a: `http://localhost:3000/api/dashboard` (con tu token de sesión).
3. Tenés que ver una respuesta JSON como esta:
   ```json
   {
     "payload": {
       "libros_total": 120,
       "prestamos_activos": 15,
       "alumnos_morosos": 3
     }
   }
   ```
¡Listo! Acabás de construir un circuito completo de MVC desde la base de datos hasta el cliente.

---

### 🟢 TAREA B: Desbloquear el Endpoint de Consulta para el Grupo 4

#### 📌 El Problema:
En `backend/src/routes/usuarios.routes.js`, tenés esta línea:
```javascript
router.use(verificarAdmin); // ⚠️ ¡OJO! Esto bloquea TODO lo que esté abajo
```
Cuando los chicos del Grupo 4 (que manejan los préstamos) quieren consultar si un alumno existe y está habilitado con su DNI (`GET /api/usuarios/dni/:dni`), la petición es rechazada porque ellos no tienen token de administrador.

#### 🛠️ Tu Solución:
El orden en que escribís las líneas de rutas en Express importa muchísimo: **se leen de arriba hacia abajo**.

👉 **Modificá `backend/src/routes/usuarios.routes.js`:**
Pasá la ruta de consulta de DNI **arriba** de `router.use(verificarAdmin)`:

```javascript
// 1. Rutas que necesita el Grupo 4 para validar si el alumno puede pedir libros:
router.get("/dni/:dni", validarDniParam, getUsuarioDni);

// 2. A PARTIR DE ACÁ, todo exige ser administrador de biblioteca:
router.use(verificarAdmin);

router.get("/", validarBusqueda, getUsuarios);
router.get("/:id", validarID, getUsuario);
router.get("/:id/historial", validarID, getHistorialUsuario);
router.post("/", validarUsuario, postUsuario);
router.put("/:id", validarID, validarUsuario, putUsuario);
router.patch("/:id/estado", validarID, validarEstado, patchEstado);
```
Con solo este cambio de posición, el Grupo 4 ya puede validar DNIs en el mostrador sin que les tire error 401.

---

## 🏃 4. Plan de Trabajo en Bloques de Tiempo (Tu rutina de trabajo)

Para que no te trabes, dividí tu trabajo en estos bloques de 20 minutos:

```text
[00-20 min] SETUP LOCAL:
  1. git checkout g5-pena
  2. git pull origin develop
  3. cd backend && npm run dev (verificar conexión con Aiven)

[20-40 min] MODEL Y CONTROLLER:
  1. Crear dashboard.models.js (Paso 1)
  2. Crear dashboard.controllers.js (Paso 2)

[40-60 min] ROUTER Y TESTEO:
  1. Crear dashboard.routes.js y registrarlo en index.js (Paso 3 y 4)
  2. Probar en el navegador que devuelva el JSON.

[60-80 min] DESTRABAR GRUPO 4 Y GIT:
  1. Mover la ruta de DNI en usuarios.routes.js
  2. git add .
  3. git commit -m "feat(backend): agregar api de dashboard y desbloquear consulta dni para grupo 4"
  4. git push origin g5-pena
  5. Abrir Pull Request en GitHub hacia develop.
```

---

## 🤝 ¿Quién te ayuda si tenés dudas?
* **Franco Barufaldi (Lead DB):** Si tenés dudas sobre nombres de columnas de MySQL (`pedidos`, `libros`, etc.).
* **Dylan Andrada (Líder General):** Cuando termines y hagas el `git push`, avisale para que te revise y apruebe el Pull Request hacia `develop`.
* **El Docente en clase:** Podés mostrarle esta guía abierta y consultar cualquier detalle específico del código.
