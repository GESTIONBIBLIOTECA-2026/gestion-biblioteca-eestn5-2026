# 📚 Sistema de Gestión de Biblioteca — E.E.S.T. N° 5 (2026)

> **Materia:** Desarrollo de Software para Plataformas Móviles (7° 5ta)  
> **Institución:** Escuela de Educación Secundaria Técnica N° 5  
> **Profesor:** Axel Castellano Gutiérrez  
> **Organización GitHub:** [GESTIONBIBLIOTECA-2026](https://github.com/GESTIONBIBLIOTECA-2026)  

---

## 🎯 Descripción del Proyecto

El **Sistema de Gestión de Biblioteca** es una aplicación móvil progresiva (PWA Full-Stack) diseñada para modernizar la gestión de préstamos, catálogo de libros, reservas y administración de usuarios en la biblioteca de la E.E.S.T. N° 5.

El desarrollo se realiza de forma colaborativa entre los **Grupos 4, 5 y 6** de la comisión del Jueves (Grupo B), integrando frontend móvil responsivo, consumo de servicios RESTful y una base de datos MySQL relacional.

---

## 👥 Estructura del Equipo y Roles

### 👑 Liderazgo y Coordinación
* **Líder General / Org Admin:** Dylan Andrada (`@DylanXeneizee12`)
* **Líder de Base de Datos & Backend:** Franco Barufaldi (`@francobaru-hub`)

---

### 📦 Módulos y Sub-Equipos

#### 🔹 Grupo 4 — Módulo de Catálogo y Búsqueda
* Latorre, Tiziano (`@tizii-star`)
* Masalis, Ivan (`@ivanchulin1`)
* Mirez, Leonel Ezequiel
* Gauto, Alex Sebastián
* Grajales, Mateo (`@nicolash19hy`)

#### 🔹 Grupo 5 — Módulo de Autenticación, Usuarios y Base de Datos
* **Barufaldi Crespo, Franco (`@francobaru-hub`)** *(Lead DB & Backend)*
* **Andrada, Dylan (`@DylanXeneizee12`)** *(Líder General)*
* Peña, Francisco (`@BautiBokita08`)
* Palacios, Marcos (`@MPSS0`)
* Gioia, Thiago

#### 🔹 Grupo 6 — Módulo de Préstamos, Devoluciones y Notificaciones
* Trujillo, Joaquín (`@joaquin67676767`)
* Pizzorno, Melian (`@melimelian`)
* Vázquez, Leandro (`@Leanvzqz`)
* Smidt, Enrique
* Garraza, Lautaro

---

## 🛠️ Tecnología y Arquitectura

* **Frontend:** HTML5, CSS3 (Mobile-First / Flexbox / Grid), JavaScript ES6+ (Asincronismo con Async/Await y Fetch API), PWA (Service Workers & Manifest).
* **Backend:** Node.js + Express (Patrón MVC).
* **Base de Datos:** MySQL Relacional (diseñada y administrada por Franco Barufaldi).
* **Control de Versiones:** Git & GitHub Flow (Pull Requests, Code Reviews y Protección de Ramas).

---

## 🗄️ Modelo de Base de Datos

La estructura y esquemas de la base de datos MySQL son coordinados por **Franco Barufaldi** (`@francobaru-hub`). Se incluye soporte para:
* Control de Usuarios (Alumnos, Docentes, Administradores).
* Registro e Inventario de Libros (ISBN, Categorías, Ejemplares).
* Transacciones de Préstamos y Devoluciones con estados de vencimiento.

---

## 🌿 Gobernanza de Git & Flujo de Trabajo

1. **Rama Principal (`main`):** Reservada para código probado e integrado.
2. **Rama de Desarrollo (`develop`):** Integración continua de los 3 módulos.
3. **Ramas de Funcionalidades (`feature/<modulo>-<nombre>`):** Cada integrante debe trabajar en su respectiva rama y enviar Pull Request para integración.

```bash
# Ejemplo de trabajo en una nueva funcionalidad
git checkout develop
git pull origin develop
git checkout -b feature/catalogo-buscador
```

---

## 🚀 Instalación y Uso Local

```bash
# 1. Clonar el repositorio
git clone https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026.git

# 2. Entrar a la carpeta del proyecto
cd gestion-biblioteca-eestn5-2026

# 3. Instalar dependencias (cuando aplique)
npm install

# 4. Iniciar el servidor en modo desarrollo
npm run dev
```

---

📌 *Proyecto Integrador 2026 — E.E.S.T. N° 5*
