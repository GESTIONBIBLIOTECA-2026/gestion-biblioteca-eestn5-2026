# 🚀 Guía de Inicio a la Programación — GRUPO 6
## Módulo: Gestión de Inventario y Catálogo de Libros

> **Integrantes:** Joaquín Trujillo, Melian Pizzorno, Leandro Vázquez, Enrique Smidt, Lautaro Garraza.  
> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Repositorio:** [gestion-biblioteca-eestn5-2026](https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026)  
> **Rama de Trabajo:** `g6` | **Ramas Individuales:** `g6-trujillo`, `g6-pizzorno`, `g6-vazquez`, `g6-smidt`, `g6-garraza`

---

## 🎬 1. El Hilo Conductor: Tu Rol en la Película del Proyecto

Tu grupo es el **exhibidor visual del catálogo y control de stock de libros**:

1. **Cuando el alumno abre la PWA en su celular:** Entra al catálogo. Tu módulo le muestra las tarjetas de los libros disponibles con su foto, autor, categoría e indicador verde **"Disponible"** o rojo **"Prestado"**.
2. **Cuando el alumno busca un libro:** Usa el buscador de tu pantalla para filtrar por título (*ej. "Física"*) o por autor.
3. **Cuando el alumno quiere reservar (Grupo 4):** El módulo de pedidos le pregunta a tu módulo: *¿Quedan ejemplares disponibles del libro ID 5?*.
4. **En la Administración Web:** El bibliotecario usa tu pantalla para cargar nuevos libros comprados o dar de baja libros extraviados.

---

## 🛠️ 2. Guía Paso a Paso para Empezar a Programar

### 📌 PASO 1: Creación de la Tabla en Base de Datos
Verifiquen que en MySQL exista la tabla `libros` (creada en equipo con el Grupo 5):

```sql
CREATE TABLE IF NOT EXISTS libros (
    id_libro INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    autor VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    isbn VARCHAR(50) UNIQUE,
    stock_total INT DEFAULT 1,
    stock_disponible INT DEFAULT 1,
    portada_url VARCHAR(255) DEFAULT 'https://via.placeholder.com/150',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 📌 PASO 2: Maquetación de Pantallas (HTML + CSS)

Creen dentro de su módulo:

#### A) `frontend/pwa/index.html` (App Móvil PWA - Buscador & Catálogo)
* Un campo de búsqueda destacado: `<input type="search" id="input-busqueda" placeholder="Buscar libro, autor o categoría...">`.
* Filtros rápidos por categoría (botones o selector: *Ciencias, Literatura, Técnica, Historia*).
* Un contenedor `<div id="contenedor-libros"></div>` donde JavaScript dibujará las tarjetas de los libros.
* **Diseño de Tarjeta Móvil:** Foto del libro, Título en negrita, Autor, y Badge: 🟢 **Disponible (Stock: 3)** o 🔴 **Prestado (Stock: 0)**.

#### B) `frontend/web/admin-catalogo.html` (Plataforma Web - Escritorio)
* Formulario de carga de nuevo libro (Título, Autor, Categoría, ISBN, Stock inicial, URL portada).
* Tabla con el listado completo de libros y botón *"Editar Stock"* o *"Dar de Baja"*.

---

### 📌 PASO 3: Lógica JavaScript y Peticiones API (`fetch`)

Creen el archivo `js/catalogo.js`:

#### Ejemplo de Petición Fetch para cargar el catálogo en la PWA:
```javascript
// Cargar y renderizar la lista de libros en el celular
async function cargarCatálogo(filtro = '') {
    try {
        const respuesta = await fetch(`http://localhost:3000/api/libros?q=${filtro}`);
        const libros = await respuesta.json();
        
        const contenedor = document.getElementById('contenedor-libros');
        contenedor.innerHTML = ''; // Limpiar previo

        libros.forEach(libro => {
            const esDisponible = libro.stock_disponible > 0;
            const card = document.createElement('div');
            card.className = 'card-libro';
            card.innerHTML = `
                <img src="${libro.portada_url}" alt="${libro.titulo}" class="img-portada">
                <div class="info-libro">
                    <h3>${libro.titulo}</h3>
                    <p class="autor">${libro.autor}</p>
                    <span class="badge ${esDisponible ? 'badge-disponible' : 'badge-prestado'}">
                        ${esDisponible ? `🟢 Disponible (${libro.stock_disponible})` : '🔴 Agotado / Prestado'}
                    </span>
                    ${esDisponible ? `<button onclick="seleccionarLibro(${libro.id_libro})" class="btn-reservar">Reservar</button>` : ''}
                </div>
            `;
            contenedor.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar libros:', error);
    }
}

// Escuchar búsquedas en tiempo real
document.getElementById('input-busqueda').addEventListener('input', (e) => {
    cargarCatálogo(e.target.value);
});
```

---

## 📡 Endpoints JSON que maneja tu módulo

| Método | Ruta API | Descripción | Respuesta JSON Ejemplo |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/libros` | Devuelve el listado de libros (admite `?q=busqueda`) | `[{"id_libro": 1, "titulo": "Física I", "autor": "Sears", "stock_disponible": 2}]` |
| **GET** | `/api/libros/:id` | Devuelve el detalle de un libro por ID | `{"id_libro": 1, "titulo": "Física I", "stock_disponible": 2}` |
| **POST** | `/api/libros` | Alta de nuevo libro (Web) | `{"mensaje": "Libro cargado con éxito", "id_libro": 10}` |

---

📌 *Guía de Inicio Grupo 6 — E.E.S.T. N° 5 (2026)*
