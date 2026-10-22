import bcrypt from "bcryptjs";
import { stdin, stdout } from "process";
import { createInterface } from "readline";
import connection from "../src/database/db.js";
import { esDniValido } from "../src/middlewares/predicados.js";

const preguntarTexto = (rl, mensaje) =>
    new Promise((resolve) => rl.question(mensaje, (respuesta) => resolve(respuesta.trim())));

const preguntarSecreto = (mensaje) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
        throw new Error("Ejecutá este comando desde una terminal interactiva para ingresar la contraseña de forma segura.");
    }

    stdout.write(mensaje);
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();

    return new Promise((resolve, reject) => {
        let valor = "";

        const limpiar = () => {
            stdin.removeListener("data", alEscribir);
            stdin.setRawMode(false);
            stdin.pause();
            stdout.write("\n");
        };

        const alEscribir = (caracteres) => {
            for (const caracter of caracteres) {
                if (caracter === "\u0003") {
                    limpiar();
                    reject(new Error("Operación cancelada."));
                    return;
                }

                if (caracter === "\r" || caracter === "\n") {
                    limpiar();
                    resolve(valor);
                    return;
                }

                if (caracter === "\u007f" || caracter === "\b") {
                    if (valor.length > 0) {
                        valor = valor.slice(0, -1);
                        stdout.write("\b \b");
                    }
                    continue;
                }

                if (caracter >= " " && caracter !== "\u007f") {
                    valor += caracter;
                    stdout.write("*");
                }
            }
        };

        stdin.on("data", alEscribir);
    });
};

const validarDatos = ({ dni, nombre, correo, telefono, direccion, clave }) => {
    const dniLimpio = dni.replace(/[.\s]/g, "");
    if (!esDniValido(dniLimpio)) {
        throw new Error("El DNI debe tener entre 7 y 8 números.");
    }

    if (nombre.length < 3 || nombre.length > 120 || !/^\p{L}[\p{L} .'-]*$/u.test(nombre)) {
        throw new Error("Ingresá un nombre válido de hasta 120 caracteres.");
    }

    if (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
        throw new Error("Ingresá un correo electrónico válido de hasta 120 caracteres.");
    }

    if (telefono.length > 30 || !/^[\d\s()+-]+$/.test(telefono) || telefono.replace(/\D/g, "").length < 6) {
        throw new Error("Ingresá un teléfono válido con al menos 6 números.");
    }

    if (direccion.length < 3 || direccion.length > 150) {
        throw new Error("La dirección debe tener entre 3 y 150 caracteres.");
    }

    if (clave.length < 12 || clave.length > 72) {
        throw new Error("La contraseña debe tener entre 12 y 72 caracteres.");
    }

    return dniLimpio;
};

const rl = createInterface({ input: stdin, output: stdout });

try {
    const [roles] = await connection.query(
        "SELECT id FROM roles WHERE nombre = 'administrador' LIMIT 1"
    );
    if (!roles[0]) {
        throw new Error('No existe el rol "administrador". Ejecutá primero: npm run db:init');
    }

    const [administradores] = await connection.query(
        `SELECT u.id
         FROM usuarios u
         WHERE u.rol_id = ? AND u.estado <> 'baja'
         LIMIT 1`,
        [roles[0].id]
    );
    if (administradores[0]) {
        throw new Error("Ya existe un administrador activo; creá las cuentas siguientes desde la plataforma.");
    }

    const datos = {
        dni: await preguntarTexto(rl, "DNI: "),
        nombre: await preguntarTexto(rl, "Nombre completo: "),
        correo: (await preguntarTexto(rl, "Correo: ")).toLowerCase(),
        telefono: await preguntarTexto(rl, "Teléfono: "),
        direccion: await preguntarTexto(rl, "Dirección: ")
    };
    rl.close();

    const clave = await preguntarSecreto("Contraseña (12 a 72 caracteres): ");
    const confirmacion = await preguntarSecreto("Repetí la contraseña: ");
    if (clave !== confirmacion) {
        throw new Error("Las contraseñas no coinciden.");
    }

    const dni = validarDatos({ ...datos, clave });
    const passwordHash = await bcrypt.hash(clave, 12);

    await connection.query(
        `INSERT INTO usuarios
            (dni, nombre_completo, correo, telefono, direccion, password_hash, rol_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dni, datos.nombre, datos.correo, datos.telefono, datos.direccion, passwordHash, roles[0].id]
    );

    console.log("Administrador inicial creado. Ya podés iniciar sesión en la plataforma.");
} finally {
    rl.close();
    await connection.end();
}
