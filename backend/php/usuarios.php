<?php
/* ==========================================================================
   usuarios.php - Consultas SQL de la tabla "usuarios"
   Lo llama el Model de Node (src/models/usuario.models.js) con:
     POST http://localhost:8000/usuarios.php
     { "accion": "buscarPorDni", "dni": "30111222" }
   ========================================================================== */

require_once __DIR__ . '/api.php';
require_once __DIR__ . '/conexion.php';

verificarClaveApi();


/* --- Busca un usuario por DNI junto con el nombre de su rol --- */
function buscarUsuarioPorDni(PDO $db, string $dni): ?array
{
    // Comodín "?" → el DNI se trata siempre como dato, nunca como SQL
    $sql = 'SELECT u.id, u.nombre_completo, u.password_hash, u.estado, r.nombre AS rol
            FROM usuarios u
            JOIN roles r ON r.id = u.rol_id
            WHERE u.dni = ?
            LIMIT 1';

    $consulta = $db->prepare($sql);
    $consulta->execute([$dni]);

    $usuario = $consulta->fetch();

    return $usuario ?: null;
}


/* --- Router simple por "accion" --- */
$datos  = leerCuerpoJson();
$accion = $datos['accion'] ?? '';

try {

    switch ($accion) {

        case 'buscarPorDni':
            $dni = trim((string) ($datos['dni'] ?? ''));

            if ($dni === '') {
                responder(400, ['error' => 'Falta el DNI']);
            }

            responder(200, ['payload' => buscarUsuarioPorDni(obtenerConexion(), $dni)]);
            break;

        default:
            responder(400, ['error' => "Acción no válida: $accion"]);
    }

} catch (Throwable $error) {

    error_log('usuarios.php: ' . $error->getMessage());
    responder(500, ['error' => 'Error en la base de datos: ' . $error->getMessage()]);

}
