# 🚀 Guía de Inicio y Flujo de Pantallas — GRUPO 6
## Módulo: Gestión de Inventario y Catálogo de Libros

> **Integrantes:** Joaquín Trujillo, Melian Pizzorno, Leandro Vázquez, Enrique Smidt, Lautaro Garraza.  
> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Repositorio:** [gestion-biblioteca-eestn5-2026](https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026)  
> **Rama de Trabajo:** `g6` | **Ramas Individuales:** `g6-trujillo`, `g6-pizzorno`, `g6-vazquez`, `g6-smidt`, `g6-garraza`

---

## 📱 1. Flujo del Usuario en la App Móvil PWA (Experiencia en el Celular)

### 📚 Paso A: Exploración del Catálogo Móvil
1. **Navegación Principal:** Al ingresar a la aplicación, el estudiante se encuentra con la pantalla principal del **Catálogo de Libros**.
2. **Visualización de Tarjetas:** Los libros se presentan en forma de tarjetas atractivas que muestran la foto de la portada, el Título, el Autor y la Categoría (*Técnica, Ciencias, Literatura, Historia*).
3. **Indicador de Disponibilidad en Tiempo Real:** Cada tarjeta incluye un estado visual muy claro para que el alumno sepa si puede pedirlo:
   * 🟢 **Disponible:** Indica que hay ejemplares físicos guardados en la biblioteca listos para ser retirados.
   * 🔴 **Agotado / Prestado:** Indica que todos los ejemplares están actualmente en manos de otros alumnos.

### 🔍 Paso B: Búsqueda y Filtrado
1. **Buscador en Tiempo Real:** En la parte superior de la pantalla, el alumno cuenta con una barra de búsqueda. Al escribir el nombre de un libro o autor (ej. *"Física"* o *"Sears"*), la pantalla filtra automáticamente las tarjetas.
2. **Filtros por Categoría:** Puede seleccionar botones de acceso rápido para ver únicamente los libros de una materia específica.

### 📖 Paso C: Ficha Detallada del Libro
1. **Detalle del Libro:** Al presionar sobre la tarjeta de un libro, se abre una vista detallada con su resumen, editorial y ubicación en los estantes de la biblioteca.
2. **Botón de Acción:** Si el libro tiene estado 🟢 **Disponible**, se muestra de forma destacada el botón **"Reservar Libro"** (que deriva al módulo de pedidos del Grupo 4).

---

## 💻 2. Flujo en la Plataforma Web (Gestión Bibliotecaria / Escritorio)

Esta interfaz está diseñada para que la utilice el bibliotecario en la computadora de la biblioteca:

1. **Carga de Libros Nuevos:** El bibliotecario cuenta con un formulario para registrar libros que ingresan a la escuela, completando Título, Autor, Categoría, ISBN, Editorial, cantidad de ejemplares y foto de portada.
2. **Control de Inventario y Stock:** Permite modificar la cantidad de ejemplares disponibles de un libro cuando se compran nuevas unidades o cuando se registran libros desgastados.
3. **Baja de Ejemplares:** Opción para marcar libros extraviados o retirados de circulación.

---

## 🎯 Resumen: ¿Qué pantallas tiene que diseñar tu grupo?

* **En la App Móvil (PWA Celular):**
  - `index.html`: Pantalla principal del catálogo con barra de búsqueda, filtros por categoría y tarjetas con indicador 🟢/🔴 de disponibilidad.
  - `detalle-libro.html`: Vista ampliada del libro seleccionado con su resumen y botón de reserva.
* **En la Plataforma Web (Escritorio):**
  - `admin-catalogo.html`: Formulario de alta de nuevos libros e inventario general de ejemplares.

---

📌 *Guía de Flujo Funcional Grupo 6 — E.E.S.T. N° 5 (2026)*
