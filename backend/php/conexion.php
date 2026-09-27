<?php
/* ==========================================================================
   conexion.php - Conexión a MySQL (Aiven) con PDO
   Es la ÚNICA parte del proyecto que habla directo con la base de datos.
   ========================================================================== */

require_once __DIR__ . '/env.php';

function obtenerConexion(): PDO
{
    // Se reutiliza la misma conexión durante toda la petición
    static $conexion = null;

    if ($conexion !== null) {
        return $conexion;
    }

    if (!extension_loaded('pdo_mysql')) {
        throw new RuntimeException('PHP no tiene activada la extensión pdo_mysql (revisá php.ini).');
    }

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        env('DB_HOST', 'localhost'),
        env('DB_PORT', '3306'),
        env('DB_NAME', 'defaultdb')
    );

    $opciones = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // los errores se lanzan como excepción
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // filas como array asociativo
        PDO::ATTR_EMULATE_PREPARES   => false,                  // sentencias preparadas reales (?)
    ];

    // Aiven exige SSL
    if (env('DB_SSL', 'true') !== 'false') {

        $ca = env('DB_CA_PATH');

        if ($ca) {
            // Con el certificado CA de Aiven (ca.pem) se valida el servidor
            $rutaCa = realpath(__DIR__ . '/../' . $ca) ?: $ca;
            $opciones[PDO::MYSQL_ATTR_SSL_CA] = $rutaCa;
        } else {
            // Sin ca.pem: conexión cifrada pero sin validar el certificado
            $opciones[PDO::MYSQL_ATTR_SSL_CIPHER] = 'DEFAULT';
            $opciones[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }
    }

    $conexion = new PDO($dsn, env('DB_USER', 'root'), env('DB_PASSWORD', ''), $opciones);

    return $conexion;
}
