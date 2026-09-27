<?php
/* ==========================================================================
   estado.php - Chequeo de salud (Health Check)
   Node lo consulta al arrancar para avisar si PHP y la base responden.
   ========================================================================== */

require_once __DIR__ . '/api.php';
require_once __DIR__ . '/conexion.php';

verificarClaveApi();

try {

    $fila = obtenerConexion()->query('SELECT DATABASE() AS base, VERSION() AS version')->fetch();

    responder(200, ['payload' => [
        'php'     => PHP_VERSION,
        'base'    => $fila['base'],
        'version' => $fila['version'],
    ]]);

} catch (Throwable $error) {

    responder(500, ['error' => 'PHP no pudo conectarse a MySQL: ' . $error->getMessage()]);

}
