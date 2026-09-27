<?php
/* ==========================================================================
   api.php - Funciones comunes de los archivos PHP
   - Responder siempre en JSON: { payload } si salió bien, { error } si no.
   - Solo el backend de Node puede consultar: se valida la clave PHP_API_KEY.
   ========================================================================== */

require_once __DIR__ . '/env.php';

header('Content-Type: application/json; charset=utf-8');


/* --- Envía la respuesta JSON y corta la ejecución --- */
function responder(int $estado, array $cuerpo): void
{
    http_response_code($estado);
    echo json_encode($cuerpo, JSON_UNESCAPED_UNICODE);
    exit;
}


/* --- "Molinete": si la clave no coincide, la petición no pasa --- */
function verificarClaveApi(): void
{
    $claveEsperada = env('PHP_API_KEY');

    if (!$claveEsperada) {
        responder(500, ['error' => 'Falta PHP_API_KEY en backend/.env']);
    }

    // Node manda la clave como hash SHA-256, así funciona aunque tenga ñ o acentos
    $hashEsperado = hash('sha256', $claveEsperada);
    $hashRecibido = strtolower($_SERVER['HTTP_X_API_KEY'] ?? '');

    if (!hash_equals($hashEsperado, $hashRecibido)) {
        responder(401, ['error' => 'La PHP_API_KEY no coincide entre Node y PHP (revisá backend/.env y reiniciá los dos servidores)']);
    }
}


/* --- Lee el cuerpo JSON enviado por Node y lo convierte en array --- */
function leerCuerpoJson(): array
{
    $datos = json_decode(file_get_contents('php://input') ?: '[]', true);
    return is_array($datos) ? $datos : [];
}
