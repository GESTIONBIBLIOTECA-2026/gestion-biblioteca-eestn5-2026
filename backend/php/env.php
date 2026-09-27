<?php
/* ==========================================================================
   env.php - Lectura del archivo .env
   Lee backend/.env (el MISMO archivo que usa Node) para que PHP tenga
   las credenciales de la base sin escribirlas en el código.
   ========================================================================== */

function cargarEnv(string $ruta): void
{
    if (!is_file($ruta)) {
        return;
    }

    // Se quita el BOM que agregan algunos editores al principio del archivo
    $contenido = preg_replace('/^\xEF\xBB\xBF/', '', file_get_contents($ruta));

    // Mismas reglas que "dotenv" en Node, así los dos leen lo mismo
    foreach (preg_split('/\r\n|\r|\n/', $contenido) as $linea) {

        // CLAVE=valor  (se ignoran comentarios y líneas vacías)
        if (!preg_match('/^\s*(?:export\s+)?([\w.-]+)\s*=\s*(.*)$/', $linea, $partes)) {
            continue;
        }

        $clave = $partes[1];
        $valor = trim($partes[2]);

        $comilla = $valor[0] ?? '';

        if (in_array($comilla, ['"', "'", '`'], true) && ($cierre = strpos($valor, $comilla, 1)) !== false) {
            // Valor entre comillas: DB_PASSWORD="abc#123" → abc#123
            $valor = substr($valor, 1, $cierre - 1);
        } else {
            // Valor sin comillas: lo que sigue a "#" es comentario
            $valor = trim(explode('#', $valor, 2)[0]);
        }

        $_ENV[$clave] = $valor;
    }
}

/* --- Devuelve una variable del .env (o un valor por defecto) --- */
function env(string $clave, $porDefecto = null)
{
    $valor = $_ENV[$clave] ?? '';
    return $valor === '' ? $porDefecto : $valor;
}

cargarEnv(__DIR__ . '/../.env');
