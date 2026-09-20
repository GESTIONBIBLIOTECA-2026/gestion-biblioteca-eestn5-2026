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

## 📂 Documentación del Proyecto (`docs/`)

Toda la documentación técnica, guías de instalación y paso a paso por grupo se encuentran organizadas en la carpeta [`docs/`](docs/):

* 🎬 **[Hilo Conductor e Integración End-to-End](docs/hilo-conductor-integrado.md):** La historia completa paso a paso que conecta el trabajo de los 3 grupos.
* 📄 **[PDF Oficial de Requerimientos](docs/requerimientos-oficiales-grupo-b.pdf):** Documento original de especificación de la biblioteca.
* 📐 **[Alcance Web vs. Móvil PWA](docs/alcance-web-vs-movil.md):** Delimitación de funciones para Escritorio (Web) y Celular (PWA).
* 🎨 **[Guía de Estilos Interactiva HTML](docs/eesT5-biblioteca-style-guide.html):** Sistema de diseño visual, paleta de colores, componentes UI, tipografía y maquetas interactivas Web Desktop & PWA Móvil.


* 🗄️ **[Guía de Base de Datos MySQL Cloud](docs/guia-base-de-datos.md):** Conexión paso a paso desde VS Code (Database Client) a Aiven.io.
* 🌐 **[Guía de Despliegue PWA en Vercel](docs/guia-despliegue-vercel-dylan.md):** Despliegue automático y dominio HTTPS para Dylan Andrada.
* 🌿 **[Guía de Flujo Git & Gobernanza](docs/guia-git-flujo-trabajo.md):** Instrucciones de ramas y Pull Requests para Devs, Líderes y Admin.

* 🚀 **Guías de Inicio a la Programación e Hilo Conductor por Sub-Equipo:**
  - 🟢 **[Guía Grupo 5 — Usuarios, DB y Admin](docs/guia-inicio-grupo-5.md)**
  - 🔵 **[Guía Grupo 6 — Inventario y Catálogo](docs/guia-inicio-grupo-6.md)**
  - 🟠 **[Guía Grupo 4 — Pedidos y Coordinación](docs/guia-inicio-grupo-4.md)**

---

## 👥 Estructura del Equipo y Módulos Funcionales


### 👑 Liderazgo y Coordinación
* **Líder General / Org Admin:** Dylan Andrada (`@DylanXeneizee12`)
* **Líder de Base de Datos & Backend:** Franco Barufaldi (`@francobaru-hub`)

---

### 📦 Módulos por Sub-Equipo

#### 🟢 Grupo 5 — Gestión de Usuarios y Panel Admin
**Integrantes y Ramas:**
* Franco Barufaldi (`g5-barufaldi`) *(Lead DB & Backend)*
* Dylan Andrada (`g5-andrada`) *(Líder General)*
* Francisco Peña (`g5-pena`)
* Marcos Palacios (`g5-palacios`)
* Thiago Gioia (`g5-gioia`)

#### 🔵 Grupo 6 — Gestión de Inventario y Catálogo
**Integrantes y Ramas:**
* Joaquín Trujillo (`g6-trujillo`)
* Melian Pizzorno (`g6-pizzorno`)
* Leandro Vázquez (`g6-vazquez`)
* Enrique Smidt (`g6-smidt`)
* Lautaro Garraza (`g6-garraza`)

#### 🟠 Grupo 4 — Gestión de Pedidos y Coordinación
**Integrantes y Ramas:**
* Tiziano Latorre (`g4-latorre`)
* Ivan Masalis (`g4-masalis`)
* Leonel Mierez (`g4-mierez`)
* Alex Gauto (`g4-gauto`)
* Mateo Grajales (`g4-grajales`)

---

## 🛠️ Tecnología y Arquitectura

* **Frontend:** HTML5, CSS3 Mobile-First, JavaScript ES6+ (Async/Await, Fetch API), PWA (Service Workers & Manifest).
* **Backend:** Node.js + Express (Patrón MVC).
* **Base de Datos:** MySQL Relacional (diseñada y administrada por Franco Barufaldi).
* **Control de Versiones:** Git & GitHub Flow (Pull Requests y Protección de Ramas).

---

## 🌿 Gobernanza de Git & Jerarquía de Ramas

Para garantizar la integridad del código, el repositorio cuenta con reglas de protección de ramas en GitHub (**Branch Protection Rules**):

```text
main  (Producción Estable) [Protegida - Solo PRs aprobados]
 └── develop  (Rama de Integración Continua) [Protegida - Solo PRs aprobados]
      │
      ├── g5  (Rama del Grupo 5 - DB/Usuarios) [Protegida - Solo PRs a Líder G5]
      │    ├── g5-barufaldi
      │    ├── g5-andrada
      │    ├── g5-pena
      │    ├── g5-palacios
      │    └── g5-gioia
      │
      ├── g6  (Rama del Grupo 6 - Inventario) [Protegida - Solo PRs a Líder G6]
      │    ├── g6-trujillo
      │    ├── g6-pizzorno
      │    ├── g6-vazquez
      │    ├── g6-smidt
      │    └── g6-garraza
      │
      └── g4  (Rama del Grupo 4 - Pedidos) [Protegida - Solo PRs a Líder G4]
           ├── g4-latorre
           ├── g4-masalis
           ├── g4-mierez
           ├── g4-gauto
           └── g4-grajales
```

### 📋 Reglas del Flujo de Trabajo
1. **Pusheo directo bloqueado:** Nadie puede pushear directamente a `main`, `develop`, `g4`, `g5` ni `g6`.
2. **Pull Requests Individuales:** Cada desarrollador trabaja en su rama individual (`gX-apellido`) y abre PR dirigida a la rama de su subgrupo (`gX`).
3. **Revisión del Líder:** El líder de subgrupo revisa la PR, aprueba el código y hace el merge en `gX`.
4. **Integración en `develop`:** Los líderes de subgrupo abren PR desde `gX` hacia `develop` para la revisión docente e integración de Sprint.

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
