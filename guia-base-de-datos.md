# 🗄️ Guía de Inicio de Base de Datos MySQL Cloud — Franco Barufaldi y Grupo 5

> **Proyecto:** Sistema de Gestión de Biblioteca (E.E.S.T. N° 5 - 2026)  
> **Responsable:** Franco Barufaldi (`@francobaru-hub`) — Lead DB & Backend  
> **Plataforma Nube:** [Aiven.io](https://aiven.io)  

---

## 🎯 Objetivo
Crear una instancia limpia y gratuita de **MySQL 8.0 en la Nube** en [Aiven.io](https://aiven.io) para centralizar la base de datos del proyecto, permitiendo la conexión tanto desde la **Plataforma Web (PHP)** como desde la **App Móvil PWA (Node.js)** y herramientas de administración como **HeidiSQL**.

---

## 📋 Paso a Paso para Crear la Base de Datos Limpia

### Paso 1: Registrarse en Aiven
1. Ingresar a la web oficial: **[https://aiven.io](https://aiven.io)**.
2. Hacer clic en **"Try for free"** o ingresar a la consola: **[https://console.aiven.io](https://console.aiven.io)**.
3. Registrarse con una cuenta de correo o cuenta de GitHub.

### Paso 2: Crear el Servicio de MySQL Limpio
1. En el panel principal, hacer clic en **"Create service"** (o **"Choose your service"**).
2. Seleccionar el motor de base de datos: **`MySQL`**.
3. En la selección de plan, asegurar que esté seleccionado el plan **`Free`** ($0 / Free forever).
4. En **Service name**, asignar un nombre descriptivo: `mysql-biblioteca-eest5`.
5. Hacer clic en el botón blanco **"Create service"**.
6. **Esperar 1 o 2 minutos** a que el estado cambie de azul (**`Building`**) a verde (**`Running`**).

---

## 🔑 Obtener las Credenciales de Conexión

Una vez que el servicio esté en estado **`Running`**, en la pantalla **Overview / Connection Information** encontrarás los siguientes datos:

| Campo | Valor / Ejemplo | Descripción |
| :--- | :--- | :--- |
| **Host (Servidor)** | `mysql-biblioteca-eest5-....aivencloud.com` | Dirección URL del servidor en la nube |
| **Port (Puerto)** | `27892` (o el puerto asignado) | Puerto de conexión MySQL |
| **User (Usuario)** | `avnadmin` | Usuario administrador |
| **Password (Contraseña)** | *(Hacer clic en `CLICK_TO_REVEAL_PASSWORD`)* | Clave de acceso |
| **Database Name** | `defaultdb` (o crear `biblioteca_db`) | Nombre de la base de datos limpia |

---

## 🛠️ Cómo Conectarse para Comenzar a Trabajar

### Conexión desde HeidiSQL (en las PCs de la Escuela / Casa):
1. Abrir **HeidiSQL**.
2. Crear una **Nueva Conexión**:
   * **Tipo de red:** `MySQL (TCP/IP)`
   * **Hostname / IP:** *(Copiar el Host de Aiven)*
   * **Usuario:** `avnadmin`
   * **Contraseña:** *(Copiar la contraseña de Aiven)*
   * **Puerto:** *(Copiar el puerto de Aiven, ej. 27892)*
3. En la pestaña **SSLs** (si lo requiere): Marcar habilitar SSL.
4. Hacer clic en **Abrir**.

---

## 📌 Próximo Paso
Una vez abierta la conexión en HeidiSQL con la base de datos limpia, el equipo de Barufaldi estará listo para comenzar a diseñar y ejecutar las sentencias `CREATE TABLE` de las entidades del proyecto.

---

📌 *Guía de Base de Datos Nube — E.E.S.T. N° 5 (2026)*
