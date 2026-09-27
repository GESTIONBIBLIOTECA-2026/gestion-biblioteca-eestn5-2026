/* ==========================================================================
   servidor-php.js - Levanta el servidor PHP de backend/php
   Uso:  npm run php
   Busca PHP en el PATH, en XAMPP (C:\xampp\php) o en PHP_PATH del .env.
   ========================================================================== */

import { spawn, spawnSync } from "child_process";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { PHP_API_URL } from "../src/config/config.js";

const carpetaPhp = fileURLToPath(new URL("../php", import.meta.url));
const direccion = new URL(PHP_API_URL).host;   // ej: "localhost:8000"

// Lugares donde puede estar PHP (en orden)
const candidatos = [
    process.env.PHP_PATH,          // ruta propia en el .env (opcional)
    "php",                         // PHP en el PATH
    "C:\\xampp\\php\\php.exe",     // XAMPP
    "C:\\php\\php.exe"             // PHP suelto
].filter(Boolean);

function phpFunciona(ruta) {
    if (ruta.includes("\\") && !existsSync(ruta)) return false;
    return spawnSync(ruta, ["-v"], { stdio: "ignore" }).status === 0;
}

const php = candidatos.find(phpFunciona);

if (!php) {
    console.error("❌ No encontré PHP en esta computadora.");
    console.error("   Instalá XAMPP (https://www.apachefriends.org) con las opciones por defecto");
    console.error("   o poné la ruta de php.exe en backend/.env →  PHP_PATH=C:\\ruta\\php.exe");
    process.exit(1);
}

// Revisar que tenga las extensiones necesarias para Aiven
const modulos = spawnSync(php, ["-m"], { encoding: "utf8" }).stdout.toLowerCase();

for (const extension of ["pdo_mysql", "openssl"]) {
    if (!modulos.includes(extension)) {
        console.warn(`⚠️  PHP no tiene activada la extensión ${extension}: activala en php.ini (extension=${extension})`);
    }
}

console.log(`🐘 Usando PHP: ${php}`);
console.log(`🐘 Capa PHP escuchando en http://${direccion}  (Ctrl + C para cortar)`);

const servidor = spawn(php, ["-S", direccion, "-t", carpetaPhp], { stdio: "inherit" });

servidor.on("exit", (codigo) => process.exit(codigo ?? 0));
