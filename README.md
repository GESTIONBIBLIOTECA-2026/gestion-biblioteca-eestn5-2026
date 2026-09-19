# 📚 Sistema de Gestión de Biblioteca — E.E.S.T. N° 5 (2026)

> **Materia:** Desarrollo de Software para Plataformas Móviles (7° 5ta)  
> **Institución:** Escuela de Educación Secundaria Técnica N° 5  
> **Profesor:** Axel Castellano Gutiérrez  
> **Organización GitHub:** [GESTIONBIBLIOTECA-2026](https://github.com/GESTIONBIBLIOTECA-2026)  

---

## 🎯 Descripción del Proyecto

El **Sistema de Gestión de Biblioteca** es una aplicación móvil progresiva (PWA Full-Stack) para modernizar la gestión de préstamos, catálogo de libros, solicitudes y administración de usuarios de la biblioteca de la E.E.S.T. N° 5.

El desarrollo se realiza de forma colaborativa entre los **Grupos 4, 5 y 6** del Jueves (Grupo B), integrando un frontend móvil responsivo, consumo de APIs RESTful MVC y una base de datos MySQL relacional.

---

## 👥 Estructura del Equipo y Módulos Funcionales

### 👑 Liderazgo y Coordinación
* **Líder General / Org Admin:** Dylan Andrada (`@DylanXeneizee12`)
* **Líder de Base de Datos & Backend:** Franco Barufaldi (`@francobaru-hub`)

---

### 📦 Módulos por Sub-Equipo

#### 🟢 Grupo 5 — Gestión de Usuarios y Panel Admin
**Integrantes:** Franco Barufaldi (Lead DB), Dylan Andrada (Líder General), Francisco Peña, Marcos Palacios, Thiago Gioia.
* **Alta, modificación y baja (CRUD)** de usuarios.
* **Búsqueda avanzada** por nombre completo, DNI y curso.
* **Gestión de atributos:** Nombre, DNI, curso, correo, teléfono y dirección.
* **Historial activo:** Registro de entregas, devoluciones y atrasos.
* **Panel Administrador** para gestión bibliotecaria.

#### 🔵 Grupo 6 — Gestión de Inventario y Catálogo
**Integrantes:** Joaquín Trujillo, Melian Pizzorno, Leandro Vázquez, Enrique Smidt, Lautaro Garraza.
* **Gestión del catálogo:** Registro, edición y baja de libros nuevos (CRUD de inventario).
* **Buscador de libros:** Filtros combinados por categoría, título, autor y disponibilidad.
* **Manejo de stock:** Actualización de cantidades de ejemplares.
* **Indicador de estado:** Disponible / Prestado.

#### 🟠 Grupo 4 — Gestión de Pedidos y Coordinación
**Integrantes:** Tiziano Latorre, Ivan Masalis, Leonel Mirez, Alex Gauto, Mateo Grajales.
* **Creación de pedidos:** Solicitud con usuario, libro, cantidad, fecha de pedido y devolución.
* **Validación de reglas de negocio:** Verificación de stock disponible (vía Grupo 6) y estado habilitado del usuario (vía Grupo 5).
* **Control del estado del pedido** e historial general.

---

## 🛠️ Tecnología y Arquitectura

* **Frontend:** HTML5, CSS3 Mobile-First, JavaScript ES6+ (Async/Await, Fetch API), PWA (Service Workers & Manifest).
* **Backend:** Node.js + Express (Patrón MVC).
* **Base de Datos:** MySQL Relacional (diseñada y administrada por Franco Barufaldi).
* **Control de Versiones:** Git & GitHub Flow (Pull Requests y Protección de Ramas).

---

## 🌿 Gobernanza de Git & Flujo de Trabajo

1. **Rama Principal (`main`):** Reservada para código probado e integrado.
2. **Rama de Desarrollo (`develop`):** Integración continua de los 3 módulos.
3. **Ramas de Funcionalidades (`feature/<modulo>-<nombre>`):** Cada integrante debe trabajar en su respectiva rama y enviar Pull Request para integración.

---

## 🚀 Instalación y Uso Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026.git

# 2. Entrar a la carpeta del proyecto
cd gestion-biblioteca-eestn5-2026

# 3. Instalar dependencias
npm install

# 4. Iniciar el servidor en modo desarrollo
npm run dev
```

---

📌 *Proyecto Integrador 2026 — E.E.S.T. N° 5*
