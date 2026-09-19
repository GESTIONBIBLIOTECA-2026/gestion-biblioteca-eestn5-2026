# 🚀 Guía de Inicio y Flujo de Pantallas — GRUPO 5
## Módulo: Gestión de Usuarios, Login y Panel Administrador

> **Integrantes:** Franco Barufaldi *(Lead DB)*, Dylan Andrada *(Líder General)*, Francisco Peña, Marcos Palacios, Thiago Gioia.  
> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Repositorio:** [gestion-biblioteca-eestn5-2026](https://github.com/GESTIONBIBLIOTECA-2026/gestion-biblioteca-eestn5-2026)  
> **Rama de Trabajo:** `g5` | **Ramas Individuales:** `g5-barufaldi`, `g5-andrada`, `g5-pena`, `g5-palacios`, `g5-gioia`

---

## 📱 1. Flujo del Usuario en la App Móvil PWA (Experiencia en el Celular)

### 🔑 Paso A: Registro e Inicio de Sesión (Login)
1. **Pantalla de Bienvenida:** Cuando el alumno o docente abre la aplicación por primera vez en su celular, se encuentra con la pantalla de inicio de sesión.
2. **Ingreso:** El usuario se identifica ingresando su **DNI** y su contraseña (o se registra si es un usuario nuevo completando Nombre, DNI, Curso, Email y Teléfono).
3. **Validación:** Al presionar *"Ingresar"*, la app verifica los datos. Si son correctos, le permite acceder al sistema.

### 💳 Paso B: Credencial Digital y Perfil del Alumno
1. **Acceso al Perfil:** Una vez logueado, el alumno accede a su pantalla principal de perfil, que funciona como una **Credencial Digital de Biblioteca**.
2. **Información Visible:** En la pantalla debe ver su foto/avatar, su Nombre Completo, DNI y Curso (ej. *7mo 5ta*).
3. **Estado de Habilitación:** La credencial muestra una etiqueta clara sobre su condición actual:
   * 🟢 **Habilitado:** Puede solicitar y reservar libros en la biblioteca.
   * 🔴 **Suspendido:** No puede pedir libros temporalmente por atraso en una devolución o sanción.
4. **Mi Historial:** Debajo de su credencial, el alumno puede consultar el listado de libros que pidió en el pasado y los préstamos que tiene activos en este momento.

---

## 💻 2. Flujo en la Plataforma Web (Gestión Bibliotecaria / Escritorio)

Esta interfaz está diseñada para que la utilice el bibliotecario en la computadora de la escuela:

1. **Búsqueda de Usuarios:** El bibliotecario cuenta con un buscador donde puede ingresar el DNI o el Apellido de cualquier estudiante para ver su ficha completa.
2. **Alta y Edición:** Permite dar de alta a nuevos alumnos que ingresan a la escuela o editar sus datos de contacto (cambio de teléfono, mail o curso).
3. **Control de Sanciones:** Si un alumno devuelve un libro fuera de término o dañado, el bibliotecario puede marcar la opción *"Suspender usuario"* para que la App Móvil le impida realizar nuevas reservas hasta regularizar su situación.

---

## 🎯 Resumen: ¿Qué pantallas tiene que diseñar tu grupo?

* **En la App Móvil (PWA Celular):**
  - `login.html`: Formulario de ingreso/registro por DNI.
  - `perfil.html`: Credencial digital del alumno con datos personales, badge de estado y su historial.
* **En la Plataforma Web (Escritorio):**
  - `admin-usuarios.html`: Tabla de administración con buscador por DNI, alta de usuarios y botones para suspender/habilitar.

---

📌 *Guía de Flujo Funcional Grupo 5 — E.E.S.T. N° 5 (2026)*
